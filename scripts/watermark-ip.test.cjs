const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

process.env.PORTAL_AUTH_SECRET = 'test-only-secret-with-more-than-32-characters';
process.env.DATABASE_URL = 'postgresql://test.invalid/test';

const { extractClientIp } = require('../lib/client-ip');

function loadTs(file, dependencies = {}) {
  if (/^api\/(portal|bootstrap|manage)\.ts$/.test(file)) {
    dependencies = {
      '../lib/portal-content': require('./test-portal-content.cjs')(dependencies['../lib/portal-http']),
      ...dependencies
    };
  }
  if (file === 'api/bootstrap.ts') {
    const dispatchView = loadTs('lib/dispatch-view.ts');
    dependencies = {
      '../lib/dispatch-view': dispatchView,
      '../lib/payment-view': loadTs('lib/payment-view.ts', {
        './dispatch-view': dispatchView,
        './billing-policy': loadTs('lib/billing-policy.ts')
      }),
      ...dependencies
    };
  }
  const brand = require('./test-portal-brand.cjs')((dependencies['../lib/prisma'] || dependencies['./prisma'] || {}).prisma);
  dependencies = { '../lib/portal-brand': brand, './portal-brand': brand, ...dependencies };
  const exports = {};
  const fullPath = path.join(__dirname, '..', file);
  const code = ts.transpileModule(fs.readFileSync(fullPath, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 }
  }).outputText;
  vm.runInNewContext(code, {
    exports,
    require: name => dependencies[name] || require(name.startsWith('.') ? path.resolve(path.dirname(fullPath), name) : name),
    Buffer,
    process,
    console,
    URL,
    Date
  });
  return exports;
}

test('extractClientIp는 프록시 헤더에서 실제 IP를 추출하고 잘못된 형식을 차단한다', () => {
  assert.equal(extractClientIp({ headers: { 'x-vercel-forwarded-for': '211.36.132.14, 10.0.0.1' } }), '211.36.132.14');
  assert.equal(extractClientIp({ headers: { 'x-real-ip': '198.51.100.22' } }), '198.51.100.22');
  assert.equal(extractClientIp({ headers: { 'x-forwarded-for': '::ffff:203.0.113.45, 76.76.21.1' } }), '203.0.113.45');
  assert.equal(extractClientIp({ socket: { remoteAddress: '::1' } }), '127.0.0.1');
  assert.equal(extractClientIp({ headers: { 'x-forwarded-for': '<script>alert(1)</script>' } }), '');
});

