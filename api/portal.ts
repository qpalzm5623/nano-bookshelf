import { prisma } from '../lib/prisma';
import { saveAttempt } from '../lib/portal-learning';
import { academyScope } from '../lib/portal-http';
import { randomUUID } from 'node:crypto';
import { hashPassword, verifyPassword, signSession, readSession, passwordVersion } from '../lib/portal-auth';

// Vercel Node 함수. 사용자/학원 ID는 요청 본문이 아니라 검증된 세션에서 가져옵니다.
const cookieName = 'nano_portal';
// 함수 인스턴스 안에서의 반복 로그인을 제한합니다. 운영 배포에는 Vercel Firewall 제한도 적용합니다.
const loginAttempts = new Map<string, { count: number; until: number }>();
function allowLogin(key: string, limit = 10) {
  const now = Date.now();
  for (const [id, value] of loginAttempts) if (value.until <= now) loginAttempts.delete(id);
  if (loginAttempts.size >= 10000 && !loginAttempts.has(key)) return false;
  const value = loginAttempts.get(key) || { count: 0, until: now + 15 * 60000 };
  value.count++; loginAttempts.set(key, value);
  return value.count <= limit;
}
const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
function cookie(value: string, age = 28800) { return `${cookieName}=${value}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${age}${secure}`; }
function publicUser(member: any) {
  return { id: member.username, memberId: member.id, role: member.role === 'MASTER' ? 'master' : member.role === 'STUDENT' ? 'student' : member.role === 'TEACHER' ? 'teacher' : 'admin',
    name: member.name, studentName: member.name, studentId: member.username, academyId: member.academy.code,
    academyName: member.academy.name, classGroup: member.classGroup?.name || '미지정', server: true };
}
function allowed(member: any) {
  return member && member.status === 'APPROVED' && member.academy?.status === 'ACTIVE' && !member.academy.deletedAt;
}
function logView(attempt: any, book: any) {
  const details = attempt.answers && !Array.isArray(attempt.answers) ? attempt.answers : {};
  return { id: attempt.id, academyId: attempt.member.academy.code, studentId: attempt.member.username,
    studentName: attempt.member.name, classGroup: attempt.member.classGroup?.name || '미지정', bookId: book?.bookNo || attempt.bookId,
    bookTitle: book?.title || '도서', date: attempt.completedAt.toISOString().slice(0, 10), submittedAt: attempt.completedAt.toISOString(),
    score: attempt.score, quizResults: details.quizResults || [], thoughtQuestion: details.thoughtQuestion || '',
    studentThoughtAnswer: attempt.thinkReply || '', thoughtAnswer: attempt.thinkReply || '',
    sheet: details.sheet === '작성 완료' ? '작성 완료' : '작성 전',
    comment: details.comment || '', reviewed: details.reviewed || '대기', thoughtHidden: details.thoughtHidden === true, reviewRevision: details.reviewRevision || '' };
}
export default async function handler(req: any, res: any) {
  res.setHeader('Cache-Control', 'no-store');
  const action = req.query.action || 'session';
  if (!['GET', 'POST'].includes(req.method)) return res.status(405).json({ error: '지원하지 않는 요청입니다.' });
  if (!process.env.DATABASE_URL || (process.env.PORTAL_AUTH_SECRET || '').length < 32) return res.status(503).json({ error: '운영 서버 설정이 필요합니다. 관리자에게 문의해 주세요.' });
  if (req.method === 'POST') {
    const origin = req.headers.origin;
    let sameOrigin = false;
    try { sameOrigin = new URL(origin).host === req.headers.host; } catch {}
    if (!sameOrigin || !String(req.headers['content-type']).startsWith('application/json')) return res.status(403).json({ error: '허용되지 않은 요청입니다.' });
  }
  try {
    const body = req.body || {};
    if (JSON.stringify(body).length > 100000) return res.status(413).json({ error: '요청 크기가 너무 큽니다.' });
    if (action === 'login' && req.method === 'POST') {
      const ip = String(req.headers['x-real-ip'] || req.socket?.remoteAddress || 'unknown');
      if (typeof body.username !== 'string' || typeof body.password !== 'string' || body.username.length > 100 || body.password.length > 256) return res.status(400).json({ error: '아이디와 비밀번호를 확인해 주세요.' });
      if (!allowLogin('ip:' + ip, 200) || !allowLogin(ip + ':' + body.username.trim())) return res.status(429).json({ error: '로그인 시도가 많습니다. 15분 후 다시 시도해 주세요.' });
      const member = await prisma.member.findUnique({ where: { username: body.username.trim() }, include: { academy: true, classGroup: true } });
      if (!allowed(member) || !verifyPassword(body.password, member!.password || '')) return res.status(401).json({ error: '아이디·비밀번호 또는 계정 승인 상태를 확인해 주세요.' });
      await prisma.member.update({ where: { id: member!.id }, data: { lastLoginAt: new Date() } });
      res.setHeader('Set-Cookie', cookie(signSession(member!.id, member!.password!)));
      return res.status(200).json({ user: publicUser(member) });
    }
    if (action === 'logout' && req.method === 'POST') {
      res.setHeader('Set-Cookie', cookie('', 0)); return res.status(200).json({ ok: true });
    }
    const token = String(req.headers.cookie || '').split(';').map((v: string) => v.trim()).find((v: string) => v.startsWith(cookieName + '='))?.slice(cookieName.length + 1) || '';
    const session = readSession(token);
    const member = session ? await prisma.member.findUnique({ where: { id: session.sub }, include: { academy: true, classGroup: true } }) : null;
    if (!allowed(member) || !session || session.version !== passwordVersion(member!.password || '')) return res.status(401).json({ error: '로그인이 만료되었습니다. 다시 로그인해 주세요.' });
    const user = member!;
    if (action === 'session' && req.method === 'GET') return res.status(200).json({ user: publicUser(user) });
    if (action === 'password' && req.method === 'POST') {
      const minLen = 6;
      if (typeof body.newPassword !== 'string' || body.newPassword.length < minLen || body.newPassword.length > 128 || !verifyPassword(body.currentPassword, user.password || '')) return res.status(400).json({ error: `현재 비밀번호와 새 비밀번호(6~128자)를 확인해 주세요.` });
      const password = hashPassword(body.newPassword);
      await prisma.member.update({ where: { id: user.id }, data: { password } });
      res.setHeader('Set-Cookie', cookie(signSession(user.id, password)));
      return res.status(200).json({ ok: true });
    }
    if (action === 'learning' && req.method === 'GET') {
      // 학생은 자신의 기록만, 교사·원장은 소속 학원의 기록만 조회합니다.
      const academyId = await academyScope(user, req.query.academy);
      const attempts = await prisma.quizAttempt.findMany({ where: { member: { academyId }, ...(user.role === 'STUDENT' ? { memberId: user.id } : {}) },
        include: { member: { include: { academy: true, classGroup: true } } }, orderBy: [{ completedAt: 'desc' }, { id: 'desc' }], take: 101, ...(typeof req.query.cursor === 'string' ? { cursor: { id: req.query.cursor }, skip: 1 } : {}) });
      const page = attempts.slice(0, 100);
      // 현재 페이지의 도서·첨부 목록은 서로 독립적이므로 동시에 조회합니다.
      const [books, files] = await Promise.all([
        prisma.book.findMany({ where: { id: { in: [...new Set(page.map(a => a.bookId))] } }, select: { id: true, title: true, bookNo: true } }),
        prisma.portalFile.findMany({ where: { attemptId: { in: page.map(a => a.id) } }, select: { id: true, name: true, attemptId: true } })
      ]);
      return res.status(200).json({ logs: page.map(a => ({ ...logView(a, books.find(b => b.id === a.bookId)), files: files.filter(f => f.attemptId === a.id) })), nextCursor: attempts.length > 100 ? page[99].id : null });
    }
    if (action === 'learning' && req.method === 'POST') {
      if (user.role !== 'STUDENT') return res.status(403).json({ error: '학생만 답안을 제출할 수 있습니다.' });
      if (body.studentId !== user.username) return res.status(409).json({ error: '로그인 계정이 변경되었습니다. 풀이를 시작한 계정으로 다시 로그인해 주세요.' });
      if (typeof body.id !== 'string' || !/^L_[a-zA-Z0-9_-]{5,100}$/.test(body.id) || !Array.isArray(body.quizResults) || body.quizResults.length > 100 || typeof body.bookId !== 'string') return res.status(400).json({ error: '답안 형식이 올바르지 않습니다.' });
      const existing = await prisma.quizAttempt.findUnique({ where: { id: body.id } });
      if (existing) return existing.memberId === user.id ? res.status(200).json({ score: existing.score, quizResults: (existing.answers as any)?.quizResults || [] }) : res.status(409).json({ error: '다른 제출 식별자를 사용해 주세요.' });
      const book = await prisma.book.findFirst({ where: { OR: [{ id: body.bookId }, { bookNo: body.bookId }] }, include: { quizzes: { orderBy: { questionNo: 'asc' } } } });
      if (!book || !book.quizzes.length || book.quizzes.length !== body.quizResults.length) return res.status(409).json({ error: '서버의 퀴즈 문항과 다릅니다. 관리자에게 도서 문항 확인을 요청해 주세요.' });
      const results = book.quizzes.map((q, i) => {
        const answer = body.quizResults[i];
        if (!answer || answer.question !== q.question || q.quizType !== 'MULTIPLE_CHOICE') throw new Error('QUIZ_MISMATCH');
        const options = Array.isArray(q.options) ? q.options : [];
        const correct = options[Number(q.correctAnswer) - 1];
        if (typeof correct !== 'string' || !options.includes(answer.userChoiceText)) throw new Error('QUIZ_MISMATCH');
        return { qNum: i + 1, question: q.question, userChoiceText: answer.userChoiceText, correctChoiceText: correct, isCorrect: answer.userChoiceText === correct };
      });
      const correctCount = results.filter(q => q.isCorrect).length;
      const score = Math.round(correctCount / results.length * 100);
      const sourceDate = body.importing === true ? new Date(body.sourceDate) : null;
      if (sourceDate && (!Number.isFinite(+sourceDate) || +sourceDate > Date.now() || sourceDate.getUTCFullYear() < 2000)) return res.status(400).json({ error: '이관 기록의 작성 날짜를 확인해 주세요.' });
      const saved = await saveAttempt(prisma, user, book, { id: body.id, memberId: user.id, bookId: book.id, score, correctCount, questionCount: results.length,
        ...(sourceDate ? { completedAt: sourceDate } : {}),
        thinkReply: String(body.thoughtAnswer || '').slice(0, 20000), answers: { quizResults: results, thoughtQuestion: book.thinkQuiz || '', ...(body.importing === true ? { importedAt: new Date().toISOString(), sourceDate: String(body.sourceDate || '').slice(0,30) } : {}) } }, body.importing === true);
      return res.status(201).json({ score: saved.attempt.score, quizResults: results, earned: saved.earned, isCertified: saved.isCertified });
    }
    if (action === 'review' && req.method === 'POST') {
      if (!['MASTER', 'DIRECTOR', 'TEACHER'].includes(user.role)) return res.status(403).json({ error: '지도교사와 관리자만 첨삭을 저장할 수 있습니다.' });
      if (typeof body.id !== 'string' || typeof body.comment !== 'string' || body.comment.length > 20000 || typeof body.thoughtHidden !== 'boolean' || !['대기', '첨삭 전', '첨삭 완료'].includes(body.reviewed) || !['작성 전', '작성 완료'].includes(body.sheet)) return res.status(400).json({ error: '첨삭 내용을 확인해 주세요.' });
      const attempt = await prisma.quizAttempt.findFirst({ where: { id: body.id, ...(user.role === 'MASTER' ? {} : { member: { academyId: user.academyId } }) } });
      if (!attempt) return res.status(404).json({ error: '소속 학원의 학습 기록을 찾을 수 없습니다.' });
      const previous: any = attempt.answers && !Array.isArray(attempt.answers) ? attempt.answers : {};
      if ((previous.reviewRevision || '') !== (body.reviewRevision || '')) return res.status(409).json({ error: '다른 선생님이 수정한 내용이 있습니다. 화면을 새로고침한 뒤 다시 확인해 주세요.' });
      const reviewRevision = randomUUID();
      const answers = { ...previous, comment: body.comment, reviewed: body.reviewed, sheet: body.sheet, thoughtHidden: body.thoughtHidden, reviewRevision };
      const saved = await prisma.quizAttempt.updateMany({ where: { id: attempt.id, answers: { equals: attempt.answers as any } }, data: { answers } });
      if (saved.count !== 1) return res.status(409).json({ error: '첨삭 내용이 변경되었습니다. 새로고침 후 다시 저장해 주세요.' });
      return res.status(200).json({ reviewRevision });
    }
    return res.status(404).json({ error: '아직 연결되지 않은 기능입니다.' });
  } catch (error: any) {
    if (error.message === 'DAILY_LIMIT_EXCEEDED') return res.status(429).json({ error: '해당 도서의 오늘 인증 실패 횟수(3회)를 초과하여 오늘 자정까지 재도전할 수 없습니다.' });
    if (error.message === 'QUIZ_MISMATCH') return res.status(409).json({ error: '서버 문항과 답안이 일치하지 않습니다. 답안은 기기에 유지됩니다.' });
    // 중복 클릭/재시도 시 고유 ID 제약으로 두 번 저장되지 않습니다.
    if (error.code === 'P2002') return res.status(409).json({ error: '이미 처리 중인 답안입니다. 잠시 후 다시 시도해 주세요.' });
    console.error('Portal request failed', error.code || error.name);
    return res.status(500).json({ error: '서버 처리에 실패했습니다. 잠시 후 다시 시도해 주세요.' });
  }
}
