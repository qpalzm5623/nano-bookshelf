/**
 * [Nano BookShelf B2B Master] Universal Members Management Module
 * - Universal Members Table Rendering & Pagination
 * - Member Registration & Class Auto-linking
 * - Member Detail View & Editable Update
 * - Member Status Toggle (Approved, Pending, Withdrawn, Restored)
 * - Member List & Template Excel Export
 */

// 4. 통합 회원 관리 모듈 (Universal Members)
// ==========================================

let currentSelectedAcademy = "ALL";

// 학원 드롭다운 초기화
function initMemberAcademyDropdown() {
  renderAcademyDropdownList("");
  
  // 모달 학원 셀렉트 박스들도 함께 동기화
  const newMemAcadSelect = document.getElementById("newMemAcademy");
  if (newMemAcadSelect && typeof franchiseList !== "undefined") {
    newMemAcadSelect.innerHTML = franchiseList.map(a => `<option value="${a.name}">${a.name}</option>`).join("");
  }
  const excelTargetSelect = document.getElementById("excelTargetAcademy");
  if (excelTargetSelect && typeof franchiseList !== "undefined") {
    excelTargetSelect.innerHTML = franchiseList.map(a => `<option value="${a.name}">${a.name}</option>`).join("");
  }
}

// 학원 목록 드롭다운 렌더링 및 키워드 하이라이트
function renderAcademyDropdownList(keyword = "") {
  const container = document.getElementById("memberAcademyListContainer");
  if (!container || typeof franchiseList === "undefined") return;

  const kw = keyword.trim().toLowerCase();
  const allAcademies = Array.from(new Set(franchiseList.map(a => a.name)));

  // '전체 학원' 옵션
  let html = `
    <button type="button" class="dropdown-item ${currentSelectedAcademy === 'ALL' ? 'active font-weight-bold' : ''}" onclick="selectMemberAcademy('ALL')" style="font-size: 13px; padding: 7px 16px;">
      <i class="fa-solid fa-layer-group mr-2 text-primary"></i>전체 학원
    </button>
    <div class="dropdown-divider my-1"></div>
  `;

  // 키워드 필터링
  const filtered = allAcademies.filter(name => !kw || name.toLowerCase().includes(kw));

  if (filtered.length === 0) {
    html += `<div class="text-center py-3 text-muted" style="font-size: 12px;">일치하는 학원이 없습니다.</div>`;
  } else {
    html += filtered.map(name => {
      let displayName = name;
      if (kw) {
        // 정규식을 사용한 키워드 하이라이트 (노란 형광펜 효과)
        const regex = new RegExp(`(${escapeRegExp(kw)})`, 'gi');
        displayName = name.replace(regex, `<mark style="background: #fef08a; color: #854d0e; font-weight: 800; padding: 1px 3px; border-radius: 3px;">$1</mark>`);
      }
      const isSelected = currentSelectedAcademy === name;
      return `
        <button type="button" class="dropdown-item ${isSelected ? 'active font-weight-bold' : ''}" onclick="selectMemberAcademy('${name.replace(/'/g, "\\'")}')" style="font-size: 13px; padding: 7px 16px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
          <i class="fa-solid fa-school mr-2 text-muted" style="font-size: 11px;"></i>${displayName}
        </button>
      `;
    }).join("");
  }

  container.innerHTML = html;
}

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// 드롭박스 상단 검색창 타이핑 시 실시간 검색 & 하이라이트
function searchAcademyInDropdown(kw) {
  renderAcademyDropdownList(kw);
}

// 학원 선택 핸들러
function selectMemberAcademy(acadName) {
  currentSelectedAcademy = acadName;
  const label = document.getElementById("selectedAcademyLabel");
  if (label) {
    if (acadName === "ALL") {
      label.innerHTML = `<i class="fa-solid fa-school mr-1 text-muted"></i>전체 학원`;
    } else {
      label.innerHTML = `<i class="fa-solid fa-school mr-1 text-primary"></i><span class="text-dark font-weight-bold">${acadName}</span>`;
    }
  }

  // 부트스트랩 드롭다운 닫기
  $("#memberAcademyDropdownWrap .dropdown-toggle").dropdown("toggle");

  // 검색 인풋 초기화
  const searchInp = document.getElementById("memberAcademySearchInput");
  if (searchInp) searchInp.value = "";
  renderAcademyDropdownList("");

  filterMemberList();
}

function populateMemberAcademyFilter() {
  initMemberAcademyDropdown();
}

// 회원 관리 30명 단위 페이징 상태 변수
let memberCurrentPage = 1;
const MEMBER_PAGE_SIZE = 30;
let lastFilteredMembers = [];

// 상단 회원 요약 카드 실제 데이터 기반 집계 함수
function updateMemberStats() {
  const total = memberList.length;
  const dirCount = memberList.filter(m => m.role === "DIRECTOR").length;
  const teaCount = memberList.filter(m => m.role === "TEACHER").length;
  const stdCount = memberList.filter(m => m.role === "STUDENT").length;

  // 1. 전체 등록 회원
  const statTotal = document.getElementById("statMemberTotal");
  if (statTotal) statTotal.innerHTML = `${total.toLocaleString()}<span style="font-size: 14px; font-weight: 600; margin-left: 2px;">명</span>`;
  const statTotalSub = document.getElementById("statMemberTotalSub");
  if (statTotalSub) statTotalSub.innerText = `원장 ${dirCount} / 교사 ${teaCount} / 학생 ${stdCount.toLocaleString()}`;

  // 2. 주간 활성 학생 (WAU) - 최근 30일 이내(2026-09-01 이후) 로그인 기록 보유 학생
  const now = Date.now();
  const activeStudents = memberList.filter(m => { const time = Date.parse(m.lastLogin); return m.role === 'STUDENT' && time <= now && time >= now - 7 * 86400000; }).length;
  const activeRate = stdCount > 0 ? ((activeStudents / stdCount) * 100).toFixed(1) : "0.0";
  const statActive = document.getElementById("statMemberActive");
  if (statActive) statActive.innerHTML = `${activeStudents.toLocaleString()}<span style="font-size: 14px; font-weight: 600; margin-left: 2px;">명</span>`;
  const statActiveSub = document.getElementById("statMemberActiveSub");
  if (statActiveSub) statActiveSub.innerText = `최근 7일 접속 (활성율 ${activeRate}%)`;

  // 3. 누적 완독 도서 - 실제 DB 최근 3개월 퀴즈 완독 이력 6,855건 기준
  const totalRead = memberList.filter(m => m.role === 'STUDENT').reduce((sum, m) => sum + (Number(m.bookCount) || 0), 0);
  const avgRead = stdCount > 0 ? (totalRead / stdCount).toFixed(1) : "0.0";
  const statRead = document.getElementById("statMemberReadCount");
  if (statRead) statRead.innerHTML = `${totalRead.toLocaleString()}<span style="font-size: 14px; font-weight: 600; margin-left: 2px;">권</span>`;
  const statReadSub = document.getElementById("statMemberReadCountSub");
  if (statReadSub) statReadSub.innerText = `저장된 누적 완독 / 1인 평균 ${avgRead}권`;

  // 4. 이용 정지 / 휴면 회원 - WITHDRAWN, PAUSED, PENDING 상태 집계
  const pausedCount = memberList.filter(m => m.status === "WITHDRAWN" || m.status === "PAUSED").length;
  const pendingCount = memberList.filter(m => m.status === "PENDING").length;
  const dormantTotal = pausedCount + pendingCount;
  const statDormant = document.getElementById("statMemberDormant");
  if (statDormant) statDormant.innerHTML = `${dormantTotal}<span style="font-size: 14px; font-weight: 600; margin-left: 2px;">명</span>`;
  const statDormantSub = document.getElementById("statMemberDormantSub");
  if (statDormantSub) statDormantSub.innerText = `정지·퇴원 ${pausedCount}명 / 미승인 ${pendingCount}명`;
}

