import { prisma } from '../lib/prisma';
import { loadContentAccess, quizContent, canReadContent, ownsContent } from '../lib/portal-content';
import { saveAttempt, earnedForAttempt, estimateAttemptPoints } from '../lib/portal-learning';
import { academyScope } from '../lib/portal-http';
import { randomUUID } from 'node:crypto';
import { hashPassword, verifyPassword, signSession, readSession, passwordVersion } from '../lib/portal-auth';

let quizAuthorMap: Record<string, any> = {};
try { quizAuthorMap = require('../lib/quiz-authors.json'); } catch {}

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
    academyName: member.academy.name, classGroup: member.classGroup?.name || '미지정',
    grade: member.grade || '', gender: member.gender || '', school: member.school || '', server: true };
}
function allowed(member: any) {
  return member && member.status === 'APPROVED' && member.academy?.status === 'ACTIVE' && !member.academy.deletedAt;
}
// 학습 이력 뷰 변환: 한국 표준시(KST, UTC+9) 기준으로 완독 일자를 산출하여 자정~오전 9시 사이 응시 건의 날짜 밀림 방지
function logView(attempt: any, book: any, studentView = false) {
  const details = attempt.answers && !Array.isArray(attempt.answers) ? attempt.answers : {};
  const completedDate = attempt.completedAt instanceof Date ? attempt.completedAt : new Date(attempt.completedAt);
  const kstDate = new Date(+completedDate + 9 * 3600000).toISOString().slice(0, 10);
  const schoolInfo = [attempt.member?.school, attempt.member?.grade].filter(Boolean).join(' ') || attempt.member?.academy?.name || '';
  const bookPubInfo = [book?.publisher, book?.author].filter(Boolean).join(' · ') || '';
  return { id: attempt.id, academyId: attempt.member.academy.code, studentId: attempt.member.username,
    studentName: attempt.member.name, classGroup: attempt.member.classGroup?.name || '미지정',
    school: schoolInfo, bookId: book?.bookNo || attempt.bookId,
    bookTitle: book?.title || '도서', bookPub: bookPubInfo, cover: book?.coverUrl || '', grade: book?.grade || '',
    date: kstDate, submittedAt: completedDate.toISOString(),
    score: attempt.score, earnedPoints: estimateAttemptPoints(attempt, book),
    correctCount: attempt.correctCount ?? 0, isCertified: attempt.score >= 60,
    quizResults: studentView && attempt.score < 60 ? [] : details.quizResults || [], thoughtQuestion: details.thoughtQuestion || '',
    studentThoughtAnswer: attempt.thinkReply || '', thoughtAnswer: attempt.thinkReply || '',
    sheet: details.sheet === '작성 완료' ? '작성 완료' : '작성 전',
    worksheetAiResult: details.worksheetAiResult || null,
    worksheetPhotos: Array.isArray(details.worksheetPhotos) ? details.worksheetPhotos : [],
    thoughtTeacherComment: details.thoughtTeacherComment || '',
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
    const maxBodyLength = action === 'review' ? 4500000 : 100000;
    if (JSON.stringify(body).length > maxBodyLength) return res.status(413).json({ error: '요청 크기가 너무 큽니다.' });
    if (action === 'login' && req.method === 'POST') {
      const ip = String(req.headers['x-real-ip'] || req.socket?.remoteAddress || 'unknown');
      if (typeof body.username !== 'string' || typeof body.password !== 'string' || body.username.length > 100 || body.password.length > 256) return res.status(400).json({ error: '아이디와 비밀번호를 확인해 주세요.' });
      if (!allowLogin('ip:' + ip, 200) || !allowLogin(ip + ':' + body.username.trim())) return res.status(429).json({ error: '로그인 시도가 많습니다. 15분 후 다시 시도해 주세요.' });
      const member = await prisma.member.findUnique({ where: { username: body.username.trim() }, include: { academy: true, classGroup: true } });
      if (!allowed(member) || !verifyPassword(body.password, member!.password || '')) return res.status(401).json({ error: '아이디·비밀번호 또는 계정 승인 상태를 확인해 주세요.' });

      // master 계정 제외: 학원/학생 계정 중복 로그인 감지
      if (member!.role !== 'MASTER' && prisma.portalSetting?.findUnique) {
        try {
          const setting = await prisma.portalSetting.findUnique({ where: { key: 'session:' + member!.id } });
          if (setting && setting.value) {
            const val = setting.value as any;
            if (val.sessionId && val.expiresAt && val.expiresAt > Date.now()) {
              if (body.confirmConcurrent !== true) {
                return res.status(409).json({
                  conflict: true,
                  concurrentLogin: true,
                  error: '현재 다른 기기에서 사용 중입니다. 기존 접속을 종료하고 로그인하시겠습니까?'
                });
              }
            }
          }
        } catch {}
      }

      const newSid = randomUUID();
      const expiresAt = Date.now() + 8 * 3600000;
      if (member!.role !== 'MASTER' && prisma.portalSetting?.upsert) {
        try {
          await prisma.portalSetting.upsert({
            where: { key: 'session:' + member!.id },
            create: {
              key: 'session:' + member!.id,
              scope: 'member_session',
              value: { sessionId: newSid, loginAt: new Date().toISOString(), expiresAt, ip }
            },
            update: {
              value: { sessionId: newSid, loginAt: new Date().toISOString(), expiresAt, ip }
            }
          });
        } catch (e) {
          console.warn('활성 세션 저장 실패:', e);
        }
      }

      await prisma.member.update({ where: { id: member!.id }, data: { lastLoginAt: new Date() } });
      res.setHeader('Set-Cookie', cookie(signSession(member!.id, member!.password!, Date.now(), newSid)));
      return res.status(200).json({ user: publicUser(member) });
    }
    if (action === 'logout' && req.method === 'POST') {
      const token = String(req.headers.cookie || '').split(';').map((v: string) => v.trim()).find((v: string) => v.startsWith(cookieName + '='))?.slice(cookieName.length + 1) || '';
      const session = readSession(token);
      if (session?.sub && prisma.portalSetting?.deleteMany) {
        try { await prisma.portalSetting.deleteMany({ where: { key: 'session:' + session.sub } }); } catch {}
      }
      res.setHeader('Set-Cookie', cookie('', 0)); return res.status(200).json({ ok: true });
    }
    const token = String(req.headers.cookie || '').split(';').map((v: string) => v.trim()).find((v: string) => v.startsWith(cookieName + '='))?.slice(cookieName.length + 1) || '';
    const session = readSession(token);
    const member = session ? await prisma.member.findUnique({ where: { id: session.sub }, include: { academy: true, classGroup: true } }) : null;
    if (!allowed(member) || !session || session.version !== passwordVersion(member!.password || '')) return res.status(401).json({ error: '로그인이 만료되었습니다. 다시 로그인해 주세요.' });

    // master 계정 제외: 다른 기기 로그인으로 이전 세션이 무효화된 경우 차단
    if (member!.role !== 'MASTER' && session.sid && prisma.portalSetting?.findUnique) {
      try {
        const activeSetting = await prisma.portalSetting.findUnique({ where: { key: 'session:' + member!.id } });
        if (activeSetting && activeSetting.value) {
          const active = activeSetting.value as any;
          if (active.sessionId && active.sessionId !== session.sid) {
            return res.status(401).json({ error: '다른 기기에서 로그인하여 현재 접속이 종료되었습니다.', concurrentLoggedOut: true });
          }
        }
      } catch (e) {}
    }
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
    if (action === 'quiz' && req.method === 'GET') {
      const bookId = String(req.query.bookId || '').trim();
      if (!bookId || bookId.length > 100 || !/^[A-Za-z0-9_-]+$/.test(bookId)) return res.status(400).json({ error: '도서 정보를 확인해 주세요.' });
      const book = await prisma.book.findFirst({
        where: { OR: [{ id: bookId }, { bookNo: bookId }] },
        select: { id: true, bookNo: true, quizzes: { orderBy: [{ legacyQuizSeq: 'asc' }, { questionNo: 'asc' }],
          select: { id: true, question: true, options: true, correctAnswer: true, questionNo: true, legacyQuizSeq: true, quizType: true, explanation: true } } }
      });
      if (!book) return res.status(404).json({ error: '도서를 찾을 수 없습니다.' });

      const contentAccess = await loadContentAccess(prisma);

      // 출제 기관별(legacyQuizSeq) 북퀴즈 세트 분리 (본사 및 가맹점)
      const setsMap = new Map<number, any[]>();
      for (const q of book.quizzes) {
        const seq = q.legacyQuizSeq || 0;
        if (!canReadContent(user, quizContent(contentAccess, book.id, seq), contentAccess)) continue;
        if (!setsMap.has(seq)) setsMap.set(seq, []);
        setsMap.get(seq)!.push(q);
      }

      // 학원 자체 대량 업로드 세트(음수 legacyQuizSeq)의 출제 기관 메타 조회
      const negSeqs = Array.from(setsMap.keys()).filter(s => s < 0);
      const dynamicAuthorMap = new Map<number, any>();
      if (negSeqs.length > 0 && prisma.portalSetting) {
        const rows = await prisma.portalSetting.findMany({
          where: { key: { in: negSeqs.map(s => `quiz_seq:${s}`) } },
          select: { key: true, value: true }
        });
        for (const r of rows) {
          const seqNum = Number(String(r.key).replace(/^quiz_seq:/, ''));
          if (!Number.isNaN(seqNum) && r.value) dynamicAuthorMap.set(seqNum, r.value);
        }
      }

      // 본사(HQ) 세트가 항상 첫 번째 탭에 오도록 정렬 (양수/0 우선, 음수 학원 세트 후순위)
      const orderedEntries = Array.from(setsMap.entries()).sort((a, b) => {
        const aNeg = a[0] < 0 ? 1 : 0;
        const bNeg = b[0] < 0 ? 1 : 0;
        if (aNeg !== bNeg) return aNeg - bNeg;
        return a[0] - b[0];
      });

      const quizSets = orderedEntries.map(([seq, qList], idx) => {
        const content = quizContent(contentAccess, book.id, seq);
        const authorInfo = (seq < 0 ? dynamicAuthorMap.get(seq) : (quizAuthorMap as any)[seq]) || {
          authorType: seq < 0 ? 'ACADEMY' : 'HQ',
          authorName: seq < 0 ? '가맹 학원' : '본사',
          academyName: seq < 0 ? '가맹 학원' : '본사 직속 (공용)'
        };
        const isMyAcademySet = authorInfo.authorType === 'ACADEMY' && !!(
          (authorInfo.academyCode && user.academy?.code === authorInfo.academyCode) ||
          (authorInfo.academyId && user.academyId === authorInfo.academyId)
        );
        return {
          id: `server-${book.id}-${seq || idx}`,
          authorType: content.authorType,
          authorName: authorInfo.authorName || content.academyName,
          ...(authorInfo.academyCode ? { academyId: authorInfo.academyCode } : {}),
          ...(isMyAcademySet ? { isMine: true } : {}),
          isPublic: content.isPublic,
          seq,
          revision: contentAccess.rows.find(r => r.key === `content_quiz:${book.id}:${seq}`)?.revision || 0,
          isMine: user.role !== 'STUDENT' && ownsContent(user, content),
          canAccess: true,
          academyName: content.academyName,
          questions: qList.map(q => {
            const opts = Array.isArray(q.options) ? q.options : [];
            const isSubj = q.quizType === 'SHORT_ANSWER';
            let similarAns = '';
            let cleanHint = q.explanation || '';
            const simMatch = typeof cleanHint === 'string' ? cleanHint.match(/^\[SIMILAR:([^\]]*)\]\s*(.*)$/s) : null;
            if (simMatch) {
              similarAns = simMatch[1].trim();
              cleanHint = simMatch[2].trim();
            }
            return {
              id: q.id, serverId: q.id, question: q.question, choices: opts, options: opts,
              opt1: opts[0] || '', opt2: opts[1] || '', opt3: opts[2] || '', opt4: opts[3] || '', opt5: opts[4] || '',
              ...(user.role === 'STUDENT'
                ? {}
                : {
                    ans: isSubj ? String(q.correctAnswer || '') : Number(q.correctAnswer),
                    ...(isSubj ? { subjectiveAns: String(q.correctAnswer || ''), subjectiveAnswer: String(q.correctAnswer || ''), similarAns } : {}),
                    ...(cleanHint ? { hint: cleanHint } : {})
                  }),
              questionNo: q.questionNo,
              type: isSubj ? 'SUBJECTIVE' : 'CHOICE'
            };
          })
        };
      });

      return res.status(200).json({
        bookId: book.bookNo,
        quizSets
      });
    }
    if (action === 'learning' && req.method === 'GET') {
      // 학생은 자신의 기록만, 교사·원장은 소속 학원의 기록만 조회합니다.
      const academyId = await academyScope(user, req.query.academy);
      const limit = Math.min(Math.max(Number(req.query?.limit) || 100, 1), 500);
      const attempts = await prisma.quizAttempt.findMany({ where: { member: { academyId }, ...(user.role === 'STUDENT' ? { memberId: user.id } : {}) },
        include: { member: { include: { academy: true, classGroup: true } } }, orderBy: [{ completedAt: 'desc' }, { id: 'desc' }], take: limit + 1, ...(typeof req.query.cursor === 'string' ? { cursor: { id: req.query.cursor }, skip: 1 } : {}) });
      const page = attempts.slice(0, limit);
      // 현재 페이지의 도서·첨부 목록은 서로 독립적이므로 동시에 조회합니다.
      const [books, files] = await Promise.all([
        prisma.book.findMany({ where: { id: { in: [...new Set(page.map(a => a.bookId))] } }, select: { id: true, title: true, bookNo: true, publisher: true, author: true, coverUrl: true, grade: true } }),
        prisma.portalFile ? prisma.portalFile.findMany({ where: { attemptId: { in: page.map(a => a.id) } }, select: { id: true, name: true, attemptId: true } }) : Promise.resolve([])
      ]);
      return res.status(200).json({ logs: page.map(a => ({ ...logView(a, books.find(b => b.id === a.bookId), user.role === 'STUDENT'), files: files.filter(f => f.attemptId === a.id) })), nextCursor: attempts.length > limit ? page[limit - 1].id : null });
    }
    if (action === 'learning' && req.method === 'POST') {
      if (user.role !== 'STUDENT') return res.status(403).json({ error: '학생만 답안을 제출할 수 있습니다.' });
      if (body.studentId !== user.username) return res.status(409).json({ error: '로그인 계정이 변경되었습니다. 풀이를 시작한 계정으로 다시 로그인해 주세요.' });
      if (typeof body.id !== 'string' || !/^L_[a-zA-Z0-9_-]{5,100}$/.test(body.id) || !Array.isArray(body.quizResults) || body.quizResults.length > 100 || typeof body.bookId !== 'string') return res.status(400).json({ error: '답안 형식이 올바르지 않습니다.' });
      const existing = await prisma.quizAttempt.findUnique({ where: { id: body.id } });
      if (existing) {
        if (existing.memberId !== user.id) return res.status(409).json({ error: '다른 제출 식별자를 사용해 주세요.' });
        const book = await prisma.book.findUnique({ where: { id: existing.bookId } });
        return res.status(200).json({ score: existing.score, quizResults: existing.score >= 60 ? (existing.answers as any)?.quizResults || [] : [], correctCount: existing.correctCount ?? ((existing.answers as any)?.quizResults || []).filter((q: any) => q.isCorrect).length, earned: await earnedForAttempt(prisma, existing), isCertified: existing.score >= 60, log: logView({ ...existing, member: user }, book, true) });
      }
      // 학생 요청의 이관 플래그로 응시 제한·작성일을 우회하지 못하게 합니다.
      if (body.importing === true || body.sourceDate !== undefined) return res.status(403).json({ error: '학생 화면에서는 과거 기록을 이관할 수 없습니다. 관리자에게 문의해 주세요.' });
      const book = await prisma.book.findFirst({ where: { OR: [{ id: body.bookId }, { bookNo: body.bookId }] }, include: { quizzes: { orderBy: [{ legacyQuizSeq: 'asc' }, { questionNo: 'asc' }] } } });
      const contentAccess = await loadContentAccess(prisma);
      if (book) book.quizzes = book.quizzes.filter(q => canReadContent(user, quizContent(contentAccess, book.id, q.legacyQuizSeq || 0), contentAccess));
      if (!book || !book.quizzes.length) return res.status(409).json({ error: '서버의 퀴즈 문항과 다릅니다. 관리자에게 도서 문항 확인을 요청해 주세요.' });
      const quizGroups = new Map<number, any[]>();
      for (const q of book.quizzes) {
        const seq = q.legacyQuizSeq || 0;
        if (!quizGroups.has(seq)) quizGroups.set(seq, []);
        quizGroups.get(seq)!.push(q);
      }
      let targetQuizzes = book.quizzes;
      if (body.quizSetSeq !== undefined) {
        if (!Number.isInteger(body.quizSetSeq) || !quizGroups.has(body.quizSetSeq)) return res.status(403).json({ error: '선택한 퀴즈의 공유가 해제되었거나 이용 권한이 없습니다.' });
        targetQuizzes = quizGroups.get(body.quizSetSeq)!;
      } else if (quizGroups.size > 1) {
        const matchedSet = Array.from(quizGroups.values()).find(
          setQs => setQs.length === body.quizResults.length && setQs.every((q, idx) => body.quizResults[idx]?.question === q.question)
        );
        if (matchedSet) targetQuizzes = matchedSet;
      }
      if (targetQuizzes.length !== body.quizResults.length) return res.status(409).json({ error: '서버의 퀴즈 문항과 다릅니다. 관리자에게 도서 문항 확인을 요청해 주세요.' });
      const results = targetQuizzes.map((q, i) => {
        const answer = body.quizResults[i];
        if (!answer || answer.question !== q.question) throw new Error('QUIZ_MISMATCH');
        if (q.quizType === 'SHORT_ANSWER') {
          const userAns = String(answer.userChoiceText ?? '').trim();
          const primaryAns = String(q.correctAnswer ?? '').trim();
          const simMatch = typeof q.explanation === 'string' ? q.explanation.match(/^\[SIMILAR:([^\]]*)\]/) : null;
          const accepted = [primaryAns, ...(simMatch ? simMatch[1].split(',').map((s: string) => s.trim()) : [])].filter(Boolean);
          const norm = (s: string) => s.replace(/\s+/g, '').toLowerCase();
          const isCorrect = userAns.length > 0 && accepted.some(acc => norm(acc) === norm(userAns));
          return { qNum: i + 1, question: q.question, userChoiceText: userAns, correctChoiceText: primaryAns, isCorrect };
        }
        if (q.quizType && q.quizType !== 'MULTIPLE_CHOICE') throw new Error('QUIZ_MISMATCH');
        const options = Array.isArray(q.options) ? q.options : [];
        const correct = options[Number(q.correctAnswer) - 1];
        if (typeof correct !== 'string' || !options.includes(answer.userChoiceText)) throw new Error('QUIZ_MISMATCH');
        return { qNum: i + 1, question: q.question, userChoiceText: answer.userChoiceText, correctChoiceText: correct, isCorrect: answer.userChoiceText === correct };
      });
      const correctCount = results.filter(q => q.isCorrect).length;
      const score = Math.round(correctCount / results.length * 100);
      const saved = await saveAttempt(prisma, user, book, { id: body.id, memberId: user.id, bookId: book.id, score, correctCount, questionCount: results.length,
        thinkReply: String(body.thoughtAnswer || '').slice(0, 20000), answers: { quizResults: results, thoughtQuestion: book.thinkQuiz || '' } });
      return res.status(201).json({ score: saved.attempt.score, quizResults: saved.isCertified ? results : [], correctCount, earned: saved.earned, isCertified: saved.isCertified, roundNum: saved.roundNum, log: logView({ ...saved.attempt, member: user }, book, true) });
    }
    if (action === 'review' && req.method === 'POST') {
      if (!['MASTER', 'DIRECTOR', 'TEACHER'].includes(user.role)) return res.status(403).json({ error: '지도교사와 관리자만 첨삭을 저장할 수 있습니다.' });
      if (typeof body.id !== 'string' || typeof body.comment !== 'string' || body.comment.length > 20000 || typeof body.thoughtHidden !== 'boolean' || !['대기', '첨삭 전', '첨삭 완료'].includes(body.reviewed) || !['작성 전', '작성 완료'].includes(body.sheet) || (body.thoughtTeacherComment !== undefined && (typeof body.thoughtTeacherComment !== 'string' || body.thoughtTeacherComment.length > 20000))) return res.status(400).json({ error: '첨삭 내용을 확인해 주세요.' });
      // 관리자 편집 결과도 외부 입력이므로 형식과 길이를 서버에서 확인합니다. null은 첨삭 결과 삭제입니다.
      const worksheet = body.worksheetAiResult;
      if (worksheet !== undefined && worksheet !== null) {
        const fields = ['summary', 'drawingObservation', 'languageHandwritingNote', 'nextStep', 'parentGuide', 'teacherCommentDraft'];
        const valid = typeof worksheet === 'object' && !Array.isArray(worksheet) && JSON.stringify(worksheet).length <= 60000 &&
          fields.every(key => worksheet[key] === undefined || (typeof worksheet[key] === 'string' && worksheet[key].length <= 10000)) &&
          (worksheet.actualQuotes === undefined || (Array.isArray(worksheet.actualQuotes) && worksheet.actualQuotes.length <= 20 && worksheet.actualQuotes.every((quote: any) =>
            quote && typeof quote === 'object' && !Array.isArray(quote) && ['quote', 'criteria', 'comment'].every(key => quote[key] === undefined || (typeof quote[key] === 'string' && quote[key].length <= 5000)))));
        if (!valid) return res.status(400).json({ error: 'AI 첨삭 결과의 형식 또는 글자 수를 확인해 주세요.' });
      }
      const attempt = await prisma.quizAttempt.findFirst({ where: { id: body.id, ...(user.role === 'MASTER' ? {} : { member: { academyId: user.academyId } }) } });
      if (!attempt) return res.status(404).json({ error: '소속 학원의 학습 기록을 찾을 수 없습니다.' });
      const previous: any = attempt.answers && !Array.isArray(attempt.answers) ? attempt.answers : {};
      if ((previous.reviewRevision || '') !== (body.reviewRevision || '')) return res.status(409).json({ error: '다른 선생님이 수정한 내용이 있습니다. 화면을 새로고침한 뒤 다시 확인해 주세요.' });
      const reviewRevision = randomUUID();
      const thoughtTeacherComment = typeof body.thoughtTeacherComment === 'string' ? body.thoughtTeacherComment : (previous.thoughtTeacherComment || '');
      const commentToSave = body.comment || (!body.worksheetAiResult && thoughtTeacherComment ? thoughtTeacherComment : (previous.comment || ''));
      const answers = { ...previous, comment: commentToSave, thoughtTeacherComment, reviewed: body.reviewed, sheet: body.sheet, thoughtHidden: body.thoughtHidden, worksheetAiResult: body.worksheetAiResult !== undefined ? body.worksheetAiResult : (previous.worksheetAiResult || null), worksheetPhotos: Array.isArray(body.worksheetPhotos) ? body.worksheetPhotos : (previous.worksheetPhotos || []), reviewRevision };
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
