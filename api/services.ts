import { dispatchDate, dispatchTemplate } from '../lib/dispatch-view';
import { prisma } from '../lib/prisma';
import { reserveDispatch, settleDispatch, reconcileDispatches, maskPhone } from '../lib/kakao-wallet';
import { KAKAO_UNIT } from '../lib/billing-policy';
import { authenticate, staff, need, failure } from '../lib/portal-http';
import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
import { ProxyAgent, fetch as undiciFetch } from 'undici';

const fixieUrl = process.env.FIXIE_URL;
const proxyDispatcher = fixieUrl ? new ProxyAgent(fixieUrl) : undefined;
const aligoFetch: typeof fetch = proxyDispatcher && typeof undiciFetch === 'function' ? (undiciFetch as unknown as typeof fetch) : fetch;

const ALIGO_API_KEY = process.env.ALIGO_API_KEY || 'ypjr7m6tjjjhri2dsz3fz9sdancwcsro';
const ALIGO_USER_ID = process.env.ALIGO_USER_ID || 'min5k';
const ALIGO_SENDER_KEY = process.env.ALIGO_SENDER_KEY || 'f1aa2df93adcc25d366d0089499d8b27a7a5ef27';
const ALIGO_SENDER = process.env.ALIGO_SENDER || '01071414186';

// 1. 북퀴즈 이력/결과 알림톡 템플릿 코드 & 기본 템플릿
const ALIGO_QUIZ_TEMPLATE_CODE = process.env.ALIGO_TEMPLATE_CODE || 'TT_4291';
const ALIGO_QUIZ_TEMPLATE = process.env.ALIGO_REPORT_TEMPLATE ||
  '#{학생명} 학생이\n#{활동일}에 \'#{도서명}\'을 읽고\n북퀴즈를 완료했어요!\n\n우리 아이의 독서 이해도를 확인해보세요~\n\n[북퀴즈결과 확인]';

// 2. 독서 포트폴리오 알림톡 템플릿 코드 & 기본 템플릿
const ALIGO_PORTFOLIO_TEMPLATE_CODE = process.env.ALIGO_PORTFOLIO_TEMPLATE_CODE || 'TT_4290';
const ALIGO_PORTFOLIO_TEMPLATE = process.env.ALIGO_PORTFOLIO_TEMPLATE ||
  '#{학생명} 학생이\n#{시작일}부터 #{종료일}까지\n총 #{도서수}권의 책을 읽고 독서 활동을 완료했어요!\n\n차곡차곡 쌓인 우리 아이의 독서 성장 기록을 확인해보세요~\n\n[포트폴리오 확인]';

// 3. 문해력 진단 결과 알림톡 템플릿 코드 & 기본 템플릿
const ALIGO_LITERACY_TEMPLATE_CODE = process.env.ALIGO_LITERACY_TEMPLATE_CODE || 'TT_4292';
const ALIGO_LITERACY_TEMPLATE = process.env.ALIGO_LITERACY_TEMPLATE ||
  '#{학생명} 학생이\n#{진단일}에 문해력 진단을 완료했어요!\n\n우리 아이의 글 읽기와 이해 능력은 어느 정도일까요?\n진단 결과를 확인해보세요~\n\n[진단 결과 확인]';

// 학부모 비로그인 열람용 HMAC 서명 토큰 생성 & 검증
function generatePublicToken(id: string): string {
  const secret = process.env.PORTAL_AUTH_SECRET || 'nano-bookshelf-public-secret-key-2026';
  return createHmac('sha256', secret).update(id).digest('hex').slice(0, 24);
}

