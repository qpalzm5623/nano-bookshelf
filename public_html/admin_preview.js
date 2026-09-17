/**
 * 나노의 책장 - 학원 관리자(Academy Admin) 포털 로직
 * 7대 핵심 메뉴:
 * 1. 회원 관리 (선생님 / 원생 관리 분리 및 등록/수정/삭제)
 * 2. 콘텐츠 관리 (도서 목록 + 도서 직접 등록 + 북퀴즈 출제/관리 통합)
 * 3. 학습 관리 (원생별 독서/퀴즈 학습 이력 및 상세 리포트)
 * 4. 독서 포트폴리오 (포트폴리오 제작, 열람 및 학부모 상담용 공식 리포트 발급)
 * 5. 도서 배정 (학생/반별 도서 배정 -> 학생 로그인 시 최우선 노출 플래그)
 * 6. 카톡 발송 내역 (원내 알리고 알림톡/SMS 발송 로그 및 재발송)
 * 7. 랭킹 조회 (학원 내 원생 독서 포인트 랭킹)
 */

// ==============================================================
// 1. 다문항 북퀴즈 데이터 관리 (Q1 ~ Q5 기본 탑재 + 추가/삭제)
// ==============================================================
var quizDataList = [
  {
    question: "『어린 왕자』에서 사막여우가 어린 왕자에게 전해준 가장 소중한 비밀인 ㉠에 들어갈 알맞은 낱말은?\n\n[지문]\n\"내 비밀은 이런 거야. 매우 간단한 거지. 오로지 ㉠(으)로 보아야만 분명하게 볼 수 있어. 가장 중요한 것은 눈에 보이지 않거든.\"",
    opt1: "마음",
    opt2: "눈동자",
    opt3: "장미꽃",
    opt4: "여우",
    ans: "1"
  },
  {
    question: "어린 왕자가 살던 고향 별의 명칭으로 알맞은 것은 무엇인가요?",
    opt1: "A-101 소행성",
    opt2: "B-612 소행성",
    opt3: "C-303 소행성",
    opt4: "별똥별 404호",
    ans: "2"
  },
  {
    question: "어린 왕자가 자신의 별을 떠나 다른 별들을 여행하기로 결심한 가장 결정적인 이유는 무엇인가요?",
    opt1: "바오바브나무가 별을 뒤덮어서",
    opt2: "장미꽃의 투정과 까다로운 자존심에 상처를 받아서",
    opt3: "화산이 모두 폭발해서",
    opt4: "비행기 조종사를 만나고 싶어서",
    ans: "2"
  },
  {
    question: "여우가 어린 왕자에게 알려준 ㉡'길들인다'의 참된 의미로 가장 알맞은 것은?\n\n[지문]\n\"넌 나에게 아직은 수많은 소년들과 다를 바 없는 한 소년에 불과해... 하지만 네가 나를 ㉡길들인다면, 우리는 서로에게 이 세상에서 오직 하나뿐인 존재가 될 거야.\"",
    opt1: "상대방을 내 뜻대로 복종시키는 것",
    opt2: "서로에게 특별한 관계를 맺고 끝까지 책임을 지는 것",
    opt3: "매일 정해진 시간에 먹이를 주는 것",
    opt4: "상대방의 약점을 모두 알아내는 것",
    ans: "2"
  },
  {
    question: "비행기 조종사가 어릴 적 어른들에게 보여주었으나, 어른들이 단순한 '모자'로만 착각했던 첫 번째 그림은 무엇인가요?",
    opt1: "코끼리를 삼킨 보아뱀 그림",
    opt2: "상자 속에 들어있는 어린 양 그림",
    opt3: "사막에 핀 노란 장미 그림",
    opt4: "별빛 아래 잠든 사막여우 그림",
    ans: "1"
  }
];

var currentQuizIndex = 0;

function renderQuizTabs() {
  var container = document.getElementById('quizTabsContainer');
  if (!container) return;
  container.innerHTML = '';

  quizDataList.forEach(function(item, idx) {
    var tabBtn = document.createElement('button');
    tabBtn.type = 'button';
    tabBtn.className = 'quiz-tab-item-v' + (idx === currentQuizIndex ? ' active' : '');
    tabBtn.innerHTML = '<span class="q-num">Q' + (idx + 1) + '</span><span class="font-weight-bold">문제 ' + (idx + 1) + '번</span>' + 
      (idx === currentQuizIndex ? '<i class="fa-solid fa-chevron-right ml-auto" style="font-size:12px;"></i>' : '');
    tabBtn.onclick = function() {
      selectQuizTab(idx);
    };
    container.appendChild(tabBtn);
  });

  var countEl = document.getElementById('quizTotalCount');
  if (countEl) countEl.innerText = quizDataList.length;
}

function selectQuizTab(idx) {
  currentQuizIndex = idx;
  renderQuizTabs();
  loadCurrentQuizForm();
}

function loadCurrentQuizForm() {
  var q = quizDataList[currentQuizIndex];
  if (!q) return;

  var lbl = document.getElementById('quizCurrentLabel');
  if (lbl) lbl.innerText = '문제 ' + (currentQuizIndex + 1) + '번 문항 편집';
  if (document.getElementById('quiz_target_q')) document.getElementById('quiz_target_q').value = q.question || '';
  if (document.getElementById('opt_1')) document.getElementById('opt_1').value = q.opt1 || '';
  if (document.getElementById('opt_2')) document.getElementById('opt_2').value = q.opt2 || '';
  if (document.getElementById('opt_3')) document.getElementById('opt_3').value = q.opt3 || '';
  if (document.getElementById('opt_4')) document.getElementById('opt_4').value = q.opt4 || '';
  if (document.getElementById('quiz_correct_ans')) document.getElementById('quiz_correct_ans').value = q.ans || '1';

  var btnDel = document.getElementById('btnDeleteQuiz');
  if (btnDel) btnDel.style.display = quizDataList.length > 1 ? 'inline-block' : 'none';
}

function updateCurrentQuizData() {
  var q = quizDataList[currentQuizIndex];
  if (!q) return;

  if (document.getElementById('quiz_target_q')) q.question = document.getElementById('quiz_target_q').value;
  if (document.getElementById('opt_1')) q.opt1 = document.getElementById('opt_1').value;
  if (document.getElementById('opt_2')) q.opt2 = document.getElementById('opt_2').value;
  if (document.getElementById('opt_3')) q.opt3 = document.getElementById('opt_3').value;
  if (document.getElementById('opt_4')) q.opt4 = document.getElementById('opt_4').value;
  if (document.getElementById('quiz_correct_ans')) q.ans = document.getElementById('quiz_correct_ans').value;
}

function addNewQuiz() {
  var newIdx = quizDataList.length + 1;
  quizDataList.push({
    question: "문제 " + newIdx + ". 지문 또는 문제 내용을 입력하세요.",
    opt1: "",
    opt2: "",
    opt3: "",
    opt4: "",
    ans: "1"
  });
  currentQuizIndex = quizDataList.length - 1;
  renderQuizTabs();
  loadCurrentQuizForm();
  var input = document.getElementById('quiz_target_q');
  if (input) input.focus();
}

function deleteCurrentQuiz(forceDirect) {
  if (quizDataList.length <= 1) {
    showAcademyToast('최소 1개 이상의 북퀴즈 문항이 유지되어야 합니다.');
    return;
  }
  if (forceDirect === true) {
    executeDeleteCurrentQuiz();
    return;
  }
  var targetNum = currentQuizIndex + 1;
  var labelEl = document.getElementById('deleteModalTargetLabel');
  if (labelEl) {
    labelEl.innerHTML = '<span class="text-danger font-weight-bold">문제 ' + targetNum + '번</span> 문항을 삭제하시겠습니까?';
  }
  if (window.jQuery && typeof $('#quizDeleteConfirmModal').modal === 'function') {
    $('#quizDeleteConfirmModal').modal('show');
  } else {
    showModalVanilla('quizDeleteConfirmModal');
  }
}

function executeDeleteCurrentQuiz() {
  if (quizDataList.length <= 1) {
    if (window.jQuery && typeof $('#quizDeleteConfirmModal').modal === 'function') {
      $('#quizDeleteConfirmModal').modal('hide');
    } else {
      hideModalVanilla('quizDeleteConfirmModal');
    }
    showAcademyToast('최소 1개 이상의 북퀴즈 문항이 유지되어야 합니다.');
    return;
  }
  var targetNum = currentQuizIndex + 1;
  quizDataList.splice(currentQuizIndex, 1);
  if (currentQuizIndex >= quizDataList.length) {
    currentQuizIndex = quizDataList.length - 1;
  }
  if (window.jQuery && typeof $('#quizDeleteConfirmModal').modal === 'function') {
    $('#quizDeleteConfirmModal').modal('hide');
  } else {
    hideModalVanilla('quizDeleteConfirmModal');
  }
  renderQuizTabs();
  loadCurrentQuizForm();
  showAcademyToast('문제 ' + targetNum + '번 문항이 정상적으로 삭제되었습니다.');
}

function saveAllQuizzes() {
  updateCurrentQuizData();
  showAcademyToast('총 ' + quizDataList.length + '개 문항의 북퀴즈가 성공적으로 저장되었습니다!');
  switchContentSubTab('list');
}

