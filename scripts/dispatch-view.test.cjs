const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

test('운영 발송 기록은 템플릿 분류와 한국 시간으로 표시한다', () => {
  const context = { exports: {}, process: { env: {} } };
  vm.runInNewContext(ts.transpile(fs.readFileSync('lib/dispatch-view.ts', 'utf8'), { module: ts.ModuleKind.CommonJS }), context);
  assert.equal(context.exports.dispatchTemplate('quiz_123', 'custom').type, 'QUIZ');
  assert.equal(context.exports.dispatchTemplate('pf_123', 'custom').type, 'PORTFOLIO');
  assert.equal(context.exports.dispatchTemplate('lit_123', 'custom').type, 'LITERACY');
  assert.equal(context.exports.dispatchDate(new Date('2026-10-31T15:01:00Z')), '2026-11-01 00:01:00');
});

test('마스터 검색은 학원·템플릿·기간을 함께 적용하고 초기화한다', () => {
  const fields = Object.fromEntries(['dispatchSearchInput', 'dispatchAcademyFilter', 'dispatchTemplateFilter', 'dispatchStatusFilter', 'dispatchDateFrom', 'dispatchDateTo'].map(id => [id, { value: '' }]));
  fields.dispatchAcademyFilter.value = '가맹점';
  fields.dispatchTemplateFilter.value = 'QUIZ';
  fields.dispatchStatusFilter.value = 'ALL';
  fields.dispatchDateFrom.value = '2026-11-01';
  fields.dispatchDateTo.value = '2026-11-10';
  const log = { academyName: '가맹점', type: 'QUIZ', status: 'ACCEPTED', receiverName: '보호자', receiverPhone: '01012345678', summary: '' };
  const context = { window: {}, document: { getElementById: id => fields[id] }, dispatchLogs: [
    { ...log, id: 'included', datetime: '2026-11-10 23:59:59' },
    { ...log, id: 'old', datetime: '2026-10-31 23:59:59' },
    { ...log, id: 'other', type: 'PORTFOLIO', datetime: '2026-11-10 00:00:00' },
  ] };
  vm.createContext(context);
  vm.runInContext(fs.readFileSync('public_html/js/master/master-dispatch.js', 'utf8'), context);
  let result;
  context.renderDispatchTable = data => { result = data; };
  context.filterDispatchList();
  assert.deepEqual(Array.from(result, log => log.id), ['included']);
  context.resetDispatchFilters();
  assert.equal(fields.dispatchDateFrom.value, '');
  assert.equal(fields.dispatchDateTo.value, '');
});
