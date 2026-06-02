// === 자모 합성 챕터: 글자 만들기 (사고형 학습 핵심) ===
// 자음(+모음+받침) → 음절 합성 원리 직관적 교수

// 한글 유니코드 합성 공식:
// 음절 = 0xAC00 + (초성 idx * 588) + (중성 idx * 28) + (종성 idx)
// 종성 idx: 0 = 받침 없음, 1=ㄱ, 4=ㄴ, 8=ㄹ, 16=ㅁ, ...
var CHOSEONG = ['ㄱ','ㄲ','ㄴ','ㄷ','ㄸ','ㄹ','ㅁ','ㅂ','ㅃ','ㅅ','ㅆ','ㅇ','ㅈ','ㅉ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ'];
var JUNGSEONG = ['ㅏ','ㅐ','ㅑ','ㅒ','ㅓ','ㅔ','ㅕ','ㅖ','ㅗ','ㅘ','ㅙ','ㅚ','ㅛ','ㅜ','ㅝ','ㅞ','ㅟ','ㅠ','ㅡ','ㅢ','ㅣ'];
var JONGSEONG = ['','ㄱ','ㄲ','ㄳ','ㄴ','ㄵ','ㄶ','ㄷ','ㄹ','ㄺ','ㄻ','ㄼ','ㄽ','ㄾ','ㄿ','ㅀ','ㅁ','ㅂ','ㅄ','ㅅ','ㅆ','ㅇ','ㅈ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ'];

function composeSyllable(cho, jung, bat) {
  var ci = CHOSEONG.indexOf(cho);
  var ji = JUNGSEONG.indexOf(jung);
  if (ci < 0 || ji < 0) return null;
  var bi = bat ? JONGSEONG.indexOf(bat) : 0;
  if (bi < 0) bi = 0;
  return String.fromCharCode(0xAC00 + ci * 588 + ji * 28 + bi);
}

// 합성 학습 콘텐츠 — 자음+모음(+받침) → 음절 예시
// b 필드가 있으면 받침 합성 학습
var COMPOSE_LESSONS = [
  { id: 'comp_aa', title: '아 줄 만들기', emoji: '아', items: [
    { c: 'ㄱ', v: 'ㅏ' }, { c: 'ㄴ', v: 'ㅏ' }, { c: 'ㄷ', v: 'ㅏ' },
    { c: 'ㄹ', v: 'ㅏ' }, { c: 'ㅁ', v: 'ㅏ' }, { c: 'ㅂ', v: 'ㅏ' },
  ]},
  { id: 'comp_oo', title: '오 줄 만들기', emoji: '오', items: [
    { c: 'ㄱ', v: 'ㅗ' }, { c: 'ㄴ', v: 'ㅗ' }, { c: 'ㄷ', v: 'ㅗ' },
    { c: 'ㅁ', v: 'ㅗ' }, { c: 'ㅂ', v: 'ㅗ' }, { c: 'ㅅ', v: 'ㅗ' },
  ]},
  { id: 'comp_ii', title: '이 줄 만들기', emoji: '이', items: [
    { c: 'ㄱ', v: 'ㅣ' }, { c: 'ㄴ', v: 'ㅣ' }, { c: 'ㄷ', v: 'ㅣ' },
    { c: 'ㅁ', v: 'ㅣ' }, { c: 'ㅍ', v: 'ㅣ' }, { c: 'ㅎ', v: 'ㅣ' },
  ]},
  // 받침 합성 — 종성 추가로 음절이 어떻게 바뀌는지 시각화
  { id: 'comp_bat_n', title: '받침 ㄴ 만들기', emoji: '산', items: [
    { c: 'ㅅ', v: 'ㅏ', b: 'ㄴ' }, // 산
    { c: 'ㅁ', v: 'ㅜ', b: 'ㄴ' }, // 문
    { c: 'ㄴ', v: 'ㅜ', b: 'ㄴ' }, // 눈
    { c: 'ㅅ', v: 'ㅗ', b: 'ㄴ' }, // 손
  ]},
  { id: 'comp_bat_m', title: '받침 ㅁ 만들기', emoji: '곰', items: [
    { c: 'ㄱ', v: 'ㅗ', b: 'ㅁ' }, // 곰
    { c: 'ㄱ', v: 'ㅏ', b: 'ㅁ' }, // 감
    { c: 'ㅂ', v: 'ㅏ', b: 'ㅁ' }, // 밤
    { c: 'ㅋ', v: 'ㅜ', b: 'ㅁ' }, // 쿰 (꿈에 가까운 예시)
  ]},
  { id: 'comp_bat_l', title: '받침 ㄹ 만들기', emoji: '달', items: [
    { c: 'ㄷ', v: 'ㅏ', b: 'ㄹ' }, // 달
    { c: 'ㅁ', v: 'ㅜ', b: 'ㄹ' }, // 물
    { c: 'ㅁ', v: 'ㅏ', b: 'ㄹ' }, // 말
    { c: 'ㅂ', v: 'ㅕ', b: 'ㄹ' }, // 별
  ]},
];

