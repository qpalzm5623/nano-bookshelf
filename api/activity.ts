import { prisma } from '../lib/prisma';
import { authenticate, need, failure, academyScope, staff } from '../lib/portal-http';
import { monthWindow, getTodayStartUtc, readingProgress } from '../lib/portal-learning';
import Reading = require('../public_html/js/reading-progress');

export default async function handler(req: any, res: any) {
  res.setHeader('Cache-Control', 'no-store');
  try {
    const user = await authenticate(req);
    const action = String(req.query.action || 'summary');
    if (action === 'character') {
      const key = 'character:' + user.id;
      if (req.method === 'GET') {
        const row = await prisma.portalSetting.findUnique({ where: { key } });
        return res.json({ characterId: (row?.value as any)?.characterId || 'nano', hasSelection: !!row });
      }
      need(req.method === 'POST', '지원하지 않는 요청입니다.', 405);
      const id = req.body?.characterId;
      need(typeof id === 'string' && Object.prototype.hasOwnProperty.call(Reading.rules, id), '캐릭터를 확인해 주세요.');
      const counts = (await readingProgress(prisma, [user.id])).get(user.id);
      need(Reading.stage(id, counts) > 0, '아직 해금되지 않은 캐릭터입니다.', 409);
      await prisma.portalSetting.upsert({ where: { key }, create: { key, scope: user.id, value: { characterId: id } }, update: { value: { characterId: id } } });
      return res.json({ characterId: id, stage: Reading.stage(id, counts) });
    }
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
    if (action === 'characters') {
      staff(user);
      const academyId = await academyScope(user, req.query.academy);
      const members = await prisma.member.findMany({ where: { academyId, role: 'STUDENT', status: 'APPROVED' }, select: { id: true } });
      const ids = members.map(member => member.id);
      const [settings, progress] = await Promise.all([
        prisma.portalSetting.findMany({ where: { key: { in: ids.map(id => 'character:' + id) } }, select: { key: true, value: true } }),
        readingProgress(prisma, ids)
      ]);
      const selected = new Map(settings.map(row => [row.key.slice(10), (row.value as any)?.characterId]));
      return res.json({ items: ids.map(memberId => {
        const candidate = selected.get(memberId) || 'nano';
        const counts = progress.get(memberId) || {};
        const characterId = Object.prototype.hasOwnProperty.call(Reading.rules, candidate) && Reading.stage(candidate, counts) > 0 ? candidate : 'nano';
        return { memberId, characterId, stage: Reading.stage(characterId, counts) };
      }) });
    }
    if (action === 'points') {
      const month = String(req.query.month || '');
      need(!month || /^\d{4}-(0[1-9]|1[0-2])$/.test(month), '조회 월을 확인해 주세요.');
      const [year, monthNo] = month.split('-').map(Number);
      const createdAt = month ? { gte: new Date(Date.UTC(year, monthNo - 1, 1) - 9 * 3600000), lt: new Date(Date.UTC(year, monthNo, 1) - 9 * 3600000) } : undefined;
      const points = await prisma.pointHistory.findMany({ where: { memberId: user.id, ...(createdAt ? { createdAt } : {}) }, orderBy: [{ createdAt: 'desc' }, { id: 'desc' }], take: 201, ...(typeof req.query.cursor === 'string' ? { cursor: { id: req.query.cursor }, skip: 1 } : {}) });
      return res.json({ items: points.slice(0,200), nextCursor: points.length > 200 ? points[199].id : null });
    }
    if (action === 'summary') {
      const [points, assignments, books, average, monthly, months] = await Promise.all([
        prisma.pointHistory.findMany({ where: { memberId: user.id }, orderBy: [{ createdAt: 'desc' }, { id: 'desc' }], take: 201 }),
        prisma.bookAssignment.findMany({ where: { memberId: user.id, academyId: user.academyId, isCompleted: false }, include: { book: { select: { bookNo: true } } } }),
        prisma.quizAttempt.findMany({ where: { memberId: user.id, score: { gte: 60 } }, distinct: ['bookId'], select: { bookId: true } }),
        prisma.quizAttempt.aggregate({ where: { memberId: user.id }, _avg: { score: true } }),
        prisma.pointHistory.aggregate({ where: { memberId: user.id, createdAt: monthWindow('month') }, _sum: { amount: true } }),
        prisma.$queryRaw<Array<{ month: string }>>`SELECT DISTINCT to_char("createdAt" + interval '9 hours', 'YYYY-MM') AS month FROM point_histories WHERE "memberId" = ${user.id} ORDER BY month DESC`
      ]);
      return res.json({ totalPoints: user.points, bookCount: books.length, quizAvg: Math.round(average._avg.score || 0), pointLogs: points.slice(0, 200), currentMonthPoints: monthly._sum.amount || 0, pointMonths: months.map(m => m.month), pointNextCursor: points.length > 200 ? points[199].id : null,
        assignedBookIds: assignments.map(a => a.book.bookNo), pointLimit: 200 });
    }
    if (action === 'rankings') {
      const requestedScope = ['class','academy','national'].includes(req.query.scope) ? req.query.scope : 'academy';
      // 학급이 지정되지 않은 학생은 빈 학급 랭킹 대신 소속 학원 랭킹을 제공합니다.
      const scope = requestedScope === 'class' && !user.classGroupId ? 'academy' : requestedScope;
      const periodWindow = monthWindow(String(req.query.period));
      // 대상 전체를 JS로 전송하지 않고 DB에서 집계·순위를 정한 후 상위 100명과 본인만 반환합니다.
      const ranked = await prisma.$queryRaw<Array<any>>`
        WITH eligible AS (
          SELECT m.id, m.name, m.points, a.name AS "academyName", c.name AS "className"
          FROM members m JOIN academies a ON a.id = m."academyId"
          LEFT JOIN class_groups c ON c.id = m."classGroupId"
          WHERE m.role = 'STUDENT' AND m.status = 'APPROVED' AND a.status = 'ACTIVE' AND a."deletedAt" IS NULL
            AND (${scope === 'national'} OR m."academyId" = ${user.academyId})
            AND (${scope !== 'class'} OR m."classGroupId" = ${user.classGroupId || ''})
        ), points AS (
          SELECT p."memberId", SUM(p.amount) AS amount FROM point_histories p JOIN eligible e ON e.id = p."memberId"
          WHERE p."createdAt" >= ${periodWindow.gte} AND p."createdAt" < ${periodWindow.lt} GROUP BY p."memberId"
        ), books AS (
          SELECT q."memberId", COUNT(DISTINCT q."bookId") AS count FROM quiz_attempts q JOIN eligible e ON e.id = q."memberId"
          WHERE q.score >= 60 AND q."completedAt" >= ${periodWindow.gte} AND q."completedAt" < ${periodWindow.lt} GROUP BY q."memberId"
        ), ranked AS (
          SELECT e.*, COALESCE(p.amount, 0) AS amount, COALESCE(b.count, 0) AS books,
            ROW_NUMBER() OVER (ORDER BY COALESCE(p.amount, 0) DESC, COALESCE(b.count, 0) DESC, e.name, e.id) AS rank,
            COUNT(*) OVER () AS participants
          FROM eligible e LEFT JOIN points p ON p."memberId" = e.id LEFT JOIN books b ON b."memberId" = e.id
        ) SELECT * FROM ranked WHERE rank <= 100 OR id = ${user.id} ORDER BY rank`;
      const ids = ranked.map(r => r.id);
      const [settings, progress] = await Promise.all([
        prisma.portalSetting.findMany({ where: { key: { in: ids.map(id => 'character:' + id) } }, select: { key: true, value: true } }),
        readingProgress(prisma, ids)
      ]);
      const characters = new Map(settings.map(r => [r.key.slice(10), (r.value as any)?.characterId]));
      const rows = ranked.filter(r => Number(r.rank) <= 100).map(r => {
        const counts = progress.get(r.id);
        const selected = characters.get(r.id) || 'nano';
        const charId = Object.prototype.hasOwnProperty.call(Reading.rules, selected) && Reading.stage(selected, counts) > 0 ? selected : 'nano';
        return { rank: Number(r.rank), name: scope === 'national' && r.id !== user.id ? r.name.slice(0, 1) + '**' : r.name,
          pt: Number(r.amount), books: Number(r.books), me: r.id === user.id, charId, stage: Reading.stage(charId, counts),
          cls: scope === 'national' ? [r.academyName, r.className].filter(Boolean).join(' · ') : r.className || '학급 미지정',
          academyName: r.academyName, className: r.className || '', change: 'same', changeNum: 0 };
      });
      const own = ranked.find(r => r.id === user.id);
      return res.json({ scope, academyName: user.academy.name, className: user.classGroup?.name || '', hasClass: !!user.classGroupId,
        rows, myRank: own ? Number(own.rank) : null, participants: Number(ranked[0]?.participants || 0),
        myPoints: Number(own?.amount || 0), myTotalPoints: own?.points ?? user.points, myBooks: progress.get(user.id)?.totalRead || 0 });
    }
    if (action === 'popular') {
      const period = String(req.query.period || 'daily');
      need(['daily', 'weekly', 'monthly'].includes(period), '조회 기간을 확인해 주세요.');
      const today = getTodayStartUtc();
      const start = period === 'monthly' ? monthWindow('month').gte : period === 'weekly' ? new Date(+today - 6 * 86400000) : today;
      const counts = await prisma.quizAttempt.groupBy({ by: ['bookId'], where: { score: { gte: 60 }, completedAt: { gte: start, lt: new Date(+today + 86400000) } }, _count: { id: true } });
      const books = await prisma.book.findMany({ where: { id: { in: counts.map(c => c.bookId) } }, select: { id: true, bookNo: true } });
      const byId = new Map(books.map(b => [b.id, b.bookNo]));
      return res.json({ period, items: counts.filter(c => byId.has(c.bookId)).map(c => ({ bookId: byId.get(c.bookId), count: c._count.id })) });
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
