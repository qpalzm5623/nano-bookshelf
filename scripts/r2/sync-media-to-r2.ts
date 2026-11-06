// ==============================================================
// 나노의책장 - 로컬 업로드 자료(북커버 & 나노시트 PDF 3,732종) Cloudflare R2 일괄 동기화 도구
// ==============================================================
// 실행 방법:
//   - 사전 용량/대상 파일 점검: npm run r2:dry-run
//   - R2 일괄 업로드 + DB 연동: npm run r2:sync
//   - PDF 나노시트만 우선 업로드: npx tsx scripts/r2/sync-media-to-r2.ts --only-pdf
// ==============================================================

import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { prisma } from '../../lib/prisma';
import {
  isR2Configured,
  getR2Config,
  configureR2BucketCors,
  listR2Objects,
  putR2Object,
  buildPublicMediaUrl,
} from '../../lib/r2-storage';

interface LocalMediaFile {
  absPath: string;
  objectKey: string;
  fileName: string;
  ext: string;
  contentType: string;
  size: number;
}

const MIME_BY_EXT: Record<string, string> = {
  '.pdf': 'application/pdf',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.jfif': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
};

function scanUploadFolder(relFolder: string, onlyPdf = false): LocalMediaFile[] {
  const folderAbs = path.join(process.cwd(), 'public_html', relFolder);
  if (!fs.existsSync(folderAbs)) return [];

  const entries = fs.readdirSync(folderAbs, { withFileTypes: true });
  const results: LocalMediaFile[] = [];

  for (const entry of entries) {
    if (!entry.isFile()) continue;
    const ext = path.extname(entry.name).toLowerCase();
    const contentType = MIME_BY_EXT[ext];
    if (!contentType) continue;
    if (onlyPdf && ext !== '.pdf') continue;

    const absPath = path.join(folderAbs, entry.name);
    const stat = fs.statSync(absPath);
    if (stat.size <= 0) continue;

    const normalizedRel = `${relFolder.replace(/\\/g, '/')}/${entry.name}`;
    results.push({
      absPath,
      objectKey: normalizedRel,
      fileName: entry.name,
      ext,
      contentType,
      size: stat.size,
    });
  }
  return results;
}

