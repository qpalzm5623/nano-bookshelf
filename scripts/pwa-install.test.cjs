// 실제 설치 스크립트를 브라우저 이벤트와 최소 DOM으로 실행합니다.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.join(__dirname, '..', 'public_html');
const source = fs.readFileSync(path.join(root, 'js/pwa-install.js'), 'utf8');

function browser(options = {}) {
  const elements = new Map();
  const events = {};
  const timers = [];
  const values = new Map(options.hidden ? [['nano_pwa_banner_hide_until', Date.now() + 86400000]] : []);
  function element() {
    return {
      handlers: {}, children: [], hidden: false,
      setAttribute() {},
      addEventListener(name, fn) { this.handlers[name] = fn; },
      appendChild(child) {
        this.children.push(child);
        elements.set(child.id, child);
        for (const match of (child.innerHTML || '').matchAll(/id="([^"]+)"/g)) {
          const nested = element();
          nested.id = match[1];
          child.appendChild(nested);
        }
      },
      remove() { elements.delete(this.id); this.children.forEach(child => child.remove()); }
    };
  }
  const displayMode = { matches: !!options.standalone, addEventListener(name, fn) { this.change = fn; } };
  const context = {
    navigator: { userAgent: options.ua || 'Mozilla/5.0 (Linux; Android 14)', maxTouchPoints: options.touch || 0, standalone: !!options.iosStandalone },
    isSecureContext: options.secure !== false,
    matchMedia: () => displayMode,
    addEventListener: (name, fn) => { events[name] = fn; },
    setTimeout: fn => timers.push(fn),
    document: {
      readyState: options.loading ? 'loading' : 'complete', head: element(), body: element(),
      createElement: element, getElementById: id => elements.get(id),
      addEventListener: (name, fn) => { events[name] = fn; }
    },
    localStorage: {
      getItem(key) { if (options.storageBlocked) throw Error('Blocked'); return values.get(key) ?? null; },
      setItem(key, value) { if (options.storageBlocked) throw Error('Blocked'); values.set(key, value); }
    }
  };
  context.window = context;
  vm.runInNewContext(source, context);
  return {
    events, values, displayMode,
    flush: () => timers.splice(0).forEach(fn => fn()),
    get: id => elements.get(id),
    banner: () => elements.get('nanoPwaInstallBanner'),
    prompt(outcome = 'accepted', fail = false) {
      const event = { calls: 0, prevented: false, preventDefault() { this.prevented = true; },
        prompt() { this.calls++; return fail ? Promise.reject(Error('Unavailable')) : Promise.resolve(); },
        userChoice: Promise.resolve({ outcome }) };
      events.beforeinstallprompt(event);
      return event;
    }
  };
}

test('iPad 데스크톱 모드와 iPhone에 웹 앱 설치 안내 표시', () => {
  for (const ua of ['Mozilla/5.0 (Macintosh; Intel Mac OS X)', 'Mozilla/5.0 (iPhone)']) {
    const b = browser({ ua, touch: 5 }); b.flush();
    assert.ok(b.banner());
    assert.match(b.get('nanoPwaInstallDescription').textContent, /웹 앱으로 열기/);
    assert.equal(b.get('btnPwaInstallAction').hidden, true);
  }
});

test('Android 수동 안내가 설치 이벤트 이후 버튼으로 전환되고 설치는 한 번만 요청', async () => {
  const b = browser(); b.flush();
  assert.match(b.get('nanoPwaInstallDescription').textContent, /브라우저 메뉴/);
  const event = b.prompt();
  assert.equal(event.prevented, true);
  const button = b.get('btnPwaInstallAction');
  assert.equal(button.hidden, false);
  await Promise.all([button.handlers.click(), button.handlers.click()]);
  assert.equal(event.calls, 1);
  assert.equal(b.banner(), undefined);
});

test('PC·설치 앱·비보안 접속에서는 안내 숨김', () => {
  for (const options of [{ ua: 'Mozilla/5.0 (Windows NT 10.0)', touch: 10 }, { standalone: true }, { iosStandalone: true }, { secure: false }, { hidden: true }]) {
    const b = browser(options); b.prompt(); b.flush(); assert.equal(b.banner(), undefined);
  }
});

test('닫은 뒤 늦은 설치 이벤트와 예약 타이머에도 재노출하지 않음', () => {
  const b = browser(); b.prompt(); b.get('btnPwaCloseBanner').handlers.click();
  b.prompt(); b.flush();
  assert.equal(b.banner(), undefined);
  assert.ok(Number(b.values.get('nano_pwa_banner_hide_until')) > Date.now());
});

test('저장소 차단 중에도 안내와 닫기 동작', () => {
  const b = browser({ storageBlocked: true }); b.flush(); assert.ok(b.banner());
  b.get('btnPwaCloseBanner').handlers.click(); b.prompt(); assert.equal(b.banner(), undefined);
});

test('설치 취소는 24시간 숨김, 오류는 수동 안내로 복구', async () => {
  const cancelled = browser(); cancelled.prompt('dismissed');
  await cancelled.get('btnPwaInstallAction').handlers.click();
  assert.equal(cancelled.banner(), undefined);
  assert.ok(cancelled.values.has('nano_pwa_banner_hide_until'));
  const failed = browser(); failed.prompt('accepted', true);
  await failed.get('btnPwaInstallAction').handlers.click();
  assert.match(failed.get('nanoPwaInstallDescription').textContent, /설치 창을 열지 못했습니다/);
  assert.equal(failed.get('btnPwaInstallAction').hidden, true);
});

test('설치 완료 또는 독립 실행 모드로 전환하면 예약 안내도 표시하지 않음', () => {
  const b = browser(); b.events.appinstalled(); b.flush(); assert.equal(b.banner(), undefined);
  const c = browser(); c.flush(); c.displayMode.matches = true; c.displayMode.change();
  assert.equal(c.banner(), undefined);
});

test('인앱 브라우저는 외부 브라우저 안내, DOM 로딩 후에도 안내 표시', () => {
  const b = browser({ ua: 'Android KAKAOTALK', loading: true }); b.flush();
  assert.equal(b.banner(), undefined);
  b.events.DOMContentLoaded(); b.flush();
  assert.match(b.get('nanoPwaInstallDescription').textContent, /외부 브라우저/);
});

test('모든 진입 화면은 주소창 없는 설치 설정과 동일한 앱 범위 사용', () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(root, 'manifest.json'), 'utf8'));
  assert.equal(manifest.display, 'standalone');
  assert.equal(manifest.orientation, 'any');
  const base = 'https://example.test/';
  const scope = new URL(manifest.scope, base).href;
  assert.ok(new URL(manifest.start_url, base).href.startsWith(scope));
  for (const page of ['index.html', 'student_preview.html', 'admin_preview.html', 'master_preview.html']) {
    const html = fs.readFileSync(path.join(root, page), 'utf8');
    assert.match(html, /name="apple-mobile-web-app-capable" content="yes"/);
    assert.match(html, /rel="manifest" href="manifest.json"/);
    assert.match(html, /src="js\/pwa-install.js"/);
    assert.ok(new URL(page, base).href.startsWith(scope));
  }
  for (const icon of manifest.icons) {
    const png = fs.readFileSync(path.join(root, icon.src));
    assert.equal(`${png.readUInt32BE(16)}x${png.readUInt32BE(20)}`, icon.sizes);
  }
});
