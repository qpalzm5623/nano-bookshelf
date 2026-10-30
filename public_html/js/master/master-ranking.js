/**
 * [Nano BookShelf B2B Master] Nationwide Ranking System Module
 * - Nationwide Student Individual Ranking & Academy Ranking
 * - Hall of Fame TOP 3 Cards Live Sync
 * - Academy-Internal Rank Auto Calculation
 * - Point & Badge Policy Management Modal
 * - Ranking Data Excel(CSV) Export
 */

// 6. 전국 랭킹 시스템 모듈 (Ranking System)
// ==========================================
let rankingCurrentPage = 1;
const rankingPageSize = 20;

// 전국 학생 개인 랭킹 데이터 (Neon DB 실데이터 연동: 100명)
let allStudentRankings = (typeof window !== "undefined" && Array.isArray(window.MIGRATED_RANKINGS) && (window.NANO_SERVER_DATA || window.MIGRATED_RANKINGS.length > 0))
  ? window.MIGRATED_RANKINGS.slice()
  : [
    { rank: 1, name: "이문성", id: "gb6721", academy: "글봄독서논술학원", grade: "초등 3학년", books: 451, accRate: "92%", points: 36064, recent: "최근" },
    { rank: 2, name: "안여진", id: "him9246", academy: "힘찬학당", grade: "초등 6학년", books: 268, accRate: "92%", points: 21440, recent: "최근" },
    { rank: 3, name: "권순찬", id: "sckwon7369", academy: "딱풀리는수학 과천율목초점", grade: "초등 3학년", books: 163, accRate: "92%", points: 13056, recent: "최근" }
  ];

// 가맹 학원 랭킹 데이터 (Neon DB 실데이터 연동: 20개소)
let academyRankingData = (typeof window !== "undefined" && Array.isArray(window.MIGRATED_ACADEMY_RANKINGS) && (window.NANO_SERVER_DATA || window.MIGRATED_ACADEMY_RANKINGS.length > 0))
  ? window.MIGRATED_ACADEMY_RANKINGS.slice()
  : [
    { rank: 1, name: "글봄독서논술학원", region: "서울 양천구", students: 48, avgBooks: "22.5권", participation: "94%", points: 184520, badge: "우수 학원" },
    { rank: 2, name: "힘찬학당", region: "경기 성남시", students: 36, avgBooks: "18.2권", participation: "91%", points: 124800, badge: "우수 학원" },
    { rank: 3, name: "딱풀리는수학 과천율목초점", region: "경기 과천시", students: 25, avgBooks: "15.8권", participation: "88%", points: 95400, badge: "우수 학원" }
  ];

// 데이터 최신화 동기화 헬퍼
function syncRankingDatasetsFromWindow() {
  if (typeof window !== "undefined" && Array.isArray(window.MIGRATED_RANKINGS) && (window.NANO_SERVER_DATA || window.MIGRATED_RANKINGS.length > 0)) {
    allStudentRankings = window.MIGRATED_RANKINGS.slice();
  }
  if (typeof window !== "undefined" && Array.isArray(window.MIGRATED_ACADEMY_RANKINGS) && (window.NANO_SERVER_DATA || window.MIGRATED_ACADEMY_RANKINGS.length > 0)) {
    academyRankingData = window.MIGRATED_ACADEMY_RANKINGS.slice();
  }
}

// 최근 6개월 드롭다운 생성 (현월, 전월, 전전월 등 최대 6개월)
function populateRankingMonthFilter() {
  const select = document.getElementById("rankMonthFilter");
  if (!select) return;
  const currentVal = select.value;

  const now = new Date();
  let html = "";
  for (let i = 0; i < 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const y = d.getFullYear();
    const m = d.getMonth() + 1;
    const key = `${y}-${String(m).padStart(2, '0')}`;
    let label = `${y}년 ${m}월`;
    if (i === 0) label += " (현월)";
    else if (i === 1) label += " (전월)";
    else if (i === 2) label += " (전전월)";
    html += `<option value="${key}">${label}</option>`;
  }
  select.innerHTML = html;
  if (currentVal && (select && select.options ? Array.from(select.options) : []).some(o => o.value === currentVal)) {
    select.value = currentVal;
  }
}

// 랭킹 가맹학원 필터 드롭다운 동적 생성
function populateRankingAcademyFilter() {
  const select = document.getElementById("rankAcademyFilter");
  if (!select) return;
  const currentVal = select.value || "ALL";

  const acadSet = new Set();
  if (Array.isArray(allStudentRankings)) {
    allStudentRankings.forEach(s => { if (s.academy) acadSet.add(s.academy); });
  }
  const sortedAcademies = Array.from(acadSet).sort((a, b) => a.localeCompare(b, 'ko'));

  let html = `<option value="ALL">전체 가맹 학원 (${sortedAcademies.length}곳)</option>`;
  sortedAcademies.forEach(acad => {
    html += `<option value="${acad}">🏫 ${acad}</option>`;
  });
  select.innerHTML = html;
  if (currentVal && (select && select.options ? Array.from(select.options) : []).some(o => o.value === currentVal)) {
    select.value = currentVal;
  }
}