test('portal 로그인·세션 및 bootstrap 응답에 실제 클라이언트 IP(clientIp)가 포함된다', async () => {
  const auth = loadTs('lib/portal-auth.ts');
  const hash = auth.hashPassword('correct-password-for-tests');
  const director = {
    id: 'dir-luke',
    username: 'lookadmin',
    name: '이정민 원장',
    role: 'DIRECTOR',
    status: 'APPROVED',
    password: hash,
    academyId: 'acad-143',
    academy: { id: 'acad-143', code: 'ACAD-143', name: '주식회사 루크러닝', status: 'ACTIVE', deletedAt: null },
    classGroup: null
  };
  const date = new Date('2026-11-01T00:00:00Z');
  const db = {
    member: { findUnique: async () => director, findMany: async () => [{ ...director, createdAt: date, updatedAt: date }], update: async () => director },
    academy: { findMany: async () => [{ ...director.academy, joinDate: date, startDate: date, endDate: date, maxStudents: 100, monthlyFee: 0, kakaoBalance: 0, plan: 'Royal', _count: { members: 1 } }] },
    book: { findMany: async () => [] },
    classGroup: { findMany: async () => [] },
    mainBanner: { findMany: async () => [] },
    themeCategory: { findMany: async () => [] },
    notice: { findMany: async () => [] },
    academyBook: { findMany: async () => [] },
    payment: { findMany: async () => [] },
    aligoDispatchLog: { findMany: async () => [] },
    portalSetting: { findUnique: async () => null, findMany: async () => [] },
    quizAttempt: { groupBy: async () => [] },
    bookQuiz: { groupBy: async () => [] },
    portalFile: { findMany: async () => [] }
  };
  const http = loadTs('lib/portal-http.ts', { './prisma': { prisma: db }, './portal-auth': auth });
  const portalHandler = loadTs('api/portal.ts', {
    '../lib/prisma': { prisma: db },
    '../lib/portal-auth': auth,
    '../lib/portal-http': http,
    '../lib/portal-learning': loadTs('lib/portal-learning.ts')
  }).default;

  const loginRes = { code: 200, headers: {}, setHeader(k, v) { this.headers[k] = v; }, status(c) { this.code = c; return this; }, json(v) { this.data = v; return this; } };
  await portalHandler({
    query: { action: 'login' },
    method: 'POST',
    body: { username: 'lookadmin', password: 'correct-password-for-tests' },
    headers: { origin: 'https://test.example', host: 'test.example', 'content-type': 'application/json', 'x-forwarded-for': '203.0.113.77, 10.0.0.2' }
  }, loginRes);
  assert.equal(loginRes.code, 200);
  assert.equal(loginRes.data.user.clientIp, '203.0.113.77');
  assert.equal(loginRes.data.user.academyName, '주식회사 루크러닝');

  const sessionRes = { code: 200, headers: {}, setHeader(k, v) { this.headers[k] = v; }, status(c) { this.code = c; return this; }, json(v) { this.data = v; return this; } };
  await portalHandler({
    query: { action: 'session' },
    method: 'GET',
    headers: { host: 'test.example', cookie: 'nano_portal=' + auth.signSession(director.id, hash), 'x-real-ip': '198.51.100.22' }
  }, sessionRes);
  assert.equal(sessionRes.code, 200);
  assert.equal(sessionRes.data.user.clientIp, '198.51.100.22');

  const bootstrapHandler = loadTs('api/bootstrap.ts', { '../lib/prisma': { prisma: db }, '../lib/portal-auth': auth }).default;
  const bootRes = { code: 200, headers: {}, setHeader(k, v) { this.headers[k] = v; }, status(c) { this.code = c; return this; }, send(v) { this.data = v; return this; } };
  await bootstrapHandler({
    method: 'GET',
    headers: { host: 'test.example', cookie: 'nano_portal=' + auth.signSession(director.id, hash), 'x-vercel-forwarded-for': '211.36.132.14' }
  }, bootRes);
  assert.equal(bootRes.code, 200);
  const storedSession = {};
  const bootCtx = {
    window: {},
    sessionStorage: { setItem(k, v) { storedSession[k] = v; } }
  };
  vm.runInNewContext(bootRes.data, bootCtx);
  assert.equal(bootCtx.window.NANO_CLIENT_IP, '211.36.132.14');
  const parsedUser = JSON.parse(storedSession.nano_auth_user);
  assert.equal(parsedUser.academyName, '주식회사 루크러닝');
  assert.equal(parsedUser.clientIp, '211.36.132.14');
});

