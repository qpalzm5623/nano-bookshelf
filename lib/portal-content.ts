import { need } from './portal-http';
import legacyAuthors from './quiz-authors.json';

export const contentScopes = ['content_folder', 'content_quiz', 'content_sheet', 'quiz_author_seq', 'book_creator'];
export type ContentItem = { bookId: string; ownerAcademyId: string; ownerMemberId?: string; isPublic: string; [key: string]: any };

// 공개 여부와 공유 대상은 캐시하지 않습니다. 폴더에서 해제하면 다음 조회부터 차단됩니다.
export async function loadContentAccess(db: any, knownAcademies?: any[]) {
  const [rows, academies] = await Promise.all([
    db.portalSetting.findMany({ where: { scope: { in: contentScopes } }, select: { key: true, scope: true, value: true, revision: true } }),
    knownAcademies || db.academy.findMany({ select: { id: true, code: true, name: true } })
  ]);
  return {
    rows: rows as any[],
    byKey: new Map<string, any>(rows.map((r: any) => [r.key, r.value])),
    academies: academies as any[],
    folders: rows.filter((r: any) => r.scope === 'content_folder').map((r: any) => ({ ...r.value, revision: r.revision })),
    sheets: rows.filter((r: any) => r.scope === 'content_sheet').map((r: any) => ({ ...r.value, revision: r.revision })) as ContentItem[]
  };
}
export type ContentAccess = Awaited<ReturnType<typeof loadContentAccess>>;

function resolveCreatorAcademyId(access: ContentAccess, record: any): string {
  if (!record) return '';
  const academy = access.academies.find(a =>
    (record.academyId && a.id === record.academyId) ||
    (record.academyCode && a.code === record.academyCode) ||
    (record.academyName && record.academyName !== '본사' && a.name === record.academyName)
  );
  return academy?.id || record.academyId || '';
}

export function quizContent(access: ContentAccess, bookId: string, seq: number): ContentItem {
  const meta = access.byKey.get(`content_quiz:${bookId}:${seq}`);
  const author = access.byKey.get(`quiz_seq:${seq}`) || (legacyAuthors as any)[seq] || {};
  return {
    bookId, seq, isPublic: 'Y', ownerAcademyId: resolveCreatorAcademyId(access, author),
    academyName: author.academyName || author.authorName || (seq < 0 ? '가맹 학원' : '본사'),
    authorType: author.authorType || (seq < 0 ? 'ACADEMY' : 'HQ'), ...meta
  };
}

export function ownsContent(user: any, item: ContentItem) {
  return user.role === 'MASTER' || (!!item.ownerAcademyId && item.ownerAcademyId === user.academyId);
}
export function isOwnSheet(user: any, item: ContentItem) {
  // 마스터는 본사 등록/기본 나노시트만, 학원은 자사 기관이 등록한 나노시트만 수정·삭제할 수 있습니다.
  if (!user || user.role === 'STUDENT' || !item) return false;
  if (user.role === 'MASTER') {
    if (item.authorType === 'ACADEMY') return false;
    if (item.ownerAcademyId && (!user.academyId || item.ownerAcademyId !== user.academyId)) return false;
    return true;
  }
  return !!item.ownerAcademyId && item.ownerAcademyId === user.academyId;
}
export function canShareContent(user: any, item: ContentItem) {
  // 마스터는 본사 콘텐츠만 공유 대상으로 노출하고, 타 가맹 학원의 등록물은 제외합니다.
  if (user.role === 'MASTER') {
    if (item.authorType === 'ACADEMY') return false;
    if (item.ownerAcademyId && user.academyId && item.ownerAcademyId !== user.academyId) return false;
    return !item.ownerMemberId || item.ownerMemberId === user.id;
  }
  return ownsContent(user, item) && (!item.ownerMemberId || item.ownerMemberId === user.id);
}
export function canReadContent(user: any, item: ContentItem, access: ContentAccess) {
  if (item.isPublic !== 'N' || ownsContent(user, item)) return true;
  return access.folders.some((folder: any) =>
    folder.ownerAcademyId === item.ownerAcademyId &&
    (!item.ownerMemberId || folder.ownerMemberId === item.ownerMemberId) &&
    Array.isArray(folder.bookIds) && folder.bookIds.includes(item.bookId) &&
    Array.isArray(folder.recipients) && folder.recipients.some((r: any) => r.academyId === user.academyId));
}

export function bookSheets(access: ContentAccess, book: any): ContentItem[] {
  const list = access.sheets.filter(s => s.bookId === book.id);
  // 기존 도서 파일은 기본 공개로 호환하며, 이후 수정한 공개 범위가 우선합니다.
  if (book.worksheetUrl && !list.some(s => s.id === 'legacy-' + book.id)) {
    const creator = access.byKey.get('book_creator:' + book.bookNo) || access.byKey.get('book_creator:' + book.id) || {};
    list.unshift({ id: 'legacy-' + book.id, bookId: book.id, ownerAcademyId: resolveCreatorAcademyId(access, creator),
      academyName: creator.academyName || '본사', name: book.title + '_나노시트.pdf', isPublic: 'Y', legacyUrl: book.worksheetUrl, revision: 0 });
  }
  return list;
}

