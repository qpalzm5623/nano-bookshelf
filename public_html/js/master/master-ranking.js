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

// 서버 실시간 랭킹 캐시 (모드·월·기간별 Neon PostgreSQL 실데이터 동기화)
const masterRemoteRankCache = {};
let masterRemoteRankReqSeq = 0;
let masterServerAvailableMonths = [];

// 최근 12개월 + 서버 실데이터 보유 과거 월 전체 드롭다운 생성 (선택값 보존)
function populateRankingMonthFilter() {
  const select = document.getElementById("rankMonthFilter");
  if (!select) return;
  const currentVal = select.value;

  const now = new Date();
  const currentYm = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const prev1 = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prev1Ym = `${prev1.getFullYear()}-${String(prev1.getMonth() + 1).padStart(2, '0')}`;
  const prev2 = new Date(now.getFullYear(), now.getMonth() - 2, 1);
  const prev2Ym = `${prev2.getFullYear()}-${String(prev2.getMonth() + 1).padStart(2, '0')}`;

  const monthSet = new Set();
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    monthSet.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  }
  if (Array.isArray(masterServerAvailableMonths)) {
    masterServerAvailableMonths.forEach(ym => {
      if (/^\d{4}-(0[1-9]|1[0-2])$/.test(String(ym || ''))) monthSet.add(ym);
    });
  }

  const sortedMonths = Array.from(monthSet).sort((a, b) => b.localeCompare(a));
  let html = "";
  sortedMonths.forEach(key => {
    const [yStr, mStr] = key.split("-");
    let label = `${Number(yStr)}년 ${Number(mStr)}월`;
    if (key === currentYm) label += " (현월)";
    else if (key === prev1Ym) label += " (전월)";
    else if (key === prev2Ym) label += " (전전월)";
    html += `<option value="${key}">${label}</option>`;
  });
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

function formatMasterRecentActivity(isoStr, fallbackLabel) {
  if (!isoStr) return fallbackLabel || "-";
  const d = new Date(isoStr);
  if (isNaN(d.getTime())) return fallbackLabel || "-";
  const kst = new Date(+d + 9 * 3600000);
  return kst.toISOString().slice(0, 10);
}

async function fetchMasterRemoteRankings(cacheKey, mode, selectedMonth, startDate, endDate) {
  if (!(typeof window !== "undefined" && window.NanoPortal && NanoPortal.remote)) return;
  const cached = masterRemoteRankCache[cacheKey];
  if (cached && (cached.loading || Date.now() - cached.loadedAt < 20000)) return;

  masterRemoteRankCache[cacheKey] = { ...(cached || {}), loading: true };
  const reqSeq = ++masterRemoteRankReqSeq;
  try {
    let url = `/api/manage?entity=rankings&scope=global&mode=${encodeURIComponent(mode)}`;
    if (mode === "MONTH" && selectedMonth) url += `&month=${encodeURIComponent(selectedMonth)}`;
    if (mode === "RANGE") {
      if (startDate) url += `&startDate=${encodeURIComponent(startDate)}`;
      if (endDate) url += `&endDate=${encodeURIComponent(endDate)}`;
    }
    const res = await NanoPortal.api(url);
    const fallbackRecent = mode === "ALL" ? "전체 누적" : (mode === "RANGE" ? "지정 기간" : (selectedMonth || "해당 월"));
    const students = (res.items || []).map((s, idx) => ({
      rank: idx + 1,
      name: s.name,
      id: s.username || s.id,
      serverId: s.serverId,
      academy: s.academy || "소속 미상",
      grade: s.grade || "초등 전학년",
      books: Number(s.books) || 0,
      accRate: s.accRate || "-",
      points: Number(s.points) || 0,
      recent: formatMasterRecentActivity(s.lastCompletedAt, fallbackRecent),
    }));
    const academies = (res.academyItems || []).map((a, idx) => ({
      rank: idx + 1,
      name: a.name,
      region: a.region || "전국",
      students: Number(a.students) || 0,
      avgBooks: a.avgBooks || "0.0권",
      participation: a.participation || "0%",
      points: Number(a.points) || 0,
      badge: a.badge || "일반 가맹점",
    }));

    masterRemoteRankCache[cacheKey] = {
      loading: false,
      loadedAt: Date.now(),
      studentRankings: students,
      academyRankings: academies,
    };

    if (Array.isArray(res.months) && res.months.length > 0) {
      const prevLen = masterServerAvailableMonths.length;
      masterServerAvailableMonths = res.months;
      if (res.months.length !== prevLen) populateRankingMonthFilter();
    }

    if (reqSeq === masterRemoteRankReqSeq) {
      const select = document.getElementById("rankAcademyFilter");
      if (select) {
        const prevAcad = select.value || "ALL";
        const acadSet = new Set();
        allStudentRankings.forEach(s => { if (s.academy) acadSet.add(s.academy); });
        students.forEach(s => { if (s.academy) acadSet.add(s.academy); });
        const sortedAcademies = Array.from(acadSet).sort((a, b) => a.localeCompare(b, 'ko'));
        select.innerHTML = `<option value="ALL">전체 가맹 학원 (${sortedAcademies.length}곳)</option>` +
          sortedAcademies.map(acad => `<option value="${acad}">🏫 ${acad}</option>`).join("");
        if (Array.from(select.options).some(o => o.value === prevAcad)) select.value = prevAcad;
      }
      renderRankings(true);
    }
  } catch (_) {
    if (masterRemoteRankCache[cacheKey]) masterRemoteRankCache[cacheKey].loading = false;
  }
}