test('나노 시트 뷰어 모달 부제목, 하단 문구 및 하드코딩 워터마크가 정리되었다', () => {
  const adminHtml = fs.readFileSync(path.join(__dirname, '../public_html/admin_preview.html'), 'utf8');
  const masterModalHtml = fs.readFileSync(path.join(__dirname, '../public_html/modals/master_modals.html'), 'utf8');
  const adminBooksJs = fs.readFileSync(path.join(__dirname, '../public_html/js/admin_books.js'), 'utf8');
  const adminNoticesJs = fs.readFileSync(path.join(__dirname, '../public_html/js/admin_notices.js'), 'utf8');
  const masterContentsJs = fs.readFileSync(path.join(__dirname, '../public_html/js/master/master-contents.js'), 'utf8');

  for (const html of [adminHtml, masterModalHtml]) {
    assert.ok(html.includes('>학생용 독후 활동지</small>'), '부제목이 학생용 독후 활동지로 변경되어야 합니다');
    assert.ok(!html.includes('교사용/학생용 독서 활동지'), '기존 부제목 문구가 남아있지 않아야 합니다');
    assert.ok(!html.includes('전국 나노 가맹 학원 정회원 전용 보안 교육 자료'), '좌측 하단 문구가 삭제되어야 합니다');
    assert.ok(!html.includes('118.235.12.89'), '하드코딩 IP가 남아있지 않아야 합니다');
  }
  const adminPdfModal = adminHtml.slice(adminHtml.indexOf('id="contentPdfPreviewModal"'), adminHtml.indexOf('id="contentPdfPreviewModal"') + 9000);
  assert.ok(!adminPdfModal.includes('나노 독서아카데미 목동본원'));
  assert.ok(!adminPdfModal.includes('나노 독서아카데미 본원'));
  for (const js of [adminBooksJs, adminNoticesJs, masterContentsJs]) {
    assert.ok(!js.includes('118.235.12.89'), 'JS에 하드코딩 IP가 남아있지 않아야 합니다');
  }
  assert.ok(!adminBooksJs.includes('나노 독서아카데미 목동본원'));
  assert.ok(!adminBooksJs.includes('>목동본원<'));
  assert.ok(!adminNoticesJs.includes('나노 독서아카데미 목동본원'));
});

test('학원 관리자 나노 시트 워터마크 및 인쇄 화면이 로그인 학원명과 실제 IP를 표시하고 XSS를 이스케이프한다', () => {
  const elements = {
    wmAcademyName: { innerText: '가맹 학원' },
    wmPrintTime: { innerText: '-' },
    wmIpAddress: { innerText: '-' },
    pdfSheetAcademyName: { innerText: '가맹 학원' },
    realPdfWatermarkOverlay: { style: {}, innerHTML: '' },
    pdfViewerCanvas: { width: 700, height: 990, toDataURL: () => 'data:image/png;base64,test' },
    realPdfViewerWrapper: { style: { display: 'block' } },
    nanoSheetViewerContainer: { style: { display: 'none' } },
    pdfModalTitle: { innerText: '[테스트 도서] 나노 시트' }
  };
  let printedHtml = '';
  const windowObj = {
    NANO_CLIENT_IP: '211.36.132.14',
    addEventListener() {},
    removeEventListener() {},
    open: () => ({
      document: { open() {}, write(h) { printedHtml = h; }, close() {} },
      focus() {},
      print() {}
    })
  };
  const ctx = {
    window: windowObj,
    document: {
      getElementById: id => elements[id] || null,
      addEventListener() {},
      querySelector: () => null,
      querySelectorAll: () => []
    },
    sessionStorage: { getItem: () => JSON.stringify({ academyName: '주식회사 루크러닝', clientIp: '211.36.132.14' }) },
    currentAcademyInfo: { id: 'ACAD-143', name: '주식회사 루크러닝' },
    console,
    Date,
    String
  };
  windowObj.window = windowObj;
  windowObj.sessionStorage = ctx.sessionStorage;

  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../public_html/js/admin_books.js'), 'utf8'), ctx);
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../public_html/js/admin_notices.js'), 'utf8'), ctx);

  ctx.updateWatermarkInfo();
  ctx.updateRealPdfWatermarkOverlay();
  assert.equal(elements.wmAcademyName.innerText, '주식회사 루크러닝');
  assert.equal(elements.pdfSheetAcademyName.innerText, '주식회사 루크러닝');
  assert.equal(elements.wmIpAddress.innerText, '211.36.132.14');
  assert.ok(elements.realPdfWatermarkOverlay.innerHTML.includes('주식회사 루크러닝'));
  assert.ok(elements.realPdfWatermarkOverlay.innerHTML.includes('211.36.132.14'));

  ctx.printNanoSheetViewer();
  assert.ok(printedHtml.includes('주식회사 루크러닝'));
  assert.ok(printedHtml.includes('211.36.132.14'));
  assert.equal((printedHtml.match(/class="wm-block"/g) || []).length, 1, '단일 페이지 인쇄 시 워터마크가 1회만 삽입되어야 합니다');
  assert.ok(printedHtml.includes('justify-content: center;'));

  // 특수문자(<script>, &) 포함 학원명 이스케이프 검증
  ctx.currentAcademyInfo.name = '루크<A&B>학원';
  ctx.updateWatermarkInfo();
  ctx.updateRealPdfWatermarkOverlay();
  assert.ok(!elements.realPdfWatermarkOverlay.innerHTML.includes('<A&B>'));
  assert.ok(elements.realPdfWatermarkOverlay.innerHTML.includes('루크&lt;A&amp;B&gt;학원'));
});

