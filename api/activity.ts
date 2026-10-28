import { prisma } from '../lib/prisma';
import { authenticate, need, failure, academyScope } from '../lib/portal-http';
import { monthWindow } from '../lib/portal-learning';
export default async function handler(req: any, res: any) {
  res.setHeader('Cache-Control', 'no-store');
  try {
    const user = await authenticate(req);
    const action = String(req.query.action || 'summary');
    if (action === 'preferences') {
      const key = 'preferences:' + user.id;
      if (req.method === 'GET') { const row = await prisma.portalSetting.findUnique({ where: { key } }); return res.json({ value: row?.value || { wishlist: [], interests: [] }, revision: row?.revision || 0 }); }
      const value = req.body?.value;
      need(value && Array.isArray(value.wishlist) && value.wishlist.length <= 1000 && value.wishlist.every((id: any) => typeof id === 'string' && /^[A-Za-z0-9_-]+$/.test(id)), '찜한 도서 목록을 확인해 주세요.');
      need(Array.isArray(value.interests) && value.interests.length <= 3 && value.interests.every((t: any) => typeof t === 'string' && t.length <= 100 && !/[<>]/.test(t)), '관심 주제를 확인해 주세요.');
      const revision = Number(req.body.revision);
      if (revision === 0) await prisma.portalSetting.create({ data: { key, scope: user.id, value: { wishlist: value.wishlist, interests: value.interests } } });
      else { const result = await prisma.portalSetting.updateMany({ where: { key, scope: user.id, revision }, data: { value: { wishlist: value.wishlist, interests: value.interests }, revision: { increment: 1 } } }); need(result.count === 1, '다른 기기에서 목록이 변경되었습니다. 새로고침해 주세요.', 409); }
      return res.json({ revision: revision + 1 });
    }
    need(req.method === 'GET', '조회 요청만 지원합니다.', 405);
    if (action === 'points') {
      const points = await prisma.pointHistory.findMany({ where: { memberId: user.id }, orderBy: [{ createdAt: 'desc' }, { id: 'desc' }], take: 201, ...(typeof req.query.cursor === 'string' ? { cursor: { id: req.query.cursor }, skip: 1 } : {}) });
      return res.json({ items: points.slice(0,200), nextCursor: points.length > 200 ? points[199].id : null });
    }
    if (action === 'summary') {
      const [points, assignments, books, average] = await Promise.all([
        prisma.pointHistory.findMany({ where: { memberId: user.id }, orderBy: [{ createdAt: 'desc' }, { id: 'desc' }], take: 200 }),
        prisma.bookAssignment.findMany({ where: { memberId: user.id, academyId: user.academyId, isCompleted: false }, include: { book: { select: { bookNo: true } } } }),
        prisma.quizAttempt.findMany({ where: { memberId: user.id }, distinct: ['bookId'], select: { bookId: true } }),
        prisma.quizAttempt.aggregate({ where: { memberId: user.id }, _avg: { score: true } })
      ]);
      return res.json({ totalPoints: user.points, bookCount: books.length, quizAvg: average._avg.score || 0, pointLogs: points,
        assignedBookIds: assignments.map(a => a.book.bookNo), pointLimit: 200 });
    }
    if (action === 'rankings') {
      const requestedScope = ['class','academy','national'].includes(req.query.scope) ? req.query.scope : 'academy';
      // 학급이 지정되지 않은 학생은 빈 학급 랭킹 대신 소속 학원 랭킹을 제공합니다.
      const scope = requestedScope === 'class' && !user.classGroupId ? 'academy' : requestedScope;
      const memberWhere = scope === 'national' ? { role: 'STUDENT' as const, status: 'APPROVED' as const,
        academy: { status: 'ACTIVE' as const, deletedAt: null } } : { role: 'STUDENT' as const, status: 'APPROVED' as const,
        academyId: user.academyId, ...(scope === 'class' ? { classGroupId: user.classGroupId || '__none__' } : {}) };

      const periodWindow = monthWindow(String(req.query.period));
      const [members, totals, completedBooks] = await Promise.all([
        prisma.member.findMany({
          where: memberWhere,
          select: { id: true, name: true, bookCount: true, points: true,
            academy: { select: { name: true } }, classGroup: { select: { name: true } } }
        }),
        prisma.pointHistory.groupBy({
          by: ['memberId'],
          where: { createdAt: periodWindow, member: memberWhere },
          _sum: { amount: true }
        }),
        prisma.quizAttempt.findMany({
          where: { completedAt: periodWindow, score: { gte: 60 }, member: memberWhere },
          select: { memberId: true, bookId: true },
          distinct: ['memberId', 'bookId']
        })
      ]);
      const memberMap = new Map(members.map(m => [m.id, m]));
      const pointMap = new Map(totals.map(t => [t.memberId, t._sum.amount || 0]));
      const bookCountMap = new Map<string, number>();
      for (const row of completedBooks) bookCountMap.set(row.memberId, (bookCountMap.get(row.memberId) || 0) + 1);

      // 해당 기간에 포인트가 없는 학생도 실제 소속 명단에 포함해 참가 인원과 순위를 일치시킵니다.
      const rankCandidates = members.map(m => ({
        memberId: m.id,
        amount: pointMap.get(m.id) || 0,
        bookCount: bookCountMap.get(m.id) || 0,
        name: m.name,
        academyName: m.academy?.name || '',
        className: m.classGroup?.name || ''
      }));

      // 1순위: 포인트 내림차순, 2순위: 완독 도서 수(bookCount) 내림차순, 3순위: 이름 오름차순
      rankCandidates.sort((a, b) => {
        if (b.amount !== a.amount) {
          return b.amount - a.amount;
        }
        if (b.bookCount !== a.bookCount) {
          return b.bookCount - a.bookCount;
        }
        return a.name.localeCompare(b.name) || a.memberId.localeCompare(b.memberId);
      });

      const top = rankCandidates.slice(0, 100);
      const rows = top.map((t, i) => ({
        rank: i + 1,
        name: scope === 'national' && t.memberId !== user.id ? t.name.slice(0, 1) + '**' : t.name,
        pt: t.amount,
        cls: scope === 'national' ? [t.academyName, t.className].filter(Boolean).join(' · ') : (t.className || '학급 미지정'),
        academyName: t.academyName,
        className: t.className,
        books: t.bookCount,
        me: t.memberId === user.id,
        charId: t.memberId === user.id ? 'custom' : 'nano',
        change: 'same',
        changeNum: 0
      }));

      const ownIdx = rankCandidates.findIndex(t => t.memberId === user.id);
      const ownMember = memberMap.get(user.id);
      const ownPoints = pointMap.get(user.id) || 0;

      return res.json({
        scope,
        academyName: user.academy.name,
        className: user.classGroup?.name || '',
        hasClass: !!user.classGroupId,
        rows,
        myRank: ownIdx < 0 ? null : ownIdx + 1,
        participants: rankCandidates.length,
        myPoints: ownPoints,
        myTotalPoints: ownMember ? ownMember.points : user.points,
        myBooks: ownMember ? ownMember.bookCount : 0
      });
    }
    if (action === 'assignments') {
      const academyId = await academyScope(user, req.query.academy);
      const rows = await prisma.bookAssignment.findMany({ where: { academyId, ...(user.role === 'STUDENT' ? { memberId: user.id } : {}) }, include: { member: { include: { classGroup: true } }, book: true }, orderBy: { createdAt: 'desc' } });
      const grouped = new Map<string, any>();
      for (const row of rows) {
        if (!row.member) continue;
        const key = row.memberId!;
        if (!grouped.has(key)) grouped.set(key, { id: key, studentId: row.member.username, studentName: row.member.name, classGroup: row.member.classGroup?.name || '미지정', school: row.member.school || '', grade: row.member.grade || '', books: [], completedBooks: 0, status: '읽는 중', assignDate: row.createdAt.toISOString().slice(0, 10) });
        const item = grouped.get(key); item.books.push({ id: row.book.bookNo, title: row.book.title, pub: row.book.publisher || '', cover: row.book.coverUrl || '', isCompleted: row.isCompleted, assignmentId: row.id });
        if (row.isCompleted) item.completedBooks++;
        item.status = item.completedBooks >= item.books.length ? '완료' : `읽는 중 (${item.completedBooks}/${item.books.length}권)`;
      }
      return res.json({ students: [...grouped.values()], classes: [] });
    }
    need(false, '지원하지 않는 조회입니다.', 404);
  } catch(error) { return failure(res, error); }
}