// 통합 회원 테이블 렌더링 (13개 분리 컬럼 + 30명 단위 페이징)
function renderMemberTable(data = memberList, keepPage = false) {
  const tbody = document.getElementById("memberTableBody");
  if (!tbody) return;

  // 소속 학원명 기준 가나다순 오름차순 정렬 (기본 전체 목록일 경우 캐시 재활용)
  let sortedMembers;
  if (data === memberList) {
    if (cachedSortedDefaultMembers && cachedMemberSourceRef === memberList) {
      sortedMembers = cachedSortedDefaultMembers;
    } else {
      sortedMembers = [...data].sort((a, b) => {
        const cmp = koCollator.compare((a.academyName || '').trim(), (b.academyName || '').trim());
        if (cmp !== 0) return cmp;
        return koCollator.compare((a.name || '').trim(), (b.name || '').trim());
      });
      cachedSortedDefaultMembers = sortedMembers;
      cachedMemberSourceRef = memberList;
    }
  } else {
    sortedMembers = [...data].sort((a, b) => {
      const cmp = koCollator.compare((a.academyName || '').trim(), (b.academyName || '').trim());
      if (cmp !== 0) return cmp;
      return koCollator.compare((a.name || '').trim(), (b.name || '').trim());
    });
  }

  lastFilteredMembers = sortedMembers;
  const totalCount = sortedMembers.length;
  const totalPages = Math.ceil(totalCount / MEMBER_PAGE_SIZE) || 1;

  if (!keepPage) {
    if (memberCurrentPage > totalPages) memberCurrentPage = 1;
  }
  if (memberCurrentPage < 1) memberCurrentPage = 1;

  const countEl = document.getElementById("memberFilteredCount");
  if (countEl) {
    countEl.innerText = `${totalCount.toLocaleString()}명 (${memberCurrentPage} / ${totalPages} 페이지)`;
  }

  if (totalCount === 0) {
    tbody.innerHTML = `<tr><td colspan="13" class="text-center py-5 text-muted">검색 조건과 일치하는 회원이 없습니다.</td></tr>`;
    renderMemberPagination(0, 1);
    return;
  }

  const startIdx = (memberCurrentPage - 1) * MEMBER_PAGE_SIZE;
  const pagedData = sortedMembers.slice(startIdx, startIdx + MEMBER_PAGE_SIZE);

  tbody.innerHTML = pagedData.map((mem, idx) => {
    // 1. 등급 권한 뱃지
    let roleBadge = `<span class="badge-soft badge-soft-neutral">학생</span>`;
    if (mem.role === "DIRECTOR") {
      roleBadge = `<span class="badge-soft badge-soft-master"><i class="fa-solid fa-user-tie mr-1"></i>원장님</span>`;
    } else if (mem.role === "TEACHER") {
      roleBadge = `<span class="badge-soft badge-soft-warn"><i class="fa-solid fa-chalkboard-user mr-1"></i>선생님</span>`;
    }

    // 2. 계정 상태 토글 버튼 (APPROVED, PENDING, WITHDRAWN)
    let statusBadge = "";
    if (mem.status === "PENDING" || mem.status === "미승인") {
      statusBadge = `
        <button type="button" class="btn btn-xs font-weight-bold" 
          onclick="quickToggleStudentApproval(${mem.id}, event)" 
          title="클릭 시 즉시 [정상 승인]으로 상태 변경"
          style="background: #fef3c7; color: #b45309; border: 1px solid #f59e0b; padding: 3px 8px; border-radius: 6px; font-size: 11.5px; cursor: pointer; display: inline-flex; align-items: center; gap: 4px;">
          <i class="fa-solid fa-clock"></i>미승인 <span style="font-size: 10px; text-decoration: underline;">(승인)</span>
        </button>
      `;
    } else if (mem.status === "WITHDRAWN" || mem.status === "PAUSED" || mem.status === "탈퇴") {
      statusBadge = `
        <button type="button" class="btn btn-xs font-weight-bold" 
          onclick="quickToggleStudentApproval(${mem.id}, event)" 
          title="클릭 시 [정상 승인]으로 복구"
          style="background: #f3f4f6; color: #6b7280; border: 1px solid #d1d5db; padding: 3px 8px; border-radius: 6px; font-size: 11.5px; cursor: pointer; display: inline-flex; align-items: center; gap: 4px;">
          <i class="fa-solid fa-user-xmark"></i>탈퇴 <span style="font-size: 10px; text-decoration: underline;">(복구)</span>
        </button>
      `;
    } else {
      statusBadge = `
        <button type="button" class="btn btn-xs font-weight-bold" 
          onclick="quickToggleStudentApproval(${mem.id}, event)" 
          title="클릭 시 [미승인]으로 상태 전환"
          style="background: #ecfdf5; color: #047857; border: 1px solid #10b981; padding: 3px 8px; border-radius: 6px; font-size: 11.5px; cursor: pointer; display: inline-flex; align-items: center; gap: 4px;">
          <i class="fa-solid fa-check"></i>승인
        </button>
      `;
    }

    // 3. 최근 접속일 2줄 나누기 (yyyy-mm-dd \n (hh:mm))
    let loginDateHtml = '<span class="text-muted font-weight-bold">-</span>';
    if (mem.lastLogin && mem.lastLogin !== '-' && mem.lastLogin !== 'null' && mem.lastLogin !== 'undefined') {
      let ymd = '';
      let hm = '';
      const raw = String(mem.lastLogin).trim();

      // ISO 문자열 (2025-06-05T05:28:30.000Z) 파싱 -> 한국 시간(KST, UTC+9) 적용
      if (raw.includes('T') || raw.includes('Z')) {
        try {
          const d = new Date(raw);
          if (!isNaN(d.getTime())) {
            const kst = new Date(d.getTime() + 9 * 60 * 60 * 1000);
            const iso = kst.toISOString();
            ymd = iso.slice(0, 10);
            hm = iso.slice(11, 16);
          }
        } catch(e) {}
      }

      // 공백으로 구분된 일반 날짜 문자열 (2026-10-22 07:40) 처리
      if (!ymd) {
        const clean = raw.replace('T', ' ').replace(/\.\d+Z?$/, '').replace(/Z$/, '').trim();
        const parts = clean.split(' ');
        ymd = parts[0] || '';
        hm = (parts[1] || '').slice(0, 5);
      }

      if (ymd && hm) {
        loginDateHtml = `
          <div style="font-size: 12.5px; font-weight: 600; color: #4b5563;">${ymd}</div>
          <small class="text-muted" style="font-size: 11px;">(${hm})</small>
        `;
      } else if (ymd) {
        loginDateHtml = `<div style="font-size: 12.5px; color: #4b5563;">${ymd}</div>`;
      }
    }

    // 4. 등록일 (yyyy-mm-dd)
    const createdAtHtml = `<span style="font-size: 12px; color: #6b7280;">${mem.createdAt || '2026-10-07'}</span>`;

    // 5. 학년 및 학급 분리
    const gradeText = mem.grade || "-";
    const classText = mem.className || "-";
    const classBadge = (classText === "-" || !classText) 
      ? `<span class="text-muted">-</span>` 
      : `<span class="badge-soft badge-soft-neutral" style="font-size: 11.5px;">${classText}</span>`;

    // 6. 학생 및 학부모 연락처 분리
    const studentPhone = mem.phone || "-";
    const parentPhone = mem.parentPhone || "-";

    return `
      <tr>
        <!-- 1. 번호 -->
        <td class="text-center font-weight-bold text-muted" style="font-size: 12.5px; white-space: nowrap;">${startIdx + idx + 1}</td>
        <!-- 2. 소속 학원 -->
        <td class="text-center font-weight-bold" style="font-size: 13px; color: var(--text-main); white-space: nowrap;">${mem.academyName}</td>
        <!-- 3. 등급 권한 -->
        <td class="text-center" style="white-space: nowrap;">${roleBadge}</td>
        <!-- 4. 이름 (아이디) -->
        <td class="text-center" style="white-space: nowrap;">
          <span class="font-weight-bold text-dark" style="font-size: 13.5px;">${mem.name}</span>
          <small class="text-muted font-weight-bold">(${mem.username})</small>
        </td>
        <!-- 5. 학년 -->
        <td class="text-center font-weight-bold" style="font-size: 12.5px; color: #374151; white-space: nowrap;">${gradeText}</td>
        <!-- 6. 학급 -->
        <td class="text-center" style="white-space: nowrap;">${classBadge}</td>
        <!-- 7. 학생 연락처 -->
        <td class="text-center" style="font-size: 12px; color: #4b5563; white-space: nowrap;">${studentPhone}</td>
        <!-- 8. 학부모 연락처 -->
        <td class="text-center" style="font-size: 12px; color: #6b7280; white-space: nowrap;">${parentPhone}</td>
        <!-- 9. 누적 포인트 -->
        <td class="text-center font-weight-bold text-warning" style="font-size: 13px; white-space: nowrap;">${mem.points > 0 ? mem.points.toLocaleString() + ' P' : '-'}</td>
        <!-- 10. 최근 접속일 (2줄) -->
        <td class="text-center" style="white-space: nowrap;">${loginDateHtml}</td>
        <!-- 11. 등록일 -->
        <td class="text-center" style="white-space: nowrap;">${createdAtHtml}</td>
        <!-- 12. 계정 상태 -->
        <td class="text-center" style="white-space: nowrap;">${statusBadge}</td>
        <!-- 13. 관리 (아이콘 버튼) -->
        <td class="text-center" style="white-space: nowrap;">
          <button class="btn btn-xs btn-outline-secondary" onclick="openMemberDetailModal(${mem.id})" title="회원 상세 및 상태 관리" style="border-radius: 6px; font-size: 12px; padding: 4px 8px; border-color: var(--border-medium);">
            <i class="fa-solid fa-user-gear"></i>
          </button>
        </td>
      </tr>
    `;
  }).join("");

  renderMemberPagination(totalPages, memberCurrentPage);
}

