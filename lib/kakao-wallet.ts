import { prisma } from './prisma';
import { need } from './portal-http';
import { KAKAO_UNIT, deliveryOutcome, describePendingAligoRow } from './billing-policy';
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
  need(changed.count === 1, '알리고 잔여 캐시를 확인해주세요.', 409);
  await tx.kakaoLedger.create({ data: { id, academyId, amount, kind, referenceId } });
}

export function isTerminalFailedDispatch(log: any): boolean {
  if (!log) return false;
  if (log.status === 'FAILED') return true;
  if ((log.status === 'ACCEPTED' || log.status === 'UNKNOWN') && log.resultCode && String(log.resultCode) !== '0') {
    const outcome = deliveryOutcome({
      msgid: log.providerId || '1',
      smid: log.fallbackId || '0',
      rsltdate: '2026-01-01 00:00:00',
      rslt: log.resultCode,
      rslt_message: log.resultMessage || '',
    });
    if (outcome === 'FAILED') return true;
  }
  return false;
}

// URL의 리포트 ID로 묶어 본문 수정·수신번호 변경·서로 다른 발송 API로 횟수를 우회하지 못하게 합니다.
export function reportDispatchKey(payload: any): string {
  if (typeof payload?.reportKey === 'string' && /^(quiz|portfolio|literacy):.+/.test(payload.reportKey)) return payload.reportKey;
  try {
    const buttons = JSON.parse(payload?.buttonJson || '{}').button || [];
    for (const button of buttons) {
      for (const href of [button.linkM, button.linkP]) {
        if (!href) continue;
        const url = new URL(href);
        const route = url.pathname.replace(/\.html$/, '');
        const type = route === '/quiz_result' ? 'quiz' : route === '/portfolio_report' ? 'portfolio' : route === '/literacy_report' ? 'literacy' : '';
        const ref = url.searchParams.get(type === 'quiz' ? 'id' : type === 'portfolio' ? 'pf' : 'r');
        if (type && ref) return type + ':' + ref;
      }
    }
  } catch (_) { /* 구형 버튼 없는 기록은 리포트 식별자가 없으므로 합산하지 않습니다. */ }
  return '';
}

export async function reportDispatchHistory(academyId: string, memberId: string, reportKey: string, db: any = prisma) {
  const rows = await db.aligoDispatchLog.findMany({ where: { academyId, memberId }, orderBy: { sentAt: 'desc' },
    select: { id: true, payload: true, status: true, resultCode: true, resultMessage: true, providerId: true, fallbackId: true, sentAt: true } });
  const history = rows.filter((row: any) => reportDispatchKey(row.payload) === reportKey && !isTerminalFailedDispatch(row));
  return { sentCount: history.length, maxSends: 3, remainingSends: Math.max(0, 3 - history.length),
    attemptNumber: history.length + 1, lastSentAt: history[0]?.sentAt || null };
}