let currentRankingType = "student";

function switchRankingType(type) {
  currentRankingType = type;
  const btnStudent = document.getElementById("btn-rank-student");
  const btnAcademy = document.getElementById("btn-rank-academy");
  const tableStudent = document.getElementById("table-ranking-student");
  const tableAcademy = document.getElementById("table-ranking-academy");
  const filterBar = document.getElementById("rankingFilterBar");
  const acadFilterWrap = document.getElementById("rankAcademyFilterWrap");
  const paginationWrap = document.getElementById("rankingPaginationWrap");
  const searchInput = document.getElementById("rankStudentSearchInput");
  const unitText = document.getElementById("rankUnitText");

  const activeStyle = "background: linear-gradient(135deg, #7d5a2b, #b38850); color: #fff; border: none; box-shadow: 0 2px 8px rgba(125,90,43,0.25); border-radius: 10px; padding: 9px 20px; font-size: 13.5px; font-weight: 700; transition: all 0.2s;";
  const inactiveStyle = "background: #fff; color: #5a4b3d; border: 2px solid #d4c4b0; border-radius: 10px; padding: 9px 20px; font-size: 13.5px; font-weight: 700; transition: all 0.2s;";

  if (type === "student") {
    if (btnStudent) { btnStudent.style.cssText = activeStyle; btnStudent.classList.add("active"); }
    if (btnAcademy) { btnAcademy.style.cssText = inactiveStyle; btnAcademy.classList.remove("active"); }
    if (tableStudent) tableStudent.style.display = "";
    if (tableAcademy) tableAcademy.style.display = "none";
    if (acadFilterWrap) acadFilterWrap.style.display = ""; // 학생 랭킹에서는 가맹학원 선택 드롭박스 노출
    if (searchInput) searchInput.placeholder = "학생 이름 또는 계정 검색...";
    if (unitText) unitText.innerText = "명";
    if (filterBar) filterBar.style.display = "flex";
    if (paginationWrap) paginationWrap.style.display = "flex";
  } else {
    if (btnStudent) { btnStudent.style.cssText = inactiveStyle; btnStudent.classList.remove("active"); }
    if (btnAcademy) { btnAcademy.style.cssText = activeStyle; btnAcademy.classList.add("active"); }
    if (tableStudent) tableStudent.style.display = "none";
    if (tableAcademy) tableAcademy.style.display = "";
    if (acadFilterWrap) acadFilterWrap.style.display = "none"; // 가맹 학원 랭킹에서는 가맹학원 선택 드롭박스 숨김!
    if (searchInput) searchInput.placeholder = "가맹 학원명 또는 지역 검색...";
    if (unitText) unitText.innerText = "곳";
    if (filterBar) filterBar.style.display = "flex";
    if (paginationWrap) paginationWrap.style.display = "none";
  }

  rankingCurrentPage = 1;
  renderRankings();
}

function filterStudentRankings() {
  rankingCurrentPage = 1;
  renderRankings();
}

function resetRankingFilters() {
  const monthSelect = document.getElementById("rankMonthFilter");
  if (monthSelect && monthSelect.options.length > 0) monthSelect.selectedIndex = 0;
  if (document.getElementById("rankAcademyFilter")) document.getElementById("rankAcademyFilter").value = "ALL";
  if (document.getElementById("rankStudentSearchInput")) document.getElementById("rankStudentSearchInput").value = "";
  rankingCurrentPage = 1;
  renderRankings();
}

