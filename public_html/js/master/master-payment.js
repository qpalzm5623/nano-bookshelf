/**
 * [Nano BookShelf B2B Master] Subscription & Payment Management Module
 * - Franchise Subscription & Payment History Table
 * - Monthly Revenue & Active Subscription KPIs
 * - Manual Payment Entry Modal (Cash/Bank Transfer)
 * - Payment History Excel Export
 */

// 8. 결제 내역 관리 모듈 (Master Payment Management)
// ==========================================

// 카드 결제(PG 자동 연동) 여부 판별 함수
function isCardPayment(method) {
  if (!method) return false;
  return method.includes("카드") || method.includes("간편결제") || method.includes("카카오페이") || method.includes("토스");
}

let masterPaymentList = [
  // 1. [나노 독서아카데미 목동본원] - 6개월 만료 후 1개월 갱신 결제 (카드 자동 승인)
  {
    id: "PAY-20260915-001",
    academyId: "ACAD-001",
    academyName: "나노 독서아카데미 목동본원",
    director: "김은영 원장",
    phone: "010-3342-9981",
    bizNumber: "105-86-12345",
    planType: "monthly",
    planName: "1개월 정기구독권",
    supply: 100000,
    vat: 10000,
    total: 110000,
    method: "신용카드",
    date: "2026-09-15 14:20:00",
    startDate: "2026-09-15",
    endDate: "2026-10-14",
    status: "paid", // 카드 결제는 PG 자동 승인 (관리자 임의 변경 불가)
    memo: "이전 6개월 패키지 만료 후 1개월 정기구독 카드 자동 결제 갱신 완료."
  },
  // 2. [송도 센트럴 리딩랩] - 수동 결제 (무통장 입금 확인 대기중 - 관리자 조정 가능)
  {
    id: "PAY-20260901-002",
    academyId: "ACAD-003",
    academyName: "송도 센트럴 리딩랩",
    director: "최윤정 원장",
    phone: "010-5541-0982",
    bizNumber: "131-87-54321",
    planType: "12month",
    planName: "12개월 연간권 (20% 할인)",
    supply: 960000,
    vat: 96000,
    total: 1056000,
    method: "무통장 입금 (현금)",
    date: "2026-09-01 09:12:30",
    startDate: "2026-09-01",
    endDate: "2027-08-31",
    status: "pending", // 수동 결제이므로 관리자가 입금 확인 후 '완료'로 변경 가능!
    memo: "원장님 기업은행 무통장 입금 신청 건. 입금 확인 대기 중."
  },
  // 3. [대치 에듀 독서논술센터] - 6개월 이용권 (신용카드 자동 결제완료)
  {
    id: "PAY-20260810-003",
    academyId: "ACAD-002",
    academyName: "대치 에듀 독서논술센터",
    director: "박진수 원장",
    phone: "010-8871-2311",
    bizNumber: "214-82-67890",
    planType: "6month",
    planName: "6개월 이용권 (10% 할인)",
    supply: 540000,
    vat: 54000,
    total: 594000,
    method: "신용카드",
    date: "2026-08-10 11:30:15",
    startDate: "2026-08-10",
    endDate: "2027-02-10",
    status: "paid",
    memo: "가맹점 2학기 프로모션 카드 정상 결제 완료."
  },
  // 4. [나노 독서아카데미 목동본원] - 과거 6개월 결제 완료 이력 보존 (동일 가맹점 히스토리 누적)
  {
    id: "PAY-20260315-004",
    academyId: "ACAD-001",
    academyName: "나노 독서아카데미 목동본원",
    director: "김은영 원장",
    phone: "010-3342-9981",
    bizNumber: "105-86-12345",
    planType: "6month",
    planName: "6개월 이용권 (10% 할인)",
    supply: 540000,
    vat: 54000,
    total: 594000,
    method: "신용카드",
    date: "2026-03-15 10:15:22",
    startDate: "2026-03-15",
    endDate: "2026-09-14",
    status: "paid", // 기간이 지난 과거 결제 내역도 그대로 영구 보존됨
    memo: "1학기 6개월 패키지 카드 결제 이용 완료 건. (만료 후 9/15 1개월 추가 갱신됨)"
  },
  // 5. [판교 알파 독서학원] - 가상계좌 (수동 취소)
  {
    id: "PAY-20260715-005",
    academyId: "ACAD-004",
    academyName: "판교 알파 독서학원",
    director: "정성훈 원장",
    phone: "010-4490-1123",
    bizNumber: "129-81-43210",
    planType: "monthly",
    planName: "1개월 정기구독권",
    supply: 100000,
    vat: 10000,
    total: 110000,
    method: "실시간 계좌이체 (수동)",
    date: "2026-07-15 15:00:22",
    startDate: "2026-07-15",
    endDate: "2026-08-14",
    status: "cancelled",
    memo: "원장님 요청으로 계좌이체 미입금 건 취소 처리."
  },
  // 6. [분당 서현 리딩클럽] - 12개월 연간권 (신용카드 자동 결제완료)
  {
    id: "PAY-20260701-006",
    academyId: "ACAD-005",
    academyName: "분당 서현 리딩클럽",
    director: "이지혜 원장",
    phone: "010-7712-4456",
    bizNumber: "142-83-99123",
    planType: "12month",
    planName: "12개월 연간권 (20% 할인)",
    supply: 960000,
    vat: 96000,
    total: 1056000,
    method: "신용카드",
    date: "2026-07-01 13:45:10",
    startDate: "2026-07-01",
    endDate: "2027-06-30",
    status: "paid",
    memo: "연간 패키지 20% 할인 프로모션 카드 결제 승인."
  },
  // 7. [나노 독서아카데미 목동본원] - 최초 가맹 등록 시점의 수동 결제 내역 (누적 히스토리)
  {
    id: "PAY-20250915-007",
    academyId: "ACAD-001",
    academyName: "나노 독서아카데미 목동본원",
    director: "김은영 원장",
    phone: "010-3342-9981",
    bizNumber: "105-86-12345",
    planType: "6month",
    planName: "6개월 이용권 (10% 할인)",
    supply: 540000,
    vat: 54000,
    total: 594000,
    method: "무통장 입금 (현금)",
    date: "2025-09-15 11:30:00",
    startDate: "2025-09-15",
    endDate: "2026-03-14",
    status: "paid",
    memo: "최초 가맹 계약 시 무통장 입금 수납 완료 건."
  }
];
if (window.NANO_SERVER_DATA) masterPaymentList = window.NANO_SERVER_PAYMENTS || [];