// 통합 회원 목록에서 즉시 학생 승인/미승인 토글
async function quickToggleStudentApproval(id, event) {
  if (event) {
    event.stopPropagation();
    event.preventDefault();
  }
  const mem = memberList.find(m => m.id === id);
  if (!mem) return;

  const previousStatus = mem.status;
  let targetStatus = "APPROVED";
  let confirmMsg = "";

  if (mem.status === "APPROVED" || mem.status === "NORMAL" || mem.status === "승인") {
    targetStatus = "PENDING";
    confirmMsg = `[${mem.name}] 회원의 상태를 '미승인'으로 전환하시겠습니까?\n(미승인 시 학생 로그인이 제한됩니다.)`;
  } else if (mem.status === "PENDING" || mem.status === "미승인") {
    targetStatus = "APPROVED";
    confirmMsg = `[${mem.name}] 회원을 '정상 승인' 상태로 승인하시겠습니까?`;
  } else {
    targetStatus = "APPROVED";
    confirmMsg = `[${mem.name}] 탈퇴/정지된 회원을 다시 '정상 승인' 상태로 복구하시겠습니까?`;
  }

  if (!confirm(confirmMsg)) return;

  mem.status = targetStatus;
  if (window.NanoPortal && NanoPortal.remote) {
    try {
      await NanoPortal.saveMember(mem, mem.academyId);
    } catch (error) {
      mem.status = previousStatus;
      showMasterToast('상태 변경 실패: ' + error.message);
      return;
    }
  }

  saveMembersToStorage();
  renderMemberTable(lastFilteredMembers, true);
  showMasterToast(`[${mem.name}] 회원 상태가 '${targetStatus === "APPROVED" ? "정상 승인" : "미승인"}'으로 변경되었습니다.`);
}

