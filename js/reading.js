// === 짧은 문장 읽기 (Phase 4) ===
// 단어 → 문장으로 확장. 단어 단위 하이라이트 + 음성 + 내가 읽기 모드

var SENTENCES = [
  { id: 'r_appa', emoji: '👨', words: ['아빠', '가', '와요'], hint: '아빠가 와요!' },
  { id: 'r_eomma', emoji: '👩', words: ['엄마', '가', '예뻐요'], hint: '엄마가 예뻐요!' },
  { id: 'r_gae', emoji: '🐕', words: ['개', '가', '짖어요'], hint: '개가 짖어요!' },
  { id: 'r_nabi', emoji: '🦋', words: ['나비', '가', '날아요'], hint: '나비가 날아요!' },
  { id: 'r_san', emoji: '⛰️', words: ['산', '이', '높아요'], hint: '산이 높아요!' },
  { id: 'r_mul', emoji: '💧', words: ['물', '이', '맑아요'], hint: '물이 맑아요!' },
  { id: 'r_dal', emoji: '🌙', words: ['달', '이', '밝아요'], hint: '달이 밝아요!' },
  { id: 'r_gicha', emoji: '🚂', words: ['기차', '가', '와요'], hint: '기차가 와요!' },
];

var readingState = null;

function goReading() {
  var el = document.getElementById('readingList');
  el.innerHTML = '';
  SENTENCES.forEach(function(s, i) {
    var card = document.createElement('div');
    card.className = 'reading-card';
    card.innerHTML =
      '<div class="reading-emoji">' + s.emoji + '</div>' +
      '<div class="reading-preview">' + s.words.join(' ') + '</div>';
    card.onclick = function() { startReading(s.id); };
    el.appendChild(card);
  });
  showScreen('reading');
}

function startReading(sentenceId) {
  var s = SENTENCES.find(function(x) { return x.id === sentenceId; });
  if (!s) return;
  readingState = {
    sentence: s,
    mode: 'AUTO',     // AUTO: 다람이가 읽어줌, ME: 내가 단어 클릭
    activeWord: -1,
    tappedCount: 0,
  };
  renderReading();
}

function renderReading() {
  var s = readingState;
  var sent = s.sentence;

  var wordsHtml = '';
  sent.words.forEach(function(w, i) {
    var cls = 'reading-word';
    if (i === s.activeWord) cls += ' active';
    if (s.mode === 'ME' && i < s.tappedCount) cls += ' tapped';
    wordsHtml += '<button class="' + cls + '" data-idx="' + i + '">' + w + '</button>';
  });

  document.getElementById('readingPlay').innerHTML =
    topBarHtml('goReading()', '📖 문장 읽기', '<div class="mascot-mini">🐿️</div>') +
    '<div class="reading-content">' +
      '<div class="reading-emoji-big">' + sent.emoji + '</div>' +
      '<div class="reading-sentence">' + wordsHtml + '</div>' +
      '<div class="learn-actions">' +
        '<button class="btn yellow" id="readPlayBtn">🔊 다람이 읽기</button>' +
        '<button class="btn ' + (s.mode === 'ME' ? 'green' : 'blue') + '" id="readMyBtn">' + (s.mode === 'ME' ? '🔄 다시' : '✋ 내가 읽기') + '</button>' +
      '</div>' +
      (s.mode === 'ME' ? '<div class="reading-hint">단어를 순서대로 눌러봐!</div>' : '') +
    '</div>';
  showScreen('readingPlay');

  document.getElementById('readPlayBtn').onclick = function() {
    s.mode = 'AUTO'; s.tappedCount = 0; playSentenceAuto();
  };
  document.getElementById('readMyBtn').onclick = function() {
    s.mode = 'ME'; s.tappedCount = 0; s.activeWord = -1;
    renderReading();
  };
  // 단어 클릭 핸들러
  document.querySelectorAll('.reading-word').forEach(function(btn) {
    btn.onclick = function() {
      var idx = parseInt(btn.dataset.idx, 10);
      if (s.mode === 'ME') {
        if (idx === s.tappedCount) {
          s.tappedCount++;
          speak(sent.words[idx]);
          if (s.tappedCount >= sent.words.length) {
            setTimeout(function() {
              var msg = getPraise(2);
              speakDarami(msg);
              showToast(msg + ' 잘 읽었어!', 2000);
            }, 600);
          }
          renderReading();
        } else {
          speakDarami('아직 다른 단어가 먼저야~');
        }
      } else {
        // 자유 클릭: 그냥 그 단어 읽어줌
        speak(sent.words[idx]);
      }
    };
  });

  if (s.mode === 'AUTO' && s.activeWord === -1) {
    setTimeout(playSentenceAuto, 400);
  }
}

function playSentenceAuto() {
  var s = readingState;
  if (!s) return;
  var words = s.sentence.words;
  s.activeWord = 0;
  function step(i) {
    if (!readingState) return;
    if (i >= words.length) {
      s.activeWord = -1;
      renderReading();
      // 마무리 멘트
      setTimeout(function() { speakDarami('따라 읽어볼까~?'); }, 600);
      return;
    }
    s.activeWord = i;
    renderReading();
    speak(words[i]);
    setTimeout(function() { step(i + 1); }, 900);
  }
  step(0);
}