// =========================================================================
// [결제 관리 루틴] 승인 가맹점 판별, 한국 공휴일/주말 반영 15일 24:00 마감 및
// 16일 00:00 자동 '결제 대기' 생성, 월별 조회 헬퍼
// =========================================================================

// 한국 양력 고정 공휴일 (MM-DD)
const PAYMENT_KR_FIXED_HOLIDAYS = new Set([
  "01-01", // 신정
  "03-01", // 삼일절
  "05-05", // 어린이날
  "06-06", // 현충일
  "08-15", // 광복절
  "10-03", // 개천절
  "10-09", // 한글날
  "12-25"  // 성탄절
]);

// 한국 음력·대체·임시 공휴일 (2025~2030년)
const PAYMENT_KR_VARIABLE_HOLIDAYS = new Set([
  "2025-01-27", "2025-01-28", "2025-01-29", "2025-01-30", "2025-03-03", "2025-05-06", "2025-06-03", "2025-10-05", "2025-10-06", "2025-10-07", "2025-10-08",
  "2026-02-16", "2026-02-17", "2026-02-18", "2026-03-02", "2026-05-24", "2026-05-25", "2026-06-03", "2026-08-17", "2026-09-24", "2026-09-25", "2026-09-26", "2026-10-05",
  "2027-02-06", "2027-02-07", "2027-02-08", "2027-02-09", "2027-05-13", "2027-08-16", "2027-09-14", "2027-09-15", "2027-09-16", "2027-10-04", "2027-10-11", "2027-12-27",
  "2028-01-26", "2028-01-27", "2028-01-28", "2028-05-02", "2028-10-02", "2028-10-03", "2028-10-04", "2028-10-05",
  "2029-02-12", "2029-02-13", "2029-02-14", "2029-05-20", "2029-05-21", "2029-09-21", "2029-09-22", "2029-09-23", "2029-09-24",
  "2030-02-02", "2030-02-03", "2030-02-04", "2030-02-05", "2030-05-09", "2030-09-11", "2030-09-12", "2030-09-13"
]);

function getCurrentKstDateStr() {
  return new Date(Date.now() + 9 * 3600000).toISOString().slice(0, 10);
}

// '승인'(정상 운영) 상태인 가맹점인지 판별
function isApprovedFranchiseForPayment(acad) {
  if (!acad) return false;
  const st = String(acad.status || "ACTIVE").toUpperCase();
  if (st === "UNAPPROVED" || st === "TERMINATED" || st === "PAUSED" || st === "SUSPENDED" || st === "EXPIRED") {
    return false;
  }
  const todayStr = getCurrentKstDateStr();
  if (acad.endDate && String(acad.endDate).slice(0, 10) < todayStr) {
    return false;
  }
  return st === "ACTIVE" || st === "APPROVED" || st === "EXPIRING";
}

function getApprovedFranchiseList() {
  if (typeof franchiseList === "undefined" || !Array.isArray(franchiseList)) return [];
  return franchiseList.filter(isApprovedFranchiseForPayment);
}

// 결제 내역 항목이 '승인' 상태인 가맹점 소속인지 확인
function isApprovedPaymentItem(item) {
  if (!item) return false;
  if (typeof franchiseList === "undefined" || !Array.isArray(franchiseList) || franchiseList.length === 0) return true;
  const matched = franchiseList.find(a => (item.academyId && a.id === item.academyId) || (item.academyName && a.name === item.academyName));
  if (!matched) return false;
  return isApprovedFranchiseForPayment(matched);
}

// 특정 날짜(YYYY, M, D)가 한국 기준 주말(토/일) 또는 공휴일인지 판별
function isWeekendOrKoreanHoliday(year, month, day) {
  const pad = n => (n < 10 ? "0" + n : String(n));
  const mmdd = `${pad(month)}-${pad(day)}`;
  const ymd = `${year}-${mmdd}`;
  const dow = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
  if (dow === 0 || dow === 6) return true; // 일요일(0), 토요일(6)
  if (PAYMENT_KR_FIXED_HOLIDAYS.has(mmdd) || PAYMENT_KR_VARIABLE_HOLIDAYS.has(ymd)) return true;
  // 광복절(8/15)이 주말인 경우 이어지는 월요일(8/16 또는 8/17) 대체공휴일 자동 처리
  if (month === 8 && (day === 16 || day === 17) && dow === 1) {
    const aug15Dow = new Date(Date.UTC(year, 7, 15)).getUTCDay();
    if (aug15Dow === 0 || aug15Dow === 6) return true;
  }
  return false;
}

