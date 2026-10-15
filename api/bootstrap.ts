import { prisma } from '../lib/prisma';
import { readSession, passwordVersion } from '../lib/portal-auth';

// 공개 JS 파일로 배포하던 회원 정보를 로그인한 사용자의 범위로만 제공합니다.
export default async function handler(req: any, res: any) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  if (req.method !== 'GET') return res.status(405).end();
  try {
    const token = String(req.headers.cookie || '').split(';').map((v: string) => v.trim()).find((v: string) => v.startsWith('nano_portal='))?.slice(12) || '';
    const session = readSession(token);
    const user = session ? await prisma.member.findUnique({ where: { id: session.sub }, include: { academy: true } }) : null;
    if (!user || !session || user.status !== 'APPROVED' || user.academy.status !== 'ACTIVE' || user.academy.deletedAt || session.version !== passwordVersion(user.password || '')) return res.status(401).send('window.NANO_BOOTSTRAP_FAILED = true;');
    const members = await prisma.member.findMany({ where: user.role === 'MASTER' ? {} : user.role === 'STUDENT' ? { id: user.id } : { academyId: user.academyId },
      select: { id: true, legacySeq: true, username: true, name: true, role: true, grade: true, gender: true, school: true, parentName: true, parentPhone: true,
        phone: true, parentEmail: true, status: true, points: true, bookCount: true, quizAvg: true, reportYn: true, teacherName: true,
        lastLoginAt: true, createdAt: true, academy: { select: { code: true, name: true } }, classGroup: { select: { name: true } } } });
    const academies = await prisma.academy.findMany({ where: { deletedAt: null, ...(user.role === 'MASTER' ? {} : { id: user.academyId }) },
      select: { code: true, name: true, directorName: true, phone: true, maxStudents: true, plan: true, address: true, status: true, startDate: true, endDate: true,
        _count: { select: { members: { where: { role: 'STUDENT', status: 'APPROVED' } } } } } });
    const [books, classes, banners, themes, notices, owned] = await Promise.all([
      prisma.book.findMany({ orderBy: { bookNo: 'asc' }, include: { quizzes: { orderBy: { questionNo: 'asc' } }, theme: true } }),
      prisma.classGroup.findMany({ where: user.role === 'MASTER' ? {} : { academyId: user.academyId }, include: { academy: { select: { code: true } } } }),
      prisma.mainBanner.findMany({ orderBy: { orderNo: 'asc' } }), prisma.themeCategory.findMany(),
      prisma.notice.findMany({ where: { OR: [{ targetRole: null }, { targetRole: user.role }] }, orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }] }),
      prisma.academyBook.findMany({ where: { academyId: user.academyId }, include: { book: { select: { bookNo: true } } } })
    ]);
    const quizzes = Object.fromEntries(books.map(b => [b.bookNo, b.quizzes.length ? [{ id: 'server-' + b.id, authorName: '본사', authorType: 'master',
      questions: b.quizzes.map(q => ({ question: q.question, options: q.options, ans: Number(q.correctAnswer), questionNo: q.questionNo })) }] : []]));
    const data = {
      NANO_SERVER_DATA: true,
      NANO_BOOTSTRAP_MEMBER_ID: user.id,
      MIGRATED_BOOKS: books.map(b => ({ ...b, serverId: b.id, id: b.bookNo, pub: b.publisher || '', cover: b.coverUrl || '',
        cat: b.series || '단권', series: b.series || '단권', single: !b.series || b.series === '단권', tags: (b.tags || '').split(',').map(t => t.trim()).filter(Boolean),
        cat1: b.subCategory === 'C' ? '비문학/정보글' : b.subCategory === 'B' ? '인물 이야기 (위인)' : '소설',
        cat2: b.category === 'F' ? '외서' : '국내서', tag: b.theme ? '#' + b.theme.name : '',
        thinkInsert: b.thinkQuiz || '', thinkOpen: b.thinkTitle || '', quizSets: quizzes[b.bookNo], quizzes: undefined, theme: undefined })),
      MIGRATED_QUIZZES: quizzes,
      NANO_SERVER_CLASSES: classes.map(c => ({ id: c.id, name: c.name, grade: c.targetGrade || '', academyId: c.academy.code })),
      NANO_SERVER_OWNED: owned.map(b => b.book.bookNo),
      NANO_SERVER_BANNERS: banners.filter(b => b.isActive && (!b.startDate || b.startDate <= new Date()) && (!b.endDate || b.endDate >= new Date())).map(b => ({ ...b, active: 'Y', order: b.orderNo, image: b.imageUrl || '', link: b.linkUrl || '', type: 'image' })),
      NANO_SERVER_THEMES: themes.map(t => ({ ...t, title: t.name, tag: '#' + t.name, subTag: t.description || '', active: 'Y', bookIds: books.filter(b => b.themeId === t.id).map(b => b.bookNo) })),
      NANO_SERVER_NOTICES: notices.map(n => ({ ...n, status: '게시중', target: n.targetRole === 'STUDENT' ? '학생' : n.targetRole ? '학원' : '전체', date: n.createdAt.toISOString().slice(0,10), isPopup: n.isPinned })),
      MIGRATED_MEMBERS: members.map((m, index) => ({ ...m, serverId: m.id, id: m.legacySeq || index + 1000000, academyId: m.academy.code, academyName: m.academy.name,
        className: m.classGroup?.name || '미지정', lastLogin: m.lastLoginAt?.toISOString() || '-', createdAt: m.createdAt.toISOString().slice(0, 10) })),
      MIGRATED_FRANCHISES: academies.map(a => ({ id: a.code, name: a.name, director: a.directorName, phone: a.phone, region: a.address || '',
        maxStudents: a.maxStudents, currentStudents: a._count.members, plan: a.plan, status: a.status, startDate: a.startDate.toISOString().slice(0, 10), endDate: a.endDate.toISOString().slice(0, 10) })),
      MIGRATED_LEARNING_LOGS: [], MIGRATED_RANKINGS: [], MIGRATED_ACADEMY_RANKINGS: []
    };
    const sessionUser = { id: user.username, memberId: user.id, name: user.name, studentName: user.name, studentId: user.username,
      role: user.role === 'MASTER' ? 'master' : user.role === 'STUDENT' ? 'student' : user.role === 'TEACHER' ? 'teacher' : 'admin',
      academyId: user.academy.code, academyName: user.academy.name, classGroup: members.find(m => m.id === user.id)?.classGroup?.name || '미지정', server: true };
    return res.status(200).send('sessionStorage.setItem("nano_auth_user", ' + JSON.stringify(JSON.stringify(sessionUser)).replace(/</g, '\\u003c') + ');\n' + Object.entries(data).map(([key, value]) => `window.${key} = ${JSON.stringify(value).replace(/</g, '\\u003c')};`).join('\n'));
  } catch {
    return res.status(503).send('window.NANO_BOOTSTRAP_FAILED = true;');
  }
}