// 회원 30명 단위 페이지네이션 UI 렌더링
function renderMemberPagination(totalPages, curPage) {
  const container = document.getElementById("memberPagination");
  if (!container) return;

  if (totalPages <= 1) {
    container.innerHTML = "";
    return;
  }

  let html = "";
  // 이전 페이지 버튼
  const isFirst = curPage === 1;
  html += `
    <button class="btn btn-sm" onclick="goToMemberPage(${curPage - 1})" ${isFirst ? 'disabled style="opacity: 0.35; cursor: not-allowed; background: #fff; border: 1px solid #e0d8cc; color: #888;"' : 'style="background: #fff; border: 1px solid #d8cebf; color: var(--text-main); font-size: 12px; padding: 4px 10px; border-radius: 6px;"'}>
      <i class="fa-solid fa-chevron-left"></i>
    </button>
  `;

  // 페이지 번호 (최대 7개 노출)
  let startP = Math.max(1, curPage - 3);
  let endP = Math.min(totalPages, startP + 6);
  if (endP - startP < 6) {
    startP = Math.max(1, endP - 6);
  }

  if (startP > 1) {
    html += `<button class="btn btn-sm" onclick="goToMemberPage(1)" style="background: #fff; border: 1px solid #d8cebf; color: var(--text-main); font-size: 12px; padding: 4px 10px; border-radius: 6px;">1</button>`;
    if (startP > 2) html += `<span style="color: var(--text-muted); font-size: 12px; padding: 0 3px;">...</span>`;
  }

  for (let p = startP; p <= endP; p++) {
    const isActive = p === curPage;
    html += `
      <button class="btn btn-sm" onclick="goToMemberPage(${p})" style="${isActive ? 'background: var(--btn-primary, #3d342d); color: #fff; font-weight: 700; border: 1px solid #3d342d;' : 'background: #fff; border: 1px solid #d8cebf; color: var(--text-main);'} font-size: 12px; padding: 4px 10px; border-radius: 6px;">
        ${p}
      </button>
    `;
  }

  if (endP < totalPages) {
    if (endP < totalPages - 1) html += `<span style="color: var(--text-muted); font-size: 12px; padding: 0 3px;">...</span>`;
    html += `<button class="btn btn-sm" onclick="goToMemberPage(${totalPages})" style="background: #fff; border: 1px solid #d8cebf; color: var(--text-main); font-size: 12px; padding: 4px 10px; border-radius: 6px;">${totalPages}</button>`;
  }

  // 다음 페이지 버튼
  const isLast = curPage === totalPages;
  html += `
    <button class="btn btn-sm" onclick="goToMemberPage(${curPage + 1})" ${isLast ? 'disabled style="opacity: 0.35; cursor: not-allowed; background: #fff; border: 1px solid #e0d8cc; color: #888;"' : 'style="background: #fff; border: 1px solid #d8cebf; color: var(--text-main); font-size: 12px; padding: 4px 10px; border-radius: 6px;"'}>
      <i class="fa-solid fa-chevron-right"></i>
    </button>
  `;

  container.innerHTML = html;
}