// 매월 15일(공휴일·주말인 경우 다음 평일) 24:00 마감일 및 익일(기본 16일) 00:00 전환 기준 계산
function getMonthlyPaymentDeadlineInfo(ymStr) {
  const parts = String(ymStr || "").split("-");
  const year = parseInt(parts[0], 10) || new Date().getFullYear();
  const month = parseInt(parts[1], 10) || (new Date().getMonth() + 1);
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const pad = n => (n < 10 ? "0" + n : String(n));

  let deadlineDay = 15;
  while (deadlineDay < lastDay && isWeekendOrKoreanHoliday(year, month, deadlineDay)) {
    deadlineDay++;
  }
  const deadlineDateStr = `${year}-${pad(month)}-${pad(deadlineDay)}`;
  const triggerDay = Math.min(deadlineDay + 1, lastDay);
  const triggerDateStr = `${year}-${pad(month)}-${pad(triggerDay)}`;
  return {
    ym: `${year}-${pad(month)}`,
    year,
    month,
    lastDay,
    deadlineDay,
    deadlineDateStr, // 이 날짜의 24:00까지 결제 확인
    triggerDay,
    triggerDateStr   // 이 날짜의 00:00(기본 16일 00:00)부터 미결제 시 '결제 대기' 등록
  };
}

// 해당 월의 결제 마감 시각(15일 [공휴일·주말 시 다음 평일] 24:00 = 익일 00:00)이 도래했는지 확인
function isPastPaymentDeadlineForMonth(ymStr) {
  const curDateStr = getCurrentKstDateStr();
  const curYm = curDateStr.slice(0, 7);
  if (ymStr < curYm) return true;
  if (ymStr > curYm) return false;
  const info = getMonthlyPaymentDeadlineInfo(ymStr);
  // deadlineDateStr 24:00 경과 여부 === 한국 날짜가 deadlineDateStr 보다 커진 시점(익일 00:00 이상)
  return curDateStr > info.deadlineDateStr;
}

// 가맹점의 이용 상품(plan)을 결제 상품 코드 및 금액 정보로 변환
function getAcademyStandardProductInfo(acad) {
  const rawPlan = String(acad?.plan || "Basic").trim().toUpperCase();
  let code = "BASIC";
  let name = "베이직 (Basic)";
  let price = 88000;
  if (rawPlan === "VIP" || rawPlan === "ROYAL" || rawPlan.includes("로열") || rawPlan.includes("로얄")) {
    code = "ROYAL";
    name = "로열 (Royal)";
    price = 330000;
  } else if (rawPlan === "PREMIUM" || rawPlan.includes("프리미엄")) {
    code = "PREMIUM";
    name = "프리미엄 (Premium)";
    price = 198000;
  } else if (rawPlan === "STANDARD" || rawPlan.includes("스탠다드")) {
    code = "STANDARD";
    name = "스탠다드 (Standard)";
    price = 132000;
  }
  const supply = Math.round(price / 1.1);
  const vat = price - supply;
  return { code, planType: code.toLowerCase(), name, price, supply, vat };
}

// 해당 월(ymStr)에 가맹점이 이미 결제를 완료했거나 대기 건이 존재하는지 확인
function hasAcademyPaymentForMonth(acad, ymStr, payments) {
  const pad = n => (n < 10 ? "0" + n : String(n));
  const parts = String(ymStr || "").split("-");
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const monthStart = `${ymStr}-01`;
  const monthEnd = `${ymStr}-${pad(lastDay)}`;

  return (payments || []).some(p => {
    if (!p || p.isAutoPending) return false;
    const matchAcad = (p.academyId && p.academyId === acad.id) || (p.academyName && p.academyName === acad.name);
    if (!matchAcad) return false;
    if (String(p.productCode || p.planType || "").toUpperCase() === "KAKAO") return false;
    const st = String(p.status || "").toLowerCase();
    if (st !== "paid" && st !== "pending") return false;

    const payYm = String(p.date || p.paidAt || "").slice(0, 7);
    if (payYm === ymStr) return true;

    if (st === "paid") {
      const sDate = String(p.startDate || "").slice(0, 10);
      const eDate = String(p.endDate || "").slice(0, 10);
      if (sDate && eDate && sDate <= monthEnd && eDate >= monthStart) return true;
    }
    return false;
  });
}

// 16일 00:00(15일 공휴일·주말인 경우 다음 평일 익일 00:00) 도래 시 미결제 '승인' 가맹점을 '결제 대기' 항목으로 생성
function getAutoPendingPaymentsForMonth(ymStr, payments) {
  if (!ymStr || !isPastPaymentDeadlineForMonth(ymStr)) return [];
  const info = getMonthlyPaymentDeadlineInfo(ymStr);
  const pad = n => (n < 10 ? "0" + n : String(n));
  const monthEnd = `${ymStr}-${pad(info.lastDay)}`;
  const approvedList = getApprovedFranchiseList();

  const autoPendingRows = [];
  approvedList.forEach(acad => {
    const acadStart = String(acad.startDate || acad.joinDate || "").slice(0, 10);
    if (acadStart && acadStart > monthEnd) return;
    if (hasAcademyPaymentForMonth(acad, ymStr, payments)) return;

    const prod = getAcademyStandardProductInfo(acad);
    const directorName = (typeof getEffectiveFranchiseDirectorName === "function" ? getEffectiveFranchiseDirectorName(acad) : "") || acad.director || "-";
    autoPendingRows.push({
      id: `AUTO-PENDING-${ymStr}-${acad.id}`,
      isAutoPending: true,
      targetMonth: ymStr,
      academyId: acad.id,
      academyName: acad.name,
      director: directorName,
      phone: acad.phone || "",
      bizNumber: acad.bizNumber || "",
      productCode: prod.code,
      planType: prod.planType,
      planName: prod.name,
      supply: prod.supply,
      vat: prod.vat,
      total: prod.price,
      method: "미수납 (결제 대기)",
      date: `${ymStr}-${pad(info.deadlineDay)} 24:00 미납`,
      startDate: `${ymStr}-01`,
      endDate: monthEnd,
      status: "pending",
      memo: `${ymStr}월 정기 결제 미납 자동 등록 (결제 대기)`
    });
  });

  return autoPendingRows;
}

// 결제 항목의 기준 월(YYYY-MM) 추출
function getPaymentItemMonth(item) {
  if (!item) return "";
  if (item.targetMonth) return item.targetMonth;
  return String(item.date || item.paidAt || item.startDate || "").slice(0, 7);
}

