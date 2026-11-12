// 마스터 및 학원 도서 콘텐츠 관리 화면의 버튼명 및 모달 제목 변경 검증 테스트
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..', 'public_html');

test('본사 마스터 도서 관리 헤더 버튼명 변경 검증', () => {
  const html = fs.readFileSync(path.join(root, 'master_preview.html'), 'utf8');

  // 변경된 4종 버튼명 확인
  assert.ok(html.includes('도서 목록 다운로드'), '도서 목록 다운로드 버튼이 존재해야 합니다.');
  assert.ok(html.includes('엑셀 도서 등록'), '엑셀 도서 등록 버튼이 존재해야 합니다.');
  assert.ok(html.includes('엑셀 북퀴즈 등록'), '엑셀 북퀴즈 등록 버튼이 존재해야 합니다.');
  assert.ok(html.includes('신규 도서 등록'), '신규 도서 등록 버튼이 존재해야 합니다.');

  // 이전 명칭이 헤더 버튼에 남아있지 않은지 확인
  assert.ok(!html.includes('엑셀 대량 도서 등록'), '이전 텍스트 "엑셀 대량 도서 등록"이 남아있지 않아야 합니다.');
  assert.ok(!html.includes('엑셀 대량 북퀴즈 등록'), '이전 텍스트 "엑셀 대량 북퀴즈 등록"이 남아있지 않아야 합니다.');
  assert.ok(!html.includes('신규 마스터 도서 등록'), '이전 텍스트 "신규 마스터 도서 등록"이 남아있지 않아야 합니다.');
});

test('마스터 모달 템플릿 타이틀 및 헤더 검증', () => {
  const html = fs.readFileSync(path.join(root, 'modals', 'master_modals.html'), 'utf8');

  assert.ok(html.includes('신규 도서 등록'), '모달 타이틀 "신규 도서 등록"이 존재해야 합니다.');
  assert.ok(html.includes('엑셀 도서 등록'), '모달 타이틀 "엑셀 도서 등록"이 존재해야 합니다.');
  assert.ok(html.includes('엑셀 북퀴즈 등록'), '모달 타이틀 "엑셀 북퀴즈 등록"이 존재해야 합니다.');

  assert.ok(!html.includes('신규 마스터 도서 등록'), '"신규 마스터 도서 등록" 잔존 여부 확인');
  assert.ok(!html.includes('엑셀 대량 도서 등록'), '"엑셀 대량 도서 등록" 잔존 여부 확인');
  assert.ok(!html.includes('엑셀 대량 북퀴즈 등록'), '"엑셀 대량 북퀴즈 등록" 잔존 여부 확인');
});

test('학원 관리자 도서 관리 버튼명 및 모달 타이틀 검증', () => {
  const html = fs.readFileSync(path.join(root, 'admin_preview.html'), 'utf8');

  // 버튼명 확인
  assert.ok(html.includes('도서 목록 다운로드'), '학원 화면 도서 목록 다운로드 버튼이 존재해야 합니다.');
  assert.ok(html.includes('엑셀 도서 등록'), '학원 화면 엑셀 도서 등록 버튼이 존재해야 합니다.');
  assert.ok(html.includes('엑셀 북퀴즈 등록'), '학원 화면 엑셀 북퀴즈 등록 버튼이 존재해야 합니다.');

  // 이전 명칭 잔존 여부 확인
  assert.ok(!html.includes('엑셀 대량 도서 등록'), '학원 화면에 이전 텍스트 "엑셀 대량 도서 등록"이 남아있지 않아야 합니다.');
  assert.ok(!html.includes('엑셀 대량 북퀴즈 등록'), '학원 화면에 이전 텍스트 "엑셀 대량 북퀴즈 등록"이 남아있지 않아야 합니다.');
});