function extractSheetIdentifiers(pdfFiles: LocalMediaFile[]): string[] {
  const idSet = new Set<string>();
  for (const f of pdfFiles) {
    const stem = f.fileName.replace(/\.pdf$/i, '').trim().toLowerCase();
    if (!stem) continue;
    idSet.add(stem);
    const isbnMatch = stem.match(/([0-9]{10,13})/);
    if (isbnMatch && isbnMatch[1]) idSet.add(isbnMatch[1]);
    const codeMatch = stem.match(/([a-z]{2}[0-9]{6})/i);
    if (codeMatch && codeMatch[1]) idSet.add(codeMatch[1].toLowerCase());
  }
  return Array.from(idSet).sort();
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const onlyPdf = process.argv.includes('--only-pdf');
  const concurrency = 12;

  console.log('\n☁️ =============================================================');
  console.log(`☁️ [나노의책장] Cloudflare R2 미디어 동기화 시작 (DRY_RUN=${dryRun}, ONLY_PDF=${onlyPdf})`);
  console.log('☁️ =============================================================\n');

  // 1. 로컬 파일 스캔
  const bookFiles = scanUploadFolder('upload/book', onlyPdf);
  const bannerFiles = onlyPdf ? [] : scanUploadFolder('upload/banner', false);
  const codeFiles = onlyPdf ? [] : scanUploadFolder('upload/code', false);
  const allFiles = [...bookFiles, ...bannerFiles, ...codeFiles];

  const pdfFiles = bookFiles.filter((f) => f.ext === '.pdf');
  const imgFiles = allFiles.filter((f) => f.ext !== '.pdf');
  const totalBytes = allFiles.reduce((acc, f) => acc + f.size, 0);

  console.log(`📂 로컬 스캔 결과:`);
  console.log(`   - 나노시트 PDF (upload/book/*.pdf): ${pdfFiles.length.toLocaleString()}개`);
  console.log(`   - 표지/배너/테마 이미지: ${imgFiles.length.toLocaleString()}개`);
  console.log(`   - 총 동기화 대상 용량: ${(totalBytes / (1024 * 1024)).toFixed(1)} MB (${allFiles.length.toLocaleString()}개 파일)\n`);

  if (!isR2Configured()) {
    if (dryRun) {
      console.log('ℹ️  현재 .env에 Cloudflare R2 환경변수가 아직 입력되지 않았습니다.');
      console.log('   아래 5개 값을 .env 및 Vercel 환경변수에 추가하신 뒤 `npm run r2:sync`를 실행하시면');
      console.log('   위 파일 전체가 자동으로 클라우드에 올라가고 DB 주소까지 한 번에 연결됩니다!\n');
      console.log('   R2_ACCOUNT_ID="클라우드플레어 계정 ID"');
      console.log('   R2_ACCESS_KEY_ID="R2 API 토큰 Access Key ID"');
      console.log('   R2_SECRET_ACCESS_KEY="R2 API 토큰 Secret Access Key"');
      console.log('   R2_BUCKET_NAME="nano-bookshelf"');
      console.log('   R2_PUBLIC_BASE_URL="https://pub-xxxxxxxx.r2.dev"\n');
      return;
    }
    getR2Config(); // 명확한 안내 에러 발생
  }

  const cfg = getR2Config();
  console.log(`🔗 연결 대상 R2 버킷: ${cfg.bucketName} (${cfg.publicBaseUrl})`);

  if (dryRun) {
    const remoteMap = await listR2Objects('upload/', cfg);
    const needUpload = allFiles.filter((f) => remoteMap.get(f.objectKey) !== f.size);
    console.log(`✅ R2 연결 성공! 현재 버킷 내 파일: ${remoteMap.size.toLocaleString()}개 / 추가 업로드 필요: ${needUpload.length.toLocaleString()}개`);
    return;
  }

  // 2. PDF.js 워터마크 뷰어 및 브라우저 직접 업로드를 위한 CORS 규칙 자동 적용
  console.log('🛡️  [1/4] R2 버킷 CORS 허용 정책 자동 설정 중...');
  try {
    await configureR2BucketCors(['*'], cfg);
    console.log('   ✅ CORS 설정 완료 (브라우저 PDF.js 뷰어 및 웹 직접 업로드 활성화).\n');
  } catch (err: any) {
    console.warn(`   ⚠️ CORS 자동 설정 건너뜀 (수동 설정 가능): ${err.message}\n`);
  }

  // 3. 이미 업로드된 객체 목록 조회 후 변경/신규 파일만 병렬 업로드
  console.log('🔍 [2/4] R2 버킷 기존 업로드 목록 비교 중...');
  const remoteMap = await listR2Objects('upload/', cfg);
  const toUpload = allFiles.filter((f) => remoteMap.get(f.objectKey) !== f.size);
  const skippedCount = allFiles.length - toUpload.length;
  console.log(`   - 이미 동기화됨(스킵): ${skippedCount.toLocaleString()}개 / 신규 업로드 대상: ${toUpload.length.toLocaleString()}개\n`);

  console.log(`🚀 [3/4] ${toUpload.length.toLocaleString()}개 파일 병렬 업로드 시작 (동시 ${concurrency}개)...`);
  let cursor = 0;
  let uploadedCount = 0;
  let failedCount = 0;

  async function worker() {
    while (true) {
      const idx = cursor++;
      if (idx >= toUpload.length) break;
      const item = toUpload[idx];
      try {
        const buf = fs.readFileSync(item.absPath);
        await putR2Object(item.objectKey, buf, item.contentType, 'public, max-age=31536000', cfg);
        uploadedCount++;
        if (uploadedCount % 100 === 0 || uploadedCount === toUpload.length) {
          console.log(`   ... 진행률: ${uploadedCount.toLocaleString()} / ${toUpload.length.toLocaleString()} 완료`);
        }
      } catch (err: any) {
        failedCount++;
        console.error(`   ❌ 업로드 실패 (${item.objectKey}): ${err.message}`);
      }
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, Math.max(toUpload.length, 1)) }, () => worker()));
  if (failedCount > 0) {
    throw new Error(`${failedCount}개 파일 업로드 중 오류가 발생했습니다. 다시 실행하시면 실패한 파일만 이어서 업로드됩니다.`);
  }
  console.log('   ✅ 모든 미디어 파일 R2 업로드 완료!\n');

  // 4. available_sheets.js 3,732종 전체 확장 갱신 및 Neon DB 도서 URL 일괄 연결
  console.log('🔄 [4/4] available_sheets.js 전체 나노시트 목록 갱신 및 Neon DB URL 연동 중...');
  const allLocalPdfs = scanUploadFolder('upload/book', true);
  const sheetIds = extractSheetIdentifiers(allLocalPdfs);
  const availableSheetsJsPath = path.join(process.cwd(), 'public_html', 'js', 'available_sheets.js');
  const jsContent =
    `// 실제 배포 환경(Cloudflare R2 포함)에서 즉시 서빙 가능한 검증된 나노시트(PDF) 파일 식별자 목록 (${sheetIds.length}개 식별자)\n` +
    `(function(global) {\n` +
    `  'use strict';\n` +
    `  var list = ${JSON.stringify(sheetIds)};\n` +
    `  global.AVAILABLE_NANOSHEET_SET = new Set(list.map(function(k) { return String(k).toLowerCase(); }));\n` +
    `})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : this));\n`;
  fs.writeFileSync(availableSheetsJsPath, jsContent, 'utf8');

  // 로컬 PDF 파일명(ISBN 또는 bookNo) 맵 구성
  const pdfKeyByIsbnOrCode = new Map<string, string>();
  for (const p of allLocalPdfs) {
    const stem = p.fileName.replace(/\.pdf$/i, '').trim();
    pdfKeyByIsbnOrCode.set(stem.toLowerCase(), p.objectKey);
  }

  const books = await prisma.book.findMany({
    select: { id: true, bookNo: true, isbn: true, coverUrl: true, worksheetUrl: true },
  });

  let updatedBookCount = 0;
  for (const b of books) {
    let nextCover = b.coverUrl;
    let nextSheet = b.worksheetUrl;

    if (!onlyPdf && nextCover && /^\/?upload\/book\//i.test(nextCover)) {
      nextCover = buildPublicMediaUrl(nextCover.replace(/^\/+/, ''), cfg);
    }

    if (nextSheet && /^\/?upload\/book\//i.test(nextSheet)) {
      nextSheet = buildPublicMediaUrl(nextSheet.replace(/^\/+/, ''), cfg);
    } else if (!nextSheet) {
      // DB에 worksheetUrl이 비어있더라도 ISBN이나 도서코드와 일치하는 PDF가 존재하면 자동 연결!
      const cleanIsbn = String(b.isbn || '').replace(/[^0-9Xx]/g, '').toLowerCase();
      const matchedKey =
        (cleanIsbn && pdfKeyByIsbnOrCode.get(cleanIsbn)) ||
        pdfKeyByIsbnOrCode.get(b.bookNo.toLowerCase());
      if (matchedKey) {
        nextSheet = buildPublicMediaUrl(matchedKey, cfg);
      }
    }

    if (nextCover !== b.coverUrl || nextSheet !== b.worksheetUrl) {
      await prisma.book.update({
        where: { id: b.id },
        data: { coverUrl: nextCover, worksheetUrl: nextSheet },
      });
      updatedBookCount++;
    }
  }

  console.log(`   ✅ available_sheets.js 갱신 완료 (${sheetIds.length.toLocaleString()}개 식별자)`);
  console.log(`   ✅ Neon DB 도서 ${updatedBookCount.toLocaleString()}권의 표지/나노시트 클라우드 URL 연결 완료!\n`);
  console.log('🎉 모든 설정과 파일 이전이 완료되었습니다!');
}

main()
  .catch((err) => {
    console.error('❌ R2 동기화 오류:', err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());

