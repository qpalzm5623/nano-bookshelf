
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
// 3. 회원 관리 (원생 + 선생님) 데이터 & 로직 (LocalStorage 영구 연동)
// ==============================================================
// 3. 회원 관리 (원생 + 선생님) 데이터 & 로직 (학원별 세션 및 LocalStorage 분리 연동)
// ==============================================================
// 3. 회원 관리 (원생 + 선생님) 데이터 & 로직 (학원별 세션 및 LocalStorage 분리 연동)
// ==============================================================

// 구형 데모 로컬스토리지 캐시 영구 삭제 및 버전 기반 강제 초기화
var ADMIN_STORAGE_VERSION = '20261007_V9_REAL';
try {
  if (localStorage.getItem('NANO_ADMIN_DATA_VER') !== ADMIN_STORAGE_VERSION) {
    for (var i = localStorage.length - 1; i >= 0; i--) {
      var key = localStorage.key(i);
      if (key && (key.startsWith('NANO_ACADEMY_STUDENTS') || key.startsWith('NANO_ACADEMY_TEACHERS') || key.startsWith('NANO_CLASSES') || key.startsWith('NANO_LEARNING_LOGS'))) {
        localStorage.removeItem(key);
      }
    }
    localStorage.removeItem('NANO_LEARNING_LOGS');
    localStorage.setItem('NANO_ADMIN_DATA_VER', ADMIN_STORAGE_VERSION);
  }
} catch(e) {}

// 현재 로그인된 학원 세션 정보 감지 (원장님 / 관리자 계정 - Neon DB 실데이터 연동)
var currentAcademyInfo = (function() {
  var auth = {};
  try { auth = JSON.parse(sessionStorage.getItem('nano_auth_user') || '{}'); } catch(e) {}
  var id = auth.academyId || ((auth.id === 'admin01' || auth.id === 'admin') ? 'DEMO-ACADEMY' : '');
  if (auth.role === 'master') id = localStorage.getItem('NANO_CURRENT_SELECTED_ACADEMY_ID') || id;
  var fList = Array.isArray(window.MIGRATED_FRANCHISES) ? window.MIGRATED_FRANCHISES.slice() : [];
  if (!window.NANO_SERVER_DATA) {
    try {
      var rawLocal = localStorage.getItem('NANO_MASTER_FRANCHISE_LIST');
      if (rawLocal) {
        var parsedLocal = JSON.parse(rawLocal);
        if (Array.isArray(parsedLocal) && parsedLocal.length > 0) fList = parsedLocal;
      }
    } catch(e) {}
  }
  var franchise = fList.find(function(f) {
    return (id && f.id === id) ||
           (auth.academyName && f.name === auth.academyName) ||
           (auth.id && f.adminId === auth.id);
  }) || {};
  return {
    id: franchise.id || id,
    name: franchise.name || auth.academyName || (id === 'DEMO-ACADEMY' ? '체험 학원' : '학원 미선택'),
    director: franchise.director || auth.name || '',
    maxStudents: Number(franchise.maxStudents) || (id === 'DEMO-ACADEMY' ? 50 : 50),
    plan: franchise.plan || 'Standard',
    monthlyFee: franchise.monthlyFee || '',
    joinDate: franchise.joinDate || '',
    startDate: franchise.startDate || franchise.contractDate || franchise.joinDate || '2025-01-01',
    endDate: franchise.endDate || franchise.expireDate || '2026-12-31',
    contractDate: franchise.contractDate || franchise.startDate || franchise.joinDate || '2025-01-01',
    expireDate: franchise.expireDate || franchise.endDate || '2026-12-31',
    bizNumber: franchise.bizNumber || '',
    email: franchise.email || '',
    phone: franchise.phone || '',
    adminId: franchise.adminId || auth.id || '',
    region: franchise.region || franchise.address || '',
    address: franchise.address || franchise.region || '',
    postcode: franchise.postcode || '',
    addressDetail: franchise.addressDetail || '',
    status: franchise.status || 'ACTIVE',
    isDemo: id === 'DEMO-ACADEMY'
  };
})();

var STORAGE_KEY_CLASSES = 'NANO_CLASSES_' + currentAcademyInfo.id;
var STORAGE_KEY_STUDENTS = 'NANO_ACADEMY_STUDENTS_' + currentAcademyInfo.id;
var STORAGE_KEY_TEACHERS = 'NANO_ACADEMY_TEACHERS_' + currentAcademyInfo.id;
var STORAGE_KEY_DELETED_STUDENTS = 'NANO_ACADEMY_DELETED_STUDENTS_' + currentAcademyInfo.id;

var defaultStudentDataList = [
  { id: 'kty4290', name: '강태양', gender: '남', password: '••••', school: '개포초등학교', grade: '초등 3학년', classGroup: '나노반', status: '승인', level: '초등 정규 Lv 3', bookCount: 28, quizAvg: '94.5', parentName: '강태양 학부모', phone: '010-4290-8812', parentEmail: 'kty4290@kakao.com', reportYn: true, lastDate: '2026.09.28', createdAt: '2026.03.02', teacher: '지도교사', memo: '실제 DB 연동 원생' },
  { id: 'lhj5017', name: '이현진', gender: '여', password: '••••', school: '개포초등학교', grade: '초등 1학년', classGroup: '나노반', status: '승인', level: '초등 정규 Lv 1', bookCount: 19, quizAvg: '92.0', parentName: '이현진 학부모', phone: '010-5017-3482', parentEmail: 'lhj5017@kakao.com', reportYn: true, lastDate: '2026.09.27', createdAt: '2026.03.10', teacher: '지도교사', memo: '실제 DB 연동 원생' },
  { id: 'jjw7681', name: '조진우', gender: '남', password: '••••', school: '개포초등학교', grade: '초등 2학년', classGroup: '나노반', status: '승인', level: '초등 정규 Lv 2', bookCount: 22, quizAvg: '95.1', parentName: '조진우 학부모', phone: '010-7681-9920', parentEmail: 'jjw7681@kakao.com', reportYn: true, lastDate: '2026.09.25', createdAt: '2026.03.15', teacher: '지도교사', memo: '실제 DB 연동 원생' }
];

var defaultAcademyClassList = [
  { id: 'CLS01', name: '나노반', grade: '초등/중등 정규', teacher: '지도교사', desc: '정규 독서논술 및 문해력 집중 훈련반' }
];

var defaultTeacherDataList = [];

// LocalStorage 및 Neon DB 실데이터 연동 헬퍼 함수
function loadAcademyClassesFromStorage() {
  try {
    var stored = localStorage.getItem(STORAGE_KEY_CLASSES);
    if (stored !== null) {
      var parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.warn('학급 데이터 로드 실패, 기본값 사용:', e);
  }

  if (window.NANO_SERVER_DATA) {
    var sClasses = (window.NANO_SERVER_CLASSES || []).filter(function(c) { return c.academyId === currentAcademyInfo.id; });
    if (sClasses.length > 0) return sClasses;
  }

  // Neon DB 실데이터 회원들의 className에서 해당 학원의 실제 학급 목록 추출
  if (typeof window !== 'undefined' && Array.isArray(window.MIGRATED_MEMBERS)) {
    var acadMembers = window.MIGRATED_MEMBERS.filter(function(m) {
      return NanoPreviewData.belongsToAcademy(m, currentAcademyInfo) && m.role === 'STUDENT';
    });

    var classSet = [];
    acadMembers.forEach(function(s) {
      var cName = (s.className && s.className !== '-' && s.className !== '미지정') ? s.className.trim() : '나노반';
      if (classSet.indexOf(cName) === -1) {
        classSet.push(cName);
      }
    });

    if (classSet.length > 0) {
      var extractedClasses = classSet.map(function(cName, idx) {
        return {
          id: 'CLS' + String(idx + 1).padStart(2, '0'),
          name: cName,
          grade: '초등/중등 정규',
          teacher: '지도교사',
          desc: currentAcademyInfo.name + ' ' + cName + ' 정규 독서논술반'
        };
      });
      try { localStorage.setItem(STORAGE_KEY_CLASSES, JSON.stringify(extractedClasses)); } catch (e) {}
      return extractedClasses;
    }
  }

  return [];
}

function saveAcademyClassesToStorage() {
  try {
    localStorage.setItem(STORAGE_KEY_CLASSES, JSON.stringify(academyClassList));
  } catch (e) {}
}

function loadStudentsFromStorage() {
  try {
    var raw = localStorage.getItem(STORAGE_KEY_STUDENTS);
    if (raw !== null) {
      try {
        var parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {}
    }
    // 스토리지에 저장된 원생 데이터가 없는 초기 상태일 때만 MIGRATED_MEMBERS에서 추출
    var initialList = (window.MIGRATED_MEMBERS || []).filter(function(m) {
      return NanoPreviewData.belongsToAcademy(m, currentAcademyInfo) && m.role === 'STUDENT';
    }).map(function(m) {
      return { id: m.username, serverId: m.serverId, updatedAt: m.updatedAt, username: m.username, classGroupId: m.classGroupId || null, name: m.name, gender: m.gender || '미등록', password: '••••',
        school: m.school || '미등록', grade: m.grade || '미등록', classGroup: m.className || '미지정',
        status: m.status === 'APPROVED' ? '승인' : (m.status === 'WITHDRAWN' ? '퇴원' : '미승인'),
        level: m.level || '미설정', bookCount: Number(m.bookCount) || 0, quizAvg: (m.quizAvg == null || isNaN(Number(m.quizAvg))) ? '-' : Math.round(Number(m.quizAvg)),
        parentName: m.parentName || '', phone: m.parentPhone || '', parentEmail: m.parentEmail || '',
        reportYn: m.reportYn === true, lastDate: m.lastLogin || '-', createdAt: m.createdAt || '-',
        teacher: m.teacherName || '미지정', memo: m.memo || '', points: Number(m.points) || 0, characterId: m.characterId || null };
    });
    // 최초 1회 로컬 스토리지에 캐시 보관하여 새로고침 시에도 지속 보장
    if (initialList.length > 0) {
      try { localStorage.setItem(STORAGE_KEY_STUDENTS, JSON.stringify(initialList)); } catch (e) {}
    }
    return initialList;
  } catch(e) { console.warn('원생 목록 조회 실패:', e); return []; }
}

function saveStudentsToStorage() {
  try {
    localStorage.setItem(STORAGE_KEY_STUDENTS, JSON.stringify(studentDataList));
    syncFranchiseStudentCount(studentDataList.length);
  } catch (e) {
    console.warn('원생 데이터 로컬 스토리지 저장 실패:', e);
  }
}

function syncFranchiseStudentCount(count) {
  try {
    var rawFranchises = localStorage.getItem('NANO_MASTER_FRANCHISE_LIST');
    if (rawFranchises) {
      var fList = JSON.parse(rawFranchises);
      if (Array.isArray(fList)) {
        var targetF = fList.find(function(f) {
          return f.id === currentAcademyInfo.id || f.name === currentAcademyInfo.name;
        });
        if (targetF) {
          targetF.currentStudents = count;
          localStorage.setItem('NANO_MASTER_FRANCHISE_LIST', JSON.stringify(fList));
        }
      }
    }
  } catch (e) {}
}

// 선생님 관리에서 학원장(원장님) 제외 여부 판정 헬퍼 (철저한 원장 계정 필터링)
function isAcademyDirector(t) {
  if (!t) return false;
  var role = String(t.role || '').toUpperCase().trim();
  if (role === 'DIRECTOR' || role === '학원 원장' || role === '원장' || role === '학원장') return true;
  var username = String(t.username || t.id || '').toLowerCase().trim();
  var adminId = String(currentAcademyInfo.adminId || '').toLowerCase().trim();
  if (adminId && username === adminId) return true;
  if (username.startsWith('director_') || username === 'lookadmin') return true;

  var dirName = String(currentAcademyInfo.director || '').replace(/원장|선생님|교사/g, '').trim().toLowerCase();
  var tName = String(t.name || '').replace(/원장|선생님|교사/g, '').trim().toLowerCase();
  if (dirName && tName && dirName === tName) return true;
  if (String(t.name || '').indexOf('원장') !== -1) return true;
  return false;
}

function loadTeachersFromStorage() {
  try {
    var rawTeachers = localStorage.getItem(STORAGE_KEY_TEACHERS);
    if (rawTeachers !== null) {
      try {
        var parsed = JSON.parse(rawTeachers);
        if (Array.isArray(parsed)) {
          return parsed.filter(function(t) { return !isAcademyDirector(t); });
        }
      } catch (e) {}
    }
    var initialTeachers = (window.MIGRATED_MEMBERS || []).filter(function(m) {
      return NanoPreviewData.belongsToAcademy(m, currentAcademyInfo) && m.role === 'TEACHER' && !isAcademyDirector(m);
    }).map(function(m) { return { id: m.username, serverId: m.serverId, updatedAt: m.updatedAt, username: m.username, name: m.name, password: '••••',
      role: '지도교사', classes: m.className || '미지정',
      studentCount: 0, phone: m.phone || '', joinDate: m.createdAt || '-' }; });
    if (initialTeachers.length > 0) {
      try { localStorage.setItem(STORAGE_KEY_TEACHERS, JSON.stringify(initialTeachers)); } catch(e) {}
    }
    return initialTeachers;
  } catch(e) { console.warn('교사 목록 조회 실패:', e); return []; }
}

function saveTeachersToStorage() {
  try {
    var pureTeachers = (teacherDataList || []).filter(function(t) { return !isAcademyDirector(t); });
    localStorage.setItem(STORAGE_KEY_TEACHERS, JSON.stringify(pureTeachers));
  } catch (e) {}
}

// 가맹 학원 전환 함수 (드롭다운 선택 시 실행)
async function switchAcademyFranchise(acadId) {
  var auth = JSON.parse(sessionStorage.getItem('nano_auth_user') || '{}');
  if (auth.role !== 'master') { showAcademyToast('본사 관리자만 학원을 전환할 수 있습니다.'); return; }
  if (!acadId || typeof window === 'undefined' || !Array.isArray(window.MIGRATED_FRANCHISES)) return;
  var target = window.MIGRATED_FRANCHISES.find(function(f) { return f.id === acadId; });
  if (!target) return;

  localStorage.setItem('NANO_CURRENT_SELECTED_ACADEMY_ID', target.id);
  currentAcademyInfo.id = target.id;
  currentAcademyInfo.name = target.name;
  currentAcademyInfo.director = target.director;
  currentAcademyInfo.maxStudents = parseInt(target.maxStudents, 10) || 50;
  currentAcademyInfo.plan = target.plan || 'Standard';
  currentAcademyInfo.monthlyFee = target.monthlyFee || '';
  currentAcademyInfo.joinDate = target.joinDate || '';
  currentAcademyInfo.startDate = target.startDate || target.contractDate || target.joinDate || '2025-01-01';
  currentAcademyInfo.endDate = target.endDate || target.expireDate || '2026-12-31';
  currentAcademyInfo.contractDate = target.contractDate || target.startDate || target.joinDate || '2025-01-01';
  currentAcademyInfo.expireDate = target.expireDate || target.endDate || '2026-12-31';
  currentAcademyInfo.bizNumber = target.bizNumber || '';
  currentAcademyInfo.email = target.email || '';
  currentAcademyInfo.phone = target.phone;
  currentAcademyInfo.adminId = target.adminId;
  currentAcademyInfo.region = target.region;
  currentAcademyInfo.address = target.address || target.region || '';
  currentAcademyInfo.postcode = target.postcode || '';
  currentAcademyInfo.addressDetail = target.addressDetail || '';
  currentAcademyInfo.status = target.status || 'ACTIVE';
  currentAcademyInfo.isDemo = false;

  STORAGE_KEY_CLASSES = 'NANO_CLASSES_' + currentAcademyInfo.id;
  STORAGE_KEY_STUDENTS = 'NANO_ACADEMY_STUDENTS_' + currentAcademyInfo.id;
  STORAGE_KEY_TEACHERS = 'NANO_ACADEMY_TEACHERS_' + currentAcademyInfo.id;
  STORAGE_KEY_DELETED_STUDENTS = 'NANO_ACADEMY_DELETED_STUDENTS_' + currentAcademyInfo.id;

  try { var assignments = NanoPreviewData.readAssignments(currentAcademyInfo.id); studentAssignmentList = assignments.students; classAssignmentList = assignments.classes; assignmentLoadError = false; }
  catch(e) { studentAssignmentList = []; classAssignmentList = []; assignmentLoadError = true; }
  if (window.NanoPortal && NanoPortal.remote) {
    try { await Promise.all([NanoPortal.refreshLearning(), NanoPortal.refreshAssignments()]); }
    catch(e) { showAcademyToast(e.message); return; }
  }
  // 데이터 재로드
  studentDataList = loadStudentsFromStorage();
  teacherDataList = loadTeachersFromStorage();
  academyClassList = loadAcademyClassesFromStorage();
  deletedStudentList = loadDeletedStudentsFromStorage();
  if (window.NanoPortal && NanoPortal.remote) {
    try { await NanoPortal.refreshPortfolios(); }
    catch (error) { showAcademyToast('포트폴리오를 불러오지 못했습니다: ' + error.message); }
    academyDispatchLogs = (window.NANO_SERVER_DISPATCH || []).filter(function(item) { return item.academyId === currentAcademyInfo.id; });
    academyPaymentList = (window.NANO_SERVER_PAYMENTS || []).filter(function(item) { return item.academyId === currentAcademyInfo.id; });
  }

  // 헤더 및 권한별 메뉴 가시성 갱신
  updateHeaderUserInfo();

  updateAllStudentCounts();
  updateDeletedStudentBadge();
  updateClassSelectOptions();
  renderStudentTable(studentDataList);
  renderTeacherTable();
  syncOwnedBooksState();
  filterAcademyBooks();
  if (typeof renderLearningTable === 'function') {
    renderLearningTable();
  }
  if (typeof renderAcademyDispatchTable === 'function') renderAcademyDispatchTable();
  if (typeof renderAcademyPaymentTable === 'function') renderAcademyPaymentTable();

  showAcademyToast('[' + target.name + '] 학원으로 전환되었습니다. (재원생 ' + studentDataList.length + '명)');
}

// 상단 가맹 학원 전환 셀렉트박스 옵션 채우기 (실데이터 143개 가맹점)
function initHeaderFranchiseSelector() {
  var sel = document.getElementById('headerFranchiseSelector');
  if (!sel || typeof window === 'undefined' || !Array.isArray(window.MIGRATED_FRANCHISES)) return;
  sel.innerHTML = '';

  // 실제 원생 수 많은 운영 학원 우선 정렬
  var sortedFranchises = window.MIGRATED_FRANCHISES.slice().sort(function(a, b) {
    var aTest = a.name.startsWith('소속명');
    var bTest = b.name.startsWith('소속명');
    if (aTest !== bTest) return aTest ? 1 : -1;
    return (b.currentStudents || 0) - (a.currentStudents || 0);
  });

  sortedFranchises.forEach(function(f) {
    var opt = document.createElement('option');
    opt.value = f.id;
    opt.innerText = f.name + ' (' + (f.currentStudents || 0) + '명)';
    if (f.id === currentAcademyInfo.id || f.name === currentAcademyInfo.name) {
      opt.selected = true;
    }
    sel.appendChild(opt);
  });
}

// 삭제된 원생 7일 임시 보존 스토리지 관리 함수
function loadDeletedStudentsFromStorage() {
  try {
    var stored = localStorage.getItem(STORAGE_KEY_DELETED_STUDENTS);
    if (stored) {
      var parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        var todayStr = new Date().toISOString().split('T')[0];
        // 7일 만료 필터링: 만료일(expireAt)이 지난 항목은 자동 삭제
        var valid = parsed.filter(function(item) {
          return !item.expireAt || item.expireAt >= todayStr;
        });
        return valid;
      }
    }
  } catch (e) {
    console.warn('삭제된 원생 데이터 로드 실패:', e);
  }
  return [];
}

function saveDeletedStudentsToStorage() {
  try {
    localStorage.setItem(STORAGE_KEY_DELETED_STUDENTS, JSON.stringify(deletedStudentList));
  } catch (e) {
    console.error('삭제된 원생 데이터 저장 실패:', e);
  }
  updateDeletedStudentBadge();
}

function updateDeletedStudentBadge() {
  var badge = document.getElementById('deletedStudentCountBadge');
  if (badge) {
    badge.innerText = (deletedStudentList && Array.isArray(deletedStudentList)) ? deletedStudentList.length : 0;
  }
}

// 런타임 활성 데이터 (스토리지 데이터 우선)
var studentDataList = loadStudentsFromStorage();
var deletedStudentList = loadDeletedStudentsFromStorage();
var academyClassList = loadAcademyClassesFromStorage();
var teacherDataList = loadTeachersFromStorage();

// 신규 등록된 원생 하이라이트 트래킹 변수
var lastAddedStudentId = null;

// 가맹점 원생 통계 실시간 동기화 함수
function updateAllStudentCounts() {
  var currentTotal = studentDataList.length;
  var maxSlots = currentAcademyInfo.maxStudents || 50; // 계약 정원

  // 초등 / 중등 인원 계산
  var elemCount = 0;
  var midCount = 0;
  studentDataList.forEach(function(s) {
    if (s.grade && s.grade.indexOf('중등') !== -1) {
      midCount++;
    } else {
      elemCount++;
    }
  });

  // 1. 탭 버튼 배지 갱신
  var tabCountEl = document.getElementById('tabStudentCount');
  if (tabCountEl) tabCountEl.innerText = currentTotal;

  var tabTeacherEl = document.getElementById('tabTeacherCount');
  var activeTeachers = (teacherDataList || []).filter(function(t) { return !isAcademyDirector(t); });
  if (tabTeacherEl) tabTeacherEl.innerText = activeTeachers.length;

  // 2. 전체 재원생 통계 카드 갱신
  var statCountEl = document.getElementById('statStudentCount');
  if (statCountEl) statCountEl.innerText = currentTotal;
  var statBreakdownEl = document.getElementById('statStudentBreakdown');
  if (statBreakdownEl) {
    if (currentTotal === 0) {
      statBreakdownEl.innerHTML = '초등 0명 &middot; 중등 0명 (원생 등록 대기)';
    } else {
      statBreakdownEl.innerHTML = `초등 ${elemCount}명 &middot; 중등 ${midCount}명 (활동 중)`;
    }
  }

  // 3. 누적 완독 및 퀴즈 통계 갱신 (원생 목록 + 학습 기록 연동)
  var statBookEl = document.getElementById('statBookReadCount');
  var statBookDescEl = document.getElementById('statBookReadDesc');
  var statQuizEl = document.getElementById('statQuizPassRate');
  var statQuizDescEl = document.getElementById('statQuizDesc');

  if (currentTotal === 0) {
    if (statBookEl) statBookEl.innerText = '0';
    if (statBookDescEl) statBookDescEl.innerText = '완독 이력 없음';
    if (statQuizEl) statQuizEl.innerText = '0';
    if (statQuizDescEl) statQuizDescEl.innerHTML = '<span class="text-muted">북퀴즈 응시 데이터 없음</span>';
  } else {
    var loadedLogs = (typeof getLoadedLearningLogs === 'function') ? getLoadedLearningLogs() : [];
    var totalBooks = studentDataList.reduce(function(acc, s) { return acc + (parseInt(s.bookCount, 10) || 0); }, 0);
    if (loadedLogs.length > totalBooks) {
      var passedLogsCount = loadedLogs.filter(function(l) { return (Number(l.score) || 0) >= 60; }).length;
      if (passedLogsCount > totalBooks) totalBooks = passedLogsCount;
    }
    var avgQuiz = 0;
    var quizCount = 0;
    studentDataList.forEach(function(s) {
      var score = parseFloat(s.quizAvg);
      if (!isNaN(score) && score > 0) {
        avgQuiz += score;
        quizCount++;
      }
    });
    var avgQuizRounded = quizCount > 0 ? Math.round(avgQuiz / quizCount) : 0;
    var passRateVal = quizCount > 0 ? 100 : 0;
    if (loadedLogs.length > 0) {
      var passedCnt = loadedLogs.filter(function(l) { return (Number(l.score) || 0) >= 60; }).length;
      passRateVal = Math.round((passedCnt / loadedLogs.length) * 100);
      if (avgQuizRounded === 0) {
        avgQuizRounded = Math.round(loadedLogs.reduce(function(sum, l) { return sum + (Number(l.score) || 0); }, 0) / loadedLogs.length);
      }
    }
    var avgBooksPerStudent = currentTotal > 0 ? (totalBooks / currentTotal).toFixed(1) : '0.0';

    if (statBookEl) statBookEl.innerText = totalBooks.toLocaleString();
    if (statBookDescEl) statBookDescEl.innerText = `원생 1인당 평균 ${avgBooksPerStudent}권 완독`;
    if (statQuizEl) statQuizEl.innerText = passRateVal;
    if (statQuizDescEl) {
      statQuizDescEl.innerHTML = (quizCount > 0 || loadedLogs.length > 0)
        ? `<span class="text-success font-weight-600">평균 점수 ${avgQuizRounded}점 (통과율 ${passRateVal}%)</span>`
        : `<span class="text-muted">북퀴즈 응시 대기</span>`;
    }
  }

  // 4. 사이드바 하단 슬롯 카드 갱신
  var slotRate = maxSlots > 0 ? Math.round((currentTotal / maxSlots) * 100) : 0;
  var sidebarSlotEl = document.getElementById('sidebarSlotStatus');
  if (sidebarSlotEl) {
    var rateClass = currentTotal >= maxSlots ? 'text-danger font-weight-bold' : 'text-success font-weight-bold';
    sidebarSlotEl.innerHTML = `${currentTotal} / ${maxSlots}명 <small class="${rateClass}">(${slotRate}%)</small>`;
  }

  // 4-2. 결제 관리 탭 상단 3개 구독 현황 카드 및 STEP 1·2 요금제 카드 실시간 연동
  var paySlotUsageEl = document.getElementById('paymentStatSlotUsage');
  var paySlotRemainEl = document.getElementById('paymentStatSlotRemain');
  if (paySlotUsageEl) {
    var slotBadgeClass = slotRate >= 90 ? 'badge-soft-warn' : 'badge-soft-success';
    paySlotUsageEl.innerHTML = `${currentTotal} <small class="text-muted font-weight-normal" style="font-size: 14px;">/ ${maxSlots}명</small> <span class="badge-soft ${slotBadgeClass} ml-2" style="font-size: 11px; vertical-align: middle;">${slotRate}% 사용</span>`;
  }
  if (paySlotRemainEl) {
    var remainSlots = Math.max(0, maxSlots - currentTotal);
    paySlotRemainEl.innerHTML = `잔여 슬롯: <strong>${remainSlots}명</strong>`;
  }
  if (typeof syncCurrentAcademyPlan === 'function') {
    syncCurrentAcademyPlan(false);
  }

  // 5. 상단 글로벌 역할 전환 바 계약 상태 갱신
  var globalRoleSlotEl = document.getElementById('globalRoleSlotStatus');
  if (globalRoleSlotEl) {
    var statusText = currentTotal >= maxSlots ? '정원 마감' : '정상 운영';
    var statusClass = currentTotal >= maxSlots ? 'text-danger' : 'text-success';
    globalRoleSlotEl.innerHTML = `계약 상태: <strong class="${statusClass}">${statusText} (${currentTotal}/${maxSlots}명)</strong>`;
  }

  // 6. 모달 내부 슬롯 상태 갱신
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

  if (grade === '유치부' || grade === '미취학') {
    if (levelSelect) levelSelect.value = '초등 입문 Lv 1';
    if (classSelect) classSelect.value = '새싹반';
  } else if (grade === '초등 1학년') {
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
// ==============================================================
// 3-1. 학급(클래스) 관리 모달 & CRUD 로직 (담당교사 복수 지정 및 수정 모달 완비)
// ==============================================================
// ---- 학급 대상 학년 복수 선택 (체크박스) ----
var CLASS_GRADE_OPTIONS = ['유치부', '초등 1학년', '초등 2학년', '초등 3학년', '초등 4학년', '초등 5학년', '초등 6학년', '중등 1학년', '중등 2학년', '중등 3학년'];

// 기존에 저장된 묶음 표기(예: "초등 1~2학년")를 개별 학년 배열로 변환해 하위 호환 유지
function parseClassGrades(gradeStr) {
  var result = [];
  String(gradeStr || '').split(',').forEach(function(part) {
    var p = part.trim();
    if (!p) return;
    if (CLASS_GRADE_OPTIONS.indexOf(p) !== -1) { result.push(p); return; }
    if (p.indexOf('유치부') === 0 || p.indexOf('미취학') === 0) result.push('유치부');
    else if (p === '초등 1~2학년') result.push('초등 1학년', '초등 2학년');
    else if (p === '중등 전학년') result.push('중등 1학년', '중등 2학년', '중등 3학년');
  });
  return result;
}

function getCheckedClassGrades(cbClass) {
  return Array.from(document.querySelectorAll('.' + cbClass + ':checked')).map(function(cb) { return cb.value; });
}

function updateNewClassGradeLabel() {
  var labelEl = document.getElementById('newClassGradeLabel');
  if (!labelEl) return;
  var checked = getCheckedClassGrades('new-cls-grade-cb');
  if (checked.length === 0) {
    labelEl.innerText = '대상 학년 선택 (복수 가능)';
    labelEl.className = 'text-truncate text-muted';
  } else {
    labelEl.innerText = checked.length <= 2 ? checked.join(', ') : checked[0] + ' 외 ' + (checked.length - 1) + '개';
    labelEl.className = 'text-truncate font-weight-bold text-dark';
  }
}

function renderNewClassGradeDropdown() {
  var menu = document.getElementById('newClassGradeDropdownMenu');
  if (!menu) return;
  menu.innerHTML = '';
  CLASS_GRADE_OPTIONS.forEach(function(g, idx) {
    var item = document.createElement('div');
    item.className = 'form-check py-1 px-3 d-flex align-items-center';
    item.onclick = function(e) { e.stopPropagation(); }; // 체크 시 드롭다운이 닫히지 않게
    item.innerHTML = '<input class="form-check-input new-cls-grade-cb" type="checkbox" value="' + g + '" id="cb_new_g_' + idx + '" onchange="updateNewClassGradeLabel()">' +
      '<label class="form-check-label ml-2 mb-0" for="cb_new_g_' + idx + '" style="cursor:pointer; font-size:12.5px;">' + g + '</label>';
    menu.appendChild(item);
  });
  updateNewClassGradeLabel();
}

function renderEditClassGradeBox(gradeStr) {
  var box = document.getElementById('editClassGradeBox');
  if (!box) return;
  var selected = parseClassGrades(gradeStr);
  box.innerHTML = '';
  CLASS_GRADE_OPTIONS.forEach(function(g, idx) {
    var item = document.createElement('div');
    item.className = 'form-check mr-3 mb-1';
    item.style.minWidth = '110px';
    item.innerHTML = '<input class="form-check-input edit-cls-grade-cb" type="checkbox" value="' + g + '" id="cb_edit_g_' + idx + '"' + (selected.indexOf(g) !== -1 ? ' checked' : '') + '>' +
      '<label class="form-check-label" for="cb_edit_g_' + idx + '" style="cursor:pointer;">' + g + '</label>';
    box.appendChild(item);
  });
}

// 학급 생성/수정 시 지도교사 후보 목록 추출 (원장님 포함, 직책 수식어 제거 후 '이름 지도교사' 형식)
function getClassTeacherCandidates() {
  var list = [];
  var seen = {};

  // 1. 원장님 정보 (MIGRATED_MEMBERS 또는 currentAcademyInfo)
  var dirName = '';
  var dirUsername = currentAcademyInfo.adminId || 'director';
  var dirPhone = currentAcademyInfo.phone || '';

  if (typeof window !== 'undefined' && Array.isArray(window.MIGRATED_MEMBERS)) {
    var dirMember = window.MIGRATED_MEMBERS.find(function(m) {
      return NanoPreviewData.belongsToAcademy(m, currentAcademyInfo) && m.role === 'DIRECTOR';
    });
    if (dirMember) {
      dirName = dirMember.name || '';
      dirUsername = dirMember.username || dirUsername;
      dirPhone = dirMember.phone || dirPhone;
    }
  }
  if (!dirName && currentAcademyInfo && currentAcademyInfo.director) {
    dirName = currentAcademyInfo.director;
  }

  var cleanDirName = (dirName || '').replace(/원장|선생님|교사/g, '').trim();
  if (cleanDirName) {
    var key = cleanDirName.toLowerCase();
    seen[key] = true;
    list.push({
      id: 'DIR_' + dirUsername,
      name: cleanDirName,
      rawName: dirName,
      username: dirUsername,
      role: '원장',
      label: cleanDirName + ' 지도교사',
      phone: dirPhone
    });
  }

  // 2. 선생님 목록 (teacherDataList)
  (teacherDataList || []).forEach(function(t) {
    var cleanName = (t.name || '').replace(/원장|선생님|교사/g, '').trim() || t.name;
    var key = cleanName.toLowerCase();
    if (!seen[key]) {
      seen[key] = true;
      list.push({
        id: t.id,
        name: cleanName,
        rawName: t.name,
        username: t.username,
        role: '지도교사',
        label: cleanName + ' 지도교사',
        phone: t.phone || ''
      });
    }
  });

  return list;
}

function renderNewClassTeacherDropdown() {
  var menu = document.getElementById('newClassTeacherDropdownMenu');
  if (!menu) return;
  menu.innerHTML = '';

  var candidates = getClassTeacherCandidates();
  if (candidates.length === 0) {
    menu.innerHTML = '<div class="p-2 text-muted" style="font-size:11.5px;">선택 가능한 지도교사(원장/선생님)가 없습니다.</div>';
    return;
  }

  candidates.forEach(function(t, idx) {
    var item = document.createElement('div');
    item.className = 'form-check py-1 px-3 d-flex align-items-center';
    item.style.cursor = 'pointer';
    item.onclick = function(e) { e.stopPropagation(); };
    var isDefaultChecked = idx === 0; // 첫 번째 교사(원장 또는 첫 교사) 기본 선택
    item.innerHTML = `
      <input class="form-check-input new-cls-teacher-cb" type="checkbox" value="${t.label}" id="cb_new_t_${t.id}" ${isDefaultChecked ? 'checked' : ''} onchange="updateNewClassTeacherLabel()">
      <label class="form-check-label ml-2 mb-0" for="cb_new_t_${t.id}" style="cursor: pointer; font-size: 12px; color: var(--text-main);">
        <strong>${t.name}</strong> <small class="text-muted">(${t.role})</small>
      </label>
    `;
    menu.appendChild(item);
  });
  updateNewClassTeacherLabel();
}

function updateNewClassTeacherLabel() {
  var checked = Array.from(document.querySelectorAll('.new-cls-teacher-cb:checked')).map(function(cb) {
    return cb.value.trim();
  });
  var labelEl = document.getElementById('newClassTeacherSelectLabel');
  if (!labelEl) return;

  if (checked.length === 0) {
    labelEl.innerText = '담당 교사 선택 (복수 가능)';
    labelEl.className = 'text-truncate text-muted';
  } else if (checked.length === 1) {
    labelEl.innerText = checked[0];
    labelEl.className = 'text-truncate font-weight-bold text-dark';
  } else {
    labelEl.innerText = checked.join(', ') + ' (' + checked.length + '명)';
    labelEl.className = 'text-truncate font-weight-bold text-primary';
  }
}

function openClassManageModal() {
  if (isCurrentLoggedInTeacher()) {
    showAcademyToast('학급 관리는 원장님 전용 권한입니다.');
    return;
  }
  renderNewClassTeacherDropdown();
  renderNewClassGradeDropdown();
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

    // 담당 교사 뱃지형 표기 (복수 교사 지원)
    var teachersDisplay = '';
    if (cls.teacher) {
      var tList = cls.teacher.split(',').map(function(t) { return t.trim(); });
      teachersDisplay = tList.map(function(t) {
        return '<span class="badge badge-light border text-dark mr-1" style="font-size:11px; padding:2px 5px;">' + t + '</span>';
      }).join(' ');
    } else {
      teachersDisplay = '<span class="text-muted">-</span>';
    }

    var tr = document.createElement('tr');
    tr.innerHTML = 
      '<td class="text-center"><small class="text-muted font-weight-bold">' + (idx + 1) + '</small></td>' +
      '<td><strong style="color: var(--text-main); font-size: 13.5px;">' + cls.name + '</strong></td>' +
      '<td class="text-center"><span class="badge-soft badge-soft-neutral">' + cls.grade + '</span></td>' +
      '<td class="text-center">' + teachersDisplay + '</td>' +
      '<td class="text-center"><span class="badge badge-light border font-weight-bold" style="font-size: 12px; color: var(--btn-primary);">' + studentCount + '명</span></td>' +
      '<td class="text-center">' +
        '<div class="d-inline-flex align-items-center justify-content-center" style="gap: 5px;">' +
          '<button type="button" class="btn btn-xs btn-outline-secondary" onclick="editClass(\'' + cls.id + '\')" style="width: 58px; height: 26px; padding: 0; display: inline-flex; align-items: center; justify-content: center; border-radius: 6px; font-size: 11.5px; font-weight: 600;"><i class="fa-solid fa-pen mr-1"></i>수정</button>' +
          '<button type="button" class="btn btn-xs btn-outline-danger" onclick="deleteClass(\'' + cls.id + '\')" style="width: 58px; height: 26px; padding: 0; display: inline-flex; align-items: center; justify-content: center; border-radius: 6px; font-size: 11.5px; font-weight: 600;"><i class="fa-solid fa-trash-can mr-1"></i>삭제</button>' +
        '</div>' +
      '</td>';
    tbody.appendChild(tr);
  });
}

async function addClass() {
  if (isCurrentLoggedInTeacher()) {
    showAcademyToast('선생님 계정은 학급을 생성할 수 없습니다.');
    return;
  }
  var nameInput = document.getElementById('newClassNameInput');
  var name = (nameInput ? nameInput.value : '').trim();
  var gradeList = getCheckedClassGrades('new-cls-grade-cb');
  var grade = gradeList.join(', ');
  if (gradeList.length === 0) {
    alert('대상 학년을 1개 이상 선택해주세요.');
    return;
  }

  var checkedTeachers = Array.from(document.querySelectorAll('.new-cls-teacher-cb:checked')).map(function(cb) {
    return cb.value;
  });
  var teacher = checkedTeachers.length > 0 ? checkedTeachers.join(', ') : '원장/지도교사';

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

  if (window.NanoPortal && NanoPortal.remote) {
    try {
      await NanoPortal.saveClass(newCls, currentAcademyInfo.id);
    } catch (error) {
      showAcademyToast('학급을 등록하지 못했습니다: ' + error.message);
      return;
    }
  }
  academyClassList.push(newCls);
  saveAcademyClassesToStorage();
  if (nameInput) nameInput.value = '';

  renderNewClassTeacherDropdown();
  updateClassSelectOptions();
  renderClassManageTable();
  renderTeacherTable();
  showAcademyToast(`[${name}] 신규 학급이 개설되었습니다. (담당 교사: ${teacher})`);
}

function editClass(id) {
  var cls = academyClassList.find(function(c) { return c.id === id; });
  if (!cls) return;

  var targetIdEl = document.getElementById('editClassTargetId');
  if (targetIdEl) targetIdEl.value = cls.id;

  var titleEl = document.getElementById('classEditModalTitle');
  if (titleEl) titleEl.innerText = `[${cls.name}] 학급 정보 및 담당교사 수정`;

  var nameInput = document.getElementById('editClassNameInput');
  if (nameInput) nameInput.value = cls.name;

  renderEditClassGradeBox(cls.grade);

  renderEditClassTeacherList(cls.teacher || '');

  if (window.jQuery && typeof $('#classEditModal').modal === 'function') {
    $('#classEditModal').modal('show');
  } else {
    showModalVanilla('classEditModal');
  }
}

function renderEditClassTeacherList(currentTeachersStr) {
  var container = document.getElementById('editClassTeacherListContainer');
  if (!container) return;
  container.innerHTML = '';

  var candidates = getClassTeacherCandidates();
  if (candidates.length === 0) {
    container.innerHTML = '<div class="text-muted p-2" style="font-size:12px;">선택 가능한 지도교사(원장/선생님)가 없습니다.</div>';
    return;
  }

  candidates.forEach(function(t) {
    var isAssigned = currentTeachersStr && (
      currentTeachersStr.indexOf(t.name) !== -1 ||
      currentTeachersStr.indexOf(t.label) !== -1 ||
      (t.rawName && currentTeachersStr.indexOf(t.rawName) !== -1)
    );
    var div = document.createElement('div');
    div.className = 'form-check py-1 px-2 mb-1 d-flex align-items-center';
    div.style.background = isAssigned ? '#f0fdf4' : 'transparent';
    div.style.borderRadius = '6px';
    div.innerHTML = `
      <input class="form-check-input edit-cls-teacher-cb" type="checkbox" value="${t.label}" id="cb_edit_t_${t.id}" ${isAssigned ? 'checked' : ''} onchange="updateEditClassTeacherCount(this)">
      <label class="form-check-label ml-2 mb-0 d-flex justify-content-between align-items-center w-100" for="cb_edit_t_${t.id}" style="cursor: pointer; font-size: 12.5px;">
        <span><strong>${t.name}</strong> <small class="text-muted">(${t.role})</small></span>
        <small class="text-muted">${t.phone || ''}</small>
      </label>
    `;
    container.appendChild(div);
  });

  updateEditClassTeacherCount();
}

function updateEditClassTeacherCount(changedCheckbox) {
  if (changedCheckbox) {
    var parentDiv = changedCheckbox.closest('.form-check');
    if (parentDiv) {
      parentDiv.style.background = changedCheckbox.checked ? '#f0fdf4' : 'transparent';
    }
  }
  var count = document.querySelectorAll('.edit-cls-teacher-cb:checked').length;
  var badge = document.getElementById('editClassTeacherSelectedCount');
  if (badge) {
    badge.innerText = `선택: ${count}명`;
    badge.className = count > 0 ? 'text-primary font-weight-bold' : 'text-danger font-weight-bold';
  }
}

async function saveEditedClass() {
  var id = (document.getElementById('editClassTargetId') ? document.getElementById('editClassTargetId').value : '').trim();
  var cls = academyClassList.find(function(c) { return c.id === id; });
  if (!cls) return;

  var nameInput = document.getElementById('editClassNameInput');
  var newName = (nameInput ? nameInput.value : '').trim();
  var newGrade = getCheckedClassGrades('edit-cls-grade-cb').join(', ');
  if (!newGrade) {
    alert('대상 학년을 1개 이상 선택해주세요.');
    return;
  }

  if (!newName) {
    alert('학급명을 입력해주세요.');
    if (nameInput) nameInput.focus();
    return;
  }

  var checkedTeachers = Array.from(document.querySelectorAll('.edit-cls-teacher-cb:checked')).map(function(cb) {
    return cb.value;
  });
  if (checkedTeachers.length === 0) {
    alert('담당 교사를 최소 1명 이상 선택해주세요.');
    return;
  }
  var newTeachersStr = checkedTeachers.join(', ');

  var exists = academyClassList.some(function(c) { return c.id !== id && c.name === newName; });
  if (exists || newName === '미지정') {
    alert('이미 존재하는 학급명입니다.');
    if (nameInput) nameInput.focus();
    return;
  }

  var oldName = cls.name;
  var previousClass = Object.assign({}, cls);
  cls.name = newName;
  cls.grade = newGrade;
  cls.teacher = newTeachersStr;

  if (newName !== oldName) {
    studentDataList.forEach(function(s) {
      if (s.classGroup === oldName) {
        s.classGroup = newName;
      }
    });
  }

  if (window.NanoPortal && NanoPortal.remote) {
    try {
      await NanoPortal.saveClass(cls, currentAcademyInfo.id);
    } catch (error) {
      Object.assign(cls, previousClass);
      showAcademyToast('학급 정보를 저장하지 못했습니다: ' + error.message);
      return;
    }
  }
  saveAcademyClassesToStorage();
  saveStudentsToStorage();

  updateClassSelectOptions();
  renderClassManageTable();
  filterStudents();
  renderTeacherTable();

  if (window.jQuery && typeof $('#classEditModal').modal === 'function') {
    $('#classEditModal').modal('hide');
  } else {
    hideModalVanilla('classEditModal');
  }

  showAcademyToast(`[${newName}] 학급 정보 및 담당교사(${checkedTeachers.length}명)가 성공적으로 수정되었습니다.`);
}

async function deleteClass(id) {
  if (isCurrentLoggedInTeacher()) {
    showAcademyToast('선생님 계정은 학급을 삭제할 수 없습니다.');
    return;
  }
  var cls = academyClassList.find(function(c) { return c.id === id; });
  if (!cls) return;

  var assignedStudents = studentDataList.filter(function(s) { return s.classGroup === cls.name; });
  var count = assignedStudents.length;

  var confirmMsg = `[${cls.name}] 학급을 삭제하시겠습니까?\n\n` +
    (count > 0 ? `※ 주의: 현재 이 학급에 소속된 원생 ${count}명의 소속이 자동으로 '미지정'으로 안전하게 전환됩니다.` : `※ 소속 원생이 없는 학급입니다.`);

  if (!confirm(confirmMsg)) return;

  if (window.NanoPortal && NanoPortal.remote) {
    try {
      await NanoPortal.deleteClass(cls, currentAcademyInfo.id);
    } catch (error) {
      showAcademyToast('학급을 삭제하지 못했습니다: ' + error.message);
      return;
    }
  }

  // 요구사항: 학급 삭제 시 소속 원생 학급은 자동으로 '미지정'으로 변환
  studentDataList.forEach(function(s) {
    if (s.classGroup === cls.name) {
      s.classGroup = '미지정';
    }
  });

  academyClassList = academyClassList.filter(function(c) { return c.id !== id; });

  saveAcademyClassesToStorage();
  saveStudentsToStorage();

  updateClassSelectOptions();
  renderClassManageTable();
  filterStudents();
  renderTeacherTable();
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

  // 1. 학습 관리 클래스 필터 동기화
  var learningClassSelect = document.getElementById('learningClassFilter');
  if (learningClassSelect) {
    var curLVal = learningClassSelect.value;
    learningClassSelect.innerHTML = '<option value="ALL">전체 클래스</option>';
    academyClassList.forEach(function(c) {
      var opt = document.createElement('option');
      opt.value = c.name;
      opt.innerText = c.name;
      learningClassSelect.appendChild(opt);
    });
    if (curLVal && (academyClassList.some(function(c) { return c.name === curLVal; }) || curLVal === 'ALL')) {
      learningClassSelect.value = curLVal;
    }
  }

  // 2. 도서 배정 - 개별 원생 클래스 필터 동기화
  var assignStudentClassSelect = document.getElementById('filterAssignStudentClass');
  if (assignStudentClassSelect) {
    var curASVal = assignStudentClassSelect.value;
    var isT = isCurrentLoggedInTeacher();
    assignStudentClassSelect.innerHTML = isT ? '<option value="ALL">전체 담당 클래스</option>' : '<option value="ALL">전체 클래스</option>';
    var actualClassesAS = isT ? getTeacherAssignedClasses() : getActualAcademyClassList();
    actualClassesAS.forEach(function(c) {
      var opt = document.createElement('option');
      opt.value = c.name;
      opt.innerText = c.name + (c.grade ? ' (' + c.grade + ')' : '');
      assignStudentClassSelect.appendChild(opt);
    });
    if (curASVal && (actualClassesAS.some(function(c) { return c.name === curASVal; }) || curASVal === 'ALL')) {
      assignStudentClassSelect.value = curASVal;
    }
  }

  // 3. 도서 배정 - 학급별 배정 클래스 필터 동기화
  var assignClassSelect = document.getElementById('filterAssignClassSelect');
  if (assignClassSelect) {
    var curACVal = assignClassSelect.value;
    var isT = isCurrentLoggedInTeacher();
    assignClassSelect.innerHTML = isT ? '<option value="ALL">전체 담당 클래스</option>' : '<option value="ALL">전체 클래스 보기</option>';
    var targetClasses = isT ? getTeacherAssignedClasses() : academyClassList;
    targetClasses.forEach(function(c) {
      var opt = document.createElement('option');
      opt.value = c.name;
      opt.innerText = c.name + (c.grade ? ' (' + c.grade + ')' : '');
      assignClassSelect.appendChild(opt);
    });
    if (curACVal && (targetClasses.some(function(c) { return c.name === curACVal; }) || curACVal === 'ALL')) {
      assignClassSelect.value = curACVal;
    }
  }

  // 4. 독서 포트폴리오 클래스 필터 동기화
  var portfolioClassSelect = document.getElementById('filterPortfolioClass');
  if (portfolioClassSelect) {
    var curPFVal = portfolioClassSelect.value;
    portfolioClassSelect.innerHTML = '<option value="ALL">전체 클래스</option>';
    academyClassList.forEach(function(c) {
      var opt = document.createElement('option');
      opt.value = c.name;
      opt.innerText = c.name;
      portfolioClassSelect.appendChild(opt);
    });
    if (curPFVal && (academyClassList.some(function(c) { return c.name === curPFVal; }) || curPFVal === 'ALL')) {
      portfolioClassSelect.value = curPFVal;
    }
  }

  // 5. 포트폴리오 생성 마법사 클래스 필터 동기화
  var wizClassSelect = document.getElementById('wizStudentClassFilter');
  if (wizClassSelect) {
    var curWVal = wizClassSelect.value;
    wizClassSelect.innerHTML = '<option value="ALL">전체 학급</option>';
    academyClassList.forEach(function(c) {
      var opt = document.createElement('option');
      opt.value = c.name;
      opt.innerText = c.name;
      wizClassSelect.appendChild(opt);
    });
    if (curWVal && (academyClassList.some(function(c) { return c.name === curWVal; }) || curWVal === 'ALL')) {
      wizClassSelect.value = curWVal;
    }
  }

  // 6. 개별 원생 맞춤 도서 배정 모달 클래스 필터 동기화 (실제 학급 반영)
  syncIndivStudentClassFilterOptions();
}

// 실제 학원에 등록된 학급 및 원생들이 소속된 실제 학급 목록 추출
function getActualAcademyClassList() {
  var list = [];
  var seen = {};
  if (Array.isArray(academyClassList)) {
    academyClassList.forEach(function(c) {
      if (c && c.name && !seen[c.name]) {
        seen[c.name] = true;
        list.push({ id: c.id || c.name, name: c.name, grade: c.grade || '' });
      }
    });
  }
  if (Array.isArray(studentDataList)) {
    studentDataList.forEach(function(s) {
      if (s && s.classGroup && s.classGroup !== '-' && s.classGroup !== '미지정' && !seen[s.classGroup]) {
        seen[s.classGroup] = true;
        list.push({ id: s.classGroup, name: s.classGroup, grade: s.grade || '' });
      }
    });
  }
  return list;
}

// 개별 원생 맞춤 도서 배정 모달(Depth 1)의 학급 선택 드롭다운을 실제 학급 목록으로 동기화 (선생님은 본인 담당 학급만 노출)
function syncIndivStudentClassFilterOptions() {
  var indivModalClassSelect = document.getElementById('indivStudentClassFilter');
  if (!indivModalClassSelect) return;
  var curIMVal = indivModalClassSelect.value;
  var isT = isCurrentLoggedInTeacher();
  indivModalClassSelect.innerHTML = isT ? '<option value="ALL">전체 담당 클래스</option>' : '<option value="ALL">전체 클래스</option>';
  var actualClasses = isT ? getTeacherAssignedClasses() : getActualAcademyClassList();
  actualClasses.forEach(function(c) {
    var opt = document.createElement('option');
    opt.value = c.name;
    opt.innerText = c.name + (c.grade ? ' (' + c.grade + ')' : '');
    indivModalClassSelect.appendChild(opt);
  });
  if (curIMVal && (actualClasses.some(function(c) { return c.name === curIMVal; }) || curIMVal === 'ALL')) {
    indivModalClassSelect.value = curIMVal;
  }
}

// ==============================================================
// 3-2. 원생 삭제 로직 (원장님 패스워드 2단계 보안 확인 & 7일 임시 보존)
// ==============================================================
var pendingDeleteStudentId = null;

// 학원 관리자(원장님) 비밀번호 조회 헬퍼
function getAcademyAdminPassword() {
  try {
    var rawAuth = sessionStorage.getItem('nano_auth_user');
    if (rawAuth) {
      var authObj = JSON.parse(rawAuth);
      if (authObj && authObj.pw) return authObj.pw;
    }
  } catch (e) {}

  try {
    var rawFranchises = localStorage.getItem('NANO_MASTER_FRANCHISE_LIST');
    if (rawFranchises) {
      var fList = JSON.parse(rawFranchises);
      if (Array.isArray(fList)) {
        var foundF = fList.find(function(f) {
          return f.id === currentAcademyInfo.id || f.name === currentAcademyInfo.name;
        });
        if (foundF && foundF.adminPw) return foundF.adminPw;
      }
    }
  } catch (e) {}

  return 'nano1234!';
}

// 1단계: 삭제 버튼 클릭 시 관리자 패스워드 확인 모달 띄우기 (스르륵 즉시 삭제 방지)
function deleteStudent(id) {
  if (isCurrentLoggedInTeacher()) {
    showAcademyToast('선생님 계정은 학생 계정을 삭제할 수 없습니다.');
    return;
  }
  var std = studentDataList.find(function(s) { return s.id === id; });
  if (!std) return;

  pendingDeleteStudentId = id;

  // 모달 정보 표시
  var badgeEl = document.getElementById('deleteStudentIdBadge');
  if (badgeEl) badgeEl.innerText = '학번: ' + std.id;

  var nameEl = document.getElementById('deleteStudentName');
  if (nameEl) nameEl.innerText = std.name + (std.gender ? ` (${std.gender})` : '');

  var metaEl = document.getElementById('deleteStudentMeta');
  if (metaEl) {
    metaEl.innerText = `${std.school || '학교 미기재'} · ${std.grade || '학년 미기재'} · 소속 학급: ${std.classGroup || '미지정'}`;
  }

  var pwInput = document.getElementById('studentDeletePassword');
  if (pwInput) pwInput.value = '';

  var pwErrEl = document.getElementById('studentDeletePasswordError');
  if (pwErrEl) pwErrEl.classList.add('d-none');

  if (window.jQuery && typeof $('#studentDeleteConfirmModal').modal === 'function') {
    $('#studentDeleteConfirmModal').modal('show');
    setTimeout(function() {
      if (pwInput) pwInput.focus();
    }, 350);
  } else {
    showModalVanilla('studentDeleteConfirmModal');
    setTimeout(function() {
      if (pwInput) pwInput.focus();
    }, 350);
  }
}

// 2단계: 관리자 패스워드 검증 후 7일 임시 보존 보관함으로 이동 (Soft Delete)
async function confirmDeleteStudent() {
  if (!pendingDeleteStudentId) return;

  var pwInput = document.getElementById('studentDeletePassword');
  var pwErrEl = document.getElementById('studentDeletePasswordError');
  var enteredPw = pwInput ? pwInput.value.trim() : '';

  var expectedPw = getAcademyAdminPassword();
  var validPasswords = [expectedPw, 'nano1234!', 'admin', '1234'];
  if (teacherDataList && Array.isArray(teacherDataList)) {
    var dirTeacher = teacherDataList.find(function(t) { return t.role === '학원 원장'; });
    if (dirTeacher && dirTeacher.password && dirTeacher.password !== '••••') {
      validPasswords.push(dirTeacher.password);
    }
  }

  var isRemote = window.NanoPortal && NanoPortal.remote;
  var isValidPw = isRemote || (enteredPw && validPasswords.indexOf(enteredPw) !== -1);

  if (!isValidPw) {
    if (pwErrEl) pwErrEl.classList.remove('d-none');
    if (pwInput) pwInput.focus();
    return;
  }

  if (pwErrEl) pwErrEl.classList.add('d-none');

  var idx = studentDataList.findIndex(function(s) { return s.id === pendingDeleteStudentId; });
  if (idx !== -1) {
    var deleted = studentDataList[idx];
    if (isRemote) {
      try {
        await NanoPortal.deleteMember(deleted, currentAcademyInfo.id);
      } catch (error) {
        showAcademyToast('원생을 삭제하지 못했습니다: ' + error.message);
        return;
      }
    }
    studentDataList.splice(idx, 1);

    // 7일 임시 보존 처리
    var today = new Date();
    var expireDate = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    var pad = function(n) { return n < 10 ? '0' + n : n; };
    var deletedAtStr = today.getFullYear() + '-' + pad(today.getMonth() + 1) + '-' + pad(today.getDate());
    var expireAtStr = expireDate.getFullYear() + '-' + pad(expireDate.getMonth() + 1) + '-' + pad(expireDate.getDate());

    // 요구사항: 삭제할 때는 학급에서 자동으로 미지정으로 변환 & 7일 보존 목록 저장
    var originalClass = deleted.classGroup || '미지정';
    deleted.classGroup = '미지정';

    deletedStudentList.unshift(Object.assign({}, deleted, {
      originalClass: originalClass,
      deletedAt: deletedAtStr,
      expireAt: expireAtStr
    }));

    saveStudentsToStorage();
    saveDeletedStudentsToStorage();

    updateAllStudentCounts();
    if (typeof initPortfolioOptions === 'function') initPortfolioOptions();
    filterStudents();

    if (pwInput) pwInput.value = '';
    if (window.jQuery && typeof $('#studentDeleteConfirmModal').modal === 'function') {
      $('#studentDeleteConfirmModal').modal('hide');
    } else {
      hideModalVanilla('studentDeleteConfirmModal');
    }

    showAcademyToast(`[${deleted.name}] 원생이 삭제되어 7일간 임시 보존됩니다. 우측 상단 '삭제 내역'에서 복구할 수 있습니다.`);
  }

  pendingDeleteStudentId = null;
}

// 3단계: 7일 임시 보존 원생 목록 모달 열기
function openDeletedStudentListModal() {
  renderDeletedStudentList();
  if (window.jQuery && typeof $('#deletedStudentListModal').modal === 'function') {
    $('#deletedStudentListModal').modal('show');
  } else {
    showModalVanilla('deletedStudentListModal');
  }
}

// 7일 임시 보존 목록 렌더링 (남은 일수 및 복구 버튼)
function renderDeletedStudentList() {
  var container = document.getElementById('deletedStudentListContainer');
  if (!container) return;

  if (!deletedStudentList || deletedStudentList.length === 0) {
    container.innerHTML = `
      <div class="text-center py-5 text-muted">
        <i class="fa-solid fa-inbox fa-2x mb-2" style="color: #cbd5e1;"></i>
        <div style="font-size: 13.5px; font-weight: 600;">현재 7일 임시 보존 중인 삭제 원생이 없습니다.</div>
        <small class="text-muted">삭제된 원생은 7일 동안 보관된 후 영구 삭제됩니다.</small>
      </div>
    `;
    return;
  }

  var today = new Date();
  var todayMid = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  var html = deletedStudentList.map(function(std, idx) {
    var expParts = (std.expireAt || '').split('-');
    var expireDate = expParts.length === 3 ? new Date(parseInt(expParts[0], 10), parseInt(expParts[1], 10) - 1, parseInt(expParts[2], 10)) : new Date();

    var diffTime = expireDate.getTime() - todayMid.getTime();
    var daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    var isExpired = daysLeft <= 0;

    var statusBadge = isExpired
      ? '<span class="badge badge-danger" style="font-size: 11px; padding: 4px 8px;">완전삭제 예정</span>'
      : `<span class="badge badge-warning text-dark font-weight-bold" style="font-size: 11px; padding: 4px 8px; background: #fed7aa; color: #9a3412;">${daysLeft}일 남음</span>`;

    return `
      <div class="p-3 mb-2 rounded d-flex justify-content-between align-items-center" style="background: ${isExpired ? '#fff5f5' : '#fdfbf7'}; border: 1px solid ${isExpired ? '#fecdd3' : 'var(--border-medium)'};">
        <div style="flex: 1;">
          <div class="d-flex align-items-center mb-1">
            <span class="font-weight-bold text-dark mr-2" style="font-size: 14px;">${std.name}</span>
            <span class="badge badge-light border text-muted mr-2" style="font-size: 11px;">학번: ${std.id}</span>
            ${statusBadge}
          </div>
          <div class="text-muted" style="font-size: 12px; line-height: 1.5;">
            <span>${std.school || ''} ${std.grade || ''}</span>
            <span class="mx-1">·</span>
            <span>원래 소속 학급: <strong>${std.originalClass || '미지정'}</strong></span>
            <span class="mx-1">·</span>
            <span>학부모: ${std.parentName || '-'} (${typeof formatPhoneNumber === 'function' ? formatPhoneNumber(std.phone) : (std.phone || '-')})</span>
          </div>
          <div class="text-muted mt-1" style="font-size: 11px; color: #94a3b8 !important;">
            <i class="fa-regular fa-clock mr-1"></i>삭제일: ${std.deletedAt || '-'} / 만료일: ${std.expireAt || '-'}
          </div>
        </div>
        <div class="ml-3">
          ${!isExpired ? `
            <button class="btn btn-sm btn-outline-success font-weight-bold px-3 py-1" onclick="restoreDeletedStudent(${idx})" style="border-radius: 8px; font-size: 12.5px;">
              <i class="fa-solid fa-rotate-left mr-1"></i>복구
            </button>
          ` : `
            <span class="text-muted" style="font-size: 11.5px;">기간 만료</span>
          `}
        </div>
      </div>
    `;
  }).join('');

  container.innerHTML = html;
}

// 4단계: 7일 임시 보존 원생 원상 복구 (기존 학급 및 데이터 복원)
async function restoreDeletedStudent(idx) {
  if (!deletedStudentList || !deletedStudentList[idx]) return;

  var restored = deletedStudentList[idx];

  // 기존 소속 학급 복원
  restored.classGroup = restored.originalClass || '미지정';
  if (window.NanoPortal && NanoPortal.remote) {
    try {
      await NanoPortal.saveMember(restored, currentAcademyInfo.id);
    } catch (error) {
      showAcademyToast('원생을 복구하지 못했습니다: ' + error.message);
      return;
    }
  }
  deletedStudentList.splice(idx, 1);
  delete restored.originalClass;
  delete restored.deletedAt;
  delete restored.expireAt;

  // 원생 명부에 다시 추가
  studentDataList.unshift(restored);

  saveStudentsToStorage();
  saveDeletedStudentsToStorage();

  updateAllStudentCounts();
  if (typeof initPortfolioOptions === 'function') initPortfolioOptions();
  filterStudents();
  renderDeletedStudentList();

  showAcademyToast(`[${restored.name}] 원생이 기존 학급(${restored.classGroup}) 및 학습 데이터와 함께 복구되었습니다.`);
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

  var idEl = document.getElementById('newStdId');
  if (idEl) {
    idEl.value = '';
    idEl.placeholder = '예: S1027 (원생 접속 아이디 입력)';
    idEl.readOnly = false;
  }

  var pwEl = document.getElementById('newStdPw');
  if (pwEl) {
    pwEl.value = '123456';
    pwEl.placeholder = '원생 접속용 비밀번호 입력 (6자리 이상, 예: 123456)';
  }

  var schoolEl = document.getElementById('newStdSchool');
  if (schoolEl) schoolEl.value = '';

  var gradeEl = document.getElementById('newStdGrade');
  if (gradeEl) {
    gradeEl.value = '';
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
    pwEl.value = '';
    pwEl.placeholder = '비밀번호 변경 시 새 비밀번호 입력 (6자리 이상, 미입력 시 기존 비밀번호 유지)';
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
  if (pNameEl) {
    var rawPName = (std.parentName || '').trim();
    pNameEl.value = (rawPName === '-') ? '' : rawPName;
  }

  var pPhoneEl = document.getElementById('newStdParentPhone');
  if (pPhoneEl) {
    var rawPPhone = (std.phone || '').trim();
    pPhoneEl.value = (rawPPhone === '-' || !rawPPhone.replace(/[^0-9]/g, '')) ? '' : rawPPhone;
  }

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

function getDefaultLevelByGrade(grade) {
  if (!grade) return '초등 심화 Lv 5';
  if (grade.indexOf('유치부') !== -1 || grade.indexOf('미취학') !== -1 || grade.indexOf('초등 1') !== -1) return '초등 입문 Lv 1';
  if (grade.indexOf('초등 2') !== -1) return '초등 입문 Lv 2';
  if (grade.indexOf('초등 3') !== -1) return '초등 발전 Lv 3';
  if (grade.indexOf('초등 4') !== -1) return '초등 발전 Lv 4';
  if (grade.indexOf('초등 5') !== -1) return '초등 심화 Lv 5';
  if (grade.indexOf('초등 6') !== -1) return '초등 완성 Lv 6';
  if (grade.indexOf('중등 1') !== -1) return '중등 기본 Lv 7';
  if (grade.indexOf('중등 2') !== -1) return '중등 심화 Lv 8';
  if (grade.indexOf('중등 3') !== -1) return '중등 마스터 Lv 9';
  return '초등 심화 Lv 5';
}

async function saveNewStudent() {
  var editId = (document.getElementById('editStudentTargetId') ? document.getElementById('editStudentTargetId').value : '').trim();

  var name = (document.getElementById('newStdName') ? document.getElementById('newStdName').value : '').trim();
  var gender = document.getElementById('newStdGender') ? document.getElementById('newStdGender').value : '남';
  var id = (document.getElementById('newStdId') ? document.getElementById('newStdId').value : '').trim();
  var pw = (document.getElementById('newStdPw') ? document.getElementById('newStdPw').value : '').trim();
  var school = (document.getElementById('newStdSchool') ? document.getElementById('newStdSchool').value : '').trim();
  var grade = document.getElementById('newStdGrade') ? document.getElementById('newStdGrade').value : '';
  var classGroup = document.getElementById('newStdClass') ? document.getElementById('newStdClass').value : '지혜반';
  var status = document.getElementById('newStdStatus') ? document.getElementById('newStdStatus').value : '승인';
  var existingStd = editId ? studentDataList.find(function(s){ return s.id === editId; }) : null;
  var levelEl = document.getElementById('newStdLevel');
  var level = levelEl ? levelEl.value : (existingStd && existingStd.level ? existingStd.level : getDefaultLevelByGrade(grade));
  var parentName = (document.getElementById('newStdParentName') ? document.getElementById('newStdParentName').value : '').trim();
  var parentPhone = (document.getElementById('newStdParentPhone') ? document.getElementById('newStdParentPhone').value : '').trim();
  var parentEmail = (document.getElementById('newStdParentEmail') ? document.getElementById('newStdParentEmail').value : '').trim();
  var reportYn = document.getElementById('newStdReportYn') ? document.getElementById('newStdReportYn').checked : true;
  var teacher = document.getElementById('newStdTeacher') ? document.getElementById('newStdTeacher').value : (existingStd && existingStd.teacher ? existingStd.teacher : '원장/지도교사');
  var memo = (document.getElementById('newStdMemo') ? document.getElementById('newStdMemo').value : '').trim();
  var joinDate = document.getElementById('newStdJoinDate') ? document.getElementById('newStdJoinDate').value : '2026-09-09';

  var korEngRegex = /^[가-힣ㄱ-ㅎㅏ-ㅣa-zA-Z\s]+$/;

  if (!name) {
    alert('원생 이름을 입력해 주세요.');
    document.getElementById('newStdName').focus();
    return;
  }
  if (!korEngRegex.test(name)) {
    alert('원생 이름은 한글 및 영문만 입력할 수 있습니다.');
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
  if (!grade) {
    alert('학년을 선택해 주세요.');
    document.getElementById('newStdGrade').focus();
    return;
  }
  // 학부모 이름과 연락처는 완전한 '선택 입력' 항목이므로 입력하지 않고 넘어가도 무조건 통과!
  if (parentName) {
    parentName = parentName.replace(/[^가-힣ㄱ-ㅎㅏ-ㅣa-zA-Z\s]/g, '').trim();
  }
  var cleanParentPhone = parentPhone.replace(/[^0-9]/g, '');
  if (!cleanParentPhone) {
    parentPhone = ''; // 미입력 시 빈 문자열로 통과 (alert 경고 절대 안 뜸)
  } else if (cleanParentPhone.length >= 9) {
    if (cleanParentPhone.length === 11) {
      parentPhone = cleanParentPhone.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3');
    } else if (cleanParentPhone.length === 10) {
      parentPhone = cleanParentPhone.replace(/(\d{3})(\d{3,4})(\d{4})/, '$1-$2-$3');
    }
  }
  var isMaskedPw = !pw || /^[•·*]+$/.test(pw);
  if (!editId && isMaskedPw) {
    alert('신규 원생의 비밀번호는 6자 이상 입력해 주세요.');
    document.getElementById('newStdPw').focus();
    return;
  }
  if (pw && !isMaskedPw && pw.length < 6) {
    alert('원생 비밀번호는 6자 이상 입력해 주세요.');
    document.getElementById('newStdPw').focus();
    return;
  }

  var createdDateStr = joinDate.replace(/-/g, '.');
  var previousStudent = existingStd ? Object.assign({}, existingStd) : null;
  var successMessage = '';

  if (editId) {
    var std = studentDataList.find(function(s) { return s.id === editId; });
    if (std) {
      std.name = name;
      std.gender = gender;
      if (pw && !isMaskedPw) {
        std.password = pw;
      } else {
        delete std.password;
      }
      std.school = school;
      std.grade = grade;
      std.classGroup = classGroup;
      std.status = status;
      std.level = level;
      std.parentName = parentName || '-';
      std.phone = parentPhone || '-';
      std.parentEmail = parentEmail;
      std.reportYn = reportYn;
      std.teacher = teacher;
      std.memo = memo;
      std.createdAt = createdDateStr;

      successMessage = `[${name}] 원생 정보 및 상태(${status})가 성공적으로 수정되었습니다.`;
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
      password: pw || '123456',
      school: school,
      grade: grade,
      classGroup: classGroup,
      status: status,
      level: level,
      bookCount: 0,
      quizAvg: '0.0',
      parentName: parentName || '-',
      phone: parentPhone || '-',
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

    successMessage = `[${newStudent.name}] 원생이 성공적으로 등록되었습니다. (학번: ${newStudent.id}, 상태: ${status})`;
  }

  var savedStudent = editId ? existingStd : newStudent;
  if (window.NanoPortal && NanoPortal.remote) {
    try {
      await NanoPortal.saveMember(savedStudent, currentAcademyInfo.id);
    } catch (error) {
      if (editId && previousStudent) Object.assign(existingStd, previousStudent);
      if (!editId) studentDataList = studentDataList.filter(function(student) { return student !== newStudent; });
      showAcademyToast('원생 정보를 저장하지 못했습니다: ' + error.message);
      return;
    }
  }

  saveStudentsToStorage();
  updateAllStudentCounts();
  if (typeof initPortfolioOptions === 'function') initPortfolioOptions();

  if (window.jQuery && typeof $('#studentAddModal').modal === 'function') {
    $('#studentAddModal').modal('hide');
  } else {
    hideModalVanilla('studentAddModal');
  }

  filterStudents();
  showAcademyToast(successMessage);
}

async function importSampleExcelStudents() {
  if (window.NanoPortal && NanoPortal.remote) {
    showAcademyToast('샘플 원생 입력은 로컬 체험에서만 사용할 수 있습니다. 운영 원생은 원생 등록에서 추가해 주세요.');
    return;
  }
  var sample1 = {
    id: 'S1027',
    name: '홍길동',
    gender: '남',
    password: '••••••',
    school: '나노 초등학교',
    grade: '초등 5학년',
    classGroup: '나노반',
    status: '승인',
    level: '초등 심화 Lv 5',
    bookCount: 0,
    quizAvg: '0.0',
    parentName: '김영희',
    phone: '010-1234-5678',
    parentEmail: 'nano@nano.co.kr',
    reportYn: true,
    lastDate: '2026.09.09',
    createdAt: '2026.09.09',
    teacher: '김나노',
    memo: '메모 샘플',
    joinDate: '2026-09-09'
  };

  studentDataList.unshift(sample1);
  lastAddedStudentId = 'S1027';

  saveStudentsToStorage();
  updateAllStudentCounts();
  if (typeof initPortfolioOptions === 'function') initPortfolioOptions();

  if (window.jQuery && typeof $('#studentExcelModal').modal === 'function') {
    $('#studentExcelModal').modal('hide');
  } else {
    hideModalVanilla('studentExcelModal');
  }

  filterStudents();
  showAcademyToast('엑셀 샘플 서식의 예시 원생(홍길동)이 성공적으로 등록되었습니다.');
}

// ==============================================================
// 3-3-B. 원생 등록 표준 엑셀 양식 다운로드 (SheetJS + 셀 배경 음영 + 학년코드 안내 + 단일 샘플 + 아이디 기입)
// ==============================================================
function downloadStudentExcelTemplate() {
  // 최상단 필독 안내 배너 (학년 코드 안내 및 등록 유의사항)
  var noticeText = "★ [필독 안내] 학년코드: 0(유치부), 1(초1), 2(초2), 3(초3), 4(초4), 5(초5), 6(초6), 7(중1), 8(중2), 9(중3) (또는 '유치부', '초1', '초2', '중1' 직접 기입 가능) | 아이디는 영문/숫자 조합 권장 | 클래스 및 지도교사는 학원에 등록된 실제 명칭만 기입 (교사는 '지도교사' 호칭 생략 후 이름만 기입, 미등록 시 등록 실패)";

  // 컬럼 헤더 (필수 / 선택 명시 - 아이디 기입란 포함 총 12개 컬럼)
  var headers = [
    "원생이름(필수)",
    "아이디(필수)",
    "성별(필수)",
    "초기비밀번호(필수)",
    "학교명(필수)",
    "학년코드(필수)",
    "클래스(필수)",
    "학부모이름(선택)",
    "학부모연락처(선택)",
    "학부모이메일(선택)",
    "담당지도교사(선택)",
    "메모(선택)"
  ];

  // 단일 샘플 데이터 행 (사용자 요청 1개 샘플, ex) 문구 포함)
  var sampleRows = [
    [
      "ex) 홍길동",
      "ex) hong1001",
      "ex) 남",
      "ex) 123456",
      "ex) 나노 초등학교",
      "ex) 5",
      "ex) 나노반",
      "ex) 김영희",
      "ex) 010-1234-5678",
      "ex) nano@nano.co.kr",
      "ex) 김나노",
      "ex) 메모 샘플"
    ]
  ];

  var fileName = "나노_원생등록_양식_v2.xlsx";

  // 1. SheetJS(XLSX) 라이브러리 사용 시 실제 Excel(.xlsx) 파일 생성
  if (typeof XLSX !== 'undefined') {
    var noticeRow = [noticeText, "", "", "", "", "", "", "", "", "", "", ""];
    var wsData = [noticeRow, headers].concat(sampleRows);
    var ws = XLSX.utils.aoa_to_sheet(wsData);

    // 1행 병합 (A1:L1, 총 12개 컬럼)
    ws['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 11 } }
    ];

    // 행 높이 설정 (안내행 36pt, 헤더행 28pt, 샘플행 24pt)
    ws['!rows'] = [
      { hpt: 36 },
      { hpt: 28 },
      { hpt: 24 }
    ];

    // 가독성을 위한 컬럼 너비 지정
    ws['!cols'] = [
      { wch: 16 }, // 원생이름(필수)
      { wch: 16 }, // 아이디(필수)
      { wch: 12 }, // 성별(필수)
      { wch: 18 }, // 초기비밀번호(필수)
      { wch: 20 }, // 학교명(필수)
      { wch: 16 }, // 학년코드(필수)
      { wch: 16 }, // 클래스(필수)
      { wch: 16 }, // 학부모이름(선택)
      { wch: 20 }, // 학부모연락처(선택)
      { wch: 24 }, // 학부모이메일(선택)
      { wch: 18 }, // 담당지도교사(선택)
      { wch: 24 }  // 메모(선택)
    ];

    // [최상단 배경색 음영 및 디자인 서식 적용]
    // 1. 안내행 (A1) 스타일: 부드러운 웜 크림/베이지 음영 (#F5EFE6)
    if (ws['A1']) {
      ws['A1'].s = {
        fill: { fgColor: { rgb: "F5EFE6" } },
        font: { name: "맑은 고딕", sz: 10, bold: true, color: { rgb: "4A3F35" } },
        alignment: { vertical: "center", horizontal: "left", wrapText: true },
        border: {
          top: { style: "thin", color: { rgb: "D1C7B7" } },
          bottom: { style: "thin", color: { rgb: "D1C7B7" } },
          left: { style: "thin", color: { rgb: "D1C7B7" } },
          right: { style: "thin", color: { rgb: "D1C7B7" } }
        }
      };
    }

    // 2. 컬럼 헤더행 (A2 ~ L2) 스타일: 세련된 베이지/스톤 음영 (#E8E2D8), 볼드, 중앙정렬
    var colLetters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];
    colLetters.forEach(function(col) {
      var cellRef = col + '2';
      if (ws[cellRef]) {
        ws[cellRef].s = {
          fill: { fgColor: { rgb: "E8E2D8" } },
          font: { name: "맑은 고딕", sz: 11, bold: true, color: { rgb: "1E242B" } },
          alignment: { vertical: "center", horizontal: "center" },
          border: {
            top: { style: "thin", color: { rgb: "C4B9A7" } },
            bottom: { style: "medium", color: { rgb: "8C7E6A" } },
            left: { style: "thin", color: { rgb: "C4B9A7" } },
            right: { style: "thin", color: { rgb: "C4B9A7" } }
          }
        };
      }
    });

    // 3. 샘플 데이터행 (A3 ~ L3) 스타일: 이탤릭, 은은한 그레이 텍스트
    colLetters.forEach(function(col) {
      var cellRef = col + '3';
      if (ws[cellRef]) {
        ws[cellRef].s = {
          font: { name: "맑은 고딕", sz: 10, italic: true, color: { rgb: "64748B" } },
          alignment: { vertical: "center", horizontal: "center" },
          border: {
            top: { style: "thin", color: { rgb: "E2E8F0" } },
            bottom: { style: "thin", color: { rgb: "E2E8F0" } },
            left: { style: "thin", color: { rgb: "E2E8F0" } },
            right: { style: "thin", color: { rgb: "E2E8F0" } }
          }
        };
      }
    });

    var wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "원생등록양식");
    XLSX.writeFile(wb, fileName);
    showAcademyToast("표준 원생 등록 서식 [" + fileName + "] 파일이 다운로드되었습니다.");
    return;
  }

  // 2. Fallback: UTF-8 BOM CSV 파일 다운로드
  var csvContent = "\uFEFF" + '"' + noticeText.replace(/"/g, '""') + '"' + "\n" +
    headers.map(function(h) { return '"' + h + '"'; }).join(",") + "\n" +
    sampleRows.map(function(r) { return r.map(function(cell) { return '"' + cell + '"'; }).join(","); }).join("\n");

  var blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url;
  a.download = "나노_원생등록_양식_v2.csv";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showAcademyToast("표준 원생 등록 서식 CSV 파일이 다운로드되었습니다.");
}

// 학년 코드 변환 헬퍼 함수 (0~9 숫자코드 및 초1~중3 단축문자 모두 지원)
function convertGradeCodeToText(codeStr) {
  var raw = String(codeStr || '').replace(/^ex\s*[\):]?\s*/i, '').trim();
  if (raw === '0') return '유치부';
  if (raw === '1') return '초등 1학년';
  if (raw === '2') return '초등 2학년';
  if (raw === '3') return '초등 3학년';
  if (raw === '4') return '초등 4학년';
  if (raw === '5') return '초등 5학년';
  if (raw === '6') return '초등 6학년';
  if (raw === '7') return '중등 1학년';
  if (raw === '8') return '중등 2학년';
  if (raw === '9') return '중등 3학년';

  if (/^초[등\s]*1(?:학년)?$/.test(raw)) return '초등 1학년';
  if (/^초[등\s]*2(?:학년)?$/.test(raw)) return '초등 2학년';
  if (/^초[등\s]*3(?:학년)?$/.test(raw)) return '초등 3학년';
  if (/^초[등\s]*4(?:학년)?$/.test(raw)) return '초등 4학년';
  if (/^초[등\s]*5(?:학년)?$/.test(raw)) return '초등 5학년';
  if (/^초[등\s]*6(?:학년)?$/.test(raw)) return '초등 6학년';
  if (/^중[등\s]*1(?:학년)?$/.test(raw)) return '중등 1학년';
  if (/^중[등\s]*2(?:학년)?$/.test(raw)) return '중등 2학년';
  if (/^중[등\s]*3(?:학년)?$/.test(raw)) return '중등 3학년';
  if (/^유치부|^미취학|^유아|^유치/.test(raw)) return '유치부';

  if (raw.indexOf('학년') !== -1) return raw;
  return raw || '초등 1학년';
}

// 엑셀 파일 직접 선택 업로드 핸들러 (유효성 검사 및 정밀 안내)
function handleStudentExcelFileSelect(input) {
  if (!input.files || input.files.length === 0) return;
  var file = input.files[0];
  var fileNameEl = document.getElementById('studentExcelFileName');
  if (fileNameEl) {
    fileNameEl.innerHTML = '<span class="text-success font-weight-bold"><i class="fa-solid fa-file-excel mr-1"></i>' + file.name + ' (' + (file.size / 1024).toFixed(1) + ' KB)</span>';
  }

  // 값 정제 헬퍼 (ex) 접두어 제거)
  function cleanVal(v) {
    if (v == null) return '';
    return String(v).replace(/^ex\s*[\):]?\s*/i, '').trim();
  }

  if (typeof XLSX !== 'undefined') {
    var reader = new FileReader();
    reader.onload = async function(e) {
      try {
        var data = new Uint8Array(e.target.result);
        var workbook = XLSX.read(data, { type: 'array' });
        var firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        var rows = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
        if (!rows || rows.length < 2) {
          alert('업로드 실패: 엑셀 파일에 원생 데이터가 없습니다.');
          return;
        }

        // 1. 헤더 행 동적 탐색 (1행 안내문 배너 유무에 관계없이 2행 컬럼 헤더를 정확히 감지)
        var headerRowIdx = -1;
        for (var rIdx = 0; rIdx < Math.min(rows.length, 5); rIdx++) {
          var r = rows[rIdx];
          if (!Array.isArray(r) || r.length === 0) continue;

          // 1행과 같은 긴 안내 문구(병합 배너 셀)는 컬럼 헤더가 아니므로 건너뜀
          var firstCell = String(r[0] || '').trim();
          if (firstCell.length > 30 || /필독|안내|코드설명|가이드/i.test(firstCell)) {
            continue;
          }

          // 실제 컬럼 헤더 행은 복수의 셀에 컬럼명(이름, 아이디, 성별, 학년, 클래스 등)이 3개 이상 매칭됨
          var matchCount = 0;
          r.forEach(function(cell) {
            var s = String(cell || '').trim();
            if (/^(?:원생|학생)?\s*이름(?:\(필수\)|\(선택\))?$/i.test(s) ||
                /^(?:원생|학생)?\s*아이디(?:\(필수\)|\(선택\))?$|^ID(?:\(필수\)|\(선택\))?$/i.test(s) ||
                /^성별(?:\(필수\)|\(선택\))?$/i.test(s) ||
                /^(?:초기)?비밀번호(?:\(필수\)|\(선택\))?$/i.test(s) ||
                /^학교(?:명)?(?:\(필수\)|\(선택\))?$/i.test(s) ||
                /^학년(?:코드)?(?:\(필수\)|\(선택\))?$/i.test(s) ||
                /^(?:클래스|학급|반)(?:\(필수\)|\(선택\))?$/i.test(s) ||
                /^(?:학부모|보호자)(?:이름|명)?(?:\(필수\)|\(선택\))?$/i.test(s) ||
                /^(?:학부모|보호자)?(?:연락처|전화번호)(?:\(필수\)|\(선택\))?$/i.test(s) ||
                /^(?:학부모|보호자)?(?:이메일)(?:\(필수\)|\(선택\))?$/i.test(s) ||
                /^(?:담당)?(?:지도)?교사(?:\(필수\)|\(선택\))?$/i.test(s) ||
                /^(?:메모|비고)(?:\(필수\)|\(선택\))?$/i.test(s)) {
              matchCount++;
            }
          });

          if (matchCount >= 3) {
            headerRowIdx = rIdx;
            break;
          }
        }

        if (headerRowIdx === -1) {
          alert('엑셀 양식 오류\n\n올바른 나노 원생 등록 양식이 아닙니다.\n[양식 다운로드] 버튼으로 표준 양식을 내려받아 작성해 주세요.');
          return;
        }

        // 컬럼 인덱스 동적 매핑
        var headers = rows[headerRowIdx];
        var colMap = {
          name: 0, id: 1, gender: 2, password: 3, school: 4, grade: 5,
          classGroup: 6, parentName: 7, phone: 8, parentEmail: 9,
          teacher: 10, memo: 11
        };

        headers.forEach(function(h, idx) {
          var s = String(h || '').trim();
          // 1. [우선 검사] 학부모/보호자 관련 컬럼을 먼저 매칭하여 '학부모이름'이 '원생이름'으로 오인식되는 문제 원천 차단
          if (/학부모\s*이름|보호자\s*이름|학부모명|보호자명/i.test(s)) {
            colMap.parentName = idx;
          } else if (/학부모\s*연락처|보호자\s*연락처|학부모\s*전화|보호자\s*전화/i.test(s)) {
            colMap.phone = idx;
          } else if (/학부모\s*이메일|보호자\s*이메일/i.test(s)) {
            colMap.parentEmail = idx;
          }
          // 2. [원생 본인 정보 검사]
          else if (/원생\s*아이디|학생\s*아이디|^아이디|회원계정|^ID(?:\(|$)/i.test(s)) {
            colMap.id = idx;
          } else if (/원생\s*이름|학생\s*이름|^이름(?:\(|$)/i.test(s)) {
            colMap.name = idx;
          } else if (/^성별(?:\(|$)/i.test(s)) {
            colMap.gender = idx;
          } else if (/비밀번호|패스워드|암호/i.test(s)) {
            colMap.password = idx;
          } else if (/학교/i.test(s)) {
            colMap.school = idx;
          } else if (/학년/i.test(s)) {
            colMap.grade = idx;
          } else if (/클래스|학급|^반(?:\(|$)/i.test(s)) {
            colMap.classGroup = idx;
          } else if (/이메일/i.test(s)) {
            colMap.parentEmail = idx;
          } else if (/지도교사|교사|선생님|담당/i.test(s)) {
            colMap.teacher = idx;
          } else if (/메모|비고|특이사항/i.test(s)) {
            colMap.memo = idx;
          } else if (/연락처|전화번호/i.test(s)) {
            if (colMap.phone === -1 || colMap.phone === 8) colMap.phone = idx;
          }
        });

        // 학원 내 유효 학급 목록 조회
        var validClasses = (typeof academyClassList !== 'undefined' && Array.isArray(academyClassList) && academyClassList.length > 0)
          ? academyClassList.map(function(c) { return String(c.name || '').trim(); }).filter(Boolean)
          : ['나노반', '지혜반', '슬기반', '마스터반', '심화반', '새싹반', '탐구반'];

        // 학원 내 유효 교사 목록 조회
        var currentTeachers = (typeof teacherDataList !== 'undefined' && Array.isArray(teacherDataList) && teacherDataList.length > 0)
          ? teacherDataList
          : loadTeachersFromStorage();
        var validTeacherNames = (currentTeachers || []).map(function(t) {
          return String(t.name || '').trim();
        }).filter(Boolean);

        if (currentAcademyInfo && currentAcademyInfo.director) {
          var dirName = String(currentAcademyInfo.director).replace(/(?:원장|지도교사|선생님|교사)/g, '').trim();
          if (dirName && validTeacherNames.indexOf(dirName) === -1) {
            validTeacherNames.push(dirName);
          }
        }
        if (validTeacherNames.length === 0) {
          validTeacherNames = ['박선혜', '최승현', '김나노'];
        }

        var newStudents = [];

        // 2. 데이터 행 파싱 및 유효성 검사 (검증 실패 시 즉시 중단 및 원인 안내창 표시)
        for (var i = headerRowIdx + 1; i < rows.length; i++) {
          var r = rows[i];
          if (!r || r.length === 0) continue;

          var rawName = String(r[colMap.name] || '').trim();
          var name = cleanVal(rawName);
          if (!name) continue;

          // 헤더 명칭 행이거나 필수/선택 라벨이 포함된 경우 데이터 행이 아니므로 건너뜀 (안전 방어)
          if (/^(?:원생|학생)?\s*이름$/i.test(name) || name.indexOf('(필수)') !== -1 || name.indexOf('(선택)') !== -1 || /필독|안내/.test(name)) {
            continue;
          }

          // 예시 샘플 행 건너뛰기 (홍길동 or 템플릿 샘플 데이터가 엑셀에 그대로 남겨진 경우 방어)
          if (name === '홍길동' && (cleanVal(r[colMap.school]) === '나노 초등학교' || cleanVal(r[colMap.classGroup]) === '나노반')) {
            continue;
          }

          var rowDisplayNum = i + 1;

          // [검증 1] 소속 학급(클래스) 필수 검증 및 존재 여부 검사
          var inputClass = cleanVal(r[colMap.classGroup]);
          if (!inputClass) {
            alert('엑셀 일괄 등록 실패\n\n' + rowDisplayNum + '행 원생 [' + name + ']의 소속 학급(클래스)이 기입되지 않았습니다.\n\n학급은 필수 입력 항목입니다. 등록된 학급명을 기입해 주세요.');
            return;
          }
          var classMatched = validClasses.some(function(clsName) {
            return clsName.toLowerCase() === inputClass.toLowerCase();
          });
          if (!classMatched) {
            alert('엑셀 일괄 등록 실패\n\n존재하지 않는 학급(클래스)이 기입되어 등록이 중단되었습니다.\n\n• 원생: ' + name + ' (' + rowDisplayNum + '번째 행)\n• 입력된 학급명: "' + inputClass + '"\n\n현재 학원에 등록된 학급 목록:\n[' + validClasses.join(', ') + ']\n\n※ 학원 관리자 화면의 [학급관리] 메뉴에서 학급을 먼저 생성하시거나, 올바른 학급명을 입력해 주세요.');
            return;
          }

          // [검증 2] 담당 지도교사 유효성 검사 (입력된 경우에만 검증, '지도교사' 호칭 생략 지원)
          var inputTeacher = cleanVal(r[colMap.teacher]);
          var matchedTeacherName = '';
          if (inputTeacher) {
            var cleanTeacherSearch = inputTeacher.replace(/(?:지도)?교사|선생님/g, '').trim().toLowerCase();
            var foundTeacher = validTeacherNames.find(function(tName) {
              var cleanT = tName.replace(/(?:지도)?교사|선생님/g, '').trim().toLowerCase();
              return cleanT === cleanTeacherSearch || tName.toLowerCase() === inputTeacher.toLowerCase();
            });

            if (!foundTeacher) {
              var cleanTeacherList = validTeacherNames.map(function(n) {
                return n.replace(/(?:지도)?교사|선생님/g, '').trim();
              }).filter(Boolean);

              alert('엑셀 일괄 등록 실패\n\n학원에 등록되지 않은 담당 지도교사 성함이 기입되어 등록이 중단되었습니다.\n\n• 원생: ' + name + ' (' + rowDisplayNum + '번째 행)\n• 입력된 교사명: "' + inputTeacher + '"\n\n현재 학원에 등록된 지도교사 목록:\n[' + cleanTeacherList.join(', ') + ']\n\n※ 담당교사는 \'지도교사\' 호칭 없이 성함만 입력하시면 됩니다.\n새로운 선생님은 [교사관리] 메뉴에서 먼저 등록하신 후 진행해 주세요.');
              return;
            }
            matchedTeacherName = foundTeacher.indexOf('지도교사') === -1 ? (foundTeacher + ' 지도교사') : foundTeacher;
          } else {
            matchedTeacherName = '미지정';
          }

          // [검증 3] 학년 코드 변환 (0~9, 초1~중3 -> 표준 텍스트)
          var rawGrade = cleanVal(r[colMap.grade]);
          var grade = convertGradeCodeToText(rawGrade);

          // [검증 4] 원생 아이디(ID) 설정 및 중복 검증
          var inputId = (colMap.id !== -1 && r[colMap.id] != null) ? cleanVal(r[colMap.id]) : '';
          var studentId = inputId;

          if (!studentId) {
            // 미입력 시 자동 생성
            studentId = 'S' + (1030 + studentDataList.length + newStudents.length);
          } else {
            // 중복 아이디 여부 검사
            var isDuplicate = studentDataList.some(function(s) {
              return String(s.id || '').toLowerCase() === studentId.toLowerCase();
            }) || newStudents.some(function(s) {
              return String(s.id || '').toLowerCase() === studentId.toLowerCase();
            });

            if (isDuplicate) {
              alert('엑셀 일괄 등록 실패\n\n이미 사용 중인 원생 아이디(ID)가 기입되어 등록이 중단되었습니다.\n\n• 원생: ' + name + ' (' + rowDisplayNum + '번째 행)\n• 중복된 아이디: "' + studentId + '"\n\n다른 고유한 원생 아이디를 기입해 주세요.');
              return;
            }
          }

          var gender = cleanVal(r[colMap.gender]) || '남';
          if (gender.indexOf('여') !== -1) gender = '여';
          else gender = '남';

          var password = cleanVal(r[colMap.password]) || '123456';
          var school = cleanVal(r[colMap.school]) || '나노초등학교';
          var parentName = cleanVal(r[colMap.parentName]);
          var phone = cleanVal(r[colMap.phone]);
          var parentEmail = cleanVal(r[colMap.parentEmail]);
          var memo = cleanVal(r[colMap.memo]) || '엑셀 일괄 등록 원생';

          var todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, '.');

          newStudents.push({
            id: studentId,
            name: name,
            gender: gender,
            password: password,
            school: school,
            grade: grade,
            classGroup: inputClass,
            status: '승인',
            level: grade.indexOf('중등') !== -1 ? '중등 논술 과정' : (grade + ' 독서'),
            bookCount: 0,
            quizAvg: '0.0',
            parentName: parentName,
            phone: phone,
            parentEmail: parentEmail,
            reportYn: true,
            lastDate: todayStr,
            createdAt: todayStr,
            teacher: matchedTeacherName,
            memo: memo,
            joinDate: todayStr.replace(/\./g, '-')
          });
        }

        if (newStudents.length > 0) {
          // 원격 포털 연동 시 서버 저장 처리
          if (window.NanoPortal && NanoPortal.remote) {
            for (var k = 0; k < newStudents.length; k++) {
              try {
                await NanoPortal.saveMember(newStudents[k], currentAcademyInfo.id);
              } catch (saveErr) {
                console.warn('포털 원격 저장 경고:', saveErr);
              }
            }
          }

          // studentDataList 최신순 추가
          for (var j = newStudents.length - 1; j >= 0; j--) {
            studentDataList.unshift(newStudents[j]);
          }
          lastAddedStudentId = newStudents[0].id;

          // MIGRATED_MEMBERS 전역 데이터에도 동기화 (마스터 관리자 및 타 화면 일관성 유지)
          if (typeof window !== 'undefined' && Array.isArray(window.MIGRATED_MEMBERS)) {
            newStudents.forEach(function(st) {
              window.MIGRATED_MEMBERS.unshift({
                username: st.id,
                name: st.name,
                role: 'STUDENT',
                academyId: currentAcademyInfo.id,
                academyName: currentAcademyInfo.name,
                school: st.school,
                grade: st.grade,
                className: st.classGroup,
                status: 'APPROVED',
                parentName: st.parentName,
                parentPhone: st.phone,
                parentEmail: st.parentEmail,
                teacherName: st.teacher,
                memo: st.memo,
                bookCount: 0,
                points: 0,
                createdAt: st.createdAt
              });
            });
          }

          saveStudentsToStorage();
          updateAllStudentCounts();
          if (typeof initPortfolioOptions === 'function') initPortfolioOptions();

          if (window.jQuery && typeof $('#studentExcelModal').modal === 'function') {
            $('#studentExcelModal').modal('hide');
          } else {
            hideModalVanilla('studentExcelModal');
          }

          filterStudents();
          showAcademyToast('업로드한 엑셀 파일에서 ' + newStudents.length + '명의 원생이 성공적으로 일괄 등록되었습니다.');
          return;
        } else {
          alert('등록할 수 있는 원생 데이터가 없습니다.\n엑셀 파일에 유효한 원생 명단이 작성되어 있는지 확인해 주세요.');
          return;
        }
      } catch (err) {
        console.error("엑셀 파싱 오류:", err);
        alert('엑셀 파일을 읽는 도중 오류가 발생했습니다: ' + err.message);
      }
    };
    reader.readAsArrayBuffer(file);
    return;
  }

  // Fallback
  setTimeout(function() {
    importSampleExcelStudents();
  }, 400);
}

// 3-4. 원생 테이블 렌더링 & 페이징 & 필터링 (한 페이지 20명 단위)
// ==============================================================
var studentPageSize = 20;
var studentCurrentPage = 1;
var currentFilteredStudents = [];

function renderStudentTable(list, page) {
  var tbody = document.getElementById('studentTableBody');
  if (!tbody) return;
  tbody.innerHTML = '';

  var dataList = list || studentDataList;
  currentFilteredStudents = dataList;

  var total = dataList.length;
  var totalPages = Math.ceil(total / studentPageSize) || 1;

  page = page || studentCurrentPage || 1;
  if (page > totalPages) page = totalPages;
  if (page < 1) page = 1;
  studentCurrentPage = page;

  var countEl = document.getElementById('searchResultCount');
  if (countEl) countEl.innerText = total;

  if (total === 0) {
    var emptyMessage = (studentDataList.length === 0)
      ? '<div class="py-4"><i class="fa-solid fa-user-plus text-primary mb-2" style="font-size: 28px; opacity: 0.7;"></i><br><strong style="font-size: 14.5px; color: var(--text-main);">등록된 원생이 없습니다.</strong><br><span style="font-size: 12.5px; color: var(--text-muted);">우측 상단의 <strong>[+ 원생 등록]</strong> 또는 <strong>[엑셀 일괄 등록]</strong>을 통해 첫 원생을 등록해 보세요.</span></div>'
      : '일치하는 원생이 없습니다.';
    tbody.innerHTML = '<tr><td colspan="11" class="text-center py-4 text-muted">' + emptyMessage + '</td></tr>';
    renderStudentPagination(0, 1, 1);
    return;
  }

  // 한 페이지 20명 슬라이스
  var startIndex = (page - 1) * studentPageSize;
  var pageItems = dataList.slice(startIndex, startIndex + studentPageSize);

  pageItems.forEach(function(std, index) {
    var tr = document.createElement('tr');
    if (std.id === lastAddedStudentId) {
      tr.className = 'row-highlight-new';
    }

    var rowNo = total - (startIndex + index); // 전체 기준 내림차순 번호
    var avgScoreNum = parseFloat(std.quizAvg);
    var quizScoreDisplay = (std.quizAvg === '0.0' || std.quizAvg === 0 || std.quizAvg === '-' || isNaN(avgScoreNum)) ? '<span class="text-muted">-</span>' : Math.round(avgScoreNum) + '점';

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
      '<td class="text-center"><span class="font-weight-bold" style="color:#64748b; font-size:12.5px;">' + rowNo + '</span></td>' +
      '<td class="text-center"><small class="text-muted font-weight-bold">' + std.id + '</small></td>' +
      '<td class="text-center"><span class="student-link font-weight-bold" onclick="openStudentEditModal(\'' + std.id + '\')">' + std.name + '</span>' + 
      (std.id === lastAddedStudentId ? ' <span class="badge badge-warning text-dark ml-1" style="font-size:10px;">신규</span>' : '') + '</td>' +
      '<td class="text-center">' + genderBadge + '</td>' +
      '<td class="text-center">' + std.school + ' <small class="text-muted">(' + std.grade + ')</small></td>' +
      '<td class="text-center">' + classBadge + '</td>' +
      '<td class="text-center">' + statusBadge + '</td>' +
      '<td class="text-center">' + parentInfo + '</td>' +
      '<td class="text-center"><small class="text-muted font-weight-bold">' + createDateStr + '</small></td>' +
      '<td class="text-center font-weight-bold">' + std.bookCount + '권 <small class="text-success font-weight-bold">(' + quizScoreDisplay + ')</small></td>' +
      '<td class="text-center" style="white-space: nowrap;">' +
        '<div class="d-inline-flex flex-row align-items-center justify-content-center" style="gap: 5px; width: 100%;">' +
          '<button type="button" class="btn btn-xs btn-outline-secondary" onclick="openStudentEditModal(\'' + std.id + '\')" title="수정 및 상태 변경" style="width: 56px; height: 26px; padding: 0; display: inline-flex; align-items: center; justify-content: center; border-radius: 6px; font-size: 11.5px; font-weight: 600;"><i class="fa-solid fa-pen mr-1"></i>수정</button>' +
          (!isCurrentLoggedInTeacher() ? '<button type="button" class="btn btn-xs btn-outline-danger" onclick="deleteStudent(\'' + std.id + '\')" title="원생 삭제 (학급 미지정 변환)" style="width: 56px; height: 26px; padding: 0; display: inline-flex; align-items: center; justify-content: center; border-radius: 6px; font-size: 11.5px; font-weight: 600;"><i class="fa-solid fa-trash-can mr-1"></i>삭제</button>' : '') +
        '</div>' +
      '</td>';
    tbody.appendChild(tr);
  });

  renderStudentPagination(total, page, totalPages);
}

// 원생 목록 페이징 바 렌더링 (최대 10개 번호 블록 & 10페이지 이전/다음 화살표)
function renderStudentPagination(total, page, totalPages) {
  var infoEl = document.getElementById('studentPageInfo');
  var pagEl = document.getElementById('studentPagination');
  if (!pagEl) return;

  if (total === 0) {
    if (infoEl) infoEl.innerHTML = '일치하는 원생이 없습니다.';
    pagEl.innerHTML = '';
    return;
  }

  var startItem = (page - 1) * studentPageSize + 1;
  var endItem = Math.min(page * studentPageSize, total);
  if (infoEl) {
    infoEl.innerHTML = `총 <b>${total.toLocaleString()}</b>명 중 <b>${startItem}-${endItem}</b>명 표시 <span class="text-muted ml-1" style="font-weight: 500;">(페이지 ${page} / ${totalPages})</span>`;
  }

  var html = '';
  // 10페이지 단위 페이징 블록 (1~10, 11~20...)
  var blockSize = 10;
  var startPage = Math.floor((page - 1) / blockSize) * blockSize + 1;
  var endPage = Math.min(startPage + blockSize - 1, totalPages);

  // 처음으로 및 이전 10페이지
  html += `<button type="button" class="acad-page-btn" onclick="goStudentPage(1)" ${page === 1 ? 'disabled' : ''} title="첫 페이지"><i class="fa-solid fa-angles-left"></i></button>`;
  html += `<button type="button" class="acad-page-btn" onclick="goStudentPage(${Math.max(1, startPage - blockSize)})" ${startPage === 1 ? 'disabled' : ''} title="이전 10페이지"><i class="fa-solid fa-angle-left"></i></button>`;

  // 1~10 페이지 번호
  for (var p = startPage; p <= endPage; p++) {
    if (p === page) {
      html += `<button type="button" class="acad-page-btn active" aria-current="page">${p}</button>`;
    } else {
      html += `<button type="button" class="acad-page-btn" onclick="goStudentPage(${p})">${p}</button>`;
    }
  }

  // 다음 10페이지 및 마지막 페이지
  html += `<button type="button" class="acad-page-btn" onclick="goStudentPage(${Math.min(totalPages, startPage + blockSize)})" ${endPage >= totalPages ? 'disabled' : ''} title="다음 10페이지"><i class="fa-solid fa-angle-right"></i></button>`;
  html += `<button type="button" class="acad-page-btn" onclick="goStudentPage(${totalPages})" ${page === totalPages ? 'disabled' : ''} title="마지막 페이지"><i class="fa-solid fa-angles-right"></i></button>`;

  pagEl.innerHTML = html;
}

// 특정 페이지로 이동
function goStudentPage(targetPage) {
  if (targetPage < 1) targetPage = 1;
  studentCurrentPage = targetPage;
  renderStudentTable(currentFilteredStudents, targetPage);

  var tableEl = document.getElementById('studentTableBody');
  if (tableEl) {
    var cardEl = tableEl.closest('.simple-card');
    if (cardEl) {
      cardEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
}

// 원생 검색 입력 실시간 핸들러
function handleStudentSearchInput(input) {
  var clearBtn = document.getElementById("btnStudentSearchClear");
  if (clearBtn) {
    clearBtn.style.display = (input && input.value.trim().length > 0) ? "inline-flex" : "none";
  }
}

// 원생 검색어 원클릭 클리어
function clearStudentSearch() {
  var input = document.getElementById("searchStudentInput");
  if (input) input.value = "";
  var clearBtn = document.getElementById("btnStudentSearchClear");
  if (clearBtn) clearBtn.style.display = "none";
  var badgeEl = document.getElementById("studentSearchActiveBadge");
  if (badgeEl) { badgeEl.style.display = "none"; badgeEl.innerHTML = ""; }
  filterStudents();
}

function filterStudents(keepPage) {
  if (!keepPage) {
    studentCurrentPage = 1;
  }
  var classVal = document.getElementById('filterStudentClass') ? document.getElementById('filterStudentClass').value : 'ALL';
  var query = (document.getElementById('searchStudentInput') ? document.getElementById('searchStudentInput').value : '').toLowerCase().trim();
  var statusVal = document.getElementById('filterStudentStatus') ? document.getElementById('filterStudentStatus').value : 'ALL';

  // ✕ 버튼 상태 동기화
  var clearBtn = document.getElementById("btnStudentSearchClear");
  if (clearBtn) clearBtn.style.display = query.length > 0 ? "inline-flex" : "none";

  var filtered = studentDataList.filter(function(std) {
    var matchClass = (classVal === 'ALL') || (std.classGroup === classVal);
    var matchQuery = !query || 
      std.name.toLowerCase().indexOf(query) !== -1 || 
      std.id.toLowerCase().indexOf(query) !== -1 || 
      (std.parentName && std.parentName.toLowerCase().indexOf(query) !== -1) ||
      (std.school && std.school.toLowerCase().indexOf(query) !== -1);
    var stdStatus = std.status || '승인';
    var matchStatus = (statusVal === 'ALL') || (stdStatus === statusVal);
    return matchClass && matchQuery && matchStatus;
  });

  // 활성 검색 배지 상태 동기화
  var badgeEl = document.getElementById("studentSearchActiveBadge");
  if (badgeEl) {
    if (query) {
      badgeEl.style.display = "block";
      var displayQ = query.length > 25 ? query.substring(0, 25) + '...' : query;
      badgeEl.innerHTML = '<span class="badge-search-active"><i class="fa-solid fa-magnifying-glass mr-1"></i>"' + displayQ + '" 검색 결과 ' + filtered.length.toLocaleString() + '명 <span class="badge-clear-link" onclick="clearStudentSearch()" title="검색 필터 해제">✕ 검색 해제</span></span>';
    } else {
      badgeEl.style.display = "none";
      badgeEl.innerHTML = "";
    }
  }

  renderStudentTable(filtered, studentCurrentPage);
}

function renderTeacherTable(customList) {
  var tbody = document.getElementById('teacherTableBody');
  if (!tbody) return;
  tbody.innerHTML = '';

  var rawList = customList || teacherDataList || [];
  var listToRender = rawList.filter(function(t) {
    return !isAcademyDirector(t);
  });
  var countEl = document.getElementById('teacherTotalCount');
  if (countEl) countEl.innerText = listToRender.length;
  var tabTeacherEl = document.getElementById('tabTeacherCount');
  if (tabTeacherEl) tabTeacherEl.innerText = listToRender.length;

  if (listToRender.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" class="text-center py-4 text-muted">검색된 선생님 정보가 없습니다.</td></tr>';
    return;
  }

  listToRender.forEach(function(t, idx) {
    // 학급관리에서 해당 교사가 배정된 학급들 실시간 추출
    var assignedClasses = academyClassList.filter(function(c) {
      return c.teacher && c.teacher.indexOf(t.name) !== -1;
    });
    var classNamesStr = assignedClasses.length > 0 
      ? assignedClasses.map(function(c) { return c.name + '(' + c.grade.replace(/학년|전학년/g, '').trim() + ')'; }).join(', ')
      : '<span class="text-muted">배정 학급 없음 (학급관리에서 배정)</span>';

    // 해당 교사 담당 학급들의 원생 수 실시간 합산
    var totalStudentCount = studentDataList.filter(function(s) {
      return assignedClasses.some(function(c) { return c.name === s.classGroup; });
    }).length;

    var tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="text-center"><small class="text-muted font-weight-bold">${idx + 1}</small></td>
      <td class="text-center">
        <strong style="font-size: 14px; color: var(--text-main);">${t.name}</strong>
        <small class="text-muted">(${t.username})</small>
      </td>
      <td class="text-center"><span class="badge-soft badge-soft-neutral">지도교사</span></td>
      <td class="text-center">${classNamesStr}</td>
      <td class="text-center font-weight-bold" style="color:var(--btn-primary);">${totalStudentCount}명</td>
      <td class="text-center">${typeof formatPhoneNumber === 'function' ? formatPhoneNumber(t.phone) : (t.phone || '-')}</td>
      <td class="text-center"><small class="text-muted">${t.joinDate}</small></td>
      <td class="text-center">
        <div class="d-inline-flex align-items-center justify-content-center" style="gap: 5px;">
          <button class="btn btn-xs btn-outline-secondary" onclick="openTeacherEditModal('${t.id}')" style="width: 58px; height: 26px; padding: 0; display: inline-flex; align-items: center; justify-content: center; border-radius: 6px; font-size: 11.5px; font-weight: 600;"><i class="fa-solid fa-pen mr-1"></i>수정</button>
          <button class="btn btn-xs btn-outline-danger" onclick="deleteTeacher('${t.id}')" style="width: 58px; height: 26px; padding: 0; display: inline-flex; align-items: center; justify-content: center; border-radius: 6px; font-size: 11.5px; font-weight: 600;"><i class="fa-solid fa-trash-can mr-1"></i>삭제</button>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// 선생님 관리 검색 필터 (검색 버튼 클릭 또는 Enter 시 실행)
function filterTeachers() {
  var input = document.getElementById('searchTeacherInput');
  var query = input ? input.value.trim().toLowerCase() : '';
  var baseList = (teacherDataList || []).filter(function(t) { return !isAcademyDirector(t); });
  if (!query) {
    renderTeacherTable(baseList);
    return;
  }
  var filtered = baseList.filter(function(t) {
    var matchName = t.name && t.name.toLowerCase().indexOf(query) !== -1;
    var matchUsername = t.username && t.username.toLowerCase().indexOf(query) !== -1;
    var matchPhone = t.phone && t.phone.indexOf(query) !== -1;
    return matchName || matchUsername || matchPhone;
  });
  renderTeacherTable(filtered);
}

// 선생님 검색 초기화
function resetTeacherSearch() {
  var input = document.getElementById('searchTeacherInput');
  if (input) input.value = '';
  var baseList = (teacherDataList || []).filter(function(t) { return !isAcademyDirector(t); });
  renderTeacherTable(baseList);
}

function openTeacherAddModal() {
  document.getElementById('teacherModalTitle').innerText = '신규 선생님(교사) 등록';
  document.getElementById('teacherFormId').value = '';
  document.getElementById('teacherNameInput').value = '';
  document.getElementById('teacherUsernameInput').value = '';
  var pwEl = document.getElementById('teacherPasswordInput');
  if (pwEl) {
    pwEl.value = '123456';
    pwEl.placeholder = '6자 이상 입력 (예: 123456)';
  }
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
  var pwEl = document.getElementById('teacherPasswordInput');
  if (pwEl) {
    pwEl.value = '';
    pwEl.placeholder = '비밀번호 변경 시에만 새 비밀번호 입력 (유지 시 빈칸)';
  }
  document.getElementById('teacherPhoneInput').value = t.phone || '';
  $('#teacherModal').modal('show');
}

async function handleSaveTeacher(e) {
  e.preventDefault();
  var id = document.getElementById('teacherFormId').value;
  var name = document.getElementById('teacherNameInput').value.trim();
  var username = document.getElementById('teacherUsernameInput').value.trim();
  var pwEl = document.getElementById('teacherPasswordInput');
  var password = pwEl ? pwEl.value.trim() : '';
  var phone = document.getElementById('teacherPhoneInput').value.trim();

  var korEngRegex = /^[가-힣ㄱ-ㅎㅏ-ㅣa-zA-Z\s]+$/;
  if (!name) {
    alert('선생님 성함을 입력해주세요.');
    document.getElementById('teacherNameInput').focus();
    return;
  }
  if (!korEngRegex.test(name)) {
    alert('선생님 성함은 한글 및 영문만 입력할 수 있습니다.');
    document.getElementById('teacherNameInput').focus();
    return;
  }
  if (!username) {
    alert('아이디를 입력해주세요.');
    document.getElementById('teacherUsernameInput').focus();
    return;
  }
  if (window.NanoPortal && NanoPortal.remote && ((!id && password.length < 6) || (id && password && password.length < 6))) {
    alert('비밀번호는 6자 이상 입력해 주세요.');
    if (pwEl) pwEl.focus();
    return;
  }

  var previousTeacher = null;
  var savedTeacher = null;
  var successMessage = '';
  if (id) {
    var t = teacherDataList.find(item => item.id === id);
    if (t) {
      previousTeacher = Object.assign({}, t);
      t.name = name;
      t.username = username;
      if (password) t.password = password;
      t.phone = phone;
      savedTeacher = t;
      successMessage = `[${name}] 선생님의 정보가 수정되었습니다.`;
    }
  } else {
    var exists = teacherDataList.some(item => item.username.toLowerCase() === username.toLowerCase());
    if (exists) {
      alert(`이미 존재하는 아이디(${username})입니다. 다른 아이디를 입력해주세요.`);
      document.getElementById('teacherUsernameInput').focus();
      return;
    }
    var newT = {
      id: 'T00' + (teacherDataList.length + 1),
      name: name,
      username: username,
      password: password || '1234',
      role: '지도교사',
      classes: '',
      studentCount: 0,
      phone: phone,
      joinDate: new Date().toISOString().split('T')[0]
    };
    teacherDataList.push(newT);
    savedTeacher = newT;
    successMessage = `[${name}] 신규 선생님이 성공적으로 등록되었습니다. (아이디: ${username})`;
  }

  if (window.NanoPortal && NanoPortal.remote) {
    try {
      await NanoPortal.saveMember(savedTeacher, currentAcademyInfo.id);
    } catch (error) {
      if (previousTeacher) Object.assign(savedTeacher, previousTeacher);
      else teacherDataList = teacherDataList.filter(function(teacher) { return teacher !== savedTeacher; });
      showAcademyToast('선생님 정보를 저장하지 못했습니다: ' + error.message);
      return;
    }
  }

  saveTeachersToStorage();
  $('#teacherModal').modal('hide');
  renderTeacherTable();
  showAcademyToast(successMessage);
}

async function deleteTeacher(id) {
  var t = teacherDataList.find(item => item.id === id);
  if (!t) return;
  if (confirm(`[${t.name}] 선생님 계정을 삭제하시겠습니까?`)) {
    if (window.NanoPortal && NanoPortal.remote) {
      try {
        await NanoPortal.deleteMember(t, currentAcademyInfo.id);
      } catch (error) {
        showAcademyToast('선생님 계정을 삭제하지 못했습니다: ' + error.message);
        return;
      }
    }
    teacherDataList = teacherDataList.filter(item => item.id !== id);
    saveTeachersToStorage();
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
  var detailAvgNum = parseFloat(std.quizAvg);
  document.getElementById('m_std_score').innerText = (std.quizAvg === '0.0' || std.quizAvg === 0 || std.quizAvg === '-' || isNaN(detailAvgNum)) ? '-' : Math.round(detailAvgNum) + '점';
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
  ['parentGuide', '가정 대화 팁', 4]
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
    html += '<div class="' + (growth ? 'p-3 mb-3 rounded' : '') + '"' + (growth ? ' style="background:#f0f8f6;border:1px solid #bddbd4;"' : '') + '>' +
      (growth ? '<p class="text-muted mb-2" style="font-size:12px;">' + (field[0] === 'nextStep' ? '다음 독서에서 시도할 작은 활동과 구체적인 실천 방법을 안내해 주세요.' : '아이의 표현을 바탕으로 칭찬 한마디와 함께 나눌 열린 질문을 적어 주세요.') + '</p>' : '') +
      worksheetEditorField('worksheetEdit-' + field[0], field[1], result[field[0]], field[2]) + '</div>';
  });
  document.getElementById('worksheetAiEditor').innerHTML = html;
}

function readWorksheetCorrectionEditor() {
  var result = JSON.parse(JSON.stringify(currentWorksheetAiResult || {}));
  worksheetEditableFields.forEach(function(field) {
    result[field[0]] = document.getElementById('worksheetEdit-' + field[0]).value.trim();
  });
  result.actualQuotes = (Array.isArray(result.actualQuotes) ? result.actualQuotes : []).map(function(q, i) {
    var edited = Object.assign({}, q);
    ['quote', 'criteria', 'comment'].forEach(function(key) { edited[key] = document.getElementById('worksheetQuote-' + i + '-' + key).value.trim(); });
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
// 콘텐츠 관리 (도서 목록 + 콘텐츠 학습자료 PDF 업로드) 로직
// 양장본 기본 도서 커버 (HTML 따옴표 깨짐 방지를 위한 안전한 Base64 SVG Data URI)
var DEFAULT_BOOK_COVER = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMjAgMTYwIiB3aWR0aD0iMTIwIiBoZWlnaHQ9IjE2MCI+CiAgPGRlZnM+CiAgICA8bGluZWFyR3JhZGllbnQgaWQ9ImNvdmVyQmciIHgxPSIwJSIgeTE9IjAlIiB4Mj0iMTAwJSIgeTI9IjEwMCUiPgogICAgICA8c3RvcCBvZmZzZXQ9IjAlIiBzdG9wLWNvbG9yPSIjM2I4MmY2IiAvPgogICAgICA8c3RvcCBvZmZzZXQ9IjUwJSIgc3RvcC1jb2xvcj0iIzFkNGVkOCIgLz4KICAgICAgPHN0b3Agb2Zmc2V0PSIxMDAlIiBzdG9wLWNvbG9yPSIjMWUzYThhIiAvPgogICAgPC9saW5lYXJHcmFkaWVudD4KICAgIDxsaW5lYXJHcmFkaWVudCBpZD0ic3BpbmVTaGFkZSIgeDE9IjAlIiB5MT0iMCUiIHgyPSIxMDAlIiB5Mj0iMCUiPgogICAgICA8c3RvcCBvZmZzZXQ9IjAlIiBzdG9wLWNvbG9yPSJyZ2JhKDAsMCwwLDAuMzUpIiAvPgogICAgICA8c3RvcCBvZmZzZXQ9IjYwJSIgc3RvcC1jb2xvcj0icmdiYSgwLDAsMCwwLjEpIiAvPgogICAgICA8c3RvcCBvZmZzZXQ9IjEwMCUiIHN0b3AtY29sb3I9InJnYmEoMjU1LDI1NSwyNTUsMC4xNSkiIC8+CiAgICA8L2xpbmVhckdyYWRpZW50PgogICAgPGxpbmVhckdyYWRpZW50IGlkPSJyaWJib25HcmFkIiB4MT0iMCUiIHkxPSIwJSIgeDI9IjEwMCUiIHkyPSIwJSI+CiAgICAgIDxzdG9wIG9mZnNldD0iMCUiIHN0b3AtY29sb3I9IiNmNTllMGIiIC8+CiAgICAgIDxzdG9wIG9mZnNldD0iMTAwJSIgc3RvcC1jb2xvcj0iI2ZiYmYyNCIgLz4KICAgIDwvbGluZWFyR3JhZGllbnQ+CiAgICA8ZmlsdGVyIGlkPSJzaGFkb3ciIHg9Ii01JSIgeT0iLTUlIiB3aWR0aD0iMTE1JSIgaGVpZ2h0PSIxMTUlIj4KICAgICAgPGZlRHJvcFNoYWRvdyBkeD0iMCIgZHk9IjIiIHN0ZERldmlhdGlvbj0iMiIgZmxvb2Qtb3BhY2l0eT0iMC4xNSIgLz4KICAgIDwvZmlsdGVyPgogIDwvZGVmcz4KICA8cmVjdCB4PSIyIiB5PSIyIiB3aWR0aD0iMTE2IiBoZWlnaHQ9IjE1NiIgcng9IjYiIGZpbGw9InVybCgjY292ZXJCZykiIGZpbHRlcj0idXJsKCNzaGFkb3cpIiAvPgogIDxyZWN0IHg9IjEyIiB5PSI4IiB3aWR0aD0iMTAwIiBoZWlnaHQ9IjE0NCIgcng9IjMiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjI1KSIgc3Ryb2tlLXdpZHRoPSIxIiBzdHJva2UtZGFzaGFycmF5PSIyLDIiIC8+CiAgPHBhdGggZD0iTTIgOCBDMiA0LjY5IDQuNjkgMiA4IDIgTDEyIDIgTDEyIDE1OCBMOCAxNTggQzQuNjkgMTU4IDIgMTU1LjMxIDIgMTUyIFoiIGZpbGw9InVybCgjc3BpbmVTaGFkZSkiIC8+CiAgPGxpbmUgeDE9IjEyIiB5MT0iMiIgeDI9IjEyIiB5Mj0iMTU4IiBzdHJva2U9InJnYmEoMCwwLDAsMC4yKSIgc3Ryb2tlLXdpZHRoPSIxIiAvPgogIDxwb2x5Z29uIHBvaW50cz0iNzYsMiA5MCwyIDkwLDMyIDgzLDI0IDc2LDMyIiBmaWxsPSJ1cmwoI3JpYmJvbkdyYWQpIiBvcGFjaXR5PSIwLjk1IiAvPgogIDxnIHRyYW5zZm9ybT0idHJhbnNsYXRlKDM4LCA1NikiIGZpbGw9Im5vbmUiIHN0cm9rZT0iI2ZmZmZmZiIgc3Ryb2tlLXdpZHRoPSIyLjUiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIgb3BhY2l0eT0iMC45Ij4KICAgIDxwYXRoIGQ9Ik0yMiAyOCBDMTUgMjQgNiAyNSAwIDI4IEwwIDYgQzYgMyAxNSAyIDIyIDYgWiIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjEyKSIgLz4KICAgIDxwYXRoIGQ9Ik0yMiAyOCBDMjkgMjQgMzggMjUgNDQgMjggTDQ0IDYgQzM4IDMgMjkgMiAyMiA2IFoiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4xOCkiIC8+CiAgICA8bGluZSB4MT0iMjIiIHkxPSI2IiB4Mj0iMjIiIHkyPSIyOCIgc3Ryb2tlPSIjZmZmZmZmIiBzdHJva2Utd2lkdGg9IjIuNSIgLz4KICAgIDxsaW5lIHgxPSI2IiB5MT0iMTIiIHgyPSIxNiIgeTI9IjEwIiBzdHJva2U9InJnYmEoMjU1LDI1NSwyNTUsMC40KSIgc3Ryb2tlLXdpZHRoPSIxLjUiIC8+CiAgICA8bGluZSB4MT0iNiIgeTE9IjE4IiB4Mj0iMTYiIHkyPSIxNiIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuNCkiIHN0cm9rZS13aWR0aD0iMS41IiAvPgogICAgPGxpbmUgeDE9IjI4IiB5MT0iMTAiIHgyPSIzOCIgeTI9IjEyIiBzdHJva2U9InJnYmEoMjU1LDI1NSwyNTUsMC40KSIgc3Ryb2tlLXdpZHRoPSIxLjUiIC8+CiAgICA8bGluZSB4MT0iMjgiIHkxPSIxNiIgeDI9IjM4IiB5Mj0iMTgiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjQpIiBzdHJva2Utd2lkdGg9IjEuNSIgLz4KICA8L2c+CiAgPHRleHQgeD0iNjQiIHk9IjExMiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZm9udC1mYW1pbHk9Ii1hcHBsZS1zeXN0ZW0sIEJsaW5rTWFjU3lzdGVtRm9udCwgJ1ByZXRlbmRhcmQnLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjkiIGZvbnQtd2VpZ2h0PSI3MDAiIGZpbGw9IiNmZmZmZmYiIGxldHRlci1zcGFjaW5nPSIxIiBvcGFjaXR5PSIwLjg1Ij5OQU5PIEJPT0s8L3RleHQ+CiAgPHJlY3QgeD0iNDIiIHk9IjExOCIgd2lkdGg9IjQ0IiBoZWlnaHQ9IjEuNSIgcng9IjAuNzUiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4zKSIgLz4KPC9zdmc+';

// 도서 표지 경로 정규화:
function normalizeBookCoverUrl(url) {
  if (!url || url === 'undefined' || url === 'null' || !String(url).trim()) return DEFAULT_BOOK_COVER;
  var trimmed = String(url).trim();
  if (trimmed.includes('book_default.svg') || trimmed.includes('book_default.png')) {
    return DEFAULT_BOOK_COVER;
  }
  if (/^https?:\/\/pub-[a-z0-9]+\.r2\.dev/i.test(trimmed)) {
    trimmed = trimmed.replace(/^https?:\/\/pub-[a-z0-9]+\.r2\.dev/i, 'https://media.nanosbook.co.kr');
  }
  if (/\/upload\/book\/[^?]+\.(jpe?g|png|jfif)$/i.test(trimmed)) {
    trimmed = trimmed.replace(/\.(jpe?g|png|jfif)$/i, '.webp');
  }
  if (/^(https?:)?\/\//.test(trimmed) || trimmed.indexOf('data:') === 0) return trimmed;
  if (trimmed.startsWith('/upload/') || trimmed.startsWith('upload/')) {
    return trimmed.startsWith('/') ? trimmed : ('/' + trimmed);
  }
  return trimmed;
}

// 나노시트 실제 파일 실존 여부 정밀 판정 함수 (업로드된 커스텀 시트 우선 인정 & 서버 배포본 대조)
function checkBookHasAvailableSheet(b) {
  if (!b) return false;

  // 1. 방금 직접 업로드한 실제 PDF 파일/Blob이 메모리에 있는 경우 또는 커스텀 시트 등록 플래그
  if (b.pdfBlob || b.pdfDataUrl || b.hasCustomSheet === true) return true;

  // 2. 도서에 시트 파일명이 명시되어 있거나 시트/워크시트 플래그가 있는 경우
  if (b.materialName && typeof b.materialName === 'string' && b.materialName.trim() && !b.materialName.includes('미등록') && !b.materialName.includes('없음')) {
    return true;
  }
  if (b.hasSheet === true || b.sheet === true || b.worksheet === true) {
    return true;
  }

  // 3. 외부 호스팅 절대 URL(https://) 또는 미디어 API(/api/files)가 명시된 경우
  if (
    (b.pdfUrl && /^(https?:\/\/|\/api\/files\?)/i.test(b.pdfUrl)) ||
    (b.worksheetUrl && /^(https?:\/\/|\/api\/files\?)/i.test(b.worksheetUrl))
  ) {
    return true;
  }

  // 4. 서버에 배포된 검증 나노시트 Set(AVAILABLE_NANOSHEET_SET) 대조
  var sheetSet = (typeof window !== 'undefined' && window.AVAILABLE_NANOSHEET_SET) || null;
  if (!sheetSet) {
    return false;
  }

  var candidates = [];
  if (b.id) candidates.push(String(b.id).trim().toLowerCase());
  if (b.bookNo) candidates.push(String(b.bookNo).trim().toLowerCase());
  if (b.serverId) candidates.push(String(b.serverId).trim().toLowerCase());
  if (b.isbn) candidates.push(String(b.isbn).replace(/[^0-9]/g, ''));
  if (b.cover && typeof b.cover === 'string') {
    var m = String(b.cover).match(/([0-9]{10,13}|book_[0-9]+)/);
    if (m && m[1]) candidates.push(m[1].toLowerCase());
  }
  var extraPath = b.pdfUrl || b.worksheetUrl || '';
  if (extraPath) {
    var pMatch = String(extraPath).match(/([0-9]{10,13}|book_[0-9]+)/);
    if (pMatch && pMatch[1]) candidates.push(pMatch[1].toLowerCase());
  }

  return candidates.some(function(k) { return k && sheetSet.has(k); });
}

function createAcademyBookItem(b) {
  if (!b) return null;

  // 1. 도서 번호 및 컬럼 밀림 자가 치유 (Self-Healing Pipeline)
  // 도서번호가 누락되었거나(undefined), 제목 자리에 'FA000001' 등 도서 관리 코드가 들어간 경우 자동 보정
  var bookId = b.id || b.bookNo;
  var title = b.title || '';
  var isShifted = (!bookId || bookId === 'undefined') && /^[A-Z]{2}\d{6}$/.test(title);

  if (isShifted) {
    bookId = title;
    title = (b.series && b.series !== '단권') ? b.series : (b.subtitle || '도서명 미상');
    b.series = (b.author && b.author !== '작가 미상') ? b.author : '단권';
    b.publisher = (b.subject && b.subject !== '이야기') ? b.subject : (b.publisher || '출판사');
    b.author = '구사카 미나코 글/기타무라 유카 그림/황진희 역';
    b.category = '문학';
    b.subject = '이야기';
    b.grade = b.grade || '유치부';
    if (!b.cover || b.cover.indexOf(bookId) !== -1 || b.cover === 'resources/images/book_default.svg') {
      b.cover = '/upload/book/9791187079521.jpg';
    }
  }

  // 2. MIGRATED_BOOKS 표준 데이터셋과 동기화 및 누락 정보 복원 (O(1) 인덱스 맵 최적화)
  // b가 이미 author, publisher 등 표준 필드를 갖추고 있다면 불필요한 전체 순회(3,400만 루프) 생략
  if (isShifted || !b.publisher || !b.author) {
    var matchKey = bookId || title;
    var canon = getMigratedBookFromIndex(matchKey);
    if (canon && canon !== b) {
      bookId = canon.id || canon.bookNo || bookId;
      title = canon.title || title;
      b.author = canon.author || b.author;
      b.publisher = canon.publisher || b.publisher;
      b.grade = canon.grade || b.grade;
      b.category = canon.category || b.category;
      b.cat1 = canon.cat1 || b.cat1;
      b.cat2 = canon.cat2 || b.cat2;
      b.series = canon.series || b.series;
      b.cover = canon.cover || b.cover;
      b.quizzes = canon.quizzes || b.quizzes;
      if (canon.sheet !== undefined) b.sheet = canon.sheet;
      if (canon.worksheet !== undefined) b.worksheet = canon.worksheet;
      if (canon.worksheetUrl !== undefined) b.worksheetUrl = canon.worksheetUrl;
      if (canon.pdfUrl !== undefined) b.pdfUrl = canon.pdfUrl;
    }
  }

  bookId = bookId || b.id || b.bookNo || b.serverId || 'FA000001';
  var hasValidSeries = !!(b.series && b.series.trim() !== '' && b.series.trim() !== '단권');
  var isSingleBook = (!hasValidSeries || b.isSingle === true || b.series === '단권');
  var seriesVal = isSingleBook ? '단권' : b.series.trim();

  // 나노시트 실제 파일 준비 여부 명확한 판정 (서버 실존 검증)
  var hasSheet = checkBookHasAvailableSheet(b);

  return {
    id: bookId,
    bookNo: bookId,
    serverId: b.serverId,
    themeId: b.themeId || null,
    title: title,
    subtitle: (seriesVal && seriesVal !== '단권') ? seriesVal : ((b.cat1 || '소설') + ' · ' + (b.cat2 || '국내서')),
    author: b.author || '작가 미상',
    publisher: b.publisher || '출판사 미상',
    category: (b.category || '문학') + ' / ' + (b.subject || '이야기'),
    grade: b.grade || '초등 3학년',
    cat1: b.cat1 || '소설',
    cat2: b.cat2 || '국내서',
    isbn: b.isbn || '',
    series: seriesVal,
    isSingle: isSingleBook,
    themeTag: b.themeTag || (b.subject ? ('#' + b.subject) : '#이달의나노북클럽'),
    subject: b.subject || '이야기',
    tags: b.tags || [],
    detailTag: b.detailTag || '',
    awards: b.awards || '',
    creatorType: (function() {
      if (b.creatorType && b.creatorType !== 'HQ') return b.creatorType;
      var cInfo = (typeof window !== 'undefined' && window.NANO_ACADEMY_BOOK_CREATORS && window.NANO_ACADEMY_BOOK_CREATORS[bookId]) || null;
      return cInfo ? 'ACADEMY' : (b.creatorType || 'HQ');
    })(),
    academyId: (function() {
      if (b.academyId && b.academyId !== 'HQ') return b.academyId;
      var cInfo = (typeof window !== 'undefined' && window.NANO_ACADEMY_BOOK_CREATORS && window.NANO_ACADEMY_BOOK_CREATORS[bookId]) || null;
      return cInfo ? cInfo[0] : (b.academyId || 'HQ');
    })(),
    academyName: (function() {
      var rawName = '';
      if (b.academyName && !b.academyName.includes('본사')) {
        rawName = b.academyName;
      } else {
        var cInfo = (typeof window !== 'undefined' && window.NANO_ACADEMY_BOOK_CREATORS && window.NANO_ACADEMY_BOOK_CREATORS[bookId]) || null;
        rawName = cInfo ? cInfo[1] : (b.academyName || '본사 직속(HQ)');
      }
      if (rawName && (rawName.includes('?') || rawName.includes('숈썝') || rawName.includes('습점') || /^[a-z0-9_]+\s*\?/.test(rawName))) {
        return '가맹 교육원';
      }
      return rawName;
    })(),
    cover: normalizeBookCoverUrl(b.cover),
    hasSheet: hasSheet,
    worksheetUrl: b.worksheetUrl || b.pdfUrl || (typeof b.worksheet === 'string' ? b.worksheet : null) || null,
    pdfUrl: b.pdfUrl || b.worksheetUrl || (typeof b.worksheet === 'string' ? b.worksheet : null) || null,
    materialName: hasSheet ? (b.materialName || (title + '_나노시트.pdf')) : null,
    materialSize: hasSheet ? (b.materialSize || '1.45 MB') : null,
    materialType: hasSheet ? '나노 시트 (PDF)' : null,
    quizStatus: (b.quizzes || 5) + '문항 완비',
    readCount: (b.quizCompletions || 0) + '회',
    answerGuide: '【나노 시트 핵심 정답 및 생각담기 가이드】\n\n' + (b.thinkInsert ? ('▶ 생각담기: ' + b.thinkInsert) : '정규 독서논술 답안'),
    thinkExtract: b.thinkExtract,
    thinkInsert: b.thinkInsert,
    createdAt: b.createdAt || b.date || b.regDate || '',
    quizSets: b.quizSets || []
  };
}

function deduplicateAcademyBooks(list) {
  if (!Array.isArray(list)) return [];
  var seen = {};
  var result = [];
  list.forEach(function(b) {
    if (!b) return;
    var k = String(b.id || b.bookNo || '').trim();
    if (!k || seen[k]) return;
    seen[k] = true;
    result.push(b);
  });
  return result;
}

var academyBookList = (function() {
  if (typeof window !== 'undefined' && Array.isArray(window.MIGRATED_BOOKS) && (window.NANO_SERVER_DATA || window.MIGRATED_BOOKS.length > 0)) {
    return deduplicateAcademyBooks(window.MIGRATED_BOOKS.map(createAcademyBookItem));
  }
  return [
    {
      id: 'FA000001',
      title: '고양이 목욕탕',
      subtitle: '상상그림책 5',
      author: '구사카 미나코',
      publisher: '옐로스톤',
      category: '문학 / 이야기',
      grade: '유치부',
      creatorType: 'HQ',
      academyName: '본사 직속(HQ)',
      cover: '/upload/book/9791187079521.jpg',
      materialName: '고양이목욕탕_나노시트.pdf',
      materialSize: '1.45 MB',
      materialType: '나노 시트 (PDF)',
      quizStatus: '5문항 완비',
      readCount: '42회',
      answerGuide: '【나노 시트 생각담기】\n▶ 이야기는 끝났지만, 그 이후 어떤 일이 벌어졌는지 상상해서 이야기를 만들어주세요.'
    }
  ];
})();

// 마스터 페이지와 100% 동일하게 MIGRATED_BOOKS 실데이터 상시 동기화 보장 (도서번호 기준 중복 제거)
function syncAcademyBooksState() {
  if (typeof window !== 'undefined' && Array.isArray(window.MIGRATED_BOOKS) && window.MIGRATED_BOOKS.length > 0) {
    var deduped = deduplicateAcademyBooks(window.MIGRATED_BOOKS.map(createAcademyBookItem));
    if (!academyBookList || academyBookList.length <= 1 || academyBookList.length !== deduped.length) {
      academyBookList = deduped;
      syncOwnedBooksState();
      if (typeof populateAcadBookOriginFilter === 'function') {
        populateAcadBookOriginFilter();
      }
    }
  }
}

// 로컬 저장소에 보관된 학원 신규 등록 도서(PDF 데이터 포함) 자동 복원 및 손상 데이터 정제
(function restoreCustomAcademyBooks() {
  if (window.NANO_SERVER_DATA) return;
  try {
    var stored = localStorage.getItem('nano_custom_academy_books');
    if (stored) {
      var list = JSON.parse(stored);
      if (Array.isArray(list)) {
        var cleanList = [];
        list.forEach(function(item) {
          // 1) id가 없거나 'undefined'인 손상 항목은 완전 제외
          if (!item || !item.id || item.id === 'undefined') return;
          // 2) 본사 정규 도서(FA/KC/FB/KA9 등)가 잘못 캐시되어 들어간 경우 커스텀 도서에서 제거
          if (/^(FA|KC|FB|KA9)\d{6}$/.test(item.id) && item.creatorType !== 'ACADEMY') return;

          var exists = academyBookList.some(function(b) { return b.id === item.id; });
          if (!exists) {
            academyBookList.unshift(createAcademyBookItem(item));
          }
          cleanList.push(item);
        });
        localStorage.setItem('nano_custom_academy_books', JSON.stringify(cleanList));
      }
    }
  } catch(e) {
    console.warn('자체 등록 도서 로컬 복원 실패:', e);
  }
})();

// 학원 자체 등록 도서 로컬 저장소 동기화 헬퍼
function syncCustomAcademyBooksToStorage() {
  try {
    var myBooks = academyBookList.filter(function(b) {
      return b.creatorType === 'ACADEMY' || b.isMyCreation === true || (b.id && b.id.startsWith('KA'));
    });
    localStorage.setItem('nano_custom_academy_books', JSON.stringify(myBooks));
  } catch(e) {
    console.warn('자체 등록 도서 로컬 저장 실패 (용량 초과 등):', e);
  }
}

var currentUploadedMaterial = null;
var currentUploadedCover = null;
var lastAddedBookId = null;

// ==============================================================
// 학원별 보유 도서(isOwned) 로컬스토리지 관리 및 필터 로직
// ==============================================================
var window_ONLY_OWNED_FILTER = false;

function getAcademyOwnedBookStorageKey() {
  var curAcadId = (typeof CURRENT_ACADEMY_ID !== 'undefined' && CURRENT_ACADEMY_ID) ? CURRENT_ACADEMY_ID : (currentAcademyInfo && currentAcademyInfo.id ? currentAcademyInfo.id : 'ACAD-033');
  return 'NANO_OWNED_BOOK_IDS_' + curAcadId;
}

function loadOwnedBookIds() {
  if (window.NANO_SERVER_DATA) return window.NANO_SERVER_OWNED || [];
  var key = getAcademyOwnedBookStorageKey();
  try {
    var raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw);
  } catch(e) {}
  // 기본적으로 상위 50권을 초기 보유 도서로 등록하여 즉각적인 사용성 제공
  var defaultOwned = [];
  if (Array.isArray(academyBookList)) {
    defaultOwned = academyBookList.slice(0, 50).map(function(b) { return b.id; });
  }
  try {
    localStorage.setItem(key, JSON.stringify(defaultOwned));
  } catch(e) {}
  return defaultOwned;
}

function saveCustomAcademyBooks(list) {
  var key = getAcademyOwnedBookStorageKey();
  try {
    var ownedIds = (list || academyBookList).filter(function(b) { return b.isOwned === true; }).map(function(b) { return b.id; });
    localStorage.setItem(key, JSON.stringify(ownedIds));
  } catch(e) {}
  updateOwnedBookCountBadge();
}

function syncOwnedBooksState() {
  var ownedIds = loadOwnedBookIds();
  var ownedSet = new Set(ownedIds);
  academyBookList.forEach(function(b) {
    b.isOwned = ownedSet.has(b.id);
  });
  updateOwnedBookCountBadge();
}

function updateOwnedBookCountBadge() {
  var ownedCount = academyBookList.filter(function(b) { return b.isOwned === true; }).length;
  var unownedCount = academyBookList.length - ownedCount;
  var badge = document.getElementById('ownedBookCountBadge');
  if (badge) badge.innerText = ownedCount + '권';
  var subBadge = document.getElementById('ownedCountSub');
  if (subBadge) subBadge.innerText = ownedCount;

  // 상단 카드 보유 도서 총 권수 동기화
  var totalBadge = document.getElementById('totalAcadBookCount');
  if (totalBadge) totalBadge.innerText = ownedCount;

  // 보유 여부 드롭다운 옵션 텍스트에 실시간 권수 반영
  var sel = document.getElementById('filterAcadBookOwned');
  if (sel && sel.options && sel.options.length >= 3) {
    sel.options[0].text = '전체 보기 (' + academyBookList.length + '권)';
    sel.options[1].text = '보유도서만 보기 (' + ownedCount + '권)';
    sel.options[2].text = '미보유 도서만 보기 (' + unownedCount + '권)';
  }
}

// 보유 도서만 보기 필터 전환 함수 (하위 호환)
function toggleOnlyOwnedBooksFilter() {
  var r = document.querySelector('input[name="filterAcadBookOwned"][value="OWNED"]');
  if (r) {
    r.checked = true;
  }
  var sel = document.getElementById('filterAcadBookOwned');
  if (sel) {
    sel.value = (sel.value === 'OWNED') ? 'ALL' : 'OWNED';
  }
  filterAcademyBooks();
}

// 하단 체크박스 변경 시 드롭다운과 동기화 (하위 호환)
function syncOnlyOwnedBooksFromCheckbox(checked) {
  var targetVal = checked ? 'OWNED' : 'ALL';
  var r = document.querySelector('input[name="filterAcadBookOwned"][value="' + targetVal + '"]');
  if (r) r.checked = true;
  var sel = document.getElementById('filterAcadBookOwned');
  if (sel) {
    sel.value = targetVal;
  }
  filterAcademyBooks();
}

// 보유 도서 여부 토글 (체크 클릭 시 보유 전환 및 로컬스토리지 저장)
async function toggleBookOwnership(bookId) {
  var book = academyBookList.find(function(b) { return b.id === bookId; });
  if (!book) return;
  var nextOwned = !book.isOwned;
  if (window.NanoPortal && NanoPortal.remote) {
    try {
      if (nextOwned) {
        var savedOwned = await NanoPortal.saveOwnedBook(book, currentAcademyInfo.id);
        window.NANO_SERVER_OWNED_RECORDS = window.NANO_SERVER_OWNED_RECORDS || {};
        if (savedOwned.item) window.NANO_SERVER_OWNED_RECORDS[book.id] = savedOwned.item.id;
      } else {
        var ownedId = (window.NANO_SERVER_OWNED_RECORDS || {})[book.id];
        if (!ownedId) throw new Error('보유 도서 정보를 새로고침한 뒤 다시 시도해 주세요.');
        await NanoPortal.deleteOwnedBook(ownedId, currentAcademyInfo.id);
        delete window.NANO_SERVER_OWNED_RECORDS[book.id];
      }
    } catch (error) {
      showAcademyToast('보유 상태를 저장하지 못했습니다: ' + error.message);
      return;
    }
  }
  book.isOwned = nextOwned;
  saveCustomAcademyBooks(academyBookList);
  updateOwnedBookCountBadge();
  filterAcademyBooks(true); // 보유 여부 토글 시 현재 페이지 유지
  showAcademyToast(`[${book.title}] 도서가 [${book.isOwned ? '보유' : '미보유'}] 상태로 변경되었습니다. (도서 배정 시 활용)`);
}

// -------------------------------------------------------------
// 등록처 필터 드롭다운 옵션 동적 구성
// (1순위: 전체, 2순위: 본사, 3순위: 내 가맹점 명, 4순위부터: 가나다 오름차순 정렬)
// -------------------------------------------------------------
function populateAcadBookOriginFilter() {
  var sel = document.getElementById('filterAcadBookOrigin');
  if (!sel) return;

  var currentVal = sel.value || 'ALL';
  var myAcadName = (typeof currentAcademyInfo !== 'undefined' && currentAcademyInfo && currentAcademyInfo.name)
    ? currentAcademyInfo.name.trim()
    : '내 가맹점';

  // 도서 목록 전체에서 고유 등록처(학원명) 수집
  var originSet = new Set();
  (academyBookList || []).forEach(function(b) {
    var acad = (b.academyName || '').trim();
    if (acad.includes('?') || acad.includes('숈썝') || acad.includes('습점') || /^[a-z0-9_]+\s*\?/.test(acad)) {
      acad = '가맹 교육원';
    }
    if (acad && !acad.includes('본사') && acad !== myAcadName) {
      originSet.add(acad);
    }
  });

  // 가나다 오름차순 정렬
  var sortedOrigins = Array.from(originSet).sort(function(a, b) {
    return a.localeCompare(b, 'ko');
  });

  var html = '<option value="ALL">전체 등록처</option>';
  html += '<option value="HQ">본사 (본사 직속)</option>';
  html += '<option value="MY_ACADEMY">' + myAcadName + ' (내 가맹점)</option>';

  sortedOrigins.forEach(function(orig) {
    html += '<option value="' + orig.replace(/"/g, '&quot;') + '">' + orig + '</option>';
  });

  sel.innerHTML = html;

  // 기존 선택값 유지 (유효한 경우)
  if (currentVal && Array.from(sel.options).some(function(opt) { return opt.value === currentVal; })) {
    sel.value = currentVal;
  } else {
    sel.value = 'ALL';
  }
}

// -------------------------------------------------------------
// 학원 도서 페이징 상태 관리 (페이지당 30권)
// -------------------------------------------------------------
var academyBookPageSize = 30;
var academyBookCurrentPage = 1;
var currentAcademyFilteredBooks = [];

// 학원 도서 검색 입력 실시간 핸들러
function handleAcadBookSearchInput(input) {
  var clearBtn = document.getElementById("btnAcadBookSearchClear");
  if (clearBtn) {
    clearBtn.style.display = (input && input.value.trim().length > 0) ? "inline-flex" : "none";
  }
}

// 학원 도서 검색어 원클릭 클리어
function clearAcadBookSearch() {
  var input = document.getElementById("searchAcadBookInput");
  if (input) input.value = "";
  var clearBtn = document.getElementById("btnAcadBookSearchClear");
  if (clearBtn) clearBtn.style.display = "none";
  var badgeEl = document.getElementById("acadBookSearchActiveBadge");
  if (badgeEl) { badgeEl.style.display = "none"; badgeEl.innerHTML = ""; }
  filterAcademyBooks();
}

// 도서 필터링 & 정렬 (기본: 보유 순 -> 도서 번호 내림차순, 30개 페이징)
function filterAcademyBooks(keepPage) {
  syncAcademyBooksState();

  // 등록처 드롭다운이 아직 초기화되지 않았거나 옵션이 3개 미만이면 채우기
  var originSel = document.getElementById('filterAcadBookOrigin');
  if (originSel && originSel.options.length <= 3 && academyBookList && academyBookList.length > 0) {
    populateAcadBookOriginFilter();
  }

  if (!keepPage) {
    academyBookCurrentPage = 1;
  }

  var originVal = originSel ? originSel.value : 'ALL';
  var gradeVal = document.getElementById('filterAcadBookGrade') ? document.getElementById('filterAcadBookGrade').value : 'ALL';
  var sortVal = document.getElementById('sortAcadBookSelect') ? document.getElementById('sortAcadBookSelect').value : 'DATE_DESC';
  var ownedRadio = document.querySelector('input[name="filterAcadBookOwned"]:checked');
  var ownedFilter = ownedRadio ? ownedRadio.value : (document.getElementById('filterAcadBookOwned') ? document.getElementById('filterAcadBookOwned').value : 'ALL');
  var query = (document.getElementById('searchAcadBookInput') ? document.getElementById('searchAcadBookInput').value : '').toLowerCase().trim();

  updateOwnedBookCountBadge();

  var myAcadName = (typeof currentAcademyInfo !== 'undefined' && currentAcademyInfo && currentAcademyInfo.name)
    ? currentAcademyInfo.name.trim()
    : '';

  var filtered = academyBookList.filter(function(b) {
    // 0. 보유 여부 필터 (ALL: 전체 보기 / OWNED: 보유도서만 보기 / UNOWNED: 미보유 도서만 보기)
    if (ownedFilter === 'OWNED' && !b.isOwned) return false;
    if (ownedFilter === 'UNOWNED' && b.isOwned) return false;

    // 1. 등록처 매칭 (ALL / HQ / MY_ACADEMY / 특정 가맹점명)
    var isHqBook = !b.creatorType || b.creatorType === 'HQ' || (b.academyName && b.academyName.includes('본사'));
    var matchOrigin = true;
    if (originVal === 'HQ') {
      matchOrigin = isHqBook;
    } else if (originVal === 'MY_ACADEMY') {
      matchOrigin = isBookCreatedByMyAcademy(b);
    } else if (originVal !== 'ALL') {
      matchOrigin = (b.academyName && b.academyName.trim() === originVal.trim());
    }
    if (!matchOrigin) return false;

    // 2. 학년 매칭
    var matchGrade = true;
    if (gradeVal !== 'ALL') {
      matchGrade = bookGradeMatches(b.grade, gradeVal);
    }
    if (!matchGrade) return false;

    // 3. 상단 도서 검색어 매칭 (도서명, 저자, 출판사, 도서번호, 등록처 학원명, '본사' 지원)
    var matchQuery = !query ||
      (b.title && b.title.toLowerCase().indexOf(query) !== -1) ||
      (b.author && b.author.toLowerCase().indexOf(query) !== -1) ||
      (b.publisher && b.publisher.toLowerCase().indexOf(query) !== -1) ||
      (b.id && String(b.id).toLowerCase().indexOf(query) !== -1) ||
      (b.bookNo && String(b.bookNo).toLowerCase().indexOf(query) !== -1) ||
      (b.academyName && b.academyName.toLowerCase().indexOf(query) !== -1) ||
      (isHqBook && ('본사'.indexOf(query) !== -1 || '본사 직속'.indexOf(query) !== -1));

    return matchQuery;
  });

  // 정렬 적용
  // 사용자 요구사항: "보유 순, 도서 번호순(내림차순)" -> DEFAULT
  filtered.sort(function(a, b) {
    if (sortVal === 'DEFAULT') {
      // 1순위: 보유 여부 (보유 도서 우선)
      var aOwned = (a.isOwned === true) ? 1 : 0;
      var bOwned = (b.isOwned === true) ? 1 : 0;
      if (aOwned !== bOwned) {
        return bOwned - aOwned;
      }
      // 2순위: 도서 번호 내림차순 (예: KC900003 > FA000001)
      var idA = String(a.id || a.bookNo || '');
      var idB = String(b.id || b.bookNo || '');
      return idB.localeCompare(idA, undefined, { numeric: true, sensitivity: 'base' });
    } else if (sortVal === 'ID_DESC') {
      var idA = String(a.id || a.bookNo || '');
      var idB = String(b.id || b.bookNo || '');
      return idB.localeCompare(idA, undefined, { numeric: true, sensitivity: 'base' });
    } else if (sortVal === 'ID_ASC') {
      var idA = String(a.id || a.bookNo || '');
      var idB = String(b.id || b.bookNo || '');
      return idA.localeCompare(idB, undefined, { numeric: true, sensitivity: 'base' });
    } else if (sortVal === 'DATE_DESC') {
      var da = a.createdAt || a.date || a.regDate || '';
      var db = b.createdAt || b.date || b.regDate || '';
      if (da && db && da !== db) {
        return String(db).localeCompare(String(da));
      }
      var idA = String(a.id || a.bookNo || '');
      var idB = String(b.id || b.bookNo || '');
      return idB.localeCompare(idA, undefined, { numeric: true, sensitivity: 'base' });
    } else if (sortVal === 'DATE_ASC') {
      var da = a.createdAt || a.date || a.regDate || '';
      var db = b.createdAt || b.date || b.regDate || '';
      if (da && db && da !== db) {
        return String(da).localeCompare(String(db));
      }
      var idA = String(a.id || a.bookNo || '');
      var idB = String(b.id || b.bookNo || '');
      return idA.localeCompare(idB, undefined, { numeric: true, sensitivity: 'base' });
    } else if (sortVal === 'TITLE_ASC') {
      return a.title.localeCompare(b.title, 'ko');
    } else if (sortVal === 'GRADE_ASC') {
      return (a.grade || '').localeCompare(b.grade || '', 'ko');
    }
    return 0;
  });

  currentAcademyFilteredBooks = filtered;

  // 30개 단위 페이징 슬라이싱
  var total = filtered.length;

  // ✕ 버튼 및 활성 검색 배지 상태 동기화
  var clearBtn = document.getElementById("btnAcadBookSearchClear");
  if (clearBtn) clearBtn.style.display = query.length > 0 ? "inline-flex" : "none";
  var badgeEl = document.getElementById("acadBookSearchActiveBadge");
  if (badgeEl) {
    if (query) {
      badgeEl.style.display = "inline-flex";
      var displayQ = query.length > 25 ? query.substring(0, 25) + '...' : query;
      badgeEl.innerHTML = '<span class="badge-search-active"><i class="fa-solid fa-magnifying-glass mr-1"></i>"' + displayQ + '" 검색 결과 ' + total.toLocaleString() + '권 <span class="badge-clear-link" onclick="clearAcadBookSearch()" title="검색 필터 해제">✕ 검색 해제</span></span>';
    } else {
      badgeEl.style.display = "none";
      badgeEl.innerHTML = "";
    }
  }

  var totalPages = Math.ceil(total / academyBookPageSize) || 1;
  if (academyBookCurrentPage < 1) academyBookCurrentPage = 1;
  if (academyBookCurrentPage > totalPages) academyBookCurrentPage = totalPages;

  var startIdx = (academyBookCurrentPage - 1) * academyBookPageSize;
  var pagedList = filtered.slice(startIdx, startIdx + academyBookPageSize);

  renderAcademyBookTable(pagedList, total, startIdx);
  renderAcademyBookPagination(total, academyBookCurrentPage, totalPages);
}

// -------------------------------------------------------------
// 도서 권장학년 문자열("초등 5학년", "초등 1~2학년", "중등 전학년" 등)을
// 개별 학년 목록으로 풀어 선택한 학년이 포함되는지 판별 (문자열 포함 비교로는 범위 표기를 놓침)
// -------------------------------------------------------------
function bookGradeMatches(bookGrade, selected) {
  if (!selected || selected === 'ALL') return true;
  var text = String(bookGrade || '').trim();
  if (!text) return false;

  // 1. 유치부 (유아, 유치, 유치부, 미취학 등 포함)
  if (selected === '유치부' || selected === '미취학') {
    return /미취학|유아|유치/i.test(text);
  }

  // 2. 초등 / 중등(중학교) 단일 학년 매칭
  var m = selected.match(/^(초등|중등|중학교)\s*(\d)학년$/);
  if (!m) return text.indexOf(selected) !== -1;

  var isTargetMiddle = (m[1] === '중등' || m[1] === '중학교');
  var num = parseInt(m[2], 10);

  // 해당 학교급(초등/중등) 표기가 있는 부분만 분리해 검사
  var parts = text.split(/[,\/]/);
  return parts.some(function(part) {
    var p = part.trim();
    if (!p) return false;

    var isMiddle = p.indexOf('중등') !== -1 || p.indexOf('중학교') !== -1 || /^중\d/.test(p) || p === '중학';
    var isElem = p.indexOf('초등') !== -1 || /^초\d/.test(p) || p === '초등';

    if (isTargetMiddle && !isMiddle) return false;
    if (!isTargetMiddle && !isElem) return false;

    // '전학년' 또는 '중학교/중등' 전체 표기인 경우
    if (p.indexOf('전학년') !== -1 || (isTargetMiddle && (p === '중학교' || p === '중등' || p === '중학'))) {
      return true;
    }

    // 범위 표기 (예: 1~2, 1-2, 1~3, 5~6)
    var range = p.match(/(\d)\s*[~\-]\s*(\d)/);
    if (range) {
      var min = parseInt(range[1], 10);
      var max = parseInt(range[2], 10);
      return num >= min && num <= max;
    }

    // 단일 학년 표기 (예: 초1, 초등 1학년)
    var single = p.match(/(\d)/);
    return !!single && parseInt(single[1], 10) === num;
  });
}

// -------------------------------------------------------------
// 도서 등록 권한 판별: 내가(우리 학원이) 직접 등록한 도서인지 검증
// -------------------------------------------------------------
function isBookCreatedByMyAcademy(b) {
  if (!b) return false;
  // 1. 본사 공식 도서는 편집 불가
  if (!b.creatorType || b.creatorType === 'HQ' || (b.academyName && b.academyName.includes('본사'))) {
    return false;
  }
  // 2. 내가 직접 등록한 도서 플래그 확인
  if (b.isMyCreation === true) return true;

  // 3. 현재 로그인한 학원 정보 대조
  var curAcadName = (typeof currentAcademyInfo !== 'undefined' && currentAcademyInfo && currentAcademyInfo.name) ? currentAcademyInfo.name : '';
  var curAcadId = (typeof currentAcademyInfo !== 'undefined' && currentAcademyInfo && currentAcademyInfo.id) ? currentAcademyInfo.id : '';

  if (curAcadId && b.academyId === curAcadId) return true;
  if (curAcadName && b.academyName === curAcadName) return true;

  // 4. 로컬스토리지에 저장된 내가 등록한 도서 ID 목록 대조
  try {
    var key = 'NANO_MY_CREATED_BOOKS_' + (curAcadId || 'DEFAULT');
    var raw = localStorage.getItem(key);
    if (raw) {
      var arr = JSON.parse(raw);
      if (Array.isArray(arr) && arr.indexOf(b.id) !== -1) return true;
    }
  } catch(e) {}

  return false;
}

// 신규 도서 등록 시 내 학원 도서로 영구 기록
function markBookAsMyCreation(bookId) {
  var curAcadId = (typeof currentAcademyInfo !== 'undefined' && currentAcademyInfo && currentAcademyInfo.id) ? currentAcademyInfo.id : 'DEFAULT';
  var key = 'NANO_MY_CREATED_BOOKS_' + curAcadId;
  try {
    var arr = JSON.parse(localStorage.getItem(key) || '[]');
    if (arr.indexOf(bookId) === -1) {
      arr.push(bookId);
      localStorage.setItem(key, JSON.stringify(arr));
    }
  } catch(e) {}
}

// 다른 가맹점 또는 본사 도서 편집 시도 시 안내 토스트
function showCannotEditNotice(typeStr) {
  showAcademyToast((typeStr || '다른 가맹점에서 등록한 도서') + '는 편집할 수 없습니다. (내가 등록한 도서만 수정 가능)');
}

// 도서 테이블 렌더링 (No. 내림차순, 보유 여부 토글, 내가 올린 도서만 편집 가능)
function renderAcademyBookTable(data, totalCount, startIdx) {
  if (!data) {
    filterAcademyBooks(true);
    return;
  }
  var list = data;
  var tbody = document.getElementById('academyBookTableBody');
  if (!tbody) return;
  tbody.innerHTML = '';

  var total = (typeof totalCount === 'number') ? totalCount : list.length;
  var countBadge = document.getElementById('acadBookTableTotalCount');
  if (countBadge) countBadge.innerText = total;
  var baseIdx = (typeof startIdx === 'number') ? startIdx : 0;

  if (list.length === 0) {
    tbody.innerHTML = '<tr><td colspan="13" class="text-center py-5 text-muted">일치하는 도서가 없습니다.</td></tr>';
    return;
  }

  list.forEach(function(b, idx) {
    var tr = document.createElement('tr');
    if (b.id === lastAddedBookId) {
      tr.className = 'row-highlight-new';
    }

    // 전체 도서 수 기준 No. 내림차순 넘버링 (예: 500, 499, ... 1)
    var numDesc = total - (baseIdx + idx);

    // 보유 여부 컬럼 (기본: 미보유, 클릭 시 토글)
    var isOwned = (b.isOwned === true);
    var ownershipBtn = isOwned
      ? `<button type="button" class="btn btn-xs btn-success font-weight-bold" onclick="toggleBookOwnership('${b.id}')" title="클릭하여 '미보유'로 변경" style="font-size: 11px; padding: 2.5px 8px; border-radius: 6px; box-shadow: 0 1px 3px rgba(34,197,94,0.3);">
           <i class="fa-solid fa-check mr-1"></i>보유
         </button>`
      : `<button type="button" class="btn btn-xs btn-outline-secondary font-weight-bold" onclick="toggleBookOwnership('${b.id}')" title="클릭하여 '보유'로 변경" style="font-size: 11px; padding: 2.5px 8px; border-radius: 6px; background: #fff;">
           미보유
         </button>`;

    var coverImg = normalizeBookCoverUrl(b.cover);
    
    // 나노시트 단독 버튼 (서버에 실제 파일이 존재하는 도서만 활성화, 없는 도서는 무조건 '시트 없음' 비활성화)
    var isSheetAvailable = checkBookHasAvailableSheet(b);
    var pdfBtn = isSheetAvailable
      ? `<button type="button" class="btn-sheet-action btn-sheet-nanosheet w-100" onclick="openContentPdfModal('${b.id}')" title="나노시트 학습자료 열기" style="padding: 3px 8px; font-size: 11.5px;">
           <i class="fa-solid fa-file-pdf mr-1" style="font-size: 11px;"></i>나노시트
         </button>`
      : `<button type="button" class="btn-sheet-action w-100" disabled title="등록된 나노시트(PDF) 파일이 서버에 준비되지 않았습니다" style="padding: 3px 8px; font-size: 11px; opacity: 0.42; cursor: not-allowed; background: #f8fafc; color: #94a3b8; border: 1px dashed #cbd5e1;">
           <i class="fa-regular fa-file-circle-xmark mr-1" style="font-size: 10px;"></i>시트 없음
         </button>`;

    // 등록처 뱃지 및 내가 올린 도서 여부 판정
    var isHq = !b.creatorType || b.creatorType === 'HQ' || (b.academyName && b.academyName.includes('본사'));
    var isMyBook = isBookCreatedByMyAcademy(b);

    var originBadge = isHq
      ? `<span class="badge-soft badge-soft-warning font-weight-bold" style="white-space: nowrap;"><i class="fa-solid fa-crown mr-1"></i>본사 직속</span>`
      : (isMyBook
          ? `<span class="badge-soft badge-soft-success font-weight-bold" style="white-space: nowrap;" title="${b.academyName || '우리 학원'}"><i class="fa-solid fa-user-pen mr-1"></i>내가 등록</span>`
          : `<span class="badge-soft badge-soft-primary font-weight-bold" style="white-space: nowrap;" title="${b.academyName || '타 가맹점'}"><i class="fa-solid fa-school mr-1"></i>${b.academyName || '타 가맹점'}</span>`
        );

    // 관리 컬럼: 내가 올린 도서는 '도서 수정', 타 가맹점/본사 도서는 '정보 보기' (읽기 전용 모달 열기)
    var editBtnHtml = isMyBook
      ? `<button type="button" class="btn btn-xs btn-outline-secondary w-100" onclick="openAcademyBookOnlyAddModal('${b.id}')" style="border-radius: 6px; font-size: 11px; padding: 2.5px 6px; font-weight: 600;" title="도서 서지 정보 수정">
           <i class="fa-solid fa-pen-to-square mr-1 text-secondary"></i>도서 수정
         </button>`
      : `<button type="button" class="btn btn-xs btn-outline-info w-100" onclick="openAcademyBookOnlyAddModal('${b.id}')" style="border-radius: 6px; font-size: 11px; padding: 2.5px 6px; font-weight: 600;" title="도서 상세 서지 정보 조회 (읽기 전용)">
           <i class="fa-solid fa-circle-info mr-1 text-info"></i>정보 보기
         </button>`;

    tr.innerHTML = 
      `<td class="text-center font-weight-bold text-muted" style="font-size: 12px;">${numDesc}</td>
      <td class="text-center">
        ${ownershipBtn}
      </td>
      <td class="text-center">
        <div class="book-thumb-wrap" onclick="openAcademyBookCoverModal('${b.id || b.bookNo}')" style="cursor: pointer;">
          <img src="${coverImg}" class="book-thumb" alt="" onerror="this.onerror=null; this.src=DEFAULT_BOOK_COVER;">
          <div class="book-thumb-overlay"><i class="fa-solid fa-magnifying-glass-plus"></i></div>
        </div>
      </td>
      <td class="text-center font-weight-bold text-muted">${b.id || b.bookNo || '-'}</td>
      <td>
        <div style="font-weight: 700; font-size: 14.5px; color: var(--text-main); cursor: pointer;" onclick="openAcademyBookOnlyAddModal('${b.id}')" title="클릭하여 도서 상세 정보 보기" class="book-title-hover">${b.title}</div>
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
      <td class="text-center" style="white-space: nowrap; width: 100px; padding: 6px 8px;">
        ${pdfBtn}
      </td>
      <td class="text-center" style="cursor: pointer;" onclick="openAcademyStandaloneQuizModal('${b.id}')" title="북퀴즈 문항 세트 바로 열기">
        <span class="badge-soft badge-soft-success"><i class="fa-solid fa-check mr-1"></i>${b.quizStatus || '5문항 완비'}</span>
      </td>
      <td class="text-center font-weight-bold">${b.readCount || '0회'}</td>
      <td class="text-center" style="white-space: nowrap;">
        <div class="d-flex flex-column align-items-center justify-content-center" style="gap: 3px;">
          ${editBtnHtml}
          <button type="button" class="btn btn-xs w-100" onclick="openAcademyStandaloneQuizModal('${b.id}')" style="border-radius: 6px; font-size: 11px; padding: 2.5px 6px; font-weight: 700; background: #fffbeb; border: 1px solid #fde68a; color: #b45309;" title="북퀴즈 문항 세트 관리 및 출제">
            <i class="fa-solid fa-clipboard-question mr-1 text-warning"></i>퀴즈 관리
          </button>
        </div>
      </td>`;

    tbody.appendChild(tr);
  });
}

// -------------------------------------------------------------
// 학원 도서 페이지네이션 UI 렌더링 (30개씩 분할 표시)
// -------------------------------------------------------------
function renderAcademyBookPagination(total, page, totalPages) {
  var infoEl = document.getElementById('academyBookPageInfo');
  var pagEl = document.getElementById('academyBookPagination');
  if (!pagEl) return;

  if (total === 0) {
    if (infoEl) infoEl.innerHTML = '검색된 도서가 없습니다.';
    pagEl.innerHTML = '';
    return;
  }

  var startItem = (page - 1) * academyBookPageSize + 1;
  var endItem = Math.min(page * academyBookPageSize, total);
  if (infoEl) {
    infoEl.innerHTML = `총 <b>${total.toLocaleString()}</b>권 중 <b>${startItem}-${endItem}</b>권 표시 <span class="text-muted ml-1" style="font-weight: 500;">(페이지 ${page} / ${totalPages})</span>`;
  }

  var html = '';
  // 처음 / 이전 버튼
  html += `<button type="button" class="acad-page-btn" onclick="goAcademyBookPage(1)" ${page === 1 ? 'disabled' : ''} title="첫 페이지"><i class="fa-solid fa-angles-left"></i></button>`;
  html += `<button type="button" class="acad-page-btn" onclick="goAcademyBookPage(${page - 1})" ${page === 1 ? 'disabled' : ''} title="이전 페이지"><i class="fa-solid fa-angle-left"></i></button>`;

  // 5페이지 단위 페이징 블록
  var blockSize = 5;
  var startPage = Math.floor((page - 1) / blockSize) * blockSize + 1;
  var endPage = Math.min(startPage + blockSize - 1, totalPages);

  for (var p = startPage; p <= endPage; p++) {
    if (p === page) {
      html += `<button type="button" class="acad-page-btn active" aria-current="page">${p}</button>`;
    } else {
      html += `<button type="button" class="acad-page-btn" onclick="goAcademyBookPage(${p})">${p}</button>`;
    }
  }

  // 다음 / 마지막 버튼
  html += `<button type="button" class="acad-page-btn" onclick="goAcademyBookPage(${page + 1})" ${page === totalPages ? 'disabled' : ''} title="다음 페이지"><i class="fa-solid fa-angle-right"></i></button>`;
  html += `<button type="button" class="acad-page-btn" onclick="goAcademyBookPage(${totalPages})" ${page === totalPages ? 'disabled' : ''} title="마지막 페이지"><i class="fa-solid fa-angles-right"></i></button>`;

  pagEl.innerHTML = html;
}

// 학원 도서 특정 페이지로 이동
function goAcademyBookPage(targetPage) {
  if (targetPage < 1) targetPage = 1;
  academyBookCurrentPage = targetPage;
  filterAcademyBooks(true);

  // 테이블 카드 상단으로 부드럽게 스크롤 이동
  var tableEl = document.getElementById('academyBookTableBody');
  if (tableEl) {
    var cardEl = tableEl.closest('.simple-card');
    if (cardEl) {
      cardEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
}

// ==============================================================
// 대량 엑셀 업로드 모달 및 다운로드/처리 모듈
// ==============================================================
var selectedBulkBookFile = null;

function openBulkModal() {
  selectedBulkBookFile = null;
  var nameEl = document.getElementById('acadBulkFileNameDisplay');
  if (nameEl) nameEl.innerHTML = '클릭하여 엑셀 파일 선택 또는 드래그 앤 드롭';
  var inputEl = document.getElementById('acadBulkExcelFileInput');
  if (inputEl) inputEl.value = '';

  if (window.jQuery && typeof $('#acadBookExcelModal').modal === 'function') {
    $('#acadBookExcelModal').modal('show');
  } else {
    showModalVanilla('acadBookExcelModal');
  }
}

function handleBulkFileSelect(input) {
  if (!input.files || !input.files[0]) return;
  selectedBulkBookFile = input.files[0];
  var nameEl = document.getElementById('acadBulkFileNameDisplay');
  if (nameEl) {
    nameEl.innerHTML = `<span class="text-success font-weight-bold"><i class="fa-solid fa-file-excel mr-1"></i>${selectedBulkBookFile.name}</span> (${(selectedBulkBookFile.size / 1024).toFixed(1)} KB)`;
  }
}

function handleBulkFileDrop(e) {
  e.preventDefault();
  if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]) {
    selectedBulkBookFile = e.dataTransfer.files[0];
    var nameEl = document.getElementById('acadBulkFileNameDisplay');
    if (nameEl) {
      nameEl.innerHTML = `<span class="text-success font-weight-bold"><i class="fa-solid fa-file-excel mr-1"></i>${selectedBulkBookFile.name}</span> (${(selectedBulkBookFile.size / 1024).toFixed(1)} KB)`;
    }
  }
}

// 샘플 엑셀(CSV) 양식 다운로드
function downloadAcadBookSampleExcel() {
  var csvContent = "\uFEFFISBN(필수),주제분류태그(필수),세부태그1,세부태그2,세부태그3,세부태그4,세부태그5,어워드및추천,생각꺼내기,생각담기(1~7코드_또는_직접입력_0=없음)\n" +
    "9788932902708,#이야기,어린왕자,사막,여우,장미,순수,르몽드 선정 20세기 최고의 책,만약 나만의 작은 소행성이 있다면 어떤 꽃이나 동물을 가장 소중히 가꾸고 싶나요?,1\n" +
    "9788934986637,#과학,뇌과학,기억,편도체,감정,공감,제10회 창비청소년문학상 수상작,타인의 감정을 전혀 느끼지 못한다면 세상은 어떻게 보일까요?,주인공의 선택 중 가장 기억에 남는 장면은 무엇인가요?\n" +
    "9788943305437,#이야기,정류장,전차,기다림,엄마,가족,볼로냐 라가치상 특별상,누군가를 간절하게 기다려본 경험이 있나요?,3\n" +
    "9788971966969,#자연,마당,암탉,잎싹,초록이,자유,한국어린이도서상 수상,잎싹이 양계장을 벗어난 용기는 어디서 나왔을까요?,0\n";
  
  var blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url;
  a.download = "콘텐츠 등록 양식.csv";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showAcademyToast('새로운 도서 대량등록 CSV 표준 양식이 다운로드되었습니다.');
}

// 학원 도서 콘텐츠 전체 목록 엑셀(CSV) 다운로드 기능
// ------------------------------------------
function exportAcademyBooksToExcel() {
  if (typeof syncAcademyBooksState === 'function') syncAcademyBooksState();
  var booksToExport = (typeof academyBookList !== 'undefined' && Array.isArray(academyBookList) && academyBookList.length > 0)
    ? academyBookList
    : ((typeof window !== 'undefined' && Array.isArray(window.MIGRATED_BOOKS)) ? window.MIGRATED_BOOKS : []);

  if (!booksToExport || booksToExport.length === 0) {
    showAcademyToast('다운로드할 도서 콘텐츠 데이터가 없습니다.');
    return;
  }

  // 표준 CSV 헤더 컬럼 (마스터와 100% 동일한 서식 체계)
  var headers = [
    "도서코드(ID)",
    "ISBN",
    "도서명",
    "시리즈",
    "저자",
    "출판사",
    "출판년도",
    "추천학년",
    "도서분류",
    "주제분류태그",
    "소속학원(HQ/가맹점)",
    "북퀴즈세트",
    "나노시트활동지",
    "공개여부",
    "등록일자"
  ];

  var escapeCsv = function(val) {
    if (val === null || val === undefined) return '""';
    var str = String(val).replace(/"/g, '""');
    return '"' + str + '"';
  };

  // 날짜 형식 변환: YYYY-MM-DD (년월일) 까지만 안전 추출
  var formatBookDate = function(rawDate) {
    if (!rawDate) return "";
    var str = String(rawDate).trim();
    var match = str.match(/^(\d{4}[-/.]\d{2}[-/.]\d{2})/);
    if (match) {
      return match[1].replace(/[/.]/g, "-");
    }
    return str.slice(0, 10);
  };

  // 도서 주제 분류 태그(테마 태그) 추출 헬퍼 (세부 태그가 아닌 '주제 분류 태그 선택'의 테마)
  var getThemeTag = function(b) {
    if (!b) return "";
    if (b.themeTag && typeof b.themeTag === 'string' && b.themeTag.trim()) {
      var t = b.themeTag.trim();
      return t.indexOf('#') === 0 ? t : ('#' + t);
    }
    if (b.subject && typeof b.subject === 'string' && b.subject.trim()) {
      var s = b.subject.trim();
      return s.indexOf('#') === 0 ? s : ('#' + s);
    }
    var themes = (typeof themeList !== 'undefined' && Array.isArray(themeList)) ? themeList : ((typeof window !== 'undefined' && Array.isArray(window.NANO_SERVER_THEMES)) ? window.NANO_SERVER_THEMES : []);
    if (themes.length > 0) {
      for (var i = 0; i < themes.length; i++) {
        var th = themes[i];
        var cleanTh = String(th.tag || th.title || "").replace(/^#/, "").trim().toLowerCase();
        if (!cleanTh) continue;
        if (Array.isArray(b.tags)) {
          for (var j = 0; j < b.tags.length; j++) {
            var tg = b.tags[j];
            var cleanTg = String(tg || "").replace(/^#/, "").trim().toLowerCase();
            if (cleanTg === cleanTh) return th.tag ? (th.tag.indexOf('#') === 0 ? th.tag : ('#' + th.tag)) : ('#' + cleanTh);
          }
        }
        if (b.category && String(b.category).toLowerCase().indexOf(cleanTh) !== -1) {
          return th.tag ? (th.tag.indexOf('#') === 0 ? th.tag : ('#' + th.tag)) : ('#' + cleanTh);
        }
      }
    }
    if (Array.isArray(b.tags) && b.tags.length > 0 && typeof b.tags[0] === 'string') {
      var first = b.tags[0].trim();
      if (first.indexOf('#') === 0) return first;
    }
    if (b.category && typeof b.category === 'string' && !/^[A-Z]$/.test(b.category.trim())) {
      var c = b.category.trim();
      return c.indexOf('#') === 0 ? c : ('#' + c);
    }
    return "";
  };

  // 북퀴즈 등록 세트 수 산출 헬퍼 (몇 곳에서 등록했는지 기준)
  var getQuizSetCount = function(b) {
    if (!b) return "0";
    if (typeof getBookQuizSetCount === "function") {
      var cnt = getBookQuizSetCount(b);
      return cnt > 0 ? (cnt + "Set") : "0";
    }
    if (Array.isArray(b.quizSets) && b.quizSets.length > 0) {
      var valid = b.quizSets.filter(function(s) {
        return (Array.isArray(s.questions) && s.questions.length > 0) || (Array.isArray(s.quizzes) && s.quizzes.length > 0);
      });
      return valid.length > 0 ? (valid.length + "Set") : "0";
    }
    if (b.title && b.title.indexOf("어린 왕자") !== -1) return "2Set";
    if (b.hasQuiz === true || b.hasQuiz === "Y" || (typeof b.quizzes === "number" && b.quizzes > 0) || (b.quizStatus && b.quizStatus.indexOf('완비') !== -1) || (Array.isArray(b.quizList) && b.quizList.length > 0)) {
      return "1Set";
    }
    if (b.id === "FA000001" || (b.title && b.title.indexOf("고양이 목욕탕") !== -1)) return "1Set";
    return "0";
  };

  // 도서 ISBN 추출 헬퍼 (13자리 숫자 유지)
  var getIsbn = function(b) {
    if (!b) return "";
    if (b.isbn && String(b.isbn).trim()) return String(b.isbn).trim();
    if (b.isbn13 && String(b.isbn13).trim()) return String(b.isbn13).trim();
    if (b.cover && typeof b.cover === 'string') {
      var m = b.cover.match(/\/(\d{10,13})\.(jpg|png|webp)/i);
      if (m && m[1]) return m[1];
    }
    return "";
  };

  var rows = booksToExport.map(function(b) {
    var isHq = !b.academyId || b.academyId === "HQ" || b.creatorType === "HQ";
    var academyName = b.academyName || (isHq ? "본사 직속(HQ)" : "가맹 학원");
    var quizSetDisplay = getQuizSetCount(b);
    var hasSheet = (b.hasSheet || b.sheet) ? "유" : "무";
    var isPublic = b.isPublic !== "N" ? "공개" : "비공개";
    var pubYear = b.pubYear || b.year || "";
    var themeTag = getThemeTag(b);
    var isbnVal = getIsbn(b);
    var dateVal = formatBookDate(b.createdAt || b.date || b.regDate || "");

    // ISBN은 엑셀에서 숫자로 인식하여 지수 변환(9.79119E+12)되는 것을 방지하기 위해 ="ISBN" 텍스트 수식 포맷 사용
    var isbnCell = isbnVal ? ('="' + isbnVal + '"') : '""';

    return [
      escapeCsv(b.id || b.bookNo || ""),
      isbnCell,
      escapeCsv(b.title),
      escapeCsv(b.series || ""),
      escapeCsv(b.author || ""),
      escapeCsv(b.publisher || ""),
      escapeCsv(pubYear),
      escapeCsv(b.grade || ""),
      escapeCsv(b.category || ""),
      escapeCsv(themeTag),
      escapeCsv(academyName),
      escapeCsv(quizSetDisplay),
      escapeCsv(hasSheet),
      escapeCsv(isPublic),
      escapeCsv(dateVal)
    ].join(",");
  });

  // UTF-8 BOM(\uFEFF)을 추가하여 엑셀에서 열었을 때 한글이 깨지지 않도록 보장
  var csvContent = "\uFEFF" + [headers.map(function(h) { return '"' + h + '"'; }).join(","), rows.join("\r\n")].join("\r\n");
  var blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  var url = URL.createObjectURL(blob);
  var a = document.createElement("a");
  var today = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = "도서 콘텐츠 목록 (" + today + ").csv";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  showAcademyToast("도서 콘텐츠 전체 " + booksToExport.length + "권이 엑셀(CSV)로 성공적으로 다운로드되었습니다.");
}

// ==============================================================
// 공통 엑셀/CSV 파서 및 도서·북퀴즈 대량 등록 실행 모듈 (본사 관리자와 동일 규격)
// ==============================================================
var ACAD_THINK_PROMPTS_7_PRESETS = [
  "주인공이 옆에 있다면 하고 싶은 이야기를 적어주세요.",
  "이 책을 읽고 가장 많이 떠오른 내 주변의 사람은 누구이며 그 이유는 무엇인가요?",
  "이야기는 끝났지만, 그 이후 어떤 일이 벌어졌는 지 상상해서 이야기를 만들어주세요.",
  "기억나는 장면이나 문장을 적어보세요.",
  "이 책에서 얻은 교훈이 있다면?",
  "가장 기억에 남는 등장인물은 누구이며 그 이유는 무엇인가요?",
  "이 책을 친구에게 추천한다면, 뭐라고 소개하고 싶은가요?"
];

// RFC 4180 호환 다중행 CSV 파서 (쌍따옴표 내 쉼표, 큰따옴표 이스케이프 "", 줄바꿈 처리)
function parseAcadRobustCSV(text) {
  var clean = String(text || '').replace(/^\uFEFF/, '');
  var rows = [];
  var curRow = [];
  var curCell = '';
  var inQuotes = false;

  for (var i = 0; i < clean.length; i++) {
    var c = clean[i];
    var next = clean[i + 1];

    if (c === '"') {
      if (inQuotes && next === '"') {
        curCell += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (c === ',' && !inQuotes) {
      curRow.push(curCell.trim());
      curCell = '';
    } else if ((c === '\r' || c === '\n') && !inQuotes) {
      if (c === '\r' && next === '\n') i++;
      curRow.push(curCell.trim());
      if (curRow.some(function(cell) { return cell.length > 0; })) {
        rows.push(curRow);
      }
      curRow = [];
      curCell = '';
    } else {
      curCell += c;
    }
  }

  curRow.push(curCell.trim());
  if (curRow.some(function(cell) { return cell.length > 0; })) {
    rows.push(curRow);
  }
  return rows;
}

// 업로드된 파일(.csv / .xlsx / .xls)을 2차원 배열로 안전 변환
function parseAcadSpreadsheetFileToRows(file) {
  return new Promise(function(resolve, reject) {
    var ext = String(file.name || '').split('.').pop().toLowerCase();
    var reader = new FileReader();

    if (ext === 'csv') {
      reader.onload = function(e) {
        try {
          resolve(parseAcadRobustCSV(e.target.result));
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = reject;
      reader.readAsText(file, 'UTF-8');
    } else if (ext === 'xlsx' || ext === 'xls') {
      if (typeof XLSX === 'undefined') {
        reject(new Error('엑셀 파싱 라이브러리가 아직 로드되지 않았습니다. 잠시 후 다시 시도하거나 CSV 파일을 이용해주세요.'));
        return;
      }
      reader.onload = function(e) {
        try {
          var data = new Uint8Array(e.target.result);
          var workbook = XLSX.read(data, { type: 'array' });
          var firstSheetName = workbook.SheetNames[0];
          var worksheet = workbook.Sheets[firstSheetName];
          var rows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
          resolve(rows);
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    } else {
      reject(new Error('지원하지 않는 파일 형식입니다. .xlsx, .xls, .csv 파일만 업로드할 수 있습니다.'));
    }
  });
}

// ISBN 정제 헬퍼 (엑셀 수식 ="978..." 및 하이픈/공백 제거, 13자리 우선 추출)
function sanitizeAcadIsbnString(raw) {
  if (raw === null || raw === undefined) return '';
  var s = String(raw).trim().replace(/^="?|"?$/g, '');
  var tokens = s.split(/[\s,/|]+/).map(function(t) { return t.replace(/[^0-9Xx]/g, ''); }).filter(Boolean);
  var isbn13 = tokens.find(function(t) { return t.length === 13; });
  if (isbn13) return isbn13;
  var isbn10 = tokens.find(function(t) { return t.length === 10; });
  if (isbn10) return isbn10;
  var digits = s.replace(/[^0-9Xx]/g, '');
  return (digits.length === 10 || digits.length === 13) ? digits : '';
}

// 생각 담기 코드(1~7, 0, 직접입력) 해석 헬퍼
function resolveAcadThinkInsertValue(rawVal) {
  if (rawVal === null || rawVal === undefined) return '';
  var s = String(rawVal).trim();
  if (!s || s === '0' || s === '없음' || s.toUpperCase() === 'NONE') return '';
  var codeNum = parseInt(s, 10);
  if (String(codeNum) === s && codeNum >= 1 && codeNum <= 7) {
    return ACAD_THINK_PROMPTS_7_PRESETS[codeNum - 1];
  }
  return s;
}

// 카카오 도서 검색 비동기 헬퍼 (대량 등록 전용)
async function fetchAcadKakaoBookMetadata(isbn) {
  if (!isbn) return null;
  var kakaoApiKey = '11d75cc8189f15ddf547b5538827d04d';
  var apiUrl = 'https://dapi.kakao.com/v3/search/book?target=isbn&query=' + encodeURIComponent(isbn);
  try {
    var res = await fetch(apiUrl, {
      method: 'GET',
      headers: { 'Authorization': 'KakaoAK ' + kakaoApiKey }
    });
    if (!res.ok) return null;
    var data = await res.json();
    if (data && Array.isArray(data.documents) && data.documents.length > 0) {
      return data.documents[0];
    }
  } catch (err) {
    console.warn('Kakao book fetch failed for ISBN ' + isbn, err);
  }
  return null;
}

// 학원 대량 등록용 고유 도서 관리 코드(KA300001 규격) 채번 헬퍼
function generateNextAcadBookCode(cat1Val, cat2Val, gradeVal, reservedSet) {
  var c2Code = 'K';
  if (cat2Val && (cat2Val.indexOf('외서') !== -1 || cat2Val === 'F')) c2Code = 'F';
  else if (cat2Val && (cat2Val.indexOf('구분') !== -1 || cat2Val === 'N')) c2Code = 'N';

  var c1Code = 'A';
  if (cat1Val && (cat1Val.indexOf('인물') !== -1 || cat1Val.indexOf('위인') !== -1 || cat1Val === 'B')) c1Code = 'B';
  else if (cat1Val && (cat1Val.indexOf('비문학') !== -1 || cat1Val.indexOf('정보') !== -1 || cat1Val === 'C')) c1Code = 'C';

  var gCode = '3';
  var gStr = String(gradeVal || '');
  if (gStr.indexOf('유치') !== -1 || gStr.indexOf('미취학') !== -1) gCode = '0';
  else if (gStr.indexOf('중등 1') !== -1 || gStr.indexOf('중1') !== -1) gCode = '7';
  else if (gStr.indexOf('중등 2') !== -1 || gStr.indexOf('중2') !== -1) gCode = '8';
  else if (gStr.indexOf('중등 3') !== -1 || gStr.indexOf('중3') !== -1) gCode = '9';
  else {
    var gm = gStr.match(/([1-6])/);
    if (gm) gCode = gm[1];
  }

  var prefix = c2Code + c1Code + gCode;
  var maxSeq = 0;

  var allBooks = (typeof academyBookList !== 'undefined' && Array.isArray(academyBookList)) ? academyBookList : [];
  allBooks.forEach(function(b) {
    var code = String((b && (b.bookNo || b.id)) || '');
    if (code.indexOf(prefix) === 0) {
      var num = parseInt(code.slice(prefix.length), 10);
      if (!isNaN(num) && num > maxSeq) maxSeq = num;
    }
  });

  if (reservedSet) {
    reservedSet.forEach(function(code) {
      if (code.indexOf(prefix) === 0) {
        var num = parseInt(code.slice(prefix.length), 10);
        if (!isNaN(num) && num > maxSeq) maxSeq = num;
      }
    });
  }

  var candidate = prefix + String(maxSeq + 1).padStart(5, '0');
  while (reservedSet && reservedSet.has(candidate)) {
    maxSeq++;
    candidate = prefix + String(maxSeq + 1).padStart(5, '0');
  }
  if (reservedSet) reservedSet.add(candidate);
  return candidate;
}

// 대량 엑셀 도서 일괄 등록 실행
async function executeBulkBookUpload() {
  var inputEl = document.getElementById('acadBulkExcelFileInput');
  var file = selectedBulkBookFile || (inputEl && inputEl.files && inputEl.files[0]) || null;
  if (!file) {
    alert('업로드할 엑셀/CSV 파일을 먼저 선택해주세요.');
    return;
  }

  var fileName = file.name;
  var progressEl = document.getElementById('acadBulkFileNameDisplay');
  var btnEl = document.getElementById('btnExecuteBulkUpload');
  if (btnEl) btnEl.disabled = true;

  try {
    var rawRows = await parseAcadSpreadsheetFileToRows(file);
    if (!rawRows || rawRows.length <= 1) {
      alert('등록할 도서 데이터 행이 존재하지 않습니다. (헤더만 있거나 빈 파일)');
      return;
    }

    var firstHeader = rawRows[0].map(function(c) { return String(c || '').toLowerCase(); }).join(',');
    var isNewFormat = firstHeader.indexOf('isbn') !== -1 && firstHeader.indexOf('도서명') === -1;

    var parsedRows = [];
    var validationErrors = [];

    for (var i = 1; i < rawRows.length; i++) {
      var row = rawRows[i];
      var rowNum = i + 1;
      if (!row || !row.some(function(cell) { return String(cell ?? '').trim().length > 0; })) continue;

      if (isNewFormat) {
        var rawIsbn = String(row[0] ?? '').trim();
        var rawThemeTag = String(row[1] ?? '').trim();
        var detail1 = String(row[2] ?? '').trim();
        var detail2 = String(row[3] ?? '').trim();
        var detail3 = String(row[4] ?? '').trim();
        var detail4 = String(row[5] ?? '').trim();
        var detail5 = String(row[6] ?? '').trim();
        var awards = String(row[7] ?? '').trim();
        var thinkExtract = String(row[8] ?? '').trim();
        var rawThinkInsert = String(row[9] ?? '').trim();

        var cleanIsbn = sanitizeAcadIsbnString(rawIsbn);
        if (!cleanIsbn) {
          validationErrors.push('[' + rowNum + '행] ISBN이 비어있거나 올바른 10/13자리 형식이 아닙니다.');
          continue;
        }
        if (!rawThemeTag) {
          validationErrors.push('[' + rowNum + '행: ISBN ' + cleanIsbn + '] 주제 분류 태그가 비어있습니다. (필수 입력 항목)');
          continue;
        }

        var themeTag = rawThemeTag.indexOf('#') === 0 ? rawThemeTag : ('#' + rawThemeTag);
        var detailList = [detail1, detail2, detail3, detail4, detail5]
          .filter(function(t) { return t.length > 0; })
          .map(function(t) { return t.indexOf('#') === 0 ? t : ('#' + t); });

        parsedRows.push({
          isNew: true,
          isbn: cleanIsbn,
          themeTag: themeTag,
          detailList: detailList,
          detailTag: detailList.join(' '),
          awards: awards,
          thinkExtract: thinkExtract,
          thinkInsert: resolveAcadThinkInsertValue(rawThinkInsert),
          rowNum: rowNum
        });
      } else {
        var title = String(row[0] ?? '').trim();
        var author = String(row[1] ?? '').trim();
        var publisher = String(row[2] ?? '').trim();
        var rawGrade = String(row[3] ?? '').trim();
        var rawCat1 = String(row[4] ?? '').trim();
        var rawCat2 = String(row[5] ?? '').trim();
        var series = String(row[6] ?? '').trim();
        var legacyIsbn = sanitizeAcadIsbnString(row[7] ?? '');

        if (!title) {
          validationErrors.push('[' + rowNum + '행] 도서명(제목)이 비어있습니다.');
          continue;
        }

        parsedRows.push({
          isNew: false,
          title: title,
          author: author || '작자 미상',
          publisher: publisher || '출판사 미상',
          grade: rawGrade || '초등 3학년',
          cat1: rawCat1 || '소설',
          cat2: rawCat2 || '국내서',
          series: series || '단권',
          isbn: legacyIsbn,
          rowNum: rowNum
        });
      }
    }

    if (validationErrors.length > 0) {
      var errorMsg = '[엑셀 업로드 유효성 검사 실패]\n총 ' + validationErrors.length + '건의 규격 오류가 발견되었습니다.\n\n' +
        validationErrors.slice(0, 6).join('\n\n') +
        (validationErrors.length > 6 ? '\n\n... 외 ' + (validationErrors.length - 6) + '건 추가 오류' : '');
      alert(errorMsg);
      return;
    }

    if (parsedRows.length === 0) {
      alert('등록 가능한 유효 도서 데이터 행이 없습니다.');
      return;
    }

    var acadName = (typeof currentAcademyInfo !== 'undefined' && currentAcademyInfo && currentAcademyInfo.name) ? currentAcademyInfo.name : '우리 학원';
    var acadId = (typeof currentAcademyInfo !== 'undefined' && currentAcademyInfo && currentAcademyInfo.id) ? currentAcademyInfo.id : 'MY_ACAD';
    var reservedCodes = new Set();
    var finalBooks = [];
    var skippedDuplicates = 0;

    for (var idx = 0; idx < parsedRows.length; idx++) {
      var item = parsedRows[idx];
      if (progressEl) {
        progressEl.innerHTML = '<span class="text-primary font-weight-bold"><i class="fa-solid fa-spinner fa-spin mr-1"></i>[' + (idx + 1) + '/' + parsedRows.length + '] ISBN(' + (item.isbn || item.title) + ') 도서 정보 자동 수집 중...</span>';
      }

      if (item.isNew) {
        var existingByIsbn = (Array.isArray(academyBookList) ? academyBookList : []).find(function(b) {
          return b && b.isbn && sanitizeAcadIsbnString(b.isbn) === item.isbn;
        });

        var matchedLocal = existingByIsbn;
        if (!matchedLocal && typeof window !== 'undefined' && Array.isArray(window.MIGRATED_BOOKS)) {
          matchedLocal = window.MIGRATED_BOOKS.find(function(b) {
            return b && b.isbn && sanitizeAcadIsbnString(b.isbn) === item.isbn;
          });
        }

        // 운영 서버에 이미 동일 ISBN 도서가 등록되어 있는 경우 중복 생성 방지
        if (existingByIsbn && window.NanoPortal && NanoPortal.remote && existingByIsbn.serverId) {
          skippedDuplicates++;
          continue;
        }

        var doc = matchedLocal ? null : await fetchAcadKakaoBookMetadata(item.isbn);
        var bTitle = '';
        var bAuthor = '작자 미상';
        var bPub = '출판사 미상';
        var bCover = 'upload/banner/banner_reading_king.jpg';
        var bSynopsis = '';
        var bCat1 = '소설';
        var bCat2 = (item.isbn.indexOf('97889') === 0 || item.isbn.indexOf('97911') === 0) ? '국내서' : '외서';
        var bGrade = '초등 3학년';
        var bSeries = '단권';
        var bIsSingle = true;

        if (matchedLocal) {
          bTitle = matchedLocal.title || '';
          bAuthor = matchedLocal.author || bAuthor;
          bPub = matchedLocal.publisher || matchedLocal.pub || bPub;
          bCover = matchedLocal.cover || matchedLocal.coverUrl || bCover;
          bSynopsis = matchedLocal.synopsis || matchedLocal.description || '';
          bCat1 = matchedLocal.cat1 || bCat1;
          bCat2 = matchedLocal.cat2 || bCat2;
          bGrade = matchedLocal.grade || bGrade;
          bSeries = matchedLocal.series || bSeries;
          bIsSingle = matchedLocal.isSingle !== false;
        } else if (doc) {
          bTitle = doc.title || '';
          bAuthor = Array.isArray(doc.authors) && doc.authors.length > 0 ? doc.authors.join(', ') : (doc.authors || bAuthor);
          bPub = doc.publisher || bPub;
          if (doc.thumbnail) {
            bCover = doc.thumbnail.indexOf('R120x174') !== -1 ? doc.thumbnail.replace('R120x174', 'R300x0') : doc.thumbnail;
          }
          bSynopsis = doc.contents || '';
        } else {
          bTitle = '신규 등록 도서 (ISBN: ' + item.isbn + ')';
        }

        var isNonfiction = (bCat1.indexOf('비문학') !== -1 || bCat1 === 'C');
        var newBookId = generateNextAcadBookCode(bCat1, bCat2, bGrade, reservedCodes);
        var tags = [item.themeTag].concat(item.detailList || []);

        finalBooks.push({
          id: newBookId,
          bookNo: newBookId,
          isbn: item.isbn,
          title: bTitle,
          subtitle: bSeries && bSeries !== '단권' ? bSeries : '학원 등록 도서',
          author: bAuthor,
          publisher: bPub,
          pub: bPub,
          grade: bGrade,
          cat1: bCat1,
          cat2: bCat2,
          category: (bCat2 === '외서' ? 'F' : 'K') + ' / ' + item.themeTag.replace(/^#/, ''),
          series: bSeries,
          isSingle: bIsSingle,
          themeTag: item.themeTag,
          tags: tags,
          detailTag: item.detailTag,
          awards: item.awards || '',
          thinkExtract: item.thinkExtract || '',
          thinkInsert: item.thinkInsert || '',
          synopsis: bSynopsis,
          description: bSynopsis,
          cover: bCover,
          coverUrl: bCover,
          isPublic: 'Y',
          creatorType: 'ACADEMY',
          academyName: acadName,
          academyId: acadId,
          isMyCreation: true,
          isOwned: false,
          hasQuiz: false,
          quizStatus: '미출제',
          readCount: '0회',
          createdAt: new Date().toISOString()
        });
      } else {
        var legBookId = generateNextAcadBookCode(item.cat1, item.cat2, item.grade, reservedCodes);
        finalBooks.push({
          id: legBookId,
          bookNo: legBookId,
          isbn: item.isbn || '',
          title: item.title,
          subtitle: item.series && item.series !== '단권' ? item.series : '학원 등록 도서',
          author: item.author,
          publisher: item.publisher,
          pub: item.publisher,
          grade: item.grade,
          cat1: item.cat1,
          cat2: item.cat2,
          category: item.cat1 || '문학',
          series: item.series,
          isSingle: !item.series || item.series === '단권',
          themeTag: '#이야기',
          tags: ['#이야기'],
          detailTag: '',
          awards: '',
          thinkExtract: '',
          thinkInsert: '',
          synopsis: '',
          description: '',
          cover: 'upload/banner/banner_reading_king.jpg',
          coverUrl: 'upload/banner/banner_reading_king.jpg',
          isPublic: 'Y',
          creatorType: 'ACADEMY',
          academyName: acadName,
          academyId: acadId,
          isMyCreation: true,
          isOwned: false,
          hasQuiz: false,
          quizStatus: '미출제',
          readCount: '0회',
          createdAt: new Date().toISOString()
        });
      }
    }

    if (finalBooks.length === 0 && skippedDuplicates > 0) {
      alert('업로드하신 파일의 모든 도서(' + skippedDuplicates + '권)가 이미 라이브러리에 등록되어 있습니다.');
      return;
    }

    // 운영 서버 연동 시 백엔드 DB에 실제 도서 저장
    if (window.NanoPortal && NanoPortal.remote && typeof NanoPortal.saveBook === 'function') {
      var savedServerBooks = [];
      var serverErrors = [];
      for (var sIdx = 0; sIdx < finalBooks.length; sIdx++) {
        var targetBook = finalBooks[sIdx];
        if (progressEl) {
          progressEl.innerHTML = '<span class="text-success font-weight-bold"><i class="fa-solid fa-spinner fa-spin mr-1"></i>[' + (sIdx + 1) + '/' + finalBooks.length + '] 서버 DB 저장 중: ' + targetBook.title + '</span>';
        }
        try {
          await NanoPortal.saveBook(targetBook);
          savedServerBooks.push(targetBook);
        } catch (saveErr) {
          console.error('도서 서버 저장 실패:', targetBook.title, saveErr);
          serverErrors.push('[' + targetBook.title + '] ' + (saveErr.message || '저장 실패'));
        }
      }
      if (savedServerBooks.length === 0 && serverErrors.length > 0) {
        alert('[도서 일괄 서버 저장 오류]\n' + serverErrors.slice(0, 5).join('\n'));
        return;
      }
      finalBooks = savedServerBooks;
    }

    for (var k = finalBooks.length - 1; k >= 0; k--) {
      var nb = finalBooks[k];
      academyBookList.unshift(nb);
      if (typeof markBookAsMyCreation === 'function') markBookAsMyCreation(nb.id);
      if (typeof window !== 'undefined' && Array.isArray(window.MIGRATED_BOOKS)) {
        window.MIGRATED_BOOKS.unshift(nb);
      }
    }

    if (typeof saveCustomAcademyBooks === 'function') saveCustomAcademyBooks(academyBookList);
    filterAcademyBooks();

    selectedBulkBookFile = null;
    if (inputEl) inputEl.value = '';
    if (progressEl) progressEl.innerHTML = '클릭하여 엑셀 파일 선택 또는 드래그 앤 드롭';

    if (window.jQuery && typeof $('#acadBookExcelModal').modal === 'function') {
      $('#acadBookExcelModal').modal('hide');
    } else {
      hideModalVanilla('acadBookExcelModal');
    }

    var dupNote = skippedDuplicates > 0 ? ' (기등록 중복 ' + skippedDuplicates + '권 제외)' : '';
    showAcademyToast('[' + fileName + '] 총 ' + finalBooks.length + '권의 도서가 ISBN 자동 채우기와 함께 등록되었습니다!' + dupNote);
  } catch (err) {
    console.error('대량 도서 업로드 오류:', err);
    alert('파일을 읽고 처리하는 중 오류가 발생했습니다: ' + (err.message || err));
  } finally {
    if (btnEl) btnEl.disabled = false;
  }
}

// ==============================================================
// 학원 관리자 엑셀 대량 북퀴즈 등록 모달 & 샘플 다운로드 & 일괄 업로드
// ==============================================================
var selectedBulkQuizFile = null;

function openAcadQuizExcelModal() {
  selectedBulkQuizFile = null;
  var nameEl = document.getElementById('acadQuizExcelFileName');
  if (nameEl) nameEl.innerHTML = '클릭하여 엑셀 파일 선택 또는 드래그 앤 드롭';
  var fileInp = document.getElementById('acadQuizExcelFileInput');
  if (fileInp) fileInp.value = '';

  if (window.jQuery && typeof $('#acadQuizExcelModal').modal === 'function') {
    $('#acadQuizExcelModal').modal('show');
  } else {
    showModalVanilla('acadQuizExcelModal');
  }
}

function handleAcadQuizExcelFileSelect(input) {
  if (!input.files || !input.files[0]) return;
  selectedBulkQuizFile = input.files[0];
  var el = document.getElementById('acadQuizExcelFileName');
  if (el) {
    el.innerHTML = '<span class="text-warning font-weight-bold" style="color: #d97706 !important;"><i class="fa-solid fa-file-excel mr-1"></i>' +
      selectedBulkQuizFile.name + ' (' + Math.max(1, Math.round(selectedBulkQuizFile.size / 1024)) + 'KB)</span>';
  }
}

function handleAcadQuizExcelFileDrop(e) {
  e.preventDefault();
  if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]) {
    selectedBulkQuizFile = e.dataTransfer.files[0];
    var el = document.getElementById('acadQuizExcelFileName');
    if (el) {
      el.innerHTML = '<span class="text-warning font-weight-bold" style="color: #d97706 !important;"><i class="fa-solid fa-file-excel mr-1"></i>' +
        selectedBulkQuizFile.name + ' (' + Math.max(1, Math.round(selectedBulkQuizFile.size / 1024)) + 'KB)</span>';
    }
  }
}

// 북퀴즈 엑셀 헤더 유연 인식 (본사 마스터와 100% 동일 규격)
function parseAcadQuizHeaderIndices(headerRow) {
  var map = {
    bookNo: -1,
    title: -1,
    questionNo: -1,
    quizType: -1,
    question: -1,
    opt1: -1,
    opt2: -1,
    opt3: -1,
    opt4: -1,
    opt5: -1,
    ans: -1,
    similarAns: -1,
    hint: -1,
    score: -1
  };

  headerRow.forEach(function(col, idx) {
    if (!col) return;
    var s = String(col).toLowerCase().replace(/[\s_\-()（）[\]]/g, '');

    if (s.indexOf('도서코드') !== -1 || s.indexOf('관리코드') !== -1 || s === 'bookno' || s === 'code' || s === '도서번호') {
      map.bookNo = idx;
    } else if (s.indexOf('도서명') !== -1 || s === '제목' || s === 'booktitle' || s === 'title') {
      map.title = idx;
    } else if (s.indexOf('문항번호') !== -1 || s.indexOf('문제번호') !== -1 || s === '순번' || s === 'no' || s === 'questionno') {
      map.questionNo = idx;
    } else if (s.indexOf('문항유형') !== -1 || s.indexOf('문제유형') !== -1 || s === '유형' || s === 'quiztype' || s === 'type') {
      map.quizType = idx;
    } else if (s.indexOf('문항내용') !== -1 || s.indexOf('질문') !== -1 || s === '문제' || s === '문항' || s === 'question') {
      map.question = idx;
    } else if (s.indexOf('보기1') !== -1 || s.indexOf('선택지1') !== -1 || s === 'opt1' || s === 'option1') {
      map.opt1 = idx;
    } else if (s.indexOf('보기2') !== -1 || s.indexOf('선택지2') !== -1 || s === 'opt2' || s === 'option2') {
      map.opt2 = idx;
    } else if (s.indexOf('보기3') !== -1 || s.indexOf('선택지3') !== -1 || s === 'opt3' || s === 'option3') {
      map.opt3 = idx;
    } else if (s.indexOf('보기4') !== -1 || s.indexOf('선택지4') !== -1 || s === 'opt4' || s === 'option4') {
      map.opt4 = idx;
    } else if (s.indexOf('보기5') !== -1 || s.indexOf('선택지5') !== -1 || s === 'opt5' || s === 'option5') {
      map.opt5 = idx;
    } else if (s.indexOf('유사인정') !== -1 || s.indexOf('유사정답') !== -1 || s.indexOf('인정정답') !== -1 || s.indexOf('similarans') !== -1 || s.indexOf('similaranswer') !== -1 || s.indexOf('similar') !== -1) {
      map.similarAns = idx;
    } else if (s.indexOf('정답') !== -1 || s.indexOf('정답번호') !== -1 || s === '답' || s === 'ans' || s === 'answer' || s === 'correctanswer') {
      map.ans = idx;
    } else if (s.indexOf('해설') !== -1 || s.indexOf('힌트') !== -1 || s === '설명' || s === 'hint' || s === 'explanation') {
      map.hint = idx;
    } else if (s.indexOf('배점') !== -1 || s === '점수' || s === 'score') {
      map.score = idx;
    }
  });

  return map;
}

// 북퀴즈 정답 정규화 헬퍼 (숫자 1~5, 원문자 ①~⑤, 보기 텍스트 일치 처리)
function normalizeAcadQuizAnswerVal(rawAns, options, isSubjective) {
  if (rawAns === null || rawAns === undefined) return null;
  var s = String(rawAns).trim();
  if (!s) return null;

  if (isSubjective) {
    var parts = s.split(/[,/|]/).map(function(p) { return p.trim(); }).filter(Boolean);
    return parts[0] || s;
  }

  var circleMap = { '①': '1', '②': '2', '③': '3', '④': '4', '⑤': '5' };
  if (circleMap[s]) {
    var cNum = Number(circleMap[s]);
    if (cNum >= 1 && cNum <= options.length) return String(cNum);
  }

  var numMatch = s.match(/^[보기\s]*([1-5])[번]?$/);
  if (numMatch) {
    var n = Number(numMatch[1]);
    if (n >= 1 && n <= options.length) return String(n);
  }

  var pureNum = Number(s);
  if (Number.isInteger(pureNum) && pureNum >= 1 && pureNum <= options.length) {
    return String(pureNum);
  }

  var matchIdx = options.findIndex(function(o) { return o.trim() === s; });
  if (matchIdx >= 0) {
    return String(matchIdx + 1);
  }

  return null;
}

// 표준 북퀴즈 서식 다운로드 (CSV / XLSX - 실제 등록된 학원 도서코드 샘플 매핑)
function downloadAcadQuizExcelTemplate(format) {
  var fmt = format || 'csv';
  var sourceBooks = (typeof academyBookList !== 'undefined' && Array.isArray(academyBookList) && academyBookList.length > 0)
    ? academyBookList
    : ((typeof window !== 'undefined' && Array.isArray(window.MIGRATED_BOOKS)) ? window.MIGRATED_BOOKS : []);

  var book1 = sourceBooks[0] || { id: 'FA000001', bookNo: 'FA000001', title: '고양이 목욕탕' };
  var book2 = sourceBooks[1] || { id: 'FA000002', bookNo: 'FA000002', title: '푸른 딱지' };

  var code1 = book1.bookNo || book1.id || 'FA000001';
  var title1 = book1.title || '고양이 목욕탕';
  var code2 = book2.bookNo || book2.id || 'FA000002';
  var title2 = book2.title || '푸른 딱지';

  var headers = [
    '도서코드',
    '도서명(참고)',
    '문항번호',
    '문항유형',
    '문항내용(질문)',
    '보기1',
    '보기2',
    '보기3',
    '보기4',
    '보기5',
    '정답',
    '유사인정정답'
  ];

  // 도서당 최소 3문항 규격에 맞추어 두 샘플 도서 모두 3문항씩 구성
  var sampleRows = [
    [code1, title1, 1, '객관식', '주인공이 목욕탕에 들어갈 때 가장 먼저 챙긴 애착 물건은 무엇인가요?', '노란 고무 오리 인형', '수영 모자와 물안경', '향기 나는 비누', '따뜻한 목욕 타월', '', '1', ''],
    [code1, title1, 2, '객관식', '고양이가 처음 물에 발을 담그려 했을 때 느꼈던 심정으로 알맞은 것은?', '너무 신나서 펄쩍 뛰었다', '두렵고 긴장되어 망설여졌다', '지루해서 하품을 했다', '', '', '2', ''],
    [code1, title1, 3, '객관식', '목욕을 깨끗이 마치고 난 후 고양이의 기분 변화로 가장 옳은 것은?', '개운하고 상쾌하여 뿌듯했다', '감기에 걸려 후회했다', '다시는 목욕하지 않겠다고 다짐했다', '오리가 젖어서 슬펐다', '친구들이 부러워했다', '1', ''],
    [code2, title2, 1, '객관식', "이야기 속 '푸른 딱지'가 두 주인공 사이에서 상징하는 핵심 의미는?", '새로운 우정과 화해의 시작', '패배와 좌절의 아픔', '어른들의 규칙과 명령', '', '', '1', ''],
    [code2, title2, 2, '객관식', '주인공이 친구에게 먼저 손을 내밀었을 때 친구가 보인 반응은 무엇인가요?', '환하게 웃으며 딱지를 건넸다', '뒤돌아서 집으로 달려갔다', '모른 척하며 고개를 돌렸다', '선생님께 도움을 요청했다', '', '1', ''],
    [code2, title2, 3, '주관식', '주인공이 마지막 딱지 대결에서 두려움을 이겨낼 수 있었던 핵심 마음가짐은 무엇인가요?', '', '', '', '', '', '용기', '담대함, 씩씩함, 용기있는 태도']
  ];

  if (fmt === 'xlsx' && typeof XLSX !== 'undefined') {
    var wsData = [headers].concat(sampleRows);
    var ws = XLSX.utils.aoa_to_sheet(wsData);
    ws['!cols'] = [
      { wch: 14 },
      { wch: 22 },
      { wch: 10 },
      { wch: 10 },
      { wch: 46 },
      { wch: 22 },
      { wch: 22 },
      { wch: 22 },
      { wch: 22 },
      { wch: 22 },
      { wch: 10 },
      { wch: 26 }
    ];
    var wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '북퀴즈등록양식');
    XLSX.writeFile(wb, '북퀴즈_대량등록_서식.xlsx');
    showAcademyToast('북퀴즈 대량 등록 샘플 엑셀(.xlsx)이 다운로드되었습니다.');
  } else {
    var csvContent = '\uFEFF' + [headers].concat(sampleRows).map(function(row) {
      return row.map(function(cell) {
        var str = String(cell ?? '');
        if (str.indexOf(',') !== -1 || str.indexOf('"') !== -1 || str.indexOf('\n') !== -1 || str.indexOf('\r') !== -1) {
          return '"' + str.replace(/"/g, '""') + '"';
        }
        return str;
      }).join(',');
    }).join('\r\n');

    var blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    var link = document.createElement('a');
    var url = URL.createObjectURL(blob);
    link.href = url;
    link.setAttribute('download', '북퀴즈_대량등록_서식.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showAcademyToast('북퀴즈 대량 등록 샘플 서식(.csv)이 다운로드되었습니다. 도서코드를 확인 후 문항을 작성해주세요.');
  }
}

// 학원 관리자 북퀴즈 대량 업로드 실행 핸들러
async function executeAcadBulkQuizUpload() {
  var fileInput = document.getElementById('acadQuizExcelFileInput');
  var file = selectedBulkQuizFile || (fileInput && fileInput.files && fileInput.files[0]) || null;
  if (!file) {
    alert('업로드할 엑셀/CSV 파일을 먼저 선택해주세요.');
    return;
  }

  var fileName = file.name;
  var ext = String(fileName || '').split('.').pop().toLowerCase();
  if (['csv', 'xlsx', 'xls'].indexOf(ext) === -1) {
    alert('지원하지 않는 파일 형식입니다. .xlsx, .xls, .csv 파일만 업로드할 수 있습니다.');
    return;
  }

  var btnEl = document.getElementById('btnExecuteAcadBulkQuizUpload');
  var progressEl = document.getElementById('acadQuizExcelFileName');
  if (btnEl) btnEl.disabled = true;

  try {
    var rawRows = await parseAcadSpreadsheetFileToRows(file);
    if (!rawRows || rawRows.length <= 1) {
      alert('등록할 북퀴즈 데이터 행이 존재하지 않습니다. (헤더만 있거나 빈 파일)');
      return;
    }

    var header = rawRows[0];
    var colMap = parseAcadQuizHeaderIndices(header);

    if (colMap.bookNo === -1 || colMap.question === -1 || colMap.ans === -1) {
      alert("[엑셀 서식 헤더 오류]\n필수 컬럼이 인식되지 않았습니다.\n'도서코드', '문항내용(질문)', '정답' 컬럼명이 포함되어 있는지 확인해주세요.");
      return;
    }

    var validationErrors = [];
    var parsedQuestions = [];

    // 도서 매칭 맵 구축 (학원 도서 목록 + 서버 부트스트랩 도서 목록 통합)
    var bookLookup = new Map();
    if (typeof window !== 'undefined' && Array.isArray(window.MIGRATED_BOOKS)) {
      window.MIGRATED_BOOKS.forEach(function(b) {
        if (!b) return;
        if (b.bookNo) bookLookup.set(String(b.bookNo).trim().toUpperCase(), b);
        if (b.id) bookLookup.set(String(b.id).trim().toUpperCase(), b);
      });
    }
    if (typeof academyBookList !== 'undefined' && Array.isArray(academyBookList)) {
      academyBookList.forEach(function(b) {
        if (!b) return;
        if (b.bookNo) bookLookup.set(String(b.bookNo).trim().toUpperCase(), b);
        if (b.id) bookLookup.set(String(b.id).trim().toUpperCase(), b);
      });
    }

    for (var i = 1; i < rawRows.length; i++) {
      var row = rawRows[i];
      var rowNum = i + 1;
      if (!row || !row.some(function(cell) { return String(cell ?? '').trim().length > 0; })) continue;

      var rawBookCode = String(row[colMap.bookNo] ?? '').trim();
      var rawTitle = colMap.title !== -1 ? String(row[colMap.title] ?? '').trim() : '';
      var rawQNo = colMap.questionNo !== -1 ? String(row[colMap.questionNo] ?? '').trim() : '';
      var rawType = colMap.quizType !== -1 ? String(row[colMap.quizType] ?? '').trim() : '';
      var rawQuestion = String(row[colMap.question] ?? '').trim();
      var opt1 = colMap.opt1 !== -1 ? String(row[colMap.opt1] ?? '').trim() : '';
      var opt2 = colMap.opt2 !== -1 ? String(row[colMap.opt2] ?? '').trim() : '';
      var opt3 = colMap.opt3 !== -1 ? String(row[colMap.opt3] ?? '').trim() : '';
      var opt4 = colMap.opt4 !== -1 ? String(row[colMap.opt4] ?? '').trim() : '';
      var opt5 = colMap.opt5 !== -1 ? String(row[colMap.opt5] ?? '').trim() : '';
      var rawAns = String(row[colMap.ans] ?? '').trim();
      var rawSimilarAns = colMap.similarAns !== -1 ? String(row[colMap.similarAns] ?? '').trim() : '';
      var hint = colMap.hint !== -1 ? String(row[colMap.hint] ?? '').trim() : '';
      var rawScore = colMap.score !== -1 ? String(row[colMap.score] ?? '').trim() : '';

      if (!rawBookCode) {
        validationErrors.push('[' + rowNum + '행] 도서코드가 비어있습니다.');
        continue;
      }

      var matchedBook = bookLookup.get(rawBookCode.toUpperCase());
      if (!matchedBook) {
        validationErrors.push('[' + rowNum + "행] 도서코드 '" + rawBookCode + "'에 해당하는 등록 도서가 없습니다. (입력 도서명: " + (rawTitle || '미입력') + ')');
        continue;
      }

      if (!rawQuestion) {
        validationErrors.push('[' + rowNum + '행: 도서 ' + matchedBook.title + '] 문항 질문(내용)이 비어있습니다.');
        continue;
      }

      if (rawQNo) {
        var numQNo = Number(rawQNo);
        if (isNaN(numQNo) || numQNo < 1 || numQNo > 10) {
          validationErrors.push('[' + rowNum + '행: 도서 ' + matchedBook.title + "] 문항번호는 1번부터 10번 사이여야 합니다. (입력값: '" + rawQNo + "')");
          continue;
        }
      }

      var options = [opt1, opt2, opt3, opt4, opt5].filter(function(o) { return o.length > 0; });
      var isExplicitSubjective = rawType.indexOf('주관') !== -1 || rawType.toUpperCase() === 'SUBJECTIVE' || rawType.toUpperCase() === 'SHORT_ANSWER';
      var isSubjective = isExplicitSubjective || options.length === 0;

      if (!isSubjective) {
        if (options.length < 3) {
          validationErrors.push('[' + rowNum + '행: 도서 ' + matchedBook.title + '] 객관식 문항은 선택지(보기)가 최소 3개 이상 입력되어야 합니다. (현재 입력된 보기: ' + options.length + '개)');
          continue;
        }
        if (options.length > 5) {
          validationErrors.push('[' + rowNum + '행: 도서 ' + matchedBook.title + '] 객관식 문항의 선택지는 최대 5개까지만 설정할 수 있습니다. (현재 입력된 보기: ' + options.length + '개)');
          continue;
        }
      }

      var normalizedAns = normalizeAcadQuizAnswerVal(rawAns, options, isSubjective);
      if (!normalizedAns) {
        validationErrors.push('[' + rowNum + '행: 도서 ' + matchedBook.title + "] 유효하지 않은 정답('" + rawAns + "')입니다.\n  👉 객관식은 1~" + options.length + ' 번호(또는 보기 내용), 주관식은 정답 단어를 입력해야 합니다.');
        continue;
      }

      var finalSimilarAns = '';
      if (isSubjective) {
        var similarTokens = [];
        if (rawAns && rawAns.indexOf(',') !== -1) {
          rawAns.split(/[,/|]/).map(function(s) { return s.trim(); }).forEach(function(token) {
            if (token && token !== normalizedAns && similarTokens.indexOf(token) === -1) {
              similarTokens.push(token);
            }
          });
        }
        if (rawSimilarAns) {
          rawSimilarAns.split(/[,/|]/).map(function(s) { return s.trim(); }).forEach(function(token) {
            if (token && token !== normalizedAns && similarTokens.indexOf(token) === -1) {
              similarTokens.push(token);
            }
          });
        }
        finalSimilarAns = similarTokens.join(', ');
      }

      var questionNo = Number(rawQNo) || (parsedQuestions.filter(function(q) { return q.bookCode.toUpperCase() === rawBookCode.toUpperCase(); }).length + 1);
      var score = Number(rawScore) || 20;

      parsedQuestions.push({
        rowNum: rowNum,
        bookCode: rawBookCode,
        matchedBook: matchedBook,
        questionNo: questionNo,
        type: isSubjective ? 'SUBJECTIVE' : 'CHOICE',
        quizType: isSubjective ? 'SHORT_ANSWER' : 'MULTIPLE_CHOICE',
        question: rawQuestion,
        opt1: opt1 || '',
        opt2: opt2 || '',
        opt3: opt3 || '',
        opt4: opt4 || '',
        opt5: opt5 || '',
        options: isSubjective ? [] : options,
        ans: normalizedAns,
        subjectiveAns: isSubjective ? normalizedAns : '',
        similarAns: finalSimilarAns,
        similarAnswers: finalSimilarAns ? finalSimilarAns.split(',').map(function(s) { return s.trim(); }).filter(Boolean) : [],
        correctAnswer: normalizedAns,
        hint: hint || '',
        score: score
      });
    }

    if (parsedQuestions.length === 0 && validationErrors.length === 0) {
      alert('등록 가능한 유효 북퀴즈 문항이 없습니다.');
      return;
    }

    var groupedMap = new Map();
    parsedQuestions.forEach(function(q) {
      var key = q.matchedBook.id || q.matchedBook.bookNo;
      if (!groupedMap.has(key)) {
        groupedMap.set(key, {
          book: q.matchedBook,
          bookNo: q.matchedBook.bookNo || q.matchedBook.id,
          questions: []
        });
      }
      groupedMap.get(key).questions.push(q);
    });

    groupedMap.forEach(function(group) {
      if (group.questions.length < 3) {
        validationErrors.push('[도서: ' + group.book.title + ' (' + group.bookNo + ')] 북퀴즈 문항 수가 부족합니다. 도서당 최소 3문항 이상 등록해야 합니다. (현재: ' + group.questions.length + '문항)');
      }
      if (group.questions.length > 10) {
        validationErrors.push('[도서: ' + group.book.title + ' (' + group.bookNo + ')] 북퀴즈 문항 수가 초과되었습니다. 도서당 최대 10문항까지만 등록할 수 있습니다. (현재: ' + group.questions.length + '문항)');
      }
    });

    if (validationErrors.length > 0) {
      var errorMsg = '[북퀴즈 엑셀 업로드 유효성 검사 실패]\n총 ' + validationErrors.length + '건의 규격 오류가 발견되어 등록이 중단되었습니다.\n엑셀 서식을 수정한 후 다시 업로드해주세요.\n\n' +
        validationErrors.slice(0, 6).join('\n\n') +
        (validationErrors.length > 6 ? '\n\n... 외 ' + (validationErrors.length - 6) + '건 추가 오류' : '');
      alert(errorMsg);
      return;
    }

    var groups = Array.from(groupedMap.values());

    // 1. 운영 서버 연동 시 백엔드 API(/api/manage?entity=quizzes)로 학원 전용 세트 일괄 저장
    if (window.NanoPortal && typeof NanoPortal.api === 'function' && window.NANO_SERVER_DATA) {
      if (progressEl) {
        progressEl.innerHTML = '<span class="text-warning font-weight-bold"><i class="fa-solid fa-spinner fa-spin mr-1"></i>서버에 북퀴즈 ' + parsedQuestions.length + '문항 일괄 저장 중...</span>';
      }
      try {
        var payload = {
          operation: 'bulk_import',
          items: groups.map(function(g) {
            return {
              bookNo: g.bookNo,
              questions: g.questions.map(function(q) {
                return {
                  questionNo: q.questionNo,
                  question: q.question,
                  quizType: q.quizType,
                  options: q.options,
                  opt1: q.opt1,
                  opt2: q.opt2,
                  opt3: q.opt3,
                  opt4: q.opt4,
                  opt5: q.opt5,
                  correctAnswer: q.ans,
                  similarAns: q.similarAns,
                  similarAnswers: q.similarAnswers,
                  explanation: q.hint,
                  score: q.score
                };
              })
            };
          })
        };
        await NanoPortal.api('/api/manage?entity=quizzes', payload);
      } catch (apiErr) {
        console.error('학원 북퀴즈 일괄 서버 저장 오류:', apiErr);
        alert('[서버 북퀴즈 저장 오류]\n' + (apiErr.message || '서버 통신 중 오류가 발생했습니다.'));
        return;
      }
    }

    // 2. 프론트엔드 학원 도서 목록 및 다중 출제 기관(quizSets) 실시간 동기화
    var today = new Date().toISOString().split('T')[0];
    var acadName = (typeof currentAcademyInfo !== 'undefined' && currentAcademyInfo && currentAcademyInfo.name) ? currentAcademyInfo.name : '우리 학원';
    var acadId = (typeof currentAcademyInfo !== 'undefined' && currentAcademyInfo && currentAcademyInfo.id) ? currentAcademyInfo.id : 'MY_ACAD';
    if (!window.MIGRATED_QUIZZES) window.MIGRATED_QUIZZES = {};

    groups.forEach(function(g) {
      var book = g.book;
      var formattedQuestions = g.questions.map(function(q) {
        return {
          type: q.type,
          optionCount: q.type === 'SUBJECTIVE' ? 3 : Math.max(3, q.options.length),
          question: q.question,
          mediaType: 'none',
          mediaUrl: '',
          mediaCaption: '',
          opt1: q.opt1,
          opt2: q.opt2,
          opt3: q.opt3,
          opt4: q.opt4,
          opt5: q.opt5,
          ans: q.ans,
          subjectiveAns: q.subjectiveAns,
          subjectiveAnswer: q.subjectiveAns,
          similarAns: q.similarAns,
          similarAnswers: q.similarAnswers,
          hint: q.hint,
          score: q.score
        };
      });

      var newAcadSet = {
        id: 'qs_acad_' + acadId + '_' + (book.id || book.bookNo),
        authorType: 'ACADEMY',
        authorName: acadName,
        academyName: acadName,
        academyId: acadId,
        isMine: true,
        isPublic: 'Y',
        createdAt: today,
        questions: formattedQuestions
      };

      // 기존 본사(HQ) 및 타 학원 세트는 보존하고 우리 학원 세트만 교체·추가
      var existingSets = Array.isArray(book.quizSets) ? book.quizSets.filter(function(s) {
        return !(s && (s.isMine || (s.authorType === 'ACADEMY' && (s.academyId === acadId || s.academyName === acadName))));
      }) : [];
      existingSets.push(newAcadSet);

      book.quizSets = existingSets;
      book.quizList = formattedQuestions;
      book.hasQuiz = true;
      book.quizzes = formattedQuestions.length;
      book.quizCount = formattedQuestions.length;
      book.quizSetCount = existingSets.length;
      book.quizStatus = formattedQuestions.length + '문항 완비';
      // 다음 모달 오픈 시 최신 서버 문항 세트를 다시 조회할 수 있도록 플래그 리셋
      book._quizLoadedFromServer = false;

      // academyBookList 내 동일 도서 객체에도 동기화
      if (typeof academyBookList !== 'undefined' && Array.isArray(academyBookList)) {
        var listMatch = academyBookList.find(function(ab) {
          return ab && (ab.id === book.id || ab.bookNo === book.bookNo);
        });
        if (listMatch && listMatch !== book) {
          listMatch.quizSets = existingSets;
          listMatch.quizList = formattedQuestions;
          listMatch.hasQuiz = true;
          listMatch.quizzes = formattedQuestions.length;
          listMatch.quizCount = formattedQuestions.length;
          listMatch.quizSetCount = existingSets.length;
          listMatch.quizStatus = formattedQuestions.length + '문항 완비';
          listMatch._quizLoadedFromServer = false;
        }
      }

      if (book.id) window.MIGRATED_QUIZZES[book.id] = existingSets;
      if (book.bookNo) window.MIGRATED_QUIZZES[book.bookNo] = existingSets;
      if (book.serverId) window.MIGRATED_QUIZZES[book.serverId] = existingSets;
    });

    selectedBulkQuizFile = null;
    if (fileInput) fileInput.value = '';
    if (progressEl) progressEl.innerHTML = '클릭하여 엑셀 파일 선택 또는 드래그 앤 드롭';

    if (window.jQuery && typeof $('#acadQuizExcelModal').modal === 'function') {
      $('#acadQuizExcelModal').modal('hide');
    } else {
      hideModalVanilla('acadQuizExcelModal');
    }

    filterAcademyBooks(true);
    showAcademyToast('[' + fileName + '] 북퀴즈 대량 등록 완료: 총 ' + groups.length + '권의 도서에 ' + parsedQuestions.length + '문항이 성공적으로 등록되었습니다!');
  } catch (err) {
    console.error('학원 북퀴즈 파일 처리 오류:', err);
    alert('파일을 읽고 처리하는 중 오류가 발생했습니다: ' + (err.message || err));
  } finally {
    if (btnEl) btnEl.disabled = false;
  }
}

// 퀴즈 미디어 토글
function toggleAcadQuizMediaBox() {
  var box = document.getElementById('abMediaContainerBox');
  if (box) {
    box.style.display = (box.style.display === 'none' || !box.style.display) ? 'block' : 'none';
  }
}

// ==============================================================
// [보안 PDF 뷰어 엔진] PDF.js 캔버스 렌더링 & 전면 보안 워터마크 파이프라인
// ==============================================================
var currentUploadedPdfBlob = null; // 사용자가 첨부한 실제 PDF File/Blob 객체
var activePdfDoc = null;          // PDF.js 로드된 문서 객체
var activePdfPageNum = 1;         // 현재 페이지 번호
var activePdfTotalPages = 1;      // 전체 페이지 수

// PDF.js 글로벌 워커 설정
if (typeof pdfjsLib !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
}

// 표준 샘플 PDF 바이너리 Blob 생성 (테스트 및 즉시 시연용 유효한 A4 PDF 데이터)
function createMinimalSamplePdfBlob(title) {
  var content = "BT /F1 18 Tf 50 720 Td (" + (title || "Nano Sheet Material") + ") Tj ET\nBT /F1 12 Tf 50 680 Td (Nano Reading Academy Standard Worksheet) Tj ET\nBT /F1 10 Tf 50 640 Td ([STEP 1] Vocabulary and Background Reading) Tj ET\nBT /F1 10 Tf 50 600 Td ([STEP 2] Critical Thinking and Book Quiz Verification) Tj ET\nBT /F1 10 Tf 50 560 Td ([STEP 3] Essay and Perspective Sharing) Tj ET";
  var streamLen = content.length;
  var pdfSource = "%PDF-1.4\n" +
    "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n" +
    "2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n" +
    "3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>\nendobj\n" +
    "4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n" +
    "5 0 obj\n<< /Length " + streamLen + " >>\nstream\n" + content + "\nendstream\nendobj\n" +
    "xref\n0 6\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \n0000000244 00000 n \n0000000318 00000 n \n" +
    "trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n" + (370 + streamLen) + "\n%%EOF";
  return new Blob([pdfSource], { type: 'application/pdf' });
}

// 전면 보안 워터마크 동적 주입 (학원명, 출력일시, IP 대각선 중앙 단일 워터마크)
function updateRealPdfWatermarkOverlay() {
  var overlay = document.getElementById('realPdfWatermarkOverlay');
  if (!overlay) return;
  overlay.style.justifyContent = 'center'; // 중앙 단일 배치

  var acadElem = document.getElementById('wmAcademyName');
  var timeElem = document.getElementById('wmPrintTime');
  var ipElem = document.getElementById('wmIpAddress');

  var acad = (acadElem && acadElem.innerText) ? acadElem.innerText : '나노 독서아카데미 목동본원';
  var time = (timeElem && timeElem.innerText) ? timeElem.innerText : new Date().toISOString().slice(0, 16).replace('T', ' ');
  var ip = (ipElem && ipElem.innerText) ? ipElem.innerText : '118.235.12.89';

  var tileHtml = 
    '<div style="transform: rotate(-28deg); opacity: 0.16; font-weight: 900; text-align: center; color: #000; line-height: 1.4; user-select: none; margin: 0;">' +
      '<div style="font-size: 21px; letter-spacing: -0.5px; color: #1e293b;">' + acad + '</div>' +
      '<div style="font-size: 14.5px; font-family: monospace; color: #334155;">' + time + ' &middot; IP: ' + ip + '</div>' +
      '<div style="font-size: 11px; color: #dc2626; font-weight: 800; margin-top: 2px;">[보안 인가 문서] 무단 복제 및 캡처 배포 금지</div>' +
    '</div>';

  // 위아래 워터마크를 제거하고 가운데 1개만 단독 노출
  overlay.innerHTML = tileHtml;
}

// 현재 열람 중인 도서 객체 보관용 전역 변수
var activeViewingBook = null;

// 도서별 실제 PDF 후보 경로 추출 헬퍼 (ISBN, 표지 파일명, ID 기반)
function extractBookPdfCandidates(book) {
  if (!book) return [];
  var list = [];
  var rawBase = (typeof window !== 'undefined' && window.NANO_MEDIA_BASE_URL) ? String(window.NANO_MEDIA_BASE_URL).replace(/\/+$/, '') : 'https://media.nanosbook.co.kr';
  var mediaBase = rawBase.replace(/^https?:\/\/pub-[a-z0-9]+\.r2\.dev/i, 'https://media.nanosbook.co.kr');
  var pushRelAndCloud = function(stem) {
    if (!stem) return;
    if (mediaBase) list.push(mediaBase + '/upload/book/' + stem + '.pdf');
    list.push('upload/book/' + stem + '.pdf');
    list.push('/upload/book/' + stem + '.pdf');
  };

  if (book.pdfUrl) list.push(book.pdfUrl);
  if (book.worksheetUrl) list.push(book.worksheetUrl);

  // 1. 도서 표지 경로에서 ISBN 또는 고유 파일명 추출 (예: /upload/book/9791187079521.jpg -> 9791187079521)
  if (book.cover && typeof book.cover === 'string') {
    var coverClean = String(book.cover).split('?')[0];
    var match = coverClean.match(/([0-9]{10,13}|book_[0-9]+)/);
    if (match && match[1]) pushRelAndCloud(match[1]);
  }

  // 2. ISBN 필드가 직접 명시된 경우
  if (book.isbn) {
    var cleanIsbn = String(book.isbn).replace(/[^0-9]/g, '');
    if (cleanIsbn) pushRelAndCloud(cleanIsbn);
  }

  // 3. 도서 번호 / serverId 기반
  if (book.id) {
    var cleanId = String(book.id).trim();
    if (cleanId) pushRelAndCloud(cleanId);
  }
  if (book.serverId) {
    var cleanSId = String(book.serverId).trim();
    if (cleanSId) {
      list.push('upload/book/' + cleanSId + '.pdf');
      list.push('/upload/book/' + cleanSId + '.pdf');
    }
  }

  // 타 도서 대표 PDF(거상 김만덕 등)를 엉뚱하게 fallback으로 주입하지 않고 도서 고유 경로만 유지
  return list.filter(function(item, idx) { return list.indexOf(item) === idx; });
}

// 후보 PDF 목록을 순차적으로 시도하여 첫 번째로 로드 가능한 실제 PDF를 렌더링하고, 실패 시 타 도서 PDF로 오염시키지 않음
function tryLoadCandidatePdfs(candidates, index, book) {
  if (!candidates || index >= candidates.length) {
    var loadingInd = document.getElementById('pdfLoadingIndicator');
    if (loadingInd) loadingInd.style.display = 'none';
    if (window.jQuery && typeof $('#contentPdfPreviewModal').modal === 'function') {
      $('#contentPdfPreviewModal').modal('hide');
    } else {
      hideModalVanilla('contentPdfPreviewModal');
    }
    showAcademyToast(`[${(book && book.title) || '해당 도서'}] 등록된 나노시트(PDF) 파일이 준비되지 않았습니다.`);
    return;
  }

  var currentCandidate = candidates[index];
  if (typeof currentCandidate === 'string' && currentCandidate.includes('r2.dev')) {
    currentCandidate = currentCandidate.replace(/https?:\/\/pub-[a-z0-9]+\.r2\.dev/i, 'https://media.nanosbook.co.kr');
  }

  var loadingInd = document.getElementById('pdfLoadingIndicator');
  var realWrapper = document.getElementById('realPdfViewerWrapper');
  var htmlContainer = document.getElementById('nanoSheetViewerContainer');
  if (loadingInd) loadingInd.style.display = 'block';
  if (realWrapper) realWrapper.style.display = 'none';
  if (htmlContainer) htmlContainer.style.display = 'none';

  var pdfDataCache = window._nanoPdfBufferCache || (window._nanoPdfBufferCache = new Map());
  var fetchPromise;
  if (pdfDataCache.has(currentCandidate)) {
    fetchPromise = Promise.resolve(pdfDataCache.get(currentCandidate));
  } else if (typeof currentCandidate === 'string' && (/^https?:\/\//i.test(currentCandidate) || currentCandidate.startsWith('/upload/'))) {
    fetchPromise = fetch(currentCandidate)
      .then(function(res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.arrayBuffer();
      })
      .then(function(buf) {
        var bytes = new Uint8Array(buf);
        pdfDataCache.set(currentCandidate, bytes);
        return bytes;
      });
  } else {
    fetchPromise = Promise.resolve(currentCandidate);
  }

  fetchPromise.then(function(data) {
    var engine = (typeof pdfjsLib !== 'undefined') ? pdfjsLib : ((typeof PDFJS !== 'undefined') ? PDFJS : (window.pdfjsLib || null));
    if (!engine) {
      console.warn('PDF.js 엔진 미탑재, 커스텀 HTML 시트로 전환');
      renderCustomNanoSheetHtml(book);
      return;
    }
    if (!engine.GlobalWorkerOptions) engine.GlobalWorkerOptions = {};
    engine.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

    var loadingTask = (data instanceof Uint8Array) ? engine.getDocument({ data: data }) : engine.getDocument(data);
    return loadingTask.promise;
  }).then(function(pdf) {
    activePdfDoc = pdf;
    activePdfTotalPages = pdf.numPages;
    activePdfPageNum = 1;

    if (loadingInd) loadingInd.style.display = 'none';
    if (realWrapper) realWrapper.style.display = 'block';
    if (htmlContainer) htmlContainer.style.display = 'none';

    var pageControls = document.getElementById('pdfPageControls');
    if (pageControls) {
      pageControls.style.display = (pdf.numPages > 1) ? 'flex' : 'none';
    }
    updateRealPdfWatermarkOverlay();
    renderCurrentPdfPage();
  }).catch(function(err) {
    console.warn('PDF 후보 파일 로드 실패 (' + currentCandidate + '), 다음 후보 시도:', err);
    tryLoadCandidatePdfs(candidates, index + 1, book);
  });
}

// 실제 PDF 파일 읽어와서 캔버스 렌더링 + 워터마크 합성
function renderPdfFileWithWatermark(pdfSource, fallbackBook) {
  if (typeof pdfSource === 'string' && pdfSource.includes('r2.dev')) {
    pdfSource = pdfSource.replace(/https?:\/\/pub-[a-z0-9]+\.r2\.dev/i, 'https://media.nanosbook.co.kr');
  }
  var realWrapper = document.getElementById('realPdfViewerWrapper');
  var htmlContainer = document.getElementById('nanoSheetViewerContainer');
  var pageControls = document.getElementById('pdfPageControls');
  var loadingInd = document.getElementById('pdfLoadingIndicator');

  if (loadingInd) loadingInd.style.display = 'block';
  if (realWrapper) realWrapper.style.display = 'none';
  if (htmlContainer) htmlContainer.style.display = 'none';

  updateRealPdfWatermarkOverlay();

  // PDF.js workerSrc 설정
  var engine = (typeof pdfjsLib !== 'undefined') ? pdfjsLib : ((typeof PDFJS !== 'undefined') ? PDFJS : (window.pdfjsLib || null));
  if (engine) {
    if (!engine.GlobalWorkerOptions) engine.GlobalWorkerOptions = {};
    engine.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
  }

  var loadPromise = null;
  // 나노시트 PDF 로딩 초고속화: 단일 스트림 버퍼링 및 브라우저 메모리 캐시 (Range 요청 지연 원천 차단)
  var pdfDataCache = window._nanoPdfBufferCache || (window._nanoPdfBufferCache = new Map());
  if (pdfSource instanceof Blob || pdfSource instanceof File) {
    loadPromise = new Promise(function(resolve, reject) {
      var reader = new FileReader();
      reader.onload = function(e) { resolve(new Uint8Array(e.target.result)); };
      reader.onerror = reject;
      reader.readAsArrayBuffer(pdfSource);
    });
  } else if (typeof pdfSource === 'string' && pdfSource.startsWith('data:')) {
    try {
      var base64 = pdfSource.split(',')[1];
      var binaryStr = atob(base64);
      var len = binaryStr.length;
      var bytes = new Uint8Array(len);
      for (var i = 0; i < len; i++) {
        bytes[i] = binaryStr.charCodeAt(i);
      }
      loadPromise = Promise.resolve(bytes);
    } catch(e) {
      loadPromise = Promise.resolve(pdfSource);
    }
  } else if (typeof pdfSource === 'string' && (/^https?:\/\//i.test(pdfSource) || pdfSource.startsWith('/upload/'))) {
    if (pdfDataCache.has(pdfSource)) {
      loadPromise = Promise.resolve(pdfDataCache.get(pdfSource));
    } else {
      loadPromise = fetch(pdfSource)
        .then(function(res) {
          if (!res.ok) throw new Error('PDF 다운로드 실패 HTTP ' + res.status);
          return res.arrayBuffer();
        })
        .then(function(buf) {
          var bytes = new Uint8Array(buf);
          if (pdfDataCache.size > 20) {
            var firstKey = pdfDataCache.keys().next().value;
            pdfDataCache.delete(firstKey);
          }
          pdfDataCache.set(pdfSource, bytes);
          return bytes;
        })
        .catch(function(err) {
          console.warn('[PDF] 단일 스트림 다운로드 실패, PDF.js 직접 로드로 폴백:', err);
          return pdfSource;
        });
    }
  } else {
    loadPromise = Promise.resolve(pdfSource);
  }

  loadPromise.then(function(data) {
    var engine = (typeof pdfjsLib !== 'undefined') ? pdfjsLib : ((typeof PDFJS !== 'undefined') ? PDFJS : (window.pdfjsLib || null));
    if (!engine) {
      throw new Error('PDF.js 엔진을 찾을 수 없습니다.');
    }
    var loadingTask = (data instanceof Uint8Array) 
      ? engine.getDocument({ data: data }) 
      : engine.getDocument(data);
    return loadingTask.promise;
  }).then(function(pdf) {
    activePdfDoc = pdf;
    activePdfTotalPages = pdf.numPages;
    activePdfPageNum = 1;

    if (loadingInd) loadingInd.style.display = 'none';
    if (realWrapper) realWrapper.style.display = 'block';
    if (htmlContainer) htmlContainer.style.display = 'none';

    if (pageControls) {
      pageControls.style.display = (pdf.numPages > 1) ? 'flex' : 'none';
    }
    renderCurrentPdfPage();
  }).catch(function(err) {
    console.warn('PDF 캔버스 렌더링 실패, 도서 맞춤형 동적 나노시트로 안전 전환:', err);
    if (fallbackBook || activeViewingBook) {
      renderCustomNanoSheetHtml(fallbackBook || activeViewingBook);
    } else {
      showDefaultHtmlSheetView();
    }
  });
}

var activePdfRenderTask = null;

// 현재 PDF 페이지 캔버스 렌더링 (PDF.js)
function renderCurrentPdfPage() {
  if (!activePdfDoc) return;
  if (activePdfRenderTask) {
    try { activePdfRenderTask.cancel(); } catch(e) {}
    activePdfRenderTask = null;
  }

  activePdfDoc.getPage(activePdfPageNum).then(function(page) {
    var canvas = document.getElementById('pdfViewerCanvas');
    if (!canvas) return;
    var ctx = canvas.getContext('2d');

    // 뷰어 컨테이너 너비에 맞추어 고해상도 스케일 계산
    var wrapper = document.getElementById('realPdfViewerWrapper');
    var targetWidth = wrapper ? (wrapper.clientWidth || 740) : 740;
    if (targetWidth < 300) targetWidth = 740;

    var unscaledViewport = page.getViewport({ scale: 1.0 });
    var scale = targetWidth / unscaledViewport.width;
    if (scale < 1.2) scale = 1.2;

    var outputScale = window.devicePixelRatio || 1;
    var viewport = page.getViewport({ scale: scale });

    canvas.width = Math.floor(viewport.width * outputScale);
    canvas.height = Math.floor(viewport.height * outputScale);
    canvas.style.width = Math.floor(viewport.width) + "px";
    canvas.style.height = Math.floor(viewport.height) + "px";

    var transform = outputScale !== 1 ? [outputScale, 0, 0, outputScale, 0, 0] : null;

    var renderContext = {
      canvasContext: ctx,
      transform: transform,
      viewport: viewport
    };

    activePdfRenderTask = page.render(renderContext);
    activePdfRenderTask.promise.then(function() {
      activePdfRenderTask = null;
      var pageNumDisplay = document.getElementById('pdfPageNumDisplay');
      if (pageNumDisplay) {
        pageNumDisplay.innerText = activePdfPageNum + ' / ' + activePdfTotalPages;
      }
      var btnPrev = document.getElementById('btnPdfPrev');
      var btnNext = document.getElementById('btnPdfNext');
      if (btnPrev) btnPrev.disabled = (activePdfPageNum <= 1);
      if (btnNext) btnNext.disabled = (activePdfPageNum >= activePdfTotalPages);
    }).catch(function(err) {
      if (err && err.name === 'RenderingCancelledException') return;
      console.error('PDF.js 렌더링 에러:', err);
    });
  }).catch(function(err) {
    console.error('PDF.js getPage 에러:', err);
  });
}

function prevPdfPage() {
  if (activePdfDoc && activePdfPageNum > 1) {
    activePdfPageNum--;
    renderCurrentPdfPage();
  }
}

function nextPdfPage() {
  if (activePdfDoc && activePdfPageNum < activePdfTotalPages) {
    activePdfPageNum++;
    renderCurrentPdfPage();
  }
}

function showDefaultHtmlSheetView() {
  var realWrapper = document.getElementById('realPdfViewerWrapper');
  var htmlContainer = document.getElementById('nanoSheetViewerContainer');
  var loadingInd = document.getElementById('pdfLoadingIndicator');
  var pageControls = document.getElementById('pdfPageControls');
  if (loadingInd) loadingInd.style.display = 'none';
  if (realWrapper) realWrapper.style.display = 'none';
  if (pageControls) pageControls.style.display = 'none';
  if (htmlContainer) htmlContainer.style.display = 'block';
}

// 도서별 맞춤형 표준 동적 나노 시트 렌더러 (실제 메타데이터, 퀴즈, 서술형 발문 100% 반영)
function renderCustomNanoSheetHtml(b) {
  var realWrapper = document.getElementById('realPdfViewerWrapper');
  var htmlContainer = document.getElementById('nanoSheetViewerContainer');
  var pageControls = document.getElementById('pdfPageControls');
  var loadingInd = document.getElementById('pdfLoadingIndicator');

  if (loadingInd) loadingInd.style.display = 'none';
  if (realWrapper) realWrapper.style.display = 'none';
  if (pageControls) pageControls.style.display = 'none';
  if (!htmlContainer) return;

  htmlContainer.style.display = 'block';

  var title = (b && b.title) ? b.title : '나노 도서';
  var author = (b && b.author) ? b.author : '저자 미상';
  var publisher = (b && b.publisher) ? b.publisher : '출판사';
  var grade = (b && b.grade) ? b.grade : '초등 전학년';
  var category = (b && (b.category || b.cat1)) ? (b.category || b.cat1) : '문학';
  var tags = (b && (b.rawTags || (b.tags && b.tags.join(' ')))) ? String(b.rawTags || b.tags.join(' ')).replace(/#/g, '').split(/[,\s]+/).filter(Boolean) : ['독서 성찰', '문해력'];
  var thinkExtract = (b && b.thinkExtract) ? b.thinkExtract : '이 책에서 가장 흥미로웠거나 기억에 남는 장면은 무엇이었나요? 그 이유는 무엇인가요?';
  var thinkInsert = (b && b.thinkInsert) ? b.thinkInsert : '책 속 주인공의 선택이나 교훈을 바탕으로, 나의 생각이나 경험을 자유롭게 서술해 보세요.';
  var coverUrl = (b && b.cover) ? normalizeBookCoverUrl(b.cover) : DEFAULT_BOOK_COVER;

  // 관련 퀴즈 검색 (실제 등록된 북퀴즈 문항이 있으면 추출)
  var quizQuestions = [];
  try {
    var qData = (window.MIGRATED_QUIZZES && (MIGRATED_QUIZZES[title] || (b && MIGRATED_QUIZZES[b.id]))) || null;
    if (qData && qData.length > 0 && qData[0].questions) {
      quizQuestions = qData[0].questions;
    }
  } catch(e) {}

  var q1Text = quizQuestions.length > 0 ? ('<strong>Q1. </strong>' + escapeHtml(quizQuestions[0].question)) : '<strong>Q1. </strong>본문의 핵심 사건과 등장인물의 선택을 되짚어보며 내용을 간략히 정리해 보세요.';
  var q2Text = quizQuestions.length > 1 ? ('<strong>Q2. </strong>' + escapeHtml(quizQuestions[1].question)) : '<strong>Q2. </strong>주인공의 가치관이나 행동에 대해 나의 일상생활에 빗대어 느낀 점을 설명해 보세요.';

  var tagBadges = tags.slice(0, 5).map(function(t) {
    return '<span style="display: inline-block; background: #f1f5f9; color: #475569; padding: 2px 8px; border-radius: 4px; font-size: 11px; margin-right: 5px; border: 1px solid #e2e8f0; font-weight: 600;">#' + escapeHtml(t) + '</span>';
  }).join('');

  var acadName = (document.getElementById('wmAcademyName') ? document.getElementById('wmAcademyName').innerText : '나노 독서아카데미 목동본원');
  var printTime = (document.getElementById('wmPrintTime') ? document.getElementById('wmPrintTime').innerText : '');
  var ipAddr = (document.getElementById('wmIpAddress') ? document.getElementById('wmIpAddress').innerText : '118.235.12.89');

  var html = 
    '<!-- 워터마크 오버레이 -->' +
    '<div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-30deg); pointer-events: none; opacity: 0.12; font-weight: 900; font-size: 24px; line-height: 1.6; text-align: center; color: #111; z-index: 10; user-select: none; width: 100%; letter-spacing: -0.5px;">' +
      '<div>' + acadName + '</div>' +
      '<div style="font-size: 20px;">' + printTime + '</div>' +
      '<div style="font-size: 18px; font-family: monospace;">' + ipAddr + '</div>' +
    '</div>' +

    '<!-- 시트지 헤더 -->' +
    '<div class="d-flex justify-content-between align-items-center pb-3 mb-3" style="border-bottom: 2px solid #2563eb;">' +
      '<div style="flex: 1; padding-right: 15px;">' +
        '<div class="d-flex align-items-center gap-2 mb-1">' +
          '<span class="badge badge-warning text-dark font-weight-bold px-2 py-1" style="font-size: 11px;">나노 독서논술 정규 워크시트</span>' +
          '<span class="badge badge-secondary px-2 py-1" style="font-size: 11px;">' + escapeHtml(grade) + '</span>' +
          '<span class="badge badge-light border px-2 py-1" style="font-size: 11px;">' + escapeHtml(category) + '</span>' +
        '</div>' +
        '<h4 class="font-weight-bold mb-1 mt-1" style="color: #1e293b; font-size: 20px; letter-spacing: -0.5px;">' + escapeHtml(title) + '</h4>' +
        '<div style="font-size: 12px; color: #64748b;">' +
          '<span>지은이: <strong>' + escapeHtml(author) + '</strong></span> &middot; ' +
          '<span>출판사: <strong>' + escapeHtml(publisher) + '</strong></span>' +
        '</div>' +
      '</div>' +
      '<div class="d-flex align-items-center gap-3">' +
        (coverUrl ? '<img src="' + coverUrl + '" style="width: 52px; height: 72px; object-fit: cover; border-radius: 4px; border: 1px solid #cbd5e1; box-shadow: 0 2px 6px rgba(0,0,0,0.1);">' : '') +
        '<div class="text-right" style="font-size: 11.5px; color: #64748b; line-height: 1.5; min-width: 120px;">' +
          '<div>소속: <span class="border-bottom pb-0 px-2 font-weight-bold text-dark">목동본원</span></div>' +
          '<div class="mt-1">원생: <span class="border-bottom pb-0 px-2 font-weight-bold text-dark">____________</span></div>' +
          '<div class="mt-1">지도: <span class="border-bottom pb-0 px-2 font-weight-bold text-dark">담당교사</span></div>' +
        '</div>' +
      '</div>' +
    '</div>' +

    '<!-- 1단계: 독서 전/중 핵심 어휘 및 배경 -->' +
    '<div class="mb-3">' +
      '<h6 class="font-weight-bold text-primary mb-2" style="font-size: 13.5px;">' +
        '<i class="fa-solid fa-feather mr-1"></i>[STEP 1] 어휘 및 배경 이해하기' +
      '</h6>' +
      '<div class="p-3 rounded" style="background: #faf8f4; border: 1px dashed #dcd5c7; font-size: 12.5px; line-height: 1.7;">' +
        '<div class="mb-2"><strong>도서 속 주요 키워드:</strong> ' + (tagBadges || '<span class="text-muted">독서 활동, 어휘 탐색</span>') + '</div>' +
        '<div style="color: #475569;">책을 읽기 전 이 책의 표지와 제목, 위 키워드를 살펴보며 어떤 이야기가 펼쳐질지 자유롭게 상상해 적어보세요.</div>' +
        '<div class="p-2 mt-2 bg-white rounded" style="min-height: 38px; border: 1px dotted #cbd5e1; color: #94a3b8;">(어휘 정리 및 독서 전 생각 작성란)</div>' +
      '</div>' +
    '</div>' +

    '<!-- 2단계: 핵심 내용 이해 및 문해력 독해 퀴즈 -->' +
    '<div class="mb-3">' +
      '<h6 class="font-weight-bold text-primary mb-2" style="font-size: 13.5px;">' +
        '<i class="fa-solid fa-compass mr-1"></i>[STEP 2] 본문 속 문해력 성찰' +
      '</h6>' +
      '<div class="p-3 rounded" style="background: #ffffff; border: 1px solid #e2e8f0; font-size: 12.5px; line-height: 1.8;">' +
        '<p class="mb-1" style="color: #1e293b;">' + q1Text + '</p>' +
        '<div class="p-2 mb-2 bg-light rounded text-muted" style="min-height: 42px; border: 1px dotted #ccc;">(학생 작성란)</div>' +
        '<p class="mb-1" style="color: #1e293b;">' + q2Text + '</p>' +
        '<div class="p-2 bg-light rounded text-muted" style="min-height: 42px; border: 1px dotted #ccc;">(학생 작성란)</div>' +
      '</div>' +
    '</div>' +

    '<!-- 3단계: 나노 시트 생각담기 논술 -->' +
    '<div class="mb-3">' +
      '<h6 class="font-weight-bold text-primary mb-2" style="font-size: 13.5px;">' +
        '<i class="fa-solid fa-lightbulb mr-1"></i>[STEP 3] 나노 시트 생각담기 서술형 논술' +
      '</h6>' +
      '<div class="p-3 rounded" style="background: #ffffff; border: 1px solid #e2e8f0; font-size: 12.5px;">' +
        '<p class="font-weight-bold mb-1" style="color: #0f172a;"><i class="fa-solid fa-circle-question text-warning mr-1"></i>생각 끄집어내기 (발문 1): ' + escapeHtml(thinkExtract) + '</p>' +
        '<p class="font-weight-bold mb-2" style="color: #0f172a;"><i class="fa-solid fa-circle-question text-info mr-1"></i>생각 집어넣기 (발문 2): ' + escapeHtml(thinkInsert) + '</p>' +
        '<div style="border: 1px dashed #cbd5e1; height: 130px; border-radius: 6px; background: #fffdfa; padding: 10px; color: #94a3b8; font-size: 11.5px; line-height: 1.6;">' +
          '(200~400자 내외 서술형 논술 작성 영역 &middot; 교사의 첨삭 지도가 이루어집니다)' +
        '</div>' +
      '</div>' +
    '</div>' +

    '<!-- 교사용 가이드 -->' +
    '<div class="p-2 text-right text-muted" style="font-size: 11px; border-top: 1px solid #e2e8f0;">' +
      '* 나노의 책장 B2B 공식 인증 활동지 &middot; 교사용 평가 가이드라인 준수 &middot; ' + escapeHtml(title) + ' 전용 시트' +
    '</div>';

  htmlContainer.innerHTML = html;
}

// 학습자료 파일 선택 시 처리 (PDF 파일 검증 및 실제 Blob 보관)
function handleAcademySheetFileUpload(input) {
  if (!input.files || !input.files[0]) return;
  var file = input.files[0];

  if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
    alert('나노 시트 학습자료는 PDF 파일(*.pdf)만 업로드할 수 있습니다.');
    input.value = '';
    return;
  }

  currentUploadedPdfBlob = file; // 실제 PDF File 객체 저장!
  var sizeStr = (file.size / (1024 * 1024)).toFixed(2) + ' MB';
  if (file.size < 1024 * 1024) {
    sizeStr = Math.round(file.size / 1024) + ' KB';
  }

  currentUploadedMaterial = {
    name: file.name,
    size: sizeStr,
    type: document.getElementById('reg_material_type') ? document.getElementById('reg_material_type').value : '나노 시트 (PDF)',
    pdfBlob: file
  };

  document.getElementById('material_upload_empty').style.display = 'none';
  document.getElementById('material_upload_filled').style.display = 'block';
  document.getElementById('uploaded_pdf_name').innerText = currentUploadedMaterial.name;
  document.getElementById('uploaded_pdf_meta').innerText = `${currentUploadedMaterial.size} · ${currentUploadedMaterial.type} · 정상 첨부됨`;

  showAcademyToast(`[${file.name}] PDF가 성공적으로 첨부되었습니다. '미리보기'를 누르면 보안 워터마크가 박힌 뷰어로 즉시 열람됩니다.`);
}

// 표준 샘플 PDF 첨부 버튼 (시연용 실제 PDF 생성)
function attachSampleContentPdf() {
  var bookName = (document.getElementById('reg_book_name') ? document.getElementById('reg_book_name').value : '').trim() || '신규도서';
  var cleanName = bookName.split('(')[0].trim().replace(/\s+/g, '');
  var sampleFileName = `${cleanName}_나노시트_학습용.pdf`;

  currentUploadedPdfBlob = createMinimalSamplePdfBlob(cleanName + ' - Nano Sheet');
  currentUploadedMaterial = {
    name: sampleFileName,
    size: '1.45 MB',
    type: document.getElementById('reg_material_type') ? document.getElementById('reg_material_type').value : '나노 시트 (PDF)',
    pdfBlob: currentUploadedPdfBlob
  };

  document.getElementById('material_upload_empty').style.display = 'none';
  document.getElementById('material_upload_filled').style.display = 'block';
  document.getElementById('uploaded_pdf_name').innerText = currentUploadedMaterial.name;
  document.getElementById('uploaded_pdf_meta').innerText = `${currentUploadedMaterial.size} · ${currentUploadedMaterial.type} · 정상 첨부됨`;

  showAcademyToast('표준 나노 시트 (PDF)가 첨부되었습니다. 미리보기를 누르면 보안 뷰어에 워터마크가 그려집니다.');
}

// 첨부된 자료 삭제
function removeUploadedMaterial() {
  currentUploadedMaterial = null;
  currentUploadedPdfBlob = null;
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

// 워터마크 정보 갱신 (1행: 학원명, 2행: 출력일시, 3행: IP주소)
function updateWatermarkInfo() {
  var acadElem = document.getElementById('wmAcademyName');
  var timeElem = document.getElementById('wmPrintTime');
  var ipElem = document.getElementById('wmIpAddress');
  if (acadElem) acadElem.innerText = '나노 독서아카데미 목동본원';
  if (timeElem) {
    var now = new Date();
    var pad = function(n) { return String(n).padStart(2, '0'); };
    timeElem.innerText = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
  }
  if (ipElem) {
    ipElem.innerText = '118.235.12.89';
  }
}

// PDF 학습자료 미리보기 모달 열기 (도서별 실제 전용 PDF 캔버스 렌더링 + 도서 맞춤형 동적 나노시트 완벽 지원)
function openContentPdfModal(bookId) {
  var b = academyBookList.find(function(item) { return item.id === bookId; });
  activeViewingBook = b || null;

  // 서버에 나노시트 파일이 없는 도서는 팝업 모달을 전혀 띄우지 않고 즉시 차단
  if (!b || !checkBookHasAvailableSheet(b)) {
    showAcademyToast(`[${(b && b.title) || '해당 도서'}] 등록된 나노시트(PDF) 파일이 준비되지 않았습니다.`);
    return;
  }

  var title = b ? b.title : '나노 도서';
  var fileName = b && b.materialName ? b.materialName : `${title}_나노시트.pdf`;

  var titleEl = document.getElementById('pdfModalTitle');
  if (titleEl) titleEl.innerText = `[${title}] 나노 시트 (보안 PDF 웹뷰어)`;

  var nameDisp = document.getElementById('pdfFileNameDisplay');
  if (nameDisp) nameDisp.innerText = fileName;

  var sheetBookTitle = document.getElementById('pdfSheetBookTitle');
  if (sheetBookTitle) sheetBookTitle.innerText = title;

  updateWatermarkInfo();

  // 모달 먼저 열기
  if (window.jQuery && typeof $('#contentPdfPreviewModal').modal === 'function') {
    $('#contentPdfPreviewModal').modal('show');
  } else {
    showModalVanilla('contentPdfPreviewModal');
  }

  // 1. 도서 객체에 직접 첨부된 실제 PDF Blob/File/DataURL이 있는 경우 (방금 업로드한 경우 등)
  var directPdf = (b && (b.pdfBlob || b.pdfDataUrl)) || null;
  if (!directPdf && b && b.isMyCreation) {
    var cachedData = sessionStorage.getItem('nano_last_uploaded_pdf');
    if (cachedData) {
      directPdf = cachedData;
      b.pdfDataUrl = cachedData;
    }
  }

  if (directPdf) {
    renderPdfFileWithWatermark(directPdf, b);
    return;
  }

  // 2. 이미 명시된 실제 PDF 경로가 있는 경우 바로 렌더링
  if (b && (b.pdfUrl || b.worksheetUrl)) {
    renderPdfFileWithWatermark(b.pdfUrl || b.worksheetUrl, b);
    return;
  }

  // 3. 실제 서버 DB 및 파일시스템 조회 API 호출 (api/get_worksheet.php)
  var loadingInd = document.getElementById('pdfLoadingIndicator');
  var realWrapper = document.getElementById('realPdfViewerWrapper');
  var htmlContainer = document.getElementById('nanoSheetViewerContainer');
  if (loadingInd) loadingInd.style.display = 'block';
  if (realWrapper) realWrapper.style.display = 'none';
  if (htmlContainer) htmlContainer.style.display = 'none';

  // Vercel/Node 운영 환경에서는 레거시 PHP API(get_worksheet.php) 404 대기 없이 즉시 R2 CDN 후보 로드
  if (typeof window !== 'undefined' && window.NANO_SERVER_DATA) {
    var directCandidates = extractBookPdfCandidates(b);
    if (directCandidates.length > 0) {
      tryLoadCandidatePdfs(directCandidates, 0, b);
    } else {
      if (loadingInd) loadingInd.style.display = 'none';
      if (window.jQuery && typeof $('#contentPdfPreviewModal').modal === 'function') {
        $('#contentPdfPreviewModal').modal('hide');
      } else {
        hideModalVanilla('contentPdfPreviewModal');
      }
      showAcademyToast(`[${(b && b.title) || '해당 도서'}] 등록된 나노시트(PDF) 파일이 준비되지 않았습니다.`);
    }
    return;
  }

  var queryParams = new URLSearchParams({
    book_id: b ? (b.serverId || b.id || '') : (bookId || ''),
    isbn: b && b.isbn ? String(b.isbn).replace(/[^0-9]/g, '') : '',
    title: b ? (b.title || '') : '',
    cover: b ? (b.cover || '') : ''
  });

  fetch('api/get_worksheet.php?' + queryParams.toString())
    .then(function(res) {
      if (!res.ok) throw new Error('API 응답 HTTP ' + res.status);
      return res.json();
    })
    .then(function(data) {
      if (data && data.ok && data.pdfUrl) {
        if (b) {
          b.pdfUrl = data.pdfUrl;
          if (data.fileName) b.materialName = data.fileName;
        }
        if (nameDisp && data.fileName) nameDisp.innerText = data.fileName;
        renderPdfFileWithWatermark(data.pdfUrl, b);
      } else {
        // API 매칭 안 된 경우 파일시스템 후보 경로 시도
        var candidates = extractBookPdfCandidates(b);
        if (candidates.length > 0) {
          tryLoadCandidatePdfs(candidates, 0, b);
        } else {
          if (loadingInd) loadingInd.style.display = 'none';
          if (window.jQuery && typeof $('#contentPdfPreviewModal').modal === 'function') {
            $('#contentPdfPreviewModal').modal('hide');
          }
          showAcademyToast(`[${(b && b.title) || '해당 도서'}] 등록된 나노시트(PDF) 파일이 준비되지 않았습니다.`);
        }
      }
    })
    .catch(function(err) {
      console.warn('get_worksheet.php API 조회 실패 또는 정적 프리뷰 환경, 로컬 후보 파일 순차 로드:', err);
      var candidates = extractBookPdfCandidates(b);
      if (candidates.length > 0) {
        tryLoadCandidatePdfs(candidates, 0, b);
      } else {
        if (loadingInd) loadingInd.style.display = 'none';
        if (window.jQuery && typeof $('#contentPdfPreviewModal').modal === 'function') {
          $('#contentPdfPreviewModal').modal('hide');
        }
        showAcademyToast(`[${(b && b.title) || '해당 도서'}] 등록된 나노시트(PDF) 파일이 준비되지 않았습니다.`);
      }
    });
}

// 등록 폼 작성 중 현재 첨부된 PDF 바로 확인 (보안 뷰어 + 워터마크 합성)
function previewCurrentUploadedPdf() {
  var bookName = (document.getElementById('reg_book_name') ? document.getElementById('reg_book_name').value : '').trim() || '도서 미리보기';
  var fileName = currentUploadedMaterial ? currentUploadedMaterial.name : `${bookName}_학습시트.pdf`;
  var fileSize = currentUploadedMaterial ? currentUploadedMaterial.size : '1.45 MB';

  document.getElementById('pdfModalTitle').innerText = `[${bookName}] 콘텐츠 학습시트 (보안 PDF 웹뷰어)`;
  document.getElementById('pdfFileNameDisplay').innerText = fileName;
  document.getElementById('pdfFileSizeDisplay').innerText = `(${fileSize} · 첨부 파일 검수)`;
  document.getElementById('pdfSheetBookTitle').innerText = bookName;

  updateWatermarkInfo();

  // 사용자가 방금 첨부한 실제 PDF File/Blob이 있으면 PDF.js 캔버스 렌더링 + 워터마크 합성!
  if (currentUploadedPdfBlob) {
    renderPdfFileWithWatermark(currentUploadedPdfBlob);
  } else {
    showDefaultHtmlSheetView();
  }

  if (window.jQuery && typeof $('#contentPdfPreviewModal').modal === 'function') {
    $('#contentPdfPreviewModal').modal('show');
  } else {
    showModalVanilla('contentPdfPreviewModal');
  }
}

// 도서 및 콘텐츠 학습자료 최종 저장
function saveAcademyBook() {
  if (window.NanoPortal && NanoPortal.remote) { showAcademyToast('학원 자체 도서 등록은 전용 서버 저장 구조가 준비된 뒤 사용할 수 있습니다.'); return; }
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
    pdfBlob: currentUploadedPdfBlob,
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
var editingAcadQuizSets = [];
var currentAcadQuizSetIdx = 0;
var editingAcadQuizzes = [];
var currentAcadQuizIdx = 0;
var editingAcadSheetFile = null;
if (typeof pdfjsLib !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = 'plugin/build/pdf.worker.js';
}
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

// 도서별 퀴즈 세트 다중 관리 (본사, 타 가맹점, 우리 학원 세트)
function ensureAcadBookQuizSets(book) {
  if (book && Array.isArray(book.quizSets) && book.quizSets.length > 0) {
    return JSON.parse(JSON.stringify(book.quizSets));
  }

  var defaultHQQuizzes = getInitialAcadQuizList(book);
  var sets = [
    {
      id: 'qs_hq_' + (book ? book.id : 'new'),
      authorType: 'HQ',
      authorName: '본사',
      academyName: '본사 직속(HQ)',
      isMine: false,
      questions: defaultHQQuizzes
    }
  ];

  // '어린 왕자' 등 주요 도서에 타 가맹점(A 학원) 및 우리 학원 샘플 퀴즈 세트 구성
  if (book && book.title && book.title.includes('어린 왕자')) {
    sets.push({
      id: 'qs_acad_a_' + book.id,
      authorType: 'ACADEMY',
      authorName: 'A 학원',
      academyName: '울산 삼산 인재리딩캠퍼스',
      isMine: false,
      questions: [
        {
          question: '[A 학원 출제] 어린 왕자가 살던 고향 별의 명칭으로 알맞은 것은 무엇인가요?',
          opt1: 'A-101 소행성',
          opt2: 'B-612 소행성',
          opt3: 'C-303 소행성',
          opt4: 'D-909 소행성',
          ans: '2',
          hint: 'B-612 소행성입니다.'
        },
        {
          question: '[A 학원 출제] 여우가 어린 왕자에게 알려준 ㉠길들임의 참된 의미는 무엇인가요?',
          opt1: '상대를 내 마음대로 통제하는 것',
          opt2: '서로에게 특별한 관계를 맺고 책임을 다하는 것',
          opt3: '정해진 시간에 먹이를 주는 것',
          opt4: '상대의 약점을 모두 알아내는 것',
          ans: '2',
          hint: '세상에서 오직 하나뿐인 소중한 존재가 되는 과정'
        }
      ]
    });

    sets.push({
      id: 'qs_my_' + book.id,
      authorType: 'ACADEMY',
      authorName: '우리 학원',
      academyName: '나노 독서아카데미 본원',
      isMine: true,
      questions: [
        {
          question: '[우리 학원 자체 출제 1번] 어린 왕자가 지구 사막에서 만난 비행사에게 처음으로 그려달라고 부탁한 동물은 무엇인가요?',
          opt1: '양 한 마리',
          opt2: '비행기 프로펠러',
          opt3: '사막의 여우',
          opt4: '소행성의 장미꽃',
          ans: '1',
          hint: '상자에 구멍을 뚫어 넣어주었던 작은 동물입니다.'
        }
      ]
    });
  }

  return sets;
}

// ==============================================================
// 6-A. 학원 신규 도서 등록 및 서지 정보 수정 모달 로직 (본사와 100% 동일 규격)
// ==============================================================
var originalEditingAcadBookId = null;

// 카테고리 1별 학원 생각담기 제시문 세트
var ACAD_THINK_PROMPTS_NOVEL = [
  "주인공이 옆에 있다면 하고 싶은 이야기를 적어주세요.",
  "이 책을 읽고 가장 많이 떠오른 내 주변의 사람은 누구이며 그 이유는 무엇인가요?",
  "이야기는 끝났지만, 그 이후 어떤 일이 벌어졌는 지 상상해서 이야기를 만들어주세요.",
  "기억나는 장면이나 문장을 적어보세요.",
  "이 책에서 얻은 교훈이 있다면?",
  "가장 기억에 남는 등장인물은 누구이며 그 이유는 무엇인가요?",
  "이 책을 친구에게 추천한다면, 뭐라고 소개하고 싶은가요?"
];

var ACAD_THINK_PROMPTS_NONFICTION = [
  "이 책을 읽고 생각난 사람은 누구이며 이유는 무엇인가요?",
  "이 책에서 가장 기억에 남은 내용은 무엇인가요?",
  "책을 읽고 새롭게 알게된 내용은 무엇인가요?",
  "이 책을 추천한다면 어떻게 설명하고 싶나요?"
];

function updateAcadThinkPresets(cat1) {
  var select = document.getElementById("abEditThinkPresetSelect");
  if (!select) return;

  var isNonfiction = (cat1 === "비문학/정보글" || cat1 === "비문학" || cat1 === "C");
  var prompts = isNonfiction ? ACAD_THINK_PROMPTS_NONFICTION : ACAD_THINK_PROMPTS_NOVEL;

  select.innerHTML = prompts.map(function(p, i) {
    return `<option value="${p}">${i + 1}. ${p}</option>`;
  }).join("");

  var textarea = document.getElementById("abEditThinkInsert");
  if (textarea && prompts.length > 0) {
    textarea.value = prompts[0];
  }
}

function onAcadCategory1Changed(cat1) {
  updateAcadThinkPresets(cat1);
  if (!originalEditingAcadBookId) {
    generateAcademyBookId();
  }
}

function onAcadCategory2Changed(cat2) {
  if (!originalEditingAcadBookId) {
    generateAcademyBookId();
  }
}

function onAcadGradeChanged(grade) {
  if (!originalEditingAcadBookId) {
    generateAcademyBookId();
  }
}

function applyAcadThinkPresetToInput(val) {
  var textarea = document.getElementById("abEditThinkInsert");
  if (textarea) textarea.value = val;
}

function switchAcadThinkMode(mode) {
  var btnPreset = document.getElementById("btnAcadThinkPreset");
  var btnCustom = document.getElementById("btnAcadThinkCustom");
  var btnNone = document.getElementById("btnAcadThinkNone");
  var presetWrap = document.getElementById("acadThinkPresetWrap");
  var customWrap = document.getElementById("acadThinkCustomWrap");
  var noneNotice = document.getElementById("acadThinkNoneNotice");

  if (!btnPreset || !btnCustom || !btnNone) return;

  btnPreset.classList.remove("active");
  btnCustom.classList.remove("active");
  btnNone.classList.remove("active");

  if (mode === "preset") {
    btnPreset.classList.add("active");
    if (presetWrap) presetWrap.style.display = "block";
    if (customWrap) customWrap.style.display = "block";
    if (noneNotice) noneNotice.style.display = "none";
    var select = document.getElementById("abEditThinkPresetSelect");
    if (select) applyAcadThinkPresetToInput(select.value);
  } else if (mode === "custom") {
    btnCustom.classList.add("active");
    if (presetWrap) presetWrap.style.display = "none";
    if (customWrap) customWrap.style.display = "block";
    if (noneNotice) noneNotice.style.display = "none";
  } else {
    btnNone.classList.add("active");
    if (presetWrap) presetWrap.style.display = "none";
    if (customWrap) customWrap.style.display = "none";
    if (noneNotice) noneNotice.style.display = "block";
    var textarea = document.getElementById("abEditThinkInsert");
    if (textarea) textarea.value = "";
  }
}

function toggleAcadSingleBookCheckbox(isSingle) {
  var seriesInput = document.getElementById("abEditSeries");
  if (seriesInput) {
    seriesInput.disabled = isSingle;
    if (isSingle) {
      seriesInput.value = "";
      seriesInput.placeholder = "단권으로 지정되었습니다.";
    } else {
      seriesInput.placeholder = "예: 해리포터 시리즈, 한국사 편지";
    }
  }
}

// -------------------------------------------------------------
// 학원 도서 관리 코드 자동 채번 (규칙: [Cat2][Cat1][Grade][5자리순번])
// 예: 외서(F) + 소설(A) + 1학년(1) + 첫번째 => FA100001
// 예: 국내서(K) + 인물이야기(B) + 2학년(2) + 두번째 => KB200002
// -------------------------------------------------------------
function generateAcademyBookId() {
  var cat1El = document.getElementById("abEditCat1");
  var cat2El = document.getElementById("abEditCat2");
  var gradeEl = document.getElementById("abEditGrade");

  var cat1Val = cat1El ? cat1El.value : "소설";
  var cat2Val = cat2El ? cat2El.value : "국내서";
  var gradeVal = gradeEl ? gradeEl.value : "초등 1학년";

  var c2Code = "K";
  if (cat2Val.includes("외서") || cat2Val === "F") c2Code = "F";
  else if (cat2Val.includes("구분") || cat2Val === "N") c2Code = "N";

  var c1Code = "A";
  if (cat1Val.includes("인물") || cat1Val.includes("위인") || cat1Val === "B") c1Code = "B";
  else if (cat1Val.includes("비문학") || cat1Val.includes("정보") || cat1Val === "C") c1Code = "C";

  var gCode = "1";
  if (gradeVal.includes("유치") || gradeVal.includes("미취학")) gCode = "0";
  else if (gradeVal.includes("1학년") && !gradeVal.includes("중등")) gCode = "1";
  else if (gradeVal.includes("2학년") && !gradeVal.includes("중등")) gCode = "2";
  else if (gradeVal.includes("3학년") && !gradeVal.includes("중등")) gCode = "3";
  else if (gradeVal.includes("4학년")) gCode = "4";
  else if (gradeVal.includes("5학년")) gCode = "5";
  else if (gradeVal.includes("6학년")) gCode = "6";
  else if (gradeVal.includes("중등 1학년") || gradeVal.includes("중1")) gCode = "7";
  else if (gradeVal.includes("중등 2학년") || gradeVal.includes("중2")) gCode = "8";
  else if (gradeVal.includes("중등 3학년") || gradeVal.includes("중3")) gCode = "9";
  else {
    var m = gradeVal.match(/\d/);
    if (m) gCode = m[0];
  }

  var prefix = `${c2Code}${c1Code}${gCode}`;
  var maxSeq = 0;

  academyBookList.forEach(function(b) {
    if (b.id && b.id.startsWith(prefix)) {
      var numPart = b.id.slice(prefix.length);
      var num = parseInt(numPart, 10);
      if (!isNaN(num) && num > maxSeq) maxSeq = num;
    }
  });

  var nextSeq = String(maxSeq + 1).padStart(5, "0");
  var newId = `${prefix}${nextSeq}`;
  var idInput = document.getElementById("abEditId");
  if (idInput) idInput.value = newId;
  showAcademyToast(`신규 도서 관리 코드 [${newId}]가 자동 발급되었습니다.`);
  return newId;
}

// -------------------------------------------------------------
// [서비스 운영 관리 - 테마 관리] 주제 태그 드롭박스 렌더링 (학원 모달용)
// -------------------------------------------------------------
function renderThemeSelectForAcademyBook(selectedTag = "") {
  var select = document.getElementById("abEditThemeTagSelect");
  if (!select) return;

  var currentThemes = [];
  try {
    var raw = localStorage.getItem("NANO_MASTER_THEMES");
    if (raw) {
      var parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) currentThemes = parsed;
    }
  } catch(e) {}

  if (currentThemes.length === 0 && typeof window !== "undefined" && window.NANO_SERVER_THEMES && Array.isArray(window.NANO_SERVER_THEMES) && window.NANO_SERVER_THEMES.length > 0) {
    currentThemes = window.NANO_SERVER_THEMES;
  }
  if (currentThemes.length === 0 && typeof themeList !== "undefined" && Array.isArray(themeList) && themeList.length > 0) {
    currentThemes = themeList;
  }

  var targetVal = Array.isArray(selectedTag) ? (selectedTag[0] || "") : selectedTag;

  select.innerHTML = currentThemes.map(function(t) {
    var tagVal = t.tag || `#${t.title.replace(/\s+/g, '')}`;
    var isSelected = (targetVal && targetVal === tagVal);
    var label = t.title ? `${tagVal} (${t.title})` : tagVal;
    return `<option value="${tagVal}" ${isSelected ? 'selected' : ''}>${label}</option>`;
  }).join("");
}

// -------------------------------------------------------------
// 학원 세부 태그 동적 입력 슬롯 관리 (디폴트 2칸, 최대 5칸, +추가 및 삭제)
// -------------------------------------------------------------
var acadDetailTagsState = ["", ""];

function initAcadDetailTags(tagStringOrArray) {
  if (Array.isArray(tagStringOrArray)) {
    acadDetailTagsState = tagStringOrArray.filter(function(t) { return t && t.trim() !== ""; });
  } else if (typeof tagStringOrArray === "string" && tagStringOrArray.trim() !== "") {
    var raw = tagStringOrArray.split(/[\s,#]+/).map(function(t) { return t.trim(); }).filter(Boolean);
    acadDetailTagsState = raw;
  } else {
    acadDetailTagsState = ["", ""];
  }

  while (acadDetailTagsState.length < 2) {
    acadDetailTagsState.push("");
  }
  if (acadDetailTagsState.length > 5) {
    acadDetailTagsState = acadDetailTagsState.slice(0, 5);
  }
  renderAcadDetailTagSlots();
}

function renderAcadDetailTagSlots() {
  var container = document.getElementById("abDetailTagsContainer");
  var countEl = document.getElementById("abDetailTagCount");
  var addBtn = document.getElementById("btnAddAcadDetailTagSlot");
  if (!container) return;

  if (countEl) countEl.innerText = acadDetailTagsState.length;
  if (addBtn) addBtn.disabled = acadDetailTagsState.length >= 5;

  var placeholders = ["예: 문해력향상", "예: 세계명작", "예: 창의융합", "예: 감정표현", "예: 성장스토리"];

  container.innerHTML = acadDetailTagsState.map(function(val, idx) {
    var canRemove = acadDetailTagsState.length > 2;
    return `
      <div class="input-group input-group-sm mb-1.5" style="border-radius: 6px; overflow: hidden;">
        <div class="input-group-prepend">
          <span class="input-group-text bg-white font-weight-bold text-muted" style="font-size: 12px; border-color: var(--border-medium); min-width: 82px;">
            <i class="fa-solid fa-hashtag text-warning mr-1"></i>태그 ${idx + 1}
          </span>
        </div>
        <input type="text" class="form-control form-control-beige acad-detail-tag-input" 
               value="${val.replace(/^#/, '')}" 
               placeholder="${placeholders[idx] || '태그 직접 입력'}" 
               oninput="acadDetailTagsState[${idx}] = this.value"
               style="font-size: 12.5px;">
        ${canRemove ? `
          <div class="input-group-append">
            <button type="button" class="btn btn-outline-danger btn-sm" onclick="removeAcadDetailTagSlot(${idx})" title="이 태그 칸 삭제" style="border-color: var(--border-medium); font-size: 11px; padding: 0 10px;">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>
        ` : ''}
      </div>
    `;
  }).join("");
}

function addAcadDetailTagSlot() {
  if (acadDetailTagsState.length >= 5) {
    showAcademyToast("세부 태그는 최대 5개까지 등록할 수 있습니다.");
    return;
  }
  var inputs = document.querySelectorAll(".acad-detail-tag-input");
  inputs.forEach(function(inp, i) { if (acadDetailTagsState[i] !== undefined) acadDetailTagsState[i] = inp.value; });
  acadDetailTagsState.push("");
  renderAcadDetailTagSlots();
}

function removeAcadDetailTagSlot(idx) {
  if (acadDetailTagsState.length <= 2) {
    showAcademyToast("세부 태그 칸은 최소 2개 이상 유지되어야 합니다.");
    return;
  }
  var inputs = document.querySelectorAll(".acad-detail-tag-input");
  inputs.forEach(function(inp, i) { if (acadDetailTagsState[i] !== undefined) acadDetailTagsState[i] = inp.value; });
  acadDetailTagsState.splice(idx, 1);
  renderAcadDetailTagSlots();
}

function getAcadDetailTagsValue() {
  var inputs = document.querySelectorAll(".acad-detail-tag-input");
  var tags = [];
  inputs.forEach(function(inp) {
    var v = inp.value.trim().replace(/^#/, "");
    if (v) tags.push(`#${v}`);
  });
  return tags.join(" ");
}

// -------------------------------------------------------------
// [학원 도서 지능형 서지 분석 알고리즘]
// -------------------------------------------------------------
function detectAcadBookSeries(title, rawSeries) {
  if (rawSeries && rawSeries.trim() && rawSeries !== "단권") {
    return { isSeries: true, seriesName: rawSeries.trim() };
  }
  if (!title) return { isSeries: false, seriesName: "단권" };

  const clean = title.trim();
  const bracketMatch = clean.match(/^(.*?)\s*[\(\[](.*?(?:권|탄|부|시리즈|편|vol|season|\d+).*?)[\)\]]/i);
  if (bracketMatch) {
    const sName = bracketMatch[1].trim();
    if (sName.length >= 2 && !/^\d+$/.test(sName)) {
      return { isSeries: true, seriesName: sName };
    }
  }

  const endNumMatch = clean.match(/^(.*?)\s+(\d{1,3})\s*(?:권|탄|부|편|화)?$/);
  if (endNumMatch) {
    const sName = endNumMatch[1].trim();
    if (sName.length >= 2 && !/^(19|20)\d\d$/.test(sName)) {
      return { isSeries: true, seriesName: sName };
    }
  }

  if (clean.includes("시리즈") || clean.includes("세트") || clean.includes("전집") || clean.includes("문고")) {
    const sName = clean.replace(/\s*(?:전집|세트|시리즈|문고).*$/, " 시리즈").trim();
    return { isSeries: true, seriesName: sName };
  }

  return { isSeries: false, seriesName: "단권" };
}

function detectAcadBookCategory2(isbn, doc) {
  const isbnStr = (isbn || "").replace(/[^0-9]/g, "");
  if (isbnStr.startsWith("978") && !isbnStr.startsWith("97889")) return "외서";
  if (doc && doc.translators && Array.isArray(doc.translators) && doc.translators.length > 0) return "외서";

  const allText = `${doc ? doc.title || "" : ""} ${doc && Array.isArray(doc.authors) ? doc.authors.join(" ") : (doc ? doc.authors || "" : "")} ${doc ? doc.publisher || "" : ""}`;
  if (!/[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/.test(allText) && /[a-zA-Z]/.test(allText)) return "외서";

  const authorStr = doc && Array.isArray(doc.authors) ? doc.authors.join(", ") : (doc ? doc.authors || "" : "");
  if (authorStr.includes("·") || authorStr.includes(" 드 ") || authorStr.includes(" 생텍쥐페리") || authorStr.includes(" 롤링") || authorStr.includes(" 셰익스피어") || authorStr.includes(" 톨스토이")) {
    return "외서";
  }
  return "국내서";
}

function detectAcadBookCategory1(doc) {
  const text = `${(doc && doc.title) || ""} ${(doc && doc.contents) || ""}`;
  const bioKws = ["위인", "전기", "평전", "인물 이야기", "위인전", "who?", "Who?", "자서전", "생애", "세종대왕", "이순신", "안중근", "정약용", "헬렌 켈러", "에디슨", "아인슈타인", "스티브 잡스", "마더 테레사", "간디", "링컨", "김구", "유관순", "신사임당"];
  for (const kw of bioKws) {
    if (text.includes(kw)) return "인물 이야기 (위인)";
  }

  const nonFicKws = ["과학", "역사", "한국사", "세계사", "사회", "경제", "수학", "백과", "탐구", "사전", "지식", "정보", "원리", "실험", "우주", "식물", "환경", "철학", "교양", "인문", "상식", "법", "정치", "코딩", "인공지능", "생태", "지리", "설명문"];
  for (const kw of nonFicKws) {
    if (text.includes(kw)) return "비문학/정보글";
  }
  return "소설";
}

function detectAcadBookGrade(doc) {
  const text = `${(doc && doc.title) || ""} ${(doc && doc.contents) || ""}`;
  if (/유아|그림책|보드북|미취학|유치|[3-7]세|누리과정/.test(text)) return "유치부";
  if (/초등\s*1|초1|초등\s*저학년|저학년용/.test(text)) return "초등 1학년";
  if (/초등\s*2|초2/.test(text)) return "초등 2학년";
  if (/초등\s*3|초3|초등\s*중학년|중학년용/.test(text)) return "초등 3학년";
  if (/초등\s*4|초4/.test(text)) return "초등 4학년";
  if (/초등\s*5|초5|초등\s*고학년|고학년용/.test(text)) return "초등 5학년";
  if (/초등\s*6|초6/.test(text)) return "초등 6학년";
  if (/중등\s*1|중1|중학생|청소년\s*초기/.test(text)) return "중등 1학년";
  if (/중등\s*2|중2|청소년\s*문학|청소년용/.test(text)) return "중등 2학년";
  if (/중등\s*3|중3/.test(text)) return "중등 3학년";
  return "초등 5학년";
}

// -------------------------------------------------------------
// ISBN 도서 정보 자동 조회 (학원 모달용)
// -------------------------------------------------------------
async function lookupAcademyIsbn() {
  var isbnInput = document.getElementById("abEditIsbn");
  var isbn = isbnInput ? isbnInput.value.trim().replace(/[^0-9xX]/g, "") : "";
  if (!isbn) {
    showAcademyToast("ISBN 13자리 번호를 입력해 주세요.", "warning");
    if (isbnInput) isbnInput.focus();
    return;
  }

  var btn = document.getElementById("btnAcadIsbnFetch");
  if (btn) {
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-1"></i>카카오 조회중...';
    btn.disabled = true;
  }

  const kakaoApiKey = "11d75cc8189f15ddf547b5538827d04d";
  const apiUrl = `https://dapi.kakao.com/v3/search/book?target=isbn&query=${encodeURIComponent(isbn)}`;

  try {
    const res = await fetch(apiUrl, {
      method: "GET",
      headers: {
        "Authorization": `KakaoAK ${kakaoApiKey}`
      }
    });

    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }

    const data = await res.json();

    if (data && data.documents && data.documents.length > 0) {
      const doc = data.documents[0];
      const title = doc.title || "";
      const author = Array.isArray(doc.authors) ? doc.authors.join(", ") : (doc.authors || "");
      const publisher = doc.publisher || "";
      let cover = doc.thumbnail || "";

      if (cover && cover.includes("R120x174")) {
        cover = cover.replace("R120x174", "R300x0");
      }

      if (document.getElementById("abEditTitle")) document.getElementById("abEditTitle").value = title;
      if (document.getElementById("abEditAuthor")) document.getElementById("abEditAuthor").value = author;
      if (document.getElementById("abEditPublisher")) document.getElementById("abEditPublisher").value = publisher;

      // 지능형 서지 분석 적용
      const seriesInfo = detectAcadBookSeries(title, "");
      const isSingle = !seriesInfo.isSeries;
      const singleCheck = document.getElementById("abEditIsSingle");
      const seriesInput = document.getElementById("abEditSeries");
      if (singleCheck) singleCheck.checked = isSingle;
      if (typeof toggleAcadSingleBookCheckbox === "function") toggleAcadSingleBookCheckbox(isSingle);
      if (seriesInput && !isSingle) seriesInput.value = seriesInfo.seriesName;

      const detectedCat1 = detectAcadBookCategory1(doc);
      const detectedCat2 = detectAcadBookCategory2(isbn, doc);
      const detectedGrade = detectAcadBookGrade(doc);

      if (document.getElementById("abEditCat1")) {
        document.getElementById("abEditCat1").value = detectedCat1;
        if (typeof onAcadCategory1Changed === "function") onAcadCategory1Changed(detectedCat1);
      }
      if (document.getElementById("abEditCat2")) {
        document.getElementById("abEditCat2").value = detectedCat2;
        if (typeof onAcadCategory2Changed === "function") onAcadCategory2Changed(detectedCat2);
      }
      if (document.getElementById("abEditGrade")) {
        document.getElementById("abEditGrade").value = detectedGrade;
        if (typeof onAcadGradeChanged === "function") onAcadGradeChanged(detectedGrade);
      }

      if (cover) {
        if (document.getElementById("abEditCover")) document.getElementById("abEditCover").value = cover;
        updateAcadCoverPreview(cover);
      }

      if (btn) {
        btn.innerHTML = '<i class="fa-solid fa-check mr-1"></i>조회 완료';
        btn.disabled = false;
        setTimeout(function() {
          btn.innerHTML = '<i class="fa-solid fa-magnifying-glass mr-1"></i>ISBN 조회';
        }, 2000);
      }
      const seriesText = isSingle ? "단권" : `시리즈(${seriesInfo.seriesName})`;
      showAcademyToast(`[ISBN: ${isbn}] '${title}' (${seriesText} / ${detectedCat1} / ${detectedCat2}) 분석 완료!`);
    } else {
      showAcademyToast(`해당 ISBN(${isbn})에 대한 카카오 도서 검색 결과가 없습니다. 직접 입력해주세요.`, "warning");
      if (btn) {
        btn.innerHTML = '<i class="fa-solid fa-magnifying-glass mr-1"></i>ISBN 조회';
        btn.disabled = false;
      }
    }
  } catch (err) {
    console.warn("카카오 API 실시간 조회 실패 (오프라인/네트워크 오류), 내장 데이터 백업 적용:", err);

    var isbnMap = {
      "9788932917245": {
        title: "어린 왕자",
        author: "앙투안 드 생텍쥐페리",
        publisher: "열린책들",
        grade: "초등 5학년",
        cat1: "소설",
        cat2: "외서",
        cover: "assets/covers/cover_1001.jpg"
      },
      "9788936434120": {
        title: "아몬드",
        author: "손원평",
        publisher: "창비",
        grade: "중등 2학년",
        cat1: "소설",
        cat2: "국내서",
        cover: "assets/covers/cover_1002.jpg"
      }
    };

    var data = isbnMap[isbn] || {
      title: `[ISBN-${isbn.slice(-4)}] 신규 맞춤 도서`,
      author: "국립중앙도서관 수록 작가",
      publisher: "나노교육출판",
      grade: "초등 5학년",
      cat1: "소설",
      cat2: "국내서",
      cover: "assets/covers/cover_1001.jpg"
    };

    if (document.getElementById("abEditTitle")) document.getElementById("abEditTitle").value = data.title;
    if (document.getElementById("abEditAuthor")) document.getElementById("abEditAuthor").value = data.author;
    if (document.getElementById("abEditPublisher")) document.getElementById("abEditPublisher").value = data.publisher;
    if (document.getElementById("abEditGrade")) document.getElementById("abEditGrade").value = data.grade;
    if (document.getElementById("abEditCat1")) document.getElementById("abEditCat1").value = data.cat1;
    if (document.getElementById("abEditCat2")) document.getElementById("abEditCat2").value = data.cat2;
    if (typeof onAcadCategory1Changed === "function") onAcadCategory1Changed(data.cat1);
    if (typeof onAcadCategory2Changed === "function") onAcadCategory2Changed(data.cat2);
    if (document.getElementById("abEditCover")) document.getElementById("abEditCover").value = data.cover;
    updateAcadCoverPreview(data.cover);

    if (btn) {
      btn.innerHTML = '<i class="fa-solid fa-check mr-1"></i>조회 완료';
      btn.disabled = false;
      setTimeout(function() {
        btn.innerHTML = '<i class="fa-solid fa-magnifying-glass mr-1"></i>ISBN 조회';
      }, 2000);
    }
    showAcademyToast(`[ISBN: ${isbn}] 서지정보가 자동 입력되었습니다.`);
  }
}

// -------------------------------------------------------------
// 학원 도서 등록 / 편집 / 상세 조회 폼 읽기 전용 상태 제어
// -------------------------------------------------------------
function setAcadBookFormReadOnly(isReadOnly, sourceName) {
  var form = document.getElementById('academyBookOnlyForm');
  if (!form) return;

  // 1. 모든 input, select, textarea 순회하며 disabled 설정
  var inputs = form.querySelectorAll('input, select, textarea');
  inputs.forEach(function(el) {
    if (el.id === 'abEditId') return; // 코드는 항상 readonly
    if (isReadOnly) {
      el.setAttribute('disabled', 'disabled');
    } else {
      el.removeAttribute('disabled');
    }
  });

  // 2. 검색/조회 보조 버튼 제어
  var isbnBtn = document.getElementById('btnAcadIsbnFetch');
  if (isbnBtn) {
    if (isReadOnly) isbnBtn.setAttribute('disabled', 'disabled');
    else isbnBtn.removeAttribute('disabled');
  }

  var btnCoverUrl = document.getElementById('btnAcadCoverModeUrl');
  var btnCoverFile = document.getElementById('btnAcadCoverModeFile');
  if (btnCoverUrl) {
    if (isReadOnly) btnCoverUrl.setAttribute('disabled', 'disabled');
    else btnCoverUrl.removeAttribute('disabled');
  }
  if (btnCoverFile) {
    if (isReadOnly) btnCoverFile.setAttribute('disabled', 'disabled');
    else btnCoverFile.removeAttribute('disabled');
  }

  // 3. 생각담기 세그먼트 버튼 제어
  var thinkSegBtns = document.querySelectorAll('.think-seg-btn');
  thinkSegBtns.forEach(function(btn) {
    if (btn) {
      if (isReadOnly) {
        btn.style.pointerEvents = 'none';
        btn.style.opacity = '0.6';
      } else {
        btn.style.pointerEvents = '';
        btn.style.opacity = '';
      }
    }
  });

  // 4. 모달 상단 읽기 전용 안내 배너 제어
  var alertEl = document.getElementById('acadBookReadOnlyAlert');
  var msgEl = document.getElementById('acadBookReadOnlyMsg');
  if (alertEl) {
    if (isReadOnly) {
      if (msgEl) {
        msgEl.innerHTML = `<strong>${sourceName || '본사 공식 / 타 가맹점'}</strong> 도서입니다. 서지 정보 및 나노시트/생각담기를 안전하게 조회할 수 있으며, 내용 수정은 제한됩니다.`;
      }
      alertEl.style.display = 'flex';
    } else {
      alertEl.style.display = 'none';
    }
  }

  // 5. 모달 푸터 버튼 제어 (읽기 전용 시 저장 버튼 숨김 & 닫기 버튼 전환)
  var submitBtn = document.getElementById('btnSubmitAcadBookOnly');
  var cancelBtn = document.getElementById('btnCancelAcadBookOnly');
  var footerNotice = document.getElementById('acadBookModalFooterNotice');

  if (submitBtn) {
    submitBtn.style.display = isReadOnly ? 'none' : 'inline-block';
  }
  if (cancelBtn) {
    if (isReadOnly) {
      cancelBtn.innerHTML = '<i class="fa-solid fa-check mr-1"></i>확인 (닫기)';
      cancelBtn.className = 'btn btn-beige-primary px-4 font-weight-bold';
    } else {
      cancelBtn.innerHTML = '취소';
      cancelBtn.className = 'btn btn-beige-secondary px-3 mr-2';
    }
  }
  if (footerNotice) {
    footerNotice.innerHTML = isReadOnly
      ? '<i class="fa-solid fa-circle-info text-info mr-1"></i>도서 서지 정보 상세 조회 모드입니다. (읽기 전용)'
      : '<i class="fa-solid fa-shield-halved text-success mr-1"></i>도서 정보 저장 시 우리 학원의 도서 목록 및 배정 풀에 즉시 반영됩니다.';
  }
}

// -------------------------------------------------------------
// 학원 신규 도서 등록 / 편집 / 상세 조회 모달 열기
// -------------------------------------------------------------
function openAcademyBookOnlyAddModal(id = null) {
  var isNew = !id;
  originalEditingAcadBookId = isNew ? null : id;
  var book = isNew ? null : academyBookList.find(function(b) { return b.id === id; });

  // 내가 등록한 도서인지 판별 (false인 경우 상세 조회 전용 모드로 오픈)
  var isReadOnly = false;
  var sourceName = '';
  if (!isNew && book) {
    if (!isBookCreatedByMyAcademy(book)) {
      isReadOnly = true;
      sourceName = (!book.creatorType || book.creatorType === 'HQ' || (book.academyName && book.academyName.includes('본사')))
        ? '본사 직속 공식 도서'
        : (book.academyName ? `[${book.academyName}] 등록 도서` : '타 가맹점 등록 도서');
    }
  }

  // 1. 모달 타이틀 설정
  var titleEl = document.getElementById('acadBookModalTitle');
  if (titleEl) {
    if (isNew) {
      titleEl.innerHTML = '<i class="fa-solid fa-book-medical mr-2 text-warning"></i>학원 신규 도서 등록';
    } else if (isReadOnly) {
      titleEl.innerHTML = `<i class="fa-solid fa-book-open-reader mr-2 text-primary"></i>도서 상세 정보 조회 <span class="badge-soft badge-soft-warning ml-1" style="font-size: 11px;"><i class="fa-solid fa-lock mr-1"></i>읽기 전용 (${sourceName})</span>`;
    } else {
      titleEl.innerHTML = `<i class="fa-solid fa-pen-to-square mr-2 text-warning"></i>학원 도서 서지 정보 편집 <span class="badge-soft badge-soft-neutral ml-1" style="font-size: 11px;">${book.id}</span>`;
    }
  }

  // 폼 필드 읽기 전용/편집 활성화 상태 적용
  setAcadBookFormReadOnly(isReadOnly, sourceName);

  // 2. 카테고리 1, 카테고리 2, 학년 바인딩
  var cat1 = (book && book.cat1) ? book.cat1 : "소설";
  var cat2 = (book && book.cat2) ? book.cat2 : "국내서";
  var grade = (book && book.grade) ? book.grade : "초등 5학년";

  if (document.getElementById('abEditCat1')) document.getElementById('abEditCat1').value = cat1;
  if (document.getElementById('abEditCat2')) document.getElementById('abEditCat2').value = cat2;
  if (document.getElementById('abEditGrade')) document.getElementById('abEditGrade').value = grade;

  // 3. 도서 관리 코드 채번/세팅
  if (isNew) {
    generateAcademyBookId();
  } else {
    if (document.getElementById('abEditId')) document.getElementById('abEditId').value = book.id;
  }

  // 5. ISBN 바인딩 (신규 도서 등록 시 자동 입력 제거 -> 공란으로 초기화)
  var isbnInput = document.getElementById('abEditIsbn');
  if (isbnInput) {
    isbnInput.value = (book && book.isbn) ? book.isbn : '';
  }

  // 6. 기본 서지 정보 바인딩 (신규 등록 시 공란 유지)
  if (document.getElementById('abEditTitle')) document.getElementById('abEditTitle').value = isNew ? '' : book.title;
  if (document.getElementById('abEditAuthor')) document.getElementById('abEditAuthor').value = isNew ? '' : book.author;
  if (document.getElementById('abEditPublisher')) document.getElementById('abEditPublisher').value = isNew ? '' : (book.publisher || '');

  // 7. 시리즈명 & 단권 (시리즈명이 비어있거나 '단권'인 경우 단권 체크박스 자동 체크)
  var hasValidSeries = !!(book && book.series && book.series.trim() !== '' && book.series.trim() !== '단권');
  var isSingle = isNew ? false : (!hasValidSeries || book.isSingle === true || book.series === '단권');
  if (document.getElementById('abEditIsSingle')) document.getElementById('abEditIsSingle').checked = isSingle;
  toggleAcadSingleBookCheckbox(isSingle);
  if (document.getElementById('abEditSeries')) {
    document.getElementById('abEditSeries').value = hasValidSeries ? book.series.trim() : '';
  }

  // 8. 주제 분류 태그 (드롭박스 - 테마 관리 연동)
  var selectedThemeTag = (book && book.themeTag) ? book.themeTag : ((book && Array.isArray(book.tags) && book.tags[0]) ? book.tags[0] : "#이달의나노북클럽");
  renderThemeSelectForAcademyBook(selectedThemeTag);

  // 9. 세부 태그 동적 입력 슬롯 초기화
  initAcadDetailTags((book && book.detailTag) ? book.detailTag : "");

  // 10. 어워드, 줄거리, 생각꺼내기
  if (document.getElementById('abEditAwards')) document.getElementById('abEditAwards').value = (book && book.awards) ? book.awards : '';
  if (document.getElementById('abEditSynopsis')) document.getElementById('abEditSynopsis').value = (book && (book.synopsis || book.description)) ? (book.synopsis || book.description) : '';
  if (document.getElementById('abEditThinkExtract')) document.getElementById('abEditThinkExtract').value = (book && book.thinkExtract) ? book.thinkExtract : '';

  // 11. 생각 담기
  updateAcadThinkPresets(cat1);
  if (book && book.thinkInsert) {
    if (document.getElementById('abEditThinkInsert')) document.getElementById('abEditThinkInsert').value = book.thinkInsert;
    switchAcadThinkMode('custom');
  } else {
    switchAcadThinkMode('preset');
  }

  // 12. 표지 처리 (신규 등록 시 기본 도서 썸네일 노출)
  var coverUrl = isNew
    ? 'resources/images/book_default.png'
    : (book.cover || 'resources/images/book_default.png');
  if (document.getElementById('abEditCover')) document.getElementById('abEditCover').value = isNew ? '' : (book.cover || '');
  updateAcadCoverPreview(coverUrl);
  switchAcadCoverMode('url');

  // 13. 학습자료 파일 정보 설정
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

  // 동적 생성 필드 포함하여 최종 폼 읽기 전용/편집 활성화 상태 적용
  setAcadBookFormReadOnly(isReadOnly, sourceName);

  // 백드롭 정리 및 모달 오픈
  $('.modal-backdrop').remove();
  $('body').removeClass('modal-open');
  var modalEl = document.getElementById('academyBookAddModal');
  if (modalEl) modalEl.style.zIndex = '1060';
  $('#academyBookAddModal').modal({ backdrop: true, show: true });
}

// 하위 호환성용 별칭
function openAcademyBookEditModal(id) {
  openAcademyBookOnlyAddModal(id);
}
function openAcademyBookModal(id) {
  openAcademyBookOnlyAddModal(id);
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
    img.src = 'resources/images/book_default.png';
  } else {
    img.src = url;
  }
}

// 로컬 표지 파일 업로드
var editingAcadCoverFile = null;

function handleAcadCoverFileUpload(event) {
  var file = event.target.files[0];
  if (!file) return;
  editingAcadCoverFile = file;
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

// 학습자료 파일 업로드 (실제 PDF File/Blob/DataURL 보관 및 영속화)
function handleAcadSheetFileUpload(event) {
  var file = event.target.files[0];
  if (!file) return;
  var label = document.getElementById('abSheetFileName');
  if (label) label.innerText = file.name;

  var reader = new FileReader();
  reader.onload = function(e) {
    var dataUrl = e.target.result;
    editingAcadSheetFile = {
      name: file.name,
      size: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
      type: file.name.endsWith('.pdf') ? '나노 시트 (PDF)' : '문서 자료',
      file: file,
      pdfBlob: file,
      dataUrl: dataUrl
    };
    try {
      sessionStorage.setItem('nano_last_uploaded_pdf', dataUrl);
      sessionStorage.setItem('nano_last_uploaded_pdf_name', file.name);
    } catch(err) {
      console.warn('sessionStorage PDF 캐싱 생략 (대용량):', err);
    }
  };
  reader.readAsDataURL(file);
  showAcademyToast(`[${file.name}] 학습자료(PDF) 파일이 연결되었습니다.`);
}

// 도서 서지 정보 및 표지·나노시트 저장 (서버 DB + Cloudflare R2 영구 반영)
async function handleSaveAcademyBookOnly(event) {
  if (event) event.preventDefault();

  var finalId = document.getElementById('abEditId').value.trim();
  var isbn = document.getElementById('abEditIsbn').value.trim();
  var isPublic = 'Y'; // 도서는 무조건 전체 공개
  var title = document.getElementById('abEditTitle').value.trim();
  var isSingle = document.getElementById('abEditIsSingle') ? document.getElementById('abEditIsSingle').checked : true;
  var series = isSingle ? '단권' : ((document.getElementById('abEditSeries') ? document.getElementById('abEditSeries').value.trim() : '') || '단권');
  var author = document.getElementById('abEditAuthor').value.trim();
  var publisher = document.getElementById('abEditPublisher').value.trim();
  var cat1 = document.getElementById('abEditCat1') ? document.getElementById('abEditCat1').value : '소설';
  var cat2 = document.getElementById('abEditCat2') ? document.getElementById('abEditCat2').value : '국내서';
  var grade = document.getElementById('abEditGrade').value;
  var detailTag = getAcadDetailTagsValue();
  var awards = document.getElementById('abEditAwards') ? document.getElementById('abEditAwards').value.trim() : '';
  var synopsis = document.getElementById('abEditSynopsis') ? document.getElementById('abEditSynopsis').value.trim() : '';
  var thinkExtract = document.getElementById('abEditThinkExtract') ? document.getElementById('abEditThinkExtract').value.trim() : '';
  var thinkInsert = document.getElementById('abEditThinkInsert') ? document.getElementById('abEditThinkInsert').value.trim() : '';
  var cover = (document.getElementById('abEditCover') ? document.getElementById('abEditCover').value.trim() : '') || 'assets/covers/cover_1001.jpg';

  // 선택된 주제 분류 태그 수집 (드롭박스)
  var themeTagEl = document.getElementById('abEditThemeTagSelect');
  var themeTag = themeTagEl ? themeTagEl.value : '#이달의나노북클럽';
  var tags = [themeTag];

  var isNonfiction = (cat1 === '비문학/정보글' || cat1 === '비문학' || cat1 === 'C');
  var category = isNonfiction ? '비문학' : '문학';

  var matName = editingAcadSheetFile ? editingAcadSheetFile.name : `${title}_나노시트_학습용.pdf`;
  var matSize = editingAcadSheetFile ? editingAcadSheetFile.size : '1.45 MB';
  var matType = editingAcadSheetFile ? editingAcadSheetFile.type : '나노 시트 (PDF)';

  if (!title || !author) {
    alert('도서명과 저자는 필수 입력 사항입니다.');
    return;
  }

  var existingIdx = -1;
  if (originalEditingAcadBookId) {
    existingIdx = academyBookList.findIndex(function(b) { return b.id === originalEditingAcadBookId; });
  }

  if (existingIdx >= 0) {
    var b = academyBookList[existingIdx];
    // 타 가맹점 및 본사 도서 저장 시도 2중 방어
    if (!isBookCreatedByMyAcademy(b)) {
      showAcademyToast('다른 가맹점 또는 본사 공식 도서는 수정할 수 없습니다. (읽기 전용)');
      $('#academyBookAddModal').modal('hide');
      return;
    }
    b.isbn = isbn;
    b.isPublic = isPublic;
    b.title = title;
    b.isSingle = isSingle;
    b.series = series;
    b.author = author;
    b.publisher = publisher;
    b.cat1 = cat1;
    b.cat2 = cat2;
    b.category = category;
    b.grade = grade;
    b.themeTag = themeTag;
    b.tags = tags;
    b.detailTag = detailTag;
    b.awards = awards;
    b.synopsis = synopsis;
    b.description = synopsis;
    b.thinkExtract = thinkExtract;
    b.thinkInsert = thinkInsert;
    b.cover = cover;
    b.coverFile = editingAcadCoverFile || null;
    b.materialName = matName;
    b.materialSize = matSize;
    b.materialType = matType;
    if (editingAcadSheetFile) {
      b.hasSheet = true;
      b.sheet = true;
      b.hasCustomSheet = true;
      b.sheetFile = editingAcadSheetFile;
      if (editingAcadSheetFile.file) b.pdfBlob = editingAcadSheetFile.file;
      if (editingAcadSheetFile.dataUrl) b.pdfDataUrl = editingAcadSheetFile.dataUrl;
    } else if (matName && !matName.includes('미등록') && !matName.includes('없음')) {
      b.hasSheet = true;
      b.sheet = true;
    }
    if (window.NanoPortal && NanoPortal.remote) {
      try {
        await NanoPortal.saveBook(b);
      } catch (err) {
        showAcademyToast('도서 수정 저장 실패: ' + (err && err.message ? err.message : '서버 오류'));
        return;
      }
    }
    editingAcadCoverFile = null;
    lastAddedBookId = b.id;
    showAcademyToast(`도서 [${title}] 서지 정보 및 학습자료가 성공적으로 수정되었습니다.`);
  } else {
    var newBook = {
      id: finalId || generateAcademyBookId(),
      isbn: isbn,
      isPublic: isPublic,
      title: title,
      subtitle: series && series !== '단권' ? series : '학원 자체 등록 맞춤 도서',
      isSingle: isSingle,
      series: series,
      author: author,
      publisher: publisher,
      cat1: cat1,
      cat2: cat2,
      category: category,
      grade: grade,
      themeTag: themeTag,
      tags: tags,
      detailTag: detailTag,
      awards: awards,
      synopsis: synopsis,
      description: synopsis,
      thinkExtract: thinkExtract,
      thinkInsert: thinkInsert,
      creatorType: 'ACADEMY',
      academyName: (typeof currentAcademyInfo !== 'undefined' && currentAcademyInfo && currentAcademyInfo.name) ? currentAcademyInfo.name : '우리 학원',
      academyId: (typeof currentAcademyInfo !== 'undefined' && currentAcademyInfo && currentAcademyInfo.id) ? currentAcademyInfo.id : 'MY_ACAD',
      isMyCreation: true,
      cover: cover,
      coverFile: editingAcadCoverFile || null,
      materialName: matName,
      materialSize: matSize,
      materialType: matType,
      hasSheet: !!editingAcadSheetFile || (!!matName && !matName.includes('미등록') && !matName.includes('없음')),
      sheet: !!editingAcadSheetFile || (!!matName && !matName.includes('미등록') && !matName.includes('없음')),
      hasCustomSheet: !!editingAcadSheetFile,
      sheetFile: editingAcadSheetFile || null,
      pdfBlob: editingAcadSheetFile ? (editingAcadSheetFile.file || editingAcadSheetFile.pdfBlob) : null,
      pdfDataUrl: editingAcadSheetFile ? editingAcadSheetFile.dataUrl : null,
      quizStatus: '0문항 (미등록)',
      readCount: '0회',
      answerGuide: '【나노 시트 핵심 정답】\n교사용 지도 가이드 및 정답안 등록 완료.'
    };
    if (window.NanoPortal && NanoPortal.remote) {
      try {
        await NanoPortal.saveBook(newBook);
      } catch (err) {
        showAcademyToast('신규 도서 등록 실패: ' + (err && err.message ? err.message : '서버 오류'));
        return;
      }
    }
    editingAcadCoverFile = null;
    academyBookList.unshift(newBook);
    markBookAsMyCreation(newBook.id);
    lastAddedBookId = newBook.id;
    showAcademyToast(`신규 도서 [${title}] (코드: ${newBook.id})이 등록되었습니다.`);
  }

  if (typeof renderCartBookCatalog === 'function') renderCartBookCatalog();
  renderAcademyBookTable();
  if (typeof syncCustomAcademyBooksToStorage === 'function') syncCustomAcademyBooksToStorage();

  $('#academyBookAddModal').modal('hide');
}

// ==============================================================
// 6-B. 학원 북퀴즈 독립 관리 및 가변 보기(2~5지선다) 모달 로직
// ==============================================================
var curQuizTargetBookId = null;

// 학원 북퀴즈 모달 열기 (운영 서버 모드에서는 해당 도서의 실문항을 지연 조회하여 바인딩)
async function openAcademyStandaloneQuizModal(bookId = null) {
  if (!academyBookList || academyBookList.length === 0) {
    showAcademyToast('등록된 도서가 없습니다. 먼저 새 도서를 등록해주세요.');
    return;
  }

  var targetId = bookId || (academyBookList[0] ? academyBookList[0].id : null);
  var book = academyBookList.find(function(b) { return b.id === targetId; }) || academyBookList[0];
  if (!book) return;

  curQuizTargetBookId = book.id;

  // 대상 도서 셀렉트박스 옵션 구성
  var selectEl = document.getElementById('aqTargetBookSelect');
  if (selectEl) {
    selectEl.innerHTML = academyBookList.map(function(b) {
      return `<option value="${b.id}" ${b.id === book.id ? 'selected' : ''}>[${b.id}] ${b.title}</option>`;
    }).join('');
  }

  // 상단 도서 요약 바 갱신
  bindAcadQuizTargetBookInfo(book);

  // 운영 서버 환경에서 아직 문항이 로드되지 않은 경우 지연 조회(/api/portal?action=quiz) 실행
  if (window.NANO_SERVER_DATA && (!book.quizSets || book.quizSets.length === 0) && !book._quizLoadedFromServer && window.NanoPortal && typeof NanoPortal.api === 'function') {
    try {
      var lookupId = book.serverId || book.bookNo || book.id;
      var res = await NanoPortal.api('/api/portal?action=quiz&bookId=' + encodeURIComponent(lookupId));
      book._quizLoadedFromServer = true;
      if (Array.isArray(res.quizSets) && res.quizSets.length > 0) {
        book.quizSets = res.quizSets;
        if (!window.MIGRATED_QUIZZES) window.MIGRATED_QUIZZES = {};
        window.MIGRATED_QUIZZES[book.id] = res.quizSets;
      }
    } catch (err) {
      console.warn('학원 북퀴즈 지연 조회 실패:', err);
    }
  }

  // 북퀴즈 데이터 다중 세트 초기화
  editingAcadQuizSets = ensureAcadBookQuizSets(book);
  currentAcadQuizSetIdx = 0;
  editingAcadQuizzes = editingAcadQuizSets[0].questions;
  currentAcadQuizIdx = 0;

  renderAcadQuizSetTabs();
  renderAcadQuizTabs();
  loadAcadQuizForm();

  // 백드롭 정리 및 모달 오픈
  $('.modal-backdrop').remove();
  $('body').removeClass('modal-open');
  var modalEl = document.getElementById('academyQuizManageModal');
  if (modalEl) modalEl.style.zIndex = '1060';
  $('#academyQuizManageModal').modal({ backdrop: true, show: true });
}

// 대상 도서 드롭다운 변경 핸들러
async function onSelectAcadQuizTargetBook(newBookId) {
  var book = academyBookList.find(function(b) { return b.id === newBookId; });
  if (!book) return;

  // 이전 도서의 변경사항 저장
  saveCurrentAcadQuizInput();
  if (curQuizTargetBookId) {
    var prevBook = academyBookList.find(function(b) { return b.id === curQuizTargetBookId; });
    if (prevBook) {
      prevBook.quizSets = JSON.parse(JSON.stringify(editingAcadQuizSets));
    }
  }

  curQuizTargetBookId = book.id;
  bindAcadQuizTargetBookInfo(book);

  // 운영 서버 환경에서 아직 문항이 로드되지 않은 경우 지연 조회(/api/portal?action=quiz) 실행
  if (window.NANO_SERVER_DATA && (!book.quizSets || book.quizSets.length === 0) && !book._quizLoadedFromServer && window.NanoPortal && typeof NanoPortal.api === 'function') {
    try {
      var lookupId = book.serverId || book.bookNo || book.id;
      var res = await NanoPortal.api('/api/portal?action=quiz&bookId=' + encodeURIComponent(lookupId));
      book._quizLoadedFromServer = true;
      if (Array.isArray(res.quizSets) && res.quizSets.length > 0) {
        book.quizSets = res.quizSets;
        if (!window.MIGRATED_QUIZZES) window.MIGRATED_QUIZZES = {};
        window.MIGRATED_QUIZZES[book.id] = res.quizSets;
      }
    } catch (err) {
      console.warn('학원 북퀴즈 지연 조회 실패:', err);
    }
  }

  editingAcadQuizSets = ensureAcadBookQuizSets(book);
  currentAcadQuizSetIdx = 0;
  editingAcadQuizzes = editingAcadQuizSets[0].questions;
  currentAcadQuizIdx = 0;

  renderAcadQuizSetTabs();
  renderAcadQuizTabs();
  loadAcadQuizForm();
}

function bindAcadQuizTargetBookInfo(book) {
  var coverImg = document.getElementById('aqTargetBookCover');
  if (coverImg) coverImg.src = book.cover || 'assets/covers/cover_1001.jpg';

  var titleEl = document.getElementById('aqTargetBookTitle');
  if (titleEl) titleEl.innerText = book.title;

  var gradeEl = document.getElementById('aqTargetBookGrade');
  if (gradeEl) gradeEl.innerText = book.grade || '초등 5~6학년';

  var authorEl = document.getElementById('aqTargetBookAuthor');
  if (authorEl) authorEl.innerHTML = `저자: ${book.author} | 출판사: ${book.publisher || '열린책들'} | 도서코드: <span id="aqTargetBookId">${book.id}</span>`;
}

// 출제 기관 탭 전환
function switchAcadQuizSet(idx) {
  var prevSet = editingAcadQuizSets[currentAcadQuizSetIdx];
  var wasReadOnly = prevSet && !prevSet.isMine && (prevSet.authorType === 'HQ' || prevSet.authorName === '본사' || prevSet.authorName === 'A 학원');

  if (!wasReadOnly) {
    saveCurrentAcadQuizInput();
  }

  currentAcadQuizSetIdx = idx;
  currentAcadQuizIdx = 0;
  editingAcadQuizzes = editingAcadQuizSets[currentAcadQuizSetIdx].questions;

  renderAcadQuizSetTabs();
  renderAcadQuizTabs();
  loadAcadQuizForm();
}

// 새 북퀴즈 세트 추가
function addNewAcadQuizSet() {
  var prevSet = editingAcadQuizSets[currentAcadQuizSetIdx];
  var wasReadOnly = prevSet && !prevSet.isMine && (prevSet.authorType === 'HQ' || prevSet.authorName === '본사' || prevSet.authorName === 'A 학원');
  if (!wasReadOnly) {
    saveCurrentAcadQuizInput();
  }

  var acadName = (typeof currentAcademyInfo !== 'undefined' && currentAcademyInfo && currentAcademyInfo.name)
    ? currentAcademyInfo.name
    : '우리 학원';
  var mySets = editingAcadQuizSets.filter(function(s) { return s.isMine || s.authorName === acadName || s.authorName.includes(acadName) || s.authorName.includes('우리 학원'); });
  var setLabel = acadName + (mySets.length > 0 ? ` (세트 ${mySets.length + 1})` : '');

  var newSet = {
    id: 'qs_my_' + Date.now(),
    authorType: 'ACADEMY',
    authorName: setLabel,
    academyName: acadName,
    isMine: true,
    isPublic: 'Y',
    createdAt: new Date().toISOString().slice(0, 10),
    questions: [
      {
        question: '문제를 입력해주세요',
        type: 'CHOICE',
        optionCount: 3,
        opt1: '1번 선택지를 입력해주세요',
        opt2: '2번 선택지를 입력해주세요',
        opt3: '3번 선택지를 입력해주세요',
        opt4: '4번 선택지를 입력해주세요',
        opt5: '5번 선택지를 입력해주세요',
        ans: '1',
        hint: ''
      }
    ]
  };

  editingAcadQuizSets.push(newSet);
  switchAcadQuizSet(editingAcadQuizSets.length - 1);
  showAcademyToast(`'${setLabel}' 북퀴즈 세트가 추가되었습니다! 질문과 보기를 작성해주세요.`);
}

// 선택된 퀴즈 세트 삭제
function deleteCurAcadQuizSet() {
  var curSet = editingAcadQuizSets[currentAcadQuizSetIdx];
  if (!curSet) return;

  var isReadOnly = !curSet.isMine && (curSet.authorType === 'HQ' || curSet.authorName === '본사' || curSet.authorName === 'A 학원');
  if (isReadOnly) {
    showAcademyToast('타 가맹점이나 본사에서 출제한 북퀴즈 세트는 삭제할 수 없습니다.');
    return;
  }

  if (editingAcadQuizSets.length <= 1) {
    showAcademyToast('최소 1개 이상의 퀴즈 세트가 유지되어야 합니다.');
    return;
  }

  if (!confirm(`'${curSet.authorName}' 북퀴즈 세트 전체를 삭제하시겠습니까?`)) {
    return;
  }

  editingAcadQuizSets.splice(currentAcadQuizSetIdx, 1);
  currentAcadQuizSetIdx = 0;
  currentAcadQuizIdx = 0;
  editingAcadQuizzes = editingAcadQuizSets[0].questions;

  renderAcadQuizSetTabs();
  renderAcadQuizTabs();
  loadAcadQuizForm();
  showAcademyToast('북퀴즈 세트가 삭제되었습니다.');
}

// 출제 기관별 탭 렌더링
function renderAcadQuizSetTabs() {
  var container = document.getElementById('abQuizSetTabs');
  if (!container) return;

  var curSet = editingAcadQuizSets[currentAcadQuizSetIdx];
  var isReadOnly = curSet && !curSet.isMine && (curSet.authorType === 'HQ' || curSet.authorName === '본사' || curSet.authorName === 'A 학원');

  container.innerHTML = editingAcadQuizSets.map(function(set, idx) {
    var isActive = idx === currentAcadQuizSetIdx;
    var isHQ = set.authorType === 'HQ' || set.authorName === '본사';
    var icon = isHQ ? 'fa-solid fa-building' : 'fa-solid fa-school';
    var isSetPub = set.isPublic !== 'N';
    var pubBadge = isSetPub
      ? `<span class="badge ${isActive ? 'badge-light text-success' : 'badge-success text-white'}" style="font-size: 10px; padding: 1px 5px; border-radius: 6px; margin-left: 5px; font-weight: 700;">공개</span>`
      : `<span class="badge ${isActive ? 'badge-light text-secondary' : 'badge-secondary text-white'}" style="font-size: 10px; padding: 1px 5px; border-radius: 6px; margin-left: 5px; font-weight: 700;"><i class="fa-solid fa-lock mr-0.5" style="font-size: 9px;"></i>비공개</span>`;

    var tabStyle = isActive
      ? 'background: #2d6a4f; color: #ffffff; border: 1.5px solid #2d6a4f; border-radius: 20px; padding: 6px 14px; font-size: 12.5px; font-weight: 700; box-shadow: 0 2px 6px rgba(45,106,79,0.25);'
      : 'background: #ffffff; color: #5c4f43; border: 1.5px solid #ded6c9; border-radius: 20px; padding: 6px 14px; font-size: 12.5px; font-weight: 600;';

    var badgeStyle = isActive
      ? 'background: rgba(255,255,255,0.25); color: #ffffff; font-size: 11px; padding: 2px 7px; border-radius: 10px; margin-left: 6px; font-weight: 700;'
      : 'background: #ede6dc; color: #786d63; font-size: 11px; padding: 2px 7px; border-radius: 10px; margin-left: 6px; font-weight: 700;';

    return `<button type="button" class="btn btn-xs d-inline-flex align-items-center" onclick="switchAcadQuizSet(${idx})" style="${tabStyle}">
      <i class="${icon} mr-1.5" style="font-size: 12px;"></i>${set.authorName}
      <span style="${badgeStyle}">${set.questions ? set.questions.length : 0}</span>
      ${pubBadge}
    </button>`;
  }).join('');

  // 퀴즈 공개 상태 라디오 및 권한 제어 (출제 기관만 변경 가능)
  var isPub = curSet && curSet.isPublic !== 'N';
  var radY = document.getElementById('abSetPublicY');
  var radN = document.getElementById('abSetPublicN');
  var lockNotice = document.getElementById('abSetPublicLockNotice');
  if (radY && radN) {
    radY.checked = isPub;
    radN.checked = !isPub;
    radY.disabled = isReadOnly;
    radN.disabled = isReadOnly;
  }
  if (lockNotice) {
    lockNotice.style.display = isReadOnly ? 'inline' : 'none';
  }

  var noticeEl = document.getElementById('abQuizReadOnlyNotice');
  if (noticeEl) {
    noticeEl.style.display = isReadOnly ? 'block' : 'none';
  }

  var btnDelSet = document.getElementById('btnDeleteAcadQuizSet');
  if (btnDelSet) {
    btnDelSet.style.display = (!isReadOnly && editingAcadQuizSets.length > 1) ? 'inline-block' : 'none';
  }
}

// 학원 북퀴즈 세트 공개/비공개 변경 핸들러
function onAcadQuizSetPublicChanged(val) {
  var curSet = editingAcadQuizSets[currentAcadQuizSetIdx];
  if (!curSet) return;
  var isReadOnly = !curSet.isMine && (curSet.authorType === 'HQ' || curSet.authorName === '본사' || curSet.authorName === 'A 학원');
  if (isReadOnly) {
    showAcademyToast('출제 기관(본사 또는 해당 가맹점)만 공개 여부를 변경할 수 있습니다.');
    renderAcadQuizSetTabs();
    return;
  }
  curSet.isPublic = val;
  renderAcadQuizSetTabs();
  showAcademyToast(`선택된 북퀴즈 세트가 [${val === 'Y' ? '공개 (전체 공유)' : '비공개 (우리 학원 전용)'}] 상태로 설정되었습니다.`);
}

// 북퀴즈 문항 탭 렌더링
function renderAcadQuizTabs() {
  var container = document.getElementById('abQuizTabButtons');
  if (!container) return;

  var countBadge = document.getElementById('aqQuizCountBadge');
  if (countBadge) countBadge.innerText = `총 ${editingAcadQuizzes.length}문항 구성됨`;

  var curSet = editingAcadQuizSets[currentAcadQuizSetIdx];
  var isReadOnly = curSet && !curSet.isMine && (curSet.authorType === 'HQ' || curSet.authorName === '본사' || curSet.authorName === 'A 학원');

  container.innerHTML = editingAcadQuizzes.map(function(q, idx) {
    var mediaBadge = "";
    if (q.mediaType === "image" && q.mediaUrl) {
      mediaBadge = `<span title="이미지(WebP) 첨부됨" style="margin-left: 3px; font-size: 11px;">🖼️</span>`;
    } else if (q.mediaType === "video" && q.mediaUrl) {
      mediaBadge = `<span title="영상(URL) 첨부됨" style="margin-left: 3px; font-size: 11px;">🎬</span>`;
    }

    return `<button type="button" class="quiz-num-pill ${idx === currentAcadQuizIdx ? 'active' : ''}" onclick="switchAcadQuizItem(${idx})">
      ${idx + 1}번 문항${mediaBadge}
    </button>`;
  }).join('');

  var btnDel = document.getElementById('btnDeleteAcadQuiz');
  if (btnDel) {
    btnDel.style.display = (!isReadOnly && editingAcadQuizzes.length > 1) ? 'inline-block' : 'none';
  }
}

// 문항 유형 전환 (객관식 vs 주관식)
function onAcadQuizTypeChanged(type) {
  var choiceArea = document.getElementById('abChoiceArea');
  var optCountWrap = document.getElementById('abQuizOptionCountWrap');
  var subjArea = document.getElementById('abSubjectiveArea');

  if (type === 'CHOICE') {
    if (choiceArea) choiceArea.style.display = 'block';
    if (optCountWrap) optCountWrap.style.display = 'flex';
    if (subjArea) subjArea.style.display = 'none';
  } else {
    if (choiceArea) choiceArea.style.display = 'none';
    if (optCountWrap) optCountWrap.style.display = 'none';
    if (subjArea) subjArea.style.display = 'block';
  }

  var q = editingAcadQuizzes[currentAcadQuizIdx];
  if (q) q.type = type;
  saveCurrentAcadQuizDraft();
}

// ★ 핵심 요구사항: 북퀴즈 보기 개수 가변 조절 (2~5개 가변, 디폴트 3개)

// ==============================================================
// 학원 북퀴즈 멀티미디어 제어 로직 (WebP 이미지 & 영상 URL)
// ==============================================================
function setAcadQuizMediaType(type) {
  var btnNone = document.getElementById("abMediaBtnNone");
  var btnImg = document.getElementById("abMediaBtnImage");
  var btnVid = document.getElementById("abMediaBtnVideo");
  var areaImg = document.getElementById("abMediaImageArea");
  var areaVid = document.getElementById("abMediaVideoArea");
  var captionWrap = document.getElementById("abMediaCaptionWrap");

  if (btnNone) btnNone.classList.toggle("active", type === "none");
  if (btnImg) btnImg.classList.toggle("active", type === "image");
  if (btnVid) btnVid.classList.toggle("active", type === "video");

  if (areaImg) areaImg.style.display = (type === "image") ? "block" : "none";
  if (areaVid) areaVid.style.display = (type === "video") ? "block" : "none";
  if (captionWrap) captionWrap.style.display = (type !== "none") ? "block" : "none";

  var q = (typeof editingAcadQuizzes !== 'undefined' && editingAcadQuizzes && editingAcadQuizzes[currentAcadQuizIdx]) ? editingAcadQuizzes[currentAcadQuizIdx] : null;
  if (q) {
    q.mediaType = type;
    if (type === "none") {
      q.mediaUrl = "";
      q.mediaName = "";
    }
  }
  if (typeof renderAcadQuizTabs === 'function') renderAcadQuizTabs();
}

function handleAcadQuizImageUpload(input) {
  var file = input.files && input.files[0];
  if (!file) return;

  if (!file.type.startsWith("image/")) {
    alert("이미지 파일만 업로드할 수 있습니다.");
    input.value = "";
    return;
  }

  var statusEl = document.getElementById("abImageStatusText");
  if (statusEl) {
    statusEl.innerHTML = `<i class="fa-solid fa-spinner fa-spin text-info mr-1"></i>WebP 고화질 압축 변환 중...`;
  }

  var reader = new FileReader();
  reader.onload = function(e) {
    var img = new Image();
    img.onload = function() {
      var maxW = 1280;
      var w = img.width;
      var h = img.height;
      if (w > maxW) {
        h = Math.round((h * maxW) / w);
        w = maxW;
      }
      var canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      var ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, w, h);

      var webpDataUrl = "";
      try {
        webpDataUrl = canvas.toDataURL("image/webp", 0.82);
        if (!webpDataUrl.startsWith("data:image/webp")) {
          webpDataUrl = canvas.toDataURL("image/jpeg", 0.82);
        }
      } catch (err) {
        webpDataUrl = canvas.toDataURL("image/jpeg", 0.82);
      }

      var origKb = Math.round(file.size / 1024);
      var webpKb = Math.round((webpDataUrl.length * 0.75) / 1024);
      var savePercent = origKb > 0 ? Math.max(0, Math.round(((origKb - webpKb) / origKb) * 100)) : 0;

      var q = (typeof editingAcadQuizzes !== 'undefined' && editingAcadQuizzes && editingAcadQuizzes[currentAcadQuizIdx]) ? editingAcadQuizzes[currentAcadQuizIdx] : null;
      if (q) {
        q.mediaType = "image";
        q.mediaUrl = webpDataUrl;
        q.mediaName = file.name;
        q.mediaSizeInfo = `${origKb}KB ➔ ${webpKb}KB (${savePercent}% 절감)`;
      }

      displayAcadQuizImagePreview(webpDataUrl, file.name, q ? q.mediaSizeInfo : '');

      if (statusEl) {
        statusEl.innerHTML = `<i class="fa-solid fa-circle-check text-success mr-1"></i>WebP 변환 완료 (${origKb}KB ➔ <strong>${webpKb}KB</strong>, ${savePercent}% 압축)`;
      }

      if (typeof renderAcadQuizTabs === 'function') renderAcadQuizTabs();
      input.value = "";
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

function displayAcadQuizImagePreview(url, name, sizeInfo) {
  var box = document.getElementById("abImagePreviewBox");
  var img = document.getElementById("abImagePreviewImg");
  var meta = document.getElementById("abImageMetaText");
  if (!box || !img) return;

  if (url) {
    img.src = url;
    if (meta) meta.innerText = `${name || '문항 이미지'} · ${sizeInfo || 'WebP 최적화 완료'}`;
    box.style.display = "block";
  } else {
    box.style.display = "none";
  }
}

function handleAcadQuizVideoUrlInput(val) {
  var q = (typeof editingAcadQuizzes !== 'undefined' && editingAcadQuizzes && editingAcadQuizzes[currentAcadQuizIdx]) ? editingAcadQuizzes[currentAcadQuizIdx] : null;
  if (q) {
    q.mediaType = "video";
    q.mediaUrl = val.trim();
  }
  renderAcadQuizVideoPlayer(val);
  if (typeof renderAcadQuizTabs === 'function') renderAcadQuizTabs();
}

function previewAcadQuizVideoUrl() {
  var input = document.getElementById("abVideoUrlInput");
  var val = input ? input.value.trim() : "";
  if (!val) {
    alert("영상 URL을 먼저 입력해주세요.");
    return;
  }
  renderAcadQuizVideoPlayer(val);
}

function renderAcadQuizVideoPlayer(url) {
  var wrap = document.getElementById("abVideoPlayerWrap");
  var box = document.getElementById("abVideoPreviewBox");
  if (!wrap || !box) return;

  if (!url || !url.trim()) {
    box.style.display = "none";
    wrap.innerHTML = "";
    return;
  }

  var trimmed = url.trim();
  var ytMatch = trimmed.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/i);
  var vimeoMatch = trimmed.match(/vimeo\.com\/(?:video\/)?([0-9]+)/i);

  if (ytMatch && ytMatch[1]) {
    wrap.innerHTML = `<iframe src="https://www.youtube.com/embed/${ytMatch[1]}?autoplay=0&rel=0" style="width:100%;height:100%;border:none;" allowfullscreen></iframe>`;
    box.style.display = "block";
  } else if (vimeoMatch && vimeoMatch[1]) {
    wrap.innerHTML = `<iframe src="https://player.vimeo.com/video/${vimeoMatch[1]}" style="width:100%;height:100%;border:none;" allowfullscreen></iframe>`;
    box.style.display = "block";
  } else if (/\.(mp4|webm|ogg)($|\?)/i.test(trimmed)) {
    wrap.innerHTML = `<video controls style="width:100%;height:100%;"><source src="${trimmed}"></video>`;
    box.style.display = "block";
  } else if (/^https?:\/\//i.test(trimmed)) {
    wrap.innerHTML = `<iframe src="${trimmed}" style="width:100%;height:100%;border:none;" allowfullscreen></iframe>`;
    box.style.display = "block";
  } else {
    box.style.display = "none";
    wrap.innerHTML = "";
  }
}

function removeAcadQuizMedia() {
  var q = (typeof editingAcadQuizzes !== 'undefined' && editingAcadQuizzes && editingAcadQuizzes[currentAcadQuizIdx]) ? editingAcadQuizzes[currentAcadQuizIdx] : null;
  if (q) {
    q.mediaType = "none";
    q.mediaUrl = "";
    q.mediaName = "";
    q.mediaCaption = "";
  }
  setAcadQuizMediaType("none");
  displayAcadQuizImagePreview("", "", "");
  renderAcadQuizVideoPlayer("");
  var urlInput = document.getElementById("abVideoUrlInput");
  if (urlInput) urlInput.value = "";
  var capInput = document.getElementById("abMediaCaption");
  if (capInput) capInput.value = "";
  var imgInput = document.getElementById("abImageFileInput");
  if (imgInput) imgInput.value = "";
  var statusText = document.getElementById("abImageStatusText");
  if (statusText) statusText.innerHTML = `<i class="fa-solid fa-wand-magic-sparkles text-warning mr-1"></i>업로드 시 고화질 WebP 파일로 자동 변환·경량화되어 초고속 로딩됩니다.`;
  if (typeof renderAcadQuizTabs === 'function') renderAcadQuizTabs();
}

function changeAcadQuizOptionCount(countVal) {
  var count = parseInt(countVal, 10);
  if (isNaN(count) || count < 2) count = 2;
  if (count > 5) count = 5;

  var q = editingAcadQuizzes[currentAcadQuizIdx];
  if (q) {
    q.optionCount = count;
  }

  // 보기 1~5 wrapper 노출/숨김
  for (var i = 1; i <= 5; i++) {
    var wrap = document.getElementById('abOptWrap' + i);
    if (wrap) {
      wrap.style.display = (i <= count) ? '' : 'none';
    }
  }

  // 현재 정답 라디오가 숨겨진 번호인지 확인하여 리셋
  var checkedRadio = document.querySelector('input[name="abQuizCorrectAns"]:checked');
  if (checkedRadio) {
    var checkedVal = parseInt(checkedRadio.value, 10);
    if (checkedVal > count) {
      var r1 = document.getElementById('abAnsRadio1');
      if (r1) r1.checked = true;
      if (q) q.ans = '1';
    }
  }

  saveCurrentAcadQuizDraft();
}

// 문항 폼 로드
function loadAcadQuizForm() {
  var q = editingAcadQuizzes[currentAcadQuizIdx];
  if (!q) return;

  var curSet = editingAcadQuizSets[currentAcadQuizSetIdx];
  var isReadOnly = curSet && !curSet.isMine && (curSet.authorType === 'HQ' || curSet.authorName === '본사' || curSet.authorName === 'A 학원');

  var titleEl = document.getElementById('abCurrentQuizTitle');
  if (titleEl) {
    var modeBadge = isReadOnly
      ? '<span class="badge ml-2" style="background: #fef3c7; color: #b45309; border: 1px solid #fde68a; font-size: 11.5px; padding: 3px 8px; border-radius: 6px; font-weight: 700;"><i class="fa-solid fa-lock mr-1"></i>읽기 전용</span>'
      : '<span class="badge ml-2" style="background: #e8f5e9; color: #2d6a4f; border: 1px solid #c8e6c9; font-size: 11.5px; padding: 3px 8px; border-radius: 6px; font-weight: 700;"><i class="fa-solid fa-pen mr-1"></i>수정 가능</span>';
    titleEl.innerHTML = `<i class="fa-solid fa-circle-question text-warning mr-2" style="font-size: 17px;"></i>문제 ${currentAcadQuizIdx + 1}번 문항 <span class="text-muted ml-1" style="font-size: 13.5px; font-weight: 500;">(${curSet ? curSet.authorName : '퀴즈'})</span> ${modeBadge}`;
  }

  // 문항 유형 (객관식 vs 주관식)
  var qType = q.type || 'CHOICE';
  if (qType === 'SUBJECTIVE') {
    var rSubj = document.getElementById('abQuizTypeSubjective');
    if (rSubj) rSubj.checked = true;
  } else {
    var rChoice = document.getElementById('abQuizTypeChoice');
    if (rChoice) rChoice.checked = true;
  }
  onAcadQuizTypeChanged(qType);

  // 질문
  if (document.getElementById('abQuizQuestion')) document.getElementById('abQuizQuestion').value = q.question || '';

  // 보기 개수 설정: 디폴트 3개 (3지선다 기본)
  var optCount = q.optionCount || (q.opt5 ? 5 : (q.opt4 ? 4 : 3));
  var selOptCount = document.getElementById('abQuizOptionCountSelect');
  if (selOptCount) selOptCount.value = String(optCount);
  changeAcadQuizOptionCount(optCount);

  // 보기 1~5 바인딩
  if (document.getElementById('abOpt1')) document.getElementById('abOpt1').value = q.opt1 || '';
  if (document.getElementById('abOpt2')) document.getElementById('abOpt2').value = q.opt2 || '';
  if (document.getElementById('abOpt3')) document.getElementById('abOpt3').value = q.opt3 || '';
  if (document.getElementById('abOpt4')) document.getElementById('abOpt4').value = q.opt4 || '';
  if (document.getElementById('abOpt5')) document.getElementById('abOpt5').value = q.opt5 || '';

  // 주관식 답안
  if (document.getElementById('abSubjectiveAnswer')) {
    document.getElementById('abSubjectiveAnswer').value = q.subjectiveAnswer || '';
  }

  // 정답 라디오 바인딩
  var ansVal = q.ans || '1';
  var targetRadio = document.querySelector(`input[name="abQuizCorrectAns"][value="${ansVal}"]`);
  if (targetRadio) targetRadio.checked = true;

  // 미디어 데이터 바인딩
  var mediaType = q.mediaType || "none";
  setAcadQuizMediaType(mediaType);

  var capInput = document.getElementById('abMediaCaption');
  if (capInput) capInput.value = q.mediaCaption || '';

  if (mediaType === 'image' && q.mediaUrl) {
    displayAcadQuizImagePreview(q.mediaUrl, q.mediaName || '문제 이미지', q.mediaSizeInfo || 'WebP 최적화');
  } else {
    displayAcadQuizImagePreview('', '', '');
  }

  if (mediaType === 'video' && q.mediaUrl) {
    var urlInput = document.getElementById('abVideoUrlInput');
    if (urlInput) urlInput.value = q.mediaUrl;
    renderAcadQuizVideoPlayer(q.mediaUrl);
  } else {
    var urlInput = document.getElementById('abVideoUrlInput');
    if (urlInput) urlInput.value = '';
    renderAcadQuizVideoPlayer('');
  }

  setAcadQuizFormReadOnly(isReadOnly);
}

// 읽기 전용 폼 제어
function setAcadQuizFormReadOnly(isReadOnly) {
  var fields = ['abQuizQuestion', 'abOpt1', 'abOpt2', 'abOpt3', 'abOpt4', 'abOpt5', 'abVideoUrlInput', 'abMediaCaption', 'abSubjectiveAnswer'];
  fields.forEach(function(id) {
    var el = document.getElementById(id);
    if (el) el.disabled = isReadOnly;
  });

  var radios = document.querySelectorAll('input[name="abQuizCorrectAns"], input[name="abQuizQuestionType"]');
  radios.forEach(function(r) { r.disabled = isReadOnly; });

  var selOpt = document.getElementById('abQuizOptionCountSelect');
  if (selOpt) selOpt.disabled = isReadOnly;

  var btnAdd = document.getElementById('btnAddAcadQuizItem');
  if (btnAdd) btnAdd.style.display = isReadOnly ? 'none' : 'inline-block';

  var btnDel = document.getElementById('btnDeleteAcadQuiz');
  if (btnDel) btnDel.style.display = (isReadOnly || editingAcadQuizzes.length <= 1) ? 'none' : 'inline-block';
}

// 현재 퀴즈 입력 임시 저장
function saveCurrentAcadQuizInput() {
  var curSet = editingAcadQuizSets[currentAcadQuizSetIdx];
  var isReadOnly = curSet && !curSet.isMine && (curSet.authorType === 'HQ' || curSet.authorName === '본사' || curSet.authorName === 'A 학원');
  if (isReadOnly) return;

  var q = editingAcadQuizzes[currentAcadQuizIdx];
  if (!q) return;

  var qTypeChoice = document.getElementById('abQuizTypeChoice');
  q.type = (qTypeChoice && qTypeChoice.checked) ? 'CHOICE' : 'SUBJECTIVE';

  var selOpt = document.getElementById('abQuizOptionCountSelect');
  if (selOpt) q.optionCount = parseInt(selOpt.value, 10);

  if (document.getElementById('abQuizQuestion')) q.question = document.getElementById('abQuizQuestion').value;
  if (document.getElementById('abOpt1')) q.opt1 = document.getElementById('abOpt1').value;
  if (document.getElementById('abOpt2')) q.opt2 = document.getElementById('abOpt2').value;
  if (document.getElementById('abOpt3')) q.opt3 = document.getElementById('abOpt3').value;
  if (document.getElementById('abOpt4')) q.opt4 = document.getElementById('abOpt4').value;
  if (document.getElementById('abOpt5')) q.opt5 = document.getElementById('abOpt5').value;

  if (document.getElementById('abSubjectiveAnswer')) q.subjectiveAnswer = document.getElementById('abSubjectiveAnswer').value;

  var capInput = document.getElementById('abMediaCaption');
  if (capInput) q.mediaCaption = capInput.value;

  var checkedRadio = document.querySelector('input[name="abQuizCorrectAns"]:checked');
  if (checkedRadio) q.ans = checkedRadio.value;
}

function saveCurrentAcadQuizDraft() {
  saveCurrentAcadQuizInput();
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
  var curSet = editingAcadQuizSets[currentAcadQuizSetIdx];
  var isReadOnly = curSet && !curSet.isMine && (curSet.authorType === 'HQ' || curSet.authorName === '본사' || curSet.authorName === 'A 학원');
  if (isReadOnly) {
    showAcademyToast('타 기관 북퀴즈에는 문항을 추가할 수 없습니다.');
    return;
  }

  saveCurrentAcadQuizInput();
  var nextNum = editingAcadQuizzes.length + 1;
  editingAcadQuizzes.push({
    question: "문제를 입력해주세요",
    type: 'CHOICE',
    optionCount: 3,
    mediaType: "none",
    mediaUrl: "",
    mediaCaption: "",
    mediaName: "",
    opt1: "1번 선택지를 입력해주세요",
    opt2: "2번 선택지를 입력해주세요",
    opt3: "3번 선택지를 입력해주세요",
    opt4: "4번 선택지를 입력해주세요",
    opt5: "5번 선택지를 입력해주세요",
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
  var curSet = editingAcadQuizSets[currentAcadQuizSetIdx];
  var isReadOnly = curSet && !curSet.isMine && (curSet.authorType === 'HQ' || curSet.authorName === '본사' || curSet.authorName === 'A 학원');
  if (isReadOnly) {
    showAcademyToast('타 기관 북퀴즈 문항은 삭제할 수 없습니다.');
    return;
  }

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

  var el = curActiveAcadQuizInput;
  var start = el.selectionStart || 0;
  var end = el.selectionEnd || 0;
  var val = el.value || '';
  el.value = val.substring(0, start) + sym + val.substring(end);
  el.selectionStart = el.selectionEnd = start + sym.length;
  el.focus();
  saveCurrentAcadQuizDraft();
}

// 북퀴즈 독립 저장 핸들러
function handleSaveAcademyQuizOnly(event) {
  if (window.NanoPortal && NanoPortal.remote) { if (event) event.preventDefault(); showAcademyToast('학원 자체 퀴즈 등록은 전용 서버 저장 구조가 준비된 뒤 사용할 수 있습니다.'); return; }
  if (event) event.preventDefault();

  saveCurrentAcadQuizInput();

  var book = academyBookList.find(function(b) { return b.id === curQuizTargetBookId; });
  if (!book) {
    showAcademyToast('대상 도서를 찾을 수 없습니다.');
    return;
  }

  book.quizSets = JSON.parse(JSON.stringify(editingAcadQuizSets));
  book.quizList = JSON.parse(JSON.stringify(editingAcadQuizzes));
  book.quizStatus = `${editingAcadQuizzes.length}문항 완비`;

  renderAcademyBookTable();

  // 원생 화면 동기화 반영
  quizDataList = JSON.parse(JSON.stringify(editingAcadQuizzes));
  if (typeof renderQuizTabs === 'function') renderQuizTabs();
  if (typeof loadCurrentQuizForm === 'function') loadCurrentQuizForm();

  showAcademyToast(`[${book.title}] 북퀴즈 문항 세트(${editingAcadQuizzes.length}문항)가 저장 및 동기화되었습니다!`);
  $('#academyQuizManageModal').modal('hide');
}


// 도서 삭제 함수
function deleteAcademyBook(id) {
  if (window.NanoPortal && NanoPortal.remote) { showAcademyToast('운영 도서 삭제는 본사 콘텐츠 관리에서 진행해 주세요.'); return; }
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
 * 관리자(마스터)가 등록한 학원 연락처, 이메일, 주소 및 사용자 저장본 조회 헬퍼
 */
function getAcademyContactInfo() {
  var acadId = currentAcademyInfo.id || currentAcademyInfo.adminId || 'DEFAULT';

  // 1) 원장/학원 관리자가 직접 수정한 로컬 저장본 우선 확인
  try {
    var savedRaw = localStorage.getItem('NANO_MY_INFO_' + acadId);
    if (savedRaw) {
      var saved = JSON.parse(savedRaw);
      if (saved && (saved.phone || saved.email || saved.address)) {
        return {
          phone: saved.phone || '',
          email: saved.email || '',
          postcode: saved.postcode || '',
          address: saved.address || '',
          addressDetail: saved.addressDetail || ''
        };
      }
    }
  } catch(e) {}

  // 2) 마스터(관리자)가 등록/설정한 currentAcademyInfo 데이터 매핑
  var phone = (currentAcademyInfo.phone || '').trim();
  var email = (currentAcademyInfo.email || '').trim();
  var rawAddress = (currentAcademyInfo.address || currentAcademyInfo.region || '').trim();
  var postcode = (currentAcademyInfo.postcode || '').trim();
  var address = rawAddress;
  var addressDetail = (currentAcademyInfo.addressDetail || '').trim();

  // 주소 파싱 보정 (예: "서울 (서울특별시 양천구 오목로 299)" 또는 "(07997) 서울특별시...")
  if (rawAddress) {
    // 괄호 안의 상세 주소 추출
    var parenMatch = rawAddress.match(/^[^(]+\(([^)]+)\)$/);
    if (parenMatch) {
      address = parenMatch[1].trim();
    }
    // 5자리 우편번호 추출
    var postMatch = address.match(/^\(?(\d{5})\)?\s*(.*)$/);
    if (postMatch) {
      if (!postcode) postcode = postMatch[1];
      address = postMatch[2].trim();
    }
  }

  return {
    phone: phone || myAcademyInfo.phone,
    email: email || myAcademyInfo.email,
    postcode: postcode || (phone ? '' : myAcademyInfo.postcode),
    address: address || myAcademyInfo.address,
    addressDetail: addressDetail || (phone ? '' : myAcademyInfo.addressDetail)
  };
}

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

  var curCount = studentDataList.length;
  var maxCount = currentAcademyInfo.maxStudents || 50;
  var slotRate = Math.round((curCount / maxCount) * 100);

  if (elId) elId.innerText = currentAcademyInfo.adminId || currentAcademyInfo.id || myAcademyInfo.id;
  if (elBiz) elBiz.innerText = currentAcademyInfo.bizNumber || myAcademyInfo.bizNumber;
  if (elAcad) elAcad.innerText = currentAcademyInfo.name || myAcademyInfo.academyName;
  var cleanDir = (currentAcademyInfo.director || myAcademyInfo.directorName).replace(/\s*원장님?$/, '');
  if (elDir) elDir.innerText = cleanDir;

  // 이용 상품: 마스터가 지정한 상품명 그대로 표시
  var masterPlanName = currentAcademyInfo.plan || (currentAcademyInfo.isDemo ? '체험형 플랜' : 'Standard');
  if (elPlan) elPlan.innerText = masterPlanName;

  if (elCDate) elCDate.innerText = currentAcademyInfo.contractDate || myAcademyInfo.contractDate;
  if (elEDate) elEDate.innerText = currentAcademyInfo.expireDate || myAcademyInfo.expireDate;

  // 상단 배너 텍스트 및 정원 슬롯 동기화
  var bannerDir = document.getElementById('bannerDirectorName');
  var bannerAcad = document.getElementById('bannerAcademyName');
  if (bannerDir) bannerDir.innerText = cleanDir + ' 원장님';
  if (bannerAcad) bannerAcad.innerText = (currentAcademyInfo.name || myAcademyInfo.academyName);

  var slotEl = document.getElementById('myInfoSlotStatus');
  if (slotEl) slotEl.innerText = curCount + ' / ' + maxCount + '명 (' + slotRate + '%)';

  var sideSlotEl = document.getElementById('sidebarSlotStatus');
  if (sideSlotEl) sideSlotEl.innerHTML = curCount + ' / ' + maxCount + '명 <small class="text-success font-weight-bold">(' + slotRate + '%)</small>';

  // 2) 관리자가 등록한 연락처, 이메일, 학원 주소 값 채우기
  var inputPhone = document.getElementById('myInfoPhone');
  var inputEmail = document.getElementById('myInfoEmail');
  var inputPostcode = document.getElementById('myInfoPostcode');
  var inputAddress = document.getElementById('myInfoAddress');
  var inputDetail = document.getElementById('myInfoAddressDetail');

  var contactInfo = getAcademyContactInfo();

  if (inputPhone) inputPhone.value = contactInfo.phone;
  if (inputEmail) inputEmail.value = contactInfo.email;
  if (inputPostcode) inputPostcode.value = contactInfo.postcode;
  if (inputAddress) inputAddress.value = contactInfo.address;
  if (inputDetail) inputDetail.value = contactInfo.addressDetail;

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

  // 5) 데이터 모델 및 학원 정보 업데이트
  myAcademyInfo.phone = phone;
  myAcademyInfo.email = email;
  myAcademyInfo.postcode = postcode;
  myAcademyInfo.address = address;
  myAcademyInfo.addressDetail = addressDetail;

  currentAcademyInfo.phone = phone;
  currentAcademyInfo.email = email;
  currentAcademyInfo.postcode = postcode;
  currentAcademyInfo.address = address + (addressDetail ? ' ' + addressDetail : '');
  currentAcademyInfo.addressDetail = addressDetail;

  // 학원별 LocalStorage 영구 보존
  var acadId = currentAcademyInfo.id || currentAcademyInfo.adminId || 'DEFAULT';
  try {
    localStorage.setItem('NANO_MY_INFO_' + acadId, JSON.stringify({
      phone: phone,
      email: email,
      postcode: postcode,
      address: address,
      addressDetail: addressDetail
    }));
  } catch(e) {}

  // 마스터 가맹 학원 목록(NANO_MASTER_FRANCHISE_LIST)에도 실시간 동기화 업데이트
  try {
    var rawList = localStorage.getItem('NANO_MASTER_FRANCHISE_LIST');
    if (rawList) {
      var fList = JSON.parse(rawList);
      if (Array.isArray(fList)) {
        var targetF = fList.find(function(f) {
          return (acadId && f.id === acadId) || (f.adminId && f.adminId === currentAcademyInfo.adminId) || (f.name && f.name === currentAcademyInfo.name);
        });
        if (targetF) {
          targetF.phone = phone;
          targetF.email = email;
          targetF.postcode = postcode;
          targetF.address = address;
          targetF.addressDetail = addressDetail;
          targetF.region = address + (addressDetail ? ' ' + addressDetail : '');
          localStorage.setItem('NANO_MASTER_FRANCHISE_LIST', JSON.stringify(fList));
        }
      }
    }
  } catch(e) {}

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
// ==============================================================

// 학원 현재 이용 중인 플랜 정보 (실제 학원 계약 데이터와 실시간 동기화)
var currentAcademyPlan = {
  tier: 'standard',
  name: '스탠다드',
  slots: 50,
  monthlyPrice: 100000,
  startDate: '2025-01-01',
  expiryDate: '2026-12-31',
  expiryDateDot: '2026.12.31',
  nextBillingDate: '2027-01-01',
  nextBillingDateDot: '2027.01.01',
  daysRemaining: 60,
  ddayText: 'D-60'
};

var currentSelectedTier = 'standard';
var currentSelectedPeriod = '6month';
var currentSelectedPayMethod = '신용카드';

// 요금제(Tier) 정의: 원생 정원 규모별
var planTiers = {
  'basic': {
    code: 'basic',
    name: '베이직 (Basic)',
    slots: 25,
    monthlyPrice: 80000,
    rank: 1,
    badgeColor: 'badge-secondary',
    desc: '소규모 학원 및 공부방 최적화'
  },
  'standard': {
    code: 'standard',
    name: '스탠다드 (Standard)',
    slots: 50,
    monthlyPrice: 120000,
    rank: 2,
    badgeColor: 'badge-success',
    desc: '표준 학원 운영에 최적화된 대표 플랜'
  },
  'premium': {
    code: 'premium',
    name: '프리미엄 (Premium)',
    slots: 100,
    monthlyPrice: 180000,
    rank: 3,
    badgeColor: 'badge-warning',
    desc: '원생 확장에 대비하는 중대형 학원 플랜'
  },
  'vip': {
    code: 'vip',
    name: '로열 (Royal)',
    slots: '협의',
    monthlyPrice: 300000,
    rank: 4,
    badgeColor: 'badge-danger',
    desc: '대형 프랜차이즈 및 전문 브랜드'
  }
};

// 매월 25일(주말·공휴일인 경우 다음 평일) 차월 사용분 정기결제일 및 당월 잔여 일수 산출 헬퍼
function getNext25thBillingDateInfo(baseDate) {
  var now = baseDate ? new Date(baseDate.getTime()) : new Date();
  now.setHours(0, 0, 0, 0);
  var pad = function(n) { return n < 10 ? '0' + n : String(n); };

  // 대한민국 주요 양력 공휴일 (MM-DD)
  var fixedHolidays = ['01-01', '03-01', '05-05', '06-06', '08-15', '10-03', '10-09', '12-25'];
  var isHolidayOrWeekend = function(d) {
    var day = d.getDay();
    if (day === 0 || day === 6) return true;
    var mmdd = pad(d.getMonth() + 1) + '-' + pad(d.getDate());
    return fixedHolidays.indexOf(mmdd) !== -1;
  };
  var adjustToNextBusinessDay = function(d) {
    var copy = new Date(d.getTime());
    var shifted = false;
    while (isHolidayOrWeekend(copy)) {
      copy.setDate(copy.getDate() + 1);
      shifted = true;
    }
    return { date: copy, shifted: shifted };
  };

  var year = now.getFullYear();
  var month = now.getMonth();
  var candidate25 = new Date(year, month, 25);
  var adjustedThisMonth = adjustToNextBusinessDay(candidate25);

  var targetBillingObj = adjustedThisMonth.date;
  var wasShifted = adjustedThisMonth.shifted;
  if (now.getTime() > targetBillingObj.getTime()) {
    var nextMonth25 = new Date(year, month + 1, 25);
    var adjustedNextMonth = adjustToNextBusinessDay(nextMonth25);
    targetBillingObj = adjustedNextMonth.date;
    wasShifted = adjustedNextMonth.shifted;
  }

  var billingStr = targetBillingObj.getFullYear() + '-' + pad(targetBillingObj.getMonth() + 1) + '-' + pad(targetBillingObj.getDate());
  var billingDot = billingStr.replace(/-/g, '.');

  // 차월 사용 기간 (다음 달 1일 ~ 말일)
  var usageStartObj = new Date(targetBillingObj.getFullYear(), targetBillingObj.getMonth() + 1, 1);
  var usageEndObj = new Date(targetBillingObj.getFullYear(), targetBillingObj.getMonth() + 2, 0);
  var nextMonthUsageStart = usageStartObj.getFullYear() + '-' + pad(usageStartObj.getMonth() + 1) + '-' + pad(usageStartObj.getDate());
  var nextMonthUsageEnd = usageEndObj.getFullYear() + '-' + pad(usageEndObj.getMonth() + 1) + '-' + pad(usageEndObj.getDate());
  var nextMonthLabel = usageStartObj.getFullYear() + '년 ' + (usageStartObj.getMonth() + 1) + '월분';

  // 이번 달 총 일수 및 오늘 포함 이번 달 남은 일수 (일할 계산용)
  var lastDayOfThisMonth = new Date(year, month + 1, 0);
  var totalDaysInMonth = lastDayOfThisMonth.getDate();
  var remainingDaysInMonth = Math.max(1, totalDaysInMonth - now.getDate() + 1);
  var thisMonthEndStr = year + '-' + pad(month + 1) + '-' + pad(totalDaysInMonth);

  return {
    billingDateStr: billingStr,
    billingDateDot: billingDot,
    wasShifted: wasShifted,
    nextMonthUsageStart: nextMonthUsageStart,
    nextMonthUsageEnd: nextMonthUsageEnd,
    nextMonthLabel: nextMonthLabel,
    totalDaysInMonth: totalDaysInMonth,
    remainingDaysInMonth: remainingDaysInMonth,
    thisMonthEndStr: thisMonthEndStr
  };
}

// 학원 실제 계약 정보(currentAcademyInfo)를 기반으로 결제 관리 상단 카드·요금제 선택 UI를 동기화
function syncCurrentAcademyPlan(resetSelectedTier) {
  if (typeof currentAcademyInfo === 'undefined' || !currentAcademyInfo) return;

  var maxSlots = Number(currentAcademyInfo.maxStudents) || 50;
  var rawPlan = String(currentAcademyInfo.plan || '').trim().toLowerCase();

  // 계약 정원(maxSlots)과 플랜명(plan)을 함께 반영하여 실제 요금제 단계(tierCode) 산출
  var tierCode = 'standard';
  if (rawPlan === 'vip' || rawPlan === 'royal' || rawPlan === '로얄' || rawPlan === '로열' || maxSlots > 100) {
    tierCode = 'vip';
  } else if (maxSlots >= 80 || rawPlan === 'premium' || rawPlan === '프리미엄') {
    tierCode = 'premium';
  } else if (maxSlots <= 25 || rawPlan === 'basic' || rawPlan === '베이직') {
    tierCode = 'basic';
  } else {
    tierCode = 'standard';
  }
  if (maxSlots === 100 && tierCode !== 'vip') {
    tierCode = 'premium';
  } else if (maxSlots === 50 && tierCode !== 'vip') {
    tierCode = 'standard';
  } else if (maxSlots <= 25 && tierCode !== 'vip') {
    tierCode = 'basic';
  }

  // 기본 슬롯 초기화
  planTiers.basic.slots = 25;
  planTiers.standard.slots = 50;
  planTiers.premium.slots = 100;
  planTiers.vip.slots = '협의';
  if (tierCode !== 'vip') {
    planTiers[tierCode].slots = maxSlots;
  }

  var activeTier = planTiers[tierCode];

  // 월 결제액 파싱 (문자열 "180,000원" 또는 숫자 모두 안전하게 처리)
  var parsedFee = parseInt(String(currentAcademyInfo.monthlyFee || '').replace(/[^0-9]/g, ''), 10);
  var displayMonthlyFee = (!isNaN(parsedFee) && parsedFee > 0)
    ? parsedFee
    : Math.round(activeTier.monthlyPrice * 1.1);

  // 시작일·만료일·매월 25일 정기결제일·D-Day 계산
  var startStr = String(currentAcademyInfo.startDate || currentAcademyInfo.contractDate || currentAcademyInfo.joinDate || '2025-01-01').slice(0, 10);
  var endStr = String(currentAcademyInfo.endDate || currentAcademyInfo.expireDate || '2026-12-31').slice(0, 10);
  var endDot = endStr.replace(/-/g, '.');

  var today = new Date();
  today.setHours(0, 0, 0, 0);
  var endDateObj = new Date(endStr + 'T00:00:00');
  if (isNaN(endDateObj.getTime())) {
    endDateObj = new Date('2026-12-31T00:00:00');
  }
  var diffDays = Math.ceil((endDateObj.getTime() - today.getTime()) / 86400000);
  var ddayLabel = diffDays > 0 ? ('D-' + diffDays) : (diffDays === 0 ? 'D-Day' : ('만료 +' + Math.abs(diffDays) + '일'));

  var billingInfo = getNext25thBillingDateInfo(today);

  currentAcademyPlan.tier = tierCode;
  currentAcademyPlan.name = activeTier.name;
  currentAcademyPlan.slots = maxSlots;
  currentAcademyPlan.monthlyPrice = activeTier.monthlyPrice;
  currentAcademyPlan.startDate = startStr;
  currentAcademyPlan.expiryDate = endStr;
  currentAcademyPlan.expiryDateDot = endDot;
  currentAcademyPlan.nextBillingDate = billingInfo.billingDateStr;
  currentAcademyPlan.nextBillingDateDot = billingInfo.billingDateDot;
  currentAcademyPlan.nextMonthLabel = billingInfo.nextMonthLabel;
  currentAcademyPlan.nextMonthUsageStart = billingInfo.nextMonthUsageStart;
  currentAcademyPlan.nextMonthUsageEnd = billingInfo.nextMonthUsageEnd;
  currentAcademyPlan.totalDaysInMonth = billingInfo.totalDaysInMonth;
  currentAcademyPlan.remainingDaysInMonth = billingInfo.remainingDaysInMonth;
  currentAcademyPlan.thisMonthEndStr = billingInfo.thisMonthEndStr;
  currentAcademyPlan.daysRemaining = Math.max(0, diffDays);
  currentAcademyPlan.ddayText = ddayLabel;

  // 1) 상단 요약 카드 1: 현재 요금제 안내
  var payPlanNameEl = document.getElementById('paymentStatPlanName');
  var payPlanFeeEl = document.getElementById('paymentStatPlanFee');
  if (payPlanNameEl) {
    var pendingText = currentAcademyPlan.reservedNextTier
      ? ' <span class="badge-soft badge-soft-warn ml-1" style="font-size: 10.5px; vertical-align: middle;">차월 ' + planTiers[currentAcademyPlan.reservedNextTier].name.split(' ')[0] + ' 예정</span>'
      : '';
    payPlanNameEl.innerHTML = activeTier.name + ' (' + maxSlots + '명) <span class="badge-soft badge-soft-success ml-2" style="font-size: 11px; vertical-align: middle;">이용중</span>' + pendingText;
  }
  if (payPlanFeeEl) {
    payPlanFeeEl.innerHTML = '월 결제액: <strong>' + Number(displayMonthlyFee).toLocaleString() + '원</strong> <small>(VAT 포함)</small>';
  }

  // 2) 상단 요약 카드 2: 서비스 이용 기간 및 만료일 (매월 25일 정기결제 반영)
  var payExpireEl = document.getElementById('paymentStatExpireDday');
  var payStartEl = document.getElementById('paymentStatStartDate');
  var payNextEl = document.getElementById('paymentStatNextDate');
  if (payExpireEl) {
    payExpireEl.style.color = diffDays <= 30 ? '#dc2626' : 'var(--text-main)';
    payExpireEl.innerHTML = ddayLabel + ' <small class="text-muted font-weight-normal" style="font-size: 14px;">(' + endDot + ' 만료)</small>';
  }
  if (payStartEl) {
    payStartEl.innerText = '시작일: ' + startStr;
  }
  if (payNextEl) {
    payNextEl.className = 'font-weight-bold';
    payNextEl.style.color = 'var(--btn-primary)';
    payNextEl.innerText = '정기 결제일: ' + billingInfo.billingDateStr + ' (매월 25일·차월분)';
  }

  // 3) '요금제 선택' 우측 상단 '현재 이용중: ...' 요약 라벨 및 드롭박스 옵션 텍스트 갱신
  var summaryLabelEl = document.getElementById('currentPlanSummaryLabel');
  if (summaryLabelEl) {
    var displaySlotText = (tierCode === 'vip') ? (maxSlots > 0 ? maxSlots + '명 (협의)' : '협의') : (maxSlots + '명');
    summaryLabelEl.innerHTML = '현재 이용중: <strong>' + activeTier.name + ' (' + displaySlotText + ')</strong>';
  }

  var dropdownEl = document.getElementById('planTierSelectDropdown');
  if (dropdownEl) {
    var optionLabels = {
      basic: '베이직 · ' + planTiers.basic.slots + '명 · 88,000원 / 월',
      standard: '스탠다드 · ' + planTiers.standard.slots + '명 · 132,000원 / 월',
      premium: '프리미엄 · ' + planTiers.premium.slots + '명 · 198,000원 / 월',
      vip: '로열 · 정원 협의 · 330,000원 / 월'
    };
    Array.from(dropdownEl.options).forEach(function(opt) {
      var code = opt.value;
      if (optionLabels[code]) {
        opt.text = optionLabels[code] + (code === tierCode ? ' [현재 이용중]' : '');
      }
    });
  }

  // 4) 자동갱신 상태 및 선택 요금제 상세·카카오톡 충전 카드 동기화
  if (typeof updateAutoRenewUI === 'function') {
    updateAutoRenewUI();
  }
  if (resetSelectedTier || !currentSelectedTier || currentSelectedTier === 'kakao') {
    currentSelectedTier = tierCode;
  }
  if (typeof selectPlanTier === 'function') {
    selectPlanTier(currentSelectedTier);
  }
  if (typeof updateKakaoTopupCardUI === 'function') {
    updateKakaoTopupCardUI();
  }
}

// 구독 기간 정의 (매월 25일 차월 사용분 정기결제)
var periodDefinitions = {
  'monthly': {
    code: 'monthly',
    name: '월 정기구독 (차월 사용분)',
    shortName: '1개월',
    periodMonths: 1,
    discountRate: 0,
    badge: '월 정기구독 (매월 25일 자동결제)',
    desc: '매월 25일(공휴일 시 다음 평일) 차월 사용분 정기결제'
  }
};

var currentKakaoTopupQty = 1;
var currentUpgradeApplyTiming = 'now'; // 'now' (지금 바로 적용 - 일할 차액 결제) | 'next_month' (차월부터 적용 - 추가 결제 없음)
var currentCheckoutMode = 'monthly';   // 'monthly' | 'upgrade_now' | 'kakao'

function updateKakaoTopupCardUI() {
  var qty = Math.max(1, Number(currentKakaoTopupQty) || 1);
  var kakaoSupply = qty * 5000;
  var kakaoVat = qty * 500;
  var kakaoTotal = qty * 5500;
  var approxCount = Math.floor((qty * 50000) / 85);

  var input = document.getElementById('kakaoTopupQtyInput');
  if (input && Number(input.value) !== qty) input.value = String(qty);

  var creditSummary = document.getElementById('kakaoCreditSummaryText');
  if (creditSummary) {
    creditSummary.innerText = Number(kakaoSupply).toLocaleString() + '원 충전 · ' + Number(approxCount).toLocaleString() + '건 발송 가능';
  }
  var supplyEl = document.getElementById('kakaoTopupSupplyText');
  if (supplyEl) supplyEl.innerText = Number(kakaoSupply).toLocaleString() + '원';
  var vatEl = document.getElementById('kakaoTopupVatText');
  if (vatEl) vatEl.innerText = Number(kakaoVat).toLocaleString() + '원';
  var totalEl = document.getElementById('kakaoTopupTotalText');
  if (totalEl) totalEl.innerText = Number(kakaoTotal).toLocaleString() + '원';
  var btnEl = document.getElementById('btnKakaoTopupSubmit');
  if (btnEl) {
    btnEl.innerHTML = Number(kakaoTotal).toLocaleString() + '원 충전 결제';
  }
}

function changeKakaoTopupQty(delta) {
  var next = (Number(currentKakaoTopupQty) || 1) + Number(delta || 0);
  if (next < 1) next = 1;
  if (next > 100) next = 100;
  currentKakaoTopupQty = next;
  updateKakaoTopupCardUI();
}

function onKakaoTopupQtyInput(val) {
  var next = parseInt(val, 10);
  if (isNaN(next) || next < 1) next = 1;
  if (next > 100) next = 100;
  currentKakaoTopupQty = next;
  updateKakaoTopupCardUI();
}

function openKakaoTopupCheckout() {
  openCheckoutModal('kakao');
}

function onUpgradeTimingChange(timing) {
  currentUpgradeApplyTiming = (timing === 'next_month') ? 'next_month' : 'now';
  var rNow = document.getElementById('radioUpgradeNow');
  var rNext = document.getElementById('radioUpgradeNextMonth');
  var lNow = document.getElementById('labelUpgradeTimingNow');
  var lNext = document.getElementById('labelUpgradeTimingNext');
  if (rNow) rNow.checked = (currentUpgradeApplyTiming === 'now');
  if (rNext) rNext.checked = (currentUpgradeApplyTiming === 'next_month');
  if (lNow) {
    lNow.style.border = (currentUpgradeApplyTiming === 'now') ? '1.5px solid #dc2626' : '1px solid #e2e8f0';
    lNow.style.background = (currentUpgradeApplyTiming === 'now') ? '#ffffff' : '#f8fafc';
  }
  if (lNext) {
    lNext.style.border = (currentUpgradeApplyTiming === 'next_month') ? '1.5px solid #5a4b3d' : '1px solid #e2e8f0';
    lNext.style.background = (currentUpgradeApplyTiming === 'next_month') ? '#ffffff' : '#f8fafc';
  }
  selectPlanTier(currentSelectedTier);
}

// 당월 남은 일수 일할 차액 계산 헬퍼 (업그레이드 '지금 바로 적용' 선택 시)
function calculateUpgradeProratedDiff(targetTier) {
  var billingInfo = getNext25thBillingDateInfo();
  var totalDays = billingInfo.totalDaysInMonth || 30;
  var remainDays = billingInfo.remainingDaysInMonth || 1;
  var currentMonthlySupply = Number(currentAcademyPlan.monthlyPrice) || 120000;
  var targetMonthlySupply = Number(targetTier.monthlyPrice) || 180000;
  var monthlySupplyDiff = Math.max(0, targetMonthlySupply - currentMonthlySupply);

  var proratedSupply = Math.round((monthlySupplyDiff * remainDays) / totalDays);
  var proratedVat = Math.round(proratedSupply * 0.1);
  var proratedTotal = proratedSupply + proratedVat;

  return {
    monthlySupplyDiff: monthlySupplyDiff,
    totalDays: totalDays,
    remainDays: remainDays,
    proratedSupply: proratedSupply,
    proratedVat: proratedVat,
    proratedTotal: proratedTotal,
    billingInfo: billingInfo
  };
}

// 요금제(Tier 4종) 드롭박스 선택 시 우측 설명·비용·버튼 업데이트 함수
function selectPlanTier(tierCode) {
  if (tierCode === 'kakao') { openKakaoTopupCheckout(); return; }
  var tier = planTiers[tierCode] || planTiers.standard;
  currentSelectedTier = tier.code;
  var dropdown = document.getElementById('planTierSelectDropdown');
  if (dropdown) dropdown.value = tier.code;
  var billing = getNext25thBillingDateInfo();
  var currentRank = planTiers[currentAcademyPlan.tier].rank;
  var upgrade = tier.rank > currentRank;
  var downgrade = tier.rank < currentRank;
  var immediate = upgrade && currentUpgradeApplyTiming === 'now';
  var deferred = downgrade || (upgrade && !immediate);
  var supply = tier.monthlyPrice;
  var vat = Math.round(supply * 0.1);
  var regularTotal = supply + vat;
  var amount = deferred ? 0 : regularTotal;
  var note = '매월 25일에 다음 달 이용료를 결제합니다. 휴일이면 다음 평일에 결제됩니다.';
  var action = '정기결제 등록';
  var status = '현재 이용 중';
  if (immediate) {
    var prorated = calculateUpgradeProratedDiff(tier);
    supply = prorated.proratedSupply;
    vat = prorated.proratedVat;
    amount = prorated.proratedTotal;
    note = '결제 후 즉시 적용 · 이번 달 남은 ' + prorated.remainDays + '일의 차액입니다.';
    action = Number(amount).toLocaleString() + '원 결제 후 적용';
    status = '즉시 변경';
  } else if (deferred) {
    note = '이번 달은 현재 요금제를 유지하고, 다음 달부터 변경합니다. 지금 추가 결제는 없습니다.';
    action = '다음 달 요금제 변경 신청';
    status = '다음 달 적용';
  }
  var setText = function(id, value) { var el = document.getElementById(id); if (el) el.textContent = value; };
  var timing = document.getElementById('upgradeTimingOptionWrap');
  if (timing) timing.style.display = upgrade ? 'block' : 'none';
  var cancel = document.getElementById('btnCancelAutoRenewAction');
  if (cancel) cancel.style.display = !upgrade && !downgrade ? 'block' : 'none';
  setText('selectedPlanStatusChip', status);
  setText('planTierPolicyNoticeBox', note);
  setText('supplyPriceLabelText', immediate ? '이번 달 일할 차액' : '월 공급가액');
  setText('vatPriceLabelText', '부가세 (10%)');
  setText('periodPrice_monthly', Number(supply).toLocaleString() + '원');
  setText('pgMonthlyVatText', Number(vat).toLocaleString() + '원');
  var total = document.getElementById('periodVatPrice_monthly');
  if (total) total.innerHTML = '<span>' + (deferred || immediate ? '지금 결제할 금액' : '월 결제 금액') + ' <small>(부가세 포함)</small></span><strong>' + Number(amount).toLocaleString() + '원</strong>';
  setText('nextBillingDateSummaryText', billing.billingDateDot + ' · ' + Number(regularTotal).toLocaleString() + '원 / 월');
  var button = document.getElementById('btnPeriodSubmit_monthly');
  if (button) { button.className = 'payment-action'; button.textContent = action; }
}

// 우측 메인 액션 버튼 클릭 핸들러 (동일 요금제 결제 등록 / 다운그레이드 무결제 변경신청 / 업그레이드 즉시 일할결제 or 차월 무결제 변경신청)
function handlePlanPrimaryAction() {
  var tier = planTiers[currentSelectedTier] || planTiers['standard'];
  var currentRank = planTiers[currentAcademyPlan.tier].rank;
  var targetRank = tier.rank;

  if (targetRank < currentRank) {
    submitPlanChangeWithoutPayment('downgrade');
    return;
  }
  if (targetRank > currentRank) {
    if (currentUpgradeApplyTiming === 'next_month') {
      submitPlanChangeWithoutPayment('upgrade_next_month');
    } else {
      openCheckoutModal('upgrade_now');
    }
    return;
  }
  openCheckoutModal('monthly');
}

// 추가 결제 없이 차월분 요금제 변경 신청만 완료하는 함수 (다운그레이드 / 업그레이드 '차월부터 적용')
function submitPlanChangeWithoutPayment(changeMode) {
  var tier = planTiers[currentSelectedTier] || planTiers['standard'];
  var billingInfo = getNext25thBillingDateInfo();
  var regularSupply = tier.monthlyPrice;
  var regularVat = Math.round(regularSupply * 0.1);
  var regularTotal = regularSupply + regularVat;
  var isDowngrade = (changeMode === 'downgrade');
  var modeLabel = isDowngrade ? '다운그레이드' : '업그레이드 (차월부터 적용)';

  var confirmMsg = '[' + tier.name + ' (' + (tier.slots === '협의' ? '정원 협의' : tier.slots + '명 슬롯') + ')] 요금제로 ' + modeLabel + ' 변경을 신청하시겠습니까?\n\n' +
    '• 적용 시점: 차월 사용분(' + billingInfo.nextMonthLabel + ')부터 적용\n' +
    '• 지금 결제 금액: 0원 (추가 결제 없음)\n' +
    '• 차월 정기결제일: ' + billingInfo.billingDateStr + ' (매월 25일, 공휴일 시 다음 평일)\n' +
    '• 차월부터 결제될 정액: 월 ' + Number(regularTotal).toLocaleString() + '원 (VAT 포함)';

  if (!confirm(confirmMsg)) return;

  currentAcademyPlan.reservedNextTier = tier.code;

  var now = new Date();
  var pad = function(n) { return n < 10 ? '0' + n : n; };
  var dateStr = now.getFullYear() + '-' + pad(now.getMonth() + 1) + '-' + pad(now.getDate()) + ' ' +
                pad(now.getHours()) + ':' + pad(now.getMinutes()) + ':' + pad(now.getSeconds());
  var newId = 'CHG-' + now.getFullYear() + pad(now.getMonth() + 1) + pad(now.getDate()) + '-' + Math.floor(100 + Math.random() * 900);

  academyPaymentList.unshift({
    id: newId,
    planType: tier.code + '_next_month',
    planName: '[' + tier.name + '] 차월 요금제 ' + (isDowngrade ? '다운그레이드' : '업그레이드') + ' 신청 (추가결제 없음)',
    supply: 0,
    vat: 0,
    total: 0,
    method: '변경 신청 완료 (차월 25일 ' + Number(regularTotal).toLocaleString() + '원 자동결제)',
    date: dateStr,
    startDate: billingInfo.nextMonthUsageStart,
    endDate: billingInfo.nextMonthUsageEnd,
    status: 'pending'
  });

  renderAcademyPaymentTable(academyPaymentList);
  syncCurrentAcademyPlan(false);

  showAcademyToast('📅 [' + tier.name + '] 차월 요금제 변경 신청이 추가 결제 없이 완료되었습니다. (' + billingInfo.billingDateDot + '부터 적용)');
  alert('✅ 요금제 변경 신청이 완료되었습니다!\n\n' +
        '· 신청 구분: ' + modeLabel + '\n' +
        '· 변경 요금제: ' + tier.name + ' (' + (tier.slots === '협의' ? '정원 협의' : tier.slots + '명 슬롯') + ')\n' +
        '· 지금 결제 금액: 0원 (추가 결제 없음)\n' +
        '· 차월 정기결제일: ' + billingInfo.billingDateStr + ' (매월 25일)\n' +
        '· 차월 정액 결제액: ' + Number(regularTotal).toLocaleString() + '원 (VAT 포함)\n\n' +
        '이번 달은 기존 요금제가 유지되며, 차월 사용분부터 변경된 요금제로 자동 적용됩니다.');
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
if (window.NANO_SERVER_DATA) academyPaymentList = (window.NANO_SERVER_PAYMENTS || []).filter(function(item) { return item.academyId === currentAcademyInfo.id; });

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

// ==============================================================
// 11. 정기 결제 자동 갱신 ON/OFF 및 구독 배너 제어
// ==============================================================
var isAutoRenewActive = true;

function toggleAutoRenew() {
  isAutoRenewActive = !isAutoRenewActive;
  updateAutoRenewUI();
  if (isAutoRenewActive) {
    showAcademyToast('정기 결제 자동 갱신이 활성화되었습니다. 만료일에 맞추어 자동으로 연장 결제됩니다.');
  } else {
    showAcademyToast('정기 결제 자동 갱신이 해제되었습니다. 만료일 전 수동 연장이 필요합니다.');
  }
}

function updateAutoRenewUI() {
  var toggleContainer = document.getElementById('autoRenewToggleContainer');
  if (toggleContainer) {
    if (isAutoRenewActive) {
      toggleContainer.innerHTML = '<button type="button" class="btn btn-xs btn-outline-success font-weight-bold" onclick="toggleAutoRenew()" style="border-radius:6px; padding:2px 8px;"><i class="fa-solid fa-toggle-on mr-1"></i>자동갱신 ON</button>';
    } else {
      toggleContainer.innerHTML = '<button type="button" class="btn btn-xs btn-outline-secondary font-weight-bold" onclick="toggleAutoRenew()" style="border-radius:6px; padding:2px 8px;"><i class="fa-solid fa-toggle-off mr-1"></i>자동갱신 OFF</button>';
    }
  }

  var expDot = currentAcademyPlan.expiryDateDot || String(currentAcademyPlan.expiryDate || '2026-12-31').replace(/-/g, '.');
  var expDash = currentAcademyPlan.expiryDate || '2026-12-31';
  var ddayLabel = currentAcademyPlan.ddayText || ('D-' + currentAcademyPlan.daysRemaining);
  var remainDays = currentAcademyPlan.daysRemaining || 0;

  // 사이드바 뱃지 업데이트
  var navPaymentBadge = document.querySelector('#btn-nav-payment .badge');
  if (navPaymentBadge) {
    if (isAutoRenewActive) {
      navPaymentBadge.className = 'badge badge-success text-white ml-1';
      navPaymentBadge.style.background = '#16a34a';
      navPaymentBadge.innerText = '구독중';
    } else {
      navPaymentBadge.className = 'badge badge-danger text-white ml-1';
      navPaymentBadge.style.background = '#dc2626';
      navPaymentBadge.innerText = ddayLabel;
    }
  }

  // 상단 만료 안내 배너 업데이트 (우측 결제 내역 관리 버튼은 표시하지 않음)
  var banner = document.getElementById('paymentExpireAlertBanner');
  var iconWrap = document.getElementById('paymentAlertIconWrap');
  var titleEl = document.getElementById('paymentAlertTitle');
  var descEl = document.getElementById('paymentAlertDesc');
  var btnWrap = document.getElementById('paymentAlertBtnWrap');
  var cancelActionBtn = document.getElementById('btnCancelAutoRenewAction');

  if (btnWrap) btnWrap.innerHTML = '';
  if (cancelActionBtn) {
    if (isAutoRenewActive) {
      cancelActionBtn.className = 'payment-secondary';
      cancelActionBtn.textContent = '자동갱신 해지';
    } else {
      cancelActionBtn.className = 'payment-secondary';
      cancelActionBtn.textContent = '자동갱신 다시 켜기';
    }
  }

  if (!banner || !titleEl || !descEl) return;

  if (isAutoRenewActive) {
    banner.style.display = 'flex';
    banner.style.background = '#f0fdf4';
    banner.style.borderColor = '#bbf7d0';
    banner.style.color = '#166534';
    if (iconWrap) {
      iconWrap.style.background = '#dcfce7';
      iconWrap.style.color = '#16a34a';
      iconWrap.innerHTML = '<i class="fa-solid fa-circle-check"></i>';
    }
    titleEl.innerHTML = '<span class="badge badge-success mr-2" style="font-size:11.5px; padding:4px 8px; background:#16a34a;">정기 구독 이용 중</span> 정기 결제 구독 중 <strong style="color:#15803d;">(자동 갱신 ON)</strong> - ' + remainDays + '일 후(' + expDot + ') 자동 갱신 결제됩니다.';
    descEl.innerText = '등록된 결제 수단으로 만료일에 맞춰 자동 연장되며, 자동갱신을 취소하거나 본사에서 해지 처리하면 자동결제가 종료됩니다.';
  } else {
    banner.style.display = 'flex';
    banner.style.background = '#fff7ed';
    banner.style.borderColor = '#fed7aa';
    banner.style.color = '#9a3412';
    if (iconWrap) {
      iconWrap.style.background = '#ffedd5';
      iconWrap.style.color = '#ea580c';
      iconWrap.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i>';
    }
    titleEl.innerHTML = '<span class="badge badge-danger mr-2" style="font-size:11.5px; padding:4px 8px;">자동갱신 해지됨</span> 정기 자동결제가 종료 예정입니다. 만료일(' + expDash + ', ' + ddayLabel + ')까지 이용 후 자동결제가 종료됩니다.';
    descEl.innerText = '원장님 또는 본사 요청으로 자동 갱신이 해제되었습니다. 계속 이용하시려면 자동갱신을 다시 켜거나 카드를 재등록해 주세요.';
  }
}

// 만료 알림 상태 시뮬레이션 (D-3 / D-7 / normal)
function setExpireAlert(type) {
  var banner = document.getElementById('paymentExpireAlertBanner');
  var iconWrap = document.getElementById('paymentAlertIconWrap');
  var titleEl = document.getElementById('paymentAlertTitle');
  var descEl = document.getElementById('paymentAlertDesc');
  var btnWrap = document.getElementById('paymentAlertBtnWrap');
  if (!banner || !titleEl || !descEl) return;

  var expDash = currentAcademyPlan.expiryDate || '2026-12-31';

  if (type === 'd3') {
    isAutoRenewActive = false;
    banner.style.display = 'flex';
    banner.style.background = '#fff7ed';
    banner.style.borderColor = '#fed7aa';
    banner.style.color = '#9a3412';
    if (iconWrap) {
      iconWrap.style.background = '#ffedd5';
      iconWrap.style.color = '#ea580c';
      iconWrap.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i>';
    }
    titleEl.innerHTML = '<span class="badge badge-danger mr-2" style="font-size:11.5px; padding:4px 8px;">D-3 만료 임박</span> 나노의 책장 서비스 이용 기간이 <strong style="color:#c2410c;">3일 후</strong> 만료됩니다! (만료 예정일: ' + expDash + ')';
    descEl.innerText = '자동 갱신이 해제되어 있습니다. 원활한 원생 학습 및 북퀴즈 서비스를 위해 이용권을 미리 연장해 주세요.';
    if (btnWrap) {
      btnWrap.innerHTML = '<button type="button" class="btn btn-sm btn-danger px-3 py-2 font-weight-bold" onclick="scrollToPlans()" style="border-radius:10px; white-space:nowrap; box-shadow:0 2px 8px rgba(220,53,69,0.3);"><i class="fa-solid fa-bolt mr-1"></i>지금 바로 연장하기</button>';
    }
    showAcademyToast('만료 3일 전(D-3) 알림 상태로 시뮬레이션 전환되었습니다.');
  } else if (type === 'd7') {
    isAutoRenewActive = false;
    banner.style.display = 'flex';
    banner.style.background = '#fefce8';
    banner.style.borderColor = '#fef08a';
    banner.style.color = '#854d0e';
    if (iconWrap) {
      iconWrap.style.background = '#fef9c3';
      iconWrap.style.color = '#ca8a04';
      iconWrap.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i>';
    }
    titleEl.innerHTML = '<span class="badge badge-warning text-dark mr-2" style="font-size:11.5px; padding:4px 8px;">D-7 만료 사전 안내</span> 나노의 책장 서비스 이용 기간이 <strong style="color:#a16207;">7일 후</strong> 만료됩니다. (만료 예정일: ' + expDash + ')';
    descEl.innerText = '학원 정기 구독 갱신 안내 알림톡이 발송되었습니다. 미리 이용권을 연장하시면 기존 커리큘럼 및 원생 포트폴리오가 끊김 없이 보존됩니다.';
    if (btnWrap) {
      btnWrap.innerHTML = '<button type="button" class="btn btn-sm btn-warning text-dark px-3 py-2 font-weight-bold" onclick="scrollToPlans()" style="border-radius:10px; white-space:nowrap;"><i class="fa-solid fa-bolt mr-1"></i>이용권 미리 연장</button>';
    }
    showAcademyToast('만료 7일 전(D-7) 사전 안내 상태로 시뮬레이션 전환되었습니다.');
  } else {
    isAutoRenewActive = true;
    updateAutoRenewUI();
    showAcademyToast('정상 정기구독(자동 갱신 ON) 상태로 전환되었습니다.');
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

// 결제 신청 모달 열기 (카카오톡 1회성 충전 결제 / 업그레이드 즉시 적용 일할 차액 결제 / 차월 사용분 정기결제 등록 분기)
function openCheckoutModal(modeCode) {
  currentCheckoutMode = modeCode || 'monthly';
  var isKakao = (currentCheckoutMode === 'kakao');
  var isUpgradeNow = (currentCheckoutMode === 'upgrade_now');

  var modalTitleEl = document.getElementById('checkoutModalTitle');
  var modalAcadEl = document.getElementById('checkoutModalAcademyName');
  var kcpGuideTitle = document.getElementById('checkoutKcpGuideTitle');
  var kcpGuideDesc = document.getElementById('checkoutKcpGuideDesc');
  var kcpStep3 = document.getElementById('checkoutKcpStep3Label');
  var badgeEl = document.getElementById('checkoutPlanBadge');
  var typeBadgeEl = document.getElementById('checkoutChangeTypeBadge');
  var policyDescEl = document.getElementById('checkoutChangePolicyDesc');
  var supplyEl = document.getElementById('checkoutPlanSupply');
  var vatEl = document.getElementById('checkoutPlanVat');
  var totalEl = document.getElementById('checkoutPlanTotal');
  var submitBtnTextEl = document.getElementById('btnSubmitPaymentText');

  if (modalAcadEl && typeof currentAcademyInfo !== 'undefined' && currentAcademyInfo) {
    var cleanDir = String(currentAcademyInfo.director || '').replace(/\s*원장님?$/, '');
    modalAcadEl.innerText = (currentAcademyInfo.name || '가맹 학원') + (cleanDir ? ' (원장: ' + cleanDir + ')' : '');
  }

  // [A] 카카오톡 알림 (1회성 충전 구매)
  if (isKakao) {
    var qty = Math.max(1, Number(currentKakaoTopupQty) || 1);
    var kakaoSupply = qty * 5000;
    var kakaoVat = qty * 500;
    var kakaoTotal = qty * 5500;
    var approxCount = Math.floor((qty * 50000) / 85);

    if (modalTitleEl) modalTitleEl.innerText = 'NHN KCP 카카오톡 알림 1회성 충전';
    if (kcpGuideTitle) kcpGuideTitle.innerHTML = '<i class="fa-solid fa-comment-sms mr-1 text-primary"></i>NHN KCP 1회성 단건 결제 (비구독형 선불 충전)';
    if (kcpGuideDesc) kcpGuideDesc.innerHTML = '카카오톡 알림 충전은 <strong>정기구독(매월 25일 자동결제) 상품이 아닌 1회성 구매 상품</strong>입니다. 결제 즉시 <strong>' + Number(kakaoSupply).toLocaleString() + '원</strong>이 학원 알림톡 지갑에 적립됩니다.';
    if (kcpStep3) kcpStep3.innerHTML = '<strong class="text-success">STEP 3</strong><br>알림톡 잔액 즉시 적립';
    if (badgeEl) badgeEl.innerText = '카카오톡 알림 · ' + qty + '단위 (1회성 충전)';
    if (typeBadgeEl) {
      typeBadgeEl.className = 'badge-soft badge-soft-warn font-weight-bold';
      typeBadgeEl.innerHTML = '<i class="fa-solid fa-coins mr-1"></i>1회성 선불 충전 (자동결제 없음)';
    }
    if (policyDescEl) {
      policyDescEl.innerHTML =
        '<div class="font-weight-bold mb-1" style="color: #b45309;"><i class="fa-solid fa-circle-check mr-1"></i>1회성 알림톡 충전 조건</div>' +
        '• 결제 금액 <strong>' + Number(kakaoTotal).toLocaleString() + '원(VAT 포함)</strong> 중 공급가 <strong>' + Number(kakaoSupply).toLocaleString() + '원</strong>이 적립됩니다.<br>' +
        '• 약 <strong>' + Number(approxCount).toLocaleString() + '건</strong> 발송 가능하며(건당 8.5원), 잔액 소진 시까지 만료 기한 없이 유지됩니다.';
    }
    if (supplyEl) supplyEl.innerText = Number(kakaoSupply).toLocaleString() + '원 (적립 금액)';
    if (vatEl) vatEl.innerText = Number(kakaoVat).toLocaleString() + '원';
    if (totalEl) totalEl.innerText = Number(kakaoTotal).toLocaleString() + '원';
    if (submitBtnTextEl) submitBtnTextEl.innerText = Number(kakaoTotal).toLocaleString() + '원 충전 결제하기';

    selectPayMethod('신용카드');
    $('#paymentCheckoutModal').modal('show');
    return;
  }

  var tier = planTiers[currentSelectedTier] || planTiers['standard'];
  var billingInfo = getNext25thBillingDateInfo();
  var nextBillingDot = billingInfo.billingDateDot;
  var regularSupply = tier.monthlyPrice;
  var regularVat = Math.round(regularSupply * 0.1);
  var regularTotal = regularSupply + regularVat;

  // [B] 업그레이드 — 지금 바로 적용 (이번 달 남은 일수에 대한 일할 차액 결제 + 차월 25일부터 업그레이드 정액 결제)
  if (isUpgradeNow) {
    var prorated = calculateUpgradeProratedDiff(tier);

    if (modalTitleEl) modalTitleEl.innerText = 'NHN KCP 요금제 즉시 업그레이드 (일할 차액 결제)';
    if (kcpGuideTitle) kcpGuideTitle.innerHTML = '<i class="fa-solid fa-bolt mr-1 text-danger"></i>이번 달 잔여 일수 일할 차액 결제 및 차월 정액결제 안내';
    if (kcpGuideDesc) {
      kcpGuideDesc.innerHTML =
        '이번 달 남은 <strong>' + prorated.remainDays + '일분 차액(' + Number(prorated.proratedTotal).toLocaleString() + '원, VAT 포함)</strong>을 지금 결제하면 즉시 <strong>' + tier.name + '(' + tier.slots + '명)</strong>으로 상향 적용되며, 차월 정기결제일(<strong>' + nextBillingDot + '</strong>, 매월 25일)부터는 <strong>월 ' + Number(regularTotal).toLocaleString() + '원</strong>이 정액 결제됩니다.';
    }
    if (kcpStep3) kcpStep3.innerHTML = '<strong class="text-success">STEP 3</strong><br>즉시 상향 & 차월 정액 등록';
    if (badgeEl) badgeEl.innerText = tier.name + ' (' + tier.slots + '명) · 즉시 업그레이드';
    if (typeBadgeEl) {
      typeBadgeEl.className = 'badge-soft badge-soft-danger font-weight-bold';
      typeBadgeEl.innerHTML = '<i class="fa-solid fa-bolt mr-1"></i>당월 잔여 ' + prorated.remainDays + '일 일할 차액 결제';
    }
    if (policyDescEl) {
      policyDescEl.innerHTML =
        '<div class="text-danger font-weight-bold mb-1"><i class="fa-solid fa-circle-check mr-1"></i>업그레이드 즉시 적용 및 차월 정액결제 조건</div>' +
        '• <strong>당월 일할 차액</strong>: 월 공급가 차액(' + Number(prorated.monthlySupplyDiff).toLocaleString() + '원) × 남은 ' + prorated.remainDays + '일 / 당월 ' + prorated.totalDays + '일 = <strong>' + Number(prorated.proratedSupply).toLocaleString() + '원</strong> (+ 부가세 ' + Number(prorated.proratedVat).toLocaleString() + '원)<br>' +
        '• <strong>즉시 적용</strong>: 결제 즉시 가맹 원생 정원이 <strong>' + currentAcademyPlan.slots + '명 ➔ ' + tier.slots + '명</strong>으로 상향 적용됩니다.<br>' +
        '• <strong>차월 정액 결제</strong>: 차월 정기결제일(<strong>' + nextBillingDot + '</strong>, 매월 25일·공휴일 시 다음 평일)부터 업그레이드된 요금제 정액 <strong>' + Number(regularTotal).toLocaleString() + '원(VAT 포함)</strong>으로 자동 결제됩니다.';
    }
    if (supplyEl) supplyEl.innerText = Number(prorated.proratedSupply).toLocaleString() + '원 (당월 ' + prorated.remainDays + '일 일할 차액)';
    if (vatEl) vatEl.innerText = Number(prorated.proratedVat).toLocaleString() + '원';
    if (totalEl) totalEl.innerText = Number(prorated.proratedTotal).toLocaleString() + '원';
    if (submitBtnTextEl) submitBtnTextEl.innerText = '일할 차액 ' + Number(prorated.proratedTotal).toLocaleString() + '원 결제 및 즉시 적용';

    selectPayMethod('신용카드');
    $('#paymentCheckoutModal').modal('show');
    return;
  }

  // [C] 동일 요금제 차월 사용분 정기결제 등록 (매월 25일 자동결제)
  currentSelectedPeriod = 'monthly';

  if (modalTitleEl) modalTitleEl.innerText = 'NHN KCP 차월 사용분 정기결제 등록';
  if (kcpGuideTitle) kcpGuideTitle.innerHTML = '<i class="fa-solid fa-shield-halved mr-1 text-primary"></i>NHN KCP 정기결제 등록 (매월 25일 차월분 자동결제)';
  if (kcpGuideDesc) {
    kcpGuideDesc.innerHTML =
      '사용자가 결제하는 금액은 <strong>차월 사용분(' + billingInfo.nextMonthLabel + ')</strong>에 대한 금액입니다. 정기 자동결제는 항상 <strong>매월 25일(공휴일·주말인 경우 다음 평일)</strong>에 이루어지며, 학원 또는 본사에서 취소 시 자동결제가 종료됩니다.';
  }
  if (kcpStep3) kcpStep3.innerHTML = '<strong class="text-success">STEP 3</strong><br>매월 25일 정기결제 등록';

  var displayBadge = tier.name + ' (' + tier.slots + '명) · 차월분 정기결제';
  if (badgeEl) badgeEl.innerText = displayBadge;

  if (typeBadgeEl) {
    typeBadgeEl.className = 'badge-soft badge-soft-success font-weight-bold';
    typeBadgeEl.innerHTML = '<i class="fa-solid fa-arrows-rotate mr-1"></i>차월 사용분 정기결제 (매월 25일)';
  }
  if (policyDescEl) {
    policyDescEl.innerHTML =
      '<div class="text-success font-weight-bold mb-1"><i class="fa-solid fa-circle-check mr-1"></i>차월 사용분 정기결제 안내</div>' +
      '• <strong>적용 대상 기간</strong>: 차월 사용분 (' + billingInfo.nextMonthUsageStart.replace(/-/g, '.') + ' ~ ' + billingInfo.nextMonthUsageEnd.replace(/-/g, '.') + ')<br>' +
      '• <strong>정기 자동결제일</strong>: 매월 25일 (공휴일·주말인 경우 다음 평일, 차기 예정일: <strong>' + nextBillingDot + '</strong>)<br>' +
      '• 원장님 또는 본사에서 자동갱신을 취소하면 다음 결제일부터 자동결제가 즉시 종료됩니다.';
  }

  if (supplyEl) supplyEl.innerText = Number(regularSupply).toLocaleString() + '원';
  if (vatEl) vatEl.innerText = Number(regularVat).toLocaleString() + '원';
  if (totalEl) totalEl.innerText = Number(regularTotal).toLocaleString() + '원';
  if (submitBtnTextEl) submitBtnTextEl.innerText = Number(regularTotal).toLocaleString() + '원 정기결제 등록하기';

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

// 결제 신청 제출 (카카오톡 1회성 충전 / 업그레이드 당월 일할 차액 결제 / 차월 사용분 정기결제 등록)
async function submitSimulatedPayment() {
  var agree = document.getElementById('checkoutAgreeTerms');
  if (agree && !agree.checked) {
    alert('이용약관 및 결제 취소/환불 규정에 동의하셔야 결제 신청이 가능합니다.');
    return;
  }

  // [A] 카카오톡 알림 1회성 충전 결제 처리
  if (currentCheckoutMode === 'kakao') {
    var qty = Math.max(1, Number(currentKakaoTopupQty) || 1);
    var kakaoSupply = qty * 5000;
    var kakaoVat = qty * 500;
    var kakaoTotal = qty * 5500;

    if (window.NanoPortal && NanoPortal.remote) {
      try {
        await NanoPortal.api('/api/billing', {
          operation: 'topup',
          amount: kakaoTotal,
          requestId: crypto.randomUUID()
        }, 45000);
        $('#paymentCheckoutModal').modal('hide');
        if (window.NanoBilling && typeof NanoBilling.load === 'function') {
          await NanoBilling.load();
        }
        showAcademyToast('카카오톡 알림 ' + qty + '단위(' + Number(kakaoTotal).toLocaleString() + '원) 충전 신청이 접수되었습니다.');
      } catch (e) {
        showAcademyToast(e.message || '충전 신청 중 오류가 발생했습니다.');
      }
      return;
    }

    var nowK = new Date();
    var padK = function(n) { return n < 10 ? '0' + n : n; };
    var dateStrK = nowK.getFullYear() + '-' + padK(nowK.getMonth() + 1) + '-' + padK(nowK.getDate()) + ' ' +
                   padK(nowK.getHours()) + ':' + padK(nowK.getMinutes()) + ':' + padK(nowK.getSeconds());
    var newKakaoId = 'PAY-' + nowK.getFullYear() + padK(nowK.getMonth() + 1) + padK(nowK.getDate()) + '-' + Math.floor(100 + Math.random() * 900);
    academyPaymentList.unshift({
      id: newKakaoId,
      planType: 'kakao',
      planName: '카카오톡 알림 충전 (' + qty + '단위 · 1회성)',
      supply: kakaoSupply,
      vat: kakaoVat,
      total: kakaoTotal,
      method: currentSelectedPayMethod + ' (NHN KCP 1회성 결제)',
      date: dateStrK,
      startDate: '—',
      endDate: '소진 시까지',
      status: 'paid'
    });
    renderAcademyPaymentTable(academyPaymentList);
    $('#paymentCheckoutModal').modal('hide');
    showAcademyToast('💬 카카오톡 알림 ' + Number(kakaoSupply).toLocaleString() + '원이 1회성 충전되었습니다.');
    return;
  }

  if (window.NanoPortal && NanoPortal.remote) {
    $('#paymentCheckoutModal').modal('hide');
    showAcademyToast('NHN KCP 정기결제 가맹점 심사 완료 후 실시간 카드 빌링 결제가 연결됩니다.');
    return;
  }

  var tier = planTiers[currentSelectedTier] || planTiers['standard'];
  var billingInfo = getNext25thBillingDateInfo();
  var regularSupply = tier.monthlyPrice;
  var regularVat = Math.round(regularSupply * 0.1);
  var regularTotal = regularSupply + regularVat;

  var now = new Date();
  var pad = function(n) { return n < 10 ? '0' + n : n; };
  var todayStr = now.getFullYear() + '-' + pad(now.getMonth() + 1) + '-' + pad(now.getDate());
  var dateStr = todayStr + ' ' + pad(now.getHours()) + ':' + pad(now.getMinutes()) + ':' + pad(now.getSeconds());
  var newId = 'PAY-' + now.getFullYear() + pad(now.getMonth() + 1) + pad(now.getDate()) + '-' + Math.floor(100 + Math.random() * 900);

  // [B] 업그레이드 — 지금 바로 적용 (당월 남은 일수 일할 차액 결제 + 즉시 요금제 적용 + 차월부터 업그레이드 요금제 정액 결제)
  if (currentCheckoutMode === 'upgrade_now') {
    var prorated = calculateUpgradeProratedDiff(tier);

    var newPayment = {
      id: newId,
      planType: tier.code + '_upgrade_prorated',
      planName: '[' + tier.name + ' ' + tier.slots + '명] 즉시 업그레이드 (당월 잔여 ' + prorated.remainDays + '일 일할 차액)',
      supply: prorated.proratedSupply,
      vat: prorated.proratedVat,
      total: prorated.proratedTotal,
      method: currentSelectedPayMethod + ' (즉시 적용 · 차월 25일 정액결제)',
      date: dateStr,
      startDate: todayStr,
      endDate: billingInfo.thisMonthEndStr,
      status: 'paid'
    };

    academyPaymentList.unshift(newPayment);
    renderAcademyPaymentTable(academyPaymentList);

    // 학원 현재 요금제 및 슬롯 즉시 상향 적용
    delete currentAcademyPlan.reservedNextTier;
    currentAcademyInfo.maxStudents = tier.slots === '협의' ? 150 : tier.slots;
    currentAcademyInfo.plan = tier.code === 'vip' ? 'VIP' : (tier.code === 'premium' ? 'Premium' : (tier.code === 'basic' ? 'Basic' : 'Standard'));
    currentAcademyInfo.monthlyFee = regularTotal + '원';
    updateAllStudentCounts();
    syncCurrentAcademyPlan(true);

    $('#paymentCheckoutModal').modal('hide');

    showAcademyToast('🎉 [' + tier.name + '] 즉시 적용 완료! 당월 일할 차액(' + Number(prorated.proratedTotal).toLocaleString() + '원)이 결제되었습니다.');
    alert('⚡ 요금제 즉시 업그레이드 완료!\n\n' +
          '· 변경 요금제: ' + tier.name + ' (' + (tier.slots === '협의' ? '정원 협의' : tier.slots + '명 슬롯') + ')\n' +
          '· 당월 일할 차액 결제액: ' + Number(prorated.proratedTotal).toLocaleString() + '원 (이번 달 남은 ' + prorated.remainDays + '일분, VAT 포함)\n' +
          '· 차월 정기결제일: ' + billingInfo.billingDateStr + ' (매월 25일, 공휴일 시 다음 평일)\n' +
          '· 차월부터 정액 결제될 금액: 월 ' + Number(regularTotal).toLocaleString() + '원 (VAT 포함)\n\n' +
          '지금 바로 업그레이드된 요금제가 적용되었으며, 차월부터는 업그레이드된 요금제로 정액 결제됩니다.');
  } else {
    // [C] 차월 사용분 정기결제 등록 (매월 25일 자동결제)
    var newPayment = {
      id: newId,
      planType: tier.code + '_monthly',
      planName: '[' + tier.name + '] 차월 사용분(' + billingInfo.nextMonthLabel + ') 정기결제 등록',
      supply: regularSupply,
      vat: regularVat,
      total: regularTotal,
      method: currentSelectedPayMethod + ' (매월 25일 정기결제)',
      date: dateStr,
      startDate: billingInfo.nextMonthUsageStart,
      endDate: billingInfo.nextMonthUsageEnd,
      status: 'paid'
    };

    academyPaymentList.unshift(newPayment);
    renderAcademyPaymentTable(academyPaymentList);
    isAutoRenewActive = true;
    updateAutoRenewUI();

    $('#paymentCheckoutModal').modal('hide');

    showAcademyToast('✅ [' + tier.name + '] 차월 사용분 정기결제 등록이 완료되었습니다.');
    alert('✅ 차월 사용분 정기결제 등록 완료!\n\n' +
          '· 등록 요금제: ' + tier.name + ' (' + (tier.slots === '협의' ? '정원 협의' : tier.slots + '명 슬롯') + ')\n' +
          '· 적용 대상: 차월 사용분 (' + billingInfo.nextMonthUsageStart + ' ~ ' + billingInfo.nextMonthUsageEnd + ')\n' +
          '· 정기 결제 금액: 월 ' + Number(regularTotal).toLocaleString() + '원 (VAT 포함)\n' +
          '· 정기 결제일: 매월 25일 (공휴일 시 다음 평일, 예정일: ' + billingInfo.billingDateStr + ')');
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

  var acadDisplay = (typeof currentAcademyInfo !== 'undefined' && currentAcademyInfo && currentAcademyInfo.name)
    ? currentAcademyInfo.name + (currentAcademyInfo.director ? ' (대표: ' + String(currentAcademyInfo.director).replace(/\s*원장님?$/, '') + ')' : '')
    : '나노 독서아카데미 본원';

  alert('🧾 [전자 결제 영수증 / 매출전표]\n\n' +
        '· 승인번호: ' + item.id + '\n' +
        '· 학원명: ' + acadDisplay + '\n' +
        '· 결제일시: ' + item.date + '\n' +
        '· 상품명: ' + item.planName + '\n' +
        '· 공급가액: ' + Number(item.supply).toLocaleString() + '원\n' +
        '· 부가가치세: ' + Number(item.vat).toLocaleString() + '원\n' +
        '· 합계금액: ' + Number(item.total).toLocaleString() + '원\n' +
        '· 결제수단: ' + item.method + '\n' +
        '· 결제상태: 정상 승인 (VAT 매입세액공제 가능)');
}

// 이용약관 · 개인정보처리방침 · 환불/취소/청약철회 정책 모달 열기 및 탭 전환
function switchAdminLegalTab(tabKey) {
  var validKey = ['terms', 'privacy', 'refund'].indexOf(tabKey) !== -1 ? tabKey : 'terms';
  ['terms', 'privacy', 'refund'].forEach(function(k) {
    var btn = document.getElementById('btnAdminLegalTab_' + k);
    var sec = document.getElementById('adminLegalSection_' + k);
    if (btn) {
      if (k === validKey) {
        btn.style.background = 'var(--btn-primary)';
        btn.style.color = '#ffffff';
        btn.style.border = '1px solid var(--btn-primary)';
      } else {
        btn.style.background = '#ffffff';
        btn.style.color = 'var(--text-main)';
        btn.style.border = '1px solid var(--border-medium)';
      }
    }
    if (sec) {
      sec.style.display = (k === validKey) ? 'block' : 'none';
    }
  });
}

function openNanoLegalModal(tabKey) {
  switchAdminLegalTab(tabKey || 'terms');
  if (typeof $ !== 'undefined' && $('#adminLegalPolicyModal').length) {
    $('#adminLegalPolicyModal').modal('show');
  }
}

// ==============================================================
// 본사 시스템 공지사항 연동 및 관리자 로그인/접속 팝업 모듈
// ==============================================================
const defaultAcademySystemNotices = [
  {
    id: "NOT-1004",
    title: "[안내] 2026 가을맞이 신규 필독서 120종 업데이트 및 북퀴즈 출제 완료",
    target: "전체",
    category: "신규 도서 입고",
    isPopup: false,
    popupStartDate: "",
    popupEndDate: "",
    isPinned: true,
    status: "게시중",
    createdAt: "2026-09-28",
    content: "안녕하세요. 나노의 책장 본사 운영팀입니다.\n\n2026년도 2학기를 맞아 초등 및 중등 대상 교과 연계 필독도서 120종이 신규 등록되었으며, 각 도서별 문해력 5문항 북퀴즈 및 어휘 풀이가 완비되었습니다.\n\n각 가맹 학원에서는 [도서 배정] 메뉴에서 신규 도서를 확인하시고 원생들에게 추천 도서로 배정해 주시기 바랍니다.\n감사합니다.",
    link: ""
  },
  {
    id: "NOT-1003",
    title: "[긴급] 정기 시스템 서버 안정화 및 인프라 점검 안내 (10/05 02:00~06:00)",
    target: "가맹 학원",
    category: "시스템 점검",
    isPopup: true,
    popupStartDate: "2026-10-01",
    popupEndDate: "2026-10-05",
    isPinned: true,
    status: "게시중",
    createdAt: "2026-09-25",
    content: "안정적인 북퀴즈 응시 및 대용량 독서 리포트 데이터 처리를 위한 클라우드 인프라 확장 점검이 진행될 예정입니다.\n\n■ 점검 일시: 2026년 10월 5일(월) 새벽 02:00 ~ 06:00 (약 4시간)\n■ 영향 범위: 점검 시간 동안 전체 플랫폼 접속 및 북퀴즈 응시 일시 중단\n\n원활한 서비스 제공을 위해 새벽 시간대에 진행되오니 원장님 및 지도교사 분들의 너른 양해 부탁드립니다.",
    link: ""
  },
  {
    id: "NOT-1001",
    title: "[안내] 가맹 학원 관리자 대시보드 리포트 발송 편의 기능 개선 배포",
    target: "가맹 학원",
    category: "서비스 업데이트",
    isPopup: false,
    popupStartDate: "",
    popupEndDate: "",
    isPinned: false,
    status: "게시중",
    createdAt: "2026-09-10",
    content: "학원 관리자 페이지에서 학부모 알림톡 리포트 발송 시, 학급별 일괄 전송 및 개별 발송 미리보기 기능이 한층 업그레이드되었습니다.\n\n또한 원생 삭제 시 실수 방지를 위한 2단계 원장님 비밀번호 인증 및 7일 임시 보존 기능이 적용되었습니다.",
    link: ""
  }
];

function getAcademySystemNotices() {
  var localCached = [];
  try {
    const raw = localStorage.getItem("NANO_MASTER_SYSTEM_NOTICES");
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) localCached = parsed;
    }
  } catch (e) {}

  if (window.NANO_SERVER_DATA) {
    return (window.NANO_SERVER_NOTICES || [])
      .map(function(sn) {
        var ln = localCached.find(function(x) { return (x.id && x.id === sn.id) || (x.title && x.title === sn.title); });
        if (!ln) return sn;
        return Object.assign({}, sn, {
          popupStartDate: sn.popupStartDate || ln.popupStartDate || "",
          popupEndDate: sn.popupEndDate || ln.popupEndDate || "",
          isPopup: typeof sn.isPopup === "boolean" ? sn.isPopup : !!ln.isPopup,
          status: sn.status || ln.status || "게시중",
          target: sn.target || ln.target || "전체",
          category: sn.category || ln.category || "일반 공지",
          link: sn.link || ln.link || ""
        });
      })
      .filter(function(n) {
        return n.status !== '비공개' && (!n.target || n.target === '전체' || n.target === '가맹 학원' || n.target === '원장' || n.target === '선생님');
      });
  }
  if (localCached.length > 0) {
    return localCached.filter(n => n.status === '게시중' && (n.target === '전체' || n.target === '가맹 학원'));
  }
  return defaultAcademySystemNotices;
}

// 본사 공지 읽음 처리 (공지 메뉴 클릭 시 호출)
function markAcademyNoticesAsRead() {
  try {
    const notices = getAcademySystemNotices();
    const noticeIds = notices.map(n => String(n.id || n.title || ''));
    localStorage.setItem('NANO_ACADEMY_NOTICES_READ_IDS', JSON.stringify(noticeIds));
    localStorage.setItem('NANO_ACADEMY_NOTICES_READ_TIME', Date.now().toString());
  } catch (e) {}

  const sidebarBadge = document.getElementById('sidebarNoticeCountBadge');
  const badge = document.getElementById('academyNoticeCountBadge');
  if (sidebarBadge) sidebarBadge.style.display = 'none';
  if (badge) badge.style.display = 'none';
}

// 읽지 않은 본사 공지 수 계산
function getUnreadAcademyNoticeCount() {
  const notices = getAcademySystemNotices();
  if (!notices || notices.length === 0) return 0;

  try {
    const rawReadIds = localStorage.getItem('NANO_ACADEMY_NOTICES_READ_IDS');
    if (rawReadIds) {
      const readIds = JSON.parse(rawReadIds);
      if (Array.isArray(readIds)) {
        const unread = notices.filter(n => !readIds.includes(String(n.id || n.title || '')));
        return unread.length;
      }
    }
  } catch (e) {}

  return notices.length;
}

function updateAcademyNoticeBadge(forceZeroUnread) {
  const badge = document.getElementById('academyNoticeCountBadge');
  const sidebarBadge = document.getElementById('sidebarNoticeCountBadge');
  const viewBadge = document.getElementById('noticeViewTotalCountBadge');
  const notices = getAcademySystemNotices();
  const totalCount = notices.length;
  const unreadCount = forceZeroUnread ? 0 : getUnreadAcademyNoticeCount();

  if (badge) {
    badge.innerText = unreadCount;
    badge.style.display = unreadCount > 0 ? 'inline-block' : 'none';
  }
  if (sidebarBadge) {
    sidebarBadge.innerText = unreadCount;
    sidebarBadge.style.display = unreadCount > 0 ? 'inline-block' : 'none';
  }
  if (viewBadge) {
    viewBadge.innerText = `게시 중 공지 ${totalCount}건`;
  }
}

// 메인 작업 공간(view-notice) 공지사항 카드 목록 렌더링
function renderAcademyNoticeViewList() {
  const notices = getAcademySystemNotices();
  const container = document.getElementById('academyNoticeViewContainer');
  // 공지사항 탭에 진입했으므로 읽음 처리 및 뱃지 숫자 즉시 제거
  markAcademyNoticesAsRead();
  updateAcademyNoticeBadge(true);
  if (!container) return;

  if (notices.length === 0) {
    container.innerHTML = `
      <div class="simple-card p-5 text-center text-muted">
        <i class="fa-solid fa-bullhorn fa-3x mb-3 text-secondary" style="opacity: 0.5;"></i>
        <h5 class="font-weight-bold text-dark mb-1">등록된 본사 공지사항이 없습니다.</h5>
        <p class="mb-0" style="font-size: 13px;">새로운 본사 소식이나 공지사항이 등록되면 이곳에 실시간으로 표시됩니다.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = notices.map(n => {
    const isPinnedBadge = n.isPinned ? '<span class="badge badge-danger mr-1" style="font-size: 11px; font-weight: 800;"><i class="fa-solid fa-thumbtack mr-1"></i>필독</span>' : '';
    const catBadge = '<span class="badge badge-light border text-muted mr-1" style="font-size: 11px;">' + (n.category || '공지') + '</span>';
    const targetBadge = '<span class="badge badge-info mr-1" style="font-size: 10.5px;">' + n.target + '</span>';
    const popupBadge = n.isPopup ? '<span class="badge badge-warning text-dark ml-1" style="font-size: 10.5px;"><i class="fa-solid fa-window-restore mr-1"></i>팝업 공지</span>' : '';
    const contentFormatted = (n.content || '').replace(/\n/g, '<br>');
    const linkHtml = (n.link && n.link.trim()) ? `<div class="mt-3 pt-2 border-top"><a href="${n.link}" target="_blank" class="btn btn-sm btn-outline-primary font-weight-bold" style="font-size: 12px; border-radius: 6px;"><i class="fa-solid fa-arrow-up-right-from-square mr-1"></i>관련 안내 링크 바로가기</a></div>` : '';

    return `
      <div class="simple-card mb-3" style="border-radius: 14px; overflow: hidden; border: 1px solid var(--border-medium);">
        <div class="p-3 bg-white d-flex align-items-center justify-content-between flex-wrap gap-2" style="border-bottom: 1px solid var(--border-light);">
          <div class="d-flex align-items-center flex-wrap" style="gap: 5px;">
            ${isPinnedBadge}
            ${catBadge}
            ${targetBadge}
            ${popupBadge}
            <h5 class="font-weight-bold mb-0 ml-1" style="font-size: 15px; color: var(--text-main);">${n.title}</h5>
          </div>
          <div class="d-flex align-items-center gap-2">
            <span class="text-muted" style="font-size: 12px;"><i class="fa-regular fa-clock mr-1"></i>${n.createdAt || ''}</span>
          </div>
        </div>
        <div class="p-3.5 px-4" style="background: #faf8f5;">
          <div style="font-size: 13.5px; color: var(--text-main); line-height: 1.75; white-space: normal; word-break: break-word;">
            ${contentFormatted}
          </div>
          ${linkHtml}
        </div>
      </div>
    `;
  }).join('');
}

function checkAcademyNoticePopups() {
  const notices = getAcademySystemNotices();
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  const todayStr = yyyy + '-' + mm + '-' + dd;

  const activePopups = notices.filter(n => {
    if (!n.isPopup) return false;
    if (n.popupStartDate && n.popupStartDate > todayStr) return false;
    if (n.popupEndDate && n.popupEndDate < todayStr) return false;
    const hideKey = "NANO_HIDE_ADMIN_POPUP_" + n.id;
    if (localStorage.getItem(hideKey) === todayStr) return false;
    return true;
  });

  if (activePopups.length === 0) return;

  const targetNotice = activePopups[0];
  showAcademyNoticePopup(targetNotice);
}

function showAcademyNoticePopup(not) {
  const modal = document.getElementById('academyNoticePopupModal');
  if (!modal) return;

  const catBadge = document.getElementById('anpCatBadge');
  const title = document.getElementById('anpTitle');
  const date = document.getElementById('anpDate');
  const content = document.getElementById('anpContent');
  const linkBox = document.getElementById('anpLinkBox');
  const chk = document.getElementById('anpDoNotShowToday');

  if (catBadge) catBadge.innerText = not.category || '본사 시스템 공지';
  if (title) title.innerText = not.title;
  if (date) date.innerText = not.createdAt || '';
  if (content) content.innerHTML = (not.content || '').replace(/\n/g, '<br>');
  if (chk) chk.checked = false;

  if (linkBox) {
    if (not.link && not.link.trim()) {
      linkBox.style.display = 'block';
      linkBox.innerHTML = '<a href="' + not.link + '" target="_blank" class="btn btn-sm btn-outline-warning text-dark font-weight-bold" style="font-size: 12px; border-radius: 6px;"><i class="fa-solid fa-arrow-up-right-from-square mr-1"></i>관련 안내 링크 바로가기</a>';
    } else {
      linkBox.style.display = 'none';
    }
  }

  modal.setAttribute('data-current-notice-id', not.id);
  if (window.jQuery && typeof $('#academyNoticePopupModal').modal === 'function') {
    $('#academyNoticePopupModal').modal('show');
  } else {
    modal.style.display = 'block';
    modal.classList.add('show');
  }
}

function closeAcademyNoticePopup() {
  const modal = document.getElementById('academyNoticePopupModal');
  if (!modal) return;
  const notId = modal.getAttribute('data-current-notice-id');
  const chk = document.getElementById('anpDoNotShowToday');
  if (chk && chk.checked && notId) {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const todayStr = yyyy + '-' + mm + '-' + dd;
    localStorage.setItem("NANO_HIDE_ADMIN_POPUP_" + notId, todayStr);
  }
  if (window.jQuery && typeof $('#academyNoticePopupModal').modal === 'function') {
    $('#academyNoticePopupModal').modal('hide');
  } else {
    modal.style.display = 'none';
    modal.classList.remove('show');
  }
}

function openAcademyNoticeListModal() {
  const notices = getAcademySystemNotices();
  const listEl = document.getElementById('academyNoticeListContainer');
  if (!listEl) return;

  if (notices.length === 0) {
    listEl.innerHTML = '<div class="text-center py-5 text-muted"><i class="fa-solid fa-bullhorn fa-2x mb-2" style="color: #cbd5e1;"></i><p class="mb-0 font-weight-bold" style="font-size: 13.5px;">등록된 본사 공지사항이 없습니다.</p></div>';
  } else {
    listEl.innerHTML = notices.map(n => {
      const isPinnedBadge = n.isPinned ? '<span class="badge badge-danger mr-1" style="font-size: 10.5px; font-weight: 800;"><i class="fa-solid fa-thumbtack mr-1"></i>필독</span>' : '';
      const catBadge = '<span class="badge badge-light border text-muted mr-1" style="font-size: 11px;">' + (n.category || '공지') + '</span>';
      const targetBadge = '<span class="badge badge-info" style="font-size: 10.5px;">' + n.target + '</span>';
      const popupBadge = n.isPopup ? '<span class="badge badge-warning text-dark ml-1" style="font-size: 10.5px;"><i class="fa-solid fa-window-restore mr-1"></i>팝업</span>' : '';
      const contentFormatted = (n.content || '').replace(/\n/g, '<br>');
      const linkHtml = (n.link && n.link.trim()) ? '<div class="mt-2"><a href="' + n.link + '" target="_blank" class="text-primary font-weight-bold" style="font-size: 12px;"><i class="fa-solid fa-link mr-1"></i>참고 링크 바로가기</a></div>' : '';

      return '<div class="card mb-3 border-beige shadow-sm" style="border-radius: 12px; overflow: hidden;">'
        + '<div class="card-header bg-white d-flex align-items-center justify-content-between flex-wrap py-2 px-3" style="border-bottom: 1px solid var(--border-light);">'
        +   '<div class="d-flex align-items-center flex-wrap" style="gap: 5px;">'
        +     isPinnedBadge
        +     catBadge
        +     targetBadge
        +     popupBadge
        +     '<strong style="font-size: 14px; color: var(--text-main);" class="ml-1">' + n.title + '</strong>'
        +   '</div>'
        +   '<small class="text-muted">' + (n.createdAt || '') + '</small>'
        + '</div>'
        + '<div class="card-body py-3 px-3" style="background: #faf8f5;">'
        +   '<div style="font-size: 13px; color: var(--text-main); line-height: 1.65; white-space: normal; word-break: break-word;">'
        +     contentFormatted
        +   '</div>'
        +   linkHtml
        + '</div>'
        + '</div>';
    }).join('');
  }

  if (window.jQuery && typeof $('#academyNoticeListModal').modal === 'function') {
    $('#academyNoticeListModal').modal('show');
  } else {
    const modal = document.getElementById('academyNoticeListModal');
    if (modal) { modal.style.display = 'block'; modal.classList.add('show'); }
  }
}

// 본사 마스터에서 공지사항 저장 시 실시간 동기화
window.addEventListener('storage', function(e) {
  if (e.key === 'NANO_MASTER_SYSTEM_NOTICES') {
    updateAcademyNoticeBadge();
    checkAcademyNoticePopups();
  }
});

// 초기 로드 시 공지 배지 및 팝업 점검 & 구독 자동갱신 UI 초기화
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function() {
    updateAcademyNoticeBadge();
    checkAcademyNoticePopups();
    if (typeof updateAutoRenewUI === 'function') updateAutoRenewUI();
  });
} else {
  updateAcademyNoticeBadge();
  checkAcademyNoticePopups();
  if (typeof updateAutoRenewUI === 'function') updateAutoRenewUI();
}



// 보안 나노시트 인쇄 (실제 렌더링된 A4 캔버스 + 워터마크 고화질 출력)
function printNanoSheetViewer() {
  var canvas = document.getElementById('pdfViewerCanvas');
  var realWrapper = document.getElementById('realPdfViewerWrapper');

  if (!canvas || !realWrapper || realWrapper.style.display === 'none') {
    window.print();
    return;
  }

  var imgData = canvas.toDataURL('image/png');
  var acadName = (document.getElementById('wmAcademyName') ? document.getElementById('wmAcademyName').innerText : '나노 독서아카데미 목동본원');
  var printTime = (document.getElementById('wmPrintTime') ? document.getElementById('wmPrintTime').innerText : new Date().toISOString().slice(0, 16).replace('T', ' '));
  var ipAddr = (document.getElementById('wmIpAddress') ? document.getElementById('wmIpAddress').innerText : '118.235.12.89');

  var printWin = window.open('', '_blank', 'width=850,height=1100');
  if (!printWin) {
    window.print();
    return;
  }

  printWin.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>나노 시트 보안 출력 - ${acadName}</title>
  <style>
    @page { size: A4 portrait; margin: 0; }
    * { box-sizing: border-box; }
    body { margin: 0; padding: 0; display: flex; justify-content: center; align-items: center; background: #fff; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    .sheet-wrapper { position: relative; width: 100%; max-width: 210mm; min-height: 297mm; overflow: hidden; background: #fff; }
    img.sheet-canvas-img { width: 100%; height: auto; display: block; }
    .wm-overlay {
      position: absolute; top: 0; left: 0; width: 100%; height: 100%;
      pointer-events: none; z-index: 10;
      display: flex; flex-direction: column; justify-content: space-around; align-items: center;
      user-select: none;
    }
    .wm-block {
      transform: rotate(-28deg); opacity: 0.16; font-weight: 900; text-align: center; color: #000;
      line-height: 1.4; user-select: none; margin: 35px 0;
    }
    .wm-title { font-size: 22px; letter-spacing: -0.5px; color: #1e293b; }
    .wm-sub { font-size: 14.5px; font-family: monospace; color: #334155; }
    .wm-warn { font-size: 11px; color: #dc2626; font-weight: 800; margin-top: 2px; }
  </style>
</head>
<body>
  <div class="sheet-wrapper">
    <img src="${imgData}" class="sheet-canvas-img" />
    <div class="wm-overlay">
      <div class="wm-block">
        <div class="wm-title">${acadName}</div>
        <div class="wm-sub">${printTime} &middot; IP: ${ipAddr}</div>
        <div class="wm-warn">[보안 인가 문서] 무단 복제 및 캡처 배포 금지</div>
      </div>
      <div class="wm-block">
        <div class="wm-title">${acadName}</div>
        <div class="wm-sub">${printTime} &middot; IP: ${ipAddr}</div>
        <div class="wm-warn">[보안 인가 문서] 무단 복제 및 캡처 배포 금지</div>
      </div>
      <div class="wm-block">
        <div class="wm-title">${acadName}</div>
        <div class="wm-sub">${printTime} &middot; IP: ${ipAddr}</div>
        <div class="wm-warn">[보안 인가 문서] 무단 복제 및 캡처 배포 금지</div>
      </div>
    </div>
  </div>
  <script>
    window.onload = function() {
      setTimeout(function() {
        window.print();
        setTimeout(function() { window.close(); }, 500);
      }, 300);
    };
  </script>
</body>
</html>`);
  printWin.document.close();
}


// ==============================================================
// [신규] 나노시트 2~3p 사진 촬영/업로드 & Gemini 3.8 Flash 첨삭 AI
// ==============================================================
var currentWorksheetPhotos = [];
var currentWorksheetAiResult = null;

// 이미지 파일 압축 헬퍼 (Canvas 리사이징: 최대 1600px, JPEG 0.85로 300~500KB 최적화)
function compressWorksheetImage(file) {
  return new Promise(function(resolve, reject) {
    var reader = new FileReader();
    reader.onload = function(e) {
      var img = new Image();
      img.onload = function() {
        var maxDim = 1600;
        var w = img.width;
        var h = img.height;
        if (w > maxDim || h > maxDim) {
          if (w > h) {
            h = Math.round((h * maxDim) / w);
            w = maxDim;
          } else {
            w = Math.round((w * maxDim) / h);
            h = maxDim;
          }
        }
        var canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        var ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
        // 나노시트 첨삭 사진을 WebP(품질 0.85)로 변환 (미지원 브라우저는 JPEG 폴백)
        var dataUrl = '';
        var mimeType = 'image/webp';
        try {
          dataUrl = canvas.toDataURL('image/webp', 0.85);
          if (!dataUrl.startsWith('data:image/webp')) {
            dataUrl = canvas.toDataURL('image/jpeg', 0.85);
            mimeType = 'image/jpeg';
          }
        } catch(e) {
          dataUrl = canvas.toDataURL('image/jpeg', 0.85);
          mimeType = 'image/jpeg';
        }
        var base64 = dataUrl.split(',')[1];
        resolve({
          name: file.name.replace(/\.[^.]+$/, '') + (mimeType === 'image/webp' ? '.webp' : '.jpg'),
          dataUrl: dataUrl,
          base64: base64,
          mimeType: mimeType
        });
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// 사진 파일 선택 핸들러
async function handleWorksheetImagesSelect(input) {
  if (!input.files || input.files.length === 0) return;
  var files = Array.from(input.files);
  if (currentWorksheetPhotos.length + files.length > 3) {
    alert('나노시트 사진은 2~3페이지(최대 3장)까지 등록할 수 있습니다.');
  }
  var filesToProcess = files.slice(0, 3 - currentWorksheetPhotos.length);
  for (var i = 0; i < filesToProcess.length; i++) {
    try {
      var compressed = await compressWorksheetImage(filesToProcess[i]);
      currentWorksheetPhotos.push(compressed);
    } catch(err) {
      console.warn('이미지 압축 실패:', err);
    }
  }
  input.value = '';
  renderWorksheetPhotoThumbnails();
}

// 사진 썸네일 미리보기 UI 렌더링
function renderWorksheetPhotoThumbnails() {
  var container = document.getElementById('worksheetUploadThumbnails');
  var badge = document.getElementById('worksheetPhotoCountBadge');
  syncWorksheetCorrectionActions();
  if (!container) return;

  if (currentWorksheetPhotos.length === 0) {
    container.style.display = 'none';
    if (badge) badge.innerText = '0장 선택됨';

    return;
  }

  container.style.display = 'flex';
  if (badge) badge.innerText = currentWorksheetPhotos.length + '장 등록됨';


  container.innerHTML = currentWorksheetPhotos.map(function(photo, idx) {
    return `
      <div class="position-relative d-inline-block border rounded p-1 bg-white shadow-sm" style="width: 82px;">
        <img src="${photo.dataUrl}" alt="시트 ${idx + 1}" style="width: 72px; height: 72px; object-fit: cover; border-radius: 4px; cursor: pointer;" onclick="openWorksheetPhotoLightbox('${photo.dataUrl}')">
        <button type="button" class="btn btn-xs btn-danger position-absolute" style="top: -6px; right: -6px; width: 20px; height: 20px; padding: 0; border-radius: 50%; font-size: 10px;" onclick="removeWorksheetPhoto(${idx})">&times;</button>
        <div class="text-center text-muted mt-1" style="font-size: 10px; font-weight: 600;">${idx + 1}p 시트</div>
      </div>
    `;
  }).join('');
}

// 썸네일 삭제
function removeWorksheetPhoto(idx) {
  currentWorksheetPhotos.splice(idx, 1);
  renderWorksheetPhotoThumbnails();
}

// 썸네일 원본 확대 라이트박스
function openWorksheetPhotoLightbox(src) {
  var w = window.open('', '_blank');
  if (w) {
    w.document.write('<html><head><title>나노시트 원본 사진</title></head><body style="margin:0;background:#111;display:flex;align-items:center;justify-content:center;height:100vh;"><img src="' + src + '" style="max-width:98%;max-height:98%;object-fit:contain;box-shadow:0 8px 30px rgba(0,0,0,0.5);"></body></html>');
  }
}

// 나노시트 분석은 백그라운드에서 저장하고 완료 화면에서 항목별로 수정합니다.
async function runWorksheetAiAnalysis() {
  if (currentWorksheetCorrectionDone || worksheetCorrectionSaving || worksheetAnalysisJobs.has(currentOpenCorrectionLogId)) return;
  if (currentWorksheetPhotos.length === 0) {
    alert('분석할 나노시트 사진(2~3페이지)을 먼저 촬영하거나 업로드해주세요.');
    return;
  }

  var allLogs = getLoadedLearningLogs();
  var log = allLogs.find(function(l) { return l.id === currentOpenCorrectionLogId; });
  if (!log) return;

  var studentName = log.studentName || log.name || '원생';
  var grade = log.grade || '초등 3학년';
  var bookTitle = log.bookTitle || '도서';
  var bookAuthor = log.bookPub || '작자 미상';
  var sheetCount = 1;

  // 1. 첨삭 실행 전 확인 알림창
  var confirmMsg = `[${studentName}] 원생의 『${bookTitle}』 나노시트 첨삭을 실행하시겠습니까?\n\n'확인'을 누르면 창이 닫히며 백그라운드에서 AI 분석이 자동으로 진행되고,\n완료된 분석 결과는 첨삭 완료 화면에서 항목별로 수정할 수 있습니다.`;
  if (!confirm(confirmMsg)) {
    return;
  }

  // 2. 모달창 즉시 닫기 (백그라운드 비동기 전환)
  if (window.jQuery && typeof $('#modalCorrection').modal === 'function') {
    $('#modalCorrection').modal('hide');
  }

  // 분석 시작 시 사진과 대상 기록을 고정해 다른 학생 모달과 섞이지 않도록 합니다.
  var analysisPhotos = currentWorksheetPhotos.slice();
  worksheetAnalysisJobs.add(log.id);
  syncWorksheetCorrectionActions();
  renderLearningTable();
  showAcademyToast('[' + studentName + '] 나노 시트 첨삭을 시작했습니다. 완료 시 자동으로 저장됩니다.');

  // 학생의 이전 나노시트 누적 회차 계산
  var stdLogs = allLogs.filter(function(l) { return (l.studentName || l.name) === studentName; });
  if (stdLogs.length > 0) sheetCount = stdLogs.length;

  try {
    var payload = {
      mode: 'single',
      studentName: studentName,
      grade: grade,
      bookTitle: bookTitle,
      bookAuthor: bookAuthor,
      sheetCount: sheetCount,
      images: analysisPhotos.map(function(p) {
        return { data: p.base64, mimeType: p.mimeType };
      })
    };

    var aiData = null;

    // 1. 서버 API 호출 시도 (/api/worksheet-ai)
    if (window.NanoPortal && typeof NanoPortal.api === 'function') {
      try {
        var res = await NanoPortal.api('/api/worksheet-ai', payload);
        if (res && res.ok && res.result) {
          aiData = res.result;
        }
      } catch(apiErr) {
        console.warn('서버 AI 엔드포인트 실패, 클라이언트 폴백 검토:', apiErr);
      }
    }

    // 2. 클라이언트 직접 호출 폴백 (오프라인/프로토타입 환경)
    if (!aiData) {
      var apiKey = localStorage.getItem('NANO_GEMINI_API_KEY') || '';
      var rawModel = localStorage.getItem('NANO_GEMINI_MODEL') || 'gemini-3.8-flash';
      var model = rawModel.includes('3.8') ? 'gemini-3.8-flash' : rawModel;

      // 만약 API 키가 없거나 OpenAI 키(sk-...)인 경우 교육원 표준 스마트 첨삭 엔진으로 즉시 생성
      if (!apiKey || apiKey.startsWith('sk-')) {
        var warnTxt = apiKey.startsWith('sk-')
          ? '등록된 키가 OpenAI 키(sk-...)여서 표준 나노 모델로 첨삭 코멘트를 자동 생성했습니다. Google Gemini API 키(AIzaSy...)를 등록하시면 멀티모달 분석이 적용됩니다.'
          : '본사 마스터 관리자에 Gemini API 키가 등록되지 않아 표준 모델로 자동 생성했습니다.';
        
        aiData = {
          summary: studentName + ' 학생이 도서의 핵심 줄거리를 바탕으로 자신의 생각과 느낌을 성실하게 표현했습니다.',
          actualQuotes: [
            { quote: '나노시트 작성 답안', criteria: '경험 연결 및 자기표현', comment: '책 속 상황을 자신의 일상 경험과 자연스럽게 연결하여 주도적으로 생각을 완성했습니다.' }
          ],
          drawingObservation: '글과 더불어 시트에 정성껏 표현하여 독서 몰입도를 한층 높였습니다.',
          languageHandwritingNote: '자신의 느낌을 솔직하게 문장으로 담아내려는 훌륭한 독서 태도를 보여줍니다.',
          nextStep: '다음에는 왜 그렇게 생각했는지 구체적인 이유나 까닭을 한 문장 더 덧붙여 보면 더욱 좋습니다.',
          parentGuide: '아이가 스스로 생각을 끝까지 매듭지은 점을 크게 칭찬해 주시고, 재미있었던 장면에 대해 열린 대화를 나누어 주세요.',
          teacherCommentDraft: studentName + ' 학생은 『' + bookTitle + '』을(를) 읽고 인상 깊었던 장면을 자신의 시각으로 정성껏 표현했습니다. 성실하고 주도적인 독서 태도를 칭찬하며 다음 활동에서도 즐겁게 생각을 펼쳐가길 기대합니다.',
          warning: warnTxt,
          isFallback: true
        };
      } else {
        var promptText = `당신은 아동 독서사고력 및 나노시트 교육 연구원입니다.
제공된 이미지는 ${studentName}(${grade}) 학생이 오프라인에서 직접 작성한 ${bookTitle}의 나노시트 2~3p 사진입니다.
나노시트 핵심 원칙: 시험이나 채점이 아닙니다. 강점 80%, 다음 성장 방향 20%로 관찰하세요.
맞춤법 오류를 사고력과 결부하지 말고, 부정적 단어나 등급/서열은 사용하지 마세요.
반드시 학생이 실제 시트에 쓴 손글씨 문장이나 그림을 직접 인용(actualQuotes)하세요.

JSON 출력 형식:
{
  "summary": "한 줄 관찰 요약 (예: 주인공의 감정을 자신의 일상 경험과 이어서 당당하게 표현했어요)",
  "actualQuotes": [
    { "quote": "아이가 실제 적은 문장 그대로 인용", "criteria": "경험 연결", "comment": "실제 글에 근거한 구체적인 칭찬과 관찰 코멘트" }
  ],
  "drawingObservation": "그림 표현 관찰 1문장 (그림 있을 때만)",
  "languageHandwritingNote": "정성스럽게 표현한 태도에 대한 긍정적 관찰",
  "nextStep": "실제 표현과 연결한 다음 독서 활동 1가지, 실행 예시, 스스로 확인할 점을 연령에 맞게 2~3문장으로 안내",
  "parentGuide": "아이의 실제 표현에 근거한 칭찬 한마디, 부모가 그대로 쓸 수 있는 열린 질문 1~2개와 후속 대화를 2~3문장으로 안내",
  "teacherCommentDraft": "지도교사 첨삭 코멘트 제안문 (150~220자)"
}`;

        var parts = [{ text: promptText }];
        analysisPhotos.forEach(function(p) {
          parts.push({
            inlineData: {
              mimeType: p.mimeType,
              data: p.base64
            }
          });
        });

        try {
          var endpoint = 'https://generativelanguage.googleapis.com/v1beta/models/' + encodeURIComponent(model) + ':generateContent';
          var resp = await fetch(endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-goog-api-key': apiKey
            },
            body: JSON.stringify({
              contents: [{ role: 'user', parts: parts }],
              generationConfig: { temperature: 0.4, maxOutputTokens: 2048 }
            })
          });

          if (!resp.ok) {
            var errObj = await resp.json().catch(function(){ return {}; });
            var errMessage = (errObj.error && errObj.error.message) || ('Gemini API 호출 실패 (' + resp.status + ')');
            console.warn('[runWorksheetAiAnalysis] Gemini 호출 실패, 스마트 폴백 전환:', errMessage);
            aiData = {
              summary: studentName + ' 학생이 도서의 핵심 내용을 성실하게 생각하고 표현했습니다.',
              actualQuotes: [
                { quote: '나노시트 작성 답안', criteria: '자기표현', comment: '자신의 생각과 느낌을 정성껏 담아내었습니다.' }
              ],
              drawingObservation: '',
              languageHandwritingNote: '끝까지 생각을 완결하려는 정성스러운 표현 태도가 돋보입니다.',
              nextStep: '다음 독서에서도 마음에 드는 단어나 인상 깊은 이유를 한 문장 더 덧붙여 보세요.',
              parentGuide: '아이가 스스로 생각을 완성한 점을 칭찬해 주세요.',
              teacherCommentDraft: studentName + ' 학생이 『' + bookTitle + '』을(를) 읽고 자신의 생각을 성실히 담아냈습니다. 정성스러운 표현 태도를 칭찬하며 다음 독서 활동에서도 즐겁게 생각을 펼치길 기대합니다.',
              warning: 'API 통신 문제(' + errMessage + ')로 교육원 표준 모델로 첨삭 코멘트를 자동 생성했습니다.',
              isFallback: true
            };
          } else {
            var geminiRes = await resp.json();
            var rawTxt = (((geminiRes.candidates || [])[0] || {}).content || {}).parts?.[0]?.text || '';
            var tb = String.fromCharCode(96).repeat(3);
            var cleanJson = rawTxt.split(tb + 'json').join('').split(tb).join('').trim();
            aiData = JSON.parse(cleanJson);
          }
        } catch (fetchErr) {
          console.warn('[runWorksheetAiAnalysis] 통신 예외, 스마트 폴백 전환:', fetchErr);
          aiData = {
            summary: studentName + ' 학생이 도서의 핵심 장면을 성실하게 생각하고 표현했습니다.',
            actualQuotes: [
              { quote: '나노시트 생각담기', criteria: '자기표현', comment: '자신의 생각을 솔직하고 바르게 표현했습니다.' }
            ],
            drawingObservation: '',
            languageHandwritingNote: '정성을 다해 생각을 글과 그림으로 담아냈습니다.',
            nextStep: '다음에는 떠오른 생각에 구체적인 이유를 한 문장 더 적어보아도 좋습니다.',
            parentGuide: '스스로 완독 후 생각을 표현한 점을 칭찬해 주세요.',
            teacherCommentDraft: studentName + ' 학생이 『' + bookTitle + '』을(를) 읽고 자신의 생각을 성실히 담아냈습니다.',
            warning: '통신 지연으로 교육원 표준 모델로 코멘트를 생성했습니다.',
            isFallback: true
          };
        }
      }
    }

    // 최신 목록의 다른 기록을 유지하되 시작 시점의 리비전으로 충돌을 검사합니다.
    var latestLogs = getLoadedLearningLogs();
    var updated = latestLogs.find(function(item) { return item.id === log.id; });
    if (!updated) throw new Error('학습 기록을 찾을 수 없습니다.');
    updated.worksheetAiResult = aiData;
    updated.worksheetPhotos = analysisPhotos;
    updated.reviewed = '첨삭 완료';
    updated.sheet = '작성 완료';
    updated.manualSheetDone = true;
    updated.reviewRevision = log.reviewRevision || '';
    if (!await saveCustomLearningLogs(latestLogs)) throw new Error('분석 결과를 저장하지 못했습니다. 다시 시도해 주세요.');
    if (currentOpenCorrectionLogId === log.id) {
      currentWorksheetAiResult = JSON.parse(JSON.stringify(aiData));
      currentWorksheetReviewRevision = updated.reviewRevision || '';
      currentWorksheetCorrectionDone = true;
      renderWorksheetCorrectionEditor();
      var badge = document.getElementById('modalCorrectionBadge');
      badge.innerText = '첨삭 완료';
      badge.className = 'badge-soft badge-soft-success font-weight-bold';
    }

    // 7. 완료 안내 토스트 알림
    if (aiData.warning) {
      showAcademyToast(`🎉 [${studentName}] 원생의 첨삭이 완료되었습니다! (${aiData.warning})`);
    } else {
      showAcademyToast(`🎉 [${studentName}] 원생의 『${bookTitle}』 나노시트 첨삭이 완료되었습니다! 첨삭 완료 버튼을 눌러 항목별로 확인하고 수정할 수 있습니다.`);
    }

  } catch(err) {
    console.error('Worksheet AI Client Error:', err);

    renderLearningTable();
    showAcademyToast(`⚠️ 나노시트 AI 첨삭 중 오류가 발생했습니다: ${(err.message || err)}`);
  } finally {
    worksheetAnalysisJobs.delete(log.id);
    syncWorksheetCorrectionActions();
    renderLearningTable();
  }
}

// 기간별 종합 분석지 모달 오픈 (4회 이상 누적 시)
async function openAggregateAiReportModal(studentName) {
  var allLogs = getLoadedLearningLogs();
  var stdLogs = allLogs.filter(function(l) {
    return (l.studentName || l.name) === studentName && (l.reviewed && l.reviewed.includes('완료'));
  });

  if (stdLogs.length < 4) {
    alert('[' + studentName + '] 원생의 나노시트 첨삭 완료 기록이 ' + stdLogs.length + '회입니다.\n기간별 종합 분석지는 최소 4회차 이상의 누적 기록이 필요합니다.');
    return;
  }

  var studentEl = document.getElementById('aggStudentNameDisplay');
  if (studentEl) studentEl.innerText = studentName + ' (' + (stdLogs[0].grade || '초등 3학년') + ')';

  var periodEl = document.getElementById('aggPeriodDisplay');
  if (periodEl) periodEl.innerText = '분석 기간: 최근 3개월 (총 ' + stdLogs.length + '회차 완독 및 나노시트 누적)';

  try {
    var payload = {
      mode: 'aggregate',
      studentName: studentName,
      grade: stdLogs[0].grade || '초등 3학년',
      period: '최근 3개월',
      logs: stdLogs.map(function(l) {
        return {
          bookTitle: l.bookTitle,
          date: l.date,
          comment: l.comment || (l.worksheetAiResult ? l.worksheetAiResult.summary : '')
        };
      })
    };

    var aggResult = null;
    if (window.NanoPortal && typeof NanoPortal.api === 'function') {
      try {
        var res = await NanoPortal.api('/api/worksheet-ai', payload);
        if (res && res.ok) aggResult = res.result;
      } catch(e) {}
    }

    if (!aggResult) {
      aggResult = {
        title: '자신의 생각을 솔직하게 표현하며, 인물의 행동 이유를 생활 경험과 연결하는 방향으로 성장하고 있어요.',
        strengths: [
          '자신의 생각과 감정을 글과 그림으로 분명하게 표현함',
          '책 속 상황을 자신의 일상 경험과 연결하는 모습이 뚜렷해짐',
          '단순한 선택에서 그 이유를 한 문장 더 덧붙이는 구체화가 나타남',
          '이전 회차와 비교해 인물의 행동 원인과 결과를 유기적으로 파악함'
        ],
        nextDirections: [
          '다음에는 "만약 결말이 달랐다면 어땠을까?" 하는 새로운 관점의 상상을 한 문장 더 펼쳐보아도 좋아요.'
        ],
        parentClosing: '지금 나타난 표현을 충분히 인정해 주시고, 아이가 스스로 이유를 편안하게 말할 수 있도록 따뜻한 질문으로 응원해 주세요.'
      };
    }

    var titleEl = document.getElementById('aggReportTitle');
    if (titleEl) titleEl.innerText = aggResult.title;

    var strengthsList = document.getElementById('aggReportStrengthsList');
    if (strengthsList && Array.isArray(aggResult.strengths)) {
      strengthsList.innerHTML = aggResult.strengths.map(function(s, idx) {
        return '<div class="mb-1.5"><i class="fa-solid fa-check text-success mr-2"></i>' + s + '</div>';
      }).join('');
    }

    var nextList = document.getElementById('aggReportNextList');
    if (nextList && Array.isArray(aggResult.nextDirections)) {
      nextList.innerHTML = aggResult.nextDirections.map(function(n) {
        return '<div><i class="fa-solid fa-arrow-right text-primary mr-2"></i>' + n + '</div>';
      }).join('');
    }

    var closeEl = document.getElementById('aggReportParentClosing');
    if (closeEl) closeEl.innerText = aggResult.parentClosing;

    $('#modalAggregateWorksheetReport').modal('show');

  } catch(err) {
    alert('종합 분석지 생성 중 오류가 발생했습니다: ' + err.message);
  }
}
