// Canvas 기반 손글씨 입력 + 자동 평가
class WritingCanvas {
  constructor(canvasEl, opts = {}) {
    this.canvas = canvasEl;
    this.ctx = canvasEl.getContext('2d');
    this.strokes = [];
    this.currentStroke = null;
    this.guideText = opts.guideText || null;
    this.guideAlpha = opts.guideAlpha || 0.15;
    this.penWidth = opts.penWidth || 8;
    this.penColor = opts.penColor || '#333333';
    this.onStrokeEnd = opts.onStrokeEnd || null;
    this.onAutoEvaluate = opts.onAutoEvaluate || null;
    this._autoTimer = null;
    this._autoDelay = opts.autoDelay || 1200; // 펜 뗀 후 자동 평가까지 대기 ms
    this._locked = false; // 평가 중 입력 잠금

    this._bindEvents();
    this.redraw();
  }

  _bindEvents() {
    var self = this;
    var c = this.canvas;
    // 모든 입력 방식 지원: 포인터 + 마우스 + 터치
    // 포인터 이벤트 (최신 브라우저, S Pen)
    c.addEventListener('pointerdown', function(e){ e.preventDefault(); e.stopPropagation(); self._start(e); }, false);
    c.addEventListener('pointermove', function(e){ e.preventDefault(); self._move(e); }, false);
    c.addEventListener('pointerup', function(e){ e.preventDefault(); self._end(e); }, false);
    c.addEventListener('pointercancel', function(e){ self._end(e); }, false);
    // 마우스 이벤트 (PC fallback)
    c.addEventListener('mousedown', function(e){ e.preventDefault(); e.stopPropagation(); self._startMouse(e); }, false);
    c.addEventListener('mousemove', function(e){ self._moveMouse(e); }, false);
    c.addEventListener('mouseup', function(e){ self._endMouse(e); }, false);
    // 터치 이벤트 (모바일 fallback)
    c.addEventListener('touchstart', function(e){ e.preventDefault(); if(e.touches.length===1) self._start(e.touches[0]); }, { passive: false });
    c.addEventListener('touchmove', function(e){ e.preventDefault(); if(e.touches.length===1) self._move(e.touches[0]); }, { passive: false });
    c.addEventListener('touchend', function(e){ e.preventDefault(); self._end(e.changedTouches?e.changedTouches[0]:e); }, { passive: false });
  }

  // 마우스 전용 (포인터 이벤트가 발생하면 _mouseActive 안 됨)
  _startMouse(e) {
    if (this._pointerActive) return; // 포인터 이벤트가 이미 처리 중이면 무시
    this._mouseActive = true;
    this._start(e);
  }
  _moveMouse(e) {
    if (!this._mouseActive) return;
    this._move(e);
  }
  _endMouse(e) {
    if (!this._mouseActive) return;
    this._mouseActive = false;
    this._end(e);
  }

  _getPos(e) {
    const r = this.canvas.getBoundingClientRect();
    return {
      x: (e.clientX - r.left) * (this.canvas.width / r.width),
      y: (e.clientY - r.top) * (this.canvas.height / r.height),
      pressure: e.pressure || 0.5,
      t: Date.now(),
    };
  }

  _start(e) {
    if (this._locked) return;
    if (e.pointerId !== undefined) {
      this._pointerActive = true;
      try { this.canvas.setPointerCapture(e.pointerId); } catch(ex) {}
    }
    this._cancelAutoTimer();
    var p = this._getPos(e);
    this.currentStroke = [p];
    this.redraw();
  }

  _move(e) {
    if (this._locked || !this.currentStroke) return;
    if (e.preventDefault) e.preventDefault();
    this.currentStroke.push(this._getPos(e));
    this.redraw();
  }

  _end(e) {
    if (this._locked || !this.currentStroke) return;
    this._pointerActive = false;
    var validStroke = this.currentStroke.length > 1;
    if (validStroke) {
      this.strokes.push(this.currentStroke);
    }
    this.currentStroke = null;
    this.redraw();
    if (validStroke && this.hasStrokes()) {
      if (this.onStrokeEnd) this.onStrokeEnd();
      this._startAutoTimer();
    }
  }

  // 전체 정리 (화면 이탈 시)
  destroy() {
    this._cancelAutoTimer();
    this._locked = true;
    this._destroyed = true;
    this.onAutoEvaluate = null;
    this.onStrokeEnd = null;
  }

  _startAutoTimer() {
    this._cancelAutoTimer();
    if (!this.onAutoEvaluate || !this.hasStrokes()) return;
    this._autoTimer = setTimeout(() => {
      if (this.hasStrokes() && this.onAutoEvaluate) {
        this.onAutoEvaluate();
      }
    }, this._autoDelay);
  }

  _cancelAutoTimer() {
    if (this._autoTimer) {
      clearTimeout(this._autoTimer);
      this._autoTimer = null;
    }
  }

  // 입력 잠금 (평가 결과 애니메이션 중)
  lock() { this._locked = true; this._cancelAutoTimer(); }
  unlock() { this._locked = false; }

