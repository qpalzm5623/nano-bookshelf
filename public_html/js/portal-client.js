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
  function openManage(section) { location.href = 'manage.html?section=' + encodeURIComponent(section) + '&academy=' + encodeURIComponent(academy() || ''); }
  async function refreshActivity() { activity = await api('/api/activity'); window.dispatchEvent(new Event('nano:activity')); return activity; }
  async function refreshAssignments() {
    var result = await api('/api/activity?action=assignments&academy=' + encodeURIComponent(academy() || ''));
    if (typeof studentAssignmentList !== 'undefined') { studentAssignmentList = result.students; classAssignmentList = result.classes; assignmentLoadError = false; }
    if (typeof renderStudentAssignmentTable === 'function') renderStudentAssignmentTable();
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
  global.NanoPortal = { remote: remote, request: request, api: api, openManage: openManage, refreshActivity: refreshActivity, refreshAssignments: refreshAssignments, activity: function() { return activity; }, user: user, refreshLearning: refreshLearning, logout: logout,
    applyReview: function (log) { if (memoryLogs) memoryLogs = memoryLogs.map(function (item) { return item.id === log.id ? log : item; }); },
    logs: function () { return memoryLogs; } };
  var page = location.pathname.split('/').pop().replace(/\.html$/, '');
  var roles = { student_preview: ['student'], admin_preview: ['admin', 'teacher', 'master'], master_preview: ['master'] };
  if (!roles[page]) {
    global.addEventListener('DOMContentLoaded', function() {
      if (remote) { var demo = document.querySelector('.quick-test-box'); if(demo) demo.hidden = true; }
      var notice = sessionStorage.getItem('nano_login_notice');
      if (notice) { var message = document.getElementById('errorMessage'); var alertBox = document.getElementById('errorAlert'); if(message && alertBox) { message.textContent = notice; alertBox.style.display = 'block'; } sessionStorage.removeItem('nano_login_notice'); }
    });
    return;
  }
  document.documentElement.style.visibility = 'hidden';
  async function verify() {
    try {
      var current = remote ? (await request('session')).user : user();
      if (remote && global.NANO_BOOTSTRAP_FAILED) throw new Error('회원 정보를 불러오지 못했습니다. 다시 로그인해 주세요.');
      if (!current || !roles[page].includes(current.role)) throw new Error('로그인 권한을 확인해 주세요.');
      if (remote && global.NANO_BOOTSTRAP_MEMBER_ID && global.NANO_BOOTSTRAP_MEMBER_ID !== current.memberId) { location.reload(); return; }
      sessionStorage.setItem('nano_auth_user', JSON.stringify(current));
      if (remote && page !== 'master_preview') {
        await refreshLearning();
        if (page === 'student_preview') await refreshActivity(); else await refreshAssignments();
      }
      document.documentElement.style.visibility = '';
      if (typeof renderLearningTable === 'function') renderLearningTable();
      if (typeof refreshStudentLearningData === 'function') refreshStudentLearningData();
      window.dispatchEvent(new Event('nano:ready'));
    } catch(e) {
      sessionStorage.removeItem('nano_auth_user');
      sessionStorage.setItem('nano_login_notice', e.message);
      location.replace('index.html');
    }
  }
  global.addEventListener('DOMContentLoaded', verify);
  global.addEventListener('pageshow', function (event) { if (event.persisted) { document.documentElement.style.visibility = 'hidden'; verify(); } });
})(window);
