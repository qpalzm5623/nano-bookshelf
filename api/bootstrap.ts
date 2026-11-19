import { authorizeBrand, restrictedMaster, brandAcademyIds, brandOf, mapBannerRecord } from '../lib/portal-brand';
import { paymentView } from '../lib/payment-view';
import { prisma } from '../lib/prisma';
import { loadContentAccess, quizContent, canReadContent, bookSheets, sheetView } from '../lib/portal-content';
import { dispatchDate, dispatchTemplate } from '../lib/dispatch-view';
import Reading = require('../public_html/js/reading-progress');
import { readSession, passwordVersion } from '../lib/portal-auth';

// 공개 JS 파일로 배포하던 회원 정보를 로그인한 사용자의 범위로만 제공합니다.
interface CachedCatalog {
  cachedAt: number;
  books: any[];
  certCountMap: Map<string, number>;
  wishCountMap: Map<string, number>;
  globalRecCountMap: Map<string, number>;
  allRecRows: any[];
  quizSetCountMap: Map<string, number>;
  noticeMetaMap: Map<string, Record<string, any>>;
  bookCreatorMap: Map<string, Record<string, any>>;
  socialStats: Record<string, any>;
}

let catalogCache: CachedCatalog | null = null;
let catalogPromise: Promise<CachedCatalog> | null = null;