function verifyPublicToken(id: string, token: string): boolean {
  try {
    const expected = generatePublicToken(id);
    const a = Buffer.from(expected);
    const b = Buffer.from(String(token || ''));
    return a.length === b.length && timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

// 24시간 형식 날짜시간 포맷터: "2026년 11월 09일 14:30"
function formatKstDateTime24(dateInput: any): string {
  if (!dateInput) return '';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return String(dateInput);
  const kst = new Date(d.getTime() + 9 * 3600000);
  const yyyy = kst.getUTCFullYear();
  const mm = String(kst.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(kst.getUTCDate()).padStart(2, '0');
  const hh = String(kst.getUTCHours()).padStart(2, '0');
  const min = String(kst.getUTCMinutes()).padStart(2, '0');
  return `${yyyy}년 ${mm}월 ${dd}일 ${hh}:${min}`;
}

function getBaseHost(req: any): string {
  const host = String(req.headers.host || '').trim();
  // 실운영 도메인이거나 Vercel 환경일 때 nanosbook.co.kr 기본 보장
  if (host.includes('nanosbook.co.kr') || host.includes('vercel.app')) {
    return 'https://nanosbook.co.kr';
  }
  const proto = String(req.headers['x-forwarded-proto'] || 'https').split(',')[0];
  return `${proto}://${host || 'nanosbook.co.kr'}`;
}

export default async function handler(req: any, res: any) {
  res.setHeader('Cache-Control', 'no-store');
  const action = String(req.query.action || '');

  try {
    // -------------------------------------------------------------
    // 비로그인 학부모 전용 공개 리포트 열람 API
    // -------------------------------------------------------------
    if (action === 'public_quiz_result') {
      const id = String(req.query.id || '');
      const token = String(req.query.t || '');
      need(id && verifyPublicToken(id, token), '유효하지 않거나 만료된 리포트 링크입니다.', 403);

      const log = await prisma.quizAttempt.findUnique({
        where: { id },
        include: {
          member: { select: { id: true, name: true, academy: { select: { name: true } } } },
        },
      });
      need(log, '북퀴즈 결과를 찾을 수 없습니다.', 404);

      const book = await prisma.book.findFirst({
        where: { OR: [{ id: log.bookId }, { bookNo: log.bookId }] },
      });

      const details: any = log.answers || {};
      const charSetting = await prisma.portalSetting.findUnique({ where: { key: 'character:' + log.memberId } });
      const charId = (charSetting?.value as any)?.characterId || 'nano';

      return res.json({
        attempt: {
          id: log.id,
          score: log.score,
          correctCount: log.correctCount || 0,
          totalQuestions: details.totalQuestions || (Array.isArray(details.quizResults) ? details.quizResults.length : 5),
          earnedPoints: Number((details && details.earnedPoints) || 0),
          completedDate: formatKstDateTime24(log.completedAt),
          characterId: charId,
          characterStage: 1,
        },
        book: {
          id: book?.bookNo || log.bookId,
          title: book?.title || '선택 도서',
          cover: book?.coverUrl || '',
          readingGenre: book?.subCategory === 'C' ? '비문학/정보글' : book?.subCategory === 'B' ? '인물 이야기' : '문학/이야기',
          grade: book?.grade || '',
        },
        student: {
          name: log.member.name,
          academyName: log.member.academy?.name || '나노의책장',
        },
        thoughtQuestion: details.thoughtQuestion || '',
        thoughtAnswer: details.thoughtHidden ? '' : (log.thinkReply || ''),
        comment: details.thoughtHidden ? '' : (details.comment || ''),
      });
    }

    if (action === 'public_portfolio') {
      const pfId = String(req.query.pf || '');
      const token = String(req.query.t || '');
      need(pfId && verifyPublicToken(pfId, token), '유효하지 않거나 만료된 포트폴리오 링크입니다.', 403);

      const row = await prisma.portalSetting.findUnique({ where: { key: pfId } });
      need(row, '포트폴리오를 찾을 수 없습니다.', 404);
      const val = row.value as any;

      const member = val.memberId
        ? await prisma.member.findUnique({ where: { id: val.memberId }, select: { academy: { select: { name: true } } } })
        : null;

      return res.json({
        portfolio: {
          id: row.key,
          name: val.name,
          academyName: member?.academy?.name || '나노의책장',
          grade: val.grade || '',
          classGroup: val.classGroup || '',
          teacher: val.teacher || '',
          from: val.from || '',
          to: val.to || '',
          bookCount: Array.isArray(val.books) ? val.books.length : (val.bookCount || 0),
          quizAvg: val.quizAvg ?? null,
          books: val.books || [],
          aiInsights: val.aiInsights || val.insights || [],
          aiComments: val.aiComments || [],
          comment: val.comment || val.aiTeacherNote || val.teacherNote || '',
        },
      });
    }

    // -------------------------------------------------------------
    // 관리자/교사 전용: 알림톡 발송 및 미리보기 API
    // -------------------------------------------------------------
    const user = await authenticate(req);
    staff(user);

    const aligoReady = process.env.ALIGO_ENABLED !== 'false' && Boolean(process.env.ALIGO_API_KEY && process.env.ALIGO_USER_ID && process.env.ALIGO_SENDER_KEY && process.env.ALIGO_SENDER);
    if (req.method === 'GET') {
      if (action === 'dispatch_stats') {
        const refreshCutoff = String(req.query.refresh || '') === '1' ? new Date(Date.now() - 3000) : undefined;
        const reconciledCount = await reconcileDispatches(user.role === 'MASTER' ? undefined : user.academyId, { apikey: ALIGO_API_KEY, userid: ALIGO_USER_ID }, refreshCutoff);
        const wallet = await prisma.academy.findUnique({ where: { id: user.academyId } });
        const where = user.role === 'MASTER' ? {} : { academyId: user.academyId };
        const month = new Date(Date.now() + 9 * 3600000).toISOString().slice(0, 7);
        const [total, monthly, success, failed] = await Promise.all([
          prisma.aligoDispatchLog.count({ where }),
          prisma.aligoDispatchLog.count({ where: { ...where, sentAt: { gte: new Date(month + '-01T00:00:00+09:00') } } }),
          prisma.aligoDispatchLog.count({ where: { ...where, status: { in: ['SUCCESS', 'SMS_FALLBACK'] } } }),
          prisma.aligoDispatchLog.count({ where: { ...where, status: 'FAILED' } }),
        ]);
        const logs = await prisma.aligoDispatchLog.findMany({ where, include: { academy: true }, orderBy: { sentAt: 'desc' } });
        const items = logs.map(d => ({ id: d.id, datetime: dispatchDate(d.sentAt), date: dispatchDate(d.sentAt), academyId: d.academy?.code || '', academyName: d.academy?.name || '삭제된 학원', ...dispatchTemplate(d.id, d.templateCode), className: d.className || '', studentName: d.studentName || '', receiverName: d.studentName ? `${d.studentName} / ${d.recipientName} (학부모)` : d.recipientName, receiverPhone: d.recipientPhone, receiver: d.recipientName, summary: d.message, status: d.status, providerId: d.providerId || '', code: d.resultCode || '', resultMessage: d.resultMessage || '', canRetry: d.status === 'FAILED' && !!d.payload && !!d.memberId }));
        let connected = false;
        let remainingCount: number | null = null;
        let aligoMessage = '';
        try {
          const options: any = { method: 'POST', body: new URLSearchParams({ apikey: ALIGO_API_KEY, userid: ALIGO_USER_ID }), signal: AbortSignal.timeout(8000) };
          if (proxyDispatcher) options.dispatcher = proxyDispatcher;
          const response = await aligoFetch('https://kakaoapi.aligo.in/akv10/heartinfo/', options);
          const result: any = await response.json();
          connected = response.ok && Number(result.code ?? result.result_code ?? -1) >= 0;
          aligoMessage = String(result.message || '').trim();
          const raw = result.list?.ALT_CNT ?? result.ALT_CNT;
          if (user.role === 'MASTER' && connected && raw != null && Number.isSafeInteger(Number(raw)) && Number(raw) >= 0) remainingCount = Number(raw);
        } catch (err: any) {
          /* 조회 실패 시 임의의 잔액을 표시하지 않고 오류 사유만 기록합니다. */
          aligoMessage = String(err?.cause?.message || err?.message || '알리고 API 통신 실패').slice(0, 120);
          console.error('[Aligo] heartinfo_error', { error: aligoMessage, hasProxy: Boolean(proxyDispatcher) });
        }
        console[connected ? 'info' : 'warn']('[Aligo] dispatch_stats', { role: user.role, academyId: user.academyId, reconciledCount, total, success, failed, connected, aligoMessage, remainingCount });
        return res.json({ items, total, monthly, success, failed, pending: total - success - failed, connected, aligoMessage, balance: (wallet?.kakaoBalance || 0) / 10, walletCount: Math.floor((wallet?.kakaoBalance || 0) / KAKAO_UNIT),
          ...(user.role === 'MASTER' ? { remainingCount, estimatedCash: remainingCount == null ? null : remainingCount * 6.5, unitCost: 6.5 } : {}) });
      }
      return res.json({ aligoReady });
    }

    need(aligoReady, '알림톡 운영 설정(API Key, 발신번호 등)이 완료되지 않았습니다.', 503);
    const body = req.body || {};
    console.info('[Aligo] request', { action: body.action || action, type: body.type || 'quiz', userId: user.id, academyId: user.academyId, role: user.role });
    if (body.action === 'retry') {
      const previous = await prisma.aligoDispatchLog.findFirst({ where: { id: String(body.id || ''), ...(user.role === 'MASTER' ? {} : { academyId: user.academyId }) } });
      need(previous && previous.status === 'FAILED' && previous.memberId && previous.payload, '재발송 가능한 실패 이력이 아닙니다.', 409);
      const member = await prisma.member.findFirst({ where: { id: previous.memberId, academyId: previous.academyId!, status: 'APPROVED' } });
      need(member && member.reportYn && member.parentPhone?.replace(/\D/g, '') === previous.recipientPhone.replace(/\D/g, ''), '현재 보호자 연락처와 발송 동의를 확인해 주세요.');
      const payload = previous.payload as any;
      const id = 'retry_' + createHash('sha256').update(previous.id).digest('hex');
      const reserved = await reserveDispatch({ id, academyId: previous.academyId, recipientName: previous.recipientName, recipientPhone: previous.recipientPhone, templateCode: previous.templateCode, message: previous.message }, member, payload, previous.id);
      if (reserved.duplicate) return duplicateResponse(res, reserved.log, 'retry');
      return dispatchAligo(id, previous.recipientPhone, member.name, payload.subject, previous.message, previous.templateCode, payload.buttonJson, res);
    }
    const type = String(body.type || 'quiz'); // 'quiz' | 'portfolio' | 'literacy'

    const baseHost = getBaseHost(req);

    // =============================================================
    // 1. 북퀴즈 이력/결과 알림톡
    // =============================================================
    if (type === 'quiz') {
      const log = await prisma.quizAttempt.findFirst({
        where: { id: body.logId || '', ...(user.role === 'MASTER' ? {} : { member: { academyId: user.academyId } }) },
        include: { member: true },
      });
      need(log, '학습 기록을 찾을 수 없습니다.', 404);
      need(log.member.reportYn && log.member.parentPhone, '학부모 연락처와 리포트 발송 동의를 확인해 주세요.');

      const book = await prisma.book.findFirst({
        where: { OR: [{ id: log.bookId }, { bookNo: log.bookId }] },
      });

      const phone = log.member.parentPhone!.replace(/\D/g, '');
      need(/^0\d{8,10}$/.test(phone), '학부모 연락처 형식을 확인해 주세요.');

      const token = generatePublicToken(log.id);
      const targetUrl = `${baseHost}/quiz_result.html?id=${encodeURIComponent(log.id)}&t=${token}`;
      const activityDate = formatKstDateTime24(log.completedAt);

      const substitutions: Record<string, string> = {
        '학생명': log.member.name,
        '활동일': activityDate,
        '도서명': book?.title || '선택 도서',
      };

      const message = ALIGO_QUIZ_TEMPLATE.replace(/#\{([^}]+)\}/g, (_, key) => substitutions[key] || '');
      const buttonJson = JSON.stringify({
        button: [
          {
            name: '북퀴즈결과 확인',
            linkType: 'WL',
            linkTypeName: '웹링크',
            linkM: targetUrl,
            linkP: targetUrl,
          },
        ],
      });

      const fingerprint = createHash('sha256')
        .update(JSON.stringify([log.id, phone, message, ALIGO_QUIZ_TEMPLATE_CODE]))
        .digest('hex');

      if (body.action === 'preview') {
        console.info('[Aligo] preview', { type: 'quiz', refId: log.id, tplCode: ALIGO_QUIZ_TEMPLATE_CODE, recipient: maskPhone(phone), messageLength: message.length });
        return res.json({
          message,
          recipient: phone,
          name: log.member.parentName || (log.member.name + ' 보호자'),
          targetUrl,
          fingerprint,
        });
      }

      need(body.action === 'send' && body.fingerprint === fingerprint, '발송 전 최신 리포트 내용을 확인해 주세요.', 409);
      const id = 'quiz_' + fingerprint;
      const existing = await prisma.aligoDispatchLog.findUnique({ where: { id } });
      if (existing) return duplicateResponse(res, existing, 'quiz');

      const reserved = await reserveDispatch({ id, academyId: log.member.academyId, recipientName: log.member.parentName || log.member.name, recipientPhone: phone, templateCode: ALIGO_QUIZ_TEMPLATE_CODE, message }, log.member, { buttonJson, subject: '북퀴즈 결과 리포트' });
      if (reserved.duplicate) return duplicateResponse(res, reserved.log, 'quiz');

      return await dispatchAligo(id, phone, log.member.name, '북퀴즈 결과 리포트', message, ALIGO_QUIZ_TEMPLATE_CODE, buttonJson, res);
    }

    // =============================================================
    // 2. 독서 포트폴리오 알림톡
    // =============================================================
    if (type === 'portfolio') {
      const pfId = String(body.pfId || '').trim();
      need(pfId, '포트폴리오 ID를 확인해 주세요.');

      const row = await prisma.portalSetting.findUnique({ where: { key: pfId } });
      need(row, '포트폴리오 정보를 찾을 수 없습니다.', 404);
      const pfData = row.value as any;

      const student = await prisma.member.findFirst({
        where: { id: pfData.memberId, ...(user.role === 'MASTER' ? {} : { academyId: user.academyId }) },
      });
      need(student, '원생 정보를 찾을 수 없습니다.', 404);
      need(student.reportYn && student.parentPhone, '학부모 연락처와 포트폴리오 발송 동의를 확인해 주세요.');

      const phone = student.parentPhone!.replace(/\D/g, '');
      need(/^0\d{8,10}$/.test(phone), '학부모 연락처 형식을 확인해 주세요.');

      const token = generatePublicToken(pfId);
      const targetUrl = `${baseHost}/portfolio_report.html?pf=${encodeURIComponent(pfId)}&t=${token}`;
      const bookCount = Array.isArray(pfData.books) ? pfData.books.length : (pfData.bookCount || 0);

      const substitutions: Record<string, string> = {
        '학생명': student.name,
        '시작일': pfData.from || '기간 시작일',
        '종료일': pfData.to || '기간 종료일',
        '도서수': String(bookCount),
      };

      const message = ALIGO_PORTFOLIO_TEMPLATE.replace(/#\{([^}]+)\}/g, (_, key) => substitutions[key] || '');
      const buttonJson = JSON.stringify({
        button: [
          {
            name: '포트폴리오 확인',
            linkType: 'WL',
            linkTypeName: '웹링크',
            linkM: targetUrl,
            linkP: targetUrl,
          },
        ],
      });

      const fingerprint = createHash('sha256')
        .update(JSON.stringify([pfId, phone, message, ALIGO_PORTFOLIO_TEMPLATE_CODE]))
        .digest('hex');

      if (body.action === 'preview') {
        console.info('[Aligo] preview', { type: 'portfolio', refId: pfId, tplCode: ALIGO_PORTFOLIO_TEMPLATE_CODE, recipient: maskPhone(phone), messageLength: message.length });
        return res.json({
          message,
          recipient: phone,
          name: student.parentName || (student.name + ' 보호자'),
          targetUrl,
          fingerprint,
        });
      }

      need(body.action === 'send' && body.fingerprint === fingerprint, '발송 전 최신 포트폴리오 내용을 확인해 주세요.', 409);
      const id = 'pf_' + fingerprint;
      const existing = await prisma.aligoDispatchLog.findUnique({ where: { id } });
      if (existing) return duplicateResponse(res, existing, 'portfolio');

      const reserved = await reserveDispatch({ id, academyId: student.academyId, recipientName: student.parentName || student.name, recipientPhone: phone, templateCode: ALIGO_PORTFOLIO_TEMPLATE_CODE, message }, student, { buttonJson, subject: '독서 성장 포트폴리오' });
      if (reserved.duplicate) return duplicateResponse(res, reserved.log, 'portfolio');

      return await dispatchAligo(id, phone, student.name, '독서 성장 포트폴리오', message, ALIGO_PORTFOLIO_TEMPLATE_CODE, buttonJson, res);
    }

    // =============================================================
    // 3. 문해력 진단 결과 알림톡
    // =============================================================
    if (type === 'literacy') {
      const recordId = String(body.recordId || '').trim();
      need(recordId, '문해력 진단 ID를 확인해 주세요.');

      const recordRow = await prisma.portalSetting.findUnique({ where: { key: 'literacy_result:' + recordId } });
      need(recordRow, '문해력 결과지를 찾을 수 없습니다.', 404);
      const record = recordRow.value as any;

      const member = await prisma.member.findFirst({
        where: { id: record.memberId, ...(user.role === 'MASTER' ? {} : { academyId: user.academyId }) },
      });
      need(member, '원생 정보를 찾을 수 없습니다.', 404);
      need(member.reportYn && member.parentPhone, '학부모 연락처와 진단 결과 발송 동의를 확인해 주세요.');

      const phone = member.parentPhone!.replace(/\D/g, '');
      need(/^0\d{8,10}$/.test(phone), '학부모 연락처 형식을 확인해 주세요.');

      const secret = process.env.PORTAL_AUTH_SECRET || 'nano-bookshelf-public-secret-key-2026';
      const token = createHmac('sha256', secret).update(recordId).digest('hex').slice(0, 24);
      const targetUrl = `${baseHost}/literacy_report.html?r=${encodeURIComponent(recordId)}&t=${token}`;
      const diagDate = formatKstDateTime24(record.finishedAt);

      const substitutions: Record<string, string> = {
        '학생명': member.name,
        '진단일': diagDate,
      };

      const message = ALIGO_LITERACY_TEMPLATE.replace(/#\{([^}]+)\}/g, (_, key) => substitutions[key] || '');
      const buttonJson = JSON.stringify({
        button: [
          {
            name: '진단 결과 확인',
            linkType: 'WL',
            linkTypeName: '웹링크',
            linkM: targetUrl,
            linkP: targetUrl,
          },
        ],
      });

      const fingerprint = createHash('sha256')
        .update(JSON.stringify([recordId, phone, message, ALIGO_LITERACY_TEMPLATE_CODE]))
        .digest('hex');

      if (body.action === 'preview') {
        console.info('[Aligo] preview', { type: 'literacy', refId: recordId, tplCode: ALIGO_LITERACY_TEMPLATE_CODE, recipient: maskPhone(phone), messageLength: message.length });
        return res.json({
          message,
          recipient: phone,
          name: member.parentName || (member.name + ' 보호자'),
          targetUrl,
          fingerprint,
        });
      }

      need(body.action === 'send' && body.fingerprint === fingerprint, '발송 전 최신 진단 결과 내용을 확인해 주세요.', 409);
      const id = 'lit_' + fingerprint;
      const existing = await prisma.aligoDispatchLog.findUnique({ where: { id } });
      if (existing) return duplicateResponse(res, existing, 'literacy');

      const reserved = await reserveDispatch({ id, academyId: member.academyId, recipientName: member.parentName || member.name, recipientPhone: phone, templateCode: ALIGO_LITERACY_TEMPLATE_CODE, message }, member, { buttonJson, subject: '문해력 진단 결과지' });
      if (reserved.duplicate) return duplicateResponse(res, reserved.log, 'literacy');

      return await dispatchAligo(id, phone, member.name, '문해력 진단 결과지', message, ALIGO_LITERACY_TEMPLATE_CODE, buttonJson, res);
    }

    throw new Error('지원하지 않는 알림톡 유형입니다.');
  } catch (error: any) {
    if (error && typeof error === 'object' && 'status' in error) {
      console.warn('[Services] request_rejected', { action: String(req.query?.action || req.body?.action || ''), status: error.status, message: error.message });
    }
    return failure(res, error);
  }
}

function duplicateResponse(res: any, existing: any, type: string) {
  console.warn('[Aligo] duplicate_skipped', {
    type,
    logId: existing.id,
    status: existing.status,
    providerId: existing.providerId || null,
    resultCode: existing.resultCode || null,
    resultMessage: existing.resultMessage || null,
  });
  return res.json({
    status: existing.status,
    duplicate: true,
    providerId: existing.providerId || null,
    resultCode: existing.resultCode || null,
    resultMessage: existing.resultMessage || null,
  });
}

async function dispatchAligo(
  logId: string,
  phone: string,
  recvName: string,
  subject: string,
  message: string,
  tplCode: string,
  buttonJson: string,
  res: any
) {
  try {
    const fields = new URLSearchParams({
      apikey: ALIGO_API_KEY,
      userid: ALIGO_USER_ID,
      senderkey: ALIGO_SENDER_KEY,
      tpl_code: tplCode,
      sender: ALIGO_SENDER,
      receiver_1: phone,
      recvname_1: recvName,
      subject_1: subject,
      message_1: message,
      button_1: buttonJson,
    });

    const fetchOptions: any = { method: 'POST', body: fields, signal: AbortSignal.timeout(12000) };
    if (proxyDispatcher) fetchOptions.dispatcher = proxyDispatcher;

    console.info('[Aligo] send_request', {
      logId,
      tplCode,
      recipient: maskPhone(phone),
      hasProxy: Boolean(proxyDispatcher),
      messageLength: message.length,
    });

    const response = await aligoFetch('https://kakaoapi.aligo.in/akv10/alimtalk/send/', fetchOptions);
    const result: any = await response.json();
    const accepted = response.ok && result.code != null && Number(result.code) === 0;
    const rejected = response.ok && result.code != null && Number.isFinite(Number(result.code)) && Number(result.code) < 0;
    const status = accepted ? 'ACCEPTED' : rejected ? 'FAILED' : 'UNKNOWN';
    const providerId = accepted && result.info?.mid ? String(result.info.mid) : null;
    const resultCode = String(result.code ?? '');
    const resultMessage = String(result.message || '').slice(0, 1000);

    console[accepted ? 'info' : 'warn']('[Aligo] send_response', {
      logId,
      tplCode,
      httpStatus: response.status,
      ok: response.ok,
      status,
      code: resultCode,
      message: resultMessage,
      providerId,
    });

    await settleDispatch(logId, status, { providerId, resultCode, resultMessage });
    return res.json({ status, providerId, resultCode, resultMessage });
  } catch (err: any) {
    console.error('[Aligo] send_exception', {
      logId,
      tplCode,
      recipient: maskPhone(phone),
      error: err?.cause?.message || err?.message || String(err),
    });
    await prisma.aligoDispatchLog.updateMany({ where: { id: logId, status: 'SENDING' }, data: { status: 'UNKNOWN' } });
    return res.status(502).json({
      error: '발송 결과를 확인하지 못했습니다. 중복 발송을 막기 위해 재전송하지 않았습니다. 알리고 관리자 화면에서 확인해 주세요.',
    });
  }
}