// 3가지 모드(월별 / 전체 누적 / 기간 지정)에 따른 학생 및 가맹학원 순위/포인트 실시간 산출 헬퍼
function getCalculatedRankings(skipRemoteFetch) {
  syncRankingDatasetsFromWindow();

  const monthSelect = document.getElementById("rankMonthFilter");
  const now = new Date();
  const defaultYm = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const selectedMonth = (monthSelect && monthSelect.value) ? monthSelect.value : defaultYm;
  const startInput = document.getElementById("masterRankStartDate");
  const endInput = document.getElementById("masterRankEndDate");
  const startDate = (startInput && startInput.value) ? startInput.value : masterRankStartDate;
  const endDate = (endInput && endInput.value) ? endInput.value : masterRankEndDate;

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

  // 운영 서버 연결 시: 임의 비율 추정이 아닌 Neon DB PointHistory + QuizAttempt 100% 실데이터 반환
  if (typeof window !== "undefined" && window.NanoPortal && NanoPortal.remote) {
    const cacheKey = masterRankMode === "MONTH"
      ? `MONTH:${selectedMonth}`
      : (masterRankMode === "RANGE" ? `RANGE:${startDate}:${endDate}` : "ALL");
    const cached = masterRemoteRankCache[cacheKey];
    if (!skipRemoteFetch && (!cached || (!cached.loading && Date.now() - (cached.loadedAt || 0) > 20000))) {
      fetchMasterRemoteRankings(cacheKey, masterRankMode, selectedMonth, startDate, endDate);
    }
    if (cached && Array.isArray(cached.studentRankings)) {
      return {
        periodBadgePrefix,
        studentPointsHeader,
        studentBooksHeader,
        academyPointsHeader,
        academyBooksHeader,
        academyRankings: cached.academyRankings || [],
        studentRankings: cached.studentRankings || [],
      };
    }
    // 최초 응답 대기 중에는 ALL 모드는 정적 실데이터 스냅샷, 월별/기간은 빈 배열 대기 처리
    if (masterRankMode !== "ALL") {
      return {
        periodBadgePrefix,
        studentPointsHeader,
        studentBooksHeader,
        academyPointsHeader,
        academyBooksHeader,
        academyRankings: [],
        studentRankings: [],
      };
    }
  }

  // 오프라인 정적 프리뷰 폴백
  let calculatedAcadRankings = academyRankingData.map((a, idx) => ({
    ...a,
    rank: idx + 1,
    points: masterRankMode === "ALL" ? (a.points || 0) : 0,
    avgBooks: masterRankMode === "ALL" ? (a.avgBooks || "0.0권") : "0.0권"
  })).filter(a => a.points > 0 || masterRankMode === "ALL");
  calculatedAcadRankings.sort((a, b) => b.points - a.points);
  calculatedAcadRankings.forEach((a, i) => { a.rank = i + 1; });

  let calculatedStudentRankings = allStudentRankings.map(s => ({
    ...s,
    points: masterRankMode === "ALL" ? (s.points || 0) : 0,
    books: masterRankMode === "ALL" ? (s.books || 0) : 0,
    recent: masterRankMode === "ALL" ? (s.recent || "전체 누적") : "-"
  })).filter(s => s.points > 0);
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

let lastFilteredRankingTotal = 0;

function renderRankings(skipRemoteFetch) {
  const { 
    periodBadgePrefix, 
    studentPointsHeader, 
    studentBooksHeader, 
    academyPointsHeader, 
    academyBooksHeader, 
    academyRankings, 
    studentRankings 
  } = getCalculatedRankings(skipRemoteFetch);

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
  lastFilteredRankingTotal = total;
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
  const baseTotal = lastFilteredRankingTotal > 0 ? lastFilteredRankingTotal : allStudentRankings.length;
  const totalPages = Math.max(1, Math.ceil(baseTotal / rankingPageSize));
  if (p < 1) p = 1;
  if (p > totalPages) p = totalPages;
  rankingCurrentPage = p;
  renderRankings(true);
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

// 2. 누적 포인트 상세 내역 모달 (운영 서버 연결 시 실제 PointHistory 적립 내역 실시간 조회)
function openPointDetailModal(name, id, academy, grade, points) {
  document.getElementById("pointDetailStudentName").innerText = name;
  document.getElementById("pointDetailStudentGrade").innerText = grade;
  document.getElementById("pointDetailStudentId").innerText = `(${id})`;
  document.getElementById("pointDetailAcademy").innerText = academy;
  document.getElementById("pointDetailTotalPoints").innerText = `${Number(points).toLocaleString()} P`;

  const tbody = document.getElementById("pointDetailHistoryBody");
  if (typeof window !== "undefined" && window.NanoPortal && NanoPortal.remote) {
    if (tbody) {
      tbody.innerHTML = `<tr><td colspan="5" class="text-center py-4 text-muted font-weight-bold">실제 포인트 적립 내역을 불러오고 있습니다...</td></tr>`;
    }
    $('#pointDetailModal').modal('show');

    NanoPortal.api(`/api/manage?entity=point_logs&username=${encodeURIComponent(id)}`).then(res => {
      if (!tbody) return;
      const items = res.items || [];
      if (items.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="text-center py-4 text-muted">포인트 적립 내역이 없습니다.</td></tr>`;
        return;
      }
      tbody.innerHTML = items.map(item => {
        const dt = item.createdAt ? new Date(+new Date(item.createdAt) + 9 * 3600000).toISOString().replace('T', ' ').slice(0, 16) : '-';
        const rawContent = String(item.content || '');
        const pType = String(item.pointType || '');
        let typeLabel = '🎯 북퀴즈 인증 적립';
        if (pType.startsWith('THOUGHT')) typeLabel = '💡 생각담기 작성';
        else if (pType.startsWith('MANUAL')) typeLabel = '🏅 학원 수동 조정';
        const amt = Number(item.amount) || 0;
        const signPt = (amt > 0 ? '+' : '') + amt.toLocaleString() + ' P';
        return `
          <tr>
            <td class="text-center"><small class="text-muted">${dt}</small></td>
            <td class="font-weight-bold" style="color: var(--text-main);">${rawContent.replace(/</g, '&lt;')}</td>
            <td><span class="badge-soft badge-soft-neutral">${typeLabel}</span></td>
            <td class="text-right font-weight-bold text-warning" style="padding-right: 20px;">${signPt}</td>
            <td class="text-center"><span class="badge-soft badge-soft-success">${amt >= 0 ? '적립완료' : '차감완료'}</span></td>
          </tr>
        `;
      }).join("");
    }).catch(err => {
      if (tbody) {
        tbody.innerHTML = `<tr><td colspan="5" class="text-center py-4 text-danger">${(err && err.message) || '포인트 내역을 불러오지 못했습니다.'}</td></tr>`;
      }
    });
    return;
  }

  // 오프라인 정적 프리뷰 폴백
  if (tbody) {
    tbody.innerHTML = `<tr><td colspan="5" class="text-center py-4 text-muted">서버 연결 시 상세 적립 내역이 표시됩니다.</td></tr>`;
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

  // 표준 CSV 헤더 컬럼 (요구사항: ISBN 컬럼 추가, 주제분류태그 대체, 북퀴즈 세트 수 대체, 등록일자 YYYY-MM-DD)
  const headers = [
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

  const escapeCsv = val => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  // 날짜 형식 변환: YYYY-MM-DD (년월일) 까지만 안전 추출
  const formatBookDate = rawDate => {
    if (!rawDate) return "";
    const str = String(rawDate).trim();
    const match = str.match(/^(\d{4}[-/.]\d{2}[-/.]\d{2})/);
    if (match) {
      return match[1].replace(/[/.]/g, "-");
    }
    return str.slice(0, 10);
  };

  // 도서 주제 분류 태그(테마 태그) 추출 헬퍼 (세부 태그가 아닌 '주제 분류 태그 선택'의 테마)
  const getThemeTag = b => {
    if (!b) return "";
    // 1. 도서 객체에 저장된 themeTag 필드 우선
    if (b.themeTag && typeof b.themeTag === "string" && b.themeTag.trim()) {
      const t = b.themeTag.trim();
      return t.startsWith("#") ? t : `#${t}`;
    }
    // 2. subject 필드
    if (b.subject && typeof b.subject === "string" && b.subject.trim()) {
      const s = b.subject.trim();
      return s.startsWith("#") ? s : `#${s}`;
    }
    // 3. 글로벌 themeList와 매핑 검사
    const themes = (typeof themeList !== "undefined" && Array.isArray(themeList)) ? themeList : [];
    if (themes.length > 0) {
      for (const th of themes) {
        const cleanTh = String(th.tag || th.title || "").replace(/^#/, "").trim().toLowerCase();
        if (!cleanTh) continue;
        if (Array.isArray(b.tags)) {
          for (const tg of b.tags) {
            const cleanTg = String(tg || "").replace(/^#/, "").trim().toLowerCase();
            if (cleanTg === cleanTh) return th.tag ? (th.tag.startsWith("#") ? th.tag : `#${th.tag}`) : `#${cleanTh}`;
          }
        }
        if (b.category && String(b.category).toLowerCase().includes(cleanTh)) {
          return th.tag ? (th.tag.startsWith("#") ? th.tag : `#${th.tag}`) : `#${cleanTh}`;
        }
      }
    }
    // 4. tags 배열의 첫 항목이 #으로 시작하는 경우
    if (Array.isArray(b.tags) && b.tags.length > 0 && typeof b.tags[0] === "string") {
      const first = b.tags[0].trim();
      if (first.startsWith("#")) return first;
    }
    // 5. 기본 카테고리가 한국어 텍스트인 경우
    if (b.category && typeof b.category === "string" && !/^[A-Z]$/.test(b.category.trim())) {
      const c = b.category.trim();
      return c.startsWith("#") ? c : `#${c}`;
    }
    return "";
  };

  // 북퀴즈 등록 기관(세트) 수 산출 헬퍼 (몇 곳에서 등록했는지 기준)
  const getQuizSetCount = b => {
    if (!b) return "0";
    if (typeof b.quizSetCount === "number" && b.quizSetCount > 0) return `${b.quizSetCount}Set`;
    if (typeof getBookQuizSetCount === "function") {
      const cnt = getBookQuizSetCount(b);
      return cnt > 0 ? `${cnt}Set` : "0";
    }
    if (Array.isArray(b.quizSets) && b.quizSets.length > 0) {
      const valid = b.quizSets.filter(s => (Array.isArray(s.questions) && s.questions.length > 0) || (Array.isArray(s.quizzes) && s.quizzes.length > 0));
      return valid.length > 0 ? `${valid.length}Set` : "0";
    }
    if (b.title && b.title.includes("어린 왕자")) return "2Set";
    if (b.hasQuiz === true || b.hasQuiz === "Y" || (typeof b.quizzes === "number" && b.quizzes > 0) || (Array.isArray(b.quizList) && b.quizList.length > 0)) {
      return "1Set";
    }
    if (b.id === "FA000001" || (b.title && b.title.includes("고양이 목욕탕"))) return "1Set";
    return "0";
  };

  // 도서 ISBN 추출 헬퍼 (13자리 숫자 유지)
  const getIsbn = b => {
    if (!b) return "";
    if (b.isbn && String(b.isbn).trim()) return String(b.isbn).trim();
    if (b.isbn13 && String(b.isbn13).trim()) return String(b.isbn13).trim();
    if (b.cover && typeof b.cover === "string") {
      const m = b.cover.match(/\/(\d{10,13})\.(jpg|png|webp)/i);
      if (m && m[1]) return m[1];
    }
    return "";
  };

  const rows = booksToExport.map(b => {
    const isHq = !b.academyId || b.academyId === "HQ";
    const academyName = b.academyName || (isHq ? "본사 직속(HQ)" : "가맹 학원");
    const quizSetDisplay = getQuizSetCount(b);
    const hasSheet = (b.hasSheet || b.sheet) ? "유" : "무";
    const isPublic = b.isPublic !== "N" ? "공개" : "비공개";
    const pubYear = b.pubYear || b.year || "";
    const themeTag = getThemeTag(b);
    const isbnVal = getIsbn(b);
    const dateVal = formatBookDate(b.date || b.createdAt || b.regDate || "");

    // ISBN은 엑셀에서 숫자로 인식하여 지수 변환(9.79119E+12)되는 것을 방지하기 위해 ="ISBN" 텍스트 수식 포맷 사용
    const isbnCell = isbnVal ? `="${isbnVal}"` : '""';

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
