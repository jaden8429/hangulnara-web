// localStorage 기반 진도/보상 관리 — 멀티 프로필 지원
const LEGACY_KEY = 'hangulnara';
const PROFILES_KEY = 'hangulnara.profiles';
const ACTIVE_KEY = 'hangulnara.active';

function getProfiles() {
  try {
    var raw = localStorage.getItem(PROFILES_KEY);
    if (raw) return JSON.parse(raw);
  } catch(e) {}
  return [{ id: 'p1', name: '서연' }];
}

function saveProfiles(profiles) {
  try { localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles)); }
  catch(e) {}
}

function getActiveProfileId() {
  try {
    var id = localStorage.getItem(ACTIVE_KEY);
    if (id) return id;
  } catch(e) {}
  return 'p1';
}

function setActiveProfile(id) {
  try { localStorage.setItem(ACTIVE_KEY, id); }
  catch(e) {}
  _memoryStore = null; // 캐시 무효화 → 다음 loadData에서 새 프로필 로드
}

function addProfile(name) {
  var profiles = getProfiles();
  var id = 'p' + Date.now();
  profiles.push({ id: id, name: name || '아이' });
  saveProfiles(profiles);
  return id;
}

function deleteProfile(id) {
  var profiles = getProfiles();
  if (profiles.length <= 1) return false; // 최소 1개 보장
  profiles = profiles.filter(function(p) { return p.id !== id; });
  saveProfiles(profiles);
  try { localStorage.removeItem('hangulnara.data.' + id); } catch(e) {}
  if (getActiveProfileId() === id) setActiveProfile(profiles[0].id);
  return true;
}

function getStorageKey() {
  return 'hangulnara.data.' + getActiveProfileId();
}

// 레거시 데이터 1회 마이그레이션
function _migrateLegacy() {
  try {
    var legacy = localStorage.getItem(LEGACY_KEY);
    if (!legacy) return;
    var profiles = getProfiles();
    var firstKey = 'hangulnara.data.' + profiles[0].id;
    if (!localStorage.getItem(firstKey)) {
      localStorage.setItem(firstKey, legacy);
    }
    localStorage.removeItem(LEGACY_KEY);
  } catch(e) {}
}
_migrateLegacy();

// 메모리 폴백 (localStorage 실패 시 세션 동안 데이터 유지)
var _memoryStore = null;

function loadData() {
  try {
    var raw = localStorage.getItem(getStorageKey());
    if (raw) return JSON.parse(raw);
  } catch(e) { /* fall through */ }
  if (_memoryStore) return _memoryStore;
  return defaultData();
}

function saveData(data) {
  _memoryStore = data;
  try {
    localStorage.setItem(getStorageKey(), JSON.stringify(data));
  } catch(e) {
    console.warn('localStorage save failed, using memory only:', e.name);
  }
}

function defaultData() {
  return {
    progress: {},
    stars: 0,
    stickers: 0,
    awardedStickers: {},  // lessonId → true (중복 방지)
    settings: { dailyLimit: 30, sound: true, tts: true }
  };
}

function getProgress(itemId) {
  var d = loadData();
  return d.progress[itemId] || { success: 0, fail: 0, passed: false, bestStars: 0 };
}

function recordResult(itemId, isCorrect, stars) {
  var d = loadData();
  var p = d.progress[itemId] || { success: 0, fail: 0, passed: false, bestStars: 0, lastPassedAt: 0, reviewLevel: 0 };
  if (isCorrect) {
    var prevStars = p.bestStars;
    p.success++;
    p.passed = true;
    p.lastPassedAt = Date.now();
    // 간격 반복 레벨업: 정답 시 다음 복습 간격 늘림 (Leitner 박스)
    p.reviewLevel = Math.min(5, (p.reviewLevel || 0) + 1);
    if (stars > prevStars) {
      d.stars += (stars - prevStars);
      p.bestStars = stars;
    }
  } else {
    p.fail++;
    // 오답 시 복습 레벨 하향 (망각 가속)
    p.reviewLevel = Math.max(0, (p.reviewLevel || 0) - 1);
  }
  d.progress[itemId] = p;
  saveData(d);
  return p;
}

// 간격 반복 — Leitner 박스 (레벨별 복습 주기 시간)
var REVIEW_INTERVALS_MS = [
  0,                        // 레벨 0: 즉시
  10 * 60 * 1000,           // 레벨 1: 10분
  24 * 60 * 60 * 1000,      // 레벨 2: 1일
  3 * 24 * 60 * 60 * 1000,  // 레벨 3: 3일
  7 * 24 * 60 * 60 * 1000,  // 레벨 4: 7일
  14 * 24 * 60 * 60 * 1000, // 레벨 5: 14일
];