var composeState = null;

function goCompose() {
  var el = document.getElementById('composeMenu');
  el.innerHTML = '';
  COMPOSE_LESSONS.forEach(function(lesson) {
    var card = document.createElement('div');
    card.className = 'matching-card';
    card.style.background = '#D4A5FF';
    card.innerHTML =
      '<div class="emoji" style="font-size:64px">' + lesson.emoji + '</div>' +
      '<div class="name">' + lesson.title + '</div>';
    card.onclick = function() { startCompose(lesson.id); };
    el.appendChild(card);
  });
  showScreen('compose');
}

function startCompose(lessonId) {
  var lesson = COMPOSE_LESSONS.find(function(l) { return l.id === lessonId; });
  if (!lesson) return;
  composeState = {
    lesson: lesson,
    index: 0,
    stage: 'SHOW',
    quizAnswered: false,
  };
  renderCompose();
}

// 합성 식 영역(자음 + 모음 [+ 받침] = ?) HTML 생성
function _composeFormulaHtml(pair, finalChar) {
  var hasBat = !!pair.b;
  var html = '<div class="compose-pair">' +
    '<div class="compose-jamo blue">' + pair.c + '</div>' +
    '<div class="compose-plus">+</div>' +
    '<div class="compose-jamo green">' + pair.v + '</div>';
  if (hasBat) {
    html += '<div class="compose-plus">+</div>' +
      '<div class="compose-jamo orange compose-batchim">' + pair.b +
        '<div class="compose-batchim-label">받침</div>' +
      '</div>';
  }
  html += '<div class="compose-equals">=</div>';
  if (finalChar === null) {
    html += '<div class="compose-result-q">?</div>';
  } else if (finalChar) {
    html += '<div class="compose-result-big">' + finalChar + '</div>';
  }
  html += '</div>';
  return html;
}

