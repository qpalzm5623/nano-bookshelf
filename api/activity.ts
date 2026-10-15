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
      const scope = ['class','academy','national'].includes(req.query.scope) ? req.query.scope : 'academy';
      const memberWhere = scope === 'national' ? { role: 'STUDENT' as const, status: 'APPROVED' as const } : { role: 'STUDENT' as const, status: 'APPROVED' as const,
        academyId: user.academyId, ...(scope === 'class' ? { classGroupId: user.classGroupId || '__none__' } : {}) };
      const totals = await prisma.pointHistory.groupBy({ by: ['memberId'], where: { createdAt: monthWindow(String(req.query.period)), member: memberWhere }, _sum: { amount: true } });
      totals.sort((a, b) => (b._sum.amount || 0) - (a._sum.amount || 0) || a.memberId.localeCompare(b.memberId));
      const top = totals.slice(0, 100);
      const members = await prisma.member.findMany({ where: { id: { in: top.map(t => t.memberId) } }, select: { id: true, name: true, bookCount: true, academy: { select: { name: true } } } });
      const rows = top.map((t, i) => { const m = members.find(m => m.id === t.memberId)!; return { rank: i + 1, name: scope === 'national' && m.id !== user.id ? m.name.slice(0, 1) + '**' : m.name,
        pt: t._sum.amount || 0, cls: m.academy.name, books: m.bookCount, me: m.id === user.id, charId: m.id === user.id ? 'custom' : 'nano', change: 'same', changeNum: 0 }; });
      const own = totals.findIndex(t => t.memberId === user.id);
      return res.json({ rows, myRank: own < 0 ? null : own + 1, participants: totals.length, myPoints: own < 0 ? 0 : totals[own]._sum.amount });
    }
    if (action === 'assignments') {
      const academyId = await academyScope(user, req.query.academy);
      const rows = await prisma.bookAssignment.findMany({ where: { academyId, ...(user.role === 'STUDENT' ? { memberId: user.id } : {}) }, include: { member: { include: { classGroup: true } }, book: true }, orderBy: { createdAt: 'desc' } });
      const grouped = new Map<string, any>();
      for (const row of rows) {
        if (!row.member) continue;
        const key = row.memberId!;
        if (!grouped.has(key)) grouped.set(key, { id: key, studentId: row.member.username, studentName: row.member.name, classGroup: row.member.classGroup?.name || '미지정', school: row.member.school || '', grade: row.member.grade || '', books: [], completedBooks: 0, assignDate: row.createdAt.toISOString().slice(0, 10) });
        const item = grouped.get(key); item.books.push({ id: row.book.bookNo, title: row.book.title, pub: row.book.publisher || '', cover: row.book.coverUrl || '', isCompleted: row.isCompleted, assignmentId: row.id });
        if (row.isCompleted) item.completedBooks++;
      }
      return res.json({ students: [...grouped.values()], classes: [] });
    }
    need(false, '지원하지 않는 조회입니다.', 404);
  } catch(error) { return failure(res, error); }
}
