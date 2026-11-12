import { prisma } from '../lib/prisma';
import { authenticate, staff, master, need, failure, academyScope, text } from '../lib/portal-http';
import { PRODUCTS, paymentAmounts, KAKAO_UNIT } from '../lib/billing-policy';
import { changeBalance } from '../lib/kakao-wallet';
import { paymentView } from '../lib/payment-view';
import { dispatchDate } from '../lib/dispatch-view';

export default async function handler(req: any, res: any) {
  res.setHeader('Cache-Control', 'no-store');
  try {
    const user = await authenticate(req); staff(user);
    need(['MASTER', 'DIRECTOR'].includes(user.role), '원장 또는 본사 관리자 권한이 필요합니다.', 403);
    if (req.method === 'GET') {
      if (req.query.wallet === '1') {
        const academyId = await academyScope(user, String(req.query.academy || ''));
        const wallet = await prisma.academy.findUnique({ where: { id: academyId }, select: { kakaoBalance: true } });
        return res.json({ balance: (wallet?.kakaoBalance || 0) / 10, remainingCount: Math.floor((wallet?.kakaoBalance || 0) / KAKAO_UNIT) });
      }
      const where = { deletedAt: null, ...(user.role === 'MASTER' ? {} : { academyId: user.academyId }) };
      const items = await prisma.payment.findMany({ where, include: { academy: true }, orderBy: { createdAt: 'desc' } });
      const academy = await prisma.academy.findUnique({ where: { id: user.academyId } });
      const month = new Date(Date.now() + 9 * 3600000).toISOString().slice(0, 7);
      const paid = items.filter(p => p.status === 'PAID');
      const pending = items.filter(p => p.status === 'PENDING');
      const expiring = await prisma.academy.count({ where: { deletedAt: null, status: 'ACTIVE', endDate: { gte: new Date(), lte: new Date(Date.now() + 30 * 86400000) }, ...(user.role === 'MASTER' ? {} : { id: user.academyId }) } });
      return res.json({ items: items.map(paymentView), products: PRODUCTS, balance: (academy?.kakaoBalance || 0) / 10, remainingCount: Math.floor((academy?.kakaoBalance || 0) / KAKAO_UNIT),
        stats: { monthRevenue: paid.filter(p => dispatchDate(p.paidAt || p.createdAt).startsWith(month)).reduce((a, p) => a + p.amount, 0), paidCount: paid.length, pendingCount: pending.length, pendingAmount: pending.reduce((a,p) => a+p.amount,0), expiring } });
    }
    need(req.method === 'POST', '지원하지 않는 요청입니다.', 405);
    const input = req.body || {};
    const operation = String(input.operation || 'save');
    need(['save', 'delete', 'topup'].includes(operation), '결제 작업을 확인해 주세요.');
    if (operation === 'topup') {
      need(user.role === 'DIRECTOR', '학원 원장 권한이 필요합니다.', 403);
      need(!input.id, '구매 신청으로 기존 결제 내역을 변경할 수 없습니다.', 403);
    }
    else master(user);
    if (operation === 'delete') need(typeof input.id === 'string' && input.id.trim().length > 0, '삭제할 결제 내역을 선택해 주세요.');
    const academyId = operation === 'topup' ? user.academyId : await academyScope(user, input.academyId);
    const product = PRODUCTS.find(p => p.code === (operation === 'topup' ? 'KAKAO' : input.productCode));
    if (operation !== 'delete') need(product, '등록된 상품을 선택해 주세요.');
    const requestId = String(input.requestId || '');
    need(/^[a-zA-Z0-9-]{20,80}$/.test(requestId), '등록 번호를 확인해 주세요.');
    const payCode = (operation === 'topup' ? 'TOPUP-' : 'MANUAL-') + requestId;
    const result = await prisma.$transaction(async tx => {
      const prior = input.id ? await tx.payment.findUnique({ where: { id: String(input.id) } }) : await tx.payment.findUnique({ where: { payCode } });
      if (!input.id && prior) { need(prior.academyId === academyId, '등록 번호가 이미 사용되었습니다.', 409); return prior; }
      if (input.id) {
        need(prior && !prior.deletedAt && prior.academyId === academyId, '결제 내역을 찾을 수 없습니다.', 404);
        need(prior.payCode.startsWith('MANUAL-') || prior.payCode.startsWith('TOPUP-'), '결제사 승인 내역은 수동으로 변경할 수 없습니다.');
        need(prior.revision === Number(input.revision), '다른 관리자가 수정했습니다. 새로고침해 주세요.', 409);
      }
      const status = operation === 'delete' ? 'CANCELLED' : operation === 'topup' ? 'PENDING' : String(input.status || 'PAID').toUpperCase();
      need(['PAID', 'PENDING', 'CANCELLED'].includes(status), '결제 상태를 확인해 주세요.');
      let data: any;
      if (operation === 'delete') data = { deletedAt: new Date(), status };
      else {
        let amounts;
        try { amounts = paymentAmounts(Number(input.amount), product!.code); } catch (e: any) { need(false, e.message); }
        const start = product!.code === 'KAKAO' ? null : new Date(String(input.startDate));
        const end = product!.code === 'KAKAO' ? null : new Date(String(input.endDate));
        need(!start || (Number.isFinite(+start) && end && Number.isFinite(+end) && end >= start), '서비스 이용 기간을 확인해 주세요.');
        const paidAt = status === 'PAID' ? new Date(String(input.paidAt || new Date().toISOString())) : null;
        need(!paidAt || Number.isFinite(+paidAt), '결제 일시를 확인해 주세요.');
        const payMethod = operation === 'topup' ? 'TRANSFER' : String(input.method);
        need(['TRANSFER', 'CASH', 'CARD', 'OTHER'].includes(payMethod), '수동 결제 수단을 확인해 주세요.');
        data = { productCode: product!.code, productName: product!.name, amount: Number(input.amount), supplyAmount: amounts!.supply, vatAmount: amounts!.vat,
          plan: product!.code === 'KAKAO' ? 'STANDARD' : product!.code, slotCount: product!.slots, serviceStart: start, serviceEnd: end,
          taxInvoiceIssued: operation !== 'topup' && input.taxInvoiceIssued === true, memo: text(input.memo, '메모', 2000), status, paidAt, payMethod };
      }
      const id = prior?.id || payCode;
      // 낙관적 잠금으로 상태 전환과 충전 적립이 한 번만 실행되도록 합니다.
      if (prior) {
        const changed = await tx.payment.updateMany({ where: { id, revision: prior.revision, deletedAt: null }, data: { ...data, revision: { increment: 1 } } });
        need(changed.count === 1, '결제 내역이 변경되었습니다. 새로고침해 주세요.', 409);
      } else await tx.payment.create({ data: { ...data, id, payCode, academyId } });
      const before = prior?.productCode === 'KAKAO' && prior.status === 'PAID' ? (prior.amount || 0) * 10 : 0;
      const after = operation !== 'delete' && product!.code === 'KAKAO' && status === 'PAID' ? data.amount * 10 : 0;
      const delta = after - before;
      if (delta) await changeBalance(tx, academyId, delta, 'payment:' + id + ':' + ((prior?.revision || 0) + 1), delta > 0 ? 'TOPUP' : 'PAYMENT_REVERSAL', id);
      return tx.payment.findUnique({ where: { id } });
    });
    return res.json({ ok: true, id: result?.id, status: result?.status });
  } catch (error) { return failure(res, error); }
}
