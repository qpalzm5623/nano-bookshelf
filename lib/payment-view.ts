import { dispatchDate } from './dispatch-view';
import { PRODUCTS } from './billing-policy';
export function paymentView(p: any) {
  const supply = p.supplyAmount ?? Math.round(p.amount / 1.1);
  const productCode = (p.productCode || p.plan) === 'VIP' ? 'ROYAL' : (p.productCode || p.plan);
  return { id: p.id, revision: p.revision, academyId: p.academy.code, academyName: p.academy.name, director: p.academy.directorName, phone: p.academy.phone,
    planType: productCode.toLowerCase(), productCode, planName: p.productName || PRODUCTS.find(item => item.code === productCode)?.name || p.plan,
    supply, vat: p.vatAmount ?? p.amount - supply, total: p.amount, method: p.payMethod,
    date: dispatchDate(p.paidAt || p.createdAt), paidAt: p.paidAt?.toISOString() || '',
    startDate: p.serviceStart?.toISOString().slice(0, 10) || '', endDate: p.serviceEnd?.toISOString().slice(0, 10) || '',
    status: p.status.toLowerCase(), memo: p.memo || '', taxInvoiceIssued: p.taxInvoiceIssued, manual: p.payCode.startsWith('MANUAL-') || p.payCode.startsWith('TOPUP-') };
}