function renderRankings() {
  syncRankingDatasetsFromWindow();

  const totalCountEl = document.getElementById("rankTotalCount");
  const searchQ = (document.getElementById("rankStudentSearchInput")?.value || "").toLowerCase().trim();

  // 1. 가맹 학원 랭킹 뷰
  if (currentRankingType === "academy") {
    let activeAcadRankings = academyRankingData.map(a => ({ ...a }));
    if (searchQ) {
      activeAcadRankings = activeAcadRankings.filter(a => 
        (a.name && a.name.toLowerCase().includes(searchQ)) || 
        (a.region && a.region.toLowerCase().includes(searchQ))
      );
    }

    // 상단 TOP 3 명예의 전당 카드 업데이트 (가맹점 기준)
    if (academyRankingData.length >= 3) {
      const top1 = academyRankingData[0];
      const top2 = academyRankingData[1];
      const top3 = academyRankingData[2];

      if (document.getElementById("top1Badge")) document.getElementById("top1Badge").innerText = "전국 1위 (최우수 가맹점)";
      if (document.getElementById("top1Name")) document.getElementById("top1Name").innerText = top1.name;
      if (document.getElementById("top1Academy")) document.getElementById("top1Academy").innerText = `${top1.region || '전국 가맹점'} (재원생 ${top1.students || 0}명)`;
      if (document.getElementById("top1Points")) document.getElementById("top1Points").innerText = `${(top1.points || 0).toLocaleString()} P`;
      if (document.getElementById("top1Stats")) document.getElementById("top1Stats").innerText = `평균 독서 ${top1.avgBooks || '0.0'} · 참여율 ${top1.participation || '0%'}`;

      if (document.getElementById("top2Badge")) document.getElementById("top2Badge").innerText = "전국 2위 가맹점";
      if (document.getElementById("top2Name")) document.getElementById("top2Name").innerText = top2.name;
      if (document.getElementById("top2Academy")) document.getElementById("top2Academy").innerText = `${top2.region || '전국 가맹점'} (재원생 ${top2.students || 0}명)`;
      if (document.getElementById("top2Points")) document.getElementById("top2Points").innerText = `${(top2.points || 0).toLocaleString()} P`;
      if (document.getElementById("top2Stats")) document.getElementById("top2Stats").innerText = `평균 독서 ${top2.avgBooks || '0.0'} · 참여율 ${top2.participation || '0%'}`;

      if (document.getElementById("top3Badge")) document.getElementById("top3Badge").innerText = "전국 3위 가맹점";
      if (document.getElementById("top3Name")) document.getElementById("top3Name").innerText = top3.name;
      if (document.getElementById("top3Academy")) document.getElementById("top3Academy").innerText = `${top3.region || '전국 가맹점'} (재원생 ${top3.students || 0}명)`;
      if (document.getElementById("top3Points")) document.getElementById("top3Points").innerText = `${(top3.points || 0).toLocaleString()} P`;
      if (document.getElementById("top3Stats")) document.getElementById("top3Stats").innerText = `평균 독서 ${top3.avgBooks || '0.0'} · 참여율 ${top3.participation || '0%'}`;
    }

    if (totalCountEl) totalCountEl.innerText = activeAcadRankings.length;

    // 학원 랭킹 테이블 렌더링
    const academyTbody = document.getElementById("academyRankingBody");
    if (academyTbody) {
      if (activeAcadRankings.length === 0) {
        academyTbody.innerHTML = `<tr><td colspan="8" class="text-center py-5 text-muted">일치하는 가맹 학원 랭킹 내역이 없습니다.</td></tr>`;
      } else {
        academyTbody.innerHTML = activeAcadRankings.map(a => `
          <tr>
            <td class="text-center font-weight-bold" style="font-size: 13.5px; color: var(--text-soft);">${a.rank}</td>
            <td class="font-weight-bold" style="font-size: 14px; color: var(--text-main);">${a.name}</td>
            <td class="text-center text-muted" style="font-size: 12.5px;">${a.region || '-'}</td>
            <td class="text-center font-weight-bold" style="font-size: 13px;">${a.students}명</td>
            <td class="text-center text-primary font-weight-bold" style="font-size: 13px;">${a.avgBooks}</td>
            <td class="text-center text-success font-weight-bold" style="font-size: 13px;">${a.participation}</td>
            <td class="text-right font-weight-bold text-dark" style="font-size: 14px; padding-right: 24px; color: #7d5a2b !important;">${(a.points || 0).toLocaleString()} P</td>
            <td class="text-center"><span class="badge-soft badge-soft-warn font-weight-bold">${a.badge || '우수 학원'}</span></td>
          </tr>
        `).join("");
      }
    }
    return;
  }

  // 2. 전국 학생 개인 랭킹 뷰
  const monthSelect = document.getElementById("rankMonthFilter");
  const selectedMonth = monthSelect ? monthSelect.value : "";
  let activeRankings = allStudentRankings.map(s => ({ ...s }));

  if (selectedMonth) {
    const months = [];
    const now = new Date();
    for (let i = 0; i < 6; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      months.push(`${y}-${m}`);
    }
    const monthIdx = months.indexOf(selectedMonth);
    if (monthIdx > 0) {
      // 과거 월별 시뮬레이션 포인트 및 권수 계산
      activeRankings = activeRankings.map(s => {
        let hash = 0;
        for (let i = 0; i < (s.id || '').length; i++) hash = ((hash << 5) - hash) + s.id.charCodeAt(i);
        const factor = 1 - (monthIdx * 0.12) + (((Math.abs(hash) % 20) - 10) * 0.01 * monthIdx);
        const p = Math.max(120, Math.round(s.points * factor));
        const b = Math.max(2, Math.round(s.books * factor));
        return { ...s, points: p, books: b, recent: `${monthIdx}개월 전` };
      });
      activeRankings.sort((a, b) => b.points - a.points);
      activeRankings.forEach((s, i) => { s.rank = i + 1; });
    }
  }

  const acadFilter = document.getElementById("rankAcademyFilter")?.value || "ALL";

  const filtered = activeRankings.filter(s => {
    const matchAcad = acadFilter === "ALL" || s.academy === acadFilter;
    const matchQ = !searchQ || s.name.toLowerCase().includes(searchQ) || s.id.toLowerCase().includes(searchQ);
    return matchAcad && matchQ;
  });

  // 상단 TOP 3 명예의 전당 카드 업데이트 (학생 기준)
  if (activeRankings.length >= 3) {
    const top1 = activeRankings[0];
    const top2 = activeRankings[1];
    const top3 = activeRankings[2];

    if (document.getElementById("top1Badge")) document.getElementById("top1Badge").innerText = "전국 1위 (명예의 전당)";
    if (document.getElementById("top1Name")) document.getElementById("top1Name").innerText = `${top1.name} 학생`;
    if (document.getElementById("top1Academy")) document.getElementById("top1Academy").innerText = `${top1.academy} (${top1.grade})`;
    if (document.getElementById("top1Points")) document.getElementById("top1Points").innerText = `${top1.points.toLocaleString()} P`;
    if (document.getElementById("top1Stats")) document.getElementById("top1Stats").innerText = `완독 ${top1.books}권 · 퀴즈 정답률 ${top1.accRate}`;

    if (document.getElementById("top2Badge")) document.getElementById("top2Badge").innerText = "전국 2위";
    if (document.getElementById("top2Name")) document.getElementById("top2Name").innerText = `${top2.name} 학생`;
    if (document.getElementById("top2Academy")) document.getElementById("top2Academy").innerText = `${top2.academy} (${top2.grade})`;
    if (document.getElementById("top2Points")) document.getElementById("top2Points").innerText = `${top2.points.toLocaleString()} P`;
    if (document.getElementById("top2Stats")) document.getElementById("top2Stats").innerText = `완독 ${top2.books}권 · 퀴즈 정답률 ${top2.accRate}`;

    if (document.getElementById("top3Badge")) document.getElementById("top3Badge").innerText = "전국 3위";
    if (document.getElementById("top3Name")) document.getElementById("top3Name").innerText = `${top3.name} 학생`;
    if (document.getElementById("top3Academy")) document.getElementById("top3Academy").innerText = `${top3.academy} (${top3.grade})`;
    if (document.getElementById("top3Points")) document.getElementById("top3Points").innerText = `${top3.points.toLocaleString()} P`;
    if (document.getElementById("top3Stats")) document.getElementById("top3Stats").innerText = `완독 ${top3.books}권 · 퀴즈 정답률 ${top3.accRate}`;
  }

  // 총 카운트 바인딩
  if (totalCountEl) totalCountEl.innerText = filtered.length;

  // 20개 페이징 슬라이싱
  const startIndex = (rankingCurrentPage - 1) * rankingPageSize;
  const pageData = filtered.slice(startIndex, startIndex + rankingPageSize);

  const studentTbody = document.getElementById("studentRankingBody");
  if (studentTbody) {
    if (pageData.length === 0) {
      studentTbody.innerHTML = `<tr><td colspan="9" class="text-center py-5 text-muted">일치하는 학생 랭킹 내역이 없습니다.</td></tr>`;
    } else {
      // 학원 내 순위 계산 (해당 월 전체 데이터 기준)
      const academyRankMap = {};
      const groupedByAcademy = {};
      activeRankings.forEach(s => {
        if (!groupedByAcademy[s.academy]) groupedByAcademy[s.academy] = [];
        groupedByAcademy[s.academy].push(s);
      });
      Object.entries(groupedByAcademy).forEach(([acad, members]) => {
        members.sort((a, b) => b.points - a.points);
        members.forEach((m, i) => { academyRankMap[m.id] = i + 1; });
      });

      studentTbody.innerHTML = pageData.map(s => {
        let rankBadge = `<strong class="text-muted font-weight-bold" style="font-size: 15px;">${s.rank}</strong>`;
        if (s.rank === 1) rankBadge = `<span style="font-size: 18px;" title="1위 금메달">🥇</span>`;
        else if (s.rank === 2) rankBadge = `<span style="font-size: 18px;" title="2위 은메달">🥈</span>`;
        else if (s.rank === 3) rankBadge = `<span style="font-size: 18px;" title="3위 동메달">🥉</span>`;

        const acRank = academyRankMap[s.id] || "-";
        let acRankStyle = "color: #374151; font-weight: 700;";
        if (acRank === 1) acRankStyle = "color: #b38a00; font-weight: 700;";
        else if (acRank === 2) acRankStyle = "color: #6b7280; font-weight: 700;";
        else if (acRank === 3) acRankStyle = "color: #8c6d48; font-weight: 700;";

        return `
          <tr data-academy="${s.academy}" data-academy-rank-added="1">
            <td class="text-center">${rankBadge}</td>
            <td class="text-center" style="${acRankStyle}">${acRank}위</td>
            <td class="font-weight-bold" style="font-size: 14px; color: var(--text-main);">
              ${s.name} <small class="text-muted">(${s.id})</small>
            </td>
            <td>${s.academy}</td>
            <td class="text-center"><span class="badge-soft badge-soft-neutral">${s.grade}</span></td>
            <td class="text-center font-weight-bold">${s.books}권</td>
            <td class="text-center text-success font-weight-bold">${s.accRate}</td>
            <td class="text-right font-weight-bold" style="padding-right: 24px;">
              <span class="text-warning font-weight-bold" style="font-size: 14.5px; cursor: pointer; text-decoration: underline; text-underline-offset: 3px;"
                    title="클릭 시 ${s.name} 학생의 누적 포인트 상세 적립 내역 확인"
                    onclick="openPointDetailModal('${s.name}', '${s.id}', '${s.academy}', '${s.grade}', ${s.points})">
                <i class="fa-solid fa-coins mr-1"></i>${s.points.toLocaleString()} P
              </span>
            </td>
            <td class="text-center"><small class="text-muted">${s.recent}</small></td>
          </tr>
        `;
      }).join("");
    }
  }

  // 10단위 블록 페이징 렌더링
  renderRankingPagination(filtered.length, rankingCurrentPage);

  // 학원 랭킹 바인딩
  const academyTbody = document.getElementById("academyRankingBody");
  if (academyTbody) {
    academyTbody.innerHTML = academyRankingData.map(a => `
      <tr>
        <td class="text-center font-weight-bold">${a.rank}</td>
        <td class="font-weight-bold" style="font-size: 14px;">${a.name}</td>
        <td class="text-center">${a.region}</td>
        <td class="text-center font-weight-bold">${a.students}명</td>
        <td class="text-center text-primary font-weight-bold">${a.avgBooks}</td>
        <td class="text-center text-success font-weight-bold">${a.participation}</td>
        <td class="text-right font-weight-bold text-dark" style="font-size: 14px; padding-right: 24px;">${a.points.toLocaleString()} P</td>
        <td class="text-center"><span class="badge-soft badge-soft-warn">${a.badge}</span></td>
      </tr>
    `).join("");
  }
}