export function sheetView(sheet: ContentItem, user: any) {
  return { id: sheet.id, bookId: sheet.bookId, name: sheet.name, academyName: sheet.academyName,
    isPublic: sheet.isPublic, isMine: isOwnSheet(user, sheet), revision: sheet.revision || 0,
    url: '/api/content?action=file&id=' + encodeURIComponent(sheet.id) };
}

export async function saveContentRecord(db: any, key: string, scope: string, value: any, revision?: number) {
  if (revision === undefined || revision === 0) {
    return db.portalSetting.create({ data: { key, scope, value } });
  }
  const result = await db.portalSetting.updateMany({ where: { key, scope, revision }, data: { value, revision: { increment: 1 } } });
  need(result.count === 1, '다른 화면에서 변경되었습니다. 목록을 새로고침한 뒤 다시 편집해 주세요.', 409);
  return { revision: revision + 1 };
}

// 클라이언트에서 전달된 소유자/학원 이름을 신뢰하지 않고 실제 원장 계정에서 대상 학원을 결정합니다.
export async function resolveShareRecipients(db: any, usernames: any, ownerAcademyId: string) {
  need(Array.isArray(usernames) && usernames.length <= 100 && usernames.every(x => typeof x === 'string' && x.trim().length > 0 && x.length <= 100), '공유받을 학원장 ID를 확인해 주세요.');
  const ids = [...new Set<string>(usernames.map(x => x.trim()))];
  if (ids.length === 0) return [];
  const directors = await db.member.findMany({ where: { username: { in: ids }, role: 'DIRECTOR', status: 'APPROVED', academy: { status: 'ACTIVE', deletedAt: null } }, select: { id: true, username: true, name: true, academyId: true, academy: { select: { name: true } } } });
  need(directors.length === ids.length, '활성 학원의 승인된 학원장 ID만 등록할 수 있습니다. 입력한 ID를 확인해 주세요.');
  need(directors.every((d: any) => d.academyId !== ownerAcademyId), '우리 학원은 별도 공유 등록 없이 이용할 수 있습니다.');
  return directors.map((d: any) => ({ directorId: d.id, username: d.username, ...(d.name ? { directorName: d.name } : {}), academyId: d.academyId, academyName: d.academy.name }));
}

// 직접 등록한 북퀴즈 또는 나노시트 중 1개 이상이 비공개('N')로 설정된 도서만 공유 후보로 반환합니다.
export async function shareableBooks(db: any, user: any, access: ContentAccess) {
  const [groups, books] = await Promise.all([
    db.bookQuiz.groupBy({ by: ['bookId', 'legacyQuizSeq'], _count: { id: true } }),
    db.book.findMany({ select: { id: true, bookNo: true, title: true, author: true, publisher: true, grade: true, coverUrl: true, worksheetUrl: true, createdAt: true } })
  ]);
  const quizCounts = new Map<string, number>();
  const privateQuizCounts = new Map<string, number>();
  for (const g of groups) {
    const qMeta = quizContent(access, g.bookId, g.legacyQuizSeq || 0);
    if (!canShareContent(user, qMeta)) continue;
    const count = typeof g._count?.id === 'number' ? g._count.id : 1;
    quizCounts.set(g.bookId, (quizCounts.get(g.bookId) || 0) + count);
    if (qMeta.isPublic === 'N') {
      privateQuizCounts.set(g.bookId, (privateQuizCounts.get(g.bookId) || 0) + count);
    }
  }
  return books.map((b: any) => {
    const shareableSheets = bookSheets(access, b).filter(s => canShareContent(user, s));
    const privateSheets = shareableSheets.filter(s => s.isPublic === 'N');
    const quizCount = quizCounts.get(b.id) || 0;
    const privateQuizCount = privateQuizCounts.get(b.id) || 0;
    const createdAtIso = b.createdAt ? new Date(b.createdAt).toISOString() : '';
    return {
      id: b.id,
      bookNo: b.bookNo,
      title: b.title,
      author: b.author || '',
      publisher: b.publisher || '',
      grade: b.grade || '',
      coverUrl: b.coverUrl || '',
      createdAt: createdAtIso,
      hasQuiz: quizCount > 0,
      quizCount,
      hasPrivateQuiz: privateQuizCount > 0,
      privateQuizCount,
      hasSheet: shareableSheets.length > 0,
      sheetCount: shareableSheets.length,
      hasPrivateSheet: privateSheets.length > 0,
      privateSheetCount: privateSheets.length
    };
  }).filter((b: any) => b.hasPrivateQuiz || b.hasPrivateSheet);
}
