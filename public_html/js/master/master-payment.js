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

// 마스터 결제 테이블 렌더링
function renderMasterPaymentTable(data = masterPaymentList) {
  const tbody = document.getElementById("masterPaymentTableBody");
  if (!tbody) return;

  const countEl = document.getElementById("masterPaymentFilteredCount");
  if (countEl) countEl.innerText = data.length;

  if (data.length === 0) {
    tbody.innerHTML = `<tr><td colspan="11" class="text-center py-5 text-muted">일치하는 결제 내역이 없습니다.</td></tr>`;
    return;
  }

  tbody.innerHTML = data.map(item => {
    const isCard = isCardPayment(item.method);
    let statusHtml = "";

    // 1) 신용카드 결제: PG 자동 승인 (관리자가 선택하지 않고 자동 표기)
    if (isCard) {
      if (item.status === 'paid') {
        statusHtml = `
          <div class="d-flex flex-column align-items-center">
            <span class="badge px-2.5 py-1.5 font-weight-bold" style="background:#eaf5ec; color:#1e6b35; border:1px solid #b7dfbe; font-size:11.5px;">
              <i class="fa-solid fa-credit-card mr-1"></i>결제완료
            </span>
            <span class="text-muted" style="font-size:10px; margin-top:2px;">(PG 자동승인)</span>
          </div>
        `;
      } else if (item.status === 'cancelled' || item.status === 'refunded') {
        statusHtml = `
          <div class="d-flex flex-column align-items-center">
            <span class="badge px-2.5 py-1.5 font-weight-bold" style="background:#fdeeee; color:#b71c1c; border:1px solid #f8c1c1; font-size:11.5px;">
              <i class="fa-solid fa-ban mr-1"></i>승인취소
            </span>
            <span class="text-muted" style="font-size:10px; margin-top:2px;">(PG 취소)</span>
          </div>
        `;
      } else {
        statusHtml = `
          <div class="d-flex flex-column align-items-center">
            <span class="badge px-2.5 py-1.5 font-weight-bold" style="background:#fff8e6; color:#b45309; border:1px solid #fcd34d; font-size:11.5px;">
              <i class="fa-solid fa-clock mr-1"></i>승인대기
            </span>
            <span class="text-muted" style="font-size:10px; margin-top:2px;">(PG 전산)</span>
          </div>
        `;
      }
    } 
    // 2) 수동 결제 (현금, 무통장입금 등): 관리자가 직접 상태 조정 가능
    else {
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
            <option value="pending" ${item.status === 'pending' ? 'selected' : ''}>입금대기</option>
            <option value="cancelled" ${item.status === 'cancelled' ? 'selected' : ''}>결제취소</option>
            <option value="refunded" ${item.status === 'refunded' ? 'selected' : ''}>환불완료</option>
          </select>
          <span style="font-size: 10px; color: #d97706; font-weight: 600; margin-top: 2px;">
            <i class="fa-solid fa-hand-holding-dollar mr-0.5"></i>수동 조정 가능
          </span>
        </div>
      `;
    }

    // 결제 수단 아이콘 및 뱃지
    const methodBadge = isCard
      ? `<span class="badge badge-light border text-primary" style="font-size: 11px;"><i class="fa-solid fa-credit-card mr-1"></i>${item.method}</span>`
      : `<span class="badge badge-light border text-dark" style="font-size: 11px;"><i class="fa-solid fa-money-bill-wave text-success mr-1"></i>${item.method}</span>`;

    return `
      <tr style="font-size: 13px;">
        <td class="text-center font-weight-bold text-muted" style="font-size: 11.5px; white-space: nowrap;">${item.id}</td>
        <td style="white-space: nowrap;">
          <div class="font-weight-bold" style="color: var(--text-main); font-size: 13.5px;">${item.academyName}</div>
          <small class="text-muted"><i class="fa-solid fa-user-tie mr-1"></i>${item.director} (${item.phone})</small>
        </td>
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
        <td class="text-center" style="white-space: nowrap;">
          <button class="btn btn-xs btn-outline-secondary" onclick="openMasterPaymentDetailModal('${item.id}')" style="border-radius: 6px; font-size: 11px; padding: 4px 8px; white-space: nowrap;">
            <i class="fa-solid fa-pen-to-square mr-1"></i>상세/메모
          </button>
        </td>
      </tr>
    `;
  }).join("");
}

// 가맹 학원 필터 옵션 채우기 (동일 학원 선택 시 누적 내역 확인 가능)
function populateMasterPaymentAcademyFilter() {
  const select = document.getElementById("masterPaymentAcademyFilter");
  if (!select) return;

  const currentVal = select.value;
  const academies = [...new Set(masterPaymentList.map(p => p.academyName))];

  select.innerHTML = `<option value="ALL">전체 가맹 학원 (${academies.length}곳)</option>` + 
    academies.map(name => {
      const count = masterPaymentList.filter(p => p.academyName === name).length;
      return `<option value="${name}">${name} (누적 ${count}건)</option>`;
    }).join("");

  select.value = currentVal;
}

// 필터링 적용
function filterMasterPaymentList() {
  const acadFilter = document.getElementById("masterPaymentAcademyFilter") ? document.getElementById("masterPaymentAcademyFilter").value : "ALL";
  const planFilter = document.getElementById("masterPaymentPlanFilter") ? document.getElementById("masterPaymentPlanFilter").value : "ALL";
  const statusFilter = document.getElementById("masterPaymentStatusFilter") ? document.getElementById("masterPaymentStatusFilter").value : "ALL";
  const keyword = document.getElementById("masterPaymentSearchInput") ? document.getElementById("masterPaymentSearchInput").value.trim().toLowerCase() : "";

  let filtered = masterPaymentList.filter(item => {
    if (acadFilter !== "ALL" && item.academyName !== acadFilter) return false;
    if (planFilter !== "ALL" && item.planType !== planFilter) return false;
    if (statusFilter !== "ALL" && item.status !== statusFilter) return false;

    if (keyword) {
      const matchId = item.id.toLowerCase().includes(keyword);
      const matchAcad = item.academyName.toLowerCase().includes(keyword);
      const matchDir = item.director.toLowerCase().includes(keyword);
      const matchPhone = item.phone.includes(keyword);
      if (!matchId && !matchAcad && !matchDir && !matchPhone) return false;
    }
    return true;
  });

  renderMasterPaymentTable(filtered);
}

// 필터 초기화
function resetMasterPaymentFilters() {
  if (document.getElementById("masterPaymentAcademyFilter")) document.getElementById("masterPaymentAcademyFilter").value = "ALL";
  if (document.getElementById("masterPaymentPlanFilter")) document.getElementById("masterPaymentPlanFilter").value = "ALL";
  if (document.getElementById("masterPaymentStatusFilter")) document.getElementById("masterPaymentStatusFilter").value = "ALL";
  if (document.getElementById("masterPaymentSearchInput")) document.getElementById("masterPaymentSearchInput").value = "";

  renderMasterPaymentTable(masterPaymentList);
  showMasterToast("결제 검색 필터가 초기화되었습니다.");
}

// 통계 KPI 업데이트
function updatePaymentKpis() {
  const paidItems = masterPaymentList.filter(p => p.status === 'paid');
  const pendingItems = masterPaymentList.filter(p => p.status === 'pending');

  const totalRevenue = paidItems.reduce((acc, cur) => acc + (Number(cur.total) || 0), 0);
  const pendingAmount = pendingItems.reduce((acc, cur) => acc + (Number(cur.total) || 0), 0);
  const monthlyPaidCount = paidItems.filter(p => String(p.planType || p.planName || '').toLowerCase().includes('month') && !String(p.planType || p.planName || '').includes('6') && !String(p.planType || p.planName || '').includes('12')).length;
  const longTermPaidCount = paidItems.length - monthlyPaidCount;

  const revEl = document.getElementById("kpiMonthTotalRevenue");
  if (revEl) revEl.innerHTML = `${totalRevenue.toLocaleString()}<span style="font-size: 16px; font-weight: normal; margin-left: 2px;">원</span>`;
  const revSubEl = document.getElementById("kpiMonthTotalRevenueSub");
  if (revSubEl) revSubEl.innerHTML = `<i class="fa-solid fa-arrow-trend-up mr-1"></i>정상 결제 ${paidItems.length}건 수납 합계`;

  const paidCountEl = document.getElementById("kpiPaidCount");
  if (paidCountEl) paidCountEl.innerHTML = `${paidItems.length}<span style="font-size: 16px; font-weight: normal; margin-left: 2px;">건</span>`;
  const paidSubEl = document.getElementById("kpiPaidCountSub");
  if (paidSubEl) paidSubEl.innerText = `정기구독 ${monthlyPaidCount}건 / 장기할인 ${longTermPaidCount}건`;

  const pendingCountEl = document.getElementById("kpiPendingCount");
  if (pendingCountEl) pendingCountEl.innerHTML = `${pendingItems.length}<span style="font-size: 16px; font-weight: normal; margin-left: 2px;">건</span>`;
  const pendingSubEl = document.getElementById("kpiPendingCountSub");
  if (pendingSubEl) pendingSubEl.innerText = `${pendingAmount.toLocaleString()}원 수동 확인 대기`;

  const todayStr = new Date().toISOString().split("T")[0];
  const limitStr = new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0];
  const expiringCount = (typeof franchiseList !== "undefined" && Array.isArray(franchiseList))
    ? franchiseList.filter(a => a.status !== "TERMINATED" && a.endDate && a.endDate >= todayStr && a.endDate <= limitStr).length
    : 0;
  const expEl = document.getElementById("kpiExpiringCount");
  if (expEl) expEl.innerHTML = `${expiringCount}<span style="font-size: 16px; font-weight: normal; margin-left: 2px;">곳</span>`;
  const expSubEl = document.getElementById("kpiExpiringCountSub");
  if (expSubEl) expSubEl.innerText = expiringCount > 0 ? `30일 이내 만료 예정 학원 ${expiringCount}곳` : `현재 만료 임박 학원 없음`;
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

// 수동 결제 등록 모달 열기
function openSimulateNewPaymentModal() {
  if (window.NanoPortal && NanoPortal.remote) { showMasterToast('운영 결제 시뮬레이션은 비활성화되어 있습니다.'); return; }
  const select = document.getElementById("manualPayAcademy");
  if (select && Array.isArray(franchiseList)) {
    select.innerHTML = franchiseList.map(f => {
      return `<option value="${f.id}" data-name="${f.name}" data-director="${f.director}" data-phone="${f.phone}" data-biz="${f.bizNumber}" data-end="${f.endDate}">
        ${f.name} (${f.director}) - 기존 만료일: ${f.endDate || '미정'}
      </option>`;
    }).join("");
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