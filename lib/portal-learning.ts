import { createHash } from 'node:crypto';

// 초등학교 4학년 이상 권장도서 판정
export function isGrade4OrAbove(gradeStr?: string | null): boolean {
  if (!gradeStr) return false;
  const s = String(gradeStr).trim();
  if (/중|고/.test(s)) return true;
  const match = s.match(/(?:초등?\s*|초)?([1-6])/);
  if (match) {
    const gradeNum = parseInt(match[1], 10);
    return gradeNum >= 4;
  }
  return false;
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
      return { attempt: duplicate, earned: 0, isCertified: duplicate.score >= 60 };
    }

    // 해당 회원의 이 도서에 대한 과거 모든 응시 이력 조회
    const previous = await tx.quizAttempt.findMany({
      where: { memberId: user.id, bookId: book.id },
      select: { id: true, score: true, completedAt: true, thinkReply: true }
    });

    // 5. 동일한 도서에 한해서 하루 3번 이상 인증 실패 시 자정이 넘어갈때 까지 재도전 불가
    const todayStart = getTodayStartUtc();
    const todayFailures = previous.filter((a: any) => a.score < 60 && new Date(a.completedAt) >= todayStart).length;
    if (!importing && todayFailures >= 3) {
      throw new Error('DAILY_LIMIT_EXCEEDED');
    }

    // 퀴즈 응시 기록 저장
    const attempt = await tx.quizAttempt.create({ data });

    // 1. 북퀴즈 점수가 60점 이상일 경우에만 인증 완료되며, 인증된 도서에 한해서만 포인트를 지급함.
    const isCertified = data.score >= 60;
    const awards: Array<{ kind: string; amount: number; content: string }> = [];
    let earned = 0;

    if (!importing && isCertified) {
      // 4. 동일한 도서에 한해서 최대 2번까지 포인트 지급 됨.
      const previousCertifiedCount = previous.filter((a: any) => a.score >= 60).length;

      if (previousCertifiedCount < 2) {
        const roundNum = previousCertifiedCount + 1; // 1회차 또는 2회차

        // 2. 인증 된 경우에 한해, 퀴즈당 3포인트
        // 3. 도서가 만약 초등학교 4학년 이상 권장도서일 경우에는 퀴즈 완료후에 얻은 포인트에 1.2배수로 포인트 주기.
        const isHighGrade = isGrade4OrAbove(book.grade || book.level || book.recommendGrade);
        const quizPoints = isHighGrade ? Math.round(3 * 1.2) : 3; // 3 * 1.2 = 3.6 -> 반올림 4P

        awards.push({
          kind: 'QUIZ_PASS_' + roundNum,
          amount: quizPoints,
          content: `${book.title} 북퀴즈 인증 완료 (${roundNum}회차${isHighGrade ? ' · 초4이상 1.2배' : ''})`
        });

        // 2. 생각담기는 작성만 해도 5포인트 주기. (인증 된 경우에 한해 지급)
        // 도서가 초등학교 4학년 이상 권장도서일 경우 퀴즈 및 생각담기 완료 포인트에 20% 가중치 부여 (5 * 1.2 = 6P)
        if (data.thinkReply?.trim()) {
          const thoughtPoints = isHighGrade ? Math.round(5 * 1.2) : 5; // 5 * 1.2 = 6P
          awards.push({
            kind: 'THOUGHT_' + roundNum,
            amount: thoughtPoints,
            content: `${book.title} 생각담기 작성 (${roundNum}회차${isHighGrade ? ' · 초4이상 20% 가중' : ''})`
          });
        }
      }
    }

    for (const award of awards) {
      const id = 'award_' + createHash('sha256').update(JSON.stringify([user.id, book.id, award.kind, data.id])).digest('hex');
      if (!await tx.pointHistory.findUnique({ where: { id } })) {
        await tx.pointHistory.create({ data: { id, memberId: user.id, amount: award.amount, pointType: award.kind, content: award.content } });
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
        quizAvg: average._avg.score || 0
      }
    });

    // 1번 규칙: 인증 완료(60점 이상) 시에만 과제 완료 처리
    if (isCertified) {
      await tx.bookAssignment.updateMany({
        where: { memberId: user.id, bookId: book.id, isCompleted: false },
        data: { isCompleted: true, status: 'COMPLETED' }
      });
    }

    return { attempt, earned, isCertified };
  });
}

export function monthWindow(period: string, now = new Date()) {
  const korea = new Date(+now + 9 * 3600000);
  const offset = period === 'lastMonth' ? -1 : 0;
  return { gte: new Date(Date.UTC(korea.getUTCFullYear(), korea.getUTCMonth() + offset, 1) - 9 * 3600000),
    lt: new Date(Date.UTC(korea.getUTCFullYear(), korea.getUTCMonth() + offset + 1, 1) - 9 * 3600000) };
}
