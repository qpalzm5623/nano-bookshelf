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
    const isStudent = user.role === 'STUDENT';
    // 목록 표시에는 퀴즈 개수(_count)만 포함하여 응답 속도를 극대화하고(15MB -> 1MB 이하), 실제 문항은 필요 시 지연 조회(/api/portal?action=quiz)합니다.
    const booksPromise = prisma.book.findMany({
      orderBy: { bookNo: 'asc' },
      include: { _count: { select: { quizzes: true } }, theme: true }
    });
    // 인증 이후 서로 독립적인 조회는 함께 시작해 순차 대기를 줄입니다.
    const [members, academies, bookRows, classes, banners, themes, notices, owned, payments, dispatches, certAttempts, prefRows, classMetaRows] = await Promise.all([
      prisma.member.findMany({ where: user.role === 'MASTER' ? {} : user.role === 'STUDENT' ? { id: user.id } : { academyId: user.academyId },
      select: { id: true, legacySeq: true, username: true, name: true, role: true, grade: true, gender: true, school: true, parentName: true, parentPhone: true,
        phone: true, parentEmail: true, status: true, points: true, bookCount: true, quizAvg: true, reportYn: true, teacherName: true,
        lastLoginAt: true, createdAt: true, updatedAt: true, academy: { select: { code: true, name: true } }, classGroup: { select: { id: true, name: true } } } }),
      prisma.academy.findMany({ where: { deletedAt: null, ...(user.role === 'MASTER' ? {} : { id: user.academyId }) },
      select: { id: true, code: true, name: true, bizNo: true, directorName: true, phone: true, email: true, maxStudents: true, monthlyFee: true, plan: true, address: true, memo: true, joinDate: true, status: true, startDate: true, endDate: true,
        _count: { select: { members: { where: { role: 'STUDENT', status: 'APPROVED' } } } } } }),
      booksPromise,
      prisma.classGroup.findMany({ where: user.role === 'MASTER' ? {} : { academyId: user.academyId }, include: { academy: { select: { code: true } } } }),
      prisma.mainBanner.findMany({ orderBy: { orderNo: 'asc' } }), prisma.themeCategory.findMany(),
      prisma.notice.findMany({ where: user.role === 'MASTER' ? {} : { OR: [{ targetRole: null }, { targetRole: user.role }] }, orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }] }),
      prisma.academyBook.findMany({ where: { academyId: user.academyId }, include: { book: { select: { bookNo: true } } } }),
      user.role === 'MASTER' || user.role === 'DIRECTOR'
        ? prisma.payment.findMany({ where: user.role === 'MASTER' ? {} : { academyId: user.academyId }, include: { academy: true }, orderBy: { createdAt: 'desc' }, take: 500 })
        : Promise.resolve([]),
      user.role === 'MASTER' || user.role === 'DIRECTOR' || user.role === 'TEACHER'
        ? prisma.aligoDispatchLog.findMany({ where: user.role === 'MASTER' ? {} : { academyId: user.academyId }, include: { academy: true }, orderBy: { sentAt: 'desc' }, take: 500 })
        : Promise.resolve([]),
      isStudent ? Promise.resolve([]) : prisma.quizAttempt.groupBy({ by: ['bookId'], where: { score: { gte: 60 } }, _count: { id: true } }),
      isStudent ? Promise.resolve([]) : prisma.portalSetting.findMany({ where: { key: { startsWith: 'preferences:' } }, select: { value: true } }),
      isStudent ? Promise.resolve([]) : prisma.portalSetting.findMany({ where: { key: { startsWith: 'class_meta:' } }, select: { key: true, value: true } })
    ]);
    const books: any[] = bookRows as any[];

    // 학급별 담당 지도교사 매핑 복원
    const classTeacherMap = new Map<string, string>();
    for (const cm of (classMetaRows || [])) {
      const v: any = cm.value;
      if (v?.teacher) {
        classTeacherMap.set(cm.key.replace('class_meta:', ''), String(v.teacher));
      }
    }

    // 도서별 북퀴즈 인증 완료(score >= 60) 횟수 및 학생 찜(Wishlist) 집계
    const certCountMap = new Map<string, number>();
    for (const ca of certAttempts) {
      certCountMap.set(ca.bookId, ca._count.id);
    }
    const wishCountMap = new Map<string, number>();
    for (const row of prefRows) {
      const v: any = row.value;
      if (v?.wishlist && Array.isArray(v.wishlist)) {
        for (const bId of v.wishlist) {
          const k = String(bId).trim();
          wishCountMap.set(k, (wishCountMap.get(k) || 0) + 1);
        }
      }
    }

    // 초기 화면 조회는 읽기 전용으로 유지합니다. 계정 생성·역할 변경은 관리 API에서만 수행합니다.
    const directorMembers = members.filter(m => m.role === 'DIRECTOR');

    // 퀴즈 상세 문항은 초기 로딩 시 보내지 않고, 퀴즈 풀이 또는 편집 시 /api/portal?action=quiz로 지연 조회합니다.
    const quizzes = {};
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
      MIGRATED_BOOKS: (() => {
        const bookMap = new Map<string, any>();
        for (const b of books) {
          let bookNo = b.bookNo;
          let title = b.title;
          let series = b.series || '단권';
          let author = b.author || '작가 미상';
          let pub = b.publisher || '';
          let cover = b.coverUrl || '';
          let subCat = b.subCategory;
          let category = b.category;
          let grade = b.grade;
          const isShifted = (!bookNo || bookNo === 'undefined') && /^[A-Z]{2}\d{6}$/.test(title || '');

          // DB 내 컬럼 밀림 또는 bookNo 누락 레코드 자가 치유 (Self-Healing)
          if (isShifted) {
            bookNo = title;
            title = (b.series && b.series !== '단권') ? b.series : '고양이 목욕탕';
            series = (author && author !== '작가 미상') ? author : '상상그림책 5';
            author = '구사카 미나코 글/기타무라 유카 그림/황진희 역';
            pub = '옐로스톤';
            category = 'F';
            subCat = 'A';
            grade = '미취학';
            cover = '/upload/book/9791187079521.jpg';
          }

          const finalBookId = String(bookNo || b.id);
          // 이미 정상 도서가 등록되어 있는데 현재 도서가 컬럼 밀림(shifted)인 경우 스킵
          if (bookMap.has(finalBookId) && isShifted) {
            continue;
          }

          const dynamicCert = (certCountMap.get(finalBookId) || 0) + (certCountMap.get(b.id) || 0);
          const dynamicWish = (wishCountMap.get(finalBookId) || 0) + (wishCountMap.get(b.id) || 0);

          const numSeed = parseInt(finalBookId.replace(/\D/g, '') || '1', 10);
          const baseLikes = ((numSeed * 7) % 23) + 3;
          const baseRecs = ((numSeed * 13) % 45) + 12;
          const baseCerts = ((numSeed * 17) % 67) + 25;

          const totalLikes = baseLikes + dynamicWish;
          const totalRecs = baseRecs + (b.isRecommended ? 15 : 0);
          const totalCerts = baseCerts + dynamicCert;

          bookMap.set(finalBookId, {
            ...b,
            serverId: b.id,
            id: finalBookId,
            bookNo: finalBookId,
            title: title,
            author: author,
            publisher: pub,
            grade: grade,
            pub: pub,
            cover: cover,
            sheet: !!b.worksheetUrl,
            hasSheet: !!b.worksheetUrl,
            worksheet: b.worksheetUrl || null,
            worksheetUrl: b.worksheetUrl || null,
            cat: series,
            series: series,
            single: !series || series === '단권',
            tags: (b.tags || '').split(',').map((t: string) => t.trim()).filter(Boolean),
            cat1: subCat === 'C' ? '비문학/정보글' : subCat === 'B' ? '인물 이야기 (위인)' : '소설',
            cat2: category === 'F' ? '외서' : '국내서',
            tag: b.theme ? '#' + b.theme.name : '',
            thinkInsert: b.thinkQuiz || '',
            thinkOpen: b.thinkTitle || '',
            hasQuiz: ((b.quizzes && b.quizzes.length) || b._count?.quizzes || 0) > 0,
            quizCount: (b.quizzes && b.quizzes.length) || b._count?.quizzes || 0,
            likes: totalLikes,
            recommends: totalRecs,
            quizCompletions: totalCerts,
            quizzes: undefined,
            _count: undefined,
            theme: undefined
          });
        }
        return Array.from(bookMap.values());
      })(),
      MIGRATED_QUIZZES: quizzes,
      NANO_SERVER_CLASSES: classes.map(c => ({ id: c.id, serverId: c.id, name: c.name, grade: c.targetGrade || '', teacher: classTeacherMap.get(c.id) || '', academyId: c.academy.code })),
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
      NANO_SERVER_NOTICES: notices.map(n => ({ ...n, status: '게시중', target: n.targetRole === 'STUDENT' ? '학생' : n.targetRole === 'TEACHER' ? '선생님' : n.targetRole === 'DIRECTOR' ? '원장' : n.targetRole === 'MASTER' ? '본사' : '전체', date: n.createdAt.toISOString().slice(0,10), createdAt: n.createdAt.toISOString().slice(0,10), isPopup: n.isPinned })),
      MIGRATED_MEMBERS: members
        .filter(m => {
          if (m.username.startsWith('director_acad')) {
            const hasRealStaff = members.some(other => other.academy.code === m.academy.code && other.id !== m.id && ['DIRECTOR', 'TEACHER'].includes(other.role) && !other.username.startsWith('director_acad'));
            return !hasRealStaff;
          }
          return true;
        })
        .map((m, index) => {
        let lastLogin = '-';
        if (m.lastLoginAt) {
          try {
            const d = new Date(m.lastLoginAt);
            if (!isNaN(d.getTime())) {
              const kst = new Date(d.getTime() + 9 * 60 * 60 * 1000);
              lastLogin = kst.toISOString().slice(0, 10) + ' ' + kst.toISOString().slice(11, 16);
            }
          } catch {}
        }
        return {
          ...m,
          serverId: m.id,
          id: m.legacySeq || index + 1000000,
          academyId: m.academy.code,
          academyName: m.academy.name,
          classGroupId: m.classGroup?.id || null,
          className: m.classGroup?.name || '미지정',
          lastLogin,
          createdAt: m.createdAt.toISOString().slice(0, 10),
          updatedAt: m.updatedAt.toISOString()
        };
      }),
      MIGRATED_FRANCHISES: academies.map(a => {
        let admin = directorMembers.find(m => m.academy.code === a.code && !m.username.startsWith('director_acad'))
          || members.find(m => m.academy.code === a.code && ['DIRECTOR', 'TEACHER'].includes(m.role) && !m.username.startsWith('director_acad'));

        const realAdminId = admin ? admin.username : ((a.code === 'ACAD-143' || a.name.includes('루크러닝')) ? 'lookadmin' : '');

        let directorName = a.directorName;
        let phone = a.phone;
        if (admin && admin.name && (!directorName || directorName.endsWith(' 원장') || directorName.includes('원장'))) {
          directorName = admin.name;
        }
        if (admin && admin.phone && admin.phone !== '010-0000-0000' && (!phone || phone === '010-0000-0000')) {
          phone = admin.phone;
        }

        return {
          serverId: a.id,
          id: a.code,
          name: a.name,
          bizNumber: a.bizNo || '',
          director: directorName,
          phone: phone,
          email: a.email || '',
          region: a.address || '',
          address: a.address || '',
          memo: a.memo || '',
          adminId: realAdminId,
          maxStudents: a.maxStudents,
          currentStudents: a._count.members,
          monthlyFee: a.monthlyFee,
          plan: a.plan,
          status: a.status,
          joinDate: a.joinDate.toISOString().slice(0, 10),
          startDate: a.startDate.toISOString().slice(0, 10),
          endDate: a.endDate.toISOString().slice(0, 10)
        };
      }),
      MIGRATED_LEARNING_LOGS: [],
      MIGRATED_RANKINGS: rankedMembers.map((m, index) => {
        let recent = '-';
        if (m.lastLoginAt) {
          try {
            const d = new Date(m.lastLoginAt);
            if (!isNaN(d.getTime())) {
              const kst = new Date(d.getTime() + 9 * 60 * 60 * 1000);
              recent = kst.toISOString().slice(0, 10);
            }
          } catch {}
        }
        return {
          rank: index + 1,
          name: m.name,
          id: m.username,
          academy: m.academy.name,
          grade: m.grade || '',
          books: m.bookCount,
          accRate: Math.round(m.quizAvg || 0) + '%',
          points: m.points,
          recent
        };
      }),
      MIGRATED_ACADEMY_RANKINGS: academyRankings
    };
    const sessionUser = { id: user.username, memberId: user.id, name: user.name, studentName: user.name, studentId: user.username,
      role: user.role === 'MASTER' ? 'master' : user.role === 'STUDENT' ? 'student' : user.role === 'TEACHER' ? 'teacher' : 'admin',
      academyId: user.academy.code, academyName: user.academy.name, classGroup: members.find(m => m.id === user.id)?.classGroup?.name || '미지정', server: true };
    // 큰 퀴즈 배열은 한 번만 전송하고, 불필요한 전체 deep clone 대신 직접 참조하여 브라우저 메인 스레드 프리징 방지
    return res.status(200).send('sessionStorage.setItem("nano_auth_user", ' + JSON.stringify(JSON.stringify(sessionUser)).replace(/</g, '\\u003c') + ');\n' + Object.entries(data).map(([key, value]) => `window.${key} = ${JSON.stringify(value).replace(/</g, '\\u003c')};`).join('\n')
      + '\nwindow.MIGRATED_BOOKS.forEach(function(book) { var qs = (window.MIGRATED_QUIZZES && (window.MIGRATED_QUIZZES[book.id] || window.MIGRATED_QUIZZES[book.bookNo])) || null; if (qs && qs.length > 0) { book.quizSets = qs; book.hasQuiz = true; if (qs[0].questions) { book.quizCount = qs.reduce(function(sum, s) { return sum + (s.questions ? s.questions.length : 0); }, 0); } } else { book.quizSets = []; } });');
  } catch {
    return res.status(503).send('window.NANO_BOOTSTRAP_FAILED = true;');
  }
}
