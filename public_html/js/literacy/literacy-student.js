/* ==============================================================
 * 원생 웹앱 - 문해력 테스트 (하단 '테스트' 탭)
 *
 * 규칙 (관리자 요청 사항)
 *  - 관리자가 테스트를 부여했을 때만 [테스트 시작하기] 버튼이 보인다.
 *  - 목록에는 응시 날짜와 점수만 보이고, 결과지(리포트)는 학생에게 공개하지 않는다.
 *
 * 보안: 문항은 서버가 정답을 제거해서 내려주고(/api/literacy?action=start),
 *       채점도 서버가 한다(action=submit). 이 파일에는 정답 정보가 없다.
 * 원본 화면: Korean Test/byeolbyeol-literacy/components/TestRunner.tsx
 * ============================================================== */
(function (global) {
  'use strict';
  var L = global.NanoLiteracy;
  var esc = L.esc;
  var run = null; // 진행 중인 테스트 { assignmentId, items, answers, index, startedAt, autoRead, big }
  var overlay = null, panelState = { active: [], history: [], error: '' };

  /* ---------- 읽어주기(TTS) / 효과음: 브라우저 내장 기능, 비용 없음 ---------- */
  function canSpeak() { return 'speechSynthesis' in window; }
  var voiceCache;
  function pickVoice() {
    if (voiceCache !== undefined) return voiceCache;
    var ko = speechSynthesis.getVoices().filter(function (v) { return v.lang.replace('_', '-').toLowerCase().indexOf('ko') === 0; });
    if (!ko.length) return null; // 목록이 아직 안 불러와졌으면 다음에 다시 고른다
    // 자연스러운 음성 우선: 신경망(Natural/Online) → 구글 → 그 밖의 한국어
    var prefer = [/SunHi.*Natural/i, /Natural/i, /Online/i, /Google/i, /Yuna|유나/i, /Heami/i];
    for (var i = 0; i < prefer.length; i++) { var v = ko.filter(function (x) { return prefer[i].test(x.name); })[0]; if (v) return (voiceCache = v); }
    return (voiceCache = ko[0]);
  }
  if (canSpeak() && speechSynthesis.addEventListener) speechSynthesis.addEventListener('voiceschanged', function () { voiceCache = undefined; });
  // 화면 표기를 소리 내어 읽기 좋은 말로 바꾼다
  function toSpeech(t) {
    return String(t || '').replace(/\[\[(.+?)\]\]/g, '$1').replace(/\(\s*\)/g, ' 빈칸 ').replace(/\bcm\b/g, '센티미터').replace(/['‘’]/g, '').replace(/\s+/g, ' ').trim();
  }
  function stopSpeaking() { if (canSpeak()) speechSynthesis.cancel(); }
  function speakItem(item) {
    if (!canSpeak()) return;
    stopSpeaking();
    var voice = pickVoice(), lines = [item.passage || '', item.question];
    // 보기가 그림인 문항은 보기 번호를 읽으면 정답이 드러나므로 문제까지만 읽는다
    if (!hasChoiceImages(item)) lines = lines.concat(item.choices.map(function (c, i) { return (i + 1) + '번, ' + c; }));
    lines.map(toSpeech).filter(Boolean).forEach(function (line) {
      var u = new SpeechSynthesisUtterance(line);
      u.lang = 'ko-KR'; if (voice) u.voice = voice;
      u.rate = voice && /Natural|Online|Google/i.test(voice.name) ? 0.95 : 0.85; u.pitch = 1.05;
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
        gain.gain.setValueAtTime(0, now + n[1]); gain.gain.linearRampToValueAtTime(0.08, now + n[1] + 0.01); gain.gain.exponentialRampToValueAtTime(0.0001, now + n[1] + n[2]);
        osc.connect(gain); gain.connect(audioCtx.destination); osc.start(now + n[1]); osc.stop(now + n[1] + n[2] + 0.05);
      });
    } catch (e) { /* 소리를 낼 수 없는 기기는 조용히 넘어간다 */ }
  }
  // 정답 여부를 드러내지 않는 중립 효과음만 사용 (진단 중 힌트가 되지 않도록)
  var sfx = { pop: function () { beep([[660, 0, 0.08], [990, 0.05, 0.12]], 'triangle'); }, fanfare: function () { beep([[523.3, 0, 0.15], [659.3, 0.13, 0.15], [784, 0.26, 0.15], [1046.5, 0.39, 0.45]]); } };

  function hasChoiceImages(item) { return !!(item.choiceImages && item.choiceImages.some(Boolean)); }
  // 지문 표기: [[말]] = 밑줄, (   ) = 빈칸
  function passageHtml(text) {
    return String(text).split(/(\[\[.+?\]\]|\(\s*\))/g).filter(Boolean).map(function (p) {
      if (p.indexOf('[[') === 0) return '<u>' + esc(p.slice(2, -2)) + '</u>';
      if (/^\(\s*\)$/.test(p)) return '<span class="lt-blank" aria-label="빈칸"></span>';
      return esc(p);
    }).join('');
  }
  function imgSrc(p) { return /^https:\/\//.test(p) ? p : '/' + String(p).replace(/^\//, ''); }

  /* ---------- 탭 화면 ---------- */
  function ensureStyle() {
    if (document.getElementById('ltStyle')) return;
    var s = document.createElement('style'); s.id = 'ltStyle';
    s.textContent =
      '.lt-card{background:#fff;border:1px solid var(--soft);border-radius:18px;padding:20px;box-shadow:0 4px 16px rgba(58,46,38,.05);margin-bottom:14px}' +
      '.lt-hero{background:linear-gradient(135deg,#16645b,#1f8a7e 60%,#3ab3a4);color:#fff;border:0}' +
      '.lt-btn{display:inline-flex;align-items:center;justify-content:center;gap:6px;border:0;border-radius:999px;padding:13px 26px;font-weight:800;font-size:16px;background:#fff;color:#16645b;cursor:pointer;font-family:inherit}' +
      '.lt-btn.solid{background:var(--leaf);color:#fff}.lt-btn:disabled{background:#e5e7eb;color:#9ca3af;cursor:default}' +
      '.lt-row{display:flex;justify-content:space-between;align-items:center;padding:12px 0;border-bottom:1px solid var(--soft);font-size:14px}.lt-row:last-child{border:0}' +
      '.lt-score{font-weight:900;color:var(--leaf);font-size:16px}' +
      '#ltOverlay{position:fixed;inset:0;z-index:3000;background:#f8f7f4;overflow:auto;-webkit-overflow-scrolling:touch}' +
      '.lt-shell{max-width:720px;margin:0 auto;padding:18px 16px 60px}' +
      '.lt-top{display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;font-size:13px;font-weight:700;color:var(--muted)}' +
      '.lt-bar{height:8px;border-radius:99px;background:#d9efec;overflow:hidden;margin:6px 0 16px}.lt-bar i{display:block;height:100%;background:var(--leaf);transition:width .3s}' +
      '.lt-passage{background:#fcfbfa;border-left:4px solid var(--leaf);border-radius:0 12px 12px 0;padding:14px 16px;margin-bottom:14px;line-height:1.85;white-space:pre-line;font-size:16px}' +
      '.lt-big .lt-passage{font-size:20px}.lt-big .lt-q{font-size:22px}.lt-big .lt-choice{font-size:19px;padding:16px}' +
      '.lt-blank{display:inline-block;min-width:54px;border-bottom:2.5px solid var(--text);margin:0 4px;height:1em}' +
      '.lt-q{font-size:18px;font-weight:800;line-height:1.55;margin:4px 0 14px}' +
      '.lt-choices{display:grid;gap:10px}.lt-choices.img{grid-template-columns:repeat(auto-fit,minmax(150px,1fr))}' +
      '.lt-choice{display:flex;align-items:center;gap:12px;text-align:left;width:100%;border:2px solid var(--soft);background:#fff;border-radius:14px;padding:13px 14px;font-size:16px;font-family:inherit;color:var(--text);cursor:pointer}' +
      '.lt-choice[aria-pressed=true]{border-color:var(--leaf);background:var(--leaf-soft);font-weight:700}' +
      '.lt-choice .n{flex:none;width:30px;height:30px;border-radius:50%;background:#f0ede6;display:grid;place-items:center;font-weight:800;font-size:14px}' +
      '.lt-choice[aria-pressed=true] .n{background:var(--leaf);color:#fff}.lt-choice img{max-width:100%;border-radius:10px}' +
      '.lt-fig img{max-width:100%;border-radius:12px;margin-bottom:12px}' +
      '.lt-actions{display:flex;justify-content:space-between;align-items:center;gap:10px;margin-top:18px;flex-wrap:wrap}' +
      '.lt-speak{border:1.5px solid var(--leaf);background:#fff;color:var(--leaf);border-radius:999px;padding:8px 14px;font-weight:800;font-size:13px;cursor:pointer;font-family:inherit}' +
      '.lt-set{display:inline-block;font-size:12px;font-weight:700;color:var(--leaf);background:var(--leaf-soft);border-radius:999px;padding:3px 10px;margin-bottom:10px}';
    document.head.appendChild(s);
  }

  async function renderPanel() {
    ensureStyle();
    var box = document.getElementById('p-literacy');
    if (!box) return;
    box.innerHTML = '<div class="lt-card" style="text-align:center;color:var(--muted)">불러오는 중…</div>';
    try {
      var data = await L.api('my');
      panelState = { active: data.active || [], history: data.history || [], error: '' };
    } catch (e) { panelState = { active: [], history: [], error: e.message || '불러오지 못했어요.' }; }
    drawPanel();
  }
  function drawPanel() {
    var box = document.getElementById('p-literacy'), a = panelState.active[0];
    var html = '<div style="font-size:19px;font-weight:900;margin:2px 2px 12px"><i class="fa-solid fa-clipboard-list" style="color:var(--leaf);margin-right:6px"></i>문해력 테스트</div>';
    if (panelState.error) {
      html += '<div class="lt-card" style="text-align:center;color:var(--muted)">' + esc(panelState.error) + '</div>';
    } else if (a) {
      // 관리자가 배정한 테스트가 있을 때만 시작 버튼을 보여준다
      html += '<div class="lt-card lt-hero"><div style="font-size:13px;font-weight:700;opacity:.9">선생님이 테스트를 준비했어요!</div>' +
        '<div style="font-size:21px;font-weight:900;margin:4px 0 8px">' + esc(L.BRAND.testTitle) + '</div>' +
        '<div style="font-size:13.5px;line-height:1.7;opacity:.95">총 ' + a.total + '문항 · 약 ' + (a.band === 0 ? 15 : 20) + '분<br>' + (a.dueDate ? '마감일 ' + esc(a.dueDate) + '<br>' : '') +
        '정답은 바로 알려주지 않아요. 편안하게 끝까지 풀어 보세요.' + (a.status === 'IN_PROGRESS' ? '<br><b>이어서 풀 수 있어요 (처음 문제부터 다시 시작해요).</b>' : '') + '</div>' +
        '<div style="margin-top:16px"><button class="lt-btn" onclick="NanoLiteracyStudent.start(\'' + esc(a.id) + '\')"><i class="fa-solid fa-play"></i>테스트 시작하기</button></div></div>';
    } else {
      html += '<div class="lt-card" style="text-align:center;padding:30px 20px"><div style="font-size:38px;margin-bottom:6px">📝</div>' +
        '<div style="font-weight:800;font-size:16px;margin-bottom:4px">지금 볼 수 있는 테스트가 없어요</div>' +
        '<div style="font-size:13px;color:var(--muted);line-height:1.6">선생님이 테스트를 준비해 주시면<br>이곳에 시작 버튼이 나타나요.</div></div>';
    }
    // 이력: 날짜와 점수만 (리포트는 비공개)
    html += '<div style="font-weight:800;font-size:15px;margin:18px 2px 8px">내 테스트 기록</div><div class="lt-card" style="padding:6px 18px">';
    html += panelState.history.length ? panelState.history.map(function (h) {
      return '<div class="lt-row"><span>' + L.fmtDate(h.date) + ' 테스트</span><span class="lt-score">' + h.correct + ' / ' + h.total + ' <small style="color:var(--muted);font-weight:700">(' + h.score + '점)</small></span></div>';
    }).join('') : '<div style="padding:18px 0;text-align:center;color:var(--muted);font-size:13px">아직 본 테스트가 없어요.</div>';
    box.innerHTML = html + '</div>';
  }

  /* ---------- 테스트 진행 ---------- */
  async function start(assignmentId) {
    ensureStyle();
    try {
      var data = await L.api('start', { body: { assignmentId: assignmentId } });
      run = { assignmentId: data.assignmentId, items: data.items, answers: [], index: 0, pick: null, shownAt: 0, autoRead: !!data.autoRead, big: !!data.big, submitting: false };
      if (!overlay) { overlay = document.createElement('div'); overlay.id = 'ltOverlay'; document.body.appendChild(overlay); }
      overlay.style.display = 'block';
      document.body.style.overflow = 'hidden';
      // 뒤로가기 한 번에 로그인/화면이 풀리지 않도록 히스토리를 한 칸 쌓는다 (popstate 에서 확인창)
      history.pushState({ panel: 'literacy', litTest: true }, '', '#literacy');
      drawQuestion();
    } catch (e) { global.alert(e.message || '테스트를 시작하지 못했어요.'); renderPanel(); }
  }
  function drawQuestion() {
    var item = run.items[run.index], total = run.items.length;
    var mates = item.setId ? run.items.filter(function (i) { return i.setId === item.setId; }) : [];
    var hasImgs = hasChoiceImages(item);
    var h = '<div class="lt-shell ' + (run.big ? 'lt-big' : '') + '"><div class="lt-top"><span>' + esc(L.BRAND.testTitle) + '</span><span>' + esc(item.area) + '</span></div>' +
      '<div class="lt-top" style="margin:0"><span>' + (run.index + 1) + ' / ' + total + ' 문항</span><button class="lt-speak" style="padding:4px 10px" onclick="NanoLiteracyStudent.quit()">그만하기</button></div>' +
      '<div class="lt-bar"><i style="width:' + (run.index / total) * 100 + '%"></i></div><div class="lt-card">';
    if (item.setId && mates.length > 1) h += '<span class="lt-set">같은 글로 이어지는 문제예요 (' + (mates.indexOf(item) + 1) + ' / ' + mates.length + ')</span>';
    if (item.passage) h += '<div class="lt-passage">' + passageHtml(item.passage) + '</div>';
    if (item.image) h += '<figure class="lt-fig" style="margin:0"><img src="' + esc(imgSrc(item.image)) + '" alt="' + esc(item.imageDesc || '문항 그림') + '"></figure>';
    else if (item.imageDesc && !hasImgs) h += '<div class="lt-passage" style="border-color:#e67828;background:#fef4eb"><b>🖼️ 그림 보기</b> (그림 준비 중 — 설명으로 대신 보여요)<br>' + esc(item.imageDesc) + '</div>';
    h += '<div class="lt-q">' + esc(item.question) + '</div><div class="lt-choices ' + (hasImgs ? 'img' : '') + '" role="group" aria-label="보기">';
    item.choices.forEach(function (c, i) {
      var src = hasImgs ? item.choiceImages[i] : null;
      h += '<button class="lt-choice" aria-pressed="' + (run.pick === i) + '" onclick="NanoLiteracyStudent.choose(' + i + ')"><span class="n">' + (i + 1) + '</span>' +
        (hasImgs ? (src ? '<img src="' + esc(imgSrc(src)) + '" alt="' + (i + 1) + '번 보기 그림">' : '<span>그림 준비 중</span>') : esc(c)) + '</button>';
    });
    h += '</div><div class="lt-actions"><div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">' +
      (canSpeak() ? '<button class="lt-speak" onclick="NanoLiteracyStudent.speak()">🔊 읽어 주기</button><label style="font-size:12.5px;font-weight:700;display:flex;align-items:center;gap:5px"><input type="checkbox" ' + (run.autoRead ? 'checked' : '') + ' onchange="NanoLiteracyStudent.setAuto(this.checked)">자동으로 읽기</label>' : '<span></span>') +
      '</div><button class="lt-btn solid" ' + (run.pick === null ? 'disabled' : '') + ' onclick="NanoLiteracyStudent.next()">' + (run.index === total - 1 ? '제출하기' : '다음') + '</button></div></div></div>';
    overlay.innerHTML = h;
    overlay.scrollTop = 0;
    run.shownAt = performance.now();
    if (run.autoRead) speakItem(item); else stopSpeaking();
  }
  function choose(i) { if (!run || run.submitting) return; run.pick = i; sfx.pop(); drawQuestion_keepSpeech(); }
  // 보기만 바꿀 때는 문제를 다시 읽지 않고 화면만 갱신 (시간 측정도 유지)
  function drawQuestion_keepSpeech() {
    var t = run.shownAt, auto = run.autoRead; run.autoRead = false;
    var top = overlay.scrollTop; drawQuestion(); run.shownAt = t; run.autoRead = auto; overlay.scrollTop = top;
  }
  function next() {
    if (!run || run.pick === null || run.submitting) return;
    stopSpeaking(); sfx.pop();
    var item = run.items[run.index];
    run.answers.push({ itemId: item.id, choice: run.pick, ms: Math.round(performance.now() - run.shownAt) });
    run.pick = null;
    if (run.index < run.items.length - 1) { run.index++; drawQuestion(); } else submit();
  }
  async function submit() {
    run.submitting = true;
    overlay.innerHTML = '<div class="lt-shell"><div class="lt-card" style="text-align:center;padding:36px 20px"><div style="font-size:40px">✨</div><div style="font-weight:800;margin-top:8px">결과를 정리하고 있어요…</div></div></div>';
    try {
      var res = await L.api('submit', { body: { assignmentId: run.assignmentId, answers: run.answers }, timeout: 30000 });
      sfx.fanfare();
      overlay.innerHTML = '<div class="lt-shell"><div class="lt-card lt-hero" style="text-align:center;padding:34px 20px"><div style="font-size:46px">🎉</div>' +
        '<div style="font-size:22px;font-weight:900;margin:6px 0">테스트를 모두 마쳤어요!</div>' +
        '<div style="font-size:15px;opacity:.95;margin-bottom:18px">맞힌 문제 <b style="font-size:22px">' + res.correct + ' / ' + res.total + '</b> (' + res.score + '점)<br><small>자세한 결과지는 선생님께서 학부모님께 전달해 드려요.</small></div>' +
        '<button class="lt-btn" onclick="NanoLiteracyStudent.finish()">확인</button></div></div>';
    } catch (e) {
      // 네트워크 오류 등으로 제출이 실패해도 푼 답은 메모리에 남아 있으니 다시 시도할 수 있게 한다
      overlay.innerHTML = '<div class="lt-shell"><div class="lt-card" style="text-align:center;padding:30px 20px"><div style="font-size:38px">⚠️</div>' +
        '<div style="font-weight:800;margin:8px 0">제출하지 못했어요</div><div style="font-size:13px;color:var(--muted);margin-bottom:16px">' + esc(e.message || '') + '</div>' +
        '<button class="lt-btn solid" onclick="NanoLiteracyStudent.retrySubmit()">다시 제출하기</button></div></div>';
    }
  }
  function retrySubmit() { if (run) submit(); }
  function close() {
    stopSpeaking(); run = null;
    if (overlay) overlay.style.display = 'none';
    document.body.style.overflow = '';
  }
  function finish() { close(); renderPanel(); }
  function quit() {
    if (!global.confirm('테스트를 그만할까요?\n지금까지 고른 답은 저장되지 않고, 다음에 처음 문제부터 다시 시작해요.')) return;
    close(); renderPanel();
  }

  // 풀이 중 뒤로가기: 바로 나가지 않고 한 번 더 확인 (실수로 진행이 사라지는 것 방지)
  window.addEventListener('popstate', function () {
    if (!run || !overlay || overlay.style.display === 'none') return;
    if (run.submitting) { history.pushState({ panel: 'literacy', litTest: true }, '', '#literacy'); return; }
    if (global.confirm('테스트를 그만할까요?\n지금까지 고른 답은 저장되지 않아요.')) { close(); renderPanel(); }
    else history.pushState({ panel: 'literacy', litTest: true }, '', '#literacy');
  });

  global.NanoLiteracyStudent = {
    renderPanel: renderPanel, start: start, choose: choose, next: next, retrySubmit: retrySubmit, finish: finish, quit: quit,
    speak: function () { if (run) speakItem(run.items[run.index]); },
    setAuto: function (on) { if (run) run.autoRead = on; }
  };
})(window);

