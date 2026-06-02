// 한글나라 PWA 메인 앱 로직

// === Service Worker 등록 ===
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').catch(function(){});
}

// === TTS (프리레코딩 오디오 + Web Speech API 폴백) ===
var tts = null;
var currentAudio = null;
function initTTS() {
  if ('speechSynthesis' in window) tts = window.speechSynthesis;
}
function stopAudio() {
  if (currentAudio) { currentAudio.pause(); currentAudio.currentTime = 0; currentAudio = null; }
  if (tts) tts.cancel();
}
function playAudio(text, fallbackRate, fallbackPitch) {
  var d = loadData();
  if (!d.settings.tts) return;
  stopAudio();
  var src = (typeof AUDIO_MAP !== 'undefined') ? AUDIO_MAP[text] : null;
  if (src) {
    currentAudio = new Audio(src);
    currentAudio.play().catch(function() { fallbackTTS(text, fallbackRate, fallbackPitch); });
  } else {
    fallbackTTS(text, fallbackRate, fallbackPitch);
  }
}
function fallbackTTS(text, rate, pitch) {
  if (!tts) return;
  tts.cancel();
  var u = new SpeechSynthesisUtterance(text);
  u.lang = 'ko-KR'; u.rate = rate; u.pitch = pitch; u.volume = 1.0;
  tts.speak(u);
}
function speak(text) { playAudio(text, 0.9, 1.35); }
function speakDarami(text) { playAudio(text, 0.85, 1.6); }
initTTS();

// === 아이 이름 로드 ===
(function() {
  var d = loadData();
  if (d.settings && d.settings.childName) {
    USER_NAME = d.settings.childName;
  }
})();

// === 화면 전환 ===
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(function(s) { s.classList.remove('active'); });
  document.getElementById(id).classList.add('active');
  // 화면 전환 시 잔존 토스트 즉시 숨김 (scope 버그 방지)
  var t = document.getElementById('_toast');
  if (t) {
    t.style.opacity = '0';
    if (t._timer) clearTimeout(t._timer);
  }
  // 학습 화면 진입 시 세션 한도 체크 (홈/보호자/스플래시는 예외)
  if (['learning','matchingPlay','composePlay','readingPlay','reading','compose','matching','review','chapters','lessons'].indexOf(id) >= 0) {
    _checkSessionLimit();
  }
}

// 세션 시작 시각 + dailyLimit (분) 시행
var _sessionStartAt = Date.now();
function _checkSessionLimit() {
  var d = loadData();
  var limit = (d.settings && d.settings.dailyLimit) || 30;
  var elapsedMin = (Date.now() - _sessionStartAt) / 60000;
  if (elapsedMin >= limit && !window._sessionWarned) {
    window._sessionWarned = true;
    var msg = '오늘 ' + limit + '분 공부했어! 다람이가 잠깐 쉬자고 했어~ 🐿️';
    speakDarami('오늘 많이 공부했어! 잠깐 쉬자~');
    showToast(msg, 4000);
  }
}
function _resetSession() {
  _sessionStartAt = Date.now();
  window._sessionWarned = false;
}