// 월별 필터 옵션 채우기
function populateMasterPaymentMonthFilter() {
  const select = document.getElementById("masterPaymentMonthFilter");
  if (!select) return;
  const currentVal = select.value || "ALL";
  const curYm = getCurrentKstDateStr().slice(0, 7);
  const monthSet = new Set([curYm]);

  // 최근 12개월 기본 제공
  const [curY, curM] = curYm.split("-").map(Number);
  for (let i = 0; i < 12; i++) {
    const d = new Date(Date.UTC(curY, curM - 1 - i, 1));
    const ym = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
    monthSet.add(ym);
  }
  // 결제 데이터에 존재하는 월 추가
  (masterPaymentList || []).forEach(p => {
    const ym = getPaymentItemMonth(p);
    if (/^\d{4}-\d{2}$/.test(ym)) monthSet.add(ym);
  });

  const sortedMonths = Array.from(monthSet).sort((a, b) => b.localeCompare(a));
  select.innerHTML = `<option value="ALL">전체 기간 (월별 선택)</option>` +
    sortedMonths.map(ym => {
      const [y, m] = ym.split("-");
      const label = `${y}년 ${parseInt(m, 10)}월${ym === curYm ? " (당월)" : ""}`;
      return `<option value="${ym}">${label}</option>`;
    }).join("");

  select.value = (currentVal === "ALL" || monthSet.has(currentVal)) ? currentVal : "ALL";
}

// 마스터 결제 테이블 렌더링
function renderMasterPaymentTable(data = masterPaymentList) {
  if (window.NanoBilling && window.NanoPortal?.remote) return NanoBilling.renderPayments(data);
  const tbody = document.getElementById("masterPaymentTableBody");
  if (!tbody) return;

  const countEl = document.getElementById("masterPaymentFilteredCount");
  if (countEl) countEl.innerText = data.length;

  if (data.length === 0) {
    tbody.innerHTML = `<tr><td colspan="12" class="text-center py-5 text-muted">일치하는 결제 내역이 없습니다.</td></tr>`;
    return;
  }

  tbody.innerHTML = data.map((item, index) => {
    const isCard = isCardPayment(item.method);
    let statusHtml = "";

    if (item.isAutoPending || item.status === 'pending') {
      statusHtml = `
        <div class="d-flex flex-column align-items-center">
          <span class="badge px-2.5 py-1.5 font-weight-bold" style="background:#fff8e6; color:#b45309; border:1px solid #fcd34d; font-size:11.5px;">
            <i class="fa-solid fa-clock mr-1"></i>결제 대기
          </span>
          <span class="text-muted" style="font-size:10px; margin-top:2px;">(미수납 확인)</span>
        </div>
      `;
    } else if (isCard) {
      if (item.status === 'paid') {
        statusHtml = `
          <div class="d-flex flex-column align-items-center">
            <span class="badge px-2.5 py-1.5 font-weight-bold" style="background:#eaf5ec; color:#1e6b35; border:1px solid #b7dfbe; font-size:11.5px;">
              <i class="fa-solid fa-credit-card mr-1"></i>결제완료
            </span>
            <span class="text-muted" style="font-size:10px; margin-top:2px;">(PG 자동승인)</span>
          </div>
        `;
      } else {
        statusHtml = `
          <div class="d-flex flex-column align-items-center">
            <span class="badge px-2.5 py-1.5 font-weight-bold" style="background:#fdeeee; color:#b71c1c; border:1px solid #f8c1c1; font-size:11.5px;">
              <i class="fa-solid fa-ban mr-1"></i>승인취소
            </span>
            <span class="text-muted" style="font-size:10px; margin-top:2px;">(PG 취소)</span>
          </div>
        `;
      }
    } else {
      statusHtml = `
        <div class="d-flex flex-column align-items-center">
          <select class="select-beige form-control-sm py-0 font-weight-bold text-center" 
            onchange="updatePaymentStatusInline('${item.id}', this.value)" 
            title="수동 결제 건은 관리자가 직접 완료/대기 상태를 조정할 수 있습니다"
            style="height: 28px; font-size: 11.5px; border-radius: 8px; width: 100px; ${
              item.status === 'paid' ? 'color:#2f5436; background:#eaf0eb; border-color:#b7dfbe;' :
              item.status === 'pending' ? 'color:#8c531b; background:#faf3e8; border-color:#fcd34d;' :
              'color:#962a22; background:#fbeae8; border-color:#f8c1c1;'
            }">
            <option value="paid" ${item.status === 'paid' ? 'selected' : ''}>결제완료</option>
            <option value="pending" ${item.status === 'pending' ? 'selected' : ''}>결제대기</option>
            <option value="cancelled" ${item.status === 'cancelled' ? 'selected' : ''}>결제취소</option>
            <option value="refunded" ${item.status === 'refunded' ? 'selected' : ''}>환불완료</option>
          </select>
        </div>
      `;
    }

    const methodBadge = item.isAutoPending
      ? `<span class="badge badge-light border text-warning" style="font-size: 11px; color: #b45309 !important;"><i class="fa-solid fa-hourglass-half mr-1"></i>${item.method}</span>`
      : isCard
        ? `<span class="badge badge-light border text-primary" style="font-size: 11px;"><i class="fa-solid fa-credit-card mr-1"></i>${item.method}</span>`
        : `<span class="badge badge-light border text-dark" style="font-size: 11px;"><i class="fa-solid fa-money-bill-wave text-success mr-1"></i>${item.method}</span>`;

    const actionHtml = (item.isAutoPending || item.status === 'pending')
      ? `<button type="button" class="btn btn-xs btn-beige-primary font-weight-bold" onclick="openSimulateNewPaymentModal('${item.academyId}')" style="border-radius: 8px; font-size: 11.5px; padding: 4px 10px; white-space: nowrap;">
          <i class="fa-solid fa-plus mr-1"></i>결제 등록
        </button>`
      : `<button class="btn btn-xs btn-outline-secondary" onclick="openMasterPaymentDetailModal('${item.id}')" style="border-radius: 6px; font-size: 11px; padding: 4px 8px; white-space: nowrap;">
          <i class="fa-solid fa-pen-to-square mr-1"></i>상세/메모
        </button>`;

    return `
      <tr style="font-size: 13px;">
        <td class="text-center font-weight-bold text-muted" style="font-size: 11.5px; white-space: nowrap;">${index + 1}</td>
        <td style="white-space: nowrap;">
          <div class="font-weight-bold" style="color: var(--text-main); font-size: 13.5px;">${item.academyName}</div>
        </td>
        <td class="text-center">${item.director}</td>
        <td class="text-center" style="white-space: nowrap;">
          <span class="badge-soft badge-soft-neutral font-weight-bold">${item.planName}</span>
        </td>
        <td class="text-right" style="white-space: nowrap;">${item.supply.toLocaleString()}원</td>
        <td class="text-right text-muted" style="white-space: nowrap;">${item.vat.toLocaleString()}원</td>
        <td class="text-right font-weight-bold" style="color: #962a22; font-size: 14px; white-space: nowrap;">${item.total.toLocaleString()}원</td>
        <td class="text-center" style="white-space: nowrap;">${methodBadge}</td>
        <td class="text-center" style="white-space: nowrap;"><small class="text-muted">${item.date}</small></td>
        <td class="text-center" style="white-space: nowrap;"><small class="badge badge-light border" style="white-space: nowrap;">${item.startDate} ~ ${item.endDate}</small></td>
        <td class="text-center" style="white-space: nowrap;">${statusHtml}</td>
        <td class="text-center" style="white-space: nowrap;">${actionHtml}</td>
      </tr>
    `;
  }).join("");
}