export async function reserveDispatch(data: any, member: any, payload: any, retryOf?: string) {
  const classroom = member.classGroupId ? await prisma.classGroup.findUnique({ where: { id: member.classGroupId }, select: { name: true } }) : null;
  return prisma.$transaction(async tx => {
    const reportKey = reportDispatchKey(payload);
    if (reportKey) {
      // 같은 리포트의 동시 요청은 예약·차감이 끝날 때까지 직렬 처리합니다.
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${data.academyId + ':' + reportKey}))`;
    }
    const existing = await tx.aligoDispatchLog.findUnique({ where: { id: data.id } });
    if (existing && !isTerminalFailedDispatch(existing)) return { log: existing, duplicate: true };
    need(data.academyId, '발송 학원 정보를 확인해 주세요.');
    if (reportKey) {
      const history = await reportDispatchHistory(data.academyId, member.id, reportKey, tx);
      need(history.sentCount < 3, '동일 리포트는 최대 3회까지 발송할 수 있습니다. 이미 3회 발송 이력이 있습니다.', 409);
      if (!retryOf) need(payload.attemptNumber === history.attemptNumber, '발송 이력이 변경되었습니다. 발송 버튼을 다시 눌러 확인해 주세요.', 409);
      payload = { ...payload, reportKey, attemptNumber: history.attemptNumber };
    }
    if (existing) {
      if (existing.status !== 'FAILED' && existing.academyId && existing.debitAmount > 0 && !existing.refundedAt && !existing.fallbackId) {
        await changeBalance(tx, existing.academyId, existing.debitAmount, 'refund:' + existing.id + ':re:' + Date.now(), 'REFUND', existing.id);
      }
      const debitId = 'debit:' + data.id + ':retry:' + Date.now();
      await changeBalance(tx, data.academyId, -KAKAO_UNIT, debitId, 'DISPATCH', data.id);
      const updated = await tx.aligoDispatchLog.update({
        where: { id: data.id },
        data: {
          academyId: data.academyId,
          recipientName: data.recipientName,
          recipientPhone: data.recipientPhone,
          templateCode: data.templateCode,
          message: data.message,
          memberId: member.id,
          studentName: member.name,
          className: classroom?.name || '',
          payload,
          retryOf: retryOf || existing.id,
          debitAmount: KAKAO_UNIT,
          cost: 0,
          status: 'SENDING',
          providerId: null,
          resultCode: null,
          resultMessage: null,
          fallbackId: null,
          refundedAt: null,
          checkedAt: null,
          sentAt: new Date(),
        },
      });
      return { log: updated, duplicate: false };
    }
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
      const refundLedgerId = log.retryOf ? ('refund:' + id + ':' + Date.now()) : ('refund:' + id);
      await changeBalance(tx, log.academyId, log.debitAmount, refundLedgerId, 'REFUND', id);
      await tx.aligoDispatchLog.update({ where: { id }, data: { refundedAt: new Date() } });
    }
  });
}

export function normalizeAligoTemplate(tpl: string): string {
  return String(tpl || '').replace(/\\n/g, '\n').replace(/\r\n/g, '\n');
}

export function buildWebLinkButtonJson(
  buttonName: string,
  targetUrl: string,
  linkType = 'WL',
  linkTypeName = '웹링크'
): string {
  return JSON.stringify({
    button: [
      {
        name: buttonName,
        linkType,
        linkTypeName,
        linkM: targetUrl,
        linkP: targetUrl,
      },
    ],
  });
}

export type ResolvedAligoTemplate = {
  content: string;
  buttonName: string;
  emtitle: string;
  hasButtons: boolean;
  linkType: string;
  linkTypeName: string;
  source: 'aligo_sync' | 'config_fallback';
};

const templateCache = new Map<string, { value: ResolvedAligoTemplate; fetchedAt: number }>();

async function postAligoForm(url: string, fields: Record<string, string>, timeoutMs = 10000): Promise<Response> {
  const options: any = { method: 'POST', body: new URLSearchParams(fields), signal: AbortSignal.timeout(timeoutMs) };
  const useProxy = Boolean(process.env.FIXIE_URL);
  if (useProxy) options.dispatcher = new ProxyAgent(process.env.FIXIE_URL!);
  const requestFetch: typeof fetch = useProxy && typeof undiciFetch === 'function' ? (undiciFetch as unknown as typeof fetch) : fetch;
  return requestFetch(url, options);
}

/**
 * 알리고에 승인 등록된 알림톡 템플릿 원문·버튼·강조표기 제목을 조회합니다.
 * FIXIE_URL 프록시 환경(Vercel 운영) 또는 ALIGO_SYNC_TEMPLATE=true일 때 활성화됩니다.
 */
export async function resolveAligoTemplate(
  tplCode: string,
  fallbackMessage: string,
  fallbackButtonName: string,
  credentials?: { apikey: string; userid: string; senderkey?: string }
): Promise<ResolvedAligoTemplate> {
  const fallback: ResolvedAligoTemplate = {
    content: fallbackMessage,
    buttonName: fallbackButtonName,
    emtitle: '',
    hasButtons: true,
    linkType: 'WL',
    linkTypeName: '웹링크',
    source: 'config_fallback',
  };
  const useRemoteTemplate = Boolean(process.env.FIXIE_URL || process.env.ALIGO_SYNC_TEMPLATE === 'true');
  if (!useRemoteTemplate || !tplCode) return fallback;

  const cached = templateCache.get(tplCode);
  if (cached && Date.now() - cached.fetchedAt < 2 * 60 * 1000) {
    return cached.value;
  }

  const apikey = credentials?.apikey || process.env.ALIGO_API_KEY || '';
  const userid = credentials?.userid || process.env.ALIGO_USER_ID || '';
  const senderkey = credentials?.senderkey || process.env.ALIGO_SENDER_KEY || '';
  if (!apikey || !userid || !senderkey) return fallback;

  try {
    const response = await postAligoForm('https://kakaoapi.aligo.in/akv10/template/list/', {
      apikey,
      userid,
      senderkey,
      tpl_code: tplCode,
    }, 5000);
    if (!response.ok) {
      console.warn('[Aligo] template_list_http_error', { tplCode, httpStatus: response.status });
      return fallback;
    }
    const data: any = await response.json();
    if (Number(data?.code) !== 0 || !Array.isArray(data?.list)) {
      console.warn('[Aligo] template_list_error', { tplCode, code: data?.code ?? null, message: data?.message ?? null });
      return fallback;
    }
    const matched = data.list.find((t: any) => String(t?.templtCode || '').trim() === tplCode);
    if (!matched) {
      console.warn('[Aligo] template_list_miss', {
        tplCode,
        listCount: data.list.length,
        returnedCodes: data.list.slice(0, 10).map((t: any) => t?.templtCode).filter(Boolean),
      });
      return fallback;
    }
    const rawContent = String(matched?.templtContent || '').replace(/\r\n/g, '\n');
    const buttons = Array.isArray(matched?.buttons) ? matched.buttons : null;
    const hasButtons = buttons ? buttons.length > 0 : true;
    const firstBtn = buttons && buttons[0] ? buttons[0] : null;
    const rawBtnName = firstBtn?.name ? String(firstBtn.name).trim() : fallbackButtonName;
    const emtitle = matched?.templateEmType === 'TEXT' && matched?.templtTitle
      ? String(matched.templtTitle).trim()
      : '';
    if (!rawContent) {
      console.warn('[Aligo] template_list_empty_content', { tplCode, inspStatus: matched?.inspStatus ?? null });
      return fallback;
    }
    const resolved: ResolvedAligoTemplate = {
      content: rawContent,
      buttonName: rawBtnName || fallbackButtonName,
      emtitle,
      hasButtons,
      linkType: String(firstBtn?.linkType || 'WL').trim() || 'WL',
      linkTypeName: String(firstBtn?.linkTypeName || '웹링크').trim() || '웹링크',
      source: 'aligo_sync',
    };
    templateCache.set(tplCode, { value: resolved, fetchedAt: Date.now() });
    return resolved;
  } catch (err: any) {
    console.warn('[Aligo] template_list_fallback', { tplCode, error: err?.message || String(err) });
    return fallback;
  }
}

/** 알리고 발송 API 응답을 해석합니다. code=0이어도 유효 접수(scnt)=0 & 실패(fcnt)>0이면 즉시 실패로 판정합니다. */
export function classifyAligoSendResponse(httpOk: boolean, result: any): {
  status: 'ACCEPTED' | 'FAILED' | 'UNKNOWN';
  providerId: string | null;
  resultCode: string;
  resultMessage: string;
} {
  const codeNum = result?.code == null ? NaN : Number(result.code);
  const scnt = result?.info?.scnt == null ? null : Number(result.info.scnt);
  const fcnt = result?.info?.fcnt == null ? null : Number(result.info.fcnt);
  const zeroValidAccepted = fcnt != null && fcnt > 0 && (scnt == null || scnt === 0);
  const accepted = httpOk && codeNum === 0 && !zeroValidAccepted;
  const rejected = httpOk && ((Number.isFinite(codeNum) && codeNum < 0) || (codeNum === 0 && zeroValidAccepted));
  const status: 'ACCEPTED' | 'FAILED' | 'UNKNOWN' = accepted ? 'ACCEPTED' : rejected ? 'FAILED' : 'UNKNOWN';
  const providerId = accepted && result?.info?.mid ? String(result.info.mid) : null;
  const resultCode = zeroValidAccepted && codeNum === 0 ? 'FCNT' : String(result?.code ?? '');
  const rawMsg = String(result?.message || '').slice(0, 1000);
  const resultMessage = zeroValidAccepted && (!rawMsg || /성공|정상/.test(rawMsg))
    ? `수신번호 오류 등으로 발송 대상이 모두 거절되었습니다 (fcnt:${fcnt}, scnt:${scnt ?? 0})`
    : rawMsg;
  return { status, providerId, resultCode, resultMessage };
}

function normalizeKrPhoneDigits(phone: any): string {
  const digits = String(phone || '').replace(/\D/g, '');
  return digits.startsWith('82') && digits.length >= 11 ? '0' + digits.slice(2) : digits;
}

function kstYmd(date: Date): string {
  return new Date(date.getTime() + 9 * 3600000).toISOString().slice(0, 10).replace(/-/g, '');
}

export async function aligoRequest(path: string, fields: Record<string, string>, credentials?: { apikey: string; userid: string }) {
  const auth = credentials || { apikey: process.env.ALIGO_API_KEY || '', userid: process.env.ALIGO_USER_ID || '' };
  need(auth.apikey && auth.userid, '알리고 연동 설정을 확인해 주세요.', 503);
  const useProxy = Boolean(process.env.FIXIE_URL);
  const response = await postAligoForm('https://kakaoapi.aligo.in/akv10/' + path + '/', { ...auth, ...fields }, 10000);
  if (!response.ok) {
    console.error('[Aligo] api_http_error', { path, httpStatus: response.status, hasProxy: useProxy });
  }
  need(response.ok, '알리고 조회에 실패했습니다.', 502);
  return response.json() as Promise<any>;
}

export async function reconcileDispatches(
  academyId?: string,
  credentials?: { apikey: string; userid: string },
  cutoff = new Date(Date.now() - 60000),
  diagnosticsOut?: Record<string, string>
) {
  const logs = await prisma.aligoDispatchLog.findMany({
    where: {
      ...(academyId ? { academyId } : {}),
      status: { in: ['ACCEPTED', 'UNKNOWN'] },
      providerId: { not: null },
      OR: [{ checkedAt: null }, { checkedAt: { lt: cutoff } }],
    },
    orderBy: [{ checkedAt: 'asc' }, { sentAt: 'asc' }],
    take: 20,
  });
  if (logs.length > 0) {
    console.info('[Aligo] reconcile_start', { academyId: academyId || 'ALL', count: logs.length });
  }

  let settledCount = 0;
  let detailUpdatedCount = 0;
  let pendingCount = 0;
  const auth = credentials || { apikey: process.env.ALIGO_API_KEY || '', userid: process.env.ALIGO_USER_ID || '' };
  const listBatchCache = new Map<string, Promise<any[] | null>>();
  const fetchHistoryList = (sentAt: Date): Promise<any[] | null> => {
    const startdate = kstYmd(new Date(sentAt.getTime() - 86400000));
    const enddate = kstYmd(new Date(Math.min(Date.now(), sentAt.getTime() + 86400000)));
    const key = `${startdate}_${enddate}`;
    if (!listBatchCache.has(key)) {
      listBatchCache.set(key, (async () => {
        try {
          if (!auth.apikey || !auth.userid) return null;
          const res = await postAligoForm('https://kakaoapi.aligo.in/akv10/history/list/', {
            apikey: auth.apikey,
            userid: auth.userid,
            startdate,
            enddate,
            limit: '100',
          }, 8000);
          if (!res.ok) return null;
          const data: any = await res.json();
          return Number(data?.code) === 0 && Array.isArray(data?.list) ? data.list : null;
        } catch {
          return null;
        }
      })());
    }
    return listBatchCache.get(key)!;
  };

  // 조회 실패 건은 차감을 유지하고 다음 조회에서 다시 확인합니다.
  await Promise.all(logs.map(async log => {
    let updated = false;
    try {
      const result = await aligoRequest('history/detail', { mid: log.providerId!, limit: '50' }, credentials);
      if (Number(result.code) !== 0 || !Array.isArray(result.list)) {
        console.warn('[Aligo] reconcile_api_rejected', { logId: log.id, providerId: log.providerId, code: result?.code ?? null, message: result?.message ?? null });
        pendingCount += 1;
        return;
      }
      const targetPhone = normalizeKrPhoneDigits(log.recipientPhone);
      const row = result.list.find((r: any) => normalizeKrPhoneDigits(r.phone || r.receiver) === targetPhone);
      if (!row) {
        const listRows = await fetchHistoryList(log.sentAt);
        const summaryRow = listRows?.find((item: any) => String(item?.mid ?? '').trim() === String(log.providerId).trim()) || null;
        const batchFailed = Boolean(summaryRow && Number(summaryRow.fcnt) > 0 && Number(summaryRow.scnt || 0) === 0);
        const pendingDesc = describePendingAligoRow(undefined, summaryRow);
        if (diagnosticsOut && pendingDesc) diagnosticsOut[log.id] = pendingDesc;
        console[batchFailed ? 'warn' : 'info']('[Aligo] reconcile_row_missing', {
          logId: log.id,
          providerId: log.providerId,
          listCount: result.list.length,
          samplePhone: result.list[0] ? maskPhone(result.list[0].phone || result.list[0].receiver) : null,
          reserveState: summaryRow?.reserve_state ?? null,
          scnt: summaryRow?.scnt ?? null,
          fcnt: summaryRow?.fcnt ?? null,
          failCnt: summaryRow?.fail_cnt ?? null,
        });
        if (batchFailed && pendingDesc) {
          if (Date.now() - log.sentAt.getTime() < 24 * 3600000) {
            await prisma.aligoDispatchLog.update({ where: { id: log.id }, data: { resultCode: 'FCNT', resultMessage: pendingDesc, checkedAt: new Date() } });
            detailUpdatedCount += 1;
          } else {
            await settleDispatch(log.id, 'FAILED', { resultCode: 'FCNT', resultMessage: pendingDesc, checkedAt: new Date() });
            settledCount += 1;
          }
          updated = true;
        } else {
          pendingCount += 1;
        }
        return;
      }
      const status = deliveryOutcome(row);
      const rsltCode = String(row.rslt ?? '');
      const rsltMessage = String(row.rslt_message || '').slice(0, 1000);
      const hasFinalResultText = Boolean(row.rsltdate && !String(row.rsltdate).startsWith('0000') && rsltMessage);
      let summaryRow: any = null;
      if (!status) {
        const listRows = await fetchHistoryList(log.sentAt);
        summaryRow = listRows?.find((item: any) => String(item?.mid ?? '').trim() === String(log.providerId).trim()) || null;
        const pendingDesc = describePendingAligoRow(row, summaryRow);
        if (diagnosticsOut && pendingDesc) diagnosticsOut[log.id] = pendingDesc;
      }
      console[status === 'FAILED' ? 'warn' : 'info']('[Aligo] reconcile_detail', {
        logId: log.id,
        providerId: log.providerId,
        tplCode: row.tpl_code || log.templateCode,
        msgid: row.msgid || null,
        aligoStatus: row.status ?? null,
        msgType: row.type || null,
        reqDate: row.reqdate || null,
        sentDate: row.sentdate || null,
        rslt: rsltCode || null,
        rsltMessage: rsltMessage || null,
        rsltDate: row.rsltdate || null,
        reportDate: row.reportdate || null,
        smid: row.smid ?? null,
        ...(summaryRow ? {
          reserveState: summaryRow.reserve_state ?? null,
          scnt: summaryRow.scnt ?? null,
          fcnt: summaryRow.fcnt ?? null,
          failCnt: summaryRow.fail_cnt ?? null,
        } : {}),
        status: status || 'PENDING_OR_UNMAPPED',
      });
      // 알리고는 최종 결과를 24시간 후 확인하도록 안내합니다. 대체문자 ID가 늦게
      // 반영되는 동안 실패를 먼저 환급하지 않도록 실패 확정은 이 시점 이후 처리합니다.
      // 단, 알리고가 반환한 실제 실패 코드/사유는 즉시 저장해 원인을 바로 확인할 수 있게 합니다.
      if (status === 'FAILED' && Date.now() - log.sentAt.getTime() < 24 * 3600000) {
        await prisma.aligoDispatchLog.update({ where: { id: log.id }, data: { resultCode: rsltCode, resultMessage: rsltMessage, checkedAt: new Date() } });
        detailUpdatedCount += 1;
        updated = true;
        return;
      }
      if (status) {
        await settleDispatch(log.id, status, { resultCode: rsltCode, resultMessage: rsltMessage, fallbackId: Number(row.smid) > 0 ? String(row.smid) : null, checkedAt: new Date() });
        settledCount += 1;
        updated = true;
      } else if (hasFinalResultText) {
        await prisma.aligoDispatchLog.update({ where: { id: log.id }, data: { resultCode: rsltCode, resultMessage: rsltMessage, checkedAt: new Date() } });
        detailUpdatedCount += 1;
        pendingCount += 1;
        updated = true;
      } else {
        pendingCount += 1;
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
  if (logs.length > 0) {
    console.info('[Aligo] reconcile_summary', {
      academyId: academyId || 'ALL',
      queriedCount: logs.length,
      settledCount,
      detailUpdatedCount,
      pendingCount,
    });
  }
  return logs.length;
}
