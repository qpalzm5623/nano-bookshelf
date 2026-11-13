import { prisma } from '../lib/prisma';
import { authenticate, staff, master, need, text, failure, academyScope } from '../lib/portal-http';
import { hashPassword } from '../lib/portal-auth';
import { randomUUID } from 'node:crypto';
import { monthWindow } from '../lib/portal-learning';
import { loadContentAccess, quizContent, canReadContent, bookSheets, sheetView } from '../lib/portal-content';

let quizAuthorMap: Record<string, any> = {};
try { quizAuthorMap = require('../lib/quiz-authors.json'); } catch {}

// 학원 고유 ID를 음수 정수(legacyQuizSeq)로 결정론적 변환하여 본사/레거시 양수 시퀀스와 충돌 없이 학원별 출제 세트를 격리
function computeAcademyQuizSeq(acadKey: string): number {
  let hash = 2166136261;
  for (let i = 0; i < acadKey.length; i++) {
    hash ^= acadKey.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  const positive = Math.abs(hash | 0) % 1800000000;
  return -(100000 + positive);
}

export const config = { api: { bodyParser: { sizeLimit: '4mb' } } };

const memberFields = { id: true, username: true, name: true, role: true, status: true, grade: true, school: true, gender: true, phone: true,
  parentName: true, parentPhone: true, parentEmail: true, reportYn: true, classGroupId: true, points: true, bookCount: true, quizAvg: true, updatedAt: true } as const;
function enumValue(value: any, values: string[], label: string) { need(values.includes(value), label + ' 값을 확인해 주세요.'); return value; }
function date(value: any, label: string) { const result = new Date(value); need(Number.isFinite(+result), label + ' 날짜를 입력해 주세요.'); return result; }
// 마스터(전국/특정 가맹점) 및 학원 관리자 포트폴리오 조회·보강 헬퍼
async function queryPortfolios(academyId: string, isMasterAll: boolean, query: any) {
  const targetId = typeof query?.id === 'string' ? query.id.trim() : '';
  const where: any = isMasterAll
    ? { scope: { startsWith: 'portfolio:' }, ...(targetId ? { key: targetId } : {}) }
    : { scope: 'portfolio:' + academyId, ...(targetId ? { key: targetId } : {}) };

  const rows = await prisma.portalSetting.findMany({
    where,
    orderBy: { updatedAt: 'desc' }
  });

  const academyIds = [...new Set(rows.map((r: any) => String(r.scope || '').replace(/^portfolio:/, '')).filter(Boolean))];
  const memberIds = [...new Set(rows.map((r: any) => (r.value as any)?.memberId).filter(Boolean).map(String))];

  const [academies, members] = await Promise.all([
    academyIds.length && typeof prisma.academy?.findMany === 'function'
      ? prisma.academy.findMany({
          where: { id: { in: academyIds }, deletedAt: null },
          select: { id: true, code: true, name: true }
        })
      : Promise.resolve([]),
    memberIds.length && typeof prisma.member?.findMany === 'function'
      ? prisma.member.findMany({
          where: { id: { in: memberIds } },
          select: {
            id: true,
            username: true,
            name: true,
            school: true,
            grade: true,
            classGroup: { select: { name: true } }
          }
        })
      : Promise.resolve([])
  ]);

  const academyMap = new Map(academies.map((a: any) => [a.id, a]));
  const memberMap = new Map(members.map((m: any) => [m.id, m]));
  const hasAcademyFilter = isMasterAll && academyIds.length > 0 && typeof prisma.academy?.findMany === 'function';

  const enriched = rows
    .map((p: any) => {
      const rowAcadId = String(p.scope || '').replace(/^portfolio:/, '');
      const acad: any = academyMap.get(rowAcadId);
      if (hasAcademyFilter && !acad) return null;

      const val = (p.value || {}) as any;
      const stu: any = memberMap.get(String(val.memberId || ''));
      const booksArr = Array.isArray(val.books) ? val.books : [];
      const scores = booksArr
        .map((b: any) => (b?.score == null || b?.score === '' ? NaN : Number(String(b.score).replace(/[^0-9.]/g, ''))))
        .filter(Number.isFinite);

      const fallbackQuizAvg = val.quizAvg != null && val.quizAvg !== '' ? Number(String(val.quizAvg).replace(/[^0-9.]/g, '')) : NaN;
      const quizAvgNum = scores.length
        ? Math.round((scores.reduce((sum: number, n: number) => sum + n, 0) / scores.length) * 10) / 10
        : (Number.isFinite(fallbackQuizAvg) ? fallbackQuizAvg : null);

      const rawDate = val.createdAt || p.updatedAt || p.createdAt;
      const parsedDate = rawDate ? new Date(rawDate) : new Date();
      const kstIso = Number.isFinite(+parsedDate) ? new Date(+parsedDate + 9 * 3600000).toISOString() : '';
      const kstDate = kstIso ? kstIso.slice(0, 10) : '';
      const issueDate = kstIso ? `${kstIso.slice(0, 10)} ${kstIso.slice(11, 16)}` : '';

      return {
        ...val,
        id: p.key,
        revision: p.revision,
        academyId: acad?.code || val.academyId || '',
        academyName: acad?.name || val.academyName || '',
        studentId: stu?.username || val.studentId || '',
        studentName: stu?.name || val.name || val.studentName || '학생',
        school: stu?.school || val.school || '',
        grade: stu?.grade || val.grade || '',
        classGroup: stu?.classGroup?.name || val.classGroup || '미지정',
        period: val.period || (val.from && val.to ? `${val.from} ~ ${val.to}` : ''),
        bookCount: booksArr.length,
        quizAvgNum,
        quizAvg: quizAvgNum !== null ? `${quizAvgNum}점` : (val.quizAvg || '-'),
        issueDate,
        kstDate,
        createdAt: val.createdAt || (Number.isFinite(+parsedDate) ? parsedDate.toISOString() : '')
      };
    })
    .filter(Boolean) as any[];

  const curKstYm = new Date(Date.now() + 9 * 3600000).toISOString().slice(0, 7);
  const scoredItems = enriched.filter(item => typeof item.quizAvgNum === 'number' && Number.isFinite(item.quizAvgNum));
  const totalBookCount = enriched.reduce((sum, item) => sum + (Number(item.bookCount) || 0), 0);
  const stats = {
    totalIssuedCount: enriched.length,
    monthIssuedCount: enriched.filter(item => String(item.kstDate || '').slice(0, 7) === curKstYm).length,
    totalBookCount,
    avgBookCount: enriched.length ? Math.round((totalBookCount / enriched.length) * 10) / 10 : 0,
    avgQuizScore: scoredItems.length
      ? Math.round((scoredItems.reduce((sum, item) => sum + item.quizAvgNum, 0) / scoredItems.length) * 10) / 10
      : 0
  };

  if (targetId) {
    return { items: enriched, stats };
  }

  const classGroup = typeof query?.classGroup === 'string' ? query.classGroup.trim() : '';
  const startDate = typeof query?.startDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(query.startDate) ? query.startDate : '';
  const endDate = typeof query?.endDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(query.endDate) ? query.endDate : '';
  const search = typeof query?.search === 'string' ? query.search.trim().slice(0, 100).toLowerCase() : '';

  const filtered = enriched.filter(item => {
    if (classGroup && classGroup.toUpperCase() !== 'ALL' && item.classGroup !== classGroup) return false;
    if (startDate && (!item.kstDate || item.kstDate < startDate)) return false;
    if (endDate && (!item.kstDate || item.kstDate > endDate)) return false;
    if (search) {
      const hay = [item.studentName, item.studentId, item.title, item.academyName, item.school, item.id, item.period]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      if (!hay.includes(search)) return false;
    }
    return true;
  });

  filtered.sort((a, b) => String(b.createdAt || b.issueDate || '').localeCompare(String(a.createdAt || a.issueDate || '')));
  return { items: filtered, stats };
}

export default async function handler(req: any, res: any) {
  res.setHeader('Cache-Control', 'no-store');
  try {
    const user = await authenticate(req); staff(user);
    const entity = String(req.query.entity || 'members');
    // 학원 자체의 생성·수정은 아직 존재하지 않는 코드도 받을 수 있으므로 세션 학원을 기준으로 권한만 확인합니다.
    const isMasterAllPortfolios = entity === 'portfolios' && req.method === 'GET' && user.role === 'MASTER' && (!req.query.academy || String(req.query.academy).trim().toUpperCase() === 'ALL');
    const academyId = (entity === 'academies' || isMasterAllPortfolios) ? user.academyId : await academyScope(user, req.query.academy);
    const body = req.body || {}; const input = body.data || body;
    if (req.method === 'POST') {
      need(['save','delete','import','restore'].includes(body.operation) || (entity === 'themes' && body.operation === 'reorder') || (entity === 'quizzes' && (body.operation === 'replace' || body.operation === 'bulk_import')) || entity === 'summarize_synopsis', '요청 작업을 확인해 주세요.');
      if (body.operation === 'restore') need(entity === 'academies', '복구할 수 없는 항목입니다.');
      if (body.operation === 'delete' || body.operation === 'restore') need(typeof input.id === 'string' && input.id.length > 0, '대상 항목을 선택해 주세요.');
    }
    if (req.method === 'GET') {
      if (entity === 'rankings') {
        const mode = req.query.mode ? String(req.query.mode).toUpperCase() : '';
        if (!mode) {
          const totals = await prisma.pointHistory.groupBy({ by: ['memberId'], where: { createdAt: monthWindow(String(req.query.period)), member: { academyId, role: 'STUDENT', status: 'APPROVED' } }, _sum: { amount: true } });
          totals.sort((a,b) => (b._sum.amount || 0) - (a._sum.amount || 0) || a.memberId.localeCompare(b.memberId));
          const members = await prisma.member.findMany({ where: { id: { in: totals.map(t => t.memberId) } }, select: { id: true, name: true, username: true } });
          return res.json({ items: totals.map((t,index) => ({ id: t.memberId, rank: index + 1, name: members.find(m => m.id === t.memberId)?.name || '', username: members.find(m => m.id === t.memberId)?.username, points: t._sum.amount || 0 })) });
        }

        // 확장 랭킹 조회 (MONTH / RANGE / ALL) - 학원 관리자 및 본사 마스터 전국 랭킹 실데이터 엔진
        need(['MONTH', 'RANGE', 'ALL'].includes(mode), '랭킹 조회 모드를 확인해 주세요.');
        const isGlobal = String(req.query.scope || '') === 'global';
        if (isGlobal) master(user);

        let gteDate: Date | null = null;
        let ltDate: Date | null = null;
        if (mode === 'MONTH') {
          const mw = monthWindow(String(req.query.month || req.query.period || 'month'));
          gteDate = mw.gte;
          ltDate = mw.lt;
        } else if (mode === 'RANGE') {
          const sMatch = String(req.query.startDate || '').trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
          const eMatch = String(req.query.endDate || '').trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
          if (sMatch) gteDate = new Date(Date.UTC(Number(sMatch[1]), Number(sMatch[2]) - 1, Number(sMatch[3])) - 9 * 3600000);
          if (eMatch) ltDate = new Date(Date.UTC(Number(eMatch[1]), Number(eMatch[2]) - 1, Number(eMatch[3]) + 1) - 9 * 3600000);
          if (gteDate && ltDate) need(ltDate > gteDate, '조회 시작일과 종료일을 확인해 주세요.');
        }

        const hasLower = gteDate !== null;
        const hasUpper = ltDate !== null;
        const lowerBound = gteDate || new Date(0);
        const upperBound = ltDate || new Date('2100-01-01T00:00:00Z');

        const studentRows = await prisma.$queryRaw<Array<any>>`
          WITH eligible AS (
            SELECT m.id, m.username, m.name, m.grade, m."academyId",
                   a.code AS "academyCode", a.name AS "academyName", a.address AS "academyRegion",
                   c.name AS "className"
            FROM members m
            JOIN academies a ON a.id = m."academyId"
            LEFT JOIN class_groups c ON c.id = m."classGroupId"
            WHERE m.role = 'STUDENT' AND m.status = 'APPROVED'
              AND a.status = 'ACTIVE' AND a."deletedAt" IS NULL
              AND (${isGlobal} OR m."academyId" = ${academyId})
          ),
          pt_agg AS (
            SELECT p."memberId", GREATEST(0, COALESCE(SUM(p.amount), 0))::int AS points
            FROM point_histories p
            JOIN eligible e ON e.id = p."memberId"
            WHERE (${!hasLower} OR p."createdAt" >= ${lowerBound})
              AND (${!hasUpper} OR p."createdAt" < ${upperBound})
              AND (${!isGlobal} OR COALESCE(p."pointType", '') NOT LIKE 'MANUAL%')
            GROUP BY p."memberId"
          ),
          qa_agg AS (
            SELECT q."memberId",
                   COUNT(DISTINCT CASE WHEN q.score >= 60 THEN q."bookId" END)::int AS books,
                   ROUND(AVG(q.score)::numeric, 1)::float AS "quizAvg",
                   MAX(q."completedAt") AS "lastCompletedAt"
            FROM quiz_attempts q
            JOIN eligible e ON e.id = q."memberId"
            WHERE (${!hasLower} OR q."completedAt" >= ${lowerBound})
              AND (${!hasUpper} OR q."completedAt" < ${upperBound})
            GROUP BY q."memberId"
          )
          SELECT e.id, e.username, e.name, e.grade, e."academyCode", e."academyName", e."academyRegion", e."className",
                 COALESCE(p.points, 0)::int AS points,
                 COALESCE(qa.books, 0)::int AS books,
                 qa."quizAvg",
                 qa."lastCompletedAt"
          FROM eligible e
          LEFT JOIN pt_agg p ON p."memberId" = e.id
          LEFT JOIN qa_agg qa ON qa."memberId" = e.id
          ORDER BY COALESCE(p.points, 0) DESC, COALESCE(qa.books, 0) DESC, e.name ASC, e.id ASC
        `;

        const monthsRows = await prisma.$queryRaw<Array<{ month: string }>>`
          SELECT DISTINCT to_char(p."createdAt" + interval '9 hours', 'YYYY-MM') AS month
          FROM point_histories p
          JOIN members m ON m.id = p."memberId"
          WHERE m.role = 'STUDENT' AND (${isGlobal} OR m."academyId" = ${academyId})
          ORDER BY month DESC
          LIMIT 24
        `;

        let academyItems: any[] = [];
        if (isGlobal) {
          const acadMap = new Map<string, { code: string; name: string; region: string; students: number; activeStudents: number; points: number; books: number }>();
          for (const r of studentRows) {
            if (r.academyCode === 'ACAD-HQ') continue;
            const key = r.academyCode || r.academyName;
            const cur = acadMap.get(key) || {
              code: r.academyCode || '',
              name: r.academyName || '소속 미상',
              region: String(r.academyRegion || '').split(' ').slice(0, 2).join(' ') || '전국',
              students: 0,
              activeStudents: 0,
              points: 0,
              books: 0,
            };
            cur.students += 1;
            const pts = Number(r.points) || 0;
            const bks = Number(r.books) || 0;
            if (pts > 0 || bks > 0) cur.activeStudents += 1;
            cur.points += pts;
            cur.books += bks;
            acadMap.set(key, cur);
          }
          academyItems = Array.from(acadMap.values())
            .filter((ac) => ac.points > 0 || mode === 'ALL')
            .sort((a, b) => b.points - a.points || b.books - a.books || a.name.localeCompare(b.name, 'ko'))
            .map((ac, idx) => ({
              rank: idx + 1,
              code: ac.code,
              name: ac.name,
              region: ac.region,
              students: ac.students,
              avgBooks: (ac.students > 0 ? (ac.books / ac.students).toFixed(1) : '0.0') + '권',
              participation: (ac.students > 0 ? Math.min(100, Math.round((ac.activeStudents / ac.students) * 100)) : 0) + '%',
              points: ac.points,
              badge: idx === 0 ? '최우수 가맹점' : idx < 3 ? '우수 가맹점' : '일반 가맹점',
            }));
        }

        const activeStudents = studentRows.filter((r) => Number(r.points) > 0);
        const topStudents = (isGlobal ? activeStudents.slice(0, 500) : activeStudents).map((r, idx) => ({
          id: r.username,
          serverId: r.id,
          username: r.username,
          rank: idx + 1,
          name: r.name,
          academy: r.academyName,
          academyCode: r.academyCode,
          className: r.className || '미지정',
          grade: r.grade || '미등록',
          books: Number(r.books) || 0,
          quizAvg: r.quizAvg != null ? Number(r.quizAvg) : null,
          accRate: r.quizAvg != null ? `${Math.round(Number(r.quizAvg))}%` : '-',
          points: Number(r.points) || 0,
          lastCompletedAt: r.lastCompletedAt ? new Date(r.lastCompletedAt).toISOString() : null,
        }));

        return res.json({
          mode,
          months: monthsRows.map((m) => m.month).filter(Boolean),
          items: topStudents,
          academyItems,
        });
      }
      if (entity === 'point_logs') {
        const targetKey = String(req.query.memberId || req.query.username || '').trim();
        need(targetKey.length > 0, '조회할 원생을 선택해 주세요.');
        const student = await prisma.member.findFirst({
          where: {
            role: 'STUDENT',
            ...(user.role === 'MASTER' ? {} : { academyId }),
            OR: [{ id: targetKey }, { username: targetKey }],
          },
          select: { id: true, username: true, name: true, points: true },
        });
        need(student, '해당 원생 정보를 찾을 수 없습니다.', 404);
        const logs = await prisma.pointHistory.findMany({
          where: { memberId: student!.id },
          orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
          take: 100,
        });
        return res.json({ student, items: logs });
      }
      if (entity === 'members') return res.json({ items: await prisma.member.findMany({ where: { academyId }, select: memberFields, orderBy: { name: 'asc' } }) });
      if (entity === 'classes') return res.json({ items: await prisma.classGroup.findMany({ where: { academyId }, orderBy: { name: 'asc' } }) });
      if (entity === 'academies') { master(user); return res.json({ items: await prisma.academy.findMany({ where: { deletedAt: null }, orderBy: { name: 'asc' } }) }); }
      if (entity === 'books') {
        const access = await loadContentAccess(prisma);
        const books = await prisma.book.findMany({ orderBy: { bookNo: 'asc' }, take: 1000, where: req.query.search ? { title: { contains: String(req.query.search), mode: 'insensitive' } } : {} });
        return res.json({ items: books.map(book => {
          const sheets = bookSheets(access, book).filter(sheet => canReadContent(user, sheet, access)).map(sheet => sheetView(sheet, user));
          return { ...book, worksheetUrl: sheets[0]?.url || null, worksheetList: sheets, hasSheet: sheets.length > 0 };
        }) });
      }
      if (entity === 'owned') return res.json({ items: await prisma.academyBook.findMany({ where: { academyId }, include: { book: { select: { bookNo: true, title: true } } } }) });
      if (entity === 'assignments') return res.json({ items: await prisma.bookAssignment.findMany({ where: { academyId }, include: { book: { select: { title: true, bookNo: true } }, member: { select: { name: true, username: true } } }, orderBy: { createdAt: 'desc' } }) });
      if (entity === 'payments') return res.json({ items: await prisma.payment.findMany({ where: { academyId, deletedAt: null }, orderBy: { createdAt: 'desc' } }) });
      if (entity === 'notices') {
        const [noticeRows, metaRows] = await Promise.all([
          prisma.notice.findMany({ orderBy: { createdAt: 'desc' } }),
          prisma.portalSetting.findMany({ where: { scope: 'notice_meta' } })
        ]);
        const metaMap = new Map(metaRows.map(m => [m.key.replace(/^notice_meta:/, ''), (m.value || {}) as Record<string, any>]));
        return res.json({ items: noticeRows.map(n => ({ ...n, ...(metaMap.get(n.id) || {}) })) });
      }
      if (entity === 'themes') {
        const [themeRows, metaRows] = await Promise.all([
          prisma.themeCategory.findMany({ orderBy: { name: 'asc' } }),
          prisma.portalSetting.findMany({ where: { scope: 'theme_meta' } })
        ]);
        const metaMap = new Map(metaRows.map(m => [m.key.replace(/^theme_meta:/, ''), (m.value || {}) as Record<string, any>]));
        const items = themeRows.map(t => {
          const meta = metaMap.get(t.id) || {};
          const parsedOrder = typeof meta.order === 'number' && Number.isFinite(meta.order) ? meta.order : (parseInt(meta.order, 10) || null);
          return { ...t, ...meta, order: parsedOrder };
        }).sort((a, b) => {
          const oa = a.order != null ? a.order : 9999;
          const ob = b.order != null ? b.order : 9999;
          return oa !== ob ? oa - ob : String(a.id).localeCompare(String(b.id));
        });
        return res.json({ items });
      }
      if (entity === 'banners') {
        const [bannerRows, metaRows] = await Promise.all([
          prisma.mainBanner.findMany({ orderBy: { orderNo: 'asc' } }),
          prisma.portalSetting.findMany({ where: { scope: 'banner_meta' } })
        ]);
        const metaMap = new Map(metaRows.map(m => [m.key.replace(/^banner_meta:/, ''), (m.value || {}) as Record<string, any>]));
        return res.json({
          items: bannerRows.map(b => {
            const meta = metaMap.get(b.id) || {};
            let linkBookIds: string[] = [];
            let linkSub = '';
            if (typeof b.linkUrl === 'string' && b.linkUrl.startsWith('#')) {
              try {
                const params = new URLSearchParams(b.linkUrl.slice(1));
                const rawBooks = params.get('books') || '';
                if (rawBooks) linkBookIds = rawBooks.split(',').map(s => s.trim()).filter(Boolean);
                linkSub = params.get('sub') || '';
              } catch {}
            }
            return {
              ...b,
              ...meta,
              sub: meta.sub || linkSub || '',
              bookIds: Array.isArray(meta.bookIds) && meta.bookIds.length > 0 ? meta.bookIds : linkBookIds
            };
          })
        });
      }
      if (entity === 'quizzes') {
        need(req.query.bookId, '도서를 선택해 주세요.');
        const access = await loadContentAccess(prisma);
        const items = await prisma.bookQuiz.findMany({ where: { bookId: String(req.query.bookId) }, orderBy: { questionNo: 'asc' } });
        return res.json({ items: items.filter(q => canReadContent(user, quizContent(access, q.bookId, q.legacyQuizSeq || 0), access)) });
      }
      if (entity === 'dispatch') return res.json({ items: await prisma.aligoDispatchLog.findMany({ where: { academyId }, orderBy: { sentAt: 'desc' }, take: 200 }) });
      if (entity === 'portfolios') return res.json(await queryPortfolios(academyId, isMasterAllPortfolios, req.query));
      if (entity === 'ai_config') {
        master(user);
        const row = await prisma.portalSetting.findUnique({ where: { key: 'gemini_api_config' } });
        const val = ((row?.value as any) || {}) as Record<string, any>;
        const rawKey = typeof val.apiKey === 'string' ? val.apiKey.trim() : '';
        return res.json({
          hasKey: Boolean(rawKey),
          maskedKey: rawKey ? (rawKey.slice(0, 6) + '...' + rawKey.slice(-4)) : '',
          model: val.model || 'gemini-3.8-flash',
          updatedAt: val.updatedAt || ''
        });
      }
      throw new Error('Unknown collection');
    }
    need(JSON.stringify(body).length < 500000, '한 번에 등록할 수 있는 데이터 크기를 초과했습니다.', 413);
    if (entity === 'portfolios') {
      const scope = 'portfolio:' + academyId;
      if (body.operation === 'delete') { await prisma.portalSetting.deleteMany({ where: { key: input.id, scope } }); return res.json({ ok: true }); }
      // 총평 편집 시 기존 도서 선택과 AI 분석을 재계산하거나 지우지 않습니다.
      if (input.id) {
        const existing = await prisma.portalSetting.findFirst({ where: { key: input.id, scope } });
        need(existing, '포트폴리오를 찾을 수 없습니다.', 404);
        const comment = text(input.comment, '총평', 20000);
        const value = { ...(existing.value as any), comment, commentSource: comment ? 'teacher' : 'ai' };
        const saved = await prisma.portalSetting.updateMany({ where: { key: input.id, scope, revision: Number(input.revision) }, data: { value, revision: { increment: 1 } } });
        need(saved.count === 1, '다른 선생님이 수정했습니다. 새로고침 후 다시 저장해 주세요.', 409);
        return res.json({ ok: true, id: input.id });
      }
      const student = await prisma.member.findFirst({ where: { id: input.memberId, academyId, role: 'STUDENT' } }); need(student, '소속 학생을 선택해 주세요.');
      const from = date(input.from, '시작'), to = date(input.to, '종료'); need(to >= from, '기간을 확인해 주세요.');
      // 한국 표준시(KST, UTC+9) 자정부터 종료일 23:59:59까지 포함하도록 조회 범위 보정
      const kstFrom = new Date(+from - 9 * 3600000);
      const kstTo = new Date(+to + 86400000);
      let logs = await prisma.quizAttempt.findMany({ where: { memberId: student.id, score: { gte: 60 }, completedAt: { gte: kstFrom, lt: kstTo } }, orderBy: { completedAt: 'desc' } });
      if (logs.length === 0) {
        logs = await prisma.quizAttempt.findMany({ where: { memberId: student.id, score: { gte: 60 } }, orderBy: { completedAt: 'desc' } });
      }
      const logBookIds = [...new Set(logs.map(l => l.bookId))];
      const books = logBookIds.length > 0
        ? await prisma.book.findMany({ where: { OR: [{ id: { in: logBookIds } }, { bookNo: { in: logBookIds } }] }, select: { id: true, bookNo: true, title: true, publisher: true, coverUrl: true, author: true } })
        : [];
      const selectedTitlesNorm = Array.isArray(input.selectedTitles)
        ? input.selectedTitles.map((t: any) => String(t).replace(/\s+/g, '')).filter(Boolean)
        : [];
      const selectedAttemptIds = Array.isArray(input.selectedAttemptIds)
        ? input.selectedAttemptIds.map((id: any) => String(id).trim()).filter(Boolean)
        : [];
      const buildCertBooks = (filterBySelected: boolean) => {
        const list = [];
        for (const l of logs) {
          const matchedBook = books.find(b => b.id === l.bookId || b.bookNo === l.bookId);
          const bookTitle = matchedBook?.title || '삭제된 도서';
          if (filterBySelected) {
            if (selectedAttemptIds.length > 0) {
              if (!selectedAttemptIds.includes(String(l.id))) continue;
            } else if (selectedTitlesNorm.length > 0) {
              if (!selectedTitlesNorm.includes(bookTitle.replace(/\s+/g, ''))) continue;
            }
          }
          const completedDate = l.completedAt instanceof Date ? l.completedAt : new Date(l.completedAt);
          const kstDateStr = new Date(+completedDate + 9 * 3600000).toISOString().slice(0, 10);
          list.push({
            attemptId: l.id,
            bookId: l.bookId,
            title: bookTitle,
            pub: matchedBook?.publisher || '',
            cover: matchedBook?.coverUrl || '',
            author: matchedBook?.author || '',
            date: kstDateStr,
            score: l.score,
            thought: l.thinkReply || ''
          });
        }
        return list;
      };
      let certBooks = buildCertBooks(true);
      if (certBooks.length === 0 && logs.length > 0) {
        certBooks = buildCertBooks(false);
      }
      const reportTitle = typeof input.title === 'string' && input.title.trim() ? text(input.title, '리포트 명칭', 200, true) : (student.name + ' 독서 포트폴리오');
      const comment = text(input.comment, '총평', 20000);
      const value = { memberId: student.id, name: student.name, from: input.from, to: input.to, comment, commentSource: comment ? 'teacher' : 'ai',
        books: certBooks,
        title: reportTitle, createdAt: new Date().toISOString() };
      const created = await prisma.portalSetting.create({ data: { key: 'pf_' + randomUUID(), scope, value } });
      return res.json({ ok: true, id: created.key });
    }
    if (entity === 'owned') {
      if (body.operation === 'delete') { await prisma.academyBook.deleteMany({ where: { id: input.id, academyId } }); return res.json({ ok: true }); }
      need(await prisma.book.findUnique({ where: { id: input.bookId } }), '도서를 선택해 주세요.');
      return res.json({ item: await prisma.academyBook.upsert({ where: { academyId_bookId: { academyId, bookId: input.bookId } }, create: { academyId, bookId: input.bookId }, update: {} }) });
    }
    if (entity === 'members') {
      need(user.role === 'DIRECTOR' || user.role === 'MASTER', '회원 변경은 원장 또는 본사 관리자만 가능합니다.', 403);
      const rows = body.operation === 'import' ? body.rows : [input];
      need(Array.isArray(rows) && rows.length > 0 && rows.length <= 200, '회원은 한 번에 1~200명까지 등록할 수 있습니다.');
      const items = await prisma.$transaction(async tx => {
        await tx.$queryRaw`SELECT id FROM academies WHERE id = ${academyId} FOR UPDATE`;
        const saved = [];
        for (const row of rows) {
          const existing = (row.id ? await tx.member.findFirst({ where: { id: String(row.id), academyId } }) : null)
            || (row.username ? await tx.member.findFirst({ where: { username: String(row.username), academyId } }) : null);
          need(!row.id || existing, '해당 학원의 회원을 찾을 수 없습니다.', 404);
          need(existing?.role !== 'MASTER', '본사 계정 변경은 계정 설정에서 진행해 주세요.', 403);
          need(existing?.id !== user.id || body.operation !== 'delete', '본인 계정은 삭제할 수 없습니다.');
          if (body.operation === 'delete') { need(user.role === 'MASTER' || existing!.role !== 'DIRECTOR', '원장 계정은 본사에서 관리합니다.', 403); saved.push(await tx.member.update({ where: { id: existing!.id }, data: { status: 'WITHDRAWN' }, select: memberFields })); continue; }
          const role = enumValue(row.role || 'STUDENT', ['STUDENT','TEACHER','DIRECTOR'], '권한') as any;
          if (user.role !== 'MASTER') need(role !== 'DIRECTOR' && existing?.role !== 'DIRECTOR', '원장·본사 계정은 본사에서 관리합니다.', 403);
          const username = text(row.username || existing?.username, '아이디', 50, true);
          need(/^[\w-]{3,50}$/.test(username), '아이디는 영문·숫자·밑줄·하이픈 3~50자로 입력해 주세요.');
          const classGroupId = row.classGroupId || null;
          if (classGroupId) need(await tx.classGroup.findFirst({ where: { id: classGroupId, academyId } }), '다른 학원의 학급을 선택할 수 없습니다.');
          const data: any = { academyId, username, role, name: text(row.name, '이름', 100, true), classGroupId,
            status: enumValue(row.status || 'PENDING', ['APPROVED','PENDING','SUSPENDED','WITHDRAWN'], '승인 상태'),
            grade: text(row.grade, '학년'), school: text(row.school, '학교'), gender: text(row.gender, '성별'), phone: text(row.phone, '연락처', 30),
            parentName: text(row.parentName, '보호자 이름'), parentPhone: text(row.parentPhone, '보호자 연락처', 30), parentEmail: text(row.parentEmail, '이메일'), reportYn: row.reportYn === true };
          if (existing?.id === user.id) need(data.role === existing.role && data.status === 'APPROVED', '본인의 권한과 승인 상태는 변경할 수 없습니다.');
          if (role === 'STUDENT' && data.status === 'APPROVED' && !(existing?.role === 'STUDENT' && existing.status === 'APPROVED')) {
            const academy = await tx.academy.findUniqueOrThrow({ where: { id: academyId } });
            const count = await tx.member.count({ where: { academyId, role: 'STUDENT', status: 'APPROVED' } });
            need(count < academy.maxStudents, '계약 정원을 초과했습니다. 본사에 정원 변경을 요청해 주세요.');
          }
          if (row.password) {
            const rawPw = String(row.password).trim();
            const isMasked = !rawPw || /^[•·*]+$/.test(rawPw);
            if (!isMasked) {
              const minLen = 6;
              need(rawPw.length >= minLen && rawPw.length <= 128, '비밀번호는 6~128자로 입력해 주세요.');
              data.password = hashPassword(rawPw);
            }
          }
          need(existing || data.password, '신규 회원의 비밀번호를 입력해 주세요.');
          if (existing) {
            if (row.updatedAt && !row.force) {
              const clientDate = new Date(row.updatedAt);
              const serverDate = existing.updatedAt;
              const isSameTime = !isNaN(clientDate.getTime()) && Math.abs(clientDate.getTime() - serverDate.getTime()) < 2000;
              const isSameIso = String(row.updatedAt).trim() === serverDate.toISOString();
              need(isSameTime || isSameIso, '다른 관리자가 수정한 회원입니다. 새로고침 후 다시 저장해 주세요.', 409);
            }
            const updated = await tx.member.update({ where: { id: existing.id }, data, select: memberFields });
            saved.push(updated);
          } else saved.push(await tx.member.create({ data, select: memberFields }));
        }
        return saved;
      }, { timeout: 30000 }); return res.json({ items });
    }
    if (entity === 'classes') {
      need(user.role !== 'TEACHER', '학급 변경은 원장 또는 본사 관리자만 가능합니다.', 403);
      const existing = input.id && await prisma.classGroup.findFirst({ where: { id: input.id, academyId } });
      need(!input.id || existing, '학급을 찾을 수 없습니다.', 404);
      if (body.operation === 'delete') {
        await prisma.classGroup.delete({ where: { id: existing.id } });
        try { await prisma.portalSetting.delete({ where: { key: 'class_meta:' + existing.id } }); } catch {}
        return res.json({ ok: true });
      }
      const data = { academyId, name: text(input.name, '학급명', 100, true), targetGrade: text(input.targetGrade, '대상 학년') };
      const item = existing ? await prisma.classGroup.update({ where: { id: existing.id }, data }) : await prisma.classGroup.create({ data });
      const teacherStr = typeof input.teacher === 'string' ? input.teacher.trim() : '';
      if (teacherStr !== undefined) {
        try {
          await prisma.portalSetting.upsert({
            where: { key: 'class_meta:' + item.id },
            create: { key: 'class_meta:' + item.id, scope: 'class_meta:' + academyId, value: { teacher: teacherStr } },
            update: { value: { teacher: teacherStr } }
          });
        } catch {}
      }
      return res.json({ item: { ...item, teacher: teacherStr } });
    }
    if (entity === 'assignments') {
      if (body.operation === 'delete') { const result = await prisma.bookAssignment.deleteMany({ where: { id: input.id, academyId } }); need(result.count, '배정 내역을 찾을 수 없습니다.', 404); return res.json({ ok: true }); }
      const requestedBooks = input.bookIds === undefined ? [input.bookId] : input.bookIds;
      need(Array.isArray(requestedBooks) && requestedBooks.length > 0 && requestedBooks.length <= 100, '배정할 도서는 한 번에 1~100권 선택해 주세요.');
      const bookIds = [...new Set(requestedBooks.map((id: any) => text(id, '도서 번호', 100, true)))];
      const books: { id: string }[] = [];
      for (const id of bookIds) {
        const book = await prisma.book.findFirst({ where: { OR: [{ id }, { bookNo: id }] } });
        need(book, '선택한 도서를 찾을 수 없습니다. 목록을 새로고침해 주세요.');
        if (!books.some(b => b.id === book.id)) books.push(book);
      }
      if (input.classGroupId) need(await prisma.classGroup.findFirst({ where: { id: text(input.classGroupId, '학급', 100, true), academyId } }), '소속 학급을 찾을 수 없습니다.', 404);
      const members = await prisma.member.findMany({ where: { academyId, role: 'STUDENT', status: 'APPROVED', ...(input.classGroupId ? { classGroupId: input.classGroupId } : { OR: [{ id: String(input.memberId || '') }, { username: String(input.memberId || '') }] }) }, select: { id: true } });
      need(members.length, '배정할 재원생이 없습니다.');
      const addedCount = await prisma.$transaction(async tx => {
        let added = 0;
        for (const member of members.sort((a, b) => a.id.localeCompare(b.id))) {
          // 같은 원생·도서 배정이 동시에 추가되지 않도록 회원 행 잠금을 사용합니다.
          await tx.$queryRaw`SELECT id FROM members WHERE id = ${member.id} FOR UPDATE`;
          for (const book of books) {
            if (!await tx.bookAssignment.findFirst({ where: { academyId, memberId: member.id, bookId: book.id, ...(input.bookIds === undefined ? { isCompleted: false } : {}) } })) {
              await tx.bookAssignment.create({ data: { academyId, memberId: member.id, bookId: book.id, status: 'ASSIGNED' } });
              added++;
            }
          }
        }
        return added;
      }, { timeout: 30000 }); return res.json({ ok: true, count: members.length, addedCount });
    }
    if (entity === 'points') {
      const targetKey = String(input.memberId || input.studentId || '').trim();
      need(targetKey.length > 0, '포인트를 조정할 원생을 선택해 주세요.');
      const delta = Number(input.amount);
      need(Number.isInteger(delta) && delta !== 0 && delta >= -100 && delta <= 100, '포인트는 한 번에 -100P ~ +100P 사이의 정수로 입력해 주세요.');
      const rawReason = text(input.content || input.reason, '사유', 500) || (delta > 0 ? '학원 선생님 독서 칭찬 수동 포인트 부여' : '학원 관리자 수동 포인트 차감');
      const roleLabel = user.role === 'TEACHER' ? '담당선생님' : '학원장';
      const content = rawReason.startsWith('[') ? rawReason : `[${roleLabel} 수동 ${delta > 0 ? '부여' : '차감'}] ${rawReason} (${delta > 0 ? '+' : ''}${delta}P)`;
      const saved = await prisma.$transaction(async (tx) => {
        const student = await tx.member.findFirst({
          where: { academyId, role: 'STUDENT', OR: [{ id: targetKey }, { username: targetKey }] },
          select: { id: true, points: true },
        });
        need(student, '소속 학원의 원생을 찾을 수 없습니다.', 404);
        await tx.$queryRaw`SELECT id FROM members WHERE id = ${student!.id} FOR UPDATE`;
        const current = await tx.member.findUniqueOrThrow({ where: { id: student!.id }, select: { id: true, points: true } });
        const nextPoints = Math.max(0, (current.points || 0) + delta);
        const logItem = await tx.pointHistory.create({
          data: {
            id: 'manual_' + randomUUID(),
            memberId: current.id,
            amount: delta,
            pointType: delta > 0 ? 'MANUAL_GRANT' : 'MANUAL_DEDUCT',
            content,
          },
        });
        await tx.member.update({ where: { id: current.id }, data: { points: nextPoints } });
        return { points: nextPoints, item: logItem };
      });
      return res.json({ ok: true, ...saved });
    }
    if (entity === 'payments') {
      need(false, '결제 관리 화면에서 상품과 입금 정보를 확인한 뒤 등록해 주세요.');
    }
    if (entity === 'academies') {
      master(user);
      const existing = input.id && await prisma.academy.findUnique({ where: { id: input.id } }); need(!input.id || existing, '학원을 찾을 수 없습니다.', 404);
      if (body.operation === 'delete') { need(existing.id !== user.academyId, '본사 계정의 소속 학원은 삭제할 수 없습니다.'); await prisma.academy.update({ where: { id: existing.id }, data: { deletedAt: new Date(), status: 'SUSPENDED' } }); return res.json({ ok: true }); }
      if (body.operation === 'restore') { need(existing.deletedAt, '삭제된 학원이 아닙니다.'); return res.json({ item: await prisma.academy.update({ where: { id: existing.id }, data: { deletedAt: null, status: 'ACTIVE' } }) }); }
      const rawUiStatus = String(input.status || 'ACTIVE').toUpperCase();
      need(['ACTIVE', 'UNAPPROVED', 'EXPIRING', 'EXPIRED', 'PAUSED', 'SUSPENDED', 'TERMINATED'].includes(rawUiStatus), '학원 상태 값을 확인해 주세요.');
      const dbStatus = rawUiStatus === 'TERMINATED' ? 'TERMINATED' : (rawUiStatus === 'PAUSED' || rawUiStatus === 'SUSPENDED') ? 'SUSPENDED' : 'ACTIVE';
      const data = { code: text(input.code, '학원 코드', 60, true), name: text(input.name, '학원명', 200, true), bizNo: text(input.bizNo, '사업자등록번호', 50), directorName: text(input.directorName, '원장 이름', 100, true), phone: text(input.phone, '연락처', 30), email: text(input.email, '이메일', 200), address: text(input.address, '주소', 500), memo: text(input.memo, '메모', 20000), joinDate: date(input.joinDate || input.startDate, '등록'),
        maxStudents: Number(input.maxStudents), monthlyFee: Number(input.monthlyFee) || 0, plan: enumValue(input.plan || 'STANDARD', ['BASIC','STANDARD','PREMIUM','VIP','ROYAL'], '요금제') as any,
        status: dbStatus as any, startDate: date(input.startDate, '시작'), endDate: date(input.endDate, '종료') };
      need(Number.isSafeInteger(data.maxStudents) && data.maxStudents > 0 && Number.isSafeInteger(data.monthlyFee) && data.monthlyFee >= 0 && data.endDate > data.startDate, '정원과 계약 기간·이용료를 확인해 주세요.');
      if (existing) need(data.maxStudents >= await prisma.member.count({ where: { academyId: existing.id, role: 'STUDENT', status: 'APPROVED' } }), '재원생 수보다 정원을 줄일 수 없습니다.');
      const academy = existing ? await prisma.academy.update({ where: { id: existing.id }, data }) : await prisma.academy.create({ data });
      if (prisma.portalSetting) {
        const acadMeta = { autoUnapprove: input.autoUnapprove === true, uiStatus: rawUiStatus };
        await prisma.portalSetting.upsert({
          where: { key: 'academy_meta:' + academy.id },
          update: { scope: 'academy_meta', value: acadMeta },
          create: { key: 'academy_meta:' + academy.id, scope: 'academy_meta', value: acadMeta }
        });
      }
      const adminUsername = input.adminId || input.username;
      if (adminUsername) {
        const cleanUsername = String(adminUsername).trim();
        const rawPassword = String(input.adminPw || input.password || 'nano123!').trim();
        const existingDirector = await prisma.member.findFirst({
          where: { OR: [{ username: cleanUsername }, { academyId: academy.id, role: 'DIRECTOR' }] }
        });
        if (existingDirector) {
          const updateData: any = { username: cleanUsername, academyId: academy.id, name: data.directorName, phone: data.phone, status: 'APPROVED' };
          if (rawPassword && !/^[•·*]+$/.test(rawPassword)) updateData.password = hashPassword(rawPassword);
          await prisma.member.update({ where: { id: existingDirector.id }, data: updateData });
        } else {
          await prisma.member.create({
            data: {
              academyId: academy.id,
              username: cleanUsername,
              name: data.directorName,
              role: 'DIRECTOR',
              status: 'APPROVED',
              phone: data.phone,
              password: hashPassword(rawPassword || 'nano123!')
            }
          });
        }
      }
      return res.json({ item: academy });
    }
    if (entity === 'books') {
      if (body.operation === 'delete') {
        const targetBook = await prisma.book.findUnique({ where: { id: input.id } });
        need(targetBook, '도서를 찾을 수 없습니다.', 404);
        if (user.role !== 'MASTER' && prisma.portalSetting) {
          const creatorSetting = await prisma.portalSetting.findUnique({ where: { key: `book_creator:${targetBook.bookNo}` } });
          const creatorData = creatorSetting?.value as any;
          need(creatorData && creatorData.academyId === academyId, '본사 도서 또는 타 학원의 도서는 삭제할 수 없습니다.', 403);
        }
        need(!await prisma.quizAttempt.count({ where: { bookId: input.id } }), '학습 기록이 있는 도서는 삭제할 수 없습니다.');
        await prisma.book.delete({ where: { id: input.id } });
        return res.json({ ok: true });
      }
      const data = { bookNo: text(input.bookNo, '도서 코드', 100, true), title: text(input.title, '도서명', 300, true), author: text(input.author, '저자', 200, true), publisher: text(input.publisher, '출판사'), isbn: text(input.isbn, 'ISBN'), grade: text(input.grade, '권장 학년'), category: text(input.category, '분류'), subCategory: text(input.subCategory, '세부 분류'), description: text(input.description, '소개', 20000), thinkTitle: text(input.thinkTitle, '생각꺼내기', 3000), thinkQuiz: text(input.thinkQuiz, '생각담기', 3000) };
      need(/^[A-Za-z0-9_-]+$/.test(data.bookNo), '도서 코드는 영문·숫자·하이픈·밑줄로 입력해 주세요.');
      for (const url of [input.coverUrl,input.worksheetUrl].filter(Boolean)) need(!/^javascript:/i.test(url) && /^(https?:\/\/|\/|\.\/|data:image\/|data:application\/pdf)/i.test(url), '자료 주소 형식을 확인해 주세요.');
      if (input.themeId) need(await prisma.themeCategory.findUnique({ where: { id: input.themeId } }), '테마를 확인해 주세요.');
      const rawSubject = String(input.subject || input.themeTag || '').replace(/^#/, '').trim();
      const extra = {
        themeId: input.themeId || null,
        isRecommended: input.isRecommended === true,
        coverUrl: text(input.coverUrl, '표지 주소', 2000),
        ...(input.worksheetUrl !== undefined ? { worksheetUrl: text(input.worksheetUrl, '학습지 주소', 2000) } : {}),
        tags: text(input.tags, '태그', 2000),
        series: text(input.series, '시리즈'),
        award: text(input.award || input.awards, '어워드', 1000),
        subject: text(rawSubject, '주제', 100)
      };

      // 1) ISBN 중복 검사
      if (data.isbn) {
        const cleanIsbn = data.isbn.replace(/[-\s]/g, '');
        if (cleanIsbn) {
          const existingIsbnBook = await prisma.book.findFirst({
            where: {
              OR: [
                { isbn: cleanIsbn },
                { isbn: data.isbn }
              ],
              ...(input.id ? { id: { not: input.id } } : {})
            }
          });
          need(!existingIsbnBook, `중복된 ISBN 넘버가 이미 등록되어 있습니다. (도서명: ${existingIsbnBook?.title || ''}, 코드: ${existingIsbnBook?.bookNo || ''})`, 409);
        }
      }

      // 2) 도서 코드(bookNo) 중복 검사
      const existingCodeBook = await prisma.book.findFirst({
        where: {
          OR: [
            { bookNo: data.bookNo },
            { id: data.bookNo }
          ],
          ...(input.id ? { id: { not: input.id } } : {})
        }
      });
      need(!existingCodeBook, `이미 등록된 도서 코드입니다. (도서명: ${existingCodeBook?.title || ''}, 코드: ${data.bookNo})`, 409);

      // 3) 도서 수정 시 권한 검사 (학원 사용자는 타 학원/본사 도서 수정 불가)
      if (input.id && user.role !== 'MASTER' && prisma.portalSetting) {
        const currentBook = await prisma.book.findUnique({ where: { id: input.id } });
        if (currentBook) {
          const creatorSetting = await prisma.portalSetting.findUnique({ where: { key: `book_creator:${currentBook.bookNo}` } });
          const creatorData = creatorSetting?.value as any;
          need(creatorData && creatorData.academyId === academyId, '본사 도서 또는 다른 학원의 도서는 수정할 수 없습니다.', 403);
        }
      }

      const savedBook = input.id
        ? await prisma.book.update({ where: { id: input.id }, data: { ...data, ...extra } })
        : await prisma.book.create({ data: { ...data, ...extra } });
      if (!input.id && user.role !== 'MASTER' && prisma.portalSetting) {
        const acad = await prisma.academy.findUnique({ where: { id: academyId }, select: { id: true, code: true, name: true } });
        if (acad) {
          const creatorKey = `book_creator:${savedBook.bookNo}`;
          await prisma.portalSetting.upsert({
            where: { key: creatorKey },
            update: { scope: 'book_creator', value: { academyId: acad.id, academyCode: acad.code, academyName: acad.name } },
            create: { key: creatorKey, scope: 'book_creator', value: { academyId: acad.id, academyCode: acad.code, academyName: acad.name } }
          });
        }
      }
      return res.json({ item: savedBook });
    }
    if (entity === 'quizzes') {
      if (body.operation === 'bulk_import' || (body.operation === 'import' && Array.isArray(body.items || body.rows))) {
        // 본사(MASTER) 및 학원 관리자/교사(DIRECTOR, TEACHER) 모두 북퀴즈 대량 등록 가능 (상단 staff(user) 검증 완료)
        const isMasterUser = user.role === 'MASTER';
        let academyQuizSeq: number | null = null;
        let academyMeta: { academyId: string; academyCode: string; academyName: string } | null = null;

        if (!isMasterUser) {
          const acad = await prisma.academy.findUnique({ where: { id: academyId }, select: { id: true, code: true, name: true } });
          need(!!acad, '소속 학원 정보를 확인할 수 없습니다.');
          academyQuizSeq = computeAcademyQuizSeq(acad!.code || acad!.id);
          academyMeta = { academyId: acad!.id, academyCode: acad!.code, academyName: acad!.name };
        }

        let groups = body.items;
        if (!groups && Array.isArray(body.rows)) {
          const groupMap = new Map<string, any[]>();
          for (const r of body.rows) {
            const bNo = String(r.bookNo || r.code || r.도서코드 || '').trim();
            if (!bNo) continue;
            if (!groupMap.has(bNo)) groupMap.set(bNo, []);
            groupMap.get(bNo)!.push(r);
          }
          groups = Array.from(groupMap.entries()).map(([bookNo, questions]) => ({ bookNo, questions }));
        }

        need(Array.isArray(groups) && groups.length > 0 && groups.length <= 500, '한 번에 1~500권의 도서 북퀴즈를 일괄 등록할 수 있습니다.');

        const bookNos = groups.map((g: any) => String(g.bookNo || '').trim()).filter(Boolean);
        const matchedBooks = await prisma.book.findMany({
          where: {
            OR: [
              { bookNo: { in: bookNos } },
              { id: { in: bookNos } }
            ]
          },
          select: { id: true, bookNo: true, title: true }
        });

        const bookMap = new Map<string, { id: string; bookNo: string; title: string }>();
        matchedBooks.forEach(b => {
          bookMap.set(b.bookNo.toUpperCase(), b);
          bookMap.set(b.bookNo, b);
          bookMap.set(b.id.toUpperCase(), b);
          bookMap.set(b.id, b);
        });

        const missingCodes = bookNos.filter(code => !bookMap.has(code) && !bookMap.has(code.toUpperCase()));
        need(missingCodes.length === 0, `등록되지 않은 도서코드가 포함되어 있습니다: [${missingCodes.slice(0, 5).join(', ')}${missingCodes.length > 5 ? ' 외 ' + (missingCodes.length - 5) + '건' : ''}]`);

        if (!isMasterUser && academyQuizSeq !== null && academyMeta && prisma.portalSetting) {
          const seqKey = `quiz_seq:${academyQuizSeq}`;
          const previousAuthor = await prisma.portalSetting.findUnique({ where: { key: seqKey } });
          need(!previousAuthor || (previousAuthor.value as any)?.academyId === academyMeta.academyId, '학원 퀴즈 식별자가 충돌했습니다. 개별 퀴즈 등록을 이용해 주세요.', 409);
          const seqVal = {
            authorType: 'ACADEMY',
            authorName: academyMeta.academyName,
            academyName: academyMeta.academyName,
            academyCode: academyMeta.academyCode,
            academyId: academyMeta.academyId
          };
          await prisma.portalSetting.upsert({
            where: { key: seqKey },
            update: { scope: 'quiz_author_seq', value: seqVal },
            create: { key: seqKey, scope: 'quiz_author_seq', value: seqVal }
          });
        }

        const result = await prisma.$transaction(async tx => {
          let totalImportedQuestions = 0;
          let affectedBookCount = 0;

          for (const group of groups) {
            const bookCode = String(group.bookNo || '').trim();
            const book = bookMap.get(bookCode) || bookMap.get(bookCode.toUpperCase());
            if (!book) continue;

            const rawQuestions = Array.isArray(group.questions) ? group.questions : [];
            if (rawQuestions.length === 0) continue;

            const questions = rawQuestions.map((q: any, idx: number) => {
              const qNo = Number(q.questionNo) || (idx + 1);
              const qText = text(q.question || q.문항내용 || q.질문, '문항 내용', 5000, true);
              const opts = Array.isArray(q.options) 
                ? q.options.map((o: any) => text(o, '보기', 1000, true)) 
                : [q.opt1, q.opt2, q.opt3, q.opt4, q.opt5].filter(Boolean).map((o: any) => text(o, '보기', 1000, true));
              
              const isSubjective = q.quizType === 'SHORT_ANSWER' || q.type === 'SUBJECTIVE' || opts.length === 0;
              let correctAnswer = String(q.correctAnswer ?? q.ans ?? q.정답 ?? '').trim();
              need(correctAnswer.length > 0, `[${book.title}] ${qNo}번 문항의 정답이 비어 있습니다.`);
              
              if (!isSubjective) {
                need(opts.length >= 2 && opts.length <= 5, `[${book.title}] 보기 개수는 2~5개여야 합니다.`);
                const ansNum = Number(correctAnswer);
                if (Number.isInteger(ansNum) && ansNum >= 1 && ansNum <= opts.length) {
                  correctAnswer = String(ansNum);
                } else {
                  const matchIdx = opts.findIndex((o: string) => o.trim() === correctAnswer);
                  if (matchIdx >= 0) {
                    correctAnswer = String(matchIdx + 1);
                  } else {
                    need(false, `[${book.title}] ${qNo}번 문항의 정답(${correctAnswer})이 보기 범위(1~${opts.length})에 없습니다.`);
                  }
                }
              }

              const rawHint = String(q.explanation || q.hint || q.해설 || '').trim();
              const rawSimilar = isSubjective
                ? (Array.isArray(q.similarAnswers) && q.similarAnswers.length > 0
                    ? q.similarAnswers.map((s: any) => String(s).trim()).filter(Boolean).join(', ')
                    : String(q.similarAns || q.유사인정정답 || '').trim())
                : '';
              const combinedExplanation = rawSimilar
                ? (rawHint ? `[SIMILAR:${rawSimilar}] ${rawHint}` : `[SIMILAR:${rawSimilar}]`)
                : (rawHint || null);

              return {
                bookId: book.id,
                legacyQuizSeq: isMasterUser ? 0 : academyQuizSeq,
                questionNo: qNo,
                question: qText,
                options: isSubjective ? null : opts,
                correctAnswer,
                quizType: (isSubjective ? 'SHORT_ANSWER' : 'MULTIPLE_CHOICE') as any,
                explanation: combinedExplanation,
                score: Number(q.score) || 20
              };
            });

            if (isMasterUser) {
              // 본사 업로드 시 학원 전용 세트(음수 시퀀스 및 레거시 학원 출제 세트)는 보존하고 본사 세트만 교체
              const existingRows = await tx.bookQuiz.findMany({
                where: { bookId: book.id },
                select: { id: true, legacyQuizSeq: true }
              });
              const hqIdsToDelete = existingRows
                .filter(r => {
                  if (r.legacyQuizSeq === null || r.legacyQuizSeq === 0) return true;
                  if (r.legacyQuizSeq < 0) return false;
                  const meta = quizAuthorMap[String(r.legacyQuizSeq)];
                  return !meta || meta.authorType !== 'ACADEMY';
                })
                .map(r => r.id);
              if (hqIdsToDelete.length > 0) {
                await tx.bookQuiz.deleteMany({ where: { id: { in: hqIdsToDelete } } });
              }
            } else {
              // 학원 업로드 시 해당 학원이 출제한 세트(academyQuizSeq)만 안전하게 교체 (본사 및 타 학원 세트 완벽 보존)
              await tx.bookQuiz.deleteMany({ where: { bookId: book.id, legacyQuizSeq: academyQuizSeq } });
            }

            await tx.bookQuiz.createMany({ data: questions });

            // 엑셀 재등록으로 비공개 설정이 공개로 되돌아가지 않도록 보존합니다.
            const policyKey = `content_quiz:${book.id}:${isMasterUser ? 0 : academyQuizSeq}`;
            const oldPolicy = await tx.portalSetting.findUnique({ where: { key: policyKey } });
            const policy = { ...((oldPolicy?.value as any) || {}), bookId: book.id, seq: isMasterUser ? 0 : academyQuizSeq,
              ownerAcademyId: academyId, ownerMemberId: (oldPolicy?.value as any)?.ownerMemberId || user.id,
              academyName: isMasterUser ? '본사' : academyMeta!.academyName, authorType: isMasterUser ? 'HQ' : 'ACADEMY',
              isPublic: (oldPolicy?.value as any)?.isPublic === 'N' ? 'N' : 'Y' };
            await tx.portalSetting.upsert({ where: { key: policyKey }, create: { key: policyKey, scope: 'content_quiz', value: policy }, update: { value: policy, revision: { increment: 1 } } });

            totalImportedQuestions += questions.length;
            affectedBookCount++;
          }

          return {
            ok: true,
            affectedBookCount,
            totalImportedQuestions,
            authorType: isMasterUser ? 'HQ' : 'ACADEMY',
            academyName: isMasterUser ? '본사 직속 (공용)' : (academyMeta?.academyName || '')
          };
        });

        return res.json(result);
      }
      // 학원 편집은 소유 세트를 검증하는 콘텐츠 API를 사용합니다.
      master(user);
      if (body.operation === 'replace') {
        need(typeof input.bookId === 'string' && await prisma.book.findUnique({ where: { id: input.bookId } }), '도서를 찾을 수 없습니다.');
        need(Array.isArray(input.questions) && input.questions.length <= 100, '최대 100문항까지 저장할 수 있습니다.');
        const questions = input.questions.map((q: any, index: number) => {
          const options = Array.isArray(q.options) ? q.options.map((o: any) => text(o, '보기', 1000, true)) : [];
          need(options.length >= 2 && options.length <= 5 && new Set(options).size === options.length, '서로 다른 보기 2~5개를 입력해 주세요.');
          const answer = Number(q.correctAnswer);
          need(Number.isInteger(answer) && answer >= 1 && answer <= options.length, '정답 번호를 확인해 주세요.');
          return { bookId: input.bookId, questionNo: index + 1, question: text(q.question, '문항', 5000, true), options, correctAnswer: String(answer), quizType: 'MULTIPLE_CHOICE' as const };
        });
        const items = await prisma.$transaction(async tx => {
          await tx.$queryRaw`SELECT id FROM books WHERE id = ${input.bookId} FOR UPDATE`;
          const existing = await tx.bookQuiz.findMany({ where: { bookId: input.bookId }, orderBy: { questionNo: 'asc' } });
          const saved = [];
          for (let i = 0; i < questions.length; i++) {
            saved.push(existing[i] ? await tx.bookQuiz.update({ where: { id: existing[i].id }, data: questions[i] }) : await tx.bookQuiz.create({ data: questions[i] }));
          }
          await tx.bookQuiz.deleteMany({ where: { bookId: input.bookId, id: { in: existing.slice(questions.length).map(q => q.id) } } });
          return saved;
        });
        return res.json({ items });
      }
      if (body.operation === 'delete') { await prisma.bookQuiz.delete({ where: { id: input.id } }); return res.json({ ok: true }); }
      need(await prisma.book.findUnique({ where: { id: input.bookId } }), '도서를 찾을 수 없습니다.');
      const options = Array.isArray(input.options) ? input.options.map((o: any) => text(o, '보기', 1000, true)) : [];
      need(options.length >= 2 && options.length <= 5 && new Set(options).size === options.length, '서로 다른 보기 2~5개를 입력해 주세요.');
      need(Number.isInteger(Number(input.correctAnswer)) && Number(input.correctAnswer) > 0 && Number(input.correctAnswer) <= options.length, '정답 번호를 확인해 주세요.');
      const data = { bookId: input.bookId, questionNo: Number(input.questionNo), question: text(input.question, '문항', 5000, true), options, correctAnswer: String(input.correctAnswer), quizType: 'MULTIPLE_CHOICE' as const };
      need(Number.isInteger(data.questionNo) && data.questionNo > 0, '문항 번호를 확인해 주세요.');
      const item = await prisma.$transaction(async tx => {
        await tx.$queryRaw`SELECT id FROM books WHERE id = ${data.bookId} FOR UPDATE`;
        need(!await tx.bookQuiz.findFirst({ where: { bookId: data.bookId, questionNo: data.questionNo, ...(input.id ? { id: { not: input.id } } : {}) } }), '이미 있는 문항 번호입니다. 다른 번호를 입력해 주세요.', 409);
        return input.id ? tx.bookQuiz.update({ where: { id: input.id }, data }) : tx.bookQuiz.create({ data });
      }); return res.json({ item });
    }
    if (entity === 'notices') {
      master(user);
      if (body.operation === 'delete') {
        await prisma.notice.delete({ where: { id: input.id } });
        await prisma.portalSetting.deleteMany({ where: { key: 'notice_meta:' + input.id, scope: 'notice_meta' } });
        return res.json({ ok: true });
      }
      const data = { title: text(input.title, '제목', 300, true), content: text(input.content, '내용', 20000, true), isPinned: input.isPinned === true, targetRole: input.targetRole ? enumValue(input.targetRole, ['STUDENT','TEACHER','DIRECTOR','MASTER'], '대상') as any : null };
      const saved = input.id ? await prisma.notice.update({ where: { id: input.id }, data }) : await prisma.notice.create({ data });
      const meta = {
        isPinned: input.isPinned === true,
        isPopup: input.isPopup === true,
        popupStartDate: input.isPopup === true ? text(input.popupStartDate || '', '팝업 시작일', 20) : '',
        popupEndDate: input.isPopup === true ? text(input.popupEndDate || '', '팝업 종료일', 20) : '',
        category: text(input.category || '일반 공지', '분류', 50),
        status: text(input.status || '게시중', '상태', 30),
        target: text(input.target || '전체', '대상', 50),
        link: text(input.link || '', '링크', 2000)
      };
      await prisma.portalSetting.upsert({
        where: { key: 'notice_meta:' + saved.id },
        update: { scope: 'notice_meta', value: meta },
        create: { key: 'notice_meta:' + saved.id, scope: 'notice_meta', value: meta }
      });
      return res.json({ item: { ...saved, ...meta } });
    }
    if (entity === 'themes') {
      master(user);
      if (body.operation === 'delete') {
        await prisma.themeCategory.delete({ where: { id: input.id } });
        await prisma.portalSetting.deleteMany({ where: { key: 'theme_meta:' + input.id, scope: 'theme_meta' } });
        return res.json({ ok: true });
      }
      if (body.operation === 'reorder') {
        const orders = Array.isArray(input.orders) ? input.orders : [];
        need(orders.length > 0 && orders.length <= 200, '변경할 테마 노출 순서 정보를 확인해 주세요.');
        const existingRows = await prisma.portalSetting.findMany({ where: { scope: 'theme_meta' } });
        const existingMap = new Map<string, Record<string, any>>(
          existingRows.map(r => [r.key.replace(/^theme_meta:/, ''), (r.value || {}) as Record<string, any>])
        );
        await prisma.$transaction(
          orders.map((entry: any, idx: number) => {
            const themeId = text(entry?.id, '테마 ID', 100, true);
            const nextOrder = typeof entry?.order === 'number' && Number.isFinite(entry.order)
              ? entry.order
              : (parseInt(entry?.order, 10) || (idx + 1));
            const prevMeta = existingMap.get(themeId) || {};
            const nextMeta = { ...prevMeta, order: nextOrder, active: prevMeta.active === 'N' ? 'N' : 'Y' };
            return prisma.portalSetting.upsert({
              where: { key: 'theme_meta:' + themeId },
              update: { scope: 'theme_meta', value: nextMeta },
              create: { key: 'theme_meta:' + themeId, scope: 'theme_meta', value: nextMeta }
            });
          })
        );
        return res.json({ ok: true });
      }
      const data = { code: text(input.code, '코드', 60, true), name: text(input.name, '테마명', 200, true), description: text(input.description, '설명', 3000) };
      const saved = input.id ? await prisma.themeCategory.update({ where: { id: input.id }, data }) : await prisma.themeCategory.create({ data });
      const prevMetaRow = await prisma.portalSetting.findUnique({ where: { key: 'theme_meta:' + saved.id } });
      const prevMeta = ((prevMetaRow?.value as any) || {}) as Record<string, any>;
      const parsedOrder = typeof input.order === 'number' && Number.isFinite(input.order)
        ? input.order
        : (parseInt(input.order, 10) || (typeof prevMeta.order === 'number' ? prevMeta.order : null));
      const meta = {
        subTag: text(input.subTag || '', '서브 태그', 500),
        desc: text(input.desc || input.description || '', '테마 상세 설명', 3000),
        image: text(input.image || '', '테마 이미지', 1500000),
        order: parsedOrder,
        active: input.active === 'N' ? 'N' : 'Y',
        bookIds: Array.isArray(input.bookIds) ? input.bookIds.map((id: any) => String(id).trim()).filter(Boolean) : []
      };
      if (meta.image) need(!/^javascript:/i.test(meta.image), '유효한 이미지 주소를 입력해 주세요.');
      await prisma.portalSetting.upsert({
        where: { key: 'theme_meta:' + saved.id },
        update: { scope: 'theme_meta', value: meta },
        create: { key: 'theme_meta:' + saved.id, scope: 'theme_meta', value: meta }
      });
      return res.json({ item: { ...saved, ...meta } });
    }
    if (entity === 'banners') {
      master(user);
      if (body.operation === 'delete') {
        await prisma.mainBanner.delete({ where: { id: input.id } });
        await prisma.portalSetting.deleteMany({ where: { key: 'banner_meta:' + input.id, scope: 'banner_meta' } });
        return res.json({ ok: true });
      }
      for (const url of [input.imageUrl,input.linkUrl].filter(Boolean)) need(!/^javascript:/i.test(url) && /^(https?:\/\/|\/|\.\/|upload\/|resources\/|images\/|assets\/|data:image\/|#)/i.test(url), '유효한 이미지 또는 연결 주소를 입력해 주세요.');
      const bookIds = Array.isArray(input.bookIds) ? input.bookIds.map((id: any) => String(id).trim()).filter(Boolean) : [];
      const subText = text(input.sub || '', '배너 서브 설명', 1000);
      const effectiveLinkUrl = (input.linkUrl && /^https?:\/\//i.test(String(input.linkUrl)))
        ? text(input.linkUrl, '연결 주소', 2000)
        : text('#books=' + encodeURIComponent(bookIds.join(',')) + (subText ? '&sub=' + encodeURIComponent(subText) : ''), '연결 주소', 2000);
      const data = { title: text(input.title, '배너명', 200, true), imageUrl: text(input.imageUrl, '이미지 주소', 500000), linkUrl: effectiveLinkUrl, isActive: input.isActive === true, orderNo: Number(input.orderNo) || 0 };
      const saved = input.id ? await prisma.mainBanner.update({ where: { id: input.id }, data }) : await prisma.mainBanner.create({ data });
      const meta = {
        sub: subText,
        bookIds,
        clicks: Number(input.clicks) || 0,
        createdAt: text(input.createdAt || new Date().toISOString().slice(0, 10), '등록일', 20)
      };
      await prisma.portalSetting.upsert({
        where: { key: 'banner_meta:' + saved.id },
        update: { scope: 'banner_meta', value: meta },
        create: { key: 'banner_meta:' + saved.id, scope: 'banner_meta', value: meta }
      });
      return res.json({ item: { ...saved, ...meta } });
    }
    if (entity === 'ai_config') {
      master(user);
      const row = await prisma.portalSetting.findUnique({ where: { key: 'gemini_api_config' } });
      const prev = ((row?.value as any) || {}) as Record<string, any>;
      const inputKey = typeof input.apiKey === 'string' ? input.apiKey.trim() : '';
      const finalKey = inputKey || (prev.apiKey ? String(prev.apiKey).trim() : '');
      const model = typeof input.model === 'string' && input.model.trim() ? input.model.trim() : (prev.model || 'gemini-3.8-flash');
      const meta = { apiKey: finalKey, model, updatedAt: new Date().toISOString() };
      await prisma.portalSetting.upsert({
        where: { key: 'gemini_api_config' },
        update: { scope: 'system_config', value: meta },
        create: { key: 'gemini_api_config', scope: 'system_config', value: meta }
      });
      return res.json({
        ok: true,
        hasKey: Boolean(finalKey),
        maskedKey: finalKey ? (finalKey.slice(0, 6) + '...' + finalKey.slice(-4)) : '',
        model
      });
    }
    if (entity === 'summarize_synopsis') {
      master(user);
      const rawText = text(input.rawText, '원문 줄거리', 20000, true);
      const title = text(input.title || '', '도서명', 300);
      const author = text(input.author || '', '저자', 200);

      const configRow = await prisma.portalSetting.findUnique({ where: { key: 'gemini_api_config' } });
      const aiConfig = ((configRow?.value as any) || {}) as Record<string, any>;
      const apiKey = (typeof input.apiKey === 'string' && input.apiKey.trim()) || (typeof aiConfig.apiKey === 'string' && aiConfig.apiKey.trim()) || (process.env.GEMINI_API_KEY || '');
      let model = (typeof aiConfig.model === 'string' && aiConfig.model.trim()) || (process.env.GEMINI_MODEL || 'gemini-1.5-flash');
      if (model.includes('3.8')) model = 'gemini-1.5-flash';

      const cleaned = rawText
        .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'").replace(/&apos;/g, "'").replace(/&amp;/g, '&')
        .replace(/&nbsp;/g, ' ').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

      if (!apiKey) {
        const sentences = cleaned.split(/(?<=[.?!])\s+/).filter(Boolean);
        const fallback = sentences.slice(0, 3).join(' ');
        return res.json({ summary: fallback || cleaned.slice(0, 200) });
      }

      const prompt = `당신은 어린이·청소년 독서교육 전문가입니다.
다음 도서의 출판사 소개/줄거리 정보를 바탕으로, 학생과 지도교사가 도서의 핵심 내용과 흥미를 쉽게 파악할 수 있도록 정확히 3문장 이내의 읽기 쉬운 줄거리(도서 소개)로 재구성하여 요약해 주세요.

[도서 정보]
- 도서명: ${title || '도서'}
- 저자: ${author || '저자'}

[출판사 제공 원문]
${cleaned}

[작성 규칙]
1. 불필요한 홍보 문구, 시리즈 권수 안내, 특수기호 등은 제외하고 이야기의 중심 줄거리와 핵심 배경 위주로 서술하세요.
2. 부드럽고 정돈된 어조(~합니다, ~이야기입니다)로 작성하세요.
3. 반드시 2~3개의 완성된 문장으로만 작성하고, 번호 매김(1., 2.)이나 불릿 없이 자연스러운 줄글 형태로 작성하세요.`;

      try {
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;
        const resp = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
          body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.3, maxOutputTokens: 1024 }
          }),
          signal: AbortSignal.timeout(15000)
        });
        if (resp.ok) {
          const geminiData = await resp.json();
          const rawResult = (((geminiData.candidates || [])[0] || {}).content || {}).parts?.[0]?.text || '';
          const trimmedResult = rawResult.trim().replace(/^["']|["']$/g, '');
          if (trimmedResult) {
            return res.json({ summary: trimmedResult });
          }
        }
      } catch (err) {
        console.warn('Gemini 요약 호출 실패, 스마트 폴백 적용:', err);
      }

      const sentences = cleaned.split(/(?<=[.?!])\s+/).filter(Boolean);
      const fallback = sentences.slice(0, 3).join(' ');
      return res.json({ summary: fallback || cleaned.slice(0, 200) });
    }
    need(false, '지원하지 않는 항목입니다.', 404);
  } catch (error) { return failure(res, error); }
}
