const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('학생 생각담기 질문에서 10자 미만이면 채점하기 버튼이 비활성화되고 10자 이상이면 활성화된다', () => {
  const html = fs.readFileSync(path.join(__dirname, '../public_html/student_preview.html'), 'utf8');

  // 1. onThoughtTextareaInput 함수 로직 검증
  assert.ok(html.includes('len >= 10'));
  assert.ok(html.includes('nx.disabled = !isEnough'));

  // 2. 초기 렌더링 시 10자 검증
  assert.ok(html.includes('var isEnough = curLen >= 10;'));
  assert.ok(html.includes('thoughtCharCountBadge'));

  // 3. goNext 및 showResult 10자 미만 차단 검증
  assert.ok(html.includes('currentStudentThoughtAnswer || \'\').trim().length < 10'));
  assert.ok(html.includes('생각담기 글을 최소 10자 이상 작성해 주세요.'));
});

