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
        lastLoginAt: true, createdAt: true, updatedAt: true, academy: { select: { code: true, name: true } }, classGroup: { select: { id: true, name: true } } } });
    const academies = await prisma.academy.findMany({ where: { deletedAt: null, ...(user.role === 'MASTER' ? {} : { id: user.academyId }) },
      select: { id: true, code: true, name: true, bizNo: true, directorName: true, phone: true, email: true, maxStudents: true, monthlyFee: true, plan: true, address: true, memo: true, joinDate: true, status: true, startDate: true, endDate: true,
        _count: { select: { members: { where: { role: 'STUDENT', status: 'APPROVED' } } } } } });
    const [books, classes, banners, themes, notices, owned, payments, dispatches] = await Promise.all([
      prisma.book.findMany({ orderBy: { bookNo: 'asc' }, include: { quizzes: { orderBy: { questionNo: 'asc' } }, theme: true } }),
      prisma.classGroup.findMany({ where: user.role === 'MASTER' ? {} : { academyId: user.academyId }, include: { academy: { select: { code: true } } } }),
      prisma.mainBanner.findMany({ orderBy: { orderNo: 'asc' } }), prisma.themeCategory.findMany(),
      prisma.notice.findMany({ where: user.role === 'MASTER' ? {} : { OR: [{ targetRole: null }, { targetRole: user.role }] }, orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }] }),
      prisma.academyBook.findMany({ where: { academyId: user.academyId }, include: { book: { select: { bookNo: true } } } }),
      prisma.payment.findMany({ where: user.role === 'MASTER' ? {} : user.role === 'DIRECTOR' ? { academyId: user.academyId } : { id: '__none__' }, include: { academy: true }, orderBy: { createdAt: 'desc' }, take: 500 }),
      prisma.aligoDispatchLog.findMany({ where: user.role === 'MASTER' ? {} : ['DIRECTOR','TEACHER'].includes(user.role) ? { academyId: user.academyId } : { id: '__none__' }, include: { academy: true }, orderBy: { sentAt: 'desc' }, take: 500 })
    ]);
    const quizzes = Object.fromEntries(books.map(b => [b.bookNo, b.quizzes.length ? [{ id: 'server-' + b.id, authorName: '본사', authorType: 'master',
      questions: b.quizzes.map(q => ({ id: q.id, serverId: q.id, question: q.question, choices: q.options, options: q.options, ans: Number(q.correctAnswer), questionNo: q.questionNo, type: 'CHOICE' })) }] : []]));
    const rankedMembers = members.filter(m => m.role === 'STUDENT').sort((a, b) => b.points - a.points || a.name.localeCompare(b.name));
    const academyRankings = academies.map(a => {
      const students = rankedMembers.filter(m => m.academy.code === a.code);
      const points = students.reduce((sum, member) => sum + member.points, 0);
      return { name: a.name, region: (a.address || '').split(' ').slice(0, 2).join(' '), students: students.length,
        avgBooks: students.length ? (students.reduce((sum, member) => sum + member.bookCount, 0) / students.length).toFixed(1) : '0.0',
        participation: students.length ? Math.round(students.filter(member => member.bookCount > 0).length / students.length * 100) + '%' : '0%', points };
    }).sort((a, b) => b.points - a.points).map((academy, index) => ({ ...academy, rank: index + 1, badge: index < 3 ? '우수 학원' : '운영 중' }));
    const data = {
      NANO_SERVER_DATA: true,
      NANO_BOOTSTRAP_MEMBER_ID: user.id,
      MIGRATED_BOOKS: books.map(b => ({ ...b, serverId: b.id, id: b.bookNo, pub: b.publisher || '', cover: b.coverUrl || '',
        cat: b.series || '단권', series: b.series || '단권', single: !b.series || b.series === '단권', tags: (b.tags || '').split(',').map(t => t.trim()).filter(Boolean),
        cat1: b.subCategory === 'C' ? '비문학/정보글' : b.subCategory === 'B' ? '인물 이야기 (위인)' : '소설',
        cat2: b.category === 'F' ? '외서' : '국내서', tag: b.theme ? '#' + b.theme.name : '',
        thinkInsert: b.thinkQuiz || '', thinkOpen: b.thinkTitle || '', quizSets: quizzes[b.bookNo], quizzes: undefined, theme: undefined })),
      MIGRATED_QUIZZES: quizzes,
      NANO_SERVER_CLASSES: classes.map(c => ({ id: c.id, serverId: c.id, name: c.name, grade: c.targetGrade || '', academyId: c.academy.code })),
      NANO_SERVER_OWNED: owned.map(b => b.book.bookNo),
      NANO_SERVER_OWNED_RECORDS: Object.fromEntries(owned.map(b => [b.book.bookNo, b.id])),
      NANO_SERVER_PAYMENTS: payments.map(p => ({ id: p.id, academyId: p.academy.code, academyName: p.academy.name, director: p.academy.directorName, phone: p.academy.phone, bizNumber: p.academy.bizNo || '',
        planType: p.plan.toLowerCase(), planName: p.plan, supply: Math.round(p.amount / 1.1), vat: p.amount - Math.round(p.amount / 1.1), total: p.amount,
        method: p.payMethod === 'CARD' ? '신용카드' : p.payMethod === 'TRANSFER' ? '무통장 입금 (현금)' : p.payMethod, date: p.createdAt.toISOString().replace('T', ' ').slice(0, 19),
        startDate: p.academy.startDate.toISOString().slice(0, 10), endDate: p.academy.endDate.toISOString().slice(0, 10), status: p.status.toLowerCase(), memo: '' })),
      NANO_SERVER_DISPATCH: dispatches.map(d => ({ id: d.id, datetime: d.sentAt.toISOString().replace('T', ' ').slice(0, 19), date: d.sentAt.toISOString().replace('T', ' ').slice(0, 16), academyId: d.academy?.code || '', academyName: d.academy?.name || '삭제된 학원',
        type: d.templateCode, typeName: d.templateCode, receiver: `${d.recipientName} (${d.recipientPhone})`, receiverName: d.recipientName, receiverPhone: d.recipientPhone, summary: d.message, status: d.status, code: '' })),
      NANO_SERVER_BANNERS: banners.filter(b => user.role === 'MASTER' || (b.isActive && (!b.startDate || b.startDate <= new Date()) && (!b.endDate || b.endDate >= new Date()))).map(b => ({ ...b, active: b.isActive ? 'Y' : 'N', order: b.orderNo, image: b.imageUrl || '', link: b.linkUrl || '', type: 'image' })),
      NANO_SERVER_THEMES: themes.map(t => ({ ...t, title: t.name, tag: '#' + t.name, subTag: t.description || '', active: 'Y', bookIds: books.filter(b => b.themeId === t.id).map(b => b.bookNo) })),
      NANO_SERVER_NOTICES: notices.map(n => ({ ...n, status: '게시중', target: n.targetRole === 'STUDENT' ? '학생' : n.targetRole === 'TEACHER' ? '선생님' : n.targetRole === 'DIRECTOR' ? '원장' : n.targetRole === 'MASTER' ? '본사' : '전체', date: n.createdAt.toISOString().slice(0,10), isPopup: n.isPinned })),
      MIGRATED_MEMBERS: members.map((m, index) => ({ ...m, serverId: m.id, id: m.legacySeq || index + 1000000, academyId: m.academy.code, academyName: m.academy.name,
        classGroupId: m.classGroup?.id || null, className: m.classGroup?.name || '미지정', lastLogin: m.lastLoginAt?.toISOString() || '-', createdAt: m.createdAt.toISOString().slice(0, 10), updatedAt: m.updatedAt.toISOString() })),
      MIGRATED_FRANCHISES: academies.map(a => ({ serverId: a.id, id: a.code, name: a.name, bizNumber: a.bizNo || '', director: a.directorName, phone: a.phone, email: a.email || '', region: a.address || '', address: a.address || '', memo: a.memo || '',
        maxStudents: a.maxStudents, currentStudents: a._count.members, monthlyFee: a.monthlyFee, plan: a.plan, status: a.status, joinDate: a.joinDate.toISOString().slice(0, 10), startDate: a.startDate.toISOString().slice(0, 10), endDate: a.endDate.toISOString().slice(0, 10) })),
      MIGRATED_LEARNING_LOGS: [],
      MIGRATED_RANKINGS: rankedMembers.map((m, index) => ({ rank: index + 1, name: m.name, id: m.username, academy: m.academy.name, grade: m.grade || '', books: m.bookCount,
        accRate: Math.round(m.quizAvg || 0) + '%', points: m.points, recent: m.lastLoginAt ? m.lastLoginAt.toISOString().slice(0, 10) : '-' })),
      MIGRATED_ACADEMY_RANKINGS: academyRankings
    };
    const sessionUser = { id: user.username, memberId: user.id, name: user.name, studentName: user.name, studentId: user.username,
      role: user.role === 'MASTER' ? 'master' : user.role === 'STUDENT' ? 'student' : user.role === 'TEACHER' ? 'teacher' : 'admin',
      academyId: user.academy.code, academyName: user.academy.name, classGroup: members.find(m => m.id === user.id)?.classGroup?.name || '미지정', server: true };
    return res.status(200).send('sessionStorage.setItem("nano_auth_user", ' + JSON.stringify(JSON.stringify(sessionUser)).replace(/</g, '\\u003c') + ');\n' + Object.entries(data).map(([key, value]) => `window.${key} = ${JSON.stringify(value).replace(/</g, '\\u003c')};`).join('\n'));
  } catch {
    return res.status(503).send('window.NANO_BOOTSTRAP_FAILED = true;');
  }
}