function renderCompose() {
  var s = composeState;
  var pair = s.lesson.items[s.index];
  var syllable = composeSyllable(pair.c, pair.v, pair.b);
  var hasBat = !!pair.b;
  var total = s.lesson.items.length;
  var num = s.index + 1;

  var topBar =
    topBarHtml('goCompose()', num + ' / ' + total + ' — ' + s.lesson.title, '<div class="mascot-mini">🐿️</div>') +
    '<div class="progress-bar"><div class="progress-fill" style="width:' + ((num/total)*100) + '%"></div></div>';

  var html = topBar;

  if (s.stage === 'SHOW') {
    // 자모 분리 표시 (받침 있으면 3개, 없으면 2개)
    var prompt = hasBat ? '받침까지 합치면 어떻게 될까?' : '두 글자가 만나면 어떻게 될까?';
    html += '<div class="compose-content">' +
      '<div class="compose-mascot">' +
        '<div class="mascot mascot-wave" style="font-size:64px">🐿️</div>' +
        '<div class="speech-bubble">' + prompt + '</div>' +
      '</div>' +
      _composeFormulaHtml(pair, null) +
      '<button class="btn orange big" id="composeCombineBtn">🪄 합쳐보기!</button>' +
    '</div>';
    document.getElementById('composePlay').innerHTML = html;
    showScreen('composePlay');
    document.getElementById('composeCombineBtn').onclick = function() {
      s.stage = 'COMBINE';
      renderCompose();
    };
    // 자모 음가 순차 재생 — 이름("기역") 대신 소릿값("그")로 합성 원리 강조
    speak(phonOf(pair.c));
    setTimeout(function() { speak(pair.v); }, 1200);
    if (hasBat) setTimeout(function() { speak(phonOf(pair.b)); }, 2400);
  }
  else if (s.stage === 'COMBINE') {
    // 합쳐지는 애니메이션 — 받침은 아래로 슬라이드
    var bubbleMsg = hasBat
      ? '와~ "' + pair.c + pair.v + '"에 받침 "' + pair.b + '"이 붙어서 "' + syllable + '"이 됐어!'
      : '와~ "' + pair.c + '"과 "' + pair.v + '"가 만나서 "' + syllable + '"이 됐어!';
    html += '<div class="compose-content">' +
      '<div class="compose-mascot">' +
        '<div class="mascot mascot-happy" style="font-size:64px">🐿️</div>' +
        '<div class="speech-bubble">' + bubbleMsg + '</div>' +
      '</div>' +
      '<div class="compose-pair compose-animating' + (hasBat ? ' has-batchim' : '') + '">' +
        '<div class="compose-jamo blue compose-merge-left">' + pair.c + '</div>' +
        '<div class="compose-jamo green compose-merge-right">' + pair.v + '</div>' +
        (hasBat ? '<div class="compose-jamo orange compose-merge-bottom">' + pair.b + '</div>' : '') +
        '<div class="compose-result-big compose-result-pop">' + syllable + '</div>' +
      '</div>' +
      '<button class="btn green big" id="composeQuizBtn">🤔 문제 풀기 →</button>' +
    '</div>';
    document.getElementById('composePlay').innerHTML = html;
    document.getElementById('composeQuizBtn').onclick = function() {
      s.stage = 'QUIZ';
      s.quizAnswered = false;
      renderCompose();
    };
    setTimeout(function() {
      var cPhon = phonOf(pair.c);
      var bPhon = pair.b ? phonOf(pair.b) : '';
      var line = hasBat
        ? cPhon + pair.v + '에 받침 ' + bPhon + '이 붙으면 ' + syllable + '!'
        : cPhon + '과 ' + pair.v + '가 만나면 ' + syllable + '!';
      speakDarami(line);
    }, 600);
  }
  else if (s.stage === 'QUIZ') {
    var quizChars = _buildComposeQuizChars(pair, syllable);

    html += '<div class="compose-content">' +
      '<div class="compose-mascot">' +
        '<div class="mascot mascot-wave" style="font-size:64px">🐿️</div>' +
        '<div class="speech-bubble">' + (hasBat ? '"' + pair.c + pair.v + '"에 받침 "' + pair.b + '"을 붙이면?' : '"' + pair.c + '"과 "' + pair.v + '"이 만나면?') + '</div>' +
      '</div>' +
      _composeFormulaHtml(pair, '') +
      '<div class="compose-choices" id="composeChoices"></div>' +
    '</div>';
    document.getElementById('composePlay').innerHTML = html;
    var choicesWrap = document.getElementById('composeChoices');
    quizChars.forEach(function(qc) {
      var btn = document.createElement('button');
      btn.className = 'compose-choice';
      btn.innerHTML = qc.char;
      btn.onclick = function() { onComposeAnswer(qc, btn, syllable); };
      choicesWrap.appendChild(btn);
    });
    setTimeout(function() {
      var line = hasBat
        ? '받침 ' + phonOf(pair.b) + '을 붙이면 어떻게 되지?'
        : phonOf(pair.c) + '과 ' + pair.v + '이 만나면?';
      speakDarami(line);
    }, 300);
  }
}