test('마스터 관리자 나노 시트 워터마크 및 인쇄 화면이 실제 IP와 브랜드별 소속명을 표시한다', () => {
  const elements = {
    wmAcademyName: { innerText: '나노의 책장 B2B 본사 (HQ)' },
    wmPrintTime: { innerText: '-' },
    wmIpAddress: { innerText: '-' },
    pdfSheetAcademyName: { innerText: '나노의 책장 B2B 본사' },
    realPdfWatermarkOverlay: { style: {}, innerHTML: '' },
    pdfViewerCanvas: { width: 700, height: 990, toDataURL: () => 'data:image/png;base64,test' },
    realPdfViewerWrapper: { style: { display: 'block' } },
    nanoSheetViewerContainer: { style: { display: 'none' } },
    pdfModalTitle: { innerText: '[테스트 도서] 나노 시트' }
  };
  let printedHtml = '';
  const authPayload = { brand: 'JD', academyName: '정답이 있는 독서 본사', clientIp: '198.51.100.5' };
  const windowObj = {
    NANO_CLIENT_IP: '198.51.100.5',
    NANO_BRAND: 'JD',
    addEventListener() {},
    removeEventListener() {},
    open: () => ({
      document: { open() {}, write(h) { printedHtml = h; }, close() {} },
      focus() {},
      print() {}
    })
  };
  const ctx = {
    window: windowObj,
    document: {
      getElementById: id => elements[id] || null,
      addEventListener() {},
      querySelector: () => null,
      querySelectorAll: () => []
    },
    sessionStorage: { getItem: () => JSON.stringify(authPayload) },
    NANO_BRAND: 'JD',
    NANO_CLIENT_IP: '198.51.100.5',
    console,
    Date,
    String
  };
  windowObj.window = windowObj;
  windowObj.sessionStorage = ctx.sessionStorage;

  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../public_html/js/master/master-contents.js'), 'utf8'), ctx);
  ctx.updateWatermarkInfo();
  ctx.updateRealPdfWatermarkOverlay();

  assert.equal(elements.wmAcademyName.innerText, '정답이 있는 독서 본사');
  assert.equal(elements.pdfSheetAcademyName.innerText, '정답이 있는 독서 본사');
  assert.equal(elements.wmIpAddress.innerText, '198.51.100.5');
  assert.ok(elements.realPdfWatermarkOverlay.innerHTML.includes('정답이 있는 독서 본사'));
  assert.ok(elements.realPdfWatermarkOverlay.innerHTML.includes('198.51.100.5'));

  ctx.printNanoSheetViewer();
  assert.ok(printedHtml.includes('정답이 있는 독서 본사'));
  assert.ok(printedHtml.includes('198.51.100.5'));
  assert.equal((printedHtml.match(/class="wm-block"/g) || []).length, 1, '마스터 단일 페이지 인쇄 시 워터마크가 1회만 삽입되어야 합니다');
  assert.ok(printedHtml.includes('justify-content: center;'));
});

