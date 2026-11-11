const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('worksheet-ai.ts 프롬프트에서 상투적인 매크로 문구가 전면 금지되고 도서 맥락 작성이 명시되어 있는지 검증', () => {
  const code = fs.readFileSync(path.join(__dirname, '../api/worksheet-ai.ts'), 'utf8');
  // 금지 문구 지침 포함 여부
  assert.ok(code.includes('상투적이고 정형화된 매크로 멘트 전면 금지'), 'Should specify ban on canned phrases');
  assert.ok(code.includes('도서의 핵심 줄거리를 바탕으로 자신의 생각과 느낌을 성실하게 표현했습니다'), 'Should explicitly forbid generic summary phrase');
  assert.ok(code.includes('다음에는 왜 그렇게 생각했는지 구체적인 이유나 까닭을 한 문장 더 덧붙여 보면 더욱 좋습니다'), 'Should explicitly forbid generic nextStep phrase');
  // 도서명 직접 반영 지침 포함 여부
  assert.ok(code.includes('${bookTitle}』의 구체적인 장면, 인물'), 'Should require mentioning specific book scene/character');
  // 타임아웃 및 temperature 개선
  assert.ok(code.includes('temperature: 0.7'), 'Temperature should be 0.7 for varied output');
  assert.ok(code.includes('timeout(55000)'), 'Timeout should be 55s');
});

test('admin_worksheet_ai.js에서 60초 타임아웃, 이미지 1280px 압축, 생각답안 전달 및 동적 폴백 적용 검증', () => {
  const code = fs.readFileSync(path.join(__dirname, '../public_html/js/admin_worksheet_ai.js'), 'utf8');
  assert.ok(code.includes("maxDim = 1280;"), 'Should compress to 1280px maxDim');
  assert.ok(code.includes("thoughtAnswer = String(log.studentThoughtAnswer || log.thoughtAnswer"), 'Should pass student thought answer');
  assert.ok(code.includes("NanoPortal.api('/api/worksheet-ai', payload, 60000)"), 'Should call api with 60000ms timeout');
  assert.ok(code.includes("generateDynamicWorksheetFeedback"), 'Should have dynamic worksheet feedback generator');
  // 기존 하드코딩 문구 제거 확인
  assert.ok(!code.includes("summary: studentName + ' 학생이 도서의 핵심 줄거리를 바탕으로 자신의 생각과 느낌을 성실하게 표현했습니다.'"), 'Should not have static canned summary');
});

test('admin_preview.js의 첨삭 모달 기본값 복원 시 도서명과 학생 생각을 반영하는지 검증', () => {
  const code = fs.readFileSync(path.join(__dirname, '../public_html/admin_preview.js'), 'utf8');
  assert.ok(code.includes("defaultSummary = existingComment || (studentAns.length > 3"), 'Should conditionally format default summary with studentAns and bName');
  assert.ok(!code.includes("summary: existingComment || (sName + ' 학생이 『' + bName + '』을(를) 읽고 자신의 생각과 느낌을 주도적으로 표현했습니다.')"), 'Should not have old static summary');
});

test('vercel.json에 api/worksheet-ai.ts의 maxDuration이 60초로 지정되어 있는지 검증', () => {
  const conf = JSON.parse(fs.readFileSync(path.join(__dirname, '../vercel.json'), 'utf8'));
  assert.equal(conf.functions['api/worksheet-ai.ts']?.maxDuration, 60, 'maxDuration should be 60');
});