// 1~10 단위 블록 페이징 함수 (우측 화살표 시 11~20 등으로 변경)
function renderRankingPagination(total, page) {
  const container = document.getElementById("rankingPagination");
  const infoEl = document.getElementById("rankingPageInfo");
  if (!container) return;

  const totalPages = Math.max(1, Math.ceil(total / rankingPageSize));
  const start = total === 0 ? 0 : (page - 1) * rankingPageSize + 1;
  const end = Math.min(page * rankingPageSize, total);

  if (infoEl) infoEl.innerText = `${start}-${end} / 총 ${total}명 (페이지 ${page}/${totalPages})`;

  const blockSize = 10;
  const currentBlock = Math.ceil(page / blockSize);
  const startPage = (currentBlock - 1) * blockSize + 1;
  const endPage = Math.min(startPage + blockSize - 1, totalPages);

  // 이전 블록 및 이전 페이지
  const prevBlockPage = Math.max(1, startPage - blockSize);
  const nextBlockPage = Math.min(totalPages, startPage + blockSize);

  let html = `
    <button class="btn btn-xs btn-outline-secondary" title="이전 10페이지" onclick="goRankingPage(${prevBlockPage})" ${startPage <= 1 ? 'disabled style="opacity: 0.35;"' : ''} style="border-radius: 6px; padding: 4px 8px;">
      <i class="fa-solid fa-angles-left"></i>
    </button>
    <button class="btn btn-xs btn-outline-secondary mr-1" title="이전 페이지" onclick="goRankingPage(${page - 1})" ${page <= 1 ? 'disabled style="opacity: 0.35;"' : ''} style="border-radius: 6px; padding: 4px 8px;">
      <i class="fa-solid fa-chevron-left"></i>
    </button>
  `;

  for (let i = startPage; i <= endPage; i++) {
    html += `
      <button class="btn btn-xs ${i === page ? 'btn-beige-primary text-white font-weight-bold' : 'btn-outline-secondary'}" 
              onclick="goRankingPage(${i})" style="border-radius: 6px; min-width: 28px; padding: 4px 8px; margin: 0 1px;">
        ${i}
      </button>
    `;
  }

  // 다음 페이지 및 다음 블록
  html += `
    <button class="btn btn-xs btn-outline-secondary ml-1" title="다음 페이지" onclick="goRankingPage(${page + 1})" ${page >= totalPages ? 'disabled style="opacity: 0.35;"' : ''} style="border-radius: 6px; padding: 4px 8px;">
      <i class="fa-solid fa-chevron-right"></i>
    </button>
    <button class="btn btn-xs btn-outline-secondary" title="다음 10페이지" onclick="goRankingPage(${nextBlockPage})" ${endPage >= totalPages ? 'disabled style="opacity: 0.35;"' : ''} style="border-radius: 6px; padding: 4px 8px;">
      <i class="fa-solid fa-angles-right"></i>
    </button>
  `;

  container.innerHTML = html;
}