// 가맹 학원 필터 옵션 채우기 ('승인' 상태인 가맹점만 검색/표시)
function populateMasterPaymentAcademyFilter() {
  populateMasterPaymentMonthFilter();
  const select = document.getElementById("masterPaymentAcademyFilter");
  if (!select) return;

  const currentVal = select.value;
  const approvedFranchises = getApprovedFranchiseList();
  const academies = [...new Set(approvedFranchises.map(p => p.name))];

  select.innerHTML = `<option value="ALL">전체 승인 가맹 학원 (${academies.length}곳)</option>` + 
    academies.map(name => {
      const count = (masterPaymentList || []).filter(p => p.academyName === name && String(p.status || '').toLowerCase() === 'paid').length;
      return `<option value="${name}">${name}${count > 0 ? ` (결제 ${count}건)` : ''}</option>`;
    }).join("");

  select.value = academies.includes(currentVal) ? currentVal : 'ALL';
  const products = document.getElementById('masterPaymentPlanFilter');
  if (products && typeof PLAN_MONTHLY_FEES !== 'undefined' && (!window.NanoPortal || !NanoPortal.remote)) {
    const selected = products.value;
    products.innerHTML = '<option value="ALL">전체 상품명</option>' + Object.keys(PLAN_MONTHLY_FEES).map(name =>
      `<option value="${name.toLowerCase()}">${name}</option>`).join('');
    products.value = Array.from(products.options).some(option => option.value === selected) ? selected : 'ALL';
  }
}

// 필터링 적용 및 상단 3개 KPI 카드 실시간 동기화
function filterMasterPaymentList() {
  const monthFilter = document.getElementById("masterPaymentMonthFilter") ? document.getElementById("masterPaymentMonthFilter").value : "ALL";
  const acadFilter = document.getElementById("masterPaymentAcademyFilter") ? document.getElementById("masterPaymentAcademyFilter").value : "ALL";
  const planFilter = document.getElementById("masterPaymentPlanFilter") ? document.getElementById("masterPaymentPlanFilter").value : "ALL";
  const statusFilter = document.getElementById("masterPaymentStatusFilter") ? document.getElementById("masterPaymentStatusFilter").value : "ALL";
  const keyword = document.getElementById("masterPaymentSearchInput") ? document.getElementById("masterPaymentSearchInput").value.trim().toLowerCase() : "";

  const curYm = getCurrentKstDateStr().slice(0, 7);
  const targetYmForPending = monthFilter !== "ALL" ? monthFilter : curYm;

  // 1) '승인' 상태 가맹점의 결제 내역만 추출
  const approvedRealPayments = (masterPaymentList || []).filter(isApprovedPaymentItem);
  // 2) 해당 월의 15일(주말·공휴일 시 다음 평일) 24:00 경과 시 미결제 승인 가맹점을 '결제 대기'로 자동 결합
  const autoPendingPayments = getAutoPendingPaymentsForMonth(targetYmForPending, approvedRealPayments);
  const combinedList = [...approvedRealPayments, ...autoPendingPayments];

  const filtered = combinedList.filter(item => {
    if (monthFilter !== "ALL" && getPaymentItemMonth(item) !== monthFilter) return false;
    if (acadFilter !== "ALL" && item.academyName !== acadFilter) return false;
    if (planFilter !== "ALL" && (item.planType === 'vip' ? 'royal' : item.planType) !== planFilter) return false;
    if (statusFilter !== "ALL" && item.status !== statusFilter) return false;

    if (keyword) {
      const matchId = String(item.id || "").toLowerCase().includes(keyword);
      const matchAcad = String(item.academyName || "").toLowerCase().includes(keyword);
      const matchDir = String(item.director || "").toLowerCase().includes(keyword);
      const matchPhone = String(item.phone || "").includes(keyword);
      if (!matchId && !matchAcad && !matchDir && !matchPhone) return false;
    }
    return true;
  });

  updatePaymentKpis(monthFilter, approvedRealPayments, autoPendingPayments);
  renderMasterPaymentTable(filtered);
}

