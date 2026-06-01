// === 듣고 맞추기 게임 (사고형 학습) ===
// 다람이가 들려주는 소리 → 3지선다로 글자 찾기

var MATCHING_POOLS = {
  consonants: {
    title: '자음 듣고 맞추기',
    emoji: 'ㄱ',
    color: '#8ECAE6',
    items: function() {
      return [].concat(
        LESSONS.consonant_set_1.items,
        LESSONS.consonant_set_2.items,
        LESSONS.consonant_set_3.items
      );
    }
  },
  vowels: {
    title: '모음 듣고 맞추기',
    emoji: 'ㅏ',
    color: '#A8E6CF',
    items: function() {
      return [].concat(
        LESSONS.vowel_set_1.items,
        LESSONS.vowel_set_2.items
      );
    }
  },
  words: {
    title: '그림 듣고 맞추기',
    emoji: '🐕',
    color: '#FFBE76',
    items: function() {
      var arr = [];
      Object.keys(WORD_THEMES).forEach(function(k) {
        WORD_THEMES[k].words.forEach(function(w) { arr.push(w); });
      });
      return arr;
    }
  }
};

var ROUND_SIZE = 5;       // 한 라운드 문항 수
var CHOICE_COUNT = 3;     // 보기 개수

// 혼동쌍 테이블 (변별 학습 효과 극대화)
// 형태/소리가 비슷한 글자를 함께 보여줘서 인지적 변별 자극
var CONFUSION_PAIRS = {
  // 자음 — 형태 유사
  'ㄱ': ['ㅋ', 'ㄴ'], 'ㅋ': ['ㄱ', 'ㅌ'],
  'ㄴ': ['ㄹ', 'ㄱ'], 'ㄹ': ['ㄴ', 'ㄷ'],
  'ㄷ': ['ㅌ', 'ㄹ'], 'ㅌ': ['ㄷ', 'ㅋ'],
  'ㅂ': ['ㅍ', 'ㅁ'], 'ㅍ': ['ㅂ', 'ㅌ'],
  'ㅁ': ['ㅂ', 'ㅇ'], 'ㅇ': ['ㅎ', 'ㅁ'],
  'ㅈ': ['ㅊ', 'ㅅ'], 'ㅊ': ['ㅈ', 'ㅋ'],
  'ㅅ': ['ㅈ', 'ㅆ'], 'ㅎ': ['ㅇ', 'ㅊ'],
  // 모음 — 좌우/방향 유사
  'ㅏ': ['ㅓ', 'ㅑ'], 'ㅓ': ['ㅏ', 'ㅕ'],
  'ㅑ': ['ㅕ', 'ㅏ'], 'ㅕ': ['ㅑ', 'ㅓ'],
  'ㅗ': ['ㅜ', 'ㅛ'], 'ㅜ': ['ㅗ', 'ㅠ'],
  'ㅛ': ['ㅠ', 'ㅗ'], 'ㅠ': ['ㅛ', 'ㅜ'],
  'ㅡ': ['ㅣ', 'ㅗ'], 'ㅣ': ['ㅡ', 'ㅏ'],
};

var matchState = null;

function goMatching() {
  var el = document.getElementById('matchingMenu');
  el.innerHTML = '';
  Object.keys(MATCHING_POOLS).forEach(function(key) {
    var p = MATCHING_POOLS[key];
    var card = document.createElement('div');
    card.className = 'matching-card';
    card.style.background = p.color;
    card.innerHTML =
      '<div class="emoji" style="font-size:60px">' + p.emoji + '</div>' +
      '<div class="name">' + p.title + '</div>';
    card.onclick = function() { startMatchingRound(key); };
    el.appendChild(card);
  });
  showScreen('matching');
}

