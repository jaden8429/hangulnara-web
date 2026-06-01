const CACHE_NAME = 'hangulnara-v3';
const STATIC_ASSETS = [
  './',
  './index.html',
  './css/style.css',
  './js/app.js',
  './js/content.js',
  './js/canvas.js',
  './js/strokes.js',
  './js/storage.js',
  './js/matching.js',
  './js/audio_map.js',
  './manifest.json',
];

self.addEventListener('install', e => {
  e.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll(STATIC_ASSETS);
    // 오디오는 백그라운드로 프리캐시 (실패해도 install은 성공)
    try {
      const mapResp = await fetch('./js/audio_map.js');
      const mapText = await mapResp.text();
      const matches = mapText.match(/'(audio\/[^']+\.mp3)'/g) || [];
      const audioUrls = matches.map(m => './' + m.slice(1, -1));
      // 작은 배치로 캐시 (네트워크 부담 줄임)
      for (let i = 0; i < audioUrls.length; i += 20) {
        const batch = audioUrls.slice(i, i + 20);
        await Promise.allSettled(batch.map(u => cache.add(u)));
      }
    } catch (err) { /* 오디오 프리캐시 실패해도 앱은 동작 */ }
  })());
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// 캐시 우선, 실패 시 네트워크 → 런타임 캐시 저장
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith((async () => {
    const cached = await caches.match(e.request);
    if (cached) return cached;
    try {
      const resp = await fetch(e.request);
      if (resp.ok && new URL(e.request.url).origin === self.location.origin) {
        const cache = await caches.open(CACHE_NAME);
        cache.put(e.request, resp.clone());
      }
      return resp;
    } catch (err) {
      return cached || new Response('Offline', { status: 503 });
    }
  })());
});