// 복습 대상 글자 모으기 (간격이 지난 통과 항목 + 미통과 실패 항목)
function getReviewItems() {
  var d = loadData();
  var now = Date.now();
  var items = [];
  Object.keys(LESSONS).forEach(function(lid) {
    LESSONS[lid].items.forEach(function(it) {
      var p = d.progress[it.id];
      if (!p) return;
      if (!p.passed && p.fail > 0) {
        // 미통과 + 실패 이력 → 즉시 복습
        items.push({ item: it, lessonId: lid, due: -1, priority: 100 });
        return;
      }
      if (p.passed) {
        var interval = REVIEW_INTERVALS_MS[Math.min(p.reviewLevel || 1, REVIEW_INTERVALS_MS.length - 1)];
        var nextReviewAt = (p.lastPassedAt || 0) + interval;
        if (now >= nextReviewAt) {
          // 만기 경과 시간이 클수록 우선순위 높음
          var overdue = now - nextReviewAt;
          items.push({ item: it, lessonId: lid, due: nextReviewAt, priority: Math.min(90, overdue / (60*60*1000)) });
        }
      }
    });
  });
  items.sort(function(a, b) { return b.priority - a.priority; });
  return items;
}

// 자주 틀린 글자 TOP N (보호자 대시보드용)
function getHardItems(topN) {
  var d = loadData();
  var arr = [];
  Object.keys(LESSONS).forEach(function(lid) {
    LESSONS[lid].items.forEach(function(it) {
      var p = d.progress[it.id];
      if (p && p.fail > 0) arr.push({ item: it, fail: p.fail, passed: p.passed });
    });
  });
  arr.sort(function(a, b) { return b.fail - a.fail; });
  return arr.slice(0, topN || 3);
}

function awardSticker(lessonId) {
  var d = loadData();
  // 이미 이 레슨에서 스티커를 받았으면 무시
  if (!d.awardedStickers) d.awardedStickers = {};
  if (d.awardedStickers[lessonId]) return;
  d.stickers++;
  d.awardedStickers[lessonId] = true;
  saveData(d);
}

function isLessonStickerAwarded(lessonId) {
  var d = loadData();
  return !!(d.awardedStickers && d.awardedStickers[lessonId]);
}

function getTotalStars() { return loadData().stars; }
function getTotalStickers() { return loadData().stickers; }

function getPassedCount(lessonId) {
  var lesson = LESSONS[lessonId];
  if (!lesson) return 0;
  var d = loadData();
  return lesson.items.filter(function(it) {
    var p = d.progress[it.id];
    return p && p.passed;
  }).length;
}

function isLessonUnlocked(chapterId, lessonIndex) {
  var chapter = CHAPTERS.find(function(c) { return c.id === chapterId; });
  if (!chapter) return false;
  if (lessonIndex === 0) return true;
  var prevLessonId = chapter.lessons[lessonIndex - 1];
  var prevLesson = LESSONS[prevLessonId];
  return getPassedCount(prevLessonId) >= prevLesson.threshold;
}

function isChapterUnlocked(chapterIndex) {
  if (chapterIndex === 0) return true;
  var prev = CHAPTERS[chapterIndex - 1];
  return prev.lessons.every(function(lid) {
    var lesson = LESSONS[lid];
    return getPassedCount(lid) >= lesson.threshold;
  });
}

function getChapterCompletion(chapterId) {
  var chapter = CHAPTERS.find(function(c) { return c.id === chapterId; });
  if (!chapter) return 0;
  var total = 0, passed = 0;
  chapter.lessons.forEach(function(lid) {
    var lesson = LESSONS[lid];
    total += lesson.items.length;
    passed += getPassedCount(lid);
  });
  return total > 0 ? passed / total : 0;
}

// === 초기화 기능 ===
function resetAll() {
  saveData(defaultData());
}

function resetChapter(chapterId) {
  var chapter = CHAPTERS.find(function(c) { return c.id === chapterId; });
  if (!chapter) return;
  var d = loadData();
  chapter.lessons.forEach(function(lid) {
    var lesson = LESSONS[lid];
    if (!lesson) return;
    // 해당 레슨의 아이템 진도 삭제
    lesson.items.forEach(function(it) {
      if (d.progress[it.id]) {
        d.stars -= (d.progress[it.id].bestStars || 0);
        delete d.progress[it.id];
      }
    });
    // 스티커 회수
    if (d.awardedStickers && d.awardedStickers[lid]) {
      d.stickers = Math.max(0, d.stickers - 1);
      delete d.awardedStickers[lid];
    }
  });
  d.stars = Math.max(0, d.stars);
  saveData(d);
}

function resetLesson(lessonId) {
  var lesson = LESSONS[lessonId];
  if (!lesson) return;
  var d = loadData();
  lesson.items.forEach(function(it) {
    if (d.progress[it.id]) {
      d.stars -= (d.progress[it.id].bestStars || 0);
      delete d.progress[it.id];
    }
  });
  if (d.awardedStickers && d.awardedStickers[lessonId]) {
    d.stickers = Math.max(0, d.stickers - 1);
    delete d.awardedStickers[lessonId];
  }
  d.stars = Math.max(0, d.stars);
  saveData(d);
}

function getFailedItems() {
  var d = loadData();
  var items = [];
  Object.keys(d.progress).forEach(function(id) {
    var p = d.progress[id];
    if (p.fail > 0 && !p.passed) {
      for (var lid of Object.keys(LESSONS)) {
        var item = LESSONS[lid].items.find(function(it) { return it.id === id; });
        if (item) { items.push(item); break; }
      }
    }
  });
  return items;
}