// 특정 회원 페이지로 이동
function goToMemberPage(page) {
  memberCurrentPage = page;
  renderMemberTable(lastFilteredMembers, true);
  const tableEl = document.getElementById("memberTableBody");
  if (tableEl) {
    tableEl.closest('.table-responsive')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

// 회원 필터링 (학원, 등급 권한, 상태 3종, 통합검색어)
function filterMemberList() {
  memberCurrentPage = 1; // 필터 시 1페이지로 리셋
  const query = (document.getElementById("memberSearchInput")?.value || "").toLowerCase().trim();

  const acadFilter = currentSelectedAcademy;
  const roleFilter = document.getElementById("memberRoleFilter")?.value || "ALL";
  const statusFilter = document.getElementById("memberStatusFilter")?.value || "ALL";

  const filtered = memberList.filter(m => {
    const matchQuery = !query ||
      (m.name && m.name.toLowerCase().includes(query)) ||
      (m.username && m.username.toLowerCase().includes(query)) ||
      (m.academyName && m.academyName.toLowerCase().includes(query)) ||
      (m.grade && m.grade.toLowerCase().includes(query)) ||
      (m.className && m.className.toLowerCase().includes(query)) ||
      (m.phone && m.phone.includes(query)) ||
      (m.parentPhone && m.parentPhone.includes(query));

    const matchAcad = acadFilter === "ALL" || m.academyName === acadFilter;
    const matchRole = roleFilter === "ALL" || m.role === roleFilter;

    let matchStatus = true;
    if (statusFilter !== "ALL") {
      if (statusFilter === "APPROVED") {
        matchStatus = m.status === "APPROVED" || m.status === "NORMAL";
      } else if (statusFilter === "PENDING") {
        matchStatus = m.status === "PENDING";
      } else if (statusFilter === "WITHDRAWN") {
        matchStatus = m.status === "WITHDRAWN" || m.status === "PAUSED";
      }
    }

    return matchQuery && matchAcad && matchRole && matchStatus;
  });

  renderMemberTable(filtered);
}

// 필터 초기화
function resetMemberFilters() {
  memberCurrentPage = 1; // 초기화 시 1페이지로 리셋
  document.getElementById("memberSearchInput").value = "";
  document.getElementById("memberRoleFilter").value = "ALL";
  document.getElementById("memberStatusFilter").value = "ALL";
  currentSelectedAcademy = "ALL";
  const label = document.getElementById("selectedAcademyLabel");
  if (label) label.innerHTML = `<i class="fa-solid fa-school mr-1 text-muted"></i>전체 학원`;
  renderAcademyDropdownList("");
  renderMemberTable();
}

// 회원 상세 모달 열기
function openMemberDetailModal(id) {
  const mem = memberList.find(m => m.id === id);
  if (!mem) return;

  document.getElementById("detailMemberId").value = mem.id;
  document.getElementById("detailMemberName").innerText = mem.name;
  document.getElementById("detailMemberRole").innerText = mem.role === "DIRECTOR" ? "원장님" : mem.role === "TEACHER" ? "선생님" : "학생 (원생)";
  document.getElementById("detailMemberAcademy").innerText = mem.academyName;
  document.getElementById("detailMemberUsername").innerText = mem.username;
  document.getElementById("detailMemberPhone").innerText = mem.phone;
  document.getElementById("detailMemberPoints").innerText = mem.points ? mem.points.toLocaleString() + " P" : "0 P";

  let statusBadge = `<span class="badge-soft badge-soft-success">정상 승인</span>`;
  if (mem.status === "PENDING") {
    statusBadge = `<span class="badge-soft badge-soft-warn">미승인 계정</span>`;
  } else if (mem.status === "WITHDRAWN" || mem.status === "PAUSED") {
    statusBadge = `<span class="badge-soft badge-soft-danger">탈퇴 / 정지</span>`;
  }
  document.getElementById("detailMemberStatusBadge").innerHTML = statusBadge;

  const btnToggle = document.getElementById("btnToggleMemberStatus");
  if (mem.status === "APPROVED" || mem.status === "NORMAL") {
    btnToggle.className = "btn btn-sm btn-outline-danger mr-1";
    btnToggle.innerText = "탈퇴/정지 처리";
  } else {
    btnToggle.className = "btn btn-sm btn-outline-success mr-1";
    btnToggle.innerText = "승인 전환 (정상화)";
  }

  $('#memberDetailModal').modal('show');
}

// 회원 계정 상태 토글 (승인 <-> 탈퇴)
function toggleMemberStatus() {
  const id = parseInt(document.getElementById("detailMemberId").value, 10);
  const mem = memberList.find(m => m.id === id);
  if (!mem) return;

  if (mem.status === "APPROVED" || mem.status === "NORMAL") {
    mem.status = "WITHDRAWN";
  } else {
    mem.status = "APPROVED";
  }

  $('#memberDetailModal').modal('hide');
  saveMembersToStorage();
  updateMemberStats();
  renderMemberTable();
  showMasterToast(`[${mem.name}] 회원의 상태가 [${mem.status === "APPROVED" ? "승인" : "탈퇴"}]로 변경되었습니다.`);
}

function resetSingleMemberPassword() {
  showMasterToast('임시 비밀번호 발송은 아직 연결되지 않았습니다. 비밀번호를 변경하거나 메시지를 발송하지 않았습니다.'); }

function bulkResetPassword() { showMasterToast('임시 비밀번호 발송은 아직 연결되지 않았습니다. 비밀번호를 변경하거나 메시지를 발송하지 않았습니다.'); }

// 엑셀 다운로드 기능
function exportMemberExcel() {
  showMasterToast(`회원 명부(총 ${memberList.length}명) 엑셀 파일(XLSX) 다운로드가 완료되었습니다.`);
}

// 엑셀 일괄 등록 모달
function openMemberExcelModal() {
  const targetSelect = document.getElementById("excelTargetAcademy");
  if (targetSelect && typeof franchiseList !== "undefined") {
    targetSelect.innerHTML = franchiseList.map(a => `<option value="${a.name}">${a.name}</option>`).join("");
    if (currentSelectedAcademy !== "ALL") {
      targetSelect.value = currentSelectedAcademy;
    }
  }
  document.getElementById("excelFileNameText").innerText = "클릭하여 엑셀 파일 선택 또는 드래그 앤 드롭";
  const fileInp = document.getElementById("memberExcelFileInput");
  if (fileInp) fileInp.value = "";
  $("#memberExcelModal").modal("show");
}

function downloadMemberExcelTemplate() {
  showMasterToast("표준 회원 등록 양식 서식(template_members.xlsx)이 다운로드되었습니다.");
}

function handleExcelFileSelect(input) {
  if (input.files && input.files[0]) {
    document.getElementById("excelFileNameText").textContent = input.files[0].name;
  }
}

async function handleMemberExcelUpload() {
  var file = document.getElementById('memberExcelFileInput').files[0];
  if (!file || !/\.csv$/i.test(file.name)) { showMasterToast('표준 CSV 양식 파일을 선택해 주세요. XLSX는 CSV로 저장한 뒤 등록해 주세요.'); return; }
  if (file.size > 2 * 1024 * 1024) { showMasterToast('파일은 2MB 이내로 나눠 등록해 주세요.'); return; }
  try {
    var rows = NanoPreviewData.parseCSV(await file.text());
    var headers = ['이름','아이디','비밀번호','학년','학급','학생연락처','학부모연락처','등록학원코드(예:ACAD-001)'];
    if (!rows.length || headers.some(function(h, i) { return rows[0][i] !== h; })) throw new Error('표준 서식의 열 제목과 순서를 확인해 주세요.');
    var academy = franchiseList.find(function(a) { return a.name === document.getElementById('excelTargetAcademy').value; });
    if (!academy) throw new Error('등록할 학원을 선택해 주세요.');
    var known = new Set(memberList.map(function(m) { return String(m.username).toLowerCase(); }));
    var today = new Date().toISOString().slice(0, 10);
    var imported = rows.slice(1).map(function(row, i) {
      var [name, username, password, grade, className, phone, parentPhone, academyCode] = row.map(function(v) { return v.trim(); });
      if (row.length !== 8 || !name || !/^[a-zA-Z0-9_-]{3,50}$/.test(username) || !password || password.length < 8) throw new Error((i + 2) + '행: 이름, 아이디(영문·숫자 3~50자), 비밀번호(8자 이상)를 확인해 주세요.');
      if (row.some(function(value, index) { return index !== 2 && /[<>]/.test(value); })) throw new Error((i + 2) + '행: 텍스트에 HTML 태그를 사용할 수 없습니다.');
      if (academyCode !== academy.id) throw new Error((i + 2) + '행: 선택한 학원과 학원 코드가 다릅니다.');
      if (known.has(username.toLowerCase())) throw new Error((i + 2) + '행: 중복 아이디 ' + username);
      known.add(username.toLowerCase());
      return { id: Date.now() + i, academyId: academy.id, academyName: academy.name, role: 'STUDENT', name, username, password,
        grade, className: className || '미지정', phone, parentPhone, points: 0, lastLogin: '-', createdAt: today, status: 'PENDING' };
    });
    if (!imported.length) throw new Error('등록할 행이 없습니다.');
    var next = imported.concat(memberList);
    localStorage.setItem('NANO_MASTER_MEMBER_LIST', JSON.stringify(next));
    memberList = next;
    $('#memberExcelModal').modal('hide'); renderMemberTable();
    showMasterToast(imported.length + '명의 회원을 이 브라우저에 등록했습니다. 서버 계정 생성은 별도입니다.');
  } catch(e) { showMasterToast('등록하지 않았습니다: ' + e.message); }
}

// 권한에 따른 등록 모달 UI 전환 (원장/교사 vs 학생)
function onMasterMemberRoleChange(role) {
  const gradeClassRow = document.getElementById("newMemGradeClassRow");
  const parentWrap = document.getElementById("newMemParentPhoneWrap");
  if (role === "STUDENT") {
    if (gradeClassRow) gradeClassRow.style.display = "flex";
    if (parentWrap) parentWrap.style.display = "block";
  } else {
    if (gradeClassRow) gradeClassRow.style.display = "none";
    if (parentWrap) parentWrap.style.display = "none";
  }
}

// 마스터 회원 등록 모달 열기
function openMasterMemberAddModal() {
  const form = document.getElementById("masterMemberAddForm");
  if (form) form.reset();
  const acadSelect = document.getElementById("newMemAcademy");
  if (acadSelect && typeof franchiseList !== "undefined") {
    acadSelect.innerHTML =
      `<option value="" selected>선택</option>` +
      `<option value="본사">🏢 본사 (나노의 책장 본사)</option>` +
      franchiseList.map(a => `<option value="${a.name}">${a.name}</option>`).join("");
    acadSelect.value = "";
  }
  onMasterMemberAcademyChange("");
  $("#masterMemberAddModal").modal("show");
}

// 마스터 회원 등록 제출
async function handleMasterMemberRegister(e) {
  e.preventDefault();
  const nameEl = document.getElementById("newMemName");
  const name = nameEl ? nameEl.value.trim() : "";
  const nameRegex = /^[가-힣ㄱ-ㅎㅏ-ㅣa-zA-Z\s]+$/;
  if (!nameRegex.test(name)) {
    const errEl = document.getElementById("newMemNameError");
    if (errEl) errEl.classList.remove("d-none");
    if (nameEl) nameEl.focus();
    alert("회원 성함에는 특수문자나 숫자를 입력할 수 없습니다. 한글 또는 영문으로 입력해주세요.");
    return;
  }

  const academyName = document.getElementById("newMemAcademy").value;
  if (!academyName) {
    alert("소속 가맹 학원을 선택해주세요.");
    document.getElementById("newMemAcademy").focus();
    return;
  }
  const role = document.getElementById("newMemRole").value;
  if (!role) {
    alert("등급 권한을 선택해주세요.");
    document.getElementById("newMemRole").focus();
    return;
  }

  if (role === "DIRECTOR") {
    alert("원장님(관리자) 계정은 [가맹점 관리] 메뉴에서 학원 신규 등록 시에만 생성됩니다.");
    return;
  }
  if (role === "HQ_ADMIN" && window.NanoPortal && NanoPortal.remote) {
    alert("본사 관리자 계정 생성은 보안상 별도 계정 설정에서 진행해야 합니다.");
    return;
  }

  const username = document.getElementById("newMemUsername").value.trim();
  const password = document.getElementById("newMemPassword")?.value.trim() || "";
  const minPwLen = 6;
  if (window.NanoPortal && NanoPortal.remote && password.length < minPwLen) {
    alert("비밀번호는 6자 이상 입력해 주세요.");
    document.getElementById("newMemPassword")?.focus();
    return;
  }
  const grade = role === "STUDENT" ? document.getElementById("newMemGrade").value : (role === "HQ_ADMIN" ? "본사관리자" : "교사");
  const className = role === "STUDENT" ? (document.getElementById("newMemClass").value.trim() || "미지정") : "-";
  const phone = document.getElementById("newMemPhone").value.trim();
  const parentPhone = role === "STUDENT" ? (document.getElementById("newMemParentPhone").value.trim() || "-") : "-";
  const status = document.getElementById("newMemStatus").value;

  const acadObj = franchiseList.find(a => a.name === academyName);
  const academyId = acadObj ? acadObj.id : (window.NanoPortal ? NanoPortal.academy() : "ACAD-001");

  const today = new Date().toISOString().split("T")[0];
  const now = new Date();
  const pad = n => n < 10 ? '0' + n : n;
  const lastLogin = `${today} ${pad(now.getHours())}:${pad(now.getMinutes())}`;

  const newMember = {
    id: Date.now(),
    academyId: academyId,
    academyName: academyName,
    role: role,
    name: name,
    username: username,
    password: password,
    grade: grade,
    className: className,
    phone: phone,
    parentPhone: parentPhone,
    points: 0,
    lastLogin: lastLogin,
    createdAt: today,
    status: status
  };

  if (window.NanoPortal && NanoPortal.remote) {
    try {
      await NanoPortal.saveMember(newMember, academyId);
    } catch (error) {
      showMasterToast('회원을 등록하지 못했습니다: ' + error.message);
      return;
    }
  }
  memberList.unshift(newMember);
  saveMembersToStorage();
  $("#masterMemberAddModal").modal("hide");
  renderMemberTable();
  showMasterToast(`[${name}] 신규 회원이 [${academyName}]에 성공적으로 등록되었습니다.`);
}

// ==========================================


// --- [Member Form & Academy Class Dynamic Binding] ---

// [8] 소속 학원 변경 시 - 선택 여부에 따른 전체 필드 활성화/비활성화 및 본사 분기
// -----------------------------------------------------------
function onMasterMemberAcademyChange(val) {
  const roleSelect = document.getElementById("newMemRole");
  const roleNote = document.getElementById("newMemRoleNote");
  const hqOpt = document.getElementById("newMemRoleHqOption");
  const gradeRow = document.getElementById("newMemGradeClassRow");
  const parentWrap = document.getElementById("newMemParentPhoneWrap");

  const nameEl = document.getElementById("newMemName");
  const usernameEl = document.getElementById("newMemUsername");
  const pwEl = document.getElementById("newMemPassword");
  const gradeEl = document.getElementById("newMemGrade");
  const classEl = document.getElementById("newMemClass");
  const phoneEl = document.getElementById("newMemPhone");
  const parentPhoneEl = document.getElementById("newMemParentPhone");
  const statusEl = document.getElementById("newMemStatus");
  const submitBtn = document.getElementById("btnSubmitMasterMember");

  // 1. 소속 가맹 학원이 '선택' (미선택 빈값)인 경우: 모든 필드 비우고 disabled 처리
  if (!val) {
    if (roleSelect) {
      roleSelect.value = "";
      roleSelect.disabled = true;
    }
    if (hqOpt) hqOpt.style.display = "none";
    if (roleNote) roleNote.classList.add("d-none");

    if (nameEl) { nameEl.value = ""; nameEl.disabled = true; nameEl.placeholder = "소속 학원을 먼저 선택해주세요"; }
    if (usernameEl) { usernameEl.value = ""; usernameEl.disabled = true; usernameEl.placeholder = "소속 학원을 먼저 선택해주세요"; }
    if (pwEl) { pwEl.value = ""; pwEl.disabled = true; pwEl.placeholder = "소속 학원을 먼저 선택해주세요"; }
    if (gradeEl) { gradeEl.disabled = true; }
    if (classEl) { classEl.innerHTML = '<option value="">-</option>'; classEl.disabled = true; }
    if (phoneEl) { phoneEl.value = ""; phoneEl.disabled = true; phoneEl.placeholder = "소속 학원을 먼저 선택해주세요"; }
    if (parentPhoneEl) { parentPhoneEl.value = ""; parentPhoneEl.disabled = true; parentPhoneEl.placeholder = "소속 학원을 먼저 선택해주세요"; }
    if (statusEl) { statusEl.disabled = true; }
    if (submitBtn) { submitBtn.disabled = true; }
    if (gradeRow) gradeRow.style.display = "flex";
    if (parentWrap) parentWrap.style.display = "block";
    return;
  }

  // 2. 소속 학원(또는 본사)이 정상 선택된 경우: 공통 필드 잠금 해제
  if (nameEl) { nameEl.disabled = false; nameEl.placeholder = "예: 김민준 (한글, 영문만 가능)"; }
  if (usernameEl) { usernameEl.disabled = false; usernameEl.placeholder = "예: minjun_k"; }
  if (pwEl) { pwEl.disabled = false; if (!pwEl.value) pwEl.value = "nano1234!"; }
  if (phoneEl) { phoneEl.disabled = false; phoneEl.placeholder = "예: 010-1234-5678"; }
  if (statusEl) { statusEl.disabled = false; }
  if (submitBtn) { submitBtn.disabled = false; }

  // 3. 본사 선택 시: HQ_ADMIN으로 고정
  if (val === "본사") {
    if (hqOpt) hqOpt.style.display = "";
    if (roleSelect) {
      roleSelect.value = "HQ_ADMIN";
      roleSelect.disabled = true;
    }
    if (roleNote) roleNote.classList.remove("d-none");
    if (gradeRow) gradeRow.style.display = "none";
    if (parentWrap) parentWrap.style.display = "none";
    if (classEl) { classEl.innerHTML = '<option value="-">-</option>'; classEl.disabled = true; }
  } else {
    // 4. 일반 가맹 학원 선택 시: 학생/교사 선택 가능
    if (hqOpt) hqOpt.style.display = "none";
    if (roleSelect) {
      roleSelect.disabled = false;
      if (!roleSelect.value || roleSelect.value === "HQ_ADMIN") {
        roleSelect.value = "STUDENT";
      }
    }
    if (roleNote) roleNote.classList.add("d-none");
    if (gradeEl) gradeEl.disabled = false;
    if (classEl) classEl.disabled = false;
    if (parentPhoneEl) { parentPhoneEl.disabled = false; parentPhoneEl.placeholder = "예: 010-9876-5432"; }

    updateClassDropdown(val);
    onMasterMemberRoleChange(roleSelect ? roleSelect.value : "STUDENT");
  }
}

// -----------------------------------------------------------
// [9] 회원 클래스(학급) 드롭박스 업데이트 (실제 해당 학원에 개설된 학급만 동적 추출)
// -----------------------------------------------------------
function updateClassDropdown(academyName) {
  const classSelect = document.getElementById("newMemClass");
  if (!classSelect) return;

  // 본사 선택 시 학급 없음
  if (!academyName || academyName === "본사") {
    classSelect.innerHTML = '<option value="-">-</option>';
    return;
  }

  // 1. 해당 학원 회원 데이터(memberList)에서 실제 등록되어 있는 학급명 수집
  const existingClasses = new Set();

  if (Array.isArray(memberList)) {
    memberList.forEach(m => {
      if (m.academyName === academyName && m.className && m.className !== "-" && m.className !== "미지정") {
        existingClasses.add(m.className);
      }
    });
  }

  // 2. 학원 로컬 스토리지에 등록된 학급 목록이 있는 경우 추가 반영
  try {
    const customClasses = localStorage.getItem("NANO_CLASSES_" + academyName);
    if (customClasses) {
      const parsed = JSON.parse(customClasses);
      if (Array.isArray(parsed)) {
        parsed.forEach(c => {
          const cName = typeof c === "string" ? c : c.name;
          if (cName && cName !== "-" && cName !== "미지정") {
            existingClasses.add(cName);
          }
        });
      }
    }
  } catch (e) {}

  const classArray = Array.from(existingClasses);

  if (classArray.length === 0) {
    // 아직 개설된 학급이 없는 신규 가맹 학원의 경우 임의의 더미 학급을 넣지 않고 '미지정'만 제공
    classSelect.innerHTML = '<option value="미지정" selected>미지정 (개설된 학급 없음)</option>';
  } else {
    // 실제 학급이 존재하는 기존 학원의 경우: 미지정 + 실제 개설 학급 목록
    let optionsHtml = '<option value="미지정">미지정</option>';
    classArray.forEach(c => {
      optionsHtml += `<option value="${c}">${c}</option>`;
    });
    classSelect.innerHTML = optionsHtml;
  }
}

// -----------------------------------------------------------
// [10] 회원 상세 모달 열기 (수정 가능 버전)
// -----------------------------------------------------------
function openMemberDetailModal(id) {
  const mem = memberList.find(m => m.id === id);
  if (!mem) return;

  document.getElementById("detailMemberId").value = mem.id;
  document.getElementById("detailMemberName").innerText = mem.name;
  document.getElementById("detailMemberRole").innerText = mem.role === "DIRECTOR" ? "원장님" : mem.role === "TEACHER" ? "선생님" : "학생 (원생)";

  // 수정 가능 필드 채우기
  const acadEl = document.getElementById("detailMemberAcademy");
  if (acadEl) acadEl.value = mem.academyName || "";

  const usernameEl = document.getElementById("detailMemberUsername");
  if (usernameEl) usernameEl.value = mem.username || "";

  const phoneEl = document.getElementById("detailMemberPhone");
  if (phoneEl) phoneEl.value = mem.phone || "";

  const parentPhoneEl = document.getElementById("detailMemberParentPhone");
  if (parentPhoneEl) parentPhoneEl.value = mem.parentPhone || "-";

  const gradeEl = document.getElementById("detailMemberGrade");
  if (gradeEl) gradeEl.value = mem.grade || "";

  // 배정 학급 드롭박스: 해당 회원의 소속 학원에 등록된 학급 목록 동적 추출 및 바인딩
  const classEl = document.getElementById("detailMemberClass");
  if (classEl) {
    const existingClasses = new Set();
    const acadName = mem.academyName || "";
    const acadId = mem.academyId || "";

    // 1. 회원 목록에서 동일 학원의 기존 학급명 수집
    if (Array.isArray(memberList)) {
      memberList.forEach(m => {
        if ((m.academyName === acadName || (acadId && m.academyId === acadId)) && 
            m.className && m.className !== "-" && m.className !== "미지정") {
          existingClasses.add(m.className);
        }
      });
    }

    // 2. 로컬 스토리지에 저장된 학원별 학급 목록 수집
    try {
      ["NANO_CLASSES_" + acadName, "NANO_ACADEMY_CLASSES_" + acadId, "NANO_ACADEMY_CLASSES_" + acadName].forEach(k => {
        const stored = localStorage.getItem(k);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            parsed.forEach(c => {
              const cName = typeof c === "string" ? c : (c.name || c.className);
              if (cName && cName !== "-" && cName !== "미지정") existingClasses.add(cName);
            });
          }
        }
      });
    } catch (e) {}

    // 3. 현재 회원의 학급도 옵션에 포함 보장
    if (mem.className && mem.className !== "-" && mem.className !== "미지정") {
      existingClasses.add(mem.className);
    }

    let optionsHtml = '<option value="미지정">미지정</option>';
    const classList = Array.from(existingClasses).sort((a, b) => a.localeCompare(b, 'ko'));
    classList.forEach(c => {
      optionsHtml += `<option value="${c}">${c}</option>`;
    });
    classEl.innerHTML = optionsHtml;
    classEl.value = (mem.className && mem.className !== "-") ? mem.className : "미지정";
  }

  const pointsEl = document.getElementById("detailMemberPoints");
  if (pointsEl) pointsEl.value = mem.points ? mem.points.toLocaleString() + " P" : "0 P";

  const statusSelect = document.getElementById("detailMemberStatus");
  if (statusSelect) {
    statusSelect.value = (mem.status === "PENDING" || mem.status === "미승인") ? "PENDING" 
      : (mem.status === "WITHDRAWN" || mem.status === "PAUSED" || mem.status === "탈퇴") ? "WITHDRAWN" 
      : "APPROVED";
  }

  const btnToggle = document.getElementById("btnToggleMemberStatus");
  if (btnToggle) {
    if (mem.status === "PENDING" || mem.status === "미승인") {
      btnToggle.className = "btn btn-sm btn-outline-success font-weight-bold";
      btnToggle.innerHTML = '<i class="fa-solid fa-user-check mr-1"></i>정상 승인 처리';
    } else if (mem.status === "APPROVED" || mem.status === "NORMAL" || mem.status === "승인") {
      btnToggle.className = "btn btn-sm btn-outline-warning font-weight-bold";
      btnToggle.innerHTML = '<i class="fa-solid fa-clock mr-1"></i>미승인으로 변경';
    } else {
      btnToggle.className = "btn btn-sm btn-outline-success font-weight-bold";
      btnToggle.innerHTML = '<i class="fa-solid fa-rotate-left mr-1"></i>정상 승인 복구';
    }
  }

  // 탈퇴/정지 확인 박스 초기화
  const confirmBox = document.getElementById("memberStatusChangeConfirmBox");
  if (confirmBox) confirmBox.classList.add("d-none");
  const confirmInput = document.getElementById("memberStatusAcademyConfirm");
  if (confirmInput) confirmInput.value = "";

  $('#memberDetailModal').modal('show');
}

