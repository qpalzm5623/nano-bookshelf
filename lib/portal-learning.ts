import { createHash } from 'node:crypto';
import Reading = require('../public_html/js/reading-progress');

export async function readingProgress(db: any, memberIds: string[]) {
  if (!memberIds.length) return new Map<string, any>();
  const rows = await db.quizAttempt.findMany({ where: { memberId: { in: memberIds }, score: { gte: 60 } }, distinct: ['memberId', 'bookId'], select: { memberId: true, bookId: true } });
  const books = await db.book.findMany({ where: { id: { in: [...new Set(rows.map((r: any) => r.bookId))] } }, select: { id: true, title: true, subject: true, tags: true, theme: { select: { name: true } } } });
  const byId = new Map(books.map((b: any) => [b.id, b]));
  const grouped = new Map<string, any[]>(memberIds.map(id => [id, []]));
  rows.forEach((r: any) => grouped.get(r.memberId)?.push(byId.get(r.bookId) || { id: r.bookId }));
  return new Map(memberIds.map(id => [id, Reading.stats(grouped.get(id))]));
}

// 최초 지급액을 재전송하되, 회원 포인트는 다시 적립하지 않습니다.
export async function earnedForAttempt(db: any, attempt: any) {
  if (typeof attempt.answers?.earned === 'number') return attempt.answers.earned;
  const ids = ['QUIZ_PASS_1', 'THOUGHT_1', 'QUIZ_PASS_2', 'THOUGHT_2'].map(kind =>
    'award_' + createHash('sha256').update(JSON.stringify([attempt.memberId, attempt.bookId, kind, attempt.id])).digest('hex'));
  const points = await db.pointHistory.findMany({ where: { memberId: attempt.memberId, id: { in: ids } }, select: { amount: true } });
  return points.reduce((sum: number, p: any) => sum + p.amount, 0);
}

// 로그 뷰 반환 시 DB 추가 조회 없이 현행 정책 기준 획득 포인트를 즉시 반환합니다.
export function estimateAttemptPoints(attempt: any, book?: any): number {
  const details = attempt?.answers && !Array.isArray(attempt.answers) ? attempt.answers : {};
  if (typeof details.earned === 'number') return details.earned;
  const score = Number(attempt?.score) || 0;
  if (score < 60) return 0;
  const isHighGrade = isGrade4OrAbove(book?.grade || book?.level || book?.recommendGrade);
  const multiplier = isHighGrade ? 1.2 : 1;
  const qrList = Array.isArray(details.quizResults) ? details.quizResults : [];
  const fallbackCorrect = qrList.length > 0
    ? qrList.filter((r: any) => r && r.isCorrect).length
    : Math.round((score / 100) * (Number(attempt?.questionCount) || 5));
  const correctCount = (typeof attempt?.correctCount === 'number' && attempt.correctCount > 0)
    ? attempt.correctCount
    : fallbackCorrect;
  const quizPts = Math.round(correctCount * 3 * multiplier);
  const thoughtPts = attempt?.thinkReply && String(attempt.thinkReply).trim() ? Math.round(5 * multiplier) : 0;
  return quizPts + thoughtPts;
}

// 초등학교 4학년 이상 권장도서 판정
export function isGrade4OrAbove(gradeStr?: string | null): boolean {
  if (!gradeStr) return false;
  const s = String(gradeStr).trim();
  if (/중|고/.test(s)) return true;
  const match = s.match(/(?:초등?\s*|초)?([1-6])/);
  return !!match && parseInt(match[1], 10) >= 4;
}

// 한국 시각 기준 오늘 0시 UTC Date 객체 반환
export function getTodayStartUtc(now = new Date()): Date {
  const koreaNow = new Date(+now + 9 * 3600000);
  return new Date(Date.UTC(koreaNow.getUTCFullYear(), koreaNow.getUTCMonth(), koreaNow.getUTCDate()) - 9 * 3600000);
}

