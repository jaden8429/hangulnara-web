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

  // 오답 보기 만들기 (정답 제외 풀에서 랜덤)
  var wrongPool = s.allItems.filter(function(it) { return it.id !== q.id; });
  wrongPool.sort(function() { return Math.random() - 0.5; });
  var choices = wrongPool.slice(0, CHOICE_COUNT - 1);
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
    var stars = s.retryUsed ? 1 : 2;
    s.correctCount += stars;
    var msg = getPraise(s.retryUsed ? 1 : 2);
    document.getElementById('matchBubble').textContent = msg;
    speakDarami(msg);
    // 진도 기록 (재학습 효과)
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
