const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function createMiniDom() {
  class FakeClassList {
    constructor(el) { this.el = el; }
    _parts() { return String(this.el.className || '').trim().split(/\s+/).filter(Boolean); }
    add(...cls) {
      const set = new Set(this._parts());
      cls.forEach((c) => { if (c) set.add(c); });
      this.el.className = [...set].join(' ');
    }
    remove(...cls) {
      const removeSet = new Set(cls);
      this.el.className = this._parts().filter((c) => !removeSet.has(c)).join(' ');
    }
    contains(c) { return this._parts().includes(c); }
  }

  class FakeElement {
    constructor(tagName) {
      this.tagName = String(tagName || '').toUpperCase();
      this.id = '';
      this.className = '';
      this.classList = new FakeClassList(this);
      this.style = {};
      this.attrs = {};
      this.children = [];
      this.parentNode = null;
      this.listeners = new Map();
      this._textContent = '';
      this._innerHTML = '';
      this.focused = false;
    }
    get textContent() {
      if (this.children.length === 0) return this._textContent;
      return this._textContent + this.children.map((c) => c.textContent).join('');
    }
    set textContent(v) {
      this.children = [];
      this._textContent = String(v == null ? '' : v);
    }
    get innerHTML() { return this._innerHTML; }
    set innerHTML(v) { this._innerHTML = String(v == null ? '' : v); }
    setAttribute(k, v) { this.attrs[k] = String(v); }
    getAttribute(k) { return Object.prototype.hasOwnProperty.call(this.attrs, k) ? this.attrs[k] : null; }
    appendChild(child) {
      if (child.parentNode) child.parentNode.removeChild(child);
      child.parentNode = this;
      this.children.push(child);
      return child;
    }
    removeChild(child) {
      const idx = this.children.indexOf(child);
      if (idx !== -1) {
        this.children.splice(idx, 1);
        child.parentNode = null;
      }
      return child;
    }
    addEventListener(type, fn) {
      if (!this.listeners.has(type)) this.listeners.set(type, []);
      this.listeners.get(type).push(fn);
    }
    dispatchEvent(evt) {
      const eventObj = evt || {};
      if (!eventObj.target) eventObj.target = this;
      eventObj.preventDefault = eventObj.preventDefault || (() => {});
      eventObj.stopPropagation = eventObj.stopPropagation || (() => {});
      for (const fn of this.listeners.get(eventObj.type) || []) {
        fn.call(this, eventObj);
      }
    }
    click() {
      this.dispatchEvent({ type: 'click', target: this });
    }
    focus() {
      this.focused = true;
      doc.activeElement = this;
    }
    queryById(id) {
      if (this.id === id) return this;
      for (const c of this.children) {
        const hit = c.queryById(id);
        if (hit) return hit;
      }
      return null;
    }
    findAllByClass(cls, out = []) {
      if (this.classList.contains(cls)) out.push(this);
      for (const c of this.children) c.findAllByClass(cls, out);
      return out;
    }
  }

  const head = new FakeElement('head');
  const body = new FakeElement('body');
  const docListeners = new Map();
  const doc = {
    head,
    body,
    activeElement: null,
    createElement: (tag) => new FakeElement(tag),
    getElementById: (id) => head.queryById(id) || body.queryById(id),
    addEventListener: (type, fn) => {
      if (!docListeners.has(type)) docListeners.set(type, []);
      docListeners.get(type).push(fn);
    },
    removeEventListener: (type, fn) => {
      const arr = docListeners.get(type) || [];
      const idx = arr.indexOf(fn);
      if (idx !== -1) arr.splice(idx, 1);
    },
    dispatchKeyDown: (key) => {
      const evt = {
        type: 'keydown',
        key,
        preventDefault() {},
        stopPropagation() {},
      };
      for (const fn of [...(docListeners.get('keydown') || [])]) {
        fn.call(doc, evt);
      }
    },
  };
  return { doc, head, body };
}

function loadDialogSandbox({ withDom = true } = {}) {
  const src = fs.readFileSync(path.join(__dirname, '../public_html/js/nano-dialog.js'), 'utf8');
  const nativeCalls = [];
  const confirmCalls = [];
  const dom = withDom ? createMiniDom() : null;

  const sandbox = {
    alert: (msg) => { nativeCalls.push(msg); },
    confirm: (msg) => { confirmCalls.push(msg); return true; },
    setTimeout,
    clearTimeout,
    requestAnimationFrame: (cb) => setTimeout(cb, 0),
    Promise,
  };
  if (dom) sandbox.document = dom.doc;
  sandbox.window = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(src, sandbox, { filename: 'nano-dialog.js' });
  return { sandbox, dom, nativeCalls, confirmCalls };
}

