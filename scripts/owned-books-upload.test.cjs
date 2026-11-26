const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

const root = path.resolve(__dirname, '..');

test('보유도서 등록 버튼이 엑셀 도서 등록과 엑셀 북퀴즈 등록 사이에 배치되고 안내 모달이 존재한다', () => {
  const html = fs.readFileSync(path.join(root, 'public_html/admin_preview.html'), 'utf8');
  const iBook = html.indexOf('엑셀 도서 등록');
  const iOwned = html.indexOf('보유도서 등록');
  const iQuiz = html.indexOf('엑셀 북퀴즈 등록');
  assert.ok(iBook > 0 && iOwned > iBook && iQuiz > iOwned, '버튼 순서: 엑셀 도서 등록 -> 보유도서 등록 -> 엑셀 북퀴즈 등록');
  assert.ok(html.includes('id="acadOwnedBookExcelModal"'));
  assert.ok(html.includes('기존 시스템에 저장된 보유 상태를 그대로 유지'));
});

test('도서 목록 CSV 다운로드 헤더에 등록일자 옆 보유 여부 컬럼이 포함된다', () => {
  const src = fs.readFileSync(path.join(root, 'public_html/js/admin_books.js'), 'utf8');
  assert.match(src, /"등록일자",\s*"보유 여부"/);
});

test('보유도서 CSV/엑셀 파서는 도서코드와 보유 여부(Y/N/빈칸)만 정확히 판별한다', () => {
  const src = fs.readFileSync(path.join(root, 'public_html/js/admin_books.js'), 'utf8');
  const start = src.indexOf('function parseOwnedCsvTextToMatrix');
  const end = src.indexOf('function processAcadOwnedBookFile');
  assert.ok(start > 0 && end > start);

  const ctx = vm.createContext({ Map, Set });
  vm.runInContext(src.slice(start, end), ctx);

  const csv = [
    '\uFEFF"도서코드(ID)","ISBN","도서명","등록일자","보유 여부"',
    '"FA000001","=""979118707""","책1","2026-11-26","Y"',
    '"FA000002","","책2","2026-11-26","n"',
    '"FA000003","","책3","2026-11-26",""',
    '"=""FA000004""","","책4","2026-11-26","X"',
  ].join('\r\n');

  const matrix = ctx.parseOwnedCsvTextToMatrix(csv);
  const parsed = ctx.parseOwnedBookMatrix(matrix);
  assert.equal(parsed.totalRows, 4);
  assert.equal(parsed.addCount, 1);
  assert.equal(parsed.removeCount, 1);
  assert.equal(parsed.keepCount, 1);
  assert.equal(parsed.invalidValues.length, 1);
  assert.deepEqual(JSON.parse(JSON.stringify(parsed.changeRows)), [
    { bookCode: 'FA000001', owned: 'Y' },
    { bookCode: 'FA000002', owned: 'N' },
  ]);
});

test('api/manage.ts가 오류 없이 트랜스파일되고 owned bulk 핸들러를 포함한다', () => {
  const src = fs.readFileSync(path.join(root, 'api/manage.ts'), 'utf8');
  const res = ts.transpileModule(src, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    reportDiagnostics: true,
  });
  assert.equal((res.diagnostics || []).length, 0);
  assert.ok(src.includes("body.operation === 'bulk'"));
});