function createMultiPageDomMock() {
  function makeNode(tag) {
    const node = {
      tagName: String(tag || 'DIV').toUpperCase(),
      className: '',
      id: '',
      innerText: '',
      _innerHTML: '',
      style: { cssText: '' },
      attrs: {},
      children: [],
      parentElement: { scrollTop: 120 },
      setAttribute(k, v) {
        this.attrs[k] = String(v);
        if (k === 'id') this.id = String(v);
      },
      getAttribute(k) { return this.attrs[k] ?? null; },
      appendChild(child) {
        child.parentElement = this;
        this.children.push(child);
        return child;
      },
      getContext() { return {}; },
      toDataURL() { return 'data:image/png;base64,PAGE_' + (this.attrs['data-page'] || '1'); },
      querySelectorAll(sel) {
        const res = [];
        const walk = cur => {
          for (const c of cur.children || []) {
            if (sel.includes('nano-pdf-page-canvas') && c.className && c.className.includes('nano-pdf-page-canvas')) res.push(c);
            if (sel.includes('nano-pdf-page-watermark') && c.className && c.className.includes('nano-pdf-page-watermark')) res.push(c);
            if (sel.includes('#realPdfWatermarkOverlay') && c.id === 'realPdfWatermarkOverlay' && !res.includes(c)) res.push(c);
            walk(c);
          }
        };
        walk(this);
        return res;
      }
    };
    Object.defineProperty(node, 'innerHTML', {
      get() { return node._innerHTML; },
      set(val) {
        node._innerHTML = String(val);
        if (val === '') node.children = [];
      }
    });
    return node;
  }
  const elements = {
    wmAcademyName: makeNode('div'),
    wmPrintTime: makeNode('div'),
    wmIpAddress: makeNode('div'),
    pdfSheetAcademyName: makeNode('span'),
    realPdfViewerWrapper: makeNode('div'),
    realPdfPagesContainer: makeNode('div'),
    pdfPageControls: makeNode('div'),
    pdfPageNumDisplay: makeNode('span'),
    btnPrintNanoSheet: makeNode('button'),
    pdfModalTitle: makeNode('h6'),
    nanoSheetViewerContainer: makeNode('div')
  };
  elements.wmAcademyName.innerText = '가맹 학원';
  elements.wmPrintTime.innerText = '-';
  elements.wmIpAddress.innerText = '-';
  elements.realPdfViewerWrapper.clientWidth = 740;
  elements.realPdfViewerWrapper.style.display = 'block';
  elements.realPdfViewerWrapper.appendChild(elements.realPdfPagesContainer);
  elements.nanoSheetViewerContainer.style.display = 'none';
  return { makeNode, elements };
}