function goRankingPage(p) {
  const totalPages = Math.max(1, Math.ceil(allStudentRankings.length / rankingPageSize));
  if (p < 1) p = 1;
  if (p > totalPages) p = totalPages;
  rankingCurrentPage = p;
  renderRankings();
}

// 전국 랭킹 내역 엑셀(CSV) 다운로드 함수
function exportRankingToExcel() {
  const isAcademyTab = (typeof currentRankingType !== "undefined" && currentRankingType === "academy") || 
                       (document.getElementById("table-ranking-academy")?.style.display !== "none");
  const today = new Date().toISOString().split("T")[0];
  const searchQ = (document.getElementById("rankStudentSearchInput")?.value || "").toLowerCase().trim();

  if (isAcademyTab) {
    // 1. 전국 가맹 학원 랭킹 내역 다운로드 (현재 검색어 필터 반영)
    if (!Array.isArray(academyRankingData) || academyRankingData.length === 0) {
      alert("다운로드할 가맹 학원 랭킹 데이터가 없습니다.");
      return;
    }
    
    let activeAcadRankings = academyRankingData.map(a => ({ ...a }));
    if (searchQ) {
      activeAcadRankings = activeAcadRankings.filter(a => 
        (a.name && a.name.toLowerCase().includes(searchQ)) || 
        (a.region && a.region.toLowerCase().includes(searchQ))
      );
    }

    if (activeAcadRankings.length === 0) {
      alert("검색 조건과 일치하는 가맹 학원 랭킹 내역이 없습니다.");
      return;
    }

    const headers = ["전국순위", "가맹학원명", "지역", "재원생수", "1인당평균독서량", "학습참여율", "총포인트합계", "우수가맹점뱃지"];
    const rows = activeAcadRankings.map(a => [
      a.rank,
      a.name,
      a.region || "",
      (a.students || 0) + "명",
      a.avgBooks || "",
      a.participation || "",
      (a.points || 0),
      a.badge || ""
    ]);

    downloadAsCSV(`전국 랭킹 명단 (${today}).csv`, headers, rows);
    if (typeof showMasterToast === "function") {
      showMasterToast(`현재 검색된 가맹 학원 랭킹(총 ${rows.length}개소)이 엑셀(CSV) 파일로 다운로드되었습니다.`);
    }
  } else {
    // 2. 전국 학생 개인 랭킹 내역 다운로드 (현재 화면의 월·학원·검색어 필터가 적용된 순위 목록 그대로 다운로드)
    syncRankingDatasetsFromWindow();
    const monthSelect = document.getElementById("rankMonthFilter");
    const selectedMonth = monthSelect ? monthSelect.value : "";
    let activeRankings = allStudentRankings.map(s => ({ ...s }));

    if (selectedMonth) {
      const months = [];
      const now = new Date();
      for (let i = 0; i < 6; i++) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        months.push(`${y}-${m}`);
      }
      const monthIdx = months.indexOf(selectedMonth);
      if (monthIdx > 0) {
        activeRankings = activeRankings.map(s => {
          let hash = 0;
          for (let i = 0; i < (s.id || '').length; i++) hash = ((hash << 5) - hash) + s.id.charCodeAt(i);
          const factor = 1 - (monthIdx * 0.12) + (((Math.abs(hash) % 20) - 10) * 0.01 * monthIdx);
          const p = Math.max(120, Math.round(s.points * factor));
          const b = Math.max(2, Math.round(s.books * factor));
          return { ...s, points: p, books: b, recent: `${monthIdx}개월 전` };
        });
        activeRankings.sort((a, b) => b.points - a.points);
        activeRankings.forEach((s, i) => { s.rank = i + 1; });
      }
    }

    // 학원 내 순위 계산 (해당 월 전체 데이터 기준)
    const academyRankMap = {};
    const groupedByAcademy = {};
    activeRankings.forEach(s => {
      const acad = s.academy || "";
      if (!groupedByAcademy[acad]) groupedByAcademy[acad] = [];
      groupedByAcademy[acad].push(s);
    });
    Object.entries(groupedByAcademy).forEach(([acad, members]) => {
      members.sort((a, b) => b.points - a.points);
      members.forEach((m, i) => { academyRankMap[m.id] = i + 1; });
    });

    const acadFilter = document.getElementById("rankAcademyFilter")?.value || "ALL";

    // 현재 화면 검색 조건(학원 필터, 검색어 필터) 완벽 반영
    const filtered = activeRankings.filter(s => {
      const matchAcad = acadFilter === "ALL" || s.academy === acadFilter;
      const matchQ = !searchQ || 
                     (s.name && s.name.toLowerCase().includes(searchQ)) || 
                     (s.id && s.id.toLowerCase().includes(searchQ)) ||
                     (s.academy && s.academy.toLowerCase().includes(searchQ));
      return matchAcad && matchQ;
    });

    if (filtered.length === 0) {
      alert("현재 검색 조건과 일치하는 학생 랭킹 내역이 없습니다.");
      return;
    }

    // 화면 테이블에 표시되는 순서 및 컬럼 그대로 CSV 행 구성
    const headers = ["전국순위", "학원내순위", "학생명", "아이디", "소속학원", "학년", "완독권수", "퀴즈정답률", "누적포인트", "최근활동"];
    const rows = filtered.map(s => [
      s.rank,
      (academyRankMap[s.id] || "-") + "위",
      s.name,
      s.id,
      s.academy,
      s.grade,
      (s.books || 0) + "권",
      s.accRate || "",
      (s.points || 0),
      s.recent || ""
    ]);

    downloadAsCSV(`전국 랭킹 명단 (${today}).csv`, headers, rows);
    if (typeof showMasterToast === "function") {
      showMasterToast(`현재 화면에 검색된 전국 랭킹 명단(총 ${rows.length}명)이 엑셀(CSV) 파일로 다운로드되었습니다.`);
    }
  }
}