// -----------------------------------------------------------
// [11] 회원 상세 저장 (수정사항 저장)
// -----------------------------------------------------------
async function saveMemberDetailEdit() {
  const id = parseInt(document.getElementById("detailMemberId").value, 10);
  const mem = memberList.find(m => m.id === id);
  if (!mem) return;
  const previousMember = { ...mem };

  const phoneEl = document.getElementById("detailMemberPhone");
  const parentPhoneEl = document.getElementById("detailMemberParentPhone");
  const gradeEl = document.getElementById("detailMemberGrade");
  const classEl = document.getElementById("detailMemberClass");
  const statusEl = document.getElementById("detailMemberStatus");

  if (phoneEl) mem.phone = phoneEl.value.trim();
  if (parentPhoneEl) mem.parentPhone = parentPhoneEl.value.trim();
  if (gradeEl) mem.grade = gradeEl.value;
  if (classEl) mem.className = classEl.value.trim();
  if (statusEl) mem.status = statusEl.value;

  if (window.NanoPortal && NanoPortal.remote) {
    try {
      await NanoPortal.saveMember(mem, mem.academyId);
    } catch (error) {
      Object.assign(mem, previousMember);
      showMasterToast('회원 정보를 저장하지 못했습니다: ' + error.message);
      return;
    }
  }

  $('#memberDetailModal').modal('hide');
  saveMembersToStorage();
  renderMemberTable();
  const statusKor = mem.status === "APPROVED" ? "정상 승인" : mem.status === "PENDING" ? "미승인 대기" : "탈퇴/정지";
  showMasterToast(`[${mem.name}] 회원 정보 및 계정 상태(${statusKor})가 저장되었습니다.`);
}

