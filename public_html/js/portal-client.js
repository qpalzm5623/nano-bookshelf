(function (global) {
  'use strict';
  // 로컬 체험 화면과 운영 서버의 인증 경로를 구분합니다. 운영 환경에서는 체험 비밀번호로 우회하지 않습니다.
  var remote = location.protocol !== 'file:' && !['localhost', '127.0.0.1', '[::1]'].includes(location.hostname);
  var memoryLogs = null;
  var activity = null;
  async function api(path, body) {
    var response = await fetch(path, { method: body === undefined ? 'GET' : 'POST', credentials: 'same-origin', cache: 'no-store', headers: {'Content-Type':'application/json'}, body: body === undefined ? undefined : JSON.stringify(body), signal: AbortSignal.timeout(20000) });
    var data; try { data = await response.json(); } catch(e) { throw new Error('서버 응답을 확인하지 못했습니다.'); }
    if (!response.ok) throw new Error(data.error || '서버 요청에 실패했습니다.');
    return data;
  }
  function academy() { return typeof currentAcademyInfo !== 'undefined' ? currentAcademyInfo.id : (user() || {}).academyId; }
  function manageUrl(entity, academyCode, params) {
    var query = new URLSearchParams({ entity: entity });
    var scope = academyCode === undefined ? academy() : academyCode;
    if (scope) query.set('academy', scope);
    Object.keys(params || {}).forEach(function (key) {
      if (params[key] !== undefined && params[key] !== null && params[key] !== '') query.set(key, String(params[key]));
    });
    return '/api/manage?' + query.toString();
  }
  async function manage(entity, operation, data, options) {
    options = options || {};
    return api(manageUrl(entity, options.academy, options.params), { operation: operation, data: data || {}, rows: options.rows });
  }
  async function manageList(entity, options) {
    options = options || {};
    return api(manageUrl(entity, options.academy, options.params));
  }
  function enumStatus(value) {
    return ({ '승인': 'APPROVED', '정상': 'APPROVED', '정상 승인': 'APPROVED', '미승인': 'PENDING', '승인대기': 'PENDING', '정지': 'SUSPENDED', '일시정지': 'SUSPENDED', '퇴원': 'WITHDRAWN', '탈퇴': 'WITHDRAWN', NORMAL: 'APPROVED', PAUSED: 'SUSPENDED' })[value] || value || 'PENDING';
  }
  function classIdFor(item, academyCode) {
    if (item.classGroupId) return item.classGroupId;
    var name = item.classGroup || item.className;
    var match = (global.NANO_SERVER_CLASSES || []).find(function (entry) { return entry.academyId === academyCode && entry.name === name; });
    return match ? (match.serverId || match.id) : null;
  }
  function memberPayload(item, academyCode) {
    var role = item.role === '학원 원장' ? 'DIRECTOR' : item.role === '지도교사' ? 'TEACHER' : (item.role || 'STUDENT');
    var isStudent = role === 'STUDENT';
    var academyStudentShape = isStudent && Object.prototype.hasOwnProperty.call(item, 'stdPhone');
    var payload = {
      id: item.serverId || undefined, updatedAt: item.updatedAt || undefined, username: item.username || item.id, name: item.name, role: role,
      status: enumStatus(item.status || 'APPROVED'), grade: item.grade || '', school: item.school || '', gender: item.gender || '',
      phone: academyStudentShape ? (item.stdPhone || '') : (item.phone || ''), parentName: item.parentName || '', parentPhone: academyStudentShape ? (item.phone || '') : (item.parentPhone || ''),
      parentEmail: item.parentEmail || '', reportYn: item.reportYn === true, classGroupId: classIdFor(item, academyCode)
    };
    if (item.password && typeof item.password === 'string') {
      var pwTrim = item.password.trim();
      var isMasked = !pwTrim || /^[•·*]+$/.test(pwTrim);
      if (!isMasked) payload.password = pwTrim;
    }
    return payload;
  }
  async function saveMember(item, academyCode) {
    var result = await manage('members', 'save', memberPayload(item, academyCode), { academy: academyCode });
    var saved = result.items && result.items[0];
    if (saved) { item.serverId = saved.id; item.updatedAt = saved.updatedAt; item.classGroupId = saved.classGroupId; }
    return saved;
  }
  async function deleteMember(item, academyCode) {
    var result = await manage('members', 'delete', { id: item.serverId }, { academy: academyCode });
    var saved = result.items && result.items[0];
    if (saved) item.updatedAt = saved.updatedAt;
    return saved;
  }
  function plan(value) { return String(value || 'STANDARD').toUpperCase(); }
  function money(value) { var parsed = Number(String(value == null ? '' : value).replace(/[^0-9]/g, '')); return Number.isSafeInteger(parsed) ? parsed : 0; }
  function academyPayload(item) {
    return { id: item.serverId || undefined, code: item.id, name: item.name, bizNo: item.bizNumber || '', directorName: item.director || '', phone: item.phone || '', email: item.email || '',
      address: item.address || item.region || '', memo: item.memo || '', maxStudents: Number(item.maxStudents) || 50, monthlyFee: money(item.monthlyFee), plan: plan(item.plan), status: item.status || 'ACTIVE',
      joinDate: item.joinDate || item.startDate, startDate: item.startDate, endDate: item.endDate,
      adminId: item.adminId || item.username || '', adminPw: item.adminPw || item.password || '' };
  }
  async function saveAcademy(item) {
    var result = await manage('academies', 'save', academyPayload(item), { academy: item.id });
    if (result.item) item.serverId = result.item.id;
    return result.item;
  }
  async function deleteAcademy(item) { return manage('academies', 'delete', { id: item.serverId }, { academy: item.id }); }
  async function restoreAcademy(item) { return manage('academies', 'restore', { id: item.serverId }, { academy: item.id }); }
  async function saveClass(item, academyCode) {
    var result = await manage('classes', 'save', { id: item.serverId || undefined, name: item.name, targetGrade: item.grade || item.targetGrade || '', teacher: item.teacher || '' }, { academy: academyCode });
    if (result.item) {
      item.serverId = result.item.id;
      item.id = result.item.id;
      if (result.item.teacher) item.teacher = result.item.teacher;
    }
    return result.item;
  }
  async function deleteClass(item, academyCode) { return manage('classes', 'delete', { id: item.serverId || item.id }, { academy: academyCode }); }
  async function saveBanner(item) {
    var result = await manage('banners', 'save', { id: typeof item.id === 'string' && !/^\d+$/.test(item.id) ? item.id : undefined, title: item.title,
      imageUrl: item.imageUrl || item.image || '', linkUrl: item.linkUrl || item.link || '', isActive: item.active === 'Y' || item.isActive === true, orderNo: Number(item.order || item.orderNo) || 0 });
    if (result.item) item.id = result.item.id;
    return result.item;
  }
  async function deleteBanner(item) { return manage('banners', 'delete', { id: item.id }); }
  async function saveTheme(item) {
    var name = item.name || item.title || String(item.tag || '').replace(/^#/, '');
    var result = await manage('themes', 'save', { id: typeof item.id === 'string' && !/^\d+$/.test(item.id) ? item.id : undefined,
      code: item.code || ('THEME-' + String(item.id || Date.now())), name: name, description: item.description || item.desc || item.subTag || '' });
    if (result.item) { item.id = result.item.id; item.code = result.item.code; }
    return result.item;
  }
  async function deleteTheme(item) { return manage('themes', 'delete', { id: item.id }); }
  function noticeTarget(value) { return ({ 학생: 'STUDENT', 선생님: 'TEACHER', 원장: 'DIRECTOR', 본사: 'MASTER', 학원: 'DIRECTOR' })[value] || null; }
  async function saveNotice(item) {
    var result = await manage('notices', 'save', { id: typeof item.id === 'string' && !/^NOT-/.test(item.id) ? item.id : undefined,
      title: item.title, content: item.content, isPinned: item.isPinned === true || item.isPopup === true, targetRole: item.targetRole || noticeTarget(item.target) });
    if (result.item) item.id = result.item.id;
    return result.item;
  }
  async function deleteNotice(item) { return manage('notices', 'delete', { id: item.id }); }
  function themeIdFor(item) {
    var key = String(item.themeTag || item.tag || '').replace(/^#/, '');
    var found = (global.NANO_SERVER_THEMES || []).find(function (theme) { return theme.id === item.themeId || theme.name === key || theme.title === key; });
    return found ? found.id : (item.themeId || null);
  }
  async function saveBook(item) {
    var tags = Array.isArray(item.tags) ? item.tags.join(',') : (item.tags || item.detailTag || '');
    var coverUrl = item.coverUrl || item.cover || '';
    var worksheetUrl = item.worksheetUrl || item.worksheet || '';
    if (coverUrl && (/^javascript:/i.test(coverUrl) || !/^(https?:\/\/|\/|\.\/|data:)/i.test(coverUrl))) coverUrl = '';
    if (worksheetUrl && (/^javascript:/i.test(worksheetUrl) || !/^(https?:\/\/|\/|\.\/|data:)/i.test(worksheetUrl))) worksheetUrl = '';
    var subCat = item.subCategory || (item.cat1 && item.cat1.includes('비문학') ? 'C' : (item.cat1 && item.cat1.includes('인물') ? 'B' : 'A'));
    var result = await manage('books', 'save', { id: item.serverId || undefined, bookNo: item.bookNo || item.id, title: item.title, author: item.author || '', publisher: item.publisher || item.pub || '',
      isbn: item.isbn || '', grade: item.grade || '', category: item.cat2 === '외서' ? 'F' : (item.cat2 === '국내서' ? 'K' : (item.category || '')), subCategory: subCat, description: item.description || item.synopsis || '',
      thinkTitle: item.thinkTitle || item.thinkExtract || item.thinkOpen || '', thinkQuiz: item.thinkQuiz || item.thinkInsert || '', coverUrl: coverUrl, worksheetUrl: worksheetUrl, tags: tags, series: item.series || '', themeId: themeIdFor(item), isRecommended: item.isRecommended === true });
    if (result.item) item.serverId = result.item.id;
    return result.item;
  }
  async function deleteBook(item) { return manage('books', 'delete', { id: item.serverId }); }
  async function syncQuizzes(book, questions) {
    if (!book.serverId) throw new Error('도서 정보를 새로고침한 뒤 다시 시도해 주세요.');
    if ((questions || []).some(function(question) { return question.type && question.type !== 'CHOICE'; })) throw new Error('운영 북퀴즈는 현재 객관식 문항만 저장할 수 있습니다.');
    var current = await manageList('quizzes', { params: { bookId: book.serverId } });
    var existing = current.items || [];
    for (var index = 0; index < questions.length; index++) {
      var question = questions[index];
      var options = question.choices || question.options || [question.opt1, question.opt2, question.opt3, question.opt4].filter(Boolean);
      var saved = await manage('quizzes', 'save', { id: question.serverId || (existing[index] && existing[index].id), bookId: book.serverId, questionNo: index + 1,
        question: question.question, options: options, correctAnswer: Number(question.ans || question.correctAnswer) });
      if (saved.item) question.serverId = saved.item.id;
    }
    for (var extra = questions.length; extra < existing.length; extra++) await manage('quizzes', 'delete', { id: existing[extra].id });
  }
  async function saveOwnedBook(item, academyCode) { return manage('owned', 'save', { bookId: item.serverId }, { academy: academyCode }); }
  async function deleteOwnedBook(ownedId, academyCode) { return manage('owned', 'delete', { id: ownedId }, { academy: academyCode }); }
  async function saveAssignment(book, member, classGroup, academyCode) {
    return manage('assignments', 'save', {
      bookId: book.serverId || book.id,
      memberId: member && (member.serverId || member.id),
      classGroupId: classGroup && (classGroup.serverId || classGroup.id)
    }, { academy: academyCode });
  }
  async function deleteAssignment(id, academyCode) { return manage('assignments', 'delete', { id: id }, { academy: academyCode }); }
  async function refreshPortfolios() {
    var result = await manageList('portfolios');
    if (typeof portfolioList === 'undefined' || typeof portfolioDataMap === 'undefined') return result;
    portfolioDataMap = {};
    portfolioList = (result.items || []).map(function (item) {
      var student = (global.studentDataList || []).find(function (entry) { return entry.serverId === item.memberId; });
      var studentId = student ? student.id : item.memberId;
      var books = item.books || [];
      var avgScore = books.length ? Math.round(books.reduce(function(sum, book) { return sum + (Number(book.score) || 0); }, 0) / books.length) : 0;
      portfolioDataMap[studentId] = { name: item.name, school: student ? ((student.school || '') + ' ' + (student.grade || '')) : '', classGroup: student ? student.classGroup : '미지정',
        teacher: student ? student.teacher : '', level: student ? student.level : '', bookCount: books.length,
        quizAvg: avgScore,
        books: books.map(function(book) {
          var matchedBook = (global.academyBookList || []).find(function(ab) {
            if (!ab || !ab.title) return false;
            return ab.title === book.title || ab.title.replace(/\s+/g, '') === (book.title || '').replace(/\s+/g, '');
          });
          return {
            title: book.title,
            date: book.date,
            score: (book.score || 0) + '점',
            cover: book.cover || (matchedBook ? matchedBook.cover : 'assets/covers/cover_default.jpg'),
            pub: book.pub || book.publisher || (matchedBook ? (matchedBook.publisher || matchedBook.pub) : '나노출판'),
            author: book.author || (matchedBook ? matchedBook.author : ''),
            comment: book.thought || book.comment || ''
          };
        }), teacherNote: item.comment || '' };
      return { id: item.id, revision: item.revision, memberId: item.memberId, studentId: studentId, studentName: item.name, school: student ? student.school : '', grade: student ? student.grade : '',
        classGroup: student ? student.classGroup : '미지정', title: item.title, period: item.from + ' ~ ' + item.to, from: item.from, to: item.to, comment: item.comment || '',
        bookCount: books.length, booksSummary: books.length ? books[0].title + (books.length > 1 ? ' 외 ' + (books.length - 1) + '권' : '') : '완독 도서 없음',
        quizAvg: avgScore + '점', issueDate: String(item.createdAt || '').replace('T', ' ').slice(0, 16), status: '발급 완료', kakaoSent: false };
    });
    if (typeof renderPortfolioTable === 'function') renderPortfolioTable(portfolioList);
    if (typeof initPortfolioOptions === 'function') initPortfolioOptions();
    return result;
  }
  async function savePortfolio(data, academyCode) { return manage('portfolios', 'save', data, { academy: academyCode }); }
  async function deletePortfolio(id, academyCode) { return manage('portfolios', 'delete', { id: id }, { academy: academyCode }); }
  async function refreshActivity() { activity = await api('/api/activity'); window.dispatchEvent(new Event('nano:activity')); return activity; }
  async function refreshAssignments() {
    var result = await api('/api/activity?action=assignments&academy=' + encodeURIComponent(academy() || ''));
    if (typeof studentAssignmentList !== 'undefined') {
      studentAssignmentList = (result.students || []).map(function(s) {
        var total = (s.books || []).length;
        var completed = s.completedBooks || 0;
        if (!s.status) {
          s.status = total > 0 ? (completed >= total ? '완료' : '읽는 중 (' + completed + '/' + total + '권)') : '배정 없음';
        }
        return s;
      });
      classAssignmentList = result.classes || [];
      assignmentLoadError = false;
    }
    if (typeof renderStudentAssignmentTable === 'function') renderStudentAssignmentTable();
    if (typeof renderClassAssignmentTable === 'function') renderClassAssignmentTable();
    if (typeof renderIndivBookCatalog === 'function') renderIndivBookCatalog();
    if (typeof renderIndivStudentAssignedBooks === 'function') renderIndivStudentAssignedBooks(typeof currentIndivStudentId !== 'undefined' ? currentIndivStudentId : null);
    return result;
  }
  async function request(action, body) {
    var controller = new AbortController();
    var timer = setTimeout(function () { controller.abort(); }, 15000);
    try {
      var response = await fetch('/api/portal?action=' + encodeURIComponent(action), {
        method: body === undefined ? 'GET' : 'POST', credentials: 'same-origin', cache: 'no-store',
        headers: { 'Content-Type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body), signal: controller.signal
      });
      var data;
      try { data = await response.json(); } catch(e) { throw new Error('운영 서버에 연결할 수 없습니다.'); }
      if (!response.ok) throw new Error(data.error || '서버 요청에 실패했습니다.');
      return data;
    } catch(e) { if (e.name === 'AbortError') throw new Error('서버 응답이 늦어지고 있습니다. 잠시 후 다시 시도해 주세요.'); throw e; }
    finally { clearTimeout(timer); }
  }
  function user() { try { return JSON.parse(sessionStorage.getItem('nano_auth_user') || 'null'); } catch(e) { return null; } }
  async function refreshLearning() {
    var collected = [], cursor = '', scope = academy();
    do {
      var result = await api('/api/portal?action=learning&academy=' + encodeURIComponent(scope || '') + (cursor ? '&cursor=' + encodeURIComponent(cursor) : ''));
      collected = collected.concat(result.logs); cursor = result.nextCursor;
    } while (cursor);
    if (scope === academy()) memoryLogs = collected;
    return collected;
  }
  async function logout() {
    if (remote) await request('logout', {});
    sessionStorage.removeItem('nano_auth_user');
    location.href = 'index.html';
  }
  global.NanoPortal = { remote: remote, request: request, api: api, manage: manage, manageList: manageList, academy: academy,
    saveMember: saveMember, deleteMember: deleteMember, saveAcademy: saveAcademy, deleteAcademy: deleteAcademy, restoreAcademy: restoreAcademy, saveClass: saveClass, deleteClass: deleteClass,
    saveBanner: saveBanner, deleteBanner: deleteBanner, saveTheme: saveTheme, deleteTheme: deleteTheme, saveNotice: saveNotice, deleteNotice: deleteNotice,
    saveBook: saveBook, deleteBook: deleteBook, syncQuizzes: syncQuizzes, saveOwnedBook: saveOwnedBook, deleteOwnedBook: deleteOwnedBook, saveAssignment: saveAssignment, deleteAssignment: deleteAssignment,
    refreshPortfolios: refreshPortfolios, savePortfolio: savePortfolio, deletePortfolio: deletePortfolio,
    refreshActivity: refreshActivity, refreshAssignments: refreshAssignments, activity: function() { return activity; }, user: user, refreshLearning: refreshLearning, logout: logout,
    applyReview: function (log) { if (memoryLogs) memoryLogs = memoryLogs.map(function (item) { return item.id === log.id ? log : item; }); },
    logs: function () { return memoryLogs; } };
  var page = location.pathname.split('/').pop().replace(/\.html$/, '');
  var roles = {
    student_preview: ['student'],
    admin_preview: ['admin', 'director', 'teacher', 'master'],
    master_preview: ['master']
  };
  function checkRole(pageRoles, userRole) {
    if (!userRole) return false;
    var r = String(userRole).toLowerCase();
    return (pageRoles || []).some(function(allowed) { return allowed.toLowerCase() === r; });
  }

  if (!roles[page]) {
    global.addEventListener('DOMContentLoaded', function() {
      if (remote) { var demo = document.querySelector('.quick-test-box'); if(demo) demo.hidden = true; }
      var notice = sessionStorage.getItem('nano_login_notice');
      if (notice) { var message = document.getElementById('errorMessage'); var alertBox = document.getElementById('errorAlert'); if(message && alertBox) { message.textContent = notice; alertBox.style.display = 'block'; } sessionStorage.removeItem('nano_login_notice'); }
    });
    return;
  }

  async function verify() {
    try {
      if (remote && global.NANO_BOOTSTRAP_FAILED) throw new Error('회원 정보를 불러오지 못했습니다. 다시 로그인해 주세요.');
      // 보호된 초기 데이터가 이미 같은 세션을 검증하고 사용자 정보를 저장했습니다.
      // 초기 데이터가 없는 예외 상황에서만 세션 API를 한 번 더 확인합니다.
      var current = remote && global.NANO_SERVER_DATA ? user() : remote ? (await request('session')).user : user();
      if (!current || !checkRole(roles[page], current.role)) throw new Error('로그인 권한을 확인해 주세요.');
      sessionStorage.setItem('nano_auth_user', JSON.stringify(current));

      // 세션 확인 즉시 화면 렌더링 활성화
      document.documentElement.style.visibility = '';
      if (typeof renderLearningTable === 'function') renderLearningTable();
      if (typeof refreshStudentLearningData === 'function') refreshStudentLearningData();
      window.dispatchEvent(new Event('nano:ready'));

      // 백그라운드 데이터 비동기 동기화 (화면 블로킹 차단)
      if (remote && page !== 'master_preview') {
        refreshLearning().then(function() {
          if (typeof renderLearningTable === 'function') renderLearningTable();
          if (typeof refreshStudentLearningData === 'function') refreshStudentLearningData();
        }).catch(function() {});

        if (page === 'student_preview') {
          refreshActivity().then(function() {
            if (typeof refreshStudentLearningData === 'function') refreshStudentLearningData();
          }).catch(function() {});
        } else {
          Promise.all([refreshAssignments(), refreshPortfolios()]).catch(function() {});
        }
      }
    } catch(e) {
      document.documentElement.style.visibility = '';
      sessionStorage.removeItem('nano_auth_user');
      sessionStorage.setItem('nano_login_notice', e.message);
      location.replace('index.html');
    }
  }

  if (document.readyState === 'loading') {
    global.addEventListener('DOMContentLoaded', verify);
  } else {
    verify();
  }
  global.addEventListener('pageshow', function (event) { if (event.persisted) { verify(); } });
})(window);