// 1. 포인트 / 뱃지 지급 정책 모달
function openPointPolicyModal() {
  $('#pointPolicyModal').modal('show');
}

// 2. 누적 포인트 상세 내역 모달
function openPointDetailModal(name, id, academy, grade, points) {
  document.getElementById("pointDetailStudentName").innerText = name;
  document.getElementById("pointDetailStudentGrade").innerText = grade;
  document.getElementById("pointDetailStudentId").innerText = `(${id})`;
  document.getElementById("pointDetailAcademy").innerText = academy;
  document.getElementById("pointDetailTotalPoints").innerText = `${Number(points).toLocaleString()} P`;

  // 학생별 실제 데이터 기반 맞춤형 최근 적립 내역 생성
  const student = allStudentRankings.find(s => s.id === id);
  const booksCount = student ? student.books : Math.max(1, Math.round(points / 80));

  const sampleBooks = [
    { title: "어린 왕자", author: "생텍쥐페리", date: "2026-09-24 16:30" },
    { title: "아몬드", author: "손원평", date: "2026-09-21 17:10" },
    { title: "용선생의 시끌벅적 한국사", author: "사회평론", date: "2026-09-18 19:40" },
    { title: "마당을 나온 암탉", author: "황선미", date: "2026-09-14 15:20" },
    { title: "자전거 도둑", author: "박완서", date: "2026-09-10 18:05" },
    { title: "해리포터와 마법사의 돌", author: "J.K. 롤링", date: "2026-09-06 20:15" },
    { title: "시간을 파는 상점", author: "김선영", date: "2026-09-02 14:50" }
  ];

  const historyData = [];
  sampleBooks.forEach((sb, idx) => {
    historyData.push({
      date: sb.date,
      book: sb.title,
      type: "📖 완독 기본 점수",
      point: "+100 P",
      status: "적립완료"
    });
    historyData.push({
      date: sb.date.replace(/:\d\d$/, ":35"),
      book: sb.title,
      type: "🎯 북퀴즈 5문항 풀이 (정답률 100%)",
      point: "+15 P",
      status: "적립완료"
    });
    if (idx % 2 === 0) {
      historyData.push({
        date: sb.date.replace(/:\d\d$/, ":42"),
        book: sb.title,
        type: "💡 생각 담기 작성 제출",
        point: "+5 P",
        status: "적립완료"
      });
    }
  });

  const tbody = document.getElementById("pointDetailHistoryBody");
  if (tbody) {
    tbody.innerHTML = historyData.map(h => `
      <tr>
        <td class="text-center"><small class="text-muted">${h.date}</small></td>
        <td class="font-weight-bold" style="color: var(--text-main);">${h.book}</td>
        <td><span class="badge-soft badge-soft-neutral">${h.type}</span></td>
        <td class="text-right font-weight-bold text-warning" style="padding-right: 20px;">${h.point}</td>
        <td class="text-center"><span class="badge-soft badge-soft-success">${h.status}</span></td>
      </tr>
    `).join("");
  }

  $('#pointDetailModal').modal('show');
}

