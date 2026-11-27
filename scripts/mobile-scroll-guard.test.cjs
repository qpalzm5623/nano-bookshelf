const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(require('node:path').join(__dirname, '../public_html/js/mobile-scroll-guard.js'), 'utf8');

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