async function getCachedCatalog(): Promise<CachedCatalog> {
  const now = Date.now();
  // 도서 카탈로그·소셜 통계 인메모리 캐시 TTL을 15분으로 유지해 반복 DB 풀스캔을 줄입니다.
  if (catalogCache && now - catalogCache.cachedAt < 15 * 60 * 1000) {
    return catalogCache;
  }
  if (catalogPromise) return catalogPromise;

  catalogPromise = (async () => {
    try {
      const [bookRows, certAttempts, prefRows, settingRows, recSettingRows] = await Promise.all([
        prisma.book.findMany({
          orderBy: { bookNo: 'asc' },
          select: {
            id: true,
            bookNo: true,
            title: true,
            author: true,
            publisher: true,
            grade: true,
            category: true,
            subCategory: true,
            series: true,
            coverUrl: true,
            worksheetUrl: true,
            tags: true,
            thinkTitle: true,
            thinkQuiz: true,
            description: true,
            isRecommended: true,
            themeId: true,
            createdAt: true,
            theme: { select: { name: true } }
          }
        }),
        prisma.quizAttempt.groupBy({ by: ['bookId'], where: { score: { gte: 60 } }, _count: { id: true } }),
        prisma.portalSetting.findMany({ where: { key: { startsWith: 'preferences:' } }, select: { value: true } }),
        prisma.portalSetting.findMany({ where: { scope: { in: ['notice_meta', 'book_creator', 'system'] } }, select: { key: true, scope: true, value: true, updatedAt: true } }),
        prisma.portalSetting.findMany({ where: { scope: 'book_recommend' }, select: { key: true, value: true } })
      ]);

      const quizSetCountMap = new Map<string, number>();

      const noticeMetaMap = new Map<string, Record<string, any>>();
      const bookCreatorMap = new Map<string, Record<string, any>>();
      let socialStats: Record<string, any> = {};

      for (const row of (settingRows || [])) {
        const val = (row.value || {}) as Record<string, any>;
        if (row.scope === 'notice_meta') noticeMetaMap.set(row.key.replace(/^notice_meta:/, ''), val);
        else if (row.scope === 'book_creator') bookCreatorMap.set(row.key.replace(/^book_creator:/, ''), val);
        else if (row.key === 'legacy_book_social_stats') socialStats = val;
      }

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

      const globalRecCountMap = new Map<string, number>();
      for (const rRow of (((recSettingRows as any[]) || []))) {
        const list = Array.isArray((rRow.value as any)?.books) ? (rRow.value as any).books : [];
        const cleanList = list.map((x: any) => String(x || '').trim()).filter(Boolean);
        for (const k of Array.from(new Set<string>(cleanList))) {
          globalRecCountMap.set(k, (globalRecCountMap.get(k) || 0) + 1);
        }
      }

      catalogCache = {
        cachedAt: Date.now(),
        books: bookRows as any[],
        certCountMap,
        wishCountMap,
        globalRecCountMap,
        allRecRows: recSettingRows || [],
        quizSetCountMap,
        noticeMetaMap,
        bookCreatorMap,
        socialStats
      };
      return catalogCache;
    } finally {
      catalogPromise = null;
    }
  })();

  return catalogPromise;
}

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
    await authorizeBrand(req, user);
    const limited = restrictedMaster(user);
    const brand = (user as any).portalBrand;
    const allowedAcademies = limited ? await brandAcademyIds('JD') : [];
    const masterMemberFilter = limited ? { academyId: { in: allowedAcademies } } : {};
    const isStudent = user.role === 'STUDENT';

    // 공통 도서 카탈로그는 인메모리 SWR 캐시에서 조회하고, 운영 배너/테마·사용자별 데이터는 실시간 DB 조회로 불일치를 방지합니다.
    const [catalog, bannerRows, themeRows, opMetaRows, members, academies, classes, notices, owned, payments, dispatches, classMetaRows, charSettingRows, studentSettingRows] = await Promise.all([
      getCachedCatalog(),
      prisma.mainBanner.findMany({ orderBy: { orderNo: 'asc' } }),
      prisma.themeCategory.findMany(),
      prisma.portalSetting.findMany({ where: { scope: { in: ['banner_meta', 'theme_meta'] } }, select: { key: true, scope: true, value: true, updatedAt: true } }),
      prisma.member.findMany({ where: user.role === 'MASTER' ? masterMemberFilter : user.role === 'STUDENT' ? { id: user.id } : { academyId: user.academyId },
      select: { id: true, legacySeq: true, username: true, name: true, role: true, grade: true, gender: true, school: true, parentName: true, parentPhone: true,
        phone: true, parentEmail: true, status: true, points: true, bookCount: true, quizAvg: true, reportYn: true, teacherName: true,
        lastLoginAt: true, createdAt: true, updatedAt: true, academy: { select: { code: true, name: true } }, classGroup: { select: { id: true, name: true } } } }),
      prisma.academy.findMany({ where: { deletedAt: null, ...(user.role === 'MASTER' ? (limited ? { id: { in: allowedAcademies } } : {}) : { id: user.academyId }) },
      select: { id: true, code: true, name: true, bizNo: true, directorName: true, phone: true, email: true, maxStudents: true, monthlyFee: true, kakaoBalance: true, plan: true, address: true, memo: true, joinDate: true, status: true, startDate: true, endDate: true,
        _count: { select: { members: { where: { role: 'STUDENT', status: 'APPROVED' } } } } } }),
      prisma.classGroup.findMany({ where: user.role === 'MASTER' ? masterMemberFilter : { academyId: user.academyId }, include: { academy: { select: { code: true } } } }),
      prisma.notice.findMany({ where: user.role === 'MASTER' ? {} : { OR: [{ targetRole: null }, { targetRole: user.role }] }, orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }] }),
      prisma.academyBook.findMany({ where: { academyId: user.academyId }, include: { book: { select: { bookNo: true } } } }),
      !limited && (user.role === 'MASTER' || user.role === 'DIRECTOR')
        ? prisma.payment.findMany({ where: { deletedAt: null, ...(user.role === 'MASTER' ? masterMemberFilter : { academyId: user.academyId }) }, include: { academy: { select: { code: true, name: true, directorName: true, phone: true } } }, orderBy: { createdAt: 'desc' }, take: 500 })
        : Promise.resolve([]),
      user.role === 'MASTER' || user.role === 'DIRECTOR' || user.role === 'TEACHER'
        ? prisma.aligoDispatchLog.findMany({ where: user.role === 'MASTER' ? masterMemberFilter : { academyId: user.academyId }, include: { academy: { select: { code: true, name: true } } }, orderBy: { sentAt: 'desc' }, take: 500 })
        : Promise.resolve([]),
      isStudent ? Promise.resolve([]) : prisma.portalSetting.findMany({ where: user.role === 'MASTER' ? { OR: [{ key: { startsWith: 'class_meta:' } }, { key: { startsWith: 'academy_meta:' } }] } : { OR: [{ key: 'academy_meta:' + user.academyId }, { key: { startsWith: 'class_meta:' } }] }, select: { key: true, value: true } }),
      prisma.portalSetting.findMany({ where: isStudent ? { key: 'character:' + user.id } : { key: { startsWith: 'character:' } }, select: { key: true, value: true } }),
      prisma.portalSetting.findMany({
        where: {
          key: {
            in: isStudent
              ? ['preferences:' + user.id, 'onboarding_interest:' + user.id, 'notice_hide:' + user.id]
              : ['notice_hide:' + user.id]
          }
        },
        select: { key: true, value: true, revision: true }
      })
    ]);

    const recommendationRows = await prisma.portalSetting.findMany({ where: { scope: 'brand_recommend:' + brand } });
    const recommendationMap = new Map(recommendationRows.map(r => [(r.value as any).bookId, (r.value as any).recommended === true]));
    const books = catalog.books.map(b => ({ ...b, isRecommended: recommendationMap.has(b.id) ? recommendationMap.get(b.id) === true : brand === 'NANO' && b.isRecommended }));
    const [contentAccess, contentQuizGroups] = await Promise.all([
      loadContentAccess(prisma, academies), prisma.bookQuiz.groupBy({ by: ['bookId', 'legacyQuizSeq'], _count: { id: true } })
    ]);
    const accessibleQuizCounts = new Map<string, { sets: number; questions: number }>();
    const seenQuizSeqs = new Map<string, Set<number>>();
    for (const group of contentQuizGroups) {
      const seq = group.legacyQuizSeq || 0;
      if (!canReadContent(user, quizContent(contentAccess, group.bookId, seq), contentAccess)) continue;
      const count = accessibleQuizCounts.get(group.bookId) || { sets: 0, questions: 0 };
      let seqSet = seenQuizSeqs.get(group.bookId);
      if (!seqSet) { seqSet = new Set<number>(); seenQuizSeqs.set(group.bookId, seqSet); }
      // legacyQuizSeq가 null과 0으로 나뉘어 있어도 동일한 본사 기본 세트(0)로 통합 집계합니다.
      if (!seqSet.has(seq)) {
        seqSet.add(seq);
        count.sets++;
      }
      count.questions += group._count.id;
      accessibleQuizCounts.set(group.bookId, count);
    }
    const quizSetCountMap = catalog.quizSetCountMap;
    const noticeMetaMap = catalog.noticeMetaMap;
    const bannerMetaMap = new Map<string, Record<string, any>>();
    const themeMetaMap = new Map<string, Record<string, any>>();
    for (const row of (opMetaRows || [])) {
      const val = ((row as any).value || {}) as Record<string, any>;
      const updated = (row as any).updatedAt ? +new Date((row as any).updatedAt) : 0;
      if (row.scope === 'banner_meta') bannerMetaMap.set(String(row.key || '').replace(/^banner_meta:/, ''), { ...val, _updatedAt: updated });
      else if (row.scope === 'theme_meta') themeMetaMap.set(String(row.key || '').replace(/^theme_meta:/, ''), { ...val, _updatedAt: updated });
    }
    const bookCreatorMap = catalog.bookCreatorMap;
    const certCountMap = catalog.certCountMap;
    const wishCountMap = catalog.wishCountMap;
    const recCountMap = catalog.globalRecCountMap;
    const socialStats = catalog.socialStats;
    const banners = (bannerRows || []).filter(b => brandOf(bannerMetaMap.get(b.id)) === brand);
    // 테마관리는 본사(NANO) 마스터에서 일괄 관리하며, jd.nanos 학생·관리자 화면에도 동일하게 반영합니다.
    const themes = (themeRows || []).filter(t => brandOf(themeMetaMap.get(t.id)) === 'NANO');

    const memberCharMap = new Map<string, string>();
    for (const crow of (((charSettingRows as any[]) || []))) {
      const mid = String(crow.key || '').replace(/^character:/, '');
      const cid = (crow.value as any)?.characterId;
      if (mid && cid) memberCharMap.set(mid, String(cid));
    }

    // 학급별 담당 지도교사 매핑 복원
    const classTeacherMap = new Map<string, string>(); const academyMetaMap = new Map<string, Record<string, any>>();
    for (const cm of (classMetaRows || [])) {
      const v: any = cm.value;
      if (cm.key.startsWith('class_meta:') && v?.teacher) { classTeacherMap.set(cm.key.replace('class_meta:', ''), String(v.teacher)); } else if (cm.key.startsWith('academy_meta:') && v && typeof v === 'object') { academyMetaMap.set(cm.key.replace('academy_meta:', ''), v); }
      if (false) {
      }
    }

    let myRecommends: string[] = [];
    const myRecKey = 'recommends:' + user.id;
    for (const rRow of catalog.allRecRows) {
      if (rRow.key === myRecKey) {
        const list = Array.isArray((rRow.value as any)?.books) ? (rRow.value as any).books : [];
        myRecommends = list.map((x: any) => String(x || '').trim()).filter(Boolean);
        break;
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
    const r2PublicBase = (process.env.R2_PUBLIC_BASE_URL || 'https://media.nanosbook.co.kr').trim().replace(/\/+$/, '');
    const resolveMediaUrl = (rawUrl?: string | null, isPdf = false): string => {
      let clean = String(rawUrl || '').trim();
      if (!clean) return '';
      // 혹시 남아있는 예전 r2.dev 임시 도메인이 있다면 초고속 커스텀 도메인으로 자동 치환
      if (/^https?:\/\/pub-[a-z0-9]+\.r2\.dev/i.test(clean)) {
        clean = clean.replace(/^https?:\/\/pub-[a-z0-9]+\.r2\.dev/i, r2PublicBase);
      }
      // 절대 경로(https://...)든 상대 경로(/upload/book/...)든 도서 표지 이미지는 경량화된 .webp로 우선 변환
      if (!isPdf && /\/upload\/book\/[^?]+\.(jpe?g|png|jfif)$/i.test(clean)) {
        clean = clean.replace(/\.(jpe?g|png|jfif)$/i, '.webp');
      }
      if (/^(https?:\/\/|data:|\/api\/files\?)/i.test(clean)) return clean;
      if (r2PublicBase && /^\/?upload\/book\//i.test(clean)) {
        return `${r2PublicBase}/${clean.replace(/^\/+/, '')}`;
      }
      return clean;
    };

    const studentPrefRow = (studentSettingRows || []).find((r: any) => r.key === 'preferences:' + user.id);
    const onboardingRow = (studentSettingRows || []).find((r: any) => r.key === 'onboarding_interest:' + user.id);
    const onboardingVal = ((onboardingRow as any)?.value || {}) as Record<string, any>;
    const showFirstInterestModal = Boolean(
      isStudent &&
      onboardingVal.status === 'PENDING' &&
      onboardingVal.sessionId &&
      onboardingVal.sessionId === session.sid
    );

    const noticeHideRow = (studentSettingRows || []).find((r: any) => r.key === 'notice_hide:' + user.id);
    const todayKst = new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const rawNoticeHide = ((noticeHideRow as any)?.value && typeof (noticeHideRow as any).value === 'object') ? (noticeHideRow as any).value as Record<string, any> : {};
    const activeHiddenNotices: Record<string, string> = {};
    for (const [nid, hideDate] of Object.entries(rawNoticeHide)) {
      if (typeof hideDate === 'string' && hideDate >= todayKst) {
        activeHiddenNotices[nid] = hideDate;
      }
    }

    const data = {
      NANO_SERVER_DATA: true,
      NANO_BRAND: brand,
      NANO_RESTRICTED_MASTER: limited,
      NANO_BOOTSTRAP_MEMBER_ID: user.id,
      NANO_SERVER_HIDDEN_NOTICES: activeHiddenNotices,
      NANO_MEDIA_BASE_URL: r2PublicBase,
      NANO_USER_RECOMMENDS: myRecommends,
      NANO_SERVER_PREFERENCES: isStudent ? {
        value: (studentPrefRow as any)?.value || { wishlist: [], interests: [] },
        revision: Number((studentPrefRow as any)?.revision) || 0
      } : null,
      NANO_FIRST_INTEREST_POPUP: showFirstInterestModal,
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
            grade = '유치부';
            cover = '/upload/book/9791187079521.jpg';
          }

          const finalBookId = String(bookNo || b.id);
          // 이미 정상 도서가 등록되어 있는데 현재 도서가 컬럼 밀림(shifted)인 경우 스킵
          if (bookMap.has(finalBookId) && isShifted) {
            continue;
          }

          const dynamicCert = (certCountMap.get(finalBookId) || 0) + (certCountMap.get(b.id) || 0);
          const dynamicWish = (wishCountMap.get(finalBookId) || 0) + (wishCountMap.get(b.id) || 0);
          const dynamicRec = (recCountMap.get(finalBookId) || 0) + (finalBookId !== b.id ? (recCountMap.get(b.id) || 0) : 0);

          const totalLikes = isStudent
            ? (socialStats.allLikes?.[finalBookId] || 0)
            : ((socialStats.baseLikes?.[finalBookId] || 0) + dynamicWish);
          const baseRecs = (socialStats.recommends?.[finalBookId] || 0) || (b.isRecommended ? 1 : 0);
          const totalRecs = baseRecs + dynamicRec;
          const totalCerts = (socialStats.legacyCerts?.[finalBookId] || 0) + dynamicCert;
          const weeklyCerts = dynamicCert > 0 ? dynamicCert : Math.max(0, Math.round(totalCerts * 0.35));
          const bookCreatedAt = b.createdAt ? (typeof b.createdAt.toISOString === 'function' ? b.createdAt.toISOString() : String(b.createdAt)) : new Date().toISOString();
          const bookDate = bookCreatedAt.slice(0, 10);

          const creatorMeta = bookCreatorMap.get(finalBookId);
          const visibleSheets = bookSheets(contentAccess, b).filter(s => canReadContent(user, s, contentAccess)).map(s => sheetView(s, user));
          const visibleQuizCount = accessibleQuizCounts.get(b.id) || { sets: 0, questions: 0 };
          // 학생 계정에는 응시 가능한(공개·소속 학원·공유 폴더) 북퀴즈가 1세트 이상 있는 도서만 노출합니다.
          if (isStudent && visibleQuizCount.questions <= 0) {
            continue;
          }
          bookMap.set(finalBookId, {
            ...b,
            canEdit: !limited || bookCreatorMap.get(b.bookNo)?.ownerMemberId === user.id,
            serverId: b.id,
            id: finalBookId,
            bookNo: finalBookId,
            title: title,
            author: author,
            publisher: pub,
            grade: grade,
            pub: pub,
            cover: resolveMediaUrl(cover, false),
            createdAt: bookCreatedAt,
            date: bookDate,
            ...(creatorMeta ? {
              creatorType: creatorMeta.authorType || 'ACADEMY',
              academyId: creatorMeta.academyCode || creatorMeta.academyId || '',
              academyName: creatorMeta.academyName || '가맹 학원'
            } : {}),
            sheet: visibleSheets.length > 0,
            hasSheet: visibleSheets.length > 0,
            worksheet: visibleSheets[0]?.url || null,
            worksheetUrl: visibleSheets[0]?.url || null,
            worksheetList: visibleSheets,
            cat: series,
            series: series,
            single: !series || series === '단권',
            tags: (b.tags || '').split(',').map((t: string) => t.trim()).filter(Boolean),
            cat1: subCat === 'C' ? '비문학/정보글' : subCat === 'B' ? '인물 이야기 (위인)' : '소설',
            cat2: category === 'F' ? '외서' : '국내서',
            tag: b.theme ? '#' + b.theme.name : '',
            themeName: b.theme?.name || '',
            readingGenre: Reading.genre(b),
            description: b.description || '',
            synopsis: b.description || '',
            thinkExtract: b.thinkTitle || '',
            thinkInsert: b.thinkQuiz || '',
            thinkOpen: b.thinkTitle || '',
            hasQuiz: visibleQuizCount.questions > 0,
            quizCount: visibleQuizCount.questions,
            quizSetCount: visibleQuizCount.sets,
            quizSets: [],
            likes: totalLikes,
            recommends: totalRecs,
            quizCompletions: totalCerts,
            quizCount7d: weeklyCerts,
            readCount: totalCerts,
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
      NANO_SERVER_PAYMENTS: payments.map(paymentView),
      NANO_SERVER_DISPATCH: dispatches.map(d => ({ id: d.id, datetime: dispatchDate(d.sentAt), date: dispatchDate(d.sentAt), academyId: d.academy?.code || '', academyName: d.academy?.name || '삭제된 학원',
        ...dispatchTemplate(d.id, d.templateCode), className: d.className || '', studentName: d.studentName || '', resultMessage: d.resultMessage || '', receiver: `${d.recipientName} (${d.recipientPhone})`, receiverName: d.studentName ? `${d.studentName} / ${d.recipientName} (학부모)` : d.recipientName, receiverPhone: d.recipientPhone, summary: d.message, status: d.status, code: '' })),
      NANO_SERVER_BANNERS: banners.filter(b => user.role === 'MASTER' || (b.isActive && (!b.startDate || b.startDate <= new Date()) && (!b.endDate || b.endDate >= new Date()))).map(b => mapBannerRecord(b, bannerMetaMap.get(b.id) || {})),
      NANO_SERVER_THEMES: themes.map(t => {
        const meta = themeMetaMap.get(t.id) || {};
        const autoBookIds = books.filter(b => b.themeId === t.id).map(b => b.bookNo);
        const parsedOrder = typeof meta.order === 'number' && Number.isFinite(meta.order) ? meta.order : (parseInt(meta.order, 10) || null);
        return {
          ...t,
          title: t.name,
          tag: '#' + String(t.name || '').replace(/^#/, ''),
          subTag: meta.subTag !== undefined ? meta.subTag : '',
          desc: meta.desc !== undefined ? meta.desc : (t.description || ''),
          image: meta.image || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&q=80',
          order: parsedOrder,
          active: meta.active === 'N' ? 'N' : 'Y',
          bookIds: Array.isArray(meta.bookIds) && meta.bookIds.length > 0 ? meta.bookIds : autoBookIds,
          updatedAt: meta._updatedAt || 0
        };
      }).sort((a, b) => {
        const oa = a.order != null ? a.order : 9999;
        const ob = b.order != null ? b.order : 9999;
        return oa !== ob ? oa - ob : String(a.id).localeCompare(String(b.id));
      }),
      NANO_SERVER_NOTICES: notices.filter(n => brandOf(noticeMetaMap.get(n.id)) === brand).map(n => {
        const meta = noticeMetaMap.get(n.id) || {};
        const defaultTarget = n.targetRole === 'STUDENT' ? '학생' : n.targetRole === 'TEACHER' ? '가맹 학원' : n.targetRole === 'DIRECTOR' ? '가맹 학원' : n.targetRole === 'MASTER' ? '본사' : '전체';
        return {
          ...n,
          status: meta.status || '게시중',
          category: meta.category || '일반 공지',
          target: meta.target || defaultTarget,
          date: n.createdAt.toISOString().slice(0, 10),
          createdAt: n.createdAt.toISOString().slice(0, 10),
          isPinned: typeof meta.isPinned === 'boolean' ? meta.isPinned : n.isPinned,
          isPopup: typeof meta.isPopup === 'boolean' ? meta.isPopup : n.isPinned,
          popupStartDate: meta.popupStartDate || '',
          popupEndDate: meta.popupEndDate || '',
          link: meta.link || ''
        };
      }),
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
          quizAvg: m.quizAvg == null ? 0 : Math.round(Number(m.quizAvg)),
          serverId: m.id,
          id: m.legacySeq || index + 1000000,
          academyId: m.academy.code,
          academyName: m.academy.name,
          classGroupId: m.classGroup?.id || null,
          className: m.classGroup?.name || '미지정',
          characterId: memberCharMap.get(m.id) || memberCharMap.get(m.username) || undefined,
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
          kakaoBalance: a.kakaoBalance / 10, kakaoCount: Math.floor(a.kakaoBalance / 85),
          currentStudents: a._count.members,
          monthlyFee: a.monthlyFee,
          plan: a.plan,
          brand: brandOf(academyMetaMap.get(a.id)), status: academyMetaMap.get(a.id)?.uiStatus || a.status, autoUnapprove: academyMetaMap.get(a.id)?.autoUnapprove === true,
          joinDate: (a.joinDate || a.startDate).toISOString().slice(0, 10),
          startDate: a.startDate.toISOString().slice(0, 10),
          endDate: a.endDate.toISOString().slice(0, 10)
        };
      }),
      MIGRATED_LEARNING_LOGS: [],
      // 학생·일반 학원은 실시간 랭킹 API(/api/activity, /api/manage)를 사용하므로 초기 스크립트에 전체 랭킹 덤프를 싣지 않습니다.
      MIGRATED_RANKINGS: (isStudent ? [] : (user.role === 'MASTER' ? rankedMembers.slice(0, 200) : rankedMembers.filter(m => m.academy.code === user.academy.code).slice(0, 100))).map((m, index) => {
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
      MIGRATED_ACADEMY_RANKINGS: user.role === 'MASTER' ? academyRankings : []
    };
    const sessionUser = { brand, brandPolicy: (user as any).brandPolicy, id: user.username, memberId: user.id, name: user.name, studentName: user.name, studentId: user.username,
      role: user.role === 'MASTER' ? 'master' : user.role === 'STUDENT' ? 'student' : user.role === 'TEACHER' ? 'teacher' : 'admin',
      academyId: user.academy.code, academyName: user.academy.name, classGroup: members.find(m => m.id === user.id)?.classGroup?.name || '미지정', server: true };
    // 큰 퀴즈 배열은 한 번만 전송하고, 불필요한 전체 deep clone 대신 직접 참조하여 브라우저 메인 스레드 프리징 방지
    return res.status(200).send('sessionStorage.setItem("nano_auth_user", ' + JSON.stringify(JSON.stringify(sessionUser)).replace(/</g, '\\u003c') + ');\n' + Object.entries(data).map(([key, value]) => `window.${key} = ${JSON.stringify(value).replace(/</g, '\\u003c')};`).join('\n')
      + '\nwindow.MIGRATED_BOOKS.forEach(function(book) { var qs = (window.MIGRATED_QUIZZES && (window.MIGRATED_QUIZZES[book.id] || window.MIGRATED_QUIZZES[book.bookNo])) || null; if (qs && qs.length > 0) { book.quizSets = qs; book.hasQuiz = true; if (qs[0].questions) { book.quizCount = qs.reduce(function(sum, s) { return sum + (s.questions ? s.questions.length : 0); }, 0); } } else { book.quizSets = []; } });');
  } catch (error: any) {
    return res.status(error.brandAccess ? 403 : 503).send('window.NANO_BOOTSTRAP_FAILED = true;');
  }
}