const flushMacrotasks = (ms = 25) => new Promise((resolve) => setTimeout(resolve, ms));

test('nano-dialog는 화면 중앙 배치 CSS를 1회만 주입하고 알림톡 미리보기 확인 모달을 예쁘게 렌더링한다', async () => {
  const { sandbox, dom } = loadDialogSandbox();

  const previewMsg = [
    '[북퀴즈 완료 알림톡 발송 미리보기]',
    '',
    '받는 분: 김태환 (01084349832)',
    '',
    '박진호 학생이\n2026년 11월 12일 15:19에 \'긴긴밤\'을 읽고\n북퀴즈를 완료했어요!\n\n우리 아이의 독서 이해도를 확인해보세요~',
    '',
    '연결 링크: https://www.nanosbook.co.kr/report?id=31',
    '',
    '학부모님께 이 내용으로 알림톡을 발송하시겠습니까?'
  ].join('\n');

  const pending = sandbox.nanoConfirm(previewMsg);
  await flushMacrotasks();

  const styleEl = dom.doc.getElementById('nanoDialogStyles');
  assert.ok(styleEl, '중앙 모달 스타일 태그가 주입되어야 합니다');
  assert.match(styleEl.textContent, /position:\s*fixed;\s*inset:\s*0/);
  assert.match(styleEl.textContent, /display:\s*flex;\s*align-items:\s*center;\s*justify-content:\s*center/);

  const overlay = dom.doc.getElementById('nanoDialogOverlay');
  assert.ok(overlay, '모달 오버레이가 body에 생성되어야 합니다');
  assert.equal(overlay.getAttribute('role'), 'dialog');
  assert.equal(overlay.getAttribute('aria-modal'), 'true');
  assert.ok(overlay.classList.contains('is-open'));

  const title = dom.doc.getElementById('nanoDialogTitle');
  assert.equal(title.textContent, '북퀴즈 완료 알림톡 발송 미리보기');
  assert.equal(overlay.findAllByClass('tone-kakao').length >= 2, true);
  assert.equal(overlay.findAllByClass('nano-dialog-kakao-recipient-val')[0].textContent, '김태환 (01084349832)');
  assert.match(overlay.findAllByClass('nano-dialog-kakao-bubble')[0].textContent, /긴긴밤/);
  assert.equal(overlay.findAllByClass('nano-dialog-kakao-link')[0].textContent, '연결 링크: https://www.nanosbook.co.kr/report?id=31');
  assert.equal(overlay.findAllByClass('nano-dialog-question')[0].textContent, '학부모님께 이 내용으로 알림톡을 발송하시겠습니까?');

  const confirmBtn = overlay.findAllByClass('nano-dialog-btn-kakao')[0];
  assert.ok(confirmBtn, '카카오 알림톡 전용 발송 버튼이 표시되어야 합니다');
  assert.equal(confirmBtn.textContent, '알림톡 발송');

  confirmBtn.click();
  assert.equal(await pending, true);
});