// 필터 초기화
function resetMasterPaymentFilters() {
  if (document.getElementById("masterPaymentMonthFilter")) document.getElementById("masterPaymentMonthFilter").value = "ALL";
  if (document.getElementById("masterPaymentAcademyFilter")) document.getElementById("masterPaymentAcademyFilter").value = "ALL";
  if (document.getElementById("masterPaymentPlanFilter")) document.getElementById("masterPaymentPlanFilter").value = "ALL";
  if (document.getElementById("masterPaymentStatusFilter")) document.getElementById("masterPaymentStatusFilter").value = "ALL";
  if (document.getElementById("masterPaymentSearchInput")) document.getElementById("masterPaymentSearchInput").value = "";

  filterMasterPaymentList();
  showMasterToast("결제 검색 필터가 초기화되었습니다.");
}

// 통계 KPI 업데이트 (상단 3개 카드: 당월 총 결제 수납액, 정상 결제 완료, 결제 대기(미수납))
function updatePaymentKpis(monthFilterOverride, approvedRealOverride, autoPendingOverride) {
  if (typeof syncFranchiseAutoUnapprove === 'function') {
    syncFranchiseAutoUnapprove(masterPaymentList);
    if (typeof renderFranchiseTable === 'function') renderFranchiseTable(franchiseList, true);
    if (typeof updateFranchiseStats === 'function') updateFranchiseStats();
  }

  const monthFilter = monthFilterOverride || (document.getElementById("masterPaymentMonthFilter")?.value || "ALL");
  const curYm = getCurrentKstDateStr().slice(0, 7);
  const targetYm = monthFilter !== "ALL" ? monthFilter : curYm;

  const approvedReal = Array.isArray(approvedRealOverride)
    ? approvedRealOverride
    : (masterPaymentList || []).filter(isApprovedPaymentItem);
  const autoPending = Array.isArray(autoPendingOverride)
    ? autoPendingOverride
    : getAutoPendingPaymentsForMonth(targetYm, approvedReal);

  const monthScopedReal = monthFilter !== "ALL"
    ? approvedReal.filter(p => getPaymentItemMonth(p) === monthFilter)
    : approvedReal;

  const monthPaidItems = approvedReal.filter(p => String(p.status || '').toLowerCase() === 'paid' && getPaymentItemMonth(p) === targetYm);
  const paidItems = monthScopedReal.filter(p => String(p.status || '').toLowerCase() === 'paid');
  const pendingItems = [
    ...monthScopedReal.filter(p => String(p.status || '').toLowerCase() === 'pending'),
    ...autoPending
  ];

  const monthRevenue = monthPaidItems.reduce((acc, cur) => acc + (Number(cur.total) || 0), 0);
  const pendingAmount = pendingItems.reduce((acc, cur) => acc + (Number(cur.total) || 0), 0);

  const revEl = document.getElementById("kpiMonthTotalRevenue");
  if (revEl) revEl.innerHTML = `${monthRevenue.toLocaleString()}<span style="font-size: 14px; font-weight: 600; margin-left: 2px;">원</span>`;
  const revSubEl = document.getElementById("kpiMonthTotalRevenueSub");
  if (revSubEl) {
    const [y, m] = targetYm.split("-");
    revSubEl.innerText = `${y}년 ${parseInt(m, 10)}월 입금 완료 금액 (${monthPaidItems.length}건)`;
  }

  const paidCountEl = document.getElementById("kpiPaidCount");
  if (paidCountEl) paidCountEl.innerHTML = `${paidItems.length}<span style="font-size: 14px; font-weight: 600; margin-left: 2px;">건</span>`;
  const paidSubEl = document.getElementById("kpiPaidCountSub");
  if (paidSubEl) paidSubEl.innerText = monthFilter !== "ALL" ? `선택 월 결제 완료 내역` : `승인 가맹점 결제 완료 내역`;

  const pendingCountEl = document.getElementById("kpiPendingCount");
  if (pendingCountEl) pendingCountEl.innerHTML = `${pendingItems.length}<span style="font-size: 14px; font-weight: 600; margin-left: 2px;">건</span>`;
  const pendingSubEl = document.getElementById("kpiPendingCountSub");
  if (pendingSubEl) pendingSubEl.innerText = `${pendingAmount.toLocaleString()}원 입금 확인 대기`;
}

// 인라인 상태 변경 핸들러 (수동 결제 건만 변경 가능)
function updatePaymentStatusInline(payId, newStatus) {
  const item = masterPaymentList.find(p => p.id === payId);
  if (!item) return;
  if (window.NanoPortal && NanoPortal.remote) { showMasterToast('운영 결제 상태는 결제사 및 입금 확인 결과로만 변경됩니다.'); renderMasterPaymentTable(); return; }

  if (isCardPayment(item.method)) {
    showMasterToast("신용카드 결제 건은 PG사 전산 자동 승인 데이터이므로 수동 변경이 불가합니다.");
    renderMasterPaymentTable();
    return;
  }

  item.status = newStatus;
  updatePaymentKpis();
  renderMasterPaymentTable();

  const statusKor = newStatus === 'paid' ? '결제 완료' :
                    newStatus === 'pending' ? '입금 대기' :
                    newStatus === 'cancelled' ? '결제 취소' : '환불 완료';

  showMasterToast(`[${item.academyName}] 수동 수납건(${payId}) 상태가 '${statusKor}'(으)로 조정되었습니다.`);
}