test('3페이지 나노 시트 PDF가 페이지 넘김 없이 스크롤 전체 렌더링되고 전체 페이지가 일괄 인쇄된다', async () => {
  const adminHtml = fs.readFileSync(path.join(__dirname, '../public_html/admin_preview.html'), 'utf8');
  const masterModalHtml = fs.readFileSync(path.join(__dirname, '../public_html/modals/master_modals.html'), 'utf8');
  for (const html of [adminHtml, masterModalHtml]) {
    assert.ok(html.includes('id="realPdfPagesContainer"'), '다중 페이지 스크롤 컨테이너가 있어야 합니다');
    assert.ok(!html.includes('prevPdfPage()') && !html.includes('nextPdfPage()'), '이전/다음 페이지 넘김 버튼이 없어야 합니다');
  }

  for (const mode of ['admin', 'master']) {
    const { makeNode, elements } = createMultiPageDomMock();
    let printedHtml = '';
    const fakePdf = {
      numPages: 3,
      getPage: async pageNum => ({
        pageNum,
        getViewport: ({ scale }) => ({ width: 595 * scale, height: 842 * scale }),
        render: () => ({ promise: Promise.resolve(), cancel() {} })
      })
    };
    const windowObj = {
      NANO_CLIENT_IP: '203.0.113.88',
      NANO_BRAND: mode === 'master' ? 'JD' : 'NANO',
      devicePixelRatio: 1,
      addEventListener() {},
      removeEventListener() {},
      open: () => ({
        document: { open() {}, write(h) { printedHtml = h; }, close() {} },
        focus() {},
        print() {}
      })
    };
    const authPayload = mode === 'master'
      ? { brand: 'JD', academyName: '정답이 있는 독서 본사', clientIp: '203.0.113.88' }
      : { academyName: '주식회사 루크러닝', clientIp: '203.0.113.88' };
    const ctx = {
      window: windowObj,
      document: {
        createElement: tag => makeNode(tag),
        getElementById: id => {
          if (elements[id]) return elements[id];
          if (id === 'pdfViewerCanvas') return elements.realPdfPagesContainer.querySelectorAll('canvas.nano-pdf-page-canvas')[0] || null;
          if (id === 'realPdfWatermarkOverlay') return elements.realPdfPagesContainer.querySelectorAll('#realPdfWatermarkOverlay')[0] || null;
          return null;
        },
        querySelectorAll: sel => elements.realPdfViewerWrapper.querySelectorAll(sel),
        addEventListener() {},
        querySelector: () => null
      },
      sessionStorage: { getItem: () => JSON.stringify(authPayload) },
      currentAcademyInfo: { id: 'ACAD-143', name: '주식회사 루크러닝' },
      NANO_BRAND: mode === 'master' ? 'JD' : 'NANO',
      NANO_CLIENT_IP: '203.0.113.88',
      console,
      Date,
      String,
      Math,
      Promise,
      Array
    };
    windowObj.window = windowObj;
    windowObj.sessionStorage = ctx.sessionStorage;

    if (mode === 'admin') {
      vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../public_html/js/admin_books.js'), 'utf8'), ctx);
      vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../public_html/js/admin_notices.js'), 'utf8'), ctx);
    } else {
      vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../public_html/js/master/master-contents.js'), 'utf8'), ctx);
    }

    ctx.activePdfDoc = fakePdf;
    ctx.updateWatermarkInfo();
    await ctx.renderAllPdfPages();

    const pageCards = elements.realPdfPagesContainer.children;
    assert.equal(pageCards.length, 3, '3개 페이지 카드가 세로 스크롤 컨테이너에 모두 렌더링되어야 합니다');
    const watermarks = elements.realPdfViewerWrapper.querySelectorAll('.nano-pdf-page-watermark');
    assert.equal(watermarks.length, 3, '모든 페이지마다 워터마크가 삽입되어야 합니다');
    const expectedAcad = mode === 'master' ? '정답이 있는 독서 본사' : '주식회사 루크러닝';
    for (const wm of watermarks) {
      assert.ok(wm.innerHTML.includes(expectedAcad));
      assert.ok(wm.innerHTML.includes('203.0.113.88'));
    }
    assert.equal(elements.pdfPageNumDisplay.innerText, '총 3페이지 · 전체 스크롤 열람');
    assert.ok(elements.btnPrintNanoSheet.innerHTML.includes('전체 인쇄 (3장)'));

    ctx.printNanoSheetViewer();
    assert.ok(printedHtml.includes('data:image/png;base64,PAGE_1'));
    assert.ok(printedHtml.includes('data:image/png;base64,PAGE_2'));
    assert.ok(printedHtml.includes('data:image/png;base64,PAGE_3'));
    assert.equal((printedHtml.match(/class="sheet-wrapper"/g) || []).length, 3, '인쇄 문서에 3페이지가 모두 포함되어야 합니다');
    assert.equal((printedHtml.match(/class="wm-block"/g) || []).length, 3, '인쇄 시 페이지당 1개씩 총 3개의 워터마크만 삽입되어야 합니다');
    assert.ok(printedHtml.includes('justify-content: center;'));
    assert.ok(printedHtml.includes('page-break-after: always'));
  }
});
