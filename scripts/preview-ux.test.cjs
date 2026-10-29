// 브라우저나 서버 없이 실제 프리뷰 함수의 저장·복원·계정 분리를 검증합니다.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const root = path.join(__dirname, '..', 'public_html');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

function storage() {
  const values = new Map();
  return {
    getItem: key => values.has(key) ? values.get(key) : null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: key => values.delete(key)
  };
}

// 문자열의 중괄호가 아니라 TypeScript 파서로 함수의 정확한 범위를 가져옵니다.
function loadFunctions(context, file, names) {
  let source = read(file);
  if (file.endsWith('.html')) {
    source = [...source.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)]
      .map(match => match[1]).join('\n');
  }
  const ast = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
  for (const name of names) {
    const node = ast.statements.find(item => ts.isFunctionDeclaration(item) && item.name.text === name);
    assert.ok(node, `${file}: ${name} 함수 없음`);
    vm.runInContext(node.getText(ast), context);
  }
}

function context(localStorage = storage()) {
  const elements = new Map();
  const notices = [];
  function element() {
    return {
      value: '', style: {}, disabled: false, innerHTML: '', textContent: '',
      classList: { add() {}, remove() {} },
      setAttribute() {}, removeAttribute() {}, addEventListener() {}, appendChild() {}
    };
  }
  const ctx = vm.createContext({
    console: { warn() {}, error() {} }, localStorage, sessionStorage: storage(),
    document: {
      getElementById(id) {
        if (!elements.has(id)) elements.set(id, element());
        return elements.get(id);
      },
      createElement: element, querySelector: () => null, querySelectorAll: () => [],
      addEventListener() {}
    },
    addEventListener() {}, scrollTo() {}, toast: message => notices.push(message),
    showAcademyToast: message => notices.push(message),
    switchPanel() {}, openBookDetail() {},
    generateQuizResultIllustration: () => '',
    getUserCharacterId: () => 'nano', getCharacterById: () => ({ name: '나노', themeColor: '#185b45' }),
    getCharacterSvg: () => '', CHAR_QUIZ_FEEDBACKS: { nano: { perfect: '', high: '', pass: '', retry: '' } },
    getCharacterUnlockStatus: () => ({ currentStage: 1, unlocked: true }),
    curBook: null, curData: null, curQ: 0, curSelectedQuizSet: null, anss: [],
    studentSelectedAnsMap: {}, currentStudentThoughtAnswer: '', studentQuizAttemptId: null,
    studentQuizDraftKey: null, studentQuizSignature: '', studentQuizOwner: null,
    studentQuizSubmitted: false, currentDetailBookId: null, prevPanel: 'books',
    currentAcademyInfo: { id: 'A' }, MIGRATED_LEARNING_LOGS: [], notices
  });
  ctx.window = ctx;
  vm.runInContext(read('js/learning-storage.js'), ctx);
  vm.runInContext(read('js/preview-data.js'), ctx);
  return ctx;
}

function student(localStorage, account = 'student-a', academyId = 'A') {
  const ctx = context(localStorage);
  ctx.sessionStorage.setItem('nano_auth_user', JSON.stringify({
    id: account, role: 'student', studentName: '검증 학생 ' + account,
    academyId, academyName: '검증 학원', classGroup: '검증반'
  }));
  loadFunctions(ctx, 'student_preview.html', [
    'getStudentQuizIdentity', 'updateStudentSessionLabels', 'setQuizDraftStatus', 'escapeStudentQuizText', 'saveStudentQuizDraft',
    'startQuizWithSet', 'renderQ', 'onThoughtTextareaInput', 'selectAns', 'goNext',
    'goPreviousQuestion', 'showResult', 'syncQuizResultToAdminLearning', 'backToSelect', 'checkDailyQuizLimit'
  ]);
  return ctx;
}

const book = { id: 'BOOK-1', title: '검증 도서', thinkInsert: '나의 생각은?' };
const quiz = { id: 'SET-1', authorName: '본사', questions: [
  { question: '첫 문제', options: ['가', '나'], ans: '2' },
  { question: '둘째 문제', options: ['다', '라'], ans: '1' }
] };

