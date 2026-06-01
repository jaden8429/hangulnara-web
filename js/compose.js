// === 자모 합성 챕터: 글자 만들기 (사고형 학습 핵심) ===
// 자음 + 모음 → 음절 합성 원리 직관적 교수

// 한글 유니코드 합성 공식:
// 음절 = 0xAC00 + (초성 idx * 588) + (중성 idx * 28) + (종성 idx)
var CHOSEONG = ['ㄱ','ㄲ','ㄴ','ㄷ','ㄸ','ㄹ','ㅁ','ㅂ','ㅃ','ㅅ','ㅆ','ㅇ','ㅈ','ㅉ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ'];
var JUNGSEONG = ['ㅏ','ㅐ','ㅑ','ㅒ','ㅓ','ㅔ','ㅕ','ㅖ','ㅗ','ㅘ','ㅙ','ㅚ','ㅛ','ㅜ','ㅝ','ㅞ','ㅟ','ㅠ','ㅡ','ㅢ','ㅣ'];

function composeSyllable(cho, jung) {
  var ci = CHOSEONG.indexOf(cho);
  var ji = JUNGSEONG.indexOf(jung);
  if (ci < 0 || ji < 0) return null;
  return String.fromCharCode(0xAC00 + ci * 588 + ji * 28);
}

// 합성 학습 콘텐츠 — 자음+모음→음절 예시
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
    stage: 'SHOW', // SHOW → COMBINE → QUIZ → DONE
    quizAnswered: false,
  };
  renderCompose();
}

function renderCompose() {
  var s = composeState;
  var pair = s.lesson.items[s.index];
  var syllable = composeSyllable(pair.c, pair.v);
  var total = s.lesson.items.length;
  var num = s.index + 1;

  var topBar =
    '<div class="top-bar">' +
      '<button class="back-btn" onclick="goCompose()">←</button>' +
      '<span class="title">' + num + ' / ' + total + ' — ' + s.lesson.title + '</span>' +
      '<div class="mascot-mini">🐿️</div>' +
    '</div>' +
    '<div class="progress-bar"><div class="progress-fill" style="width:' + ((num/total)*100) + '%"></div></div>';

  var html = topBar;

  if (s.stage === 'SHOW') {
    // 자음 + 모음 분리 표시
    html += '<div class="compose-content">' +
      '<div class="compose-mascot">' +
        '<div class="mascot mascot-wave" style="font-size:64px">🐿️</div>' +
        '<div class="speech-bubble">두 글자가 만나면 어떻게 될까?</div>' +
      '</div>' +
      '<div class="compose-pair">' +
        '<div class="compose-jamo blue">' + pair.c + '</div>' +
        '<div class="compose-plus">+</div>' +
        '<div class="compose-jamo green">' + pair.v + '</div>' +
        '<div class="compose-equals">=</div>' +
        '<div class="compose-result-q">?</div>' +
      '</div>' +
      '<button class="btn orange big" id="composeCombineBtn">🪄 합쳐보기!</button>' +
    '</div>';
    document.getElementById('composePlay').innerHTML = html;
    showScreen('composePlay');
    document.getElementById('composeCombineBtn').onclick = function() {
      s.stage = 'COMBINE';
      renderCompose();
    };
    // 각 자모 발음
    speak(pair.c);
    setTimeout(function() { speak(pair.v); }, 1200);
  }
  else if (s.stage === 'COMBINE') {
    // 합쳐지는 애니메이션
    html += '<div class="compose-content">' +
      '<div class="compose-mascot">' +
        '<div class="mascot mascot-happy" style="font-size:64px">🐿️</div>' +
        '<div class="speech-bubble">와~ "' + pair.c + '"과 "' + pair.v + '"가 만나서 "' + syllable + '"이 됐어!</div>' +
      '</div>' +
      '<div class="compose-pair compose-animating">' +
        '<div class="compose-jamo blue compose-merge-left">' + pair.c + '</div>' +
        '<div class="compose-jamo green compose-merge-right">' + pair.v + '</div>' +
        '<div class="compose-result-big">' + syllable + '</div>' +
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
      speakDarami(pair.c + '과 ' + pair.v + '가 만나면 ' + syllable + '!');
    }, 600);
  }
  else if (s.stage === 'QUIZ') {
    // 같은 모음 다른 자음 보기 3개 중 정답 고르기 (사고형 변별)
    var distractorChos = CHOSEONG.filter(function(c) {
      return c !== pair.c && ['ㄱ','ㄴ','ㄷ','ㄹ','ㅁ','ㅂ','ㅅ','ㅇ','ㅈ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ'].indexOf(c) >= 0;
    }).sort(function() { return Math.random() - 0.5; }).slice(0, 2);
    var quizChars = distractorChos.map(function(c) {
      return { char: composeSyllable(c, pair.v), cho: c };
    });
    quizChars.push({ char: syllable, cho: pair.c, correct: true });
    quizChars.sort(function() { return Math.random() - 0.5; });

    html += '<div class="compose-content">' +
      '<div class="compose-mascot">' +
        '<div class="mascot mascot-wave" style="font-size:64px">🐿️</div>' +
        '<div class="speech-bubble">"' + pair.c + '"과 "' + pair.v + '"이 만나면?</div>' +
      '</div>' +
      '<div class="compose-pair">' +
        '<div class="compose-jamo blue">' + pair.c + '</div>' +
        '<div class="compose-plus">+</div>' +
        '<div class="compose-jamo green">' + pair.v + '</div>' +
        '<div class="compose-equals">=</div>' +
      '</div>' +
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
      speakDarami(pair.c + '과 ' + pair.v + '이 만나면?');
    }, 300);
  }
}

function onComposeAnswer(choice, btn, correctSyllable) {
  var s = composeState;
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
    speakDarami('앗! 다시 생각해봐~');
    showToast('다시 생각해봐~', 1200);
  }
}

function showComposeResult() {
  var s = composeState;
  document.getElementById('composePlay').innerHTML =
    '<div class="top-bar">' +
      '<button class="back-btn" onclick="goCompose()">←</button>' +
      '<span class="title">완료!</span>' +
    '</div>' +
    '<div class="match-result">' +
      '<div style="font-size:80px">🎉</div>' +
      '<div class="match-result-stars">' + s.lesson.title + ' 완료!</div>' +
      '<div class="match-result-msg">자모가 만나면 음절이 돼! 잘 했어~</div>' +
      '<div class="learn-actions" style="margin-top:24px">' +
        '<button class="btn orange" onclick="startCompose(\'' + s.lesson.id + '\')">🔄 다시 하기</button>' +
        '<button class="btn green" onclick="goCompose()">메뉴로</button>' +
      '</div>' +
    '</div>';
  speakDarami('와~ 자모 합성 끝! 잘 했어!');
}
