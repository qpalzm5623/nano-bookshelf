const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

function load(file, modules = {}) {
  if (/^api\/(portal|bootstrap|manage)\.ts$/.test(file)) modules = { '../lib/portal-content': require('./test-portal-content.cjs')(modules['../lib/portal-http']), ...modules };
  const code = fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
  const transpiled = ts.transpileModule(code, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const fn = new Function('require', 'exports', 'module', transpiled);
  const mod = { exports: {} };
  const customRequire = id => {
    if (modules[id]) return modules[id];
    return require(id);
  };
  fn(customRequire, mod.exports, mod);
  return mod.exports;
}

function response() {
  return {
    code: 200,
    headers: {},
    setHeader(k, v) { this.headers[k] = v; },
    status(c) { this.code = c; return this; },
    json(d) { this.data = d; return this; },
    send(d) { this.data = d; return this; }
  };
}

test('도서 수정 모달에 나노시트 삭제 버튼 및 AI 3문장 요약 버튼이 존재한다', () => {
  const modalHtml = fs.readFileSync(path.join(__dirname, '../public_html/modals/master_modals.html'), 'utf8');
  assert.ok(modalHtml.includes('btnDeleteMasterBookSheet'));
  assert.ok(modalHtml.includes('handleRemoveMasterBookSheet()'));
  assert.ok(modalHtml.includes('btnAiSummarizeSynopsis'));
  assert.ok(modalHtml.includes('triggerAiSynopsisSummary()'));
});

test('출판사 줄거리 HTML 엔티티 정제 및 Gemini 3문장 요약 API가 올바르게 작동한다', async () => {
  const rawHtmlText = '&lt;우리 문화 속 수수께끼&gt; 시리즈 제2권 『터줏대감』. &lt;우리 문화 속 수수께끼&gt; 시리즈는 오랜 세월 우리 의식 속에 자리 잡아 행동과 생활 방식, 문화에 두루 영향을 미친 문화의 원형을 소개하고 있습니다. 또한 우리 민족의 정서와 우리 삶의 터전을 지켜온 가신 신앙을 재미있게 풀어냈습니다. 주인공 진우는 할머니 댁에서 터줏대감 단지를 발견하고 조상들의 지혜를 깨닫게 됩니다.';

  const master = {
    id: 'master-1',
    role: 'MASTER',
    academyId: 'hq-1',
    academy: { code: 'HQ', name: '본사' }
  };

  const db = {
    portalSetting: {
      findUnique: async () => null // API 키 미등록 시 스마트 3문장 폴백 검증
    }
  };

  const http = load('lib/portal-http.ts', {
    './prisma': { prisma: db },
    './portal-auth': {}
  });

  const manageHandler = load('api/manage.ts', {
    '../lib/prisma': { prisma: db },
    '../lib/portal-http': {
      ...http,
      authenticate: async () => master,
      academyScope: async () => master.academyId
    },
    '../lib/portal-auth': { hashPassword: () => '$hash' },
    '../lib/portal-learning': {}
  }).default;

  const res = response();
  await manageHandler({
    method: 'POST',
    query: { entity: 'summarize_synopsis' },
    body: {
      rawText: rawHtmlText,
      title: '터줏대감',
      author: '유다정'
    }
  }, res);

  assert.equal(res.code, 200);
  assert.ok(res.data.summary);
  // HTML 엔티티(&lt;, &gt;)가 디코딩되고 깨끗하게 정제되었는지 검증
  assert.equal(res.data.summary.includes('&lt;'), false);
  assert.equal(res.data.summary.includes('&gt;'), false);
  assert.ok(res.data.summary.includes('<우리 문화 속 수수께끼>') || res.data.summary.includes('터줏대감'));
});