// ==============================================================
// 2. 7대 탭 네비게이션 제어
// ==============================================================
function switchTab(tab) {
  var views = ['members', 'contents', 'learning', 'portfolio', 'assignment', 'dispatch', 'ranking', 'payment'];
  views.forEach(function(v) {
    var el = document.getElementById('view-' + v);
    var nav = document.getElementById('btn-nav-' + v);
    if (el) el.style.display = 'none';
    if (nav) nav.classList.remove('active');
  });

  var targetView = document.getElementById('view-' + tab);
  var targetNav = document.getElementById('btn-nav-' + tab);
  if (targetView) targetView.style.display = 'block';
  if (targetNav) targetNav.classList.add('active');

  if (tab === 'learning') renderLearningTable();
  if (tab === 'portfolio') {
    showPortfolioList();
    renderPortfolioTable(portfolioList);
  }
  if (tab === 'assignment') renderAssignmentTable();
  if (tab === 'dispatch') renderAcademyDispatchTable();
  if (tab === 'ranking') renderAcademyRankingTable();
  if (tab === 'payment') {
    renderAcademyPaymentTable();
    selectPlanTier(currentSelectedTier || 'standard');
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// 콘텐츠 관리 내부 서브탭 전환 (도서 목록 / 도서 직접 등록 / 북퀴즈 출제)
function switchContentSubTab(sub) {
  var subs = ['list', 'write', 'quiz'];
  subs.forEach(function(s) {
    var box = document.getElementById('content-sub-' + s);
    var btn = document.getElementById('btn-sub-' + s);
    if (box) box.style.display = 'none';
    if (btn) {
      btn.className = 'btn btn-beige-secondary';
    }
  });

  var activeBox = document.getElementById('content-sub-' + sub);
  var activeBtn = document.getElementById('btn-sub-' + sub);
  if (activeBox) activeBox.style.display = 'block';
  if (activeBtn) activeBtn.className = 'btn btn-beige-primary';

  if (sub === 'quiz') {
    renderQuizTabs();
    loadCurrentQuizForm();
  }
}

// 회원 관리 내부 서브탭 전환 (원생 관리 / 선생님 관리)
function switchMemberSubTab(sub) {
  var subs = ['students', 'teachers'];
  subs.forEach(function(s) {
    var box = document.getElementById('member-sub-' + s);
    var btn = document.getElementById('btn-member-' + s);
    if (box) box.style.display = 'none';
    if (btn) btn.className = 'btn btn-beige-secondary';
  });

  var activeBox = document.getElementById('member-sub-' + sub);
  var activeBtn = document.getElementById('btn-member-' + sub);
  if (activeBox) activeBox.style.display = 'block';
  if (activeBtn) activeBtn.className = 'btn btn-beige-primary';

  if (sub === 'teachers') renderTeacherTable();
  if (sub === 'students') renderStudentTable(studentDataList);
}

// ==============================================================
// 3. 회원 관리 (원생 + 선생님) 데이터 & 로직
// ==============================================================
var studentDataList = [
  { id: 'S1021', name: '김민준', gender: '남', password: '1234', school: '나노초등학교', grade: '초등 5학년', classGroup: '지혜반', status: '승인', level: '초등 심화 Lv 5', bookCount: 24, quizAvg: 94.2, parentName: '김영희', phone: '010-3847-1928', parentEmail: 'parent_kim@example.com', reportYn: true, lastDate: '2026.09.08', createdAt: '2026.03.02', teacher: '박선혜 지도교사', memo: '줄거리 요약과 어휘력 영역이 탁월함. 토론 수업 시 자기 생각을 명확하게 표현함.' },
  { id: 'S1022', name: '이서윤', gender: '여', password: '1234', school: '솔빛초등학교', grade: '초등 4학년', classGroup: '슬기반', status: '승인', level: '초등 발전 Lv 4', bookCount: 18, quizAvg: 91.5, parentName: '이수진', phone: '010-5829-3019', parentEmail: 'seoyun_mom@example.com', reportYn: true, lastDate: '2026.09.07', createdAt: '2026.04.10', teacher: '박선혜 지도교사', memo: '책 읽는 속도가 빠르고 이해도가 높음.' },
  { id: 'S1023', name: '박도윤', gender: '남', password: '1234', school: '나노초등학교', grade: '초등 6학년', classGroup: '마스터반', status: '승인', level: '초등 완성 Lv 6', bookCount: 31, quizAvg: 97.0, parentName: '박태훈', phone: '010-9182-4720', parentEmail: 'doyun_dad@example.com', reportYn: true, lastDate: '2026.09.08', createdAt: '2026.02.15', teacher: '최승현 지도교사', memo: '인문 고전 및 비문학 독해에 강점.' },
  { id: 'S1024', name: '정하은', gender: '여', password: '1234', school: '해밀중학교', grade: '중등 1학년', classGroup: '심화반', status: '미승인', level: '중등 기본 Lv 7', bookCount: 15, quizAvg: 88.4, parentName: '정미경', phone: '010-7492-8102', parentEmail: '', reportYn: false, lastDate: '2026.09.06', createdAt: '2026.09.01', teacher: '최승현 지도교사', memo: '신규 입학 상담 후 승인 대기 중.' },
  { id: 'S1025', name: '강시우', gender: '남', password: '1234', school: '새싹초등학교', grade: '초등 2학년', classGroup: '새싹반', status: '승인', level: '초등 입문 Lv 2', bookCount: 12, quizAvg: 92.0, parentName: '강동원', phone: '010-4820-1948', parentEmail: 'siwoo_home@example.com', reportYn: true, lastDate: '2026.09.05', createdAt: '2026.05.20', teacher: '이지연 지도교사', memo: '그림책에서 문고판으로 단계 전환 중.' },
  { id: 'S1026', name: '윤지유', gender: '여', password: '1234', school: '솔빛초등학교', grade: '초등 5학년', classGroup: '지혜반', status: '퇴원', level: '초등 심화 Lv 5', bookCount: 22, quizAvg: 95.8, parentName: '윤상철', phone: '010-6391-7291', parentEmail: 'jiyu_mom@example.com', reportYn: false, lastDate: '2026.08.30', createdAt: '2026.03.15', teacher: '박선혜 지도교사', memo: '타 지역 이사로 인한 퇴원 처리 완료.' }
];

var academyClassList = [
  { id: 'CLS01', name: '지혜반', grade: '초등 5학년', teacher: '박선혜 수석교사', desc: '초등 5학년 심화 독서 및 문해력 집중 토론' },
  { id: 'CLS02', name: '슬기반', grade: '초등 4학년', teacher: '박선혜 수석교사', desc: '초등 4학년 교과 연계 독서 및 요약 훈련' },
  { id: 'CLS03', name: '마스터반', grade: '초등 6학년', teacher: '최승현 지도교사', desc: '초등 6학년 예비중등 문해력 및 인문고전' },
  { id: 'CLS04', name: '심화반', grade: '중등 전학년', teacher: '최승현 지도교사', desc: '중등 논술 및 서술형 평가 대비반' },
  { id: 'CLS05', name: '새싹반', grade: '초등 1~2학년', teacher: '이지연 지도교사', desc: '초등 저학년 올바른 독서 습관 형성반' },
  { id: 'CLS06', name: '탐구반', grade: '초등 3학년', teacher: '이지연 지도교사', desc: '초등 3학년 배경지식 확장 및 과학/역사 탐구' }
];

var teacherDataList = [
  { id: 'T001', name: '박선혜', username: 'teacher_park', role: '수석 지도교사', classes: '지혜반(초5), 슬기반(초4)', studentCount: 18, phone: '010-5512-8871', joinDate: '2025-03-01' },
  { id: 'T002', name: '최승현', username: 'teacher_choi', role: '중등 논술전담', classes: '마스터반(초6), 심화반(중1)', studentCount: 16, phone: '010-6622-1134', joinDate: '2025-04-15' },
  { id: 'T003', name: '이지연', username: 'teacher_lee', role: '초등 저학년전담', classes: '새싹반(초1~2), 탐구반(초3)', studentCount: 14, phone: '010-4499-5511', joinDate: '2025-06-01' },
  { id: 'T004', name: '김은영', username: 'director_kim', role: '학원 원장', classes: '전체 클래스 총괄', studentCount: 48, phone: '010-3342-9981', joinDate: '2025-01-01' }
];

// 신규 등록된 원생 하이라이트 트래킹 변수
var lastAddedStudentId = null;

// 가맹점 원생 통계 실시간 동기화 함수
function updateAllStudentCounts() {
  var baseTotal = 48; // 기본 설정된 학원 재원생 기준
  var addedCount = Math.max(0, studentDataList.length - 6);
  var currentTotal = baseTotal + addedCount;
  var maxSlots = 50; // 계약 정원

  // 초등 / 중등 인원 계산
  var elemCount = 36;
  var midCount = 12;
  studentDataList.slice(0, addedCount).forEach(function(s) {
    if (s.grade && s.grade.indexOf('중등') !== -1) {
      midCount++;
    } else {
      elemCount++;
    }
  });

  // 1. 탭 버튼 배지 갱신
  var tabCountEl = document.getElementById('tabStudentCount');
  if (tabCountEl) tabCountEl.innerText = currentTotal;

  // 2. 전체 재원생 통계 카드 갱신
  var statCountEl = document.getElementById('statStudentCount');
  if (statCountEl) statCountEl.innerText = currentTotal;
  var statBreakdownEl = document.getElementById('statStudentBreakdown');
  if (statBreakdownEl) {
    statBreakdownEl.innerHTML = `초등 ${elemCount}명 &middot; 중등 ${midCount}명 (활동 중)`;
  }

  // 3. 사이드바 하단 슬롯 카드 갱신
  var slotRate = Math.round((currentTotal / maxSlots) * 100);
  var sidebarSlotEl = document.getElementById('sidebarSlotStatus');
  if (sidebarSlotEl) {
    var rateClass = currentTotal >= maxSlots ? 'text-danger font-weight-bold' : 'text-success font-weight-bold';
    sidebarSlotEl.innerHTML = `${currentTotal} / ${maxSlots}명 <small class="${rateClass}">(${slotRate}%)</small>`;
  }

  // 4. 상단 글로벌 역할 전환 바 계약 상태 갱신
  var globalRoleSlotEl = document.getElementById('globalRoleSlotStatus');
  if (globalRoleSlotEl) {
    var statusText = currentTotal >= maxSlots ? '정원 마감' : '정상 운영';
    var statusClass = currentTotal >= maxSlots ? 'text-danger' : 'text-success';
    globalRoleSlotEl.innerHTML = `계약 상태: <strong class="${statusClass}">${statusText} (${currentTotal}/${maxSlots}명)</strong>`;
  }

  // 5. 모달 내부 슬롯 상태 갱신
  var modalSlotUsageEl = document.getElementById('modalSlotUsage');
  if (modalSlotUsageEl) modalSlotUsageEl.innerText = `${currentTotal} / ${maxSlots}명`;
  var modalSlotRemainEl = document.getElementById('modalSlotRemainBadge');
  if (modalSlotRemainEl) {
    var remain = maxSlots - currentTotal;
    if (remain > 0) {
      modalSlotRemainEl.className = 'badge-soft badge-soft-success ml-2';
      modalSlotRemainEl.innerText = `등록 가능 잔여: ${remain}명`;
    } else {
      modalSlotRemainEl.className = 'badge-soft badge-soft-warn ml-2 text-danger font-weight-bold';
      modalSlotRemainEl.innerText = `슬롯 정원 초과 (증설 필요)`;
    }
  }
}

// 다음 학번 (ID) 자동 채번 함수
function autoGenStudentId() {
  var maxNum = 1026;
  studentDataList.forEach(function(s) {
    if (s.id && s.id.startsWith('S')) {
      var num = parseInt(s.id.replace('S', ''), 10);
      if (!isNaN(num) && num > maxNum) {
        maxNum = num;
      }
    }
  });
  var nextId = 'S' + (maxNum + 1);
  var idInput = document.getElementById('newStdId');
  if (idInput) idInput.value = nextId;
  return nextId;
}

// 학년 변경 시 독서 레벨 & 추천 클래스 자동 연동
function onStudentGradeChange(grade) {
  var levelSelect = document.getElementById('newStdLevel');
  var classSelect = document.getElementById('newStdClass');
  if (!grade) return;

  if (grade === '초등 1학년') {
    if (levelSelect) levelSelect.value = '초등 입문 Lv 1';
    if (classSelect) classSelect.value = '새싹반';
  } else if (grade === '초등 2학년') {
    if (levelSelect) levelSelect.value = '초등 입문 Lv 2';
    if (classSelect) classSelect.value = '새싹반';
  } else if (grade === '초등 3학년') {
    if (levelSelect) levelSelect.value = '초등 발전 Lv 3';
    if (classSelect) classSelect.value = '탐구반';
  } else if (grade === '초등 4학년') {
    if (levelSelect) levelSelect.value = '초등 발전 Lv 4';
    if (classSelect) classSelect.value = '슬기반';
  } else if (grade === '초등 5학년') {
    if (levelSelect) levelSelect.value = '초등 심화 Lv 5';
    if (classSelect) classSelect.value = '지혜반';
  } else if (grade === '초등 6학년') {
    if (levelSelect) levelSelect.value = '초등 완성 Lv 6';
    if (classSelect) classSelect.value = '마스터반';
  } else if (grade === '중등 1학년') {
    if (levelSelect) levelSelect.value = '중등 기본 Lv 7';
    if (classSelect) classSelect.value = '심화반';
  } else if (grade === '중등 2학년') {
    if (levelSelect) levelSelect.value = '중등 심화 Lv 8';
    if (classSelect) classSelect.value = '심화반';
  } else if (grade === '중등 3학년') {
    if (levelSelect) levelSelect.value = '중등 마스터 Lv 9';
    if (classSelect) classSelect.value = '심화반';
  }
}

// 전화번호 자동 하이픈 포맷팅
function formatPhoneInput(input) {
  if (!input) return;
  var val = input.value.replace(/[^0-9]/g, '');
  if (val.length < 4) {
    input.value = val;
  } else if (val.length < 7) {
    input.value = val.substr(0, 3) + '-' + val.substr(3);
  } else if (val.length < 11) {
    input.value = val.substr(0, 3) + '-' + val.substr(3, 3) + '-' + val.substr(6);
  } else {
    input.value = val.substr(0, 3) + '-' + val.substr(3, 4) + '-' + val.substr(7, 4);
  }
}

// ==============================================================
// 3-1. 학급(클래스) 관리 모달 & CRUD 로직
// ==============================================================
function openClassManageModal() {
  renderClassManageTable();
  if (window.jQuery && typeof $('#classManageModal').modal === 'function') {
    $('#classManageModal').modal('show');
  } else {
    showModalVanilla('classManageModal');
  }
}

function renderClassManageTable() {
  var tbody = document.getElementById('classManageTableBody');
  if (!tbody) return;
  tbody.innerHTML = '';

  academyClassList.forEach(function(cls, idx) {
    var studentCount = studentDataList.filter(function(s) {
      return s.classGroup === cls.name;
    }).length;

    var tr = document.createElement('tr');
    tr.innerHTML = 
      '<td class="text-center"><small class="text-muted font-weight-bold">' + (idx + 1) + '</small></td>' +
      '<td><strong style="color: var(--text-main); font-size: 13.5px;">' + cls.name + '</strong></td>' +
      '<td class="text-center"><span class="badge-soft badge-soft-neutral">' + cls.grade + '</span></td>' +
      '<td class="text-center">' + cls.teacher + '</td>' +
      '<td class="text-center"><span class="badge badge-light border font-weight-bold" style="font-size: 12px; color: var(--btn-primary);">' + studentCount + '명</span></td>' +
      '<td class="text-center">' +
        '<button type="button" class="btn btn-xs btn-outline-secondary mr-1" onclick="editClass(\'' + cls.id + '\')" style="border-radius: 6px; font-size: 11.5px; padding: 2px 7px;"><i class="fa-solid fa-pen mr-1"></i>수정</button>' +
        '<button type="button" class="btn btn-xs btn-outline-danger" onclick="deleteClass(\'' + cls.id + '\')" style="border-radius: 6px; font-size: 11.5px; padding: 2px 7px;"><i class="fa-solid fa-trash-can mr-1"></i>삭제</button>' +
      '</td>';
    tbody.appendChild(tr);
  });
}

function addClass() {
  var nameInput = document.getElementById('newClassNameInput');
  var gradeSelect = document.getElementById('newClassGradeSelect');
  var teacherSelect = document.getElementById('newClassTeacherSelect');

  var name = (nameInput ? nameInput.value : '').trim();
  var grade = gradeSelect ? gradeSelect.value : '초등 5학년';
  var teacher = teacherSelect ? teacherSelect.value : '박선혜 수석교사';

  if (!name) {
    alert('학급명을 입력해주세요. (예: 지혜반, 창의반)');
    if (nameInput) nameInput.focus();
    return;
  }

  var exists = academyClassList.some(function(c) { return c.name === name; });
  if (exists || name === '미지정') {
    alert('이미 존재하거나 등록할 수 없는 학급명입니다.');
    if (nameInput) nameInput.focus();
    return;
  }

  var newCls = {
    id: 'CLS' + String(Date.now()).slice(-4),
    name: name,
    grade: grade,
    teacher: teacher,
    desc: grade + ' 맞춤 독서 지도반'
  };

  academyClassList.push(newCls);
  if (nameInput) nameInput.value = '';

  updateClassSelectOptions();
  renderClassManageTable();
  showAcademyToast(`[${name}] 신규 학급이 개설되었습니다.`);
}

function editClass(id) {
  var cls = academyClassList.find(function(c) { return c.id === id; });
  if (!cls) return;

  var newName = prompt(`[${cls.name}] 학급의 변경할 학급명을 입력하세요:`, cls.name);
  if (newName === null) return;
  newName = newName.trim();

  if (!newName) {
    alert('학급명을 입력해주세요.');
    return;
  }

  if (newName !== cls.name) {
    var exists = academyClassList.some(function(c) { return c.id !== id && c.name === newName; });
    if (exists || newName === '미지정') {
      alert('이미 존재하는 학급명입니다.');
      return;
    }

    var oldName = cls.name;
    cls.name = newName;

    studentDataList.forEach(function(s) {
      if (s.classGroup === oldName) {
        s.classGroup = newName;
      }
    });

    updateClassSelectOptions();
    renderClassManageTable();
    filterStudents();
    showAcademyToast(`학급명이 [${oldName}]에서 [${newName}]으로 수정되었습니다.`);
  }
}

function deleteClass(id) {
  var cls = academyClassList.find(function(c) { return c.id === id; });
  if (!cls) return;

  var assignedStudents = studentDataList.filter(function(s) { return s.classGroup === cls.name; });
  var count = assignedStudents.length;

  var confirmMsg = `[${cls.name}] 학급을 삭제하시겠습니까?\n\n` +
    (count > 0 ? `※ 주의: 현재 이 학급에 소속된 원생 ${count}명의 소속이 자동으로 '미지정'으로 안전하게 전환됩니다.` : `※ 소속 원생이 없는 학급입니다.`);

  if (!confirm(confirmMsg)) return;

  // 요구사항: 학급 삭제 시 소속 원생 학급은 자동으로 '미지정'으로 변환
  studentDataList.forEach(function(s) {
    if (s.classGroup === cls.name) {
      s.classGroup = '미지정';
    }
  });

  academyClassList = academyClassList.filter(function(c) { return c.id !== id; });

  updateClassSelectOptions();
  renderClassManageTable();
  filterStudents();
  showAcademyToast(`[${cls.name}] 학급이 삭제되었으며, 소속 원생 ${count}명의 학급이 '미지정'으로 안전하게 전환되었습니다.`);
}

function updateClassSelectOptions() {
  var stdClassSelect = document.getElementById('newStdClass');
  if (stdClassSelect) {
    var curVal = stdClassSelect.value;
    stdClassSelect.innerHTML = '';
    academyClassList.forEach(function(c) {
      var opt = document.createElement('option');
      opt.value = c.name;
      opt.innerText = c.name;
      stdClassSelect.appendChild(opt);
    });
    var unassignedOpt = document.createElement('option');
    unassignedOpt.value = '미지정';
    unassignedOpt.innerText = '미지정 (학급 없음)';
    stdClassSelect.appendChild(unassignedOpt);

    if (curVal && (academyClassList.some(function(c) { return c.name === curVal; }) || curVal === '미지정')) {
      stdClassSelect.value = curVal;
    }
  }

  var filterClassSelect = document.getElementById('filterStudentClass');
  if (filterClassSelect) {
    var curFilterVal = filterClassSelect.value;
    filterClassSelect.innerHTML = '<option value="ALL">전체 클래스 보기</option>';
    academyClassList.forEach(function(c) {
      var opt = document.createElement('option');
      opt.value = c.name;
      opt.innerText = c.grade + ' (' + c.name + ')';
      filterClassSelect.appendChild(opt);
    });
    var unassignedFilterOpt = document.createElement('option');
    unassignedFilterOpt.value = '미지정';
    unassignedFilterOpt.innerText = '학급 미지정 원생';
    filterClassSelect.appendChild(unassignedFilterOpt);

    if (curFilterVal) {
      filterClassSelect.value = curFilterVal;
    }
  }
}

// ==============================================================
// 3-2. 원생 삭제 로직 (학급 '미지정' 자동 변환 후 삭제)
// ==============================================================
function deleteStudent(id) {
  var std = studentDataList.find(function(s) { return s.id === id; });
  if (!std) return;

  var confirmMsg = `[${std.name}] 원생 (학번: ${std.id})을 원생 명부에서 삭제하시겠습니까?\n\n` +
    `※ 삭제 시 소속 학급(${std.classGroup})에서 자동으로 '미지정'으로 변환된 후 삭제 처리됩니다.`;

  if (!confirm(confirmMsg)) return;

  // 요구사항: 삭제할 때는 학급에서 자동으로 미지정으로 변환되면서 삭제
  var oldClass = std.classGroup;
  std.classGroup = '미지정';

  studentDataList = studentDataList.filter(function(s) { return s.id !== id; });

  updateAllStudentCounts();
  if (typeof initPortfolioOptions === 'function') initPortfolioOptions();
  filterStudents();

  showAcademyToast(`[${std.name}] 원생의 학급이 '미지정'으로 해제된 후 정상적으로 삭제되었습니다.`);
}

// ==============================================================
// 3-3. 원생 등록 / 수정 모달 로직
// ==============================================================
function openStudentAddModal() {
  updateAllStudentCounts();
  updateClassSelectOptions();

  var editTarget = document.getElementById('editStudentTargetId');
  if (editTarget) editTarget.value = '';

  var headerTitle = document.getElementById('studentModalHeaderTitle');
  if (headerTitle) headerTitle.innerText = '신규 원생 등록 (가맹점)';

  var btnSubmit = document.getElementById('btnSubmitStudentForm');
  if (btnSubmit) btnSubmit.innerHTML = '<i class="fa-solid fa-check mr-1"></i>원생 저장 완료';

  var nameEl = document.getElementById('newStdName');
  if (nameEl) nameEl.value = '';

  var genderEl = document.getElementById('newStdGender');
  if (genderEl) genderEl.value = '남';

  autoGenStudentId();
  var idEl = document.getElementById('newStdId');
  if (idEl) idEl.readOnly = false;

  var pwEl = document.getElementById('newStdPw');
  if (pwEl) {
    pwEl.value = '1234';
    pwEl.placeholder = '원생 접속용 비밀번호 입력 (예: 1234)';
  }

  var schoolEl = document.getElementById('newStdSchool');
  if (schoolEl) schoolEl.value = '나노초등학교';

  var gradeEl = document.getElementById('newStdGrade');
  if (gradeEl) {
    gradeEl.value = '초등 5학년';
    onStudentGradeChange('초등 5학년');
  }

  var classEl = document.getElementById('newStdClass');
  if (classEl) classEl.value = academyClassList.length > 0 ? academyClassList[0].name : '지혜반';

  var statusEl = document.getElementById('newStdStatus');
  if (statusEl) statusEl.value = '승인';

  var levelEl = document.getElementById('newStdLevel');
  if (levelEl) levelEl.value = '초등 심화 Lv 5';

  var pNameEl = document.getElementById('newStdParentName');
  if (pNameEl) pNameEl.value = '';

  var pPhoneEl = document.getElementById('newStdParentPhone');
  if (pPhoneEl) pPhoneEl.value = '';

  var pEmailEl = document.getElementById('newStdParentEmail');
  if (pEmailEl) pEmailEl.value = '';

  var reportYnEl = document.getElementById('newStdReportYn');
  if (reportYnEl) reportYnEl.checked = true;

  var teacherEl = document.getElementById('newStdTeacher');
  if (teacherEl) teacherEl.value = '박선혜 지도교사';

  var memoEl = document.getElementById('newStdMemo');
  if (memoEl) memoEl.value = '';

  var joinDateEl = document.getElementById('newStdJoinDate');
  if (joinDateEl) {
    var today = new Date();
    var yyyy = today.getFullYear();
    var mm = String(today.getMonth() + 1).padStart(2, '0');
    var dd = String(today.getDate()).padStart(2, '0');
    joinDateEl.value = `${yyyy}-${mm}-${dd}`;
  }

  if (window.jQuery && typeof $('#studentAddModal').modal === 'function') {
    $('#studentAddModal').modal('show');
  } else {
    showModalVanilla('studentAddModal');
  }

  setTimeout(function() {
    var focusTarget = document.getElementById('newStdName');
    if (focusTarget) focusTarget.focus();
  }, 300);
}

function openStudentEditModal(id) {
  var std = studentDataList.find(function(s) { return s.id === id; });
  if (!std) return;

  updateClassSelectOptions();

  var editTarget = document.getElementById('editStudentTargetId');
  if (editTarget) editTarget.value = std.id;

  var headerTitle = document.getElementById('studentModalHeaderTitle');
  if (headerTitle) headerTitle.innerText = `[${std.name}] 원생 정보 수정 및 상태 변경`;

  var btnSubmit = document.getElementById('btnSubmitStudentForm');
  if (btnSubmit) btnSubmit.innerHTML = '<i class="fa-solid fa-save mr-1"></i>수정 내용 저장';

  var nameEl = document.getElementById('newStdName');
  if (nameEl) nameEl.value = std.name || '';

  var genderEl = document.getElementById('newStdGender');
  if (genderEl) genderEl.value = std.gender || '남';

  var idEl = document.getElementById('newStdId');
  if (idEl) {
    idEl.value = std.id;
    idEl.readOnly = true;
  }

  var pwEl = document.getElementById('newStdPw');
  if (pwEl) {
    pwEl.value = std.password || '';
    pwEl.placeholder = '비밀번호 변경 시 새 비밀번호 입력 (유지 시 그대로 둠)';
  }

  var schoolEl = document.getElementById('newStdSchool');
  if (schoolEl) schoolEl.value = std.school || '';

  var gradeEl = document.getElementById('newStdGrade');
  if (gradeEl) gradeEl.value = std.grade || '초등 5학년';

  var classEl = document.getElementById('newStdClass');
  if (classEl) classEl.value = std.classGroup || '미지정';

  var statusEl = document.getElementById('newStdStatus');
  if (statusEl) statusEl.value = std.status || '승인';

  var levelEl = document.getElementById('newStdLevel');
  if (levelEl) levelEl.value = std.level || '초등 심화 Lv 5';

  var pNameEl = document.getElementById('newStdParentName');
  if (pNameEl) pNameEl.value = std.parentName || '';

  var pPhoneEl = document.getElementById('newStdParentPhone');
  if (pPhoneEl) pPhoneEl.value = std.phone || '';

  var pEmailEl = document.getElementById('newStdParentEmail');
  if (pEmailEl) pEmailEl.value = std.parentEmail || '';

  var reportYnEl = document.getElementById('newStdReportYn');
  if (reportYnEl) reportYnEl.checked = std.reportYn !== false;

  var teacherEl = document.getElementById('newStdTeacher');
  if (teacherEl) teacherEl.value = std.teacher || '박선혜 지도교사';

  var memoEl = document.getElementById('newStdMemo');
  if (memoEl) memoEl.value = std.memo || '';

  var joinDateEl = document.getElementById('newStdJoinDate');
  if (joinDateEl) {
    var dt = std.createdAt || std.joinDate || '2026-09-01';
    joinDateEl.value = dt.replace(/\./g, '-');
  }

  if (window.jQuery && typeof $('#studentAddModal').modal === 'function') {
    $('#studentAddModal').modal('show');
  } else {
    showModalVanilla('studentAddModal');
  }
}

function openStudentDetailModal(id) {
  openStudentEditModal(id);
}

function openStudentExcelModal() {
  if (window.jQuery && typeof $('#studentExcelModal').modal === 'function') {
    $('#studentExcelModal').modal('show');
  } else {
    showModalVanilla('studentExcelModal');
  }
}

function saveNewStudent() {
  var editId = (document.getElementById('editStudentTargetId') ? document.getElementById('editStudentTargetId').value : '').trim();

  var name = (document.getElementById('newStdName') ? document.getElementById('newStdName').value : '').trim();
  var gender = document.getElementById('newStdGender') ? document.getElementById('newStdGender').value : '남';
  var id = (document.getElementById('newStdId') ? document.getElementById('newStdId').value : '').trim();
  var pw = (document.getElementById('newStdPw') ? document.getElementById('newStdPw').value : '').trim();
  var school = (document.getElementById('newStdSchool') ? document.getElementById('newStdSchool').value : '').trim();
  var grade = document.getElementById('newStdGrade') ? document.getElementById('newStdGrade').value : '초등 5학년';
  var classGroup = document.getElementById('newStdClass') ? document.getElementById('newStdClass').value : '지혜반';
  var status = document.getElementById('newStdStatus') ? document.getElementById('newStdStatus').value : '승인';
  var level = document.getElementById('newStdLevel') ? document.getElementById('newStdLevel').value : '초등 심화 Lv 5';
  var parentName = (document.getElementById('newStdParentName') ? document.getElementById('newStdParentName').value : '').trim();
  var parentPhone = (document.getElementById('newStdParentPhone') ? document.getElementById('newStdParentPhone').value : '').trim();
  var parentEmail = (document.getElementById('newStdParentEmail') ? document.getElementById('newStdParentEmail').value : '').trim();
  var reportYn = document.getElementById('newStdReportYn') ? document.getElementById('newStdReportYn').checked : true;
  var teacher = document.getElementById('newStdTeacher') ? document.getElementById('newStdTeacher').value : '박선혜 지도교사';
  var memo = (document.getElementById('newStdMemo') ? document.getElementById('newStdMemo').value : '').trim();
  var joinDate = document.getElementById('newStdJoinDate') ? document.getElementById('newStdJoinDate').value : '2026-09-09';

  if (!name) {
    alert('원생 이름을 입력해 주세요.');
    document.getElementById('newStdName').focus();
    return;
  }
  if (!id) {
    alert('학번(ID)을 입력해 주세요.');
    document.getElementById('newStdId').focus();
    return;
  }
  if (!school) {
    alert('학교명을 입력해 주세요.');
    document.getElementById('newStdSchool').focus();
    return;
  }
  if (!parentName) {
    alert('학부모 이름을 입력해 주세요.');
    document.getElementById('newStdParentName').focus();
    return;
  }
  if (!parentPhone || parentPhone.length < 11) {
    alert('학부모 연락처를 정확히 입력해 주세요. (예: 010-1234-5678)');
    document.getElementById('newStdParentPhone').focus();
    return;
  }

  var createdDateStr = joinDate.replace(/-/g, '.');

  if (editId) {
    var std = studentDataList.find(function(s) { return s.id === editId; });
    if (std) {
      std.name = name;
      std.gender = gender;
      if (pw) std.password = pw;
      std.school = school;
      std.grade = grade;
      std.classGroup = classGroup;
      std.status = status;
      std.level = level;
      std.parentName = parentName;
      std.phone = parentPhone;
      std.parentEmail = parentEmail;
      std.reportYn = reportYn;
      std.teacher = teacher;
      std.memo = memo;
      std.createdAt = createdDateStr;

      showAcademyToast(`[${name}] 원생 정보 및 상태(${status})가 성공적으로 수정되었습니다.`);
    }
  } else {
    var exists = studentDataList.some(function(s) { return s.id.toLowerCase() === id.toLowerCase(); });
    if (exists) {
      alert(`이미 존재하는 학번(ID: ${id})입니다. 다른 학번을 입력하거나 자동채번 버튼을 눌러주세요.`);
      document.getElementById('newStdId').focus();
      return;
    }

    var newStudent = {
      id: id,
      name: name,
      gender: gender,
      password: pw || '1234',
      school: school,
      grade: grade,
      classGroup: classGroup,
      status: status,
      level: level,
      bookCount: 0,
      quizAvg: '0.0',
      parentName: parentName,
      phone: parentPhone,
      parentEmail: parentEmail,
      reportYn: reportYn,
      stdPhone: '',
      lastDate: createdDateStr,
      createdAt: createdDateStr,
      teacher: teacher,
      memo: memo || '신규 등록 원생',
      joinDate: joinDate
    };

    studentDataList.unshift(newStudent);
    lastAddedStudentId = newStudent.id;

    var assignSelect = document.getElementById('assignTargetSelect');
    if (assignSelect) {
      var opt = document.createElement('option');
      opt.value = `${newStudent.name} 원생 (${newStudent.id})`;
      opt.innerText = `${newStudent.name} 원생 (개별 배정)`;
      assignSelect.appendChild(opt);
    }

    showAcademyToast(`[${newStudent.name}] 원생이 성공적으로 등록되었습니다. (학번: ${newStudent.id}, 상태: ${status})`);
  }

  updateAllStudentCounts();
  if (typeof initPortfolioOptions === 'function') initPortfolioOptions();

  if (window.jQuery && typeof $('#studentAddModal').modal === 'function') {
    $('#studentAddModal').modal('hide');
  } else {
    hideModalVanilla('studentAddModal');
  }

  filterStudents();
}

function importSampleExcelStudents() {
  var sample1 = {
    id: 'S1027',
    name: '이하늘',
    gender: '여',
    password: '1234',
    school: '솔빛초등학교',
    grade: '초등 5학년',
    classGroup: '지혜반',
    status: '승인',
    level: '초등 심화 Lv 5',
    bookCount: 0,
    quizAvg: '0.0',
    parentName: '이진우',
    phone: '010-4421-8890',
    parentEmail: 'sky_parent@example.com',
    reportYn: true,
    lastDate: '2026.09.09',
    createdAt: '2026.09.09',
    teacher: '박선혜 지도교사',
    memo: '엑셀 일괄 등록 원생',
    joinDate: '2026-09-09'
  };
  var sample2 = {
    id: 'S1028',
    name: '윤도현',
    gender: '남',
    password: '1234',
    school: '나노초등학교',
    grade: '초등 6학년',
    classGroup: '마스터반',
    status: '승인',
    level: '초등 완성 Lv 6',
    bookCount: 0,
    quizAvg: '0.0',
    parentName: '윤지훈',
    phone: '010-8910-3345',
    parentEmail: 'dohyun_home@example.com',
    reportYn: true,
    lastDate: '2026.09.09',
    createdAt: '2026.09.09',
    teacher: '최승현 지도교사',
    memo: '엑셀 일괄 등록 원생',
    joinDate: '2026-09-09'
  };

  studentDataList.unshift(sample2);
  studentDataList.unshift(sample1);
  lastAddedStudentId = 'S1027';

  updateAllStudentCounts();
  if (typeof initPortfolioOptions === 'function') initPortfolioOptions();

  if (window.jQuery && typeof $('#studentExcelModal').modal === 'function') {
    $('#studentExcelModal').modal('hide');
  } else {
    hideModalVanilla('studentExcelModal');
  }

  filterStudents();
  showAcademyToast('엑셀 파일에서 2명의 원생(이하늘, 윤도현)이 성공적으로 일괄 등록되었습니다.');
}

// ==============================================================
// 3-4. 원생 테이블 렌더링 & 필터링 (신규 컬럼 완비)
// ==============================================================
function renderStudentTable(list) {
  var tbody = document.getElementById('studentTableBody');
  if (!tbody) return;
  tbody.innerHTML = '';

  var countEl = document.getElementById('searchResultCount');
  if (countEl) countEl.innerText = list.length;

  if (list.length === 0) {
    tbody.innerHTML = '<tr><td colspan="11" class="text-center py-5 text-muted">일치하는 원생이 없습니다.</td></tr>';
    return;
  }

  list.forEach(function(std) {
    var tr = document.createElement('tr');
    if (std.id === lastAddedStudentId) {
      tr.className = 'row-highlight-new';
    }

    var quizScoreDisplay = (std.quizAvg === '0.0' || std.quizAvg === 0) ? '<span class="text-muted">-</span>' : std.quizAvg + '점';

    // 성별 뱃지
    var genderBadge = std.gender === '여' ?
      '<span class="badge" style="background:#fee2e2; color:#b91c1c; font-size:11px; font-weight:700; padding:2px 6px; border-radius:4px;">여</span>' :
      '<span class="badge" style="background:#e0e7ff; color:#3730a3; font-size:11px; font-weight:700; padding:2px 6px; border-radius:4px;">남</span>';

    // 소속 학급 뱃지
    var classBadge = std.classGroup === '미지정' ?
      '<span class="badge-soft badge-soft-warn text-danger font-weight-bold" style="background:#fff1f2; color:#e11d48; border:1px solid #fecdd3;">미지정</span>' :
      '<span class="badge-soft badge-soft-neutral">' + std.classGroup + '</span>';

    // 상태 뱃지 (승인, 미승인, 퇴원)
    var statusBadge = '';
    if (std.status === '미승인') {
      statusBadge = '<span class="badge badge-warning text-dark" style="font-size:11px; font-weight:700; padding:3px 7px;"><i class="fa-regular fa-clock mr-1"></i>미승인</span>';
    } else if (std.status === '퇴원') {
      statusBadge = '<span class="badge badge-secondary" style="font-size:11px; font-weight:700; padding:3px 7px;"><i class="fa-solid fa-user-slash mr-1"></i>퇴원</span>';
    } else {
      statusBadge = '<span class="badge badge-success" style="font-size:11px; font-weight:700; padding:3px 7px;"><i class="fa-solid fa-check mr-1"></i>승인</span>';
    }

    // 학부모 정보
    var parentInfo = '<div style="font-size:12.5px; line-height:1.3;">' +
      '<strong>' + (std.parentName || '학부모') + '</strong> ' +
      '<small class="text-muted">(' + (std.phone || '-') + ')</small>' +
      (std.reportYn !== false ? ' <i class="fa-solid fa-paper-plane text-primary ml-1" style="font-size:10px;" title="리포트 수신동의"></i>' : '') +
      '</div>';
    if (std.parentEmail) {
      parentInfo += '<div style="font-size:11px; color:#64748b;">' + std.parentEmail + '</div>';
    }

    var createDateStr = std.createdAt || std.joinDate || '2026.03.01';

    tr.innerHTML = 
      '<td class="text-center"><small class="text-muted font-weight-bold">' + std.id + '</small></td>' +
      '<td><span class="student-link font-weight-bold" onclick="openStudentEditModal(\'' + std.id + '\')">' + std.name + '</span>' + 
      (std.id === lastAddedStudentId ? ' <span class="badge badge-warning text-dark ml-1" style="font-size:10px;">신규</span>' : '') + '</td>' +
      '<td class="text-center">' + genderBadge + '</td>' +
      '<td>' + std.school + ' <small class="text-muted">(' + std.grade + ')</small></td>' +
      '<td class="text-center">' + classBadge + '</td>' +
      '<td class="text-center">' + statusBadge + '</td>' +
      '<td>' + parentInfo + '</td>' +
      '<td class="text-center"><small class="text-muted font-weight-bold">' + createDateStr + '</small></td>' +
      '<td class="text-center font-weight-bold" style="color:var(--btn-primary); font-size:12px;">' + std.level + '</td>' +
      '<td class="text-center font-weight-bold">' + std.bookCount + '권 <small class="text-success font-weight-bold">(' + quizScoreDisplay + ')</small></td>' +
      '<td class="text-center">' +
        '<button type="button" class="btn btn-xs btn-outline-secondary mr-1" onclick="openStudentEditModal(\'' + std.id + '\')" title="수정 및 상태 변경" style="border-radius:6px; font-size:11px; padding:2.5px 6px;"><i class="fa-solid fa-pen mr-1"></i>수정</button>' +
        '<button type="button" class="btn btn-xs btn-outline-danger mr-1" onclick="deleteStudent(\'' + std.id + '\')" title="원생 삭제 (학급 미지정 변환)" style="border-radius:6px; font-size:11px; padding:2.5px 6px;"><i class="fa-solid fa-trash-can mr-1"></i>삭제</button>' +
        '<button type="button" class="btn btn-xs btn-beige-primary" onclick="viewStudentPortfolio(\'' + std.id + '\')" title="포트폴리오 리포트" style="border-radius:6px; font-size:11px; padding:2.5px 6px;"><i class="fa-solid fa-chart-pie"></i></button>' +
      '</td>';
    tbody.appendChild(tr);
  });
}

function filterStudents() {
  var classVal = document.getElementById('filterStudentClass') ? document.getElementById('filterStudentClass').value : 'ALL';
  var query = (document.getElementById('searchStudentInput') ? document.getElementById('searchStudentInput').value : '').toLowerCase().trim();

  var filtered = studentDataList.filter(function(std) {
    var matchClass = (classVal === 'ALL') || (std.classGroup === classVal);
    var matchQuery = !query || 
      std.name.toLowerCase().indexOf(query) !== -1 || 
      std.id.toLowerCase().indexOf(query) !== -1 || 
      (std.parentName && std.parentName.toLowerCase().indexOf(query) !== -1) ||
      (std.school && std.school.toLowerCase().indexOf(query) !== -1);
    return matchClass && matchQuery;
  });

  renderStudentTable(filtered);
}

function renderTeacherTable() {
  var tbody = document.getElementById('teacherTableBody');
  if (!tbody) return;
  tbody.innerHTML = '';

  document.getElementById('teacherTotalCount').innerText = teacherDataList.length;

  teacherDataList.forEach(function(t, idx) {
    var tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="text-center"><small class="text-muted font-weight-bold">${idx + 1}</small></td>
      <td>
        <strong style="font-size: 14px; color: var(--text-main);">${t.name}</strong>
        <small class="text-muted">(${t.username})</small>
      </td>
      <td class="text-center"><span class="badge-soft ${t.role.includes('원장') ? 'badge-soft-master' : 'badge-soft-warn'}">${t.role}</span></td>
      <td>${t.classes}</td>
      <td class="text-center font-weight-bold">${t.studentCount}명</td>
      <td class="text-center">${t.phone}</td>
      <td class="text-center"><small class="text-muted">${t.joinDate}</small></td>
      <td class="text-center">
        <button class="btn btn-xs btn-outline-secondary mr-1" onclick="openTeacherEditModal('${t.id}')" style="border-radius:6px; font-size:11.5px; padding:3px 8px;">수정</button>
        <button class="btn btn-xs btn-outline-danger" onclick="deleteTeacher('${t.id}')" style="border-radius:6px; font-size:11.5px; padding:3px 8px;">삭제</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function openTeacherAddModal() {
  document.getElementById('teacherModalTitle').innerText = '신규 선생님(교사) 등록';
  document.getElementById('teacherFormId').value = '';
  document.getElementById('teacherNameInput').value = '';
  document.getElementById('teacherUsernameInput').value = '';
  document.getElementById('teacherRoleSelect').value = '지도교사';
  document.getElementById('teacherClassInput').value = '';
  document.getElementById('teacherPhoneInput').value = '';
  $('#teacherModal').modal('show');
}

function openTeacherEditModal(id) {
  var t = teacherDataList.find(item => item.id === id);
  if (!t) return;

  document.getElementById('teacherModalTitle').innerText = '선생님 정보 수정';
  document.getElementById('teacherFormId').value = t.id;
  document.getElementById('teacherNameInput').value = t.name;
  document.getElementById('teacherUsernameInput').value = t.username;
  document.getElementById('teacherRoleSelect').value = t.role.includes('원장') ? '원장' : t.role.includes('수석') ? '수석 지도교사' : '지도교사';
  document.getElementById('teacherClassInput').value = t.classes;
  document.getElementById('teacherPhoneInput').value = t.phone;
  $('#teacherModal').modal('show');
}

function handleSaveTeacher(e) {
  e.preventDefault();
  var id = document.getElementById('teacherFormId').value;
  var name = document.getElementById('teacherNameInput').value.trim();
  var username = document.getElementById('teacherUsernameInput').value.trim();
  var role = document.getElementById('teacherRoleSelect').value;
  var classes = document.getElementById('teacherClassInput').value.trim();
  var phone = document.getElementById('teacherPhoneInput').value.trim();

  if (id) {
    var t = teacherDataList.find(item => item.id === id);
    if (t) {
      t.name = name;
      t.username = username;
      t.role = role;
      t.classes = classes;
      t.phone = phone;
      showAcademyToast(`[${name}] 선생님의 정보가 수정되었습니다.`);
    }
  } else {
    var newT = {
      id: 'T00' + (teacherDataList.length + 1),
      name: name,
      username: username,
      role: role,
      classes: classes,
      studentCount: 0,
      phone: phone,
      joinDate: new Date().toISOString().split('T')[0]
    };
    teacherDataList.push(newT);
    showAcademyToast(`[${name}] 신규 선생님이 성공적으로 등록되었습니다.`);
  }

  $('#teacherModal').modal('hide');
  renderTeacherTable();
}

function deleteTeacher(id) {
  var t = teacherDataList.find(item => item.id === id);
  if (!t) return;
  if (confirm(`[${t.name}] 선생님 계정을 삭제하시겠습니까?`)) {
    teacherDataList = teacherDataList.filter(item => item.id !== id);
    renderTeacherTable();
    showAcademyToast(`[${t.name}] 선생님 계정이 삭제되었습니다.`);
  }
}

// 원생 상세 모달
function openStudentDetailModal(stdId) {
  var std = studentDataList.find(s => s.id === stdId);
  if (!std) return;

  document.getElementById('m_std_name').innerText = std.name;
  document.getElementById('m_std_id').innerText = std.id;
  document.getElementById('m_std_school').innerText = std.school + ' (' + std.grade + ')';
  document.getElementById('m_std_class').innerText = std.classGroup;
  document.getElementById('m_std_level').innerText = std.level;
  document.getElementById('m_std_books').innerText = std.bookCount + '권 완독';
  document.getElementById('m_std_score').innerText = (std.quizAvg === '0.0' || std.quizAvg === 0) ? '-' : std.quizAvg + '점';
  document.getElementById('m_std_phone').innerText = std.phone;
  if (document.getElementById('m_std_teacher')) {
    document.getElementById('m_std_teacher').innerText = std.teacher || '박선혜 지도교사';
  }
  document.getElementById('m_std_date').innerText = std.lastDate;
  if (document.getElementById('m_std_memo')) {
    document.getElementById('m_std_memo').innerText = std.memo || '-';
  }

  if (window.jQuery && typeof $('#studentDetailModal').modal === 'function') {
    $('#studentDetailModal').modal('show');
  } else {
    showModalVanilla('studentDetailModal');
  }
}

// ==============================================================
// 4. 학습 관리 모듈 (Learning Activities & Reports)
// ==============================================================
var learningLogs = [
  {
    id: 'LR-101',
    date: '2026-09-08 16:40',
    studentName: '김민준',
    studentId: 'S1021',
    school: '나노초등학교 5학년',
    classGroup: '지혜반',
    bookTitle: '어린 왕자',
    bookPub: '열린책들 · 앙투안 드 생텍쥐페리',
    score: 100,
    pass: true,
    sheet: '작성 완료',
    reviewed: '첨삭 완료',
    sheetAnswer: '사막여우와의 만남에서 여우가 "네 장미꽃이 그토록 소중한 것은 그 꽃을 위해 네가 들인 시간 때문이야"라고 말한 구절이 가장 마음에 와닿았습니다. 길들인다는 것은 서로에게 세상에서 유일한 존재가 되고 끝까지 책임을 지는 관계를 뜻한다고 생각합니다. 저도 친구들과의 우정을 위해 더 진심을 다하고 정성을 쏟아야겠다고 다짐했습니다.',
    comment: '사막여우와의 길들임에 대한 철학적 성찰이 매우 깊이 있게 작성되었습니다. 본문 속 핵심 문장을 인용하여 자신의 일상 속 친구 관계의 소중함으로 연결 지은 점이 매우 훌륭합니다.',
    quizResults: [
      {
        qNum: 1,
        question: "『어린 왕자』에서 사막여우가 어린 왕자에게 전해준 가장 소중한 비밀인 ㉠에 들어갈 알맞은 낱말은?\n\n[지문]\n\"오로지 ㉠(으)로 보아야만 분명하게 볼 수 있어. 가장 중요한 것은 눈에 보이지 않거든.\"",
        userChoice: 1,
        userChoiceText: "①번 마음",
        correctChoice: 1,
        correctChoiceText: "①번 마음",
        isCorrect: true,
        hint: "눈에 보이지 않는 진실은 오직 '마음'으로만 볼 수 있다는 여우의 가장 핵심적인 가르침입니다."
      },
      {
        qNum: 2,
        question: "어린 왕자가 살던 고향 별의 명칭으로 알맞은 것은 무엇인가요?",
        userChoice: 2,
        userChoiceText: "②번 B-612 소행성",
        correctChoice: 2,
        correctChoiceText: "②번 B-612 소행성",
        isCorrect: true,
        hint: "어린 왕자의 고향 별은 터키 천문학자가 발견한 소행성 B-612호입니다."
      },
      {
        qNum: 3,
        question: "어린 왕자가 자신의 별을 떠나 다른 별들을 여행하기로 결심한 가장 결정적인 이유는 무엇인가요?",
        userChoice: 2,
        userChoiceText: "②번 장미꽃의 투정과 까다로운 자존심에 상처를 받아서",
        correctChoice: 2,
        correctChoiceText: "②번 장미꽃의 투정과 까다로운 자존심에 상처를 받아서",
        isCorrect: true,
        hint: "장미꽃을 깊이 사랑했지만, 꽃의 서툰 표현과 투정에 어린 왕자가 마음의 상처를 입고 여행길에 올랐습니다."
      },
      {
        qNum: 4,
        question: "여우가 어린 왕자에게 알려준 ㉡'길들인다'의 참된 의미로 가장 알맞은 것은?",
        userChoice: 2,
        userChoiceText: "②번 서로에게 특별한 관계를 맺고 끝까지 책임을 지는 것",
        correctChoice: 2,
        correctChoiceText: "②번 서로에게 특별한 관계를 맺고 끝까지 책임을 지는 것",
        isCorrect: true,
        hint: "수많은 소년과 여우 중 하나가 아니라, 서로에게 세상에 오직 하나뿐인 존재가 되는 소중한 유대감입니다."
      },
      {
        qNum: 5,
        question: "비행기 조종사가 어릴 적 어른들에게 보여주었으나, 어른들이 단순한 '모자'로만 착각했던 첫 번째 그림은 무엇인가요?",
        userChoice: 1,
        userChoiceText: "①번 코끼리를 삼킨 보아뱀 그림",
        correctChoice: 1,
        correctChoiceText: "①번 코끼리를 삼킨 보아뱀 그림",
        isCorrect: true,
        hint: "어른들은 겉모습만 보고 모자라고 여겼지만, 실제로는 코끼리를 소화시키는 보아뱀의 속 모습이었습니다."
      }
    ]
  },
  {
    id: 'LR-102',
    date: '2026-09-08 15:20',
    studentName: '이서윤',
    studentId: 'S1022',
    school: '솔빛초등학교 4학년',
    classGroup: '슬기반',
    bookTitle: '마당을 나온 암탉',
    bookPub: '사계절 · 황선미',
    score: 90,
    pass: true,
    sheet: '작성 완료',
    reviewed: '첨삭 완료',
    sheetAnswer: '잎싹이 알을 낳지 못해 양계장에 갇혀 살다가 스스로 마당 밖으로 뛰쳐나오는 용기가 대단했습니다. 초록머리를 자식처럼 돌보며 모성애를 발휘하는 장면에서 가슴이 뭉클했습니다.',
    comment: '잎싹의 주체적인 삶과 진정한 가족의 의미를 어린 학생의 순수한 시선에서 감동적으로 짚어내었습니다.',
    quizResults: [
      {
        qNum: 1,
        question: "주인공 암탉 잎싹이 양계장을 탈출하기로 결심한 근본적인 이유는 무엇인가요?",
        userChoice: 1,
        userChoiceText: "①번 스스로 품어 알을 부화시켜 병아리를 만나고 싶어서",
        correctChoice: 1,
        correctChoiceText: "①번 스스로 품어 알을 부화시켜 병아리를 만나고 싶어서",
        isCorrect: true,
        hint: "잎싹은 매일 알을 뺏기는 삶 대신 직접 알을 품어 어미가 되고자 결심했습니다."
      },
      {
        qNum: 2,
        question: "잎싹이 덤불 속에서 발견하여 정성껏 품어 부화시킨 아기의 원래 정체는 무엇인가요?",
        userChoice: 3,
        userChoiceText: "③번 청둥오리 알",
        correctChoice: 3,
        correctChoiceText: "③번 청둥오리 알",
        isCorrect: true,
        hint: "족제비에게 희생된 나그네 청둥오리의 알이었습니다."
      },
      {
        qNum: 3,
        question: "잎싹이 아기 청둥오리에게 지어준 이름으로 알맞은 것은?",
        userChoice: 2,
        userChoiceText: "②번 초록머리",
        correctChoice: 2,
        correctChoiceText: "②번 초록머리",
        isCorrect: true,
        hint: "머리 깃털이 영롱한 초록빛을 띠고 있어 '초록머리'라고 이름을 붙였습니다."
      },
      {
        qNum: 4,
        question: "잎싹과 초록머리를 끝까지 위협했던 야생의 천적 동물은 무엇인가요?",
        userChoice: 1,
        userChoiceText: "①번 애꾸눈 족제비",
        correctChoice: 1,
        correctChoiceText: "①번 애꾸눈 족제비",
        isCorrect: true,
        hint: "애꾸눈 족제비는 야생의 생존 본능으로 잎싹 모자를 위협하는 천적이었습니다."
      },
      {
        qNum: 5,
        question: "결말에서 잎싹이 초록머리를 청둥오리 무리로 떠나보낸 까닭으로 가장 알맞은 것은?",
        userChoice: 4,
        userChoiceText: "④번 초록머리가 미워서 홀로 버려두려고",
        correctChoice: 2,
        correctChoiceText: "②번 하늘을 나는 오리로서의 본래 삶을 살아가게 하려고",
        isCorrect: false,
        hint: "닭인 자신 곁에 가두지 않고, 오리로서 하늘을 훨훨 날며 동족들과 함께 살아가도록 사랑으로 놓아준 것입니다."
      }
    ]
  },
  {
    id: 'LR-103',
    date: '2026-09-08 14:10',
    studentName: '박도윤',
    studentId: 'S1023',
    school: '나노초등학교 6학년',
    classGroup: '마스터반',
    bookTitle: '자전거 도둑',
    bookPub: '다림 · 박완서',
    score: 100,
    pass: true,
    sheet: '작성 완료',
    reviewed: '첨삭 대기',
    sheetAnswer: '수남이가 신사에게 모욕을 당하고 얼떨결에 자전거를 들고 도망쳤을 때, 주위 사람들이 "잘했다"고 칭찬하자 양심의 가책을 느끼는 모습이 인상 깊었습니다. 부끄러움을 잃어버리는 것이 진짜 도둑이라는 생각이 들었습니다.',
    comment: '수남이의 도덕적 갈등에 대한 핵심 쟁점을 잘 포착하였습니다. 현대 사회의 도덕성 상실 문제를 학생의 눈높이에서 날카롭게 짚었습니다.',
    quizResults: [
      {
        qNum: 1,
        question: "주인공 수남이가 시골에서 서울로 올라와 일하고 있는 상점은 어디인가요?",
        userChoice: 2,
        userChoiceText: "②번 청계천 세운상가 전기용품 도매상",
        correctChoice: 2,
        correctChoiceText: "②번 청계천 세운상가 전기용품 도매상",
        isCorrect: true,
        hint: "수남이는 세운상가 뒷골목 전물상회에서 꼬마 점원으로 성실히 일하고 있었습니다."
      },
      {
        qNum: 2,
        question: "바람이 몹시 불던 날, 수남이의 자전거가 부딪혀 흠집을 낸 고급 승용차의 주인 신사가 요구한 것은?",
        userChoice: 1,
        userChoiceText: "①번 수리비 5천 원을 물어내라며 자전거를 자물쇠로 잠가버림",
        correctChoice: 1,
        correctChoiceText: "①번 수리비 5천 원을 물어내라며 자전거를 자물쇠로 잠가버림",
        isCorrect: true,
        hint: "신사는 가난한 점원 수남이의 사정을 무시하고 자전거를 인질로 잡아 자물쇠를 채웠습니다."
      },
      {
        qNum: 3,
        question: "구경꾼들의 부추김에 수남이가 저지른 행동으로 알맞은 것은 무엇인가요?",
        userChoice: 3,
        userChoiceText: "③번 잠긴 자전거를 번쩍 들고 골목길로 도망쳐 달아남",
        correctChoice: 3,
        correctChoiceText: "③번 잠긴 자전거를 번쩍 들고 골목길로 도망쳐 달아남",
        isCorrect: true,
        hint: "신사의 부당한 처사에 사람들의 외침에 휩쓸려 자전거를 들고 도망쳤습니다."
      },
      {
        qNum: 4,
        question: "가게 주인 영감이 자전거를 들고 온 수남이를 보며 보인 반응은 무엇이었나요?",
        userChoice: 1,
        userChoiceText: "①번 똑똑하게 굴었다며 쾌재를 부르고 수남이를 칭찬함",
        correctChoice: 1,
        correctChoiceText: "①번 똑똑하게 굴었다며 쾌재를 부르고 수남이를 칭찬함",
        isCorrect: true,
        hint: "수남이의 잘못을 훈계하기는커녕 손해를 보지 않았다며 통쾌해했습니다."
      },
      {
        qNum: 5,
        question: "수남이가 결국 짐을 싸서 고향 아버지 곁으로 돌아가기로 결심한 가장 결정적인 이유는?",
        userChoice: 2,
        userChoiceText: "②번 도둑질에 대한 부끄러움을 잃고 영감처럼 도덕적으로 타락할까 봐 두려워서",
        correctChoice: 2,
        correctChoiceText: "②번 도둑질에 대한 부끄러움을 잃고 영감처럼 도덕적으로 타락할까 봐 두려워서",
        isCorrect: true,
        hint: "양심의 가책을 칭찬으로 덮으려는 도시의 물질만능주의 속에서 자신의 순수성을 지키고자 귀향을 택했습니다."
      }
    ]
  },
  {
    id: 'LR-104',
    date: '2026-09-07 18:30',
    studentName: '정하은',
    studentId: 'S1024',
    school: '해밀중학교 1학년',
    classGroup: '심화반',
    bookTitle: '아몬드',
    bookPub: '창비 · 손원평',
    score: 80,
    pass: true,
    sheet: '작성 완료',
    reviewed: '첨삭 완료',
    sheetAnswer: '편도체가 작아 감정을 느끼지 못하는 윤재가 곤이를 만나며 분노와 슬픔, 그리고 타인의 고통을 이해해 나가는 과정이 인상적이었습니다. 공감이란 타고나는 것이 아니라 서로를 이해하려는 노력이라는 점을 배웠습니다.',
    comment: '알렉시티미아(감정표현불능증)와 공감의 가치를 논리적으로 서술하였습니다. 타인의 마음에 가닿기 위한 연대의 중요성을 심도 있게 고찰했습니다.',
    quizResults: [
      {
        qNum: 1,
        question: "주인공 선윤재가 뇌 속 편도체의 발달 이상으로 겪고 있는 증상의 의학적 명칭은 무엇인가요?",
        userChoice: 1,
        userChoiceText: "①번 알렉시티미아 (감정표현불능증)",
        correctChoice: 1,
        correctChoiceText: "①번 알렉시티미아 (감정표현불능증)",
        isCorrect: true,
        hint: "공포, 분노, 슬픔 등의 감정을 느끼거나 표현하지 못하는 질환입니다."
      },
      {
        qNum: 2,
        question: "비극적인 크리스마스이브 사건 이후, 윤재를 친절하게 보살펴주며 헌책방 위의 심모노클린 의원을 운영하는 인물은?",
        userChoice: 3,
        userChoiceText: "③번 심 박사 (심재형)",
        correctChoice: 3,
        correctChoiceText: "③번 심 박사 (심재형)",
        isCorrect: true,
        hint: "엄마의 지인이자 윤재의 후견인이 되어주는 따뜻한 의사 선생님입니다."
      },
      {
        qNum: 3,
        question: "윤재와 대립하면서도 서로에게 깊은 영향을 미치며 점차 마음을 열어가는 거친 소년의 이름은?",
        userChoice: 2,
        userChoiceText: "②번 곤이 (이수)",
        correctChoice: 2,
        correctChoiceText: "②번 곤이 (이수)",
        isCorrect: true,
        hint: "어릴 적 미아가 되어 상처투성이로 자란 거칠지만 여린 소년 곤이입니다."
      },
      {
        qNum: 4,
        question: "윤재에게 달리기와 사랑이라는 낯선 감정의 두근거림을 처음으로 일깨워준 여학생은?",
        userChoice: 2,
        userChoiceText: "②번 이도라",
        correctChoice: 2,
        correctChoiceText: "②번 이도라",
        isCorrect: true,
        hint: "육상부에서 힘차게 달리며 윤재의 가슴에 신선한 파동을 일으킨 소녀입니다."
      },
      {
        qNum: 5,
        question: "윤재가 위험에 처한 곤이를 구하기 위해 목숨을 걸고 찾아갔던 장소는 어디인가요?",
        userChoice: 1,
        userChoiceText: "①번 학교 옥상",
        correctChoice: 4,
        correctChoiceText: "④번 불량배 쇠사의 철강 창고",
        isCorrect: false,
        hint: "곤이가 나쁜 길로 빠지는 것을 막기 위해 위험한 조직원 쇠사가 있는 낡은 창고로 홀로 찾아갔습니다."
      }
    ]
  },
  {
    id: 'LR-105',
    date: '2026-09-07 17:15',
    studentName: '윤지유',
    studentId: 'S1026',
    school: '솔빛초등학교 5학년',
    classGroup: '지혜반',
    bookTitle: '어린 왕자',
    bookPub: '열린책들 · 앙투안 드 생텍쥐페리',
    score: 100,
    pass: true,
    sheet: '작성 완료',
    reviewed: '첨삭 완료',
    sheetAnswer: '어른들이 숫자로만 사람을 판단한다는 구절을 읽고 공감이 갔습니다. 진정한 가치는 겉모습이나 숫자가 아니라 마음의 눈으로 서로를 바라보는 데 있다는 것을 항상 기억하겠습니다.',
    comment: '어른들의 획일화된 시선에 대한 비판적 시각이 돋보입니다. 작품의 핵심 메시지를 자기 삶의 주관과 잘 결합하였습니다.',
    quizResults: [
      {
        qNum: 1,
        question: "『어린 왕자』에서 사막여우가 어린 왕자에게 전해준 가장 소중한 비밀인 ㉠에 들어갈 알맞은 낱말은?",
        userChoice: 1,
        userChoiceText: "①번 마음",
        correctChoice: 1,
        correctChoiceText: "①번 마음",
        isCorrect: true,
        hint: "가장 중요한 것은 눈에 보이지 않으며 오직 마음으로 보아야 합니다."
      },
      {
        qNum: 2,
        question: "어린 왕자가 살던 고향 별의 명칭으로 알맞은 것은 무엇인가요?",
        userChoice: 2,
        userChoiceText: "②번 B-612 소행성",
        correctChoice: 2,
        correctChoiceText: "②번 B-612 소행성",
        isCorrect: true,
        hint: "어린 왕자의 고향 별은 B-612 소행성입니다."
      },
      {
        qNum: 3,
        question: "어린 왕자가 자신의 별을 떠나 다른 별들을 여행하기로 결심한 가장 결정적인 이유는 무엇인가요?",
        userChoice: 2,
        userChoiceText: "②번 장미꽃의 투정과 까다로운 자존심에 상처를 받아서",
        correctChoice: 2,
        correctChoiceText: "②번 장미꽃의 투정과 까다로운 자존심에 상처를 받아서",
        isCorrect: true,
        hint: "장미꽃과의 갈등과 서툰 소통에 상처를 입고 별을 떠났습니다."
      },
      {
        qNum: 4,
        question: "여우가 어린 왕자에게 알려준 ㉡'길들인다'의 참된 의미로 가장 알맞은 것은?",
        userChoice: 2,
        userChoiceText: "②번 서로에게 특별한 관계를 맺고 끝까지 책임을 지는 것",
        correctChoice: 2,
        correctChoiceText: "②번 서로에게 특별한 관계를 맺고 끝까지 책임을 지는 것",
        isCorrect: true,
        hint: "서로에게 유일한 존재가 되고 영원히 책임을 지는 관계입니다."
      },
      {
        qNum: 5,
        question: "비행기 조종사가 어릴 적 어른들에게 보여주었으나, 어른들이 단순한 '모자'로만 착각했던 첫 번째 그림은 무엇인가요?",
        userChoice: 1,
        userChoiceText: "①번 코끼리를 삼킨 보아뱀 그림",
        correctChoice: 1,
        correctChoiceText: "①번 코끼리를 삼킨 보아뱀 그림",
        isCorrect: true,
        hint: "코끼리를 삼킨 보아뱀 그림이었습니다."
      }
    ]
  },
  {
    id: 'LR-106',
    date: '2026-09-06 16:00',
    studentName: '강시우',
    studentId: 'S1025',
    school: '새싹초등학교 2학년',
    classGroup: '새싹반',
    bookTitle: '만복이네 떡집',
    bookPub: '비룡소 · 김리리',
    score: 90,
    pass: true,
    sheet: '작성 완료',
    reviewed: '첨삭 완료',
    sheetAnswer: '만복이가 나쁜 말을 할 때마다 입이 굳어지는 떡을 먹고 착한 말과 칭찬을 배우는 과정이 재미있었습니다. 저도 앞으로 친구들에게 예쁜 말만 쓰겠습니다.',
    comment: '따뜻한 말을 쓸 때 생기는 마음의 긍정적인 변화를 순수하고 솔직하게 잘 표현하였습니다.',
    quizResults: [
      {
        qNum: 1,
        question: "주인공 만복이가 친구들에게 나쁜 말과 심술을 부렸던 진짜 속마음은 무엇이었나요?",
        userChoice: 1,
        userChoiceText: "①번 친구들과 친해지고 싶었지만 표현이 서툴러서",
        correctChoice: 1,
        correctChoiceText: "①번 친구들과 친해지고 싶었지만 표현이 서툴러서",
        isCorrect: true,
        hint: "만복이는 마음과 달리 엉뚱하게 험한 말이 튀어나와 속상해했습니다."
      },
      {
        qNum: 2,
        question: "만복이네 떡집에서 떡을 사기 위해 지불해야 하는 신비한 '가격'은 무엇이었나요?",
        userChoice: 2,
        userChoiceText: "②번 착한 일 하기와 웃는 얼굴, 칭찬하기",
        correctChoice: 2,
        correctChoiceText: "②번 착한 일 하기와 웃는 얼굴, 칭찬하기",
        isCorrect: true,
        hint: "돈 대신 '착한 일 하나', '아이들 웃음소리' 등이 떡값이었습니다."
      },
      {
        qNum: 3,
        question: "먹으면 입에서 달콤한 칭찬의 말이 저절로 쏟아져 나오는 떡의 이름은 무엇인가요?",
        userChoice: 3,
        userChoiceText: "③번 꿀떡",
        correctChoice: 3,
        correctChoiceText: "③번 꿀떡",
        isCorrect: true,
        hint: "꿀처럼 달콤한 말이 입술에서 피어나는 꿀떡이었습니다."
      },
      {
        qNum: 4,
        question: "만복이가 떡을 먹으며 점차 변화하자 주변 친구들이 보인 태도는 어떠했나요?",
        userChoice: 1,
        userChoiceText: "①번 만복이를 반갑게 맞아주고 좋은 친구가 됨",
        correctChoice: 1,
        correctChoiceText: "①번 만복이를 반갑게 맞아주고 좋은 친구가 됨",
        isCorrect: true,
        hint: "만복이의 따뜻한 말과 배려에 친구들도 마음을 열었습니다."
      },
      {
        qNum: 5,
        question: "이 동화가 우리에게 전해주는 가장 핵심적인 교훈은 무엇인가요?",
        userChoice: 3,
        userChoiceText: "③번 떡을 많이 먹으면 기운이 세진다",
        correctChoice: 2,
        correctChoiceText: "②번 고운 말과 따뜻한 칭찬이 친구의 마음을 움직인다",
        isCorrect: false,
        hint: "다정한 말 한마디와 따뜻한 칭찬이 인간관계를 변화시키는 마법이라는 교훈입니다."
      }
    ]
  }
];

function renderLearningTable() {
  var tbody = document.getElementById('learningTableBody');
  if (!tbody) return;
  tbody.innerHTML = '';

  var classFilter = document.getElementById('learningClassFilter') ? document.getElementById('learningClassFilter').value : 'ALL';
  var query = (document.getElementById('learningSearchInput') ? document.getElementById('learningSearchInput').value : '').toLowerCase().trim();

  var filtered = learningLogs.filter(function(l) {
    var matchClass = classFilter === 'ALL' || l.classGroup === classFilter;
    var matchQuery = !query || l.studentName.toLowerCase().includes(query) || l.bookTitle.toLowerCase().includes(query);
    return matchClass && matchQuery;
  });

  var countEl = document.getElementById('learningLogCount');
  if (countEl) countEl.innerText = filtered.length;

  if (filtered.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" class="text-center py-5 text-muted">일치하는 학습 기록이 없습니다.</td></tr>';
    return;
  }

  filtered.forEach(function(l, idx) {
    var tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="text-center"><small class="text-muted font-weight-bold">${idx + 1}</small></td>
      <td class="text-center"><small class="text-muted">${l.date}</small></td>
      <td>
        <strong style="color: var(--text-main);">${l.studentName}</strong>
        <small class="text-muted">(${l.classGroup})</small>
      </td>
      <td class="font-weight-bold">${l.bookTitle}</td>
      <td class="text-center">
        <span class="badge-soft ${l.score === 100 ? 'badge-soft-success' : 'badge-soft-warn'} font-weight-bold">${l.score}점</span>
      </td>
      <td class="text-center"><span class="badge-soft badge-soft-neutral">${l.sheet}</span></td>
      <td class="text-center">
        <span class="badge-soft ${l.reviewed.includes('완료') ? 'badge-soft-success' : 'badge-soft-warn'}">${l.reviewed}</span>
      </td>
      <td class="text-center">
        <button class="btn btn-xs btn-outline-secondary" onclick="openLearningDetailModal('${l.id}')" style="border-radius:6px; font-size:11.5px; padding:3px 8px;">
          학습리포트
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// 상세 학습리포트 모달 열기 및 문항별 채점 결과 상세 렌더링
function openLearningDetailModal(id) {
  var log = learningLogs.find(function(l) { return l.id === id; });
  if (!log) return;

  // 1. 기본 개요 바인딩
  document.getElementById('learnModalStudent').innerText = `${log.studentName} (${log.classGroup})`;
  if (document.getElementById('learnModalStudentSchool')) {
    document.getElementById('learnModalStudentSchool').innerText = log.school || '나노초등학교';
  }
  document.getElementById('learnModalBook').innerText = log.bookTitle;
  if (document.getElementById('learnModalBookPub')) {
    document.getElementById('learnModalBookPub').innerText = log.bookPub || '나노 교육출판';
  }
  document.getElementById('learnModalDate').innerText = log.date;
  document.getElementById('learnModalScore').innerText = `${log.score}점`;

  var passBadge = document.getElementById('learnModalPassBadge');
  if (passBadge) {
    if (log.score >= 90) {
      passBadge.className = 'badge-soft badge-soft-success';
      passBadge.innerText = '1차 응시 합격';
    } else {
      passBadge.className = 'badge-soft badge-soft-warn';
      passBadge.innerText = '재응시 권장 (통과)';
    }
  }

  // 2. 북퀴즈 문항별 상세 내역 (어떤 문제, 정답, 내가 고른 보기, 맞았는지 틀렸는지)
  var container = document.getElementById('learnModalQuizDetailContainer');
  if (container) {
    var quizzes = log.quizResults || [];
    var correctCount = quizzes.filter(function(q) { return q.isCorrect; }).length;
    var totalCount = quizzes.length;
    var rate = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 100;

    var summaryEl = document.getElementById('learnModalQuizSummary');
    if (summaryEl) {
      summaryEl.innerHTML = `총 ${totalCount}문항 중 <strong class="${rate === 100 ? 'text-success' : 'text-danger'}">${correctCount}문항</strong> 정답 (정답률 ${rate}%)`;
    }

    container.innerHTML = quizzes.map(function(q) {
      var statusBadge = q.isCorrect
        ? `<span class="badge-soft badge-soft-success font-weight-bold" style="font-size: 11.5px; padding: 3px 9px;">
             <i class="fa-solid fa-circle-check mr-1 text-success"></i>정답 (+20점) [O]
           </span>`
        : `<span class="badge-soft badge-soft-danger font-weight-bold" style="font-size: 11.5px; padding: 3px 9px; background: #fee2e2; color: #991b1b; border: 1px solid #fecaca;">
             <i class="fa-solid fa-circle-xmark mr-1 text-danger"></i>오답 (0점) [X]
           </span>`;

      var choiceBox = q.isCorrect
        ? `<!-- 정답 맞춘 경우 -->
           <div class="p-2 px-3 rounded d-flex align-items-center justify-content-between" style="background: #f0fdf4; border: 1.5px solid #bbf7d0; font-size: 12.5px;">
             <div>
               <strong class="text-success mr-2"><i class="fa-solid fa-check mr-1"></i>내가 고른 보기 (내 답안):</strong>
               <span class="font-weight-bold text-dark">${q.userChoiceText}</span>
             </div>
             <span class="badge badge-success px-2 py-1" style="font-size: 11px;">정답 일치</span>
           </div>`
        : `<!-- 오답 틀린 경우: 내가 고른 오답 vs 실제 정답 나란히 표출 -->
           <div class="mb-1 p-2 px-3 rounded d-flex align-items-center justify-content-between" style="background: #fef2f2; border: 1.5px solid #fecaca; font-size: 12.5px;">
             <div>
               <strong class="text-danger mr-2"><i class="fa-solid fa-xmark mr-1"></i>내가 고른 보기 (내 오답):</strong>
               <span class="font-weight-bold" style="color: #b91c1c; text-decoration: line-through;">${q.userChoiceText}</span>
             </div>
             <span class="badge badge-danger px-2 py-1" style="font-size: 11px;">오답 선택</span>
           </div>
           <div class="p-2 px-3 rounded d-flex align-items-center justify-content-between" style="background: #f0fdf4; border: 1.5px solid #bbf7d0; font-size: 12.5px;">
             <div>
               <strong class="text-success mr-2"><i class="fa-solid fa-key mr-1"></i>실제 정답:</strong>
               <span class="font-weight-bold text-dark">${q.correctChoiceText}</span>
             </div>
             <span class="badge badge-success px-2 py-1" style="font-size: 11px;">정답 확인</span>
           </div>`;

      var hintBox = q.hint
        ? `<div class="mt-2 p-2 rounded text-muted" style="background: #fbf9f5; border: 1px dashed var(--border-medium); font-size: 11.5px; line-height: 1.6;">
             <i class="fa-solid fa-lightbulb text-warning mr-1"></i><strong>해설 및 오답 분석:</strong> ${q.hint}
           </div>`
        : '';

      return `
        <div class="p-3 bg-white rounded shadow-sm" style="border: 1px solid ${q.isCorrect ? '#e2e8f0' : '#fecaca'};">
          <div class="d-flex justify-content-between align-items-center mb-2">
            <span class="font-weight-bold text-dark" style="font-size: 13.5px;">
              <span class="badge-soft badge-soft-neutral mr-2">Q${q.qNum}</span>문제 ${q.qNum}번 문항
            </span>
            ${statusBadge}
          </div>

          <div class="mb-3 font-weight-bold" style="font-size: 13px; color: #1e293b; line-height: 1.6; white-space: pre-line;">
            ${q.question}
          </div>

          ${choiceBox}
          ${hintBox}
        </div>
      `;
    }).join('');
  }

  // 3. 나노 시트 학생 서술형 답안 및 지도교사 첨삭 코멘트
  if (document.getElementById('learnModalSheetAnswer')) {
    document.getElementById('learnModalSheetAnswer').innerText = log.sheetAnswer || '학생이 제출한 나노 시트 생각담기 과제 원문입니다.';
  }
  if (document.getElementById('learnModalComment')) {
    document.getElementById('learnModalComment').innerText = log.comment || '지도교사 첨삭이 완료되었습니다.';
  }

  $('#learningDetailModal').modal('show');
}

// ==============================================================
// ==============================================================
// 5. 도서 배정 모듈 (학급별 배정 & 개별 원생 배정 분리 + 장바구니 일괄 배정)
// ==============================================================
var currentAssignSection = 'class'; // 'class' 또는 'student'

// 1) 학급별(클래스) 도서 배정 데이터셋
var classAssignmentList = [
  {
    id: 'ASN-C01',
    className: '지혜반',
    gradeText: '초등 5학년 (12명)',
    teacher: '박선혜 수석교사',
    books: [
      { id: '1001', title: '어린 왕자', pub: '열린책들', cover: 'assets/covers/cover_1001.jpg' },
      { id: '1002', title: '아몬드', pub: '창비', cover: 'assets/covers/cover_1002.jpg' },
      { id: '1004', title: '자전거 도둑', pub: '다림', cover: 'assets/covers/cover_1004.jpg' }
    ],
    assignDate: '2026-09-08',
    dueDate: '2026-09-22',
    completedCount: 9,
    totalStudents: 12,
    progressRate: '75%',
    priorityOn: true
  },
  {
    id: 'ASN-C02',
    className: '슬기반',
    gradeText: '초등 4학년 (10명)',
    teacher: '박선혜 지도교사',
    books: [
      { id: '1003', title: '마당을 나온 암탉', pub: '사계절', cover: 'assets/covers/cover_1003.jpg' },
      { id: '1001', title: '어린 왕자', pub: '열린책들', cover: 'assets/covers/cover_1001.jpg' }
    ],
    assignDate: '2026-09-06',
    dueDate: '2026-09-20',
    completedCount: 8,
    totalStudents: 10,
    progressRate: '80%',
    priorityOn: true
  },
  {
    id: 'ASN-C03',
    className: '마스터반',
    gradeText: '초등 6학년 (14명)',
    teacher: '최승현 지도교사',
    books: [
      { id: '1002', title: '아몬드', pub: '창비', cover: 'assets/covers/cover_1002.jpg' },
      { id: '1004', title: '자전거 도둑', pub: '다림', cover: 'assets/covers/cover_1004.jpg' }
    ],
    assignDate: '2026-09-07',
    dueDate: '2026-09-21',
    completedCount: 12,
    totalStudents: 14,
    progressRate: '85.7%',
    priorityOn: true
  }
];

// 2) 개별 원생 맞춤 도서 배정 데이터셋
var studentAssignmentList = [
  {
    id: 'ASN-S01',
    studentId: 'S1021',
    studentName: '김민준',
    school: '나노초',
    grade: '초등 5학년',
    classGroup: '지혜반',
    books: [
      { id: '1001', title: '어린 왕자', pub: '열린책들', cover: 'assets/covers/cover_1001.jpg' },
      { id: '1002', title: '아몬드', pub: '창비', cover: 'assets/covers/cover_1002.jpg' }
    ],
    assignDate: '2026-09-05',
    dueDate: '2026-09-19',
    completedBooks: 2,
    status: '완독 및 퀴즈 완료',
    priorityOn: true
  },
  {
    id: 'ASN-S02',
    studentId: 'S1022',
    studentName: '이서윤',
    school: '솔빛초',
    grade: '초등 4학년',
    classGroup: '슬기반',
    books: [
      { id: '1003', title: '마당을 나온 암탉', pub: '사계절', cover: 'assets/covers/cover_1003.jpg' },
      { id: '1001', title: '어린 왕자', pub: '열린책들', cover: 'assets/covers/cover_1001.jpg' }
    ],
    assignDate: '2026-09-06',
    dueDate: '2026-09-20',
    completedBooks: 1,
    status: '읽는 중 (1/2권)',
    priorityOn: true
  },
  {
    id: 'ASN-S03',
    studentId: 'S1023',
    studentName: '박도윤',
    school: '나노초',
    grade: '초등 6학년',
    classGroup: '마스터반',
    books: [
      { id: '1002', title: '아몬드', pub: '창비', cover: 'assets/covers/cover_1002.jpg' },
      { id: '1004', title: '자전거 도둑', pub: '다림', cover: 'assets/covers/cover_1004.jpg' },
      { id: '1001', title: '어린 왕자', pub: '열린책들', cover: 'assets/covers/cover_1001.jpg' }
    ],
    assignDate: '2026-09-07',
    dueDate: '2026-09-21',
    completedBooks: 2,
    status: '읽는 중 (2/3권)',
    priorityOn: true
  },
  {
    id: 'ASN-S04',
    studentId: 'S1026',
    studentName: '윤지유',
    school: '솔빛초',
    grade: '초등 5학년',
    classGroup: '지혜반',
    books: [
      { id: '1001', title: '어린 왕자', pub: '열린책들', cover: 'assets/covers/cover_1001.jpg' },
      { id: '1003', title: '마당을 나온 암탉', pub: '사계절', cover: 'assets/covers/cover_1003.jpg' }
    ],
    assignDate: '2026-09-08',
    dueDate: '2026-09-22',
    completedBooks: 1,
    status: '읽는 중 (1/2권)',
    priorityOn: true
  }
];

// 신규 추가된 배정 건 트래킹
var lastAddedClassAssignId = null;
var lastAddedStudentAssignId = null;

// 서브 섹션(학급별 vs 개별) 전환
function switchAssignSubSection(sec) {
  currentAssignSection = sec;
  var secClass = document.getElementById('assign-section-class');
  var secStudent = document.getElementById('assign-section-student');
  var btnClass = document.getElementById('btn-assign-sub-class');
  var btnStudent = document.getElementById('btn-assign-sub-student');

  if (sec === 'class') {
    if (secClass) secClass.style.display = 'block';
    if (secStudent) secStudent.style.display = 'none';
    if (btnClass) btnClass.classList.add('active');
    if (btnStudent) btnStudent.classList.remove('active');
  } else {
    if (secClass) secClass.style.display = 'none';
    if (secStudent) secStudent.style.display = 'block';
    if (btnClass) btnClass.classList.remove('active');
    if (btnStudent) btnStudent.classList.add('active');
  }
}

// 1) 학급별 도서 배정 테이블 렌더링
function renderClassAssignmentTable(list) {
  var tbody = document.getElementById('classAssignmentTableBody');
  if (!tbody) return;
  tbody.innerHTML = '';

  var dataList = list || classAssignmentList;

  var countEl = document.getElementById('assignClassCount');
  if (countEl) countEl.innerText = classAssignmentList.length;
  var badgeEl = document.getElementById('badgeClassAssignNum');
  if (badgeEl) badgeEl.innerText = classAssignmentList.length + '개 반';

  if (dataList.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" class="text-center py-5 text-muted">배정된 학급 현황이 없습니다.</td></tr>';
    return;
  }

  dataList.forEach(function(item, idx) {
    var tr = document.createElement('tr');
    if (item.id === lastAddedClassAssignId) tr.className = 'row-highlight-new';

    // 배정된 다권 도서 배지 렌더링 (커버 우측으로 도서명 및 출판사 표출)
    var booksHtml = item.books.map(function(b) {
      var pubName = b.pub || b.publisher || '출판사';
      return `<div class="d-inline-flex align-items-center p-1 px-2 mr-2 mb-1 rounded border shadow-xs" style="background:#ffffff; font-size:12px; border-color: var(--border-light) !important;">
        <img src="${b.cover}" style="width:24px; height:32px; object-fit:cover; border-radius:4px; margin-right:8px; border: 1px solid #ddd; flex-shrink: 0;">
        <div style="line-height: 1.25;">
          <strong style="color:var(--text-main); font-size: 12.5px; display: block;">${b.title}</strong>
          <small class="text-muted" style="font-size: 11px;">${pubName}</small>
        </div>
      </div>`;
    }).join('');

    tr.innerHTML = `
      <td class="text-center"><small class="text-muted font-weight-bold">${idx + 1}</small></td>
      <td>
        <strong style="font-size: 14px; color: var(--text-main);">${item.className}</strong>
        ${item.id === lastAddedClassAssignId ? '<span class="badge badge-warning text-dark ml-1" style="font-size:10px;">신규</span>' : ''}
        <small class="text-muted d-block">${item.gradeText} &middot; ${item.teacher}</small>
      </td>
      <td>
        <div class="d-flex flex-wrap align-items-center">
          ${booksHtml}
          <span class="badge badge-secondary ml-1" style="font-size:11px;">총 ${item.books.length}권</span>
        </div>
      </td>
      <td class="text-center"><small class="text-muted font-weight-bold">${item.assignDate}</small></td>
      <td class="text-center"><strong class="text-dark font-weight-bold">${item.dueDate}</strong></td>
      <td>
        <div class="d-flex justify-content-between align-items-center mb-1" style="font-size:11px;">
          <span class="text-muted">${item.completedCount}/${item.totalStudents}명 완독</span>
          <strong class="text-success">${item.progressRate}</strong>
        </div>
        <div class="progress" style="height: 6px; border-radius: 4px;">
          <div class="progress-bar bg-success" role="progressbar" style="width: ${item.progressRate}"></div>
        </div>
      </td>
      <td class="text-center">
        <span class="badge-soft badge-soft-success font-weight-bold">
          <i class="fa-solid fa-circle-check mr-1"></i>최우선 노출
        </span>
      </td>
      <td class="text-center">
        <button class="btn btn-xs btn-outline-secondary mr-1" onclick="openBookAssignModal('CLASS', '${item.className}')" style="border-radius:6px; font-size:11.5px; padding:3px 8px;">도서 추가</button>
        <button class="btn btn-xs btn-outline-danger" onclick="cancelClassAssignment('${item.id}')" style="border-radius:6px; font-size:11.5px; padding:3px 8px;">취소</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// 2) 개별 원생 도서 배정 테이블 렌더링
function renderStudentAssignmentTable(list) {
  var tbody = document.getElementById('studentAssignmentTableBody');
  if (!tbody) return;
  tbody.innerHTML = '';

  var dataList = list || studentAssignmentList;

  var countEl = document.getElementById('assignStudentCount');
  if (countEl) countEl.innerText = studentAssignmentList.length;
  var badgeEl = document.getElementById('badgeStudentAssignNum');
  if (badgeEl) badgeEl.innerText = studentAssignmentList.length + '명';

  if (dataList.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" class="text-center py-5 text-muted">배정된 원생이 없습니다.</td></tr>';
    return;
  }

  dataList.forEach(function(item, idx) {
    var tr = document.createElement('tr');
    if (item.id === lastAddedStudentAssignId) tr.className = 'row-highlight-new';

    var booksHtml = item.books.map(function(b) {
      var pubName = b.pub || b.publisher || '출판사';
      return `<div class="d-inline-flex align-items-center p-1 px-2 mr-2 mb-1 rounded border shadow-xs" style="background:#ffffff; font-size:12px; border-color: var(--border-light) !important;">
        <img src="${b.cover}" style="width:24px; height:32px; object-fit:cover; border-radius:4px; margin-right:8px; border: 1px solid #ddd; flex-shrink: 0;">
        <div style="line-height: 1.25;">
          <strong style="color:var(--text-main); font-size: 12.5px; display: block;">${b.title}</strong>
          <small class="text-muted" style="font-size: 11px;">${pubName}</small>
        </div>
      </div>`;
    }).join('');

    var statusBadge = item.status.includes('완료') || item.status.includes('합격')
      ? `<span class="badge-soft badge-soft-success font-weight-bold"><i class="fa-solid fa-circle-check mr-1"></i>${item.status}</span>`
      : `<span class="badge-soft badge-soft-warn font-weight-bold"><i class="fa-solid fa-book-open-reader mr-1"></i>${item.status}</span>`;

    tr.innerHTML = `
      <td class="text-center"><small class="text-muted font-weight-bold">${idx + 1}</small></td>
      <td>
        <strong style="font-size: 14px; color: var(--text-main);">${item.studentName}</strong>
        ${item.id === lastAddedStudentAssignId ? '<span class="badge badge-warning text-dark ml-1" style="font-size:10px;">신규</span>' : ''}
        <small class="text-muted d-block">${item.school} ${item.grade} &middot; <span class="badge-soft badge-soft-neutral">${item.classGroup}</span> &middot; ${item.studentId}</small>
      </td>
      <td>
        <div class="d-flex flex-wrap align-items-center">
          ${booksHtml}
          <span class="badge badge-secondary ml-1" style="font-size:11px;">총 ${item.books.length}권</span>
        </div>
      </td>
      <td class="text-center"><small class="text-muted font-weight-bold">${item.assignDate}</small></td>
      <td class="text-center"><strong class="text-dark font-weight-bold">${item.dueDate}</strong></td>
      <td class="text-center">${statusBadge}</td>
      <td class="text-center">
        <span class="badge-soft badge-soft-success font-weight-bold">
          <i class="fa-solid fa-circle-check mr-1"></i>최우선 노출
        </span>
      </td>
      <td class="text-center">
        <button class="btn btn-xs btn-outline-secondary mr-1" onclick="openBookAssignModal('STUDENT', '${item.studentId}')" style="border-radius:6px; font-size:11.5px; padding:3px 8px;">도서 추가</button>
        <button class="btn btn-xs btn-outline-danger" onclick="cancelStudentAssignment('${item.id}')" style="border-radius:6px; font-size:11.5px; padding:3px 8px;">취소</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// 도서 배정 통합 렌더링 호출
function renderAssignmentTable() {
  renderClassAssignmentTable();
  renderStudentAssignmentTable();
}

// 학급별 필터링
function filterClassAssignments() {
  var val = document.getElementById('filterAssignClassSelect').value;
  var filtered = classAssignmentList.filter(function(item) {
    return (val === 'ALL') || (item.className === val);
  });
  renderClassAssignmentTable(filtered);
}

// 개별 원생 검색 및 필터링
function filterStudentAssignments() {
  var classVal = document.getElementById('filterAssignStudentClass').value;
  var query = (document.getElementById('searchAssignStudentInput').value || '').toLowerCase().trim();

  var filtered = studentAssignmentList.filter(function(item) {
    var matchClass = (classVal === 'ALL') || (item.classGroup === classVal);
    var matchQuery = !query || 
      item.studentName.toLowerCase().indexOf(query) !== -1 || 
      item.studentId.toLowerCase().indexOf(query) !== -1 || 
      item.school.toLowerCase().indexOf(query) !== -1;
    return matchClass && matchQuery;
  });
  renderStudentAssignmentTable(filtered);
}

// 배정 취소 함수들
function cancelClassAssignment(id) {
  var target = classAssignmentList.find(function(a) { return a.id === id; });
  var name = target ? target.className : '해당 학급';
  if (confirm(`[${name}]의 도서 배정을 취소하시겠습니까?`)) {
    classAssignmentList = classAssignmentList.filter(function(a) { return a.id !== id; });
    renderClassAssignmentTable();
    showAcademyToast(`[${name}]의 도서 배정이 취소되었습니다.`);
  }
}

function cancelStudentAssignment(id) {
  var target = studentAssignmentList.find(function(a) { return a.id === id; });
  var name = target ? target.studentName : '해당 원생';
  if (confirm(`[${name}] 원생의 맞춤 도서 배정을 취소하시겠습니까?`)) {
    studentAssignmentList = studentAssignmentList.filter(function(a) { return a.id !== id; });
    renderStudentAssignmentTable();
    showAcademyToast(`[${name}] 원생의 도서 배정이 취소되었습니다.`);
  }
}

// ==============================================================
// 5-2. 도서 배정 장바구니 스튜디오 (Cart-Based Assignment Studio)
// ==============================================================
var assignCart = []; // 장바구니에 담긴 도서 목록
var modalAssignType = 'CLASS'; // 'CLASS' 또는 'STUDENT'
var modalSelectedClasses = ['지혜반'];
var modalSelectedStudents = ['S1021'];
var currentCartCategory = 'ALL';

// 장바구니 모달 열기
function openBookAssignModal(preferType, preferTargetId) {
  modalAssignType = preferType || (currentAssignSection === 'class' ? 'CLASS' : 'STUDENT');

  // 기본 장바구니에 2권 기본 추천 담기 (publisher, pub 둘 다 지원)
  if (assignCart.length === 0) {
    assignCart = [
      { id: '1001', title: '어린 왕자', pub: '열린책들', publisher: '열린책들', author: '앙투안 드 생텍쥐페리', cover: 'assets/covers/cover_1001.jpg', grade: '초4~중1' },
      { id: '1002', title: '아몬드', pub: '창비', publisher: '창비', author: '손원평', cover: 'assets/covers/cover_1002.jpg', grade: '중1~중3' }
    ];
  }

  // 대상 프리셋 지정
  if (preferTargetId) {
    if (modalAssignType === 'CLASS') {
      modalSelectedClasses = [preferTargetId];
    } else {
      modalSelectedStudents = [preferTargetId];
    }
  } else {
    if (modalSelectedClasses.length === 0) modalSelectedClasses = ['지혜반'];
    if (modalSelectedStudents.length === 0) modalSelectedStudents = ['S1021'];
  }

  // 마감일 기본값: 오늘 + 14일
  var d = new Date();
  d.setDate(d.getDate() + 14);
  var dueStr = d.toISOString().split('T')[0];
  if (document.getElementById('cartAssignDueDate')) {
    document.getElementById('cartAssignDueDate').value = dueStr;
  }

  setModalAssignType(modalAssignType);
  renderModalTargetChips();
  renderCartBookCatalog();
  renderAssignCartItems();
  updateAssignSummary();

  if (window.jQuery && typeof $('#bookAssignModal').modal === 'function') {
    $('#bookAssignModal').modal('show');
  } else {
    showModalVanilla('bookAssignModal');
  }
}

// 배정 유형(학급 vs 개별) 토글
function setModalAssignType(type) {
  modalAssignType = type;
  var btnClass = document.getElementById('btnAssignTypeClass');
  var btnStudent = document.getElementById('btnAssignTypeStudent');
  var wrapClass = document.getElementById('modalTargetClassWrap');
  var wrapStudent = document.getElementById('modalTargetStudentWrap');

  if (type === 'CLASS') {
    if (btnClass) btnClass.classList.add('active');
    if (btnStudent) btnStudent.classList.remove('active');
    if (wrapClass) wrapClass.style.display = 'block';
    if (wrapStudent) wrapStudent.style.display = 'none';
  } else {
    if (btnClass) btnClass.classList.remove('active');
    if (btnStudent) btnStudent.classList.add('active');
    if (wrapClass) wrapClass.style.display = 'none';
    if (wrapStudent) wrapStudent.style.display = 'block';
  }

  renderModalTargetChips();
  updateAssignSummary();
}

// 대상 칩(Chip) 렌더링
function renderModalTargetChips() {
  // 1) 학급 칩
  var classContainer = document.getElementById('modalClassChipsContainer');
  if (classContainer) {
    classContainer.innerHTML = '';
    var classes = [
      { name: '지혜반', info: '초5 · 12명', teacher: '박선혜' },
      { name: '슬기반', info: '초4 · 10명', teacher: '박선혜' },
      { name: '마스터반', info: '초6 · 14명', teacher: '최승현' },
      { name: '심화반', info: '중등 · 16명', teacher: '최승현' },
      { name: '새싹반', info: '초1~2 · 8명', teacher: '이지연' },
      { name: '탐구반', info: '초3 · 10명', teacher: '이지연' }
    ];

    classes.forEach(function(c) {
      var isSel = modalSelectedClasses.indexOf(c.name) !== -1;
      var chip = document.createElement('span');
      chip.className = 'target-chip' + (isSel ? ' active' : '');
      chip.innerHTML = `${isSel ? '<i class="fa-solid fa-check mr-1"></i>' : ''}<strong>${c.name}</strong> <small class="ml-1 opacity-75">(${c.info})</small>`;
      chip.onclick = function() { toggleModalClass(c.name); };
      classContainer.appendChild(chip);
    });

    var classSummaryEl = document.getElementById('modalClassSelectedSummary');
    if (classSummaryEl) {
      classSummaryEl.innerText = modalSelectedClasses.length > 0 
        ? `${modalSelectedClasses.join(', ')} (${modalSelectedClasses.length}개 반 선택됨)`
        : '학급을 선택해 주세요.';
    }
  }

  // 2) 원생 칩
  renderModalStudentChips();
}

function renderModalStudentChips(filterQuery) {
  var stdContainer = document.getElementById('modalStudentChipsContainer');
  if (!stdContainer) return;
  stdContainer.innerHTML = '';

  var query = (filterQuery || '').toLowerCase().trim();
  var students = studentDataList.filter(function(s) {
    return !query || s.name.toLowerCase().indexOf(query) !== -1 || s.id.toLowerCase().indexOf(query) !== -1 || (s.classGroup && s.classGroup.toLowerCase().indexOf(query) !== -1);
  });

  if (students.length === 0) {
    stdContainer.innerHTML = '<small class="text-muted d-block py-2">검색된 원생이 없습니다.</small>';
    return;
  }

  students.forEach(function(std) {
    var isSel = modalSelectedStudents.indexOf(std.id) !== -1;
    var chip = document.createElement('span');
    chip.className = 'target-chip' + (isSel ? ' active' : '');
    chip.innerHTML = `${isSel ? '<i class="fa-solid fa-check mr-1 text-light"></i>' : ''}<strong>${std.name}</strong> <small class="ml-1 opacity-75">(${std.classGroup} &middot; ${std.id})</small>`;
    chip.onclick = function() { toggleModalStudent(std.id); };
    stdContainer.appendChild(chip);
  });

  var stdSummaryEl = document.getElementById('modalStudentSelectedSummary');
  if (stdSummaryEl) {
    stdSummaryEl.innerHTML = `<span class="badge badge-primary font-weight-bold px-2 py-1">${modalSelectedStudents.length}명</span> 원생 선택됨`;
  }
}

function toggleModalClass(cName) {
  var idx = modalSelectedClasses.indexOf(cName);
  if (idx === -1) modalSelectedClasses.push(cName);
  else {
    if (modalSelectedClasses.length > 1) modalSelectedClasses.splice(idx, 1);
    else showAcademyToast('최소 1개 이상의 학급을 선택해야 합니다.');
  }
  renderModalTargetChips();
  updateAssignSummary();
}

function toggleModalStudent(stdId) {
  var idx = modalSelectedStudents.indexOf(stdId);
  if (idx === -1) modalSelectedStudents.push(stdId);
  else {
    if (modalSelectedStudents.length > 1) modalSelectedStudents.splice(idx, 1);
    else showAcademyToast('최소 1명 이상의 원생을 선택해야 합니다.');
  }
  renderModalStudentChips();
  updateAssignSummary();
}

function filterModalStudentChips() {
  var q = document.getElementById('modalStudentSearchInput').value;
  renderModalStudentChips(q);
}

function selectAllModalStudents(isSelect) {
  if (isSelect) {
    modalSelectedStudents = studentDataList.map(function(s) { return s.id; });
  } else {
    modalSelectedStudents = studentDataList.length > 0 ? [studentDataList[0].id] : [];
  }
  renderModalStudentChips();
  updateAssignSummary();
}

// --------------------------------------------------------------
// 도서 카탈로그 검색 & 장바구니 담기
// --------------------------------------------------------------
function filterCartCategory(cat) {
  currentCartCategory = cat;
  var btns = ['ALL', '초저', '초중', '초고', '중등'];
  btns.forEach(function(b) {
    var el = document.getElementById('catBtn-' + b);
    if (el) {
      el.className = 'btn btn-xs ' + (b === cat || (cat === 'ALL' && b === 'ALL') ? 'btn-beige-primary active' : 'btn-beige-secondary');
    }
  });
  renderCartBookCatalog();
}

function filterCartBookCatalog() {
  renderCartBookCatalog();
}

function renderCartBookCatalog() {
  var container = document.getElementById('cartBookCatalogContainer');
  if (!container) return;
  container.innerHTML = '';

  var query = (document.getElementById('cartBookSearchInput') ? document.getElementById('cartBookSearchInput').value : '').toLowerCase().trim();

  var books = academyBookList.filter(function(b) {
    var matchQuery = !query || 
      b.title.toLowerCase().indexOf(query) !== -1 || 
      b.author.toLowerCase().indexOf(query) !== -1 || 
      b.publisher.toLowerCase().indexOf(query) !== -1 ||
      (b.category && b.category.toLowerCase().indexOf(query) !== -1);

    var matchCat = true;
    if (currentCartCategory === '초등 저학년') matchCat = b.grade && (b.grade.includes('초1') || b.grade.includes('초2') || b.grade.includes('입문'));
    else if (currentCartCategory === '초등 중학년') matchCat = b.grade && (b.grade.includes('초3') || b.grade.includes('초4') || b.grade.includes('발전'));
    else if (currentCartCategory === '초등 고학년') matchCat = b.grade && (b.grade.includes('초5') || b.grade.includes('초6') || b.grade.includes('심화') || b.grade.includes('완성'));
    else if (currentCartCategory === '중등') matchCat = b.grade && (b.grade.includes('중') || b.grade.includes('기본'));

    return matchQuery && matchCat;
  });

  if (books.length === 0) {
    container.innerHTML = '<div class="text-center py-5 text-muted"><i class="fa-solid fa-magnifying-glass mb-2" style="font-size:24px;"></i><br>검색된 도서가 없습니다.</div>';
    return;
  }

  books.forEach(function(b) {
    var isInCart = assignCart.some(function(item) { return item.id === b.id; });
    var card = document.createElement('div');
    card.className = 'assign-catalog-card' + (isInCart ? ' in-cart' : '');
    var pubName = b.publisher || b.pub || '나노출판';
    var authorName = b.author || '저자 미상';
    var gradeBadge = b.grade ? `<span class="badge-soft badge-soft-neutral ml-2" style="font-size: 11px; flex-shrink: 0;">${b.grade}</span>` : '';
    var catBadge = b.category ? `<span class="badge badge-light border text-muted px-2 py-0.5" style="font-size: 10.5px;">${b.category}</span>` : '';

    card.innerHTML = `
      <!-- 좌측: 도서 커버 썸네일 -->
      <div style="position: relative; flex-shrink: 0; margin-right: 14px;">
        <img src="${b.cover}" alt="${b.title}" style="width: 52px; height: 72px; object-fit: cover; border-radius: 7px; border: 1px solid var(--border-medium); box-shadow: 0 2px 6px rgba(0,0,0,0.08);">
        ${isInCart ? '<span style="position: absolute; top: -5px; right: -5px; width: 18px; height: 18px; border-radius: 50%; background: #2b7a3e; color: #fff; display: flex; align-items: center; justify-content: center; font-size: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.2);"><i class="fa-solid fa-check"></i></span>' : ''}
      </div>

      <!-- 우측: 커버 우측으로 정돈된 info 정보 블록 -->
      <div style="flex: 1; min-width: 0;">
        <div class="d-flex align-items-center justify-content-between mb-1">
          <strong class="text-truncate font-weight-bold" style="font-size: 14.5px; color: var(--text-main); line-height: 1.3;" title="${b.title}">${b.title}</strong>
          ${gradeBadge}
        </div>
        <div class="text-muted text-truncate mb-1.5" style="font-size: 12px; line-height: 1.4;">
          <span style="color: #4a4037; font-weight: 600;">${pubName}</span> &middot; <span>${authorName}</span>
        </div>
        <div class="d-flex align-items-center gap-1 flex-wrap" style="font-size: 11px;">
          ${catBadge}
          <span class="badge badge-light text-success border px-2 py-0.5"><i class="fa-solid fa-check mr-1"></i>북퀴즈 완비</span>
          <span class="badge badge-light text-secondary border px-2 py-0.5"><i class="fa-solid fa-file-lines mr-1"></i>나노 시트</span>
        </div>
      </div>

      <!-- 우측 액션: 담기 버튼 -->
      <div class="ml-3" style="flex-shrink: 0;">
        <button type="button" class="btn btn-sm ${isInCart ? 'btn-success font-weight-bold shadow-xs' : 'btn-beige-primary'}" onclick="toggleBookInCart('${b.id}')" style="border-radius: 8px; font-size: 12px; white-space: nowrap; padding: 6px 14px; min-width: 74px;">
          ${isInCart ? '<i class="fa-solid fa-check mr-1"></i>담김' : '<i class="fa-solid fa-plus mr-1"></i>담기'}
        </button>
      </div>
    `;
    container.appendChild(card);
  });
}

// 장바구니 토글 (담기 / 제거)
function toggleBookInCart(bookId) {
  var idx = assignCart.findIndex(function(item) { return item.id === bookId; });
  if (idx !== -1) {
    assignCart.splice(idx, 1);
  } else {
    var b = academyBookList.find(function(item) { return item.id === bookId; });
    if (b) {
      assignCart.push({
        id: b.id,
        title: b.title,
        publisher: b.publisher || b.pub || '출판사',
        pub: b.publisher || b.pub || '출판사',
        author: b.author || '',
        cover: b.cover,
        grade: b.grade || ''
      });
    }
  }

  renderCartBookCatalog();
  renderAssignCartItems();
  updateAssignSummary();
}

// 장바구니 아이템 목록 렌더링
function renderAssignCartItems() {
  var container = document.getElementById('assignCartItemsContainer');
  var badge = document.getElementById('cartCountBadge');
  if (badge) badge.innerText = assignCart.length + '권';

  if (!container) return;
  container.innerHTML = '';

  if (assignCart.length === 0) {
    container.innerHTML = `
      <div class="text-center py-4 text-muted" style="font-size: 12.5px;">
        <i class="fa-solid fa-basket-shopping text-muted mb-2" style="font-size: 26px;"></i><br>
        바구니가 비어 있습니다.<br>
        좌측에서 배정할 도서를 검색하고 담아보세요!
      </div>
    `;
    return;
  }

  assignCart.forEach(function(b, idx) {
    var item = document.createElement('div');
    item.className = 'cart-book-item';
    var pubName = b.publisher || b.pub || '출판사';
    var authorName = b.author || '';
    var metaText = [pubName, authorName, b.grade].filter(Boolean).join(' · ');

    item.innerHTML = `
      <!-- 좌측: 순번 칩 + 미니 표지 -->
      <div class="d-flex align-items-center mr-2" style="flex-shrink: 0;">
        <span style="width: 20px; height: 20px; border-radius: 50%; background: #4a4037; color: #fff; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 700; margin-right: 8px;">${idx + 1}</span>
        <img src="${b.cover}" alt="${b.title}" style="width: 34px; height: 46px; object-fit: cover; border-radius: 5px; border: 1px solid var(--border-medium); box-shadow: 0 1px 4px rgba(0,0,0,0.08);">
      </div>

      <!-- 우측: 도서 상세 info -->
      <div style="flex: 1; min-width: 0; padding-right: 6px;">
        <div class="font-weight-bold text-truncate" style="font-size: 13px; color: var(--text-main); margin-bottom: 2px;" title="${b.title}">
          ${b.title}
        </div>
        <small class="text-muted d-block text-truncate" style="font-size: 11.5px;">
          ${metaText}
        </small>
      </div>

      <!-- 우측 끝: 제거 버튼 -->
      <button type="button" class="btn btn-xs btn-outline-danger" onclick="toggleBookInCart('${b.id}')" title="장바구니에서 제거" style="border-radius: 50%; width: 24px; height: 24px; padding: 0; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
        <i class="fa-solid fa-xmark" style="font-size: 12px;"></i>
      </button>
    `;
    container.appendChild(item);
  });
}

function clearAssignCart() {
  assignCart = [];
  renderCartBookCatalog();
  renderAssignCartItems();
  updateAssignSummary();
}

function setCartDueDatePreset(days) {
  var d = new Date();
  d.setDate(d.getDate() + days);
  var dueStr = d.toISOString().split('T')[0];
  if (document.getElementById('cartAssignDueDate')) {
    document.getElementById('cartAssignDueDate').value = dueStr;
  }
}

// 하단 요약 문구 & 버튼 활성화 업데이트
function updateAssignSummary() {
  var summaryTextEl = document.getElementById('modalAssignSummaryText');
  var btnTextEl = document.getElementById('btnBatchAssignText');
  var btnExecute = document.getElementById('btnExecuteBatchAssign');

  var targetDesc = '';
  if (modalAssignType === 'CLASS') {
    targetDesc = `[${modalSelectedClasses.join(', ')}] 반`;
  } else {
    var stdNames = modalSelectedStudents.map(function(id) {
      var s = studentDataList.find(function(item) { return item.id === id; });
      return s ? s.name : id;
    });
    targetDesc = `[${stdNames.join(', ')}] 원생`;
  }

  var bookCount = assignCart.length;

  if (summaryTextEl) {
    if (bookCount === 0) {
      summaryTextEl.innerHTML = '<span class="text-danger font-weight-bold">배정할 도서를 최소 1권 이상 장바구니에 담아주세요.</span>';
    } else {
      summaryTextEl.innerHTML = `<strong>${targetDesc}</strong> 에게 총 <strong><span class="text-success">${bookCount}권</span></strong>의 도서를 한 번에 배정합니다.`;
    }
  }

  if (btnTextEl) {
    btnTextEl.innerText = bookCount > 0 ? `총 ${bookCount}권 일괄 배정 완료` : '도서 선택 필요';
  }

  if (btnExecute) {
    btnExecute.disabled = (bookCount === 0);
  }
}

// --------------------------------------------------------------
// 장바구니 일괄 배정 최종 실행 (Save & Dispatch)
// --------------------------------------------------------------
function executeBatchAssignment() {
  if (assignCart.length === 0) {
    alert('배정할 도서를 최소 1권 이상 장바구니에 담아주세요.');
    return;
  }

  var dueDate = document.getElementById('cartAssignDueDate') ? document.getElementById('cartAssignDueDate').value : '2026-09-25';
  var isPriority = document.getElementById('cartOptPriority') ? document.getElementById('cartOptPriority').checked : true;
  var isAligo = document.getElementById('cartOptAligo') ? document.getElementById('cartOptAligo').checked : true;
  var todayStr = new Date().toISOString().split('T')[0];

  var booksToAssign = assignCart.map(function(b) {
    return { id: b.id, title: b.title, pub: b.publisher, cover: b.cover };
  });

  if (modalAssignType === 'CLASS') {
    // 학급별 일괄 배정 생성
    modalSelectedClasses.forEach(function(cName) {
      var newId = 'ASN-C' + String(classAssignmentList.length + 1).padStart(2, '0');
      var cInfo = cName === '지혜반' ? '초등 5학년 (12명)' : cName === '슬기반' ? '초등 4학년 (10명)' : cName === '마스터반' ? '초등 6학년 (14명)' : '초등 정규반 (10명)';
      var teacher = cName.includes('마스터') || cName.includes('심화') ? '최승현 지도교사' : '박선혜 지도교사';

      var newRecord = {
        id: newId,
        className: cName,
        gradeText: cInfo,
        teacher: teacher,
        books: booksToAssign,
        assignDate: todayStr,
        dueDate: dueDate,
        completedCount: 0,
        totalStudents: 12,
        progressRate: '0%',
        priorityOn: isPriority
      };

      classAssignmentList.unshift(newRecord);
      lastAddedClassAssignId = newId;

      // 알림톡 발송
      if (isAligo) {
        academyDispatchLogs.unshift({
          id: 'AL-M' + String(academyDispatchLogs.length + 1).padStart(2, '0'),
          date: todayStr + ' ' + new Date().toTimeString().substr(0, 5),
          type: '도서 배정 알림톡',
          receiver: `${cName} 학부모 전체 (12명)`,
          summary: `[나노 독서아카데미 본원] ${cName} 이번 주 필수 배정 도서 <${booksToAssign[0].title}> 외 ${booksToAssign.length - 1}권이 배정되었습니다.`,
          status: 'SUCCESS'
        });
      }
    });

    renderClassAssignmentTable();
    switchAssignSubSection('class');
    showAcademyToast(`[${modalSelectedClasses.join(', ')}] 반에 총 ${booksToAssign.length}권의 도서가 일괄 배정되었습니다!`);

  } else {
    // 개별 원생 일괄 배정 생성
    modalSelectedStudents.forEach(function(stdId) {
      var std = studentDataList.find(function(s) { return s.id === stdId; });
      var newId = 'ASN-S' + String(studentAssignmentList.length + 1).padStart(2, '0');

      var newRecord = {
        id: newId,
        studentId: stdId,
        studentName: std ? std.name : '원생',
        school: std ? std.school : '나노초',
        grade: std ? std.grade : '초등 5학년',
        classGroup: std ? std.classGroup : '지혜반',
        books: booksToAssign,
        assignDate: todayStr,
        dueDate: dueDate,
        completedBooks: 0,
        status: `읽는 중 (0/${booksToAssign.length}권)`,
        priorityOn: isPriority
      };

      studentAssignmentList.unshift(newRecord);
      lastAddedStudentAssignId = newId;

      // 알림톡 발송
      if (isAligo) {
        var phone = std ? std.phone : '010-0000-0000';
        academyDispatchLogs.unshift({
          id: 'AL-M' + String(academyDispatchLogs.length + 1).padStart(2, '0'),
          date: todayStr + ' ' + new Date().toTimeString().substr(0, 5),
          type: '도서 배정 알림톡',
          receiver: `${std ? std.name : '원생'} 학부모 (${phone})`,
          summary: `[나노 독서아카데미] ${std ? std.name : '원생'} 학생에게 <${booksToAssign[0].title}> 외 ${booksToAssign.length - 1}권 맞춤 도서가 배정되었습니다.`,
          status: 'SUCCESS'
        });
      }
    });

    renderStudentAssignmentTable();
    switchAssignSubSection('student');
    showAcademyToast(`[${modalSelectedStudents.length}명 원생]에게 총 ${booksToAssign.length}권의 도서가 일괄 배정되었습니다!`);
  }

  if (isAligo) renderAcademyDispatchTable();

  // 모달 닫기
  if (window.jQuery && typeof $('#bookAssignModal').modal === 'function') {
    $('#bookAssignModal').modal('hide');
  } else {
    hideModalVanilla('bookAssignModal');
  }
}

// ==============================================================
// 6. 카톡 발송 내역 모듈 (Academy Aligo Dispatch)
// ==============================================================
var academyDispatchLogs = [
  { id: 'AL-M01', date: '2026-09-08 17:30', type: '독서 포트폴리오 리포트', receiver: '김민준 학부모 (010-3847-1928)', summary: '[나노 독서아카데미 본원] 김민준 학생의 8월 독서 포트폴리오 및 북퀴즈 인증 리포트가 발급되었습니다.', status: 'SUCCESS' },
  { id: 'AL-M02', date: '2026-09-08 16:45', type: '도서 배정 알림', receiver: '이서윤 학부모 (010-5829-3019)', summary: '[나노 독서아카데미 본원] 이번 주 필수 배정 도서 <마당을 나온 암탉>이 배정되었습니다.', status: 'SUCCESS' },
  { id: 'AL-M03', date: '2026-09-08 14:10', type: '독서 격려 알림톡', receiver: '강시우 학생 (010-4820-1948)', summary: '[나노의 책장] 시우 학생! 이번 주 북퀴즈 도전까지 1권 남았어요. 즐겁게 완독해 보아요!', status: 'FAILED' }
];

function renderAcademyDispatchTable() {
  var tbody = document.getElementById('academyDispatchTableBody');
  if (!tbody) return;
  tbody.innerHTML = '';

  document.getElementById('academyDispatchCount').innerText = academyDispatchLogs.length;

  academyDispatchLogs.forEach(function(l, idx) {
    var tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="text-center"><small class="text-muted font-weight-bold">${idx + 1}</small></td>
      <td class="text-center"><small class="text-muted">${l.date}</small></td>
      <td class="text-center"><span class="badge-soft badge-soft-neutral">${l.type}</span></td>
      <td><strong>${l.receiver}</strong></td>
      <td style="max-width:280px; text-overflow:ellipsis; white-space:nowrap; overflow:hidden;">
        <small class="text-dark">${l.summary}</small>
      </td>
      <td class="text-center">
        <span class="badge-soft ${l.status === 'SUCCESS' ? 'badge-soft-success' : 'badge-soft-danger'}">
          ${l.status === 'SUCCESS' ? '<i class="fa-solid fa-check mr-1"></i>발송성공' : '<i class="fa-solid fa-xmark mr-1"></i>발송실패'}
        </span>
      </td>
      <td class="text-center">
        <button class="btn btn-xs btn-outline-secondary mr-1" onclick="showAcademyToast('알림톡 발송 전문을 확인합니다.')" style="border-radius:6px; font-size:11.5px; padding:3px 8px;">전문</button>
        ${l.status === 'FAILED' ? `<button class="btn btn-xs btn-outline-danger" onclick="retryAcademyDispatch('${l.id}')" style="border-radius:6px; font-size:11.5px; padding:3px 8px;">재발송</button>` : ''}
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function retryAcademyDispatch(id) {
  var l = academyDispatchLogs.find(item => item.id === id);
  if (l) {
    l.status = 'SUCCESS';
    renderAcademyDispatchTable();
    showAcademyToast('학부모 알림톡이 성공적으로 재전송되었습니다.');
  }
}

// ==============================================================
// 7. 원내 랭킹 조회 모듈 (Internal Student Ranking)
// ==============================================================
var academyRankingList = [
  { rank: 1, name: '박도윤', grade: '초등 6학년 (마스터반)', books: 31, quizRate: '97.0%', points: 3410, badge: '골드 독서왕 🥇' },
  { rank: 2, name: '김민준', grade: '초등 5학년 (지혜반)', books: 24, quizRate: '94.2%', points: 2850, badge: '실버 리더 🥈' },
  { rank: 3, name: '윤지유', grade: '초등 5학년 (지혜반)', books: 22, quizRate: '95.8%', points: 2640, badge: '브론즈 리더 🥉' },
  { rank: 4, name: '이서윤', grade: '초등 4학년 (슬기반)', books: 18, quizRate: '91.5%', points: 2190, badge: '열정 독서가' },
  { rank: 5, name: '정하은', grade: '중등 1학년 (심화반)', books: 15, quizRate: '88.4%', points: 1980, badge: '탐구 독서가' },
  { rank: 6, name: '강시우', grade: '초등 2학년 (새싹반)', books: 12, quizRate: '92.0%', points: 1650, badge: '새싹 독서가' }
];

function renderAcademyRankingTable() {
  var tbody = document.getElementById('academyRankingTableBody');
  if (!tbody) return;
  tbody.innerHTML = '';

  academyRankingList.forEach(function(r) {
    var tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="text-center font-weight-bold" style="font-size:15px;">
        ${r.rank === 1 ? '🥇 1' : r.rank === 2 ? '🥈 2' : r.rank === 3 ? '🥉 3' : r.rank}
      </td>
      <td><strong style="color: var(--text-main); font-size:14px;">${r.name}</strong></td>
      <td class="text-center">${r.grade}</td>
      <td class="text-center font-weight-bold">${r.books}권</td>
      <td class="text-center text-success font-weight-bold">${r.quizRate}</td>
      <td class="text-right font-weight-bold text-warning" style="font-size:14.5px; padding-right:24px;">${r.points.toLocaleString()} P</td>
      <td class="text-center"><span class="badge-soft badge-soft-warn font-weight-bold">${r.badge}</span></td>
    `;
    tbody.appendChild(tr);
  });
}

// ==============================================================
// 8. 독서 포트폴리오 모듈 (목록 리스트 + 상세 리포트 + 4단계 생성 마법사)
// ==============================================================
var portfolioDataMap = {
  'S1021': {
    name: '김민준',
    school: '나노초등학교 5학년',
    classGroup: '지혜반',
    teacher: '박선혜 지도교사',
    level: '초등 심화 Lv 5',
    bookCount: 24,
    bookSub: '학년 평균(18권) 대비 +6권 달성',
    quizAvg: 94.2,
    quizSub: '전체 완독 도서 1차 합격률 우수',
    sheetRate: 100,
    scores: [95, 90, 92, 94],
    books: [
      { cover: 'assets/covers/cover_1001.jpg', title: '어린 왕자', pub: '열린책들', date: '2026.09.07', score: '100점', sheet: '제출 완료', comment: '사막여우와 장미의 의미를 문해력 높게 해석하고 생각담기 논술 과제를 훌륭히 완수함.' },
      { cover: 'assets/covers/cover_1002.jpg', title: '아몬드', pub: '창비', date: '2026.09.02', score: '90점', sheet: '제출 완료', comment: '타인의 고통과 감정에 대한 공감 능력을 자신의 경험에 빗대어 설득력 있게 표현함.' },
      { cover: 'assets/covers/cover_1004.jpg', title: '자전거 도둑', pub: '다림', date: '2026.08.28', score: '92점', sheet: '제출 완료', comment: '물질주의와 양심 사이의 갈등을 비판적 시각으로 깊이 있게 고찰함.' },
      { cover: 'assets/covers/cover_1003.jpg', title: '마당을 나온 암탉', pub: '사계절', date: '2026.08.19', score: '96점', sheet: '제출 완료', comment: '모성애와 자유, 삶의 가치에 대한 감상을 주체적인 시선으로 서술함.' }
    ],
    comment: '김민준 학생은 논리적 사고력과 문학적 감수성이 매우 뛰어난 원생입니다. 3분기 독서 과제를 성실하게 완수하였으며, 특히 등장인물의 내면 심리를 분석하는 독후 활동에서 우수한 성취도를 나타내었습니다.'
  },
  'S1022': {
    name: '이서윤',
    school: '솔빛초등학교 4학년',
    classGroup: '슬기반',
    teacher: '박선혜 지도교사',
    level: '초등 발전 Lv 4',
    bookCount: 18,
    bookSub: '독서 흥미 및 어휘력 꾸준히 상승 중',
    quizAvg: 91.5,
    quizSub: '핵심 어휘 퀴즈 통과 우수',
    sheetRate: 100,
    scores: [90, 92, 90, 94],
    books: [
      { cover: 'assets/covers/cover_1003.jpg', title: '마당을 나온 암탉', pub: '사계절', date: '2026.09.05', score: '95점', sheet: '제출 완료', comment: '잎싹의 도전과 용기를 자신의 생활 태도와 비교하여 성실하게 작성함.' },
      { cover: 'assets/covers/cover_1001.jpg', title: '어린 왕자', pub: '열린책들', date: '2026.08.30', score: '92점', sheet: '제출 완료', comment: '등장인물들의 특징을 생생하게 요약하고 느낌을 풍부하게 표현함.' },
      { cover: 'assets/covers/cover_1004.jpg', title: '자전거 도둑', pub: '다림', date: '2026.08.21', score: '88점', sheet: '제출 완료', comment: '주인공 수남이의 갈등 상황에 깊이 몰입하여 독후감을 완성함.' }
    ],
    comment: '이서윤 학생은 독서에 대한 호기심이 많고 책 속 교훈을 자신의 생각으로 표현하는 능력이 돋보입니다. 앞으로도 다양한 문학 갈래를 접하며 어휘력을 한층 넓혀갈 수 있도록 지도하겠습니다.'
  },
  'S1023': {
    name: '박도윤',
    school: '나노초등학교 6학년',
    classGroup: '마스터반',
    teacher: '최승현 지도교사',
    level: '초등 완성 Lv 6',
    bookCount: 31,
    bookSub: '원내 최다 완독 달성 (골드 독서왕)',
    quizAvg: 97.0,
    quizSub: '심화 퀴즈 전 문항 1차 통과',
    sheetRate: 100,
    scores: [98, 96, 98, 96],
    books: [
      { cover: 'assets/covers/cover_1002.jpg', title: '아몬드', pub: '창비', date: '2026.09.06', score: '98점', sheet: '제출 완료', comment: '감정 표현 불능증과 인간관계에 대한 고찰을 날카로운 시각으로 논술함.' },
      { cover: 'assets/covers/cover_1004.jpg', title: '자전거 도둑', pub: '다림', date: '2026.08.29', score: '96점', sheet: '제출 완료', comment: '사회적 모순과 인간 내면의 양심 문제를 수준 높은 문장력으로 분석함.' },
      { cover: 'assets/covers/cover_1001.jpg', title: '어린 왕자', pub: '열린책들', date: '2026.08.15', score: '97점', sheet: '제출 완료', comment: '철학적 은유와 상징을 심도 있게 해석하고 창의적 논술을 제시함.' }
    ],
    comment: '박도윤 학생은 독해력과 논리적 서술 능력이 중학생 수준 이상으로 뛰어난 원생입니다. 글의 맥락과 행간의 의미를 정확히 짚어내며, 토론 및 서술형 과제에서 최우수 성과를 보여주고 있습니다.'
  },
  'S1026': {
    name: '윤지유',
    school: '솔빛초등학교 5학년',
    classGroup: '지혜반',
    teacher: '박선혜 지도교사',
    level: '초등 심화 Lv 5',
    bookCount: 22,
    bookSub: '월 4권 독서 플랜 100% 달성 중',
    quizAvg: 95.8,
    quizSub: '추론 및 비판 영역 평가 탁월',
    sheetRate: 100,
    scores: [96, 94, 96, 97],
    books: [
      { cover: 'assets/covers/cover_1001.jpg', title: '어린 왕자', pub: '열린책들', date: '2026.09.06', score: '98점', sheet: '제출 완료', comment: '진정한 소통과 책임의 가치에 대해 깊은 문학적 감수성을 담아냄.' },
      { cover: 'assets/covers/cover_1002.jpg', title: '아몬드', pub: '창비', date: '2026.08.27', score: '94점', sheet: '제출 완료', comment: '타인을 공감하는 마음의 소중함을 진솔하고 설득력 있게 풀어냄.' },
      { cover: 'assets/covers/cover_1003.jpg', title: '마당을 나온 암탉', pub: '사계절', date: '2026.08.18', score: '96점', sheet: '제출 완료', comment: '잎싹의 모성과 자유를 향한 의지를 탄탄한 문단 구조로 전개함.' }
    ],
    comment: '윤지유 학생은 책에 담긴 감정과 철학적 의미를 섬세하게 포착하는 능력이 뛰어납니다. 과제 제출이 항상 성실하며 발표 태도 또한 모범적입니다.'
  }
};

// 발급된 포트폴리오 리스트 데이터셋
var portfolioList = [
  {
    id: 'PF-2026-0901',
    studentId: 'S1021',
    studentName: '김민준',
    school: '나노초',
    grade: '초등 5학년',
    classGroup: '지혜반',
    title: '2026년 3분기 독서역량 포트폴리오',
    period: '2026년 3분기 (7~9월)',
    bookCount: 3,
    booksSummary: '어린 왕자, 아몬드 외 1권',
    quizAvg: '94.2점',
    issueDate: '2026.09.08',
    status: '발급완료',
    kakaoSent: true
  },
  {
    id: 'PF-2026-0902',
    studentId: 'S1023',
    studentName: '박도윤',
    school: '나노초',
    grade: '초등 6학년',
    classGroup: '마스터반',
    title: '2026년 3분기 독서 심화 인증 리포트',
    period: '2026년 3분기 (7~9월)',
    bookCount: 3,
    booksSummary: '아몬드, 자전거 도둑 외 1권',
    quizAvg: '97.0점',
    issueDate: '2026.09.08',
    status: '발급완료',
    kakaoSent: true
  },
  {
    id: 'PF-2026-0815',
    studentId: 'S1026',
    studentName: '윤지유',
    school: '솔빛초',
    grade: '초등 5학년',
    classGroup: '지혜반',
    title: '2026년 8월호 정기 상담 리포트',
    period: '2026년 8월 정기호',
    bookCount: 3,
    booksSummary: '어린 왕자, 아몬드, 마당을 나온 암탉',
    quizAvg: '95.8점',
    issueDate: '2026.08.31',
    status: '학부모열람',
    kakaoSent: true
  },
  {
    id: 'PF-2026-0810',
    studentId: 'S1022',
    studentName: '이서윤',
    school: '솔빛초',
    grade: '초등 4학년',
    classGroup: '슬기반',
    title: '2026년 8월호 정기 독서 진단 리포트',
    period: '2026년 8월 정기호',
    bookCount: 2,
    booksSummary: '마당을 나온 암탉, 어린 왕자',
    quizAvg: '91.5점',
    issueDate: '2026.08.28',
    status: '학부모열람',
    kakaoSent: true
  }
];

var lastCreatedPortfolioId = null;

// 포트폴리오 목록 테이블 렌더링
function renderPortfolioTable(list) {
  var tbody = document.getElementById('portfolioListTableBody');
  if (!tbody) return;
  tbody.innerHTML = '';

  var dataList = list || portfolioList;

  // 상단 요약 카운트 갱신
  var totalCountEl = document.getElementById('pfTotalIssuedCount');
  if (totalCountEl) totalCountEl.innerText = portfolioList.length;

  if (dataList.length === 0) {
    tbody.innerHTML = '<tr><td colspan="10" class="text-center py-5 text-muted">일치하는 독서 포트폴리오 리포트가 없습니다.</td></tr>';
    return;
  }

  dataList.forEach(function(pf) {
    var tr = document.createElement('tr');
    if (pf.id === lastCreatedPortfolioId) {
      tr.className = 'row-highlight-new';
    }

    var statusBadge = pf.status === '학부모열람' 
      ? '<span class="badge-soft badge-soft-success"><i class="fa-solid fa-eye mr-1"></i>학부모 열람</span>'
      : '<span class="badge-soft badge-soft-warn"><i class="fa-solid fa-check mr-1"></i>발급 완료</span>';

    tr.innerHTML = 
      '<td class="text-center"><span class="font-weight-bold" style="font-size:12.5px; color:var(--text-main);">' + pf.id + '</span></td>' +
      '<td>' +
        '<strong style="font-size:13.5px; color:var(--text-main); cursor:pointer;" onclick="viewPortfolioDetail(\'' + pf.studentId + '\', \'' + pf.id + '\')">' + pf.studentName + '</strong>' +
        (pf.id === lastCreatedPortfolioId ? ' <span class="badge badge-warning text-dark ml-1" style="font-size:10px;">신규</span>' : '') +
      '</td>' +
      '<td class="text-center"><small class="text-muted">' + pf.school + ' ' + pf.grade + '</small></td>' +
      '<td class="text-center"><span class="badge-soft badge-soft-neutral">' + pf.classGroup + '</span></td>' +
      '<td>' +
        '<div class="font-weight-bold" style="font-size:13px;">' + pf.title + '</div>' +
        '<small class="text-muted">' + (pf.period || '') + '</small>' +
      '</td>' +
      '<td>' +
        '<span class="font-weight-bold text-dark">' + pf.bookCount + '권</span> ' +
        '<small class="text-muted">(' + pf.booksSummary + ')</small>' +
      '</td>' +
      '<td class="text-center text-success font-weight-bold">' + pf.quizAvg + '</td>' +
      '<td class="text-center text-muted" style="font-size:12.5px;">' + pf.issueDate + '</td>' +
      '<td class="text-center">' + statusBadge + '</td>' +
      '<td class="text-center">' +
        '<button class="btn btn-xs btn-beige-primary mr-1" onclick="viewPortfolioDetail(\'' + pf.studentId + '\', \'' + pf.id + '\')" style="border-radius:6px; font-size:11.5px; padding:3px 9px;">상세 보기</button>' +
        '<button class="btn btn-xs btn-outline-secondary" onclick="printSinglePortfolio(\'' + pf.studentId + '\')" style="border-radius:6px; font-size:11.5px; padding:3px 8px;" title="리포트 인쇄"><i class="fa-solid fa-print"></i></button>' +
      '</td>';

    tbody.appendChild(tr);
  });
}

// 포트폴리오 목록 검색 및 필터링
function filterPortfolioList() {
  var classVal = document.getElementById('filterPortfolioClass') ? document.getElementById('filterPortfolioClass').value : 'ALL';
  var query = (document.getElementById('searchPortfolioInput') ? document.getElementById('searchPortfolioInput').value : '').toLowerCase().trim();

  var filtered = portfolioList.filter(function(pf) {
    var matchClass = (classVal === 'ALL') || (pf.classGroup.indexOf(classVal) !== -1);
    var matchQuery = !query || 
      pf.studentName.toLowerCase().indexOf(query) !== -1 || 
      pf.id.toLowerCase().indexOf(query) !== -1 || 
      pf.title.toLowerCase().indexOf(query) !== -1 ||
      pf.studentId.toLowerCase().indexOf(query) !== -1;
    return matchClass && matchQuery;
  });

  renderPortfolioTable(filtered);
}

// 포트폴리오 화면 전환: 목록 보기
function showPortfolioList() {
  var listEl = document.getElementById('portfolio-sub-list');
  var detailEl = document.getElementById('portfolio-sub-detail');
  if (listEl) listEl.style.display = 'block';
  if (detailEl) detailEl.style.display = 'none';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// 포트폴리오 화면 전환: 상세 리포트 보기
function viewPortfolioDetail(studentId, pfId) {
  var listEl = document.getElementById('portfolio-sub-list');
  var detailEl = document.getElementById('portfolio-sub-detail');
  if (listEl) listEl.style.display = 'none';
  if (detailEl) detailEl.style.display = 'block';

  var sel = document.getElementById('selectPortfolioStudent');
  if (sel) {
    sel.value = studentId;
  }
  onPortfolioStudentChange(studentId);

  var pf = portfolioList.find(function(p) { return p.id === pfId; });
  if (pf) {
    var titleEl = document.getElementById('pfDetailHeaderTitle');
    if (titleEl) {
      titleEl.innerHTML = '<i class="fa-solid fa-chart-pie mr-2"></i>' + pf.studentName + ' 원생 독서 포트폴리오 상세 리포트 <span class="badge badge-warning text-dark ml-2" style="font-size:12px; font-weight:normal;">' + pf.title + '</span>';
    }
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function initPortfolioOptions() {
  var sel = document.getElementById('selectPortfolioStudent');
  if (!sel) return;
  sel.innerHTML = '';
  studentDataList.forEach(function(std) {
    var opt = document.createElement('option');
    opt.value = std.id;
    opt.innerText = std.name + ' (' + std.id + ' · ' + std.classGroup + ' · ' + std.grade + ')';
    sel.appendChild(opt);
  });
}

function onPortfolioStudentChange(stdId) {
  var pf = portfolioDataMap[stdId];
  if (!pf) {
    var std = studentDataList.find(s => s.id === stdId);
    pf = {
      name: std ? std.name : '원생',
      school: std ? std.school + ' ' + std.grade : '초등학교',
      classGroup: std ? std.classGroup : '지혜반',
      teacher: std ? std.teacher : '박선혜 지도교사',
      level: std ? std.level : 'Lv 4',
      bookCount: std ? std.bookCount : 0,
      bookSub: '독서 이력 등록 중',
      quizAvg: std ? std.quizAvg : 0,
      quizSub: '퀴즈 응시 대기 중',
      sheetRate: 100,
      scores: [85, 85, 85, 85],
      books: [
        { cover: 'assets/covers/cover_1001.jpg', title: '어린 왕자', pub: '열린책들', date: '2026.09.07', score: '90점', sheet: '제출 완료', comment: '독서 과제를 성실하게 완수함.' }
      ],
      comment: (std ? std.name : '원생') + ' 학생은 성실하게 독서 학습을 진행하고 있으며, 앞으로 다양한 장르의 책을 완독할 수 있도록 지도하겠습니다.'
    };
    portfolioDataMap[stdId] = pf;
  }

  if (document.getElementById('pfTeacherName')) document.getElementById('pfTeacherName').innerText = '담당 강사: ' + (pf.teacher || '박선혜 지도교사');
  if (document.getElementById('pfLevelBadge')) document.getElementById('pfLevelBadge').innerText = '인증 레벨: ' + (pf.level || '초등 심화 Lv 5');

  if (document.getElementById('pfBookCount')) document.getElementById('pfBookCount').innerText = pf.bookCount;
  if (document.getElementById('pfBookSubText')) document.getElementById('pfBookSubText').innerText = pf.bookSub;
  if (document.getElementById('pfQuizAvg')) document.getElementById('pfQuizAvg').innerText = pf.quizAvg;
  if (document.getElementById('pfQuizSubText')) document.getElementById('pfQuizSubText').innerText = pf.quizSub;
  if (document.getElementById('pfSheetRate')) document.getElementById('pfSheetRate').innerText = pf.sheetRate;

  var tbody = document.getElementById('pfBookHistoryBody');
  if (tbody) {
    tbody.innerHTML = '';
    if (document.getElementById('pfBookListCount')) document.getElementById('pfBookListCount').innerText = '표시 중인 도서 ' + pf.books.length + '권';

    pf.books.forEach(function(b) {
      var tr = document.createElement('tr');
      tr.innerHTML = 
        '<td class="text-center">' +
          '<div class="book-thumb-wrap" onclick="openCoverModal(\'' + b.cover + '\', \'' + b.title + '\', \'' + b.pub + '\')">' +
            '<img src="' + b.cover + '" style="width: 44px; height: 60px; border-radius: 6px; object-fit: cover;">' +
          '</div>' +
        '</td>' +
        '<td>' +
          '<div class="font-weight-bold">' + b.title + '</div>' +
          '<small class="text-muted">' + b.pub + '</small>' +
        '</td>' +
        '<td class="text-center text-muted" style="font-size: 12.5px;">' + b.date + '</td>' +
        '<td class="text-center"><span class="badge-soft badge-soft-success">' + b.score + '</span></td>' +
        '<td class="text-center"><span class="badge-soft badge-soft-neutral">' + b.sheet + '</span></td>' +
        '<td style="font-size: 13px; line-height: 1.6;">' + b.comment + '</td>';
      tbody.appendChild(tr);
    });
  }

  if (document.getElementById('pfTeacherComment')) document.getElementById('pfTeacherComment').value = pf.comment;
}

function viewStudentPortfolio(stdId) {
  switchTab('portfolio');
  viewPortfolioDetail(stdId, 'PF-2026-0901');
}

function savePortfolioComment() {
  var sel = document.getElementById('selectPortfolioStudent');
  var stdId = sel ? sel.value : 'S1021';
  var comment = document.getElementById('pfTeacherComment').value;
  if (portfolioDataMap[stdId]) {
    portfolioDataMap[stdId].comment = comment;
  }
  showAcademyToast('[' + (portfolioDataMap[stdId] ? portfolioDataMap[stdId].name : '해당 원생') + '] 학생의 독서 지도 총평이 저장되었습니다.');
}

function openPortfolioReportModal() {
  var sel = document.getElementById('selectPortfolioStudent');
  var stdId = sel ? sel.value : 'S1021';
  var pf = portfolioDataMap[stdId] || portfolioDataMap['S1021'];

  document.getElementById('rep_std_name').innerText = pf.name;
  document.getElementById('rep_std_info').innerText = '학번: ' + stdId + ' · ' + pf.school + ' · 소속: ' + pf.classGroup;

  var scores = pf.scores || [95, 90, 92, 94];
  document.getElementById('rep_score_1').innerText = scores[0] + '점 (우수)';
  document.getElementById('rep_bar_1').style.width = scores[0] + '%';
  document.getElementById('rep_score_2').innerText = scores[1] + '점 (우수)';
  document.getElementById('rep_bar_2').style.width = scores[1] + '%';
  document.getElementById('rep_score_3').innerText = scores[2] + '점 (우수)';
  document.getElementById('rep_bar_3').style.width = scores[2] + '%';
  document.getElementById('rep_score_4').innerText = scores[3] + '점 (우수)';
  document.getElementById('rep_bar_4').style.width = scores[3] + '%';

  var repCards = document.getElementById('rep_book_cards');
  repCards.innerHTML = '';
  pf.books.forEach(function(b) {
    var col = document.createElement('div');
    col.className = 'col-md-4 mb-2';
    col.innerHTML = 
      '<div class="p-2 d-flex align-items-center" style="background:#ffffff; border:1px solid var(--border-light); border-radius:10px;">' +
        '<img src="' + b.cover + '" style="width:36px; height:50px; border-radius:4px; object-fit:cover; margin-right:10px;">' +
        '<div style="overflow:hidden;">' +
          '<div class="font-weight-bold text-truncate" style="font-size:12.5px;">' + b.title + '</div>' +
          '<small class="text-success font-weight-bold" style="font-size:11px;"><i class="fa-solid fa-check mr-1"></i>완독 & 인증 합격</small>' +
        '</div>' +
      '</div>';
    repCards.appendChild(col);
  });

  document.getElementById('rep_comment_text').innerText = document.getElementById('pfTeacherComment').value || pf.comment;

  if (window.jQuery && typeof $('#portfolioReportModal').modal === 'function') {
    $('#portfolioReportModal').modal('show');
  } else {
    showModalVanilla('portfolioReportModal');
  }
}

// --------------------------------------------------------------
// 포트폴리오 생성 4단계 마법사 (Wizard Logic)
// --------------------------------------------------------------
var currentWizardStep = 1;
var wizardSelectedStudentId = 'S1021';
var wizardSelectedBooks = [];

function openPortfolioCreateWizard() {
  currentWizardStep = 1;
  wizardSelectedStudentId = 'S1021';
  wizardSelectedBooks = [];

  // 학생 선택 드롭다운 채우기
  var sel = document.getElementById('wizStudentSelect');
  if (sel) {
    sel.innerHTML = '';
    studentDataList.forEach(function(std) {
      var opt = document.createElement('option');
      opt.value = std.id;
      opt.innerText = std.name + ' (' + std.id + ' · ' + std.school + ' · ' + std.classGroup + ' ' + std.grade + ')';
      sel.appendChild(opt);
    });
    sel.value = wizardSelectedStudentId;
  }

  onWizardStudentSelect(wizardSelectedStudentId);
  goToWizardStep(1);

  if (window.jQuery && typeof $('#portfolioCreateWizardModal').modal === 'function') {
    $('#portfolioCreateWizardModal').modal('show');
  } else {
    showModalVanilla('portfolioCreateWizardModal');
  }
}

function closePortfolioWizard() {
  if (window.jQuery && typeof $('#portfolioCreateWizardModal').modal === 'function') {
    $('#portfolioCreateWizardModal').modal('hide');
  } else {
    hideModalVanilla('portfolioCreateWizardModal');
  }
}

function goToWizardStep(step) {
  currentWizardStep = step;

  // 1. 단계 인디케이터 상태 업데이트
  for (var i = 1; i <= 4; i++) {
    var ind = document.getElementById('wizStepIndicator-' + i);
    var circle = document.getElementById('wizStepCircle-' + i);

    if (ind) {
      ind.classList.remove('active', 'completed');
      if (i === step) ind.classList.add('active');
      else if (i < step) ind.classList.add('completed');
    }

    if (circle) {
      if (i < step) {
        circle.innerHTML = '<i class="fa-solid fa-check"></i>';
      } else if (i === 4 && step === 4) {
        circle.innerHTML = '<i class="fa-solid fa-check"></i>';
      } else {
        circle.innerText = i;
      }
    }
  }

  // 커넥터 라인 업데이트
  for (var c = 1; c <= 3; c++) {
    var conn = document.getElementById('wizConnector-' + c);
    if (conn) {
      if (step > c) {
        conn.classList.add('active');
      } else {
        conn.classList.remove('active');
      }
    }
  }

  // 2. 스텝 패널 표시 토글
  for (var p = 1; p <= 4; p++) {
    var panel = document.getElementById('wizPanel-' + p);
    if (panel) {
      panel.style.display = (p === step) ? 'block' : 'none';
    }
  }

  // 3. 네비게이션 버튼 제어
  var btnPrev = document.getElementById('wizBtnPrev');
  var btnCancel = document.getElementById('wizBtnCancel');
  var btnNext = document.getElementById('wizBtnNext');
  var nextGroup = document.getElementById('wizNextBtnGroup');
  var doneGroup = document.getElementById('wizDoneBtnGroup');

  if (step === 1) {
    if (btnPrev) btnPrev.style.display = 'none';
    if (btnCancel) btnCancel.style.display = 'inline-block';
    if (nextGroup) nextGroup.style.display = 'block';
    if (doneGroup) doneGroup.style.display = 'none';
    if (btnNext) btnNext.innerHTML = '다음: 포함 도서 선택 <i class="fa-solid fa-arrow-right ml-1"></i>';
  } else if (step === 2) {
    if (btnPrev) btnPrev.style.display = 'inline-block';
    if (btnCancel) btnCancel.style.display = 'none';
    if (nextGroup) nextGroup.style.display = 'block';
    if (doneGroup) doneGroup.style.display = 'none';
    if (btnNext) btnNext.innerHTML = '다음: 옵션 설정 <i class="fa-solid fa-arrow-right ml-1"></i>';
  } else if (step === 3) {
    if (btnPrev) btnPrev.style.display = 'inline-block';
    if (btnCancel) btnCancel.style.display = 'none';
    if (nextGroup) nextGroup.style.display = 'block';
    if (doneGroup) doneGroup.style.display = 'none';
    if (btnNext) btnNext.innerHTML = '<i class="fa-solid fa-wand-magic-sparkles mr-1"></i>포트폴리오 생성 완료!';
  } else if (step === 4) {
    if (btnPrev) btnPrev.style.display = 'none';
    if (btnCancel) btnCancel.style.display = 'none';
    if (nextGroup) nextGroup.style.display = 'none';
    if (doneGroup) doneGroup.style.display = 'block';
  }
}

// 1단계 원생 선택 시 프로필 카드 갱신
function onWizardStudentSelect(stdId) {
  wizardSelectedStudentId = stdId;
  var std = studentDataList.find(function(s) { return s.id === stdId; });
  if (!std) return;

  var nameEl = document.getElementById('wizProfileName');
  var metaEl = document.getElementById('wizProfileMeta');
  var levelEl = document.getElementById('wizProfileLevel');
  var bookCountEl = document.getElementById('wizProfileBookCount');
  var quizAvgEl = document.getElementById('wizProfileQuizAvg');
  var teacherEl = document.getElementById('wizProfileTeacher');
  var initEl = document.getElementById('wizProfileInitial');

  if (nameEl) nameEl.innerText = std.name + ' 원생';
  if (metaEl) metaEl.innerText = std.school + ' ' + std.grade + ' · ' + std.classGroup + ' · 학번 ' + std.id;
  if (levelEl) levelEl.innerText = std.level;
  if (bookCountEl) bookCountEl.innerText = std.bookCount + '권';
  if (quizAvgEl) quizAvgEl.innerText = (std.quizAvg || '0.0') + '점';
  if (teacherEl) teacherEl.innerText = std.teacher || '박선혜 지도교사';
  if (initEl) initEl.innerText = std.name ? std.name.charAt(0) : '원';

  var titleInput = document.getElementById('wizReportTitle');
  if (titleInput) {
    titleInput.value = '2026년 3분기 독서역량 포트폴리오 (' + std.name + ')';
  }

  var commentInput = document.getElementById('wizReportComment');
  if (commentInput) {
    commentInput.value = std.name + ' 학생은 논리적 사고력과 문학적 감수성이 매우 뛰어난 원생입니다. 3분기 독서 과제를 성실하게 완수하였으며, 특히 등장인물의 내면 심리를 분석하는 독후 활동에서 우수한 성취도를 나타내었습니다.';
  }
}

function onWizardNext() {
  if (currentWizardStep === 1) {
    renderWizardBookList(wizardSelectedStudentId);
    goToWizardStep(2);
  } else if (currentWizardStep === 2) {
    if (wizardSelectedBooks.length === 0) {
      alert('포트폴리오에 수록할 완독 도서를 최소 1권 이상 선택해 주세요.');
      return;
    }
    goToWizardStep(3);
  } else if (currentWizardStep === 3) {
    finishPortfolioCreate();
  }
}

function onWizardPrev() {
  if (currentWizardStep > 1) {
    goToWizardStep(currentWizardStep - 1);
  }
}

// 2단계 도서 체크박스 리스트 동적 렌더링
function renderWizardBookList(stdId) {
  var container = document.getElementById('wizBookCheckList');
  if (!container) return;
  container.innerHTML = '';

  var pf = portfolioDataMap[stdId];
  var books = pf && pf.books && pf.books.length > 0 ? pf.books : [
    { cover: 'assets/covers/cover_1001.jpg', title: '어린 왕자', pub: '열린책들', date: '2026.09.07', score: '100점', sheet: '제출 완료', comment: '사막여우와 장미의 의미를 문해력 높게 해석하고 논술 과제를 훌륭히 완수함.' },
    { cover: 'assets/covers/cover_1002.jpg', title: '아몬드', pub: '창비', date: '2026.09.02', score: '90점', sheet: '제출 완료', comment: '타인의 고통과 감정에 대한 공감 능력을 자신의 경험에 빗대어 설득력 있게 표현함.' },
    { cover: 'assets/covers/cover_1004.jpg', title: '자전거 도둑', pub: '다림', date: '2026.08.28', score: '92점', sheet: '제출 완료', comment: '물질주의와 양심 사이의 갈등을 비판적 시각으로 깊이 있게 고찰함.' }
  ];

  wizardSelectedBooks = [];

  books.forEach(function(b, idx) {
    wizardSelectedBooks.push(b.title);
    var item = document.createElement('div');
    item.className = 'wiz-book-item selected';
    item.id = 'wizBookItem_' + idx;
    item.innerHTML = 
      '<div class="custom-control custom-checkbox mr-3" onclick="event.stopPropagation();">' +
        '<input type="checkbox" class="custom-control-input wiz-book-chk" id="wizBookChk_' + idx + '" checked onchange="toggleWizardBook(' + idx + ', \'' + b.title.replace(/'/g, "\\'") + '\', this.checked)">' +
        '<label class="custom-control-label" for="wizBookChk_' + idx + '"></label>' +
      '</div>' +
      '<img src="' + b.cover + '" style="width: 36px; height: 50px; border-radius: 4px; object-fit: cover; margin-right: 12px;">' +
      '<div style="flex: 1;">' +
        '<div class="font-weight-bold" style="font-size: 13.5px; color: var(--text-main);">' + b.title + '</div>' +
        '<small class="text-muted">' + b.pub + ' &middot; 완독일: ' + b.date + '</small>' +
      '</div>' +
      '<div class="text-right">' +
        '<span class="badge-soft badge-soft-success font-weight-bold mr-1">' + b.score + '</span>' +
        '<span class="badge-soft badge-soft-neutral font-weight-bold">' + b.sheet + '</span>' +
      '</div>';

    item.onclick = function() {
      var chk = document.getElementById('wizBookChk_' + idx);
      if (chk) {
        chk.checked = !chk.checked;
        toggleWizardBook(idx, b.title, chk.checked);
      }
    };

    container.appendChild(item);
  });

  updateWizardBookCountBadge();
}

function toggleWizardBook(idx, title, isChecked) {
  var item = document.getElementById('wizBookItem_' + idx);
  if (isChecked) {
    if (item) item.classList.add('selected');
    if (wizardSelectedBooks.indexOf(title) === -1) wizardSelectedBooks.push(title);
  } else {
    if (item) item.classList.remove('selected');
    wizardSelectedBooks = wizardSelectedBooks.filter(function(t) { return t !== title; });
  }
  updateWizardBookCountBadge();
}

function onWizardSelectAllBooks(checked) {
  var checkboxes = document.querySelectorAll('.wiz-book-chk');
  wizardSelectedBooks = [];
  checkboxes.forEach(function(chk, idx) {
    chk.checked = checked;
    var item = document.getElementById('wizBookItem_' + idx);
    if (item) {
      if (checked) item.classList.add('selected');
      else item.classList.remove('selected');
    }
  });

  if (checked) {
    var pf = portfolioDataMap[wizardSelectedStudentId];
    var books = pf && pf.books ? pf.books : [{title:'어린 왕자'}, {title:'아몬드'}, {title:'자전거 도둑'}];
    wizardSelectedBooks = books.map(function(b) { return b.title; });
  }

  updateWizardBookCountBadge();
}

function updateWizardBookCountBadge() {
  var badge = document.getElementById('wizSelectedBookBadge');
  if (badge) {
    badge.innerText = '총 ' + wizardSelectedBooks.length + '권 선택됨';
  }
  var allChk = document.getElementById('wizSelectAllBooks');
  var allCheckboxes = document.querySelectorAll('.wiz-book-chk');
  if (allChk && allCheckboxes.length > 0) {
    allChk.checked = wizardSelectedBooks.length === allCheckboxes.length;
  }
}

// 3단계 원장 총평 템플릿
function applyWizardTemplate(type) {
  var commentInput = document.getElementById('wizReportComment');
  if (!commentInput) return;
  var std = studentDataList.find(function(s) { return s.id === wizardSelectedStudentId; });
  var name = std ? std.name : '해당 원생';

  if (type === 'excellent') {
    commentInput.value = name + ' 학생은 논리적 사고력과 문학적 감수성이 매우 뛰어난 우수 원생입니다. 독서 과제를 성실하게 완수하였으며, 특히 비판적 시각과 나노 시트 논술 표현에서 탁월한 성취를 나타내었습니다.';
    showAcademyToast('[우수 역량형] 지도 총평 템플릿이 적용되었습니다.');
  } else if (type === 'growth') {
    commentInput.value = name + ' 학생은 독서에 대한 흥미와 집중력이 지속적으로 향상되고 있으며, 꾸준한 독후 활동을 통해 생각의 깊이와 어휘력이 크게 발전하고 있습니다.';
    showAcademyToast('[성실 발전형] 지도 총평 템플릿이 적용되었습니다.');
  } else if (type === 'literacy') {
    commentInput.value = name + ' 학생은 다양한 장르의 텍스트를 맥락 속에서 정확히 이해하는 문해력이 눈에 띄게 성장하고 있습니다. 질문을 던지고 토론하는 태도가 매우 우수합니다.';
    showAcademyToast('[문해력 집중형] 지도 총평 템플릿이 적용되었습니다.');
  }
}

// 4단계 포트폴리오 생성 완료 및 데이터 반영
function finishPortfolioCreate() {
  var std = studentDataList.find(function(s) { return s.id === wizardSelectedStudentId; });
  var title = (document.getElementById('wizReportTitle') ? document.getElementById('wizReportTitle').value : '').trim() || '2026년 3분기 독서역량 포트폴리오';
  var period = document.getElementById('wizReportPeriod') ? document.getElementById('wizReportPeriod').value : '2026년 3분기 (7~9월)';
  var comment = (document.getElementById('wizReportComment') ? document.getElementById('wizReportComment').value : '').trim();
  var isKakao = document.getElementById('wizOptKakao') ? document.getElementById('wizOptKakao').checked : true;

  // 새 포트폴리오 번호 채번
  var maxPfNum = 902;
  portfolioList.forEach(function(p) {
    var parts = p.id.split('-');
    if (parts.length === 3) {
      var num = parseInt(parts[2], 10);
      if (!isNaN(num) && num > maxPfNum) maxPfNum = num;
    }
  });
  var newPfId = 'PF-2026-0' + (maxPfNum + 1);
  lastCreatedPortfolioId = newPfId;

  var bookCount = wizardSelectedBooks.length;
  var booksSummary = wizardSelectedBooks.length > 1 
    ? wizardSelectedBooks[0] + ' 외 ' + (wizardSelectedBooks.length - 1) + '권'
    : (wizardSelectedBooks[0] || '완독 도서');

  var newPf = {
    id: newPfId,
    studentId: wizardSelectedStudentId,
    studentName: std ? std.name : '원생',
    school: std ? std.school : '나노초',
    grade: std ? std.grade : '초등 5학년',
    classGroup: std ? std.classGroup : '지혜반',
    title: title,
    period: period,
    bookCount: bookCount,
    booksSummary: booksSummary,
    quizAvg: (std ? std.quizAvg : 95.0) + '점',
    issueDate: new Date().toISOString().split('T')[0].replace(/-/g, '.'),
    status: '발급완료',
    kakaoSent: isKakao
  };

  portfolioList.unshift(newPf);

  // 대상 학생의 지도 총평 업데이트
  if (portfolioDataMap[wizardSelectedStudentId]) {
    portfolioDataMap[wizardSelectedStudentId].comment = comment;
  }

  // 카카오 알림톡 발송 로그 추가
  if (isKakao) {
    var phone = std ? std.phone : '010-0000-0000';
    academyDispatchLogs.unshift({
      id: 'AL-M' + String(academyDispatchLogs.length + 1).padStart(2, '0'),
      date: new Date().toISOString().split('T')[0] + ' ' + new Date().toTimeString().substr(0, 5),
      type: '독서 포트폴리오 리포트',
      receiver: (std ? std.name : '원생') + ' 학부모 (' + phone + ')',
      summary: '[나노 독서아카데미 본원] ' + (std ? std.name : '원생') + ' 학생의 ' + title + '가 발급되었습니다. 모바일 열람 링크: bit.ly/' + newPfId,
      status: 'SUCCESS'
    });
    renderAcademyDispatchTable();
  }

  // Step 4 완료 화면 내용 바인딩
  document.getElementById('wizDonePfId').innerText = newPfId;
  document.getElementById('wizDoneStudentName').innerText = (std ? std.name : '원생') + ' (' + (std ? std.grade : '') + ' · ' + (std ? std.classGroup : '') + ')';
  document.getElementById('wizDoneReportTitle').innerText = title;
  document.getElementById('wizDoneBookCount').innerText = '총 ' + bookCount + '권 (' + booksSummary + ')';
  document.getElementById('wizDoneKakaoStatus').innerHTML = isKakao 
    ? '<i class="fa-solid fa-paper-plane mr-1 text-primary"></i>학부모 카카오 알림톡 즉시 발송 완료'
    : '<span class="text-muted">알림톡 미발송 (학원 보관용)</span>';

  renderPortfolioTable(portfolioList);
  goToWizardStep(4);
  showAcademyToast('독서 포트폴리오 [' + newPfId + ']가 성공적으로 발급되었습니다!');
}

function closeWizardAndShowList() {
  closePortfolioWizard();
  showPortfolioList();
}

function closeWizardAndViewDetail() {
  closePortfolioWizard();
  viewPortfolioDetail(wizardSelectedStudentId, lastCreatedPortfolioId);
}

function printSinglePortfolio(stdId) {
  viewPortfolioDetail(stdId, lastCreatedPortfolioId);
  openPortfolioReportModal();
}

// ==============================================================
// 9. 공통 모달 및 토스트
// ==============================================================
function showModalVanilla(id) {
  var modal = document.getElementById(id);
  if (!modal) return;
  modal.style.display = 'block';
  modal.classList.add('show');
  document.body.classList.add('modal-open');
  
  if (!document.getElementById('vanilla-backdrop')) {
    var backdrop = document.createElement('div');
    backdrop.id = 'vanilla-backdrop';
    backdrop.className = 'modal-backdrop fade show';
    backdrop.onclick = function() { hideModalVanilla(id); };
    document.body.appendChild(backdrop);
  }
}

function hideModalVanilla(id) {
  var modal = document.getElementById(id);
  if (!modal) return;
  modal.style.display = 'none';
  modal.classList.remove('show');
  document.body.classList.remove('modal-open');
  var backdrop = document.getElementById('vanilla-backdrop');
  if (backdrop) backdrop.remove();
}

function showAcademyToast(msg) {
  var toast = document.getElementById('academyToast');
  var text = document.getElementById('academyToastText');
  if (!toast || !text) {
    alert(msg);
    return;
  }
  text.innerText = msg;
  toast.style.display = 'block';
  setTimeout(function() {
    toast.style.display = 'none';
  }, 3000);
}

// 도서 표지 확대 모달
function openCoverModal(imgSrc, title, info) {
  document.getElementById('zoomCoverImg').src = imgSrc;
  document.getElementById('zoomBookTitle').innerText = title;
  document.getElementById('zoomBookInfo').innerHTML = info;

  if (window.jQuery && typeof $('#coverZoomModal').modal === 'function') {
    $('#coverZoomModal').modal('show');
  } else {
    showModalVanilla('coverZoomModal');
  }
}

// 나노 시트 정답 모달
function openScrollAnswer(no, name, content) {
  document.getElementById('sc_book_no').innerText = 'Book No: ' + no;
  document.getElementById('sc_book_name').innerText = name;
  document.getElementById('sc_content').innerText = content;
  
  if (window.jQuery && typeof $('#scrollAnswerModal').modal === 'function') {
    $('#scrollAnswerModal').modal('show');
  } else {
    showModalVanilla('scrollAnswerModal');
  }
}

function copyScrollText() {
  var text = document.getElementById('sc_content').innerText;
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text).then(function() {
      showAcademyToast('나노 시트 정답이 클립보드에 복사되었습니다.');
    });
  } else {
    showAcademyToast('나노 시트 정답이 복사되었습니다.');
  }
}

// ==============================================================
// 콘텐츠 관리 (도서 목록 + 콘텐츠 학습자료 PDF 업로드) 로직
// ==============================================================
var academyBookList = [
  {
    id: '1001',
    title: '어린 왕자',
    subtitle: '세계 명작 · 교과 연계 필독서',
    author: '앙투안 드 생텍쥐페리',
    publisher: '열린책들',
    category: '세계문학 / 우정',
    grade: '초4 ~ 중1',
    creatorType: 'HQ',
    academyName: '본사 직속(HQ)',
    cover: 'assets/covers/cover_1001.jpg',
    materialName: '어린왕자_나노시트.pdf',
    materialSize: '1.45 MB',
    materialType: '나노 시트 (PDF)',
    quizStatus: '5문항 완비',
    readCount: '42회',
    answerGuide: '【나노 시트 핵심 정답 및 교사용 지도 가이드】\n\nQ1. 사막여우가 알려준 소중한 비밀은?\n▶ 정답: 마음으로 보아야만 분명하게 볼 수 있어. 가장 중요한 것은 눈에 보이지 않거든.'
  },
  {
    id: '1002',
    title: '아몬드',
    subtitle: '창비 청소년 문학상 수상작',
    author: '손원평',
    publisher: '창비',
    category: '공감 / 청소년 성장',
    grade: '중1 ~ 중3',
    creatorType: 'HQ',
    academyName: '본사 직속(HQ)',
    cover: 'assets/covers/cover_1002.jpg',
    materialName: '아몬드_독서토론활동지.pdf',
    materialSize: '1.82 MB',
    materialType: '독서 토론 활동지 (PDF)',
    quizStatus: '5문항 완비',
    readCount: '35회',
    answerGuide: '【나노 시트 핵심 정답】\n▶ 정답: 알렉시티미아(감정표현불능증)'
  },
  {
    id: '1003',
    title: '자전거 도둑',
    subtitle: '한국 단편문학 필독선',
    author: '박완서',
    publisher: '다림',
    category: '한국문학 / 성장',
    grade: '초5 ~ 초6',
    creatorType: 'ACADEMY',
    academyName: '나노 독서아카데미 본원',
    cover: 'assets/covers/cover_1004.jpg',
    materialName: '자전거도둑_나노시트.pdf',
    materialSize: '1.20 MB',
    materialType: '나노 시트 (PDF)',
    quizStatus: '5문항 완비',
    readCount: '28회',
    answerGuide: '【나노 시트 핵심 정답】\n▶ 정답: 수남이의 내적 갈등과 양심의 가치'
  },
  {
    id: '1004',
    title: '마당을 나온 암탉',
    subtitle: '사계절 아동문학 대표작',
    author: '황선미',
    publisher: '사계절',
    category: '사회 / 인성',
    grade: '초3 ~ 초4',
    creatorType: 'HQ',
    academyName: '본사 직속(HQ)',
    cover: 'assets/covers/cover_1003.jpg',
    materialName: '마당을나온암탉_수업지도안.pdf',
    materialSize: '2.15 MB',
    materialType: '교사용 수업 지도안 (PDF)',
    quizStatus: '5문항 완비',
    readCount: '31회',
    answerGuide: '【나노 시트 핵심 정답】\n▶ 정답: 잎싹의 모성애와 자유를 향한 의지'
  }
];

var currentUploadedMaterial = null;
var currentUploadedCover = null;
var lastAddedBookId = null;

// 도서 필터링 (등록처, 학년, 검색어 종합 필터)
function filterAcademyBooks() {
  var originVal = document.getElementById('filterAcadBookOrigin') ? document.getElementById('filterAcadBookOrigin').value : 'ALL';
  var gradeVal = document.getElementById('filterAcadBookGrade') ? document.getElementById('filterAcadBookGrade').value : 'ALL';
  var query = (document.getElementById('searchAcadBookInput') ? document.getElementById('searchAcadBookInput').value : '').toLowerCase().trim();

  var filtered = academyBookList.filter(function(b) {
    // 1. 등록처 매칭
    var matchOrigin = true;
    if (originVal === 'HQ') {
      matchOrigin = b.creatorType === 'HQ' || (b.academyName && b.academyName.includes('본사'));
    } else if (originVal === 'ACADEMY') {
      matchOrigin = b.creatorType === 'ACADEMY' || (b.academyName && !b.academyName.includes('본사'));
    }

    // 2. 학년 매칭
    var matchGrade = true;
    if (gradeVal !== 'ALL') {
      matchGrade = b.grade && (b.grade.includes(gradeVal) || gradeVal.includes(b.grade));
    }

    // 3. 검색어 매칭
    var matchQuery = !query ||
      b.title.toLowerCase().indexOf(query) !== -1 ||
      b.author.toLowerCase().indexOf(query) !== -1 ||
      b.publisher.toLowerCase().indexOf(query) !== -1 ||
      (b.academyName && b.academyName.toLowerCase().indexOf(query) !== -1);

    return matchOrigin && matchGrade && matchQuery;
  });

  renderAcademyBookTable(filtered);
}

// 도서 테이블 렌더링 (마스터 페이지와 동일한 등록처 뱃지 탑재)
function renderAcademyBookTable(data) {
  var list = data || academyBookList;
  var tbody = document.getElementById('academyBookTableBody');
  if (!tbody) return;
  tbody.innerHTML = '';

  var totalCountEl = document.getElementById('totalAcadBookCount');
  if (totalCountEl) totalCountEl.innerText = list.length;

  if (list.length === 0) {
    tbody.innerHTML = '<tr><td colspan="11" class="text-center py-5 text-muted">일치하는 도서가 없습니다.</td></tr>';
    return;
  }

  list.forEach(function(b) {
    var tr = document.createElement('tr');
    if (b.id === lastAddedBookId) {
      tr.className = 'row-highlight-new';
    }

    var coverImg = b.cover || 'assets/covers/cover_1001.jpg';
    var pdfBtn = b.materialName
      ? `<button type="button" class="btn btn-xs btn-outline-danger mb-1 px-2" style="border-radius: 6px; font-weight:600;" onclick="openContentPdfModal('${b.id}')">
           <i class="fa-solid fa-file-pdf mr-1"></i>PDF 자료
         </button>`
      : `<button type="button" class="btn btn-xs btn-outline-secondary mb-1 px-2" style="border-radius: 6px;" onclick="openContentPdfModal('${b.id}')">
           <i class="fa-solid fa-upload mr-1"></i>자료 등록
         </button>`;

    var answerBtn = `<button type="button" class="btn btn-xs mb-1 px-2 font-weight-bold ml-1" style="background: #4a4037; color:#fff; border-radius: 6px;" onclick="openScrollAnswer('${b.id}', '${b.title.replace(/'/g, "\\'")}', \`${b.answerGuide || '핵심 정답 준비 중'}\`)">
      <i class="fa-solid fa-file-lines mr-1"></i>나노 시트 정답
    </button>`;

    // 마스터 페이지와 완벽히 통일된 등록처 뱃지 로직
    var isHq = !b.creatorType || b.creatorType === 'HQ' || (b.academyName && b.academyName.includes('본사'));
    var originBadge = isHq
      ? `<span class="badge-soft badge-soft-warning" style="font-weight: 700; white-space: nowrap;"><i class="fa-solid fa-crown mr-1"></i>본사 직속(HQ)</span>`
      : `<span class="badge-soft badge-soft-primary" style="font-weight: 700; white-space: nowrap;" title="${b.academyName}"><i class="fa-solid fa-school mr-1"></i>${b.academyName || '나노 독서아카데미 본원'}</span>`;

    tr.innerHTML = 
      `<td class="text-center">
        <div class="book-thumb-wrap" onclick="openCoverModal('${coverImg}', '${b.title.replace(/'/g, "\\'")}', '${b.publisher} · ${b.author}')">
          <img src="${coverImg}" class="book-thumb" alt="${b.title}">
          <div class="book-thumb-overlay"><i class="fa-solid fa-magnifying-glass-plus"></i></div>
        </div>
      </td>
      <td class="text-center font-weight-bold text-muted">${b.id}</td>
      <td>
        <div style="font-weight: 700; font-size: 15px; color: var(--text-main);">${b.title}</div>
        <small class="text-muted">${b.subtitle || '나노 추천 교과 연계 도서'}</small>
      </td>
      <td class="text-center">
        ${originBadge}
      </td>
      <td class="text-center">
        <div style="font-weight: 600;">${b.author}</div>
        <small class="text-muted">${b.publisher}</small>
      </td>
      <td class="text-center"><span class="badge-soft badge-soft-neutral">${b.category}</span></td>
      <td class="text-center"><span class="badge-soft badge-soft-neutral">${b.grade}</span></td>
      <td class="text-center">
        ${pdfBtn}
        ${answerBtn}
      </td>
      <td class="text-center">
        <span class="badge-soft badge-soft-success"><i class="fa-solid fa-check mr-1"></i>${b.quizStatus || '5문항 완비'}</span>
      </td>
      <td class="text-center font-weight-bold">${b.readCount || '0회'}</td>
      <td class="text-center">
        <button type="button" class="btn btn-xs btn-outline-secondary mr-1" onclick="openAcademyBookEditModal('${b.id}')" style="border-radius: 6px; font-size: 11.5px; padding: 4px 8px;">
          <i class="fa-solid fa-pen-to-square mr-1"></i>편집
        </button>
        <button type="button" class="btn btn-xs btn-outline-danger" onclick="deleteAcademyBook('${b.id}')" style="border-radius: 6px; font-size: 11.5px; padding: 4px 7px;">
          <i class="fa-solid fa-trash-can"></i>
        </button>
      </td>`;

    tbody.appendChild(tr);
  });
}

// 학습자료 파일 선택 시 처리
function handleAcademySheetFileUpload(input) {
  if (!input.files || !input.files[0]) return;
  var file = input.files[0];
  var sizeStr = (file.size / (1024 * 1024)).toFixed(2) + ' MB';
  if (file.size < 1024 * 1024) {
    sizeStr = Math.round(file.size / 1024) + ' KB';
  }

  currentUploadedMaterial = {
    name: file.name,
    size: sizeStr,
    type: document.getElementById('reg_material_type') ? document.getElementById('reg_material_type').value : '나노 시트 (PDF)'
  };

  document.getElementById('material_upload_empty').style.display = 'none';
  document.getElementById('material_upload_filled').style.display = 'block';
  document.getElementById('uploaded_pdf_name').innerText = currentUploadedMaterial.name;
  document.getElementById('uploaded_pdf_meta').innerText = `${currentUploadedMaterial.size} · ${currentUploadedMaterial.type} · 정상 첨부됨`;

  showAcademyToast(`[${file.name}] 자료가 성공적으로 첨부되었습니다.`);
}

// 표준 샘플 PDF 첨부 버튼
function attachSampleContentPdf() {
  var bookName = (document.getElementById('reg_book_name') ? document.getElementById('reg_book_name').value : '').trim() || '신규도서';
  var cleanName = bookName.split('(')[0].trim().replace(/\s+/g, '');
  var sampleFileName = `${cleanName}_나노시트_학습용.pdf`;

  currentUploadedMaterial = {
    name: sampleFileName,
    size: '1.45 MB',
    type: document.getElementById('reg_material_type') ? document.getElementById('reg_material_type').value : '나노 시트 (PDF)'
  };

  document.getElementById('material_upload_empty').style.display = 'none';
  document.getElementById('material_upload_filled').style.display = 'block';
  document.getElementById('uploaded_pdf_name').innerText = currentUploadedMaterial.name;
  document.getElementById('uploaded_pdf_meta').innerText = `${currentUploadedMaterial.size} · ${currentUploadedMaterial.type} · 정상 첨부됨`;

  showAcademyToast('표준 나노 시트 (PDF)가 첨부되었습니다.');
}

// 첨부된 자료 삭제
function removeUploadedMaterial() {
  currentUploadedMaterial = null;
  var fileInput = document.getElementById('reg_sheet_file');
  if (fileInput) fileInput.value = '';
  document.getElementById('material_upload_empty').style.display = 'block';
  document.getElementById('material_upload_filled').style.display = 'none';
  showAcademyToast('첨부된 콘텐츠 자료가 삭제되었습니다.');
}

// 도서 표지 이미지 업로드 처리
function handleAcademyCoverUpload(input) {
  if (!input.files || !input.files[0]) return;
  var file = input.files[0];
  var reader = new FileReader();
  reader.onload = function(e) {
    currentUploadedCover = e.target.result;
    var previewBox = document.getElementById('cover_preview_box');
    if (previewBox) {
      previewBox.innerHTML = `<img src="${currentUploadedCover}" style="width:100%; height:100%; object-fit:cover; border-radius:6px;">`;
    }
    showAcademyToast('도서 표지 이미지가 업로드되었습니다.');
  };
  reader.readAsDataURL(file);
}

// PDF 학습자료 미리보기 모달 열기
function openContentPdfModal(bookId) {
  var b = academyBookList.find(item => item.id === bookId);
  var title = b ? b.title : '나노 도서';
  var fileName = b && b.materialName ? b.materialName : `${title}_나노시트.pdf`;
  var fileSize = b && b.materialSize ? b.materialSize : '1.45 MB';

  document.getElementById('pdfModalTitle').innerText = `[${title}] 나노 시트 (PDF)`;
  document.getElementById('pdfFileNameDisplay').innerText = fileName;
  document.getElementById('pdfFileSizeDisplay').innerText = `(${fileSize} · 표준 규격)`;
  document.getElementById('pdfSheetBookTitle').innerText = title;

  if (window.jQuery && typeof $('#contentPdfPreviewModal').modal === 'function') {
    $('#contentPdfPreviewModal').modal('show');
  } else {
    showModalVanilla('contentPdfPreviewModal');
  }
}

// 등록 폼 작성 중 현재 첨부된 PDF 바로 확인
function previewCurrentUploadedPdf() {
  var bookName = (document.getElementById('reg_book_name') ? document.getElementById('reg_book_name').value : '').trim() || '도서 미리보기';
  var fileName = currentUploadedMaterial ? currentUploadedMaterial.name : `${bookName}_학습시트.pdf`;
  var fileSize = currentUploadedMaterial ? currentUploadedMaterial.size : '1.45 MB';

  document.getElementById('pdfModalTitle').innerText = `[${bookName}] 콘텐츠 학습시트 (PDF 미리보기)`;
  document.getElementById('pdfFileNameDisplay').innerText = fileName;
  document.getElementById('pdfFileSizeDisplay').innerText = `(${fileSize} · 첨부 파일 검수)`;
  document.getElementById('pdfSheetBookTitle').innerText = bookName;

  if (window.jQuery && typeof $('#contentPdfPreviewModal').modal === 'function') {
    $('#contentPdfPreviewModal').modal('show');
  } else {
    showModalVanilla('contentPdfPreviewModal');
  }
}

// PDF 다운로드 시뮬레이션
function downloadContentPdf() {
  var fileName = document.getElementById('pdfFileNameDisplay').innerText;
  showAcademyToast(`[${fileName}] 다운로드가 시작되었습니다.`);
}

// 도서 및 콘텐츠 학습자료 최종 저장
function saveAcademyBook() {
  var bookName = (document.getElementById('reg_book_name') ? document.getElementById('reg_book_name').value : '').trim();
  var author = (document.getElementById('reg_author') ? document.getElementById('reg_author').value : '').trim();
  var publisher = (document.getElementById('reg_publisher') ? document.getElementById('reg_publisher').value : '').trim();
  var grade = document.getElementById('reg_grade') ? document.getElementById('reg_grade').value : '초등 5~6학년';
  var category = document.getElementById('reg_category') ? document.getElementById('reg_category').value : '세계문학 / 우정';
  var memo = (document.getElementById('reg_memo') ? document.getElementById('reg_memo').value : '').trim();

  if (!bookName) {
    alert('도서명을 입력해 주세요.');
    document.getElementById('reg_book_name').focus();
    return;
  }
  if (!author) {
    alert('지은이(저자)를 입력해 주세요.');
    document.getElementById('reg_author').focus();
    return;
  }
  if (!publisher) {
    alert('출판사명을 입력해 주세요.');
    document.getElementById('reg_publisher').focus();
    return;
  }

  // 학습자료 파일 기본 처리 (없으면 자동 생성 첨부)
  var matName = currentUploadedMaterial ? currentUploadedMaterial.name : `${bookName.split('(')[0].trim()}_나노시트.pdf`;
  var matSize = currentUploadedMaterial ? currentUploadedMaterial.size : '1.45 MB';
  var matType = currentUploadedMaterial ? currentUploadedMaterial.type : '나노 시트 (PDF)';

  // 새 도서 번호 채번
  var maxId = 1004;
  academyBookList.forEach(function(b) {
    var num = parseInt(b.id, 10);
    if (!isNaN(num) && num > maxId) maxId = num;
  });
  var newId = String(maxId + 1);

  var coverPath = currentUploadedCover || 'assets/covers/cover_1001.jpg';

  var newBook = {
    id: newId,
    title: bookName,
    subtitle: '학원 자체 등록 맞춤 도서',
    author: author,
    publisher: publisher,
    category: category,
    grade: grade,
    cover: coverPath,
    materialName: matName,
    materialSize: matSize,
    materialType: matType,
    quizStatus: '5문항 완비',
    readCount: '0회',
    answerGuide: memo || '【나노 시트 핵심 정답】\n교사용 지도 가이드 및 정답안 등록 완료.'
  };

  academyBookList.unshift(newBook);
  lastAddedBookId = newId;

  // 도서 배정 카탈로그 갱신
  renderCartBookCatalog();
  renderAcademyBookTable();

  // 폼 초기화
  document.getElementById('reg_book_name').value = '';
  document.getElementById('reg_author').value = '';
  document.getElementById('reg_publisher').value = '';
  document.getElementById('reg_memo').value = '';
  document.getElementById('cover_preview_box').innerHTML = '<span class="text-muted" style="font-size: 11px;">표지 없음</span>';
  removeUploadedMaterial();
  currentUploadedCover = null;

  // 목록 탭으로 전환
  switchContentSubTab('list');

  showAcademyToast(`[${newBook.title}] 도서 및 콘텐츠 학습자료(PDF)가 성공적으로 등록되었습니다.`);
}

// ISBN 자동조회
function magicFetchIsbn() {
  var btn = document.getElementById('btn-isbn-fetch');
  btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-1"></i>조회중...';
  btn.disabled = true;

  setTimeout(function() {
    document.getElementById('reg_book_name').value = '어린 왕자 (생텍쥐페리 탄생 120주년 기념판)';
    document.getElementById('reg_author').value = '앙투안 드 생텍쥐페리';
    document.getElementById('reg_publisher').value = '열린책들';
    document.getElementById('cover_preview_box').innerHTML = '<img src="assets/covers/cover_1001.jpg" style="width:100%; height:100%; object-fit:cover; border-radius:6px;">';
    document.getElementById('reg_memo').value = '【나노 시트 핵심 정답】\nQ1. 고향 별: B-612 소행성\nQ2. 마음으로 보아야 분명하게 보인다 (여우의 가르침)\nQ3. 길들임과 책임에 대한 교훈';

    // 콘텐츠 자료(PDF)도 자동 첨부
    attachSampleContentPdf();

    btn.innerHTML = '<i class="fa-solid fa-check mr-1"></i>조회 완료';
    btn.disabled = false;

    showAcademyToast('알라딘에서 서지정보, 표지 및 나노 시트(PDF)를 불러왔습니다.');
  }, 400);
}

// 학생 체험 포털 열기 (새 탭)
function previewStudentPortal() {
  window.open('student_preview.html', '_blank');
  showAcademyToast('학생 포털이 새 탭에서 열렸습니다. 배정 도서 확인 및 북퀴즈를 테스트해보세요!');
}

// ==============================================================
// 10. 마스터 계정과 100% 동일한 학원 도서 및 북퀴즈 등록/편집 모달 로직
// ==============================================================
var editingAcadBookId = null;
var editingAcadQuizzes = [];
var currentAcadQuizIdx = 0;
var editingAcadSheetFile = null;
var curActiveAcadQuizInput = null;

function getInitialAcadQuizList(book) {
  if (book && Array.isArray(book.quizList) && book.quizList.length > 0) {
    return JSON.parse(JSON.stringify(book.quizList));
  }
  // 기존 기본 5문항 또는 샘플 문항 복사
  if (Array.isArray(quizDataList) && quizDataList.length > 0) {
    return JSON.parse(JSON.stringify(quizDataList));
  }
  return [
    {
      question: "『어린 왕자』에서 사막여우가 어린 왕자에게 전해준 가장 소중한 비밀인 ㉠에 들어갈 알맞은 낱말은?\n\n[지문]\n\"오로지 ㉠(으)로 보아야만 분명하게 볼 수 있어. 가장 중요한 것은 눈에 보이지 않거든.\"",
      opt1: "마음",
      opt2: "눈동자",
      opt3: "장미꽃",
      opt4: "여우",
      ans: "1",
      hint: "마음으로 보아야만 분명하게 볼 수 있다는 여우의 교훈"
    },
    {
      question: "어린 왕자가 살던 고향 별의 명칭으로 알맞은 것은 무엇인가요?",
      opt1: "A-101 소행성",
      opt2: "B-612 소행성",
      opt3: "C-303 소행성",
      opt4: "별똥별 404호",
      ans: "2",
      hint: "소행성 B-612"
    },
    {
      question: "여우가 어린 왕자에게 알려준 '길들인다'의 참된 의미로 가장 알맞은 것은?",
      opt1: "상대방을 내 뜻대로 복종시키는 것",
      opt2: "서로에게 특별한 관계를 맺고 끝까지 책임을 지는 것",
      opt3: "매일 정해진 시간에 먹이를 주는 것",
      opt4: "상대방의 약점을 모두 알아내는 것",
      ans: "2",
      hint: "서로에게 세상에서 유일한 존재가 되는 것"
    }
  ];
}

// 모달 열기 (신규 등록 및 기존 수정 겸용)
function openAcademyBookEditModal(id) {
  var isNew = !id;
  var book = isNew ? null : academyBookList.find(function(b) { return b.id === id; });
  editingAcadBookId = isNew ? null : (book ? book.id : null);

  // 1. 도서 코드 채번
  var defaultId = '1005';
  if (isNew) {
    var maxId = 1000;
    academyBookList.forEach(function(b) {
      var num = parseInt(b.id, 10);
      if (!isNaN(num) && num > maxId) maxId = num;
    });
    defaultId = String(maxId + 1);
  } else {
    defaultId = book.id;
  }
  if (document.getElementById('abEditId')) document.getElementById('abEditId').value = defaultId;

  // 2. 모달 타이틀 설정
  var titleEl = document.getElementById('acadBookModalTitle');
  if (titleEl) {
    titleEl.innerHTML = isNew
      ? '<i class="fa-solid fa-plus mr-2 text-warning"></i>학원 신규 도서 및 북퀴즈 등록'
      : `<i class="fa-solid fa-pen-to-square mr-2 text-warning"></i>학원 도서 및 북퀴즈 편집 <span class="badge-soft badge-soft-neutral ml-1" style="font-size: 11px;">${book.id}</span>`;
  }

  // 3. ISBN 바인딩
  var isbnInput = document.getElementById('abEditIsbn');
  if (isbnInput) {
    isbnInput.value = (book && book.isbn) ? book.isbn : (isNew ? '9791190000010' : '');
  }

  // 4. 서지 정보 바인딩
  if (document.getElementById('abEditTitle')) document.getElementById('abEditTitle').value = isNew ? '' : book.title;
  if (document.getElementById('abEditAuthor')) document.getElementById('abEditAuthor').value = isNew ? '' : book.author;
  if (document.getElementById('abEditPublisher')) document.getElementById('abEditPublisher').value = isNew ? '' : book.publisher;
  if (document.getElementById('abEditGrade')) document.getElementById('abEditGrade').value = isNew ? '초등 5~6학년' : (book.grade || '초등 5~6학년');
  if (document.getElementById('abEditCategory')) document.getElementById('abEditCategory').value = isNew ? '세계문학 / 우정' : (book.category || '세계문학 / 우정');

  // 표지 처리
  var coverUrl = isNew
    ? 'assets/covers/cover_1001.jpg'
    : (book.cover || 'assets/covers/cover_1001.jpg');
  if (document.getElementById('abEditCover')) document.getElementById('abEditCover').value = isNew ? '' : (book.cover || '');
  updateAcadCoverPreview(coverUrl);
  switchAcadCoverMode('url');

  // 학습자료 파일 정보 설정
  editingAcadSheetFile = (book && book.materialName) ? {
    name: book.materialName,
    size: book.materialSize || '1.45 MB',
    type: book.materialType || '나노 시트 (PDF)'
  } : {
    name: `${book ? book.title.split('(')[0].trim() : '신규도서'}_나노시트_학습용.pdf`,
    size: '1.45 MB',
    type: '나노 시트 (PDF)'
  };

  var sheetNameEl = document.getElementById('abSheetFileName');
  if (sheetNameEl) sheetNameEl.innerText = editingAcadSheetFile.name;

  if (document.getElementById('abEditSheet')) {
    document.getElementById('abEditSheet').checked = true;
  }

  // 핵심 정답 가이드
  if (document.getElementById('abEditMemo')) {
    document.getElementById('abEditMemo').value = (book && book.answerGuide) ? book.answerGuide : '';
  }

  // 5. 북퀴즈 데이터 초기화
  editingAcadQuizzes = getInitialAcadQuizList(book);
  currentAcadQuizIdx = 0;

  // 도서 기본 정보 탭 활성화
  switchAcadBookEditTab('info');
  renderAcadQuizTabs();
  loadAcadQuizForm();

  // 이전 백드롭 잔여물 정리 및 모달 z-index 최상위 보장 (화면 까매짐 방지)
  $('.modal-backdrop').remove();
  $('body').removeClass('modal-open');
  var modalEl = document.getElementById('academyBookEditModal');
  if (modalEl) {
    modalEl.style.zIndex = '1060';
  }
  $('#academyBookEditModal').modal({ backdrop: true, show: true });
}

// 탭 전환 (도서 정보 vs 북퀴즈)
function switchAcadBookEditTab(tab) {
  var btnInfo = document.getElementById('btnTabAcadBookInfo');
  var btnQuiz = document.getElementById('btnTabAcadQuizInfo');
  var secInfo = document.getElementById('sectionAcadBookInfo');
  var secQuiz = document.getElementById('sectionAcadQuizInfo');

  if (!btnInfo || !btnQuiz || !secInfo || !secQuiz) return;

  if (tab === 'info') {
    saveCurrentAcadQuizInput();
    btnInfo.classList.add('active');
    btnQuiz.classList.remove('active');
    secInfo.style.display = 'block';
    secQuiz.style.display = 'none';
  } else {
    btnInfo.classList.remove('active');
    btnQuiz.classList.add('active');
    secInfo.style.display = 'none';
    secQuiz.style.display = 'block';
    renderAcadQuizTabs();
    loadAcadQuizForm();
  }
}

// 표지 입력 모드 전환
function switchAcadCoverMode(mode) {
  var urlWrap = document.getElementById('acadCoverModeUrlWrap');
  var fileWrap = document.getElementById('acadCoverModeFileWrap');
  var btnUrl = document.getElementById('btnAcadCoverModeUrl');
  var btnFile = document.getElementById('btnAcadCoverModeFile');

  if (!urlWrap || !fileWrap) return;
  if (mode === 'url') {
    urlWrap.style.display = 'block';
    fileWrap.style.display = 'none';
    if (btnUrl) btnUrl.classList.add('active');
    if (btnFile) btnFile.classList.remove('active');
  } else {
    urlWrap.style.display = 'none';
    fileWrap.style.display = 'block';
    if (btnUrl) btnUrl.classList.remove('active');
    if (btnFile) btnFile.classList.add('active');
  }
}

// 표지 실시간 미리보기 갱신
function updateAcadCoverPreview(url) {
  var img = document.getElementById('abEditCoverPreview');
  if (!img) return;
  if (!url || url.trim() === '') {
    img.src = 'assets/covers/cover_1001.jpg';
  } else {
    img.src = url;
  }
}

// 로컬 표지 파일 업로드
function handleAcadCoverFileUpload(event) {
  var file = event.target.files[0];
  if (!file) return;
  var label = document.getElementById('abCoverFileLabel');
  if (label) label.innerText = file.name;

  var reader = new FileReader();
  reader.onload = function(e) {
    var resultUrl = e.target.result;
    if (document.getElementById('abEditCover')) {
      document.getElementById('abEditCover').value = resultUrl;
    }
    updateAcadCoverPreview(resultUrl);
  };
  reader.readAsDataURL(file);
}

// 학습자료 파일 업로드
function handleAcadSheetFileUpload(event) {
  var file = event.target.files[0];
  if (!file) return;
  var label = document.getElementById('abSheetFileLabel');
  if (label) label.innerText = file.name;

  var sizeStr = (file.size / (1024 * 1024)).toFixed(2) + ' MB';
  if (file.size < 1024 * 1024) {
    sizeStr = Math.round(file.size / 1024) + ' KB';
  }

  editingAcadSheetFile = {
    name: file.name,
    size: sizeStr,
    type: '나노 시트 (PDF)'
  };

  var nameEl = document.getElementById('abSheetFileName');
  if (nameEl) nameEl.innerText = file.name;

  showAcademyToast(`[${file.name}] 학습자료 파일이 연결되었습니다.`);
}

// 표준 샘플 PDF 자동 연결
function attachSampleAcadPdf() {
  var title = (document.getElementById('abEditTitle') ? document.getElementById('abEditTitle').value : '').trim() || '신규도서';
  var cleanTitle = title.split('(')[0].trim().replace(/\s+/g, '');
  var fileName = `${cleanTitle}_나노시트_학습용.pdf`;

  editingAcadSheetFile = {
    name: fileName,
    size: '1.45 MB',
    type: '나노 시트 (PDF)'
  };

  var nameEl = document.getElementById('abSheetFileName');
  if (nameEl) nameEl.innerText = fileName;
  showAcademyToast(`표준 나노 시트(${fileName})가 자동 첨부되었습니다.`);
}

// 북퀴즈 문항 탭 렌더링
function renderAcadQuizTabs() {
  var container = document.getElementById('abQuizTabButtons');
  if (!container) return;

  var countBadge = document.getElementById('abEditQuizCount');
  if (countBadge) countBadge.innerText = editingAcadQuizzes.length;

  container.innerHTML = editingAcadQuizzes.map(function(q, idx) {
    return `<button type="button" class="quiz-num-pill ${idx === currentAcadQuizIdx ? 'active' : ''}" onclick="switchAcadQuizItem(${idx})">
      ${idx + 1}번 문항
    </button>`;
  }).join('');

  var btnDel = document.getElementById('btnDeleteAcadQuiz');
  if (btnDel) {
    btnDel.style.display = editingAcadQuizzes.length > 1 ? 'inline-block' : 'none';
  }
}

// 퀴즈 폼 로드
function loadAcadQuizForm() {
  var q = editingAcadQuizzes[currentAcadQuizIdx];
  if (!q) return;

  var titleEl = document.getElementById('abCurrentQuizTitle');
  if (titleEl) {
    titleEl.innerHTML = `<i class="fa-solid fa-circle-question text-warning mr-1"></i>문제 ${currentAcadQuizIdx + 1}번 문항 편집`;
  }
  if (document.getElementById('abQuizQuestion')) document.getElementById('abQuizQuestion').value = q.question || '';
  if (document.getElementById('abOpt1')) document.getElementById('abOpt1').value = q.opt1 || '';
  if (document.getElementById('abOpt2')) document.getElementById('abOpt2').value = q.opt2 || '';
  if (document.getElementById('abOpt3')) document.getElementById('abOpt3').value = q.opt3 || '';
  if (document.getElementById('abOpt4')) document.getElementById('abOpt4').value = q.opt4 || '';
  if (document.getElementById('abQuizHint')) document.getElementById('abQuizHint').value = q.hint || '';

  var ansVal = q.ans || '1';
  var targetRadio = document.querySelector(`input[name="abQuizCorrectAns"][value="${ansVal}"]`);
  if (targetRadio) targetRadio.checked = true;
}

// 현재 퀴즈 입력 임시 저장
function saveCurrentAcadQuizInput() {
  var q = editingAcadQuizzes[currentAcadQuizIdx];
  if (!q) return;

  if (document.getElementById('abQuizQuestion')) q.question = document.getElementById('abQuizQuestion').value;
  if (document.getElementById('abOpt1')) q.opt1 = document.getElementById('abOpt1').value;
  if (document.getElementById('abOpt2')) q.opt2 = document.getElementById('abOpt2').value;
  if (document.getElementById('abOpt3')) q.opt3 = document.getElementById('abOpt3').value;
  if (document.getElementById('abOpt4')) q.opt4 = document.getElementById('abOpt4').value;
  if (document.getElementById('abQuizHint')) q.hint = document.getElementById('abQuizHint').value;

  var checkedRadio = document.querySelector('input[name="abQuizCorrectAns"]:checked');
  if (checkedRadio) q.ans = checkedRadio.value;
}

// 문항 전환
function switchAcadQuizItem(idx) {
  saveCurrentAcadQuizInput();
  currentAcadQuizIdx = idx;
  renderAcadQuizTabs();
  loadAcadQuizForm();
}

// 문항 추가
function addAcadQuizItem() {
  saveCurrentAcadQuizInput();
  var nextNum = editingAcadQuizzes.length + 1;
  editingAcadQuizzes.push({
    question: `새 문제 ${nextNum}. 지문 및 질문 내용을 입력하세요.`,
    opt1: "1번 선택지",
    opt2: "2번 선택지",
    opt3: "3번 선택지",
    opt4: "4번 선택지",
    ans: "1",
    hint: ""
  });
  currentAcadQuizIdx = editingAcadQuizzes.length - 1;
  renderAcadQuizTabs();
  loadAcadQuizForm();
  if (document.getElementById('abQuizQuestion')) document.getElementById('abQuizQuestion').focus();
}

// 문항 삭제
function deleteAcadQuizItem() {
  if (editingAcadQuizzes.length <= 1) {
    showAcademyToast('도서에는 최소 1개 이상의 북퀴즈 문항이 유지되어야 합니다.');
    return;
  }
  editingAcadQuizzes.splice(currentAcadQuizIdx, 1);
  if (currentAcadQuizIdx >= editingAcadQuizzes.length) {
    currentAcadQuizIdx = editingAcadQuizzes.length - 1;
  }
  renderAcadQuizTabs();
  loadAcadQuizForm();
  showAcademyToast('문항이 삭제되었습니다.');
}

// 특수기호 입력
function setCurAcadQuizInput(el) {
  curActiveAcadQuizInput = el;
}

function insertAcadQuizSym(sym) {
  if (!curActiveAcadQuizInput) {
    curActiveAcadQuizInput = document.getElementById('abQuizQuestion');
  }
  if (!curActiveAcadQuizInput) return;

  var start = curActiveAcadQuizInput.selectionStart || 0;
  var end = curActiveAcadQuizInput.selectionEnd || 0;
  var val = curActiveAcadQuizInput.value;
  curActiveAcadQuizInput.value = val.substring(0, start) + sym + val.substring(end);
  curActiveAcadQuizInput.focus();
  curActiveAcadQuizInput.selectionStart = curActiveAcadQuizInput.selectionEnd = start + sym.length;
}

// ISBN 자동조회 (마스터와 100% 동일)
function fetchAcadBookByIsbn() {
  var isbnInput = document.getElementById('abEditIsbn');
  var isbn = (isbnInput ? isbnInput.value : '').replace(/-/g, '').trim();
  var btn = document.getElementById('btnAcadIsbnFetch');

  if (!isbn) {
    isbn = '9791190000010';
    if (isbnInput) isbnInput.value = isbn;
  }

  if (btn) {
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-1"></i>조회중...';
    btn.disabled = true;
  }

  setTimeout(function() {
    var isbnMap = {
      '9791190000010': {
        title: '어린 왕자 (생텍쥐페리 탄생 120주년 기념판)',
        author: '앙투안 드 생텍쥐페리',
        publisher: '열린책들',
        grade: '초등 5~6학년',
        category: '세계문학 / 우정',
        cover: 'assets/covers/cover_1001.jpg',
        memo: '【나노 시트 핵심 정답】\nQ1. 고향 별: B-612 소행성\nQ2. 마음으로 보아야 분명하게 보인다 (여우의 가르침)\nQ3. 길들임과 책임에 대한 교훈'
      },
      '9788932917245': {
        title: '어린 왕자 (완역본)',
        author: '앙투안 드 생텍쥐페리',
        publisher: '열린책들',
        grade: '초등 5~6학년',
        category: '세계문학 / 우정',
        cover: 'assets/covers/cover_1001.jpg',
        memo: '【나노 시트 핵심 정답】\nQ1. 고향 별: B-612 소행성\nQ2. 마음으로 보아야 분명하게 보인다'
      },
      '9788936434120': {
        title: '아몬드',
        author: '손원평',
        publisher: '창비',
        grade: '중등 1~3학년',
        category: '한국문학 / 성장',
        cover: 'assets/covers/cover_1002.jpg',
        memo: '【나노 시트 핵심 정답】\n감정을 느끼지 못하는 소년 윤재의 따뜻한 성장 이야기'
      },
      '9788949110010': {
        title: '만복이네 떡집',
        author: '김리리',
        publisher: '비룡소',
        grade: '초등 1~2학년',
        category: '한국문학 / 성장',
        cover: 'assets/covers/cover_1003.jpg',
        memo: '【나노 시트 핵심 정답】\n입에 바른 말 대신 따뜻한 마음을 나누는 떡 이야기'
      },
      '9788936433673': {
        title: '마당을 나온 암탉',
        author: '황선미',
        publisher: '사계절',
        grade: '초등 3~4학년',
        category: '세계문학 / 우정',
        cover: 'assets/covers/cover_1004.jpg',
        memo: '【나노 시트 핵심 정답】\n자유와 모성애를 찾아 양계장을 탈출한 잎싹의 감동적인 여정'
      }
    };

    var bookData = isbnMap[isbn] || {
      title: `[ISBN-${isbn.slice(-4)}] 서지정보 자동수집 도서`,
      author: '국립중앙도서관 수록 작가',
      publisher: '교육출판사',
      grade: '초등 5~6학년',
      category: '세계문학 / 우정',
      cover: 'assets/covers/cover_1001.jpg',
      memo: '【나노 시트 핵심 정답】\n교사용 지도 가이드 및 독해 핵심 정답안'
    };

    if (document.getElementById('abEditTitle')) document.getElementById('abEditTitle').value = bookData.title;
    if (document.getElementById('abEditAuthor')) document.getElementById('abEditAuthor').value = bookData.author;
    if (document.getElementById('abEditPublisher')) document.getElementById('abEditPublisher').value = bookData.publisher;
    if (document.getElementById('abEditGrade')) document.getElementById('abEditGrade').value = bookData.grade;
    if (document.getElementById('abEditCategory')) document.getElementById('abEditCategory').value = bookData.category;
    if (document.getElementById('abEditCover')) document.getElementById('abEditCover').value = bookData.cover;
    if (document.getElementById('abEditMemo')) document.getElementById('abEditMemo').value = bookData.memo;
    updateAcadCoverPreview(bookData.cover);

    attachSampleAcadPdf();

    if (btn) {
      btn.innerHTML = '<i class="fa-solid fa-check mr-1"></i>조회 완료';
      btn.disabled = false;
    }
    showAcademyToast(`[${bookData.title}] 알라딘 서지정보 및 표지를 성공적으로 불러왔습니다.`);
  }, 350);
}

// 모달 저장 핸들러 (도서 + PDF + 퀴즈 통합 일괄 저장)
function handleSaveAcademyBookModal(e) {
  if (e) e.preventDefault();
  saveCurrentAcadQuizInput();

  var customId = (document.getElementById('abEditId') ? document.getElementById('abEditId').value : '').trim();
  var isbn = (document.getElementById('abEditIsbn') ? document.getElementById('abEditIsbn').value : '').trim();
  var title = (document.getElementById('abEditTitle') ? document.getElementById('abEditTitle').value : '').trim();
  var author = (document.getElementById('abEditAuthor') ? document.getElementById('abEditAuthor').value : '').trim();
  var publisher = (document.getElementById('abEditPublisher') ? document.getElementById('abEditPublisher').value : '').trim();
  var grade = document.getElementById('abEditGrade') ? document.getElementById('abEditGrade').value : '초등 5~6학년';
  var category = document.getElementById('abEditCategory') ? document.getElementById('abEditCategory').value : '세계문학 / 우정';
  var cover = (document.getElementById('abEditCover') ? document.getElementById('abEditCover').value : '').trim() || 'assets/covers/cover_1001.jpg';
  var memo = (document.getElementById('abEditMemo') ? document.getElementById('abEditMemo').value : '').trim();

  if (!title) {
    alert('도서명을 입력해주세요.');
    document.getElementById('abEditTitle').focus();
    return;
  }
  if (!author) {
    alert('지은이(저자)를 입력해주세요.');
    document.getElementById('abEditAuthor').focus();
    return;
  }
  if (!publisher) {
    alert('출판사명을 입력해주세요.');
    document.getElementById('abEditPublisher').focus();
    return;
  }

  var matName = editingAcadSheetFile ? editingAcadSheetFile.name : `${title.split('(')[0].trim()}_나노시트_학습용.pdf`;
  var matSize = editingAcadSheetFile ? editingAcadSheetFile.size : '1.45 MB';
  var matType = editingAcadSheetFile ? editingAcadSheetFile.type : '나노 시트 (PDF)';

  if (editingAcadBookId) {
    // 기존 도서 수정
    var book = academyBookList.find(function(b) { return b.id === editingAcadBookId; });
    if (book) {
      book.id = customId || book.id;
      book.isbn = isbn;
      book.title = title;
      book.author = author;
      book.publisher = publisher;
      book.grade = grade;
      book.category = category;
      book.cover = cover;
      book.materialName = matName;
      book.materialSize = matSize;
      book.materialType = matType;
      book.answerGuide = memo;
      book.quizList = JSON.parse(JSON.stringify(editingAcadQuizzes));
      book.quizStatus = `${editingAcadQuizzes.length}문항 완비`;
    }
    lastAddedBookId = book ? book.id : customId;
    showAcademyToast(`[${title}] 도서 및 북퀴즈(${editingAcadQuizzes.length}문항)가 수정 저장되었습니다.`);
  } else {
    // 신규 도서 등록
    var finalId = customId || String(academyBookList.length + 1001);
    var newBook = {
      id: finalId,
      isbn: isbn,
      title: title,
      subtitle: '학원 자체 등록 맞춤 도서',
      author: author,
      publisher: publisher,
      grade: grade,
      category: category,
      creatorType: 'ACADEMY',
      academyName: '나노 독서아카데미 본원',
      cover: cover,
      materialName: matName,
      materialSize: matSize,
      materialType: matType,
      quizStatus: `${editingAcadQuizzes.length}문항 완비`,
      readCount: '0회',
      answerGuide: memo || '【나노 시트 핵심 정답】\n교사용 지도 가이드 및 정답안 등록 완료.',
      quizList: JSON.parse(JSON.stringify(editingAcadQuizzes))
    };
    academyBookList.unshift(newBook);
    lastAddedBookId = finalId;
    showAcademyToast(`신규 도서 [${title}] (코드: ${finalId}, 등록처: 나노 독서아카데미 본원, 북퀴즈 ${editingAcadQuizzes.length}문항)이 등록되었습니다.`);
  }

  // 동기화 및 렌더링
  if (typeof renderCartBookCatalog === 'function') renderCartBookCatalog();
  renderAcademyBookTable();

  // 기존 3번 서브탭 북퀴즈 목록도 동기화
  quizDataList = JSON.parse(JSON.stringify(editingAcadQuizzes));
  renderQuizTabs();
  loadCurrentQuizForm();

  $('#academyBookEditModal').modal('hide');
}

// 도서 삭제 함수
function deleteAcademyBook(id) {
  var book = academyBookList.find(function(b) { return b.id === id; });
  var title = book ? book.title : id;
  if (!confirm(`[${title}] 도서를 목록에서 삭제하시겠습니까?`)) {
    return;
  }
  academyBookList = academyBookList.filter(function(b) { return b.id !== id; });
  renderAcademyBookTable();
  if (typeof renderCartBookCatalog === 'function') renderCartBookCatalog();
  showAcademyToast(`[${title}] 도서가 삭제되었습니다.`);
}

// ==============================================================
// 8. 학원 관리자 내 정보 관리 (My Info Management)
// ==============================================================

/**
 * [상태 객체] 학원 관리자(원장님) 기본 정보 및 계약 데이터
 * - 조회 전용 항목: ID, 학원명, 원장명, 이용상품, 사업자번호, 계약일, 만료일
 * - 변경 가능 항목: 휴대전화번호, 이메일, 주소(우편번호/기본/상세)
 * - 계정 보안: 비밀번호 변경
 */
var myAcademyInfo = {
  id: 'director_ey',
  academyName: '나노 독서아카데미 본원',
  directorName: '김은영',
  phone: '010-3342-9981',
  email: 'director_ey@nanobook.co.kr',
  postcode: '07997',
  address: '서울특별시 양천구 오목로 299',
  addressDetail: '4층 401호 (목동, 나노빌딩)',
  plan: '프리미엄 프랜차이즈 50인 슬롯형',
  bizNumber: '107-86-54321',
  contractDate: '2025-01-01',
  expireDate: '2026-12-31'
};

/**
 * '내 정보 관리' 모달 열기
 * - 이유: 최신 상태값을 폼에 바인딩하고, 이전 입력 중이던 비밀번호 등 민감 정보를 안전하게 초기화하기 위함
 */
function openMyInfoModal() {
  // 1) 조회 전용 정보 텍스트 바인딩
  var elId = document.getElementById('infoDisplayId');
  var elBiz = document.getElementById('infoDisplayBizNum');
  var elAcad = document.getElementById('infoDisplayAcademyName');
  var elDir = document.getElementById('infoDisplayDirectorName');
  var elPlan = document.getElementById('infoDisplayPlan');
  var elCDate = document.getElementById('infoDisplayContractDate');
  var elEDate = document.getElementById('infoDisplayExpireDate');

  if (elId) elId.innerText = myAcademyInfo.id;
  if (elBiz) elBiz.innerText = myAcademyInfo.bizNumber;
  if (elAcad) elAcad.innerText = myAcademyInfo.academyName;
  if (elDir) elDir.innerText = myAcademyInfo.directorName;
  if (elPlan) elPlan.innerText = myAcademyInfo.plan;
  if (elCDate) elCDate.innerText = myAcademyInfo.contractDate;
  if (elEDate) elEDate.innerText = myAcademyInfo.expireDate;

  // 상단 배너 텍스트 동기화
  var bannerDir = document.getElementById('bannerDirectorName');
  var bannerAcad = document.getElementById('bannerAcademyName');
  if (bannerDir) bannerDir.innerText = myAcademyInfo.directorName + ' 원장님';
  if (bannerAcad) bannerAcad.innerText = myAcademyInfo.academyName + ' (가맹 1호점)';

  // 2) 수정 가능 입력 필드 값 채우기
  var inputPhone = document.getElementById('myInfoPhone');
  var inputEmail = document.getElementById('myInfoEmail');
  var inputPostcode = document.getElementById('myInfoPostcode');
  var inputAddress = document.getElementById('myInfoAddress');
  var inputDetail = document.getElementById('myInfoAddressDetail');

  if (inputPhone) inputPhone.value = myAcademyInfo.phone;
  if (inputEmail) inputEmail.value = myAcademyInfo.email;
  if (inputPostcode) inputPostcode.value = myAcademyInfo.postcode;
  if (inputAddress) inputAddress.value = myAcademyInfo.address;
  if (inputDetail) inputDetail.value = myAcademyInfo.addressDetail;

  // 3) 비밀번호 변경 필드 초기화 (보안상 항상 비워둠)
  var curPw = document.getElementById('myInfoCurrentPw');
  var newPw = document.getElementById('myInfoNewPw');
  var newPwConfirm = document.getElementById('myInfoNewPwConfirm');
  var pwFeedback = document.getElementById('pwMatchFeedback');

  if (curPw) curPw.value = '';
  if (newPw) newPw.value = '';
  if (newPwConfirm) newPwConfirm.value = '';
  if (pwFeedback) {
    pwFeedback.innerText = '';
    pwFeedback.className = '';
  }

  // 모달 띄우기
  $('#myInfoModal').modal('show');
}

/**
 * 전화번호 입력 시 하이픈 자동 포맷팅 함수
 * - 이유: 사용자가 숫자만 입력하더라도 010-XXXX-XXXX 표준 규격으로 일관성 있게 표시하기 위함
 */
function formatPhoneNumber(input) {
  var value = input.value.replace(/[^0-9]/g, '');
  var result = '';
  if (value.length < 4) {
    result = value;
  } else if (value.length < 7) {
    result = value.substr(0, 3) + '-' + value.substr(3);
  } else if (value.length < 11) {
    result = value.substr(0, 3) + '-' + value.substr(3, 3) + '-' + value.substr(6);
  } else {
    result = value.substr(0, 3) + '-' + value.substr(3, 4) + '-' + value.substr(7, 4);
  }
  input.value = result;
}

/**
 * Daum(카카오) 우편번호 검색 팝업 실행
 * - 이유: 원장님이 주소를 오탈자 없이 신속하고 정확하게 입력할 수 있도록 표준 주소 API 연동
 */
function searchPostcode() {
  if (typeof daum === 'undefined' || !daum.Postcode) {
    // CDN 로드 실패 또는 오프라인 환경을 위한 안전한 Fallback
    var manualAddr = prompt('우편번호 검색 서비스에 연결할 수 없습니다. 주소를 직접 입력해 주세요:', document.getElementById('myInfoAddress').value);
    if (manualAddr) {
      document.getElementById('myInfoAddress').value = manualAddr;
    }
    return;
  }

  new daum.Postcode({
    oncomplete: function(data) {
      // 도로명 주소 또는 지번 주소 선택
      var fullAddr = data.roadAddress ? data.roadAddress : data.jibunAddress;
      var extraAddr = '';

      if (data.userSelectedType === 'R') {
        if (data.bname !== '' && /[동|로|가]$/g.test(data.bname)) {
          extraAddr += data.bname;
        }
        if (data.buildingName !== '' && data.apartment === 'Y') {
          extraAddr += (extraAddr !== '' ? ', ' + data.buildingName : data.buildingName);
        }
        if (extraAddr !== '') {
          fullAddr += ' (' + extraAddr + ')';
        }
      }

      // 우편번호와 기본 주소 필드에 삽입
      document.getElementById('myInfoPostcode').value = data.zonecode;
      document.getElementById('myInfoAddress').value = fullAddr;
      
      // 상세 주소 입력창으로 포커스 이동
      var detailInput = document.getElementById('myInfoAddressDetail');
      if (detailInput) {
        detailInput.focus();
      }
    }
  }).open();
}

/**
 * 비밀번호 입력 시 일치 여부 실시간 검증
 * - 이유: 저장 전에 사용자가 입력한 새 비밀번호와 확인 비밀번호의 일치 여부를 즉각 시각적으로 안내하기 위함
 */
function checkPasswordMatch() {
  var newPw = document.getElementById('myInfoNewPw').value;
  var confirmPw = document.getElementById('myInfoNewPwConfirm').value;
  var feedback = document.getElementById('pwMatchFeedback');

  if (!feedback) return;

  if (!newPw && !confirmPw) {
    feedback.innerText = '';
    return;
  }

  if (newPw.length > 0 && newPw.length < 8) {
    feedback.innerText = '※ 새 비밀번호는 최소 8자 이상이어야 합니다.';
    feedback.style.color = '#d9534f';
    return;
  }

  if (newPw && confirmPw) {
    if (newPw === confirmPw) {
      feedback.innerText = '✓ 새 비밀번호가 서로 일치합니다.';
      feedback.style.color = '#2f5436';
    } else {
      feedback.innerText = '✕ 새 비밀번호가 일치하지 않습니다.';
      feedback.style.color = '#d9534f';
    }
  }
}

/**
 * 비밀번호만 단독 변경 처리
 * - 이유: 연락처나 주소 수정 없이 비밀번호만 신속하게 변경하고 싶을 때 명시적인 액션 제공
 */
function changeMyPasswordOnly() {
  var curPw = document.getElementById('myInfoCurrentPw').value.trim();
  var newPw = document.getElementById('myInfoNewPw').value.trim();
  var confirmPw = document.getElementById('myInfoNewPwConfirm').value.trim();

  // 1) 필수값 검증
  if (!curPw) {
    alert('현재 비밀번호를 입력해 주세요.');
    document.getElementById('myInfoCurrentPw').focus();
    return;
  }
  if (!newPw) {
    alert('변경할 새 비밀번호를 입력해 주세요.');
    document.getElementById('myInfoNewPw').focus();
    return;
  }
  if (newPw.length < 8) {
    alert('새 비밀번호는 보안을 위해 8자리 이상으로 설정해 주세요.');
    document.getElementById('myInfoNewPw').focus();
    return;
  }
  if (newPw !== confirmPw) {
    alert('새 비밀번호와 비밀번호 확인이 일치하지 않습니다.');
    document.getElementById('myInfoNewPwConfirm').focus();
    return;
  }

  // 2) 변경 완료 처리
  document.getElementById('myInfoCurrentPw').value = '';
  document.getElementById('myInfoNewPw').value = '';
  document.getElementById('myInfoNewPwConfirm').value = '';
  document.getElementById('pwMatchFeedback').innerText = '';

  showAcademyToast('비밀번호가 성공적으로 변경되었습니다. 다음 로그인부터 적용됩니다.');
}

/**
 * 내 정보(연락처, 이메일, 주소 및 선택적 비밀번호) 통합 저장
 * - 이유: 한 번의 클릭으로 수정 가능한 모든 학원 정보와 보안 설정을 일괄 저장하고 헤더와 화면을 동기화하기 위함
 */
function saveMyInfo() {
  var phone = document.getElementById('myInfoPhone').value.trim();
  var email = document.getElementById('myInfoEmail').value.trim();
  var postcode = document.getElementById('myInfoPostcode').value.trim();
  var address = document.getElementById('myInfoAddress').value.trim();
  var addressDetail = document.getElementById('myInfoAddressDetail').value.trim();

  // 1) 연락처 유효성 검사
  if (!phone) {
    alert('휴대전화번호를 입력해 주세요.');
    document.getElementById('myInfoPhone').focus();
    return;
  }
  if (phone.replace(/[^0-9]/g, '').length < 10) {
    alert('올바른 휴대전화번호(10~11자리)를 입력해 주세요.');
    document.getElementById('myInfoPhone').focus();
    return;
  }

  // 2) 이메일 유효성 검사
  var emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email) {
    alert('대표 이메일을 입력해 주세요.');
    document.getElementById('myInfoEmail').focus();
    return;
  }
  if (!emailPattern.test(email)) {
    alert('올바른 이메일 형식을 입력해 주세요 (예: director@example.com).');
    document.getElementById('myInfoEmail').focus();
    return;
  }

  // 3) 주소 검사
  if (!address) {
    alert('학원 소재지 주소를 입력해 주세요.');
    document.getElementById('myInfoAddress').focus();
    return;
  }

  // 4) 비밀번호 입력 여부 확인 (입력되어 있다면 함께 검증 및 변경)
  var curPw = document.getElementById('myInfoCurrentPw').value.trim();
  var newPw = document.getElementById('myInfoNewPw').value.trim();
  var confirmPw = document.getElementById('myInfoNewPwConfirm').value.trim();

  var pwChanged = false;
  if (curPw || newPw || confirmPw) {
    if (!curPw) {
      alert('비밀번호를 변경하시려면 [현재 비밀번호]를 입력해 주세요.');
      document.getElementById('myInfoCurrentPw').focus();
      return;
    }
    if (!newPw) {
      alert('변경할 [새 비밀번호]를 입력해 주세요.');
      document.getElementById('myInfoNewPw').focus();
      return;
    }
    if (newPw.length < 8) {
      alert('새 비밀번호는 8자리 이상이어야 합니다.');
      document.getElementById('myInfoNewPw').focus();
      return;
    }
    if (newPw !== confirmPw) {
      alert('새 비밀번호와 확인 입력이 일치하지 않습니다.');
      document.getElementById('myInfoNewPwConfirm').focus();
      return;
    }
    pwChanged = true;
  }

  // 5) 데이터 모델 업데이트
  myAcademyInfo.phone = phone;
  myAcademyInfo.email = email;
  myAcademyInfo.postcode = postcode;
  myAcademyInfo.address = address;
  myAcademyInfo.addressDetail = addressDetail;

  // 6) 모달 닫기 및 알림
  $('#myInfoModal').modal('hide');

  if (pwChanged) {
    showAcademyToast('내 정보(연락처·이메일·주소) 및 비밀번호가 성공적으로 저장되었습니다.');
  } else {
    showAcademyToast('내 정보(휴대전화·이메일·학원 주소)가 성공적으로 저장되었습니다.');
  }
}

// 초기화
document.addEventListener('DOMContentLoaded', function() {
  updateClassSelectOptions();
  renderQuizTabs();
  loadCurrentQuizForm();
  renderStudentTable(studentDataList);
  renderAcademyBookTable();
  initPortfolioOptions();
  onPortfolioStudentChange('S1021');
  renderPortfolioTable(portfolioList);
  renderTeacherTable();
  renderLearningTable();
  renderAssignmentTable();
  renderAcademyDispatchTable();
  renderAcademyRankingTable();
  renderAcademyPaymentTable();
  selectPlanTier('standard');
});

// ==============================================================
// 8. 결제 및 구독 관리 모듈 (Academy Payment & Subscription)
// ==============================================================

// 학원 현재 이용 중인 플랜 정보
var currentAcademyPlan = {
  tier: 'standard',
  name: '스탠다드',
  slots: 50,
  monthlyPrice: 100000,
  expiryDate: '2026-09-19',
  daysRemaining: 3
};

var currentSelectedTier = 'standard';
var currentSelectedPeriod = '6month';
var currentSelectedPayMethod = '신용카드';

// 요금제(Tier) 정의: 원생 정원 규모별
var planTiers = {
  'basic': {
    code: 'basic',
    name: '베이직',
    slots: 30,
    monthlyPrice: 70000,
    rank: 1,
    badgeColor: 'badge-secondary',
    desc: '소규모 학원 및 공부방 최적화'
  },
  'standard': {
    code: 'standard',
    name: '스탠다드',
    slots: 50,
    monthlyPrice: 100000,
    rank: 2,
    badgeColor: 'badge-success',
    desc: '표준 학원 운영에 최적화된 대표 플랜'
  },
  'premium': {
    code: 'premium',
    name: '프리미엄',
    slots: 80,
    monthlyPrice: 150000,
    rank: 3,
    badgeColor: 'badge-warning',
    desc: '원생 확장에 대비하는 중대형 학원 플랜'
  },
  'vip': {
    code: 'vip',
    name: 'VIP 플랜',
    slots: 120,
    monthlyPrice: 220000,
    rank: 4,
    badgeColor: 'badge-danger',
    desc: '대형 어학원 및 독서논술 전문 브랜드'
  }
};

// 구독 기간 정의 및 할인율
var periodDefinitions = {
  'monthly': {
    code: 'monthly',
    name: '1개월 정기구독권',
    shortName: '1개월',
    periodMonths: 1,
    discountRate: 0,
    badge: '1개월 정기구독',
    desc: '부담 없는 매월 정기결제'
  },
  '6month': {
    code: '6month',
    name: '6개월 이용권 (10% 할인)',
    shortName: '6개월 (10% OFF)',
    periodMonths: 6,
    discountRate: 0.10,
    badge: '6개월 이용권 (1학기 패키지)',
    desc: '1학기 6개월 패키지 (10% 즉시 절약)'
  },
  '12month': {
    code: '12month',
    name: '12개월 연간권 (20% 할인)',
    shortName: '12개월 (20% OFF)',
    periodMonths: 12,
    discountRate: 0.20,
    badge: '12개월 연간권 (VIP 라이선스)',
    desc: '연간 라이선스 (20% 최대 할인)'
  }
};

// 요금제(Tier) 선택 및 기간별 요금 동적 계산 함수
function selectPlanTier(tierCode) {
  var tier = planTiers[tierCode] || planTiers['standard'];
  currentSelectedTier = tierCode;

  // 1. STEP 1 카드 UI 활성화 스타일 처리
  var tierKeys = ['basic', 'standard', 'premium', 'vip'];
  tierKeys.forEach(function(code) {
    var card = document.getElementById('cardTier_' + code);
    if (!card) return;
    var iconSpan = card.querySelector('.tier-check-icon');

    if (code === tierCode) {
      card.classList.add('active');
      card.style.border = '2px solid #5a4b3d';
      card.style.background = '#fffcf7';
      card.style.boxShadow = '0 4px 16px rgba(90, 75, 61, 0.12)';
      if (iconSpan) iconSpan.innerHTML = '<i class="fa-solid fa-circle-check text-success"></i>';
    } else {
      card.classList.remove('active');
      card.style.border = '2px solid var(--border-medium)';
      card.style.background = '#ffffff';
      card.style.boxShadow = 'none';
      if (iconSpan) iconSpan.innerHTML = '<i class="fa-regular fa-circle text-muted"></i>';
    }
  });

  // 2. 현재 요금제 대비 변경 정책 안내 (상향: 즉시 차액결제 / 하향: 차월적용 예약 / 동일: 기간연장)
  var currentRank = planTiers[currentAcademyPlan.tier].rank;
  var targetRank = tier.rank;
  var policyBox = document.getElementById('planTierPolicyNoticeBox');

  // 남은 D-3일 차액 계산 (상향 시)
  var monthlyDiff = Math.max(0, tier.monthlyPrice - currentAcademyPlan.monthlyPrice);
  var proratedDiffSupply = Math.round((monthlyDiff / 30) * currentAcademyPlan.daysRemaining);
  var proratedDiffVat = Math.round(proratedDiffSupply * 0.1);
  var proratedDiffTotal = proratedDiffSupply + proratedDiffVat;

  var btnSubmitSuffix = '';

  if (targetRank > currentRank) {
    // [상위 요금제 업그레이드] 즉시 변경 & 차액 결제
    btnSubmitSuffix = ' (즉시 변경 차액 결제)';
    if (policyBox) {
      policyBox.className = 'p-3 rounded mb-2 border-danger';
      policyBox.style.background = '#fff7f7';
      policyBox.style.border = '1.5px solid #fca5a5';
      policyBox.innerHTML = 
        '<div class="d-flex align-items-start gap-3">' +
          '<div style="font-size: 24px; color: #dc2626; line-height: 1;"><i class="fa-solid fa-bolt"></i></div>' +
          '<div>' +
            '<div class="font-weight-bold" style="color: #b91c1c; font-size: 14px;">' +
              '⚡ [요금제 즉시 상향 적용] 원생 정원을 ' + currentAcademyPlan.slots + '명 ➔ ' + tier.slots + '명으로 즉시 업그레이드합니다.' +
            '</div>' +
            '<div class="text-muted mt-1" style="font-size: 12.5px; line-height: 1.6;">' +
              '• <strong>즉시 변경 적용</strong>: 신청 즉시 가맹 슬롯이 <strong>' + tier.slots + '명</strong>으로 즉시 확장되어 추가 원생 등록이 가능합니다.<br>' +
              '• <strong>잔여 기간 차액 결제 방식</strong>: 현재 스탠다드 플랜의 남은 기간(D-3)에 해당하는 일할 차액(<strong>' + Number(proratedDiffTotal).toLocaleString() + '원</strong>, VAT 포함)만 결제되거나, 선택하신 구독 기간과 함께 합산 결제됩니다.' +
            '</div>' +
          '</div>' +
        '</div>';
    }
  } else if (targetRank < currentRank) {
    // [하위 요금제 다운그레이드] 차월부터 적용
    btnSubmitSuffix = ' (차월 적용 예약)';
    if (policyBox) {
      policyBox.className = 'p-3 rounded mb-2 border-warning';
      policyBox.style.background = '#fffbeb';
      policyBox.style.border = '1.5px solid #fcd34d';
      policyBox.innerHTML = 
        '<div class="d-flex align-items-start gap-3">' +
          '<div style="font-size: 24px; color: #d97706; line-height: 1;"><i class="fa-solid fa-calendar-check"></i></div>' +
          '<div>' +
            '<div class="font-weight-bold" style="color: #b45309; font-size: 14px;">' +
              '📅 [요금제 차월 적용 예약] 하위 요금제(' + tier.name + ' ' + tier.slots + '명)로 변경을 예약합니다.' +
            '</div>' +
            '<div class="text-muted mt-1" style="font-size: 12.5px; line-height: 1.6;">' +
              '• <strong>당월 혜택 유지</strong>: 현재 이용권 만료일(2026.09.19)까지는 <strong>스탠다드(50명 슬롯)</strong> 혜택이 그대로 유지됩니다.<br>' +
              '• <strong>차월 자동 적용</strong>: 지금 바로 결제되지 않으며, 차월 결제일(2026.09.20)부터 선택하신 <strong>' + tier.name + '(월 ' + Number(tier.monthlyPrice).toLocaleString() + '원)</strong>으로 자동 변경 및 정산됩니다.' +
            '</div>' +
          '</div>' +
        '</div>';
    }
  } else {
    // [동일 요금제 기간 연장]
    btnSubmitSuffix = '';
    if (policyBox) {
      policyBox.className = 'p-3 rounded mb-2 border-success';
      policyBox.style.background = '#f0fdf4';
      policyBox.style.border = '1.5px solid #86efac';
      policyBox.innerHTML = 
        '<div class="d-flex align-items-start gap-3">' +
          '<div style="font-size: 24px; color: #16a34a; line-height: 1;"><i class="fa-solid fa-arrows-rotate"></i></div>' +
          '<div>' +
            '<div class="font-weight-bold" style="color: #15803d; font-size: 14px;">' +
              '🔄 [현재 요금제 연장] ' + tier.name + ' 요금제(' + tier.slots + '명)를 유지하며 서비스 기간을 연장합니다.' +
            '</div>' +
            '<div class="text-muted mt-1" style="font-size: 12.5px; line-height: 1.6;">' +
              '• 만료 예정일(2026.09.19) 이후부터 선택하신 구독 기간만큼 중단 없이 서비스가 자동 연장됩니다.' +
            '</div>' +
          '</div>' +
        '</div>';
    }
  }

  // 3. STEP 2 구독 기간별 요금 동적 계산 및 렌더링
  var titleDisplay = document.getElementById('selectedTierDisplayName');
  if (titleDisplay) {
    titleDisplay.innerText = tier.name + ' (' + tier.slots + '명 정원)';
  }

  // 1개월 요금 계산
  var p1Supply = tier.monthlyPrice;
  var p1Vat = Math.round(p1Supply * 0.1);
  var p1Total = p1Supply + p1Vat;
  var elP1Price = document.getElementById('periodPrice_monthly');
  if (elP1Price) elP1Price.innerText = Number(p1Supply).toLocaleString();
  var elP1Vat = document.getElementById('periodVatPrice_monthly');
  if (elP1Vat) elP1Vat.innerHTML = 'VAT ' + Number(p1Vat).toLocaleString() + '원 포함 실결제액: <strong class="text-dark">' + Number(p1Total).toLocaleString() + '원</strong>';

  // 6개월 요금 계산 (10% 할인)
  var p6Original = tier.monthlyPrice * 6;
  var p6Supply = Math.round(p6Original * 0.9);
  var p6Saved = p6Original - p6Supply;
  var p6Vat = Math.round(p6Supply * 0.1);
  var p6Total = p6Supply + p6Vat;
  var p6MonthlyCost = Math.round(p6Supply / 6);
  var elP6Orig = document.getElementById('periodOriginalPrice_6month');
  if (elP6Orig) elP6Orig.innerText = '기존 정가 ' + Number(p6Original).toLocaleString() + '원';
  var elP6Price = document.getElementById('periodPrice_6month');
  if (elP6Price) elP6Price.innerText = Number(p6Supply).toLocaleString();
  var elP6Saved = document.getElementById('periodDiscountSaved_6month');
  if (elP6Saved) elP6Saved.innerText = Number(p6Saved).toLocaleString() + '원 즉시 절약';
  var elP6Vat = document.getElementById('periodVatPrice_6month');
  if (elP6Vat) elP6Vat.innerHTML = 'VAT ' + Number(p6Vat).toLocaleString() + '원 포함 실결제액: <strong class="text-dark">' + Number(p6Total).toLocaleString() + '원</strong> (월 ' + Number(p6MonthlyCost).toLocaleString() + '원 꼴)';

  // 12개월 요금 계산 (20% 할인)
  var p12Original = tier.monthlyPrice * 12;
  var p12Supply = Math.round(p12Original * 0.8);
  var p12Saved = p12Original - p12Supply;
  var p12Vat = Math.round(p12Supply * 0.1);
  var p12Total = p12Supply + p12Vat;
  var p12MonthlyCost = Math.round(p12Supply / 12);
  var elP12Orig = document.getElementById('periodOriginalPrice_12month');
  if (elP12Orig) elP12Orig.innerText = '기존 정가 ' + Number(p12Original).toLocaleString() + '원';
  var elP12Price = document.getElementById('periodPrice_12month');
  if (elP12Price) elP12Price.innerText = Number(p12Supply).toLocaleString();
  var elP12Saved = document.getElementById('periodDiscountSaved_12month');
  if (elP12Saved) elP12Saved.innerText = Number(p12Saved).toLocaleString() + '원 최대 절약';
  var elP12Vat = document.getElementById('periodVatPrice_12month');
  if (elP12Vat) elP12Vat.innerHTML = 'VAT ' + Number(p12Vat).toLocaleString() + '원 포함 실결제액: <strong class="text-dark">' + Number(p12Total).toLocaleString() + '원</strong> (월 ' + Number(p12MonthlyCost).toLocaleString() + '원 꼴)';

  // 혜택 리스트 슬롯 정원 문구 업데이트
  ['monthly', '6month', '12month'].forEach(function(pKey) {
    var slotItem = document.getElementById('benefitSlot_' + pKey);
    if (slotItem) {
      slotItem.innerHTML = '<i class="fa-solid fa-circle-check text-success mr-2"></i>원생 슬롯 기본 <strong>' + tier.slots + '명</strong> 제공';
    }
  });

  // 신청 버튼 텍스트 변경
  var b1 = document.getElementById('btnPeriodSubmit_monthly');
  var b6 = document.getElementById('btnPeriodSubmit_6month');
  var b12 = document.getElementById('btnPeriodSubmit_12month');

  if (targetRank > currentRank) {
    if (b1) b1.innerText = '1개월 즉시 상향 신청 (차액 결제)';
    if (b6) b6.innerText = '6개월 즉시 상향 신청 (10% 할인)';
    if (b12) b12.innerText = '12개월 즉시 상향 신청 (20% 할인)';
  } else if (targetRank < currentRank) {
    if (b1) b1.innerText = '1개월 차월 적용 예약';
    if (b6) b6.innerText = '6개월 차월 적용 예약 (10% 할인)';
    if (b12) b12.innerText = '12개월 차월 적용 예약 (20% 할인)';
  } else {
    if (b1) b1.innerText = '1개월 정기구독 연장';
    if (b6) b6.innerText = '6개월 이용권 연장 (10% 할인)';
    if (b12) b12.innerText = '12개월 연간권 연장 (20% 할인)';
  }
}

var academyPaymentList = [
  {
    id: "PAY-20260820-001",
    planType: "monthly",
    planName: "1개월 정기구독권",
    supply: 100000,
    vat: 10000,
    total: 110000,
    method: "신용카드 (현대 4210-****)",
    date: "2026-08-20 10:15:22",
    startDate: "2026-08-20",
    endDate: "2026-09-19",
    status: "paid"
  },
  {
    id: "PAY-20260720-003",
    planType: "monthly",
    planName: "1개월 정기구독권",
    supply: 100000,
    vat: 10000,
    total: 110000,
    method: "신용카드 (현대 4210-****)",
    date: "2026-07-20 10:00:11",
    startDate: "2026-07-20",
    endDate: "2026-08-19",
    status: "paid"
  },
  {
    id: "PAY-20260620-002",
    planType: "monthly",
    planName: "1개월 정기구독권",
    supply: 100000,
    vat: 10000,
    total: 110000,
    method: "신용카드 (현대 4210-****)",
    date: "2026-06-20 10:00:05",
    startDate: "2026-06-20",
    endDate: "2026-07-19",
    status: "paid"
  }
];

// 결제 내역 렌더링
function renderAcademyPaymentTable(data) {
  var list = data || academyPaymentList;
  var tbody = document.getElementById('academyPaymentTableBody');
  if (!tbody) return;

  var countBadge = document.getElementById('academyPaymentCountBadge');
  if (countBadge) countBadge.innerText = '총 ' + list.length + '건';

  if (list.length === 0) {
    tbody.innerHTML = '<tr><td colspan="10" class="text-center py-4 text-muted">결제 내역이 존재하지 않습니다.</td></tr>';
    return;
  }

  var html = '';
  list.forEach(function(item) {
    var statusBadge = '';
    if (item.status === 'paid') {
      statusBadge = '<span class="badge-soft badge-soft-success font-weight-bold"><i class="fa-solid fa-circle-check mr-1"></i>결제완료</span>';
    } else if (item.status === 'pending') {
      statusBadge = '<span class="badge-soft badge-soft-warn font-weight-bold"><i class="fa-solid fa-clock mr-1"></i>결제대기</span>';
    } else if (item.status === 'cancelled') {
      statusBadge = '<span class="badge-soft badge-soft-danger font-weight-bold"><i class="fa-solid fa-xmark mr-1"></i>결제취소</span>';
    } else {
      statusBadge = '<span class="badge-soft badge-soft-neutral">' + item.status + '</span>';
    }

    html += '<tr style="font-size:13px;">' +
      '<td class="font-weight-bold text-muted" style="font-size:11.5px;">' + item.id + '</td>' +
      '<td><span class="font-weight-bold" style="color:var(--text-main);">' + item.planName + '</span></td>' +
      '<td>' + Number(item.supply).toLocaleString() + '원</td>' +
      '<td>' + Number(item.vat).toLocaleString() + '원</td>' +
      '<td class="font-weight-bold" style="color:#962a22; font-size:13.5px;">' + Number(item.total).toLocaleString() + '원</td>' +
      '<td><small class="text-muted"><i class="fa-solid fa-credit-card mr-1"></i>' + item.method + '</small></td>' +
      '<td><small class="text-muted">' + item.date + '</small></td>' +
      '<td><span class="badge badge-light border" style="font-size:11.5px;">' + item.startDate + ' ~ ' + item.endDate + '</span></td>' +
      '<td class="text-center">' + statusBadge + '</td>' +
      '<td class="text-center">' +
        (item.status === 'paid' 
          ? '<button type="button" class="btn btn-xs btn-outline-secondary" onclick="viewPaymentReceipt(\'' + item.id + '\')" style="border-radius:6px; font-size:11px; padding:3px 8px;"><i class="fa-solid fa-file-invoice mr-1"></i>영수증</button>' 
          : '<small class="text-muted">-</small>') +
      '</td>' +
    '</tr>';
  });

  tbody.innerHTML = html;
}

// 결제 내역 상태 필터링
function filterAcademyPaymentTable() {
  var filterSelect = document.getElementById('filterPaymentStatus');
  var status = filterSelect ? filterSelect.value : 'ALL';

  if (status === 'ALL') {
    renderAcademyPaymentTable(academyPaymentList);
  } else {
    var filtered = academyPaymentList.filter(function(item) {
      return item.status === status;
    });
    renderAcademyPaymentTable(filtered);
  }
}

// 만료 알림 상태 시뮬레이션 (D-3 / D-7 / normal)
function setExpireAlert(type) {
  var banner = document.getElementById('paymentExpireAlertBanner');
  var titleEl = document.getElementById('paymentAlertTitle');
  var descEl = document.getElementById('paymentAlertDesc');
  if (!banner || !titleEl || !descEl) return;

  if (type === 'd3') {
    banner.style.display = 'flex';
    banner.style.background = '#fff7ed';
    banner.style.borderColor = '#fed7aa';
    banner.style.color = '#9a3412';
    titleEl.innerHTML = '<span class="badge badge-danger mr-2" style="font-size:11.5px; padding:4px 8px;">D-3 만료 임박</span> 나노의 책장 서비스 이용 기간이 <strong style="color:#c2410c;">3일 후</strong> 만료됩니다! (만료 예정일: 2026-09-19)';
    descEl.innerText = '만료 7일 전 및 3일 전에 원장님 휴대폰으로 알림톡이 자동 발송됩니다. 원활한 원생 학습 및 북퀴즈 서비스를 위해 이용권을 미리 연장해 주세요.';
    showAcademyToast('만료 3일 전(D-3) 알림 상태로 시뮬레이션 전환되었습니다.');
  } else if (type === 'd7') {
    banner.style.display = 'flex';
    banner.style.background = '#fefce8';
    banner.style.borderColor = '#fef08a';
    banner.style.color = '#854d0e';
    titleEl.innerHTML = '<span class="badge badge-warning text-dark mr-2" style="font-size:11.5px; padding:4px 8px;">D-7 만료 사전 안내</span> 나노의 책장 서비스 이용 기간이 <strong style="color:#a16207;">7일 후</strong> 만료됩니다. (만료 예정일: 2026-09-19)';
    descEl.innerText = '학원 정기 구독 갱신 안내 알림톡이 발송되었습니다. 미리 이용권을 연장하시면 기존 커리큘럼 및 원생 포트폴리오가 끊김 없이 보존됩니다.';
    showAcademyToast('만료 7일 전(D-7) 사전 안내 상태로 시뮬레이션 전환되었습니다.');
  } else {
    banner.style.display = 'none';
    showAcademyToast('정상 이용 상태로 변경되었습니다 (만료 안내 배너 숨김).');
  }
}

// 요금제 섹션으로 부드럽게 스크롤
function scrollToPlans() {
  var el = document.getElementById('sectionPaymentPlans');
  if (el) el.scrollIntoView({ behavior: 'smooth' });
}

// 결제 내역 섹션으로 부드럽게 스크롤
function scrollToPaymentHistory() {
  var el = document.getElementById('sectionPaymentHistory');
  if (el) el.scrollIntoView({ behavior: 'smooth' });
}

// 결제 신청 모달 열기 (선택된 요금제 Tier와 구독 기간 Period 기반)
function openCheckoutModal(periodCode) {
  var tier = planTiers[currentSelectedTier] || planTiers['standard'];
  var period = periodDefinitions[periodCode] || periodDefinitions['6month'];
  currentSelectedPeriod = periodCode;

  var currentRank = planTiers[currentAcademyPlan.tier].rank;
  var targetRank = tier.rank;

  // 공급가액, 할인액, 부가세 계산
  var originalSupply = tier.monthlyPrice * period.periodMonths;
  var discountedSupply = Math.round(originalSupply * (1 - period.discountRate));
  var periodVat = Math.round(discountedSupply * 0.1);
  var periodTotal = discountedSupply + periodVat;

  // 상위 요금제 업그레이드 시 D-3 일할 차액 계산
  var monthlyDiff = Math.max(0, tier.monthlyPrice - currentAcademyPlan.monthlyPrice);
  var proratedDiffSupply = Math.round((monthlyDiff / 30) * currentAcademyPlan.daysRemaining);
  var proratedDiffVat = Math.round(proratedDiffSupply * 0.1);
  var proratedDiffTotal = proratedDiffSupply + proratedDiffVat;

  var displayBadge = tier.name + ' (' + tier.slots + '명) · ' + period.name;
  var badgeEl = document.getElementById('checkoutPlanBadge');
  if (badgeEl) badgeEl.innerText = displayBadge;

  var typeBadgeEl = document.getElementById('checkoutChangeTypeBadge');
  var policyDescEl = document.getElementById('checkoutChangePolicyDesc');
  var supplyEl = document.getElementById('checkoutPlanSupply');
  var vatEl = document.getElementById('checkoutPlanVat');
  var totalEl = document.getElementById('checkoutPlanTotal');
  var submitBtnTextEl = document.getElementById('btnSubmitPaymentText');

  if (targetRank > currentRank) {
    // 1) 상위 요금제: 즉시 변경 & 차액 결제
    if (typeBadgeEl) {
      typeBadgeEl.className = 'badge-soft badge-soft-danger font-weight-bold';
      typeBadgeEl.innerHTML = '<i class="fa-solid fa-bolt mr-1"></i>즉시 변경 (잔여일수 차액 결제)';
    }
    if (policyDescEl) {
      policyDescEl.innerHTML = 
        '<div class="text-danger font-weight-bold mb-1"><i class="fa-solid fa-circle-check mr-1"></i>요금제 즉시 업그레이드 정책 적용</div>' +
        '• 신청 즉시 가맹 원생 정원이 <strong>' + currentAcademyPlan.slots + '명 ➔ ' + tier.slots + '명</strong>으로 즉시 확장됩니다.<br>' +
        '• 당월 남은 이용 기간(D-3)에 대한 일할 차액 <strong>' + Number(proratedDiffTotal).toLocaleString() + '원</strong>(공급가 ' + Number(proratedDiffSupply).toLocaleString() + '원 + VAT)이 포함되어 즉시 청구 및 변경됩니다.';
    }

    var finalSupply = discountedSupply + proratedDiffSupply;
    var finalVat = periodVat + proratedDiffVat;
    var finalTotal = periodTotal + proratedDiffTotal;

    if (supplyEl) supplyEl.innerHTML = Number(finalSupply).toLocaleString() + '원 <small class="text-muted">(구독료 ' + Number(discountedSupply).toLocaleString() + '원 + 차액 ' + Number(proratedDiffSupply).toLocaleString() + '원)</small>';
    if (vatEl) vatEl.innerText = Number(finalVat).toLocaleString() + '원';
    if (totalEl) totalEl.innerText = Number(finalTotal).toLocaleString() + '원';
    if (submitBtnTextEl) submitBtnTextEl.innerText = Number(finalTotal).toLocaleString() + '원 즉시 변경 결제하기';

  } else if (targetRank < currentRank) {
    // 2) 하위 요금제: 차월(다음 결제일)부터 적용 예약
    if (typeBadgeEl) {
      typeBadgeEl.className = 'badge-soft badge-soft-warn font-weight-bold';
      typeBadgeEl.innerHTML = '<i class="fa-solid fa-calendar-check mr-1"></i>차월(2026.09.20)부터 적용 예약';
    }
    if (policyDescEl) {
      policyDescEl.innerHTML = 
        '<div class="text-warning font-weight-bold mb-1" style="color: #b45309;"><i class="fa-solid fa-clock mr-1"></i>요금제 다운그레이드 차월 예약 정책</div>' +
        '• 현재 이용권 만료일(2026.09.19)까지는 <strong>스탠다드(50명 슬롯)</strong> 혜택이 정상 유지됩니다.<br>' +
        '• <strong>지금 결제되지 않으며</strong>, 차월 결제일(2026.09.20)부터 <strong>' + tier.name + '(' + tier.slots + '명)</strong> 요금제로 자동 전환 및 정산됩니다.';
    }

    if (supplyEl) supplyEl.innerHTML = Number(discountedSupply).toLocaleString() + '원 <small class="text-muted">(차월 청구 예정)</small>';
    if (vatEl) vatEl.innerHTML = Number(periodVat).toLocaleString() + '원 <small class="text-muted">(차월 청구 예정)</small>';
    if (totalEl) totalEl.innerHTML = '<span style="font-size: 15px; color: var(--text-muted); font-weight: normal;">지금 결제금액: </span><span class="text-success">0원</span> <small class="text-muted" style="font-size: 12px;">(차월 ' + Number(periodTotal).toLocaleString() + '원)</small>';
    if (submitBtnTextEl) submitBtnTextEl.innerText = tier.name + ' 차월 적용 예약하기';

  } else {
    // 3) 동일 요금제: 기간 연장
    if (typeBadgeEl) {
      typeBadgeEl.className = 'badge-soft badge-soft-success font-weight-bold';
      typeBadgeEl.innerHTML = '<i class="fa-solid fa-arrows-rotate mr-1"></i>기존 요금제 기간 연장';
    }
    if (policyDescEl) {
      policyDescEl.innerHTML = 
        '<div class="text-success font-weight-bold mb-1"><i class="fa-solid fa-circle-check mr-1"></i>현재 요금제 연장 정책</div>' +
        '• 기존 만료일(2026.09.19) 이후부터 ' + period.shortName + ' 동안 서비스 중단 없이 안전하게 자동 연장됩니다.';
    }

    if (supplyEl) supplyEl.innerText = Number(discountedSupply).toLocaleString() + '원';
    if (vatEl) vatEl.innerText = Number(periodVat).toLocaleString() + '원';
    if (totalEl) totalEl.innerText = Number(periodTotal).toLocaleString() + '원';
    if (submitBtnTextEl) submitBtnTextEl.innerText = Number(periodTotal).toLocaleString() + '원 연장 결제하기';
  }

  selectPayMethod('신용카드');

  $('#paymentCheckoutModal').modal('show');
}

// 결제 수단 선택
function selectPayMethod(method) {
  currentSelectedPayMethod = method;
  var labels = ['Card', 'Bank', 'VBank'];
  labels.forEach(function(l) {
    var el = document.getElementById('labelPayMethod' + l);
    if (el) el.classList.remove('active');
  });

  if (method === '신용카드') {
    var el = document.getElementById('labelPayMethodCard');
    if (el) el.classList.add('active');
  } else if (method === '실시간 계좌이체') {
    var el = document.getElementById('labelPayMethodBank');
    if (el) el.classList.add('active');
  } else {
    var el = document.getElementById('labelPayMethodVBank');
    if (el) el.classList.add('active');
  }
}

// 모의 결제 신청 제출 (요금제 정책 반영 시뮬레이션)
function submitSimulatedPayment() {
  var tier = planTiers[currentSelectedTier] || planTiers['standard'];
  var period = periodDefinitions[currentSelectedPeriod] || periodDefinitions['6month'];

  var agree = document.getElementById('checkoutAgreeTerms');
  if (agree && !agree.checked) {
    alert('이용약관 및 결제 취소/환불 규정에 동의하셔야 결제 신청이 가능합니다.');
    return;
  }

  var currentRank = planTiers[currentAcademyPlan.tier].rank;
  var targetRank = tier.rank;

  var now = new Date();
  var pad = function(n) { return n < 10 ? '0' + n : n; };
  var dateStr = now.getFullYear() + '-' + pad(now.getMonth() + 1) + '-' + pad(now.getDate()) + ' ' + 
                pad(now.getHours()) + ':' + pad(now.getMinutes()) + ':' + pad(now.getSeconds());

  var newId = 'PAY-' + now.getFullYear() + pad(now.getMonth() + 1) + pad(now.getDate()) + '-' + Math.floor(100 + Math.random() * 900);

  // 기본 기간 금액
  var originalSupply = tier.monthlyPrice * period.periodMonths;
  var discountedSupply = Math.round(originalSupply * (1 - period.discountRate));
  var periodVat = Math.round(discountedSupply * 0.1);
  var periodTotal = discountedSupply + periodVat;

  if (targetRank > currentRank) {
    // 1) 상위 요금제: 즉시 업그레이드 & 차액 결제
    var monthlyDiff = tier.monthlyPrice - currentAcademyPlan.monthlyPrice;
    var proratedDiffSupply = Math.round((monthlyDiff / 30) * currentAcademyPlan.daysRemaining);
    var proratedDiffVat = Math.round(proratedDiffSupply * 0.1);
    var finalSupply = discountedSupply + proratedDiffSupply;
    var finalVat = periodVat + proratedDiffVat;
    var finalTotal = finalSupply + finalVat;

    var newPayment = {
      id: newId,
      planType: tier.code + '_' + period.code,
      planName: '[' + tier.name + ' ' + tier.slots + '명] ' + period.name + ' (즉시 상향 차액결제)',
      supply: finalSupply,
      vat: finalVat,
      total: finalTotal,
      method: currentSelectedPayMethod + ' (즉시 결제)',
      date: dateStr,
      startDate: now.getFullYear() + '-' + pad(now.getMonth() + 1) + '-' + pad(now.getDate()),
      endDate: '2027-03-19',
      status: 'paid' // 즉시 승인
    };

    academyPaymentList.unshift(newPayment);
    renderAcademyPaymentTable(academyPaymentList);

    // 학원 현재 상태 즉시 업그레이드 반영 (원생 정원 확장 피드백)
    currentAcademyPlan.tier = tier.code;
    currentAcademyPlan.name = tier.name;
    currentAcademyPlan.slots = tier.slots;
    currentAcademyPlan.monthlyPrice = tier.monthlyPrice;

    // 상단 UI 슬롯 통계 카드 즉시 갱신
    var slotStat = document.querySelector('.col-md-4 .stat-num');
    if (slotStat) {
      var usagePercent = Math.round((48 / tier.slots) * 100);
      slotStat.innerHTML = '48 <small class="text-muted font-weight-normal" style="font-size: 14px;">/ ' + tier.slots + '명</small>' +
                           '<span class="badge-soft badge-soft-success ml-2" style="font-size: 11px; vertical-align: middle;">' + usagePercent + '% 사용</span>';
    }
    var slotRem = document.querySelector('.col-md-4 .border-top span strong');
    if (slotRem) {
      slotRem.innerText = (tier.slots - 48) + '명';
    }

    // 모달 닫기
    $('#paymentCheckoutModal').modal('hide');

    showAcademyToast('🎉 [' + tier.name + ' ' + tier.slots + '명] 즉시 변경 완료! 정원이 ' + tier.slots + '명으로 확장되었습니다.');
    alert('⚡ 요금제 즉시 변경 완료!\n\n' +
          '- 변경 요금제: ' + tier.name + ' (' + tier.slots + '명 슬롯)\n' +
          '- 적용 방식: 즉시 변경 적용 (당월 잔여 D-3 차액 결제 완료)\n' +
          '- 총 결제 금액: ' + Number(finalTotal).toLocaleString() + '원 (차액 ' + Number(proratedDiffSupply + proratedDiffVat).toLocaleString() + '원 포함)\n\n' +
          '원생 가맹 정원이 ' + tier.slots + '명으로 즉시 확장되어 추가 원생 등록이 가능합니다!');

    // 요금제 뷰 다시 갱신
    selectPlanTier(tier.code);

  } else if (targetRank < currentRank) {
    // 2) 하위 요금제: 차월 적용 예약
    var newPayment = {
      id: newId,
      planType: tier.code + '_' + period.code,
      planName: '[' + tier.name + ' ' + tier.slots + '명] ' + period.name + ' (차월 2026.09.20 변경 예약)',
      supply: discountedSupply,
      vat: periodVat,
      total: periodTotal,
      method: currentSelectedPayMethod + ' (차월 자동결제 예약)',
      date: dateStr,
      startDate: '2026-09-20',
      endDate: '2027-03-20',
      status: 'pending' // 차월 대기
    };

    academyPaymentList.unshift(newPayment);
    renderAcademyPaymentTable(academyPaymentList);

    // 모달 닫기
    $('#paymentCheckoutModal').modal('hide');

    showAcademyToast('📅 [' + tier.name + ' ' + tier.slots + '명] 차월(2026.09.20) 적용 예약이 완료되었습니다.');
    alert('📅 요금제 차월 적용 예약 완료!\n\n' +
          '- 예약 요금제: ' + tier.name + ' (' + tier.slots + '명 슬롯)\n' +
          '- 적용 시작일: 2026-09-20 (차월 결제일)\n' +
          '- 예정 결제액: ' + Number(periodTotal).toLocaleString() + '원 (VAT 포함)\n\n' +
          '현재 이용 중인 스탠다드(50명 슬롯) 혜택은 만료일(2026.09.19)까지 유지되며, 차월 결제일부터 베이직 요금제로 자동 전환됩니다.');

  } else {
    // 3) 동일 요금제 연장
    var newPayment = {
      id: newId,
      planType: tier.code + '_' + period.code,
      planName: '[' + tier.name + '] ' + period.name + ' (서비스 연장)',
      supply: discountedSupply,
      vat: periodVat,
      total: periodTotal,
      method: currentSelectedPayMethod,
      date: dateStr,
      startDate: '2026-09-20',
      endDate: '2027-03-20',
      status: 'paid'
    };

    academyPaymentList.unshift(newPayment);
    renderAcademyPaymentTable(academyPaymentList);

    // 모달 닫기
    $('#paymentCheckoutModal').modal('hide');

    showAcademyToast('✅ 서비스 이용 기간 연장 신청이 완료되었습니다.');
    alert('✅ 서비스 연장 완료!\n\n' +
          '- 연장 상품: ' + tier.name + ' · ' + period.name + '\n' +
          '- 결제 금액: ' + Number(periodTotal).toLocaleString() + '원\n\n' +
          '만료 예정일 이후부터 끊김 없이 서비스가 자동 연장됩니다.');
  }

  // 결제 내역으로 스크롤 이동
  setTimeout(function() {
    scrollToPaymentHistory();
  }, 300);
}

// 영수증 모의 팝업
function viewPaymentReceipt(payId) {
  var item = academyPaymentList.find(function(p) { return p.id === payId; });
  if (!item) return;

  alert('🧾 [전자 결제 영수증 / 매출전표]\n\n' +
        '· 승인번호: ' + item.id + '\n' +
        '· 학원명: 나노 독서아카데미 본원 (대표: 김은영)\n' +
        '· 결제일시: ' + item.date + '\n' +
        '· 상품명: ' + item.planName + '\n' +
        '· 공급가액: ' + Number(item.supply).toLocaleString() + '원\n' +
        '· 부가가치세: ' + Number(item.vat).toLocaleString() + '원\n' +
        '· 합계금액: ' + Number(item.total).toLocaleString() + '원\n' +
        '· 결제수단: ' + item.method + '\n' +
        '· 결제상태: 정상 승인 (VAT 매입세액공제 가능)');
}