function startMatchingRound(poolKey) {
  var pool = MATCHING_POOLS[poolKey];
  var allItems = pool.items();

  // 섞고 ROUND_SIZE개 선택
  var shuffled = allItems.slice().sort(function() { return Math.random() - 0.5; });
  var questions = shuffled.slice(0, Math.min(ROUND_SIZE, shuffled.length));

  matchState = {
    poolKey: poolKey,
    pool: pool,
    allItems: allItems,
    questions: questions,
    index: 0,
    correctCount: 0,
    retryUsed: false,
    answered: false,
  };
  renderMatchingQuestion();
}

function renderMatchingQuestion() {
  var s = matchState;
  var q = s.questions[s.index];

  // 오답 보기 — 혼동쌍 우선 (70%), 부족하면 랜덤으로 보충
  var confusable = CONFUSION_PAIRS[q.char] || [];
  var distractors = [];
  confusable.forEach(function(ch) {
    var item = s.allItems.find(function(it) { return it.char === ch && it.id !== q.id; });
    if (item && !distractors.find(function(d) { return d.id === item.id; })) {
      distractors.push(item);
    }
  });
  // 부족분 랜덤 보충
  if (distractors.length < CHOICE_COUNT - 1) {
    var rest = s.allItems.filter(function(it) {
      return it.id !== q.id && !distractors.find(function(d) { return d.id === it.id; });
    });
    rest.sort(function() { return Math.random() - 0.5; });
    distractors = distractors.concat(rest.slice(0, (CHOICE_COUNT - 1) - distractors.length));
  }
  var choices = distractors.slice(0, CHOICE_COUNT - 1);
  choices.push(q);
  choices.sort(function() { return Math.random() - 0.5; });

  s.retryUsed = false;
  s.answered = false;

  var num = s.index + 1;
  var total = s.questions.length;

  // 단어 풀이면 그림(emoji) 클릭으로 매칭 (그림 → 글자)
  // 자/모음이면 글자 발음 듣고 글자 클릭 (소리 → 글자)
  var isWordPool = (s.poolKey === 'words');

  var html =
    '<div class="top-bar">' +
      '<button class="back-btn" onclick="exitMatching()">←</button>' +
      '<span class="title">' + num + ' / ' + total + '</span>' +
      '<span class="badge"><span style="color:#FFD166">⭐</span> ' + s.correctCount + '</span>' +
    '</div>' +
    '<div class="progress-bar"><div class="progress-fill" style="width:' + ((num/total)*100) + '%"></div></div>' +
    '<div class="match-content">' +
      '<div class="match-prompt">' +
        '<div class="mascot mascot-wave" style="font-size:64px">🐿️</div>' +
        '<div class="speech-bubble" id="matchBubble">잘 듣고 맞춰봐!</div>' +
      '</div>' +
      '<div class="match-question">' +
        (isWordPool
          ? '<div class="match-emoji">' + (q.emoji || '🤔') + '</div>'
          : '<button class="btn icon lg yellow" id="matchPlayBtn" style="font-size:48px;width:100px;height:100px">🔊</button>'
        ) +
        '<div class="match-hint">' + (isWordPool ? '이 그림에 맞는 글자는?' : '소리에 맞는 글자를 골라봐!') + '</div>' +
      '</div>' +
      '<div class="match-choices" id="matchChoices"></div>' +
    '</div>';

  document.getElementById('matchingPlay').innerHTML = html;
  showScreen('matchingPlay');

  var choiceWrap = document.getElementById('matchChoices');
  choices.forEach(function(c) {
    var btn = document.createElement('button');
    btn.className = 'match-choice';
    btn.dataset.id = c.id;
    btn.innerHTML = '<span class="match-choice-char">' + c.char + '</span>';
    btn.onclick = function() { onMatchChoice(c, btn, q); };
    choiceWrap.appendChild(btn);
  });

  // 자음/모음 풀: 자동 재생
  if (!isWordPool) {
    setTimeout(function() { speak(q.tts); }, 400);
    var pb = document.getElementById('matchPlayBtn');
    if (pb) pb.onclick = function() { speak(q.tts); };
  } else {
    // 단어 풀: 다람이가 단어 발음
    setTimeout(function() { speak(q.tts); }, 400);
  }
}

