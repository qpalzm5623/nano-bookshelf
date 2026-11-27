const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(require('node:path').join(__dirname, '../public_html/js/mobile-scroll-guard.js'), 'utf8');

test('키보드가 열리면 회사정보를 숨기고 닫히면 복원하며 화면 회전을 구분한다', () => {
  let resize, hidden;
  const viewport = { height: 800, width: 390, addEventListener(name, fn) { resize = fn; } };
  const root = { addEventListener() {}, classList: { toggle(name, value) { hidden = value; } } };
  vm.runInNewContext(source, {
    document: { body: root, querySelector: () => ({}), documentElement: { style: { setProperty() {} } } },
    window: { visualViewport: viewport }
  });
  assert.equal(hidden, false);
  viewport.height = 460; resize();
  assert.equal(hidden, true);
  viewport.height = 800; resize();
  assert.equal(hidden, false);
  viewport.height = 730; resize();
  assert.equal(hidden, false);
  viewport.width = 844; viewport.height = 390; resize();
  assert.equal(hidden, false);
});

function setup(login = false) {
  const handlers = {};
  const root = { addEventListener(name, handler) { handlers[name] = handler; } };
  vm.runInNewContext(source, {
    document: { body: root, querySelector: () => login ? {} : null, getElementById: () => root },
    window: {}
  });
  return function drag(scroller, start, end, count = 1) {
    let blocked = false;
    handlers.touchstart({ touches: [{ clientY: start }], target: { closest: () => scroller } });
    handlers.touchmove({ touches: Array.from({ length: count }, () => ({ clientY: end })), cancelable: true, preventDefault() { blocked = true; } });
    return blocked;
  };
}

test('캐릭터 창의 위·아래 경계와 헤더 드래그를 막고 본문 스크롤은 허용한다', () => {
  const drag = setup();
  const scroller = { scrollTop: 0, scrollHeight: 1000, clientHeight: 400 };
  assert.equal(drag(scroller, 100, 150), true);
  assert.equal(scroller.scrollTop, 0);
  scroller.scrollTop = 590;
  assert.equal(drag(scroller, 150, 100), true);
  assert.equal(scroller.scrollTop, 600);
  scroller.scrollTop = 200;
  assert.equal(drag(scroller, 150, 100), false);
  assert.equal(drag(null, 100, 150), true);
});

test('로그인 핀치를 막고 약관 본문의 정상 스크롤을 허용한다', () => {
  const drag = setup(true);
  assert.equal(drag(null, 100, 150, 2), true);
  assert.equal(drag({ scrollTop: 100, scrollHeight: 900, clientHeight: 300 }, 150, 100), false);
  assert.equal(drag({ scrollTop: 0, scrollHeight: 300, clientHeight: 300 }, 150, 100), true);
});
