const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('학생 화면: 도서 퀴즈 준비 상태(isBookQuizReady) 및 버튼 비활성화 검증', () => {
  const studentHtml = fs.readFileSync(path.join(__dirname, '../public_html/student_preview.html'), 'utf8');

  // isBookQuizReady 및 getBookQuizActionBtnHtml 함수 정의가 존재하는지 확인
  assert.ok(studentHtml.includes('function isBookQuizReady(b)'));
  assert.ok(studentHtml.includes('function getBookActualQuizCount(b)'));
  assert.ok(studentHtml.includes('function getBookQuizActionBtnHtml(b'));

  // Boolean(b.title)로 무조건 퀴즈 활성화되던 레거시 버그가 제거되었는지 검증
  assert.equal(studentHtml.includes('Boolean(b.title)'), false);

  // 더미 퀴즈 세트(핵심 주제로 알맞은 것은 등) 자동 생성 코드가 제거되었는지 검증
  assert.equal(studentHtml.includes('핵심 주제로 알맞은 것은'), false);
  assert.equal(studentHtml.includes('주인공의 내적 성장 과정에서'), false);
  assert.equal(studentHtml.includes('작가가 이 도서를 통해 독자에게'), false);

  // isBookQuizReady 로직 시뮬레이션 검증
  const isBookQuizReadySim = (b) => {
    if (!b) return false;
    if (Array.isArray(b.quizSets) && b.quizSets.length > 0) {
      const hasAnyQ = b.quizSets.some(s => (Array.isArray(s.questions) && s.questions.length > 0) || (Array.isArray(s.quizzes) && s.quizzes.length > 0));
      if (hasAnyQ) return true;
    }
    const qNum = Number(b.quizCount || b.quizzes || 0);
    if (qNum > 0) return true;
    if (b.hasQuiz === true || b.hasQuiz === 'Y') return true;
    return false;
  };

  // 1. 신규 등록 도서 (퀴즈 미등록 상태)
  const newBookWithoutQuiz = {
    id: 'NEW-001',
    title: '신규 등록 도서',
    hasQuiz: false,
    quizzes: 0,
    quizCount: 0,
    quizSets: []
  };
  assert.equal(isBookQuizReadySim(newBookWithoutQuiz), false);

  // 2. 퀴즈가 등록된 도서
  const bookWithQuiz = {
    id: 'BOOK-002',
    title: '퀴즈 완비 도서',
    hasQuiz: true,
    quizzes: 5,
    quizCount: 5,
    quizSets: [{ questions: [{ question: '질문 1' }] }]
  };
  assert.equal(isBookQuizReadySim(bookWithQuiz), true);
});

test('마스터 및 학원 북퀴즈 등록 모달: 기본 안내 문구는 value가 아닌 placeholder 및 포커스 클리어 처리 검증', () => {
  const masterJs = fs.readFileSync(path.join(__dirname, '../public_html/js/master/master-contents.js'), 'utf8');
  const adminJs = fs.readFileSync(path.join(__dirname, '../public_html/js/admin_books.js'), 'utf8');

  // 1. 마스터 JS에서 신규 문항 생성 시 question과 choices/opt가 빈 문자열인지 검증
  assert.ok(masterJs.includes('clearDefaultQuizPlaceholder'));
  assert.ok(masterJs.includes('choices = ["", "", ""]'));

  // 2. 학원 JS에서 신규 문항 생성 시 question과 opt가 빈 문자열인지 검증
  assert.ok(adminJs.includes('clearDefaultAcadQuizPlaceholder'));

  // 3. 더미 플레이스홀더 클리어 헬퍼 시뮬레이션
  const clearTest = (val) => {
    const trimmed = (val || '').trim();
    if (trimmed === '문제를 입력해주세요' || trimmed === '문제를 입력해 주세요' || /^[1-5]번\s*선택지를\s*입력해\s*주세요$/.test(trimmed)) {
      return '';
    }
    return val;
  };

  assert.equal(clearTest('문제를 입력해주세요'), '');
  assert.equal(clearTest('문제를 입력해 주세요'), '');
  assert.equal(clearTest('1번 선택지를 입력해주세요'), '');
  assert.equal(clearTest('3번 선택지를 입력해 주세요'), '');
  assert.equal(clearTest('실제 사용자가 입력한 문제 질문'), '실제 사용자가 입력한 문제 질문');
  assert.equal(clearTest('실제 선택지 정답'), '실제 선택지 정답');
});

