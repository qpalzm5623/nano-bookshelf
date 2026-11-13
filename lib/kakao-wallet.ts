import { prisma } from './prisma';
import { need } from './portal-http';
import { KAKAO_UNIT, deliveryOutcome } from './billing-policy';
import { ProxyAgent, fetch as undiciFetch } from 'undici';

/** Vercel 런타임 로그에 전화번호 전체가 노출되지 않도록 가운데 자리를 마스킹합니다. */
export function maskPhone(phone?: string | null): string {
  const digits = String(phone || '').replace(/\D/g, '');
  if (digits.length < 7) return digits ? '***' : '';
  return digits.slice(0, 3) + '****' + digits.slice(-4);
}

// 모든 잔액 변경은 원장 기록과 같은 트랜잭션에서 수행합니다.
export async function changeBalance(tx: any, academyId: string, amount: number, id: string, kind: string, referenceId: string) {
  const changed = await tx.academy.updateMany({ where: { id: academyId, ...(amount < 0 ? { kakaoBalance: { gte: -amount } } : {}) }, data: { kakaoBalance: { increment: amount } } });
  need(changed.count === 1, '카카오톡 잔액이 부족합니다. 충전 후 이용해 주세요.', 409);
  await tx.kakaoLedger.create({ data: { id, academyId, amount, kind, referenceId } });
}

export async function reserveDispatch(data: any, member: any, payload: any, retryOf?: string) {
  const classroom = member.classGroupId ? await prisma.classGroup.findUnique({ where: { id: member.classGroupId }, select: { name: true } }) : null;
  return prisma.$transaction(async tx => {
    const existing = await tx.aligoDispatchLog.findUnique({ where: { id: data.id } });
    if (existing) return { log: existing, duplicate: true };
    need(data.academyId, '발송 학원 정보를 확인해 주세요.');
    await changeBalance(tx, data.academyId, -KAKAO_UNIT, 'debit:' + data.id, 'DISPATCH', data.id);
    const log = await tx.aligoDispatchLog.create({ data: { ...data, memberId: member.id, studentName: member.name, className: classroom?.name || '',
      payload, retryOf, debitAmount: KAKAO_UNIT, cost: 0, status: 'SENDING' } });
    return { log, duplicate: false };
  });
}

export async function settleDispatch(id: string, status: string, details: any = {}) {
  return prisma.$transaction(async tx => {
    const log = await tx.aligoDispatchLog.findUnique({ where: { id } });
    need(log, '발송 이력이 없습니다.', 404);
    // 이미 확정된 결과를 뒤늦은 조회가 덮어쓰거나 두 번 환급하지 못하게 합니다.
    const updated = await tx.aligoDispatchLog.updateMany({ where: { id, status: { in: ['SENDING', 'ACCEPTED', 'UNKNOWN'] } }, data: { status, ...details } });
    if (!updated.count) return;
    if (status === 'FAILED' && log.academyId && log.debitAmount > 0 && !log.refundedAt && !details.fallbackId && !log.fallbackId) {
      await changeBalance(tx, log.academyId, log.debitAmount, 'refund:' + id, 'REFUND', id);
      await tx.aligoDispatchLog.update({ where: { id }, data: { refundedAt: new Date() } });
    }
  });
}

export async function aligoRequest(path: string, fields: Record<string, string>, credentials?: { apikey: string; userid: string }) {
  const auth = credentials || { apikey: process.env.ALIGO_API_KEY || '', userid: process.env.ALIGO_USER_ID || '' };
  need(auth.apikey && auth.userid, '알리고 연동 설정을 확인해 주세요.', 503);
  const options: any = { method: 'POST', body: new URLSearchParams({ ...auth, ...fields }), signal: AbortSignal.timeout(10000) };
  const useProxy = Boolean(process.env.FIXIE_URL);
  if (useProxy) options.dispatcher = new ProxyAgent(process.env.FIXIE_URL!);
  const requestFetch: typeof fetch = useProxy && typeof undiciFetch === 'function' ? (undiciFetch as unknown as typeof fetch) : fetch;
  const response = await requestFetch('https://kakaoapi.aligo.in/akv10/' + path + '/', options);
  if (!response.ok) {
    console.error('[Aligo] api_http_error', { path, httpStatus: response.status, hasProxy: useProxy });
  }
  need(response.ok, '알리고 조회에 실패했습니다.', 502);
  return response.json() as Promise<any>;
}