// 결제 상세 모달 열기
function openMasterPaymentDetailModal(payId) {
  const item = masterPaymentList.find(p => p.id === payId);
  if (!item) return;

  document.getElementById("modalDetailPayId").value = item.id;
  document.getElementById("modalDetailPayIdText").innerText = item.id;
  document.getElementById("modalDetailAcademyNameBadge").innerText = item.academyName;
  document.getElementById("modalDetailDirectorText").innerText = `${item.director} (${item.phone})`;
  document.getElementById("modalDetailPlanName").innerText = item.planName;
  document.getElementById("modalDetailSupply").innerText = item.supply.toLocaleString() + "원";
  document.getElementById("modalDetailVat").innerText = item.vat.toLocaleString() + "원";
  document.getElementById("modalDetailTotal").innerText = item.total.toLocaleString() + "원";
  document.getElementById("modalDetailMethod").innerText = item.method;
  document.getElementById("modalDetailDate").innerText = item.date;
  document.getElementById("modalDetailPeriod").innerText = `${item.startDate} ~ ${item.endDate}`;
  document.getElementById("modalDetailStatusSelect").value = item.status;
  document.getElementById("modalDetailAdminMemo").value = item.memo || "";

  const isCard = isCardPayment(item.method);
  const cardNotice = document.getElementById("modalDetailCardAutoNotice");
  const statusSelect = document.getElementById("modalDetailStatusSelect");
  const statusBadge = document.getElementById("modalDetailStatusBadge");
  const statusHelp = document.getElementById("modalDetailStatusHelp");

  if (isCard) {
    if (cardNotice) cardNotice.style.display = "block";
    if (statusSelect) statusSelect.disabled = true;
    if (statusBadge) {
      statusBadge.innerText = "카드 자동승인 (고정)";
      statusBadge.className = "badge badge-success text-white";
    }
    if (statusHelp) statusHelp.innerText = "* 신용카드 결제는 PG 자동 승인 건으로 상태 임의 조작이 제한됩니다.";
  } else {
    if (cardNotice) cardNotice.style.display = "none";
    if (statusSelect) statusSelect.disabled = false;
    if (statusBadge) {
      statusBadge.innerText = "수동 조정 가능";
      statusBadge.className = "badge badge-warning text-white";
    }
    if (statusHelp) statusHelp.innerText = "* 관리자가 무통장/현금 입금 확인 여부에 따라 실시간 상태를 변경할 수 있습니다.";
  }

  $("#masterPaymentDetailModal").modal("show");
}

// 상세 모달에서 상태 및 관리자 메모 저장
function saveMasterPaymentDetail() {
  const payId = document.getElementById("modalDetailPayId").value;
  const item = masterPaymentList.find(p => p.id === payId);
  if (!item) return;
  if (window.NanoPortal && NanoPortal.remote) { showMasterToast('운영 결제 내역은 서버 원장 데이터이며 이 화면에서 임의 변경할 수 없습니다.'); return; }

  const isCard = isCardPayment(item.method);
  if (!isCard) {
    const newStatus = document.getElementById("modalDetailStatusSelect").value;
    item.status = newStatus;
  }
  
  const newMemo = document.getElementById("modalDetailAdminMemo").value;
  item.memo = newMemo;

  updatePaymentKpis();
  renderMasterPaymentTable();

  $("#masterPaymentDetailModal").modal("hide");
  showMasterToast(`[${item.academyName}] 결제 정보 및 관리자 메모가 저장되었습니다.`);
}

// ========================================================
// 수동 결제 등록 모달 (현금/무통장입금 등 수동 수납 건 영구 누적 등록)
// ========================================================

const PLAN_PRICE_TABLE = {
  "1month": { name: "1개월 정기구독권", supply: 100000, vat: 10000, total: 110000, months: 1 },
  "6month": { name: "6개월 이용권 (10% 할인)", supply: 540000, vat: 54000, total: 594000, months: 6 },
  "12month": { name: "12개월 연간권 (20% 할인)", supply: 960000, vat: 96000, total: 1056000, months: 12 }
};

// 수동 결제 등록 모달 열기 (특정 가맹 학원 ID 전달 시 해당 가맹점 자동 선택)
function openSimulateNewPaymentModal(preselectedAcademyId) {
  if (window.NanoBilling) return NanoBilling.edit(null, preselectedAcademyId);
  if (window.NanoPortal && NanoPortal.remote) { showMasterToast('운영 결제 시뮬레이션은 비활성화되어 있습니다.'); return; }
  const select = document.getElementById("manualPayAcademy");
  if (select && Array.isArray(franchiseList)) {
    const approvedList = typeof getApprovedFranchiseList === "function" ? getApprovedFranchiseList() : franchiseList;
    select.innerHTML = approvedList.map(f => {
      return `<option value="${f.id}" data-name="${f.name}" data-director="${f.director}" data-phone="${f.phone}" data-biz="${f.bizNumber}" data-end="${f.endDate}">
        ${f.name} (${f.director}) - 기존 만료일: ${f.endDate || '미정'}
      </option>`;
    }).join("");
    if (preselectedAcademyId) select.value = preselectedAcademyId;
  }

  // 초기 날짜 및 금액 설정
  onManualPayAcademyChanged(select ? select.value : "");
  onManualPayPlanChanged(document.getElementById("manualPayPlan") ? document.getElementById("manualPayPlan").value : "6month");

  $("#manualPaymentRegisterModal").modal("show");
}

