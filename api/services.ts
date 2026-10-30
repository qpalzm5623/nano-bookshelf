import { prisma } from '../lib/prisma';
import { authenticate, staff, need, failure } from '../lib/portal-http';
import { createHash } from 'node:crypto';
import { ProxyAgent } from 'undici';

const fixieUrl = process.env.FIXIE_URL;
const proxyDispatcher = fixieUrl ? new ProxyAgent(fixieUrl) : undefined;

const required = ['ALIGO_API_KEY','ALIGO_USER_ID','ALIGO_SENDER_KEY','ALIGO_SENDER','ALIGO_TEMPLATE_CODE','ALIGO_REPORT_TEMPLATE'];
function configuration() {
  const missing = required.filter(key => !process.env[key]);
  return { aligoReady: !missing.length && process.env.ALIGO_ENABLED === 'true', missing, paymentUrl: /^https:\/\//.test(process.env.PAYMENT_PORTAL_URL || '') ? process.env.PAYMENT_PORTAL_URL : null };
}
export default async function handler(req: any, res: any) {
  res.setHeader('Cache-Control', 'no-store');
  try {
    const user = await authenticate(req); staff(user);
    const config = configuration();
    if (req.method === 'GET') return res.json(config);
    need(config.aligoReady, '알림톡 운영 설정이 완료되지 않았습니다. 아직 발송하지 않았습니다.', 503);
    const body = req.body || {};
    const log = await prisma.quizAttempt.findFirst({ where: { id: body.logId || '', ...(user.role === 'MASTER' ? {} : { member: { academyId: user.academyId } }) }, include: { member: true } });
    need(log, '학습 기록을 찾을 수 없습니다.', 404);
    need(log.member.reportYn && log.member.parentPhone, '보호자 연락처와 리포트 발송 동의를 확인해 주세요.');
    const book = await prisma.book.findUnique({ where: { id: log.bookId } });
    const details: any = log.answers || {};
    const substitutions: Record<string,string> = { '학생명': log.member.name, '도서명': book?.title || '', '점수': String(log.score),
      '생각담기': details.thoughtHidden ? '' : log.thinkReply || '', '첨삭': details.thoughtHidden ? '' : details.comment || '' };
    const message = process.env.ALIGO_REPORT_TEMPLATE!.replace(/#\{([^}]+)\}/g, (_, key) => { need(key in substitutions, '알림톡 템플릿의 변수를 확인해 주세요.'); return substitutions[key]; });
    need(message.length <= 1000, '알림톡 내용이 1,000자를 초과합니다. 승인된 템플릿 또는 코멘트를 조정해 주세요.');
    const phone = log.member.parentPhone!.replace(/\D/g, '');
    need(/^0\d{8,10}$/.test(phone), '보호자 연락처 형식을 확인해 주세요.');
    const fingerprint = createHash('sha256').update(JSON.stringify([log.id, phone, message, process.env.ALIGO_TEMPLATE_CODE])).digest('hex');
    if (body.action === 'preview') return res.json({ message, recipient: phone, name: log.member.parentName || log.member.name + ' 보호자', fingerprint });
    need(body.action === 'send' && body.fingerprint === fingerprint, '발송 전 최신 리포트 내용을 확인해 주세요.', 409);
    const id = 'report_' + fingerprint;
    const existing = await prisma.aligoDispatchLog.findUnique({ where: { id } });
    if (existing) return res.json({ status: existing.status, duplicate: true });
    // 외부 요청 전에 고유 발송 기록을 남겨 중복 클릭과 응답 유실 시의 자동 재발송을 막습니다.
    await prisma.aligoDispatchLog.create({ data: { id, academyId: log.member.academyId, recipientName: log.member.parentName || log.member.name,
      recipientPhone: phone, templateCode: process.env.ALIGO_TEMPLATE_CODE!, message, status: 'SENDING', cost: 0 } });
    try {
      const fields = new URLSearchParams({ apikey: process.env.ALIGO_API_KEY!, userid: process.env.ALIGO_USER_ID!, senderkey: process.env.ALIGO_SENDER_KEY!, tpl_code: process.env.ALIGO_TEMPLATE_CODE!,
        sender: process.env.ALIGO_SENDER!, receiver_1: phone, recvname_1: log.member.name, subject_1: '독서 학습 리포트', message_1: message });
      const fetchOptions: any = { method: 'POST', body: fields, signal: AbortSignal.timeout(12000) };
      if (proxyDispatcher) {
        fetchOptions.dispatcher = proxyDispatcher;
      }
      const response = await fetch('https://kakaoapi.aligo.in/akv10/alimtalk/send/', fetchOptions);
      const result = await response.json();
      const status = response.ok && Number(result.code) === 0 ? 'ACCEPTED' : 'FAILED';
      await prisma.aligoDispatchLog.update({ where: { id }, data: { status } });
      return res.json({ status });
    } catch {
      await prisma.aligoDispatchLog.update({ where: { id }, data: { status: 'UNKNOWN' } });
      return res.status(502).json({ error: '발송 결과를 확인하지 못했습니다. 중복 발송을 막기 위해 재전송하지 않았습니다. 알리고 관리자 화면에서 확인해 주세요.' });
    }
  } catch(error) { return failure(res, error); }
}