test('문해력 알림톡 확인("발송할까요?"), 취소/ESC/XSS 이스케이프 및 window.alert 중앙 모달 위임이 정상 동작한다', async () => {
  const { sandbox, dom, nativeCalls } = loadDialogSandbox();
  assert.equal(typeof sandbox.nativeAlert, 'function');

  // 1) XSS 문자열 포함 문해력 알림톡 미리보기 + 취소(Escape)
  const litMsg = [
    '[문해력 진단 결과 알림톡 발송 미리보기]',
    '',
    '받는 분: <img src=x onerror=alert(1)> (010-1234-5678)',
    '',
    '진단 리포트가 도착했습니다.',
    '',
    '연결 링크: https://www.nanosbook.co.kr/lit/1',
    '',
    '학부모님께 이 내용으로 발송할까요?'
  ].join('\n');

  const p1 = sandbox.nanoConfirm(litMsg);
  await flushMacrotasks();
  let overlay = dom.doc.getElementById('nanoDialogOverlay');
  assert.equal(overlay.findAllByClass('nano-dialog-question')[0].textContent, '학부모님께 이 내용으로 발송할까요?');
  const recEl = overlay.findAllByClass('nano-dialog-kakao-recipient-val')[0];
  assert.equal(recEl.textContent, '<img src=x onerror=alert(1)> (010-1234-5678)');
  assert.equal(recEl.children.length, 0, 'XSS 태그가 HTML 노드로 파싱되면 안 됩니다');

  dom.doc.dispatchKeyDown('Escape');
  assert.equal(await p1, false);

  // 2) 순차 큐잉 + danger 톤 + window.alert 위임 (nativeAlert 호출 안 함)
  const pAlert = sandbox.alert('저장되었습니다!');
  const pDanger = sandbox.nanoConfirm('기존 첨삭 내역을 삭제하시겠습니까?');
  await flushMacrotasks();

  overlay = dom.doc.getElementById('nanoDialogOverlay');
  assert.equal(dom.doc.getElementById('nanoDialogTitle').textContent, '처리 완료');
  assert.equal(nativeCalls.length, 0, '브라우저 DOM 환경에서는 기본 window.alert가 호출되지 않아야 합니다');
  overlay.findAllByClass('nano-dialog-btn-primary')[0].click();
  await pAlert;
  await flushMacrotasks();

  overlay = dom.doc.getElementById('nanoDialogOverlay');
  assert.ok(overlay.findAllByClass('tone-danger').length >= 1, '삭제 확인 모달은 danger 톤을 가져야 합니다');
  assert.equal(overlay.findAllByClass('nano-dialog-btn-danger')[0].textContent, '삭제하기');
  overlay.findAllByClass('nano-dialog-btn-cancel')[0].click();
  assert.equal(await pDanger, false);

  await flushMacrotasks(170);
  assert.equal(dom.head.findAllByClass('').length >= 0, true);
  assert.equal(dom.head.children.filter((c) => c.id === 'nanoDialogStyles').length, 1, '스타일 태그는 1회만 삽입됩니다');
});

test('DOM이 없는 Node 테스트 환경에서는 기존 global.confirm으로 안전하게 폴백한다', async () => {
  const { sandbox, confirmCalls } = loadDialogSandbox({ withDom: false });
  const ok = await sandbox.nanoConfirm('테스트 확인');
  assert.equal(ok, true);
  assert.deepEqual(confirmCalls, ['테스트 확인']);
});

test('모든 포털 HTML 페이지에 nano-dialog.js가 연결되어 있고 래핑되지 않은 raw confirm 호출이 남아있지 않다', () => {
  const root = path.join(__dirname, '../public_html');
  for (const htmlFile of ['index.html', 'student_preview.html', 'admin_preview.html', 'master_preview.html']) {
    const html = fs.readFileSync(path.join(root, htmlFile), 'utf8');
    assert.match(html, /js\/nano-dialog\.js\?v=20261113_center/, `${htmlFile}에 nano-dialog.js가 로드되어야 합니다`);
  }

  const targetFiles = [
    'index.html',
    'student_preview.html',
    'admin_preview.html',
    'master_preview.html',
    'admin_preview.js',
    'js/admin_books.js',
    'js/admin_members.js',
    'js/admin_payment.js',
    'js/admin_worksheet_ai.js',
    'js/billing-ui.js',
    'js/content-sharing.js',
    'js/literacy/literacy-admin.js',
    'js/literacy/literacy-student.js',
    'js/master/master-contents.js',
    'js/master/master-core.js',
    'js/master/master-franchise.js',
    'js/master/master-literacy.js',
    'js/master/master-members.js',
    'js/master/master-operations.js',
  ];

  for (const rel of targetFiles) {
    const src = fs.readFileSync(path.join(root, rel), 'utf8');
    const lines = src.split(/\r?\n/);
    lines.forEach((line, idx) => {
      if (/\b(window\.|global\.)?confirm\s*\(/.test(line)) {
        assert.match(
          line,
          /typeof (?:window\.|global\.)?nanoConfirm === 'function' \? await (?:window\.|global\.)?nanoConfirm/,
          `${rel}:${idx + 1} 에 중앙 모달(nanoConfirm) 래핑이 누락되었습니다: ${line.trim()}`
        );
      }
    });
  }
});

