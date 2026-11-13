const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

function loadPortalGemini() {
  const exports = {};
  const filePath = path.join(__dirname, '../lib/portal-gemini.ts');
  const transpiled = ts.transpileModule(fs.readFileSync(filePath, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 }
  }).outputText;
  vm.runInNewContext(transpiled, {
    exports,
    require,
    console,
    AbortSignal,
    URL,
    encodeURIComponent,
    fetch: (...args) => global.fetch(...args)
  });
  return exports;
}

test('worksheet-ai.ts는 온라인 생각담기를 혼입하지 않고 오직 사진만 비전 분석하며 55초 타임아웃과 502 에러 반환을 적용한다', () => {
  const code = fs.readFileSync(path.join(__dirname, '../api/worksheet-ai.ts'), 'utf8');
  const geminiCode = fs.readFileSync(path.join(__dirname, '../lib/portal-gemini.ts'), 'utf8');
  assert.ok(code.includes('상투적이고 정형화된 매크로 멘트 전면 금지'), 'Should specify ban on canned phrases');
  assert.ok(code.includes('도서의 핵심 줄거리를 바탕으로 자신의 생각과 느낌을 성실하게 표현했습니다'), 'Should explicitly forbid generic summary phrase');
  assert.ok(code.includes('다음에는 왜 그렇게 생각했는지 구체적인 이유나 까닭을 한 문장 더 덧붙여 보면 더욱 좋습니다'), 'Should explicitly forbid generic nextStep phrase');
  assert.ok(code.includes('${bookTitle}』의 구체적인 장면, 인물'), 'Should require mentioning specific book scene/character');
  assert.ok(code.includes('이미지-온리(Vision-Only)'), 'Should require image-only Vision analysis');
  assert.ok(!code.includes('createFallbackSingleResult'), 'Should not fabricate HTTP 200 fallback praise');
  assert.ok(!code.includes('thoughtAnswer'), 'Single-sheet Vision prompt should not receive online thoughtAnswer');
  assert.ok(code.includes('temperature: 0.7'), 'Temperature should be 0.7 for varied output');
  assert.ok(code.includes('timeoutMs: 55000') && geminiCode.includes('AbortSignal.timeout(timeoutMs)'), 'Timeout should default to 55s');
  assert.ok(code.includes('res.status(502)'), 'Vision failure should surface 502 error instead of silent fallback');
});

test('portal-gemini.ts가 존재하지 않는 3.8 모델명을 실제 Gemini 모델로 매핑하고 404 시 폴백 모델로 재시도한다', async () => {
  const gemini = loadPortalGemini();
  assert.equal(gemini.normalizeGeminiModel('gemini-3.8-flash'), 'gemini-2.5-flash');
  assert.equal(gemini.normalizeGeminiModel('gemini-3.8-pro'), 'gemini-2.5-pro');
  assert.equal(gemini.normalizeGeminiModel('gemini-3.8-flash-lite'), 'gemini-2.5-flash-lite');

  const calledUrls = [];
  const origFetch = global.fetch;
  global.fetch = async (url) => {
    calledUrls.push(String(url));
    if (String(url).includes('gemini-2.5-flash:')) {
      return { ok: false, status: 404, text: async () => JSON.stringify({ error: { message: 'models/gemini-2.5-flash not found' } }) };
    }
    return {
      ok: true,
      status: 200,
      json: async () => ({
        candidates: [{ content: { parts: [{ thought: true, text: 'internal reasoning' }, { text: '{"summary":"손글씨 분석 결과"}' }] } }]
      })
    };
  };
  try {
    const call = await gemini.callGeminiWithFallback({
      apiKey: 'AIzaTestKey',
      rawModel: 'gemini-3.8-flash',
      body: { contents: [] }
    });
    assert.equal(calledUrls.length, 2);
    assert.ok(calledUrls[0].includes('gemini-2.5-flash:generateContent'));
    assert.ok(calledUrls[1].includes('gemini-2.0-flash:generateContent'));
    const parsed = gemini.parseGeminiJson(call.data);
    assert.equal(parsed.summary, '손글씨 분석 결과');
  } finally {
    global.fetch = origFetch;
  }
});

test('admin_worksheet_ai.js와 admin_preview.js는 생각담기를 나노시트 분석에 섞지 않고 저장된 URL 사진도 재분석한다', () => {
  const aiJs = fs.readFileSync(path.join(__dirname, '../public_html/js/admin_worksheet_ai.js'), 'utf8');
  const adminJs = fs.readFileSync(path.join(__dirname, '../public_html/admin_preview.js'), 'utf8');
  assert.ok(aiJs.includes('maxDim = 1280;'), 'Should compress to 1280px maxDim');
  assert.ok(aiJs.includes('resolveWorksheetPhotoPayload'), 'Should resolve base64 from saved URL photos for re-analysis');
  assert.ok(aiJs.includes("NanoPortal.api('/api/worksheet-ai', payload, 60000)"), 'Should call api with 60000ms timeout');
  assert.ok(!aiJs.includes('thoughtAnswer'), 'Client worksheet AI must not send or quote thoughtAnswer');
  assert.ok(!aiJs.includes('generateDynamicWorksheetFeedback'), 'Client worksheet AI must not fabricate canned feedback');
  assert.ok(!adminJs.includes('studentAns.length > 3'), 'Correction modal fallback must not copy thoughtAnswer');
});

test('학습 리포트 인쇄 CSS(학원/본사)가 여백을 압축하고 페이지 강제 끊김을 막아 빈 공간을 최소화한다', () => {
  const lrCss = fs.readFileSync(path.join(__dirname, '../public_html/css/learning-report.css'), 'utf8');
  const masterCss = fs.readFileSync(path.join(__dirname, '../public_html/css/master_preview.css'), 'utf8');
  assert.match(lrCss, /@page\s*\{\s*size:\s*A4 portrait;\s*margin:\s*8mm 10mm;/);
  assert.match(lrCss, /report-thought-card[\s\S]*break-inside:\s*auto\s*!important/);
  assert.match(lrCss, /worksheet-photo img[\s\S]*max-height:\s*150px\s*!important/);
  assert.match(masterCss, /master-report-thought-card,[\s\S]*break-inside:\s*auto\s*!important/);
});

test('vercel.json에 api/worksheet-ai.ts의 maxDuration이 60초로 지정되어 있는지 검증', () => {
  const conf = JSON.parse(fs.readFileSync(path.join(__dirname, '../vercel.json'), 'utf8'));
  assert.equal(conf.functions['api/worksheet-ai.ts']?.maxDuration, 60, 'maxDuration should be 60');
});

