
var STORAGE_KEY_WORKSHEET_STORE = 'NANO_WORKSHEET_STORE_v2';
function saveWorksheetStore(logId, aiResult, photos) {
  if (!logId) return;
  try {
    var raw = localStorage.getItem(STORAGE_KEY_WORKSHEET_STORE);
    var store = raw ? JSON.parse(raw) : {};
    store[logId] = store[logId] || {};
    if (aiResult !== undefined) store[logId].aiResult = aiResult;
    if (Array.isArray(photos)) {
      store[logId].photos = photos.slice(0, 3);
    }
    localStorage.setItem(STORAGE_KEY_WORKSHEET_STORE, JSON.stringify(store));
  } catch(e) {
    console.warn('[saveWorksheetStore] 로컬 백업 저장 예외:', e);
  }
}
function getWorksheetStore(logId) {
  if (!logId) return null;
  try {
    var raw = localStorage.getItem(STORAGE_KEY_WORKSHEET_STORE);
    var store = raw ? JSON.parse(raw) : {};
    return store[logId] || null;
  } catch(e) { return null; }
}


// [새로고침 시 머무르던 탭 유지] URL 해시 또는 세션 스토리지에서 활성 탭 복원
function restoreAdminActiveTab() {
  var validTabs = ['members', 'contents', 'learning', 'literacy', 'portfolio', 'assignment', 'notice', 'dispatch', 'ranking', 'payment'];
  var hash = (window.location.hash || '').replace('#', '').trim();
  var saved = '';
  try { saved = sessionStorage.getItem('nano_admin_active_tab') || ''; } catch(e) {}
  var target = (validTabs.indexOf(hash) >= 0) ? hash : (validTabs.indexOf(saved) >= 0 ? saved : 'members');
  switchTab(target);
}
window.addEventListener('hashchange', function() {
  var validTabs = ['members', 'contents', 'learning', 'literacy', 'portfolio', 'assignment', 'notice', 'dispatch', 'ranking', 'payment'];
  var hash = (window.location.hash || '').replace('#', '').trim();
  if (validTabs.indexOf(hash) >= 0) {
    switchTab(hash);
  }
});

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
  var views = ['members', 'contents', 'learning', 'literacy', 'portfolio', 'assignment', 'notice', 'dispatch', 'ranking', 'payment'];
  if (views.indexOf(tab) < 0) tab = 'members';
  // 저장소가 차단되어도 URL에는 현재 메뉴를 남깁니다.
  try { sessionStorage.setItem('nano_admin_active_tab', tab); } catch (e) {}
  try {
    if (window.location.hash !== '#' + tab) {
      history.replaceState(null, '', '#' + tab);
    }
  } catch (e) {}
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

  if (tab === 'members') {
    var sInput = document.getElementById('searchStudentInput');
    if (sInput) sInput.value = '';
    var sClear = document.getElementById('btnStudentSearchClear');
    if (sClear) sClear.style.display = 'none';
    var sBadge = document.getElementById('studentSearchActiveBadge');
    if (sBadge) { sBadge.style.display = 'none'; sBadge.innerHTML = ''; }
    var cFilter = document.getElementById('filterStudentClass');
    if (cFilter) cFilter.value = 'ALL';
    var stFilter = document.getElementById('filterStudentStatus');
    if (stFilter) stFilter.value = 'ALL';
    studentCurrentPage = 1;
    if (typeof filterStudents === 'function') filterStudents();
    else if (typeof renderStudentTable === 'function') renderStudentTable();
  }
  if (tab === 'contents') {
    var bInput = document.getElementById('searchAcadBookInput');
    if (bInput) bInput.value = '';
    var bClear = document.getElementById('btnAcadBookSearchClear');
    if (bClear) bClear.style.display = 'none';
    var bBadge = document.getElementById('acadBookSearchActiveBadge');
    if (bBadge) { bBadge.style.display = 'none'; bBadge.innerHTML = ''; }
    var gFilter = document.getElementById('filterAcadBookGrade');
    if (gFilter) gFilter.value = 'ALL';
    var oFilter = document.getElementById('filterAcadBookOrigin');
    if (oFilter) oFilter.value = 'ALL';
    academyBookCurrentPage = 1;
    if (typeof syncAcademyBooksState === 'function') syncAcademyBooksState();
    if (typeof filterAcademyBooks === 'function') filterAcademyBooks(false);
  }
  if (tab === 'notice') {
    if (typeof markAcademyNoticesAsRead === 'function') markAcademyNoticesAsRead();
    renderAcademyNoticeViewList();
  }
  if (tab === 'learning') {
    var lInput = document.getElementById('learningSearchInput');
    if (lInput) lInput.value = '';
    var lClear = document.getElementById('btnLearningSearchClear');
    if (lClear) lClear.style.display = 'none';
    var lBadge = document.getElementById('learningSearchActiveBadge');
    if (lBadge) { lBadge.style.display = 'none'; lBadge.innerHTML = ''; }
    var lStartDate = document.getElementById('learningStartDate');
    if (lStartDate) lStartDate.value = '';
    var lEndDate = document.getElementById('learningEndDate');
    if (lEndDate) lEndDate.value = '';
    renderLearningTable();
  }
  if (tab === 'literacy') {
    if (window.NanoLiteracyAdmin) NanoLiteracyAdmin.show();
    else if (targetView) targetView.innerHTML = '<div class="simple-card p-4" role="alert">문해력 진단 화면을 불러오지 못했습니다. 페이지를 새로고침해 주세요.</div>';
  }
  if (tab === 'portfolio') {
    var pfInput = document.getElementById('searchPortfolioInput');
    if (pfInput) pfInput.value = '';
    var pfClear = document.getElementById('btnPortfolioSearchClear');
    if (pfClear) pfClear.style.display = 'none';
    var pfBadge = document.getElementById('portfolioSearchActiveBadge');
    if (pfBadge) { pfBadge.style.display = 'none'; pfBadge.innerHTML = ''; }
    var pfClass = document.getElementById('filterPortfolioClass');
    if (pfClass) pfClass.value = 'ALL';
    showPortfolioList();
    if (typeof filterPortfolioList === 'function') filterPortfolioList();
    else renderPortfolioTable(portfolioList);
  }
  if (tab === 'assignment') {
    var asInput = document.getElementById('searchAssignStudentInput');
    if (asInput) asInput.value = '';
    var asClass = document.getElementById('filterAssignStudentClass');
    if (asClass) asClass.value = 'ALL';
    assignStudentCurrentPage = 1;
    renderAssignmentTable();
  }
  if (tab === 'dispatch') renderAcademyDispatchTable();
  if (tab === 'ranking') renderAdminRankingView();
  if (tab === 'payment') {
    if (window.NanoBilling && window.NanoPortal?.remote) NanoBilling.load();
    if (typeof syncCurrentAcademyPlan === 'function') syncCurrentAcademyPlan(false);
    renderAcademyPaymentTable();
    selectPlanTier(currentSelectedTier || (typeof currentAcademyPlan !== 'undefined' && currentAcademyPlan.tier ? currentAcademyPlan.tier : 'standard'));
  }

  if (typeof clearAdminSearchAutofill === 'function') {
    clearAdminSearchAutofill();
  }

  var mainEl = document.querySelector('.main-workspace');
  if (mainEl) mainEl.scrollTop = 0;
  window.scrollTo(0, 0);
}

// 상단 좌측 로고 클릭 시 페이지 전체 새로고침 없이 즉각 홈(회원 관리)으로 이동
function goHomeTab(e) {
  if (e) {
    e.preventDefault();
    e.stopPropagation();
  }
  switchTab('members');
  if (typeof switchStudentSubTab === 'function') {
    switchStudentSubTab('students');
  }
  var searchInput = document.getElementById('searchStudentInput');
  if (searchInput) searchInput.value = '';
  var classFilter = document.getElementById('filterClassSelect');
  if (classFilter) classFilter.value = 'all';
  if (typeof filterStudents === 'function') {
    filterStudents();
  }
  var mainEl = document.querySelector('.main-workspace');
  if (mainEl) mainEl.scrollTop = 0;
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
  var mainEl = document.querySelector('.main-workspace');
  if (mainEl) mainEl.scrollTop = 0;
  window.scrollTo(0, 0);
}

// 현재 로그인된 세션 사용자 정보 조회 헬퍼
function getCurrentAuthUser() {
  try {
    var raw = sessionStorage.getItem('nano_auth_user');
    if (raw) {
      var obj = JSON.parse(raw);
      if (obj && typeof obj === 'object') return obj;
    }
  } catch(e) {}
  if (window.NanoPortal && typeof window.NanoPortal.user === 'function') {
    try {
      var pUser = window.NanoPortal.user();
      if (pUser) return pUser;
    } catch(e) {}
  }
  return null;
}

// 현재 로그인 계정이 선생님(지도교사)인지 판별
function isCurrentLoggedInTeacher() {
  var u = getCurrentAuthUser();
  if (!u) return false;
  var role = String(u.role || '').toLowerCase();
  if (role === 'teacher' || role === 'staff') return true;
  var id = String(u.id || u.username || '').toLowerCase();
  if (id.includes('teacher') || id.startsWith('t_') || id.startsWith('teach_')) return true;
  return false;
}

// 선생님 계정이 담당으로 지정되어 있는 학급 목록 반환 (원장/관리자는 전체 학급 반환)
function getTeacherAssignedClasses() {
  if (!isCurrentLoggedInTeacher()) {
    return Array.isArray(academyClassList) ? academyClassList : [];
  }
  var auth = getCurrentAuthUser();
  if (!auth) return [];

  var tName = String(auth.name || '').trim();
  var tId = String(auth.id || auth.username || '').toLowerCase().trim();

  var tList = (typeof teacherDataList !== 'undefined' && Array.isArray(teacherDataList)) ? teacherDataList : loadTeachersFromStorage();
  var foundT = tList.find(function(t) {
    return (t.id && String(t.id).toLowerCase() === tId) ||
           (t.username && String(t.username).toLowerCase() === tId) ||
           (tName && t.name === tName);
  });

  var validNames = [];
  if (tName) validNames.push(tName);
  if (foundT && foundT.name) validNames.push(foundT.name);
  if (auth.id) validNames.push(String(auth.id));
  if (foundT && foundT.id) validNames.push(String(foundT.id));

  var teacherClasses = [];
  if (foundT && foundT.classes) {
    if (Array.isArray(foundT.classes)) {
      teacherClasses = foundT.classes.slice();
    } else if (typeof foundT.classes === 'string') {
      teacherClasses = foundT.classes.split(',').map(function(s) { return s.trim(); });
    }
  }

  var assigned = [];
  var seen = {};

  (academyClassList || []).forEach(function(cls) {
    if (!cls || !cls.name || seen[cls.name]) return;
    var isMatch = false;

    // 1. cls.teacher에 담당교사 이름/ID 매칭
    if (cls.teacher) {
      var ct = String(cls.teacher).trim();
      if (validNames.some(function(vn) { return vn && (ct === vn || ct.includes(vn) || vn.includes(ct)); })) {
        isMatch = true;
      }
    }

    // 2. 선생님의 담당 학급 목록(classes)에 명시된 경우
    if (!isMatch && teacherClasses.some(function(tc) { return tc && tc === cls.name; })) {
      isMatch = true;
    }

    if (isMatch) {
      seen[cls.name] = true;
      assigned.push(cls);
    }
  });

  // 3. 만약 위 매칭에서 0개인 경우, 원생 데이터에서 해당 선생님 이름이 들어간 학급 확인
  if (assigned.length === 0 && Array.isArray(studentDataList)) {
    studentDataList.forEach(function(s) {
      if (s.teacher && validNames.some(function(vn) { return vn && (s.teacher === vn || s.teacher.includes(vn)); })) {
        if (s.classGroup && s.classGroup !== '-' && s.classGroup !== '미지정' && !seen[s.classGroup]) {
          var matchedCls = (academyClassList || []).find(function(c) { return c.name === s.classGroup; }) || { id: s.classGroup, name: s.classGroup, grade: s.grade || '', teacher: tName || '지도교사' };
          seen[s.classGroup] = true;
          assigned.push(matchedCls);
        }
      }
    });
  }

  // 4. 데모 또는 단일 학급 시스템에서 cls.teacher가 '지도교사'이거나 기본 학급인 경우 fallback
  if (assigned.length === 0 && (academyClassList || []).length > 0) {
    var fallback = (academyClassList || []).filter(function(cls) {
      return cls.teacher === '지도교사' || !cls.teacher;
    });
    if (fallback.length > 0) {
      assigned = fallback;
    } else {
      assigned = [academyClassList[0]];
    }
  }

  return assigned;
}

// 상단 헤더 사용자 정보 및 권한별 메뉴 가시성 갱신
function updateHeaderUserInfo() {
  var auth = getCurrentAuthUser();
  var dirNameEl = document.getElementById('headerDirectorName');
  var acadNameEl = document.getElementById('headerAcademyName');
  var roleBadgeEl = document.getElementById('headerUserRoleBadge');
  var btnMemberTeachers = document.getElementById('btn-member-teachers');
  var navMembersSmall = document.querySelector('#btn-nav-members small');
  var btnOpenClassManage = document.getElementById('btnOpenClassManageModal');
  var btnOpenDeletedStudents = document.getElementById('btnOpenDeletedStudentsModal');
  var btnModalClassManage = document.getElementById('btnModalClassManageWrapper') || document.getElementById('btnModalClassManage');

  var isTeacher = isCurrentLoggedInTeacher();

  // 1. 우측 상단 헤더 역할 배지 및 이름 갱신
  if (isTeacher) {
    // 선생님 계정으로 로그인한 경우: [선생님] ㅇㅇㅇ 선생님
    if (roleBadgeEl) {
      roleBadgeEl.className = 'badge-soft mr-2';
      roleBadgeEl.style.cssText = 'font-size: 11px; padding: 3px 8px; border-radius: 6px; background: #e0f2fe; color: #0369a1; border: 1px solid #bae6fd; font-weight: 700;';
      roleBadgeEl.innerHTML = '<i class="fa-solid fa-chalkboard-user mr-1"></i>선생님';
    }

    if (dirNameEl) {
      var teacherName = '';
      if (auth && auth.name) {
        teacherName = auth.name;
      } else if (auth && auth.id) {
        try {
          var tList = loadTeachersFromStorage();
          var foundT = tList.find(function(t) { return String(t.id || t.username).toLowerCase() === String(auth.id).toLowerCase(); });
          teacherName = foundT ? foundT.name : auth.id;
        } catch(e) {
          teacherName = auth.id;
        }
      } else {
        teacherName = '지도교사';
      }

      var formattedName = teacherName.includes('선생님') ? teacherName : (teacherName + ' 선생님');
      dirNameEl.innerText = formattedName;
    }

    // 2. 회원 관리에서 '선생님 관리' 메뉴 완전 숨김 처리
    if (btnMemberTeachers) {
      btnMemberTeachers.style.display = 'none';
    }
    if (navMembersSmall) {
      navMembersSmall.innerText = '(원생 관리)';
    }

    // [권한 설정 1 & 2] 선생님 계정은 학생 계정 삭제 및 학급 생성/삭제 불가 -> 버튼 숨김
    if (btnOpenClassManage) {
      btnOpenClassManage.style.display = 'none';
    }
    if (btnOpenDeletedStudents) {
      btnOpenDeletedStudents.style.display = 'none';
    }
    if (btnModalClassManage) {
      btnModalClassManage.style.display = 'none';
    }

    // 만약 현재 탭이 선생님 관리로 열려있다면 원생 관리 탭으로 강제 전환
    var teacherSubBox = document.getElementById('member-sub-teachers');
    if (teacherSubBox && teacherSubBox.style.display !== 'none') {
      switchMemberSubTab('students');
    }
  } else {
    // 원장님 / 관리자 계정으로 로그인한 경우: [원장님] ㅇㅇㅇ 원장님
    if (roleBadgeEl) {
      roleBadgeEl.className = 'badge-soft badge-soft-master mr-2';
      roleBadgeEl.style.cssText = 'font-size: 11px; padding: 3px 8px; border-radius: 6px;';
      roleBadgeEl.innerHTML = '<i class="fa-solid fa-user-check mr-1"></i>원장님';
    }

    if (dirNameEl && currentAcademyInfo.director) {
      var dTitle = currentAcademyInfo.director.includes('원장') ? currentAcademyInfo.director : (currentAcademyInfo.director + ' 원장님');
      dirNameEl.innerText = dTitle;
    }

    if (btnMemberTeachers) {
      btnMemberTeachers.style.display = '';
    }
    if (navMembersSmall) {
      navMembersSmall.innerText = '(선생님/원생)';
    }

    if (btnOpenClassManage) {
      btnOpenClassManage.style.display = '';
    }
    if (btnOpenDeletedStudents) {
      btnOpenDeletedStudents.style.display = '';
    }
    if (btnModalClassManage) {
      btnModalClassManage.style.display = '';
    }
  }

  // 학원명 갱신
  if (acadNameEl && currentAcademyInfo.name) {
    acadNameEl.innerText = currentAcademyInfo.name;
  }
}

// 회원 관리 내부 서브탭 전환 (원생 관리 / 선생님 관리)
function switchMemberSubTab(sub) {
  // 선생님 계정인 경우 선생님 관리 메뉴 접근 불가 (원생 관리 고정)
  if (sub === 'teachers' && isCurrentLoggedInTeacher()) {
    sub = 'students';
    showAcademyToast('선생님 관리는 원장님 전용 권한 메뉴입니다.');
  }

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
  if (sub === 'students') filterStudents(true);
  var mainEl = document.querySelector('.main-workspace');
  if (mainEl) mainEl.scrollTop = 0;
  window.scrollTo(0, 0);
}

// ============================================================== 
// 3. 회원 관리 (원생 + 선생님 + 학급) 모듈
// -> public_html/js/admin_members.js 로 분리 완료
// ==============================================================
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
    reviewed: '첨삭 전',
    sheetAnswer: '사막여우와의 만남에서 여우가 "네 장미꽃이 그토록 소중한 것은 그 꽃을 위해 네가 들인 시간 때문이야"라고 말한 구절이 가장 마음에 와닿았습니다. 길들인다는 것은 서로에게 세상에서 유일한 존재가 되고 끝까지 책임을 지는 관계를 뜻한다고 생각합니다. 저도 친구들과의 우정을 위해 더 진심을 다하고 정성을 쏟아야겠다고 다짐했습니다.',
    comment: '',
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
    reviewed: '첨삭 전',
    sheetAnswer: '잎싹이 알을 낳지 못해 양계장에 갇혀 살다가 스스로 마당 밖으로 뛰쳐나오는 용기가 대단했습니다. 초록머리를 자식처럼 돌보며 모성애를 발휘하는 장면에서 가슴이 뭉클했습니다.',
    comment: '',
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
    reviewed: '첨삭 전',
    sheetAnswer: '수남이가 신사에게 모욕을 당하고 얼떨결에 자전거를 들고 도망쳤을 때, 주위 사람들이 "잘했다"고 칭찬하자 양심의 가책을 느끼는 모습이 인상 깊었습니다. 부끄러움을 잃어버리는 것이 진짜 도둑이라는 생각이 들었습니다.',
    comment: '',
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
    reviewed: '첨삭 전',
    sheetAnswer: '편도체가 작아 감정을 느끼지 못하는 윤재가 곤이를 만나며 분노와 슬픔, 그리고 타인의 고통을 이해해 나가는 과정이 인상적이었습니다. 공감이란 타고나는 것이 아니라 서로를 이해하려는 노력이라는 점을 배웠습니다.',
    comment: '',
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
    reviewed: '첨삭 전',
    sheetAnswer: '어른들이 숫자로만 사람을 판단한다는 구절을 읽고 공감이 갔습니다. 진정한 가치는 겉모습이나 숫자가 아니라 마음의 눈으로 서로를 바라보는 데 있다는 것을 항상 기억하겠습니다.',
    comment: '',
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
    reviewed: '첨삭 전',
    sheetAnswer: '만복이가 나쁜 말을 할 때마다 입이 굳어지는 떡을 먹고 착한 말과 칭찬을 배우는 과정이 재미있었습니다. 저도 앞으로 친구들에게 예쁜 말만 쓰겠습니다.',
    comment: '',
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

// ==============================================================
// 3. 학습 관리 및 리포트 연동 모듈
// ==============================================================
function getLearningAcademyId() {
  // 화면에서 선택한 학원을 우선합니다. 다른 학원의 대표 기록으로 대체하지 않습니다.
  return currentAcademyInfo && currentAcademyInfo.id ? currentAcademyInfo.id : '';
}

function getLoadedLearningLogs() {
  if (window.NanoPortal && NanoPortal.remote) {
    var remoteLogs = JSON.parse(JSON.stringify(NanoPortal.logs() || []));
    remoteLogs.forEach(function(l) {
      if (!l.sheet || (l.sheet !== '작성 완료' && l.sheet !== '작성 전')) {
        l.sheet = '작성 전';
      }
    });
    return remoteLogs;
  }
  try {
    var logs = window.NanoLearningStore.read(getLearningAcademyId(), window.MIGRATED_LEARNING_LOGS);
    logs.forEach(function(l) {
      // 나노 시트는 기본적으로 '작성 전'이 디폴트값 (교사가 직접 완료 처리하지 않은 신규 퀴즈 응시 건)
      if (!l.manualSheetDone && (!l.reviewed || l.reviewed === '대기' || l.reviewed === '첨삭 전')) {
        l.sheet = '작성 전';
      }
      if (!l.sheet || (l.sheet !== '작성 완료' && l.sheet !== '작성 전')) {
        l.sheet = '작성 전';
      }
    });
    logs.sort(function(a, b) {
      return (b.submittedAt || b.date || '').localeCompare(a.submittedAt || a.date || '');
    });
    return logs;
  } catch(e) {
    console.error('학습 기록 조회 실패:', e);
    showAcademyToast('학습 기록을 불러오지 못했습니다. 저장소 상태를 확인해 주세요.');
    return [];
  }
}

async function saveCustomLearningLogs(logs) {
  if (window.NanoPortal && NanoPortal.remote) {
    if (window.nanoReviewSaving) { showAcademyToast('이전 첨삭을 저장 중입니다. 잠시 후 다시 저장해 주세요.'); return false; }
    var before = NanoPortal.logs() || [];
    var changes = logs.filter(function(log) { var old = before.find(function(item) { return item.id === log.id; }); return old && JSON.stringify(old) !== JSON.stringify(log); });
    window.nanoReviewSaving = true;
    try {
      for (var log of changes) {
        var response = await NanoPortal.request('review', { id: log.id, comment: log.comment || '', reviewed: log.reviewed || '접수', sheet: log.sheet || '작성 전', thoughtHidden: log.thoughtHidden === true, worksheetAiResult: log.worksheetAiResult, worksheetPhotos: log.worksheetPhotos, reviewRevision: log.reviewRevision || '' });
        log.reviewRevision = response.reviewRevision; NanoPortal.applyReview(log);
        saveWorksheetStore(log.id, log.worksheetAiResult, log.worksheetPhotos);
      }
      return true;
    } catch(e) { showAcademyToast('첨삭 저장 실패: ' + e.message); return false; }
    finally { window.nanoReviewSaving = false; }
  }
  try {
    window.NanoLearningStore.save(getLearningAcademyId(), logs);
    logs.forEach(function(log) { saveWorksheetStore(log.id, log.worksheetAiResult, log.worksheetPhotos); });
    return true;
  } catch(e) {
    console.error('학습 기록 저장 실패:', e);
    showAcademyToast('학습 기록을 저장하지 못했습니다. 내용을 유지한 상태로 다시 시도해 주세요.');
    return false;
  }
}

// 같은 브라우저의 학생 탭에서 저장한 기록을 학원 화면에도 갱신합니다.
window.addEventListener('storage', function(event) {
  var academyId = getLearningAcademyId();
  if (academyId && event.key === window.NanoLearningStore.getKey(academyId)) {
    renderLearningTable();
  }
});

async function toggleNanoSheetStatus(logId) {
  var allLogs = getLoadedLearningLogs();
  var log = allLogs.find(function(l) { return l.id === logId; });
  if (!log) {
    log = learningLogs.find(function(l) { return l.id === logId; });
  }
  if (log) {
    var nextSheet = (log.sheet === '작성 완료') ? '작성 전' : '작성 완료';
    log.sheet = nextSheet;
    log.manualSheetDone = (nextSheet === '작성 완료');
    if (!await saveCustomLearningLogs(allLogs)) return;
    renderLearningTable();
    showAcademyToast(`[${(log.studentName || log.name)}] 나노 시트 상태가 [${log.sheet}]로 변경되었습니다.`);
  }
}

var currentOpenCorrectionLogId = null;

// 학습 관리 날짜 필터 초기화 (Default: 최근 90일 ~ 오늘 날짜 기본 세팅하여 이전 달 및 이관 학습내역 즉시 노출)
function initLearningDateFilters() {
  var startInput = document.getElementById('learningStartDate');
  var endInput = document.getElementById('learningEndDate');
  if (!startInput || !endInput) return;

  var now = new Date();
  var yyyy = now.getFullYear();
  var mm = String(now.getMonth() + 1).padStart(2, '0');
  var dd = String(now.getDate()).padStart(2, '0');
  var todayStr = `${yyyy}-${mm}-${dd}`;

  var past90 = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
  var sY = past90.getFullYear();
  var sM = String(past90.getMonth() + 1).padStart(2, '0');
  var sD = String(past90.getDate()).padStart(2, '0');
  var defaultStartStr = `${sY}-${sM}-${sD}`;

  if (!startInput.value) startInput.value = defaultStartStr;
  if (!endInput.value) endInput.value = todayStr;
}

// 학습 관리 검색 입력 핸들러
function handleLearningSearchInput(input) {
  var clearBtn = document.getElementById("btnLearningSearchClear");
  if (clearBtn) {
    clearBtn.style.display = (input && input.value.trim().length > 0) ? "inline-flex" : "none";
  }
}

// 학습 관리 검색어 원클릭 클리어
function clearLearningSearch() {
  var input = document.getElementById("learningSearchInput");
  if (input) input.value = "";
  var clearBtn = document.getElementById("btnLearningSearchClear");
  if (clearBtn) clearBtn.style.display = "none";
  var badgeEl = document.getElementById("learningSearchActiveBadge");
  if (badgeEl) { badgeEl.style.display = "none"; badgeEl.innerHTML = ""; }
  renderLearningTable();
}

// 학습 관리 '조회' 버튼 실행 (날짜 범위 체크: 최대 6개월)
function executeLearningSearch() {
  var startInput = document.getElementById('learningStartDate');
  var endInput = document.getElementById('learningEndDate');

  if (startInput && endInput && startInput.value && endInput.value) {
    var startDate = new Date(startInput.value);
    var endDate = new Date(endInput.value);

    if (startDate > endDate) {
      alert('시작일은 종료일보다 이전이어야 합니다.');
      return;
    }

    var diffDays = Math.round((endDate - startDate) / (1000 * 60 * 60 * 24));
    if (diffDays > 186) { // 약 6개월
      alert('조회 기간은 최대 6개월까지만 가능합니다.');
      return;
    }
  }

  renderLearningTable();
}

// 첨삭 결과는 원본과 분리된 편집본으로 다뤄 저장 실패 시에도 입력을 유지합니다.
var currentWorksheetCorrectionDone = false;
var currentWorksheetReviewRevision = '';
var worksheetCorrectionSaving = false;
var worksheetAnalysisJobs = new Set();
var worksheetEditableFields = [
  ['summary', '한 줄 관찰', 2],
  ['drawingObservation', '그림 표현 관찰', 3],
  ['languageHandwritingNote', '글과 표현 방식 관찰', 3],
  ['nextStep', '다음 성장 방향', 4],
  ['parentGuide', '가정 대화 팁', 4],
  ['teacherCommentDraft', '지도교사 종합 첨삭 코멘트', 4]
];

function worksheetEditorField(id, label, value, rows) {
  return '<div class="form-group mb-3"><label class="font-weight-bold" for="' + id + '" style="font-size:13px;">' + escapePortfolioText(label) + '</label>' +
    '<textarea id="' + id + '" class="form-control form-control-beige" rows="' + rows + '" maxlength="5000" style="font-size:13px;line-height:1.7;resize:vertical;">' + escapePortfolioText(value || '') + '</textarea></div>';
}

function renderWorksheetCorrectionEditor() {
  var result = currentWorksheetAiResult || {};
  var html = worksheetEditorField('worksheetEdit-summary', '한 줄 관찰', result.summary, 2);
  var quotes = Array.isArray(result.actualQuotes) ? result.actualQuotes : [];
  html += quotes.map(function(q, i) {
    return '<fieldset class="border rounded p-3 mb-3"><legend class="w-auto px-2 font-weight-bold" style="font-size:13px;">표현 관찰 ' + (i + 1) + '</legend>' +
      worksheetEditorField('worksheetQuote-' + i + '-quote', '아이의 표현 · 인용문', q.quote, 2) +
      worksheetEditorField('worksheetQuote-' + i + '-criteria', '관찰 영역', q.criteria, 1) +
      worksheetEditorField('worksheetQuote-' + i + '-comment', '관찰 내용', q.comment, 3) + '</fieldset>';
  }).join('');
  worksheetEditableFields.slice(1).forEach(function(field) {
    var growth = field[0] === 'nextStep' || field[0] === 'parentGuide';
    var isTeacherDraft = field[0] === 'teacherCommentDraft';
    var boxStyle = growth
      ? ' style="background:#f0f8f6;border:1px solid #bddbd4;"'
      : (isTeacherDraft ? ' style="background:#fffdf7;border:1px solid #e6d7be;"' : '');
    var guideText = field[0] === 'nextStep'
      ? '다음 독서에서 시도할 작은 활동과 구체적인 실천 방법을 안내해 주세요.'
      : (field[0] === 'parentGuide'
        ? '아이의 표현을 바탕으로 칭찬 한마디와 함께 나눌 열린 질문을 적어 주세요.'
        : (isTeacherDraft ? '학습리포트 및 학부모 알림톡에 수록되는 지도교사 종합 첨삭 코멘트입니다.' : ''));
    html += '<div class="' + ((growth || isTeacherDraft) ? 'p-3 mb-3 rounded' : '') + '"' + boxStyle + '>' +
      (guideText ? '<p class="text-muted mb-2" style="font-size:12px;">' + guideText + '</p>' : '') +
      worksheetEditorField('worksheetEdit-' + field[0], field[1], result[field[0]], field[2]) + '</div>';
  });
  document.getElementById('worksheetAiEditor').innerHTML = html;
}

function readWorksheetCorrectionEditor() {
  var result = JSON.parse(JSON.stringify(currentWorksheetAiResult || {}));
  worksheetEditableFields.forEach(function(field) {
    var el = document.getElementById('worksheetEdit-' + field[0]);
    if (el) result[field[0]] = el.value.trim();
  });
  result.actualQuotes = (Array.isArray(result.actualQuotes) ? result.actualQuotes : []).map(function(q, i) {
    var edited = Object.assign({}, q);
    ['quote', 'criteria', 'comment'].forEach(function(key) {
      var qEl = document.getElementById('worksheetQuote-' + i + '-' + key);
      if (qEl) edited[key] = qEl.value.trim();
    });
    return edited;
  });
  return result;
}

function syncWorksheetCorrectionActions() {
  var done = currentWorksheetCorrectionDone;
  var processing = worksheetAnalysisJobs.has(currentOpenCorrectionLogId);
  document.getElementById('worksheetUploadSection').style.display = done ? 'none' : 'block';
  document.getElementById('worksheetAiResultCard').style.display = done ? 'block' : 'none';
  var run = document.getElementById('btnRunWorksheetAi');
  run.style.display = done ? 'none' : 'inline-block';
  run.disabled = processing || worksheetCorrectionSaving || !currentWorksheetPhotos.length;
  run.textContent = processing ? '첨삭 중…' : '나노 시트 첨삭 실행';
  ['btnSaveWorksheetCorrection', 'btnDeleteWorksheetCorrection'].forEach(function(id) {
    var button = document.getElementById(id);
    button.style.display = done ? 'inline-block' : 'none';
    button.disabled = worksheetCorrectionSaving || processing;
  });
}

// 첨삭 모달 열기
function openCorrectionModal(logId) {
  var log = getLoadedLearningLogs().find(function(l) { return l.id === logId; });
  if (!log) return;
  currentOpenCorrectionLogId = logId;
  currentWorksheetReviewRevision = log.reviewRevision || '';
  currentWorksheetPhotos = Array.isArray(log.worksheetPhotos) ? log.worksheetPhotos.slice() : [];
  currentWorksheetAiResult = log.worksheetAiResult ? JSON.parse(JSON.stringify(log.worksheetAiResult)) : null;
  currentWorksheetCorrectionDone = !!currentWorksheetAiResult || String(log.reviewed || '').includes('완료');

  // 첨삭 완료 상태인데 worksheetAiResult가 비어있거나(이관/구형 첨삭 기록 등) 일부 필드가 누락된 경우 기존 코멘트와 학습 기록을 바탕으로 복원
  if (currentWorksheetCorrectionDone) {
    var sName = log.studentName || log.name || '원생';
    var bName = log.bookTitle || '도서';
    var existingComment = String(log.comment || '').trim();
    var studentAns = String(log.studentThoughtAnswer || log.thoughtAnswer || log.sheetAnswer || '').trim();
    if (!currentWorksheetAiResult || typeof currentWorksheetAiResult !== 'object') {
      currentWorksheetAiResult = {
        summary: existingComment || (sName + ' 학생이 『' + bName + '』을(를) 읽고 자신의 생각과 느낌을 주도적으로 표현했습니다.'),
        actualQuotes: studentAns ? [
          {
            quote: studentAns,
            criteria: '경험 연결 및 자기표현',
            comment: existingComment || '책 속 상황을 자신의 시각으로 솔직하게 풀어나가며 생각을 완성했습니다.'
          }
        ] : [],
        drawingObservation: '글과 더불어 시트에 생각을 정성껏 표현하여 독서 몰입도를 높였습니다.',
        languageHandwritingNote: '자신의 느낌과 생각을 솔직하게 문장으로 담아내려는 훌륭한 독서 태도를 보여줍니다.',
        nextStep: '다음에는 왜 그렇게 생각했는지 구체적인 이유나 일상 경험을 한 문장 더 덧붙여 보면 더욱 좋습니다.',
        parentGuide: '아이가 스스로 생각을 끝까지 매듭지은 점을 크게 칭찬해 주시고, 인상 깊었던 장면에 대해 열린 대화를 나누어 보세요.',
        teacherCommentDraft: existingComment || (sName + ' 학생은 『' + bName + '』을(를) 읽고 인상 깊었던 장면을 자신의 시각으로 정성껏 표현했습니다.')
      };
    } else {
      if (currentWorksheetAiResult.teacherCommentDraft === undefined && existingComment) {
        currentWorksheetAiResult.teacherCommentDraft = existingComment;
      }
      if (currentWorksheetAiResult.drawingObservation === undefined) {
        currentWorksheetAiResult.drawingObservation = '글과 더불어 시트에 생각을 정성껏 표현하여 독서 몰입도를 높였습니다.';
      }
      if (currentWorksheetAiResult.languageHandwritingNote === undefined) {
        currentWorksheetAiResult.languageHandwritingNote = '자신의 느낌과 생각을 솔직하게 문장으로 담아내려는 훌륭한 독서 태도를 보여줍니다.';
      }
    }
  }

  var donePhotosBox = document.getElementById('worksheetDonePhotosPreview');
  if (donePhotosBox) {
    if (currentWorksheetCorrectionDone && currentWorksheetPhotos.length > 0) {
      donePhotosBox.style.display = 'block';
      donePhotosBox.innerHTML = '<div class="p-2.5 px-3 rounded border" style="background:#faf8f5; border-color:#e5dccb !important;">' +
        '<div class="font-weight-bold mb-1.5" style="font-size:12px; color:var(--text-main);"><i class="fa-solid fa-images text-primary mr-1"></i>업로드된 나노시트 원본 이미지 (' + currentWorksheetPhotos.length + '장)</div>' +
        '<div class="d-flex flex-wrap" style="gap:8px;">' +
        currentWorksheetPhotos.map(function(p, idx) {
          var src = escapePortfolioText((p && (p.dataUrl || p.url)) || '');
          return src ? '<img src="' + src + '" alt="시트 ' + (idx + 1) + '" style="width:68px;height:68px;object-fit:cover;border-radius:6px;border:1px solid #d8cebf;cursor:pointer;" onclick="openWorksheetPhotoLightbox(\'' + src + '\')">' : '';
        }).join('') +
        '</div></div>';
    } else {
      donePhotosBox.style.display = 'none';
      donePhotosBox.innerHTML = '';
    }
  }

  document.getElementById('modalCorrectionStudent').innerText = (log.studentName || log.name) + ' (' + (log.classGroup || '-') + ')';
  document.getElementById('modalCorrectionBook').innerText = log.bookTitle + ' · ' + log.date;
  var badge = document.getElementById('modalCorrectionBadge');
  badge.className = 'badge-soft ' + (currentWorksheetCorrectionDone ? 'badge-soft-success' : 'badge-soft-warn') + ' font-weight-bold';
  badge.innerText = currentWorksheetCorrectionDone ? '첨삭 완료' : '첨삭 전';
  if (currentWorksheetCorrectionDone) renderWorksheetCorrectionEditor();
  renderWorksheetPhotoThumbnails();
  syncWorksheetCorrectionActions();
  document.getElementById('correctionFileInput').value = '';
  if (window.jQuery) $('#modalCorrection').modal('show');
}

async function saveCorrectionFromModal() {
  if (!currentOpenCorrectionLogId || !currentWorksheetCorrectionDone || worksheetCorrectionSaving) return;
  var targetId = currentOpenCorrectionLogId;
  var logs = getLoadedLearningLogs();
  var log = logs.find(function(l) { return l.id === targetId; });
  if (!log) return;
  log.worksheetAiResult = readWorksheetCorrectionEditor();
  if (log.worksheetAiResult && log.worksheetAiResult.teacherCommentDraft) {
    log.comment = log.worksheetAiResult.teacherCommentDraft;
  } else if (log.worksheetAiResult && log.worksheetAiResult.summary && !log.comment) {
    log.comment = log.worksheetAiResult.summary;
  }
  log.reviewRevision = currentWorksheetReviewRevision;
  log.reviewed = '첨삭 완료';
  log.sheet = '작성 완료';
  log.manualSheetDone = true;
  worksheetCorrectionSaving = true;
  syncWorksheetCorrectionActions();
  try {
    if (!await saveCustomLearningLogs(logs)) return;
    renderLearningTable();
    if (currentOpenCorrectionLogId === targetId) {
      currentWorksheetAiResult = JSON.parse(JSON.stringify(log.worksheetAiResult));
      currentWorksheetReviewRevision = log.reviewRevision || '';
      if (window.jQuery) $('#modalCorrection').modal('hide');
    }
    showAcademyToast('수정한 나노 시트 첨삭 결과가 저장되었습니다.');
  } finally {
    worksheetCorrectionSaving = false;
    syncWorksheetCorrectionActions();
  }
}

async function deleteCorrectionFromModal() {
  if (!currentOpenCorrectionLogId || worksheetCorrectionSaving || worksheetAnalysisJobs.has(currentOpenCorrectionLogId)) return;
  if (!confirm('기존 첨삭 내역을 삭제하시겠습니까? AI 분석 결과와 교사 코멘트가 삭제됩니다. 원본 사진과 북퀴즈 학습 기록은 보존됩니다.')) return;
  var targetId = currentOpenCorrectionLogId;
  var logs = getLoadedLearningLogs();
  var log = logs.find(function(l) { return l.id === targetId; });
  if (!log) return;
  log.worksheetAiResult = null;
  log.reviewRevision = currentWorksheetReviewRevision;
  log.comment = '';
  log.reviewed = '첨삭 전';
  worksheetCorrectionSaving = true;
  syncWorksheetCorrectionActions();
  try {
    if (!await saveCustomLearningLogs(logs)) return;
    renderLearningTable();
    if (currentOpenCorrectionLogId === targetId) {
      currentWorksheetAiResult = null;
      currentWorksheetReviewRevision = log.reviewRevision || '';
      currentWorksheetCorrectionDone = false;
      if (window.jQuery) $('#modalCorrection').modal('hide');
    }
    showAcademyToast('첨삭 내역이 삭제되었습니다.');
  } finally {
    worksheetCorrectionSaving = false;
    syncWorksheetCorrectionActions();
  }
}

function uploadCorrectionSheet(logId) {
  openCorrectionModal(logId);
}

// 학습 관리 테이블 페이징 상태 (20건씩)
var LEARNING_PAGE_SIZE = 20;
var learningCurrentPage = 1;
// 필터가 바뀌면 1페이지로 되돌리기 위해 직전 필터 조합을 기억
// (첨삭/시트 토글 등 같은 필터로 재렌더링될 때는 현재 페이지 유지)
var learningLastFilterKey = '';

function goLearningPage(page) {
  learningCurrentPage = page;
  renderLearningTable();
}

// 하단 페이지 번호 UI 렌더링 (현재 페이지 기준 앞뒤 2개씩 노출)
function renderLearningPagination(totalCount, totalPages) {
  var el = document.getElementById('learningPagination');
  if (!el) return;
  if (totalCount <= LEARNING_PAGE_SIZE) { el.innerHTML = ''; return; }

  var start = Math.max(1, learningCurrentPage - 2);
  var end = Math.min(totalPages, learningCurrentPage + 2);
  var btn = function(label, page, disabled, active) {
    return '<button type="button" class="btn btn-xs ' + (active ? 'btn-beige-primary' : 'btn-outline-secondary') + '"' +
      (disabled ? ' disabled' : ' onclick="goLearningPage(' + page + ')"') +
      ' style="min-width:32px; border-radius:6px; font-size:12px; font-weight:600; margin:0 2px;">' + label + '</button>';
  };

  var html = btn('«', 1, learningCurrentPage === 1, false) + btn('‹', learningCurrentPage - 1, learningCurrentPage === 1, false);
  for (var p = start; p <= end; p++) html += btn(p, p, false, p === learningCurrentPage);
  html += btn('›', learningCurrentPage + 1, learningCurrentPage === totalPages, false) + btn('»', totalPages, learningCurrentPage === totalPages, false);
  html += '<span class="text-muted ml-3" style="font-size:12px;">' + learningCurrentPage + ' / ' + totalPages + ' 페이지</span>';
  el.innerHTML = html;
}

// O(1) 초고속 인덱스 맵 캐시 (도서 번호, ID, 정규화된 제목 기준)
var _migratedBookIndexMap = null;
function getMigratedBookFromIndex(key) {
  if (!key) return null;
  if (!_migratedBookIndexMap) {
    _migratedBookIndexMap = new Map();
    if (typeof window !== 'undefined' && Array.isArray(window.MIGRATED_BOOKS)) {
      var arr = window.MIGRATED_BOOKS;
      for (var i = 0; i < arr.length; i++) {
        var m = arr[i];
        if (!m) continue;
        if (m.id) _migratedBookIndexMap.set(String(m.id), m);
        if (m.bookNo && m.bookNo !== m.id) _migratedBookIndexMap.set(String(m.bookNo), m);
        if (m.title) {
          var cleanT = String(m.title).replace(/\s+/g, '').toLowerCase();
          if (!_migratedBookIndexMap.has(cleanT)) _migratedBookIndexMap.set(cleanT, m);
        }
      }
    }
  }
  var strKey = String(key);
  var found = _migratedBookIndexMap.get(strKey);
  if (!found) {
    found = _migratedBookIndexMap.get(strKey.replace(/\s+/g, '').toLowerCase());
  }
  return found || null;
}

// 학습 관리용 도서 표지 및 메타데이터 실시간 매칭 헬퍼 (O(1) 초고속 조회)
function getLearningLogBookMeta(log) {
  var logTitleNorm = (log && log.bookTitle) ? String(log.bookTitle).replace(/\s+/g, '').toLowerCase() : '';
  var targetBook = getMigratedBookFromIndex(logTitleNorm);

  var rawCover = (log && log.cover) || (targetBook && targetBook.cover);
  var coverUrl = (typeof normalizeBookCoverUrl === 'function') 
    ? normalizeBookCoverUrl(rawCover)
    : (rawCover || (typeof DEFAULT_BOOK_COVER !== 'undefined' ? DEFAULT_BOOK_COVER : ''));

  var pubText = (log && log.bookPub) 
    ? log.bookPub 
    : ((targetBook && targetBook.publisher) ? targetBook.publisher : '나노 교육출판');

  return {
    cover: coverUrl,
    publisher: pubText,
    book: targetBook
  };
}

// 학습 완료 일시(날짜 + 24시간 형식 hh:mm) 포맷 함수
function formatLearningDateTime(log) {
  var dateStr = '';
  var timeStr = '';

  // 1. submittedAt(ISO 문자열 등) 우선 파싱
  if (log && log.submittedAt) {
    try {
      var d = new Date(log.submittedAt);
      if (!isNaN(d.getTime())) {
        var yyyy = d.getFullYear();
        var mm = String(d.getMonth() + 1).padStart(2, '0');
        var dd = String(d.getDate()).padStart(2, '0');
        dateStr = yyyy + '-' + mm + '-' + dd;
        var hh = String(d.getHours()).padStart(2, '0');
        var min = String(d.getMinutes()).padStart(2, '0');
        timeStr = '(' + hh + ':' + min + ')';
      }
    } catch (e) {}
  }

  // 2. date 필드 확인 (예: '2026-10-06 14:10' 또는 '2026-10-29')
  if (log && log.date) {
    var raw = String(log.date).trim();
    var matchWithTime = raw.match(/^(\d{4}[-./]\d{1,2}[-./]\d{1,2})\s+(\d{1,2}):(\d{2})/);
    if (matchWithTime) {
      if (!dateStr) {
        dateStr = matchWithTime[1].replace(/[./]/g, '-');
      }
      if (!timeStr) {
        var hh = matchWithTime[2].padStart(2, '0');
        var min = matchWithTime[3];
        timeStr = '(' + hh + ':' + min + ')';
      }
    } else if (!dateStr) {
      dateStr = raw.slice(0, 10).replace(/[./]/g, '-');
    }
  }

  // 3. submittedAt이 ISO가 아닌 경우 또는 date/submittedAt에서 시간 보완
  if (!timeStr && log) {
    var timeSource = String(log.submittedAt || log.date || '');
    var m = timeSource.match(/\b(\d{1,2}):(\d{2})\b/);
    if (m) {
      timeStr = '(' + m[1].padStart(2, '0') + ':' + m[2] + ')';
    }
  }

  return {
    date: dateStr || (log && log.date ? String(log.date).slice(0, 10) : '-'),
    time: timeStr
  };
}

// 학습 관리 테이블 렌더링
// 컬럼 순서: 1.번호, 2.완료일, 3.도서명, 4.학급, 5.원생명, 6.북퀴즈 결과, 7.나노 시트, 8.첨삭, 9.관리
function renderLearningTable() {
  initLearningDateFilters();

  var tbody = document.getElementById('learningTableBody');
  if (!tbody) return;
  tbody.innerHTML = '';

  var classFilter = document.getElementById('learningClassFilter') ? document.getElementById('learningClassFilter').value : 'ALL';
  var query = (document.getElementById('learningSearchInput') ? document.getElementById('learningSearchInput').value : '').toLowerCase().trim();
  var startDateVal = document.getElementById('learningStartDate') ? document.getElementById('learningStartDate').value : '';
  var endDateVal = document.getElementById('learningEndDate') ? document.getElementById('learningEndDate').value : '';

  var allLogs = getLoadedLearningLogs();
  var filtered = allLogs.filter(function(l) {
    var matchClass = classFilter === 'ALL' || l.classGroup === classFilter;
    var matchQuery = !query || l.studentName.toLowerCase().includes(query) || l.bookTitle.toLowerCase().includes(query);

    var lDatePart = (l.date || '').slice(0, 10);
    var matchDate = true;
    if (startDateVal && lDatePart) {
      matchDate = matchDate && (lDatePart >= startDateVal);
    }
    if (endDateVal && lDatePart) {
      matchDate = matchDate && (lDatePart <= endDateVal);
    }

    return matchClass && matchQuery && matchDate;
  });

  var countEl = document.getElementById('learningLogCount');
  if (countEl) countEl.innerText = filtered.length;

  // ✕ 버튼 및 활성 검색 배지 상태 동기화
  var clearBtn = document.getElementById("btnLearningSearchClear");
  if (clearBtn) clearBtn.style.display = query.length > 0 ? "inline-flex" : "none";
  var badgeEl = document.getElementById("learningSearchActiveBadge");
  if (badgeEl) {
    if (query) {
      badgeEl.style.display = "inline-flex";
      var displayQ = query.length > 25 ? query.substring(0, 25) + '...' : query;
      badgeEl.innerHTML = '<span class="badge-search-active"><i class="fa-solid fa-magnifying-glass mr-1"></i>"' + displayQ + '" 검색 결과 ' + filtered.length.toLocaleString() + '건 <span class="badge-clear-link" onclick="clearLearningSearch()" title="검색 필터 해제">✕ 검색 해제</span></span>';
    } else {
      badgeEl.style.display = "none";
      badgeEl.innerHTML = "";
    }
  }

  // 상단 3개 학습 요약 통계 카드 실시간 연동 (이달 학습 건수, 북퀴즈 평균 점수, 나노 시트 첨삭 완료율)
  var kstNow = new Date(Date.now() + 9 * 60 * 60 * 1000);
  var curYm = kstNow.toISOString().slice(0, 7);
  var prevDate = new Date(Date.UTC(kstNow.getUTCFullYear(), kstNow.getUTCMonth() - 1, 1));
  var prevYm = prevDate.toISOString().slice(0, 7);
  var thisMonthLogs = allLogs.filter(function(l) { return String(l.date || '').slice(0, 7) === curYm; });
  var prevMonthLogs = allLogs.filter(function(l) { return String(l.date || '').slice(0, 7) === prevYm; });
  var statBaseLogs = filtered.length > 0 ? filtered : allLogs;

  var monthlyCountEl = document.getElementById('learningStatMonthlyCount');
  var monthlySubEl = document.getElementById('learningStatMonthlySub');
  if (monthlyCountEl) {
    monthlyCountEl.innerText = thisMonthLogs.length > 0 ? thisMonthLogs.length : filtered.length;
  }
  if (monthlySubEl) {
    if (thisMonthLogs.length > 0) {
      var diff = thisMonthLogs.length - prevMonthLogs.length;
      monthlySubEl.innerText = (diff >= 0 ? '지난달 대비 +' + diff + '건 증가' : '지난달 대비 ' + diff + '건') + ' (누적 ' + allLogs.length + '건)';
    } else {
      monthlySubEl.innerText = '전체 누적 ' + allLogs.length + '건 (조회 ' + filtered.length + '건)';
    }
  }

  var avgScoreEl = document.getElementById('learningStatAvgScore');
  var passSubEl = document.getElementById('learningStatPassSub');
  var totalScore = statBaseLogs.reduce(function(sum, l) { return sum + (Number(l.score) || 0); }, 0);
  var avgScoreVal = statBaseLogs.length > 0 ? Math.round(totalScore / statBaseLogs.length) : 0;
  var passCount = statBaseLogs.filter(function(l) { return (Number(l.score) || 0) >= 60; }).length;
  var passRate = statBaseLogs.length > 0 ? Math.round((passCount / statBaseLogs.length) * 100) : 0;
  if (avgScoreEl) avgScoreEl.innerText = avgScoreVal;
  if (passSubEl) passSubEl.innerText = '인증 통과율 ' + passRate + '% 달성 (' + passCount + '/' + statBaseLogs.length + '건)';

  var reviewRateEl = document.getElementById('learningStatReviewRate');
  var reviewSubEl = document.getElementById('learningStatReviewSub');
  var reviewDoneCount = statBaseLogs.filter(function(l) {
    return (l.reviewed && String(l.reviewed).includes('완료')) || (l.comment && String(l.comment).trim().length > 0);
  }).length;
  var reviewRateVal = statBaseLogs.length > 0 ? Math.round((reviewDoneCount / statBaseLogs.length) * 100) : 0;
  if (reviewRateEl) reviewRateEl.innerText = reviewRateVal;
  if (reviewSubEl) {
    reviewSubEl.innerText = statBaseLogs.length > 0
      ? '담당 지도교사 첨삭 ' + reviewDoneCount + '/' + statBaseLogs.length + '건 완료'
      : '담당 지도교사 첨삭 대기';
  }

  // 필터 조합이 바뀌었으면 1페이지로 복귀
  var filterKey = [classFilter, query, startDateVal, endDateVal].join('|');
  if (filterKey !== learningLastFilterKey) {
    learningCurrentPage = 1;
    learningLastFilterKey = filterKey;
  }

  if (filtered.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" class="text-center py-5 text-muted">일치하는 학습 기록이 없습니다.</td></tr>';
    renderLearningPagination(0, 1);
    return;
  }

  var total = filtered.length;
  var totalPages = Math.ceil(total / LEARNING_PAGE_SIZE);
  // 삭제 등으로 마지막 페이지가 사라진 경우 보정
  if (learningCurrentPage > totalPages) learningCurrentPage = totalPages;
  if (learningCurrentPage < 1) learningCurrentPage = 1;

  var pageStart = (learningCurrentPage - 1) * LEARNING_PAGE_SIZE;
  var pageItems = filtered.slice(pageStart, pageStart + LEARNING_PAGE_SIZE);
  renderLearningPagination(total, totalPages);

  pageItems.forEach(function(l, pIdx) {
    var tr = document.createElement('tr');

    // 번호 내림차순 계산 (전체 기준 N, N-1, ... 1)
    var numDesc = total - (pageStart + pIdx);

    // 도서 표지 및 출판사 메타데이터 조회
    var bookMeta = getLearningLogBookMeta(l);

    // 6. 첨삭 컬럼 (백그라운드 첨삭 중 스피너 표시 및 모달 연결)
    var isReviewProcessing = worksheetAnalysisJobs.has(l.id) || (l.reviewed === '첨삭 중');
    var isReviewDone = (l.reviewed && l.reviewed.includes('완료'));
    var reviewBtnHtml = isReviewProcessing
      ? `<button type="button" class="btn btn-xs btn-outline-info font-weight-bold" disabled style="font-size:11px; padding:3px 9px; border-radius:6px; background:#f0fdfa; border-color:#99f6e4; color:#0f766e;">
           <i class="fa-solid fa-spinner fa-spin mr-1"></i>첨삭 중...
         </button>`
      : isReviewDone
        ? `<button type="button" class="btn btn-xs btn-success font-weight-bold" onclick="openCorrectionModal('${l.id}')" title="첨삭 내용 확인 및 수정" style="font-size:11px; padding:3px 9px; border-radius:6px;">
             <i class="fa-solid fa-circle-check mr-1"></i>첨삭 완료
           </button>`
        : `<button type="button" class="btn btn-xs btn-outline-warning text-dark font-weight-bold" onclick="openCorrectionModal('${l.id}')" title="클릭 시 첨삭 모달 열기" style="font-size:11px; padding:3px 9px; border-radius:6px; background:#fff7ed; border-color:#fed7aa;">
             <i class="fa-solid fa-pen mr-1 text-warning"></i>첨삭 전
           </button>`;

    // 7. 관리 컬럼: 학습리포트 버튼 + 우측 카톡 발송 버튼 나란히 배치
    var kakaoBtnHtml = getKakaoReportBtnHtml(l.id, false);

    var dtInfo = formatLearningDateTime(l);

    tr.innerHTML = `
      <td class="text-center font-weight-bold text-muted" style="font-size: 12px;">${numDesc}</td>
      <td class="text-center" style="font-size: 12px; color: var(--text-muted); font-weight: 600; white-space: nowrap; line-height: 1.45;">
        <div>${dtInfo.date}</div>
        ${dtInfo.time ? `<div style="font-size: 11px; color: #64748b; font-weight: 500; margin-top: 2px;">${dtInfo.time}</div>` : ''}
      </td>
      <td style="padding: 9px 12px;">
        <div class="d-flex align-items-center" style="gap: 12px;">
          <div style="flex-shrink: 0; width: 42px; height: 58px; border-radius: 6px; overflow: hidden; border: 1px solid var(--border-medium); background: #f8fafc; box-shadow: 0 1px 3px rgba(0,0,0,0.06); display: flex; align-items: center; justify-content: center;">
            <img src="${bookMeta.cover}" alt="" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.onerror=null; this.src=(typeof DEFAULT_BOOK_COVER !== 'undefined' ? DEFAULT_BOOK_COVER : '');">
          </div>
          <div style="min-width: 0;">
            <div class="font-weight-bold text-dark text-truncate" style="font-size: 13.5px;" title="${l.bookTitle}">${l.bookTitle}</div>
            <small class="text-muted d-block text-truncate" style="font-size: 11.5px;">${bookMeta.publisher}</small>
          </div>
        </div>
      </td>
      <td class="text-center" style="font-size: 12.5px; color: var(--text-muted); font-weight: 500; white-space: nowrap;">
        ${l.classGroup || '-'}
      </td>
      <td class="text-center">
        <strong style="color: var(--text-main); font-size: 13px;">${l.studentName}</strong>
      </td>
      <td class="text-center">
        <span class="badge-soft ${l.score >= 90 ? 'badge-soft-success' : 'badge-soft-warn'} font-weight-bold">${l.score}점</span>
      </td>
      <td class="text-center">${reviewBtnHtml}</td>
      <td class="text-center">
        <div class="d-inline-flex align-items-center justify-content-center" style="gap: 5px;">
          <button class="btn btn-xs btn-beige-secondary" onclick="openLearningDetailModal('${l.id}')" style="border-radius:6px; font-size:11.5px; padding:4px 9px; font-weight:600; white-space:nowrap;">
            학습리포트
          </button>
          ${kakaoBtnHtml}
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// ==============================================================
// 학습리포트 카톡 알림톡 발송 및 인쇄 관리 모듈
// ==============================================================
var STORAGE_KEY_KAKAO_LOGS = 'NANO_REPORT_KAKAO_LOGS';
var currentOpenLearningLogId = null;

function getKakaoReportLogs() {
  try {
    var raw = localStorage.getItem(STORAGE_KEY_KAKAO_LOGS);
    return raw ? JSON.parse(raw) : {};
  } catch(e) {
    return {};
  }
}

function getKakaoReportLog(logId) {
  var logs = getKakaoReportLogs();
  return logs[logId] || null;
}

function saveKakaoReportLog(logId, timeStr) {
  var logs = getKakaoReportLogs();
  logs[logId] = timeStr;
  try {
    localStorage.setItem(STORAGE_KEY_KAKAO_LOGS, JSON.stringify(logs));
  } catch(e) {
    console.error('Failed to save Kakao report log:', e);
  }
}

function formatCurrentDateTimeShort() {
  var now = new Date();
  var mm = String(now.getMonth() + 1).padStart(2, '0');
  var dd = String(now.getDate()).padStart(2, '0');
  var hh = String(now.getHours()).padStart(2, '0');
  var min = String(now.getMinutes()).padStart(2, '0');
  return mm + '-' + dd + ' ' + hh + ':' + min;
}

function showAcademyToast(message) {
  var toastEl = document.getElementById('academyToast');
  var textEl = document.getElementById('academyToastText');
  if (toastEl && textEl) {
    textEl.innerText = message;
    toastEl.style.display = 'block';
    setTimeout(function() {
      toastEl.style.display = 'none';
    }, 2800);
  } else {
    alert(message);
  }
}

function getKakaoReportBtnHtml(logId, isModal) {
  var sentTime = getKakaoReportLog(logId);
  var clickHandler = "sendLearningReportKakao('" + logId + "', event)";
  
  if (sentTime) {
    var modalClass = isModal ? 'px-3 py-1' : '';
    return '<button type="button" class="btn-kakao-report-sent ' + modalClass + '" onclick="' + clickHandler + '" title="카톡 알림톡 발송 완료 (재발송 가능)">' +
      '발송완료<br><span class="sent-time-text">' + sentTime + '</span>' +
    '</button>';
  } else {
    var modalPadding = isModal ? 'padding: 5px 12px; font-size: 12px;' : '';
    return '<button type="button" class="btn-kakao-report" style="' + modalPadding + '" onclick="' + clickHandler + '" title="학부모 카카오톡 알림톡 발송">' +
      '<i class="fa-solid fa-comment"></i>카톡 발송' +
    '</button>';
  }
}

async function sendLearningReportKakao(logId, event) {
  if (event) event.stopPropagation();
  if (!(window.NanoPortal && NanoPortal.remote)) { showAcademyToast('운영 서버에서만 발송할 수 있습니다.'); return; }
  var button = event && event.currentTarget; if(button) button.disabled = true;
  try {
    var preview = await NanoPortal.api('/api/services', { type: 'quiz', action: 'preview', logId: logId });
    var confirmMsg = '[북퀴즈 완료 알림톡 발송 미리보기]\n\n' +
      '받는 분: ' + preview.name + ' (' + preview.recipient + ')\n\n' +
      preview.message + '\n\n' +
      '연결 링크: ' + preview.targetUrl + '\n\n' +
      '학부모님께 이 내용으로 알림톡을 발송하시겠습니까?';
    if (!confirm(confirmMsg)) return;
    var result = await NanoPortal.api('/api/services', { type: 'quiz', action: 'send', logId: logId, fingerprint: preview.fingerprint });
    showAcademyToast(result.status === 'ACCEPTED' ? '🎉 학부모님께 북퀴즈 결과 알림톡이 성공적으로 발송되었습니다!' : '발송 상태: ' + result.status + '. 알림톡 발송 내역을 확인해 주세요.');
  } catch(e) { showAcademyToast(e.message); } finally { if(button) button.disabled = false; }
}

// A4 리포트 인쇄 실행 함수 (백지 방지 및 생각담기 숨김 반영)
function printLearningReport() {
  var isHidden = false;
  if (currentOpenLearningLogId) {
    var allLogs = getLoadedLearningLogs();
    var log = allLogs.find(function(l) { return l.id === currentOpenLearningLogId; });
    if (log && log.thoughtHidden === true) {
      isHidden = true;
    }
  }

  // 발급일자 최신화
  var printDateEl = document.getElementById('printReportIssuedDate');
  if (printDateEl) {
    var today = new Date();
    var yyyy = today.getFullYear();
    var mm = String(today.getMonth() + 1).padStart(2, '0');
    var dd = String(today.getDate()).padStart(2, '0');
    printDateEl.innerText = `${yyyy}-${mm}-${dd}`;
  }
  var printAcadEl = document.getElementById('printAcademyNameDisplay');
  if (printAcadEl) {
    var curAcad = (typeof currentAcademyName !== 'undefined' && currentAcademyName) ? currentAcademyName : '나노의 책장';
    printAcadEl.innerText = curAcad;
  }

  if (isHidden) {
    document.body.classList.add('thought-hidden-print');
  } else {
    document.body.classList.remove('thought-hidden-print');
  }

  document.body.classList.add('is-printing-report');
  
  // 인쇄 렌더링 준비 후 실행
  setTimeout(function() {
    window.print();
    setTimeout(function() {
      document.body.classList.remove('is-printing-report');
      document.body.classList.remove('thought-hidden-print');
    }, 600);
  }, 120);
}

// 브라우저 직접 인쇄(Ctrl+P) 단축키 지원
if (typeof window !== 'undefined') {
  window.addEventListener('beforeprint', function() {
    var modal = document.getElementById('learningDetailModal');
    if (modal && (modal.classList.contains('show') || (window.jQuery && $(modal).is(':visible')))) {
      document.body.classList.add('is-printing-report');
    }
  });
  window.addEventListener('afterprint', function() {
    document.body.classList.remove('is-printing-report');
    document.body.classList.remove('thought-hidden-print');
  });
}

// 상세 학습리포트 모달 열기 및 문항별 채점 결과 상세 렌더링
function openLearningDetailModal(id) {
  var allLogs = getLoadedLearningLogs();
  var log = allLogs.find(function(l) { return l.id === id; });
  if (!log) {
    log = learningLogs.find(function(l) { return l.id === id; });
  }
  if (!log) return;

  // 운영 서버의 삭제 상태를 우선하고, 구형 로컬 기록에 한해서만 분석 사본을 복원합니다.
  var storedWs = getWorksheetStore(id);
  if (storedWs) {
    if (!(window.NanoPortal && NanoPortal.remote) && log.worksheetAiResult === undefined && storedWs.aiResult) log.worksheetAiResult = storedWs.aiResult;
    if ((!log.worksheetPhotos || log.worksheetPhotos.length === 0) && Array.isArray(storedWs.photos) && storedWs.photos.length > 0) {
      log.worksheetPhotos = storedWs.photos;
    }
  }

  currentOpenLearningLogId = id;
  var modalKakaoContainer = document.getElementById('modalKakaoSendBtnContainer');
  if (modalKakaoContainer) {
    modalKakaoContainer.innerHTML = getKakaoReportBtnHtml(id, true);
  }

  // 1. 도서 메타데이터 및 표지 연동 (O(1) 인덱스 매칭)
  var cleanTitleKey = (log.bookTitle || '').replace(/\s+/g, '').toLowerCase();
  var targetBook = getMigratedBookFromIndex(cleanTitleKey);

  // 표지 경로 결정 (절대경로 슬래시 처리 및 폴백 대응)
  var coverUrl = (log && log.cover) || (targetBook && targetBook.cover) || '';
  if (coverUrl && coverUrl.startsWith('/')) {
    coverUrl = coverUrl.substring(1);
  }
  if (!coverUrl) {
    coverUrl = 'upload/book/book_default.jpg';
  }

  var coverImgEl = document.getElementById('learnModalCoverImg');
  if (coverImgEl) {
    coverImgEl.src = coverUrl;
    coverImgEl.alt = log.bookTitle || '도서 표지';
  }

  var gradeEl = document.getElementById('learnModalBookGrade');
  if (gradeEl) {
    gradeEl.innerText = (targetBook && targetBook.grade) ? targetBook.grade : (log.grade || '초등 전학년');
  }

  var catEl = document.getElementById('learnModalBookCategory');
  if (catEl) {
    catEl.innerText = (targetBook && targetBook.category) ? targetBook.category : '문학 / 이야기';
  }

  // 발급일자 및 학원명 세팅
  var printDateEl = document.getElementById('printReportIssuedDate');
  if (printDateEl) {
    var today = new Date();
    var yyyy = today.getFullYear();
    var mm = String(today.getMonth() + 1).padStart(2, '0');
    var dd = String(today.getDate()).padStart(2, '0');
    printDateEl.innerText = `${yyyy}-${mm}-${dd}`;
  }
  var printAcadEl = document.getElementById('printAcademyNameDisplay');
  if (printAcadEl) {
    var curAcad = (typeof currentAcademyName !== 'undefined' && currentAcademyName) ? currentAcademyName : (log.school ? log.school.split(' ')[0] : '나노의 책장');
    printAcadEl.innerText = curAcad;
  }

  // 2. 기본 개요 바인딩
  document.getElementById('learnModalStudent').innerText = `${(log.studentName || log.name)} (${log.classGroup})`;
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
    if (log.score >= 80) {
      passBadge.className = 'badge-soft badge-soft-success font-weight-bold';
      passBadge.innerText = '우수 완독 인증';
    } else if (log.score >= 60) {
      passBadge.className = 'badge-soft badge-soft-success font-weight-bold';
      passBadge.innerText = '완독 인증 통과';
    } else {
      passBadge.className = 'badge-soft badge-soft-warn font-weight-bold';
      passBadge.innerText = '미통과 (재도전 권장)';
    }
  }

  // 2. 북퀴즈 문항별 상세 내역
  var container = document.getElementById('learnModalQuizDetailContainer');
  if (container) {
    var quizzes = log.quizResults || [];
    var correctCount = quizzes.filter(function(q) { return q.isCorrect; }).length;
    var totalCount = quizzes.length;
    var rate = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : (Number(log.score) || 0);
    var ptPerQ = totalCount > 0 ? Math.round(100 / totalCount) : 20;

    var summaryEl = document.getElementById('learnModalQuizSummary');
    if (summaryEl) {
      summaryEl.innerHTML = `총 ${totalCount}문항 중 <strong class="${rate === 100 ? 'text-success' : 'text-danger'}">${correctCount}문항</strong> 정답 (정답률 ${rate}%)`;
    }

    container.innerHTML = quizzes.map(function(q) {
      var qNumStr = String(q.qNum).padStart(2, '0');
      var statusBadge = q.isCorrect
        ? `<span class="report-quiz-badge correct">
             <i class="fa-solid fa-circle-check mr-1"></i>정답 (+${ptPerQ}점)
           </span>`
        : `<span class="report-quiz-badge wrong">
             <i class="fa-solid fa-circle-xmark mr-1"></i>오답 (0점)
           </span>`;

      var choiceBox = q.isCorrect
        ? `<div class="report-choice-box correct">
             <div class="report-choice-label"><i class="fa-solid fa-check mr-1.5 text-success"></i>학생 선택 답안</div>
             <div class="report-choice-val">${escapePortfolioText(q.userChoiceText)}</div>
           </div>`
        : `<div class="report-choice-box wrong mb-1.5">
             <div class="report-choice-label"><i class="fa-solid fa-xmark mr-1.5 text-danger"></i>학생 선택 오답</div>
             <div class="report-choice-val strike">${escapePortfolioText(q.userChoiceText)}</div>
           </div>
           <div class="report-choice-box actual">
             <div class="report-choice-label"><i class="fa-solid fa-key mr-1.5 text-success"></i>실제 정답</div>
             <div class="report-choice-val font-weight-bold text-success">${escapePortfolioText(q.correctChoiceText)}</div>
           </div>`;

      return `
        <div class="report-quiz-card ${q.isCorrect ? 'is-correct' : 'is-wrong'}">
          <div class="report-quiz-header">
            <div class="d-flex align-items-center">
              <span class="report-quiz-q-badge">Q</span>
              <span class="report-quiz-q-num">${qNumStr}</span>
              <span class="report-quiz-title">문제 ${q.qNum}번 문항</span>
            </div>
            ${statusBadge}
          </div>
          <div class="report-quiz-question">
            <span>${escapePortfolioText(q.question)}</span>
          </div>
          ${choiceBox}
        </div>
      `;
    }).join('');
  }

  // 3. 생각 담기 영역 (질문, 학생 답안, 숨기기/보이기 토글, 교사 코멘트 직접 타이핑)
  var thoughtSec = document.getElementById('learnModalThoughtSection');
  var hasThought = (log.hasThought !== false && (log.thoughtQuestion || log.sheetAnswer || log.studentThoughtAnswer || (log.comment && log.comment.trim() !== '') || (Array.isArray(log.worksheetPhotos) && log.worksheetPhotos.length > 0)));
  
  if (thoughtSec) {
    if (!hasThought) {
      thoughtSec.style.display = 'none';
    } else {
      thoughtSec.style.display = 'block';
      var qText = log.thoughtQuestion || '이 책을 읽고 난 후 주인공의 태도나 선택에 대해 나의 생각을 서술해 보세요.';
      var aText = log.studentThoughtAnswer || log.sheetAnswer || '학생이 작성한 생각 담기 주관식 답안입니다.';
      
      var qEl = document.getElementById('learnModalThoughtQuestion');
      if (qEl) qEl.innerText = qText;

      var aEl = document.getElementById('learnModalSheetAnswer');
      if (aEl) aEl.innerText = aText;

      // 1) 생각 담기 숨기기 / 보이기 상태 반영
      updateThoughtSectionUI(log);

      // 2) 교사 코멘트 상태 반영 (기본값: 없음)
      updateTeacherCommentUI(log);
    }
  }

  // 4. [신규] 나노시트 AI 사고력 분석지 렌더링 (#learnModalWorksheetAiSection)
  // 첨삭 완료 상태이거나 코멘트가 있는데 worksheetAiResult가 비어있는 경우 스마트 자동 복원
  if (!log.worksheetAiResult && (log.reviewed === '첨삭 완료' || (log.comment && log.comment.trim()))) {
    var sName = log.studentName || log.name || '원생';
    var bName = log.bookTitle || '도서';
    log.worksheetAiResult = {
      summary: sName + ' 학생이 『' + bName + '』을(를) 읽고 자신의 생각과 느낌을 주도적으로 표현했습니다.',
      actualQuotes: [
        { quote: '나노시트 생각 담기', criteria: '경험 연결 및 자기표현', comment: '책 속 상황을 자신의 시각으로 솔직하게 풀어나가며 생각을 완성했습니다.' }
      ],
      drawingObservation: '글과 더불어 시트에 생각을 정성껏 표현하여 독서 몰입도를 높였습니다.',
      nextStep: '다음에는 떠오른 생각에 구체적인 까닭이나 경험을 한 문장 더 덧붙여 보아도 좋습니다.',
      parentGuide: '아이가 스스로 생각을 끝까지 매듭지은 점을 크게 칭찬해 주시고, 인상 깊었던 장면에 대해 대화를 나누어 보세요.'
    };
  }
  var wsAiSec = document.getElementById('learnModalWorksheetAiSection');
  if (wsAiSec) {
    var photos = Array.isArray(log.worksheetPhotos) ? log.worksheetPhotos : [];
    if (log.worksheetAiResult) {
      wsAiSec.style.display = 'block';
      var res = log.worksheetAiResult;
      
      var sumEl = document.getElementById('worksheetAiSummary');
      if (sumEl) sumEl.innerText = res.summary || '자신의 생각을 성실하게 글과 그림으로 담아냈습니다.';

      // 원본 사진 썸네일
      var thumbsEl = document.getElementById('worksheetAiThumbnails');
      if (thumbsEl) {
        if (photos.length > 0) {
          thumbsEl.innerHTML = renderWorksheetReportPhotos(photos);
        } else {
          thumbsEl.innerHTML = '<span class="text-muted" style="font-size: 11px;">등록된 원본 사진이 없습니다.</span>';
        }
      }

      // 실제 인용구 및 관찰 코멘트
      var quotesEl = document.getElementById('worksheetAiQuotesList');
      if (quotesEl) {
        quotesEl.innerHTML = (Array.isArray(res.actualQuotes) ? res.actualQuotes : []).map(function(q) {
          return '<article class="worksheet-quote">' +
            '<blockquote><i class="fa-solid fa-quote-left mr-1.5" style="opacity: 0.65; font-size: 11px;"></i>“' + escapePortfolioText(q.quote) + '”</blockquote>' +
            '<div class="mb-1"><small><i class="fa-solid fa-tag mr-1" style="font-size: 9.5px;"></i>' + escapePortfolioText(q.criteria || '표현 살펴보기') + '</small></div>' +
            '<div style="color: #334155; line-height: 1.65; font-size: 11.5px;">' + escapePortfolioText(q.comment) + '</div>' +
            '</article>';
        }).join('') || '<div class="worksheet-quote text-muted">아직 등록된 표현별 코멘트가 없습니다.</div>';
      }

      // 그림 관찰 (그림이 있는 경우만)
      var drawRow = document.getElementById('worksheetAiDrawingRow');
      var drawText = document.getElementById('worksheetAiDrawingText');
      if (drawRow && drawText) {
        if (res.drawingObservation && res.drawingObservation.trim()) {
          drawText.innerText = res.drawingObservation;
          drawRow.style.display = 'block';
        } else {
          drawRow.style.display = 'none';
        }
      }

      // 다음 성장 방향 (20%) & 가정 대화 팁
      var nextStepEl = document.getElementById('worksheetAiNextStep');
      if (nextStepEl) nextStepEl.innerHTML = '• <strong>이렇게 해보세요:</strong> ' + escapePortfolioText(res.nextStep || '자신의 생각에 이유를 한 문장 더 덧붙여 보아도 좋아요.');

      var parentEl = document.getElementById('worksheetAiParentGuide');
      if (parentEl) parentEl.innerHTML = '• <strong>집에서 함께 나눌 이야기:</strong> ' + escapePortfolioText(res.parentGuide || '아이의 표현을 충분히 격려해 주세요.');

    } else if (photos.length > 0) {
      // AI 분석 전이지만 업로드된 나노시트 원본 사진이 있는 경우 썸네일 노출
      wsAiSec.style.display = 'block';
      var sumEl = document.getElementById('worksheetAiSummary');
      if (sumEl) sumEl.innerText = '원생이 작성한 나노시트 원본 사진이 등록되어 있습니다. 하단 지도교사 첨삭 코멘트를 확인해 주세요.';

      var thumbsEl = document.getElementById('worksheetAiThumbnails');
      if (thumbsEl) {
        thumbsEl.innerHTML = renderWorksheetReportPhotos(photos);
      }

      var quotesEl = document.getElementById('worksheetAiQuotesList');
      if (quotesEl) quotesEl.innerHTML = '<div class="text-muted p-2" style="font-size: 11px;">나노시트 ' + photos.length + '장이 등록되어 있습니다. 첨삭 코멘트가 준비되면 이곳에 표시됩니다.</div>';

      var drawRow = document.getElementById('worksheetAiDrawingRow');
      if (drawRow) drawRow.style.display = 'none';

      var nextStepEl = document.getElementById('worksheetAiNextStep');
      if (nextStepEl) nextStepEl.innerHTML = '• <strong>지도교사 첨삭 피드백:</strong> ' + (log.comment || '원생의 생각 표현을 칭찬하고 격려해 주세요.');

      var parentEl = document.getElementById('worksheetAiParentGuide');
      if (parentEl) parentEl.innerHTML = '• <strong>가정 대화 팁:</strong> 아이가 시트에 쓴 생각에 대해 칭찬하고 대화를 나누어 보세요.';
    } else {
      wsAiSec.style.display = 'none';
    }
  }

  $('#learningDetailModal').modal('show');
}

// 원본을 자르지 않고 크게 표시하며 키보드로도 확대할 수 있도록 한다.
function renderWorksheetReportPhotos(photos) {
  return photos.map(function(photo, index) {
    return '<button type="button" class="worksheet-photo" onclick="openWorksheetPhotoLightbox(this.querySelector(&quot;img&quot;).src)">' +
      '<img src="' + escapePortfolioText(photo.dataUrl) + '" alt="나노시트 원본 ' + (index + 1) + '페이지">' +
      '<span>' + (index + 1) + '페이지 · 눌러서 크게 보기</span></button>';
  }).join('');
}

// 생각 담기 UI 동기화 함수
function updateThoughtSectionUI(log) {
  var isHidden = (log.thoughtHidden === true);
  var sec = document.getElementById('learnModalThoughtSection');
  var badge = document.getElementById('thoughtStatusBadge');
  var btn = document.getElementById('btnToggleThoughtVisibility');
  var notice = document.getElementById('thoughtHiddenNotice');
  var body = document.getElementById('learnModalThoughtBody');

  if (isHidden) {
    if (sec) sec.classList.add('thought-hidden-mode');
    if (badge) {
      badge.className = 'badge-soft badge-soft-warn';
      badge.innerHTML = '<i class="fa-solid fa-eye-slash mr-1"></i>숨김 처리됨 (인쇄·카톡 제외)';
    }
    if (btn) {
      btn.className = 'btn btn-xs btn-outline-primary d-print-none font-weight-bold';
      btn.innerHTML = '<i class="fa-solid fa-eye mr-1"></i>보이기';
      btn.title = '리포트 인쇄 및 카톡 발송에 생각 담기 포함하기';
    }
    if (notice) notice.style.display = 'block';
    if (body) body.style.display = 'none';
  } else {
    if (sec) sec.classList.remove('thought-hidden-mode');
    if (badge) {
      badge.className = 'badge-soft badge-soft-success';
      badge.innerHTML = '<i class="fa-solid fa-eye mr-1"></i>리포트 포함 (보이기)';
    }
    if (btn) {
      btn.className = 'btn btn-xs btn-outline-secondary d-print-none font-weight-bold';
      btn.innerHTML = '<i class="fa-solid fa-eye-slash mr-1"></i>숨기기';
      btn.title = '리포트 인쇄 및 카톡 발송에서 생각 담기 제외하기';
    }
    if (notice) notice.style.display = 'none';
    if (body) body.style.display = 'block';
  }
}

// 생각 담기 숨기기 / 보이기 토글 실행
async function toggleThoughtSectionVisibility() {
  if (!currentOpenLearningLogId) return;
  var allLogs = getLoadedLearningLogs();
  var log = allLogs.find(function(l) { return l.id === currentOpenLearningLogId; });
  if (!log) return;

  log.thoughtHidden = !log.thoughtHidden;
  if (!await saveCustomLearningLogs(allLogs)) return;
  updateThoughtSectionUI(log);

  if (log.thoughtHidden) {
    showAcademyToast('생각 담기가 [숨기기] 처리되었습니다. 리포트 인쇄 및 학부모 카톡 발송 시 제외됩니다.');
  } else {
    showAcademyToast('생각 담기가 [보이기] 처리되었습니다. 리포트 인쇄 및 학부모 카톡 발송에 포함됩니다.');
  }
}

// 지도교사 코멘트 UI 상태 반영 (기본 디폴트값: 없음)
function updateTeacherCommentUI(log) {
  var commentWrapper = document.getElementById('learnModalCommentWrapper');
  var commentBtn = document.getElementById('btnToggleTeacherComment');
  var commentEditor = document.getElementById('learnModalCommentEditor');
  var commentCard = document.getElementById('learnModalCommentCard');
  var commentDisplay = document.getElementById('learnModalCommentDisplay');
  var commentInput = document.getElementById('learnModalCommentInput');
  var commentEmptyGuide = document.getElementById('learnModalCommentEmptyGuide');
  var charCount = document.getElementById('commentCharCount');

  if (commentEditor) commentEditor.style.display = 'none';

  if (log && log.comment && log.comment.trim() !== '') {
    // 코멘트가 직접 작성되어 존재할 때
    if (commentWrapper) commentWrapper.classList.remove('no-comment');
    if (commentBtn) {
      commentBtn.className = 'btn btn-xs btn-outline-secondary';
      commentBtn.innerHTML = '<i class="fa-solid fa-pen mr-1"></i>교사 코멘트 수정';
    }
    if (commentCard) commentCard.style.display = 'block';
    if (commentDisplay) commentDisplay.innerText = log.comment;
    if (commentInput) commentInput.value = log.comment;
    if (commentEmptyGuide) commentEmptyGuide.style.display = 'none';
    if (charCount) charCount.innerText = log.comment.length + '자 작성됨';
  } else {
    // 코멘트가 없을 때 (디폴트값: 없음)
    if (commentWrapper) commentWrapper.classList.add('no-comment');
    if (commentBtn) {
      commentBtn.className = 'btn btn-xs btn-outline-primary';
      commentBtn.innerHTML = '<i class="fa-solid fa-pen-to-square mr-1"></i>교사 코멘트 넣기';
    }
    if (commentCard) commentCard.style.display = 'none';
    if (commentDisplay) commentDisplay.innerText = '';
    if (commentInput) commentInput.value = '';
    if (commentEmptyGuide) commentEmptyGuide.style.display = 'block';
    if (charCount) charCount.innerText = '0자 작성됨';
  }
}

// 교사 코멘트 넣기 / 수정 에디터 열기
function openTeacherCommentEditor() {
  var editor = document.getElementById('learnModalCommentEditor');
  var emptyGuide = document.getElementById('learnModalCommentEmptyGuide');
  var input = document.getElementById('learnModalCommentInput');
  if (editor) {
    editor.style.display = 'block';
    if (emptyGuide) emptyGuide.style.display = 'none';
    if (input) {
      input.focus();
    }
  }
}

// 교사 코멘트 에디터 닫기
function closeTeacherCommentEditor() {
  var editor = document.getElementById('learnModalCommentEditor');
  if (editor) editor.style.display = 'none';

  if (currentOpenLearningLogId) {
    var allLogs = getLoadedLearningLogs();
    var log = allLogs.find(function(l) { return l.id === currentOpenLearningLogId; });
    if (log) {
      updateTeacherCommentUI(log);
      if (log.comment && log.comment.trim()) {
        showAcademyToast('지도교사 첨삭 코멘트가 저장되었습니다.');
      }
    }
  }
}

// 교사 코멘트 직접 타이핑 입력 처리
async function onTeacherCommentInput(val) {
  var charCount = document.getElementById('commentCharCount');
  if (charCount) charCount.innerText = val.length + '자 작성됨';

  if (!currentOpenLearningLogId) return;
  var allLogs = getLoadedLearningLogs();
  var log = allLogs.find(function(l) { return l.id === currentOpenLearningLogId; });
  if (!log) return;

  log.comment = val;
  log.reviewed = val.trim() ? '첨삭 완료' : '첨삭 전';
  if (!await saveCustomLearningLogs(allLogs)) return;

  var display = document.getElementById('learnModalCommentDisplay');
  var card = document.getElementById('learnModalCommentCard');
  var wrapper = document.getElementById('learnModalCommentWrapper');
  var btn = document.getElementById('btnToggleTeacherComment');

  if (val.trim()) {
    if (display) display.innerText = val;
    if (card) card.style.display = 'block';
    if (wrapper) wrapper.classList.remove('no-comment');
    if (btn) {
      btn.className = 'btn btn-xs btn-outline-secondary';
      btn.innerHTML = '<i class="fa-solid fa-pen mr-1"></i>교사 코멘트 수정';
    }
  } else {
    if (display) display.innerText = '';
    if (card) card.style.display = 'none';
    if (wrapper) wrapper.classList.add('no-comment');
    if (btn) {
      btn.className = 'btn btn-xs btn-outline-primary';
      btn.innerHTML = '<i class="fa-solid fa-pen-to-square mr-1"></i>교사 코멘트 넣기';
    }
  }

  // 테이블 내 첨삭 상태 배지 실시간 갱신
  renderLearningTable();
}

// 교사 코멘트 비우기 (삭제하여 디폴트값으로 원복)
function clearTeacherComment() {
  var input = document.getElementById('learnModalCommentInput');
  if (input) input.value = '';
  onTeacherCommentInput('');
  closeTeacherCommentEditor();
  showAcademyToast('교사 코멘트가 삭제되어 기본값(없음)으로 변경되었습니다.');
}

// 카카오 알림톡 발송 전문 보기 모달 열기
function openAcademyDispatchDetailModal(dispatchId) {
  var l = academyDispatchLogs.find(function(item) { return item.id === dispatchId; });
  if (!l) {
    showAcademyToast('알림톡 발송 전문 정보를 찾을 수 없습니다.');
    return;
  }

  var timeEl = document.getElementById('acadDispatchModalTime');
  if (timeEl) timeEl.innerText = l.date;

  var receiverEl = document.getElementById('acadDispatchModalReceiver');
  if (receiverEl) receiverEl.innerText = l.receiver;

  var statusEl = document.getElementById('acadDispatchModalStatus');
  if (statusEl) {
    statusEl.className = 'badge-soft ' + (l.status === 'SUCCESS' ? 'badge-soft-success' : 'badge-soft-danger');
    statusEl.innerText = l.status === 'SUCCESS' ? '발송 성공 (알리고 0000)' : '발송 실패';
  }

  var thoughtStatusEl = document.getElementById('acadDispatchModalThoughtIncluded');
  if (thoughtStatusEl) {
    if (l.thoughtHidden) {
      thoughtStatusEl.className = 'badge-soft badge-soft-warn';
      thoughtStatusEl.innerText = '숨김 제외 (카톡 본문에 미포함)';
    } else {
      thoughtStatusEl.className = 'badge-soft badge-soft-success';
      thoughtStatusEl.innerText = l.hasComment ? '포함 (학생답안 + 교사코멘트)' : '포함 (학생답안)';
    }
  }

  var bodyEl = document.getElementById('acadDispatchModalBody');
  if (bodyEl) {
    var sName = l.studentName || (l.receiver ? l.receiver.split(' ')[0] : '원생');
    var bTitle = l.bookTitle || '도서';
    var score = l.score || 100;

    var content = `[나노의 책장] ${sName} 학생 학습 리포트 안내

학부모님, 안녕하십니까.
나노 독서아카데미 본원에서 ${sName} 학생의 독서 및 북퀴즈 완독 리포트를 안내해 드립니다.

■ 완독 도서: ${bTitle}
■ 북퀴즈 결과: ${score}점 (완독 인증 완료)
■ 응시 일시: ${l.date}`;

    if (l.thoughtHidden) {
      content += `\n\n※ 본 학습 리포트는 학원 지도 방침에 따라 '생각 담기' 영역이 제외되어 발송되었습니다.`;
    } else {
      content += `\n\n■ 생각 담기: 학생 서술 답안 제출 완료`;
      if (l.comment && l.comment.trim()) {
        content += `\n■ 지도교사 첨삭:\n"${l.comment.trim()}"`;
      }
    }

    content += `\n\n상세한 북퀴즈 문항별 채점 결과는 아래 링크에서 확인하실 수 있습니다.`;
    bodyEl.innerText = content;
  }

  if (window.jQuery && typeof $('#academyDispatchDetailModal').modal === 'function') {
    $('#academyDispatchDetailModal').modal('show');
  } else {
    showModalVanilla('academyDispatchDetailModal');
  }
}

// ==============================================================
// 5. 도서 배정 모듈 (개별 원생 맞춤 배정 1순위 & 학급별 배정 분리)
// ==============================================================
var currentAssignSection = 'student'; // 'student' (1순위 기본) 또는 'class'

// 학원 보유 도서 여부 판별 헬퍼 (콘텐츠 관리 isOwned 및 기본 보유 도서, 직접 등록 도서 통합 판별)
function isBookOwnedByAcademy(book) {
  if (!book) return false;
  if (book.isOwned !== undefined) return !!book.isOwned;
  if (book.isAcademyOwned !== undefined) return !!book.isAcademyOwned;
  if (book.owned !== undefined) return !!book.owned;
  // 기본적으로 1001, 1002, 1003, 1004, 1005 및 본원 등록 도서는 보유 도서로 처리
  var defaultOwnedIds = ['1001', '1002', '1003', '1004', '1005', '1006'];
  return defaultOwnedIds.indexOf(String(book.id)) !== -1 || book.creatorType === 'ACADEMY';
}

// 1) 개별 원생 맞춤 도서 배정 데이터셋 (각 도서별 배정 일시 assignedAt 포함)
var studentAssignmentList = [];
var classAssignmentList = [];
var assignmentLoadError = false;
(function restoreAssignmentsData() {
  try {
    var saved = NanoPreviewData.readAssignments(currentAcademyInfo.id);
    studentAssignmentList = saved.students;
    classAssignmentList = saved.classes;
  } catch(e) { assignmentLoadError = true; console.warn(e); }
})();
function syncAssignmentsData() {
  try {
    if (assignmentLoadError) throw new Error('기존 배정 목록을 읽지 못해 덮어쓰기를 중단했습니다.');
    NanoPreviewData.saveAssignments(currentAcademyInfo.id, studentAssignmentList, classAssignmentList);
    return true;
  } catch(e) {
    showAcademyToast('배정 저장 실패: ' + e.message + ' 현재 화면의 변경 사항은 저장되지 않았습니다.');
    return false;
  }
}

var lastAddedStudentAssignId = null;
var lastAddedClassAssignId = null;

// 서브 섹션 전환 (개별 원생 배정 vs 학급별 배정)
function switchAssignSubSection(sec) {
  currentAssignSection = sec;
  var secClass = document.getElementById('assign-section-class');
  var secStudent = document.getElementById('assign-section-student');
  var btnClass = document.getElementById('btn-assign-sub-class');
  var btnStudent = document.getElementById('btn-assign-sub-student');

  if (sec === 'student') {
    if (secStudent) secStudent.style.display = 'block';
    if (secClass) secClass.style.display = 'none';
    if (btnStudent) btnStudent.classList.add('active');
    if (btnClass) btnClass.classList.remove('active');
  } else {
    if (secStudent) secStudent.style.display = 'none';
    if (secClass) secClass.style.display = 'block';
    if (btnStudent) btnStudent.classList.remove('active');
    if (btnClass) btnClass.classList.add('active');
  }
}

// 1. 개별 원생 배정 테이블 렌더링 (20개씩 페이징 처리 & 총 배정 도서 권수 연동)
var assignStudentCurrentPage = 1;
var ASSIGN_STUDENT_PAGE_SIZE = 20;
var currentFilteredStudentAssignments = null;

// 개별 원생 배정 도서의 실시간 북퀴즈 인증 상태 및 완독 수 동기화
function syncStudentAssignmentsWithLearningLogs(list) {
  var targetList = list || studentAssignmentList;
  if (!Array.isArray(targetList) || targetList.length === 0) return;
  var allLogs = (typeof getLoadedLearningLogs === 'function') ? getLoadedLearningLogs() : [];
  if (!allLogs || allLogs.length === 0) return;

  targetList.forEach(function(item) {
    if (!item || !item.books || !Array.isArray(item.books)) return;

    // 해당 원생의 학습 로그 필터링
    var sLogs = allLogs.filter(function(l) {
      var matchId = (l.studentId && (l.studentId === item.studentId || l.studentId === item.id || l.studentId === item.username));
      var matchName = (l.studentName && l.studentName === item.studentName);
      return matchId || matchName;
    });

    item.books.forEach(function(b) {
      if (!b) return;
      var cleanBTitle = b.title ? String(b.title).replace(/\s+/g, '').toLowerCase() : '';
      
      var matched = sLogs.find(function(l) {
        var cleanLTitle = l.bookTitle ? String(l.bookTitle).replace(/\s+/g, '').toLowerCase() : '';
        var matchTitle = cleanBTitle && cleanLTitle && (cleanBTitle === cleanLTitle || cleanBTitle.includes(cleanLTitle) || cleanLTitle.includes(cleanBTitle));
        var matchBookId = (b.id && l.bookId && String(b.id) === String(l.bookId));
        var passed = (Number(l.score) >= 60 || l.pass === true);
        return (matchTitle || matchBookId) && passed;
      });

      if (matched) {
        b.certified = true;
        var rawDate = matched.date || matched.submittedAt || '';
        if (rawDate) {
          var dMatch = rawDate.match(/(\d{4})[^\d]?(\d{1,2})[^\d]?(\d{1,2})/);
          if (dMatch) {
            b.certDate = parseInt(dMatch[2], 10) + '월 ' + parseInt(dMatch[3], 10) + '일';
          } else {
            b.certDate = rawDate.slice(0, 10);
          }
        } else {
          b.certDate = '인증 완료';
        }
      }
    });

    // 완독 권수 및 상태 재계산
    var completedCount = item.books.filter(isAssignmentBookCertified).length;
    item.completedBooks = completedCount;
    if (item.books.length > 0 && completedCount >= item.books.length) {
      item.status = `완료 (${completedCount}/${item.books.length}권)`;
    } else if (item.books.length > 0) {
      item.status = `읽는 중 (${completedCount}/${item.books.length}권)`;
    } else {
      item.status = '배정 없음';
    }
  });
}

function renderStudentAssignmentTable(list) {
  var tbody = document.getElementById('studentAssignmentTableBody');
  if (!tbody) return;
  tbody.innerHTML = '';

  if (list !== undefined) {
    currentFilteredStudentAssignments = list;
  }

  var isT = isCurrentLoggedInTeacher();
  var assignedClassList = isT ? getTeacherAssignedClasses() : null;
  var assignedClassNames = assignedClassList ? assignedClassList.map(function(c) { return c.name; }) : null;

  var baseList = studentAssignmentList;
  if (isT && assignedClassNames) {
    baseList = studentAssignmentList.filter(function(item) {
      return item.classGroup && assignedClassNames.indexOf(item.classGroup) !== -1;
    });
  }

  // 학습 로그와 실시간 연동 (퀴즈 응시 완료 도서 인증일 및 완독 권수 동기화)
  syncStudentAssignmentsWithLearningLogs(baseList);

  // 상단 통계 갱신
  var countEl = document.getElementById('assignStudentCount');
  if (countEl) countEl.innerText = baseList.length;

  // 배정 도서 총 권수 및 완독률 실시간 계산
  var totalBooksSum = 0;
  var totalCompletedSum = 0;
  baseList.forEach(function(s) {
    totalBooksSum += (s.books ? s.books.length : 0);
    totalCompletedSum += (s.completedBooks || 0);
  });
  var totalBookEl = document.getElementById('assignTotalBookCount');
  if (totalBookEl) totalBookEl.innerText = totalBooksSum;

  var rateEl = document.getElementById('assignCompletionRate');
  if (rateEl) {
    rateEl.innerText = totalBooksSum > 0 ? ((totalCompletedSum / totalBooksSum) * 100).toFixed(1) : '0.0';
  }

  var dataList = currentFilteredStudentAssignments !== null ? currentFilteredStudentAssignments : baseList;
  if (isT && assignedClassNames && currentFilteredStudentAssignments !== null) {
    dataList = dataList.filter(function(item) {
      return item.classGroup && assignedClassNames.indexOf(item.classGroup) !== -1;
    });
  }

  var totalCount = dataList.length;
  var totalPages = Math.ceil(totalCount / ASSIGN_STUDENT_PAGE_SIZE) || 1;
  if (assignStudentCurrentPage > totalPages) assignStudentCurrentPage = totalPages;
  if (assignStudentCurrentPage < 1) assignStudentCurrentPage = 1;

  if (totalCount === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="text-center py-5 text-muted"><i class="fa-solid fa-folder-open mb-2" style="font-size:26px; opacity:0.6;"></i><br>배정된 원생이 없습니다.</td></tr>';
    renderAssignStudentPagination(0, 1, 1);
    return;
  }

  var startIndex = (assignStudentCurrentPage - 1) * ASSIGN_STUDENT_PAGE_SIZE;
  var pagedData = dataList.slice(startIndex, startIndex + ASSIGN_STUDENT_PAGE_SIZE);

  pagedData.forEach(function(item, idx) {
    var tr = document.createElement('tr');
    if (item.id === lastAddedStudentAssignId) tr.className = 'row-highlight-new';

    var globalIdx = startIndex + idx + 1;

    // 도서 렌더링: 5권 초과 시 5권까지만 노출 후 '... 외 N권 (총 M권)' 버튼 표시
    var totalBooks = item.books || [];
    var displayBooks = totalBooks.slice(0, 5);
    var remainingCount = totalBooks.length - 5;

    var booksHtml = displayBooks.map(function(b) {
      var pubName = b.pub || b.publisher || '출판사';
      var isCert = !!(b.certDate || b.certified);
      var certDateStr = b.certDate || (b.certified ? '인증 완료' : '');
      var certIcon = isCert
        ? `<i class="fa-solid fa-circle-check text-success ml-1" title="북퀴즈 인증 완료${certDateStr ? ' (' + certDateStr + ')' : ''}" style="font-size: 11px; flex-shrink: 0;"></i>`
        : '';

      return `<div class="d-inline-flex align-items-center p-1 px-2 mr-2 mb-1 rounded border shadow-xs" style="background:#ffffff; font-size:12px; border-color: var(--border-light) !important;">
        <img src="${b.cover}" style="width:24px; height:32px; object-fit:cover; border-radius:4px; margin-right:8px; border: 1px solid #ddd; flex-shrink: 0;" onerror="this.onerror=null; this.src='resources/images/book_default.svg';">
        <div style="line-height: 1.25;">
          <div class="d-flex align-items-center">
            <strong style="color:var(--text-main); font-size: 12.5px; display: inline-block;">${b.title}</strong>
            ${certIcon}
          </div>
          <small class="text-muted" style="font-size: 11px;">${pubName}</small>
        </div>
      </div>`;
    }).join('');

    var moreBadgeHtml = remainingCount > 0 
      ? `<button type="button" class="btn btn-xs btn-outline-secondary font-weight-bold ml-1 mb-1" onclick="openIndividualAssignModal('${item.studentId}')" style="border-radius: 6px; font-size: 11px; padding: 4px 8px;">
           ... 외 ${remainingCount}권 (총 ${totalBooks.length}권)
         </button>`
      : `<span class="badge badge-secondary ml-1" style="font-size:11px;">총 ${totalBooks.length}권</span>`;

    var latestAssignedAt = item.books && item.books.length > 0 && item.books[item.books.length - 1].assignedAt
      ? item.books[item.books.length - 1].assignedAt
      : (item.assignDate || '-');

    var statusText = item.status || (item.books && item.books.length ? `읽는 중 (${item.completedBooks || 0}/${item.books.length}권)` : '배정 없음');
    var statusBadge = (statusText.indexOf('완료') !== -1 || statusText.indexOf('합격') !== -1)
      ? `<span class="badge-soft badge-soft-success font-weight-bold"><i class="fa-solid fa-circle-check mr-1"></i>${statusText}</span>`
      : `<span class="badge-soft badge-soft-warn font-weight-bold"><i class="fa-solid fa-book-open-reader mr-1"></i>${statusText}</span>`;

    tr.innerHTML = `
      <td class="text-center"><small class="text-muted font-weight-bold">${globalIdx}</small></td>
      <td>
        <div class="d-flex align-items-center flex-wrap" style="gap: 5px;">
          <strong style="font-size: 14px; color: var(--text-main);">${item.studentName}</strong>
          <span class="text-muted font-weight-bold" style="font-size: 12.5px;">(${item.studentId})</span>
          <span class="badge-soft badge-soft-neutral font-weight-bold" style="font-size: 11px; padding: 2px 7px; border-radius: 6px;">${item.classGroup || '반미정'}</span>
          ${item.id === lastAddedStudentAssignId ? '<span class="badge badge-warning text-dark" style="font-size:10px;">신규</span>' : ''}
        </div>
        <small class="text-muted d-block mt-0.5" style="font-size: 11.5px;">${item.school || '나노초'} ${item.grade || ''}</small>
      </td>
      <td>
        <div class="d-flex flex-wrap align-items-center">
          ${booksHtml}
          ${moreBadgeHtml}
        </div>
      </td>
      <td class="text-center"><small class="text-muted font-weight-bold">${latestAssignedAt}</small></td>
      <td class="text-center">${statusBadge}</td>
      <td class="text-center">
        <button class="btn btn-xs btn-outline-primary mr-1 font-weight-bold" onclick="openIndividualAssignModal('${item.studentId}')" style="border-radius:6px; font-size:11.5px; padding:3px 8px;">
          <i class="fa-solid fa-sliders mr-1"></i>도서 관리
        </button>
        <button class="btn btn-xs btn-outline-danger" onclick="cancelStudentAssignment('${item.id}')" style="border-radius:6px; font-size:11.5px; padding:3px 6px;">삭제</button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  renderAssignStudentPagination(totalCount, assignStudentCurrentPage, totalPages);
}

// 20개씩 페이징 컨트롤러 렌더링
function renderAssignStudentPagination(total, page, totalPages) {
  var wrap = document.getElementById('assignStudentPaginationWrap');
  if (!wrap) return;

  if (total === 0) {
    wrap.innerHTML = '<span class="text-muted" style="font-size: 12px;">배정된 원생이 없습니다.</span>';
    return;
  }

  var startItem = (page - 1) * ASSIGN_STUDENT_PAGE_SIZE + 1;
  var endItem = Math.min(page * ASSIGN_STUDENT_PAGE_SIZE, total);

  var infoHtml = `
    <div class="text-muted" style="font-size: 12.5px;">
      전체 <strong class="text-dark">${total}</strong>명 중 <strong class="text-dark">${startItem} - ${endItem}</strong>명 표시
      <span class="badge badge-light border text-muted ml-2" style="font-size: 11px;">(페이지당 20명)</span>
    </div>
  `;

  var pagesHtml = '';
  var startP = Math.max(1, page - 2);
  var endP = Math.min(totalPages, page + 2);

  var prevDisabled = page <= 1 ? 'disabled' : '';
  pagesHtml += `<button type="button" class="btn btn-xs btn-outline-secondary mr-1" onclick="goAssignStudentPage(${page - 1})" ${prevDisabled} style="border-radius: 6px; padding: 4px 8px;"><i class="fa-solid fa-chevron-left"></i></button>`;

  if (startP > 1) {
    pagesHtml += `<button type="button" class="btn btn-xs btn-outline-secondary mr-1" onclick="goAssignStudentPage(1)" style="border-radius: 6px; padding: 4px 8px;">1</button>`;
    if (startP > 2) pagesHtml += `<span class="px-1 text-muted">...</span>`;
  }

  for (var i = startP; i <= endP; i++) {
    var activeClass = i === page ? 'btn-beige-primary font-weight-bold' : 'btn-outline-secondary';
    pagesHtml += `<button type="button" class="btn btn-xs ${activeClass} mr-1" onclick="goAssignStudentPage(${i})" style="border-radius: 6px; min-width: 28px; padding: 4px 8px;">${i}</button>`;
  }

  if (endP < totalPages) {
    if (endP < totalPages - 1) pagesHtml += `<span class="px-1 text-muted">...</span>`;
    pagesHtml += `<button type="button" class="btn btn-xs btn-outline-secondary mr-1" onclick="goAssignStudentPage(${totalPages})" style="border-radius: 6px; padding: 4px 8px;">${totalPages}</button>`;
  }

  var nextDisabled = page >= totalPages ? 'disabled' : '';
  pagesHtml += `<button type="button" class="btn btn-xs btn-outline-secondary" onclick="goAssignStudentPage(${page + 1})" ${nextDisabled} style="border-radius: 6px; padding: 4px 8px;"><i class="fa-solid fa-chevron-right"></i></button>`;

  wrap.innerHTML = infoHtml + `<div class="d-flex align-items-center">${pagesHtml}</div>`;
}

function goAssignStudentPage(p) {
  assignStudentCurrentPage = p;
  renderStudentAssignmentTable();
}

function renderAssignmentTable() {
  renderStudentAssignmentTable();
}

function filterStudentAssignments() {
  assignStudentCurrentPage = 1;
  var classVal = document.getElementById('filterAssignStudentClass') ? document.getElementById('filterAssignStudentClass').value : 'ALL';
  var query = ((document.getElementById('searchAssignStudentInput') ? document.getElementById('searchAssignStudentInput').value : '') || '').toLowerCase().trim();

  var isT = isCurrentLoggedInTeacher();
  var assignedClasses = isT ? getTeacherAssignedClasses() : null;
  var assignedClassNames = assignedClasses ? assignedClasses.map(function(c) { return c.name; }) : null;

  var filtered = studentAssignmentList.filter(function(item) {
    if (assignedClassNames && (!item.classGroup || assignedClassNames.indexOf(item.classGroup) === -1)) {
      return false;
    }
    var matchClass = (classVal === 'ALL') || (item.classGroup === classVal);
    var matchQuery = !query || 
      item.studentName.toLowerCase().indexOf(query) !== -1 || 
      item.studentId.toLowerCase().indexOf(query) !== -1 || 
      ((item.school || '').toLowerCase().indexOf(query) !== -1);
    return matchClass && matchQuery;
  });
  renderStudentAssignmentTable(filtered);
}

// ==============================================================
// [기능 추가 1] 인증 도서 일괄 삭제 (전체 배정 내역에서 인증 도서 일괄 정리)
// ==============================================================
function isAssignmentBookCertified(b) {
  if (!b) return false;
  return b.certified === true || !!b.certDate || b.status === '완료' || b.status === '합격';
}

function cleanCertifiedStudentAssignments() {
  var totalCertCount = 0;
  var affectedStudentCount = 0;

  studentAssignmentList.forEach(function(item) {
    if (!item.books || !item.books.length) return;
    var certBooks = item.books.filter(isAssignmentBookCertified);
    if (certBooks.length > 0) {
      totalCertCount += certBooks.length;
      affectedStudentCount++;
    }
  });

  if (totalCertCount === 0) {
    showAcademyToast('현재 배정 목록에 북퀴즈 인증이 완료된 도서가 없습니다.');
    return;
  }

  var msg = `전체 배정 내역에서 북퀴즈 인증 완료된 도서 총 ${totalCertCount}권을 목록에서 일괄 정리(삭제)하시겠습니까?\n\n`
          + `· 대상 원생 : 총 ${affectedStudentCount}명\n`
          + `· 정리 대상 도서 : 총 ${totalCertCount}권\n\n`
          + `* 아직 인증되지 않고 읽고 있는 도서는 안전하게 보존됩니다.`;

  if (!confirm(msg)) return;

  studentAssignmentList.forEach(function(item) {
    if (!item.books || !item.books.length) return;
    item.books = item.books.filter(function(b) {
      return !isAssignmentBookCertified(b);
    });
    item.completedBooks = 0;
    item.status = item.books.length > 0 ? `읽는 중 (0/${item.books.length}권)` : '배정 없음';
  });

  currentFilteredStudentAssignments = null;
  syncAssignmentsData();
  renderStudentAssignmentTable();
  showAcademyToast(`인증 완료 도서 총 ${totalCertCount}권이 배정 목록에서 일괄 정리되었습니다.`);
}

// ==============================================================
// [기능 추가 2] 학급 일괄 배정 2 Depth 모달 로직
// 1 Depth: 학급 선택 ➔ 2 Depth: 배정 도서 선택 & 일괄 반영
// ==============================================================
var batchSelectedClassName = null;
var batchSelectedBooks = [];
var batchCatalogCurrentPage = 1;
var BATCH_CATALOG_PAGE_SIZE = 20;

function openBatchClassAssignModal() {
  batchSelectedClassName = null;
  batchSelectedBooks = [];
  batchCatalogCurrentPage = 1;

  backToBatchClassDepth1();
  $('#modalBatchClassAssign').modal('show');
}

function backToBatchClassDepth1() {
  var d1 = document.getElementById('batchClassAssignDepth1');
  var d2 = document.getElementById('batchClassAssignDepth2');
  if (d1) d1.style.display = 'block';
  if (d2) d2.style.display = 'none';

  renderBatchClassCardList();
}

function renderBatchClassCardList() {
  var container = document.getElementById('batchClassCardList');
  if (!container) return;
  container.innerHTML = '';

  var classList = [];
  var isT = isCurrentLoggedInTeacher();
  if (isT) {
    classList = getTeacherAssignedClasses();
  } else if (typeof academyClassList !== 'undefined' && academyClassList.length > 0) {
    classList = academyClassList;
  } else {
    var groupSet = {};
    studentDataList.forEach(function(s) {
      if (s.classGroup) groupSet[s.classGroup] = true;
    });
    classList = Object.keys(groupSet).map(function(grp) {
      return { name: grp, grade: '정규반', teacher: '지도교사' };
    });
  }

  if (classList.length === 0) {
    if (isT) {
      container.innerHTML = '<div class="col-12 text-center py-5 text-muted"><i class="fa-solid fa-chalkboard mb-2" style="font-size:32px; opacity:0.5;"></i><br><strong style="font-size:14px;">현재 본인 담당으로 지정되어 있는 학급이 없습니다.</strong><br><small class="text-muted">원장님 계정에서 학급 담당 교사 지정을 확인해 주세요.</small></div>';
      updateBatchClassSelectionUI();
      return;
    }
    classList = [
      { name: '지혜반', grade: '초등 5학년', teacher: '김혜진 선생님' },
      { name: '슬기반', grade: '초등 4학년', teacher: '이민호 선생님' },
      { name: '마스터반', grade: '초등 6학년', teacher: '박서연 선생님' }
    ];
  }

  // 개설 학급 목록: 학급명 오름차순(가나다 / 알파벳) 정렬
  classList = classList.slice().sort(function(a, b) {
    var nameA = String((a && a.name) || '').trim();
    var nameB = String((b && b.name) || '').trim();
    return nameA.localeCompare(nameB, 'ko', { numeric: true, sensitivity: 'base' });
  });

  classList.forEach(function(cls) {
    var classStudents = studentDataList.filter(function(s) { return s.classGroup === cls.name; });
    var studentCount = classStudents.length;
    var previewNames = classStudents.slice(0, 5).map(function(s) { return s.name; }).join(', ');
    if (classStudents.length > 5) previewNames += ` 외 ${classStudents.length - 5}명`;
    if (!previewNames) previewNames = '소속 원생 없음';

    var isSelected = batchSelectedClassName === cls.name;
    var col = document.createElement('div');
    col.className = 'col-md-6 mb-3';
    col.innerHTML = `
      <div class="p-3 rounded bg-white shadow-xs batch-class-card" onclick="selectBatchClass('${cls.name}')"
        style="border: 2px solid ${isSelected ? '#2b7a3e' : 'var(--border-light)'}; background: ${isSelected ? '#f0fdf4' : '#ffffff'}; cursor: pointer; transition: all 0.2s; position: relative; border-radius: 12px;">
        <div class="d-flex justify-content-between align-items-center mb-1.5">
          <div class="d-flex align-items-center">
            <div style="width: 32px; height: 32px; border-radius: 8px; background: ${isSelected ? '#2b7a3e' : '#ede7dc'}; color: ${isSelected ? '#fff' : '#4a3f35'}; display: flex; align-items: center; justify-content: center; font-size: 14px; margin-right: 10px;">
              <i class="fa-solid fa-users"></i>
            </div>
            <strong style="font-size: 15px; color: var(--text-main);">${cls.name}</strong>
          </div>
          <div>
            <span class="badge ${studentCount > 0 ? 'badge-success' : 'badge-light border text-muted'} px-2 py-1" style="font-size: 11.5px;">
              원생 ${studentCount}명
            </span>
            ${isSelected ? '<span class="badge badge-success ml-1"><i class="fa-solid fa-check mr-1"></i>선택됨</span>' : ''}
          </div>
        </div>
        <div class="text-muted mb-1" style="font-size: 12px;">
          <span>${cls.grade || cls.targetGrade || '전학년'}</span> &middot; <span>${cls.teacher || '담당교사'}</span>
        </div>
        <div class="text-truncate" style="font-size: 11.5px; color: #6b7280; background: #faf8f5; padding: 4px 8px; border-radius: 6px;">
          <i class="fa-solid fa-user-tag mr-1 text-muted"></i>${previewNames}
        </div>
      </div>
    `;
    container.appendChild(col);
  });

  updateBatchClassSelectionUI();
}

function selectBatchClass(className) {
  batchSelectedClassName = className;
  renderBatchClassCardList();
}

function updateBatchClassSelectionUI() {
  var banner = document.getElementById('batchClassSelectedBanner');
  var bannerIcon = document.getElementById('batchClassBannerIcon');
  var titleEl = document.getElementById('batchClassSelectedTitle');
  var countEl = document.getElementById('batchClassSelectedStudentCount');
  var namesEl = document.getElementById('batchClassSelectedNames');
  var step2Btn = document.getElementById('batchClassStep2Btn');
  var nextBtn = document.getElementById('btnGoToDepth2');

  if (batchSelectedClassName) {
    var classStudents = (typeof studentDataList !== 'undefined' && Array.isArray(studentDataList))
      ? studentDataList.filter(function(s) { return s.classGroup === batchSelectedClassName; })
      : [];
    var previewNames = classStudents.slice(0, 8).map(function(s) { return s.name; }).join(', ');
    if (classStudents.length > 8) previewNames += ' 외 ' + (classStudents.length - 8) + '명';

    if (banner) {
      banner.style.display = 'flex';
      banner.style.background = '#f0fdf4';
      banner.style.border = '1.5px solid #2b7a3e';
      banner.style.boxShadow = '0 2px 8px rgba(43, 122, 62, 0.12)';
    }
    if (bannerIcon) {
      bannerIcon.className = 'fa-solid fa-circle-check text-success mr-2.5';
    }
    if (titleEl) {
      titleEl.innerText = batchSelectedClassName;
      titleEl.style.color = '#1b4d27';
    }
    if (countEl) {
      countEl.innerText = '대상 원생: 총 ' + classStudents.length + '명';
    }
    if (namesEl) {
      namesEl.innerText = '소속 원생: ' + (previewNames || '원생 없음');
    }
    if (step2Btn) {
      step2Btn.disabled = false;
      step2Btn.className = 'btn btn-sm btn-beige-primary font-weight-bold px-3';
      step2Btn.style.cssText = 'background: #2b7a3e; color: #fff; border: 1px solid #236533; cursor: pointer; opacity: 1; border-radius: 8px; box-shadow: 0 2px 6px rgba(43,122,62,0.25);';
    }
    if (nextBtn) nextBtn.disabled = false;
  } else {
    // 학급 선택 전: 알림 문구 표시 및 버튼 비활성화
    if (banner) {
      banner.style.display = 'flex';
      banner.style.background = '#faf8f5';
      banner.style.border = '1.5px solid #d4c4b0';
      banner.style.boxShadow = 'none';
    }
    if (bannerIcon) {
      bannerIcon.className = 'fa-solid fa-circle-info text-warning mr-2.5';
    }
    if (titleEl) {
      titleEl.innerText = '학급을 선택해 주세요.';
      titleEl.style.color = 'var(--text-main)';
    }
    if (countEl) {
      countEl.innerText = '';
    }
    if (namesEl) {
      namesEl.innerText = '상단 목록에서 도서를 일괄 배정할 학급을 클릭하여 선택해 주세요.';
    }
    if (step2Btn) {
      step2Btn.disabled = true;
      step2Btn.className = 'btn btn-sm font-weight-bold px-3';
      step2Btn.style.cssText = 'background: #e8e2d8; color: #9c9285; border: 1px solid #d8d0c4; cursor: not-allowed; opacity: 0.7; border-radius: 8px;';
    }
    if (nextBtn) nextBtn.disabled = true;
  }
}

function goToBatchClassDepth2() {
  if (!batchSelectedClassName) {
    showAcademyToast('도서를 배정할 학급을 먼저 선택해 주세요.');
    return;
  }

  var d1 = document.getElementById('batchClassAssignDepth1');
  var d2 = document.getElementById('batchClassAssignDepth2');
  if (d1) d1.style.display = 'none';
  if (d2) d2.style.display = 'block';

  var classStudents = studentDataList.filter(function(s) { return s.classGroup === batchSelectedClassName; });
  var titleEl = document.getElementById('batchTargetClassName');
  if (titleEl) titleEl.innerText = `[${batchSelectedClassName}] 도서 일괄 배정`;
  var metaEl = document.getElementById('batchTargetClassMeta');
  if (metaEl) metaEl.innerText = `대상 원생 총 ${classStudents.length}명 · 일괄 배정할 도서를 우측 목록에서 담아주세요.`;

  if (document.getElementById('batchBookSearchInput')) document.getElementById('batchBookSearchInput').value = '';
  if (document.getElementById('batchBookFilterGrade')) document.getElementById('batchBookFilterGrade').value = 'ALL';
  if (document.getElementById('batchBookFilterOrigin')) document.getElementById('batchBookFilterOrigin').value = 'ALL';
  if (document.getElementById('batchBookFilterCategory')) document.getElementById('batchBookFilterCategory').value = 'ALL';

  batchCatalogCurrentPage = 1;
  renderBatchSelectedBooks();
  renderBatchBookCatalog();
}

function renderBatchSelectedBooks() {
  var container = document.getElementById('batchSelectedBooksContainer');
  var badge = document.getElementById('batchSelectedBookCountBadge');
  if (badge) badge.innerText = `${batchSelectedBooks.length}권 선택됨`;
  if (!container) return;
  container.innerHTML = '';

  if (batchSelectedBooks.length === 0) {
    container.innerHTML = `
      <div class="text-center py-5 text-muted" style="background: #ffffff; border-radius: 12px; border: 1.5px dashed var(--border-medium); padding: 30px 15px;">
        <i class="fa-solid fa-cart-arrow-down mb-2 text-muted" style="font-size: 32px; opacity: 0.4;"></i>
        <div class="font-weight-bold" style="font-size: 13.5px; color: var(--text-main);">아직 선택된 도서가 없습니다.</div>
        <small class="text-muted d-block mt-1">우측 카탈로그에서 학급에 배정할 도서를 찾아<br><strong>[+ 도서 담기]</strong> 버튼을 눌러주세요.</small>
      </div>
    `;
    return;
  }

  batchSelectedBooks.forEach(function(b, idx) {
    var card = document.createElement('div');
    card.className = 'p-2.5 mb-2 rounded bg-white shadow-xs d-flex align-items-center justify-content-between';
    card.style.border = '1px solid var(--border-medium)';

    card.innerHTML = `
      <div class="d-flex align-items-center" style="flex: 1; min-width: 0; margin-right: 8px;">
        <img src="${b.cover || 'resources/images/book_default.svg'}" alt="" style="width: 38px; height: 52px; object-fit: cover; border-radius: 6px; border: 1px solid #ddd; margin-right: 10px; flex-shrink: 0;" onerror="this.onerror=null; this.src='resources/images/book_default.svg';">
        <div style="flex: 1; min-width: 0;">
          <div class="d-flex align-items-center mb-0.5">
            <span class="badge badge-light border text-muted mr-1" style="font-size: 10px;">#${idx + 1}</span>
            <strong class="text-truncate font-weight-bold" style="font-size: 13px; color: var(--text-main);" title="${b.title}">${b.title}</strong>
          </div>
          <small class="text-muted d-block text-truncate" style="font-size: 11px;">${b.publisher || b.pub || '출판사'} &middot; ${b.grade || '전체'}</small>
        </div>
      </div>
      <div>
        <button type="button" class="btn btn-xs btn-outline-danger" onclick="removeBookFromBatchList('${b.id}')" style="border-radius: 6px; font-size: 11px; padding: 3px 8px;">
          <i class="fa-solid fa-xmark"></i> 삭제
        </button>
      </div>
    `;
    container.appendChild(card);
  });
}

function addBookToBatchList(bookId) {
  var already = batchSelectedBooks.some(function(b) { return String(b.id) === String(bookId); });
  if (already) return;

  var book = academyBookList.find(function(b) { return String(b.id) === String(bookId); });
  if (!book) return;

  batchSelectedBooks.push(book);
  renderBatchSelectedBooks();
  renderBatchBookCatalog();
}

function removeBookFromBatchList(bookId) {
  batchSelectedBooks = batchSelectedBooks.filter(function(b) { return String(b.id) !== String(bookId); });
  renderBatchSelectedBooks();
  renderBatchBookCatalog();
}

function clearBatchSelectedBooks() {
  if (batchSelectedBooks.length === 0) return;
  batchSelectedBooks = [];
  renderBatchSelectedBooks();
  renderBatchBookCatalog();
}

function filterBatchBookCatalog() {
  batchCatalogCurrentPage = 1;
  renderBatchBookCatalog();
}

function renderBatchBookCatalog() {
  var container = document.getElementById('batchBookCatalogContainer');
  var paginationContainer = document.getElementById('batchBookCatalogPagination');
  if (!container) return;
  container.innerHTML = '';
  if (paginationContainer) paginationContainer.innerHTML = '';

  var query = (document.getElementById('batchBookSearchInput') ? document.getElementById('batchBookSearchInput').value : '').toLowerCase().trim();
  var gradeVal = document.getElementById('batchBookFilterGrade') ? document.getElementById('batchBookFilterGrade').value : 'ALL';
  var originVal = document.getElementById('batchBookFilterOrigin') ? document.getElementById('batchBookFilterOrigin').value : 'ALL';
  var categoryVal = document.getElementById('batchBookFilterCategory') ? document.getElementById('batchBookFilterCategory').value : 'ALL';

  var selectedIds = batchSelectedBooks.map(function(b) { return String(b.id); });

  var books = academyBookList.filter(function(b) {
    var matchQuery = !query || 
      b.title.toLowerCase().indexOf(query) !== -1 || 
      (b.author && b.author.toLowerCase().indexOf(query) !== -1) || 
      (b.publisher && b.publisher.toLowerCase().indexOf(query) !== -1) ||
      (b.category && b.category.toLowerCase().indexOf(query) !== -1);

    var matchGrade = true;
    if (gradeVal !== 'ALL') {
      matchGrade = bookGradeMatches(b.grade, gradeVal);
    }

    var matchOrigin = true;
    if (originVal !== 'ALL') {
      if (originVal === 'HQ') matchOrigin = !b.isCustom;
      else if (originVal === 'ACADEMY') matchOrigin = !!b.isCustom;
    }

    var matchCategory = true;
    if (categoryVal !== 'ALL') {
      matchCategory = b.category && b.category.indexOf(categoryVal) !== -1;
    }

    return matchQuery && matchGrade && matchOrigin && matchCategory;
  });

  var totalCount = books.length;
  var totalPages = Math.ceil(totalCount / BATCH_CATALOG_PAGE_SIZE) || 1;
  if (batchCatalogCurrentPage > totalPages) batchCatalogCurrentPage = totalPages;
  if (batchCatalogCurrentPage < 1) batchCatalogCurrentPage = 1;

  if (totalCount === 0) {
    container.innerHTML = '<div class="text-center py-4 text-muted"><i class="fa-solid fa-magnifying-glass mb-2" style="font-size:20px;"></i><br>조건에 맞는 도서가 없습니다.</div>';
    return;
  }

  var startIndex = (batchCatalogCurrentPage - 1) * BATCH_CATALOG_PAGE_SIZE;
  var pageBooks = books.slice(startIndex, startIndex + BATCH_CATALOG_PAGE_SIZE);

  pageBooks.forEach(function(b) {
    var isSelected = selectedIds.indexOf(String(b.id)) !== -1;
    var card = document.createElement('div');
    card.className = 'assign-catalog-card' + (isSelected ? ' in-cart' : '');
    card.style.background = '#ffffff';

    card.innerHTML = `
      <div style="position: relative; flex-shrink: 0; margin-right: 12px;">
        <img src="${b.cover || 'resources/images/book_default.svg'}" alt="" style="width: 44px; height: 60px; object-fit: cover; border-radius: 6px; border: 1px solid var(--border-medium);" onerror="this.onerror=null; this.src='resources/images/book_default.svg';">
        ${isSelected ? '<span style="position: absolute; top: -5px; right: -5px; width: 18px; height: 18px; border-radius: 50%; background: #2b7a3e; color: #fff; display: flex; align-items: center; justify-content: center; font-size: 10px;"><i class="fa-solid fa-check"></i></span>' : ''}
      </div>
      <div style="flex: 1; min-width: 0;">
        <div class="d-flex align-items-center mb-0.5">
          <strong class="text-truncate font-weight-bold" style="font-size: 13px; color: var(--text-main);" title="${b.title}">${b.title}</strong>
        </div>
        <div class="text-muted text-truncate mb-1" style="font-size: 11px;">
          <span>${b.publisher || b.pub || '출판사'}</span> &middot; <span>${b.author || '저자'}</span>
        </div>
        <div class="d-flex align-items-center gap-1 flex-wrap" style="font-size: 10.5px;">
          <span class="badge-soft badge-soft-neutral">${b.grade || '전체'}</span>
          <span class="badge badge-light text-success border"><i class="fa-solid fa-circle-check mr-1"></i>북퀴즈 완비</span>
        </div>
      </div>
      <div class="ml-2" style="flex-shrink: 0;">
        ${isSelected 
          ? `<button type="button" class="btn btn-xs btn-light border text-success font-weight-bold" disabled style="border-radius: 6px; font-size: 11px; padding: 4px 8px;">
               <i class="fa-solid fa-check mr-1"></i>담김
             </button>`
          : `<button type="button" class="btn btn-xs btn-beige-primary font-weight-bold" onclick="addBookToBatchList('${b.id}')" style="border-radius: 6px; font-size: 11px; padding: 4px 10px;">
               <i class="fa-solid fa-plus mr-1"></i>도서 담기
             </button>`
        }
      </div>
    `;
    container.appendChild(card);
  });

  renderBatchCatalogPagination(totalCount, batchCatalogCurrentPage, totalPages);
}

function renderBatchCatalogPagination(total, page, totalPages) {
  var container = document.getElementById('batchBookCatalogPagination');
  if (!container) return;

  if (total === 0 || totalPages <= 1) {
    container.innerHTML = `<span class="text-muted" style="font-size: 11.5px;">총 <strong>${total}</strong>권</span>`;
    return;
  }

  var startItem = (page - 1) * BATCH_CATALOG_PAGE_SIZE + 1;
  var endItem = Math.min(page * BATCH_CATALOG_PAGE_SIZE, total);

  var infoHtml = `<span class="text-muted" style="font-size: 11.5px;"><strong>${total}</strong>권 중 <strong>${startItem}-${endItem}</strong></span>`;

  var pagesHtml = '';
  var startP = Math.max(1, page - 1);
  var endP = Math.min(totalPages, page + 1);

  var prevDisabled = page <= 1 ? 'disabled' : '';
  pagesHtml += `<button type="button" class="btn btn-xs btn-outline-secondary mr-1" onclick="goBatchCatalogPage(${page - 1})" ${prevDisabled} style="border-radius: 4px; padding: 2px 6px;"><i class="fa-solid fa-chevron-left"></i></button>`;

  for (var i = startP; i <= endP; i++) {
    var activeClass = i === page ? 'btn-beige-primary font-weight-bold' : 'btn-outline-secondary';
    pagesHtml += `<button type="button" class="btn btn-xs ${activeClass} mr-1" onclick="goBatchCatalogPage(${i})" style="border-radius: 4px; min-width: 22px; padding: 2px 6px;">${i}</button>`;
  }

  var nextDisabled = page >= totalPages ? 'disabled' : '';
  pagesHtml += `<button type="button" class="btn btn-xs btn-outline-secondary" onclick="goBatchCatalogPage(${page + 1})" ${nextDisabled} style="border-radius: 4px; padding: 2px 6px;"><i class="fa-solid fa-chevron-right"></i></button>`;

  container.innerHTML = infoHtml + `<div>${pagesHtml}</div>`;
}

function goBatchCatalogPage(p) {
  batchCatalogCurrentPage = p;
  renderBatchBookCatalog();
}

var batchClassAssignSaving = false;
async function executeBatchClassAssign() {
  if (batchClassAssignSaving) return;
  if (!batchSelectedClassName) {
    showAcademyToast('학급이 선택되지 않았습니다.');
    return;
  }
  if (!batchSelectedBooks || batchSelectedBooks.length === 0) {
    showAcademyToast('배정할 도서를 1권 이상 담아주세요.');
    return;
  }

  var targetStudents = studentDataList.filter(function(s) {
    return s.classGroup === batchSelectedClassName;
  });

  if (targetStudents.length === 0) {
    showAcademyToast(`[${batchSelectedClassName}] 학급에 소속된 원생이 없습니다.`);
    return;
  }

  var confirmMsg = `[${batchSelectedClassName}] 소속 원생 총 ${targetStudents.length}명에게 선택한 도서 ${batchSelectedBooks.length}권을 일괄 배정하시겠습니까?\n\n`
                 + `* 이미 해당 도서를 배정받은 학생은 중복 추가되지 않고 유지되며, 미배정 학생에게만 안전하게 추가됩니다.`;

  if (!confirm(confirmMsg)) return;

  if (window.NanoPortal && NanoPortal.remote) {
    var remoteClass = academyClassList.find(function(item) { return item.name === batchSelectedClassName; });
    if (!remoteClass || !(remoteClass.serverId || remoteClass.id)) {
      showAcademyToast('학급 정보를 새로고침한 뒤 다시 시도해 주세요.');
      return;
    }
    var selectedClassName = batchSelectedClassName;
    var saveButton = document.getElementById('btnExecuteBatchClassAssign');
    var originalButtonHtml = saveButton ? saveButton.innerHTML : '';
    batchClassAssignSaving = true;
    if (saveButton) { saveButton.disabled = true; saveButton.textContent = '배정 저장 중…'; }
    try {
      var result = await NanoPortal.saveClassAssignments(batchSelectedBooks.slice(), remoteClass, currentAcademyInfo.id);
      // 서버 저장이 완료된 뒤에만 모달을 닫고 목록을 다시 조회합니다.
      $('#modalBatchClassAssign').modal('hide');
      currentFilteredStudentAssignments = null;
      try {
        await NanoPortal.refreshAssignments();
        showAcademyToast('[' + selectedClassName + '] ' + result.count + '명 배정 저장 완료 (신규 ' + result.addedCount + '건)');
      } catch (_) {
        showAcademyToast('배정은 저장되었습니다. 목록을 불러오지 못해 새로고침이 필요합니다.');
      }
    } catch (error) {
      showAcademyToast('학급 배정 저장을 확인하지 못했습니다: ' + error.message + ' 선택한 도서를 유지했습니다. 다시 시도해 주세요.');
    } finally {
      batchClassAssignSaving = false;
      if (saveButton) { saveButton.disabled = false; saveButton.innerHTML = originalButtonHtml; }
    }
    return;
  }

  var todayDateStr = new Date().toISOString().split('T')[0];
  var todayTimeStr = todayDateStr + ' ' + new Date().toTimeString().split(' ')[0].substr(0, 5);
  var totalAddedCount = 0;

  targetStudents.forEach(function(std) {
    var assignRec = studentAssignmentList.find(function(a) { return a.studentId === std.id; });
    if (!assignRec) {
      assignRec = {
        id: 'sa_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
        studentId: std.id,
        studentName: std.name,
        school: std.school || '나노초',
        grade: std.grade || '초등',
        classGroup: std.classGroup || batchSelectedClassName,
        books: [],
        assignDate: todayDateStr,
        status: '읽는 중'
      };
      studentAssignmentList.unshift(assignRec);
    }

    var existingIds = (assignRec.books || []).map(function(b) { return String(b.id); });

    batchSelectedBooks.forEach(function(b) {
      if (existingIds.indexOf(String(b.id)) === -1) {
        assignRec.books.push({
          id: b.id,
          title: b.title,
          cover: b.cover,
          pub: b.publisher || b.pub || '출판사',
          grade: b.grade || '전체',
          assignedAt: todayTimeStr,
          certified: false,
          certDate: null
        });
        existingIds.push(String(b.id));
        totalAddedCount++;
      }
    });

    assignRec.status = assignRec.books.length > 0 ? `읽는 중 (0/${assignRec.books.length}권)` : '배정 없음';
  });

  currentFilteredStudentAssignments = null;
  if (!syncAssignmentsData()) return;
  renderStudentAssignmentTable();
  $('#modalBatchClassAssign').modal('hide');
  showAcademyToast(`[${batchSelectedClassName}] 학급 원생 ${targetStudents.length}명에게 일괄 배정이 완료되었습니다. (신규 추가: 총 ${totalAddedCount}건)`);
}

async function cancelStudentAssignment(id) {
  var target = studentAssignmentList.find(function(a) { return a.id === id; });
  var name = target ? target.studentName : '해당 원생';
  if (confirm(`[${name}] 원생의 맞춤 도서 배정 내역을 삭제하시겠습니까?`)) {
    if (window.NanoPortal && NanoPortal.remote && target) {
      try {
        await Promise.all((target.books || []).filter(function(book) { return book.assignmentId; }).map(function(book) { return NanoPortal.deleteAssignment(book.assignmentId, currentAcademyInfo.id); }));
        await NanoPortal.refreshAssignments();
        showAcademyToast(`[${name}] 원생의 도서 배정 내역이 삭제되었습니다.`);
        return;
      } catch (error) {
        showAcademyToast('도서 배정을 삭제하지 못했습니다: ' + error.message);
        return;
      }
    }
    studentAssignmentList = studentAssignmentList.filter(function(a) { return a.id !== id; });
    currentFilteredStudentAssignments = null;
    renderStudentAssignmentTable();
    if (!syncAssignmentsData()) return;
    showAcademyToast(`[${name}] 원생의 도서 배정 내역이 삭제되었습니다.`);
  }
}

// ==============================================================
// 5-1. [신규 모달 1] 개별 원생 맞춤 도서 배정 모달 로직 (Depth 1 ➔ Depth 2)
// ==============================================================
// 5-1. [신규 모달 1] 개별 원생 맞춤 도서 배정 모달 로직 (Depth 1 ➔ Depth 2)
// ==============================================================
var currentIndivStudentId = null;
var currentIndivCategory = 'ALL';

// 모달 열기
function openIndividualAssignModal(studentId) {
  syncIndivStudentClassFilterOptions();
  if (studentId) {
    // 특정 학생이 지정된 경우 즉시 Depth 2로 진입
    enterStudentAssignDepth2(studentId);
  } else {
    // 지정되지 않은 경우 Depth 1(학생 목록 선택) 노출
    backToIndivDepth1();
  }

  $('#modalIndividualAssign').modal('show');
}

// Depth 1으로 복귀
function backToIndivDepth1() {
  currentIndivStudentId = null;
  var d1 = document.getElementById('indivAssignDepth1');
  var d2 = document.getElementById('indivAssignDepth2');
  if (d1) d1.style.display = 'block';
  if (d2) d2.style.display = 'none';

  syncIndivStudentClassFilterOptions();

  if (document.getElementById('indivStudentSearchInput')) {
    document.getElementById('indivStudentSearchInput').value = '';
  }
  if (document.getElementById('indivStudentClassFilter')) {
    document.getElementById('indivStudentClassFilter').value = 'ALL';
  }

  filterIndivModalStudents();
}

// Depth 1: 학생 목록 필터링 및 카드 렌더링
function filterIndivModalStudents() {
  var container = document.getElementById('indivModalStudentList');
  if (!container) return;
  container.innerHTML = '';

  var query = (document.getElementById('indivStudentSearchInput') ? document.getElementById('indivStudentSearchInput').value : '').toLowerCase().trim();
  var classFilter = document.getElementById('indivStudentClassFilter') ? document.getElementById('indivStudentClassFilter').value : 'ALL';

  var isT = isCurrentLoggedInTeacher();
  var assignedClasses = isT ? getTeacherAssignedClasses() : null;
  var assignedClassNames = assignedClasses ? assignedClasses.map(function(c) { return c.name; }) : null;

  var students = studentDataList.filter(function(s) {
    // [권한 설정 3] 선생님인 경우 본인이 담당하는 학급의 학생만 허용
    if (assignedClassNames && (!s.classGroup || assignedClassNames.indexOf(s.classGroup) === -1)) {
      return false;
    }
    var matchClass = classFilter === 'ALL' || s.classGroup === classFilter;
    var matchQuery = !query || 
      s.name.toLowerCase().indexOf(query) !== -1 || 
      s.id.toLowerCase().indexOf(query) !== -1 || 
      (s.school && s.school.toLowerCase().indexOf(query) !== -1);
    return matchClass && matchQuery;
  });

  var countEl = document.getElementById('indivStudentCount');
  if (countEl) countEl.innerText = students.length;

  if (students.length === 0) {
    var emptyMsg = (isT && assignedClassNames && assignedClassNames.length === 0)
      ? '현재 본인 담당으로 지정된 학급이 없어 배정 가능한 원생이 없습니다.<br><small class="text-muted">원장님 계정에서 학급 담당 지정을 확인해 주세요.</small>'
      : '일치하는 원생이 없습니다.';
    container.innerHTML = '<div class="col-12 text-center py-5 text-muted"><i class="fa-solid fa-user-xmark mb-2" style="font-size:28px;"></i><br>' + emptyMsg + '</div>';
    return;
  }

  students.forEach(function(std) {
    // 해당 학생의 현재 배정 도서 수 조회
    var assignRec = studentAssignmentList.find(function(a) { return a.studentId === std.id; });
    var bookCount = assignRec ? assignRec.books.length : 0;

    var col = document.createElement('div');
    col.className = 'col-md-6 mb-3';
    col.innerHTML = `
      <div class="p-3 rounded bg-white shadow-sm d-flex justify-content-between align-items-center" style="border: 1px solid var(--border-light); cursor: pointer; transition: all 0.2s;" onmouseover="this.style.borderColor='#2b7a3e'" onmouseout="this.style.borderColor='var(--border-light)'" onclick="enterStudentAssignDepth2('${std.id}')">
        <div class="d-flex align-items-center">
          <div style="width: 44px; height: 44px; border-radius: 50%; background: #eef2fa; color: #2b4c80; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 15px; margin-right: 12px; flex-shrink: 0;">
            ${std.name.substr(0, 1)}
          </div>
          <div>
            <div class="d-flex align-items-center">
              <strong style="color: var(--text-main); font-size: 14.5px;" class="mr-2">${std.name}</strong>
              <span class="badge-soft badge-soft-neutral" style="font-size: 11px;">${std.classGroup || '미배정'}</span>
            </div>
            <small class="text-muted" style="font-size: 12px;">${std.school || '나노초'} ${std.grade || ''} &middot; ${std.id}</small>
          </div>
        </div>
        <div class="text-right">
          <span class="badge ${bookCount > 0 ? 'badge-success' : 'badge-light border text-muted'} px-2 py-1 mb-1 d-inline-block" style="font-size: 11px;">
            ${bookCount > 0 ? `배정 도서 ${bookCount}권` : '미배정'}
          </span>
          <div>
            <button type="button" class="btn btn-xs btn-outline-primary font-weight-bold" style="border-radius: 6px; font-size: 11.5px;">
              도서 관리 <i class="fa-solid fa-chevron-right ml-1"></i>
            </button>
          </div>
        </div>
      </div>
    `;
    container.appendChild(col);
  });
}

// Depth 2 진입: 선택된 원생 전용 도서 관리창 로드
function enterStudentAssignDepth2(studentId) {
  var std = studentDataList.find(function(s) { return s.id === studentId; });

  // [권한 설정 3] 선생님인 경우 본인 담당 학급 원생인지 검증
  if (isCurrentLoggedInTeacher()) {
    var assignedClasses = getTeacherAssignedClasses();
    var assignedNames = assignedClasses.map(function(c) { return c.name; });
    if (!std || !std.classGroup || assignedNames.indexOf(std.classGroup) === -1) {
      showAcademyToast('본인이 담당으로 되어 있는 학급의 학생에게만 도서 배정이 가능합니다.');
      backToIndivDepth1();
      return;
    }
  }

  currentIndivStudentId = studentId;
  var d1 = document.getElementById('indivAssignDepth1');
  var d2 = document.getElementById('indivAssignDepth2');
  if (d1) d1.style.display = 'none';
  if (d2) d2.style.display = 'block';

  var std = studentDataList.find(function(s) { return s.id === studentId; });
  var stdName = std ? std.name : '원생';
  var stdMeta = std ? `${std.school || '나노초'} ${std.grade || ''} · ${std.classGroup || '반미정'} (${std.id})` : studentId;

  if (document.getElementById('indivTargetStudentName')) {
    document.getElementById('indivTargetStudentName').innerText = `${stdName} 원생`;
  }
  if (document.getElementById('indivTargetStudentMeta')) {
    document.getElementById('indivTargetStudentMeta').innerText = stdMeta;
  }

  // 검색 조건 초기화
  if (document.getElementById('indivBookSearchInput')) document.getElementById('indivBookSearchInput').value = '';
  if (document.getElementById('indivOnlyAcademyOwned')) document.getElementById('indivOnlyAcademyOwned').checked = false;
  currentIndivCategory = 'ALL';
  indivCatalogCurrentPage = 1;

  renderIndivStudentAssignedBooks(studentId);
  renderIndivBookCatalog();
}

// Depth 2 좌측: 현재 배정된 도서 목록 렌더링 (배정 일시 표출)
// Depth 2 좌측: 현재 배정된 도서 목록 렌더링 (인증일자 및 배정일시 표출)
function renderIndivStudentAssignedBooks(studentId) {
  var container = document.getElementById('indivCurrentBooksContainer');
  if (!container) return;
  container.innerHTML = '';

  var assignRec = studentAssignmentList.find(function(a) { return a.studentId === studentId; });
  var books = assignRec ? assignRec.books : [];

  var countBadge = document.getElementById('indivTargetStudentBookCount');
  if (countBadge) countBadge.innerText = `현재 배정 ${books.length}권`;
  var currentCountEl = document.getElementById('indivCurrentCount');
  if (currentCountEl) currentCountEl.innerText = books.length;

  if (books.length === 0) {
    container.innerHTML = `
      <div class="text-center py-5 text-muted" style="background: #faf8f5; border-radius: 12px; border: 1px dashed var(--border-medium);">
        <i class="fa-solid fa-book-open mb-2 text-muted" style="font-size: 32px; opacity: 0.5;"></i>
        <div class="font-weight-bold" style="font-size: 13.5px; color: var(--text-main);">현재 배정된 도서가 없습니다.</div>
        <small class="text-muted">우측 카탈로그에서 원하는 도서를 검색하여 [배정 추가]를 눌러주세요.</small>
      </div>
    `;
    return;
  }

  books.forEach(function(b, idx) {
    var card = document.createElement('div');
    card.className = 'p-3 mb-2 rounded bg-white shadow-xs';
    card.style.border = '1px solid var(--border-medium)';
    card.style.display = 'flex';
    card.style.alignItems = 'center';
    card.style.justifyContent = 'space-between';

    var assignedTimeStr = b.assignedAt || '배정일자';
    var certBadge = (b.certDate || b.certified)
      ? `<span class="badge badge-success px-2 py-0.5 ml-1" style="font-size: 10.5px; font-weight: 700;">
           <i class="fa-solid fa-award mr-1"></i>인증일 : ${b.certDate || '09월 12일'}
         </span>`
      : `<span class="badge badge-light border text-muted px-1.5 py-0.5 ml-1" style="font-size: 10px;">읽는 중 (미인증)</span>`;

    card.innerHTML = `
      <div class="d-flex align-items-center" style="flex: 1; min-width: 0; margin-right: 10px;">
        <img src="${b.cover || 'resources/images/book_default.svg'}" alt="" style="width: 44px; height: 60px; object-fit: cover; border-radius: 6px; border: 1px solid #ddd; margin-right: 12px; flex-shrink: 0;" onerror="this.onerror=null; this.src='resources/images/book_default.svg';">
        <div style="flex: 1; min-width: 0;">
          <div class="d-flex align-items-center mb-0.5">
            <span class="badge badge-light border text-muted mr-1" style="font-size: 10px;">#${idx + 1}</span>
            <strong class="text-truncate font-weight-bold" style="color: var(--text-main); font-size: 13.5px;" title="${b.title}">${b.title}</strong>
          </div>
          <small class="text-muted d-block" style="font-size: 11.5px;">${b.pub || b.publisher || '출판사'} &middot; ${b.grade || '전체'}</small>
          <div class="mt-1 d-flex align-items-center flex-wrap gap-1">
            ${certBadge}
          </div>
        </div>
      </div>
      <div>
        <button type="button" class="btn btn-xs btn-outline-danger font-weight-bold" onclick="removeBookFromStudent('${studentId}', '${b.id}')" style="border-radius: 6px; font-size: 11px; white-space: nowrap; padding: 4px 8px;">
          <i class="fa-solid fa-xmark mr-1"></i>배정 해제
        </button>
      </div>
    `;
    container.appendChild(card);
  });
}

// 인증완료된 도서 일괄 배정 해제
function releaseIndivCertifiedBooks() {
  if (!currentIndivStudentId) return;

  var assignRec = studentAssignmentList.find(function(a) { return a.studentId === currentIndivStudentId; });
  if (!assignRec || !assignRec.books || assignRec.books.length === 0) {
    showAcademyToast('현재 배정된 도서가 없습니다.');
    return;
  }

  var beforeCount = assignRec.books.length;
  // 인증완료된 도서 필터링 제거 (certDate 또는 certified)
  assignRec.books = assignRec.books.filter(function(b) {
    return !(b.certDate || b.certified);
  });
  var removedCount = beforeCount - assignRec.books.length;

  if (removedCount === 0) {
    // 모든 도서 중 1권을 예시로 인증완료 해제 처리
    if (confirm('현재 인증 완료된 도서가 없습니다. 독서 완료된 도서를 배정 해제하시겠습니까?')) {
      assignRec.books.pop();
      removedCount = 1;
    } else {
      return;
    }
  }

  renderIndivStudentAssignedBooks(currentIndivStudentId);
  renderIndivBookCatalog();
  renderStudentAssignmentTable();
  if (!syncAssignmentsData()) return;
  showAcademyToast(`인증 완료된 도서 ${removedCount}권이 배정 해제되었습니다.`);
}

// Depth 2 우측: 신규 도서 검색 카탈로그 렌더링 (20권씩 페이징 처리 & 학년, 출제처, 주제 필터 지원)
var indivCatalogCurrentPage = 1;
var INDIV_CATALOG_PAGE_SIZE = 20;

function filterIndivBookCatalog() {
  indivCatalogCurrentPage = 1;
  renderIndivBookCatalog();
}

function renderIndivBookCatalog() {
  var container = document.getElementById('indivBookCatalogContainer');
  var paginationContainer = document.getElementById('indivBookCatalogPagination');
  if (!container || !currentIndivStudentId) return;
  container.innerHTML = '';
  if (paginationContainer) paginationContainer.innerHTML = '';

  var query = (document.getElementById('indivBookSearchInput') ? document.getElementById('indivBookSearchInput').value : '').toLowerCase().trim();
  var onlyAcademyOwned = document.getElementById('indivOnlyAcademyOwned') ? document.getElementById('indivOnlyAcademyOwned').checked : false;

  var gradeVal = document.getElementById('indivFilterGrade') ? document.getElementById('indivFilterGrade').value : 'ALL';
  var originVal = document.getElementById('indivFilterOrigin') ? document.getElementById('indivFilterOrigin').value : 'ALL';
  var categoryVal = document.getElementById('indivFilterCategory') ? document.getElementById('indivFilterCategory').value : 'ALL';

  // 현재 이 학생에게 이미 배정된 도서 ID 목록
  var assignRec = studentAssignmentList.find(function(a) { return a.studentId === currentIndivStudentId; });
  var assignedBookIds = assignRec ? assignRec.books.map(function(b) { return String(b.id); }) : [];

  var books = academyBookList.filter(function(b) {
    // 키워드 검색
    var matchQuery = !query || 
      b.title.toLowerCase().indexOf(query) !== -1 || 
      (b.author && b.author.toLowerCase().indexOf(query) !== -1) || 
      (b.publisher && b.publisher.toLowerCase().indexOf(query) !== -1) ||
      (b.category && b.category.toLowerCase().indexOf(query) !== -1);

    // 학년 필터
    var matchGrade = true;
    if (gradeVal !== 'ALL') {
      if (gradeVal === '초등 1~2학년') matchGrade = b.grade && (b.grade.includes('초1') || b.grade.includes('초2') || b.grade.includes('저학년'));
      else if (gradeVal === '초등 3~4학년') matchGrade = b.grade && (b.grade.includes('초3') || b.grade.includes('초4') || b.grade.includes('중학년'));
      else if (gradeVal === '초등 5~6학년') matchGrade = b.grade && (b.grade.includes('초5') || b.grade.includes('초6') || b.grade.includes('고학년'));
      else if (gradeVal === '중등 1~3학년') matchGrade = b.grade && (b.grade.includes('중') || b.grade.includes('기본'));
    }

    // 출제처 필터
    var matchOrigin = true;
    if (originVal !== 'ALL') {
      if (originVal === 'HQ') matchOrigin = !b.isCustom;
      else if (originVal === 'ACADEMY') matchOrigin = !!b.isCustom;
    }

    // 주제 필터
    var matchCategory = true;
    if (categoryVal !== 'ALL') {
      matchCategory = b.category && b.category.indexOf(categoryVal) !== -1;
    }

    // 학원 보유 도서만 검색 조건
    var matchOwned = !onlyAcademyOwned || isBookOwnedByAcademy(b);

    return matchQuery && matchGrade && matchOrigin && matchCategory && matchOwned;
  });

  var totalCount = books.length;
  var totalPages = Math.ceil(totalCount / INDIV_CATALOG_PAGE_SIZE) || 1;
  if (indivCatalogCurrentPage > totalPages) indivCatalogCurrentPage = totalPages;
  if (indivCatalogCurrentPage < 1) indivCatalogCurrentPage = 1;

  if (totalCount === 0) {
    container.innerHTML = '<div class="text-center py-5 text-muted"><i class="fa-solid fa-magnifying-glass mb-2" style="font-size:24px;"></i><br>조건에 맞는 도서가 없습니다.</div>';
    if (paginationContainer) paginationContainer.innerHTML = '';
    return;
  }

  // 20권씩 슬라이싱하여 렌더링
  var startIndex = (indivCatalogCurrentPage - 1) * INDIV_CATALOG_PAGE_SIZE;
  var pageBooks = books.slice(startIndex, startIndex + INDIV_CATALOG_PAGE_SIZE);

  pageBooks.forEach(function(b) {
    var isAssigned = assignedBookIds.indexOf(String(b.id)) !== -1;
    var isOwned = isBookOwnedByAcademy(b);

    var card = document.createElement('div');
    card.className = 'assign-catalog-card' + (isAssigned ? ' in-cart' : '');
    card.style.background = '#ffffff';

    var ownedBadge = isOwned
      ? '<span class="badge badge-success px-1.5 py-0.5 ml-1" style="font-size: 10px;"><i class="fa-solid fa-check mr-1"></i>학원 보유</span>'
      : '<span class="badge badge-light border text-muted px-1.5 py-0.5 ml-1" style="font-size: 10px;">본사 공급</span>';

    card.innerHTML = `
      <div style="position: relative; flex-shrink: 0; margin-right: 12px;">
        <img src="${b.cover || 'resources/images/book_default.svg'}" alt="" style="width: 48px; height: 66px; object-fit: cover; border-radius: 6px; border: 1px solid var(--border-medium);" onerror="this.onerror=null; this.src='resources/images/book_default.svg';">
        ${isAssigned ? '<span style="position: absolute; top: -5px; right: -5px; width: 18px; height: 18px; border-radius: 50%; background: #2b7a3e; color: #fff; display: flex; align-items: center; justify-content: center; font-size: 10px;"><i class="fa-solid fa-check"></i></span>' : ''}
      </div>
      <div style="flex: 1; min-width: 0;">
        <div class="d-flex align-items-center mb-1">
          <strong class="text-truncate font-weight-bold" style="font-size: 13.5px; color: var(--text-main);" title="${b.title}">${b.title}</strong>
          ${ownedBadge}
        </div>
        <div class="text-muted text-truncate mb-1" style="font-size: 11.5px;">
          <span>${b.publisher || b.pub || '출판사'}</span> &middot; <span>${b.author || '저자'}</span>
        </div>
        <div class="d-flex align-items-center gap-1 flex-wrap" style="font-size: 10.5px;">
          <span class="badge-soft badge-soft-neutral">${b.grade || '전체'}</span>
          <span class="badge badge-light text-success border"><i class="fa-solid fa-circle-check mr-1"></i>북퀴즈 완비</span>
        </div>
      </div>
      <div class="ml-3" style="flex-shrink: 0;">
        ${isAssigned 
          ? `<button type="button" class="btn btn-sm btn-light border text-success font-weight-bold" disabled style="border-radius: 8px; font-size: 11.5px; padding: 4px 10px;">
               <i class="fa-solid fa-check mr-1"></i>배정 중
             </button>`
          : `<button type="button" class="btn btn-sm btn-beige-primary font-weight-bold" onclick="addBookToStudent('${currentIndivStudentId}', '${b.id}')" style="border-radius: 8px; font-size: 11.5px; padding: 4px 12px;">
               <i class="fa-solid fa-plus mr-1"></i>배정 추가
             </button>`
        }
      </div>
    `;
    container.appendChild(card);
  });

  renderIndivCatalogPagination(totalCount, indivCatalogCurrentPage, totalPages);
}

// 20권 페이징 네비게이션 렌더링
function renderIndivCatalogPagination(total, page, totalPages) {
  var container = document.getElementById('indivBookCatalogPagination');
  if (!container) return;

  if (total === 0 || totalPages <= 1) {
    container.innerHTML = `<span class="text-muted" style="font-size: 11.5px;">총 <strong>${total}</strong>권</span>`;
    return;
  }

  var html = `
    <span class="text-muted" style="font-size: 11.5px;">총 <strong>${total}</strong>권 (${page}/${totalPages}p)</span>
    <div class="d-flex align-items-center" style="gap: 3px;">
      <button type="button" class="btn btn-xs btn-outline-secondary" onclick="goIndivCatalogPage(1)" ${page <= 1 ? 'disabled style="opacity: 0.35; cursor: not-allowed;"' : ''} style="border-radius: 4px; padding: 2px 6px;" title="첫 페이지">
        <i class="fa-solid fa-angles-left" style="font-size: 9.5px;"></i>
      </button>
      <button type="button" class="btn btn-xs btn-outline-secondary" onclick="goIndivCatalogPage(${page - 1})" ${page <= 1 ? 'disabled style="opacity: 0.35; cursor: not-allowed;"' : ''} style="border-radius: 4px; padding: 2px 6px;" title="이전 20권">
        <i class="fa-solid fa-chevron-left" style="font-size: 9.5px;"></i>
      </button>
  `;

  var startP = Math.max(1, page - 2);
  var endP = Math.min(totalPages, startP + 4);
  if (endP - startP < 4) startP = Math.max(1, endP - 4);

  for (var p = startP; p <= endP; p++) {
    var isActive = p === page;
    html += `
      <button type="button" class="btn btn-xs ${isActive ? 'btn-beige-primary text-white font-weight-bold' : 'btn-outline-secondary'}" onclick="goIndivCatalogPage(${p})" style="border-radius: 4px; min-width: 24px; padding: 2px 6px; font-size: 11px;">
        ${p}
      </button>
    `;
  }

  html += `
      <button type="button" class="btn btn-xs btn-outline-secondary" onclick="goIndivCatalogPage(${page + 1})" ${page >= totalPages ? 'disabled style="opacity: 0.35; cursor: not-allowed;"' : ''} style="border-radius: 4px; padding: 2px 6px;" title="다음 20권">
        <i class="fa-solid fa-chevron-right" style="font-size: 9.5px;"></i>
      </button>
      <button type="button" class="btn btn-xs btn-outline-secondary" onclick="goIndivCatalogPage(${totalPages})" ${page >= totalPages ? 'disabled style="opacity: 0.35; cursor: not-allowed;"' : ''} style="border-radius: 4px; padding: 2px 6px;" title="마지막 페이지">
        <i class="fa-solid fa-angles-right" style="font-size: 9.5px;"></i>
      </button>
    </div>
  `;

  container.innerHTML = html;
}

function goIndivCatalogPage(page) {
  indivCatalogCurrentPage = page;
  renderIndivBookCatalog();
  var container = document.getElementById('indivBookCatalogContainer');
  if (container) container.scrollTop = 0;
}

// 개별 원생에게 도서 추가 (배정 일시 기록)
async function addBookToStudent(studentId, bookId) {
  var b = academyBookList.find(function(item) { return String(item.id) === String(bookId); });
  if (!b) return;
  var remoteStudent = studentDataList.find(function(student) { return student.id === studentId; });
  if (window.NanoPortal && NanoPortal.remote) {
    try {
      await NanoPortal.saveAssignment(b, remoteStudent, null, currentAcademyInfo.id);
      await NanoPortal.refreshAssignments();
      showAcademyToast(`[${remoteStudent ? remoteStudent.name : '원생'}] 학생에게 <${b.title}> 도서가 배정되었습니다.`);
      return;
    } catch (error) {
      showAcademyToast('도서를 배정하지 못했습니다: ' + error.message);
      return;
    }
  }

  var now = new Date();
  var yyyy = now.getFullYear();
  var mm = String(now.getMonth() + 1).padStart(2, '0');
  var dd = String(now.getDate()).padStart(2, '0');
  var hh = String(now.getHours()).padStart(2, '0');
  var min = String(now.getMinutes()).padStart(2, '0');
  var assignedAtStr = `${yyyy}-${mm}-${dd} ${hh}:${min}`;

  var std = studentDataList.find(function(s) { return s.id === studentId; });
  var stdName = std ? std.name : '원생';

  var assignRec = studentAssignmentList.find(function(a) { return a.studentId === studentId; });
  if (!assignRec) {
    assignRec = {
      id: 'ASN-S' + String(studentAssignmentList.length + 1).padStart(2, '0'),
      studentId: studentId,
      studentName: stdName,
      school: std ? std.school : '나노초',
      grade: std ? std.grade : '초등 5학년',
      classGroup: std ? std.classGroup : '지혜반',
      books: [],
      assignDate: `${yyyy}-${mm}-${dd}`,
      completedBooks: 0,
      status: '읽는 중',
      priorityOn: true
    };
    studentAssignmentList.unshift(assignRec);
    lastAddedStudentAssignId = assignRec.id;
  }

  // 중복 체크 후 추가
  var already = assignRec.books.some(function(item) { return String(item.id) === String(b.id); });
  if (!already) {
    assignRec.books.push({
      id: b.id,
      title: b.title,
      publisher: b.publisher || b.pub || '출판사',
      pub: b.publisher || b.pub || '출판사',
      cover: b.cover,
      grade: b.grade || '전체',
      assignedAt: assignedAtStr
    });
    assignRec.status = `읽는 중 (0/${assignRec.books.length}권)`;
  }

  // 뷰 즉시 갱신
  renderIndivStudentAssignedBooks(studentId);
  renderIndivBookCatalog();
  renderStudentAssignmentTable();
  if (!syncAssignmentsData()) return;

  showAcademyToast(`[${stdName}] 학생에게 <${b.title}> 도서가 배정되었습니다. (${assignedAtStr})`);
}

// 개별 원생에게서 도서 배정 해제
async function removeBookFromStudent(studentId, bookId) {
  var assignRec = studentAssignmentList.find(function(a) { return a.studentId === studentId; });
  if (!assignRec) return;

  var book = assignRec.books.find(function(b) { return String(b.id) === String(bookId); });
  var bookTitle = book ? book.title : '도서';

  if (window.NanoPortal && NanoPortal.remote) {
    try {
      if (!book || !book.assignmentId) throw new Error('배정 정보를 새로고침한 뒤 다시 시도해 주세요.');
      await NanoPortal.deleteAssignment(book.assignmentId, currentAcademyInfo.id);
      await NanoPortal.refreshAssignments();
      showAcademyToast(`<${bookTitle}> 도서 배정이 해제되었습니다.`);
      return;
    } catch (error) {
      showAcademyToast('도서 배정을 해제하지 못했습니다: ' + error.message);
      return;
    }
  }

  assignRec.books = assignRec.books.filter(function(b) { return String(b.id) !== String(bookId); });
  assignRec.status = assignRec.books.length > 0 ? `읽는 중 (0/${assignRec.books.length}권)` : '배정 없음';

  renderIndivStudentAssignedBooks(studentId);
  renderIndivBookCatalog();
  renderStudentAssignmentTable();
  if (!syncAssignmentsData()) return;

  showAcademyToast(`<${bookTitle}> 도서 배정이 해제되었습니다.`);
}

// ==============================================================
// 5-2. [신규 모달 2] 학급별 도서 배정 관리 모달 (중복 배정 순 정렬 & 일괄 관리)
// ==============================================================
var currentClassForModal = '지혜반';

// 더미 학급 목록 대신, 학원이 실제 등록한 학급/담당교사/소속 원생 수를 매번 계산해 사용 (DB와 항상 일치)
function getAcademyClassMeta() {
  var targetClasses = isCurrentLoggedInTeacher() ? getTeacherAssignedClasses() : academyClassList;
  return targetClasses.map(function(c) {
    return {
      name: c.name,
      grade: c.grade || '-',
      total: studentDataList.filter(function(s) { return s.classGroup === c.name; }).length,
      teacher: c.teacher || '미지정'
    };
  });
}

// 학급 배정 모달 열기
function openClassAssignModal(defaultClass) {
  var metaList = getAcademyClassMeta();
  if (isCurrentLoggedInTeacher() && metaList.length === 0) {
    showAcademyToast('현재 본인 담당으로 지정되어 있는 학급이 없습니다.');
    return;
  }
  currentClassForModal = defaultClass || (metaList.length > 0 ? metaList[0].name : '');
  renderClassAssignModalContent(currentClassForModal);
  $('#modalClassAssign').modal('show');
}

// 학급 탭 선택 시
function selectClassForAssignModal(className) {
  currentClassForModal = className;
  renderClassAssignModalContent(className);
}

// 학급 배정 모달 전체 컨텐츠 렌더링
function renderClassAssignModalContent(className) {
  // 1) 상단 학급 탭 버튼 렌더링
  var tabContainer = document.getElementById('classAssignTabButtons');
  if (tabContainer) {
    tabContainer.innerHTML = '';
    getAcademyClassMeta().forEach(function(c) {
      var isSel = c.name === className;
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `btn btn-sm ${isSel ? 'btn-beige-primary active font-weight-bold' : 'btn-outline-secondary'}`;
      btn.style.borderRadius = '8px';
      btn.style.fontSize = '12px';
      btn.innerHTML = `${isSel ? '<i class="fa-solid fa-check mr-1"></i>' : ''}${c.name} <small class="opacity-75">(${c.grade})</small>`;
      btn.onclick = function() { selectClassForAssignModal(c.name); };
      tabContainer.appendChild(btn);
    });
  }

  var cMeta = getAcademyClassMeta().find(function(c) { return c.name === className; }) || { name: className, grade: '-', total: 0, teacher: '미지정' };

  if (document.getElementById('classAssignSelectedName')) {
    document.getElementById('classAssignSelectedName').innerText = cMeta.name;
  }
  if (document.getElementById('classAssignSelectedMeta')) {
    document.getElementById('classAssignSelectedMeta').innerText = `${cMeta.grade} · ${cMeta.total}명`;
  }
  if (document.getElementById('classAssignSelectedTeacher')) {
    document.getElementById('classAssignSelectedTeacher').innerText = `담당: ${cMeta.teacher}`;
  }

  // 2) 해당 반 소속 학생 명단 취합
  var classStudents = studentDataList.filter(function(s) { return s.classGroup === className; });
  // 소속 원생이 없으면 없는 그대로 표시 (임의 학생으로 채우지 않음)
  var studentNames = classStudents.map(function(s) { return s.name; });
  if (document.getElementById('classAssignStudentListText')) {
    document.getElementById('classAssignStudentListText').innerText = `소속 원생 (${classStudents.length}명): ${studentNames.join(', ')}`;
  }

  // 3) 핵심 요구사항: 각 학생에게 배정된 도서들을 취합하여 가장 많은 학생에게 중복 배정된 순서로 정렬!
  var bookMap = {};

  classStudents.forEach(function(std) {
    var assignRec = studentAssignmentList.find(function(a) { return a.studentId === std.id; });
    var studentBooks = assignRec ? assignRec.books : [];

    studentBooks.forEach(function(b) {
      var bId = String(b.id);
      if (!bookMap[bId]) {
        var catalogBook = academyBookList.find(function(item) { return String(item.id) === bId; });
        bookMap[bId] = {
          id: bId,
          title: b.title,
          pub: b.pub || b.publisher || (catalogBook ? catalogBook.publisher : '출판사'),
          cover: b.cover || (catalogBook ? catalogBook.cover : 'assets/covers/cover_1001.jpg'),
          grade: b.grade || (catalogBook ? catalogBook.grade : '초등'),
          assignedStudentNames: []
        };
      }
      if (bookMap[bId].assignedStudentNames.indexOf(std.name) === -1) {
        bookMap[bId].assignedStudentNames.push(std.name);
      }
    });
  });

  // 배열로 변환 후, 가장 많은 학생들에게 중복으로 배정된 도서 우선순위(내림차순) 정렬!
  var aggregatedList = Object.values(bookMap).sort(function(a, b) {
    return b.assignedStudentNames.length - a.assignedStudentNames.length;
  });

  var container = document.getElementById('classAssignBookAnalysisContainer');
  if (container) {
    container.innerHTML = '';

    if (aggregatedList.length === 0) {
      container.innerHTML = `
        <div class="p-5 text-center bg-white rounded shadow-sm" style="border: 1px dashed var(--border-medium);">
          <i class="fa-solid fa-book-open text-muted mb-2" style="font-size: 32px; opacity: 0.5;"></i>
          <h6 class="font-weight-bold" style="color: var(--text-main);">현재 ${className} 학생들에게 배정된 도서가 없습니다.</h6>
          <p class="text-muted mb-3" style="font-size: 12.5px;">상단의 [+ 이 반에 새 도서 일괄 배정] 버튼을 눌러 반 전체에 도서를 배정해 보세요.</p>
          <button type="button" class="btn btn-sm btn-beige-primary" onclick="toggleNewBookForClassSection(true)">
            <i class="fa-solid fa-plus mr-1"></i>새 도서 일괄 배정 열기
          </button>
        </div>
      `;
    } else {
      aggregatedList.forEach(function(item, idx) {
        var assignedCount = item.assignedStudentNames.length;
        var totalCount = classStudents.length;
        var rate = Math.round((assignedCount / totalCount) * 100);

        // 미배정 학생 목록 계산
        var unassignedNames = classStudents
          .filter(function(s) { return item.assignedStudentNames.indexOf(s.name) === -1; })
          .map(function(s) { return s.name; });

        var card = document.createElement('div');
        card.className = 'p-3 mb-3 bg-white rounded shadow-sm';
        card.style.border = idx === 0 ? '2px solid #2b7a3e' : '1px solid var(--border-medium)';

        card.innerHTML = `
          <div class="row align-items-center">
            <!-- 도서 기본 정보 -->
            <div class="col-md-4 border-right pr-md-3 d-flex align-items-center">
              <div style="position: relative; margin-right: 12px; flex-shrink: 0;">
                <img src="${item.cover}" alt="${item.title}" style="width: 50px; height: 70px; object-fit: cover; border-radius: 6px; border: 1px solid #ddd;">
                <span class="badge ${idx === 0 ? 'badge-danger' : 'badge-dark'}" style="position: absolute; top: -6px; left: -6px; font-size: 10px;">
                  ${idx + 1}위
                </span>
              </div>
              <div style="flex: 1; min-width: 0;">
                <strong class="text-truncate font-weight-bold d-block" style="font-size: 14px; color: var(--text-main);" title="${item.title}">${item.title}</strong>
                <small class="text-muted d-block" style="font-size: 12px;">${item.pub} &middot; ${item.grade}</small>
                <div class="mt-1">
                  <span class="badge-soft badge-soft-success font-weight-bold" style="font-size: 11px;">
                    ${totalCount}명 중 <strong class="text-dark">${assignedCount}명</strong> 배정 (${rate}%)
                  </span>
                </div>
                <div class="progress mt-1.5" style="height: 5px;">
                  <div class="progress-bar bg-success" style="width: ${rate}%"></div>
                </div>
              </div>
            </div>

            <!-- 우측: 배정된 학생 텍스트 표기 및 일괄 액션 버튼 -->
            <div class="col-md-8 pl-md-3">
              <div class="mb-2">
                <div style="font-size: 12.5px; line-height: 1.5;">
                  <strong class="text-success"><i class="fa-solid fa-circle-check mr-1"></i>배정 학생 (${assignedCount}명):</strong>
                  <span style="color: #2b3440; font-weight: 600;">${item.assignedStudentNames.join(', ')}</span>
                </div>
                ${unassignedNames.length > 0 ? `
                  <div style="font-size: 11.5px; line-height: 1.5; margin-top: 3px;" class="text-muted">
                    <strong class="text-warning"><i class="fa-solid fa-circle-xmark mr-1"></i>미배정 학생 (${unassignedNames.length}명):</strong>
                    <span>${unassignedNames.join(', ')}</span>
                  </div>
                ` : `
                  <div style="font-size: 11.5px; margin-top: 3px;" class="text-success font-weight-bold">
                    <i class="fa-solid fa-star mr-1"></i>반 전체 학생이 모두 배정되었습니다.
                  </div>
                `}
              </div>

              <!-- 일괄 배정 및 일괄 해제 액션 -->
              <div class="d-flex align-items-center justify-content-end gap-2 pt-2 border-top">
                ${unassignedNames.length > 0 ? `
                  <button type="button" class="btn btn-xs btn-beige-primary font-weight-bold mr-2" onclick="batchAssignBookToClass('${className}', '${item.id}')" style="border-radius: 6px; font-size: 11.5px; padding: 4px 10px;">
                    <i class="fa-solid fa-user-plus mr-1"></i>미배정 학생 ${unassignedNames.length}명에게 일괄 배정
                  </button>
                ` : ''}
                <button type="button" class="btn btn-xs btn-outline-danger" onclick="batchUnassignBookFromClass('${className}', '${item.id}')" style="border-radius: 6px; font-size: 11.5px; padding: 4px 10px;">
                  <i class="fa-solid fa-trash-can mr-1"></i>학급 일괄 배정 해제 (${assignedCount}명 회수)
                </button>
              </div>
            </div>
          </div>
        `;
        container.appendChild(card);
      });
    }
  }

  // 신규 도서 일괄 배정 카탈로그 렌더링
  renderClassNewBookCatalog();
}

// 새 도서 학급 배정 섹션 토글
function toggleNewBookForClassSection(forceOpen) {
  var sec = document.getElementById('classNewBookSection');
  if (!sec) return;
  if (forceOpen === true) sec.style.display = 'block';
  else sec.style.display = (sec.style.display === 'none' ? 'block' : 'none');
}

function filterClassNewBookCatalog() {
  renderClassNewBookCatalog();
}

function renderClassNewBookCatalog() {
  var container = document.getElementById('classNewBookCatalogContainer');
  if (!container) return;
  container.innerHTML = '';

  var query = (document.getElementById('classNewBookSearchInput') ? document.getElementById('classNewBookSearchInput').value : '').toLowerCase().trim();
  var gradeVal = document.getElementById('classNewBookGrade') ? document.getElementById('classNewBookGrade').value : 'ALL';
  var originVal = document.getElementById('classNewBookOrigin') ? document.getElementById('classNewBookOrigin').value : 'ALL';
  var categoryVal = document.getElementById('classNewBookCategory') ? document.getElementById('classNewBookCategory').value : 'ALL';

  // 현재 학급의 학생들 목록
  var classStudents = studentDataList.filter(function(s) { return s.classGroup === currentClassForModal; });
  if (classStudents.length === 0) {
    classStudents = studentDataList.slice(0, 8);
  }

  var books = academyBookList.filter(function(b) {
    var matchQuery = !query || 
      b.title.toLowerCase().indexOf(query) !== -1 || 
      (b.author && b.author.toLowerCase().indexOf(query) !== -1) || 
      (b.publisher && b.publisher.toLowerCase().indexOf(query) !== -1) ||
      (b.category && b.category.toLowerCase().indexOf(query) !== -1);

    var matchGrade = true;
    if (gradeVal !== 'ALL') {
      if (gradeVal === '초등 1~2학년') matchGrade = b.grade && (b.grade.includes('초1') || b.grade.includes('초2') || b.grade.includes('저학년'));
      else if (gradeVal === '초등 3~4학년') matchGrade = b.grade && (b.grade.includes('초3') || b.grade.includes('초4') || b.grade.includes('중학년'));
      else if (gradeVal === '초등 5~6학년') matchGrade = b.grade && (b.grade.includes('초5') || b.grade.includes('초6') || b.grade.includes('고학년'));
      else if (gradeVal === '중등 1~3학년') matchGrade = b.grade && (b.grade.includes('중') || b.grade.includes('기본'));
    }

    var matchOrigin = true;
    if (originVal !== 'ALL') {
      if (originVal === 'HQ') matchOrigin = !b.isCustom;
      else if (originVal === 'ACADEMY') matchOrigin = !!b.isCustom;
    }

    var matchCategory = true;
    if (categoryVal !== 'ALL') {
      matchCategory = b.category && b.category.indexOf(categoryVal) !== -1;
    }

    return matchQuery && matchGrade && matchOrigin && matchCategory;
  });

  if (books.length === 0) {
    container.innerHTML = '<small class="text-muted d-block py-2 text-center">조건에 일치하는 도서가 없습니다.</small>';
    return;
  }

  books.slice(0, 15).forEach(function(b) {
    // 해당 학급 학생 중 이미 배정된 학생 수 확인
    var assignedCountInClass = 0;
    classStudents.forEach(function(std) {
      var assignRec = studentAssignmentList.find(function(a) { return a.studentId === std.id; });
      if (assignRec && assignRec.books.some(function(item) { return String(item.id) === String(b.id); })) {
        assignedCountInClass++;
      }
    });

    var isAllAssigned = classStudents.length > 0 && (assignedCountInClass >= classStudents.length);

    var div = document.createElement('div');
    div.className = 'd-flex justify-content-between align-items-center p-2 mb-1 rounded bg-light border';
    div.innerHTML = `
      <div class="d-flex align-items-center">
        <img src="${b.cover}" style="width: 28px; height: 38px; object-fit: cover; border-radius: 4px; margin-right: 8px; border: 1px solid #ddd;">
        <div>
          <strong style="font-size: 12.5px; color: var(--text-main);">${b.title}</strong>
          <small class="text-muted ml-2">${b.publisher || b.pub || '출판사'} &middot; ${b.grade || '전체'}</small>
          ${assignedCountInClass > 0 && !isAllAssigned ? `<span class="badge badge-warning text-dark ml-1" style="font-size:10px;">${assignedCountInClass}/${classStudents.length}명 배정중</span>` : ''}
        </div>
      </div>
      <div>
        ${isAllAssigned 
          ? `<button type="button" class="btn btn-xs btn-light border text-success font-weight-bold" disabled style="border-radius: 6px; font-size: 11px;">
               <i class="fa-solid fa-check mr-1"></i>배정 완료
             </button>`
          : `<button type="button" class="btn btn-xs btn-success font-weight-bold" onclick="batchAssignBookToClass('${currentClassForModal}', '${b.id}')" style="border-radius: 6px; font-size: 11px;">
               <i class="fa-solid fa-plus mr-1"></i>${currentClassForModal} 전체 일괄 배정
             </button>`
        }
      </div>
    `;
    container.appendChild(div);
  });
}

// 학급 전체 학생에게 특정 도서 일괄 배정
async function batchAssignBookToClass(className, bookId) {
  var b = academyBookList.find(function(item) { return String(item.id) === String(bookId); });
  if (!b) return;
  if (window.NanoPortal && NanoPortal.remote) {
    var remoteClass = academyClassList.find(function(item) { return item.name === className; });
    try {
      var assigned = await NanoPortal.saveAssignment(b, null, remoteClass, currentAcademyInfo.id);
      await NanoPortal.refreshAssignments();
      showAcademyToast(`[${className}] 원생 ${assigned.count || 0}명에게 <${b.title}> 도서가 일괄 배정되었습니다!`);
      return;
    } catch (error) {
      showAcademyToast('학급 도서를 배정하지 못했습니다: ' + error.message);
      return;
    }
  }

  var classStudents = studentDataList.filter(function(s) { return s.classGroup === className; });


  var now = new Date();
  var yyyy = now.getFullYear();
  var mm = String(now.getMonth() + 1).padStart(2, '0');
  var dd = String(now.getDate()).padStart(2, '0');
  var hh = String(now.getHours()).padStart(2, '0');
  var min = String(now.getMinutes()).padStart(2, '0');
  var assignedAtStr = `${yyyy}-${mm}-${dd} ${hh}:${min}`;

  var addedCount = 0;

  classStudents.forEach(function(std) {
    var assignRec = studentAssignmentList.find(function(a) { return a.studentId === std.id; });
    if (!assignRec) {
      assignRec = {
        id: 'ASN-S' + String(studentAssignmentList.length + 1).padStart(2, '0'),
        studentId: std.id,
        studentName: std.name,
        school: std.school || '나노초',
        grade: std.grade || '초등 5학년',
        classGroup: className,
        books: [],
        assignDate: `${yyyy}-${mm}-${dd}`,
        completedBooks: 0,
        status: '읽는 중',
        priorityOn: true
      };
      studentAssignmentList.unshift(assignRec);
    }

    var already = assignRec.books.some(function(item) { return String(item.id) === String(b.id); });
    if (!already) {
      assignRec.books.push({
        id: b.id,
        title: b.title,
        publisher: b.publisher || b.pub || '출판사',
        pub: b.publisher || b.pub || '출판사',
        cover: b.cover,
        grade: b.grade || '전체',
        assignedAt: assignedAtStr
      });
      assignRec.status = `읽는 중 (0/${assignRec.books.length}권)`;
      addedCount++;
    }
  });

  // 학급별 테이블 레코드도 업데이트
  var classRec = classAssignmentList.find(function(c) { return c.className === className; });
  if (classRec) {
    if (!classRec.books.some(function(item) { return String(item.id) === String(b.id); })) {
      classRec.books.push({ id: b.id, title: b.title, pub: b.publisher || b.pub, cover: b.cover });
    }
  }

  renderClassAssignModalContent(className);
  renderAssignmentTable();
  if (!syncAssignmentsData()) return;
  showAcademyToast(`[${className}] 전체 원생 중 ${addedCount}명에게 <${b.title}> 도서가 일괄 배정되었습니다!`);
}

// 학급 전체에서 특정 도서 일괄 배정 해제
function batchUnassignBookFromClass(className, bookId) {
  var b = academyBookList.find(function(item) { return String(item.id) === String(bookId); });
  var bookTitle = b ? b.title : '도서';

  if (!confirm(`[${className}] 소속 모든 학생에게서 <${bookTitle}> 배정을 일괄 해제하시겠습니까?`)) {
    return;
  }

  var classStudents = studentDataList.filter(function(s) { return s.classGroup === className; });
  var removedCount = 0;

  classStudents.forEach(function(std) {
    var assignRec = studentAssignmentList.find(function(a) { return a.studentId === std.id; });
    if (assignRec) {
      var beforeLen = assignRec.books.length;
      assignRec.books = assignRec.books.filter(function(item) { return String(item.id) !== String(bookId); });
      if (assignRec.books.length < beforeLen) removedCount++;
      assignRec.status = assignRec.books.length > 0 ? `읽는 중 (0/${assignRec.books.length}권)` : '배정 없음';
    }
  });

  // 학급별 테이블 레코드에서도 제외
  var classRec = classAssignmentList.find(function(c) { return c.className === className; });
  if (classRec) {
    classRec.books = classRec.books.filter(function(item) { return String(item.id) !== String(bookId); });
  }

  renderClassAssignModalContent(className);
  renderAssignmentTable();
  if (!syncAssignmentsData()) return;
  showAcademyToast(`[${className}] 소속 ${removedCount}명의 학생에게서 <${bookTitle}> 배정이 일괄 해제되었습니다.`);
}


// ==============================================================
var academyDispatchLogs = [
  { id: 'AL-M01', date: '2026-09-08 17:30', type: '독서 포트폴리오 리포트', receiver: '김민준 학부모 (010-3847-1928)', summary: '[나노 독서아카데미 본원] 김민준 학생의 8월 독서 포트폴리오 및 북퀴즈 인증 리포트가 발급되었습니다.', status: 'SUCCESS' },
  { id: 'AL-M02', date: '2026-09-08 16:45', type: '도서 배정 알림', receiver: '이서윤 학부모 (010-5829-3019)', summary: '[나노 독서아카데미 본원] 이번 주 필수 배정 도서 <마당을 나온 암탉>이 배정되었습니다.', status: 'SUCCESS' },
  { id: 'AL-M03', date: '2026-09-08 14:10', type: '독서 격려 알림톡', receiver: '강시우 학생 (010-4820-1948)', summary: '[나노의 책장] 시우 학생! 이번 주 북퀴즈 도전까지 1권 남았어요. 즐겁게 완독해 보아요!', status: 'FAILED' }
];
if (window.NANO_SERVER_DATA) academyDispatchLogs = (window.NANO_SERVER_DISPATCH || []).filter(function(item) { return item.academyId === currentAcademyInfo.id; });

function resetAcademyDispatchFilters() {
  var searchEl = document.getElementById('academyDispatchSearch');
  var tplEl = document.getElementById('academyDispatchTemplate');
  var statusEl = document.getElementById('academyDispatchStatus');
  var fromEl = document.getElementById('academyDispatchFrom');
  var toEl = document.getElementById('academyDispatchTo');
  if (searchEl) searchEl.value = '';
  if (tplEl) tplEl.value = 'ALL';
  if (statusEl) statusEl.value = 'ALL';
  if (fromEl) fromEl.value = '';
  if (toEl) toEl.value = '';
  renderAcademyDispatchTable();
}

function renderAcademyDispatchTable() {
  if (window.NanoBilling && window.NanoPortal?.remote) NanoBilling.dispatch();
  var tbody = document.getElementById('academyDispatchTableBody');
  if (!tbody) return;
  tbody.innerHTML = '';

  var query = (document.getElementById('academyDispatchSearch')?.value || '').trim().toLowerCase();
  var type = document.getElementById('academyDispatchTemplate')?.value || 'ALL';
  var status = document.getElementById('academyDispatchStatus')?.value || 'ALL';
  var from = document.getElementById('academyDispatchFrom')?.value || '';
  var to = document.getElementById('academyDispatchTo')?.value || '';
  var filtered = academyDispatchLogs.filter(function(l) {
    var day = String(l.date || l.datetime || '').slice(0, 10);
    return (type === 'ALL' || l.type === type) && (status === 'ALL' || l.status === status) &&
      (!from || day >= from) && (!to || day <= to) &&
      (!query || [l.receiver, l.receiverName, l.receiverPhone, l.className].join(' ').toLowerCase().includes(query));
  });
  var countEl = document.getElementById('academyDispatchCount');
  if (countEl) countEl.innerText = filtered.length;
  if (!filtered.length) {
    tbody.innerHTML = '<tr><td colspan="8" class="text-center py-5 text-muted" style="font-size: 13.5px;"><i class="fa-regular fa-comment-dots d-block mb-2" style="font-size: 24px; opacity: 0.45;"></i>조건에 해당하는 알림톡/문자 발송 내역이 없습니다.</td></tr>';
    return;
  }

  filtered.forEach(function(l, idx) {
    var tr = document.createElement('tr');
    tr.style.fontSize = '13px';
    var badgeClass = l.status === 'SUCCESS'
      ? 'badge-soft-success'
      : (l.status === 'FAILED' ? 'badge-soft-danger' : (l.status === 'SMS_FALLBACK' ? 'badge-soft-warn' : 'badge-soft-neutral'));
    var statusText = l.status === 'SMS_FALLBACK'
      ? '문자 대체 발송'
      : (l.status === 'SUCCESS' ? '발송 성공' : (l.status === 'FAILED' ? '발송 실패' : (l.status === 'UNKNOWN' ? '결과 확인 중' : '전송 중')));
    tr.innerHTML = `
      <td class="text-center text-muted font-weight-bold" style="font-size: 12px;">${idx + 1}</td>
      <td class="text-center text-muted" style="font-size: 12.5px;">${escapeRankingText(l.date || l.datetime || '—')}</td>
      <td class="text-center"><span class="badge badge-light border text-muted" style="font-size: 11.5px; font-weight: 600;">${escapeRankingText(l.className || '—')}</span></td>
      <td class="text-center"><span class="badge-soft badge-soft-neutral font-weight-bold" style="font-size: 11.5px;">${escapeRankingText(l.typeName || l.type)}</span></td>
      <td style="color: var(--text-main); font-weight: 700;">${escapeRankingText(l.receiverName || l.receiver || '—')}</td>
      <td class="text-center text-muted" style="font-size: 12.5px; font-family: monospace;">${escapeRankingText(l.receiverPhone || '—')}</td>
      <td class="text-center">
        <span class="badge-soft ${badgeClass} font-weight-bold" style="font-size: 11.5px;">
          ${statusText}
        </span>
      </td>
      <td class="text-center">
        <button type="button" class="btn btn-xs btn-outline-secondary font-weight-bold mr-1" onclick="openAcademyDispatchDetailModal('${l.id}')" style="border-radius: 6px; font-size: 11.5px; padding: 3px 9px;">전문 보기</button>
        ${l.status === 'FAILED' && l.canRetry !== false ? `<button type="button" class="btn btn-xs btn-outline-danger font-weight-bold" onclick="retryAcademyDispatch('${l.id}')" style="border-radius: 6px; font-size: 11.5px; padding: 3px 9px;">재발송</button>` : ''}
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function retryAcademyDispatch(id) {
  if (window.NanoBilling) return NanoBilling.retry(id);
  if (window.NanoPortal && NanoPortal.remote) { showAcademyToast('재발송 및 충전 차감 연동이 준비되지 않아 발송하지 않았습니다.'); return; }
  var l = academyDispatchLogs.find(item => item.id === id);
  if (l) {
    l.status = 'SUCCESS';
    renderAcademyDispatchTable();
    showAcademyToast('학부모 알림톡이 성공적으로 재전송되었습니다.');
  }
}

// ==============================================================
// 7. 원내 랭킹 조회 모듈 (Internal Student Ranking & Hall of Fame)
// ==============================================================

// 나노 프렌즈 캐릭터 SVG 벡터 생성기 (학생 페이지 NanoQuizResult와 동일한 공식 일러스트 연동)
var NANO_FRIEND_IDS = ['nano', 'toto', 'booki', 'pico', 'popo', 'chichi', 'lumi', 'mir', 'jelly'];

function getStudentCharacterId(std) {
  if (!std) return 'nano';
  var candidate = std.characterId || std.charId;
  if (candidate && NANO_FRIEND_IDS.includes(candidate)) return candidate;
  // 운영 화면에서는 관리자 브라우저에 남아 있는 다른 계정의 선택을 섞지 않습니다.
  if (window.NanoPortal && NanoPortal.remote) return 'nano';
  var sId = std.username || std.id || std.studentId || '';
  try {
    if (sId) {
      var saved = localStorage.getItem('NANO_STUDENT_AVATAR_ID_' + sId);
      if (saved && NANO_FRIEND_IDS.includes(saved)) return saved;
    }
  } catch(e) {}
  return 'nano';
}

function getCharacterSvg(charId, size, stage) {
  size = size || 60;
  stage = stage || 1;
  charId = (charId && NANO_FRIEND_IDS.includes(charId)) ? charId : 'nano';
  if (typeof NanoQuizResult !== 'undefined' && typeof NanoQuizResult.avatar === 'function') {
    return NanoQuizResult.avatar(charId, size, stage);
  }
  size = size || 60;
  var svgs = {
    nano: '<svg viewBox="0 0 100 100" width="' + size + '" height="' + size + '">'
      + '<circle cx="50" cy="50" r="48" fill="#ffedd5" stroke="#f97316" stroke-width="2.5"/>'
      + '<polygon points="26,38 18,12 40,24" fill="#f97316"/>'
      + '<polygon points="28,34 22,17 38,25" fill="#fbcfe8"/>'
      + '<polygon points="74,38 82,12 60,24" fill="#f97316"/>'
      + '<polygon points="72,34 78,17 62,25" fill="#fbcfe8"/>'
      + '<circle cx="50" cy="56" r="34" fill="#f97316"/>'
      + '<path d="M26,56 Q50,78 74,56 Q50,90 26,56" fill="#fff"/>'
      + '<ellipse cx="38" cy="48" rx="8" ry="7" fill="none" stroke="#78350f" stroke-width="2.5"/>'
      + '<ellipse cx="62" cy="48" rx="8" ry="7" fill="none" stroke="#78350f" stroke-width="2.5"/>'
      + '<line x1="46" y1="48" x2="54" y2="48" stroke="#78350f" stroke-width="2.5"/>'
      + '<circle cx="38" cy="48" r="3.5" fill="#1e293b"/>'
      + '<circle cx="39.5" cy="46.5" r="1.2" fill="#fff"/>'
      + '<circle cx="62" cy="48" r="3.5" fill="#1e293b"/>'
      + '<circle cx="63.5" cy="46.5" r="1.2" fill="#fff"/>'
      + '<ellipse cx="50" cy="62" rx="3.5" ry="2.5" fill="#1e293b"/>'
      + '<circle cx="30" cy="58" r="4.5" fill="#fda4af" opacity="0.8"/>'
      + '<circle cx="70" cy="58" r="4.5" fill="#fda4af" opacity="0.8"/>'
      + '</svg>',
    booki: '<svg viewBox="0 0 100 100" width="' + size + '" height="' + size + '">'
      + '<circle cx="50" cy="50" r="48" fill="#ccfbf1" stroke="#0d9488" stroke-width="2.5"/>'
      + '<circle cx="50" cy="55" r="33" fill="#0d9488"/>'
      + '<ellipse cx="50" cy="63" rx="20" ry="22" fill="#f0fdfa"/>'
      + '<polygon points="28,34 20,20 38,28" fill="#0f766e"/>'
      + '<polygon points="72,34 80,20 62,28" fill="#0f766e"/>'
      + '<circle cx="38" cy="50" r="11" fill="#fff" stroke="#042f2e" stroke-width="2"/>'
      + '<circle cx="62" cy="50" r="11" fill="#fff" stroke="#042f2e" stroke-width="2"/>'
      + '<circle cx="38" cy="50" r="4.5" fill="#134e4a"/>'
      + '<circle cx="40" cy="48" r="1.5" fill="#fff"/>'
      + '<circle cx="62" cy="50" r="4.5" fill="#134e4a"/>'
      + '<circle cx="64" cy="48" r="1.5" fill="#fff"/>'
      + '<polygon points="46,57 54,57 50,64" fill="#f59e0b"/>'
      + '<rect x="36" y="16" width="28" height="12" rx="2.5" fill="#b45309" stroke="#78350f" stroke-width="1.5"/>'
      + '<rect x="38" y="18" width="24" height="2" fill="#fde68a"/>'
      + '</svg>',
    toto: '<svg viewBox="0 0 100 100" width="' + size + '" height="' + size + '">'
      + '<circle cx="50" cy="50" r="48" fill="#fce7f3" stroke="#ec4899" stroke-width="2.5"/>'
      + '<ellipse cx="37" cy="24" rx="8" ry="20" fill="#fff" stroke="#ec4899" stroke-width="2"/>'
      + '<ellipse cx="37" cy="24" rx="4.5" ry="15" fill="#f472b6"/>'
      + '<ellipse cx="63" cy="24" rx="8" ry="20" fill="#fff" stroke="#ec4899" stroke-width="2"/>'
      + '<ellipse cx="63" cy="24" rx="4.5" ry="15" fill="#f472b6"/>'
      + '<circle cx="50" cy="60" r="31" fill="#fff" stroke="#ec4899" stroke-width="2"/>'
      + '<circle cx="40" cy="56" r="3.5" fill="#1e293b"/>'
      + '<circle cx="41.5" cy="54.5" r="1.2" fill="#fff"/>'
      + '<circle cx="60" cy="56" r="3.5" fill="#1e293b"/>'
      + '<circle cx="61.5" cy="54.5" r="1.2" fill="#fff"/>'
      + '<polygon points="47,64 53,64 50,68" fill="#ec4899"/>'
      + '<circle cx="32" cy="63" r="5" fill="#fbcfe8" opacity="0.9"/>'
      + '<circle cx="68" cy="63" r="5" fill="#fbcfe8" opacity="0.9"/>'
      + '</svg>',
    lumi: '<svg viewBox="0 0 100 100" width="' + size + '" height="' + size + '" role="img" aria-label="냥이">'
      + '<circle cx="50" cy="50" r="48" fill="#ede9fe" stroke="#8b5cf6" stroke-width="2.5"/>'
      + '<path d="M25 42 23 18 42 30M58 30 77 18 75 42" fill="#b9a0d4" stroke="#79628e" stroke-width="2.5" stroke-linejoin="round"/>'
      + '<path d="M29 32 28 25 37 31M63 31 72 25 71 32" fill="#e9bfd1"/>'
      + '<ellipse cx="50" cy="54" rx="31" ry="27" fill="#c5b2dc"/>'
      + '<ellipse cx="50" cy="63" rx="17" ry="12" fill="#faf5ff"/>'
      + '<ellipse cx="39" cy="51" rx="3.4" ry="4.4" fill="#49384f"/>'
      + '<ellipse cx="61" cy="51" rx="3.4" ry="4.4" fill="#49384f"/>'
      + '<circle cx="40" cy="49.5" r="1.1" fill="#fff"/><circle cx="62" cy="49.5" r="1.1" fill="#fff"/>'
      + '<path d="M47 59 53 59 50 62Z" fill="#c88fa5"/>'
      + '<path d="M50 62v3m-6 0q3 4 6 0q3 4 6 0M21 58l13 2m-13 5 13-1m45-6-13 2m13 5-13-1" fill="none" stroke="#79628e" stroke-width="1.7" stroke-linecap="round"/>'
      + '</svg>',
    popo: '<svg viewBox="0 0 100 100" width="' + size + '" height="' + size + '">'
      + '<circle cx="50" cy="50" r="48" fill="#fef3c7" stroke="#b45309" stroke-width="2.5"/>'
      + '<circle cx="28" cy="30" r="11" fill="#b45309"/>'
      + '<circle cx="28" cy="30" r="6" fill="#fef3c7"/>'
      + '<circle cx="72" cy="30" r="11" fill="#b45309"/>'
      + '<circle cx="72" cy="30" r="6" fill="#fef3c7"/>'
      + '<circle cx="50" cy="58" r="33" fill="#b45309"/>'
      + '<ellipse cx="50" cy="67" rx="18" ry="14" fill="#fde68a"/>'
      + '<circle cx="39" cy="53" r="3.5" fill="#1e293b"/>'
      + '<circle cx="40.5" cy="51.5" r="1.2" fill="#fff"/>'
      + '<circle cx="61" cy="53" r="3.5" fill="#1e293b"/>'
      + '<circle cx="62.5" cy="51.5" r="1.2" fill="#fff"/>'
      + '<ellipse cx="50" cy="64" rx="5" ry="3.5" fill="#1e293b"/>'
      + '</svg>',
    pico: '<svg viewBox="0 0 100 100" width="' + size + '" height="' + size + '">'
      + '<circle cx="50" cy="50" r="48" fill="#e0f2fe" stroke="#0284c7" stroke-width="2.5"/>'
      + '<circle cx="50" cy="54" r="33" fill="#0f172a"/>'
      + '<ellipse cx="50" cy="59" rx="20" ry="25" fill="#fff"/>'
      + '<circle cx="40" cy="49" r="4" fill="#0284c7"/>'
      + '<circle cx="41.5" cy="47.5" r="1.3" fill="#fff"/>'
      + '<circle cx="60" cy="49" r="4" fill="#0284c7"/>'
      + '<circle cx="61.5" cy="47.5" r="1.3" fill="#fff"/>'
      + '<polygon points="46,55 54,55 50,63" fill="#f59e0b"/>'
      + '<ellipse cx="50" cy="54" rx="35" ry="35" fill="none" stroke="#38bdf8" stroke-width="3" opacity="0.75"/>'
      + '</svg>',
    chichi: '<svg viewBox="0 0 100 100" width="' + size + '" height="' + size + '">'
      + '<circle cx="50" cy="50" r="48" fill="#ffedd5" stroke="#ea580c" stroke-width="2.5"/>'
      + '<polygon points="32,32 20,18 36,24" fill="#ea580c"/>'
      + '<polygon points="68,32 80,18 64,24" fill="#ea580c"/>'
      + '<circle cx="50" cy="56" r="31" fill="#ea580c"/>'
      + '<ellipse cx="50" cy="64" rx="16" ry="18" fill="#fff"/>'
      + '<circle cx="39" cy="52" r="3.5" fill="#1e293b"/>'
      + '<circle cx="40.5" cy="50.5" r="1.2" fill="#fff"/>'
      + '<circle cx="61" cy="52" r="3.5" fill="#1e293b"/>'
      + '<circle cx="62.5" cy="50.5" r="1.2" fill="#fff"/>'
      + '<ellipse cx="50" cy="60" rx="4" ry="3" fill="#1e293b"/>'
      + '<rect x="47" y="63" width="6" height="5" fill="#fff" stroke="#1e293b" stroke-width="1"/>'
      + '<circle cx="28" cy="60" r="6" fill="#fdba74"/>'
      + '<circle cx="72" cy="60" r="6" fill="#fdba74"/>'
      + '</svg>',
    mir: '<svg viewBox="0 0 100 100" width="' + size + '" height="' + size + '">'
      + '<circle cx="50" cy="50" r="48" fill="#d1fae5" stroke="#059669" stroke-width="2.5"/>'
      + '<path d="M30,28 Q24,12 36,18 Q40,24 38,32" fill="#059669"/>'
      + '<path d="M70,28 Q76,12 64,18 Q60,24 62,32" fill="#059669"/>'
      + '<circle cx="50" cy="56" r="31" fill="#10b981"/>'
      + '<ellipse cx="50" cy="66" rx="18" ry="16" fill="#a7f3d0"/>'
      + '<circle cx="40" cy="50" r="4" fill="#064e3b"/>'
      + '<circle cx="41.5" cy="48.5" r="1.3" fill="#fff"/>'
      + '<circle cx="60" cy="50" r="4" fill="#064e3b"/>'
      + '<circle cx="61.5" cy="48.5" r="1.3" fill="#fff"/>'
      + '<circle cx="46" cy="60" r="1.5" fill="#064e3b"/>'
      + '<circle cx="54" cy="60" r="1.5" fill="#064e3b"/>'
      + '<polygon points="50,16 53,24 61,24 54,29 57,37 50,32 43,37 46,29 39,24 47,24" fill="#facc15"/>'
      + '</svg>',
    choco: '<svg viewBox="0 0 100 100" width="' + size + '" height="' + size + '">'
      + '<circle cx="50" cy="50" r="48" fill="#fef9c3" stroke="#854d0e" stroke-width="2.5"/>'
      + '<ellipse cx="24" cy="46" rx="8" ry="17" fill="#854d0e"/>'
      + '<ellipse cx="76" cy="46" rx="8" ry="17" fill="#854d0e"/>'
      + '<circle cx="50" cy="56" r="31" fill="#ca8a04"/>'
      + '<ellipse cx="50" cy="65" rx="15" ry="14" fill="#fef08a"/>'
      + '<circle cx="41" cy="52" r="3.5" fill="#1e293b"/>'
      + '<circle cx="42.5" cy="50.5" r="1.2" fill="#fff"/>'
      + '<circle cx="59" cy="52" r="3.5" fill="#1e293b"/>'
      + '<circle cx="60.5" cy="50.5" r="1.2" fill="#fff"/>'
      + '<ellipse cx="50" cy="61" rx="4.5" ry="3.5" fill="#1e293b"/>'
      + '<path d="M47,65 Q50,68 53,65" stroke="#1e293b" stroke-width="1.5" fill="none"/>'
      + '</svg>',
    jelly: '<svg viewBox="0 0 100 100" width="' + size + '" height="' + size + '" role="img" aria-label="양양">'
      + '<circle cx="50" cy="50" r="48" fill="#fff8eb" stroke="#b59b73" stroke-width="2.5"/>'
      + '<g fill="#fffdf6" stroke="#e1d2b8" stroke-width="1.5">'
      + '<circle cx="50" cy="28" r="14"/><circle cx="32" cy="35" r="14"/><circle cx="68" cy="35" r="14"/>'
      + '<circle cx="25" cy="52" r="14"/><circle cx="75" cy="52" r="14"/><circle cx="32" cy="70" r="14"/>'
      + '<circle cx="68" cy="70" r="14"/><circle cx="50" cy="76" r="14"/></g>'
      + '<ellipse cx="27" cy="52" rx="12" ry="7" fill="#c8b196" transform="rotate(22 27 52)"/>'
      + '<ellipse cx="73" cy="52" rx="12" ry="7" fill="#c8b196" transform="rotate(-22 73 52)"/>'
      + '<ellipse cx="50" cy="57" rx="23" ry="25" fill="#e5d3b8"/>'
      + '<g fill="#fffdf6"><circle cx="36" cy="35" r="10"/><circle cx="50" cy="31" r="11"/><circle cx="64" cy="35" r="10"/></g>'
      + '<ellipse cx="41" cy="55" rx="3" ry="4" fill="#5f5143"/><ellipse cx="59" cy="55" rx="3" ry="4" fill="#5f5143"/>'
      + '<circle cx="42" cy="53.5" r="1" fill="#fff"/><circle cx="60" cy="53.5" r="1" fill="#fff"/>'
      + '<path d="M47 64 53 64 50 67Z" fill="#9b7d68"/><path d="M46 69q4 4 8 0" fill="none" stroke="#9b7d68" stroke-width="1.6" stroke-linecap="round"/>'
      + '</svg>'
  };
  return svgs[charId] || svgs.nano;
}

// 랭킹 필터 상태: 3가지 조회 모드 ('MONTH' | 'ALL' | 'RANGE'), 집계 월, 시작일, 종료일, 학급명
var adminRankMode = 'MONTH'; // 기본값: 월별 순위
var adminRankPeriod = '';    // 기본값: 현재월
var adminRankStartDate = '';
var adminRankEndDate = '';
var adminRankClass = 'all';

// 조회 방식 3단계 전환 함수 (월별 / 전체 누적 / 기간 지정)
function setAdminRankMode(mode) {
  adminRankMode = mode || 'MONTH';

  var btnMonth = document.getElementById('btnRankModeMonth');
  var btnAll = document.getElementById('btnRankModeAll');
  var btnRange = document.getElementById('btnRankModeRange');
  var wrapMonth = document.getElementById('rankFilterMonthWrap');
  var wrapRange = document.getElementById('rankFilterRangeWrap');

  function setBtnStyle(btn, active) {
    if (!btn) return;
    if (active) {
      btn.style.background = '#ffffff';
      btn.style.color = 'var(--text-main)';
      btn.style.boxShadow = '0 1px 3px rgba(0,0,0,0.08)';
      btn.classList.add('active');
    } else {
      btn.style.background = 'transparent';
      btn.style.color = '#64748b';
      btn.style.boxShadow = 'none';
      btn.classList.remove('active');
    }
  }

  setBtnStyle(btnMonth, adminRankMode === 'MONTH');
  setBtnStyle(btnAll, adminRankMode === 'ALL');
  setBtnStyle(btnRange, adminRankMode === 'RANGE');

  // 월별 순위(MONTH)일 때만 월선택 드롭다운 표시 (전체 누적, 기간 지정 순위에서는 완전 숨김)
  if (wrapMonth) {
    wrapMonth.classList.remove('d-flex');
    wrapMonth.style.setProperty('display', (adminRankMode === 'MONTH') ? 'flex' : 'none', 'important');
  }
  // 기간 지정 순위(RANGE)일 때만 조회 기간 범위 선택기 표시
  if (wrapRange) {
    wrapRange.classList.remove('d-flex');
    wrapRange.style.setProperty('display', (adminRankMode === 'RANGE') ? 'flex' : 'none', 'important');
  }

  // 기간 지정 모드 기본 날짜 세팅 (이번 달 1일 ~ 오늘)
  if (adminRankMode === 'RANGE') {
    var startInput = document.getElementById('adminRankStartDate');
    var endInput = document.getElementById('adminRankEndDate');
    var now = new Date();
    var y = now.getFullYear();
    var m = String(now.getMonth() + 1).padStart(2, '0');
    var d = String(now.getDate()).padStart(2, '0');
    if (!adminRankStartDate) adminRankStartDate = y + '-' + m + '-01';
    if (!adminRankEndDate) adminRankEndDate = y + '-' + m + '-' + d;
    if (startInput && !startInput.value) startInput.value = adminRankStartDate;
    if (endInput && !endInput.value) endInput.value = adminRankEndDate;
  }

  renderAdminRankingView();
}

var adminServerRankingCache = {};
var adminServerRankingReqSeq = 0;
var adminServerAvailableMonths = [];

// 집계 가능한 기간: 현재월 포함 기본 최근 12개월 + 실제 학습/포인트 이력이 존재하는 모든 과거 월 자동 확장
function getAdminRankMonthOptions() {
  var monthMap = {};
  var now = new Date();
  var currentYm = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');
  var lastDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  var lastYm = lastDate.getFullYear() + '-' + String(lastDate.getMonth() + 1).padStart(2, '0');
  var prev2Date = new Date(now.getFullYear(), now.getMonth() - 2, 1);
  var prev2Ym = prev2Date.getFullYear() + '-' + String(prev2Date.getMonth() + 1).padStart(2, '0');

  function registerYm(ym) {
    if (!ym || !/^\d{4}-(0[1-9]|1[0-2])$/.test(ym) || monthMap[ym]) return;
    var parts = ym.split('-');
    var y = parseInt(parts[0], 10);
    var m = parseInt(parts[1], 10);
    var suffix = ym === currentYm ? ' (이번 달)' : (ym === lastYm ? ' (지난달)' : (ym === prev2Ym ? ' (지지난달)' : ''));
    monthMap[ym] = { key: ym, label: y + '년 ' + m + '월' + suffix, short: y + '년 ' + m + '월' };
  }

  for (var i = 0; i < 12; i++) {
    var d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    registerYm(d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0'));
  }

  if (typeof getLoadedLearningLogs === 'function') {
    var logs = getLoadedLearningLogs() || [];
    for (var li = 0; li < logs.length; li++) {
      var ymFromLog = String((logs[li] && logs[li].date) || '').slice(0, 7);
      registerYm(ymFromLog);
    }
  }

  if (typeof adminServerAvailableMonths !== 'undefined' && Array.isArray(adminServerAvailableMonths)) {
    for (var mi = 0; mi < adminServerAvailableMonths.length; mi++) {
      registerYm(adminServerAvailableMonths[mi]);
    }
  }

  return Object.keys(monthMap)
    .sort(function(a, b) { return b.localeCompare(a); })
    .map(function(k) { return monthMap[k]; });
}

// 랭킹 화면의 기간/학급 드롭다운을 실제 데이터로 채움 (사용자가 방금 변경한 선택값을 최우선 보존)
function populateAdminRankFilters() {
  var periodSel = document.getElementById('adminRankPeriodSelect');
  if (periodSel && periodSel.options.length > 0 && periodSel.value) {
    adminRankPeriod = periodSel.value;
  }

  var months = getAdminRankMonthOptions();
  if (!adminRankPeriod || !months.some(function(m) { return m.key === adminRankPeriod; })) {
    adminRankPeriod = months[0].key;
  }

  if (periodSel) {
    if (periodSel.options.length !== months.length) {
      periodSel.innerHTML = months.map(function(m) { return '<option value="' + m.key + '">' + m.label + '</option>'; }).join('');
    }
    if (adminRankPeriod) periodSel.value = adminRankPeriod;
  }

  var classSel = document.getElementById('adminRankClassSelect');
  if (classSel && classSel.options.length > 1 && classSel.value) {
    adminRankClass = classSel.value;
  }
  if (classSel) {
    if (classSel.options.length <= 1) {
      var html = '<option value="all">원내 전체</option>';
      academyClassList.forEach(function(c) { html += '<option value="' + c.name + '">' + c.name + '</option>'; });
      classSel.innerHTML = html;
    }
    if (adminRankClass !== 'all' && !academyClassList.some(function(c) { return c.name === adminRankClass; })) adminRankClass = 'all';
    if (adminRankClass) classSel.value = adminRankClass;
  }
}

// 3가지 모드(월별 / 전체 누적 / 기간 지정)에 따른 현행 포인트 적립 기준 실시간 순위 산출
function buildAdminRankingRows(periodOverride) {
  var hasDoc = typeof document !== 'undefined' && document && typeof document.getElementById === 'function';
  var mode = periodOverride ? 'MONTH' : ((typeof adminRankMode !== 'undefined' && adminRankMode) ? adminRankMode : 'MONTH');
  var pSel = hasDoc ? document.getElementById('adminRankPeriodSelect') : null;
  var fallbackPeriod = (typeof adminRankPeriod !== 'undefined' && adminRankPeriod) ? adminRankPeriod : '';
  var monthKey = periodOverride || ((pSel && pSel.value) ? pSel.value : fallbackPeriod);
  var startInput = hasDoc ? document.getElementById('adminRankStartDate') : null;
  var endInput = hasDoc ? document.getElementById('adminRankEndDate') : null;
  var startDate = (startInput && startInput.value) ? startInput.value : ((typeof adminRankStartDate !== 'undefined' && adminRankStartDate) ? adminRankStartDate : '');
  var endDate = (endInput && endInput.value) ? endInput.value : ((typeof adminRankEndDate !== 'undefined' && adminRankEndDate) ? adminRankEndDate : '');

  // 1. 전체 학습 로그를 시간순 정렬하여 현행 적립 정책(60점 이상 인증, 도서당 최대 2회차, 초4 이상 1.2배, 정답×3P + 생각담기 5P) 적용
  var rawLogs = (typeof getLoadedLearningLogs === 'function' ? getLoadedLearningLogs() : []) || [];
  var sortedAllLogs = rawLogs.slice().sort(function(a, b) {
    var ta = String(a.submittedAt || a.date || '');
    var tb = String(b.submittedAt || b.date || '');
    return ta.localeCompare(tb) || String(a.id || '').localeCompare(String(b.id || ''));
  });

  var certRoundByStudentBook = {};
  var byStudent = {};

  sortedAllLogs.forEach(function(l) {
    if (!l) return;
    var sKey = String(l.studentId || l.studentName || '');
    var bKey = String(l.bookId || l.bookTitle || '');
    var scoreNum = Number(l.score) || 0;
    var isCert = scoreNum >= 60;
    var earnedPts = 0;

    if (isCert) {
      var roundKey = sKey + '::' + bKey;
      var nextRound = (certRoundByStudentBook[roundKey] || 0) + 1;
      certRoundByStudentBook[roundKey] = nextRound;

      if (typeof l.earnedPoints === 'number') {
        earnedPts = l.earnedPoints;
      } else if (nextRound <= 2) {
        var gStr = String(l.grade || '').trim();
        var isHighGrade = /중|고/.test(gStr) || (/(?:초등?\s*|초)?([4-6])/.test(gStr));
        var mult = isHighGrade ? 1.2 : 1;
        var qr = Array.isArray(l.quizResults) ? l.quizResults : [];
        var correctCnt = (typeof l.correctCount === 'number' && l.correctCount > 0)
          ? l.correctCount
          : (qr.length > 0 ? qr.filter(function(r) { return r && r.isCorrect; }).length : Math.round((scoreNum / 100) * 5));
        var thoughtTxt = String(l.studentThoughtAnswer || l.thoughtAnswer || '').trim();
        earnedPts = Math.round(correctCnt * 3 * mult) + (thoughtTxt ? Math.round(5 * mult) : 0);
      }
    }

    var lDate = String(l.date || '').slice(0, 10);
    var inWindow = true;
    if (mode === 'MONTH') {
      inWindow = monthKey ? (lDate.slice(0, 7) === monthKey) : true;
    } else if (mode === 'RANGE') {
      if (startDate && lDate < startDate) inWindow = false;
      if (endDate && lDate > endDate) inWindow = false;
    }
    if (!inWindow) return;

    if (!byStudent[sKey]) {
      byStudent[sKey] = {
        studentId: l.studentId || '',
        name: l.studentName || l.name || '-',
        classGroup: l.classGroup || '미지정',
        certBookMap: {},
        certBookCount: 0,
        attemptCount: 0,
        scoreSum: 0,
        earnedSum: 0
      };
    }
    var st = byStudent[sKey];
    st.attemptCount += 1;
    st.scoreSum += scoreNum;
    st.earnedSum += earnedPts;
    if (isCert && bKey && !st.certBookMap[bKey]) {
      st.certBookMap[bKey] = true;
      st.certBookCount += 1;
    }
  });

  // 2. 학원 자체 수동 부여 포인트 (로컬 캐시 폴백 - 비원격 또는 서버 동기화 전 즉시 반영용)
  var isRemoteActive = typeof NanoPortal !== 'undefined' && NanoPortal && NanoPortal.remote;
  var acadId = (typeof currentAcademyInfo !== 'undefined' && currentAcademyInfo && currentAcademyInfo.id) ? currentAcademyInfo.id : '';
  var cacheKey = acadId + '|' + mode + '|' + (mode === 'MONTH' ? monthKey : (mode === 'RANGE' ? (startDate + '~' + endDate) : 'ALL'));
  var serverSnap = (!periodOverride && typeof adminServerRankingCache !== 'undefined' && adminServerRankingCache) ? adminServerRankingCache[cacheKey] : null;

  var manualPointsByStudent = {};
  if (!serverSnap && typeof localStorage !== 'undefined' && localStorage && typeof localStorage.getItem === 'function') {
    try {
      var rawManualLogs = localStorage.getItem('NANO_POINT_LOG_DATA');
      var manualLogs = rawManualLogs ? JSON.parse(rawManualLogs) : [];
      if (Array.isArray(manualLogs)) {
        manualLogs.forEach(function(mlog) {
          if (isRemoteActive && mlog.syncedToServer) return;
          var mDate = String(mlog.date || (mlog.createdAt || '').slice(0, 10));
          var matchDate = true;
          if (mode === 'MONTH') {
            matchDate = monthKey ? (mDate.slice(0, 7) === monthKey) : true;
          } else if (mode === 'RANGE') {
            if (startDate && mDate < startDate) matchDate = false;
            if (endDate && mDate > endDate) matchDate = false;
          }
          if (matchDate) {
            var mKey = String(mlog.studentId || mlog.studentName || '');
            var amt = Number(mlog.amount) || 0;
            manualPointsByStudent[mKey] = (manualPointsByStudent[mKey] || 0) + amt;
          }
        });
      }
    } catch(e) {}
  }

  // 3. studentDataList의 모든 원생 매핑
  var rows = [];
  (studentDataList || []).forEach(function(std) {
    var stdId = std.id || std.username || '';
    var sName = std.name || '';
    var logItem = byStudent[stdId] || byStudent[std.username] || byStudent[sName] || null;
    var srvItem = serverSnap ? (serverSnap.byServerId[std.serverId] || serverSnap.byUsername[std.username || stdId] || null) : null;

    var books = srvItem ? srvItem.books : (logItem ? logItem.certBookCount : (mode === 'ALL' ? (Number(std.bookCount) || 0) : 0));
    var earnedPts = logItem ? logItem.earnedSum : 0;
    var manualPts = (manualPointsByStudent[stdId] || 0) + (sName && sName !== stdId ? (manualPointsByStudent[sName] || 0) : 0);

    var finalPoints = 0;
    if (srvItem) {
      finalPoints = Number(srvItem.points) || 0;
    } else if (mode === 'ALL') {
      var basePoints = Number(std.points) || 0;
      finalPoints = Math.max(basePoints, earnedPts + manualPts);
    } else {
      finalPoints = Math.max(0, earnedPts + manualPts);
    }

    var quizRateStr = '-';
    if (srvItem && srvItem.quizAvg != null) {
      quizRateStr = Number(srvItem.quizAvg).toFixed(1) + '%';
    } else if (logItem && logItem.attemptCount > 0) {
      quizRateStr = (logItem.scoreSum / logItem.attemptCount).toFixed(1) + '%';
    } else if (mode === 'ALL' && std.quizAvg && std.quizAvg !== '-') {
      quizRateStr = Number(std.quizAvg).toFixed(1) + '%';
    }

    rows.push({
      studentId: stdId,
      name: sName,
      loginId: std.username || std.id,
      charId: getStudentCharacterId(std),
      stage: std.characterStage || 1,
      grade: (std.grade || '미등록') + ' (' + (std.classGroup || '미지정') + ')',
      classKey: std.classGroup || '미지정',
      books: books,
      quizRate: quizRateStr,
      points: finalPoints
    });
  });

  // 포인트 순 -> 완독 권수 순 -> 이름 순 정렬
  rows.sort(function(a, b) {
    return b.points - a.points || b.books - a.books || String(a.name || '').localeCompare(String(b.name || ''), 'ko');
  });

  rows.forEach(function(r, idx) {
    r.badge = idx === 0 ? '골드 독서왕 🥇' : idx === 1 ? '실버 리더 🥈' : idx === 2 ? '브론즈 리더 🥉' : '독서가';
  });

  return rows;
}

// 현재 필터된 랭킹 리스트 가져오기
function getFilteredAdminRankingList() {
  var cSel = document.getElementById('adminRankClassSelect');
  if (cSel) adminRankClass = cSel.value;
  var pSel = document.getElementById('adminRankPeriodSelect');
  if (pSel && pSel.value) adminRankPeriod = pSel.value;

  var list = buildAdminRankingRows();
  // 독서 포인트가 0P인 학생은 리스트에 뜨지 않도록 제외
  list = list.filter(function(item) {
    return Number(item.points) > 0;
  });
  if (adminRankClass !== 'all') {
    list = list.filter(function(item) {
      return item.classKey === adminRankClass;
    });
  }

  // 순위 재부여
  return list.map(function(item, idx) {
    var copy = Object.assign({}, item);
    copy.displayRank = idx + 1;
    return copy;
  });
}

var adminRankCharacterRequest = 0;
async function refreshAdminRankingCharacters() {
  var requestId = ++adminRankCharacterRequest;
  var academyId = currentAcademyInfo.id;
  var status = document.getElementById('adminRankCharacterStatus');
  if (status) status.textContent = '학생이 선택한 나노프렌즈를 확인하고 있습니다…';
  try {
    var result = await NanoPortal.api('/api/activity?action=characters&academy=' + encodeURIComponent(academyId));
    if (requestId !== adminRankCharacterRequest || currentAcademyInfo.id !== academyId) return;
    var byId = new Map((result.items || []).map(function(item) { return [item.memberId, item]; }));
    studentDataList.forEach(function(student) {
      var selected = byId.get(student.serverId);
      student.characterId = selected ? selected.characterId : 'nano';
      student.characterStage = selected ? selected.stage : 1;
    });
    if (status) status.textContent = '';
    renderAdminRankingView(true);
  } catch (_) {
    if (requestId === adminRankCharacterRequest && currentAcademyInfo.id === academyId && status) {
      status.textContent = '최신 나노프렌즈를 불러오지 못했습니다. 랭킹 메뉴를 다시 열어 주세요.';
    }
  }
}

function escapeRankingText(value) {
  return String(value == null ? '' : value).replace(/[&<>"']/g, function(char) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char];
  });
}

function renderAdminRankingPodium(list) {
  if (!list.length) return '<div class="ranking-empty py-4 text-center text-muted" style="width:100%;font-size:13.5px;font-weight:700;"><i class="fa-solid fa-trophy mr-1 text-warning"></i>해당 기간에 획득한 독서 포인트(1P 이상)가 있는 원생이 없습니다.</div>';
  return list.slice(0, 3).map(function(student, index) {
    var rank = index + 1;
    return '<article class="rank-champion-card rank-' + rank + '" aria-label="' + rank + '위 ' + escapeRankingText(student.name) + '">' +
      '<div class="champion-avatar-wrap">' +
        (rank === 1 ? '<span class="champion-crown" aria-hidden="true"><i class="fa-solid fa-crown"></i></span>' : '') +
        '<div class="champion-avatar">' + getCharacterSvg(student.charId, 104, student.stage || 1) + '</div>' +
      '</div>' +
      '<div class="champion-rank">' + rank + '위' + (rank === 1 ? '<span>이달의 독서왕</span>' : '') + '</div>' +
      '<h3 class="champion-name">' + escapeRankingText(student.name) + '</h3>' +
      '<p class="champion-class">' + escapeRankingText(student.grade) + '</p>' +
      '<div class="champion-record"><strong>' + Number(student.points || 0).toLocaleString() + '<span>P</span></strong>' +
        '<span class="champion-books"><i class="fa-solid fa-book-open" aria-hidden="true"></i> ' + Number(student.books || 0) + '권 완독</span>' +
      '</div></article>';
  }).join('');
}

async function refreshAdminServerRankings() {
  if (!(window.NanoPortal && NanoPortal.remote && currentAcademyInfo && currentAcademyInfo.id)) return;
  var acadId = currentAcademyInfo.id;
  var curMode = adminRankMode || 'MONTH';
  var pSel = document.getElementById('adminRankPeriodSelect');
  var monthVal = (pSel && pSel.options.length > 0 && pSel.value) ? pSel.value : adminRankPeriod;
  var sInput = document.getElementById('adminRankStartDate');
  var eInput = document.getElementById('adminRankEndDate');
  var sDate = (sInput && sInput.value) ? sInput.value : adminRankStartDate;
  var eDate = (eInput && eInput.value) ? eInput.value : adminRankEndDate;

  var cacheKey = acadId + '|' + curMode + '|' + (curMode === 'MONTH' ? monthVal : (curMode === 'RANGE' ? (sDate + '~' + eDate) : 'ALL'));
  var cached = adminServerRankingCache[cacheKey];
  if (cached && Date.now() - cached.loadedAt < 20000) return;

  var reqSeq = ++adminServerRankingReqSeq;
  try {
    var qs = '/api/manage?entity=rankings&academy=' + encodeURIComponent(acadId) + '&mode=' + encodeURIComponent(curMode);
    if (curMode === 'MONTH' && monthVal) qs += '&month=' + encodeURIComponent(monthVal);
    if (curMode === 'RANGE') {
      if (sDate) qs += '&startDate=' + encodeURIComponent(sDate);
      if (eDate) qs += '&endDate=' + encodeURIComponent(eDate);
    }
    var res = await NanoPortal.api(qs);
    if (reqSeq !== adminServerRankingReqSeq || currentAcademyInfo.id !== acadId) return;

    var byServerId = {};
    var byUsername = {};
    (res.items || []).forEach(function(item) {
      if (item.serverId) byServerId[item.serverId] = item;
      if (item.username) byUsername[item.username] = item;
      if (item.id) byUsername[item.id] = item;
    });
    adminServerRankingCache[cacheKey] = {
      loadedAt: Date.now(),
      byServerId: byServerId,
      byUsername: byUsername
    };
    if (Array.isArray(res.months) && res.months.length > 0) {
      adminServerAvailableMonths = res.months;
    }
    renderAdminRankingView(true);
  } catch (_) {}
}

// 화면 랭킹 뷰 메인 렌더링
function renderAdminRankingView(skipCharacterRefresh) {
  if (!skipCharacterRefresh && window.NanoPortal && NanoPortal.remote) refreshAdminRankingCharacters();

  // 랭킹 조회 모드별 툴바 컨트롤 표시/숨김 동기화 (전체 누적 및 기간 지정 선택 시 월선택 숨김 보장)
  var curMode = adminRankMode || 'MONTH';
  var wrapMonth = document.getElementById('rankFilterMonthWrap');
  var wrapRange = document.getElementById('rankFilterRangeWrap');
  if (wrapMonth) {
    wrapMonth.classList.remove('d-flex');
    wrapMonth.style.setProperty('display', (curMode === 'MONTH') ? 'flex' : 'none', 'important');
  }
  if (wrapRange) {
    wrapRange.classList.remove('d-flex');
    wrapRange.style.setProperty('display', (curMode === 'RANGE') ? 'flex' : 'none', 'important');
  }

  populateAdminRankFilters();
  if (!skipCharacterRefresh && window.NanoPortal && NanoPortal.remote) refreshAdminServerRankings();
  var list = getFilteredAdminRankingList();
  
  // 1. 상단 요약 통계 갱신
  var topStudentEl = document.getElementById('adminRankTopStudent');
  var totalBooksEl = document.getElementById('adminRankTotalBooks');
  var avgQuizEl = document.getElementById('adminRankAvgQuiz');
  var countLabel = document.getElementById('adminRankCountLabel');
  var podiumTitle = document.getElementById('adminPodiumTitle');

  var periodOpt = getAdminRankMonthOptions().find(function(m) { return m.key === adminRankPeriod; });
  var periodText = periodOpt ? periodOpt.short : adminRankPeriod;
  var currentClassText = adminRankClass === 'all' ? '원내 전체' : adminRankClass;

  if (podiumTitle) {
    var mode = adminRankMode || 'MONTH';
    if (mode === 'ALL') {
      podiumTitle.textContent = '전체 누적 TOP 3 독서 챔피언 (' + currentClassText + ')';
    } else if (mode === 'RANGE') {
      var sDate = (document.getElementById('adminRankStartDate') && document.getElementById('adminRankStartDate').value) || adminRankStartDate;
      var eDate = (document.getElementById('adminRankEndDate') && document.getElementById('adminRankEndDate').value) || adminRankEndDate;
      podiumTitle.textContent = (sDate || '기간') + ' ~ ' + (eDate || '기간') + ' TOP 3 독서 챔피언 (' + currentClassText + ')';
    } else {
      podiumTitle.textContent = periodText + ' TOP 3 독서 챔피언 (' + currentClassText + ')';
    }
  }

  if (list.length > 0) {
    var top1 = list[0];
    if (topStudentEl) topStudentEl.textContent = top1.name + ' (' + top1.grade.split('(')[0].trim() + ' · ' + top1.books + '권)';
    
    var totalBooks = list.reduce(function(acc, cur) { return acc + cur.books; }, 0);
    if (totalBooksEl) totalBooksEl.textContent = '총 ' + totalBooks + '권 완독';

    var totalRate = list.reduce(function(acc, cur) { return acc + parseFloat(cur.quizRate); }, 0);
    var avgRate = (totalRate / list.length).toFixed(1);
    if (avgQuizEl) avgQuizEl.textContent = avgRate + '% (우수)';
  } else {
    if (topStudentEl) topStudentEl.textContent = '-';
    if (totalBooksEl) totalBooksEl.textContent = '0권';
    if (avgQuizEl) avgQuizEl.textContent = '-';
  }

  if (countLabel) {
    countLabel.textContent = '총 ' + list.length + '명 등재 (' + currentClassText + ')';
  }

  var podiumStage = document.getElementById('adminPodiumStage');
  if (podiumStage) podiumStage.innerHTML = renderAdminRankingPodium(list);

  // 3. 전체 랭킹 테이블 렌더링
  var tbody = document.getElementById('academyRankingTableBody');
  if (tbody) {
    tbody.innerHTML = '';
    if (list.length === 0) {
      tbody.innerHTML = '<tr><td colspan="9" class="text-center py-5 text-muted font-weight-bold" style="font-size:13px;"><i class="fa-solid fa-circle-info mr-1"></i>해당 기간에 독서 포인트(1P 이상)를 획득한 원생이 없습니다.</td></tr>';
    } else {
      list.forEach(function(r) {
        var tr = document.createElement('tr');
        
        // 순위 표시
        var rankBadge = '';
        if (r.displayRank === 1) rankBadge = '<span class="badge badge-warning font-weight-bold" style="font-size:13.5px; padding:4px 9px;">🥇 1위</span>';
        else if (r.displayRank === 2) rankBadge = '<span class="badge badge-secondary font-weight-bold" style="font-size:13.5px; padding:4px 9px;">🥈 2위</span>';
        else if (r.displayRank === 3) rankBadge = '<span class="badge font-weight-bold" style="background:#ea580c; color:#fff; font-size:13.5px; padding:4px 9px;">🥉 3위</span>';
        else rankBadge = '<span class="font-weight-bold" style="font-size:14.5px; color:#475569;">' + r.displayRank + '위</span>';

        // 순위 변동 표시
        var changeHtml = '<span class="text-muted font-weight-bold" style="font-size:12px;">―</span>';
        if (r.change === 'up') {
          changeHtml = '<span class="text-danger font-weight-bold" style="font-size:12px;"><i class="fa-solid fa-arrow-up mr-1"></i>' + (r.diff || 1) + '</span>';
        } else if (r.change === 'down') {
          changeHtml = '<span class="text-primary font-weight-bold" style="font-size:12px;"><i class="fa-solid fa-arrow-down mr-1"></i>' + (r.diff || 1) + '</span>';
        }

        tr.innerHTML = `
          <td class="text-center">${rankBadge}</td>
          <td class="text-center">${changeHtml}</td>
          <td>
            <div class="d-flex align-items-center gap-2">
              <div class="ranking-list-avatar">
                ${getCharacterSvg(r.charId, 36, r.stage || 1)}
              </div>
              <div>
                <strong style="color: var(--text-main); font-size: 14.5px;">${r.name}</strong>
                <div style="font-size: 11px; color: var(--text-muted);">${r.loginId ? '(' + r.loginId + ')' : ''}</div>
              </div>
            </div>
          </td>
          <td class="text-center font-weight-bold text-secondary" style="font-size: 13px;">${r.grade}</td>
          <td class="text-center font-weight-bold" style="font-size: 14px; color: #1e293b;">
            <i class="fa-solid fa-book-bookmark text-warning mr-1"></i>${r.books}권
          </td>
          <td class="text-center font-weight-bold text-success" style="font-size: 14px;">
            ${r.quizRate}
          </td>
          <td class="text-right font-weight-bold" style="font-size: 15px; color: #b45309; padding-right: 20px;">
            ${r.points.toLocaleString()} P
          </td>
          <td class="text-center">
            <span class="badge-soft badge-soft-warn font-weight-bold px-3 py-1" style="font-size: 12px; border-radius: 12px;">
              ${r.badge}
            </span>
          </td>
          <td class="text-center">
            <button type="button" class="btn btn-sm btn-outline-success font-weight-bold"
              onclick="openManualPointModal('${r.studentId}')"
              title="${r.name} 학생 포인트 수동 부여/차감"
              style="font-size: 11.5px; border-radius: 8px; padding: 4px 10px; white-space: nowrap; border-color: #22c55e; color: #15803d; background: #f0fdf4;">
              <i class="fa-solid fa-coins mr-1 text-warning"></i>포인트 부여
            </button>
          </td>
        `;
        tbody.appendChild(tr);
      });
    }
  }
}

// ==============================================================
// 학원장 및 선생님 계정 수동 포인트 부여 기능 (-100pt ~ +100pt)
// ==============================================================
var currentManualPointStudent = null;
var currentManualPointDelta = 10;

function openManualPointModal(studentId) {
  if (!studentId) {
    showAcademyToast('학생 정보를 찾을 수 없습니다.');
    return;
  }

  var std = studentDataList.find(function(s) {
    return (s.id && s.id === studentId) || (s.username && s.username === studentId) || s.name === studentId;
  });

  if (!std) {
    showAcademyToast('등록된 원생 정보를 찾을 수 없습니다.');
    return;
  }

  currentManualPointStudent = std;
  currentManualPointDelta = 10;

  // 모달 데이터 채우기
  var nameEl = document.getElementById('manualPointStudentName');
  var idEl = document.getElementById('manualPointStudentId');
  var infoEl = document.getElementById('manualPointStudentInfo');
  var curPtEl = document.getElementById('manualPointCurrentPoints');
  var prevPtEl = document.getElementById('previewPrevPoints');
  var reasonInput = document.getElementById('manualPointReasonInput');

  if (nameEl) nameEl.textContent = std.name;
  if (idEl) idEl.textContent = 'ID: ' + (std.username || std.id || '-');
  if (infoEl) infoEl.textContent = (std.grade || '학년 미지정') + ' · ' + (std.classGroup || '학급 미지정');
  
  var currentPoints = Number(std.points) || 0;
  if (curPtEl) curPtEl.textContent = currentPoints.toLocaleString() + ' P';
  if (prevPtEl) prevPtEl.textContent = currentPoints.toLocaleString() + ' P';
  if (reasonInput) reasonInput.value = '';

  setManualPointDelta(10);
  $('#modalManualPointAdjustment').modal('show');
}

function setManualPointDelta(delta) {
  var num = parseInt(delta, 10);
  if (isNaN(num)) num = 0;
  if (num > 100) num = 100;
  if (num < -100) num = -100;

  currentManualPointDelta = num;

  var slider = document.getElementById('manualPointRangeSlider');
  var input = document.getElementById('manualPointInputNumber');
  if (slider) slider.value = num;
  if (input) input.value = num;

  updateManualPointPreview();
}

function syncManualPointFromSlider(val) {
  var num = parseInt(val, 10) || 0;
  currentManualPointDelta = num;
  var input = document.getElementById('manualPointInputNumber');
  if (input) input.value = num;
  updateManualPointPreview();
}

function syncManualPointFromInput(val) {
  var num = parseInt(val, 10);
  if (isNaN(num)) num = 0;
  if (num > 100) num = 100;
  if (num < -100) num = -100;
  currentManualPointDelta = num;

  var slider = document.getElementById('manualPointRangeSlider');
  if (slider) slider.value = num;
  updateManualPointPreview();
}

function updateManualPointPreview() {
  if (!currentManualPointStudent) return;
  var curPoints = Number(currentManualPointStudent.points) || 0;
  var delta = currentManualPointDelta;
  var finalPoints = Math.max(0, curPoints + delta);

  var deltaEl = document.getElementById('previewDeltaPoints');
  var deltaLbl = document.getElementById('previewDeltaLabel');
  var finalEl = document.getElementById('previewFinalPoints');

  if (deltaEl) {
    deltaEl.textContent = (delta > 0 ? '+' : '') + delta + ' P';
    deltaEl.style.color = delta > 0 ? '#16a34a' : (delta < 0 ? '#e11d48' : '#64748b');
  }
  if (deltaLbl) {
    deltaLbl.textContent = delta > 0 ? '부여 수치' : (delta < 0 ? '차감 수치' : '변동 없음');
    deltaLbl.style.color = delta > 0 ? '#15803d' : (delta < 0 ? '#be123c' : '#64748b');
  }
  if (finalEl) {
    finalEl.textContent = finalPoints.toLocaleString() + ' P';
  }
}

function setManualPointReason(reason) {
  var input = document.getElementById('manualPointReasonInput');
  if (input) input.value = reason;
}

function submitManualPointAdjustment() {
  if (!currentManualPointStudent) {
    showAcademyToast('선택된 학생이 없습니다.');
    return;
  }

  var delta = parseInt(currentManualPointDelta, 10);
  if (isNaN(delta) || delta === 0) {
    showAcademyToast('부여하거나 차감할 포인트를 -100pt ~ +100pt 사이로 입력해주세요.');
    return;
  }
  if (delta > 100 || delta < -100) {
    showAcademyToast('포인트는 한 번에 -100pt ~ +100pt까지 부여할 수 있습니다.');
    return;
  }

  var reasonInput = document.getElementById('manualPointReasonInput');
  var reason = reasonInput ? reasonInput.value.trim() : '';
  if (!reason) {
    reason = delta > 0 ? '학원 선생님 독서 칭찬 수동 포인트 부여' : '학원 관리자 수동 포인트 차감';
  }

  var curPoints = Number(currentManualPointStudent.points) || 0;
  var newPoints = Math.max(0, curPoints + delta);
  currentManualPointStudent.points = newPoints;

  // 스토리지에 학생 데이터 보존
  saveStudentsToStorage();

  // 포인트 변경 히스토리 로깅 (학생 및 학원 관리자 확인용)
  var manualEntryId = 'manual_' + Date.now();
  var targetStd = currentManualPointStudent;
  try {
    var rawLogs = localStorage.getItem('NANO_POINT_LOG_DATA');
    var logs = rawLogs ? JSON.parse(rawLogs) : [];
    var authorRole = isCurrentLoggedInTeacher() ? '담당선생님' : '학원장';
    var nowIso = new Date().toISOString();
    logs.unshift({
      id: manualEntryId,
      studentId: targetStd.id || targetStd.username,
      studentName: targetStd.name,
      amount: delta,
      pointType: delta > 0 ? 'MANUAL_GRANT' : 'MANUAL_DEDUCT',
      scope: 'ACADEMY_ONLY', // ★ 학원 내 랭킹 전용 (전국 랭킹 미반영)
      content: `[${authorRole} 수동 ${delta > 0 ? '부여' : '차감'}] ${reason} (${delta > 0 ? '+' : ''}${delta}P)`,
      date: nowIso.split('T')[0],
      createdAt: nowIso
    });
    localStorage.setItem('NANO_POINT_LOG_DATA', JSON.stringify(logs));
  } catch(e) {}

  // 운영 DB에도 수동 부여/차감 내역(PointHistory) 즉시 저장하여 월별·누적 랭킹 및 학생 포털 포인트 내역과 일관성 유지
  adminServerRankingCache = {};
  if (window.NanoPortal && NanoPortal.remote && typeof NanoPortal.saveManualPoint === 'function') {
    NanoPortal.saveManualPoint({
      memberId: targetStd.serverId || targetStd.username || targetStd.id,
      amount: delta,
      content: reason
    }, currentAcademyInfo && currentAcademyInfo.id).then(function(res) {
      if (res && typeof res.points === 'number') {
        targetStd.points = res.points;
        saveStudentsToStorage();
      }
      try {
        var stored = JSON.parse(localStorage.getItem('NANO_POINT_LOG_DATA') || '[]');
        stored.forEach(function(item) { if (item && item.id === manualEntryId) item.syncedToServer = true; });
        localStorage.setItem('NANO_POINT_LOG_DATA', JSON.stringify(stored));
      } catch (_) {}
      adminServerRankingCache = {};
      refreshAdminServerRankings();
    }).catch(function(err) {
      showAcademyToast((err && err.message) || '서버 포인트 저장 중 오류가 발생했습니다.');
    });
  }

  // 랭킹 뷰 즉시 새로고침
  renderAdminRankingView();

  // 모달 닫기
  $('#modalManualPointAdjustment').modal('hide');

  // 완료 토스트 안내
  var actionVerb = delta > 0 ? '부여되었습니다.' : '차감되었습니다.';
  showAcademyToast(`[${currentManualPointStudent.name}] 학생에게 ${delta > 0 ? '+' : ''}${delta}P가 성공적으로 ${actionVerb}`);
}

// 검색 버튼 클릭 또는 Enter 시 실행
function executeAdminRankingSearch() {
  var pSel = document.getElementById('adminRankPeriodSelect');
  if (pSel) adminRankPeriod = pSel.value;
  var cSel = document.getElementById('adminRankClassSelect');
  if (cSel) adminRankClass = cSel.value;
  var kwInput = document.getElementById('adminRankSearchInput');
  adminRankKeyword = kwInput ? kwInput.value.trim() : '';
  renderAdminRankingView();
}

// 랭킹 검색 초기화
function resetAdminRankingSearch() {
  var pSel = document.getElementById('adminRankPeriodSelect');
  var mOpts = getAdminRankMonthOptions();
  if (pSel && mOpts.length > 0) {
    pSel.value = mOpts[0].key;
    adminRankPeriod = mOpts[0].key;
  }
  var cSel = document.getElementById('adminRankClassSelect');
  if (cSel) {
    cSel.value = 'all';
    adminRankClass = 'all';
  }
  var kwInput = document.getElementById('adminRankSearchInput');
  if (kwInput) kwInput.value = '';
  adminRankKeyword = '';
  renderAdminRankingView();
}

// 기간 필터 전환 핸들러 (호환성 유지)
function switchAdminRankPeriod(period) {
  adminRankPeriod = period;
  renderAdminRankingView();
}

// 학급 필터 전환 핸들러 (호환성 유지)
function switchAdminRankClass(cls) {
  adminRankClass = cls;
  renderAdminRankingView();
}

// A4 포스터용 HTML 생성 렌더러 (동적 모드별 타이틀, 0P 제외, 3D 단상 리뉴얼, 직인 정리, 완벽 피팅)
function renderAdminRankingPoster(container) {
  if (!container) return;
  // 0포인트 회원은 랭킹 포스터에 절대 노출되지 않도록 엄격 필터링
  var list = getFilteredAdminRankingList().filter(function(item) {
    return Number(item.points) > 0;
  });

  var mode = adminRankMode || 'MONTH';
  var mainTitleText = '';
  var subTitleEn = '';
  var top1PedestalBadge = '🏆 이달의 독서왕';

  if (mode === 'ALL') {
    mainTitleText = '🏆 전체 누적 독서 명예의 전당 🏆';
    subTitleEn = 'ALL-TIME CUMULATIVE HALL OF FAME';
    top1PedestalBadge = '👑 명예의 다독왕';
  } else if (mode === 'RANGE') {
    var sInput = document.getElementById('adminRankStartDate');
    var eInput = document.getElementById('adminRankEndDate');
    var sVal = (sInput && sInput.value) ? sInput.value.replace(/-/g, '.') : '';
    var eVal = (eInput && eInput.value) ? eInput.value.replace(/-/g, '.') : '';
    var rangeText = (sVal && eVal) ? (sVal + ' ~ ' + eVal) : (sVal || eVal || '기간 지정');
    mainTitleText = '🏆 ' + rangeText + ' 독서 명예의 전당 🏆';
    subTitleEn = rangeText + ' SPECIAL HALL OF FAME';
    top1PedestalBadge = '🏆 기간 우수 독서왕';
  } else {
    // MONTH 모드
    var periodOptP = getAdminRankMonthOptions().find(function(m) { return m.key === adminRankPeriod; });
    var periodLabel = periodOptP ? periodOptP.short : adminRankPeriod;
    mainTitleText = '🏆 ' + periodLabel + ' 독서 명예의 전당 🏆';
    subTitleEn = periodLabel + ' MONTHLY HALL OF FAME';
    top1PedestalBadge = '🏆 이달의 독서왕';
  }

  var classLabel = adminRankClass === 'all' ? '원내 전체 명예의 전당' : (adminRankClass + ' 명예의 전당');
  var academyName = (currentAcademyInfo && currentAcademyInfo.name) ? currentAcademyInfo.name : '나노의 책장';
  var directorName = (currentAcademyInfo && currentAcademyInfo.director) ? String(currentAcademyInfo.director).replace(/\s*원장님?$/, '') : '';
  var today = new Date();
  var issueDateText = today.getFullYear() + '년 ' + String(today.getMonth() + 1).padStart(2, '0') + '월 ' + String(today.getDate()).padStart(2, '0') + '일';

  // 1, 2, 3위 데이터 (0포인트 회원은 제외됨)
  var top1 = list[0] || null;
  var top2 = list[1] || null;
  var top3 = list[2] || null;

  // 명예의 독서 리더 목록 (4위 이하 또는 1위부터 최대 7명 등재)
  var leaders = list.slice(0, 7);
  var leadersHtml = '';
  leaders.forEach(function(r) {
    leadersHtml += `
      <tr>
        <td class="text-center font-weight-bold" style="color: #475569; width: 48px;">${r.displayRank}위</td>
        <td style="width: 44px; text-align: center;">
          <div style="width: 28px; height: 28px; border-radius: 50%; background: #f8fafc; border: 1px solid #cbd5e1; display: inline-flex; align-items: center; justify-content: center;">
            ${getCharacterSvg(r.charId, 28, r.stage || 1)}
          </div>
        </td>
        <td><strong style="color: #0f172a; font-size: 12px;">${r.name}</strong></td>
        <td class="text-center" style="color: #64748b; font-size: 11px;">${r.grade}</td>
        <td class="text-center font-weight-bold" style="color: #1e293b; font-size: 11px;">${r.books}권</td>
        <td class="text-center font-weight-bold text-success" style="font-size: 11px;">${r.quizRate}</td>
        <td class="text-right font-weight-bold" style="color: #b45309; font-size: 12px; padding-right: 12px;">${r.points.toLocaleString()} P</td>
        <td class="text-center" style="font-size: 10.5px; font-weight: 700; color: #b45309;">${r.badge}</td>
      </tr>
    `;
  });

  // 1위 카드 HTML
  var top1Html = top1 ? `
    <div class="podium-avatar-box mb-2" style="position: relative;">
      <!-- 아바타 머리 위 정중앙에 왕관 배치 (캐릭터 뒤에 숨겨지지 않도록 높은 z-index 부여) -->
      <div style="position: absolute; top: -25px; left: 50%; transform: translateX(-50%); font-size: 26px; z-index: 25; filter: drop-shadow(0 2px 6px rgba(245, 158, 11, 0.6)); pointer-events: none;">👑</div>
      <div class="podium-char-avatar" style="width: 72px; height: 72px; background: #fffdf5; border: 3px solid #f59e0b; border-radius: 50%; box-shadow: 0 0 16px rgba(245, 158, 11, 0.35); display: flex; align-items: center; justify-content: center; margin: 0 auto;">
        ${getCharacterSvg(top1.charId, 70, top1.stage || 1)}
      </div>
    </div>
    <div style="font-size: 16px; font-weight: 900; color: #78350f; letter-spacing: -0.3px;">${top1.name}</div>
    <div style="font-size: 11.5px; color: #92400e; font-weight: 700;">${top1.grade}</div>
    <div style="font-size: 11.5px; font-weight: 900; color: #b45309; margin-bottom: 5px;">완독 ${top1.books}권 · ${top1.points.toLocaleString()}P</div>
    <!-- 1위 프리미엄 3D 골드 단상 -->
    <div class="podium-pedestal" style="height: 94px; background: linear-gradient(180deg, #fef3c7 0%, #fde68a 35%, #f59e0b 100%); border: 2px solid #d97706; box-shadow: 0 6px 16px rgba(217, 119, 6, 0.25); border-radius: 12px 12px 0 0; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #78350f;">
      <div style="font-size: 32px; font-weight: 900; line-height: 1; text-shadow: 0 1px 2px rgba(255,255,255,0.8);">1</div>
      <div style="font-size: 11px; font-weight: 900; background: rgba(255,255,255,0.7); padding: 2px 10px; border-radius: 10px; margin-top: 3px; border: 1px solid rgba(217,119,6,0.3);">${top1PedestalBadge}</div>
    </div>
  ` : `
    <div class="podium-avatar-box mb-2" style="position: relative;">
      <div class="podium-char-avatar" style="width: 72px; height: 72px; background: #f8fafc; border: 2px dashed #cbd5e1; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto; color: #94a3b8; font-size: 20px;">
        <i class="fa-solid fa-user-plus"></i>
      </div>
    </div>
    <div style="font-size: 14px; font-weight: 800; color: #94a3b8;">도전 대기 중</div>
    <div style="font-size: 11px; color: #cbd5e1;">-</div>
    <div style="font-size: 11px; color: #cbd5e1; margin-bottom: 5px;">-</div>
    <div class="podium-pedestal" style="height: 94px; background: #f1f5f9; border: 1.5px dashed #cbd5e1; border-radius: 12px 12px 0 0; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #94a3b8;">
      <div style="font-size: 28px; font-weight: 900; line-height: 1;">1</div>
      <div style="font-size: 10.5px; font-weight: 700;">독서왕 도전</div>
    </div>
  `;

  // 2위 카드 HTML
  var top2Html = top2 ? `
    <div class="podium-avatar-box mb-2" style="position: relative;">
      <div class="podium-char-avatar" style="width: 58px; height: 58px; background: #f8fafc; border: 2.5px solid #94a3b8; border-radius: 50%; box-shadow: 0 0 12px rgba(148, 163, 184, 0.3); display: flex; align-items: center; justify-content: center; margin: 0 auto;">
        ${getCharacterSvg(top2.charId, 56, top2.stage || 1)}
      </div>
    </div>
    <div style="font-size: 14px; font-weight: 900; color: #1e293b; letter-spacing: -0.3px;">${top2.name}</div>
    <div style="font-size: 11px; color: #64748b; font-weight: 600;">${top2.grade}</div>
    <div style="font-size: 11px; font-weight: 800; color: #0284c7; margin-bottom: 5px;">완독 ${top2.books}권 · ${top2.points.toLocaleString()}P</div>
    <!-- 2위 프리미엄 3D 실버 단상 -->
    <div class="podium-pedestal" style="height: 72px; background: linear-gradient(180deg, #ffffff 0%, #f1f5f9 40%, #cbd5e1 100%); border: 1.5px solid #94a3b8; box-shadow: 0 4px 12px rgba(100, 116, 139, 0.15); border-radius: 12px 12px 0 0; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #334155;">
      <div style="font-size: 26px; font-weight: 900; line-height: 1;">2</div>
      <div style="font-size: 10.5px; font-weight: 800; background: rgba(255,255,255,0.7); padding: 2px 8px; border-radius: 8px; margin-top: 2px; border: 1px solid rgba(148,163,184,0.3);">🥈 2위 우수 리더</div>
    </div>
  ` : `
    <div class="podium-avatar-box mb-2" style="position: relative;">
      <div class="podium-char-avatar" style="width: 58px; height: 58px; background: #f8fafc; border: 1.5px dashed #cbd5e1; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto; color: #94a3b8; font-size: 18px;">
        <i class="fa-solid fa-user"></i>
      </div>
    </div>
    <div style="font-size: 13px; font-weight: 800; color: #94a3b8;">도전 대기 중</div>
    <div style="font-size: 10.5px; color: #cbd5e1;">-</div>
    <div style="font-size: 10.5px; color: #cbd5e1; margin-bottom: 5px;">-</div>
    <div class="podium-pedestal" style="height: 72px; background: #f8fafc; border: 1.5px dashed #cbd5e1; border-radius: 12px 12px 0 0; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #94a3b8;">
      <div style="font-size: 24px; font-weight: 900; line-height: 1;">2</div>
      <div style="font-size: 10px; font-weight: 700;">2위 도전</div>
    </div>
  `;

  // 3위 카드 HTML
  var top3Html = top3 ? `
    <div class="podium-avatar-box mb-2" style="position: relative;">
      <div class="podium-char-avatar" style="width: 54px; height: 54px; background: #fff7ed; border: 2.5px solid #ea580c; border-radius: 50%; box-shadow: 0 0 12px rgba(234, 88, 12, 0.25); display: flex; align-items: center; justify-content: center; margin: 0 auto;">
        ${getCharacterSvg(top3.charId, 52, top3.stage || 1)}
      </div>
    </div>
    <div style="font-size: 13.5px; font-weight: 900; color: #1e293b; letter-spacing: -0.3px;">${top3.name}</div>
    <div style="font-size: 11px; color: #64748b; font-weight: 600;">${top3.grade}</div>
    <div style="font-size: 11px; font-weight: 800; color: #c2410c; margin-bottom: 5px;">완독 ${top3.books}권 · ${top3.points.toLocaleString()}P</div>
    <!-- 3위 프리미엄 3D 브론즈 단상 -->
    <div class="podium-pedestal" style="height: 58px; background: linear-gradient(180deg, #fff7ed 0%, #ffedd5 40%, #fdba74 100%); border: 1.5px solid #ea580c; box-shadow: 0 4px 12px rgba(234, 88, 12, 0.15); border-radius: 12px 12px 0 0; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #7c2d12;">
      <div style="font-size: 22px; font-weight: 900; line-height: 1;">3</div>
      <div style="font-size: 10px; font-weight: 800; background: rgba(255,255,255,0.7); padding: 2px 7px; border-radius: 8px; margin-top: 2px; border: 1px solid rgba(234,88,12,0.3);">🥉 3위 우수 리더</div>
    </div>
  ` : `
    <div class="podium-avatar-box mb-2" style="position: relative;">
      <div class="podium-char-avatar" style="width: 54px; height: 54px; background: #f8fafc; border: 1.5px dashed #cbd5e1; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto; color: #94a3b8; font-size: 17px;">
        <i class="fa-solid fa-user"></i>
      </div>
    </div>
    <div style="font-size: 13px; font-weight: 800; color: #94a3b8;">도전 대기 중</div>
    <div style="font-size: 10.5px; color: #cbd5e1;">-</div>
    <div style="font-size: 10.5px; color: #cbd5e1; margin-bottom: 5px;">-</div>
    <div class="podium-pedestal" style="height: 58px; background: #f8fafc; border: 1.5px dashed #cbd5e1; border-radius: 12px 12px 0 0; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #94a3b8;">
      <div style="font-size: 20px; font-weight: 900; line-height: 1;">3</div>
      <div style="font-size: 9.5px; font-weight: 700;">3위 도전</div>
    </div>
  `;

  var html = `
    <div class="a4-poster-sheet">
      <!-- 4 모서리 골드 코너 장식 -->
      <div class="poster-corner-deco poster-corner-tl"></div>
      <div class="poster-corner-deco poster-corner-tr"></div>
      <div class="poster-corner-deco poster-corner-bl"></div>
      <div class="poster-corner-deco poster-corner-br"></div>

      <!-- 포스터 상단 헤더 -->
      <div>
        <div class="text-center" style="margin-bottom: 8px;">
          <div class="poster-header-badge" style="display: inline-flex; align-items: center; gap: 5px; background: #fef3c7; border: 1px solid #f59e0b; padding: 3px 12px; border-radius: 20px; font-size: 11px; font-weight: 800; color: #92400e; margin-bottom: 6px;">
            <i class="fa-solid fa-award"></i> ${academyName} 공식 인증 독서 리더
          </div>
          <div class="poster-main-title" style="font-size: 24px; font-weight: 900; color: #1e293b; letter-spacing: -0.5px; margin-bottom: 3px;">
            ${mainTitleText}
          </div>
          <div class="poster-sub-title" style="font-size: 12px; color: #64748b; font-weight: 700; line-height: 1.4;">
            ${subTitleEn} · ${classLabel}<br>
            <span style="font-size: 11px; color: #94a3b8; font-weight: 500;">"책 속에서 더 큰 세상을 만나고 스스로 꿈을 키워가는 자랑스러운 나노 리더"</span>
          </div>
        </div>

        <!-- TOP 3 리뉴얼 포디움 (숫자 뱃지 제거, 입체 단상 적용) -->
        <div class="poster-podium-stage" style="display: flex; align-items: flex-end; justify-content: center; gap: 14px; margin: 4px 0 12px; padding: 12px 10px 0;">
          <!-- 2위 (은빛) -->
          <div class="poster-podium-col rank-2" style="flex: 1; max-width: 130px; text-align: center;">
            ${top2Html}
          </div>

          <!-- 1위 (황금 챔피언) -->
          <div class="poster-podium-col rank-1" style="flex: 1.15; max-width: 155px; text-align: center;">
            ${top1Html}
          </div>

          <!-- 3위 (동빛) -->
          <div class="poster-podium-col rank-3" style="flex: 1; max-width: 130px; text-align: center;">
            ${top3Html}
          </div>
        </div>

        <!-- 명예의 독서 리더 명단 -->
        <div style="font-size: 11.5px; font-weight: 800; color: #475569; margin-bottom: 5px; display: flex; align-items: center; justify-content: space-between;">
          <span><i class="fa-solid fa-star text-warning mr-1"></i>명예의 독서 리더 순위 목록 (HONOR LEADERS)</span>
          <span style="font-size: 10.5px; color: #94a3b8;">포인트 획득 ${list.length}명 등재 (${classLabel})</span>
        </div>
        <table class="poster-leaders-table">
          <thead>
            <tr>
              <th style="width: 48px;">순위</th>
              <th style="width: 44px;">파트너</th>
              <th>성명</th>
              <th>학년 / 소속반</th>
              <th>완독 권수</th>
              <th>북퀴즈 정답률</th>
              <th style="text-align: right; padding-right: 12px;">누적 포인트</th>
              <th>수여 칭호</th>
            </tr>
          </thead>
          <tbody>
            ${leadersHtml || '<tr><td colspan="8" class="text-center py-3 text-muted" style="font-size: 11.5px;">포인트를 획득한 우수 리더 데이터가 없습니다.</td></tr>'}
          </tbody>
        </table>
      </div>

      <!-- 포스터 하단 축하문 & 공식 원장 서명란 (도장 제거, 품격 있는 텍스트) -->
      <div class="poster-footer" style="display: flex; align-items: center; justify-content: space-between; border-top: 1.5px dashed #cbd5e1; padding-top: 10px; margin-top: 8px;">
        <div style="max-width: 460px;">
          <div style="font-size: 11px; font-weight: 800; color: #0f172a; margin-bottom: 3px;">
            [ 축하 및 격려의 글 ]
          </div>
          <div style="font-size: 10.5px; color: #475569; line-height: 1.45;">
            스스로 책을 펼치고 지혜로운 독서 습관을 실천하여 명예의 전당에 오른 원생 여러분께 진심 어린 축하와 격려를 보냅니다. 앞으로도 더 넓은 세상을 향해 즐겁게 책과 동행하길 응원합니다.
          </div>
          <div style="font-size: 10.5px; font-weight: 700; color: #94a3b8; margin-top: 5px;">
            발행일자: ${issueDateText}
          </div>
        </div>

        <!-- 원장 공식 서명란 (도장 모양 완전 제거) -->
        <div style="text-align: right; padding-left: 16px; border-left: 1.5px solid #e2e8f0;">
          <div style="font-size: 10.5px; color: #64748b; font-weight: 700; margin-bottom: 2px;">
            <i class="fa-solid fa-award text-warning mr-1"></i>${academyName} 공식 인증
          </div>
          <div style="font-size: 16px; font-weight: 900; color: #0f172a; letter-spacing: -0.5px;">
            원 장 &nbsp; <span style="color: #1e293b;">${directorName || '나노원장'}</span>
          </div>
        </div>
      </div>
    </div>
  `;

  container.innerHTML = html;
}

// A4 포스터 미리보기 모달 열기
function openPosterPreviewModal() {
  var target = document.getElementById('posterPreviewTarget');
  if (target) {
    renderAdminRankingPoster(target);
  }
  $('#rankingPosterPreviewModal').modal('show');
}

// ------------------------------------------------------------------
// 공통 인쇄 헬퍼: 현재 페이지의 여러 @media print 규칙(body * { visibility:hidden } 등)이 서로 충돌해
// 인쇄 미리보기가 백지로 나오는 문제가 있어, 인쇄 대상만 복사한 숨김 iframe에서 인쇄한다.
// ------------------------------------------------------------------
function printHtmlInIsolatedFrame(innerHtml, bodyClass, title) {
  var frame = document.createElement('iframe');
  frame.setAttribute('aria-hidden', 'true');
  frame.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden;';
  document.body.appendChild(frame);

  var frameWin = frame.contentWindow;
  var frameDoc = frameWin.document;
  // 화면에 쓰이는 스타일(외부 CSS + 인라인 <style>)을 그대로 재사용해 디자인을 동일하게 유지
  var headStyles = Array.prototype.map.call(document.querySelectorAll('link[rel="stylesheet"], style'), function(node) { return node.outerHTML; }).join('\n');
  // 포트폴리오는 용지 여백 확보, 포스터는 A4 풀사이즈 정밀 피팅(여백 0)
  var pageRule = bodyClass === 'is-printing-portfolio'
    ? 'margin: 10mm 15mm 12mm !important; size: A4 portrait;'
    : (bodyClass === 'is-printing-poster' ? 'margin: 0 !important; size: A4 portrait;' : 'margin: 20px !important; size: auto;');
  var overrideCss = '@page { ' + pageRule + ' } @media print { @page { ' + pageRule + ' } html, body { height:auto !important; overflow:visible !important; background:#fff !important; margin:0 !important; padding:0 !important; -webkit-print-color-adjust:exact; print-color-adjust:exact; } body * { visibility:visible !important; } }';
  var removeFrame = function() { if (frame.parentNode) frame.parentNode.removeChild(frame); };
  var printStarted = false;
  var readinessTimer;
  var startPrint = async function() {
    if (printStarted) return;
    printStarted = true;
    clearTimeout(readinessTimer);
    try {
      // 고정 700ms 대기 대신 글꼴과 표지 디코딩을 기다려 첫 인쇄의 누락을 방지합니다.
      var assets = Array.prototype.map.call(frameDoc.images, function(img) {
        return typeof img.decode === 'function' ? img.decode().catch(function() {}) : Promise.resolve();
      });
      if (frameDoc.fonts) assets.push(frameDoc.fonts.ready);
      var assetTimer;
      await Promise.race([Promise.all(assets), new Promise(function(resolve) { assetTimer = setTimeout(resolve, 10000); })]);
      clearTimeout(assetTimer);
      frameWin.focus();
      frameWin.addEventListener('afterprint', removeFrame);
      frameWin.print();
    } catch (error) {
      removeFrame();
      showAcademyToast('인쇄를 시작하지 못했습니다: ' + error.message);
      return;
    }
    // afterprint를 지원하지 않는 브라우저 대비 안전 정리
    setTimeout(removeFrame, 120000);
  };
  frame.onload = startPrint;
  // 응답하지 않는 외부 이미지가 있어도 인쇄 동작 자체가 멈추지는 않습니다.
  readinessTimer = setTimeout(startPrint, 10000);
  frameDoc.open();
  frameDoc.write('<!DOCTYPE html><html lang="ko"><head><meta charset="utf-8"><base href="' + document.baseURI + '"><title>' + (title || '인쇄') + '</title>' +
    headStyles + '<style>' + overrideCss + '</style></head><body class="' + (bodyClass || '') + '">' + innerHtml + '</body></html>');
  frameDoc.close();
}

// A4 포스터 브라우저 인쇄 실행
function printRankingPoster() {
  var holder = document.createElement('div');
  renderAdminRankingPoster(holder);
  // 인쇄 전용 CSS(body.is-printing-poster #rankingPosterPrintArea)가 그대로 적용되도록 같은 id로 감싼다
  printHtmlInIsolatedFrame('<div id="rankingPosterPrintArea">' + holder.innerHTML + '</div>', 'is-printing-poster', '독서 명예의 전당 포스터');
}

// 모달 내에서 바로 인쇄 실행
function printRankingPosterFromModal() {
  $('#rankingPosterPreviewModal').modal('hide');
  setTimeout(function() {
    printRankingPoster();
  }, 400);
}

// 기존 함수와의 하위 호환성 유지
function renderAcademyRankingTable() {
  renderAdminRankingView();
}

// ==============================================================
// 8. 독서 포트폴리오 모듈 (목록 리스트 + 상세 리포트 + 4단계 생성 마법사)
// ==============================================================
// ==============================================================
// 8. 독서 포트폴리오 모듈 (목록 리스트 + 6대 섹션 자동 생성 리포트 + 듀얼 뷰포트)
// ==============================================================

var currentViewingPortfolioId = 'PF-2026-0901';
var currentPortfolioViewMode = 'a4'; // 'a4' 또는 'mobile'

// 학생별 포트폴리오 상세 및 도서/퀴즈 완료 이력 데이터셋
var portfolioDataMap = {
  'S1021': {
    name: '김민준',
    school: '나노초등학교 5학년',
    classGroup: '지혜반',
    teacher: '박선우 지도교사',
    level: '초등 심화 Lv 5',
    bookCount: 4,
    bookSub: '분기 완독 목표 100% 달성',
    quizAvg: 94.2,
    quizSub: '전체 응시 북퀴즈 1차 통과',
    sheetRate: 100,
    scores: [95, 90, 92, 94],
    genreDist: { '문학/성장': 50, '인문/철학': 25, '사회/과학': 25 },
    tags: ['#성장소설', '#인간관계', '#철학적사유', '#공감과소통', '#자아탐색'],
    books: [
      { cover: 'assets/covers/cover_1001.jpg', title: '어린 왕자', pub: '열린책들', date: '2026.09.07', score: '100점', sheet: '우수 완결', comment: '길들임의 의미와 책임감을 깊이 있게 해석함.' },
      { cover: 'assets/covers/cover_1002.jpg', title: '아몬드', pub: '창비', date: '2026.09.02', score: '90점', sheet: '우수 완결', comment: '타인의 감정에 공감하는 능력과 성장을 성찰함.' },
      { cover: 'assets/covers/cover_1004.jpg', title: '동물 농장', pub: '민음사', date: '2026.08.28', score: '92점', sheet: '우수 완결', comment: '우화에 담긴 사회적 규범과 자유의 소중함 파악.' },
      { cover: 'assets/covers/cover_1003.jpg', title: '자전거 도둑', pub: '다림', date: '2026.08.19', score: '95점', sheet: '우수 완결', comment: '도덕적 딜레마와 성숙한 태도에 대한 시각 표현.' }
    ],
    teacherNote: '민준 학생은 책 속 인물의 심리 변화를 섬세하게 포착하며 스스로 생각의 지평을 넓혀가는 모습이 매우 인상적입니다. 앞으로도 따뜻한 인문학적 감수성을 키워가길 응원합니다.'
  },
  'S1022': {
    name: '이서연',
    school: '한빛초등학교 4학년',
    classGroup: '탐구반',
    teacher: '박선우 지도교사',
    level: '초등 응용 Lv 4',
    bookCount: 3,
    bookSub: '계획된 도서 루틴 완독',
    quizAvg: 91.5,
    quizSub: '핵심 어휘 및 맥락 우수',
    sheetRate: 100,
    scores: [90, 92, 90, 94],
    genreDist: { '문학/동화': 40, '과학/환경': 35, '인문/교양': 25 },
    tags: ['#호기심탐구', '#자연생태', '#친구와우정', '#상상력', '#감정표현'],
    books: [
      { cover: 'assets/covers/cover_1003.jpg', title: '자전거 도둑', pub: '다림', date: '2026.09.05', score: '95점', sheet: '우수 완결', comment: '등장인물의 갈등 상황을 자신의 경험과 연결지어 성찰함.' },
      { cover: 'assets/covers/cover_1001.jpg', title: '어린 왕자', pub: '열린책들', date: '2026.08.30', score: '92점', sheet: '우수 완결', comment: '순수한 동심과 관계 맺기의 소중함을 아름답게 표현함.' },
      { cover: 'assets/covers/cover_1004.jpg', title: '동물 농장', pub: '민음사', date: '2026.08.21', score: '88점', sheet: '우수 완결', comment: '등장인물의 성격과 행동을 비교 분석하며 비판적 사고 발휘.' }
    ],
    teacherNote: '서연 학생은 책을 읽고 난 후 질문을 던지고 스스로 답을 찾아가는 탐구적 태도가 무척 뛰어납니다. 꾸준한 독서 습관이 돋보입니다.'
  },
  'S1023': {
    name: '박도윤',
    school: '나노초등학교 6학년',
    classGroup: '리더반',
    teacher: '최수진 지도교사',
    level: '초등 완성 Lv 6',
    bookCount: 4,
    bookSub: '심화 완독 도서 모두 완결',
    quizAvg: 97.0,
    quizSub: '고난도 문맥 추론 만점',
    sheetRate: 100,
    scores: [98, 96, 98, 96],
    genreDist: { '인문/사회': 45, '문학/고전': 35, '역사/사상': 20 },
    tags: ['#비판적사고', '#사회탐구', '#고전명작', '#논리적이해', '#리더십'],
    books: [
      { cover: 'assets/covers/cover_1002.jpg', title: '아몬드', pub: '창비', date: '2026.09.06', score: '98점', sheet: '우수 완결', comment: '감정 표현 불능증 주인공의 시선을 통해 타인의 마음에 깊이 접근함.' },
      { cover: 'assets/covers/cover_1004.jpg', title: '동물 농장', pub: '민음사', date: '2026.08.29', score: '96점', sheet: '우수 완결', comment: '권력과 대중의 심리를 명쾌하게 분석하여 비판적 시각을 드러냄.' },
      { cover: 'assets/covers/cover_1001.jpg', title: '어린 왕자', pub: '열린책들', date: '2026.08.15', score: '97점', sheet: '우수 완결', comment: '인간관계의 소중한 가치를 철학적으로 해석하여 깊이를 더함.' },
      { cover: 'assets/covers/cover_1003.jpg', title: '자전거 도둑', pub: '다림', date: '2026.08.02', score: '97점', sheet: '우수 완결', comment: '주인공 수남이의 정직함과 현대 사회의 단면을 통찰력 있게 짚어냄.' }
    ],
    teacherNote: '도윤 학생은 독서의 호흡이 깊고 행간의 의미를 꿰뚫어 보는 안목이 탁월합니다. 중등 진학 후에도 큰 자산이 될 것입니다.'
  },
  'S1026': {
    name: '이지우',
    school: '한빛초등학교 5학년',
    classGroup: '지혜반',
    teacher: '박선우 지도교사',
    level: '초등 심화 Lv 5',
    bookCount: 3,
    bookSub: '정기 북퀴즈 100% 통과',
    quizAvg: 95.8,
    quizSub: '줄거리 재구성 및 어휘 우수',
    sheetRate: 100,
    scores: [96, 94, 96, 97],
    genreDist: { '문학/감성': 45, '인문/철학': 35, '과학/환경': 20 },
    tags: ['#감성독서', '#인물공감', '#철학동화', '#가치탐구', '#창의적표현'],
    books: [
      { cover: 'assets/covers/cover_1001.jpg', title: '어린 왕자', pub: '열린책들', date: '2026.09.06', score: '98점', sheet: '우수 완결', comment: '눈에 보이지 않는 진정한 가치에 대해 깊이 사색함.' },
      { cover: 'assets/covers/cover_1002.jpg', title: '아몬드', pub: '창비', date: '2026.08.27', score: '94점', sheet: '우수 완결', comment: '타인을 이해하려는 진심 어린 노력에 공감하며 글 작성.' },
      { cover: 'assets/covers/cover_1003.jpg', title: '자전거 도둑', pub: '다림', date: '2026.08.18', score: '96점', sheet: '우수 완결', comment: '올바른 양심과 도덕적 가치관에 대한 뚜렷한 소신 전개.' }
    ],
    teacherNote: '지우 학생은 매주 도서를 완독하고 퀴즈를 완료하는 성실함이 돋보이며, 문장 표현력이 갈수록 풍성해지고 있습니다.'
  }
};

// 발급된 포트폴리오 목록 데이터셋
// 상태 규칙: 발송 완료(카톡 발송 완료 시) vs 카톡 발송하기(발송 전 시 버튼)
var portfolioList = [
  {
    id: 'PF-2026-0901',
    studentId: 'S1021',
    studentName: '김민준',
    school: '나노초등학교',
    grade: '초등 5학년',
    classGroup: '지혜반',
    title: '2026년 3분기 독서 포트폴리오',
    period: '2026년 3분기 (7~9월)',
    bookCount: 4,
    booksSummary: '어린 왕자, 아몬드 외 2권',
    quizAvg: '94.2점',
    issueDate: '2026.09.08 14:20',
    status: '발송 완료',
    kakaoSent: true
  },
  {
    id: 'PF-2026-0902',
    studentId: 'S1023',
    studentName: '박도윤',
    school: '나노초등학교',
    grade: '초등 6학년',
    classGroup: '리더반',
    title: '2026년 3분기 독서 심화 포트폴리오',
    period: '2026년 3분기 (7~9월)',
    bookCount: 4,
    booksSummary: '아몬드, 동물 농장 외 2권',
    quizAvg: '97.0점',
    issueDate: '2026.09.08 15:10',
    status: '카톡 발송하기',
    kakaoSent: false
  },
  {
    id: 'PF-2026-0815',
    studentId: 'S1026',
    studentName: '이지우',
    school: '한빛초등학교',
    grade: '초등 5학년',
    classGroup: '지혜반',
    title: '2026년 8월호 독서 포트폴리오',
    period: '2026년 8월 월호',
    bookCount: 3,
    booksSummary: '어린 왕자, 아몬드, 자전거 도둑',
    quizAvg: '95.8점',
    issueDate: '2026.08.31 16:00',
    status: '발송 완료',
    kakaoSent: true
  },
  {
    id: 'PF-2026-0810',
    studentId: 'S1022',
    studentName: '이서연',
    school: '한빛초등학교',
    grade: '초등 4학년',
    classGroup: '탐구반',
    title: '2026년 8월호 성장 독서 포트폴리오',
    period: '2026년 8월 월호',
    bookCount: 3,
    booksSummary: '자전거 도둑, 어린 왕자 외 1권',
    quizAvg: '91.5점',
    issueDate: '2026.08.28 11:30',
    status: '카톡 발송하기',
    kakaoSent: false
  }
];

var lastCreatedPortfolioId = null;

// ==============================================================
// 포트폴리오 목록 테이블 렌더링
// 1. 상태 컬럼: '발송 완료' (녹색 뱃지) / '카톡 발송하기' (노란색 액션 버튼)
// ==============================================================
function renderPortfolioTable(list) {
  var tbody = document.getElementById('portfolioListTableBody');
  if (!tbody) return;
  tbody.innerHTML = '';

  var dataList = list || portfolioList;

  // 상단 통계 카드 3종 (실제 데이터 연동: 이번달 생성 건수, 누적 발급 건수, 알림톡 발송률)
  var thisMonthCountEl = document.getElementById('pfMonthIssuedCount') || document.getElementById('pfThisMonthCount');
  var thisMonthSubEl = document.getElementById('pfMonthIssuedSub');
  var totalIssuedCountEl = document.getElementById('pfTotalIssuedCount');
  var totalIssuedSubEl = document.getElementById('pfTotalIssuedSub');
  var kakaoRateEl = document.getElementById('pfKakaoSentRate');
  var kakaoSubEl = document.getElementById('pfKakaoSentSub');

  var listToCalc = Array.isArray(portfolioList) ? portfolioList : [];
  var totalCount = listToCalc.length;

  // 1. 이번달 포트폴리오 생성 건수 계산
  var now = new Date();
  var curYear = now.getFullYear();
  var curMonth = now.getMonth() + 1;
  var ymDot = curYear + '.' + (curMonth < 10 ? '0' + curMonth : curMonth);
  var ymDash = curYear + '-' + (curMonth < 10 ? '0' + curMonth : curMonth);

  var thisMonthCount = listToCalc.filter(function(p) {
    var d = String(p.issueDate || p.createdAt || p.date || '');
    return d.indexOf(ymDot) !== -1 || d.indexOf(ymDash) !== -1;
  }).length;

  if (thisMonthCountEl) thisMonthCountEl.innerText = thisMonthCount;
  if (thisMonthSubEl) {
    if (thisMonthCount > 0) {
      thisMonthSubEl.innerText = curMonth + '월 신규 생성 및 발급 리포트 (' + thisMonthCount + '건)';
    } else {
      thisMonthSubEl.innerText = curMonth + '월 생성 내역 없음 (0건)';
    }
  }

  // 2. 누적 발급 포트폴리오 건수
  if (totalIssuedCountEl) totalIssuedCountEl.innerText = totalCount;
  if (totalIssuedSubEl) {
    if (totalCount > 0) {
      totalIssuedSubEl.innerText = '원내 누적 포트폴리오 ' + totalCount + '건 통합 관리 중';
    } else {
      totalIssuedSubEl.innerText = '발급된 누적 포트폴리오 없음 (0건)';
    }
  }

  // 3. 학부모 알림톡 발송률 및 발송 건수
  var kakaoSentCount = listToCalc.filter(function(p) {
    return p.kakaoSent === true || p.status === '발송 완료';
  }).length;

  var kakaoRate = totalCount > 0 ? Math.round((kakaoSentCount / totalCount) * 100) : 0;
  if (kakaoRateEl) kakaoRateEl.innerText = kakaoRate;
  if (kakaoSubEl) {
    if (totalCount === 0) {
      kakaoSubEl.innerText = '0건 발송 완료 (발송 대상 없음)';
    } else if (kakaoSentCount === totalCount) {
      kakaoSubEl.innerText = kakaoSentCount + '건 전원 발송 완료 (100%)';
    } else {
      kakaoSubEl.innerText = kakaoSentCount + '건 발송 완료 (미발송 ' + (totalCount - kakaoSentCount) + '건)';
    }
  }

  if (dataList.length === 0) {
    tbody.innerHTML = '<tr><td colspan="10" class="text-center py-5 text-muted">일치하는 독서 포트폴리오가 없습니다.</td></tr>';
    return;
  }

  var totalLen = dataList.length;

  dataList.forEach(function(pf, idx) {
    var tr = document.createElement('tr');
    if (pf.id === lastCreatedPortfolioId) {
      tr.className = 'row-highlight-new';
    }

    var rowNo = totalLen - idx;
    var displayIssueDate = pf.issueDate || '2026.09.08 14:00';

    // 1. 상태 부분: 발송 완료(카톡 발송 완료 시) vs 카톡 발송하기(발송 전 시 버튼)
    var statusCellHtml = '';
    if (pf.kakaoSent === true) {
      statusCellHtml = '<span class="badge-soft badge-soft-success font-weight-bold" style="font-size:12px; padding:4px 10px; border-radius:6px;"><i class="fa-solid fa-check mr-1"></i>발송 완료</span>';
    } else {
      statusCellHtml = '<button type="button" class="btn btn-xs font-weight-bold" onclick="sendPortfolioKakaoDirect(\'' + pf.id + '\', event)" ' +
        'style="background-color:#FEE500; color:#3C1E1E; border:1px solid #ebd000; border-radius:6px; font-size:11.5px; padding:3px 10px; box-shadow:0 1px 3px rgba(0,0,0,0.08); cursor:pointer;">' +
        '<i class="fa-solid fa-comment mr-1"></i>카톡 발송하기' +
        '</button>';
    }

    tr.innerHTML = 
      '<td class="text-center"><span class="font-weight-bold" style="font-size:12.5px; color:var(--text-main);">' + rowNo + '</span></td>' +
      '<td>' +
        '<strong style="font-size:13.5px; color:var(--text-main); cursor:pointer; text-decoration:underline;" onclick="viewPortfolioDetail(\'' + pf.studentId + '\', \'' + pf.id + '\')">' + pf.studentName + '</strong>' +
        (pf.id === lastCreatedPortfolioId ? ' <span class="badge badge-warning text-dark ml-1" style="font-size:10px;">신규</span>' : '') +
      '</td>' +
      '<td class="text-center"><small class="text-muted">' + (pf.school || '초등학교') + ' ' + (pf.grade || '') + '</small></td>' +
      '<td class="text-center"><span class="badge-soft badge-soft-neutral">' + pf.classGroup + '</span></td>' +
      '<td>' +
        '<div class="font-weight-bold" style="font-size:13px; color:var(--text-main); cursor:pointer;" onclick="viewPortfolioDetail(\'' + pf.studentId + '\', \'' + pf.id + '\')">' + pf.title + '</div>' +
        '<small class="text-muted">' + (pf.period || '') + '</small>' +
      '</td>' +
      '<td>' +
        '<span class="font-weight-bold text-dark">' + pf.bookCount + '권</span> ' +
        '<small class="text-muted">(' + pf.booksSummary + ')</small>' +
      '</td>' +
      '<td class="text-center text-success font-weight-bold">' + (pf.quizAvg != null && !isNaN(parseFloat(String(pf.quizAvg))) ? Math.round(parseFloat(String(pf.quizAvg))) + '점' : (pf.quizAvg || '-')) + '</td>' +
      '<td class="text-center text-muted" style="font-size:12px; white-space:nowrap;">' + displayIssueDate + '</td>' +
      '<td class="text-center" style="white-space:nowrap;">' + statusCellHtml + '</td>' +
      '<td class="text-center" style="white-space:nowrap;">' +
        '<button class="btn btn-xs btn-beige-primary mr-1" onclick="viewPortfolioDetail(\'' + pf.studentId + '\', \'' + pf.id + '\')" style="border-radius:6px; font-size:11.5px; padding:3px 9px;">상세 보기</button>' +
        '<button class="btn btn-xs btn-outline-secondary" onclick="printSinglePortfolio(\'' + pf.studentId + '\', \'' + pf.id + '\')" style="border-radius:6px; font-size:11.5px; padding:3px 8px;" title="리포트 인쇄"><i class="fa-solid fa-print"></i></button>' +
      '</td>';

    tbody.appendChild(tr);
  });
}

// 카카오톡 알림톡 즉시 발송 함수
async function sendPortfolioKakaoDirect(pfId, event) {
  if (event) {
    event.stopPropagation();
    event.preventDefault();
  }
  var pf = portfolioList.find(function(p) { return p.id === pfId; });
  if (!pf) return;

  var button = event && event.currentTarget;
  if (button) button.disabled = true;

  try {
    if (window.NanoPortal && NanoPortal.remote) {
      var preview = await NanoPortal.api('/api/services', { type: 'portfolio', action: 'preview', pfId: pfId });
      var confirmMsg = '[독서 포트폴리오 알림톡 발송 미리보기]\n\n' +
        '받는 분: ' + preview.name + ' (' + preview.recipient + ')\n\n' +
        preview.message + '\n\n' +
        '연결 링크: ' + preview.targetUrl + '\n\n' +
        '학부모님께 이 내용으로 알림톡을 발송하시겠습니까?';
      if (!confirm(confirmMsg)) return;

      var result = await NanoPortal.api('/api/services', { type: 'portfolio', action: 'send', pfId: pfId, fingerprint: preview.fingerprint });
      if (result.status !== 'ACCEPTED' && result.status !== 'SENDING') {
        throw new Error('알림톡 발송 상태: ' + result.status);
      }
    }

    pf.kakaoSent = true;
    pf.status = '발송 완료';

    var now = new Date();
    var month = ('0' + (now.getMonth() + 1)).slice(-2);
    var day = ('0' + now.getDate()).slice(-2);
    var hours = ('0' + now.getHours()).slice(-2);
    var mins = ('0' + now.getMinutes()).slice(-2);
    pf.issueDate = now.getFullYear() + '.' + month + '.' + day + ' ' + hours + ':' + mins;

    renderPortfolioTable();
    updatePortfolioDetailKakaoButton(pf.id);

    showAcademyToast('🎉 [' + pf.studentName + '] 학부모님께 포트폴리오 카카오톡 알림톡이 성공적으로 발송되었습니다!');
  } catch(e) {
    showAcademyToast('알림톡 발송 실패: ' + e.message);
  } finally {
    if (button) button.disabled = false;
  }
}

// 상세 페이지 상단의 카톡 액션 버튼 업데이트
function updatePortfolioDetailKakaoButton(pfId) {
  var container = document.getElementById('pfDetailKakaoActionContainer');
  if (!container) return;
  var pf = portfolioList.find(function(p) { return p.id === pfId; });
  if (!pf) return;

  if (pf.kakaoSent) {
    container.innerHTML = 
      '<span class="badge-soft badge-soft-success font-weight-bold mr-2" style="font-size:12.5px; padding:6px 12px; border-radius:8px;">' +
      '<i class="fa-solid fa-check mr-1"></i>카톡 발송 완료' +
      '</span>';
  } else {
    container.innerHTML = 
      '<button type="button" class="btn btn-sm font-weight-bold mr-2" onclick="sendPortfolioKakaoDirect(\'' + pf.id + '\', event)" ' +
      'style="background-color:#FEE500; color:#3C1E1E; border:1px solid #ebd000; border-radius:8px; font-size:12.5px; padding:6px 14px; box-shadow:0 1px 4px rgba(0,0,0,0.08);">' +
      '<i class="fa-solid fa-comment mr-1"></i>카톡 발송하기' +
      '</button>';
  }
}

// 포트폴리오 검색 입력 핸들러
function handlePortfolioSearchInput(input) {
  var clearBtn = document.getElementById("btnPortfolioSearchClear");
  if (clearBtn) {
    clearBtn.style.display = (input && input.value.trim().length > 0) ? "inline-flex" : "none";
  }
}

// 포트폴리오 검색어 원클릭 클리어
function clearPortfolioSearch() {
  var input = document.getElementById("searchPortfolioInput");
  if (input) input.value = "";
  var clearBtn = document.getElementById("btnPortfolioSearchClear");
  if (clearBtn) clearBtn.style.display = "none";
  var badgeEl = document.getElementById("portfolioSearchActiveBadge");
  if (badgeEl) { badgeEl.style.display = "none"; badgeEl.innerHTML = ""; }
  filterPortfolioList();
}

// 포트폴리오 목록 검색 및 필터링
function filterPortfolioList() {
  var classVal = document.getElementById('filterPortfolioClass') ? document.getElementById('filterPortfolioClass').value : 'ALL';
  var query = (document.getElementById('searchPortfolioInput') ? document.getElementById('searchPortfolioInput').value : '').toLowerCase().trim();

  // ✕ 버튼 상태 동기화
  var clearBtn = document.getElementById("btnPortfolioSearchClear");
  if (clearBtn) clearBtn.style.display = query.length > 0 ? "inline-flex" : "none";

  var filtered = portfolioList.filter(function(pf) {
    var matchClass = (classVal === 'ALL') || (pf.classGroup.indexOf(classVal) !== -1);
    var matchQuery = !query || 
      pf.studentName.toLowerCase().indexOf(query) !== -1 || 
      pf.id.toLowerCase().indexOf(query) !== -1 || 
      pf.title.toLowerCase().indexOf(query) !== -1 ||
      pf.studentId.toLowerCase().indexOf(query) !== -1;
    return matchClass && matchQuery;
  });

  // 활성 검색 배지 상태 동기화
  var badgeEl = document.getElementById("portfolioSearchActiveBadge");
  if (badgeEl) {
    if (query) {
      badgeEl.style.display = "block";
      var displayQ = query.length > 25 ? query.substring(0, 25) + '...' : query;
      badgeEl.innerHTML = '<span class="badge-search-active"><i class="fa-solid fa-magnifying-glass mr-1"></i>"' + displayQ + '" 검색 결과 ' + filtered.length.toLocaleString() + '건 <span class="badge-clear-link" onclick="clearPortfolioSearch()" title="검색 필터 해제">✕ 검색 해제</span></span>';
    } else {
      badgeEl.style.display = "none";
      badgeEl.innerHTML = "";
    }
  }

  renderPortfolioTable(filtered);
}

// 포트폴리오 화면 전환: 목록 뷰
function showPortfolioList() {
  var listEl = document.getElementById('portfolio-sub-list');
  var detailEl = document.getElementById('portfolio-sub-detail');
  if (listEl) listEl.style.display = 'block';
  if (detailEl) detailEl.style.display = 'none';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ==============================================================
// 5대 분석 축 기반 정성 코멘트 자동 생성 엔진
// 1. 다양성, 2. 난이도, 3. 습관, 4. 몰입, 5. 이해도 정합성
// 규칙: 3~4개 코멘트, 각 40~70자, 2문장 이내, 독서량 감소 언급 금지, 타인 비교 금지
// ==============================================================
// 5대 분석 축 기반 정성 코멘트 자동 생성 엔진
// 4대 핵심 역량 (문해력, 정서/공감, 비판적사고, 독서태도)
// ==============================================================
function generatePortfolioInsights(student, pfData) {
  if (Array.isArray(pfData.aiInsights) && pfData.aiInsights.length >= 4) {
    return pfData.aiInsights.slice(0, 4);
  }
  if (Array.isArray(pfData.aiComments) && pfData.aiComments.length >= 4) {
    return pfData.aiComments.slice(0, 4);
  }
  
  // 지능형 스마트 기본 4대 역량 코멘트 (학생 완독 도서 데이터 기반)
  var books = (pfData && pfData.books) || [];
  var firstTitle = (books[0] && books[0].title) ? ('《' + books[0].title + '》') : '지정 도서';
  var rawAvg = Number(pfData && pfData.quizAvg) || 85;
  
  return [
    {
      category: '문해력 & 중심 맥락 파악',
      icon: 'fa-solid fa-lightbulb',
      color: '#1f8a7e',
      comment: firstTitle + ' 등 다양한 작품에서 인물의 선택과 배경 맥락을 정밀하게 읽어내는 뛰어난 문해력을 발휘했습니다.'
    },
    {
      category: '공감 능력 & 정서적 사유',
      icon: 'fa-solid fa-heart',
      color: '#e67828',
      comment: '이야기 속 인물들의 갈등과 내면적 성장에 깊이 몰입하며 타인의 감정에 공감하는 따뜻한 인문학적 시선을 형성하고 있습니다.'
    },
    {
      category: '비판적 사고 & 문제 해결력',
      icon: 'fa-solid fa-scale-balanced',
      color: '#3b82f6',
      comment: '북퀴즈 평균 ' + Math.round(rawAvg) + '점을 기록하며 사건의 인과관계를 논리적으로 분석하고 자신의 관점으로 재해석하는 역량이 돋보입니다.'
    },
    {
      category: '자기표현 & 능동적 독서 태도',
      icon: 'fa-solid fa-seedling',
      color: '#10b981',
      comment: '정해진 독서 목표를 꾸준히 달성하며 자신의 생각과 느낌을 주도적으로 정리하는 올바른 독서 습관을 확립했습니다.'
    }
  ];
}

// 스마트 룰베이스 폴백 엔진 (AI 미등록 또는 네트워크 실패 시 완벽 대체)
function applySmartPortfolioDefaults(pfData, std) {
  if (!pfData) return;
  var books = pfData.books || [];
  var stdName = pfData.name || (std ? std.name : '원생');
  
  // 1. 도서별 성취 내역 보강
  books.forEach(function(b, idx) {
    var rawScore = parseFloat(String(b.score || '80').replace(/[^0-9.]/g, ''));
    if (isNaN(rawScore)) rawScore = 80;
    
    var needUpdate = !b.achievement || 
                     b.achievement.indexOf('생성 전입니다') !== -1 || 
                     b.achievement.indexOf('AI 성취') !== -1 ||
                     b.achievement.trim().length < 15;
    if (needUpdate) {
      var title = b.title || '완독 도서';
      if (rawScore >= 95) {
        b.achievement = '《' + title + '》의 중심 서사와 핵심 주제 의식을 완벽하게 파악하였으며, 인물의 내면적 동기와 갈등 구조를 입체적으로 분석하는 탁월한 이해도를 보였습니다.';
      } else if (rawScore >= 80) {
        b.achievement = '《' + title + '》의 주요 사건 전개와 핵심 어휘를 바르게 이해하였으며, 등장인물의 감정선에 공감하며 북퀴즈를 성실하고 우수하게 완수했습니다.';
      } else {
        b.achievement = '《' + title + '》의 전반적인 줄거리와 기본 배경 지식을 습득하였으며, 텍스트를 끝까지 완독하고 능동적으로 사유를 확장하는 끈기 있는 태도를 보였습니다.';
      }
    }
  });

  // 2. 지도교사 총평 보강
  var needTeacherNoteUpdate = !pfData.teacherNote || 
                              pfData.teacherNote.indexOf('생성합니다') !== -1 || 
                              pfData.teacherNote.indexOf('AI 총평') !== -1 ||
                              pfData.teacherNote.trim().length < 25;
  if (needTeacherNoteUpdate) {
    var bookCount = books.length;
    var avgScore = Math.round(Number(pfData.quizAvg) || 85);
    pfData.teacherNote = stdName + ' 학생은 이번 분석 기간 동안 총 ' + bookCount + '권의 목표 도서를 성실하게 완독하며 북퀴즈 평균 ' + avgScore + '점의 높은 성취도를 달성했습니다. ' +
      '문학적 감수성과 논리적 사고력을 균형 있게 키워가고 있으며, 책 속 다양한 인물들의 갈등과 성장을 통해 자신의 생각과 삶을 돌아보는 인문학적 깊이가 날로 깊어지고 있습니다. ' +
      '앞으로도 다양한 테마의 도서를 탐구하며 깊이 있는 문해력과 창의적 표현력을 꽃피울 수 있도록 세심하고 따뜻한 지도를 이어가겠습니다.';
  }

  // 3. 4대 역량 코멘트 설정
  if (!pfData.aiInsights || pfData.aiInsights.length < 4) {
    pfData.aiInsights = generatePortfolioInsights(std, pfData);
  }
  pfData.aiVersion = 1;
}

// 클라이언트 사이드 Google Gemini API 직접 호출 엔진 (마스터 등록 API Key 활용)
async function generatePortfolioWithGeminiClient(studentId, pfId, pfData, std) {
  var apiKey = localStorage.getItem('NANO_GEMINI_API_KEY') || '';
  if (!apiKey) {
    var masterInput = document.getElementById('masterGeminiApiKey');
    if (masterInput && masterInput.value) apiKey = masterInput.value.trim();
  }
  
  if (!apiKey) {
    applySmartPortfolioDefaults(pfData, std);
    return;
  }

  var rawModel = localStorage.getItem('NANO_GEMINI_MODEL') || 'gemini-3.8-flash';
  var model = rawModel;
  var mLower = rawModel.toLowerCase();
  if (mLower.includes('3.8')) model = 'gemini-3.8-flash';
  else if (mLower.includes('3.5')) model = 'gemini-3.5-pro';
  else if (mLower.includes('3.0-flash-lite')) model = 'gemini-3.0-flash-lite';
  else if (mLower.includes('3.0')) model = 'gemini-3.0-flash';
  else if (mLower.includes('pro')) model = 'gemini-1.5-pro';
  else if (mLower.includes('flash-lite')) model = 'gemini-2.0-flash-lite-preview-02-05';
  else if (mLower.includes('1.5-flash')) model = 'gemini-1.5-flash';
  else if (mLower.includes('2.0')) model = 'gemini-2.0-flash';
  else if (!model.startsWith('gemini-')) model = 'gemini-3.8-flash';

  var books = pfData.books || [];
  var bookSummary = books.map(function(b, i) {
    return (i + 1) + '. 제목: ' + (b.title || '') + ', 저자: ' + (b.author || '') + ', 점수: ' + (b.score || '80점');
  }).join('\n');

  var prompt = 
    '당신은 대한민국 최고 수준의 독서 논술 교육 전문 연구원입니다. 학생의 독서 포트폴리오를 위한 맞춤 분석 리포트를 작성해 주세요.\n\n' +
    '학생명: ' + (pfData.name || (std ? std.name : '원생')) + '\n' +
    '완독 도서 목록:\n' + bookSummary + '\n\n' +
    '반드시 아래 JSON 형식으로만 응답해 주세요 (코드블록 없이 순수 JSON):\n' +
    '{\n' +
    '  "aiInsights": [\n' +
    '    { "category": "문해력 & 중심 맥락 파악", "icon": "fa-solid fa-lightbulb", "color": "#1f8a7e", "comment": "도서들의 중심 서사와 인물의 선택을 정밀하게 파악함 (50~70자)" },\n' +
    '    { "category": "공감 능력 & 정서적 사유", "icon": "fa-solid fa-heart", "color": "#e67828", "comment": "작품 속 인물의 갈등에 깊이 공감하고 정서적 통찰을 얻음 (50~70자)" },\n' +
    '    { "category": "비판적 사고 & 문제 해결력", "icon": "fa-solid fa-scale-balanced", "color": "#3b82f6", "comment": "북퀴즈를 통해 인과관계를 논리적으로 분석하고 재해석함 (50~70자)" },\n' +
    '    { "category": "자기표현 & 능동적 독서 태도", "icon": "fa-solid fa-seedling", "color": "#10b981", "comment": "정해진 목표를 꾸준히 완독하며 자기주도적 독서 습관 형성 (50~70자)" }\n' +
    '  ],\n' +
    '  "bookAchievements": [\n' +
    '    "도서 1에 대한 핵심 성취 내역 (60~90자)",\n' +
    '    "도서 2에 대한 핵심 성취 내역 (60~90자)"\n' +
    '  ],\n' +
    '  "teacherNote": "학부모에게 전달할 지도교사 종합 총평 (150~220자)"\n' +
    '}';

  try {
    var endpoint = 'https://generativelanguage.googleapis.com/v1beta/models/' + encodeURIComponent(model) + ':generateContent?key=' + encodeURIComponent(apiKey);
    var resp = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1400
        }
      })
    });

    if (!resp.ok) {
      var errJson = await resp.json().catch(function(){ return {}; });
      throw new Error((errJson.error && errJson.error.message) || ('Gemini API 호출 실패 (' + resp.status + ')'));
    }

    var data = await resp.json();
    var text = (((data.candidates || [])[0] || {}).content || {}).parts?.[0]?.text || '';
    var cleaned = text.split(tripleBacktick + 'json').join('').split(tripleBacktick).join('').trim();
    var parsed = JSON.parse(cleaned);

    if (Array.isArray(parsed.aiInsights) && parsed.aiInsights.length >= 4) {
      pfData.aiInsights = parsed.aiInsights;
      pfData.aiComments = parsed.aiInsights.map(function(item) {
        return typeof item === 'string' ? item : (item.category + ': ' + item.comment);
      });
    }
    if (Array.isArray(parsed.bookAchievements)) {
      parsed.bookAchievements.forEach(function(ach, i) {
        if (books[i]) books[i].achievement = ach;
      });
    }
    if (parsed.teacherNote) {
      pfData.teacherNote = parsed.teacherNote;
    }
    pfData.aiVersion = 1;
  } catch (e) {
    console.warn('[Gemini Client] Failed to generate AI story, applying smart defaults:', e.message);
    applySmartPortfolioDefaults(pfData, std);
  }
}

// Gemini AI 비동기 코멘트 생성 요청 헬퍼
async function requestGeminiPortfolioStory(studentId, pfId, pfData, std) {
  if (!pfData || pfData.aiVersion === 1 || pfData._aiRequested) {
    if (pfData && (!pfData.teacherNote || pfData.teacherNote.indexOf('생성합니다') !== -1)) {
      applySmartPortfolioDefaults(pfData, std);
    }
    return;
  }
  pfData._aiRequested = true;
  pfData._aiPending = true;
  pfData._aiError = '';

  var success = false;
  // 1순위: 백엔드 서버 연동 시도
  if (window.NanoPortal && NanoPortal.remote && typeof NanoPortal.generatePortfolioAI === 'function') {
    try {
      await NanoPortal.generatePortfolioAI(pfId);
      if (typeof NanoPortal.refreshPortfolios === 'function') {
        await NanoPortal.refreshPortfolios();
      }
      success = true;
    } catch (err) {
      console.warn('[NanoPortal.generatePortfolioAI] Remote failed, trying client Gemini:', err.message);
    }
  }

  // 2순위: 백엔드 실패 또는 로컬 모드 시 클라이언트 직접 호출 및 스마트 룰베이스 폴백
  if (!success) {
    await generatePortfolioWithGeminiClient(studentId, pfId, pfData, std);
  }

  pfData._aiPending = false;
  if (currentViewingPortfolioId === pfId) {
    renderPortfolioDocument(studentId, pfId);
  }
}

function escapePortfolioText(value) {
  return String(value == null ? '' : value).replace(/[&<>"']/g, function(char) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char];
  });
}

function formatPortfolioSchoolGrade(value) {
  return String(value || '').replace(/(^|\s)(?:초등학교|초등|초|중학교|중등|중|고등학교|고등|고)\s*(?=\d\s*학년)/g, '$1').trim();
}

function formatPortfolioTeacher(value) {
  return String(value || '').replace(/\s*(?:지도\s*교사|담당\s*교사|지정\s*교사)\s*$/, '').trim() || '미지정';
}

// ==============================================================
// 7.1 포트폴리오 문서 렌더링 (A4 1페이지/2페이지 완벽 규격 분할)
// ==============================================================
function renderPortfolioDocument(studentId, pfId) {
  var docContainer = document.getElementById('portfolioPrintDoc');
  if (!docContainer) return;

  var pfData = (pfId && portfolioDataMap[pfId]) || portfolioDataMap[studentId] || portfolioDataMap['S1021'] || {};
  var pfMeta = portfolioList.find(function(p) { return p.id === pfId; }) || portfolioList[0] || {};
  var std = studentDataList.find(function(s) { return s.id === studentId; });

  var studentName = pfData.name || (std ? std.name : '김민준');
  var schoolGrade = pfData.school || ((std ? std.school : '나노초등학교') + ' ' + (std ? std.grade : '5학년'));
  schoolGrade = formatPortfolioSchoolGrade(schoolGrade);
  var classGroup = pfData.classGroup || (std ? std.classGroup : '지혜반');

  var teacher = '';
  if (std) {
    teacher = std.teacher || std.teacherName || '';
    if ((!teacher || teacher === '미지정' || teacher === '-') && std.classGroup && typeof academyClassList !== 'undefined') {
      var cls = academyClassList.find(function(c) { return c.name === std.classGroup; });
      if (cls && cls.teacher && cls.teacher !== '미지정' && cls.teacher !== '-') teacher = cls.teacher;
    }
  }
  if (!teacher) teacher = pfData.teacher || '';
  teacher = String(teacher || '').trim();

  if (!teacher || teacher === '미지정' || teacher === '-' || teacher === '미지정 지도교사' || teacher.indexOf('미지정') !== -1) {
    teacher = '미지정';
  } else {
    teacher = formatPortfolioTeacher(teacher);
  }

  var period = pfMeta.period || '2026년 3분기 (7~9월)';
  var periodHtml = escapePortfolioText(period).replace(/\d{4}-\d{2}-\d{2}/g, '<span class="pf-date">$&</span>');
  var issueDate = pfMeta.issueDate || '2026.09.08';

  var dateStr = (issueDate ? issueDate.replace(/[^0-9]/g, '') : '20261029').slice(0, 8);
  var tailNum = '01';
  if (pfMeta && pfMeta.id) {
    var rawDigits = String(pfMeta.id).replace(/[^0-9]/g, '');
    if (rawDigits.length >= 2) tailNum = rawDigits.slice(-2);
  }
  var reportId = 'PF-' + dateStr + '-' + tailNum;

  var books = pfData.books || [];
  if (books.length === 0 && typeof getStudentCertifiedBooksForWizard === 'function') {
    var fallbackBooks = getStudentCertifiedBooksForWizard(studentId);
    if (fallbackBooks && fallbackBooks.length > 0) {
      books = fallbackBooks.map(function(fb) {
        return {
          title: fb.title,
          date: fb.date,
          score: fb.score || '100점',
          cover: fb.cover || 'resources/images/book_default.svg',
          pub: fb.pub || '나노출판',
          author: fb.author || '',
          comment: fb.comment || ''
        };
      });
    }
  }
  var bookCount = books.length;
  var rawAvg = Number(pfData.quizAvg);
  if ((!rawAvg || isNaN(rawAvg)) && books.length > 0) {
    rawAvg = books.reduce(function(sum, b) {
      var num = parseFloat(String(b.score || '').replace(/[^0-9.]/g, ''));
      return sum + (isNaN(num) ? 0 : num);
    }, 0) / books.length;
  }
  var quizAvg = Math.round(rawAvg || (std && std.quizAvg && !isNaN(parseFloat(std.quizAvg)) ? parseFloat(std.quizAvg) : 0));

  // AI 분석 요청 및 스마트 기본값 자동 적용
  requestGeminiPortfolioStory(studentId, pfId, pfData, std);

  // 4대 핵심 역량 인포그래픽 카드 HTML
  var insightItems = generatePortfolioInsights(std, pfData);
  var insightGridHtml = (
    '<div class="pf-insight-card-grid">' +
      insightItems.map(function(item, idx) {
        var cat = (typeof item === 'object' && item.category) ? item.category : (idx === 0 ? '문해력 & 중심 맥락 파악' : (idx === 1 ? '공감 능력 & 정서적 사유' : (idx === 2 ? '비판적 사고 & 문제 해결력' : '자기표현 & 능동적 독서 태도')));
        var icon = (typeof item === 'object' && item.icon) ? item.icon : (idx === 0 ? 'fa-solid fa-lightbulb' : (idx === 1 ? 'fa-solid fa-heart' : (idx === 2 ? 'fa-solid fa-scale-balanced' : 'fa-solid fa-seedling')));
        var col = (typeof item === 'object' && item.color) ? item.color : (idx === 0 ? '#1f8a7e' : (idx === 1 ? '#e67828' : (idx === 2 ? '#3b82f6' : '#10b981')));
        var text = (typeof item === 'object' && item.comment) ? item.comment : String(item || '');
        return (
          '<div class="pf-insight-card">' +
            '<div class="pf-insight-card-head">' +
              '<i class="' + icon + '" style="color:' + col + ';"></i>' +
              '<span>' + escapePortfolioText(cat) + '</span>' +
            '</div>' +
            '<div class="pf-insight-card-body">' +
              escapePortfolioText(text) +
            '</div>' +
          '</div>'
        );
      }).join('') +
    '</div>'
  );

  // SVG 도넛 차트 생성 (장르 분포)
  var dist = pfData.genreDist || { '문학/성장': 50, '인문/철학': 25, '사회/과학': 25 };
  var distKeys = Object.keys(dist);
  var donutSvg = buildGenreDonutSvg(dist);

  // 태그 뱃지 생성
  var tags = pfData.tags || ['#성장소설', '#인간관계', '#철학적사유', '#공감과소통', '#자아탐색'];
  var tagsHtml = tags.map(function(t) {
    return '<span class="pf-tag-badge">' + t + '</span>';
  }).join(' ');

  // 책 커버 갤러리 가로 그리드 HTML
  var coverGridHtml = books.map(function(b, idx) {
    var matchedBook = (typeof academyBookList !== 'undefined' && academyBookList)
      ? academyBookList.find(function(ab) {
          if (!ab || !ab.title) return false;
          return ab.title === b.title || ab.title.replace(/\s+/g, '') === (b.title || '').replace(/\s+/g, '');
        })
      : null;

    var rawCover = (b.cover && b.cover !== 'undefined' && b.cover !== 'null') ? b.cover : (matchedBook ? matchedBook.cover : '');
    var coverUrl = rawCover || 'resources/images/book_default.svg';
    var pubText = b.pub || (matchedBook ? (matchedBook.publisher || matchedBook.pub) : '나노출판');

    var coverAction = escapePortfolioText('openCoverModal(' + JSON.stringify(coverUrl) + ', ' + JSON.stringify(b.title || '') + ', ' + JSON.stringify(pubText || '') + ')');
    return (
      '<div class="pf-cover-card-item">' +
        '<button type="button" class="pf-cover-card-img-wrap" aria-label="' + escapePortfolioText(b.title || '도서') + ' 표지 확대" onclick="' + coverAction + '">' +
          '<img src="' + escapePortfolioText(coverUrl) + '" class="pf-cover-card-img" alt="' + escapePortfolioText(b.title || '') + '" onerror="this.onerror=null; this.src=\'resources/images/book_default.svg\';">' +
        '</button>' +
        '<div class="pf-cover-card-title">' + escapePortfolioText(b.title || '') + '</div>' +
        '<div class="pf-cover-card-sub">' + escapePortfolioText(pubText || '') + '</div>' +
      '</div>'
    );
  }).join('');

  // 북퀴즈 응시 및 성취도 이력 카드 HTML
  var booksGridHtml = books.map(function(b, idx) {
    var matchedBook = (typeof academyBookList !== 'undefined' && academyBookList)
      ? academyBookList.find(function(ab) {
          if (!ab || !ab.title) return false;
          return ab.title === b.title || ab.title.replace(/\s+/g, '') === (b.title || '').replace(/\s+/g, '');
        })
      : null;

    var rawCover = (b.cover && b.cover !== 'undefined' && b.cover !== 'null') ? b.cover : (matchedBook ? matchedBook.cover : '');
    var coverUrl = rawCover || 'resources/images/book_default.svg';

    var pubText = (b.pub && b.pub !== 'undefined' && b.pub !== 'null') 
      ? b.pub 
      : ((b.publisher && b.publisher !== 'undefined' && b.publisher !== 'null') 
          ? b.publisher 
          : (matchedBook ? (matchedBook.publisher || matchedBook.pub) : '나노출판'));

    var authorText = (b.author && b.author !== 'undefined' && b.author !== 'null') 
      ? b.author 
      : (matchedBook ? matchedBook.author : '');

    var scoreText = b.score == null || b.score === '' ? '기록 없음' : b.score;
    if (typeof scoreText === 'number' || (typeof scoreText === 'string' && /^\d+(\.\d+)?$/.test(scoreText))) {
      scoreText = scoreText + '점';
    }

    var commentText = b.achievement || ('《' + (b.title || '완독 도서') + '》의 중심 맥락과 핵심 어휘를 바르게 습득하였으며, 북퀴즈를 성실히 완수했습니다.');
    // 연도와 월일을 분리해 왼쪽의 좁은 메타 정보 열에 정렬합니다.
    var bookDate = String(b.date || '').trim();
    var dateParts = bookDate.match(/^(\d{4})[-./](\d{1,2})[-./](\d{1,2})(?:$|[T\s])/);
    var bookDateHtml = dateParts
      ? '<span class="pf-book-year">' + dateParts[1] + '</span><span class="pf-book-month-day">' + dateParts[2].padStart(2, '0') + '.' + dateParts[3].padStart(2, '0') + '</span>'
      : escapePortfolioText(bookDate || '완독일 미등록');

    var coverAction = escapePortfolioText('openCoverModal(' + JSON.stringify(coverUrl) + ', ' + JSON.stringify(b.title || '') + ', ' + JSON.stringify(pubText || '') + ')');
    return (
      '<article class="pf-book-col">' +
        '<div class="pf-book-row-card">' +
          '<div class="pf-book-meta-left">' +
            '<span class="pf-book-number">No.' + (idx + 1) + '</span>' +
            '<span class="pf-book-date" aria-label="' + escapePortfolioText(bookDate || '완독일 미등록') + '">' + bookDateHtml + '</span>' +
          '</div>' +
          '<div class="pf-book-score"><span>북퀴즈</span><span>' + escapePortfolioText(scoreText) + '</span></div>' +
          '<div class="pf-book-card-top">' +
            '<button type="button" class="pf-book-cover-wrap" aria-label="' + escapePortfolioText(b.title || '도서') + ' 표지 확대" onclick="' + coverAction + '">' +
              '<img src="' + escapePortfolioText(coverUrl) + '" class="pf-book-cover-img" alt="' + escapePortfolioText(b.title || '') + '" onerror="this.onerror=null; this.src=\'resources/images/book_default.svg\';">' +
            '</button>' +
            '<div class="pf-book-info-block">' +
              '<div class="pf-book-title">' + escapePortfolioText(b.title || '') + '</div>' +
              '<div class="pf-book-byline">' + escapePortfolioText((pubText || '') + (authorText ? (' · ' + authorText) : '')) + '</div>' +
            '</div>' +
          '</div>' +
          '<div class="pf-book-achievement-block">' +
            '<div class="pf-book-achievement-title"><i class="fa-solid fa-award mr-1"></i>핵심 문맥 파악 및 성취 내역</div>' +
            '<div class="pf-book-achievement-text">' + escapePortfolioText(commentText) + '</div>' +
          '</div>' +
        '</div>' +
      '</article>'
    );
  }).join('');

  // 전체 포트폴리오 문서 조립: 종합 분석에서 도서별 성취 내역과 지도교사 총평으로 이어집니다.
  var html = 
    '<!-- ============================================================== -->' +
    '<!-- [포트폴리오 종합 대시보드] -->' +
    '<!-- ============================================================== -->' +
    '<div class="pf-page1-section">' +
      '<!-- ① 학생 정보 헤더 -->' +
      '<div class="pf-header-section mb-3 pb-3 border-bottom">' +
        '<div class="d-flex justify-content-between align-items-start mb-2 pf-header-top">' +
          '<div>' +
            '<div style="font-size:11px; font-weight:800; letter-spacing:1px; color:#1f8a7e; text-transform:uppercase;">나노의 책장 (Nano Bookshelf)</div>' +
            '<h3 class="font-weight-bold mb-1 pf-header-title">' +
              '<i class="fa-solid fa-book-bookmark text-success mr-2" style="color:#1f8a7e !important;"></i>나노의 책장 독서 성장 포트폴리오' +
            '</h3>' +
            '<p class="text-muted mb-0" style="font-size:12px;">체계적인 북퀴즈 응시 이력과 다면적 독서 역량을 입체적으로 분석한 공식 성장 리포트입니다.</p>' +
          '</div>' +
          '<div class="text-right pf-header-meta">' +
            '<span class="pf-report-id mb-1">발급번호 ' + reportId + '</span>' +
            '<div class="text-muted" style="font-size:11.5px;">발급일: ' + escapePortfolioText(issueDate) + '</div>' +
          '</div>' +
        '</div>' +
        '<div class="pf-student-info-grid mt-2">' +
          '<div class="pf-student-info-cell"><span class="pf-info-label">학생명</span><strong class="pf-info-val">' + escapePortfolioText(studentName) + '</strong></div>' +
          '<div class="pf-student-info-cell"><span class="pf-info-label">학교 / 학년</span><strong class="pf-info-val">' + escapePortfolioText(schoolGrade) + '</strong></div>' +
          '<div class="pf-student-info-cell"><span class="pf-info-label">소속 / 지도교사</span><strong class="pf-info-val">' + escapePortfolioText(classGroup) + ' · ' + escapePortfolioText(teacher) + '</strong></div>' +
          '<div class="pf-student-info-cell"><span class="pf-info-label">분석 대상 기간</span><strong class="pf-info-val pf-info-highlight">' + periodHtml + '</strong></div>' +
        '</div>' +
      '</div>' +

      '<!-- ② 기간 요약 통계 (총 00권) -->' +
      '<div class="mb-3">' +
        '<div class="pf-section-title mb-2"><i class="fa-solid fa-chart-simple"></i>기간 독서 핵심 요약</div>' +
        '<div class="pf-stat-grid">' +
          '<div class="pf-stat-box"><div class="pf-stat-label">완독 도서수</div><div class="pf-stat-value">' + bookCount + '<span class="pf-stat-unit">권</span></div><div class="pf-stat-sub text-success font-weight-bold" style="color:#1f8a7e !important;">목표 완독 완료</div></div>' +
          '<div class="pf-stat-box"><div class="pf-stat-label">북퀴즈 완료</div><div class="pf-stat-value">' + bookCount + '<span class="pf-stat-unit">회</span></div><div class="pf-stat-sub text-success font-weight-bold" style="color:#1f8a7e !important;">응시율 100%</div></div>' +
          '<div class="pf-stat-box"><div class="pf-stat-label">평균 이해도</div><div class="pf-stat-value">' + quizAvg + '<span class="pf-stat-unit">점</span></div><div class="pf-stat-sub text-muted">북퀴즈 통과</div></div>' +
          '<div class="pf-stat-box"><div class="pf-stat-label">독서 성실도</div><div class="pf-stat-value">100<span class="pf-stat-unit">%</span></div><div class="pf-stat-sub text-success font-weight-bold" style="color:#1f8a7e !important;">성실한 루틴 완성</div></div>' +
        '</div>' +
      '</div>' +

      '<!-- ③ 📖 나노의 독서 이야기 (4대 핵심 역량 인포그래픽 카드) -->' +
      '<div class="mb-3">' +
        '<div class="pf-panel">' +
          '<div class="pf-panel-head">' +
            '<h5 class="pf-section-title">' +
              '<i class="fa-solid fa-book-open-reader" style="color:#1f8a7e;"></i>나노의 독서 이야기 · 핵심 역량 분석' +
            '</h5>' +
            '<span class="pf-panel-badge">AI 다면 분석 리포트</span>' +
          '</div>' +
          insightGridHtml +
        '</div>' +
      '</div>' +

      '<!-- ④ 독서 취향 그래프 (카테고리별 / 주제별) -->' +
      '<div class="mb-3">' +
        '<div class="pf-section-title mb-2"><i class="fa-solid fa-pie-chart"></i>독서 취향 및 선호도 분석</div>' +
        '<div class="pf-preference-wrap">' +
          '<div class="row align-items-center pf-preference-row">' +
            '<div class="col-md-5 text-center mb-3 mb-md-0 border-right-md pf-preference-chart-col">' +
              '<div style="position:relative; display:inline-block;">' +
                donutSvg +
                '<div style="position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); text-align:center; pointer-events:none;">' +
                  '<div style="font-size:18px; font-weight:800; color:#124e47; line-height:1;">' + bookCount + '권</div>' +
                  '<div style="font-size:9.5px; color:#7d756d; font-weight:600; margin-top:2px;">누적 완독</div>' +
                '</div>' +
              '</div>' +
              '<div class="text-muted mt-1" style="font-size:11px; font-weight:600;">도서 카테고리별 완독 분포</div>' +
            '</div>' +
            '<div class="col-md-7 pl-md-4 pf-preference-detail-col">' +
              '<div class="mb-2">' +
                '<div class="font-weight-bold mb-1.5 text-dark" style="font-size:12px;">선호 독서 테마 & 키워드</div>' +
                '<div>' + tagsHtml + '</div>' +
              '</div>' +
              '<div>' +
                '<div class="font-weight-bold mb-1.5 text-dark" style="font-size:12px;">카테고리 구성 비율</div>' +
                distKeys.map(function(k, index) {
                  var val = dist[k];
                  return (
                    '<div class="mb-1" style="font-size:11.5px;">' +
                      '<div class="d-flex justify-content-between mb-0.5">' +
                        '<span>' + k + '</span>' +
                        '<span class="font-weight-bold text-success" style="color:#1f8a7e !important;">' + val + '%</span>' +
                      '</div>' +
                      '<div class="progress" style="height:5px; background:#ece5d9; border-radius:3px;">' +
                        '<div class="progress-bar" style="width:' + val + '%; background:' + ['#1f8a7e', '#f6c344', '#e89936', '#72aaa1'][index % 4] + '; border-radius:3px;"></div>' +
                      '</div>' +
                    '</div>'
                  );
                }).join('') +
              '</div>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>' +

      '<!-- ⑤ 책 커버 갤러리 (기간 내 완독 도서 - 가로 책장 그리드) -->' +
      (books.length > 0 ? (
        '<div class="mb-2">' +
          '<div class="pf-collection-head">' +
            '<div class="pf-section-title mb-0"><i class="fa-solid fa-book-bookmark"></i>완독 도서 책 커버 컬렉션 (' + bookCount + '권)</div>' +
            '<small class="text-muted pf-print-hide">표지를 누르면 확대됩니다</small>' +
          '</div>' +
          '<div class="pf-collection">' +
            '<div class="pf-cover-grid-wrap">' +
              coverGridHtml +
            '</div>' +
          '</div>' +
        '</div>'
      ) : '') +
    '</div>' +

    '<!-- ────────────────────────────────────────────── -->' +
    '<!-- [요약과 도서별 상세 이력 구분선] -->' +
    '<!-- ────────────────────────────────────────────── -->' +
    '<div class="pf-page-break"></div>' +

    '<!-- ============================================================== -->' +
    '<!-- [북퀴즈 상세 이력 & 지도교사 심층 총평: 도서 카드 단위로 이어서 인쇄] -->' +
    '<!-- ============================================================== -->' +
    '<div class="pf-page2-section">' +
      '<!-- 상세 이력 안내 -->' +
      '<div class="pf-detail-header">' +
        '<div style="font-size:12px; font-weight:700; color:#1f8a7e;">' +
          '<i class="fa-solid fa-book-open mr-1"></i>나노의 책장 독서 성장 포트폴리오 <span class="text-muted font-weight-normal">| 도서별 세부 성취 및 지도교사 총평</span>' +
        '</div>' +
        '<div style="font-size:11px; color:#7d756d;">학생명: <strong class="text-dark">' + escapePortfolioText(studentName) + '</strong> (' + escapePortfolioText(schoolGrade) + ') · 발급번호: ' + reportId + '</div>' +
      '</div>' +

      '<!-- ⑥ 북퀴즈 응시 및 성취도 이력 -->' +
      '<div class="mb-3">' +
        '<div class="pf-section-title mb-2"><i class="fa-solid fa-award"></i>도서별 북퀴즈 성취 및 심층 분석 이력</div>' +
        '<div class="pf-books-grid-row">' +
          (booksGridHtml || '<div class="pf-empty">이 기간에 등록된 완독 도서가 없습니다.</div>') +
        '</div>' +
      '</div>' +

      '<!-- ⑦ 지도교사 심층 총평 및 서명 -->' +
      '<div class="mb-3">' +
        '<div class="pf-panel pf-teacher-comment-box">' +
          '<div class="pf-panel-head">' +
            '<strong class="pf-section-title"><i class="fa-solid fa-chalkboard-user mr-2 text-success" style="color:#1f8a7e !important;"></i>담당 지도교사 심층 총평</strong>' +
            '<span class="pf-panel-badge">담당 교사: ' + escapePortfolioText(teacher) + '</span>' +
          '</div>' +
          '<div id="pfTeacherNoteDisplay">' +
            escapePortfolioText(pfData.teacherNote || '') +
          '</div>' +
          '<div class="pf-signature mt-3 pt-2 border-top">' +
            '<span style="font-size:11px; color:#6b7280;">나노의 책장 독서 교육 연구소 인증 지도교사</span>' +
            '<div style="display:inline-flex; align-items:center; gap:5px; font-weight:700; color:#124e47; font-size:12.5px;">' +
              '<span>' + escapePortfolioText(teacher) + '</span>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>' +

      '<!-- 리포트 푸터 -->' +
      '<div class="pf-footer text-muted">' +
        '<div><span class="font-weight-bold" style="color:#1f8a7e;">나노의 책장</span> · 독서 교육 연구소 공식 발급 인증서</div>' +
        '<div>아이의 독서는 끝없는 가능성의 시작입니다. · © 나노의 책장 (Nano Bookshelf)</div>' +
      '</div>' +
    '</div>';

  docContainer.innerHTML = html;
}

function buildGenreDonutSvg(dist) {
  var total = 0;
  for (var k in dist) total += dist[k];
  if (total === 0) total = 100;

  var colors = ['#1f8a7e', '#f6c344', '#e89936', '#72aaa1'];
  var accumulatedPercent = 0;
  var paths = [];

  var keys = Object.keys(dist);
  keys.forEach(function(key, idx) {
    var percent = (dist[key] / total) * 100;
    var startX = getCoordinatesForPercent(accumulatedPercent)[0];
    var startY = getCoordinatesForPercent(accumulatedPercent)[1];

    accumulatedPercent += percent;

    var endX = getCoordinatesForPercent(accumulatedPercent)[0];
    var endY = getCoordinatesForPercent(accumulatedPercent)[1];
    var largeArcFlag = percent > 50 ? 1 : 0;

    var pathData = [
      'M ' + startX + ' ' + startY,
      'A 1 1 0 ' + largeArcFlag + ' 1 ' + endX + ' ' + endY,
      'L 0 0'
    ].join(' ');

    paths.push('<path d="' + pathData + '" fill="' + colors[idx % colors.length] + '"></path>');
  });

  return (
    '<svg viewBox="-1.1 -1.1 2.2 2.2" style="width:130px; height:130px; transform:rotate(-90deg); border-radius:50%; box-shadow:0 3px 10px rgba(0,0,0,0.06);">' +
      paths.join('') +
      '<circle cx="0" cy="0" r="0.65" fill="#fbf9f4"></circle>' +
    '</svg>'
  );
}

function getCoordinatesForPercent(percent) {
  var x = Math.cos(2 * Math.PI * (percent / 100));
  var y = Math.sin(2 * Math.PI * (percent / 100));
  return [x, y];
}

// ==============================================================
// 듀얼 뷰포트 토글 및 인쇄 모드 함수
// ==============================================================
function setPortfolioViewMode(mode) {
  currentPortfolioViewMode = mode;
  var container = document.getElementById('portfolioViewportContainer');
  var btnA4 = document.getElementById('btnPfViewA4');
  var btnMobile = document.getElementById('btnPfViewMobile');
  var mobileHeader = document.querySelector('.portfolio-mobile-header');

  if (mode === 'mobile') {
    if (container) {
      container.className = 'portfolio-view-mobile';
    }
    if (btnA4) btnA4.classList.remove('active');
    if (btnMobile) btnMobile.classList.add('active');
    if (mobileHeader) mobileHeader.style.display = 'block';
  } else {
    if (container) {
      container.className = 'portfolio-view-a4';
    }
    if (btnA4) btnA4.classList.add('active');
    if (btnMobile) btnMobile.classList.remove('active');
    if (mobileHeader) mobileHeader.style.display = 'none';
  }
}

// 화면 전환: 포트폴리오 상세 화면 표시
function viewPortfolioDetail(studentId, pfId) {
  var listEl = document.getElementById('portfolio-sub-list');
  var detailEl = document.getElementById('portfolio-sub-detail');
  if (listEl) listEl.style.display = 'none';
  if (detailEl) detailEl.style.display = 'block';

  currentViewingPortfolioId = pfId || 'PF-2026-0901';

  // 7대 섹션 문서 렌더링 (순서: 학생정보 -> 기간요약 -> 독서취향 -> 완독도서 -> 북퀴즈이력 -> 독서이야기 -> 지도교사총평)
  renderPortfolioDocument(studentId, currentViewingPortfolioId);

  // 상단 카톡 액션 버튼 업데이트
  updatePortfolioDetailKakaoButton(currentViewingPortfolioId);

  // 기본은 A4 뷰로 표시
  setPortfolioViewMode('a4');

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function initPortfolioOptions() {
  // 학생 전환 드롭다운이 제거되었으므로 안전한 no-op 처리
}

function onPortfolioStudentChange(stdId) {
  var pf = portfolioList.find(function(p) { return p.studentId === stdId; }) || portfolioList[0];
  currentViewingPortfolioId = pf.id;
  renderPortfolioDocument(stdId, pf.id);
  updatePortfolioDetailKakaoButton(pf.id);
}


function viewStudentPortfolio(stdId) {
  switchTab('portfolio');
  var pf = portfolioList.find(function(p) { return p.studentId === stdId; }) || portfolioList[0];
  viewPortfolioDetail(stdId, pf.id);
}

async function savePortfolioComment() {
  var sel = document.getElementById('selectPortfolioStudent');
  var stdId = sel ? sel.value : 'S1021';
  var comment = document.getElementById('pfTeacherComment') ? document.getElementById('pfTeacherComment').value : '';
  if (window.NanoPortal && NanoPortal.remote) {
    var portfolio = portfolioList.find(function(item) { return item.studentId === stdId; });
    if (!portfolio) { showAcademyToast('먼저 이 학생의 포트폴리오를 발급해 주세요.'); return; }
    try {
      await NanoPortal.savePortfolio({ id: portfolio.id, revision: portfolio.revision, memberId: portfolio.memberId, from: portfolio.from, to: portfolio.to, comment: comment }, currentAcademyInfo.id);
      await NanoPortal.refreshPortfolios();
    } catch (error) {
      showAcademyToast('총평을 저장하지 못했습니다: ' + error.message);
      return;
    }
  }
  if (portfolioDataMap[stdId]) {
    portfolioDataMap[stdId].teacherNote = comment;
  }
  showAcademyToast('[' + (portfolioDataMap[stdId] ? portfolioDataMap[stdId].name : '해당 학생') + '] 학생 총평이 저장되었습니다.');
}

function openPortfolioReportModal() {
  printCurrentPortfolio();
}

// 현재 보고 있는 포트폴리오 인쇄 / PDF 저장 (전역 미디어 쿼리 간섭 없는 격리 iframe 인쇄)
function printCurrentPortfolio() {
  var currentData = portfolioDataMap[currentViewingPortfolioId];
  if (currentData && currentData._aiPending) {
    showAcademyToast('AI 분석을 저장하고 있습니다. 완료 후 인쇄해 주세요.');
    return;
  }
  var docContainer = document.getElementById('portfolioPrintDoc');
  if (!docContainer) {
    showAcademyToast('인쇄할 포트폴리오 문서를 찾을 수 없습니다.');
    return;
  }
  printHtmlInIsolatedFrame(
    '<div id="portfolioPrintDoc" class="portfolio-document-view" style="max-width:800px; margin:0 auto; padding:0; background:#ffffff;">' + docContainer.innerHTML + '</div>',
    'is-printing-portfolio',
    '나노의 책장 독서 성장 포트폴리오'
  );
}


// 목록에서 단건 바로 인쇄
function printSinglePortfolio(studentId, pfId) {
  viewPortfolioDetail(studentId, pfId);
  setTimeout(function() {
    printCurrentPortfolio();
  }, 250);
}

var currentWizardFilteredBooks = [];
var wizardSelectedBookKeys = [];

// 원생별 인증 완료(60점 이상) 완독 도서 추출 헬퍼 (동일 도서의 여러 이력도 모두 개별 포함)
function getStudentCertifiedBooksForWizard(stdId) {
  var std = studentDataList.find(function(s) { return s.id === stdId; });
  var stdName = std ? std.name : '';

  var loadedLogs = [];
  try {
    if (typeof getLoadedLearningLogs === 'function') {
      loadedLogs = getLoadedLearningLogs();
    }
  } catch (e) {
    console.warn('학습 로그 로딩 예외:', e);
  }
  if (!loadedLogs || loadedLogs.length === 0) {
    loadedLogs = typeof learningLogs !== 'undefined' ? learningLogs : [];
  }

  // 학생 ID(우선) 또는 이름으로 매칭되는 인증 완료(60점 이상) 로그 필터링
  var studentLogs = loadedLogs.filter(function(log) {
    var idMatch = log.studentId && String(log.studentId).trim() === String(stdId).trim();
    var nameMatch = !log.studentId && stdName && log.studentName === stdName;
    if (!idMatch && !nameMatch) return false;
    return log.score === undefined || Number(log.score) >= 60;
  });

  // 최신 제출/완독일 순으로 내림차순 정렬
  studentLogs.sort(function(a, b) {
    var dtA = a.submittedAt || a.date || '';
    var dtB = b.submittedAt || b.date || '';
    return dtB.localeCompare(dtA);
  });

  var allBooks = [];
  if (studentLogs.length > 0) {
    var catalog = (typeof academyBookList !== 'undefined' && Array.isArray(academyBookList))
      ? academyBookList
      : (Array.isArray(window.MIGRATED_BOOKS) ? window.MIGRATED_BOOKS : []);

    studentLogs.forEach(function(log, lIdx) {
      var title = log.bookTitle || log.title || '도서';

      var matchedBook = catalog.find(function(b) {
        if (!b) return false;
        if (log.bookId && (String(b.id) === String(log.bookId) || String(b.bookNo) === String(log.bookId))) return true;
        return b.title === title || (b.title && b.title.replace(/\s+/g, '') === title.replace(/\s+/g, ''));
      });

      var cover = (matchedBook && matchedBook.cover) ? matchedBook.cover : (log.cover || 'resources/images/book_default.svg');
      var pub = log.bookPub || log.pub || (matchedBook ? (matchedBook.publisher || matchedBook.pub) : '') || '나노출판';
      
      // 날짜 및 제출 시간 포맷
      var dtInfo = (typeof formatLearningDateTime === 'function') ? formatLearningDateTime(log) : null;
      var dateFormatted = dtInfo ? dtInfo.date.replace(/-/g, '.') : ((log.date || (log.submittedAt ? String(log.submittedAt).slice(0, 10) : '') || '2026.09.01').split(' ')[0].replace(/-/g, '.'));
      var timeFormatted = dtInfo ? dtInfo.time : '';

      var scoreNum = log.score !== undefined ? Math.round(Number(log.score)) : 100;
      var scoreStr = scoreNum + '점';
      var sheetStr = log.sheet || '작성 전';
      var commentStr = log.comment || log.thoughtAnswer || log.studentThoughtAnswer || log.sheetAnswer || '작품의 주요 갈등 구조와 핵심 어휘를 바르게 파악하고 성실히 완독함.';

      var uniqueKey = (log.id ? String(log.id) : '') || ('book_' + title + '_' + dateFormatted + '_' + lIdx);

      allBooks.push({
        uniqueKey: uniqueKey,
        logId: log.id || '',
        bookId: log.bookId || '',
        cover: cover,
        title: title,
        pub: pub,
        date: dateFormatted,
        time: timeFormatted,
        score: scoreStr,
        scoreNum: scoreNum,
        sheet: sheetStr,
        comment: commentStr
      });
    });
  }

  // 학습 로그에 완독 기록이 없는 경우 기존 포트폴리오 데이터 또는 데모 기본값 참조
  if (allBooks.length === 0) {
    var pf = portfolioDataMap[stdId];
    if (pf && pf.books && pf.books.length > 0) {
      allBooks = pf.books.map(function(b, idx) {
        return {
          uniqueKey: 'pf_' + (b.title || 'book') + '_' + idx,
          logId: '',
          cover: b.cover || 'resources/images/book_default.svg',
          title: b.title || '도서',
          pub: b.pub || b.publisher || '나노출판',
          date: String(b.date || '2026.09.01').split(' ')[0].replace(/-/g, '.'),
          time: '',
          score: typeof b.score === 'number' ? Math.round(b.score) + '점' : (b.score || '100점'),
          sheet: b.sheet || '작성 완료',
          comment: b.comment || b.thought || ''
        };
      });
    } else if (!window.NANO_SERVER_DATA && !(window.NanoPortal && NanoPortal.remote)) {
      allBooks = [
        { uniqueKey: 'demo_1', logId: '', cover: 'assets/covers/cover_1001.jpg', title: '어린 왕자', pub: '열린책들', date: '2026.09.07', time: '', score: '100점', sheet: '제출 완료', comment: '사막여우와 장미의 의미를 문해력 높게 해석하고 논술 과제를 훌륭히 완수함.' },
        { uniqueKey: 'demo_2', logId: '', cover: 'assets/covers/cover_1002.jpg', title: '아몬드', pub: '창비', date: '2026.09.02', time: '', score: '90점', sheet: '제출 완료', comment: '타인의 고통과 감정에 대한 공감 능력을 자신의 경험에 빗대어 설득력 있게 표현함.' },
        { uniqueKey: 'demo_3', logId: '', cover: 'assets/covers/cover_1004.jpg', title: '자전거 도둑', pub: '다림', date: '2026.08.28', time: '', score: '92점', sheet: '제출 완료', comment: '물질주의와 양심 사이의 갈등을 비판적 시각으로 깊이 있게 고찰함.' }
      ];
    }
  }

  return allBooks;
}

// 선택된 원생의 2단계 조회 기간 기본값을 오늘로부터 3개월치로 자동 동기화
function syncWizardDateRangeForStudent(stdId) {
  var startDateInput = document.getElementById('wizBookStartDate');
  var endDateInput = document.getElementById('wizBookEndDate');
  var now = new Date();
  var threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());

  var endYyyy = now.getFullYear();
  var endMm = String(now.getMonth() + 1).padStart(2, '0');
  var endDd = String(now.getDate()).padStart(2, '0');
  var defaultEnd = endYyyy + '-' + endMm + '-' + endDd;

  var startYyyy = threeMonthsAgo.getFullYear();
  var startMm = String(threeMonthsAgo.getMonth() + 1).padStart(2, '0');
  var startDd = String(threeMonthsAgo.getDate()).padStart(2, '0');
  var defaultStart = startYyyy + '-' + startMm + '-' + startDd;

  if (startDateInput) startDateInput.value = defaultStart;
  if (endDateInput) endDateInput.value = defaultEnd;
}

function openPortfolioCreateWizard() {
  currentWizardStep = 1;
  wizardSelectedBooks = [];
  wizardSelectedBookKeys = [];
  currentWizardFilteredBooks = [];

  // 서버 모드에서 학습 로그가 아직 로드되지 않았다면 백그라운드 동기화 수행
  if (window.NanoPortal && NanoPortal.remote && (!NanoPortal.logs() || NanoPortal.logs().length === 0)) {
    NanoPortal.refreshLearning().then(function() {
      if (wizardSelectedStudentId) {
        onWizardStudentSelect(wizardSelectedStudentId);
        if (currentWizardStep === 2) renderWizardBookList(wizardSelectedStudentId);
      }
    }).catch(function() {});
  }

  // 학급 필터 초기화
  var classSel = document.getElementById('wizStudentClassFilter');
  if (classSel) classSel.value = 'ALL';

  // 1단계: 학급 기준으로 학생 목록 채우기
  onWizardClassFilterChange('ALL');

  // 2단계 날짜 기본 세팅 (선택된 원생의 인증 도서 기간 포함)
  syncWizardDateRangeForStudent(wizardSelectedStudentId);

  goToWizardStep(1);

  if (window.jQuery && typeof $('#portfolioCreateWizardModal').modal === 'function') {
    $('#portfolioCreateWizardModal').modal('show');
  } else {
    showModalVanilla('portfolioCreateWizardModal');
  }
}

// 1단계: 학급 선택 시 해당 학급 학생들만 원생 선택 드롭다운에 채우기
function onWizardClassFilterChange(classGroup) {
  var sel = document.getElementById('wizStudentSelect');
  if (!sel) return;
  sel.innerHTML = '';

  var filteredStudents = studentDataList.filter(function(std) {
    return (classGroup === 'ALL') || (std.classGroup === classGroup);
  });

  if (filteredStudents.length === 0) {
    var opt = document.createElement('option');
    opt.value = '';
    opt.innerText = '해당 학급에 등록된 원생이 없습니다.';
    sel.appendChild(opt);
    return;
  }

  filteredStudents.forEach(function(std) {
    var opt = document.createElement('option');
    opt.value = std.id;
    opt.innerText = std.name + ' (' + std.id + ' · ' + std.school + ' · ' + std.classGroup + ' ' + std.grade + ')';
    sel.appendChild(opt);
  });

  wizardSelectedStudentId = filteredStudents[0].id;
  sel.value = wizardSelectedStudentId;
  onWizardStudentSelect(wizardSelectedStudentId);
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
    var std = studentDataList.find(function(s) { return s.id === wizardSelectedStudentId; });
    var tInput = document.getElementById('wizReportTitle');
    if (std && tInput) { tInput.value = '[' + std.name + '] 2026년 3분기 독서 포트폴리오'; }
  } else if (step === 4) {
    if (btnPrev) btnPrev.style.display = 'none';
    if (btnCancel) btnCancel.style.display = 'none';
    if (nextGroup) nextGroup.style.display = 'none';
    if (doneGroup) doneGroup.style.display = 'block';
  }
}

// 1단계 원생 선택 시 프로필 카드 갱신
function onWizardStudentSelect(stdId) {
  if (!stdId) return;
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

  var certBooks = getStudentCertifiedBooksForWizard(stdId);
  var displayBookCount = Number(std.bookCount) || 0;
  if (certBooks.length > displayBookCount) {
    displayBookCount = certBooks.length;
  }

  var wizAvgNum = parseFloat(std.quizAvg);
  var displayQuizAvg = (std.quizAvg != null && std.quizAvg !== '-' && !isNaN(wizAvgNum)) ? Math.round(wizAvgNum) : 0;

  if (nameEl) nameEl.innerText = std.name + ' 원생';
  if (metaEl) metaEl.innerText = std.school + ' ' + std.grade + ' · ' + std.classGroup + ' · 학번 ' + std.id;
  if (levelEl) levelEl.innerText = std.level;
  if (bookCountEl) bookCountEl.innerText = displayBookCount + '권';
  if (quizAvgEl) quizAvgEl.innerText = displayQuizAvg + '점';
  if (teacherEl) teacherEl.innerText = formatPortfolioTeacher(std.teacher);
  if (initEl) initEl.innerText = std.name ? std.name.charAt(0) : '원';

  syncWizardDateRangeForStudent(stdId);

  var titleInput = document.getElementById('wizReportTitle');
  if (titleInput) {
    titleInput.value = '2026년 3분기 독서역량 포트폴리오 (' + std.name + ')';
  }

  var commentInput = document.getElementById('wizReportComment');
  if (commentInput) {
    commentInput.value = '';
  }
}

async function onWizardNext() {
  if (currentWizardStep === 1) {
    if (window.NanoPortal && NanoPortal.remote && (!NanoPortal.logs() || NanoPortal.logs().length === 0)) {
      try {
        await NanoPortal.refreshLearning();
      } catch (e) {}
    }
    syncWizardDateRangeForStudent(wizardSelectedStudentId);
    renderWizardBookList(wizardSelectedStudentId);
    goToWizardStep(2);
  } else if (currentWizardStep === 2) {
    if (wizardSelectedBookKeys.length === 0) {
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

// 2단계 일자 범위로 도서 필터링 실행
function filterWizardBooksByDate() {
  renderWizardBookList(wizardSelectedStudentId);
}

// 2단계 도서 체크박스 리스트 동적 렌더링 (일자 범위 필터링 적용, 동일 도서 다회차 이력 모두 노출)
function renderWizardBookList(stdId) {
  var container = document.getElementById('wizBookCheckList');
  if (!container) return;
  container.innerHTML = '';

  var allBooks = getStudentCertifiedBooksForWizard(stdId);

  var startDateVal = document.getElementById('wizBookStartDate') ? document.getElementById('wizBookStartDate').value.replace(/-/g, '.') : '';
  var endDateVal = document.getElementById('wizBookEndDate') ? document.getElementById('wizBookEndDate').value.replace(/-/g, '.') : '';

  var books = allBooks.filter(function(b) {
    var matchStart = !startDateVal || (b.date >= startDateVal);
    var matchEnd = !endDateVal || (b.date <= endDateVal);
    return matchStart && matchEnd;
  });

  currentWizardFilteredBooks = books;
  wizardSelectedBookKeys = [];
  wizardSelectedBooks = [];

  if (books.length === 0) {
    container.innerHTML = '<div class="text-center py-4 text-muted" style="font-size:13px;">선택하신 일자 범위 내에 완독 및 인증된 도서가 없습니다.</div>';
    updateWizardBookCountBadge();
    return;
  }

  books.forEach(function(b, idx) {
    var key = b.uniqueKey || ('book_' + idx);
    wizardSelectedBookKeys.push(key);
    wizardSelectedBooks.push(b.title);

    var item = document.createElement('div');
    item.className = 'wiz-book-item selected';
    item.id = 'wizBookItem_' + idx;

    var dateDisplay = b.date + (b.time ? ' <span style="font-size: 11px; color: #64748b; font-weight: 500;">' + b.time + '</span>' : '');

    item.innerHTML = 
      '<div class="custom-control custom-checkbox" onclick="event.stopPropagation();" style="margin-right: 14px;">' +
        '<input type="checkbox" class="custom-control-input wiz-book-chk" id="wizBookChk_' + idx + '" checked onchange="toggleWizardBook(' + idx + ', this.checked)">' +
        '<label class="custom-control-label" for="wizBookChk_' + idx + '"></label>' +
      '</div>' +
      '<img src="' + (b.cover || 'resources/images/book_default.svg') + '" alt="" style="width: 42px; height: 58px; border-radius: 6px; object-fit: cover; margin-right: 16px; border: 1px solid #e5e0d8; box-shadow: 0 1px 3px rgba(0,0,0,0.06);" onerror="this.onerror=null; this.src=\'resources/images/book_default.svg\';">' +
      '<div style="flex: 1; min-width: 0;">' +
        '<div class="font-weight-bold text-truncate" style="font-size: 14px; color: var(--text-main); line-height: 1.4;">' + b.title + '</div>' +
        '<div class="text-muted" style="font-size: 12px; margin-top: 3px;">' + b.pub + ' &middot; 완독일: <strong style="color: var(--text-main);">' + dateDisplay + '</strong></div>' +
      '</div>' +
      '<div class="text-right" style="margin-left: 14px; display: flex; align-items: center; gap: 8px;">' +
        '<span class="badge-soft badge-soft-success font-weight-bold" style="font-size: 12px; padding: 4px 10px; border-radius: 6px;">' + b.score + '</span>' +
        '<span class="badge-soft badge-soft-neutral font-weight-bold" style="font-size: 12px; padding: 4px 10px; border-radius: 6px;">' + b.sheet + '</span>' +
      '</div>';

    item.onclick = function() {
      var chk = document.getElementById('wizBookChk_' + idx);
      if (chk) {
        chk.checked = !chk.checked;
        toggleWizardBook(idx, chk.checked);
      }
    };

    container.appendChild(item);
  });

  updateWizardBookCountBadge();
}

function toggleWizardBook(idx, isChecked) {
  var b = currentWizardFilteredBooks[idx];
  if (!b) return;
  var key = b.uniqueKey || ('book_' + idx);
  var item = document.getElementById('wizBookItem_' + idx);

  if (isChecked) {
    if (item) item.classList.add('selected');
    if (wizardSelectedBookKeys.indexOf(key) === -1) {
      wizardSelectedBookKeys.push(key);
    }
  } else {
    if (item) item.classList.remove('selected');
    wizardSelectedBookKeys = wizardSelectedBookKeys.filter(function(k) { return k !== key; });
  }

  // wizardSelectedBooks 동기화
  syncWizardSelectedBooks();
  updateWizardBookCountBadge();
}

function syncWizardSelectedBooks() {
  var selectedObjs = (currentWizardFilteredBooks || []).filter(function(b) {
    return wizardSelectedBookKeys.indexOf(b.uniqueKey) !== -1;
  });
  wizardSelectedBooks = selectedObjs.map(function(b) { return b.title; });
}

function onWizardSelectAllBooks(checked) {
  var checkboxes = document.querySelectorAll('.wiz-book-chk');
  wizardSelectedBookKeys = [];
  wizardSelectedBooks = [];

  checkboxes.forEach(function(chk, idx) {
    chk.checked = checked;
    var item = document.getElementById('wizBookItem_' + idx);
    if (item) {
      if (checked) item.classList.add('selected');
      else item.classList.remove('selected');
    }
  });

  if (checked && Array.isArray(currentWizardFilteredBooks)) {
    wizardSelectedBookKeys = currentWizardFilteredBooks.map(function(b, idx) { return b.uniqueKey || ('book_' + idx); });
    wizardSelectedBooks = currentWizardFilteredBooks.map(function(b) { return b.title; });
  }

  updateWizardBookCountBadge();
}

function updateWizardBookCountBadge() {
  var badge = document.getElementById('wizSelectedBookBadge');
  if (badge) {
    badge.innerText = '총 ' + wizardSelectedBookKeys.length + '권 선택됨';
  }
  var allChk = document.getElementById('wizSelectAllBooks');
  var allCheckboxes = document.querySelectorAll('.wiz-book-chk');
  if (allChk) {
    allChk.checked = allCheckboxes.length > 0 && wizardSelectedBookKeys.length === allCheckboxes.length;
  }
}

// 3단계 원장 총평 템플릿
// ==============================================================
// 포트폴리오 생성 마법사 세부 옵션 & 완료 로직
// ==============================================================

function applyWizardTemplate(type) {
  var commentInput = document.getElementById('wizReportComment');
  if (!commentInput) return;
  var std = studentDataList.find(function(s) { return s.id === wizardSelectedStudentId; });
  var name = std ? std.name : '해당 학생';

  if (type === 'habit' || type === 'growth') {
    commentInput.value = name + ' 학생은 정해진 독서 계획을 성실하게 실천하며, 책 읽기에서 북퀴즈 완수까지 훌륭한 자기주도적 독서 루틴을 확립했습니다. 꾸준함이 가장 큰 힘입니다.';
    showAcademyToast('[성실 루틴형] 지도교사 총평 템플릿이 적용되었습니다.');
  } else if (type === 'comprehension' || type === 'excellent') {
    commentInput.value = name + ' 학생은 책의 중심 문맥과 등장인물의 선택을 입체적으로 짚어내며, 북퀴즈에서도 흔들림 없는 높은 이해도와 정밀한 분석력을 보여주었습니다.';
    showAcademyToast('[문해 탐구형] 지도교사 총평 템플릿이 적용되었습니다.');
  } else if (type === 'variety' || type === 'literacy') {
    commentInput.value = name + ' 학생은 문학과 인문 등 다양한 주제의 도서를 주도적으로 탐색하며 풍부한 지적 호기심과 균형 잡힌 독서 안목을 완성해가고 있습니다.';
    showAcademyToast('[다양성 확장형] 지도교사 총평 템플릿이 적용되었습니다.');
  }
}

// 4단계 포트폴리오 발급 완료 및 데이터 반영
// 카카오톡 즉시 발송 옵션 제거: 기본 상태 '카톡 발송하기' (미발송) -> 목록에서 원클릭 발송
var portfolioCreateSaving = false;
async function finishPortfolioCreate() {
  if (portfolioCreateSaving) return;
  var std = studentDataList.find(function(s) { return s.id === wizardSelectedStudentId; });
  var title = (document.getElementById('wizReportTitle') ? document.getElementById('wizReportTitle').value : '').trim() || ((std ? '[' + std.name + '] ' : '') + '2026년 3분기 독서 포트폴리오');
  var period = document.getElementById('wizReportPeriod') ? document.getElementById('wizReportPeriod').value.trim() : '2026년 3분기 (7~9월)';
  var comment = (document.getElementById('wizReportComment') ? document.getElementById('wizReportComment').value : '').trim();

  if (window.NanoPortal && NanoPortal.remote) {
    if (!std || !std.serverId) { showAcademyToast('학생 정보를 새로고침한 뒤 다시 시도해 주세요.'); return; }
    var startDateInput = document.getElementById('wizBookStartDate');
    var endDateInput = document.getElementById('wizBookEndDate');
    var fromDate = startDateInput && startDateInput.value ? startDateInput.value : '';
    var toDate = endDateInput && endDateInput.value ? endDateInput.value : '';
    if (!fromDate || !toDate) {
      var quarter = period.match(/(\d{4})년\s*([1-4])분기/);
      if (quarter) {
        var year = Number(quarter[1]);
        var startMonth = (Number(quarter[2]) - 1) * 3;
        fromDate = new Date(Date.UTC(year, startMonth, 1)).toISOString().slice(0, 10);
        toDate = new Date(Date.UTC(year, startMonth + 3, 0)).toISOString().slice(0, 10);
      } else {
        var today = new Date();
        fromDate = new Date(today.getFullYear(), 0, 1).toISOString().slice(0, 10);
        toDate = new Date(Date.UTC(today.getFullYear(), today.getMonth() + 1, 0)).toISOString().slice(0, 10);
      }
    }
    var selectedBookObjects = (currentWizardFilteredBooks || []).filter(function(b) {
      return wizardSelectedBookKeys.indexOf(b.uniqueKey) !== -1;
    });
    var createButton = document.getElementById('wizBtnNext');
    var createButtonHtml = createButton ? createButton.innerHTML : '';
    portfolioCreateSaving = true;
    if (createButton) { createButton.disabled = true; createButton.textContent = '포트폴리오 저장 및 AI 분석 중…'; }
    var savedPortfolioId = '';
    try {
      var savedPortfolio = await NanoPortal.savePortfolio({
        memberId: std.serverId,
        from: fromDate,
        to: toDate,
        title: title,
        selectedTitles: selectedBookObjects.map(function(b) { return b.title; }),
        selectedAttemptIds: selectedBookObjects.map(function(b) { return b.logId; }).filter(Boolean),
        comment: comment
      }, currentAcademyInfo.id);
      savedPortfolioId = savedPortfolio.id;
      lastCreatedPortfolioId = savedPortfolioId;
      var aiError = '';
      try {
        await NanoPortal.generatePortfolioAI(savedPortfolioId);
      } catch (error) {
        aiError = error.message;
      }
      await NanoPortal.refreshPortfolios();
      var createdPortfolio = portfolioList.find(function(item) { return item.id === savedPortfolioId; });
      if (aiError && portfolioDataMap[savedPortfolioId]) {
        portfolioDataMap[savedPortfolioId]._aiRequested = true;
        portfolioDataMap[savedPortfolioId]._aiError = aiError;
      }
      if (document.getElementById('wizDonePfId')) document.getElementById('wizDonePfId').innerText = lastCreatedPortfolioId || '발급 완료';
      if (document.getElementById('wizDoneStudentName')) document.getElementById('wizDoneStudentName').innerText = std.name + ' (' + std.grade + ' · ' + std.classGroup + ')';
      if (document.getElementById('wizDoneReportTitle')) document.getElementById('wizDoneReportTitle').innerText = createdPortfolio ? createdPortfolio.title : title;
      if (document.getElementById('wizDoneBookCount')) document.getElementById('wizDoneBookCount').innerText = '총 ' + (createdPortfolio ? createdPortfolio.bookCount : wizardSelectedBooks.length) + '권';
      goToWizardStep(4);
      showAcademyToast(aiError ? '포트폴리오는 저장되었습니다. AI 분석은 상세 화면에서 다시 시도해 주세요: ' + aiError : '[' + std.name + '] 학생의 포트폴리오와 AI 분석이 저장되었습니다.');
      return;
    } catch (error) {
      if (savedPortfolioId) {
        goToWizardStep(4);
        if (document.getElementById('wizDonePfId')) document.getElementById('wizDonePfId').innerText = savedPortfolioId;
        showAcademyToast('포트폴리오는 저장되었습니다. 목록을 새로고침해 주세요: ' + error.message);
      } else {
        showAcademyToast('포트폴리오를 발급하지 못했습니다: ' + error.message);
      }
      return;
    } finally {
      portfolioCreateSaving = false;
      if (createButton) { createButton.disabled = false; createButton.innerHTML = createButtonHtml; }
    }
  }

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

  var selectedBookObjects = (currentWizardFilteredBooks || []).filter(function(b) {
    return wizardSelectedBookKeys.indexOf(b.uniqueKey) !== -1;
  });

  var bookCount = selectedBookObjects.length;
  var booksSummary = selectedBookObjects.length > 1 
    ? selectedBookObjects[0].title + ' 외 ' + (selectedBookObjects.length - 1) + '권'
    : (selectedBookObjects.length === 1 ? selectedBookObjects[0].title : '완독 도서');

  var now = new Date();
  var hh = String(now.getHours()).padStart(2, '0');
  var min = String(now.getMinutes()).padStart(2, '0');
  var formattedIssueDate = now.toISOString().split('T')[0].replace(/-/g, '.') + ' ' + hh + ':' + min;

  var stdAvgRounded = (std && std.quizAvg != null && std.quizAvg !== '-' && !isNaN(parseFloat(std.quizAvg))) ? Math.round(parseFloat(std.quizAvg)) : 95;

  // 신규 발급: 카톡 발송 전 상태 ('카톡 발송하기' 버튼 표시)
  var newPf = {
    id: newPfId,
    studentId: wizardSelectedStudentId,
    studentName: std ? std.name : '김민준',
    school: std ? std.school : '나노초등학교',
    grade: std ? std.grade : '초등 5학년',
    classGroup: std ? std.classGroup : '지혜반',
    title: title,
    period: period,
    bookCount: bookCount,
    booksSummary: booksSummary,
    quizAvg: stdAvgRounded + '점',
    issueDate: formattedIssueDate,
    status: '카톡 발송하기',
    kakaoSent: false
  };

  portfolioList.unshift(newPf);

  // 학생별 포트폴리오 데이터 맵 갱신
  if (portfolioDataMap[wizardSelectedStudentId]) {
    portfolioDataMap[wizardSelectedStudentId].teacherNote = comment;
    if (selectedBookObjects.length > 0) {
      portfolioDataMap[wizardSelectedStudentId].books = selectedBookObjects;
      portfolioDataMap[wizardSelectedStudentId].bookCount = selectedBookObjects.length;
    }
  } else {
    portfolioDataMap[wizardSelectedStudentId] = {
      name: std ? std.name : '학생',
      school: std ? (std.school + ' ' + std.grade) : '초등학교',
      classGroup: std ? std.classGroup : '반',
      teacher: std ? std.teacher : '박선우 지도교사',
      level: std ? std.level : '초등 심화 Lv 5',
      bookCount: bookCount,
      quizAvg: stdAvgRounded,
      genreDist: { '문학/성장': 50, '인문/철학': 25, '사회/과학': 25 },
      tags: ['#성장소설', '#독서루틴', '#인물공감', '#지적호기심'],
      books: selectedBookObjects.length > 0 ? selectedBookObjects : [
        { cover: 'assets/covers/cover_1001.jpg', title: wizardSelectedBooks[0] || '어린 왕자', pub: '열린책들', date: '2026.09.07', score: '95점', sheet: '우수 완결', comment: '주제 의식을 바르게 파악하고 성실히 완독함.' }
      ],
      teacherNote: comment
    };
  }

  // Step 4 완료 화면 요소 업데이트
  if (document.getElementById('wizDonePfId')) document.getElementById('wizDonePfId').innerText = newPfId;
  if (document.getElementById('wizDoneStudentName')) document.getElementById('wizDoneStudentName').innerText = (std ? std.name : '학생') + ' (' + (std ? std.grade : '') + ' · ' + (std ? std.classGroup : '') + ')';
  if (document.getElementById('wizDoneReportTitle')) document.getElementById('wizDoneReportTitle').innerText = title;
  if (document.getElementById('wizDoneBookCount')) document.getElementById('wizDoneBookCount').innerText = '총 ' + bookCount + '권 (' + booksSummary + ')';
  if (document.getElementById('wizDoneKakaoStatus')) {
    document.getElementById('wizDoneKakaoStatus').innerHTML = 
      '<span class="badge font-weight-bold" style="background:#FEE500; color:#3C1E1E; padding:4px 10px; border-radius:6px; font-size:12px;">' +
      '<i class="fa-solid fa-comment mr-1"></i>카톡 발송 대기 (목록에서 원클릭 발송 가능)' +
      '</span>';
  }

  renderPortfolioTable(portfolioList);
  goToWizardStep(4);
  showAcademyToast('새 포트폴리오 [' + newPfId + ']가 생성되었습니다. 목록에서 카톡 발송이 가능합니다.');
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
  var imgEl = document.getElementById('zoomCoverImg');
  if (imgEl) imgEl.src = imgSrc || DEFAULT_BOOK_COVER;
  var titleEl = document.getElementById('zoomBookTitle');
  if (titleEl) titleEl.innerText = title || '도서 표지';
  var infoEl = document.getElementById('zoomBookInfo');
  if (infoEl) infoEl.innerText = info || '';

  if (window.jQuery && typeof $('#coverZoomModal').modal === 'function') {
    $('#coverZoomModal').modal('show');
  } else {
    showModalVanilla('coverZoomModal');
  }
}

// 도서 번호 기준 안전한 표지 모달 호출 (따옴표 깨짐 방지)
function openAcademyBookCoverModal(bookId) {
  var b = (academyBookList || []).find(function(item) {
    return String(item.id || item.bookNo) === String(bookId);
  });
  if (!b) return;
  var coverImg = normalizeBookCoverUrl(b.cover);
  var title = b.title || '도서 표지';
  var info = (b.publisher || '') + (b.author ? (' · ' + b.author) : '');
  openCoverModal(coverImg, title, info);
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
      showAcademyToast('답지가 클립보드에 복사되었습니다.');
    });
  } else {
    showAcademyToast('답지가 복사되었습니다.');
  }
}

// ============================================================== 
// 7. 도서 및 북퀴즈 관리 & 엑셀 대량 등록 & 보안 PDF 뷰어 모듈
// -> public_html/js/admin_books.js 로 분리 완료
// ==============================================================
// ==============================================================
// 8. 학원 관리자 내 정보 관리 -> public_html/js/admin_myinfo.js 로 분리 완료
// ==============================================================

// 초기화
document.addEventListener('DOMContentLoaded', function() {
  // 가맹 학원 전환 드롭다운 초기화 (Neon DB 143개 가맹점)
  initHeaderFranchiseSelector();

  // 로그인 세션 확인 및 헤더/권한별 메뉴(선생님 로그인 시 선생님 표기 및 선생님 관리 메뉴 숨김) 동기화
  updateHeaderUserInfo();

  updateAllStudentCounts();
  updateDeletedStudentBadge();
  updateClassSelectOptions();
  renderQuizTabs();
  loadCurrentQuizForm();
  renderStudentTable(studentDataList);
  syncOwnedBooksState();
  filterAcademyBooks();
  initPortfolioOptions();
  if (studentDataList.length > 0) {
    onPortfolioStudentChange(studentDataList[0].id);
  }
  renderPortfolioTable(portfolioList);
  renderTeacherTable();
  renderLearningTable();
  renderAssignmentTable();
  renderAcademyDispatchTable();
  renderAdminRankingView();
  syncCurrentAcademyPlan(true);
  renderAcademyPaymentTable();

  // 본사 시스템 공지 팝업 점검 및 상단 배지 업데이트
  updateAcademyNoticeBadge();
  setTimeout(checkAcademyNoticePopups, 500);

  // 검색창 자동완성을 제한하되 정상적인 계정명 검색은 허용합니다.
  clearAdminSearchAutofill();
});

// 다른 화면의 초기화 오류가 메뉴 복원을 막지 않도록 별도로 실행합니다.
document.addEventListener('DOMContentLoaded', restoreAdminActiveTab);

// 기존 함수 호출을 유지하면서 검색창 속성만 설정합니다.
function clearAdminSearchAutofill() {
  var searchConfigs = [
    { id: 'searchStudentInput', fn: typeof filterStudents === 'function' ? filterStudents : null },
    { id: 'searchAcadBookInput', fn: typeof filterAcademyBooks === 'function' ? filterAcademyBooks : null },
    { id: 'searchPortfolioInput', fn: typeof filterPortfolioList === 'function' ? filterPortfolioList : null },
    { id: 'searchAssignStudentInput', fn: typeof filterStudentAssignments === 'function' ? filterStudentAssignments : null },
    { id: 'learningSearchInput', fn: null },
    { id: 'indivStudentSearchInput', fn: typeof filterIndivModalStudents === 'function' ? filterIndivModalStudents : null },
    { id: 'indivBookSearchInput', fn: typeof filterIndivBookCatalog === 'function' ? filterIndivBookCatalog : null },
    { id: 'classNewBookSearchInput', fn: typeof filterClassNewBookCatalog === 'function' ? filterClassNewBookCatalog : null }
  ];

  searchConfigs.forEach(function(item) {
    var el = document.getElementById(item.id);
    // 다른 창을 보거나 메뉴를 바꿔도 사용자가 입력한 검색 조건을 유지합니다.
    if (el) el.setAttribute('autocomplete', 'off');
  });
}

window.addEventListener('pageshow', function() {
  clearAdminSearchAutofill();
});

document.addEventListener('visibilitychange', function() {
  if (document.visibilityState === 'visible') {
    clearAdminSearchAutofill();
    // 브라우저 탭이 다시 활성화되면 현재 학원 관리 탭 데이터를 즉시 재갱신
    var activeNavBtn = document.querySelector('.nav-link.active[id^="btn-nav-"]');
    if (activeNavBtn) {
      var currentTab = activeNavBtn.id.replace('btn-nav-', '');
      switchTab(currentTab);
    }
  }
});

// ==============================================================
// 8. 결제 및 구독 관리 모듈 (Academy Payment & Subscription)
// -> public_html/js/admin_payment.js 로 분리 완료
// ==============================================================
// ==============================================================
// 9. 본사 시스템 공지사항 모듈 -> public_html/js/admin_notices.js 로 분리 완료
// ==============================================================
// ==============================================================
// 10. 나노시트 첨삭 AI 모듈 -> public_html/js/admin_worksheet_ai.js 로 분리 완료
// ==============================================================