// 가맹 학원 변경 시 시작일 설정 (기존 만료일이 있으면 만료일 다음날, 없으면 오늘)
function onManualPayAcademyChanged(acadId) {
  const acad = franchiseList.find(f => f.id === acadId) || franchiseList[0];
  const startInput = document.getElementById("manualPayStartDate");
  if (!startInput) return;

  const now = new Date();
  const pad = n => n < 10 ? '0' + n : n;
  const todayStr = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}`;

  if (acad && acad.endDate && acad.endDate >= todayStr) {
    // 기존 계약 만료일 다음 날로 자동 설정
    const prevEnd = new Date(acad.endDate);
    prevEnd.setDate(prevEnd.getDate() + 1);
    startInput.value = `${prevEnd.getFullYear()}-${pad(prevEnd.getMonth()+1)}-${pad(prevEnd.getDate())}`;
  } else {
    startInput.value = todayStr;
  }

  calcManualPayEndDate();
}

// 요금제 변경 시 금액 및 만료일 계산
function onManualPayPlanChanged(planKey) {
  const info = PLAN_PRICE_TABLE[planKey] || PLAN_PRICE_TABLE["6month"];
  const supplyEl = document.getElementById("manualPaySupplyText");
  const vatEl = document.getElementById("manualPayVatText");
  const totalEl = document.getElementById("manualPayTotalText");

  if (supplyEl) supplyEl.innerText = `${info.supply.toLocaleString()}원`;
  if (vatEl) vatEl.innerText = `${info.vat.toLocaleString()}원`;
  if (totalEl) totalEl.innerText = `${info.total.toLocaleString()}원`;

  calcManualPayEndDate();
}

// 시작일 + 요금제 기간 -> 만료일 자동 계산
function calcManualPayEndDate() {
  const startVal = document.getElementById("manualPayStartDate") ? document.getElementById("manualPayStartDate").value : "";
  const planKey = document.getElementById("manualPayPlan") ? document.getElementById("manualPayPlan").value : "6month";
  const endInput = document.getElementById("manualPayEndDate");
  if (!startVal || !endInput) return;

  const info = PLAN_PRICE_TABLE[planKey] || PLAN_PRICE_TABLE["6month"];
  const startDate = new Date(startVal);
  startDate.setMonth(startDate.getMonth() + info.months);
  startDate.setDate(startDate.getDate() - 1); // 1일 전까지

  const pad = n => n < 10 ? '0' + n : n;
  endInput.value = `${startDate.getFullYear()}-${pad(startDate.getMonth()+1)}-${pad(startDate.getDate())}`;
}

// 수동 결제 폼 제출 처리 (기존 결제 히스토리 위에 영구 누적 저장)
function handleManualPaymentSubmit(e) {
  if (e) e.preventDefault();
  if (window.NanoPortal && NanoPortal.remote) { showMasterToast('운영 수동 결제 등록은 실제 입금 확인 절차가 연결된 뒤 사용할 수 있습니다.'); return; }

  const acadSelect = document.getElementById("manualPayAcademy");
  const acadId = acadSelect.value;
  const selectedOption = acadSelect.options[acadSelect.selectedIndex];
  const acadName = selectedOption.getAttribute("data-name") || "가맹 학원";
  const director = selectedOption.getAttribute("data-director") || "원장";
  const phone = selectedOption.getAttribute("data-phone") || "";
  const bizNumber = selectedOption.getAttribute("data-biz") || "";

  const planKey = document.getElementById("manualPayPlan").value;
  const planInfo = PLAN_PRICE_TABLE[planKey] || PLAN_PRICE_TABLE["6month"];
  const method = document.getElementById("manualPayMethod").value;
  const startDate = document.getElementById("manualPayStartDate").value;
  const endDate = document.getElementById("manualPayEndDate").value;
  const status = document.getElementById("manualPayStatus").value;
  const memo = document.getElementById("manualPayMemo").value;

  const now = new Date();
  const pad = n => n < 10 ? '0' + n : n;
  const dateStr = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
  const payId = `PAY-${now.getFullYear()}${pad(now.getMonth()+1)}${pad(now.getDate())}-${Math.floor(100 + Math.random()*900)}`;

  const newPayment = {
    id: payId,
    academyId: acadId,
    academyName: acadName,
    director: director,
    phone: phone,
    bizNumber: bizNumber,
    planType: planKey,
    planName: planInfo.name,
    supply: planInfo.supply,
    vat: planInfo.vat,
    total: planInfo.total,
    method: method,
    date: dateStr,
    startDate: startDate,
    endDate: endDate,
    status: status, // 관리자가 지정한 상태 (대기 또는 완료)
    memo: memo || "관리자 수동 결제 등록 건."
  };

  // 기존 결제 내역 상단에 누적 추가 (기존 히스토리는 절대 사라지지 않음)
  masterPaymentList.unshift(newPayment);

  // 만약 결제 완료 상태라면 가맹점 만료일도 갱신
  if (status === "paid") {
    const acad = franchiseList.find(f => f.id === acadId);
    if (acad) acad.endDate = endDate;
  }

  populateMasterPaymentAcademyFilter();
  filterMasterPaymentList();
  updatePaymentKpis();

  $("#manualPaymentRegisterModal").modal("hide");
  showMasterToast(`[${acadName}] 수동 결제건(${payId})이 등록되었습니다. 수동 결제 건은 관리자가 언제든 상태를 [완료/대기]로 조정할 수 있습니다.`);
}

// 엑셀 다운로드 안내
function exportPaymentData() {
  const today = new Date().toISOString().split("T")[0];
  const listToExport = (typeof masterPaymentList !== "undefined" && Array.isArray(masterPaymentList)) ? masterPaymentList : [];
  if (listToExport.length === 0) {
    showMasterToast("다운로드할 결제 내역 데이터가 없습니다.");
    return;
  }
  const headers = ["결제ID", "학원명", "원장명", "구독상품", "결제금액", "결제일시", "이용기간(만료일)", "결제수단", "결제상태", "메모"];
  const rows = listToExport.map(p => [
    p.id || "",
    p.academyName || "",
    p.director || "",
    p.plan || "",
    p.amount || "",
    p.date || "",
    p.expiryDate || "",
    p.method || "자동계좌이체",
    p.status === "COMPLETED" ? "결제완료" : p.status === "PENDING" ? "결제대기" : (p.status || ""),
    p.memo || ""
  ]);
  downloadAsCSV(`결제 내역 명단 (${today}).csv`, headers, rows);
  showMasterToast(`결제 내역 명단(총 ${rows.length}건)이 CSV 파일로 다운로드되었습니다.`);
}

// ============================================================