export async function reconcileDispatches(academyId?: string, credentials?: { apikey: string; userid: string }, cutoff = new Date(Date.now() - 60000)) {
  const logs = await prisma.aligoDispatchLog.findMany({ where: { ...(academyId ? { academyId } : {}), status: { in: ['ACCEPTED', 'UNKNOWN'] }, providerId: { not: null },
    OR: [{ checkedAt: null }, { checkedAt: { lt: cutoff } }] }, orderBy: [{ checkedAt: 'asc' }, { sentAt: 'asc' }], take: 20 });
  if (logs.length > 0) {
    console.info('[Aligo] reconcile_start', { academyId: academyId || 'ALL', count: logs.length });
  }
  // 조회 실패 건은 차감을 유지하고 다음 조회에서 다시 확인합니다.
  await Promise.all(logs.map(async log => {
    let updated = false;
    try {
      const result = await aligoRequest('history/detail', { mid: log.providerId!, limit: '50' }, credentials);
      if (Number(result.code) !== 0 || !Array.isArray(result.list)) {
        console.warn('[Aligo] reconcile_api_rejected', { logId: log.id, providerId: log.providerId, code: result?.code ?? null, message: result?.message ?? null });
        return;
      }
      const targetPhone = log.recipientPhone.replace(/\D/g, '');
      const row = result.list.find((r: any) => String(r.phone || r.receiver || '').replace(/\D/g, '') === targetPhone);
      if (!row) {
        console.warn('[Aligo] reconcile_row_missing', { logId: log.id, providerId: log.providerId, listCount: result.list.length });
        return;
      }
      const status = deliveryOutcome(row);
      const rsltCode = String(row.rslt ?? '');
      const rsltMessage = String(row.rslt_message || '').slice(0, 1000);
      const hasFinalResultText = Boolean(row.rsltdate && !String(row.rsltdate).startsWith('0000') && rsltMessage);
      console[status === 'FAILED' ? 'warn' : 'info']('[Aligo] reconcile_detail', {
        logId: log.id,
        providerId: log.providerId,
        tplCode: row.tpl_code || log.templateCode,
        rslt: rsltCode || null,
        rsltMessage: rsltMessage || null,
        rsltDate: row.rsltdate || null,
        smid: row.smid ?? null,
        status: status || 'PENDING_OR_UNMAPPED',
      });
      // 알리고는 최종 결과를 24시간 후 확인하도록 안내합니다. 대체문자 ID가 늦게
      // 반영되는 동안 실패를 먼저 환급하지 않도록 실패 확정은 이 시점 이후 처리합니다.
      // 단, 알리고가 반환한 실제 실패 코드/사유는 즉시 저장해 원인을 바로 확인할 수 있게 합니다.
      if (status === 'FAILED' && Date.now() - log.sentAt.getTime() < 24 * 3600000) {
        await prisma.aligoDispatchLog.update({ where: { id: log.id }, data: { resultCode: rsltCode, resultMessage: rsltMessage, checkedAt: new Date() } });
        updated = true;
        return;
      }
      if (status) {
        await settleDispatch(log.id, status, { resultCode: rsltCode, resultMessage: rsltMessage, fallbackId: Number(row.smid) > 0 ? String(row.smid) : null, checkedAt: new Date() });
        updated = true;
      } else if (hasFinalResultText) {
        await prisma.aligoDispatchLog.update({ where: { id: log.id }, data: { resultCode: rsltCode, resultMessage: rsltMessage, checkedAt: new Date() } });
        updated = true;
      }
    } finally {
      if (!updated) {
        await prisma.aligoDispatchLog.update({ where: { id: log.id }, data: { checkedAt: new Date() } });
      }
    }
  }).map((p, i) => p.catch(err => {
    console.error('[Aligo] reconcile_exception', {
      logId: logs[i]?.id,
      providerId: logs[i]?.providerId,
      error: err?.cause?.message || err?.message || String(err),
    });
  })));
  return logs.length;
}