function answerAll(ctx) {
  ctx.startQuizWithSet(book, quiz);
  ctx.selectAns(1);
  ctx.goNext();
  ctx.selectAns(0);
  ctx.goNext();
  ctx.onThoughtTextareaInput('내 생각 <태그> & 줄바꿈\n두 번째 줄');
}

test('수정한 HTML/JS의 모든 실행 스크립트가 구문 검사에 통과한다', () => {
  for (const file of ['index.html', 'student_preview.html', 'admin_preview.html', 'master_preview.html']) {
    for (const match of read(file).matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
      if (!/\bsrc\s*=/.test(match[1]) && match[2].trim()) new vm.Script(match[2], { filename: file });
    }
  }
  for (const file of ['admin_preview.js', 'master_preview.js', 'js/learning-storage.js', 'js/preview-data.js', 'js/portal-client.js', 'js/portal-extras.js', 'js/preview-ux.js', 'service-worker.js']) {
    new vm.Script(read(file), { filename: file });
  }
});

test('학생 알림 요소가 toast 함수 이름을 덮어쓰지 않는다', () => {
  const html = read('student_preview.html');
  assert.doesNotMatch(html, /id=["']toast["']/);
  assert.match(html, /id=["']studentToast["']/);
  assert.match(html, /function toast\s*\(/);
});

test('운영 학생 화면은 선택한 도서의 퀴즈만 지연 조회한다', async () => {
  const ctx = context();
  let requestedPath = '', selected;
  Object.assign(ctx, {
    NANO_SERVER_DATA: true,
    MIGRATED_QUIZZES: {},
    libData: [{ id: 'B001', serverId: 'book-server-id', title: '검증 도서', hasQuiz: true, quizCount: 5, quizSets: [] }],
    checkDailyQuizLimit: () => ({ blocked: false, count: 0 }),
    NanoPortal: { api: async path => {
      requestedPath = path;
      return { quizSets: [{ id: 'set-1', questions: [{ question: '선택 문항' }] }] };
    } },
    startQuizWithSet: (book, set) => { selected = { book, set }; },
    openQuizSetSelectModal: () => assert.fail('단일 문항 세트는 선택창을 열지 않는다')
  });
  loadFunctions(ctx, 'student_preview.html', ['startQuiz']);
  await ctx.startQuiz('B001');
  assert.match(requestedPath, /action=quiz&bookId=book-server-id/);
  assert.equal(selected.book.id, 'B001');
  assert.equal(selected.set.questions[0].question, '선택 문항');
});

test('운영 도서의 문항 수는 초기 문항 배열이 비어 있어도 퀴즈 보유 상태를 유지한다', () => {
  const ctx = context();
  Object.assign(ctx, {
    NANO_SERVER_DATA: true,
    MIGRATED_BOOKS: [{ id: 'B001', title: '실제 퀴즈 도서', hasQuiz: true, quizCount: 5, tags: [] }],
    MIGRATED_QUIZZES: {},
    libData: [], histData: []
  });
  loadFunctions(ctx, 'student_preview.html', ['initStudentMigratedData']);
  ctx.initStudentMigratedData();
  assert.equal(ctx.libData[0].hasQuiz, true);
  assert.equal(ctx.libData[0].quizzes, 5);
});

test('운영 학생 소속은 브라우저의 오래된 미리보기 회원보다 서버 회원을 우선한다', () => {
  const local = storage();
  local.setItem('NANO_MASTER_MEMBER_LIST', JSON.stringify([{ username: 'student-a', academyId: 'A', academyName: '이전 학원', className: '이전 반' }]));
  const ctx = context(local);
  Object.assign(ctx, {
    NANO_SERVER_DATA: true,
    MIGRATED_MEMBERS: [{ username: 'student-a', academyId: 'A', academyName: '실제 학원', className: '실제 반', name: '실제 학생' }]
  });
  ctx.sessionStorage.setItem('nano_auth_user', JSON.stringify({ id: 'student-a', role: 'student', academyId: 'A' }));
  loadFunctions(ctx, 'student_preview.html', ['getStudentQuizIdentity']);
  const identity = ctx.getStudentQuizIdentity();
  assert.equal(identity.academyName, '실제 학원');
  assert.equal(identity.classGroup, '실제 반');
});

test('본사·학원 검색은 포커스 상실과 계정명 입력 후에도 유지된다', () => {
  const ctx = context();
  for (const name of ['filterFranchiseList', 'filterMemberList', 'filterStudentRankings',
    'filterMasterContentList', 'filterDispatchList', 'filterMasterPaymentList']) ctx[name] = () => {};
  loadFunctions(ctx, 'master_preview.js', ['purgeAutofilledSearchInputs', 'bindMasterSearchAutofillGuards']);
  loadFunctions(ctx, 'admin_preview.js', ['clearAdminSearchAutofill']);
  const master = ctx.document.getElementById('memberSearchInput');
  const admin = ctx.document.getElementById('searchStudentInput');
  master.value = 'student01';
  admin.value = '검증 학생';
  ctx.bindMasterSearchAutofillGuards();
  ctx.purgeAutofilledSearchInputs();
  ctx.clearAdminSearchAutofill();
  assert.equal(master.value, 'student01');
  assert.equal(admin.value, '검증 학생');
});

test('실제 본사 필터와 랭킹 검색에서도 계정명으로 올바른 결과를 찾는다', () => {
  const ctx = context();
  let memberResult, franchiseResult;
  Object.assign(ctx, {
    franchiseList: [{ adminId: 'admin01' }, { adminId: 'unrelated' }],
    memberList: [{ username: 'student01' }, { username: 'unrelated' }],
    currentSelectedAcademy: 'ALL',
    renderFranchiseTable: list => { franchiseResult = list; },
    renderMemberTable: list => { memberResult = list; },
    syncRankingDatasetsFromWindow() {}, renderRankingPagination() {},
    currentRankingType: 'student', rankingCurrentPage: 1, rankingPageSize: 20, academyRankingData: [],
    allStudentRankings: [
      { id: 'student01', name: '검증 학생', academy: 'A', points: 100 },
      { id: 'unrelated', name: '다른 학생', academy: 'A', points: 50 }
    ]
  });
  loadFunctions(ctx, 'master_preview.js', ['filterFranchiseList', 'filterMemberList', 'renderRankings']);
  ctx.document.getElementById('franchiseSearchInput').value = 'admin01';
  ctx.document.getElementById('memberSearchInput').value = 'student01';
  ctx.document.getElementById('rankStudentSearchInput').value = 'student01';
  ctx.filterFranchiseList();
  ctx.filterMemberList();
  ctx.renderRankings();
  assert.equal(franchiseResult.length, 1);
  assert.equal(franchiseResult[0].adminId, 'admin01');
  assert.equal(memberResult.length, 1);
  assert.equal(memberResult[0].username, 'student01');
  assert.equal(ctx.document.getElementById('rankStudentSearchInput').value, 'student01');
  assert.equal(ctx.document.getElementById('rankTotalCount').innerText, 1);
});

test('같은 학원은 이관 기록과 신규 제출을 함께 읽고 다른 학원 기록은 제외한다', () => {
  const ctx = context();
  const seeds = [{ id: 'old-a', academyId: 'A' }, { id: 'old-b', academyId: 'B' }];
  ctx.NanoLearningStore.add('A', { id: 'new-a', academyId: 'A' }, seeds);
  assert.equal(ctx.NanoLearningStore.read('A').length, 2);
  assert.equal(ctx.NanoLearningStore.read('B').length, 0);
  assert.throws(() => ctx.NanoLearningStore.save('A', [{ id: 'bad', academyId: 'B' }]));
});

test('빈 학원과 의도적으로 저장한 빈 목록을 다른 학원 예시로 대체하지 않는다', () => {
  const ctx = context();
  ctx.MIGRATED_LEARNING_LOGS = [{ id: 'other', academyId: 'B', date: '2026-10-01' }];
  loadFunctions(ctx, 'admin_preview.js', ['getLearningAcademyId', 'getLoadedLearningLogs', 'saveCustomLearningLogs']);
  assert.equal(ctx.getLoadedLearningLogs().length, 0);
  ctx.NanoLearningStore.save('A', []);
  ctx.MIGRATED_LEARNING_LOGS.push({ id: 'seed-a', academyId: 'A' });
  assert.equal(ctx.getLoadedLearningLogs().length, 0);
  ctx.currentAcademyInfo.id = 'B';
  assert.equal(ctx.getLoadedLearningLogs()[0].id, 'other');
});

test('손상된 저장소를 덮어쓰지 않고 오류로 반환한다', () => {
  const ctx = context();
  ctx.localStorage.setItem('NANO_LEARNING_LOGS_A', '{broken');
  assert.throws(() => ctx.NanoLearningStore.add('A', { id: 'new', academyId: 'A' }));
  assert.equal(ctx.localStorage.getItem('NANO_LEARNING_LOGS_A'), '{broken');
});

test('새 페이지에서 객관식·생각 담기·문제 위치·풀이 ID를 복원한다', () => {
  const shared = storage();
  const first = student(shared);
  answerAll(first);
  const id = first.studentQuizAttemptId;
  const second = student(shared);
  second.startQuizWithSet(book, quiz);
  assert.equal(second.curQ, 2);
  assert.equal(second.studentSelectedAnsMap[0], 1);
  assert.equal(second.currentStudentThoughtAnswer, first.currentStudentThoughtAnswer);
  assert.equal(second.studentQuizAttemptId, id);
});

test('학생·학원·퀴즈 세트별 초안을 서로 섞지 않는다', () => {
  const shared = storage();
  const first = student(shared);
  answerAll(first);
  for (const [account, academy, set] of [
    ['student-b', 'A', quiz], ['student-a', 'B', quiz], ['student-a', 'A', { ...quiz, id: 'SET-2' }]
  ]) {
    const other = student(shared, account, academy);
    other.startQuizWithSet(book, set);
    assert.equal(other.curQ, 0);
    assert.equal(Object.keys(other.studentSelectedAnsMap).length, 0);
    assert.equal(other.currentStudentThoughtAnswer, '');
  }
});

test('밑줄이 있는 소속/계정과 ID 없는 여러 퀴즈도 각각의 초안을 유지한다', () => {
  const shared = storage();
  const first = student(shared, 'b', 'A_x');
  first.startQuizWithSet(book, quiz);
  first.selectAns(1);
  const other = student(shared, 'x_b', 'A');
  other.startQuizWithSet(book, quiz);
  assert.notEqual(other.studentQuizDraftKey, first.studentQuizDraftKey);
  assert.equal(Object.keys(other.studentSelectedAnsMap).length, 0);
  const noId = student(shared);
  noId.startQuizWithSet(book, { ...quiz, id: undefined });
  noId.selectAns(1);
  const previousKey = noId.studentQuizDraftKey;
  noId.startQuizWithSet(book, { ...quiz, id: undefined, questions: [{ question: '다른 문제', opt1: '예', ans: '1' }] });
  assert.notEqual(noId.studentQuizDraftKey, previousKey);
  assert.ok(shared.getItem(previousKey));
});

test('학생 화면의 이름과 학급은 로그인 정보로 표시한다', () => {
  const ctx = student();
  ctx.updateStudentSessionLabels();
  assert.equal(ctx.document.getElementById('headerStudentName').textContent, '검증 학생 student-a');
  assert.equal(ctx.document.getElementById('drawerStudentClass').textContent, '검증 학원 · 검증반');
});

test('이전 문제에서 답을 수정해도 생각 담기와 다른 답은 유지된다', () => {
  const ctx = student();
  answerAll(ctx);
  ctx.goPreviousQuestion();
  assert.equal(ctx.curQ, 1);
  ctx.selectAns(1);
  ctx.goNext();
  assert.equal(ctx.studentSelectedAnsMap[0], 1);
  assert.ok(ctx.currentStudentThoughtAnswer.includes('<태그>'));
});

test('학생 저장 기록이 같은 학원 관리자에게 정확한 답안과 신원으로 보인다', () => {
  const shared = storage();
  const ctx = student(shared);
  answerAll(ctx);
  ctx.showResult();
  const admin = context(shared);
  loadFunctions(admin, 'admin_preview.js', ['getLearningAcademyId', 'getLoadedLearningLogs']);
  const logs = admin.getLoadedLearningLogs();
  assert.equal(logs.length, 1);
  assert.equal(logs[0].studentId, 'student-a');
  assert.equal(logs[0].studentName, '검증 학생 student-a');
  assert.equal(logs[0].classGroup, '검증반');
  assert.equal(logs[0].score, 100);
  assert.equal(logs[0].quizResults.length, 2);
  assert.equal(logs[0].quizResults[0].userChoiceText, '나');
  assert.equal(logs[0].studentThoughtAnswer, ctx.currentStudentThoughtAnswer);
  assert.equal(logs[0].sheet, '작성 전');
  assert.match(logs[0].date, /^\d{4}-\d{2}-\d{2}$/);
  assert.equal(shared.getItem(ctx.studentQuizDraftKey), null);
  assert.ok(!ctx.document.getElementById('rPt').textContent.includes('포인트 지급'));
});

test('같은 풀이의 저장 재시도와 완료 버튼 반복 호출이 기록을 중복 생성하지 않는다', () => {
  const ctx = student();
  answerAll(ctx);
  assert.equal(ctx.syncQuizResultToAdminLearning(book.title, 100, ctx.currentStudentThoughtAnswer), true);
  assert.equal(ctx.syncQuizResultToAdminLearning(book.title, 100, ctx.currentStudentThoughtAnswer), true);
  ctx.showResult();
  ctx.showResult();
  assert.equal(ctx.NanoLearningStore.read('A').length, 1);
});

test('저장 실패 때 완료 화면을 열지 않고 답안과 초안을 유지한다', () => {
  const ctx = student();
  answerAll(ctx);
  ctx.localStorage.setItem = () => { throw new Error('저장 공간 부족'); };
  ctx.showResult();
  assert.equal(ctx.studentQuizSubmitted, false);
  assert.equal(ctx.document.getElementById('qscreen-ing').style.display, 'block');
  assert.ok(ctx.localStorage.getItem(ctx.studentQuizDraftKey));
  assert.ok(ctx.currentStudentThoughtAnswer);
  assert.ok(ctx.document.getElementById('quizDraftStatus').textContent.includes('저장하지 못했습니다'));
  ctx.backToSelect();
  assert.ok(ctx.curData);
});

test('계정이 바뀐 풀이를 다른 학생의 기록으로 저장하지 않는다', () => {
  const ctx = student();
  answerAll(ctx);
  ctx.sessionStorage.setItem('nano_auth_user', JSON.stringify({ id: 'student-b', role: 'student', academyId: 'A' }));
  ctx.showResult();
  assert.equal(ctx.studentQuizSubmitted, false);
  assert.equal(ctx.NanoLearningStore.read('A').length, 0);
});

test('미응답을 검토하도록 이동하며 비로그인 사용자는 퀴즈를 시작하지 않는다', () => {
  const ctx = student();
  ctx.startQuizWithSet(book, quiz);
  ctx.showResult();
  assert.equal(ctx.curQ, 0);
  assert.equal(ctx.NanoLearningStore.read('A').length, 0);
  const guest = student();
  guest.sessionStorage.removeItem('nano_auth_user');
  guest.startQuizWithSet(book, quiz);
  assert.equal(guest.curData, null);
});

test('복원한 텍스트가 HTML로 실행되지 않도록 이스케이프한다', () => {
  const ctx = student();
  assert.equal(ctx.escapeStudentQuizText('</textarea><script>&'), '&lt;/textarea&gt;&lt;script&gt;&amp;');
});


test('학원 배정은 동일 이름의 다른 학원·학생과 섞이지 않고 빈 목록도 보존한다', () => {
  const ctx = context(); const data = ctx.NanoPreviewData;
  data.saveAssignments('A', [{studentId:'s1', books:[{id:'book-a'}]}], [{className:'1반',books:[{id:'class-a'}]}]);
  data.saveAssignments('B', [{studentId:'s1', books:[{id:'book-b'}]}], []);
  assert.equal(data.assignedBookIds({academyId:'A',studentId:'s1',classGroup:'1반'}).join(','), 'book-a,class-a');
  assert.equal(data.assignedBookIds({academyId:'B',studentId:'s1',classGroup:'1반'}).join(','), 'book-b');
  data.saveAssignments('A', [], []); assert.equal(data.readAssignments('A').students.length, 0);
});

test('CSV의 한글·줄바꿈·따옴표를 읽고 수식 실행을 방지한다', () => {
  const data = context().NanoPreviewData;
  const rows = data.parseCSV('이름,설명\r\n"홍,길동","첫 줄\n둘째 ""인용"""');
  assert.equal(rows[1][0], '홍,길동'); assert.equal(rows[1][1], '첫 줄\n둘째 "인용"');
  assert.match(data.csvCell('=1+1'), /^"'/); assert.throws(() => data.parseCSV('"닫지 않은 값'));
});

test('원생이 없는 학원은 다른 학원 원생을 가져오지 않고 저장한 빈 목록을 유지한다', () => {
  const ctx = context(); ctx.STORAGE_KEY_STUDENTS = 'students-A';
  ctx.MIGRATED_MEMBERS = [{ username:'foreign', role:'STUDENT', academyId:'B', academyName:'같은 이름' }];
  loadFunctions(ctx, 'admin_preview.js', ['loadStudentsFromStorage']);
  assert.equal(ctx.loadStudentsFromStorage().length, 0);
  ctx.MIGRATED_MEMBERS.push({username:'own',role:'STUDENT',academyId:'A',name:'학생'});
  const own = ctx.loadStudentsFromStorage()[0]; assert.equal(own.gender,'미등록'); assert.equal(own.parentEmail,'');
  ctx.localStorage.setItem('students-A', '[]'); assert.equal(ctx.loadStudentsFromStorage().length,0);
});

test('60점 미만은 문항별 내역을 비우고 60점 이상에서만 다시 표시한다', async () => {
  const ctx = student();
  const set = { id: 'SET-REVIEW', questions: Array.from({ length: 5 }, (_, i) => ({
    question: '검토용 문항 ' + (i + 1), options: ['정답 보기', '오답 보기'], ans: '1'
  })) };
  ctx.document.querySelector = selector => selector === '.result-box' ? {} : null;
  // 성공 → 실패 → 경계 점수: 앞서 표시했던 정답이 다음 결과에 남지 않아야 합니다.
  for (const correctCount of [5, 2, 0, 3]) {
    ctx.startQuizWithSet(book, set);
    ctx.studentSelectedAnsMap = Object.fromEntries(set.questions.map((_, i) => [i, i < correctCount ? 0 : 1]));
    ctx.currentStudentThoughtAnswer = '직접 작성한 생각은 유지합니다.';
    await ctx.showResult();
    const html = ctx.document.getElementById('quizResultDetailWrap').innerHTML;
    assert.equal(ctx.document.getElementById('rScore').innerText, correctCount * 20 + '점');
    assert.ok(html.includes(ctx.currentStudentThoughtAnswer));
    if (correctCount < 3) {
      assert.doesNotMatch(html, /차근차근 돌아보기|문항별 결과|quiz-res-item|qr-answer|검토용 문항|정답 보기|오답 보기/);
    } else {
      assert.match(html, /차근차근 돌아보기/);
      assert.equal((html.match(/quiz-res-item/g) || []).length, 5);
      assert.match(html, /정답 보기/);
    }
  }
});

test('서버 저장 실패 시 완료 처리하지 않고 초안을 유지한다', async () => {
  const ctx = student(); ctx.startQuizWithSet(book, quiz);
  ctx.studentSelectedAnsMap = {0:0,1:1}; ctx.currentStudentThoughtAnswer='내 생각';
  ctx.NanoPortal = { remote:true, request:async () => { throw new Error('서버 저장 실패'); } };
  await ctx.showResult(); assert.equal(ctx.studentQuizSubmitted,false);
  assert.ok(ctx.localStorage.getItem(ctx.studentQuizDraftKey)); assert.equal(ctx.studentSubmissionPending,false);
});

test('출제 말머리와 공백을 정리한 문항도 초안 복원 후 원문으로 제출해 채점을 완료한다', async () => {
  const shared = storage();
  const originalQuiz = { ...quiz, questions: [
    { ...quiz.questions[0], question: '【본사 출제】 첫 문제  \r\n' },
    { ...quiz.questions[1], question: '  둘째 문제\n' }
  ] };
  const first = student(shared);
  first.startQuizWithSet(book, originalQuiz);
  first.selectAns(1); first.goNext();
  first.selectAns(0); first.goNext();
  first.onThoughtTextareaInput('다음 이야기가 궁금해요.');
  const attemptId = first.studentQuizAttemptId;

  const ctx = student(shared);
  ctx.startQuizWithSet(book, originalQuiz);
  assert.equal(ctx.curData.qs[0].q, '첫 문제');
  assert.equal(ctx.curData.qs[1].q, '둘째 문제');
  assert.equal(ctx.studentQuizAttemptId, attemptId);
  ctx.refreshStudentLearningData = () => {};
  let submitted;
  ctx.NanoPortal = {
    remote: true,
    request: async (action, payload) => {
      assert.equal(action, 'learning');
      submitted = payload;
      // 실제 API와 동일하게 원문과 보기의 일치를 확인합니다.
      payload.quizResults.forEach((answer, i) => {
        assert.equal(answer.question, originalQuiz.questions[i].question);
        assert.ok(originalQuiz.questions[i].options.includes(answer.userChoiceText));
      });
      return { score: 100, earned: 8, quizResults: payload.quizResults.map((row, i) => ({
        ...row, correctChoiceText: originalQuiz.questions[i].options[Number(originalQuiz.questions[i].ans) - 1]
      })) };
    },
    refreshLearning: async () => {}, refreshActivity: async () => {}
  };
  await ctx.showResult();
  assert.equal(submitted.id, attemptId);
  assert.equal(submitted.thoughtAnswer, '다음 이야기가 궁금해요.');
  assert.equal(ctx.studentQuizSubmitted, true);
  assert.equal(ctx.document.getElementById('qscreen-result').style.display, 'block');
  assert.equal(shared.getItem(ctx.studentQuizDraftKey), null);
});

test('재도전 안내는 한국 날짜로 실패를 집계하고 학생·도서와 로컬 기록을 구분한다', () => {
  const ctx=student();
  class ClockDate extends Date {
    constructor(value) { super(value === undefined ? '2026-10-28T15:30:00Z' : value); }
    static now() { return +new Date('2026-10-28T15:30:00Z'); }
  }
  ctx.Date=ClockDate;
  const rows=Array.from({length:3},(_,i)=>({id:'fail'+i,studentId:'student-a',bookId:'BOOK-1',score:40,
    date:'2026-10-28',submittedAt:'2026-10-28T15:05:00Z'}));
  ctx.NanoPortal={remote:true,logs:()=>rows};
  assert.equal(ctx.checkDailyQuizLimit('BOOK-1').blocked,true);
  assert.equal(ctx.checkDailyQuizLimit('BOOK-2').count,0);
  rows[0].studentId='other';
  assert.equal(ctx.checkDailyQuizLimit('BOOK-1').blocked,false);
  rows[0].studentId='student-a';
  rows[0].submittedAt='2026-10-28T14:59:59Z';
  assert.equal(ctx.checkDailyQuizLimit('BOOK-1').count,2);
  ctx.NanoPortal.remote=false;
  ctx.NanoLearningStore.save('A',rows);
  assert.equal(ctx.checkDailyQuizLimit('BOOK-1').count,2);
});

test('자동 저장 시각 안내는 숨기고 저장 실패만 표시하며 답안 저장은 유지한다', () => {
  const ctx = student();
  answerAll(ctx);
  const status = ctx.document.getElementById('quizDraftStatus');
  const draft = JSON.parse(ctx.localStorage.getItem(ctx.studentQuizDraftKey));
  assert.ok(draft.updatedAt);
  assert.equal(draft.answers[0], 1);
  assert.equal(status.textContent, '');
  assert.equal(status.style.display, 'none');
  const setItem = ctx.localStorage.setItem;
  ctx.localStorage.setItem = () => { throw new Error('저장 공간 부족'); };
  assert.equal(ctx.saveStudentQuizDraft(), false);
  assert.match(status.textContent, /저장 공간 부족/);
  assert.equal(status.style.display, 'block');
  ctx.localStorage.setItem = setItem;
  assert.equal(ctx.saveStudentQuizDraft(), true);
  assert.equal(status.textContent, '');
  assert.equal(status.style.display, 'none');
});
