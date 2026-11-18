const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
process.env.PORTAL_AUTH_SECRET = 'brand-test-only-secret-more-than-32-characters';
process.env.DATABASE_URL = 'postgresql://test.invalid/brand-test';

function fixture() {
  const records = new Map([
    ['academy_meta:jd', { brand: 'JD' }],
    ['member_policy:special', { kind: 'JD_MASTER' }],
    ['banner_meta:jd-banner', { brand: 'JD' }]
  ]);
  const db = { portalSetting: {
    findUnique: async ({ where }) => records.has(where.key) ? { key: where.key, value: records.get(where.key) } : null,
    findMany: async () => [...records].filter(([key]) => key.startsWith('academy_meta:')).map(([key, value]) => ({ key, value }))
  } };
  const cache = new Map();
  function load(file) {
    const absolute = path.resolve(root, file);
    if (cache.has(absolute)) return cache.get(absolute);
    if (absolute === path.join(root, 'lib/prisma.ts')) return { prisma: db };
    if (!absolute.endsWith('.ts')) return require(absolute);
    const exports = {}; cache.set(absolute, exports);
    const code = ts.transpileModule(fs.readFileSync(absolute, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
    const localRequire = name => {
      if (!name.startsWith('.')) return require(name);
      let target = path.resolve(path.dirname(absolute), name);
      if (fs.existsSync(target + '.ts')) target += '.ts';
      else if (fs.existsSync(target + '.js')) target += '.js';
      return load(target);
    };
    vm.runInNewContext(code, { exports, require: localRequire, Buffer, process, console, URL, URLSearchParams, Date, setTimeout, clearTimeout, fetch, AbortSignal }, { filename: absolute });
    return exports;
  }
  return { db, records, load, brand: load('lib/portal-brand.ts') };
}
const user = (role = 'MASTER') => ({ id: 'special', username: 'jdmaster', role, academyId: 'jd', academy: { code: 'JD', status: 'ACTIVE', deletedAt: null }, brandPolicy: 'JD_MASTER', portalBrand: 'JD' });
const req = (url, method = 'GET', query = {}, body = {}) => ({ url, method, query, body, headers: { host: 'jd.nanosbook.co.kr' } });

test('학원 분류에 맞는 호스트만 허용하며 기존 학원은 NANO로 간주한다', async () => {
  const { brand } = fixture();
  const jd = { ...user('DIRECTOR'), username: 'director', id: 'director' };
  assert.equal((await brand.authorizeBrand(req('/api/manage'), jd)).brand, 'JD');
  await assert.rejects(() => brand.authorizeBrand({ headers: { host: 'nanosbook.co.kr' } }, jd), { status: 403 });
  const nano = { ...jd, academyId: 'nano' };
  await assert.rejects(() => brand.authorizeBrand(req('/api/manage'), nano), { status: 403 });
  assert.equal((await brand.authorizeBrand({ headers: { host: 'nanosbook.co.kr' } }, nano)).brand, 'NANO');
});
test('JD 관리자 정책은 서버 저장값에서 결정하며 Nano 호스트를 거부한다', async () => {
  const { brand } = fixture();
  await assert.rejects(() => brand.authorizeBrand({ headers: { host: 'nanosbook.co.kr' } }, user()), { status: 403 });
  assert.equal(brand.restrictedMaster(await brand.authorizeBrand(req('/api/manage'), user())), true);
});
test('JD 관리자의 변경 요청과 결제·AI·테마 변경 접근을 거부하지만 공유 및 허용된 운영 변경은 허용한다', () => {
  const { brand } = fixture();
  for (const entity of ['members', 'academies', 'portfolios', 'payments', 'ai_config', 'quizzes', 'themes']) {
    assert.throws(() => brand.guardRestrictedRequest(req('/api/manage', 'POST', { entity }), user()), { status: 403 });
  }
  for (const endpoint of ['/api/billing', '/api/portfolio-ai', '/api/worksheet-ai']) {
    assert.throws(() => brand.guardRestrictedRequest(req(endpoint, 'POST'), user()), { status: 403 });
  }
  for (const entity of ['books', 'banners', 'notices', 'recommendations']) {
    assert.doesNotThrow(() => brand.guardRestrictedRequest(req('/api/manage', 'POST', { entity }), user()));
  }
  assert.doesNotThrow(() => brand.guardRestrictedRequest(req('/api/content', 'POST', { action: 'quiz' }), user()));
  assert.doesNotThrow(() => brand.guardRestrictedRequest(req('/api/manage', 'GET', { entity: 'rankings' }), user()));
  assert.doesNotThrow(() => brand.guardRestrictedRequest(req('/api/manage', 'GET', { entity: 'themes' }), user()));
});
test('직접 지정한 다른 브랜드 학원과 운영 항목 ID를 거부한다', async () => {
  const { brand } = fixture();
  await assert.rejects(() => brand.assertBrandAcademy(user(), 'nano'), { status: 403 });
  await brand.assertBrandAcademy(user(), 'jd');
  await assert.rejects(() => brand.operationInBrand('banner_meta', 'nano-banner', 'JD'), { status: 403 });
  await assert.rejects(() => brand.operationInBrand('banner_meta', 'jd-banner', 'NANO'), { status: 403 });
  await brand.operationInBrand('banner_meta', 'jd-banner', 'JD');
});
test('JD 관리자는 같은 본사라도 본인이 등록한 퀴즈·나노시트만 편집·공유한다', () => {
  const { load } = fixture();
  const content = load('lib/portal-content.ts');
  for (const fn of ['ownsContent', 'isOwnSheet', 'canShareContent']) {
    assert.equal(content[fn](user(), { ownerMemberId: 'other', ownerAcademyId: 'jd', authorType: 'HQ' }), false);
    assert.equal(content[fn](user(), { ownerMemberId: 'special', ownerAcademyId: 'jd', authorType: 'HQ' }), true);
    assert.equal(content[fn](user(), { ownerAcademyId: '', authorType: 'HQ' }), false);
  }
});
test('가맹점 목록 API의 SQL 조건은 JD 학원 ID로 제한된다', async () => {
  const f = fixture(); let filter;
  f.db.academy = { findMany: async args => { filter = args.where; return []; } };
  const http = f.load('lib/portal-http.ts'); http.authenticate = async () => user();
  const handler = f.load('api/manage.ts').default;
  const res = { setHeader() {}, json(value) { this.data = value; }, status(code) { this.code = code; return this; } };
  await handler(req('/api/manage', 'GET', { entity: 'academies' }), res);
  assert.equal(JSON.stringify(filter.id.in), '["jd"]');
});
test('타인 도서 수정 요청은 데이터 변경 전에 거부한다', async () => {
  const f = fixture(); let writes = 0;
  f.db.book = { findUnique: async () => ({ id: 'book', bookNo: 'BOOK-1' }), delete: async () => { writes++; } };
  const http = f.load('lib/portal-http.ts'); http.authenticate = async () => user();
  const handler = f.load('api/manage.ts').default;
  const res = { setHeader() {}, json(value) { this.data = value; }, status(code) { this.code = code; return this; } };
  await handler(req('/api/manage', 'POST', { entity: 'books' }, { operation: 'delete', data: { id: 'book' } }), res);
  assert.equal(res.code, 403); assert.equal(writes, 0);
});

test('유효한 세션으로 직접 호출해도 조회 전용 변경 API를 차단한다', async () => {
  const f = fixture();
  const auth = f.load('lib/portal-auth.ts');
  const password = auth.hashPassword('test-password');
  f.db.member = { findUnique: async () => ({ ...user(), status: 'APPROVED', password }) };
  const request = req('/api/manage', 'POST', { entity: 'members' });
  request.headers = { host: 'jd.nanosbook.co.kr', origin: 'https://jd.nanosbook.co.kr', 'content-type': 'application/json', cookie: 'nano_portal=' + auth.signSession('special', password) };
  await assert.rejects(() => f.load('lib/portal-http.ts').authenticate(request), { status: 403 });
});

test('초기 페이지는 JD 회원·공지·배너만 제공하며 결제 데이터를 조회하지 않는다', async () => {
  const f = fixture();
  const auth = f.load('lib/portal-auth.ts');
  const password = auth.hashPassword('test-password');
  const date = new Date('2026-11-01T00:00:00Z');
  const current = { ...user(), name: 'JD 운영자', status: 'APPROVED', password, createdAt: date, updatedAt: date, academy: { ...user().academy, name: 'JD 본사' } };
  const other = { ...current, id: 'other', username: 'nano-only', academyId: 'nano', academy: { code: 'NANO', name: '나노 학원' } };
  f.db.member = { findUnique: async () => current, findMany: async ({ where }) => [current, other].filter(m => !where.academyId || where.academyId.in.includes(m.academyId)) };
  f.db.academy = { findMany: async ({ where }) => ['jd', 'nano'].filter(id => !where.id || where.id.in.includes(id)).map(id => ({ id, code: id, name: id, _count: { members: 0 }, joinDate: date, startDate: date, endDate: date })) };
  for (const name of ['book', 'classGroup', 'academyBook', 'aligoDispatchLog']) f.db[name] = { findMany: async () => [] };
  f.db.quizAttempt = { groupBy: async () => [] };
  f.db.bookQuiz = { groupBy: async () => [] };
  f.db.payment = { findMany: async () => assert.fail('조회 전용 계정에 결제 목록 조회') };
  f.db.mainBanner = { findMany: async () => [{ id: 'jd-banner', title: 'JD 배너' }, { id: 'nano-banner', title: 'NANO 배너' }] };
  f.db.themeCategory = { findMany: async () => [{ id: 'nano-theme', code: 'T1', name: '이야기', description: '' }, { id: 'jd-only-theme', code: 'T2', name: 'JD전용', description: '' }] };
  f.records.set('theme_meta:jd-only-theme', { brand: 'JD', order: 2 });
  f.records.set('theme_meta:nano-theme', { brand: 'NANO', order: 1 });
  f.db.notice = { findMany: async () => [{ id: 'jd-notice', title: 'JD 공지', createdAt: date }, { id: 'nano-notice', title: 'NANO 공지', createdAt: date }] };
  f.records.set('notice_meta:jd-notice', { brand: 'JD' });
  f.db.portalSetting.findMany = async ({ where }) => [...f.records].map(([key, value]) => ({ key, value, scope: key.split(':')[0] })).filter(r => {
    if (typeof where.scope === 'string') return r.scope === where.scope;
    if (where.scope?.in) return where.scope.in.includes(r.scope);
    if (where.key?.startsWith) return r.key.startsWith(where.key.startsWith);
    return true;
  });
  const request = req('/api/bootstrap');
  request.headers.cookie = 'nano_portal=' + auth.signSession('special', password);
  const res = { code: 200, setHeader() {}, status(code) { this.code = code; return this; }, send(value) { this.data = value; } };
  await f.load('api/bootstrap.ts').default(request, res);
  assert.equal(res.code, 200);
  const context = { window: {}, sessionStorage: { setItem() {} } };
  vm.runInNewContext(res.data, context);
  assert.equal(context.window.NANO_RESTRICTED_MASTER, true);
  assert.equal(context.window.MIGRATED_MEMBERS.length, 1);
  assert.equal(context.window.MIGRATED_FRANCHISES.length, 1);
  assert.equal(context.window.NANO_SERVER_NOTICES.length, 1);
  assert.equal(context.window.NANO_SERVER_NOTICES[0].title, 'JD 공지');
  assert.equal(context.window.NANO_SERVER_THEMES.length, 1);
  assert.equal(context.window.NANO_SERVER_THEMES[0].id, 'nano-theme');
  assert.ok(!res.data.includes('NANO 배너'));
  assert.ok(!res.data.includes('nano-only'));
});

test('JD 공지 생성은 브랜드 메타데이터와 함께 저장하고 타 브랜드 수정을 차단한다', async () => {
  const f = fixture(); let savedMeta; let writes = 0;
  const tx = { notice: { create: async ({ data }) => { writes++; return { id: 'new-notice', ...data }; } }, portalSetting: { upsert: async args => { savedMeta = args.create; } } };
  f.db.$transaction = async fn => fn(tx);
  f.load('lib/portal-http.ts').authenticate = async () => user();
  const handler = f.load('api/manage.ts').default;
  const response = () => ({ code: 200, setHeader() {}, status(code) { this.code = code; return this; }, json(value) { this.data = value; } });
  const created = response();
  await handler(req('/api/manage', 'POST', { entity: 'notices' }, { operation: 'save', data: { title: 'JD 공지', content: '안내' } }), created);
  assert.equal(created.code, 200); assert.equal(savedMeta.value.brand, 'JD');
  const denied = response();
  await handler(req('/api/manage', 'POST', { entity: 'notices' }, { operation: 'save', data: { id: 'nano-notice', title: '변경', content: '안내' } }), denied);
  assert.equal(denied.code, 403); assert.equal(writes, 1);
});

test('JD 추천 도서 설정은 공통 도서의 Nano 추천 값을 변경하지 않는다', async () => {
  const f = fixture(); let saved;
  f.db.book = { findUnique: async () => ({ id: 'book', isRecommended: true }), update: async () => assert.fail('공통 도서 변경') };
  f.db.portalSetting.upsert = async args => { saved = args; };
  f.load('lib/portal-http.ts').authenticate = async () => user();
  const handler = f.load('api/manage.ts').default;
  const res = { code: 200, setHeader() {}, status(code) { this.code = code; return this; }, json(value) { this.data = value; } };
  await handler(req('/api/manage', 'POST', { entity: 'recommendations' }, { data: { bookId: 'book', recommended: false } }), res);
  assert.equal(res.code, 200);
  assert.equal(saved.create.scope, 'brand_recommend:JD');
  assert.equal(saved.create.value.recommended, false);
});

test('JD 배너·테마가 비어 있어도 Nano 기본값이나 과거 브라우저 캐시로 대체하지 않는다', () => {
  const html = fs.readFileSync(path.join(root, 'public_html/student_preview.html'), 'utf8');
  const context = { window: { NANO_SERVER_DATA: true, NANO_BRAND: 'JD', NANO_SERVER_THEMES: [], NANO_SERVER_BANNERS: [] }, localStorage: { getItem() { assert.fail('과거 브랜드 캐시 조회'); } } };
  for (const name of ['getStudentThemes', 'getStudentBanners']) {
    const start = html.indexOf('function ' + name + '() {');
    const end = html.indexOf('\n}', start) + 2;
    vm.runInNewContext(html.slice(start, end), context);
    assert.equal(context[name]().length, 0);
  }
  context.window.NANO_SERVER_BANNERS = [{ id: 'jd-banner' }];
  assert.equal(context.getStudentBanners()[0].id, 'jd-banner');
});

test('전체 학습 조회에서도 JD 학원 조건을 강제한다', async () => {
  const f = fixture(); let filter;
  const auth = f.load('lib/portal-auth.ts');
  const password = auth.hashPassword('test-password');
  f.db.member = { findUnique: async () => ({ ...user(), status: 'APPROVED', password }) };
  f.db.quizAttempt = { findMany: async ({ where }) => { filter = where; return []; } };
  f.db.book = { findMany: async () => [] };
  const request = req('/api/portal', 'GET', { action: 'learning', academy: 'ALL' });
  request.headers.cookie = 'nano_portal=' + auth.signSession('special', password);
  const res = { code: 200, setHeader() {}, status(code) { this.code = code; return this; }, json(value) { this.data = value; } };
  await f.load('api/portal.ts').default(request, res);
  assert.equal(res.code, 200);
  assert.equal(JSON.stringify(filter.member.academyId.in), '["jd"]');
});

test('다른 발급본 ID를 직접 지정해도 포트폴리오 조회 범위는 JD로 제한된다', async () => {
  const f = fixture(); let filter;
  const original = f.db.portalSetting.findMany;
  f.db.portalSetting.findMany = async args => {
    if (args.where.scope === 'academy_meta') return original(args);
    filter = args.where; return [];
  };
  f.load('lib/portal-http.ts').authenticate = async () => user();
  const res = { code: 200, setHeader() {}, status(code) { this.code = code; return this; }, json(value) { this.data = value; } };
  await f.load('api/manage.ts').default(req('/api/manage', 'GET', { entity: 'portfolios', academy: 'ALL', id: 'nano-portfolio' }), res);
  assert.equal(res.code, 200);
  assert.equal(JSON.stringify(filter.scope.in), '["portfolio:jd"]');
  assert.equal(filter.key, 'nano-portfolio');
});

test('jd.nanosbook.co.kr 및 JD_MASTER 마스터 포털에서는 수납·결제 관리와 시스템 설정 섹션·메뉴가 숨겨진다', () => {
  const masterHtml = fs.readFileSync(path.join(root, 'public_html/master_preview.html'), 'utf8');
  const brandCss = fs.readFileSync(path.join(root, 'public_html/css/portal-brand.css'), 'utf8');
  const masterCore = fs.readFileSync(path.join(root, 'public_html/js/master/master-core.js'), 'utf8');

  assert.match(masterHtml, /id="sidebar-section-master-payment"[^>]*>수납 & 결제 관리</);
  assert.match(masterHtml, /id="sidebar-section-master-system"[^>]*>시스템 설정</);
  assert.match(masterHtml, /\/css\/portal-brand\.css\?v=20261118_themes/);
  assert.match(masterHtml, /js\/master\/master-core\.js\?v=20261118_themes/);

  for (const selectorPrefix of ['html[data-brand="JD"]', 'html[data-restricted-master="true"]']) {
    for (const id of [
      '#sidebar-section-master-payment',
      '#nav-master-payment',
      '#tab-master-payment',
      '#sidebar-section-master-system',
      '#nav-master-ai-settings',
    ]) {
      assert.ok(brandCss.includes(`${selectorPrefix} ${id}`), `${selectorPrefix} ${id} 숨김 규칙이 필요합니다`);
    }
  }
  assert.ok(brandCss.includes('html[data-restricted-master="true"] #btn-op-themes'), 'jdmaster에서 테마 관리 버튼 숨김 규칙이 필요합니다');
  assert.ok(brandCss.includes('html[data-restricted-master="true"] #op-sub-themes'), 'jdmaster에서 테마 관리 패널 숨김 규칙이 필요합니다');

  assert.match(masterCore, /isJdBrand\s*&&\s*\['payment', 'ai-settings'\]\.includes\(tabName\)/);
  assert.match(masterCore, /window\.NANO_RESTRICTED_MASTER\s*&&\s*subName\s*===\s*["']themes["']/);
  assert.match(masterCore, /async function openMasterAiSettingsModal\(\)[\s\S]{0,400}if \(window\.NANO_RESTRICTED_MASTER \|\| isJdBrand\) return;/);
});

test('jd.nanosbook.co.kr은 코발트 블루 계열 포인트 컬러와 Pretendard Variable 타이포그래피로 통일된다', () => {
  const brandCss = fs.readFileSync(path.join(root, 'public_html/css/portal-brand.css'), 'utf8');
  const sharingCss = fs.readFileSync(path.join(root, 'public_html/css/content-sharing.css'), 'utf8');
  const studentHtml = fs.readFileSync(path.join(root, 'public_html/student_preview.html'), 'utf8');

  const expectedBrandCssByPage = {
    'public_html/admin_preview.html': /\/css\/portal-brand\.css\?v=20261117_print_btn/,
    'public_html/master_preview.html': /\/css\/portal-brand\.css\?v=20261118_themes/,
  };
  for (const page of [
    'public_html/index.html',
    'public_html/student_preview.html',
    'public_html/admin_preview.html',
    'public_html/master_preview.html',
    'public_html/literacy_report.html',
    'public_html/portfolio_report.html',
    'public_html/quiz_result.html',
  ]) {
    const html = fs.readFileSync(path.join(root, page), 'utf8');
    assert.match(html, /pretendardvariable-dynamic-subset\.min\.css/, `${page}에 Pretendard Variable CDN이 필요합니다`);
    assert.doesNotMatch(html, /static\/pretendard(?:\.min)?\.css/, `${page}의 구형 static Pretendard 링크를 제거해야 합니다`);
    assert.match(html, expectedBrandCssByPage[page] || /\/css\/portal-brand\.css\?v=20261117_jd_theme/, `${page}에 최신 portal-brand.css 캐시 키가 필요합니다`);
  }

  assert.doesNotMatch(studentHtml, /NanumSquareRound/);
  assert.doesNotMatch(studentHtml, /letter-spacing:\s*-0\.35px/);
  assert.match(sharingCss, /font-family:\s*'Pretendard Variable'/);
  assert.match(sharingCss, /font-variant-numeric:\s*tabular-nums/);

  for (const selector of [
    'html[data-brand="JD"] .s-header::before',
    'html[data-brand="JD"] .btn-drawer-hamburger',
    'html[data-brand="JD"] .user-info-pill',
    'html[data-brand="JD"] .drawer-header',
    'html[data-brand="JD"] #homeCharWelcomeBanner',
    'html[data-brand="JD"] .grade-chip.active',
    'html[data-brand="JD"] .act-btn.start',
    'html[data-brand="JD"] .qopt.selected',
    'html[data-brand="JD"] .bookshelf-main-tabs',
    'html[data-brand="JD"] .point-summary-card',
    'html[data-brand="JD"] .my-rank-banner',
    'html[data-brand="JD"] .myinfo-hero-card',
    'html[data-brand="JD"] .btn-login',
    'html[data-brand="JD"] .btn-beige-secondary:hover',
  ]) {
    assert.ok(brandCss.includes(selector), `${selector} JD 테마 규칙이 필요합니다`);
  }
});

test('학생 포털에서 캐릭터 선택은 홈 메인 화면(#homeCharWelcomeBanner)에서만 열리며 내 정보 아이디 배지는 본문 폰트를 따른다', () => {
  const studentHtml = fs.readFileSync(path.join(root, 'public_html/student_preview.html'), 'utf8');
  const openTriggers = studentHtml.match(/openCharacterSelectModal\(/g) || [];
  // 함수 정의 1곳 + 홈 메인 화면 배너(#homeCharWelcomeBanner) 1곳만 존재해야 합니다.
  assert.equal(openTriggers.length, 2);
  assert.match(studentHtml, /id="homeCharWelcomeBanner"[\s\S]{0,400}onclick="openCharacterSelectModal\(\)"/);
  assert.doesNotMatch(studentHtml, /id="btnDrawerNav_char"/);
  assert.doesNotMatch(studentHtml, /id="drawerCharAvatar"[\s\S]{0,160}char-edit-badge/);
  assert.match(studentHtml, /class="myinfo-id-pill"/);
  assert.doesNotMatch(studentHtml, /identity\.studentId[\s\S]{0,80}monospace|monospace[\s\S]{0,140}identity\.studentId/);
});
