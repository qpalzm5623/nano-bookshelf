/* 본사·학원 공통 결제/충전 화면. 금액과 권한은 서버에서 다시 검증합니다. */
(function (global) {
  'use strict';
  const DEFAULT_PRODUCTS = [
    { code: 'BASIC', name: '베이직 (Basic)', price: 88000, slots: 25 },
    { code: 'STANDARD', name: '스탠다드 (Standard)', price: 132000, slots: 50 },
    { code: 'PREMIUM', name: '프리미엄 (Premium)', price: 198000, slots: 100 },
    { code: 'ROYAL', name: '로열 (Royal)', price: 330000, slots: 0 },
    { code: 'KAKAO', name: '카카오톡 알림', price: 5500, slots: 0 }
  ];
  const state = { products: DEFAULT_PRODUCTS.slice(), payments: [], busy: false, dispatchBusy: false, dispatchAt: 0 };
  const esc = value => String(value == null ? '' : value).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
  const money = value => Number(value || 0).toLocaleString('ko-KR', { maximumFractionDigits: 1 });
  const master = () => !!document.getElementById('tab-master-payment');
  const toast = message => master() ? showMasterToast(message) : showAcademyToast(message);
  const text = (id, value) => { const el = document.getElementById(id); if (el) el.textContent = value; };
  // 상단 요약 카드(카톡 발송 내역·결제 내역 관리)의 숫자+단위 폰트 규격을 동일하게 렌더링하는 헬퍼
  const numUnit = (id, value, unit) => {
    const el = document.getElementById(id);
    if (el) el.innerHTML = `${esc(value)}<span style="font-size: 14px; font-weight: 600; margin-left: 2px;">${esc(unit)}</span>`;
  };
  const api = (path, data) => {
    if (!global.NanoPortal || !NanoPortal.remote) return Promise.reject(new Error('운영 서버에 로그인한 뒤 이용해 주세요.'));
    return NanoPortal.api(path, data, 45000);
  };
  const today = () => new Date(Date.now() + 9 * 3600000).toISOString().slice(0,10);
  const statuses = { SUCCESS:'성공', FAILED:'실패', ACCEPTED:'전송 중', SENDING:'접수 중', UNKNOWN:'결과 확인 중', SMS_FALLBACK:'문자 대체 발송' };
  const methods = { CARD:'신용카드', TRANSFER:'현금/계좌이체', CASH:'현금/계좌이체', OTHER:'기타' };
  // 가맹점의 이용 상품(plan)을 결제 상품 코드(BASIC/STANDARD/PREMIUM/ROYAL)로 매핑
  const mapAcademyPlanToProductCode = plan => {
    const p = String(plan || '').trim().toUpperCase();
    if (p === 'VIP' || p === 'ROYAL' || p.includes('로열') || p.includes('로얄')) return 'ROYAL';
    if (p === 'PREMIUM' || p.includes('프리미엄')) return 'PREMIUM';
    if (p === 'STANDARD' || p.includes('스탠다드')) return 'STANDARD';
    return 'BASIC';
  };

  async function load() {
    if (state.busy) return;
    state.busy = true;
    try {
      const data = await api('/api/billing');
      state.products = (Array.isArray(data.products) && data.products.length) ? data.products : DEFAULT_PRODUCTS.slice();
      state.payments = data.items || [];
      if (master()) {
        masterPaymentList = state.payments;
        if (typeof syncFranchiseAutoUnapprove === 'function') {
          syncFranchiseAutoUnapprove(masterPaymentList);
          if (typeof renderFranchiseTable === 'function') renderFranchiseTable(franchiseList, true);
          if (typeof updateFranchiseStats === 'function') updateFranchiseStats();
        }
        populateMasterPaymentAcademyFilter();
        const select = document.getElementById('masterPaymentPlanFilter');
        if (select) {
          const selected = select.value;
          select.innerHTML = '<option value="ALL">전체 상품명</option>' + state.products.map(p => `<option value="${esc(p.code.toLowerCase())}">${esc(p.name)}</option>`).join('');
          select.value = Array.from(select.options).some(o => o.value === selected) ? selected : 'ALL';
        }
        // filterMasterPaymentList 내부에서 승인 가맹점 필터 + 16일 00:00 자동 결제 대기 반영 + 상단 3개 KPI 카드 업데이트를 일괄 수행합니다.
        filterMasterPaymentList();
      } else {
        academyPaymentList = data.items;
        filterAcademyPaymentTable();
        text('paymentKakaoBalance', money(data.balance) + '원');
        text('paymentKakaoCount', money(data.remainingCount) + '건 발송 가능 · 건당 8.5원');
      }
    } catch (e) { toast(e.message); } finally { state.busy = false; }
  }

  function renderPayments(items) {
    const body = document.getElementById('masterPaymentTableBody');
    if (!body) return;
    text('masterPaymentFilteredCount', items.length);
    body.innerHTML = items.map((p,i) => {
      const statusLabel = ({paid:'결제 완료',pending:'결제 대기',cancelled:'취소',overdue:'미납'})[p.status] || p.status;
      const statusHtml = (p.isAutoPending || p.status === 'pending')
        ? `<span class="badge px-2 py-1 font-weight-bold" style="background:#fff8e6;color:#b45309;border:1px solid #fcd34d;font-size:11.5px;"><i class="fa-solid fa-clock mr-1"></i>${esc(statusLabel)}</span>`
        : p.status === 'paid'
          ? `<span class="badge px-2 py-1 font-weight-bold" style="background:#eaf5ec;color:#1e6b35;border:1px solid #b7dfbe;font-size:11.5px;"><i class="fa-solid fa-check mr-1"></i>${esc(statusLabel)}</span>${p.taxInvoiceIssued ? '<br><small>세금계산서 발행</small>' : ''}`
          : esc(statusLabel);
      const manageHtml = p.isAutoPending || (p.status === 'pending' && !p.manual)
        ? `<button type="button" class="btn btn-sm btn-beige-primary font-weight-bold" data-payment-register-academy="${esc(p.academyId)}" style="border-radius:8px;font-size:11.5px;padding:4px 10px;white-space:nowrap;"><i class="fa-solid fa-plus mr-1"></i>결제 등록</button>${p.manual && !p.isAutoPending ? ` <button type="button" class="btn btn-sm btn-outline-danger" data-payment-delete="${esc(p.id)}" style="font-size:11px;padding:3px 7px;">삭제</button>` : ''}`
        : p.manual
          ? `<button type="button" class="btn btn-sm btn-outline-secondary" data-payment-edit="${esc(p.id)}">수정</button> <button type="button" class="btn btn-sm btn-outline-danger" data-payment-delete="${esc(p.id)}">삭제</button>`
          : '결제사 관리';
      return `<tr><td>${i+1}</td><td class="font-weight-bold">${esc(p.academyName)}</td><td>${esc(p.director)}</td><td>${esc(p.planName)}</td><td>${money(p.supply)}원</td><td>${money(p.vat)}원</td><td class="font-weight-bold" style="color:#962a22;">${money(p.total)}원</td><td>${esc(methods[p.method] || p.method)}</td><td>${esc(p.date)}</td><td>${p.startDate ? esc(p.startDate + ' ~ ' + p.endDate) : '—'}</td><td>${statusHtml}</td><td>${manageHtml}</td></tr>`;
    }).join('') || '<tr><td colspan="12" class="text-center p-4">결제 내역이 없습니다.</td></tr>';
  }

  function dialog(title, html, submitText = '저장') {
    document.getElementById('billingDialog')?.remove();
    const el = document.createElement('dialog');
    el.id = 'billingDialog';
    el.className = 'modal-content-beige';
    el.style.cssText = 'border:1px solid #d8cebf;border-radius:18px;padding:0;width:min(580px,94vw);max-height:92vh;overflow:hidden;color:#3d342d;background:#ffffff;box-shadow:0 18px 45px rgba(40,30,20,0.22);font-family:inherit;';
    el.setAttribute('aria-labelledby', 'billingDialogTitle');
    el.innerHTML = `
      <div class="modal-header modal-header-beige d-flex justify-content-between align-items-center" style="background:#fbf9f5;border-bottom:1px solid #ece6dc;padding:16px 24px;">
        <h5 id="billingDialogTitle" class="modal-title font-weight-bold mb-0" style="font-size:16.5px;color:#3d342d;">
          <i class="fa-solid fa-hand-holding-dollar mr-2 text-warning"></i>${esc(title)}
        </h5>
        <button type="button" class="close" data-close aria-label="닫기" style="font-size:22px;color:#7a6e63;opacity:0.8;background:none;border:none;line-height:1;padding:0;cursor:pointer;">&times;</button>
      </div>
      <form id="billingForm" class="mb-0">
        <div class="modal-body" style="padding:20px 24px;max-height:calc(92vh - 132px);overflow-y:auto;">
          ${html}
          <p id="billingError" role="alert" class="text-danger font-weight-bold mt-2 mb-0" style="font-size:12.5px;min-height:18px;"></p>
        </div>
        <div class="modal-footer d-flex justify-content-between align-items-center" style="background:#fbf9f5;border-top:1px solid #ece6dc;padding:14px 24px;">
          <button type="button" class="btn-beige-secondary" data-close style="border-radius:10px;padding:8px 18px;font-size:13px;font-weight:600;">취소</button>
          <button type="submit" class="btn-beige-primary font-weight-bold" style="border-radius:10px;padding:8px 20px;font-size:13px;">
            <i class="fa-solid fa-check mr-1"></i>${esc(submitText)}
          </button>
        </div>
      </form>`;
    document.body.appendChild(el);
    el.querySelectorAll('[data-close]').forEach(btn => { btn.onclick = () => el.close(); });
    el.addEventListener('click', e => { if (e.target === el) el.close(); });
    el.showModal();
    return el;
  }
  const field = (label, control, req = false) => `<div class="mb-3"><label class="font-weight-bold mb-1 d-block" style="font-size:12.5px;color:#3d342d;">${esc(label)}${req ? ' <span class="text-danger">*</span>' : ''}</label>${control}</div>`;
  const input = (name, value, type = 'text', extra = '') => `<input class="form-control billing-input" name="${name}" type="${type}" value="${esc(value)}" ${extra}>`;

  async function edit(id, preselectedAcademyId) {
    if (global.NanoPortal && NanoPortal.remote) await load();
    if (!state.products.length) state.products = DEFAULT_PRODUCTS.slice();
    const p = id ? state.payments.find(x => x.id === id) : null;
    if (id && !p) return toast('결제 내역을 새로고침해 주세요.');
    const requestId = crypto.randomUUID();
    const initialMethod = p?.method === 'CARD' ? 'CARD' : 'TRANSFER';
    const rawAcademies = Array.isArray(franchiseList) ? franchiseList : [];
    const approvedAcademies = typeof getApprovedFranchiseList === 'function' ? getApprovedFranchiseList() : rawAcademies;
    const academies = approvedAcademies.length ? approvedAcademies : rawAcademies;
    const targetAcadId = p?.academyId || preselectedAcademyId || '';
    const currentAcademy = academies.find(a => a.id === targetAcadId || a.name === targetAcadId) || rawAcademies.find(a => a.id === targetAcadId || a.name === targetAcadId) || academies[0] || { id: '', name: '가맹 학원 선택', director: '', plan: 'BASIC' };
    const initialProductCode = p?.productCode || mapAcademyPlanToProductCode(currentAcademy.plan);
    const initialProduct = state.products.find(x => x.code === initialProductCode) || state.products[0];
    const formatAcademyLabel = a => a && a.id ? `${a.name}${a.director ? ' · ' + a.director : ''}` : '가맹 학원을 선택해 주세요';

    const el = dialog(
      p ? '수동 결제 내역 수정' : '수동 결제 등록',
      `<!-- 상단 결제 수단 선택 버튼 (현금/계좌이체 vs 신용카드) -->
      <div class="d-flex mb-3 p-1" style="background:#f3ede2;border:1px solid #d8cebf;border-radius:12px;gap:6px;" role="tablist" aria-label="결제 수단 선택">
        <button type="button" data-pay-tab="TRANSFER" class="flex-fill font-weight-bold" style="height:38px;border-radius:9px;border:none;font-size:13px;cursor:pointer;transition:all 0.15s ease;">
          <i class="fa-solid fa-money-bill-transfer mr-1"></i>현금 / 계좌이체
        </button>
        <button type="button" data-pay-tab="CARD" class="flex-fill font-weight-bold" style="height:38px;border-radius:9px;border:none;font-size:13px;cursor:pointer;transition:all 0.15s ease;">
          <i class="fa-solid fa-credit-card mr-1"></i>신용카드
        </button>
      </div>
      <input type="hidden" name="method" value="${esc(initialMethod)}">
      ${field('결제 상태', `<select class="select-beige w-100" name="status" aria-label="결제 상태">${[['PAID','결제 완료'],['PENDING','결제 대기'],['CANCELLED','취소']].map(([value, label]) => `<option value="${value}" ${(p?.status || 'paid').toUpperCase() === value ? 'selected' : ''}>${label}</option>`).join('')}</select>`)}
      ${p?.productCode === 'KAKAO' && p.status === 'pending' ? '<p class="text-muted" style="font-size:12px;">입금을 확인한 뒤 결제 완료로 저장하면 신청 금액이 충전됩니다.</p>' : ''}

      <!-- 1. 학원 선택 드롭 박스 (검색 지원) -->
      <div class="mb-3" id="billingAcademyDropdown" style="position:relative;">
        <label class="font-weight-bold mb-1 d-block" style="font-size:12.5px;color:#3d342d;">가맹 학원 <span class="text-danger">*</span></label>
        <input type="hidden" name="academyId" value="${esc(currentAcademy.id)}">
        <button type="button" id="billingAcademyBtn" class="select-beige w-100 font-weight-bold d-flex justify-content-between align-items-center" ${p ? 'disabled' : ''} style="text-align:left;cursor:${p ? 'not-allowed' : 'pointer'};background:#fdfcf9;">
          <span id="billingAcademySelectedText" class="text-truncate">${esc(formatAcademyLabel(currentAcademy))}</span>
          <i class="fa-solid fa-chevron-down text-muted ml-2" style="font-size:11px;"></i>
        </button>
        <div id="billingAcademyMenu" hidden style="position:absolute;top:calc(100% + 4px);left:0;right:0;background:#ffffff;border:1px solid #d8cebf;border-radius:12px;box-shadow:0 12px 30px rgba(40,30,20,0.18);z-index:60;overflow:hidden;">
          <div class="p-2 border-bottom" style="background:#fbf9f5;border-color:#ece6dc !important;">
            <div style="position:relative;">
              <i class="fa-solid fa-magnifying-glass text-muted" style="position:absolute;left:11px;top:50%;transform:translateY(-50%);font-size:12px;pointer-events:none;"></i>
              <input type="search" id="billingAcademySearch" class="form-control billing-input" placeholder="학원명 또는 원장명 검색..." autocomplete="off" style="padding-left:32px;height:34px;font-size:12.5px;background:#ffffff;">
            </div>
          </div>
          <div id="billingAcademyList" style="max-height:200px;overflow-y:auto;padding:4px 0;"></div>
        </div>
      </div>

      <!-- 2. 상품명 & 3. 총 결제 금액 -->
      <div class="row mb-2">
        <div class="col-sm-6 mb-2 mb-sm-0">
          <label class="font-weight-bold mb-1 d-block" style="font-size:12.5px;color:#3d342d;">상품명 <span class="text-danger">*</span></label>
          <select class="select-beige w-100 font-weight-bold" name="productCode">${state.products.map(x => `<option value="${x.code}" ${initialProduct.code === x.code ? 'selected' : ''}>${esc(x.name)}</option>`).join('')}</select>
        </div>
        <div class="col-sm-6">
          <label class="font-weight-bold mb-1 d-block" style="font-size:12.5px;color:#3d342d;">총 결제 금액 (부가세 포함) <span class="text-danger">*</span></label>
          ${input('amount', p?.total || initialProduct.price, 'number', 'required min="1" max="100000000" step="1" style="font-weight:700;color:#962a22;"')}
        </div>
      </div>
      <div id="billingAmounts" class="px-3 py-2 mb-3 rounded" style="background:#fdfbf7;border:1px solid #ece6dc;font-size:12px;"></div>

      <!-- 4. 결제 일시 -->
      ${field('결제 일시 (한국시간)', input('paidAt', p?.paidAt ? new Date(new Date(p.paidAt).getTime() + 9 * 3600000).toISOString().slice(0, 16) : today() + 'T09:00', 'datetime-local', 'required'), true)}

      <!-- 5. 서비스 이용기간 -->
      <div id="billingPeriod" class="mb-3">
        <label class="font-weight-bold mb-1 d-block" style="font-size:12.5px;color:#3d342d;">서비스 이용기간 <span class="text-danger">*</span></label>
        <div class="d-flex align-items-center" style="gap:8px;">
          <div class="flex-fill">${input('startDate', p?.startDate || today(), 'date', 'aria-label="서비스 시작일"')}</div>
          <span class="text-muted font-weight-bold">~</span>
          <div class="flex-fill">${input('endDate', p?.endDate || today(), 'date', 'aria-label="서비스 종료일"')}</div>
        </div>
      </div>

      <label class="d-flex align-items-center mb-3" style="gap:8px;font-size:12.5px;">
        <input type="checkbox" name="taxInvoiceIssued" ${p?.taxInvoiceIssued ? 'checked' : ''}>세금계산서 발행 완료
      </label>
      <!-- 6. 현금영수증/메모칸 (현금/계좌이체) 또는 카드 결제 승인 ID (신용카드) -->
      <div class="mb-1">
        <label id="billingMemoLabel" class="font-weight-bold mb-1 d-block" style="font-size:12.5px;color:#3d342d;">현금영수증 / 메모</label>
        ${input('memo', p?.memo || '', 'text', 'id="billingMemoInput" maxlength="2000" placeholder="현금영수증 발행번호 또는 입금자명·수납 메모 입력"')}
      </div>`,
      p ? '수정 내용 저장' : '수동 결제 등록'
    );

    const form = el.querySelector('form');

    // 상단 탭(현금/계좌이체 vs 신용카드) 전환 처리
    const setPayMethodTab = method => {
      form.elements.method.value = method;
      el.querySelectorAll('[data-pay-tab]').forEach(btn => {
        const active = btn.dataset.payTab === method;
        btn.style.background = active ? '#3d342d' : 'transparent';
        btn.style.color = active ? '#ffffff' : '#7a6e63';
        btn.style.boxShadow = active ? '0 2px 6px rgba(61,52,45,0.22)' : 'none';
        btn.setAttribute('aria-selected', active ? 'true' : 'false');
      });
      const memoLabel = el.querySelector('#billingMemoLabel');
      const memoInput = el.querySelector('#billingMemoInput');
      if (method === 'CARD') {
        if (memoLabel) memoLabel.innerHTML = '<i class="fa-solid fa-hashtag mr-1 text-muted"></i>카드 결제 승인 ID';
        if (memoInput) memoInput.placeholder = 'PG사 카드 승인번호 또는 거래 ID 입력';
      } else {
        if (memoLabel) memoLabel.innerHTML = '<i class="fa-solid fa-receipt mr-1 text-muted"></i>현금영수증 / 메모';
        if (memoInput) memoInput.placeholder = '현금영수증 발행번호 또는 입금자명·수납 메모 입력';
      }
    };
    el.querySelectorAll('[data-pay-tab]').forEach(btn => {
      btn.onclick = () => setPayMethodTab(btn.dataset.payTab);
    });
    setPayMethodTab(initialMethod);

    // 학원 검색 드롭다운 렌더링 및 동작
    const dropdownWrap = el.querySelector('#billingAcademyDropdown');
    const dropdownBtn = el.querySelector('#billingAcademyBtn');
    const dropdownMenu = el.querySelector('#billingAcademyMenu');
    const searchInput = el.querySelector('#billingAcademySearch');
    const listContainer = el.querySelector('#billingAcademyList');
    const selectedText = el.querySelector('#billingAcademySelectedText');

    const renderAcademyOptions = (query = '') => {
      const q = query.trim().toLowerCase();
      const filtered = academies.filter(a => !q || String(a.name || '').toLowerCase().includes(q) || String(a.director || '').toLowerCase().includes(q) || String(a.id || '').toLowerCase().includes(q));
      if (!filtered.length) {
        listContainer.innerHTML = `<div class="text-center text-muted py-3" style="font-size:12px;">일치하는 가맹 학원이 없습니다.</div>`;
        return;
      }
      const curVal = form.elements.academyId.value;
      listContainer.innerHTML = filtered.map(a => {
        const isSelected = a.id === curVal;
        return `<button type="button" data-acad-id="${esc(a.id)}" class="w-100 text-left px-3 py-2 border-0 d-flex justify-content-between align-items-center" style="background:${isSelected ? '#f5efe6' : 'transparent'};color:#3d342d;font-size:12.5px;font-weight:${isSelected ? '700' : '500'};cursor:pointer;">
          <span class="text-truncate">${esc(a.name)} <small class="text-muted">· ${esc(a.director || '')}</small></span>
          ${isSelected ? '<i class="fa-solid fa-check text-warning ml-2" style="font-size:11px;"></i>' : ''}
        </button>`;
      }).join('');
      listContainer.querySelectorAll('[data-acad-id]').forEach(itemBtn => {
        itemBtn.onclick = () => {
          const picked = academies.find(a => a.id === itemBtn.dataset.acadId);
          if (picked) {
            form.elements.academyId.value = picked.id;
            selectedText.textContent = formatAcademyLabel(picked);
            // 가맹학원을 선택하면 해당 가맹점의 상품명 및 금액이 아래에 즉시 적용됨
            const code = mapAcademyPlanToProductCode(picked.plan);
            const matchedProduct = state.products.find(x => x.code === code) || state.products[0];
            if (matchedProduct) {
              form.elements.productCode.value = matchedProduct.code;
              form.elements.amount.value = matchedProduct.price;
              calculate();
            }
          }
          dropdownMenu.hidden = true;
        };
      });
    };

    if (!p && dropdownBtn) {
      dropdownBtn.onclick = () => {
        dropdownMenu.hidden = !dropdownMenu.hidden;
        if (!dropdownMenu.hidden) {
          searchInput.value = '';
          renderAcademyOptions('');
          setTimeout(() => searchInput.focus(), 10);
        }
      };
      searchInput.oninput = () => renderAcademyOptions(searchInput.value);
      el.addEventListener('click', e => {
        if (!dropdownMenu.hidden && dropdownWrap && !dropdownWrap.contains(e.target)) {
          dropdownMenu.hidden = true;
        }
      });
    }

    const calculate = () => {
      const amount = Number(form.elements.amount.value) || 0;
      const kakao = form.elements.productCode.value === 'KAKAO';
      const supply = kakao ? Math.round((amount / 5500) * 5000) : Math.round(amount / 1.1);
      const vat = amount - supply;
      const amountsEl = el.querySelector('#billingAmounts');
      if (amountsEl) {
        amountsEl.innerHTML = `
          <div class="d-flex justify-content-between align-items-center">
            <span class="text-muted">공급가액 <strong style="color:#3d342d;">${money(supply)}원</strong> · 부가세 <strong style="color:#3d342d;">${money(vat)}원</strong>${kakao ? ' <span class="text-muted">(5,500원 단위)</span>' : ''}</span>
            <strong style="color:#962a22;font-size:13.5px;">합계 ${money(amount)}원</strong>
          </div>`;
      }
      el.querySelector('#billingPeriod').hidden = kakao;
      form.elements.startDate.required = !kakao;
      form.elements.endDate.required = !kakao;
      form.elements.amount.step = kakao ? '5500' : '1';
      form.elements.amount.min = kakao ? '5500' : '1';
    };
    form.elements.productCode.onchange = () => { form.elements.amount.value = state.products.find(x => x.code === form.elements.productCode.value).price; calculate(); };
    form.elements.amount.oninput = calculate;
    calculate();
    form.onsubmit = async event => {
      event.preventDefault();
      const button = form.querySelector('[type=submit]');
      button.disabled = true;
      try {
        const data = Object.fromEntries(new FormData(form));
        await api('/api/billing', {
          ...data,
          operation: 'save',
          requestId,
          id: p?.id,
          revision: p?.revision,
          academyId: p?.academyId || data.academyId,
          status: data.status || 'PAID',
          taxInvoiceIssued: form.elements.taxInvoiceIssued.checked,
          paidAt: data.paidAt ? data.paidAt + ':00+09:00' : undefined
        });
        el.close();
        await load();
        toast('결제 내역을 저장했습니다.');
      } catch (e) {
        text('billingError', e.message);
      } finally {
        button.disabled = false;
      }
    };
  }

  async function remove(id) {
    const p=state.payments.find(x=>x.id===id);
    if (!p || !confirm(p.academyName+'의 결제 내역을 삭제할까요? 카카오톡 충전액은 회수되며, 잔액이 부족하면 삭제할 수 없습니다.')) return;
    try { await api('/api/billing',{ operation:'delete', id, revision:p.revision, academyId:p.academyId, requestId:crypto.randomUUID() }); await load(); toast('결제 내역을 삭제했습니다.'); } catch(e) { toast(e.message); }
  }

  function topup() {
    const requestId = crypto.randomUUID();
    const el = dialog(
      '카카오톡 알림 충전 신청',
      `<div class="py-2 px-3 mb-3" style="font-size:12px;background:#fdfbf7;border:1px solid #ebdcc9;border-radius:10px;color:#5c5046;line-height:1.5;">
        <i class="fa-solid fa-comment-dots text-warning mr-1"></i>
        <strong>5,500원(부가세 포함)</strong>마다 5,000원이 적립되며, 발송 시 건당 8.5원이 차감됩니다.<br>계좌이체 구매 신청 후 본사에서 입금을 확인하면 즉시 충전됩니다.<br>입금 계좌는 본사에 확인해 주세요.
      </div>` +
      field('구매 수량 (1구좌 = 5,500원)', input('quantity', 1, 'number', 'min="1" max="10000" step="1" required'), true) +
      `<div class="p-3 mb-1 rounded d-flex justify-content-between align-items-center" style="background:#fdfbf7;border:1px solid #ece6dc;font-size:13.5px;">
        <span class="font-weight-bold" style="color:#3d342d;">총 결제 금액 (VAT 포함)</span>
        <strong id="topupTotal" style="color:#962a22;font-size:16px;">5,500원</strong>
      </div>`,
      '계좌이체 구매 신청'
    );
    const form = el.querySelector('form');
    form.elements.quantity.oninput = () => text('topupTotal', money(Number(form.elements.quantity.value) * 5500) + '원');
    form.onsubmit = async event => {
      event.preventDefault();
      const button = form.querySelector('[type=submit]');
      button.disabled = true;
      try {
        await api('/api/billing', { operation: 'topup', amount: Number(form.elements.quantity.value) * 5500, requestId });
        el.close();
        await load();
        toast('구매 신청되었습니다. 입금 확인 후 충전됩니다.');
      } catch (e) {
        text('billingError', e.message);
      } finally {
        button.disabled = false;
      }
    };
  }

  async function dispatch(force=false) {
    if (state.dispatchBusy || (!force && Date.now()-state.dispatchAt<30000)) return;
    state.dispatchBusy=true;
    try {
      const s=await api('/api/services?action=dispatch_stats');
      state.dispatchAt=Date.now();
      if (master()) { dispatchLogs=s.items; filterDispatchList(); }
      else { academyDispatchLogs=s.items; renderAcademyDispatchTable(); }
      const prefix=master()?'statAligo':'academyAligo';
      text(prefix+'Cash',master() ? s.estimatedCash==null?'조회 불가':money(s.estimatedCash)+'원 (환산)' : money(s.balance)+'원');
      text(prefix+'CashSub',master() ? s.remainingCount==null?'잔여 건수 조회 불가':money(s.remainingCount)+'건 · 건당 6.5원 환산' : money(s.walletCount)+'건 가능 · 건당 8.5원');
      numUnit(prefix+'TotalSent',money(s.monthly),'건'); text(prefix+'TotalSentSub','전체 누적 '+money(s.total)+'건');
      numUnit(prefix+'SuccessRate',(s.total?(s.success/s.total*100).toFixed(1):'0.0'),'%');
      text(prefix+'SuccessRateSub','성공/문자 '+s.success+'건 · 실패 '+s.failed+'건 · 확인 중 '+s.pending+'건');
      text(prefix+'Connection',s.connected?'정상':'연결 확인 필요');
      if (master()) text('statAligoConnectionSub',s.connected?'알리고 API 정상 연결됨':(s.aligoMessage||'알리고 API 응답 기준'));
    } catch(e) { text(master()?'statAligoConnection':'academyAligoConnection','조회 실패'); toast(e.message); }
    finally { state.dispatchBusy=false; }
  }

  async function retry(id) {
    const list=master()?dispatchLogs:academyDispatchLogs, log=list.find(x=>x.id===id);
    if (!log || !confirm(log.receiverName+' ('+log.receiverPhone+')에게 재발송할까요? 발송 시 1회 차감됩니다.')) return;
    try { const result=await api('/api/services',{action:'retry',id}); toast(statuses[result.status] || '결과 확인 중'); await dispatch(true); }
    catch(e) { toast(e.message); }
  }

  async function wallet(academyId) {
    text('editAcademyKakaoCount','카카오톡 충전 횟수 조회 중…');
    try {
      const result=await api('/api/billing?wallet=1&academy='+encodeURIComponent(academyId));
      if (document.getElementById('editAcademyId')?.value === academyId) text('editAcademyKakaoCount','카카오톡 충전 횟수: '+money(result.remainingCount)+'건 · 잔액 '+money(result.balance)+'원');
    } catch(e) { text('editAcademyKakaoCount','충전 내역 조회 실패: '+e.message); }
  }

  document.addEventListener('click',event=>{
    const editButton=event.target.closest('[data-payment-edit]');
    const deleteButton=event.target.closest('[data-payment-delete]');
    const registerButton=event.target.closest('[data-payment-register-academy]');
    if(editButton) edit(editButton.dataset.paymentEdit);
    if(deleteButton) remove(deleteButton.dataset.paymentDelete);
    if(registerButton) edit(null, registerButton.dataset.paymentRegisterAcademy);
  });
  global.NanoBilling={load,renderPayments,edit,topup,dispatch,retry,wallet};
})(window);