// === 토스트 피드백 ===
function showToast(msg, duration) {
  duration = duration || 1500;
  var t = document.getElementById('_toast');
  if (!t) {
    t = document.createElement('div');
    t.id = '_toast';
    t.style.cssText = 'position:fixed;bottom:80px;left:50%;transform:translateX(-50%);background:rgba(74,55,40,0.85);color:#fff;padding:14px 32px;border-radius:24px;font-size:20px;font-weight:bold;z-index:200;pointer-events:none;transition:opacity 0.3s;';
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.style.opacity = '1';
  clearTimeout(t._timer);
  t._timer = setTimeout(function() { t.style.opacity = '0'; }, duration);
}

// === 공용 헬퍼 (matching/compose/reading에서 공유) ===
function shuffleArr(arr) { return arr.slice().sort(function() { return Math.random() - 0.5; }); }
function topBarHtml(backFn, title, rightHtml) {
  return '<div class="top-bar">' +
    '<button class="back-btn" onclick="' + backFn + '">←</button>' +
    '<span class="title">' + title + '</span>' +
    (rightHtml || '') +
    '</div>';
}

// === 홈 렌더 공통 (스플래시/goHome 공유) ===
function renderHome(speakDelay) {
  showScreen('home');
  document.getElementById('homeStars').textContent = getTotalStars();
  var greeting = getHomeGreeting();
  var bubble = document.getElementById('homeBubble');
  if (bubble) bubble.textContent = greeting;
  if (speakDelay > 0) setTimeout(function() { speakDarami(greeting); }, speakDelay);
  else speakDarami(greeting);
  // 어댑티브 추천 배너 (오늘 뭘 할지 결정 부담 ↓)
  _renderRecommendation();
}

// 어댑티브 추천 — 복습 우선, 다음 미완료 챕터, 신규 학습 순
function _renderRecommendation() {
  var host = document.getElementById('homeRecommend');
  if (!host) return;
  var due = getReviewItems();
  if (due.length >= 3) {
    host.innerHTML = '🐿️ 다람이 추천: 복습 ' + due.length + '개가 기다려요! <button class="btn yellow recommend-go" id="recGo">🔄 복습하기</button>';
    var btn = document.getElementById('recGo');
    if (btn) btn.onclick = goReview;
    return;
  }
  // 다음 미완료 챕터 찾기
  for (var i = 0; i < CHAPTERS.length; i++) {
    if (isChapterUnlocked(i) && getChapterCompletion(CHAPTERS[i].id) < 1) {
      var ch = CHAPTERS[i];
      host.innerHTML = '🐿️ 오늘은 "' + ch.title + '" 단계 이어가볼까? <button class="btn blue recommend-go" id="recGo">📝 학습하기</button>';
      var bt = document.getElementById('recGo');
      if (bt) bt.onclick = function(){ goLessons(ch.id); };
      return;
    }
  }
  host.innerHTML = '🐿️ 모든 단계 완료! 새 친구를 만나보자~ <button class="btn green recommend-go" id="recGo">🪄 글자 만들기</button>';
  var b2 = document.getElementById('recGo');
  if (b2) b2.onclick = goCompose;
}

// === 스플래시 → 홈 ===
setTimeout(function() { renderHome(300); }, 2000);

// 다람이 캐릭터 인사말 (귀여운 말투)
function getHomeGreeting() {
  var n = USER_NAME;
  var msgs = [
    n+'아 안녕~! 다람이랑 오늘도 재밌게 공부하쟈!',
    '앗! '+n+'(이)다~! 다람이가 엄청 기다렸어!',
    n+'아~! 오늘은 뭘 배워볼까? 두근두근!',
    '우와앙~ '+n+'아 왔구나! 다람이 너무 반가워!',
    n+'아~ 같이 한글 쓰러 가자! 슝~!',
    '야호~! '+n+'아 안녕! 오늘도 파이팅이다!',
    n+'아~ 다람이가 도토리 가져왔어! 같이 공부하쟈~!',
  ];
  return msgs[Math.random() * msgs.length | 0];
}

function goHome() { renderHome(0); }

// === 챕터 선택 ===
function goChapters() {
  var list = document.getElementById('chapterList');
  list.innerHTML = '';
  CHAPTERS.forEach(function(ch, i) {
    var unlocked = isChapterUnlocked(i);
    var comp = getChapterCompletion(ch.id);
    var card = document.createElement('div');
    card.className = 'chapter-card' + (unlocked ? '' : ' locked');
    // 잠금 카드: 흐릿한 미리보기 이모지 + 어떤 단계 마치면 열리는지 안내
    var lockHint = '';
    if (!unlocked && i > 0) {
      var prev = CHAPTERS[i - 1];
      lockHint = '<div class="lock-hint">' + prev.title + ' 끝내면 열려요!</div>';
    }
    card.innerHTML =
      '<div class="emoji" style="opacity:' + (unlocked ? 1 : 0.35) + '">' + ch.emoji + '</div>' +
      (unlocked ? '' : '<div class="lock-overlay">🔒</div>') +
      '<div class="name">' + ch.title + '</div>' +
      (unlocked && comp > 0 ? '<div style="width:80%;height:8px;background:#E8E0D8;border-radius:4px;overflow:hidden"><div style="width:' + (comp * 100) + '%;height:100%;background:#A8E6CF;border-radius:4px"></div></div>' : '') +
      lockHint;
    if (unlocked) card.onclick = function() { goLessons(ch.id); };
    else card.onclick = function() {
      // 잠긴 카드 클릭 시 다람이가 안내
      var hint = (i > 0 ? CHAPTERS[i-1].title + ' 단계를 먼저 끝내야 해~!' : '아직 잠겨 있어!');
      speakDarami(hint);
      showToast(hint, 1800);
    };
    list.appendChild(card);
  });
  // 테마학습 카드 — 챕터 학습과 같은 맥락에 놓음 (홈 메뉴 인지 부담 ↓)
  var themeCard = document.createElement('div');
  themeCard.className = 'chapter-card chapter-theme';
  themeCard.innerHTML =
    '<div class="emoji">🎨</div>' +
    '<div class="name">테마학습</div>' +
    '<div class="lock-hint">동물·음식·자연…</div>';
  themeCard.onclick = function() { goThemes(); };
  list.appendChild(themeCard);
  showScreen('chapters');
}

// === 레슨 선택 ===
var currentChapterId = null;
function goLessons(chapterId) {
  currentChapterId = chapterId;
  var chapter = CHAPTERS.find(function(c) { return c.id === chapterId; });
  document.getElementById('lessonTitle').textContent = chapter.title;
  var list = document.getElementById('lessonList');
  list.innerHTML = '';
  chapter.lessons.forEach(function(lid, i) {
    var lesson = LESSONS[lid];
    var unlocked = isLessonUnlocked(chapterId, i);
    var passed = getPassedCount(lid);
    var done = passed >= lesson.threshold;
    var card = document.createElement('div');
    card.className = 'lesson-card' + (!unlocked ? ' locked' : done ? ' done' : '');
    card.innerHTML =
      (!unlocked ? '🔒' : done ? '✅' : '') +
      '<div>' + lesson.title + '</div>' +
      (unlocked ? '<div class="status">' + passed + '/' + lesson.items.length + '</div>' : '');
    if (unlocked) card.onclick = function() { startLesson(lid); };
    list.appendChild(card);
  });
  showScreen('lessons');
}

// === 학습 루프 상태 ===
var currentLesson = null;
var currentItems = [];
var currentItemIndex = 0;
var currentStage = 'LISTEN';
var traceRetry = 0;
var freeRetry = 0;
var writingCanvas = null;
var lessonStickerAwarded = false;
var isEvaluating = false;

function startLesson(lessonId) {
  currentLesson = LESSONS[lessonId];
  currentLesson._id = lessonId;
  currentItems = currentLesson.items;
  currentItemIndex = 0;
  lessonStickerAwarded = isLessonStickerAwarded(lessonId);
  showLearningItem();
}

function showLearningItem() {
  // 이전 단계의 캔버스/애니메이터 정리
  if (writingCanvas) { writingCanvas.destroy(); writingCanvas = null; }
  if (currentAnimator) { currentAnimator.stop(); currentAnimator = null; }
  currentStage = 'LISTEN';
  traceRetry = 0;
  freeRetry = 0;
  isEvaluating = false;
  renderStage();
}

function renderStage() {
  var item = currentItems[currentItemIndex];
  var total = currentItems.length;
  var num = currentItemIndex + 1;

  document.getElementById('learnTitle').textContent = num + ' / ' + total;
  document.getElementById('learnProgress').style.width = ((num / total) * 100) + '%';

  var stageName = { LISTEN:'듣기', GUIDED:'보기', TRACE:'따라쓰기', FREE:'혼자쓰기', PRAISE:'칭찬' };
  document.getElementById('learnStage').textContent = stageName[currentStage];

  var el = document.getElementById('learnContent');

  switch (currentStage) {
    case 'LISTEN': renderListen(el, item); break;
    case 'GUIDED': renderGuided(el, item); break;
    case 'TRACE': renderTrace(el, item); break;
    case 'FREE': renderFree(el, item); break;
    case 'PRAISE': renderPraise(el); break;
  }
  showScreen('learning');
}

function speakItem() {
  var item = currentItems[currentItemIndex];
  if (item) speak(item.tts);
}

var LISTEN_MSGS = [
  '이건 뭘까~? 다람이가 알려줄게!',
  '잘 들어봐~! 따라해 보쟈!',
  '귀 쫑긋! 소리를 들어보쟈~!',
  '우와~ 이 글자를 배워볼까?',
  '짜잔~! 새로운 글자다!',
];

// === LISTEN 단계: 소리 듣기 (큰 글자 + 마스코트) ===
function renderListen(el, item) {
  var mascotMsg = LISTEN_MSGS[Math.random() * LISTEN_MSGS.length | 0];
  el.innerHTML =
    '<div class="learn-row">' +
      '<div class="learn-left">' +
        '<div class="mascot mascot-wave" style="font-size:min(56px,8vw)">🐿️</div>' +
        '<div class="speech-bubble">' + mascotMsg + '</div>' +
      '</div>' +
      '<div class="learn-right">' +
        (item.emoji ? '<div style="font-size:min(80px,10vw);animation:float 2s ease-in-out infinite">' + item.emoji + '</div>' : '') +
        '<div class="char-display large float-anim" style="background:#CBE7F5">' + item.char + '</div>' +
        '<div class="learn-name">' + item.name + (item.emoji ? ' ' + item.emoji : '') + '</div>' +
        (item.phon ? '<div class="learn-phon">소릿값: [' + item.phon + ']</div>' : '') +
        (item.word ? '<div class="learn-word">' + item.char + ' → ' + item.word + '</div>' : '') +
        '<div class="learn-actions">' +
          '<button class="btn icon lg yellow" id="speakBtn">🔊</button>' +
          '<button class="btn green" id="listenNextBtn">다음 →</button>' +
        '</div>' +
      '</div>' +
    '</div>';
  document.getElementById('speakBtn').onclick = speakItem;
  document.getElementById('listenNextBtn').onclick = function() { currentStage = 'GUIDED'; renderStage(); };
  // 다람이 멘트 → 이름 → 음가 순서 (음가는 자음만)
  speakDarami(mascotMsg);
  setTimeout(function() { speak(item.tts); }, 2000);
  if (item.phon) {
    setTimeout(function() { speakDarami('소릿값은 ' + item.phon + '!'); }, 3500);
  }
}

// === GUIDED 단계: 획순 애니메이션 ===
var currentAnimator = null;

function renderGuided(el, item) {
  var charData = STROKE_DATA[item.char];

  if (charData) {
    // 획순 데이터가 있으면 애니메이션 캔버스 표시
    var c = createCanvasHtml();
    el.innerHTML =
      '<div class="canvas-layout">' +
        '<div class="canvas-title">획순을 잘 보세요! 🐿️</div>' +
        '<div class="canvas-subtitle" id="strokeInfo"></div>' +
        c.html +
        '<div class="learn-actions">' +
          '<button class="btn orange" id="replayBtn">🔄 다시 보기</button>' +
          '<button class="btn blue" id="guidedNextBtn">따라쓰기 →</button>' +
        '</div>' +
      '</div>';

    var cvs = document.getElementById('writingCanvas');
    var infoEl = document.getElementById('strokeInfo');
    var totalStrokes = charData.strokes.length;
    infoEl.textContent = '"' + item.name + '" — ' + totalStrokes + '획';

    currentAnimator = new StrokeAnimator(cvs, charData, {
      speed: 0.02,
      lineWidth: Math.max(4, Math.round(cvs.width / 80)),
      onComplete: function() {
        infoEl.textContent = '✅ 획순 완료! 따라쓰기 해보자!';
      },
    });
    currentAnimator.start();

    document.getElementById('replayBtn').onclick = function() {
      if (currentAnimator) {
        currentAnimator.stop();
        currentAnimator.start();
      }
    };
  } else {
    // 획순 데이터 없으면 기존 정적 표시
    el.innerHTML =
      '<div class="learn-row">' +
        '<div class="learn-right" style="gap:16px">' +
          '<div class="canvas-title">이렇게 생겼어요!</div>' +
          '<div class="char-display large" style="background:rgba(142,202,230,0.2)">' + item.char + '</div>' +
          '<div class="learn-name">"' + item.name + '"</div>' +
          '<button class="btn blue" id="guidedNextBtn">따라쓰기 →</button>' +
        '</div>' +
      '</div>';
  }

  document.getElementById('guidedNextBtn').onclick = function() {
    if (currentAnimator) { currentAnimator.stop(); currentAnimator = null; }
    currentStage = 'TRACE';
    renderStage();
  };
}

// === 캔버스 생성 유틸 (뷰포트 비례 — 2x 크게) ===
function createCanvasHtml() {
  var availH = window.innerHeight - 160;
  var availW = window.innerWidth - 48;
  var canvasSize = Math.min(Math.max(400, availH), availW, 800);
  canvasSize = Math.round(canvasSize);
  return {
    size: canvasSize,
    html: '<div class="canvas-wrap" id="canvasWrap">' +
            '<canvas id="writingCanvas" width="' + canvasSize + '" height="' + canvasSize + '" ' +
            'style="width:' + canvasSize + 'px;height:' + canvasSize + 'px"></canvas>' +
            '<div class="auto-eval-indicator" id="autoIndicator"></div>' +
          '</div>'
  };
}

function showAutoIndicator(show) {
  var ind = document.getElementById('autoIndicator');
  if (ind) ind.className = 'auto-eval-indicator' + (show ? ' active' : '');
}

// 캔버스 단계(Trace/Free) 공통: 손그림 이모지 힌트 블록
function emojiHintHtml(item) {
  return item.emoji ? '<div class="canvas-emoji-hint"><div class="canvas-emoji-pic">' + item.emoji + '</div><div class="canvas-emoji-label">' + item.name + '</div></div>' : '';
}

// 캔버스 단계 공통: 콜백 안에서 캔버스가 살아있고 파괴되지 않았는지 확인
function canvasAlive() {
  return writingCanvas && !writingCanvas._destroyed;
}

// === TRACE 단계: 따라쓰기 (가이드 보이는 상태에서 작성 → 자동 평가) ===
function renderTrace(el, item) {
  // 이전 캔버스 반드시 파기 (타이머/리스너 정리)
  if (writingCanvas) { writingCanvas.destroy(); writingCanvas = null; }
  var c = createCanvasHtml();

  el.innerHTML =
    '<div class="canvas-with-hint">' +
      emojiHintHtml(item) +
      '<div class="canvas-layout">' +
        '<div class="canvas-title" id="traceMsg">따라 써보자!' + (traceRetry > 0 ? ' (' + traceRetry + '번째 다시)' : '') + '</div>' +
        c.html +
        '<div class="canvas-tools">' +
          '<button class="btn icon pink" id="traceClearBtn">🗑️</button>' +
          '<button class="btn icon orange" id="traceUndoBtn">↩️</button>' +
        '</div>' +
      '</div>' +
    '</div>';

  isEvaluating = false;
  writingCanvas = new WritingCanvas(document.getElementById('writingCanvas'), {
    guideText: item.char,
    guideAlpha: 0.35,
    penWidth: 8,
    autoDelay: 1200,
    onAutoEvaluate: function() { autoEvalTrace(); },
    onStrokeEnd: function() { showAutoIndicator(true); },
  });

  document.getElementById('traceClearBtn').onclick = function() { writingCanvas.clear(); showAutoIndicator(false); };
  document.getElementById('traceUndoBtn').onclick = function() { writingCanvas.undo(); if (!writingCanvas.hasStrokes()) showAutoIndicator(false); };
}

function autoEvalTrace() {
  if (isEvaluating) return;
  if (!writingCanvas || !writingCanvas.hasStrokes()) return;
  isEvaluating = true;
  showAutoIndicator(false);

  var item = currentItems[currentItemIndex];
  var result = writingCanvas.evaluate(item.char, item.type);

  if (result.correct) {
    writingCanvas.flashCorrect(function() {
      if (!canvasAlive()) return;
      isEvaluating = false;
      showToast('잘했어! 이제 혼자 써보자!', 1000);
      setTimeout(function() {
        if (!canvasAlive()) return;
        currentStage = 'FREE';
        renderStage();
      }, 300);
    });
  } else {
    traceRetry++;
    if (traceRetry >= 3) {
      writingCanvas.flashWrong(function() {
        if (!canvasAlive()) return;
        isEvaluating = false;
        showToast('괜찮아! 혼자 써보자!', 1000);
        setTimeout(function() {
          if (!canvasAlive()) return;
          currentStage = 'FREE';
          renderStage();
        }, 300);
      });
    } else {
      writingCanvas.flashWrong(function() {
        if (!canvasAlive()) return;
        isEvaluating = false;
        var msg = document.getElementById('traceMsg');
        if (msg) msg.textContent = '다시 써보자! (' + traceRetry + '번째 다시)';
      });
      showToast('다시 써보자!', 1000);
    }
  }
}

// === FREE 단계: 혼자쓰기 (가이드 없이 → 자동 평가) ===
function renderFree(el, item) {
  // 이전 캔버스 반드시 파기 (타이머/리스너 정리)
  if (writingCanvas) { writingCanvas.destroy(); writingCanvas = null; }
  var c = createCanvasHtml();

  el.innerHTML =
    '<div class="canvas-with-hint">' +
      emojiHintHtml(item) +
      '<div class="canvas-layout">' +
        '<div class="canvas-title" id="freeMsg">혼자 써보자! "' + item.name + '"</div>' +
        (freeRetry > 0 ? '<div class="canvas-subtitle">다시 도전! (' + freeRetry + '번째)</div>' : '') +
        c.html +
        '<div class="canvas-tools">' +
          '<button class="btn icon pink" id="freeClearBtn">🗑️</button>' +
          '<button class="btn icon orange" id="freeUndoBtn">↩️</button>' +
          '<button class="btn icon yellow" id="hintBtn">💡</button>' +
        '</div>' +
      '</div>' +
    '</div>';

  isEvaluating = false;
  writingCanvas = new WritingCanvas(document.getElementById('writingCanvas'), {
    penWidth: 8,
    autoDelay: 1200,
    onAutoEvaluate: function() { autoEvalFree(); },
    onStrokeEnd: function() { showAutoIndicator(true); },
  });

  document.getElementById('freeClearBtn').onclick = function() { writingCanvas.clear(); showAutoIndicator(false); };
  document.getElementById('freeUndoBtn').onclick = function() { writingCanvas.undo(); if (!writingCanvas.hasStrokes()) showAutoIndicator(false); };
  document.getElementById('hintBtn').onclick = showHint;
}

function showHint() {
  if (!writingCanvas) return;
  var item = currentItems[currentItemIndex];
  writingCanvas.setGuide(item.char, 0.12);
  document.getElementById('hintBtn').style.display = 'none';
}

var lastResult = null;
function autoEvalFree() {
  if (isEvaluating) return;
  if (!writingCanvas || !writingCanvas.hasStrokes()) return;
  isEvaluating = true;
  showAutoIndicator(false);

  var item = currentItems[currentItemIndex];
  var result = writingCanvas.evaluate(item.char, item.type);

  if (result.correct) {
    recordResult(item.id, true, result.stars);
    lastResult = result;
    writingCanvas.flashCorrect(function() {
      if (!canvasAlive()) return;
      isEvaluating = false;
      currentStage = 'PRAISE';
      renderStage();
    });
  } else {
    recordResult(item.id, false, 0);
    freeRetry++;
    if (freeRetry >= 3) {
      lastResult = { correct: false, stars: 0 };
      writingCanvas.flashWrong(function() {
        if (!canvasAlive()) return;
        isEvaluating = false;
        currentStage = 'PRAISE';
        renderStage();
      });
    } else {
      writingCanvas.flashWrong(function() {
        if (!canvasAlive()) return;
        isEvaluating = false;
        var msg = document.getElementById('freeMsg');
        if (msg) msg.textContent = '다시 도전! "' + item.name + '" (' + freeRetry + '번째)';
      });
      // 구체적 오답 힌트 (canvas.js evaluate가 reason/hint 제공)
      var hint = result.hint || '다시 써보자!';
      showToast(hint, 1800);
      speakDarami(hint);
    }
  }
}

// === PRAISE 단계: 칭찬 + 효과 ===
function renderPraise(el) {
  var stars = lastResult ? lastResult.stars : 0;
  var text = stars > 0 ? getPraise(stars) : getFailMsg();
  var starHtml = '';
  for (var i = 0; i < 3; i++) {
    starHtml += '<span class="star" style="opacity:' + (i < stars ? 1 : 0.2) + '">' + (i < stars ? '⭐' : '☆') + '</span>';
  }

  var mascotEmoji = stars >= 3 ? '🥳' : stars >= 1 ? '😊' : '🤗';
  var mascotClass = stars >= 2 ? 'mascot-happy' : 'mascot-wave';

  // 0별 시: 칭찬 대신 "다시 보기"로 GUIDED 자동 재진입 옵션 제공 (사고형 학습)
  var actionButtons = stars === 0
    ? '<div class="learn-actions" style="margin-top:24px">' +
        '<button class="btn orange" id="praiseReviewBtn">🐿️ 다시 보기</button>' +
        '<button class="btn green" id="praiseNextBtn">다음 →</button>' +
      '</div>'
    : '<button class="btn green big" id="praiseNextBtn" style="margin-top:24px">다음 →</button>';

  el.innerHTML =
    '<div class="praise-screen">' +
      '<div class="mascot ' + mascotClass + '" style="font-size:88px;animation-delay:0.1s">' + mascotEmoji + '</div>' +
      '<div class="stars">' + starHtml + '</div>' +
      '<div class="praise-text">' + text + '</div>' +
      (stars >= 3 ? '<div class="praise-sub">🐿️ 다람이가 너무 기뻐서 춤출 것 같아~!</div>' : stars === 0 ? '<div class="praise-sub">🐿️ 천천히 다시 보쟈~ 같이 할 수 있어!</div>' : '') +
      actionButtons +
    '</div>';
  document.getElementById('praiseNextBtn').onclick = nextItem;
  var reviewBtn = document.getElementById('praiseReviewBtn');
  if (reviewBtn) {
    reviewBtn.onclick = function() {
      // 현재 글자를 GUIDED로 다시 보기 (획순 애니메이션 재학습)
      currentStage = 'GUIDED';
      traceRetry = 0;
      freeRetry = 0;
      renderStage();
    };
  }

  if (stars >= 3) { showConfetti(); showStarBurst(); }
  else if (stars >= 2) { showStarBurst(); }
  // 다람이 목소리로 칭찬/격려!
  speakDarami(text);

  if (!lessonStickerAwarded) {
    var passed = getPassedCount(currentLesson._id);
    if (passed >= currentLesson.threshold) {
      awardSticker(currentLesson._id);
      lessonStickerAwarded = true;
    }
  }
}

function nextItem() {
  currentItemIndex++;
  if (currentItemIndex >= currentItems.length) {
    if (currentChapterId) goLessons(currentChapterId);
    else goHome();
  } else {
    showLearningItem();
  }
}

function exitLearning() {
  if (currentAnimator) { currentAnimator.stop(); currentAnimator = null; }
  if (writingCanvas) writingCanvas.destroy();
  writingCanvas = null;
  if (currentChapterId) goLessons(currentChapterId);
  else goHome();
}

// === 컨페티 (3별) ===
function showConfetti() {
  var colors = ['#8ECAE6','#FFD166','#FFADAD','#A8E6CF','#FFBE76','#D4A5FF'];
  var container = document.createElement('div');
  container.className = 'confetti';
  for (var i = 0; i < 50; i++) {
    var piece = document.createElement('div');
    piece.className = 'confetti-piece';
    piece.style.left = Math.random() * 100 + '%';
    piece.style.background = colors[Math.random() * colors.length | 0];
    piece.style.animationDelay = Math.random() * 0.8 + 's';
    piece.style.animationDuration = (1.5 + Math.random()) + 's';
    container.appendChild(piece);
  }
  document.body.appendChild(container);
  setTimeout(function() { container.remove(); }, 3000);
}

// === 별 터짐 효과 (2별+) ===
function showStarBurst() {
  var container = document.createElement('div');
  container.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:99;';
  var emojis = ['⭐','✨','🌟','💫'];
  for (var i = 0; i < 12; i++) {
    var s = document.createElement('div');
    var angle = (i / 12) * Math.PI * 2;
    var dist = 120 + Math.random() * 80;
    var dx = Math.cos(angle) * dist;
    var dy = Math.sin(angle) * dist;
    s.textContent = emojis[Math.random() * emojis.length | 0];
    s.style.cssText = 'position:absolute;left:50%;top:50%;font-size:' + (20 + Math.random() * 16) + 'px;transform:translate(-50%,-50%);transition:all 0.8s cubic-bezier(0.25,0.46,0.45,0.94);opacity:1;';
    container.appendChild(s);
    (function(el, x, y) {
      requestAnimationFrame(function() {
        el.style.transform = 'translate(calc(-50% + ' + x + 'px), calc(-50% + ' + y + 'px)) scale(0.3)';
        el.style.opacity = '0';
      });
    })(s, dx, dy);
  }
  document.body.appendChild(container);
  setTimeout(function() { container.remove(); }, 1200);
}

// === 복습 ===
function goReview() {
  document.getElementById('reviewTitle').textContent = '복습하기';
  // 간격 반복 + 실패 항목 결합 (중복 제거)
  var dueReview = getReviewItems(); // {item, lessonId, due, priority}
  var failed = getFailedItems();
  var seen = {};
  var items = [];
  dueReview.forEach(function(r) { if (!seen[r.item.id]) { seen[r.item.id] = true; items.push({ item: r.item, due: r.due }); } });
  failed.forEach(function(it) { if (!seen[it.id]) { seen[it.id] = true; items.push({ item: it, due: -1 }); } });

  var el = document.getElementById('reviewContent');
  if (items.length === 0) {
    el.innerHTML = '<div class="empty-state"><div class="emoji">🎉</div><div class="msg">복습할 내용이 없어요!</div><div style="color:#7A6B5D">참 잘하고 있어요!</div></div>';
  } else {
    el.innerHTML = '<div style="font-size:20px;margin-bottom:16px">🐿️ 다람이가 다시 보자고 한 글자들이야~</div><div class="scroll-row" id="reviewCards"></div>';
    var row = document.getElementById('reviewCards');
    items.forEach(function(entry) {
      var it = entry.item;
      var card = document.createElement('div');
      card.className = 'chapter-card';
      var bg = entry.due < 0 ? 'rgba(255,170,170,0.35)' : 'rgba(255,190,118,0.3)';
      card.style.cssText = 'width:120px;height:140px;background:' + bg;
      var badge = entry.due < 0 ? '<div style="font-size:12px;color:#E53E3E;margin-top:2px">다시 도전!</div>' : '<div style="font-size:12px;color:#7A6B5D;margin-top:2px">복습 시간~</div>';
      card.innerHTML = '<div style="font-size:48px">' + it.char + '</div><div style="font-size:16px">' + it.name + '</div>' + badge;
      card.onclick = function() { startReviewItem(it); };
      row.appendChild(card);
    });
  }
  showScreen('review');
}

function startReviewItem(item) {
  currentLesson = { _id: '_review', items: [item], threshold: 1 };
  currentItems = [item];
  currentItemIndex = 0;
  currentChapterId = null;
  lessonStickerAwarded = true;
  showLearningItem();
}

// === 테마별 학습 ===
function goThemes() {
  document.getElementById('reviewTitle').textContent = '🎨 테마학습';
  var el = document.getElementById('reviewContent');
  var html = '<div style="font-size:22px;font-weight:bold;margin-bottom:16px">🎨 테마별 글자 연습</div>';
  html += '<div style="display:flex;flex-wrap:wrap;gap:16px;justify-content:center">';
  var colors = ['#CBE7F5','#FFE8A3','#FFD6D6','#D4F3E7','#E8D5FF','#FFDDB0'];
  var idx = 0;
  Object.keys(WORD_THEMES).forEach(function(key) {
    var theme = WORD_THEMES[key];
    var titleParts = theme.title.split(' ');
    var emoji = titleParts[0];
    var label = titleParts.slice(1).join(' ');
    html += '<div class="theme-card" style="background:' + colors[idx % colors.length] + '" onclick="startTheme(\'' + key + '\')">';
    html += '<div class="theme-emoji">' + emoji + '</div>';
    html += '<div class="theme-title">' + label + '</div>';
    html += '</div>';
    idx++;
  });
  html += '</div>';
  el.innerHTML = html;
  showScreen('review');
}

function startTheme(themeKey) {
  var theme = WORD_THEMES[themeKey];
  currentLesson = { _id: '_theme_' + themeKey, items: theme.words, threshold: theme.words.length };
  currentItems = theme.words;
  currentItemIndex = 0;
  currentChapterId = null;
  lessonStickerAwarded = true;
  showLearningItem();
}

// === 스티커북 ===
function goReward() {
  document.getElementById('rewardStars').textContent = getTotalStars();
  var grid = document.getElementById('stickerGrid');
  var earned = getTotalStickers();
  var html = '';
  for (var i = 0; i < STICKERS.length; i++) {
    html += '<div class="sticker ' + (i < earned ? 'earned' : 'locked') + '">' + (i < earned ? STICKERS[i] : '?') + '</div>';
  }
  grid.innerHTML = html;
  showScreen('reward');
}

// === 보호자 게이트 ===
var gateA = 0, gateB = 0;
function goParentGate() {
  gateA = 5 + Math.floor(Math.random() * 10);
  gateB = 5 + Math.floor(Math.random() * 10);
  document.getElementById('gateProblem').textContent = gateA + ' + ' + gateB + ' = ?';
  document.getElementById('gateAnswer').value = '';
  document.getElementById('gateError').style.display = 'none';
  showScreen('parentGate');
}

function checkGate() {
  var answer = parseInt(document.getElementById('gateAnswer').value);
  if (answer === gateA + gateB) {
    showParentDashboard();
  } else {
    document.getElementById('gateError').style.display = 'block';
    document.getElementById('gateAnswer').value = '';
  }
}

// === 보호자 대시보드 (섹션별 렌더러로 분할) ===
function showParentDashboard() {
  var el = document.getElementById('parentContent');
  var profileCount = getProfiles().length;
  // 셸 HTML: 섹션별 컨테이너만 미리 만들어 두고 각 renderer가 채움
  el.innerHTML =
    '<h2 style="margin-bottom:8px">👨‍👩‍👧 프로필 (' + profileCount + '명)</h2>' +
    '<div id="profileArea"></div>' +
    '<h2 style="margin:24px 0 16px">📊 학습 요약</h2>' +
    '<div id="summaryArea"></div>' +
    '<h2 style="margin:24px 0 16px">⚠ 어려워하는 글자 TOP 3</h2>' +
    '<div id="hardArea"></div>' +
    '<h2 style="margin:24px 0 16px">📚 챕터별 진도</h2>' +
    '<div id="chapterProgressArea"></div>' +
    '<h2 style="margin:24px 0 16px">⚙ 설정</h2><div id="settingsArea"></div>' +
    '<h2 style="margin:24px 0 16px;color:#E57373">🗑 초기화</h2><div id="resetArea"></div>';

  _renderProfileChips(document.getElementById('profileArea'));
  _renderSummary(document.getElementById('summaryArea'));
  _renderHardItems(document.getElementById('hardArea'));
  _renderChapterProgress(document.getElementById('chapterProgressArea'));
  _renderSettings(document.getElementById('settingsArea'));
  _renderResetAll(document.getElementById('resetArea'));

  showScreen('parent');
}

function _renderProfileChips(host) {
  var profiles = getProfiles();
  var activeId = getActiveProfileId();
  var html = '<div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">';
  profiles.forEach(function(p) {
    var isActive = p.id === activeId;
    html += '<button class="profile-chip ' + (isActive ? 'active' : '') + '" data-pid="' + p.id + '">' +
      (isActive ? '✓ ' : '') + p.name + '</button>';
  });
  html += '<button class="profile-chip add" id="profileAddBtn">+ 새 프로필</button></div>';
  host.innerHTML = html;

  host.querySelectorAll('.profile-chip[data-pid]').forEach(function(btn) {
    btn.onclick = function() {
      var pid = btn.dataset.pid;
      if (pid === getActiveProfileId()) return;
      setActiveProfile(pid);
      var p = getProfiles().find(function(x) { return x.id === pid; });
      var data = loadData();
      USER_NAME = (data.settings && data.settings.childName) || (p && p.name) || '친구';
      showToast(USER_NAME + '으로 전환했어요!', 1500);
      showParentDashboard();
    };
  });
  var addBtn = host.querySelector('#profileAddBtn');
  if (addBtn) addBtn.onclick = function() {
    var name = prompt('새 프로필 이름을 입력하세요', '');
    if (!name) return;
    var newId = addProfile(name.trim());
    setActiveProfile(newId);
    var data = loadData();
    data.settings.childName = name.trim();
    saveData(data);
    USER_NAME = name.trim();
    showParentDashboard();
  };
}

function _renderSummary(host) {
  var dueCount = getReviewItems().length;
  host.innerHTML =
    '<div style="display:flex;gap:24px;font-size:18px;flex-wrap:wrap;margin-bottom:16px">' +
      '<div>⭐ 총 별: ' + getTotalStars() + '개</div>' +
      '<div>🎨 스티커: ' + getTotalStickers() + '개</div>' +
      '<div>🔄 복습 대기: ' + dueCount + '개</div>' +
    '</div>';
}

function _renderHardItems(host) {
  var hardItems = getHardItems(3);
  if (hardItems.length === 0) {
    host.innerHTML = '<div style="color:#7A6B5D">아직 틀린 글자가 없어요!</div>';
    return;
  }
  var html = '<div style="display:flex;gap:12px;flex-wrap:wrap">';
  hardItems.forEach(function(h) {
    var status = h.passed ? '✓ 통과 (틀린 적 ' + h.fail + '회)' : '⚠ 미통과 (' + h.fail + '회 실패)';
    html += '<div style="background:#FFF0E0;padding:12px 16px;border-radius:12px;min-width:120px">' +
      '<div style="font-size:36px;font-weight:bold">' + h.item.char + '</div>' +
      '<div style="font-size:13px;color:#7A6B5D">' + h.item.name + '</div>' +
      '<div style="font-size:12px;color:#E57373;margin-top:4px">' + status + '</div>' +
    '</div>';
  });
  html += '</div>';
  var firstChar = hardItems[0].item.char;
  html += '<div style="margin-top:12px;background:#E8F5E9;padding:12px 16px;border-radius:12px;font-size:14px;color:#2E7D32">' +
    '💡 오프라인 활동 추천: 냉장고 자석으로 "' + firstChar + '" 만들어보기 / "' + firstChar + '"으로 시작하는 단어 5개 함께 말해보기' +
  '</div>';
  host.innerHTML = html;
}

function _renderChapterProgress(host) {
  CHAPTERS.forEach(function(ch) {
    var comp = getChapterCompletion(ch.id);
    var row = document.createElement('div');
    row.className = 'progress-item';
    row.innerHTML =
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">' +
        '<span>' + ch.emoji + ' ' + ch.title + '</span>' +
        '<div style="display:flex;align-items:center;gap:8px">' +
          '<span>' + (comp * 100).toFixed(0) + '%</span>' +
          '<button class="reset-chapter-btn" style="font-size:12px;padding:4px 10px;border:1px solid #E57373;border-radius:8px;background:transparent;color:#E57373;cursor:pointer">초기화</button>' +
        '</div>' +
      '</div>' +
      '<div class="bar"><div class="fill" style="width:' + (comp * 100) + '%"></div></div>';
    row.querySelector('.reset-chapter-btn').onclick = (function(chId, chTitle) {
      return function() {
        if (confirm(chTitle + ' 챕터의 모든 진도를 초기화할까요?')) {
          resetChapter(chId);
          showParentDashboard();
          showToast(chTitle + ' 초기화 완료', 1500);
        }
      };
    })(ch.id, ch.title);
    host.appendChild(row);
  });
}

function _renderSettings(host) {
  var d = loadData();

  // 이름 입력
  var nameRow = document.createElement('div');
  nameRow.className = 'setting-row';
  nameRow.innerHTML = '<label>아이 이름</label>';
  var nameInput = document.createElement('input');
  nameInput.type = 'text';
  nameInput.className = 'name-input';
  nameInput.value = USER_NAME;
  nameInput.placeholder = '이름 입력';
  nameInput.style.cssText = 'font-size:18px;width:140px;padding:8px 12px;border:2px solid #8ECAE6;border-radius:12px;outline:none;';
  nameInput.onchange = function() {
    USER_NAME = nameInput.value.trim() || '친구';
    var data = loadData();
    data.settings.childName = USER_NAME;
    saveData(data);
    showToast(USER_NAME + ' (으)로 설정했어요!', 1500);
  };
  nameRow.appendChild(nameInput);
  host.appendChild(nameRow);

  // 토글 (TTS / 효과음)
  _appendToggle(host, 'TTS 음성 안내', 'tts', d.settings.tts);
  _appendToggle(host, '효과음', 'sound', d.settings.sound);
}

function _appendToggle(host, label, key, value) {
  var row = document.createElement('div');
  row.className = 'setting-row';
  row.innerHTML = '<label>' + label + '</label>';
  var btn = document.createElement('button');
  btn.className = 'toggle ' + (value ? 'on' : 'off');
  btn.onclick = function() {
    var data = loadData();
    data.settings[key] = !data.settings[key];
    saveData(data);
    btn.className = 'toggle ' + (data.settings[key] ? 'on' : 'off');
  };
  row.appendChild(btn);
  host.appendChild(row);
}

function _renderResetAll(host) {
  var btn = document.createElement('button');
  btn.className = 'btn pink';
  btn.style.cssText = 'font-size:16px;min-height:48px;min-width:auto;padding:12px 24px;';
  btn.textContent = '🗑️ 모든 학습 데이터 초기화';
  btn.onclick = function() {
    if (confirm('정말 모든 학습 데이터를 초기화할까요?\n별, 스티커, 진도가 모두 삭제됩니다.')) {
      resetAll();
      showParentDashboard();
      showToast('전체 초기화 완료', 1500);
    }
  };
  host.appendChild(btn);
}
