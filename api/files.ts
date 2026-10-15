import { prisma } from '../lib/prisma';
import { authenticate, staff, need, failure } from '../lib/portal-http';
import { createHash } from 'node:crypto';
export const config = { api: { bodyParser: { sizeLimit: '3mb' } } };
export default async function handler(req: any, res: any) {
  res.setHeader('Cache-Control', 'no-store'); res.setHeader('X-Content-Type-Options', 'nosniff');
  try {
    const user = await authenticate(req);
    if (req.method === 'GET') {
      const file = await prisma.portalFile.findUnique({ where: { id: String(req.query.id || '') } });
      need(file && (user.role === 'MASTER' || file.academyId === user.academyId), '파일을 찾을 수 없습니다.', 404);
      const attempt = await prisma.quizAttempt.findUnique({ where: { id: file.attemptId } });
      need(attempt && (user.role !== 'STUDENT' || attempt.memberId === user.id), '파일을 열 수 없습니다.', 403);
      res.setHeader('Content-Type', file.mime);
      res.setHeader('Content-Disposition', "attachment; filename*=UTF-8''" + encodeURIComponent(file.name));
      return res.status(200).send(file.data);
    }
    staff(user);
    const body = req.body || {};
    const attempt = await prisma.quizAttempt.findFirst({ where: { id: body.attemptId || '', ...(user.role === 'MASTER' ? {} : { member: { academyId: user.academyId } }) }, include: { member: true } });
    need(attempt, '첨삭할 학습 기록을 찾을 수 없습니다.', 404);
    need(typeof body.base64 === 'string' && body.base64.length <= 2800000 && /^[A-Za-z0-9+/]*={0,2}$/.test(body.base64), '파일은 2MB 이하로 올려 주세요.', 413);
    const data = Buffer.from(body.base64, 'base64');
    need(data.length > 0 && data.length <= 2 * 1024 * 1024, '파일은 2MB 이하로 올려 주세요.', 413);
    const mime = data.subarray(0, 5).toString() === '%PDF-' ? 'application/pdf' : data.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10])) ? 'image/png' : data[0] === 255 && data[1] === 216 && data[2] === 255 ? 'image/jpeg' : '';
    need(mime, 'PDF, PNG, JPG 파일만 올릴 수 있습니다.');
    const name = String(body.name || '첨삭파일').replace(/[\r\n<>/\\]/g, '_').slice(0, 200);
    const file = await prisma.$transaction(async tx => {
      await tx.$queryRaw`SELECT id FROM quiz_attempts WHERE id = ${attempt.id} FOR UPDATE`;
      const id = 'file_' + createHash('sha256').update(attempt.id).update(data).digest('hex');
      const previous = await tx.portalFile.findUnique({ where: { id }, select: { id: true, name: true } });
      if (previous) return previous;
      need(await tx.portalFile.count({ where: { attemptId: attempt.id } }) < 10, '한 학습 기록에 파일은 최대 10개까지 첨부할 수 있습니다.');
      return tx.portalFile.create({ data: { id, academyId: attempt.member.academyId, memberId: user.id, attemptId: attempt.id, name, mime, data }, select: { id: true, name: true } });
    });
    return res.status(201).json({ file });
  } catch(error) { return failure(res, error); }
}
