import { createHash } from 'node:crypto';
// 한 회원 행을 잠가 동시 제출도 최초 완독·생각담기 보상을 한 번씩만 적립합니다.
export async function saveAttempt(db: any, user: any, book: any, data: any, importing = false) {
  return db.$transaction(async (tx: any) => {
    await tx.$queryRaw`SELECT id FROM members WHERE id = ${user.id} FOR UPDATE`;
    const duplicate = await tx.quizAttempt.findUnique({ where: { id: data.id } });
    if (duplicate) { if (duplicate.memberId !== user.id) throw new Error('ATTEMPT_OWNER'); return { attempt: duplicate, earned: 0 }; }
    const previous = await tx.quizAttempt.findMany({ where: { memberId: user.id, bookId: book.id }, select: { thinkReply: true } });
    const attempt = await tx.quizAttempt.create({ data });
    const awards = [];
    if (!importing && !previous.length) awards.push({ kind: 'BOOK_FIRST', amount: 100, content: book.title + ' 최초 완료' });
    if (!importing && data.thinkReply?.trim() && !previous.some((a: any) => a.thinkReply?.trim())) awards.push({ kind: 'THOUGHT_FIRST', amount: 50, content: book.title + ' 최초 생각담기' });
    let earned = 0;
    for (const award of awards) {
      const id = 'award_' + createHash('sha256').update(JSON.stringify([user.id, book.id, award.kind])).digest('hex');
      if (!await tx.pointHistory.findUnique({ where: { id } })) {
        await tx.pointHistory.create({ data: { id, memberId: user.id, amount: award.amount, pointType: award.kind, content: award.content } });
        earned += award.amount;
      }
    }
    const average = await tx.quizAttempt.aggregate({ where: { memberId: user.id }, _avg: { score: true } });
    await tx.member.update({ where: { id: user.id }, data: { points: { increment: earned }, bookCount: { increment: previous.length ? 0 : 1 }, quizAvg: average._avg.score || 0 } });
    await tx.bookAssignment.updateMany({ where: { memberId: user.id, bookId: book.id, isCompleted: false }, data: { isCompleted: true, status: 'COMPLETED' } });
    return { attempt, earned };
  });
}

export function monthWindow(period: string, now = new Date()) {
  const korea = new Date(+now + 9 * 3600000);
  const offset = period === 'lastMonth' ? -1 : 0;
  return { gte: new Date(Date.UTC(korea.getUTCFullYear(), korea.getUTCMonth() + offset, 1) - 9 * 3600000),
    lt: new Date(Date.UTC(korea.getUTCFullYear(), korea.getUTCMonth() + offset + 1, 1) - 9 * 3600000) };
}