// 한 회원 행을 잠가 동시 제출도 정합성 있게 처리합니다.
export async function saveAttempt(db: any, user: any, book: any, data: any, importing = false) {
  return db.$transaction(async (tx: any) => {
    await tx.$queryRaw`SELECT id FROM members WHERE id = ${user.id} FOR UPDATE`;
    const duplicate = await tx.quizAttempt.findUnique({ where: { id: data.id } });
    if (duplicate) {
      if (duplicate.memberId !== user.id) throw new Error('ATTEMPT_OWNER');
      const prevCertifiedBefore = await tx.quizAttempt.count({
        where: { memberId: user.id, bookId: book.id, score: { gte: 60 }, completedAt: { lt: duplicate.completedAt } }
      });
      return { attempt: duplicate, earned: await earnedForAttempt(tx, duplicate), isCertified: duplicate.score >= 60, roundNum: duplicate.score >= 60 ? prevCertifiedBefore + 1 : 0 };
    }

    // 해당 회원의 이 도서에 대한 과거 모든 응시 이력 조회
    const previous = await tx.quizAttempt.findMany({
      where: { memberId: user.id, bookId: book.id },
      select: { id: true, score: true, completedAt: true, thinkReply: true }
    });

    // 5. 동일한 도서에 한해서 하루 3번 이상 인증 실패 시 자정이 넘어갈때 까지 재도전 불가
    const todayStart = getTodayStartUtc();
    const tomorrowStart = new Date(+todayStart + 24 * 3600000);
    const todayFailures = previous.filter((a: any) => a.score < 60 && new Date(a.completedAt) >= todayStart && new Date(a.completedAt) < tomorrowStart).length;
    if (!importing && todayFailures >= 3) {
      throw new Error('DAILY_LIMIT_EXCEEDED');
    }

    // 1. 북퀴즈 점수가 60점 이상일 경우에만 인증 완료되며, 인증된 도서에 한해서만 포인트를 지급함.
    const isCertified = data.score >= 60;
    const awards: Array<{ kind: string; amount: number; content: string }> = [];
    let earned = 0;
    const previousCertifiedCount = previous.filter((a: any) => a.score >= 60).length;
    const roundNum = isCertified ? previousCertifiedCount + 1 : 0;

    if (!importing && isCertified) {
      // 4. 동일한 도서에 한해서 최대 2번까지 포인트 지급 됨.
      if (previousCertifiedCount < 2) {

        // 서버에서 채점한 정답 수 × 3P에 권장학년 가중치를 적용하고 반올림합니다.
        const isHighGrade = isGrade4OrAbove(book.grade || book.level || book.recommendGrade);
        const multiplier = isHighGrade ? 1.2 : 1;
        const quizPoints = Math.round(data.correctCount * 3 * multiplier);

        awards.push({
          kind: 'QUIZ_PASS_' + roundNum,
          amount: quizPoints,
          content: `${book.title} 북퀴즈 인증 완료 (${roundNum}회차 · 정답 ${data.correctCount}개 × 3P${isHighGrade ? ' · 초4이상 20% 가중' : ''})`
        });

        // 생각담기 기본 5P에도 동일한 가중치를 적용합니다.
        if (data.thinkReply?.trim()) {
          awards.push({
            kind: 'THOUGHT_' + roundNum,
            amount: Math.round(5 * multiplier),
            content: `${book.title} 생각담기 작성 (${roundNum}회차${isHighGrade ? ' · 초4이상 20% 가중' : ''})`
          });
        }
      }
    }

    const completedAtDate = data.completedAt ? new Date(data.completedAt) : new Date();
    const attempt = await tx.quizAttempt.create({ data: { ...data, answers: { ...data.answers, earned: awards.reduce((sum, award) => sum + award.amount, 0) } } });
    for (const award of awards) {
      const id = 'award_' + createHash('sha256').update(JSON.stringify([user.id, book.id, award.kind, data.id])).digest('hex');
      if (!await tx.pointHistory.findUnique({ where: { id } })) {
        await tx.pointHistory.create({ data: { id, memberId: user.id, amount: award.amount, pointType: award.kind, content: award.content, createdAt: completedAtDate } });
        earned += award.amount;
      }
    }

    // 회원 통계 갱신:
    // 완독 권수(bookCount)는 60점 이상 최초 인증 성공 시에만 +1
    const isFirstCertification = isCertified && !previous.some((a: any) => a.score >= 60);
    const average = await tx.quizAttempt.aggregate({ where: { memberId: user.id }, _avg: { score: true } });

    await tx.member.update({
      where: { id: user.id },
      data: {
        points: { increment: earned },
        bookCount: { increment: isFirstCertification ? 1 : 0 },
        quizAvg: Math.round(average._avg.score || 0)
      }
    });

    // 1번 규칙: 인증 완료(60점 이상) 시에만 과제 완료 처리
    if (isCertified) {
      await tx.bookAssignment.updateMany({
        where: { memberId: user.id, bookId: book.id, isCompleted: false },
        data: { isCompleted: true, status: 'COMPLETED' }
      });
    }

    return { attempt, earned, isCertified, roundNum };
  });
}

export function monthWindow(period: string, now = new Date()) {
  const ymMatch = String(period || '').trim().match(/^(\d{4})-(0[1-9]|1[0-2])$/);
  if (ymMatch) {
    const year = Number(ymMatch[1]);
    const monthIdx = Number(ymMatch[2]) - 1;
    return {
      gte: new Date(Date.UTC(year, monthIdx, 1) - 9 * 3600000),
      lt: new Date(Date.UTC(year, monthIdx + 1, 1) - 9 * 3600000)
    };
  }
  const korea = new Date(+now + 9 * 3600000);
  const offset = period === 'lastMonth' ? -1 : 0;
  return { gte: new Date(Date.UTC(korea.getUTCFullYear(), korea.getUTCMonth() + offset, 1) - 9 * 3600000),
    lt: new Date(Date.UTC(korea.getUTCFullYear(), korea.getUTCMonth() + offset + 1, 1) - 9 * 3600000) };
}