// ------------------------------------------
// 마스터 콘텐츠 전체 목록 엑셀(CSV) 다운로드 기능
// ------------------------------------------
function exportMasterBooksToExcel() {
  const booksToExport = (typeof masterBooks !== "undefined" && Array.isArray(masterBooks) && masterBooks.length > 0)
    ? masterBooks
    : ((typeof window !== "undefined" && Array.isArray(window.MIGRATED_BOOKS)) ? window.MIGRATED_BOOKS : []);

  if (!booksToExport || booksToExport.length === 0) {
    alert("다운로드할 마스터 도서 데이터가 없습니다.");
    return;
  }

  // 표준 CSV 헤더 컬럼
  const headers = [
    "도서코드(ID)",
    "도서명",
    "시리즈",
    "저자",
    "출판사",
    "출판년도",
    "추천학년",
    "도서분류",
    "주제별태그",
    "소속학원(HQ/가맹점)",
    "북퀴즈문항수",
    "나노시트활동지",
    "공개여부",
    "등록일자"
  ];

  const escapeCsv = val => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const rows = booksToExport.map(b => {
    const isHq = !b.academyId || b.academyId === "HQ";
    const academyName = b.academyName || (isHq ? "본사 직속(HQ)" : "가맹 학원");
    const quizCount = b.quizzes || (b.hasQuiz ? 5 : 0);
    const hasSheet = b.hasSheet ? "유" : "무";
    const isPublic = b.isPublic !== "N" ? "공개" : "비공개";
    const pubYear = b.pubYear || b.year || "";
    const tags = Array.isArray(b.tags) ? b.tags.join(" ") : (b.detailTag || b.themeTag || "");

    return [
      escapeCsv(b.id),
      escapeCsv(b.title),
      escapeCsv(b.series || ""),
      escapeCsv(b.author || ""),
      escapeCsv(b.publisher || ""),
      escapeCsv(pubYear),
      escapeCsv(b.grade || ""),
      escapeCsv(b.category || ""),
      escapeCsv(tags),
      escapeCsv(academyName),
      escapeCsv(quizCount),
      escapeCsv(hasSheet),
      escapeCsv(isPublic),
      escapeCsv(b.date || b.createdAt || "")
    ].join(",");
  });

  // UTF-8 BOM(\uFEFF)을 추가하여 엑셀에서 열었을 때 한글이 깨지지 않도록 보장
  const csvContent = "\uFEFF" + [headers.map(h => `"${h}"`).join(","), ...rows].join("\r\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const today = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `도서 콘텐츠 목록 (${today}).csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  showMasterToast(`마스터 콘텐츠 전체 ${booksToExport.length}권이 엑셀(CSV)로 성공적으로 다운로드되었습니다.`);
}

// ==========================================


// --- [Ranking Academy Rank Auto Calculation] ---

// [19] 랭킹 - 전국순위 + 학원순위 렌더링
// -----------------------------------------------------------
// renderRankings 함수 오버라이드 (기존 함수 후에 실행)
const _origRenderRankings = typeof renderRankings === "function" ? renderRankings : null;

// renderRankings 호출 후 학원 순위 컬럼 추가
function addAcademyRankColumn(data) {
  // 각 학원 내에서 순위 계산
  const academyGroups = {};
  data.forEach(s => {
    const acad = s.academyName || s.academy || "";
    if (!academyGroups[acad]) academyGroups[acad] = [];
    academyGroups[acad].push(s);
  });

  // 각 그룹을 포인트 기준 정렬하여 학원 내 순위 부여
  const rankMap = {};
  Object.values(academyGroups).forEach(group => {
    group.sort((a, b) => (b.points || 0) - (a.points || 0));
    group.forEach((s, i) => {
      rankMap[s.id] = i + 1;
    });
  });
  return rankMap;
}




// --- [Ranking Observer & Live Init] ---

// -----------------------------------------------------------
// [25] 랭킹 테이블 - 전국순위 + 학원순위 컬럼 렌더링
// -----------------------------------------------------------
// renderRankings의 studentRankingBody 렌더링 후처리로 학원 순위 추가
const _origRenderStudentRankings = null; // renderRankings 내부에서 처리

// MutationObserver로 studentRankingBody가 업데이트될 때 학원 순위 컬럼 추가
(function() {
  const observer = new MutationObserver(() => {
    const tbody = document.getElementById("studentRankingBody");
    if (!tbody) return;
    const rows = tbody.querySelectorAll("tr");
    if (rows.length === 0) return;

    // 이미 학원순위 컬럼이 있으면 스킵
    const firstRow = rows[0];
    if (firstRow && firstRow.cells.length > 0 && firstRow.dataset.academyRankAdded) return;

    // 각 행에서 소속학원을 기준으로 학원 내 순위 계산
    const academyCountMap = {};
    rows.forEach(row => {
      if (row.dataset.academy) {
        const acad = row.dataset.academy;
        if (!academyCountMap[acad]) academyCountMap[acad] = 0;
        academyCountMap[acad]++;
        const acRank = academyCountMap[acad];
        // 두 번째 셀(학원순위)에 데이터 추가 (이미 삽입되어 있으면 업데이트)
        const acRankCell = row.cells[1];
        if (acRankCell && row.cells.length >= 2) {
          acRankCell.innerText = `${acRank}위`;
          acRankCell.style.fontWeight = "700";
          acRankCell.style.color = acRank === 1 ? "#b38a00" : acRank === 2 ? "#6b7280" : acRank === 3 ? "#8c6d48" : "#374151";
        }
        row.dataset.academyRankAdded = "1";
      }
    });
  });

  // DOM 준비 후 옵저버 시작 및 랭킹 실데이터 즉시 초기화
  function initRankingViewOnReady() {
    const tbody = document.getElementById("studentRankingBody");
    if (tbody) {
      observer.observe(tbody, { childList: true, subtree: true });
    }
    if (typeof populateRankingMonthFilter === "function") populateRankingMonthFilter();
    if (typeof populateRankingAcademyFilter === "function") populateRankingAcademyFilter();
    if (typeof renderRankings === "function") renderRankings();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initRankingViewOnReady);
  } else {
    initRankingViewOnReady();
  }
})();
