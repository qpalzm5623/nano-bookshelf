/* ==============================================================
 * 학원장 관리자 - 문해력 진단 관리 (테스트 부여 · 결과지 · 이력/추이)
 *
 * 화면 구성: #view-literacy (admin_preview.html의 좌측 메뉴 '문해력 진단')
 *  - 상단 요약 카드 / 필터 / 배정·결과 목록
 *  - 테스트 부여 모달, 결과지 모달(인쇄·링크 복사·카톡 발송), 레벨 변화 이력 모달
 * 서버 API: /api/literacy (js/literacy/literacy-common.js 의 NanoLiteracy.api)
 * ============================================================== */
(function (global) {
  'use strict';
  var L = global.NanoLiteracy;
  var esc = L.esc;
  var STATUS = { PENDING: ['대기', '#b45309', '#fef3c7'], IN_PROGRESS: ['진행 중', '#1d4ed8', '#dbeafe'], COMPLETED: ['완료', '#166534', '#dcfce7'], CANCELLED: ['취소', '#6b7280', '#f3f4f6'] };
  var state = { items: [], students: [], built: false, loading: false, current: null, mode: 'regular' };

  function toast(msg, isError) {
    var el = document.createElement('div');
    el.textContent = msg;
    el.style.cssText = 'position:fixed;left:50%;bottom:36px;transform:translateX(-50%);z-index:20000;padding:11px 20px;border-radius:10px;font-size:13.5px;font-weight:600;color:#fff;box-shadow:0 6px 20px rgba(0,0,0,.2);background:' + (isError ? '#dc2626' : '#1f8a7e');
    document.body.appendChild(el);
    setTimeout(function () { el.remove(); }, 3200);
  }
  function fail(e) { toast(e && e.message ? e.message : '요청에 실패했습니다.', true); }

  /* ---------- 화면 뼈대 (처음 한 번만 생성) ---------- */
  function build() {
    if (state.built) return;
    state.built = true;
    document.getElementById('view-literacy').innerHTML =
      '<div class="workspace-header"><div><div class="workspace-title"><i class="fa-solid fa-graduation-cap"></i>문해력 진단</div>' +
      '<div class="workspace-subtitle">원생에게 초등 문해력 진단 테스트를 부여하고, 완료된 결과지를 확인·출력·카톡 발송하며 레벨 변화를 추적합니다.</div></div>' +
      '<div><button type="button" class="btn btn-beige-primary font-weight-bold" onclick="NanoLiteracyAdmin.openAssign()"><i class="fa-solid fa-paper-plane mr-1"></i>테스트 부여</button></div></div>' +
      '<div class="row mb-4" id="litStats"></div>' +
      '<div class="simple-card p-3 mb-4"><div class="portal-search-toolbar d-flex flex-wrap align-items-end" style="gap:12px">' +
      '<div style="width:150px"><label class="lit-lbl">학급</label><select id="litClassFilter" class="form-control lit-ctl"><option value="ALL">전체 학급</option></select></div>' +
      '<div style="width:140px"><label class="lit-lbl">상태</label><select id="litStatusFilter" class="form-control lit-ctl">' +
      '<option value="ALL">전체 상태</option><option value="PENDING">대기</option><option value="IN_PROGRESS">진행 중</option><option value="COMPLETED">완료</option><option value="CANCELLED">취소</option></select></div>' +
      '<div class="portal-search-field"><label class="lit-lbl" for="litSearch">원생 검색</label><input type="search" id="litSearch" class="form-control lit-ctl" placeholder="원생 이름, 아이디 검색..." onkeydown="if(event.key===\'Enter\'){event.preventDefault();NanoLiteracyAdmin.render();}" autocomplete="off"></div>' +
      '<button type="button" class="btn btn-beige-primary font-weight-bold" onclick="NanoLiteracyAdmin.render()" style="height:38px;white-space:nowrap"><i class="fa-solid fa-magnifying-glass mr-1"></i>검색</button>' +
      '<button type="button" class="btn btn-beige-secondary" onclick="NanoLiteracyAdmin.refresh(true)" style="height:38px"><i class="fa-solid fa-rotate-right mr-1"></i>새로고침</button></div></div>' +
      '<div class="simple-card" style="padding:0;overflow:hidden"><div class="table-responsive"><table class="simple-table" style="margin:0"><thead><tr>' +
      '<th style="width:56px">번호</th><th>배정일</th><th>원생</th><th>학년</th><th>검사지</th><th>상태</th><th>응시일</th><th>결과</th><th>마감일</th><th style="width:210px">관리</th></tr></thead>' +
      '<tbody id="litTableBody"></tbody></table></div></div>' +
      '<style>.lit-lbl{font-size:12px;font-weight:700;color:var(--text-muted);margin-bottom:4px;display:block}.lit-ctl{height:38px;border-radius:8px;border-color:var(--border-medium);font-size:12.5px}' +
      '.lit-pill{display:inline-block;font-size:11.5px;font-weight:700;padding:3px 9px;border-radius:999px;white-space:nowrap}' +
      '.lit-act{border-radius:6px;font-size:11.5px;padding:4px 9px;margin:0 2px;white-space:nowrap}' +
      '#litReportModal .modal-dialog{max-width:1040px !important;margin:1.25rem auto !important}' +
      '#litReportModal .modal-content{border-radius:18px;border:1px solid var(--border-medium);overflow:hidden;box-shadow:0 18px 50px rgba(0,0,0,.22)}' +
      '#litReportModal .modal-header{background:#fbf9f5;padding:14px 24px;border-bottom:1px solid var(--border-light)}' +
      '#litReportBody{background:#f0ece3;padding:16px 0 32px;max-height:86vh !important;overflow:auto}' +
      '#litAssignModal .modal-dialog{max-width:1040px}#litAssignModal .modal-content{border:1px solid var(--border-medium);border-radius:18px;overflow:hidden}' +
      '#litAssignModal .modal-header,#litAssignModal .modal-footer{background:#fbf9f5;padding:18px 24px;border-color:var(--border-light)}#litAssignModal .modal-title{font-size:18px;color:var(--text-main)}' +
      '#litAssignModal .modal-body{padding:24px;background:#fff}#litAssignModal .lit-ctl{height:40px;border-radius:10px;background:#fdfcf9}' +
      '.lit-pick-toolbar{display:flex;flex-wrap:wrap;align-items:center;gap:12px;padding:14px;background:#faf8f5;border:1px solid var(--border-light);border-radius:12px;margin:16px 0}' +
      '.lit-pick-table{overflow:auto;max-height:380px;border:1px solid var(--border-light);border-radius:12px}.lit-pick-row{display:grid;grid-template-columns:24px 120px minmax(200px,1fr) 150px 200px;min-width:880px;gap:12px;align-items:center;padding:14px 16px;border-bottom:1px solid var(--border-light);font-size:13px}' +
      '.lit-pick-head{position:sticky;top:0;z-index:1;background:#fbf9f5;font-size:12px;font-weight:700;color:var(--text-muted)}.lit-pick-row:last-child{border-bottom:0}.lit-pick-row:not(.lit-pick-head):hover{background:#fdfbf7}' +
      '.lit-pick-row select{height:38px;border-radius:10px;border-color:var(--border-medium);background:#fdfcf9;font-size:12.5px}.lit-pick-row input[type=checkbox]{width:16px;height:16px;accent-color:var(--btn-primary)}' +
      '.lit-pick-class{overflow-wrap:anywhere;color:var(--text-muted)}.lit-pick-name{overflow-wrap:anywhere}.lit-pick-name small{display:block;margin-top:4px}.lit-pick-id{font-size:12px;color:var(--text-muted);font-weight:400}' +
      '.lit-pick-row.disabled{opacity:.6}@media(max-width:575.98px){#litAssignModal .modal-body{padding:16px}#litAssignModal .modal-header,#litAssignModal .modal-footer{padding:16px}}</style>';
  }

  function ensureModals() {
    if (document.getElementById('litAssignModal')) return;
    document.body.insertAdjacentHTML('beforeend',
      // 테스트 부여 모달
      '<div class="modal fade" id="litAssignModal" tabindex="-1" aria-labelledby="litAssignTitle"><div class="modal-dialog modal-lg modal-dialog-scrollable"><div class="modal-content">' +
      '<div class="modal-header"><h5 class="modal-title font-weight-bold" id="litAssignTitle"><i class="fa-solid fa-paper-plane mr-2"></i>문해력 진단 테스트 부여</h5><button type="button" class="close" data-dismiss="modal" aria-label="닫기">&times;</button></div>' +
      '<div class="modal-body"><div class="text-muted mb-2" style="font-size:12.5px">검사지(밴드)는 등록된 학년으로 자동 추천됩니다. 필요하면 학생별로 한 단계 위/아래 검사지로 바꿀 수 있어요.</div>' +
      '<div class="lit-pick-toolbar"><select id="litPickClass" class="form-control lit-ctl" style="max-width:160px" aria-label="학급 필터" onchange="NanoLiteracyAdmin.renderPick()"><option value="ALL">전체 학급</option></select>' +
      '<input id="litPickSearch" class="form-control lit-ctl" style="flex:1;min-width:180px" aria-label="원생 이름 또는 아이디 검색" placeholder="이름·아이디 검색" onkeydown="if(event.key===\'Enter\'){event.preventDefault();NanoLiteracyAdmin.renderPick();}">' +
      '<button type="button" class="btn btn-beige-primary" onclick="NanoLiteracyAdmin.renderPick()" style="height:40px;white-space:nowrap"><i class="fa-solid fa-magnifying-glass mr-1"></i>검색</button></div>' +
      '<div class="d-flex align-items-center mb-3" style="gap:12px">' +
      '<label class="mb-0 d-flex align-items-center" style="font-size:12.5px;gap:5px"><input type="checkbox" id="litPickAll" onchange="NanoLiteracyAdmin.pickAll(this.checked)"> 현재 목록 전체 선택</label>' +
      '<span class="ml-auto text-muted align-self-center" id="litPickCount" style="font-size:12.5px"></span></div>' +
      '<div class="lit-pick-table"><div class="lit-pick-row lit-pick-head"><span></span><span>학급</span><span>원생명 (아이디)</span><span>학년 · 진단 기준</span><span>검사지</span></div>' +
      '<div id="litPickList"></div></div>' +
      '<div class="row mt-3"><div class="col-sm-4"><label class="lit-lbl">마감일(선택)</label><input type="date" id="litDue" class="form-control lit-ctl"></div>' +
      '<div class="col-sm-8"><label class="lit-lbl">메모(선택)</label><input id="litMemo" maxlength="200" class="form-control lit-ctl" placeholder="예: 6개월 정기 진단"></div></div></div>' +
      '<div class="modal-footer"><button type="button" class="btn btn-beige-secondary" data-dismiss="modal">닫기</button><button type="button" class="btn btn-beige-primary font-weight-bold" id="litAssignBtn" onclick="NanoLiteracyAdmin.submitAssign()">테스트 부여</button></div></div></div></div>' +
      // 결과지 모달
      '<div class="modal fade" id="litReportModal" tabindex="-1"><div class="modal-dialog modal-xl modal-dialog-scrollable"><div class="modal-content" style="border-radius:14px">' +
      '<div class="modal-header flex-wrap" style="gap:8px"><h5 class="modal-title font-weight-bold" id="litReportTitle">결과지</h5>' +
      '<div class="d-flex flex-wrap align-items-center ml-auto" style="gap:6px">' +
      '<div class="btn-group btn-group-sm"><button type="button" class="btn btn-outline-secondary" id="litModeRegular" onclick="NanoLiteracyAdmin.setMode(\'regular\')">정기 진단용</button><button type="button" class="btn btn-outline-secondary" id="litModeConsult" onclick="NanoLiteracyAdmin.setMode(\'consult\')">신규 상담용</button></div>' +
      '<button type="button" class="btn btn-sm btn-beige-secondary" onclick="NanoLiteracyAdmin.printCurrent()"><i class="fa-solid fa-print mr-1"></i>인쇄</button>' +
      '<button type="button" class="btn btn-sm btn-beige-secondary" onclick="NanoLiteracyAdmin.copyLink()"><i class="fa-solid fa-link mr-1"></i>링크 복사</button>' +
      '<button type="button" class="btn btn-sm btn-beige-primary" onclick="NanoLiteracyAdmin.sendKakao()"><i class="fa-solid fa-comment-dots mr-1"></i>카톡 발송</button>' +
      '<button type="button" class="close ml-2" data-dismiss="modal">&times;</button></div></div>' +
      '<div class="modal-body p-0"><div id="litReportBody"></div></div></div></div></div>' +
      // 이력 모달
      '<div class="modal fade" id="litHistoryModal" tabindex="-1"><div class="modal-dialog modal-lg"><div class="modal-content" style="border-radius:14px">' +
      '<div class="modal-header"><h5 class="modal-title font-weight-bold" id="litHistoryTitle">테스트 이력</h5><button type="button" class="close" data-dismiss="modal">&times;</button></div>' +
      '<div class="modal-body" id="litHistoryBody"></div></div></div></div>');
  }

  /* ---------- 목록 ---------- */
  async function refresh(showDone) {
    build();
    if (state.loading) return;
    state.loading = true;
    document.getElementById('litTableBody').innerHTML = '<tr><td colspan="10" class="text-center py-5" role="status">진단 내역을 불러오는 중입니다…</td></tr>';
    try {
      state.items = (await L.api('assignments')).items || [];
      syncClassFilter();
      render();
      if (showDone) toast('최신 내역으로 갱신했습니다.');
    } catch (e) {
      document.getElementById('litTableBody').innerHTML = '<tr><td colspan="10" class="text-center py-5 text-muted">' + esc(e.message || '불러오지 못했습니다.') +
        '<br><small>문해력 진단은 운영 서버(로그인 상태)에서만 사용할 수 있습니다.</small></td></tr>';
    } finally { state.loading = false; }
  }
  function syncClassFilter() {
    var sel = document.getElementById('litClassFilter'), cur = sel.value;
    var names = Array.from(new Set(state.items.map(function (a) { return a.classGroup; }).filter(Boolean))).sort();
    sel.innerHTML = '<option value="ALL">전체 학급</option>' + names.map(function (n) { return '<option value="' + esc(n) + '">' + esc(n) + '</option>'; }).join('');
    sel.value = names.indexOf(cur) >= 0 ? cur : 'ALL';
  }
  function filtered() {
    var cls = document.getElementById('litClassFilter').value, st = document.getElementById('litStatusFilter').value;
    var q = document.getElementById('litSearch').value.trim().toLowerCase();
    return state.items.filter(function (a) {
      return (cls === 'ALL' || a.classGroup === cls) && (st === 'ALL' || a.status === st) &&
        (!q || String(a.studentName).toLowerCase().indexOf(q) >= 0 || String(a.username).toLowerCase().indexOf(q) >= 0);
    }).sort(function (x, y) { return String(y.assignedAt).localeCompare(String(x.assignedAt)); });
  }
  function render() {
    build();
    var all = state.items, now = new Date(), ym = now.toISOString().slice(0, 7);
    var done = all.filter(function (a) { return a.status === 'COMPLETED' && a.summary; });
    var monthDone = done.filter(function (a) { return L.fmtDateShort(a.summary.finishedAt).slice(0, 7) === ym; });
    var avg = done.length ? (done.reduce(function (s, a) { return s + a.summary.level; }, 0) / done.length).toFixed(1) : '-';
    function card(label, num, unit, sub) {
      return '<div class="col-md-3"><div class="stat-card"><div class="text-muted" style="font-size:13px">' + label + '</div><div class="stat-num"><span>' + num + '</span><span style="font-size:16px;font-weight:normal;margin-left:2px">' + unit + '</span></div><small class="text-muted">' + sub + '</small></div></div>';
    }
    document.getElementById('litStats').innerHTML =
      card('응시 대기', all.filter(function (a) { return a.status === 'PENDING'; }).length, '명', '테스트를 아직 시작하지 않음') +
      card('진행 중', all.filter(function (a) { return a.status === 'IN_PROGRESS'; }).length, '명', '시작했지만 제출 전') +
      card('이번 달 완료', monthDone.length, '건', '누적 완료 ' + done.length + '건') +
      card('평균 ' + L.BRAND.levelName, avg, avg === '-' ? '' : '★', '완료 결과지 기준');

    var rows = filtered();
    var body = document.getElementById('litTableBody');
    if (!rows.length) { body.innerHTML = '<tr><td colspan="10" class="text-center py-5 text-muted">배정된 문해력 테스트가 없습니다. 우측 상단의 [테스트 부여]로 시작해 보세요.</td></tr>'; return; }
    body.innerHTML = rows.map(function (a, i) {
      var s = STATUS[a.status] || ['-', '#6b7280', '#f3f4f6'], sm = a.summary;
      var overdue = a.dueDate && (a.status === 'PENDING' || a.status === 'IN_PROGRESS') && a.dueDate < L.fmtDateShort(new Date().toISOString());
      var actions = '';
      if (a.status === 'COMPLETED') actions += '<button class="btn btn-xs btn-outline-secondary lit-act" onclick="NanoLiteracyAdmin.openReport(\'' + esc(a.resultId) + '\')"><i class="fa-solid fa-file-lines mr-1"></i>결과지</button>';
      if (a.status === 'PENDING' || a.status === 'IN_PROGRESS') actions += '<button class="btn btn-xs btn-outline-danger lit-act" onclick="NanoLiteracyAdmin.cancel(\'' + esc(a.id) + '\')">배정 취소</button>';
      actions += '<button class="btn btn-xs btn-outline-secondary lit-act" onclick="NanoLiteracyAdmin.openHistory(\'' + esc(a.memberId) + '\')"><i class="fa-solid fa-chart-line mr-1"></i>이력</button>';
      return '<tr><td class="text-center">' + (rows.length - i) + '</td><td>' + L.fmtDateShort(a.assignedAt) + '</td>' +
        '<td><b>' + esc(a.studentName) + '</b><br><small class="text-muted">' + esc(a.classGroup) + ' · ' + esc(a.username) + '</small></td>' +
        '<td>' + esc(L.GRADE_LABEL[a.gradeStep]) + '</td><td>밴드' + a.band + '</td>' +
        '<td><span class="lit-pill" style="color:' + s[1] + ';background:' + s[2] + '">' + s[0] + '</span></td>' +
        '<td>' + (sm ? L.fmtDateShort(sm.finishedAt) : '-') + '</td>' +
        '<td>' + (sm ? '<b>' + sm.correct + '</b> / ' + sm.total + ' · <b style="color:#1f8a7e">★' + sm.level + '</b>' : '-') + '</td>' +
        '<td' + (overdue ? ' style="color:#dc2626;font-weight:700"' : '') + '>' + (a.dueDate || '-') + (overdue ? '<br><small>마감 지남</small>' : '') + '</td>' +
        '<td style="white-space:nowrap">' + actions + '</td></tr>';
    }).join('');
  }

  /* ---------- 테스트 부여 ---------- */
  var pick = {}; // memberId → { checked, band, gradeStep }
  async function openAssign(memberId, band) {
    build(); ensureModals();
    // 결과지 모달에서 "다시 배정"으로 넘어온 경우 모달이 겹치지 않도록 먼저 닫는다
    global.jQuery('#litReportModal').modal('hide');
    try {
      state.students = (await L.api('students')).items || [];
    } catch (e) { fail(e); return; }
    pick = {};
    state.students.forEach(function (s) {
      pick[s.id] = { checked: false, band: s.band, gradeStep: s.gradeStep };
    });
    // 결과지의 "다시 배정" 버튼에서 넘어온 경우: 해당 학생과 권장 밴드를 미리 채운다
    if (memberId && pick[memberId]) { pick[memberId].checked = true; if (band !== undefined && band !== null) pick[memberId].band = Number(band); }
    var sel = document.getElementById('litPickClass');
    var names = Array.from(new Set(state.students.map(function (s) { return s.classGroup; }))).sort();
    sel.innerHTML = '<option value="ALL">전체 학급</option>' + names.map(function (n) { return '<option value="' + esc(n) + '">' + esc(n) + '</option>'; }).join('');
    document.getElementById('litPickSearch').value = ''; document.getElementById('litMemo').value = ''; document.getElementById('litDue').value = '';
    document.getElementById('litPickAll').checked = false;
    renderPick();
    global.jQuery('#litAssignModal').modal('show');
  }
  function visibleStudents() {
    var cls = document.getElementById('litPickClass').value, q = document.getElementById('litPickSearch').value.trim().toLowerCase();
    return state.students.filter(function (s) { return (cls === 'ALL' || s.classGroup === cls) && (!q || s.name.toLowerCase().indexOf(q) >= 0 || s.username.toLowerCase().indexOf(q) >= 0); });
  }
  function renderPick() {
    var list = visibleStudents(), box = document.getElementById('litPickList');
    if (!list.length) box.innerHTML = '<div class="text-center text-muted py-4" style="font-size:13px">조건에 맞는 원생이 없습니다.</div>';
    else box.innerHTML = list.map(function (s) {
      var p = pick[s.id];
      var gradeSel = '<select class="form-control form-control-sm" aria-label="' + esc(s.name) + ' 진단 기준 학년" ' + (s.hasActive ? 'disabled' : '') + ' onchange="NanoLiteracyAdmin.setPick(\'' + esc(s.id) + '\',\'gradeStep\',this.value)">' +
        (p.gradeStep === null ? '<option value="">학년 선택</option>' : '') +
        [0, 1, 2, 3, 4].map(function (g) { return '<option value="' + g + '"' + (p.gradeStep === g ? ' selected' : '') + '>' + L.GRADE_LABEL[g] + '</option>'; }).join('') + '</select>';
      var bandSel = '<select class="form-control form-control-sm" aria-label="' + esc(s.name) + ' 검사지" ' + (s.hasActive ? 'disabled' : '') + ' onchange="NanoLiteracyAdmin.setPick(\'' + esc(s.id) + '\',\'band\',this.value)">' +
        (p.band === null ? '<option value="">밴드 선택</option>' : '') +
        [0, 1, 2].map(function (b) { return '<option value="' + b + '"' + (p.band === b ? ' selected' : '') + '>' + L.BAND_LABEL[b] + '</option>'; }).join('') + '</select>';
      return '<div class="lit-pick-row' + (s.hasActive ? ' disabled' : '') + '"><input type="checkbox" aria-label="' + esc(s.name) + ' 선택" ' + (p.checked ? 'checked' : '') + (s.hasActive ? ' disabled' : '') + ' onchange="NanoLiteracyAdmin.setPick(\'' + esc(s.id) + '\',\'checked\',this.checked)">' +
        '<span class="lit-pick-class">' + esc(s.classGroup || '미지정') + '</span>' +
        '<span class="lit-pick-name"><b>' + esc(s.name) + '</b> <span class="lit-pick-id">(' + esc(s.username || '아이디 없음') + ')</span><small class="text-muted">' + esc(s.grade || '학년 미등록') + '</small>' + (s.hasActive ? ' <span class="lit-pill" style="color:#b45309;background:#fef3c7">이미 배정됨</span>' : '') + '</span>' + gradeSel + bandSel + '</div>';
    }).join('');
    updatePickCount();
  }
  function updatePickCount() {
    var n = Object.keys(pick).filter(function (id) { return pick[id].checked; }).length;
    document.getElementById('litPickCount').textContent = '선택 ' + n + '명';
    document.getElementById('litAssignBtn').textContent = n ? n + '명에게 테스트 부여' : '테스트 부여';
  }
  function setPick(id, key, value) {
    if (!pick[id]) return;
    if (key === 'checked') pick[id].checked = !!value;
    else {
      pick[id][key] = value === '' ? null : Number(value);
      // 학년을 바꾸면 추천 밴드도 함께 갱신 (원장이 이후 밴드를 따로 바꿀 수 있음)
      if (key === 'gradeStep' && pick[id].gradeStep !== null) pick[id].band = [0, 1, 1, 2, 2][pick[id].gradeStep];
      renderPick();
    }
    updatePickCount();
  }
  function pickAll(on) {
    visibleStudents().forEach(function (s) { if (!s.hasActive) pick[s.id].checked = on; });
    renderPick();
  }
  async function submitAssign() {
    var chosen = Object.keys(pick).filter(function (id) { return pick[id].checked; });
    if (!chosen.length) { toast('테스트를 부여할 원생을 선택해 주세요.', true); return; }
    var missing = chosen.filter(function (id) { return pick[id].band === null || pick[id].gradeStep === null; });
    if (missing.length) {
      var names = missing.map(function (id) { return state.students.find(function (s) { return s.id === id; }).name; });
      toast(names.slice(0, 3).join(', ') + (names.length > 3 ? ' 외' : '') + ': 학년과 검사지를 선택해 주세요.', true); return;
    }
    var btn = document.getElementById('litAssignBtn'); btn.disabled = true;
    try {
      var res = await L.api('assign', { body: { items: chosen.map(function (id) { return { memberId: id, band: pick[id].band, gradeStep: pick[id].gradeStep }; }), dueDate: document.getElementById('litDue').value, memo: document.getElementById('litMemo').value } });
      global.jQuery('#litAssignModal').modal('hide');
      toast(res.created.length + '명에게 테스트를 부여했습니다.' + (res.skipped.length ? ' (제외: ' + res.skipped.join(', ') + ')' : ''));
      refresh();
    } catch (e) { fail(e); } finally { btn.disabled = false; }
  }
  async function cancel(id) {
    if (!global.confirm('이 테스트 배정을 취소할까요?\n학생 화면에서 테스트 시작 버튼이 사라집니다.')) return;
    try { await L.api('cancel', { body: { id: id } }); toast('배정을 취소했습니다.'); refresh(); } catch (e) { fail(e); }
  }

  /* ---------- 결과지 ---------- */
  async function openReport(resultId) {
    ensureModals();
    try {
      var data = await L.api('result', { params: { id: resultId } });
      state.current = data; state.mode = 'regular';
      global.jQuery('#litHistoryModal').modal('hide');
      document.getElementById('litReportTitle').textContent = data.record.student.name + ' 학생 결과지';
      drawReport();
      global.jQuery('#litReportModal').modal('show');
    } catch (e) { fail(e); }
  }
  function drawReport() {
    var d = state.current; if (!d) return;
    document.getElementById('litReportBody').innerHTML = L.renderReport(d.record, d.history, state.mode, { retakeFn: 'NanoLiteracyAdmin.openAssign' });
    document.getElementById('litModeRegular').classList.toggle('active', state.mode === 'regular');
    document.getElementById('litModeConsult').classList.toggle('active', state.mode === 'consult');
  }
  function setMode(m) { state.mode = m; drawReport(); }
  function printCurrent() { var d = state.current; if (d) L.printReport(L.renderReport(d.record, d.history, state.mode)); }
  async function copyLink() {
    var d = state.current; if (!d) return;
    try {
      var url = (await L.api('share_link', { params: { id: d.record.id } })).url;
      try { await navigator.clipboard.writeText(url); toast('학부모 공유 링크를 복사했습니다. 카톡 등에 붙여넣어 보내세요.'); }
      catch (e) { global.prompt('아래 링크를 복사해 학부모에게 전달해 주세요.', url); }
    } catch (e) { fail(e); }
  }
  async function sendKakao() {
    var d = state.current; if (!d) return;
    try {
      var pv = await L.api('kakao', { body: { id: d.record.id, preview: true } });
      var ok = global.confirm('[알림톡 발송 미리보기]\n받는 분: ' + pv.name + ' (' + pv.recipient + ')\n\n' + pv.message + '\n\n이 내용으로 발송할까요?');
      if (!ok) return;
      var res = await L.api('kakao', { body: { id: d.record.id, fingerprint: pv.fingerprint } });
      toast(res.duplicate ? '이미 같은 내용이 발송되었습니다. (' + res.status + ')' : res.status === 'ACCEPTED' ? '알림톡 발송이 접수되었습니다.' : '발송에 실패했습니다. 카톡 발송 내역을 확인해 주세요.', res.status === 'FAILED');
    } catch (e) { fail(e); }
  }

  /* ---------- 학생별 이력 / 레벨 변화 ---------- */
  function openHistory(memberId) {
    ensureModals();
    var list = state.items.filter(function (a) { return a.memberId === memberId; }).sort(function (x, y) { return String(y.assignedAt).localeCompare(String(x.assignedAt)); });
    if (!list.length) return;
    var done = list.filter(function (a) { return a.status === 'COMPLETED' && a.summary; }).sort(function (x, y) { return String(x.summary.finishedAt).localeCompare(String(y.summary.finishedAt)); });
    var last = done[done.length - 1];
    document.getElementById('litHistoryTitle').textContent = list[0].studentName + ' 학생 테스트 이력';
    var chart = done.length
      ? '<div class="mb-3 p-3" style="background:#fffdf7;border:1px solid var(--border-light);border-radius:12px"><div class="font-weight-bold mb-1" style="font-size:13.5px">' + L.BRAND.levelName + ' 변화 ' +
        (done.length > 1 ? '<span class="text-muted font-weight-normal" style="font-size:12px">(첫 진단 ★' + done[0].summary.level + ' → 최근 ★' + last.summary.level + ', ' + (last.summary.level - done[0].summary.level >= 0 ? '+' : '') + (last.summary.level - done[0].summary.level) + ')</span>' : '') + '</div>' +
        '<div class="lit-report" style="max-width:700px"><div class="trend">' + L.trendSvg(done.map(function (a) { return { id: a.resultId, finishedAt: a.summary.finishedAt, level: a.summary.level }; }), last.summary.gradeStep) + '</div></div></div>'
      : '<div class="text-muted mb-3" style="font-size:13px">아직 완료된 진단이 없습니다.</div>';
    var rows = list.map(function (a) {
      var s = STATUS[a.status], sm = a.summary;
      return '<tr><td>' + L.fmtDateShort(a.assignedAt) + '</td><td>' + (sm ? L.fmtDateShort(sm.finishedAt) : '-') + '</td><td>밴드' + a.band + ' · ' + esc(L.GRADE_LABEL[a.gradeStep]) + '</td>' +
        '<td><span class="lit-pill" style="color:' + s[1] + ';background:' + s[2] + '">' + s[0] + '</span></td><td>' + (sm ? sm.correct + '/' + sm.total + ' · <b>★' + sm.level + '</b>' : '-') + '</td>' +
        '<td>' + (a.status === 'COMPLETED' ? '<button class="btn btn-xs btn-outline-secondary lit-act" onclick="NanoLiteracyAdmin.openReport(\'' + esc(a.resultId) + '\')">결과지</button>' : '') + '</td></tr>';
    }).join('');
    document.getElementById('litHistoryBody').innerHTML = chart +
      '<table class="simple-table" style="margin:0"><thead><tr><th>배정일</th><th>응시일</th><th>검사지</th><th>상태</th><th>결과</th><th></th></tr></thead><tbody>' + rows + '</tbody></table>';
    global.jQuery('#litHistoryModal').modal('show');
  }

  global.NanoLiteracyAdmin = {
    show: function () { build(); refresh(); }, refresh: refresh, render: render,
    openAssign: openAssign, renderPick: renderPick, setPick: setPick, pickAll: pickAll, submitAssign: submitAssign, cancel: cancel,
    openReport: openReport, setMode: setMode, printCurrent: printCurrent, copyLink: copyLink, sendKakao: sendKakao, openHistory: openHistory
  };
})(window);