  // 정답 피드백: 초록 테두리 플래시
  flashCorrect(callback) {
    this.lock();
    const wrap = this.canvas.parentElement;
    if (wrap) {
      wrap.style.transition = 'box-shadow 0.3s ease';
      wrap.style.boxShadow = '0 0 0 6px #A8E6CF, 0 4px 16px rgba(0,0,0,0.1)';
    }
    setTimeout(() => {
      if (wrap) { wrap.style.boxShadow = '0 4px 16px rgba(0,0,0,0.1)'; }
      this.unlock();
      if (callback) callback();
    }, 800);
  }

  // 오답 피드백: 빨간 흔들림 + 클리어
  flashWrong(callback) {
    this.lock();
    const wrap = this.canvas.parentElement;
    if (wrap) {
      wrap.style.transition = 'box-shadow 0.3s ease';
      wrap.style.boxShadow = '0 0 0 4px #FFADAD, 0 4px 16px rgba(0,0,0,0.1)';
      wrap.style.animation = 'shakeCanvas 0.4s ease';
    }
    setTimeout(() => {
      if (wrap) {
        wrap.style.boxShadow = '0 4px 16px rgba(0,0,0,0.1)';
        wrap.style.animation = '';
      }
      this.clear();
      this.unlock();
      if (callback) callback();
    }, 900);
  }

  redraw() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, w, h);

    // 십자 가이드
    ctx.strokeStyle = '#E0E0E0';
    ctx.lineWidth = 1;
    ctx.setLineDash([8, 8]);
    ctx.beginPath();
    ctx.moveTo(w / 2, 0); ctx.lineTo(w / 2, h);
    ctx.moveTo(0, h / 2); ctx.lineTo(w, h / 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // 가이드 글자
    if (this.guideText) {
      ctx.save();
      ctx.globalAlpha = this.guideAlpha;
      ctx.fillStyle = '#000000';
      ctx.font = 'bold ' + (h * 0.7) + 'px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(this.guideText, w / 2, h / 2);
      ctx.restore();
    }

    // 스트로크 렌더링
    var allStrokes = this.strokes.slice();
    if (this.currentStroke) allStrokes.push(this.currentStroke);

    var penColor = this.penColor;
    var penWidth = this.penWidth;
    allStrokes.forEach(function(stroke) {
      if (stroke.length < 2) return;
      ctx.beginPath();
      ctx.moveTo(stroke[0].x, stroke[0].y);
      for (var i = 1; i < stroke.length; i++) {
        var prev = stroke[i - 1];
        var curr = stroke[i];
        var mx = (prev.x + curr.x) / 2;
        var my = (prev.y + curr.y) / 2;
        ctx.quadraticCurveTo(prev.x, prev.y, mx, my);
      }
      ctx.strokeStyle = penColor;
      ctx.lineWidth = penWidth * (stroke[stroke.length - 1].pressure * 1.5 + 0.5);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();
    });
  }

  clear() { this.strokes = []; this.currentStroke = null; this._cancelAutoTimer(); this.redraw(); }
  undo() { this.strokes.pop(); this._cancelAutoTimer(); this.redraw(); this._startAutoTimer(); }
  hasStrokes() { return this.strokes.length > 0; }
  getTotalPoints() { return this.strokes.reduce(function(s, st) { return s + st.length; }, 0); }

  setGuide(text, alpha) {
    this.guideText = text;
    this.guideAlpha = alpha || 0.15;
    this.redraw();
  }

  // 평가
  evaluate(expectedChar, itemType) {
    var points = this.getTotalPoints();
    var strokeCount = this.strokes.length;
    if (points < 5) return { correct: false, stars: 0 };

    if (itemType === 'PREP') {
      var score = points > 30 ? 3 : points > 15 ? 2 : 1;
      return { correct: true, stars: score };
    }

    var coverage = this._calcCoverage();
    var minStrokes = this._expectedStrokes(expectedChar);

    if (strokeCount < Math.max(1, minStrokes - 1)) return { correct: false, stars: 0 };
    if (coverage < 0.08) return { correct: false, stars: 0 };

    var strokeMatch = Math.min(1, strokeCount / Math.max(1, minStrokes));
    var coverageScore = Math.min(1, coverage / 0.25);
    var pointScore = Math.min(1, points / 40);
    var total = strokeMatch * 0.4 + coverageScore * 0.3 + pointScore * 0.3;

    var stars = total > 0.7 ? 3 : total > 0.4 ? 2 : 1;
    return { correct: true, stars: stars };
  }

  _calcCoverage() {
    if (this.strokes.length === 0) return 0;
    var minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    var w = this.canvas.width, h = this.canvas.height;
    this.strokes.forEach(function(s) { s.forEach(function(p) {
      minX = Math.min(minX, p.x); minY = Math.min(minY, p.y);
      maxX = Math.max(maxX, p.x); maxY = Math.max(maxY, p.y);
    }); });
    return ((maxX - minX) * (maxY - minY)) / (w * h);
  }

  _expectedStrokes(char) {
    var map = {
      'ㄱ':2,'ㄴ':2,'ㄷ':3,'ㄹ':5,'ㅁ':4,'ㅂ':4,'ㅅ':2,'ㅇ':1,'ㅈ':3,'ㅊ':4,
      'ㅋ':3,'ㅌ':4,'ㅍ':4,'ㅎ':3,
      'ㅏ':2,'ㅑ':3,'ㅓ':2,'ㅕ':3,'ㅗ':2,'ㅛ':3,'ㅜ':2,'ㅠ':3,'ㅡ':1,'ㅣ':1,
    };
    return map[char] || 2;
  }
}
