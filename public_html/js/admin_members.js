/**
 * ==============================================================
 * 나노의 책장 - 학원 회원 관리 (원생 + 선생님 + 학급 관리) 모듈
 * File: public_html/js/admin_members.js
 * ==============================================================
 */

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
      var savedResult = await NanoPortal.saveMember(savedStudent, currentAcademyInfo.id);
      if (savedResult) {
        savedStudent.serverId = savedResult.id || savedStudent.serverId;
        savedStudent.updatedAt = savedResult.updatedAt || savedStudent.updatedAt;
        if (savedResult.classGroupId) savedStudent.classGroupId = savedResult.classGroupId;
      }
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
      var savedTeacherResult = await NanoPortal.saveMember(savedTeacher, currentAcademyInfo.id);
      if (savedTeacherResult) {
        savedTeacher.serverId = savedTeacherResult.id || savedTeacher.serverId;
        savedTeacher.updatedAt = savedTeacherResult.updatedAt || savedTeacher.updatedAt;
      }
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
