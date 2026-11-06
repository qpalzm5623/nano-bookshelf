import { prisma } from '../lib/prisma';
import { authenticate, staff, need, failure } from '../lib/portal-http';
import { createHash } from 'node:crypto';
import { isR2Configured, createR2PresignedPutUrl, putR2Object } from '../lib/r2-storage';

export const config = { api: { bodyParser: { sizeLimit: '4.5mb' } } };

function detectMediaMime(data: Buffer, fallbackExt = ''): string {
  if (data.subarray(0, 5).toString() === '%PDF-') return 'application/pdf';
  if (data.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) return 'image/png';
  if (data[0] === 255 && data[1] === 216 && data[2] === 255) return 'image/jpeg';
  if (data.subarray(0, 4).toString() === 'GIF8') return 'image/gif';
  if (data.subarray(0, 4).toString() === 'RIFF' && data.subarray(8, 12).toString() === 'WEBP') return 'image/webp';
  const headText = data.subarray(0, 256).toString('utf8').trim();
  if (fallbackExt === 'svg' && (headText.startsWith('<svg') || headText.startsWith('<?xml')) && !/<script/i.test(data.toString('utf8'))) {
    return 'image/svg+xml';
  }
  return '';
}

function buildMediaObjectKey(category: string, keyHint: string, fileName: string, mime: string): string {
  const extFromMime: Record<string, string> = {
    'application/pdf': 'pdf',
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/gif': 'gif',
    'image/svg+xml': 'svg',
  };
  const rawExt = (fileName.split('.').pop() || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const ext = extFromMime[mime] || rawExt || (category === 'nano-sheet' ? 'pdf' : 'jpg');

  // 도서 표지 및 나노시트는 예전 FTP 폴더 구조(upload/book/ISBN또는코드.확장자)를 그대로 유지하여 관리 편의성 극대화
  const folder =
    category === 'banner' ? 'upload/banner' :
    category === 'theme' ? 'upload/code' :
    'upload/book';

  const cleanHint = String(keyHint || '')
    .trim()
    .replace(/[^A-Za-z0-9_-]/g, '');
  const cleanFileStem = String(fileName || 'file')
    .replace(/\.[^.]+$/, '')
    .replace(/[^A-Za-z0-9가-힣_-]/g, '_')
    .slice(0, 60);

  const stamp = Date.now().toString(36);
  const stem = cleanHint ? `${cleanHint}_${stamp}` : `${cleanFileStem || 'media'}_${stamp}`;
  return `${folder}/${stem}.${ext}`;
}

export default async function handler(req: any, res: any) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  try {
    const user = await authenticate(req);

    if (req.method === 'GET') {
      // 1) 도서 표지/나노시트/배너 등 공용 미디어 조회 (R2 미연결 시 DB 폴백 서빙)
      const mediaId = String(req.query.mediaId || '').trim();
      if (mediaId) {
        const media = await prisma.portalFile.findUnique({ where: { id: mediaId } });
        need(media && media.attemptId === 'BOOK_MEDIA', '미디어 파일을 찾을 수 없습니다.', 404);
        res.setHeader('Cache-Control', 'private, max-age=86400');
        res.setHeader('Content-Type', media.mime);
        res.setHeader('Content-Disposition', `inline; filename*=UTF-8''${encodeURIComponent(media.name)}`);
        return res.status(200).send(media.data);
      }

      // 2) 기존 학생 북퀴즈 첨삭 파일 다운로드 (학원 및 본인 권한 검증 유지)
      const file = await prisma.portalFile.findUnique({ where: { id: String(req.query.id || '') } });
      need(file && (user.role === 'MASTER' || file.academyId === user.academyId), '파일을 찾을 수 없습니다.', 404);
      const attempt = await prisma.quizAttempt.findUnique({ where: { id: file.attemptId } });
      need(attempt && (user.role !== 'STUDENT' || attempt.memberId === user.id), '파일을 열 수 없습니다.', 403);
      res.setHeader('Content-Type', file.mime);
      res.setHeader('Content-Disposition', "attachment; filename*=UTF-8''" + encodeURIComponent(file.name));
      return res.status(200).send(file.data);
    }

    staff(user);
    const body = req.body || {};

    // --------------------------------------------------------------
    // A. 도서 표지 · 나노시트(PDF) · 배너 · 테마 미디어 업로드 (Cloudflare R2 우선 + DB 폴백)
    // --------------------------------------------------------------
    if (body.scope === 'media') {
      const category = String(body.category || 'book-cover');
      const fileName = String(body.fileName || body.name || 'upload').replace(/[\r\n<>/\\]/g, '_').slice(0, 200);
      const keyHint = String(body.keyHint || '').slice(0, 80);

      // 1단계: 브라우저 -> R2 직접 업로드용 서명 URL 발급 (대용량 PDF 25MB까지 무제한 통과)
      if (body.operation === 'presign') {
        const contentType = String(body.contentType || '').toLowerCase().trim();
        const fileSize = Number(body.fileSize || 0);
        const allowedTypes = new Set([
          'application/pdf',
          'image/jpeg',
          'image/jpg',
          'image/png',
          'image/webp',
          'image/gif',
          'image/svg+xml',
        ]);
        need(allowedTypes.has(contentType), '지원하지 않는 파일 형식입니다. (PDF, JPG, PNG, WEBP, GIF, SVG만 가능)');
        const maxBytes = contentType === 'application/pdf' ? 25 * 1024 * 1024 : 10 * 1024 * 1024;
        need(fileSize > 0 && fileSize <= maxBytes, contentType === 'application/pdf' ? 'PDF 파일은 최대 25MB까지 업로드 가능합니다.' : '이미지 파일은 최대 10MB까지 업로드 가능합니다.', 413);

        if (!isR2Configured()) {
          return res.status(200).json({ configured: false, mode: 'db-fallback' });
        }

        const normalizedMime = contentType === 'image/jpg' ? 'image/jpeg' : contentType;
        const objectKey = buildMediaObjectKey(category, keyHint, fileName, normalizedMime);
        const signed = createR2PresignedPutUrl(objectKey, 900);
        return res.status(200).json({
          configured: true,
          mode: 'presign',
          contentType: normalizedMime,
          ...signed,
        });
      }

      // 2단계: 서버 경유 업로드 (R2 버킷 CORS 미적용 환경 또는 R2 미설정 시 DB 안전 폴백)
      const rawB64 = String(body.base64 || '').replace(/^data:[^;]+;base64,/, '').trim();
      need(rawB64.length > 0 && rawB64.length <= 4200000 && /^[A-Za-z0-9+/]*={0,2}$/.test(rawB64), 'R2 클라우드 미연결 상태에서는 3MB 이하 파일만 직접 업로드할 수 있습니다.', 413);
      const data = Buffer.from(rawB64, 'base64');
      need(data.length > 0 && data.length <= 3 * 1024 * 1024, '파일 용량은 3MB 이하여야 합니다.', 413);

      const fallbackExt = (fileName.split('.').pop() || '').toLowerCase();
      const mime = detectMediaMime(data, fallbackExt);
      need(Boolean(mime), '유효한 PDF 또는 이미지(JPG, PNG, WEBP, GIF, SVG) 파일만 업로드할 수 있습니다.');

      if (isR2Configured()) {
        const objectKey = buildMediaObjectKey(category, keyHint, fileName, mime);
        const uploaded = await putR2Object(objectKey, data, mime);
        return res.status(201).json({
          configured: true,
          mode: 'r2-proxy',
          publicUrl: uploaded.publicUrl,
          objectKey: uploaded.objectKey,
        });
      }

      // R2 설정 전에도 웹 업로드가 즉시 작동하도록 PortalFile 테이블에 안전 저장
      const mediaId = 'media_' + createHash('sha256').update(category).update(data).digest('hex').slice(0, 40);
      const existing = await prisma.portalFile.findUnique({ where: { id: mediaId }, select: { id: true } });
      if (!existing) {
        await prisma.portalFile.create({
          data: {
            id: mediaId,
            academyId: user.academyId || 'HQ',
            memberId: user.id,
            attemptId: 'BOOK_MEDIA',
            name: fileName,
            mime,
            data,
          },
        });
      }
      return res.status(201).json({
        configured: false,
        mode: 'db-fallback',
        publicUrl: `/api/files?mediaId=${encodeURIComponent(mediaId)}`,
        objectKey: mediaId,
      });
    }

    // --------------------------------------------------------------
    // B. 기존 학생 북퀴즈 첨삭 파일 업로드
    // --------------------------------------------------------------
    const attempt = await prisma.quizAttempt.findFirst({ where: { id: body.attemptId || '', ...(user.role === 'MASTER' ? {} : { member: { academyId: user.academyId } }) }, include: { member: true } });
    need(attempt, '첨삭할 학습 기록을 찾을 수 없습니다.', 404);
    need(typeof body.base64 === 'string' && body.base64.length <= 2800000 && /^[A-Za-z0-9+/]*={0,2}$/.test(body.base64), '파일은 2MB 이하로 올려 주세요.', 413);
    const data = Buffer.from(body.base64, 'base64');
    need(data.length > 0 && data.length <= 2 * 1024 * 1024, '파일은 2MB 이하로 올려 주세요.', 413);
    const mime = data.subarray(0, 5).toString() === '%PDF-' ? 'application/pdf' : data.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10])) ? 'image/png' : data[0] === 255 && data[1] === 216 && data[2] === 255 ? 'image/jpeg' : '';
    need(mime, 'PDF, PNG, JPG 파일만 올릴 수 있습니다.');
    const name = String(body.name || '첨삭파일').replace(/[\r\n<>/\\]/g, '_').slice(0, 200);
    const file = await prisma.$transaction(async tx => {
      await tx.$queryRaw`SELECT id FROM quiz_attempts WHERE id = ${attempt.id} FOR UPDATE`;
      const id = 'file_' + createHash('sha256').update(attempt.id).update(data).digest('hex');
      const previous = await tx.portalFile.findUnique({ where: { id }, select: { id: true, name: true } });
      if (previous) return previous;
      need(await tx.portalFile.count({ where: { attemptId: attempt.id } }) < 10, '한 학습 기록에 파일은 최대 10개까지 첨부할 수 있습니다.');
      return tx.portalFile.create({ data: { id, academyId: attempt.member.academyId, memberId: user.id, attemptId: attempt.id, name, mime, data }, select: { id: true, name: true } });
    });
    return res.status(201).json({ file });
  } catch (error) {
    return failure(res, error);
  }
}
