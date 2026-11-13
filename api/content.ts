import { randomUUID, randomInt } from 'node:crypto';
import { prisma } from '../lib/prisma';
import { authenticate, staff, need, text, failure } from '../lib/portal-http';
import { loadContentAccess, canReadContent, ownsContent, isOwnSheet, bookSheets, sheetView, saveContentRecord, resolveShareRecipients, shareableBooks, quizContent } from '../lib/portal-content';

export const config = { api: { bodyParser: { sizeLimit: '4.5mb' } }, maxDuration: 60 };

export default async function handler(req: any, res: any) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  try {
    const user = await authenticate(req);
    const action = String(req.query.action || 'folders');
    const body = req.body || {};
    // 큰 PDF도 공개 CDN에 올리지 않고 인증 파일을 나누어 저장합니다.
    if (req.method === 'POST' && action === 'sheet-chunk') {
      staff(user);
      need(typeof body.base64 === 'string' && body.base64.length <= 4200000 && /^[A-Za-z0-9+/]+={0,2}$/.test(body.base64), '파일 형식을 확인해 주세요.');
      const data = Buffer.from(body.base64, 'base64');
      need(data.length > 0 && data.length <= 3 * 1024 * 1024, '파일 조각 크기를 확인해 주세요.');
      const file = await prisma.portalFile.create({ data: { academyId: user.academyId, memberId: user.id, attemptId: 'CONTENT_SHEET', name: 'sheet-part', mime: 'application/pdf', data }, select: { id: true } });
      return res.status(201).json(file);
    }
    const access = await loadContentAccess(prisma);
    if (req.method === 'GET' && action === 'file') {
      const id = text(req.query.id, '자료 ID', 150, true);
      let sheet = access.sheets.find(s => s.id === id);
      if (!sheet && id.startsWith('legacy-')) {
        const book = await prisma.book.findUnique({ where: { id: id.slice(7) } });
        if (book) sheet = bookSheets(access, book).find(s => s.id === id);
      }
      need(sheet && canReadContent(user, sheet, access), '자료를 이용할 권한이 없거나 공유가 해제되었습니다.', 403);
      if (sheet.legacyUrl) {
        // 기존 공개 자료의 주소는 서버에서 저장된 값만 사용합니다.
        let url = String(sheet.legacyUrl).trim().replace(/^\.\//, '/');
        const mediaBase = (process.env.R2_PUBLIC_BASE_URL || 'https://media.nanosbook.co.kr').trim().replace(/\/+$/, '');
        url = url.replace(/^https?:\/\/pub-[a-z0-9]+\.r2\.dev/i, mediaBase);
        if (/^\/?upload\/book\//i.test(url)) url = mediaBase + '/' + url.replace(/^\/+/, '');
        need(/^(https?:\/\/|\/(?!\/)|upload\/)/.test(url) && !/[\r\n]/.test(url), '자료 주소를 확인해 주세요.');
        return res.redirect(302, url.startsWith('upload/') ? '/' + url : url);
      }
      const ids: string[] = sheet.fileIds || [];
      need(ids.length > 0, '자료 파일을 찾을 수 없습니다.', 404);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename*=UTF-8''${encodeURIComponent(sheet.name)}`);
      // PDF 뷰어의 범위 요청과 전체 다운로드 모두 지원합니다.
      const size = Number(sheet.size);
      const range = String(req.headers.range || '');
      let start = 0, end = size - 1;
      if (range) {
        const match = /^bytes=(\d+)-(\d*)$/.exec(range);
        need(match, '올바르지 않은 파일 범위입니다.', 416);
        start = Number(match[1]); end = match[2] ? Math.min(Number(match[2]), size - 1) : size - 1;
        need(start <= end && start < size, '올바르지 않은 파일 범위입니다.', 416);
        res.status(206); res.setHeader('Content-Range', `bytes ${start}-${end}/${size}`);
      }
      res.setHeader('Accept-Ranges', 'bytes');
      let offset = 0;
      for (const fileId of ids) {
        const file = await prisma.portalFile.findUnique({ where: { id: fileId } });
        need(file && file.attemptId === 'CONTENT_SHEET' && file.academyId === sheet.ownerAcademyId, '파일을 찾을 수 없습니다.', 404);
        const next = offset + file.data.length;
        if (next > start && offset <= end) res.write(file.data.subarray(Math.max(0, start - offset), Math.min(file.data.length, end - offset + 1)));
        offset = next;
        if (offset > end) break;
      }
      return res.end();
    }
    if (req.method === 'GET' && action === 'worksheets') {
      const id = text(req.query.bookId, '도서 ID', 100, true);
      const book = await prisma.book.findFirst({ where: { OR: [{ id }, { bookNo: id }] } });
      need(book, '도서를 찾을 수 없습니다.', 404);
      return res.json({ canUpload: user.role !== 'STUDENT', items: bookSheets(access, book).filter(s => canReadContent(user, s, access)).map(s => sheetView(s, user)) });
    }
    staff(user);
    if (req.method === 'GET' && action === 'director') {
      const username = text(req.query.username, '학원장 ID', 100, true);
      const [item] = await resolveShareRecipients(prisma, [username], user.academyId);
      return res.json({ item });
    }
    if (req.method === 'GET' && action === 'folders') {
      const own = access.folders.filter((f: any) => f.ownerMemberId === user.id);
      const received = access.folders.filter((f: any) => user.academyId && f.recipients?.some((r: any) => r.academyId === user.academyId));
      const ids = [...new Set<string>([...own, ...received].flatMap((f: any) => f.bookIds))];
      const books = await prisma.book.findMany({ where: { id: { in: ids } }, select: { id: true, title: true, bookNo: true, author: true, coverUrl: true } });
      const bookById = new Map(books.map((b: any) => [b.id, b]));
      const view = (f: any, mine: boolean) => ({ id: f.id, name: f.name, ownerAcademyName: f.ownerAcademyName, bookIds: f.bookIds,
        books: (f.bookIds || []).map((bid: string) => bookById.get(bid)).filter(Boolean), recipients: mine ? f.recipients : undefined, revision: f.revision, isMine: mine });
      return res.json({ items: own.map((f: any) => view(f, true)), received: received.map((f: any) => view(f, false)) });
    }
    if (req.method === 'GET' && action === 'catalog') return res.json({ items: await shareableBooks(prisma, user, access) });
    if (req.method === 'POST' && action === 'folder') {
      if (body.operation === 'delete') {
        const id = text(body.id, '폴더 ID', 100, true);
        const previous = access.folders.find((f: any) => f.id === id);
        need(previous && previous.ownerMemberId === user.id, '본인이 만든 공유 폴더만 삭제할 수 있습니다.', 403);
        await prisma.portalSetting.deleteMany({ where: { key: 'content_folder:' + id, scope: 'content_folder' } });
        return res.json({ ok: true, id });
      }
      const id = body.id ? text(body.id, '폴더 ID', 100, true) : randomUUID();
      const previous = access.folders.find((f: any) => f.id === id);
      need(!body.id || (previous && previous.ownerMemberId === user.id), '본인이 만든 공유 폴더만 편집할 수 있습니다.', 403);
      const name = text(body.name, '폴더명', 100, true);
      need(Array.isArray(body.bookIds) && body.bookIds.length <= 500 && body.bookIds.every((id: any) => typeof id === 'string'), '공유 도서는 최대 500권까지 선택할 수 있습니다.');
      const bookIds = [...new Set<string>(body.bookIds)];
      const available = new Set((await shareableBooks(prisma, user, access)).map((b: any) => b.id));
      need(bookIds.every(id => available.has(id)), '직접 등록한 북퀴즈 또는 나노시트가 있는 도서만 공유할 수 있습니다.', 403);
      const recipients = await resolveShareRecipients(prisma, body.directorUsernames, user.academyId);
      const academyName = user.academy?.name || (user.role === 'MASTER' ? '본사' : '가맹학원');
      const value = { id, name, bookIds, recipients, ownerMemberId: user.id, ownerAcademyId: user.academyId, ownerAcademyName: academyName };
      if (previous) need(body.revision === previous.revision, '다른 화면에서 폴더가 변경되었습니다. 새로고침해 주세요.', 409);
      await saveContentRecord(prisma, 'content_folder:' + id, 'content_folder', value, previous ? body.revision : 0);
      return res.json({ ok: true, id });
    }
    if (req.method === 'POST' && action === 'worksheet') {
      const bookId = text(body.bookId, '도서 ID', 100, true);
      const book = await prisma.book.findFirst({ where: { OR: [{ id: bookId }, { bookNo: bookId }] } });
      need(book, '도서를 찾을 수 없습니다.', 404);
      if (body.operation === 'delete') {
        const targetId = text(body.id, '나노시트 ID', 120, true);
        const target = bookSheets(access, book).find(s => s.id === targetId);
        need(target, '나노시트를 찾을 수 없습니다.', 404);
        need(isOwnSheet(user, target), user.role === 'MASTER' ? '본사에서 등록한 나노시트만 삭제할 수 있습니다.' : '우리 학원에서 등록한 나노시트만 삭제할 수 있습니다.', 403);
        await prisma.portalSetting.deleteMany({ where: { key: 'content_sheet:' + target.id, scope: 'content_sheet' } });
        if (Array.isArray(target.fileIds) && target.fileIds.length > 0 && typeof prisma.portalFile?.deleteMany === 'function') {
          await prisma.portalFile.deleteMany({ where: { id: { in: target.fileIds }, attemptId: 'CONTENT_SHEET' } });
        }
        if (target.id === 'legacy-' + book.id && typeof prisma.book?.update === 'function') {
          await prisma.book.update({ where: { id: book.id }, data: { worksheetUrl: null } });
        }
        return res.json({ deletedId: target.id });
      }
      need(['Y', 'N'].includes(body.isPublic), '공개 여부를 선택해 주세요.');
      const previous = body.id ? bookSheets(access, book).find(s => s.id === body.id) : null;
      need(!body.id || (previous && isOwnSheet(user, previous)), user.role === 'MASTER' ? '본사에서 등록한 나노시트만 수정할 수 있습니다.' : '우리 학원에서 등록한 나노시트만 수정할 수 있습니다.', 403);
      if (previous) need(body.revision === previous.revision, '다른 화면에서 자료가 변경되었습니다. 다시 열어 주세요.', 409);
      const id = previous?.id || randomUUID();
      let fileIds = previous?.fileIds || [], size = previous?.size || 0;
      if (body.fileIds !== undefined) {
        need(Array.isArray(body.fileIds) && body.fileIds.length > 0 && body.fileIds.length <= 9 && new Set(body.fileIds).size === body.fileIds.length && body.fileIds.every((x: any) => typeof x === 'string'), 'PDF 파일을 선택해 주세요.');
        const files = await prisma.portalFile.findMany({ where: { id: { in: body.fileIds }, memberId: user.id, academyId: user.academyId, attemptId: 'CONTENT_SHEET' } });
        need(files.length === body.fileIds.length, '직접 업로드한 파일만 등록할 수 있습니다.', 403);
        need(files.find(f => f.id === body.fileIds[0])?.data.subarray(0, 5).toString() === '%PDF-', '유효한 PDF 파일을 선택해 주세요.');
        size = files.reduce((n, f) => n + f.data.length, 0);
        need(size <= 25 * 1024 * 1024, 'PDF 파일은 25MB까지 등록할 수 있습니다.');
        fileIds = body.fileIds;
      }
      need(previous || fileIds.length, 'PDF 파일을 선택해 주세요.');
      const value = { id, bookId: book.id, name: text(body.name || previous?.name, '자료명', 200, true), isPublic: body.isPublic,
        ownerAcademyId: previous?.ownerAcademyId || user.academyId, ownerMemberId: previous?.ownerMemberId || user.id,
        academyName: previous?.academyName || user.academy?.name || (user.role === 'MASTER' ? '본사' : '가맹학원'), fileIds, size,
        ...(previous?.legacyUrl && !body.fileIds ? { legacyUrl: previous.legacyUrl } : {}) };
      const nextValue = { ...value, authorType: (previous && previous.authorType) || (user.role === 'MASTER' ? 'HQ' : 'ACADEMY') };
      const saved = await saveContentRecord(prisma, 'content_sheet:' + id, 'content_sheet', nextValue, previous ? body.revision : 0);
      return res.json({ item: sheetView({ ...nextValue, revision: saved.revision }, user) });
    }
    if (req.method === 'POST' && action === 'quiz') {
      const bookId = text(body.bookId, '도서 ID', 100, true);
      const book = await prisma.book.findFirst({ where: { OR: [{ id: bookId }, { bookNo: bookId }] } });
      need(book, '도서를 찾을 수 없습니다.', 404);
      need(['Y', 'N'].includes(body.isPublic), '공개 여부를 선택해 주세요.');
      const isNew = body.seq === undefined || body.seq === null;
      const seq = isNew ? randomInt(-2147000000, -2000000000) : Number(body.seq);
      need(Number.isInteger(seq), '퀴즈 세트를 확인해 주세요.');
      const previous = quizContent(access, book.id, seq);
      need(isNew || ownsContent(user, previous), '우리 학원에서 등록한 퀴즈만 수정할 수 있습니다.', 403);
      need(Array.isArray(body.questions) && body.questions.length > 0 && body.questions.length <= 100, '1~100문항을 입력해 주세요.');
      const questions = body.questions.map((q: any, index: number) => {
        need(q && typeof q === 'object' && !Array.isArray(q) && ['CHOICE', 'SUBJECTIVE'].includes(q.type), '문항 형식을 확인해 주세요.');
        const subjective = q.type === 'SUBJECTIVE';
        need(subjective || Array.isArray(q.options), '보기 형식을 확인해 주세요.');
        const options = subjective ? [] : q.options.map((o: any) => text(o, '보기', 1000, true));
        const answer = text(String(q.answer ?? ''), '정답', 1000, true);
        need(subjective || (options.length >= 2 && options.length <= 5 && Number.isInteger(Number(answer)) && Number(answer) >= 1 && Number(answer) <= options.length), '보기와 정답 번호를 확인해 주세요.');
        const hint = text(q.hint, '해설', 5000), similar = text(q.similarAns, '유사 정답', 1000);
        return { bookId: book.id, legacyQuizSeq: seq, questionNo: index + 1, question: text(q.question, '문항', 5000, true), options,
          correctAnswer: answer, quizType: subjective ? 'SHORT_ANSWER' as const : 'MULTIPLE_CHOICE' as const, score: 20,
          explanation: (subjective && similar ? `[SIMILAR:${similar}] ` : '') + hint };
      });
      const key = `content_quiz:${book.id}:${seq}`;
      const oldRow = access.rows.find(r => r.key === key);
      need((body.revision || 0) === (oldRow?.revision || 0), '다른 화면에서 퀴즈가 변경되었습니다. 다시 열어 주세요.', 409);
      const actorAcademyName = user.academy?.name || (user.role === 'MASTER' ? '본사' : '가맹학원');
      const value = { bookId: book.id, seq, ownerAcademyId: isNew ? user.academyId : previous.ownerAcademyId,
        ownerMemberId: previous.ownerMemberId || user.id, academyName: isNew ? actorAcademyName : previous.academyName,
        authorType: user.role === 'MASTER' && isNew ? 'HQ' : previous.authorType, isPublic: body.isPublic };
      await prisma.$transaction(async tx => {
        await tx.$queryRaw`SELECT id FROM books WHERE id = ${book.id} FOR UPDATE`;
        if (isNew) await tx.portalSetting.create({ data: { key: `quiz_seq:${seq}`, scope: 'quiz_author_seq', value: { academyId: user.academyId, academyName: actorAcademyName, authorName: actorAcademyName, authorType: user.role === 'MASTER' ? 'HQ' : 'ACADEMY' } } });
        await saveContentRecord(tx, key, 'content_quiz', value, oldRow?.revision || 0);
        await tx.bookQuiz.deleteMany({ where: { bookId: book.id, ...(seq === 0 ? { OR: [{ legacyQuizSeq: 0 }, { legacyQuizSeq: null }] } : { legacyQuizSeq: seq }) } });
        await tx.bookQuiz.createMany({ data: questions });
      });
      return res.json({ ok: true, seq });
    }
    return res.status(404).json({ error: '지원하지 않는 콘텐츠 요청입니다.' });
  } catch (error) {
    if (res.headersSent) return res.end();
    return failure(res, error);
  }
}
