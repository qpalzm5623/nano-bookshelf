/* 본사·학원 공통 결제/충전 화면. 금액과 권한은 서버에서 다시 검증합니다. */
(function (global) {
  'use strict';
  const state = { products: [], payments: [], busy: false, dispatchBusy: false, dispatchAt: 0 };
  const esc = value => String(value == null ? '' : value).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
  const money = value => Number(value || 0).toLocaleString('ko-KR', { maximumFractionDigits: 1 });
  const master = () => !!document.getElementById('tab-master-payment');
  const toast = message => master() ? showMasterToast(message) : showAcademyToast(message);
  const text = (id, value) => { const el = document.getElementById(id); if (el) el.textContent = value; };
  const api = (path, data) => {
    if (!global.NanoPortal || !NanoPortal.remote) return Promise.reject(new Error('운영 서버에 로그인한 뒤 이용해 주세요.'));
    return NanoPortal.api(path, data, 45000);
  };
  const today = () => new Date(Date.now() + 9 * 3600000).toISOString().slice(0,10);
  const statuses = { SUCCESS:'성공', FAILED:'실패', ACCEPTED:'전송 중', SENDING:'접수 중', UNKNOWN:'결과 확인 중', SMS_FALLBACK:'문자 대체 발송' };
  const methods = { CARD:'신용카드', TRANSFER:'계좌이체', CASH:'현금', OTHER:'기타' };

  async function load() {
    if (state.busy) return;
    state.busy = true;
    try {
      const data = await api('/api/billing');
      state.products = data.products; state.payments = data.items;
      if (master()) {
        masterPaymentList = data.items;
        populateMasterPaymentAcademyFilter();
        const select = document.getElementById('masterPaymentPlanFilter');
        const selected = select.value;
        select.innerHTML = '<option value="ALL">전체 상품명</option>' + data.products.map(p => `<option value="${esc(p.code.toLowerCase())}">${esc(p.name)}</option>`).join('');
        select.value = Array.from(select.options).some(o => o.value === selected) ? selected : 'ALL';
        filterMasterPaymentList();
        text('kpiMonthTotalRevenue', money(data.stats.monthRevenue) + '원');
        text('kpiMonthTotalRevenueSub', '이번 달 입금 완료 금액');
        text('kpiPaidCount', data.stats.paidCount + '건');
        text('kpiPaidCountSub', '전체 결제 완료 내역');
        text('kpiPendingCount', data.stats.pendingCount + '건');
        text('kpiPendingCountSub', money(data.stats.pendingAmount) + '원 입금 확인 대기');
        text('kpiExpiringCount', data.stats.expiring + '곳');
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
    body.innerHTML = items.map((p,i) => `<tr><td>${i+1}</td><td>${esc(p.academyName)}</td><td>${esc(p.director)}</td><td>${esc(p.planName)}</td><td>${money(p.supply)}원</td><td>${money(p.vat)}원</td><td>${money(p.total)}원</td><td>${esc(methods[p.method] || p.method)}</td><td>${esc(p.date)}</td><td>${p.startDate ? esc(p.startDate + ' ~ ' + p.endDate) : '—'}</td><td>${esc(({paid:'결제 완료',pending:'입금 대기',cancelled:'취소',overdue:'미납'})[p.status] || p.status)}${p.taxInvoiceIssued ? '<br><small>세금계산서 발행</small>' : ''}</td><td>${p.manual ? `<button type="button" class="btn btn-sm btn-outline-secondary" data-payment-edit="${esc(p.id)}">수정</button> <button type="button" class="btn btn-sm btn-outline-danger" data-payment-delete="${esc(p.id)}">삭제</button>` : '결제사 관리'}</td></tr>`).join('') || '<tr><td colspan="12" class="text-center p-4">결제 내역이 없습니다.</td></tr>';
  }

  function dialog(title, html) {
    document.getElementById('billingDialog')?.remove();
    const el = document.createElement('dialog'); el.id = 'billingDialog';
    el.style.cssText = 'border:1px solid #d8cebf;border-radius:16px;padding:24px;width:min(620px,94vw);max-height:90vh;overflow:auto;color:#3d342d;';
    el.setAttribute('aria-labelledby','billingDialogTitle');
    el.innerHTML = `<h5 id="billingDialogTitle">${esc(title)}</h5><form id="billingForm">${html}<p id="billingError" role="alert" class="text-danger mt-3"></p><div class="d-flex justify-content-end mt-3" style="gap:8px"><button type="button" class="btn btn-outline-secondary" data-close>닫기</button><button type="submit" class="btn btn-beige-primary">저장</button></div></form>`;
    document.body.appendChild(el); el.querySelector('[data-close]').onclick = () => el.close(); el.showModal(); return el;
  }
  const field = (label, input) => `<label class="d-block mt-3">${esc(label)}${input}</label>`;
  const input = (name, value, type='text', extra='') => `<input class="form-control" name="${name}" type="${type}" value="${esc(value)}" ${extra}>`;

  async function edit(id) {
    await load();
    if (!state.products.length) return;
    const p = id ? state.payments.find(x => x.id === id) : null;
    if (id && !p) return toast('결제 내역을 새로고침해 주세요.');
    const requestId = crypto.randomUUID();
    const academyOptions = franchiseList.map(a => `<option value="${esc(a.id)}" ${p?.academyId === a.id ? 'selected' : ''}>${esc(a.name + ' · ' + a.director)}</option>`).join('');
    const el = dialog(p ? '수동 결제 수정' : '수동 결제 등록',
      field('가맹학원', `<select class="form-control" name="academyId" ${p ? 'disabled' : ''}>${academyOptions}</select>`) +
      field('상품명', `<select class="form-control" name="productCode">${state.products.map(x => `<option value="${x.code}" ${p?.productCode === x.code ? 'selected' : ''}>${esc(x.name)}</option>`).join('')}</select>`) +
      field('총 결제 금액 (부가세 포함)',input('amount',p?.total || state.products[0].price,'number','required min="1" max="100000000" step="1"')) + '<p id="billingAmounts" class="text-muted mt-2"></p>' +
      field('결제 수단',`<select class="form-control" name="method">${['TRANSFER','CASH','OTHER'].map(x=>`<option value="${x}" ${p?.method === x?'selected':''}>${methods[x]}</option>`).join('')}</select>`) +
      field('결제 상태',`<select class="form-control" name="status">${['PAID','PENDING','CANCELLED'].map(x=>`<option value="${x}" ${p?.status === x.toLowerCase()?'selected':''}>${({PAID:'결제 완료 (입금 확인)',PENDING:'입금 대기',CANCELLED:'취소'})[x]}</option>`).join('')}</select>`) +
      field('결제 일시 (한국시간)',input('paidAt', p?.paidAt ? new Date(new Date(p.paidAt).getTime()+9*3600000).toISOString().slice(0,16) : today()+'T09:00','datetime-local')) +
      '<div id="billingPeriod">'+field('서비스 시작일',input('startDate',p?.startDate || today(),'date')) +field('서비스 종료일',input('endDate',p?.endDate || today(),'date'))+'</div>' +
      `<label class="d-block mt-3"><input type="checkbox" name="taxInvoiceIssued" ${p?.taxInvoiceIssued?'checked':''}> 세금계산서 발행 완료</label>` +field('수납 메모',input('memo',p?.memo || '', 'text','maxlength="2000"')));
    const form=el.querySelector('form');
    const calculate = () => {
      const amount=Number(form.elements.amount.value), kakao=form.elements.productCode.value==='KAKAO';
      const supply=kakao ? amount/5500*5000 : Math.round(amount/1.1);
      text('billingAmounts','공급가액 '+money(supply)+'원 · 부가세 '+money(amount-supply)+'원'+(kakao?' · 5,500원 단위 구매':''));
      el.querySelector('#billingPeriod').hidden=kakao;
      form.elements.startDate.required=!kakao; form.elements.endDate.required=!kakao;
      form.elements.amount.step=kakao?'5500':'1'; form.elements.amount.min=kakao?'5500':'1';
    };
    form.elements.productCode.onchange=()=>{ form.elements.amount.value=state.products.find(x=>x.code===form.elements.productCode.value).price; calculate(); };
    form.elements.amount.oninput=calculate; calculate();
    form.onsubmit=async event=>{
      event.preventDefault(); const button=form.querySelector('[type=submit]'); button.disabled=true;
      try {
        const data=Object.fromEntries(new FormData(form));
        await api('/api/billing',{...data, operation:'save', requestId, id:p?.id, revision:p?.revision, academyId:p?.academyId || data.academyId,
          paidAt:data.paidAt ? data.paidAt+':00+09:00' : undefined, taxInvoiceIssued:form.elements.taxInvoiceIssued.checked });
        el.close(); await load(); toast('결제 내역을 저장했습니다.');
      } catch(e) { text('billingError',e.message); } finally { button.disabled=false; }
    };
  }

  async function remove(id) {
    const p=state.payments.find(x=>x.id===id);
    if (!p || !confirm(p.academyName+'의 결제 내역을 삭제할까요? 카카오톡 충전액은 회수되며, 잔액이 부족하면 삭제할 수 없습니다.')) return;
    try { await api('/api/billing',{ operation:'delete', id, revision:p.revision, academyId:p.academyId, requestId:crypto.randomUUID() }); await load(); toast('결제 내역을 삭제했습니다.'); } catch(e) { toast(e.message); }
  }

  function topup() {
    const requestId=crypto.randomUUID();
    const el=dialog('카카오톡 알림 구매', '<p>5,500원(부가세 포함)마다 5,000원 적립 · 건당 8.5원 차감</p>'+field('구매 수량',input('quantity',1,'number','min="1" max="10000" step="1" required'))+'<p id="topupTotal" class="mt-3">총 결제액 5,500원</p><p>계좌이체 구매 신청 후 본사에서 입금을 확인하면 충전됩니다. 입금 계좌는 본사에 확인해 주세요.</p>');
    const form=el.querySelector('form'); form.querySelector('[type=submit]').textContent='계좌이체 구매 신청';
    form.elements.quantity.oninput=()=>text('topupTotal','총 결제액 '+money(Number(form.elements.quantity.value)*5500)+'원');
    form.onsubmit=async event=>{ event.preventDefault(); const button=form.querySelector('[type=submit]'); button.disabled=true;
      try { await api('/api/billing',{operation:'topup',amount:Number(form.elements.quantity.value)*5500,requestId}); el.close(); await load(); toast('구매 신청되었습니다. 입금 확인 후 충전됩니다.'); }
      catch(e) { text('billingError',e.message); } finally { button.disabled=false; }
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
      text(prefix+'TotalSent',money(s.monthly)+'건'); text(prefix+'TotalSentSub','전체 누적 '+money(s.total)+'건');
      text(prefix+'SuccessRate',(s.total?(s.success/s.total*100).toFixed(1):'0.0')+'%');
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
    const editButton=event.target.closest('[data-payment-edit]'), deleteButton=event.target.closest('[data-payment-delete]');
    if(editButton) edit(editButton.dataset.paymentEdit);
    if(deleteButton) remove(deleteButton.dataset.paymentDelete);
  });
  global.NanoBilling={load,renderPayments,edit,topup,dispatch,retry,wallet};
})(window);
