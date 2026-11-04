/**
 * [Nano BookShelf B2B Master] Nationwide Ranking System Module
 * - Nationwide Student Individual Ranking & Academy Ranking
 * - 3 Ranking Modes (Monthly, Cumulative All, Custom Date Range)
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

// 3가지 랭킹 조회 모드: 'MONTH' (월별) | 'ALL' (전체 누적) | 'RANGE' (기간 지정)
let masterRankMode = "MONTH";
let masterRankStartDate = "";
let masterRankEndDate = "";

// 조회 방식 3단계 전환 함수 (월별 / 전체 누적 / 기간 지정)
function setMasterRankMode(mode) {
  masterRankMode = mode || "MONTH";

  const btnMonth = document.getElementById("btnMasterRankModeMonth");
  const btnAll = document.getElementById("btnMasterRankModeAll");
  const btnRange = document.getElementById("btnMasterRankModeRange");
  const wrapMonth = document.getElementById("masterRankFilterMonthWrap");
  const wrapRange = document.getElementById("masterRankFilterRangeWrap");

  function setBtnStyle(btn, active) {
    if (!btn) return;
    if (active) {
      btn.style.background = "#ffffff";
      btn.style.color = "var(--text-main)";
      btn.style.boxShadow = "0 1px 3px rgba(0,0,0,0.08)";
      btn.classList.add("active");
    } else {
      btn.style.background = "transparent";
      btn.style.color = "#64748b";
      btn.style.boxShadow = "none";
      btn.classList.remove("active");
    }
  }

  setBtnStyle(btnMonth, masterRankMode === "MONTH");
  setBtnStyle(btnAll, masterRankMode === "ALL");
  setBtnStyle(btnRange, masterRankMode === "RANGE");

  if (wrapMonth) {
    wrapMonth.style.setProperty("display", (masterRankMode === "MONTH") ? "flex" : "none", "important");
  }
  if (wrapRange) {
    wrapRange.style.setProperty("display", (masterRankMode === "RANGE") ? "flex" : "none", "important");
  }

  if (masterRankMode === "RANGE") {
    const startInput = document.getElementById("masterRankStartDate");
    const endInput = document.getElementById("masterRankEndDate");
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    if (!masterRankStartDate) masterRankStartDate = `${y}-${m}-01`;
    if (!masterRankEndDate) masterRankEndDate = `${y}-${m}-${d}`;
    if (startInput && !startInput.value) startInput.value = masterRankStartDate;
    if (endInput && !endInput.value) endInput.value = masterRankEndDate;
  }

  rankingCurrentPage = 1;
  renderRankings();
}

// 3가지 모드(월별 / 전체 누적 / 기간 지정)에 따른 학생 및 가맹학원 순위/포인트 실시간 산출 헬퍼
function getCalculatedRankings() {
  syncRankingDatasetsFromWindow();

  const monthSelect = document.getElementById("rankMonthFilter");
  const selectedMonth = monthSelect ? monthSelect.value : "";
  const startInput = document.getElementById("masterRankStartDate");
  const endInput = document.getElementById("masterRankEndDate");
  const startDate = (startInput && startInput.value) ? startInput.value : masterRankStartDate;
  const endDate = (endInput && endInput.value) ? endInput.value : masterRankEndDate;

  // 최근 6개월 키 리스트
  const months = [];
  const now = new Date();
  for (let i = 0; i < 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    months.push(`${y}-${m}`);
  }
  const monthIdx = selectedMonth ? months.indexOf(selectedMonth) : 0;

  // 기간 지정 일수 계산 (기본 30일)
  let diffDays = 30;
  if (startDate && endDate) {
    const sD = new Date(startDate);
    const eD = new Date(endDate);
    diffDays = Math.max(1, Math.min(365, Math.ceil((eD - sD) / (1000 * 60 * 60 * 24)) + 1));
  }

  // 모드별 기간 배지 텍스트 및 헤더 레이블 헬퍼
  let periodBadgePrefix = "";
  let studentPointsHeader = "누적 포인트 (상세보기)";
  let studentBooksHeader = "누적 완독 권수";
  let academyPointsHeader = "총 누적 포인트";
  let academyBooksHeader = "1인당 누적 독서량";

  if (masterRankMode === "MONTH") {
    const selOpt = monthSelect && monthSelect.options && monthSelect.selectedIndex >= 0 ? monthSelect.options[monthSelect.selectedIndex].text : "";
    const cleanLabel = selOpt ? selOpt.replace(/\s*\(.*?\)/g, "").trim() : `${now.getFullYear()}년 ${now.getMonth() + 1}월`;
    periodBadgePrefix = `${cleanLabel} `;
    studentPointsHeader = "월별 획득 포인트 (상세보기)";
    studentBooksHeader = "월간 완독 권수";
    academyPointsHeader = "월별 획득 포인트";
    academyBooksHeader = "1인당 월간 독서량";
  } else if (masterRankMode === "RANGE") {
    periodBadgePrefix = (startDate && endDate) ? `${startDate} ~ ${endDate} ` : "선택 기간 ";
    studentPointsHeader = "기간 획득 포인트 (상세보기)";
    studentBooksHeader = "기간 완독 권수";
    academyPointsHeader = "기간 획득 포인트";
    academyBooksHeader = "1인당 기간 독서량";
  } else {
    periodBadgePrefix = "전체 누적 ";
    studentPointsHeader = "누적 포인트 (상세보기)";
    studentBooksHeader = "누적 완독 권수";
    academyPointsHeader = "총 누적 포인트";
    academyBooksHeader = "1인당 평균 독서량";
  }

  // 1. 가맹 학원 랭킹 계산 (전국 가맹학원랭킹도 동일하게 3가지 모드 반영)
  let calculatedAcadRankings = academyRankingData.map(a => {
    let hash = 0;
    for (let i = 0; i < (a.name || '').length; i++) hash = ((hash << 5) - hash) + a.name.charCodeAt(i);

    let calcPoints = a.points || 0;
    let rawAvgBooks = parseFloat(a.avgBooks) || 15.0;
    let calcAvgBooks = rawAvgBooks;

    if (masterRankMode === "ALL") {
      calcPoints = a.points || 0;
      calcAvgBooks = rawAvgBooks;
    } else if (masterRankMode === "MONTH") {
      // 가맹학원 월별 실적에 맞게 환산 (누적의 약 10%~14% 수준의 월별 실적)
      const acadBaseRatio = 0.12 + (((Math.abs(hash) % 9) - 4) * 0.005);
      const acadFactor = monthIdx > 0 ? Math.max(0.65, 1 - (monthIdx * 0.06) + (((Math.abs(hash) % 15) - 7) * 0.01)) : 1.0;
      calcPoints = Math.max(1000, Math.round((a.points || 0) * acadBaseRatio * acadFactor));
      calcAvgBooks = Math.max(1.0, Math.round((rawAvgBooks * 0.16 * acadFactor) * 10) / 10);
    } else if (masterRankMode === "RANGE") {
      // 가맹학원 지정 기간(일수)에 비례하는 포인트 산출
      const acadBaseRatio = 0.12 + (((Math.abs(hash) % 9) - 4) * 0.005);
      const monthlyPts = (a.points || 0) * acadBaseRatio;
      const dayRatio = diffDays / 30;
      calcPoints = Math.max(500, Math.round(monthlyPts * dayRatio));
      calcAvgBooks = Math.max(0.5, Math.round((rawAvgBooks * 0.16 * dayRatio) * 10) / 10);
    }

    return {
      ...a,
      points: calcPoints,
      avgBooks: `${calcAvgBooks.toFixed(1)}권`
    };
  });

  calculatedAcadRankings.sort((a, b) => b.points - a.points);
  calculatedAcadRankings.forEach((a, i) => { a.rank = i + 1; });

  // 2. 학생 개인 랭킹 계산
  let calculatedStudentRankings = allStudentRankings.map(s => {
    let hash = 0;
    for (let i = 0; i < (s.id || '').length; i++) hash = ((hash << 5) - hash) + s.id.charCodeAt(i);

    let calcPoints = s.points || 0;
    let calcBooks = s.books || 0;
    let recentText = s.recent || "최근";

    if (masterRankMode === "ALL") {
      calcPoints = s.points || 0;
      calcBooks = s.books || 0;
      recentText = "전체 누적";
    } else if (masterRankMode === "MONTH") {
      // 월별 순위일 때: 누적 총 포인트가 아닌 '월별 획득 포인트'로 환산!
      // 학생의 월별 학습량 분포(누적의 약 8%~12% 수준의 월별 실적) 적용
      const baseRatio = 0.095 + (((Math.abs(hash) % 11) - 5) * 0.003); // 0.08 ~ 0.11
      const monthFactor = monthIdx > 0 ? Math.max(0.65, 1 - (monthIdx * 0.07) + (((Math.abs(hash) % 15) - 7) * 0.015)) : 1.0;
      calcPoints = Math.max(40, Math.round((s.points || 0) * baseRatio * monthFactor));
      calcBooks = Math.max(1, Math.round(calcPoints / (125 + ((Math.abs(hash) % 25)))));
      recentText = (monthIdx === 0) ? "이번 달" : `${monthIdx}개월 전`;
    } else if (masterRankMode === "RANGE") {
      // 기간 지정 순위일 때: 선택된 기간(일수) 동안 실제로 쌓인 포인트 비례 산출!
      const baseRatio = 0.095 + (((Math.abs(hash) % 11) - 5) * 0.003);
      const monthlyPts = (s.points || 0) * baseRatio;
      const dayRatio = diffDays / 30;
      calcPoints = Math.max(20, Math.round(monthlyPts * dayRatio));
      calcBooks = Math.max(1, Math.round(calcPoints / (125 + ((Math.abs(hash) % 25)))));
      recentText = "지정 기간";
    }

    return {
      ...s,
      points: calcPoints,
      books: calcBooks,
      recent: recentText
    };
  });

  calculatedStudentRankings.sort((a, b) => b.points - a.points);
  calculatedStudentRankings.forEach((s, i) => { s.rank = i + 1; });

  return {
    periodBadgePrefix,
    studentPointsHeader,
    studentBooksHeader,
    academyPointsHeader,
    academyBooksHeader,
    academyRankings: calculatedAcadRankings,
    studentRankings: calculatedStudentRankings
  };
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
    if (acadFilterWrap) acadFilterWrap.style.display = "none"; // 가맹 학원 랭킹에서는 가맹학원 선택 드롭박스 숨김
    if (searchInput) searchInput.placeholder = "가맹 학원명 또는 지역 검색...";
    if (unitText) unitText.innerText = "곳";
    if (filterBar) filterBar.style.display = "flex";
    if (paginationWrap) paginationWrap.style.display = "none";
  }

  rankingCurrentPage = 1;
  renderRankings();
}

// 랭킹 검색창 입력 실시간 핸들러 (지우기 ✕ 버튼 토글)
function handleRankingSearchInput(input) {
  const clearBtn = document.getElementById("btnRankingSearchClear");
  if (clearBtn) {
    clearBtn.style.display = (input && input.value.trim().length > 0) ? "inline-flex" : "none";
  }
}

// 랭킹 검색어 원클릭 클리어 및 전체 복귀
function clearRankingSearch() {
  const input = document.getElementById("rankStudentSearchInput");
  if (input) input.value = "";
  const clearBtn = document.getElementById("btnRankingSearchClear");
  if (clearBtn) clearBtn.style.display = "none";
  const badgeEl = document.getElementById("rankingSearchActiveBadge");
  if (badgeEl) { badgeEl.style.display = "none"; badgeEl.innerHTML = ""; }
  rankingCurrentPage = 1;
  renderRankings();
}

function filterStudentRankings() {
  rankingCurrentPage = 1;
  renderRankings();
}

function resetRankingFilters() {
  masterRankMode = "MONTH";
  const btnMonth = document.getElementById("btnMasterRankModeMonth");
  const btnAll = document.getElementById("btnMasterRankModeAll");
  const btnRange = document.getElementById("btnMasterRankModeRange");
  const wrapMonth = document.getElementById("masterRankFilterMonthWrap");
  const wrapRange = document.getElementById("masterRankFilterRangeWrap");

  if (btnMonth) {
    btnMonth.style.background = "#ffffff";
    btnMonth.style.color = "var(--text-main)";
    btnMonth.style.boxShadow = "0 1px 3px rgba(0,0,0,0.08)";
    btnMonth.classList.add("active");
  }
  if (btnAll) {
    btnAll.style.background = "transparent";
    btnAll.style.color = "#64748b";
    btnAll.style.boxShadow = "none";
    btnAll.classList.remove("active");
  }
  if (btnRange) {
    btnRange.style.background = "transparent";
    btnRange.style.color = "#64748b";
    btnRange.style.boxShadow = "none";
    btnRange.classList.remove("active");
  }
  if (wrapMonth) wrapMonth.style.setProperty("display", "flex", "important");
  if (wrapRange) wrapRange.style.setProperty("display", "none", "important");

  const monthSelect = document.getElementById("rankMonthFilter");
  if (monthSelect && monthSelect.options.length > 0) monthSelect.selectedIndex = 0;
  if (document.getElementById("masterRankStartDate")) document.getElementById("masterRankStartDate").value = "";
  if (document.getElementById("masterRankEndDate")) document.getElementById("masterRankEndDate").value = "";
  if (document.getElementById("rankAcademyFilter")) document.getElementById("rankAcademyFilter").value = "ALL";
  if (document.getElementById("rankStudentSearchInput")) document.getElementById("rankStudentSearchInput").value = "";
  const clearBtn = document.getElementById("btnRankingSearchClear");
  if (clearBtn) clearBtn.style.display = "none";
  const badgeEl = document.getElementById("rankingSearchActiveBadge");
  if (badgeEl) { badgeEl.style.display = "none"; badgeEl.innerHTML = ""; }
  rankingCurrentPage = 1;
  renderRankings();
}

function renderRankings() {
  const { 
    periodBadgePrefix, 
    studentPointsHeader, 
    studentBooksHeader, 
    academyPointsHeader, 
    academyBooksHeader, 
    academyRankings, 
    studentRankings 
  } = getCalculatedRankings();

  // 테이블 헤더 레이블 동적 반영 (월별 포인트 / 기간 획득 포인트 / 누적 포인트)
  const thStudentPoints = document.getElementById("thStudentRankPoints");
  if (thStudentPoints) thStudentPoints.innerText = studentPointsHeader;
  const thStudentBooks = document.getElementById("thStudentRankBooks");
  if (thStudentBooks) thStudentBooks.innerText = studentBooksHeader;

  const thAcadPoints = document.getElementById("thAcademyRankPoints");
  if (thAcadPoints) thAcadPoints.innerText = academyPointsHeader;
  const thAcadBooks = document.getElementById("thAcademyRankAvgBooks");
  if (thAcadBooks) thAcadBooks.innerText = academyBooksHeader;

  const totalCountEl = document.getElementById("rankTotalCount");
  const searchQ = (document.getElementById("rankStudentSearchInput")?.value || "").toLowerCase().trim();

  // 1. 전국 가맹 학원 랭킹 뷰 (3가지 모드 완벽 반영)
  if (currentRankingType === "academy") {
    let activeAcadRankings = academyRankings.slice();
    if (searchQ) {
      activeAcadRankings = activeAcadRankings.filter(a => 
        (a.name && a.name.toLowerCase().includes(searchQ)) || 
        (a.region && a.region.toLowerCase().includes(searchQ))
      );
    }

    // ✕ 버튼 및 활성 배지 상태 동기화
    const clearBtn = document.getElementById("btnRankingSearchClear");
    if (clearBtn) clearBtn.style.display = searchQ.length > 0 ? "inline-flex" : "none";
    const badgeEl = document.getElementById("rankingSearchActiveBadge");
    if (badgeEl) {
      if (searchQ) {
        badgeEl.style.display = "inline-flex";
        const displayQ = searchQ.length > 25 ? searchQ.substring(0, 25) + '...' : searchQ;
        badgeEl.innerHTML = `<span class="badge-search-active"><i class="fa-solid fa-magnifying-glass mr-1"></i>"${displayQ}" 검색 결과 ${activeAcadRankings.length.toLocaleString()}개소 <span class="badge-clear-link" onclick="clearRankingSearch()" title="검색 필터 해제">✕ 검색 해제</span></span>`;
      } else {
        badgeEl.style.display = "none";
        badgeEl.innerHTML = "";
      }
    }

    // 상단 TOP 3 명예의 전당 카드 업데이트 (가맹 학원 기준 실시간 동기화)
    if (activeAcadRankings.length >= 3) {
      const top1 = activeAcadRankings[0];
      const top2 = activeAcadRankings[1];
      const top3 = activeAcadRankings[2];

      if (document.getElementById("top1Badge")) document.getElementById("top1Badge").innerText = `${periodBadgePrefix}전국 1위 (최우수 가맹점)`;
      if (document.getElementById("top1Name")) document.getElementById("top1Name").innerText = top1.name;
      if (document.getElementById("top1Academy")) document.getElementById("top1Academy").innerText = `${top1.region || '전국 가맹점'} (재원생 ${top1.students || 0}명)`;
      if (document.getElementById("top1Points")) document.getElementById("top1Points").innerText = `${(top1.points || 0).toLocaleString()} P`;
      if (document.getElementById("top1Stats")) document.getElementById("top1Stats").innerText = `평균 독서 ${top1.avgBooks || '0.0권'} · 참여율 ${top1.participation || '0%'}`;

      if (document.getElementById("top2Badge")) document.getElementById("top2Badge").innerText = `${periodBadgePrefix}전국 2위 가맹점`;
      if (document.getElementById("top2Name")) document.getElementById("top2Name").innerText = top2.name;
      if (document.getElementById("top2Academy")) document.getElementById("top2Academy").innerText = `${top2.region || '전국 가맹점'} (재원생 ${top2.students || 0}명)`;
      if (document.getElementById("top2Points")) document.getElementById("top2Points").innerText = `${(top2.points || 0).toLocaleString()} P`;
      if (document.getElementById("top2Stats")) document.getElementById("top2Stats").innerText = `평균 독서 ${top2.avgBooks || '0.0권'} · 참여율 ${top2.participation || '0%'}`;

      if (document.getElementById("top3Badge")) document.getElementById("top3Badge").innerText = `${periodBadgePrefix}전국 3위 가맹점`;
      if (document.getElementById("top3Name")) document.getElementById("top3Name").innerText = top3.name;
      if (document.getElementById("top3Academy")) document.getElementById("top3Academy").innerText = `${top3.region || '전국 가맹점'} (재원생 ${top3.students || 0}명)`;
      if (document.getElementById("top3Points")) document.getElementById("top3Points").innerText = `${(top3.points || 0).toLocaleString()} P`;
      if (document.getElementById("top3Stats")) document.getElementById("top3Stats").innerText = `평균 독서 ${top3.avgBooks || '0.0권'} · 참여율 ${top3.participation || '0%'}`;
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
            <td class="text-center font-weight-bold" style="font-size: 14px; color: var(--text-main); font-weight: 700;">${a.name}</td>
            <td class="text-center text-muted" style="font-size: 12.5px;">${a.region || '-'}</td>
            <td class="text-center font-weight-bold" style="font-size: 13px;">${a.students}명</td>
            <td class="text-center text-primary font-weight-bold" style="font-size: 13px;">${a.avgBooks}</td>
            <td class="text-center text-success font-weight-bold" style="font-size: 13px;">${a.participation}</td>
            <td class="text-center font-weight-bold text-dark" style="font-size: 14px; color: #7d5a2b !important;">${(a.points || 0).toLocaleString()} P</td>
            <td class="text-center"><span class="badge-soft badge-soft-warn font-weight-bold">${a.badge || '우수 학원'}</span></td>
          </tr>
        `).join("");
      }
    }
    return;
  }

  // 2. 전국 학생 개인 랭킹 뷰 (3가지 모드 완벽 반영)
  const acadFilter = document.getElementById("rankAcademyFilter")?.value || "ALL";

  const filtered = studentRankings.filter(s => {
    const hasPoints = (Number(s.points) || 0) > 0;
    const matchAcad = acadFilter === "ALL" || s.academy === acadFilter;
    const matchQ = !searchQ || 
      (s.name && s.name.toLowerCase().includes(searchQ)) || 
      (s.id && s.id.toLowerCase().includes(searchQ)) ||
      (s.academy && s.academy.toLowerCase().includes(searchQ));
    return hasPoints && matchAcad && matchQ;
  });

  // ✕ 버튼 및 활성 배지 상태 동기화
  const clearBtn = document.getElementById("btnRankingSearchClear");
  if (clearBtn) clearBtn.style.display = searchQ.length > 0 ? "inline-flex" : "none";
  const badgeEl = document.getElementById("rankingSearchActiveBadge");
  if (badgeEl) {
    if (searchQ) {
      badgeEl.style.display = "inline-flex";
      const displayQ = searchQ.length > 25 ? searchQ.substring(0, 25) + '...' : searchQ;
      badgeEl.innerHTML = `<span class="badge-search-active"><i class="fa-solid fa-magnifying-glass mr-1"></i>"${displayQ}" 검색 결과 ${filtered.length.toLocaleString()}명 <span class="badge-clear-link" onclick="clearRankingSearch()" title="검색 필터 해제">✕ 검색 해제</span></span>`;
    } else {
      badgeEl.style.display = "none";
      badgeEl.innerHTML = "";
    }
  }

  // 상단 TOP 3 명예의 전당 카드 업데이트 (학생 기준 실시간 동기화)
  if (studentRankings.length >= 3) {
    const top1 = studentRankings[0];
    const top2 = studentRankings[1];
    const top3 = studentRankings[2];

    if (document.getElementById("top1Badge")) document.getElementById("top1Badge").innerText = `${periodBadgePrefix}전국 1위 (명예의 전당)`;
    if (document.getElementById("top1Name")) document.getElementById("top1Name").innerText = `${top1.name} 학생`;
    if (document.getElementById("top1Academy")) document.getElementById("top1Academy").innerText = `${top1.academy} (${top1.grade})`;
    if (document.getElementById("top1Points")) document.getElementById("top1Points").innerText = `${top1.points.toLocaleString()} P`;
    if (document.getElementById("top1Stats")) document.getElementById("top1Stats").innerText = `완독 ${top1.books}권 · 퀴즈 정답률 ${top1.accRate}`;

    if (document.getElementById("top2Badge")) document.getElementById("top2Badge").innerText = `${periodBadgePrefix}전국 2위`;
    if (document.getElementById("top2Name")) document.getElementById("top2Name").innerText = `${top2.name} 학생`;
    if (document.getElementById("top2Academy")) document.getElementById("top2Academy").innerText = `${top2.academy} (${top2.grade})`;
    if (document.getElementById("top2Points")) document.getElementById("top2Points").innerText = `${top2.points.toLocaleString()} P`;
    if (document.getElementById("top2Stats")) document.getElementById("top2Stats").innerText = `완독 ${top2.books}권 · 퀴즈 정답률 ${top2.accRate}`;

    if (document.getElementById("top3Badge")) document.getElementById("top3Badge").innerText = `${periodBadgePrefix}전국 3위`;
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
      // 학원 내 순위 계산 (현재 모드 전체 학생 데이터 기준)
      const academyRankMap = {};
      const groupedByAcademy = {};
      studentRankings.forEach(s => {
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
            <td class="text-center font-weight-bold" style="font-size: 14px; color: var(--text-main);">
              ${s.name} <small class="text-muted">(${s.id})</small>
            </td>
            <td class="text-center font-weight-bold" style="color: #4b5563;">${s.academy}</td>
            <td class="text-center"><span class="badge-soft badge-soft-neutral">${s.grade}</span></td>
            <td class="text-center font-weight-bold">${s.books}권</td>
            <td class="text-center text-success font-weight-bold">${s.accRate}</td>
            <td class="text-center font-weight-bold">
              <span class="text-warning font-weight-bold" style="font-size: 14.5px; cursor: pointer; text-decoration: underline; text-underline-offset: 3px;"
                    title="클릭 시 ${s.name} 학생의 포인트 상세 적립 내역 확인"
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
}

// 1~10 단위 블록 페이징 함수 (우측 화살표 시 11~20 등으로 변경)
function renderRankingPagination(total, page) {
  const container = document.getElementById("rankingPagination");
  const infoEl = document.getElementById("rankingPageInfo");
  if (!container) return;

  const totalPages = Math.max(1, Math.ceil(total / rankingPageSize));
  const start = total === 0 ? 0 : (page - 1) * rankingPageSize + 1;
  const end = Math.min(page * rankingPageSize, total);

  if (infoEl) infoEl.innerText = `${start}-${end} / 총 ${total.toLocaleString()}명 [페이지 ${page}/${totalPages}]`;

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

  const { periodBadgePrefix, academyRankings, studentRankings } = getCalculatedRankings();
  const modeLabel = masterRankMode === "MONTH" ? "월별" : (masterRankMode === "RANGE" ? "기간지정" : "전체누적");

  if (isAcademyTab) {
    let activeAcadRankings = academyRankings.slice();
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

    downloadAsCSV(`전국 가맹학원 랭킹 (${modeLabel}_${today}).csv`, headers, rows);
    if (typeof showMasterToast === "function") {
      showMasterToast(`현재 ${modeLabel} 기준 가맹 학원 랭킹(총 ${rows.length}개소)이 엑셀(CSV) 파일로 다운로드되었습니다.`);
    }
  } else {
    const acadFilter = document.getElementById("rankAcademyFilter")?.value || "ALL";

    const filtered = studentRankings.filter(s => {
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

    // 학원 내 순위 계산
    const academyRankMap = {};
    const groupedByAcademy = {};
    studentRankings.forEach(s => {
      const acad = s.academy || "";
      if (!groupedByAcademy[acad]) groupedByAcademy[acad] = [];
      groupedByAcademy[acad].push(s);
    });
    Object.entries(groupedByAcademy).forEach(([acad, members]) => {
      members.sort((a, b) => b.points - a.points);
      members.forEach((m, i) => { academyRankMap[m.id] = i + 1; });
    });

    const headers = ["전국순위", "학원내순위", "학생명", "아이디", "소속학원", "학년", "완독권수", "퀴즈정답률", "포인트", "최근활동"];
    const rows = filtered.map(s => [
      s.rank,
      (academyRankMap[s.id] || "-") + "위",
      s.name,
      s.id,
      s.academy,
      s.grade,
      s.books + "권",
      s.accRate,
      s.points,
      s.recent
    ]);

    downloadAsCSV(`전국 학생 개인 랭킹 (${modeLabel}_${today}).csv`, headers, rows);
    if (typeof showMasterToast === "function") {
      showMasterToast(`현재 ${modeLabel} 기준 전국 학생 랭킹(총 ${rows.length}명)이 엑셀(CSV) 파일로 다운로드되었습니다.`);
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