// -----------------------------------------------------------
// [12] 회원 승인/미승인 토글 또는 탈퇴 복구 처리
// -----------------------------------------------------------
async function handleToggleMemberStatusClick() {
  const id = parseInt(document.getElementById("detailMemberId").value, 10);
  const mem = memberList.find(m => m.id === id);
  if (!mem) return;

  const previousStatus = mem.status;
  let targetStatus = "APPROVED";
  let targetMsg = "정상 승인";

  if (mem.status === "APPROVED" || mem.status === "NORMAL" || mem.status === "승인") {
    targetStatus = "PENDING";
    targetMsg = "미승인 대기";
  } else {
    targetStatus = "APPROVED";
    targetMsg = "정상 승인";
  }

  mem.status = targetStatus;
  if (window.NanoPortal && NanoPortal.remote) {
    try {
      await NanoPortal.saveMember(mem, mem.academyId);
    } catch (error) {
      mem.status = previousStatus;
      showMasterToast('회원 상태를 변경하지 못했습니다: ' + error.message);
      return;
    }
  }
  $('#memberDetailModal').modal('hide');
  saveMembersToStorage();
  renderMemberTable();
  showMasterToast(`[${mem.name}] 계정이 '${targetMsg}' 상태로 변경되었습니다.`);
  return;
}

