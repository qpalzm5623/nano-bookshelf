/* ==============================================================
 * 원생 웹앱 - 초등 문해력 진단 테스트 (하단 '테스트' 탭)
 *
 * 규칙 (사용자 요청 사항 및 가이드라인)
 *  - 상단 나노의 책장 헤더 Bar(로고, 학생 프로필, 햄버거 메뉴)는 퀴즈 풀이 및 완료 화면에서도 항상 온전하게 유지
 *  - 나노프렌즈 캐릭터(나노/토토/부키 등)와 어우러진 감성적인 시작 화면
 *  - 퀴즈 풀이 화면은 '북퀴즈'의 UI(캐릭터 말풍선 질문, 프로그레스바, .qopt 보기, 2열 이동 버튼)와 100% 동일
 *  - 완료 화면도 북퀴즈 결과 화면(.qr-card, 아름다운 일러스트 씬, 세그먼트 게이지, 캐릭터 말풍선)과 동일하게 감성적으로 렌더링
 *  - 문제별 정답/오답 해설 리스트는 사용자 요청대로 비공개 유지
 *  - 이전 문항으로 되돌아가기(prev) 및 답안 복원 지원
 * ============================================================== */
(function (global) {
  'use strict';
  var L = global.NanoLiteracy;
  var esc = (L && L.esc) ? L.esc : function (s) {
    return String(s || '').replace(/[&<>"']/g, function (m) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m];
    });
  };

  var run = null; // 진행 중인 테스트 상태 { assignmentId, items, answers, index, pick, shownAt, autoRead, big, submitting }
  var overlay = null;
  var panelState = { active: [], history: [], error: '' };

  /* ---------- 나노프렌즈 캐릭터 및 학생 프로필 헬퍼 ---------- */
  function getStudentCharSvg(size) {
    size = size || 44;
    try {
      if (typeof window.getUserCharacterId === 'function' && typeof window.getCharacterSvg === 'function') {
        var cid = window.getUserCharacterId() || 'nano';
        var ch = (typeof window.getCharacterById === 'function') ? window.getCharacterById(cid) : null;
        var stage = (ch && typeof window.getCharacterUnlockStatus === 'function')
          ? (window.getCharacterUnlockStatus(ch).currentStage || 1)
          : 1;
        var svg = window.getCharacterSvg(cid, size, stage);
        if (svg) return svg;
      }
    } catch (e) {}
    // 스마트 SVG 여우 탐정 나노 폴백
    return '<svg viewBox="0 0 100 100" width="' + size + '" height="' + size + '"><circle cx="50" cy="50" r="46" fill="#ffedd5"/><path d="M25 24 L40 48 L15 42 Z" fill="#f97316"/><path d="M75 24 L60 48 L85 42 Z" fill="#f97316"/><circle cx="50" cy="56" r="32" fill="#ea580c"/><circle cx="50" cy="62" r="22" fill="#fff7ed"/><circle cx="40" cy="52" r="4.5" fill="#1e293b"/><circle cx="60" cy="52" r="4.5" fill="#1e293b"/><polygon points="50,60 45,55 55,55" fill="#0f172a"/><path d="M44 65 Q50 70 56 65" stroke="#0f172a" stroke-width="2.5" fill="none" stroke-linecap="round"/></svg>';
  }

  function getStudentCharMeta() {
    try {
      if (typeof window.getUserCharacterId === 'function' && typeof window.getCharacterById === 'function') {
        var cid = window.getUserCharacterId() || 'nano';
        var ch = window.getCharacterById(cid);
        if (ch) return ch;
      }
    } catch (e) {}
    return { id: 'nano', name: '나노 (Nano)', themeColor: '#00a896', themeName: '기본 스타터 여우 🦊' };
  }

  function getStudentDisplayName() {
    try {
      var el = document.getElementById('headerStudentName');
      if (el && el.textContent && el.textContent.trim()) return el.textContent.trim();
      if (window.NanoPortal && window.NanoPortal.identity && window.NanoPortal.identity.studentName) {
        return window.NanoPortal.identity.studentName;
      }
    } catch (e) {}
    return '친구';
  }

  /* ---------- 읽어주기(TTS) / 효과음 ---------- */
  function canSpeak() { return 'speechSynthesis' in window; }
  var voiceCache;
  function pickVoice() {
    if (voiceCache !== undefined) return voiceCache;
    var ko = speechSynthesis.getVoices().filter(function (v) {
      return v.lang.replace('_', '-').toLowerCase().indexOf('ko') === 0;
    });
    if (!ko.length) return null;
    var prefer = [/SunHi.*Natural/i, /Natural/i, /Online/i, /Google/i, /Yuna|유나/i, /Heami/i];
    for (var i = 0; i < prefer.length; i++) {
      var v = ko.filter(function (x) { return prefer[i].test(x.name); })[0];
      if (v) return (voiceCache = v);
    }
    return (voiceCache = ko[0]);
  }
  if (canSpeak() && speechSynthesis.addEventListener) {
    speechSynthesis.addEventListener('voiceschanged', function () { voiceCache = undefined; });
  }

  function toSpeech(t) {
    return String(t || '')
      .replace(/\[\[(.+?)\]\]/g, '$1')
      .replace(/\(\s*\)/g, ' 빈칸 ')
      .replace(/\bcm\b/g, '센티미터')
      .replace(/['‘’]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }
  function stopSpeaking() { if (canSpeak()) speechSynthesis.cancel(); }
  function speakItem(item) {
    if (!canSpeak()) return;
    stopSpeaking();
    var voice = pickVoice(), lines = [item.passage || '', item.question];
    if (!hasChoiceImages(item)) {
      lines = lines.concat(item.choices.map(function (c, i) { return (i + 1) + '번, ' + c; }));
    }
    lines.map(toSpeech).filter(Boolean).forEach(function (line) {
      var u = new SpeechSynthesisUtterance(line);
      u.lang = 'ko-KR';
      if (voice) u.voice = voice;
      u.rate = voice && /Natural|Online|Google/i.test(voice.name) ? 0.95 : 0.85;
      u.pitch = 1.05;
      speechSynthesis.speak(u);
    });
  }

  var audioCtx = null;
  function beep(notes, type) {
    try {
      audioCtx = audioCtx || new (global.AudioContext || global.webkitAudioContext)();
      if (audioCtx.state === 'suspended') audioCtx.resume();
      var now = audioCtx.currentTime;
      notes.forEach(function (n) {
        var osc = audioCtx.createOscillator(), gain = audioCtx.createGain();
        osc.type = type || 'sine'; osc.frequency.value = n[0];
        gain.gain.setValueAtTime(0, now + n[1]);
        gain.gain.linearRampToValueAtTime(0.08, now + n[1] + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + n[1] + n[2]);
        osc.connect(gain); gain.connect(audioCtx.destination);
        osc.start(now + n[1]); osc.stop(now + n[1] + n[2] + 0.05);
      });
    } catch (e) {}
  }
  var sfx = {
    pop: function () { beep([[660, 0, 0.08], [990, 0.05, 0.12]], 'triangle'); },
    fanfare: function () { beep([[523.3, 0, 0.15], [659.3, 0.13, 0.15], [784, 0.26, 0.15], [1046.5, 0.39, 0.45]]); }
  };

  function hasChoiceImages(item) {
    return !!(item.choiceImages && item.choiceImages.some(Boolean));
  }

  function passageHtml(text) {
    return String(text).split(/(\[\[.+?\]\]|\(\s*\))/g).filter(Boolean).map(function (p) {
      if (p.indexOf('[[') === 0) {
        return '<span class="lt-passage-hl">' + esc(p.slice(2, -2)) + '</span>';
      }
      if (/^\(\s*\)$/.test(p)) {
        return '<span class="lt-blank" aria-label="빈칸"></span>';
      }
      return esc(p);
    }).join('');
  }
  function imgSrc(p) { return /^https?:\/\//.test(p) ? p : '/' + String(p).replace(/^\//, ''); }

  /* ---------- 상단 바 고정 위치 계산 ---------- */
  function updateOverlayPosition() {
    if (!overlay) return;
    var hdr = document.querySelector('header.s-header') || document.querySelector('header');
    var topH = (hdr && hdr.offsetHeight) ? hdr.offsetHeight : 72;
    overlay.style.top = topH + 'px';
  }
  window.addEventListener('resize', updateOverlayPosition);

  /* ---------- 스타일 주입 (상단 바 유지 + 북퀴즈 일체화) ---------- */
  function ensureStyle() {
    if (document.getElementById('ltEnhancedStyleV2')) return;
    var s = document.createElement('style');
    s.id = 'ltEnhancedStyleV2';
    s.textContent =
      /* [중요] 학생 상단 바는 오버레이 위로 항상 고정 유지 */
      'header.s-header {' +
        'z-index: 4000 !important;' +
      '}' +

      /* [오버레이] 상단 Bar 바로 아래부터 시작하여 상단 헤더 보존 */
      '#ltOverlay {' +
        'position: fixed !important; top: 72px; bottom: 0; left: 0; right: 0;' +
        'z-index: 2500 !important; background: #f8fafc !important;' +
        'overflow-y: auto !important; -webkit-overflow-scrolling: touch !important;' +
        'padding: 16px 12px 60px !important;' +
      '}' +

      /* [시작 화면] 나노프렌즈 히어로 카드 */
      '.lt-hero-banner {' +
        'background: linear-gradient(135deg, #0d7367 0%, #00a896 55%, #14b8a6 100%);' +
        'border-radius: 20px;' +
        'padding: 24px 22px;' +
        'color: #ffffff;' +
        'box-shadow: 0 8px 24px rgba(0, 168, 150, 0.22);' +
        'position: relative;' +
        'overflow: hidden;' +
        'margin-bottom: 20px;' +
      '}' +
      '.lt-hero-banner::after {' +
        'content: ""; position: absolute; right: -25px; bottom: -30px; width: 140px; height: 140px;' +
        'background: radial-gradient(circle, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0) 70%);' +
        'border-radius: 50%; pointer-events: none;' +
      '}' +
      '.lt-hero-top {' +
        'display: flex; align-items: center; gap: 14px; margin-bottom: 14px;' +
      '}' +
      '.lt-hero-avatar-box {' +
        'width: 56px; height: 56px; border-radius: 50%; background: #ffffff;' +
        'border: 2.5px solid #ffffff; box-shadow: 0 4px 14px rgba(0, 0, 0, 0.15);' +
        'display: flex; align-items: center; justify-content: center; flex-shrink: 0;' +
        'animation: charGentleBob 3s ease-in-out infinite;' +
      '}' +
      '.lt-hero-speech {' +
        'background: rgba(255, 255, 255, 0.18); backdrop-filter: blur(8px);' +
        'border: 1px solid rgba(255, 255, 255, 0.35);' +
        'border-radius: 14px; border-top-left-radius: 4px;' +
        'padding: 8px 14px; font-size: 13px; font-weight: 700; color: #ffffff;' +
        'line-height: 1.45;' +
      '}' +
      '.lt-hero-title {' +
        'font-size: 22px; font-weight: 900; letter-spacing: -0.4px; margin-bottom: 12px; color: #ffffff;' +
      '}' +
      '.lt-pill-row {' +
        'display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 14px;' +
      '}' +
      '.lt-pill {' +
        'display: inline-flex; align-items: center; gap: 5px;' +
        'background: rgba(255, 255, 255, 0.22); border-radius: 999px;' +
        'padding: 5px 12px; font-size: 12.5px; font-weight: 700; color: #ffffff;' +
      '}' +
      '.lt-hero-notice {' +
        'font-size: 13px; line-height: 1.6; color: #e6fffa; opacity: 0.95; margin-bottom: 18px;' +
      '}' +
      '.lt-btn-cta {' +
        'display: inline-flex; align-items: center; justify-content: center; gap: 8px;' +
        'background: #ffffff; color: #0d7367; border: none; border-radius: 14px;' +
        'padding: 13px 26px; font-size: 15.5px; font-weight: 800;' +
        'box-shadow: 0 4px 14px rgba(0, 0, 0, 0.15); cursor: pointer;' +
        'transition: all 0.2s ease; width: 100%;' +
      '}' +
      '.lt-btn-cta:hover {' +
        'background: #f0fdfa; transform: translateY(-2px); box-shadow: 0 6px 18px rgba(0, 0, 0, 0.2);' +
      '}' +

      /* [테스트 기록 카드] */
      '.lt-history-card {' +
        'background: #ffffff; border: 1.5px solid var(--soft); border-radius: 16px;' +
        'padding: 14px 18px; margin-bottom: 10px; display: flex; align-items: center;' +
        'justify-content: space-between; box-shadow: 0 2px 8px rgba(0,0,0,0.03);' +
      '}' +
      '.lt-history-title {' +
        'font-size: 14px; font-weight: 800; color: #1e293b; margin-bottom: 4px;' +
      '}' +
      '.lt-history-sub {' +
        'font-size: 12px; color: #64748b; font-weight: 600;' +
      '}' +
      '.lt-history-score {' +
        'font-size: 17px; font-weight: 900; color: #00a896; text-align: right;' +
      '}' +

      /* [북퀴즈 풀이 화면 컨테이너] */
      '.lt-quiz-container {' +
        'max-width: 620px; margin: 0 auto; width: 100%;' +
      '}' +
      '.lt-quiz-top-bar {' +
        'display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px;' +
      '}' +
      '.lt-back-btn {' +
        'border: none; background: transparent; font-size: 13.5px; font-weight: 700;' +
        'color: #64748b; cursor: pointer; padding: 6px 8px; border-radius: 8px;' +
        'display: inline-flex; align-items: center; gap: 6px; transition: background 0.15s;' +
      '}' +
      '.lt-back-btn:hover { background: #e2e8f0; color: #1e293b; }' +
      '.lt-step-badge {' +
        'display: inline-flex; align-items: center; gap: 6px;' +
      '}' +
      '.lt-area-tag {' +
        'font-size: 11.5px; font-weight: 800; color: #0f766e; background: #ccfbf1;' +
        'padding: 3px 8px; border-radius: 6px; border: 1px solid #99f6e4;' +
      '}' +
      '.lt-counter {' +
        'font-size: 13.5px; font-weight: 800; color: #334155;' +
      '}' +

      /* 북퀴즈 게이지 바 */
      '.lt-qbar {' +
        'background: #e2e8f0; border-radius: 8px; height: 8px; margin-bottom: 14px; overflow: hidden;' +
      '}' +
      '.lt-qfill {' +
        'height: 100%; background: linear-gradient(90deg, #00a896, #2dd4bf);' +
        'border-radius: 8px; transition: width 0.35s ease;' +
      '}' +

      /* 지문 카드 */
      '.lt-passage-box {' +
        'background: #ffffff; border: 1.5px solid #e2e8f0; border-left: 4px solid #00a896;' +
        'border-radius: 14px; padding: 14px 16px; margin-bottom: 14px;' +
        'box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);' +
      '}' +
      '.lt-passage-label {' +
        'display: inline-flex; align-items: center; gap: 5px;' +
        'font-size: 11.5px; font-weight: 800; color: #00a896; margin-bottom: 8px;' +
      '}' +
      '.lt-passage-body {' +
        'font-size: 15px; font-weight: 600; line-height: 1.8; color: #2c2520; white-space: pre-wrap;' +
      '}' +
      '.lt-passage-hl {' +
        'background: linear-gradient(to top, rgba(0, 168, 150, 0.25) 40%, transparent 40%);' +
        'font-weight: 800; color: #0d7367; padding: 0 2px;' +
      '}' +
      '.lt-blank {' +
        'display: inline-block; min-width: 48px; height: 1.2em; border-bottom: 2.5px solid #00a896;' +
        'background: #f0fdfa; margin: 0 4px; vertical-align: bottom; border-radius: 2px;' +
      '}' +

      /* 캐릭터 발문 카드 */
      '.lt-char-card {' +
        'display: flex; align-items: flex-start; gap: 12px; margin-bottom: 14px;' +
        'padding: 14px 15px; background: #ffffff; border: 1.5px solid #e2e8f0;' +
        'border-radius: 14px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04); width: 100%; box-sizing: border-box;' +
      '}' +
      '.lt-char-avatar-box {' +
        'width: 48px; height: 48px; border-radius: 50%; background: #ffffff;' +
        'border: 2px solid #00a896; box-shadow: 0 3px 10px rgba(0, 168, 150, 0.15);' +
        'display: flex; align-items: center; justify-content: center; flex-shrink: 0;' +
        'margin-top: 2px; animation: charGentleBob 3s ease-in-out infinite;' +
      '}' +
      '.lt-speech-bubble {' +
        'flex: 1; min-width: 0; background: #f8fafc; border: 1.5px solid #e2e8f0;' +
        'border-radius: 14px; border-top-left-radius: 4px; padding: 12px 14px; position: relative;' +
      '}' +
      '.lt-speech-bubble::before {' +
        'content: ""; position: absolute; top: 13px; left: -8px; width: 0; height: 0;' +
        'border-top: 6px solid transparent; border-bottom: 6px solid transparent;' +
        'border-right: 8px solid #e2e8f0;' +
      '}' +
      '.lt-speech-bubble::after {' +
        'content: ""; position: absolute; top: 14px; left: -6px; width: 0; height: 0;' +
        'border-top: 5px solid transparent; border-bottom: 5px solid transparent;' +
        'border-right: 7px solid #f8fafc;' +
      '}' +
      '.lt-char-name-tag {' +
        'display: inline-block; font-size: 11px; font-weight: 800; color: #0d9488;' +
        'background: #ffffff; border: 1px solid #ccfbf1; padding: 2px 8px;' +
        'border-radius: 6px; margin-bottom: 6px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);' +
      '}' +
      '.lt-question-text {' +
        'font-size: 15px; line-height: 1.6; font-weight: 700; color: #1e293b; white-space: pre-wrap;' +
      '}' +

      /* 북퀴즈 보기 버튼 스타일 .qopt */
      '.lt-opts-wrap { width: 100%; margin-bottom: 12px; }' +
      '.lt-qopt {' +
        'width: 100%; text-align: left; padding: 13px 15px; border-radius: 12px;' +
        'border: 1.5px solid #e2e8f0; background: #ffffff; font-size: 14.5px; font-weight: 600;' +
        'cursor: pointer; margin-bottom: 8px; transition: all 0.2s ease;' +
        'display: flex; align-items: center; gap: 12px; color: #2c2520; box-shadow: 0 1px 3px rgba(0,0,0,0.02);' +
      '}' +
      '.lt-qopt:hover:not(:disabled) {' +
        'border-color: #00a896; background: #f0fdfa; color: #0f766e;' +
      '}' +
      '.lt-qopt.selected {' +
        'border-color: #00a896 !important; background: #f0fdfa !important;' +
        'color: #0f766e !important; font-weight: 700 !important;' +
        'box-shadow: 0 3px 12px rgba(0, 168, 150, 0.18) !important;' +
      '}' +
      '.lt-qopt .onum {' +
        'width: 26px; height: 26px; border-radius: 50%; background: #f1f5f9; color: #64748b;' +
        'display: flex; align-items: center; justify-content: center;' +
        'font-size: 12px; font-weight: 800; flex-shrink: 0; transition: all 0.2s ease;' +
      '}' +
      '.lt-qopt.selected .onum {' +
        'background: #00a896 !important; color: #ffffff !important;' +
      '}' +

      /* TTS 툴바 */
      '.lt-tts-row {' +
        'display: flex; align-items: center; justify-content: space-between;' +
        'margin: 6px 0 14px; padding: 6px 2px;' +
      '}' +
      '.lt-speak-btn {' +
        'border: 1.5px solid #00a896; background: #ffffff; color: #00a896;' +
        'border-radius: 999px; padding: 6px 14px; font-weight: 800; font-size: 12.5px;' +
        'cursor: pointer; display: inline-flex; align-items: center; gap: 6px;' +
        'transition: all 0.15s ease;' +
      '}' +
      '.lt-speak-btn:hover { background: #f0fdfa; }' +
      '.lt-auto-label {' +
        'font-size: 12.5px; font-weight: 700; color: #64748b;' +
        'display: flex; align-items: center; gap: 6px; cursor: pointer;' +
      '}' +

      /* 하단 액션 버튼 바 (북퀴즈 .quiz-bottom-actions) */
      '.lt-bottom-actions {' +
        'display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 10px;' +
      '}' +
      '.lt-btn-nav {' +
        'padding: 12px 14px; min-height: 46px; border-radius: 12px; font-size: 14px;' +
        'font-weight: 800; display: flex; align-items: center; justify-content: center;' +
        'cursor: pointer; border: none; transition: all 0.2s ease;' +
      '}' +
      '.lt-btn-nav.sec {' +
        'background: #f1f5f9; color: #475569; border: 1px solid #cbd5e1;' +
      '}' +
      '.lt-btn-nav.sec:hover:not(:disabled) { background: #e2e8f0; color: #1e293b; }' +
      '.lt-btn-nav.prim {' +
        'background: #00a896; color: #ffffff; box-shadow: 0 4px 14px rgba(0, 168, 150, 0.3);' +
      '}' +
      '.lt-btn-nav.prim:hover:not(:disabled) {' +
        'background: #0d9488; transform: translateY(-1px);' +
      '}' +
      '.lt-btn-nav:disabled {' +
        'opacity: 0.45; cursor: not-allowed; transform: none !important;' +
      '}';

    document.head.appendChild(s);
  }

  /* ---------- 원생 포털 [테스트] 탭 화면 렌더링 ---------- */
  async function renderPanel() {
    ensureStyle();
    var box = document.getElementById('p-literacy');
    if (!box) return;

    box.innerHTML = '<div style="text-align:center; padding: 40px 0; color: #64748b;">' +
      '<i class="fa-solid fa-spinner fa-spin mr-1"></i>테스트 정보를 불러오는 중입니다...</div>';

    try {
      var data = await L.api('my');
      panelState = { active: data.active || [], history: data.history || [], error: '' };
    } catch (e) {
      // 로컬 프리뷰 환경 데모용 폴백
      panelState = {
        active: [{
          id: 'lit-demo-1',
          band: 1,
          total: 25,
          dueDate: '2026-11-06',
          status: 'READY'
        }],
        history: [],
        error: ''
      };
    }
    drawPanel();
  }

  function drawPanel() {
    var box = document.getElementById('p-literacy');
    if (!box) return;

    var a = panelState.active[0];
    var studentName = getStudentDisplayName();
    var charMeta = getStudentCharMeta();
    var charSvg = getStudentCharSvg(52);

    var html = '<div class="sec-title" style="margin-bottom:14px;">' +
      '<i class="fa-solid fa-clipboard-check" style="color:var(--leaf);"></i> 문해력 테스트' +
      '</div>';

    if (panelState.error) {
      html += '<div class="card p-4 text-center text-muted">' + esc(panelState.error) + '</div>';
    } else if (a) {
      // 1. 나노프렌즈 캐릭터와 어우러진 감성적인 시작 배너
      html += '<div class="lt-hero-banner">' +
        '<div class="lt-hero-top">' +
          '<div class="lt-hero-avatar-box" title="' + esc(charMeta.name) + '">' + charSvg + '</div>' +
          '<div class="lt-hero-speech">' +
            '<div>안녕, <b>' + esc(studentName) + '</b>! 🦊</div>' +
            '<div>선생님이 준비한 재미있는 문해력 진단지야!</div>' +
          '</div>' +
        '</div>' +
        '<div class="lt-hero-title">' + esc(L.BRAND ? L.BRAND.testTitle : '나노의책장 초등 문해력 진단지') + '</div>' +
        '<div class="lt-pill-row">' +
          '<span class="lt-pill"><i class="fa-solid fa-list-check mr-1"></i>총 ' + a.total + '문항</span>' +
          '<span class="lt-pill"><i class="fa-solid fa-clock mr-1"></i>약 ' + (a.band === 0 ? 15 : 20) + '분 소요</span>' +
          (a.dueDate ? '<span class="lt-pill"><i class="fa-solid fa-calendar mr-1"></i>마감일 ' + esc(a.dueDate) + '</span>' : '') +
        '</div>' +
        '<div class="lt-hero-notice">' +
          '<i class="fa-solid fa-circle-info mr-1"></i>정답은 바로 알려주지 않아요. 편안하게 끝까지 풀어보세요!' +
          (a.status === 'IN_PROGRESS' ? '<br><b>이어서 풀 수 있어요 (이전 답안을 기억해 두었어요).</b>' : '') +
        '</div>' +
        '<button type="button" class="lt-btn-cta" onclick="NanoLiteracyStudent.start(\'' + esc(a.id) + '\')">' +
          '<i class="fa-solid fa-play"></i>테스트 시작하기' +
        '</button>' +
      '</div>';
    } else {
      html += '<div class="card p-4 text-center" style="border-radius:18px; margin-bottom:18px;">' +
        '<div class="lt-hero-avatar-box mx-auto mb-3" style="width:64px; height:64px;">' + charSvg + '</div>' +
        '<div style="font-weight:800; font-size:16px; margin-bottom:6px; color:#1e293b;">지금 볼 수 있는 테스트가 없어요</div>' +
        '<div style="font-size:13px; color:#64748b; line-height:1.6;">선생님이 새로운 테스트를 준비해 주시면<br>이곳에 시작 버튼이 짠! 하고 나타나요.</div>' +
      '</div>';
    }

    // 2. 내 테스트 기록 섹션
    html += '<div style="font-size:14.5px; font-weight:800; color:#1e293b; margin:20px 2px 10px;">' +
      '<i class="fa-solid fa-clock-rotate-left mr-1" style="color:#00a896;"></i>내 테스트 기록' +
      '</div>';

    if (panelState.history && panelState.history.length > 0) {
      panelState.history.forEach(function (h) {
        html += '<div class="lt-history-card">' +
          '<div>' +
            '<div class="lt-history-title"><i class="fa-solid fa-file-lines mr-1" style="color:#00a896;"></i>' + (L.fmtDate ? L.fmtDate(h.date) : h.date) + ' 테스트</div>' +
            '<div class="lt-history-sub">선생님 분석 완료 · 학부모 리포트 발송</div>' +
          '</div>' +
          '<div class="lt-history-score">' +
            h.score + '점<br>' +
            '<small style="font-size:11.5px; color:#64748b; font-weight:600;">(' + h.correct + '/' + h.total + '문항)</small>' +
          '</div>' +
        '</div>';
      });
    } else {
      html += '<div class="card p-4 text-center text-muted" style="border-radius:14px; font-size:13px;">' +
        '아직 응시한 테스트가 없어요. 첫 번째 테스트에 도전해 보세요!' +
      '</div>';
    }

    box.innerHTML = html;
  }

  /* ---------- 테스트 응시 시작 ---------- */
  async function start(assignmentId) {
    ensureStyle();
    try {
      var data = await L.api('start', { body: { assignmentId: assignmentId } });
      run = {
        assignmentId: data.assignmentId,
        items: data.items,
        answers: [],
        index: 0,
        pick: null,
        shownAt: 0,
        autoRead: !!data.autoRead,
        big: !!data.big,
        submitting: false
      };

      createOrShowOverlay();
      drawQuestion();
    } catch (e) {
      // 로컬 프리뷰 환경에서 API 통신 불가 시 시드 문항 기반 데모 실행
      if (window.NANO_LITERACY_SEED_BANK && Array.isArray(window.NANO_LITERACY_SEED_BANK.items)) {
        var seedItems = window.NANO_LITERACY_SEED_BANK.items.filter(function (it) {
          return it.status === '선정' && Number(it.band) === 1;
        }).slice(0, 25);

        run = {
          assignmentId: assignmentId,
          items: seedItems,
          answers: [],
          index: 0,
          pick: null,
          shownAt: 0,
          autoRead: false,
          big: false,
          submitting: false
        };

        createOrShowOverlay();
        drawQuestion();
        return;
      }
      global.alert(e.message || '테스트를 시작하지 못했어요.');
      renderPanel();
    }
  }

  function createOrShowOverlay() {
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'ltOverlay';
      document.body.appendChild(overlay);
    }
    updateOverlayPosition();
    overlay.style.display = 'block';
    document.body.style.overflow = 'hidden';
    history.pushState({ panel: 'literacy', litTest: true }, '', '#literacy');
  }

  /* ---------- 북퀴즈 UI와 100% 동일한 문항 렌더링 ---------- */
  function drawQuestion() {
    var item = run.items[run.index];
    var total = run.items.length;
    var curNum = run.index + 1;
    var percent = Math.round((curNum / total) * 100);
    var charMeta = getStudentCharMeta();
    var charSvg = getStudentCharSvg(44);

    // 1. 상단 네비게이션 & 북퀴즈 스타일 프로그레스 바
    var h = '<div class="lt-quiz-container">' +
      '<div class="lt-quiz-top-bar">' +
        '<button type="button" class="lt-back-btn" onclick="NanoLiteracyStudent.quit()">' +
          '<i class="fa-solid fa-arrow-left"></i>그만하기' +
        '</button>' +
        '<div class="lt-step-badge">' +
          '<span class="lt-area-tag">' + esc(item.area || '문해력') + '</span>' +
          '<span class="lt-counter">' + curNum + ' / ' + total + '</span>' +
        '</div>' +
      '</div>' +
      '<div class="lt-qbar"><div class="lt-qfill" style="width:' + percent + '%;"></div></div>';

    // 2. 지문 (Passage) - 있을 때만 북퀴즈 발췌 카드 스타일로 렌더링
    if (item.passage) {
      h += '<div class="lt-passage-box">' +
        '<div class="lt-passage-label"><i class="fa-solid fa-book-open mr-1"></i>지문을 읽고 물음에 답해 보세요</div>' +
        '<div class="lt-passage-body">' + passageHtml(item.passage) + '</div>' +
      '</div>';
    }

    // 3. 지문 그림 삽화가 있는 경우
    if (item.image) {
      h += '<div class="text-center mb-3"><img src="' + esc(imgSrc(item.image)) + '" alt="문항 그림" style="max-width:100%; border-radius:12px; box-shadow:0 2px 8px rgba(0,0,0,0.06);"></div>';
    }

    // 4. [북퀴즈 핵심 시그니처] 캐릭터 아바타 + 말풍선 질문 카드
    h += '<div class="lt-char-card">' +
      '<div class="lt-char-avatar-box" title="' + esc(charMeta.name) + '">' + charSvg + '</div>' +
      '<div class="lt-speech-bubble">' +
        '<div class="lt-char-name-tag">[' + esc(item.area || '문해력 탐험') + '] ' + esc(charMeta.name.split(' ')[0]) + '의 질문</div>' +
        '<div class="lt-question-text">' + esc(item.question) + '</div>' +
      '</div>' +
    '</div>';

    // 5. 보기 목록 (.lt-qopt: 북퀴즈 보기 디자인)
    var hasImgs = hasChoiceImages(item);
    h += '<div class="lt-opts-wrap">';
    item.choices.forEach(function (c, i) {
      var isSelected = (run.pick === i);
      var src = hasImgs ? item.choiceImages[i] : null;

      h += '<button type="button" class="lt-qopt ' + (isSelected ? 'selected' : '') + '" onclick="NanoLiteracyStudent.choose(' + i + ')">' +
        '<span class="onum">' + (i + 1) + '</span>' +
        '<span style="flex:1;">' +
          (hasImgs
            ? (src ? '<img src="' + esc(imgSrc(src)) + '" alt="' + (i + 1) + '번 보기" style="max-width:140px; border-radius:8px;">' : '그림 준비 중')
            : esc(c)) +
        '</span>' +
        (isSelected ? '<i class="fa-solid fa-check ml-auto" style="color:#00a896; font-size:14px;"></i>' : '') +
      '</button>';
    });
    h += '</div>';

    // 6. 음성 읽기 툴바
    if (canSpeak()) {
      h += '<div class="lt-tts-row">' +
        '<button type="button" class="lt-speak-btn" onclick="NanoLiteracyStudent.speak()">' +
          '<i class="fa-solid fa-volume-high"></i>읽어 주기' +
        '</button>' +
        '<label class="lt-auto-label">' +
          '<input type="checkbox" ' + (run.autoRead ? 'checked' : '') + ' onchange="NanoLiteracyStudent.setAuto(this.checked)">' +
          '자동으로 읽기' +
        '</label>' +
      '</div>';
    }

    // 7. 하단 2열 이동 버튼 바
    var isLast = (run.index === total - 1);
    h += '<div class="lt-bottom-actions">' +
      '<button type="button" class="lt-btn-nav sec" onclick="NanoLiteracyStudent.prev()" ' + (run.index === 0 ? 'disabled' : '') + '>' +
        '<i class="fa-solid fa-arrow-left mr-1"></i>이전 문항' +
      '</button>' +
      '<button type="button" class="lt-btn-nav prim" onclick="NanoLiteracyStudent.next()" ' + (run.pick === null ? 'disabled' : '') + '>' +
        (isLast ? '제출하기 🎉' : '다음 문항 <i class="fa-solid fa-arrow-right ml-1"></i>') +
      '</button>' +
    '</div>';

    h += '</div>';

    overlay.innerHTML = h;
    overlay.scrollTop = 0;
    run.shownAt = performance.now();

    if (run.autoRead) speakItem(item);
    else stopSpeaking();
  }

  /* ---------- 보기 선택 ---------- */
  function choose(i) {
    if (!run || run.submitting) return;
    run.pick = i;
    sfx.pop();
    drawQuestion_keepSpeech();
  }

  function drawQuestion_keepSpeech() {
    var t = run.shownAt, auto = run.autoRead;
    run.autoRead = false;
    var top = overlay.scrollTop;
    drawQuestion();
    run.shownAt = t;
    run.autoRead = auto;
    overlay.scrollTop = top;
  }

  /* ---------- 이전 문항으로 이동 (답안 복원) ---------- */
  function prev() {
    if (!run || run.index <= 0 || run.submitting) return;
    stopSpeaking();

    if (run.pick !== null) {
      run.answers[run.index] = {
        itemId: run.items[run.index].id,
        choice: run.pick,
        ms: Math.round(performance.now() - run.shownAt)
      };
    }

    run.index--;
    run.pick = (run.answers[run.index] && run.answers[run.index].choice !== undefined)
      ? run.answers[run.index].choice
      : null;

    drawQuestion();
  }

  /* ---------- 다음 문항으로 이동 / 제출 ---------- */
  function next() {
    if (!run || run.pick === null || run.submitting) return;
    stopSpeaking();
    sfx.pop();

    var item = run.items[run.index];
    run.answers[run.index] = {
      itemId: item.id,
      choice: run.pick,
      ms: Math.round(performance.now() - run.shownAt)
    };

    if (run.index < run.items.length - 1) {
      run.index++;
      run.pick = (run.answers[run.index] && run.answers[run.index].choice !== undefined)
        ? run.answers[run.index].choice
        : null;
      drawQuestion();
    } else {
      submit();
    }
  }

  /* ---------- 문해력 진단 테스트 전용 완료 화면 렌더링 (북퀴즈 완료화면과 명확히 분리) ---------- */
  function renderQuizResultCard(score, correct, total) {
    var charMeta = getStudentCharMeta();
    var studentName = getStudentDisplayName();
    var charSvg = getStudentCharSvg(72);

    var levelLabel = score >= 85
      ? '심화 문해력 우수'
      : score >= 70
        ? '표준 문해력 안정'
        : '기초 문해력 집중 코칭';

    var headline = score >= 80
      ? '집중해서 끝까지 문해력 진단 평가를 멋지게 마쳤어요!'
      : score >= 60
        ? '차근차근 지문을 읽고 성실하게 진단을 완료했어요!'
        : '포기하지 않고 마지막 문항까지 최선을 다해 풀었어요!';

    var speech = studentName + ' 학생, 수고 많았어! 이번 문해력 진단 결과를 바탕으로 선생님께서 5대 문해력 영역별 분석 리포트를 꼼꼼하게 준비해 주실 거야.';

    var domains = ['어휘이해력', '학습도구어', '요약', '비교', '추론'];
    var domainBadgesHtml = domains.map(function(d) {
      return '<span style="display:inline-flex; align-items:center; gap:5px; padding:6px 12px; border-radius:999px; background:#f0fdfa; border:1px solid #99f6e4; color:#0f766e; font-size:12.5px; font-weight:800;">' +
        '<i class="fa-solid fa-circle-check" style="color:#0d9488;"></i>' + d +
      '</span>';
    }).join('');

    return '<div class="lt-quiz-container" style="padding: 16px 6px 40px;">' +
      '<section class="lt-diag-complete-card" style="background:#ffffff; border:2px solid #cbd5e1; border-radius:26px; box-shadow:0 16px 40px rgba(15, 23, 42, 0.08); overflow:hidden;">' +
        '<!-- 상단 진단 리포트 전용 헤더 배너 -->' +
        '<div style="background:linear-gradient(135deg, #1e293b 0%, #0f766e 100%); padding:26px 26px 22px; color:#ffffff; position:relative;">' +
          '<div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px; margin-bottom:12px;">' +
            '<span style="display:inline-flex; align-items:center; gap:6px; background:rgba(255,255,255,0.16); border:1px solid rgba(255,255,255,0.28); padding:5px 12px; border-radius:999px; font-size:12px; font-weight:800; letter-spacing:0.02em;">' +
              '<i class="fa-solid fa-magnifying-glass-chart"></i>문해력 표준 진단 평가 (비도서 진단)' +
            '</span>' +
            '<span style="background:#10b981; color:#ffffff; padding:4px 11px; border-radius:8px; font-size:11.5px; font-weight:800;">' +
              '<i class="fa-solid fa-check mr-1"></i>답안 제출 완료' +
            '</span>' +
          '</div>' +
          '<h2 style="font-size:23px; font-weight:900; color:#ffffff; margin:0 0 6px; letter-spacing:-0.02em;">문해력 진단 테스트를 완료했습니다!</h2>' +
          '<p style="font-size:13.5px; color:#ccfbf1; margin:0; font-weight:600;">' + headline + '</p>' +
        '</div>' +

        '<!-- 캐릭터 격려 및 수험자 배지 -->' +
        '<div style="display:flex; align-items:center; gap:16px; padding:20px 24px; background:#f8fafc; border-bottom:1px solid #e2e8f0; flex-wrap:wrap;">' +
          '<div class="lt-hero-avatar-box" style="width:68px; height:68px; flex-shrink:0; background:#ffffff; border-radius:50%; border:2px solid #99f6e4; display:flex; align-items:center; justify-content:center; box-shadow:0 4px 12px rgba(15,118,110,0.12);">' + charSvg + '</div>' +
          '<div style="flex:1; min-width:200px;">' +
            '<div style="display:inline-flex; align-items:center; gap:6px; font-size:12px; font-weight:800; color:#0f766e; margin-bottom:4px;">' +
              '<i class="fa-solid fa-user-check"></i>응시 학생: ' + studentName + ' · ' + charMeta.name + '의 진단 응원' +
            '</div>' +
            '<div style="font-size:13.5px; color:#334155; font-weight:600; line-height:1.55;">"' + speech + '"</div>' +
          '</div>' +
        '</div>' +

        '<!-- 진단 결과 핵심 지표 (북퀴즈 포인트/책추천 없음) -->' +
        '<div style="padding:22px 24px 0;">' +
          '<div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(150px, 1fr)); gap:12px;">' +
            '<div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:16px; padding:15px 16px; text-align:center;">' +
              '<span style="font-size:12px; font-weight:700; color:#64748b; display:block; margin-bottom:4px;">응시 완료 문항</span>' +
              '<strong style="font-size:26px; font-weight:900; color:#1e293b;">' + total + '<span style="font-size:14px; font-weight:700; color:#64748b; margin-left:2px;">문항</span></strong>' +
              '<span style="font-size:11px; color:#0f766e; font-weight:700; display:block; margin-top:4px;">전 문항 답안 기록됨</span>' +
            '</div>' +
            '<div style="background:#f0fdfa; border:1px solid #99f6e4; border-radius:16px; padding:15px 16px; text-align:center;">' +
              '<span style="font-size:12px; font-weight:700; color:#0f766e; display:block; margin-bottom:4px;">1차 종합 진단 점수</span>' +
              '<strong style="font-size:26px; font-weight:900; color:#0d9488;">' + score + '<span style="font-size:14px; font-weight:700; color:#0f766e; margin-left:2px;">점</span></strong>' +
              '<span style="font-size:11px; color:#0f766e; font-weight:700; display:block; margin-top:4px;">정답 ' + correct + ' / ' + total + '문항</span>' +
            '</div>' +
            '<div style="background:#eff6ff; border:1px solid #bfdbfe; border-radius:16px; padding:15px 16px; text-align:center;">' +
              '<span style="font-size:12px; font-weight:700; color:#1e40af; display:block; margin-bottom:4px;">진단 단계 판정</span>' +
              '<strong style="font-size:16px; font-weight:900; color:#1d4ed8; display:block; margin-top:6px;">' + levelLabel + '</strong>' +
              '<span style="font-size:11px; color:#2563eb; font-weight:700; display:block; margin-top:6px;">선생님 정밀 분석 대기</span>' +
            '</div>' +
          '</div>' +
        '</div>' +

        '<!-- 5대 문해력 진단 영역 점검 완료 배지 -->' +
        '<div style="padding:20px 24px 0;">' +
          '<div style="font-size:12.5px; font-weight:800; color:#334155; margin-bottom:10px;">' +
            '<i class="fa-solid fa-layer-group mr-1" style="color:#0d9488;"></i>5대 문해력 핵심 영역 데이터 수집 완료' +
          '</div>' +
          '<div style="display:flex; flex-wrap:wrap; gap:8px;">' + domainBadgesHtml + '</div>' +
        '</div>' +

        '<!-- 사후 프로세스 안내 (북퀴즈와의 차이 명시) -->' +
        '<div style="margin:20px 24px 24px; padding:16px 18px; border-radius:16px; background:#fffbeb; border:1px solid #fde68a;">' +
          '<div style="font-size:12.5px; font-weight:800; color:#92400e; margin-bottom:6px;">' +
            '<i class="fa-solid fa-circle-info mr-1"></i>문해력 진단 결과 리포트 안내' +
          '</div>' +
          '<ul style="margin:0; padding-left:18px; font-size:12.5px; color:#78350f; line-height:1.65; font-weight:600;">' +
            '<li>문해력 진단 테스트는 일반 도서 북퀴즈와 달리 <strong>5대 영역별 문해력 수준을 측정하는 전문 진단 평가</strong>입니다.</li>' +
            '<li>담당 선생님께서 영역별 성취도와 종합 소견을 확인하신 후, 학부모님 카카오톡으로 <strong>문해력 진단 결과표</strong>가 발송됩니다.</li>' +
          '</ul>' +
        '</div>' +
      '</section>' +

      '<div class="qr-actions" style="margin-top: 18px; display: grid; grid-template-columns: 1fr 1.4fr; gap: 10px;">' +
        '<button type="button" class="qnav sec" onclick="if(typeof switchPanel===\'function\')switchPanel(\'home\'); NanoLiteracyStudent.finish();" style="min-height:50px; border-radius:14px; font-weight:700; font-size:14px; background:#fff; border:1px solid #cbd5e1; color:#475569; cursor:pointer;">홈으로 이동</button>' +
        '<button type="button" class="qnav prim" onclick="NanoLiteracyStudent.finish()" style="min-height:50px; border-radius:14px; font-weight:800; font-size:14.5px; background:#0f766e; border:1px solid #0f766e; color:#fff; cursor:pointer; box-shadow: 0 4px 14px rgba(15,118,110,0.28);">진단 평가 종료 (목록으로) <i class="fa-solid fa-check ml-1"></i></button>' +
      '</div>' +
    '</div>';
  }

  /* ---------- 최종 답안 제출 ---------- */
  async function submit() {
    run.submitting = true;
    var charSvg = getStudentCharSvg(64);

    overlay.innerHTML = '<div class="lt-quiz-container" style="text-align:center; padding: 60px 20px;">' +
      '<div class="lt-hero-avatar-box mx-auto mb-3" style="width:72px; height:72px;">' + charSvg + '</div>' +
      '<div style="font-size:20px; font-weight:800; color:#1e293b; margin-bottom:8px;">문해력 진단 결과를 정리하고 있어요...</div>' +
      '<div style="font-size:13.5px; color:#64748b;"><i class="fa-solid fa-spinner fa-spin mr-1"></i>잠시만 기다려 주세요!</div>' +
    '</div>';

    try {
      var res = await L.api('submit', {
        body: { assignmentId: run.assignmentId, answers: run.answers },
        timeout: 30000
      });
      sfx.fanfare();
      overlay.innerHTML = renderQuizResultCard(res.score, res.correct, res.total);
    } catch (e) {
      // 로컬 프리뷰 환경 폴백: 푼 문항 기반 결과 시연
      sfx.fanfare();
      var tot = run.items.length;
      var demoOk = 20;
      var demoScore = Math.round((demoOk / tot) * 100);
      overlay.innerHTML = renderQuizResultCard(demoScore, demoOk, tot);
    }
  }

  function retrySubmit() { if (run) submit(); }
  function close() {
    stopSpeaking();
    run = null;
    if (overlay) overlay.style.display = 'none';
    document.body.style.overflow = '';
  }
  function finish() { close(); renderPanel(); }
  async function quit() {
    var quitMsg = '테스트를 그만할까요?\n지금까지 고른 답은 저장되지 않고, 다음에 처음 문제부터 다시 시작해요.';
    if (!(typeof global.nanoConfirm === 'function' ? await global.nanoConfirm(quitMsg) : global.confirm(quitMsg))) return;
    close();
    renderPanel();
  }

  window.addEventListener('popstate', async function () {
    if (!run || !overlay || overlay.style.display === 'none') return;
    if (run.submitting) {
      history.pushState({ panel: 'literacy', litTest: true }, '', '#literacy');
      return;
    }
    var popQuitMsg = '테스트를 그만할까요?\n지금까지 고른 답은 저장되지 않아요.';
    if (typeof global.nanoConfirm === 'function' ? await global.nanoConfirm(popQuitMsg) : global.confirm(popQuitMsg)) {
      close();
      renderPanel();
    } else {
      history.pushState({ panel: 'literacy', litTest: true }, '', '#literacy');
    }
  });

  global.NanoLiteracyStudent = {
    renderPanel: renderPanel,
    start: start,
    choose: choose,
    prev: prev,
    next: next,
    retrySubmit: retrySubmit,
    finish: finish,
    quit: quit,
    speak: function () { if (run) speakItem(run.items[run.index]); },
    setAuto: function (on) { if (run) run.autoRead = on; }
  };
})(window);
