// 충전 신청을 새 결제로 바꾸지 않고 본사에서 승인하는 화면 흐름을 검증합니다.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function harness(payments) {
  const requests = [], nodes = new Map();
  const node = () => ({ textContent: '', innerHTML: '', style: {}, hidden: false, setAttribute() {} });
  const body = node();
  nodes.set('tab-master-payment', node());
  nodes.set('masterPaymentTableBody', body);
  const submit = { disabled: false };
  const form = { elements: {}, querySelector: () => submit };
  const dialog = {
    ...node(), addEventListener() {}, querySelectorAll: () => [],
    querySelector(selector) {
      if (selector === 'form') return form;
      if (!nodes.has(selector)) nodes.set(selector, node());
      return nodes.get(selector);
    },
    showModal() {}, close() {},
    set innerHTML(html) {
      this.html = html;
      for (const match of html.matchAll(/<input\b([^>]*)>/g)) {
        const attrs = match[1]; const name = /name="([^"]+)"/.exec(attrs)?.[1];
        if (name) form.elements[name] = { value: /value="([^"]*)"/.exec(attrs)?.[1] || '', checked: /\bchecked\b/.test(attrs), type: /type="([^"]+)"/.exec(attrs)?.[1] };
      }
      for (const match of html.matchAll(/<select\b[^>]*name="([^"]+)"[^>]*>([\s\S]*?)<\/select>/g)) {
        const options = [...match[2].matchAll(/<option\b([^>]*)>/g)];
        const selected = options.find(option => /\bselected\b/.test(option[1])) || options[0];
        form.elements[match[1]] = { value: /value="([^"]*)"/.exec(selected[1])[1] };
      }
    }
  };
  const context = {
    console, crypto: { randomUUID: () => 'billing-ui-request-id-12345' },
    document: { getElementById: id => nodes.get(id), createElement: () => dialog, body: { appendChild() {} }, addEventListener() {} },
    franchiseList: [{ id: 'A1', name: '테스트 학원', director: '원장', plan: 'BASIC' }],
    populateMasterPaymentAcademyFilter() {}, filterMasterPaymentList() {}, showMasterToast() {},
    FormData: function (target) { return Object.entries(target.elements).filter(([, item]) => item.type !== 'checkbox').map(([key, item]) => [key, item.value]); },
    NanoPortal: { remote: true, async api(url, data) {
      if (data) { requests.push(data); return { ok: true }; }
      return { items: payments };
    } }
  };
  context.window = context;
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../public_html/js/billing-ui.js'), 'utf8'), context);
  return { billing: context.NanoBilling, body, dialog, form, requests };
}

const purchase = {
  id: 'TOPUP-existing-request', revision: 1, academyId: 'A1', academyName: '테스트 학원', director: '원장',
  productCode: 'KAKAO', planName: '카카오톡 알림', supply: 5000, vat: 500, total: 5500,
  method: 'TRANSFER', status: 'pending', manual: true, taxInvoiceIssued: true
};

test('실제 충전 신청은 기존 결제를 수정하고 자동 대기 항목만 새 결제를 등록한다', () => {
  const app = harness([purchase]);
  app.billing.renderPayments([purchase]);
  assert.match(app.body.innerHTML, /data-payment-edit="TOPUP-existing-request"/);
  assert.doesNotMatch(app.body.innerHTML, /data-payment-register-academy/);
  app.billing.renderPayments([{ ...purchase, isAutoPending: true, manual: false }]);
  assert.match(app.body.innerHTML, /data-payment-register-academy="A1"/);
});

test('충전 입금 확인은 기존 신청 ID·금액·세금계산서 상태를 보존하여 결제 완료로 저장한다', async () => {
  const app = harness([purchase]);
  await app.billing.edit(purchase.id);
  assert.equal(app.form.elements.status.value, 'PENDING');
  assert.equal(app.form.elements.productCode.value, 'KAKAO');
  assert.equal(app.form.elements.amount.value, '5500');
  assert.equal(app.form.elements.taxInvoiceIssued.checked, true);
  app.form.elements.status.value = 'PAID';
  await app.form.onsubmit({ preventDefault() {} });
  assert.equal(app.requests.length, 1);
  assert.equal(app.requests[0].id, purchase.id);
  assert.equal(app.requests[0].revision, 1);
  assert.equal(app.requests[0].productCode, 'KAKAO');
  assert.equal(app.requests[0].amount, '5500');
  assert.equal(app.requests[0].status, 'PAID');
  assert.equal(app.requests[0].taxInvoiceIssued, true);
});

test('카카오톡 알림 수동 결제 금액은 5,500원 단위 제한 없이 원하는 값(예: 3,000원)을 자유롭게 입력할 수 있고 일괄 결제 등록 모달이 동작한다', async () => {
  const app = harness([purchase]);
  await app.billing.edit(purchase.id);
  assert.equal(app.form.elements.amount.min, '1');
  assert.equal(app.form.elements.amount.step, '1');
  app.form.elements.amount.value = '3000';
  app.form.elements.amount.oninput();
  app.form.elements.status.value = 'PAID';
  await app.form.onsubmit({ preventDefault() {} });
  assert.equal(app.requests[0].amount, '3000');

  // 일괄 결제 등록(bulkRegister): 결제 일시만 확인하여 bulk_save 요청 전송
  const autoItems = [
    { id: 'AUTO-PENDING-2026-11-A1', isAutoPending: true, targetMonth: '2026-11', academyId: 'A1', academyName: '테스트 학원', productCode: 'BASIC', total: 88000, startDate: '2026-11-01', endDate: '2026-11-30', status: 'pending' }
  ];
  app.billing.renderPayments(autoItems);
  assert.match(app.body.innerHTML, /master-payment-row-check/);
  app.billing.bulkRegister(autoItems);
  assert.ok(app.form.elements.paidAt.value.length >= 16);
  await app.form.onsubmit({ preventDefault() {} });
  const bulkReq = app.requests.find(r => r.operation === 'bulk_save');
  assert.ok(bulkReq, 'bulk_save 요청이 전송되어야 합니다.');
  assert.equal(bulkReq.items.length, 1);
  assert.equal(bulkReq.items[0].academyId, 'A1');
});