// 보기 생성 — 받침 유무에 따라 변별 포인트가 다름
function _buildComposeQuizChars(pair, correct) {
  var hasBat = !!pair.b;
  var simpleChos = ['ㄱ','ㄴ','ㄷ','ㄹ','ㅁ','ㅂ','ㅅ','ㅇ','ㅈ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ'];
  var simpleVows = ['ㅏ','ㅓ','ㅗ','ㅜ','ㅡ','ㅣ'];

  var distractors = [];
  if (hasBat) {
    // 받침 변별: 같은 cho+v에 다른 받침, 그리고 받침 없는 버전 1개
    var batChoices = ['ㄱ','ㄴ','ㄹ','ㅁ','ㅂ','ㅇ'];
    var wrongBats = shuffleArr(batChoices.filter(function(b) { return b !== pair.b; })).slice(0, 1);
    wrongBats.forEach(function(b) {
      distractors.push({ char: composeSyllable(pair.c, pair.v, b), kind: 'wrongBat' });
    });
    // 받침 없는 형태 (대조: 받침의 역할 강조)
    distractors.push({ char: composeSyllable(pair.c, pair.v), kind: 'noBat' });
  } else {
    // CV 변별: 50% 확률로 모음/자음 중 하나를 바꿔서 출제
    var changeVowel = Math.random() < 0.5;
    if (changeVowel) {
      var vows = shuffleArr(simpleVows.filter(function(v) { return v !== pair.v; })).slice(0, 2);
      vows.forEach(function(v) {
        distractors.push({ char: composeSyllable(pair.c, v), kind: 'wrongV' });
      });
    } else {
      var chos = shuffleArr(simpleChos.filter(function(c) { return c !== pair.c; })).slice(0, 2);
      chos.forEach(function(c) {
        distractors.push({ char: composeSyllable(c, pair.v), kind: 'wrongC' });
      });
    }
  }
  var quizChars = distractors.slice(0, 2);
  quizChars.push({ char: correct, kind: 'correct' });
  return shuffleArr(quizChars);
}

function onComposeAnswer(choice, btn, correctSyllable) {
  var s = composeState;
  var pair = s.lesson.items[s.index];
  if (s.quizAnswered) return;
  if (choice.char === correctSyllable) {
    s.quizAnswered = true;
    btn.classList.add('correct');
    var msg = getPraise(2);
    speakDarami(msg);
    showToast(msg, 1500);
    setTimeout(function() {
      s.index++;
      if (s.index >= s.lesson.items.length) {
        showComposeResult();
      } else {
        s.stage = 'SHOW';
        renderCompose();
      }
    }, 1800);
  } else {
    btn.classList.add('wrong');
    btn.disabled = true;
    // 구체적 오답 힌트 (kind별로 다른 메시지)
    var hint = _composeFailHint(choice.kind, pair);
    speakDarami(hint);
    showToast(hint, 1600);
  }
}

// 합성 챕터용 구체적 오답 힌트
function _composeFailHint(kind, pair) {
  if (kind === 'wrongBat') return '받침이 달라~ "' + pair.b + '"이 들어가야 해!';
  if (kind === 'noBat') return '받침을 잊었어! "' + pair.b + '"이 아래에 들어가~';
  if (kind === 'wrongV') return '모음이 달라~ "' + pair.v + '"이 들어가야 해!';
  if (kind === 'wrongC') return '첫소리가 달라~ "' + pair.c + '"으로 시작해!';
  return '앗! 다시 생각해봐~';
}

function showComposeResult() {
  var s = composeState;
  var play = document.getElementById('composePlay');
  play.innerHTML =
    topBarHtml('goCompose()', '완료!', '') +
    '<div class="match-result">' +
      '<div style="font-size:80px">🎉</div>' +
      '<div class="match-result-stars">' + s.lesson.title + ' 완료!</div>' +
      '<div class="match-result-msg">자모가 만나면 음절이 돼! 잘 했어~</div>' +
      '<div class="learn-actions" style="margin-top:24px">' +
        '<button class="btn orange" id="composeAgainBtn">🔄 다시 하기</button>' +
        '<button class="btn green" id="composeMenuBtn">메뉴로</button>' +
      '</div>' +
    '</div>';
  var lessonId = s.lesson.id;
  play.querySelector('#composeAgainBtn').onclick = function() { startCompose(lessonId); };
  play.querySelector('#composeMenuBtn').onclick = goCompose;
  speakDarami('와~ 자모 합성 끝! 잘 했어!');
}