function onMatchChoice(choice, btn, correct) {
  var s = matchState;
  if (s.answered) return;

  if (choice.id === correct.id) {
    // 정답
    s.answered = true;
    btn.classList.add('correct');
    // 매칭은 인식 학습 — 산출 학습(쓰기)보다 낮게 평가: 첫 시도 1별, 재시도 후 0별
    var stars = s.retryUsed ? 0 : 1;
    var roundPoints = s.retryUsed ? 1 : 2; // 라운드 내 표시용 점수
    s.correctCount += roundPoints;
    var msg = getPraise(s.retryUsed ? 1 : 2);
    document.getElementById('matchBubble').textContent = msg;
    speakDarami(msg);
    // 진도 기록 — bestStars 초과 시에만 누적 (인플레이션 방지는 storage.js가 처리)
    recordResult(correct.id, true, stars);
    setTimeout(function() {
      s.index++;
      if (s.index >= s.questions.length) showMatchingResult();
      else renderMatchingQuestion();
    }, 2000);
  } else {
    // 오답
    btn.classList.add('wrong');
    btn.disabled = true;
    if (!s.retryUsed) {
      s.retryUsed = true;
      var msg = '앗! 다시 한 번 들어봐~';
      document.getElementById('matchBubble').textContent = msg;
      speakDarami(msg);
      setTimeout(function() { speak(correct.tts); }, 1200);
    } else {
      // 두 번 틀림 → 정답 공개
      s.answered = true;
      var msg2 = '괜찮아~ 정답은 "' + correct.name + '"이야!';
      document.getElementById('matchBubble').textContent = msg2;
      speakDarami(msg2);
      // 정답 버튼 하이라이트
      var buttons = document.querySelectorAll('#matchChoices .match-choice');
      buttons.forEach(function(b) {
        if (b.dataset.id === correct.id) b.classList.add('correct');
      });
      recordResult(correct.id, false, 0);
      setTimeout(function() {
        s.index++;
        if (s.index >= s.questions.length) showMatchingResult();
        else renderMatchingQuestion();
      }, 2500);
    }
  }
}

function showMatchingResult() {
  var s = matchState;
  var maxStars = s.questions.length * 2;
  var pct = s.correctCount / maxStars;
  var emoji, msg;
  if (pct >= 0.8) { emoji = '🎉'; msg = '우와~ 정말 잘했어!'; }
  else if (pct >= 0.5) { emoji = '😊'; msg = '잘 했어! 한 번 더 해볼까?'; }
  else { emoji = '💪'; msg = '괜찮아~ 다시 한 번 도전!'; }

  // 누적 별 추가
  var d = loadData();
  // 라운드 별점은 학습 별과 별도 카운트 — 누적 별에는 합산하지 않고 라운드 결과만 표시
  // (recordResult로 이미 학습 진도에 반영됨)

  document.getElementById('matchingPlay').innerHTML =
    '<div class="top-bar">' +
      '<button class="back-btn" onclick="goMatching()">←</button>' +
      '<span class="title">결과</span>' +
    '</div>' +
    '<div class="match-result">' +
      '<div style="font-size:80px">' + emoji + '</div>' +
      '<div class="match-result-stars">' +
        '<span style="color:#FFD166">⭐</span> ' + s.correctCount + ' / ' + maxStars +
      '</div>' +
      '<div class="match-result-msg">' + msg + '</div>' +
      '<div class="learn-actions" style="margin-top:24px">' +
        '<button class="btn orange" onclick="startMatchingRound(\'' + s.poolKey + '\')">🔄 한 번 더</button>' +
        '<button class="btn green" onclick="goMatching()">메뉴로</button>' +
      '</div>' +
    '</div>';
  speakDarami(msg);
}

function exitMatching() {
  if (confirm('게임을 그만할래?')) goMatching();
}