// 레거시 toggleMemberStatus 유지 (다른 곳에서 호출될 수 있어서)
function toggleMemberStatus() {
  return handleToggleMemberStatusClick();
}

// -----------------------------------------------------------


// --- [Member Excel Export & Template Download] ---

// [15] 회원 엑셀 실제 다운로드
// -----------------------------------------------------------
function exportMemberExcel() {
  const headers = ["ID", "소속학원", "등급권한", "이름", "아이디", "학년", "학급", "학생연락처", "학부모연락처", "누적포인트", "최근접속일", "등록일", "상태"];
  const rows = memberList.map(m => [
    m.id, m.academyName,
    m.role === "DIRECTOR" ? "원장님" : m.role === "TEACHER" ? "선생님" : "학생",
    m.name, m.username, m.grade || "", m.className || "",
    m.phone || "", m.parentPhone || "", m.points || 0,
    m.lastLogin || "", m.createdAt || "", m.status
  ]);

  const today = new Date().toISOString().split("T")[0];
  downloadAsCSV(`회원 명단 (${today}).csv`, headers, rows);
  showMasterToast(`통합 회원 명부(총 ${memberList.length}명)가 CSV 파일로 다운로드되었습니다.`);
}

// CSV 다운로드 공통 헬퍼 (엑셀 수식 보존 및 따옴표 이스케이프)

// [16] 엑셀 서식 다운로드 (회원 등록 표준 서식)
// -----------------------------------------------------------
function downloadMemberExcelTemplate() {
  const headers = ["이름", "아이디", "비밀번호", "학년", "학급", "학생연락처", "학부모연락처", "등록학원코드(예:ACAD-001)"];
  const sampleRows = [
    ["홍길동", "hong_gildong", "nano1234!", "초4", "소나무반", "010-1234-5678", "010-9876-5432", "ACAD-001"],
    ["김영희", "younghee_k", "nano1234!", "초5", "매화반", "010-2345-6789", "010-8765-4321", "ACAD-002"]
  ];

  downloadAsCSV("나노책장_회원등록양식_" + new Date().toISOString().split("T")[0] + ".csv", headers, sampleRows);
  showMasterToast("표준 회원 등록 양식 서식(CSV)이 다운로드되었습니다. 학원 코드를 확인 후 입력해주세요.");
}

// -----------------------------------------------------------


// --- [Member Event Handlers & Modal Overrides] ---

document.addEventListener("DOMContentLoaded", () => {
  const newMemAcademy = document.getElementById("newMemAcademy");
  if (newMemAcademy) {
    newMemAcademy.addEventListener("change", function() {
      onMasterMemberAcademyChange(this.value);
      updateClassDropdown(this.value);
    });
  }
});

// [22] openMasterMemberAddModal 오버라이드 - 초기 '선택' 상태 및 나머지 필드 입력불가 잠금
// -----------------------------------------------------------
const _origOpenMasterMemberAddModal = typeof openMasterMemberAddModal === "function" ? openMasterMemberAddModal.bind({}) : null;
function openMasterMemberAddModal() {
  const form = document.getElementById("masterMemberAddForm");
  if (form) form.reset();

  const acadSelect = document.getElementById("newMemAcademy");
  if (acadSelect && typeof franchiseList !== "undefined") {
    acadSelect.innerHTML =
      `<option value="" selected>선택</option>` +
      `<option value="본사">🏢 본사 (나노의 책장 본사)</option>` +
      franchiseList.map(a => `<option value="${a.name}">${a.name}</option>`).join("");

    acadSelect.value = "";
  }

  // 초기 상태: 소속 가맹 학원이 '선택'이므로 나머지 모든 필드 초기화 및 disabled 잠금
  onMasterMemberAcademyChange("");

  $("#masterMemberAddModal").modal("show");
}
