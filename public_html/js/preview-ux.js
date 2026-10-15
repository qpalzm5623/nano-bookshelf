document.addEventListener('DOMContentLoaded', function () {
  var sidebar = document.querySelector('.simple-sidebar');
  var workspace = document.querySelector('.main-workspace');
  if (sidebar && workspace) {
    sidebar.id = 'nanoSidebar';
    var button = document.createElement('button');
    button.type = 'button'; button.className = 'nano-menu-toggle'; button.textContent = '☰ 메뉴';
    button.setAttribute('aria-controls', sidebar.id); button.setAttribute('aria-expanded', 'false');
    function closeMenu() { document.body.classList.remove('nano-menu-open'); button.setAttribute('aria-expanded', 'false'); }
    button.addEventListener('click', function () {
      var open = document.body.classList.toggle('nano-menu-open'); button.setAttribute('aria-expanded', String(open));
    });
    workspace.prepend(button);
    sidebar.addEventListener('click', function (event) { if (event.target.closest('.nav-item-btn')) closeMenu(); });
    document.addEventListener('keydown', function (event) { if (event.key === 'Escape' && document.body.classList.contains('nano-menu-open')) { closeMenu(); button.focus(); } });
    workspace.addEventListener('click', function (event) { if (event.target !== button) closeMenu(); });
  }
  document.querySelectorAll('a[onclick]:not([href])').forEach(function (item) {
    item.setAttribute('role', 'button'); item.tabIndex = 0;
    item.addEventListener('keydown', function (event) { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); item.click(); } });
  });
  document.querySelectorAll('#masterToast, #academyToast, #toast').forEach(function (item) {
    item.setAttribute('role', 'status'); item.setAttribute('aria-live', 'polite'); item.setAttribute('aria-atomic', 'true');
  });
  document.querySelectorAll('.table-responsive').forEach(function (table) {
    table.tabIndex = 0; table.setAttribute('role', 'region'); table.setAttribute('aria-label', '목록 표. 좌우로 스크롤할 수 있습니다.');
    var hint = document.createElement('p'); hint.className = 'nano-table-hint'; hint.textContent = '표를 좌우로 밀어 나머지 항목을 확인하세요.'; table.before(hint);
  });
  if (workspace) {
    var note = document.createElement('div'); note.className = 'nano-storage-notice'; note.setAttribute('role', 'note');
    note.textContent = NanoPortal.remote ? '운영 데이터는 서버에 저장됩니다. 회원·학급·콘텐츠 수정은 운영 관리에서 진행합니다. 외부 서비스는 설정 완료 후 활성화됩니다.' : '로컬 체험 화면입니다. 변경 사항은 이 브라우저에만 저장되며 다른 기기에는 전달되지 않습니다.';
    if (NanoPortal.remote) { var manage = document.createElement('a'); manage.href = 'manage.html'; manage.textContent = '운영 관리 열기 →'; manage.style.marginLeft = '12px'; note.append(manage); }
    workspace.prepend(note);
  }
  document.querySelectorAll('a[href="index.html"]').forEach(function (link) {
    if (!(link.title + link.textContent).includes('로그아웃')) return;
    link.addEventListener('click', function (event) { event.preventDefault(); NanoPortal.logout().catch(function(e) { alert(e.message); }); });
  });
});
