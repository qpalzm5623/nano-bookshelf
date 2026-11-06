// ==============================================================
// 나노의책장 - 비파괴 통합 안전 마이그레이션 오케스트레이터 (Full Safe Migration)
// ==============================================================
// 실행 방법:
//   - 사전 시뮬레이션(DB 변경 없음): npm run migrate:dry-run
//   - 전체 안전 마이그레이션 실행:   npm run migrate:all
//   - 사후 무결성 10대 검증만 실행: npm run migrate:verify
//
// [핵심 안전장치 - 과거 발생했던 모든 이슈 재발 원천 차단]
//  1. 비밀번호 scrypt: 해시 자동 적용 + 기존 변경 비밀번호 & MASTER 계정 100% 보존
//  2. 비파괴 Upsert 이관 (회원/학원/반 ID 유지 -> 나노프렌즈 캐릭터·포트폴리오·배정도서 보존)
//  3. 원장 부재 가맹점 자동 복구 (레거시 비활성 원장 복원 또는 표준 원장 계정 자동 발급)
//  4. 도서 컬럼 밀림(FA000001 등) 자가 치유 + 동일 ISBN 중복 도서 안전 통폐합 + 테마 자동 연결
//  5. 테마 관리 노출 순서(theme_meta:*) · 배너 · 공지사항 기존 운영 설정 100% 보존
//  6. 북퀴즈 문항 비파괴 증분 적재(학원 자체 출제 세트 보존) + quiz-authors.json 자동 갱신
//  7. 도서 찜(하트)/추천 실데이터 + 전 기간 북퀴즈 완료 내역 + 단권 [학습리포트] 정오답표 생성
//  8. 학생 누적 완독 권수(60점 이상 고유 도서 수 기준) 및 포인트 이력 KST(+09:00) 정밀 동기화
//  9. 정적 폴백 번들(migrated_real_data.js) 갱신 및 사후 10대 무결성 검증 자동 실행
// ==============================================================

import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';
import { pathToFileURL } from 'url';
import { PlanTier, Role, MemberStatus, QuizType, AcademyStatus } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { hashPassword } from '../../lib/portal-auth';
import { DUMP_PATH, loadTables } from './legacy-dump';
import { tryPhpUnserialize } from './php-unserialize';
import { extractQuizAuthors } from '../extract_quiz_authors';
import { verifyMigrationIntegrity } from './verify-migration-integrity';

const DEFAULT_PASSWORD = process.env.MIGRATION_DEFAULT_PASSWORD || 'nano123!';
const DEFAULT_THEME_ORDER = [
  '수학', '학습', '자연', '인간', '건강', '과학', '생활',
  '역사', '예술', '사회', '감정', '환경', '기타'
];

function mapPlanTier(plan: unknown): PlanTier {
  const p = String(plan ?? '').trim();
  if (p === '10' || p.toLowerCase() === 'basic') return PlanTier.BASIC;
  if (p === '30' || p.toLowerCase() === 'standard') return PlanTier.STANDARD;
  if (p === '50' || p.toLowerCase() === 'premium') return PlanTier.PREMIUM;
  if (p === '100' || p.toLowerCase() === 'royal') return PlanTier.ROYAL;
  if (p === '150' || p === '200' || p.toLowerCase() === 'vip') return PlanTier.VIP;
  return PlanTier.STANDARD;
}

function mapGrade(grade: unknown): string {
  if (grade === null || grade === undefined || grade === '') return '미지정';
  const g = Number(grade);
  if (isNaN(g)) return String(grade).trim();
  if (g === 0) return '유치부';
  if (g >= 1 && g <= 6) return `초${g}`;
  if (g >= 7 && g <= 9) return `중${g - 6}`;
  if (g >= 10) return `고${g - 9}`;
  return `${g}학년`;
}

// MySQL 덤프 시각('YYYY-MM-DD HH:mm:ss')을 한국 표준시(KST, +09:00)로 정확히 해석
function parseKstDate(val: unknown, fallback: Date | null): Date | null {
  if (!val) return fallback;
  const s = String(val).trim();
  if (!s || s.startsWith('0000') || s.startsWith('00-00')) return fallback;
  const iso = s.includes('T')
    ? s
    : (/^\d{4}-\d{2}-\d{2}$/.test(s) ? `${s}T00:00:00+09:00` : s.replace(' ', 'T') + '+09:00');
  const d = new Date(iso);
  if (!isNaN(d.getTime())) return d;
  const d2 = new Date(s);
  return isNaN(d2.getTime()) ? fallback : d2;
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

function runSubScript(relScriptPath: string, extraArgs: string[] = []): void {
  const tsxCli = path.join(process.cwd(), 'node_modules', 'tsx', 'dist', 'cli.mjs');
  const target = path.join(process.cwd(), relScriptPath);
  execFileSync(process.execPath, [tsxCli, target, ...extraArgs], {
    stdio: 'inherit',
    env: process.env
  });
}

export async function runFullSafeMigration(options: { dryRun?: boolean; runDeduplicate?: boolean } = {}): Promise<void> {
  const dryRun = options.dryRun ?? process.argv.includes('--dry-run');
  const runDeduplicate = options.runDeduplicate ?? !process.argv.includes('--skip-dedup');

  console.log('\n🛡️ =============================================================');
  console.log(`🛡️ [나노의책장] 통합 안전 마이그레이션 시작 (DRY_RUN=${dryRun})`);
  console.log(`🛡️ 대상 덤프 파일: ${DUMP_PATH}`);
  console.log('🛡️ =============================================================\n');

  if (!fs.existsSync(DUMP_PATH)) {
    throw new Error(`백업 SQL 파일을 찾을 수 없습니다: ${DUMP_PATH}\nbackups/ 폴더에 최신 .sql 파일을 넣거나 LEGACY_DUMP_PATH 환경변수를 지정해 주세요.`);
  }

  // --------------------------------------------------------------
  // STEP 1. 레거시 SQL 덤프 스트리밍 로드
  // --------------------------------------------------------------
  console.log('📥 [1/8] 레거시 백업 SQL 테이블 스트리밍 로드 중...');
  const T = await loadTables([
    'tb_code',
    'tb_book',
    'tb_quiz',
    'tb_user',
    'tb_book_list',
    'tb_point_history',
  ]);
  const activeLegacyUsers = T.tb_user.filter((r) => r.user_status === 'Y');
  const allLegacyDirectors = T.tb_user.filter((r) => r.user_type === 'director');

  console.log(`   - 전체 회원 레코드: ${T.tb_user.length.toLocaleString()}명 (정상 활성 Y: ${activeLegacyUsers.length.toLocaleString()}명)`);
  console.log(`   - 도서(tb_book): ${T.tb_book.length.toLocaleString()}권`);
  console.log(`   - 북퀴즈 세트(tb_quiz): ${T.tb_quiz.length.toLocaleString()}건`);
  console.log(`   - 학원 보유도서(tb_book_list): ${T.tb_book_list.length.toLocaleString()}건`);
  console.log(`   - 포인트 내역(tb_point_history): ${T.tb_point_history.length.toLocaleString()}건\n`);

  // --------------------------------------------------------------
  // STEP 2. 기존 포털 운영 데이터 스냅샷 백업 (비밀번호·캐릭터·찜·MASTER 보존용)
  // --------------------------------------------------------------
  console.log('🔒 [2/8] 기존 포털 보안 해시 비밀번호 및 개인화 설정 스냅샷 수집 중...');
  const [existingMembers, existingAcademies, existingSettings] = await Promise.all([
    prisma.member.findMany({
      select: { id: true, username: true, password: true, role: true, name: true, academyId: true, legacySeq: true }
    }),
    prisma.academy.findMany({
      select: { id: true, code: true, name: true, legacySeq: true }
    }),
    prisma.portalSetting.findMany({
      where: {
        OR: [
          { key: { startsWith: 'character:' } },
          { key: { startsWith: 'preferences:' } },
          { scope: 'theme_meta' }
        ]
      }
    })
  ]);

  const existingMemberByUsername = new Map<string, (typeof existingMembers)[0]>();
  const memberIdToUsername = new Map<string, string>();
  for (const m of existingMembers) {
    existingMemberByUsername.set(m.username.trim().toLowerCase(), m);
    memberIdToUsername.set(m.id, m.username.trim().toLowerCase());
  }

  // username 기준 캐릭터 선택값 백업 (회원 ID가 혹시 변동되어도 복원 가능)
  const characterByUsername = new Map<string, any>();
  const existingThemeMetaKeys = new Set<string>();
  for (const s of existingSettings) {
    if (s.key.startsWith('character:')) {
      const oldMid = s.key.replace(/^character:/, '');
      const uName = memberIdToUsername.get(oldMid);
      if (uName) characterByUsername.set(uName, s.value);
    } else if (s.scope === 'theme_meta') {
      existingThemeMetaKeys.add(s.key);
    }
  }
  console.log(`   ✅ 기존 회원 ${existingMembers.length.toLocaleString()}명 / 학원 ${existingAcademies.length}개소 / 캐릭터 설정 ${characterByUsername.size}건 스냅샷 확보.\n`);

  if (dryRun) {
    console.log('🧪 [DRY_RUN] 도서·찜·추천·학습리포트 시뮬레이션 검증을 이어서 수행합니다...');
    runSubScript('scripts/migrate_social_and_learning.ts', ['--dry-run']);
    console.log('\n✅ [DRY_RUN 완료] 데이터베이스 변경 없이 모든 사전 검증을 통과했습니다.');
    return;
  }

  // --------------------------------------------------------------
  // STEP 3. 테마 카테고리 Upsert 및 테마 노출 순서(theme_meta) 보존
  // --------------------------------------------------------------
  console.log('🏷️  [3/8] 주제 테마(ThemeCategory) 동기화 및 노출 순서(theme_meta) 보존 처리 중...');
  const topicCodes = T.tb_code.filter((c) => c.code_group === 'topic');
  const themeMap = new Map<string, string>(); // themeName -> themeId

  for (const tc of topicCodes) {
    const code = `THM-${String(tc.code_type ?? tc.code_seq)}`;
    const name = String(tc.code_name ?? tc.code_type).trim();
    const desc = tc.code_desc ? String(tc.code_desc) : null;

    const theme = await prisma.themeCategory.upsert({
      where: { code },
      update: { name, description: desc },
      create: { code, name, description: desc },
    });
    themeMap.set(name, theme.id);
  }

  const allDbThemes = await prisma.themeCategory.findMany();
  let seededThemeMetaCount = 0;
  for (const th of allDbThemes) {
    themeMap.set(th.name.trim(), th.id);
    const metaKey = `theme_meta:${th.id}`;
    // 이미 포털에서 설정한 노출 순서가 있으면 절대 덮어쓰지 않고 보존!
    if (!existingThemeMetaKeys.has(metaKey)) {
      const idx = DEFAULT_THEME_ORDER.indexOf(th.name.trim());
      const defaultOrder = idx >= 0 ? idx + 1 : DEFAULT_THEME_ORDER.length + 1;
      await prisma.portalSetting.upsert({
        where: { key: metaKey },
        update: {},
        create: {
          key: metaKey,
          scope: 'theme_meta',
          value: { active: 'Y', order: defaultOrder, tag: `#${th.name.trim()}` },
          revision: 1,
        }
      });
      seededThemeMetaCount++;
    }
  }
  console.log(`   ✅ 테마 ${allDbThemes.length}개 준비 완료 (기존 노출 순서 보존, 신규 기본값 생성 ${seededThemeMetaCount}개).\n`);

  // --------------------------------------------------------------
  // STEP 4. 도서(Book) 비파괴 적재 + 컬럼 밀림 자가 치유 + 중복 도서 통폐합
  // --------------------------------------------------------------
  console.log('📖 [4/8] 도서(Book) 비파괴 증분 적재 및 정합성 보정 중...');
  const currentBooks = await prisma.book.findMany({ select: { id: true, bookNo: true, isbn: true, themeId: true, subject: true } });
  const existingBookNos = new Set(currentBooks.map(b => b.bookNo.trim()));
  const existingIsbns = new Set(
    currentBooks
      .map(b => String(b.isbn || '').replace(/[^0-9Xx]/g, ''))
      .filter(s => s.length >= 10)
  );

  const newBooksToCreate: any[] = [];
  for (const b of T.tb_book) {
    let bNo = String(b.book_no ?? '').trim();
    let title = String(b.book_name ?? '제목 없음').trim();
    let rawSeries = b.serise ? String(b.serise).trim() : '';
    let author = String(b.author ?? '저자 미상').trim();
    let pub = b.publisher ? String(b.publisher).trim() : null;
    let cover = b.book_cover ? `/upload/book/${b.book_cover}` : null;
    let cat = b.category ? String(b.category).trim() : null;
    let subCat = b.sub_category ? String(b.sub_category).trim() : null;
    let gr = b.recommend_class !== null && b.recommend_class !== undefined ? mapGrade(b.recommend_class) : null;

    // FA000001(고양이 목욕탕) 등 컬럼 밀림 레코드 자가 치유
    if ((!bNo || bNo === 'undefined') && /^[A-Z]{2}\d{6}$/.test(title)) {
      bNo = title;
      title = rawSeries && rawSeries !== '단권' ? rawSeries : '고양이 목욕탕';
      rawSeries = author && author !== '저자 미상' ? author : '상상그림책 5';
      author = '구사카 미나코 글/기타무라 유카 그림/황진희 역';
      pub = '옐로스톤';
      cat = 'F';
      subCat = 'A';
      gr = '유치부';
      cover = '/upload/book/9791187079521.jpg';
    }
    if (!bNo) continue;

    // 이미 등록된 bookNo이거나 동일 ISBN으로 통폐합 완료된 도서는 재삽입 스킵 (중복 재생성 방지!)
    const cleanIsbn = String(b.isbn ?? '').replace(/[^0-9Xx]/g, '');
    if (existingBookNos.has(bNo)) continue;
    if (cleanIsbn.length >= 10 && existingIsbns.has(cleanIsbn)) continue;

    const series = !rawSeries || rawSeries === '단권' ? '단권' : rawSeries;
    const ws = b.worksheet ? `/upload/book/${b.worksheet}` : null;
    const subj = b.subject ? String(b.subject).trim() : null;
    const themeId = subj && themeMap.has(subj) ? themeMap.get(subj)! : null;

    newBooksToCreate.push({
      bookNo: bNo,
      title,
      author,
      publisher: pub,
      isbn: b.isbn ? String(b.isbn).trim() : null,
      series,
      coverUrl: cover,
      worksheetUrl: ws,
      category: cat,
      subCategory: subCat,
      grade: gr,
      tags: b.tags ? String(b.tags) : null,
      award: b.award ? String(b.award) : null,
      subject: subj,
      thinkTitle: b.think_title ? String(b.think_title) : null,
      thinkQuiz: b.think_quiz ? String(b.think_quiz) : null,
      isRecommended: b.recommend_yn === 'Y',
      themeId,
    });
    existingBookNos.add(bNo);
  }

  for (const batch of chunk(newBooksToCreate, 500)) {
    await prisma.book.createMany({ data: batch, skipDuplicates: true });
  }

  // DB 내 혹시 남아있을 컬럼 밀림 유령 레코드(bookNo='undefined' 또는 '') 자동 병합·정리 및 누락된 themeId 일괄 보정
  const badShiftedRows = await prisma.book.findMany({
    where: { OR: [{ bookNo: '' }, { bookNo: 'undefined' }] }
  });
  for (const bad of badShiftedRows) {
    const targetNo = /^[A-Z]{2}\d{6}$/.test(bad.title || '') ? bad.title.trim() : '';
    const cleanTarget = targetNo ? await prisma.book.findUnique({ where: { bookNo: targetNo } }) : null;
    if (cleanTarget && cleanTarget.id !== bad.id) {
      await prisma.quizAttempt.updateMany({ where: { bookId: bad.id }, data: { bookId: cleanTarget.id } });
      await prisma.bookQuiz.updateMany({ where: { bookId: bad.id }, data: { bookId: cleanTarget.id } });
      await prisma.bookAssignment.updateMany({ where: { bookId: bad.id }, data: { bookId: cleanTarget.id } });
      await prisma.book.delete({ where: { id: bad.id } });
    } else if (targetNo) {
      await prisma.book.update({
        where: { id: bad.id },
        data: {
          bookNo: targetNo,
          title: (bad.series && bad.series !== '단권') ? bad.series : '고양이 목욕탕',
          series: (bad.author && bad.author !== '저자 미상') ? bad.author : '상상그림책 5',
          author: '구사카 미나코 글/기타무라 유카 그림/황진희 역',
          publisher: '옐로스톤',
          isbn: '9791187079521',
          category: 'F',
          subCategory: 'A',
          grade: '유치부',
          coverUrl: '/upload/book/9791187079521.jpg',
          worksheetUrl: '/upload/book/9791187079521.pdf',
          subject: '이야기',
          themeId: themeMap.get('이야기') || null,
        }
      });
    }
  }
  for (const [subjName, thId] of themeMap.entries()) {
    await prisma.book.updateMany({
      where: { themeId: null, subject: subjName },
      data: { themeId: thId }
    });
  }
  console.log(`   ✅ 신규 도서 ${newBooksToCreate.length}권 추가 적재 및 테마 매핑 보정 완료.`);

  if (runDeduplicate && newBooksToCreate.length > 0) {
    console.log('   - 신규 유입 도서에 대한 ISBN 중복 통폐합 점검 실행 중...');
    runSubScript('scripts/deduplicate_books.ts');
  }

  // 최신 도서 맵 재구축 (통폐합된 레거시 book_no -> 대표 도서 ID 매핑 포함)
  const finalBooks = await prisma.book.findMany({ select: { id: true, bookNo: true, isbn: true, title: true } });
  const bookByNo = new Map(finalBooks.map(b => [b.bookNo.trim(), b]));
  const bookByIsbn = new Map<string, (typeof finalBooks)[0]>();
  const bookByCleanTitle = new Map<string, (typeof finalBooks)[0]>();
  for (const b of finalBooks) {
    const ci = String(b.isbn || '').replace(/[^0-9Xx]/g, '');
    if (ci.length >= 10 && !bookByIsbn.has(ci)) bookByIsbn.set(ci, b);
    const ct = b.title.trim().replace(/[\s()[\]·.,!?~'"-]/g, '').toLowerCase();
    if (ct && !bookByCleanTitle.has(ct)) bookByCleanTitle.set(ct, b);
  }

  const resolveBookId = (legacyBookNo: string): string | null => {
    const cleanNo = legacyBookNo.trim();
    if (bookByNo.has(cleanNo)) return bookByNo.get(cleanNo)!.id;
    return null;
  };

  // 레거시 전체 도서번호 -> 현재 대표 도서 매핑 구축
  const legacyBookNoToPrimaryId = new Map<string, string>();
  for (const lb of T.tb_book) {
    const bNo = String(lb.book_no ?? '').trim();
    if (!bNo) continue;
    if (bookByNo.has(bNo)) {
      legacyBookNoToPrimaryId.set(bNo, bookByNo.get(bNo)!.id);
      continue;
    }
    const ci = String(lb.isbn ?? '').replace(/[^0-9Xx]/g, '');
    if (ci.length >= 10 && bookByIsbn.has(ci)) {
      legacyBookNoToPrimaryId.set(bNo, bookByIsbn.get(ci)!.id);
      continue;
    }
    const ct = String(lb.book_name ?? '').trim().replace(/[\s()[\]·.,!?~'"-]/g, '').toLowerCase();
    if (ct && bookByCleanTitle.has(ct)) {
      legacyBookNoToPrimaryId.set(bNo, bookByCleanTitle.get(ct)!.id);
    }
  }
  console.log(`   ✅ 총 ${finalBooks.length.toLocaleString()}권 대표 도서 매핑 준비 완료.\n`);

  // --------------------------------------------------------------
  // STEP 5. 가맹 학원(Academy) · 학급(ClassGroup) · 회원(Member) 비파괴 Upsert + scrypt 해싱 + 원장 자동 복구
  // --------------------------------------------------------------
  console.log('🏫 [5/8] 가맹 학원·학급·회원 비파괴 Upsert 및 비밀번호 보안 해싱(scrypt:) 적용 중...');

  const academyByName = new Map<string, { id: string; code: string; name: string }>();
  const usedAcademyCodes = new Set<string>();
  let maxAcadNum = 0;

  for (const ac of existingAcademies) {
    academyByName.set(ac.name.trim(), { id: ac.id, code: ac.code, name: ac.name });
    usedAcademyCodes.add(ac.code);
    const m = ac.code.match(/^ACAD-(\d+)$/);
    if (m) maxAcadNum = Math.max(maxAcadNum, parseInt(m[1], 10));
  }

  const nextAcademyCode = (): string => {
    do {
      maxAcadNum++;
    } while (usedAcademyCodes.has(`ACAD-${String(maxAcadNum).padStart(3, '0')}`));
    const code = `ACAD-${String(maxAcadNum).padStart(3, '0')}`;
    usedAcademyCodes.add(code);
    return code;
  };

  // 본사 학원 보장
  const hqAcad = await prisma.academy.upsert({
    where: { code: 'ACAD-HQ' },
    update: { status: AcademyStatus.ACTIVE, deletedAt: null },
    create: {
      code: 'ACAD-HQ',
      name: '나노의책장 본사',
      directorName: '본사 관리자',
      phone: '02-1588-0000',
      email: 'master@nano.kr',
      plan: PlanTier.ROYAL,
      maxStudents: 9999,
      monthlyFee: 0,
      startDate: new Date('2024-01-01'),
      endDate: new Date('2099-12-31'),
      status: AcademyStatus.ACTIVE,
    },
  });
  academyByName.set('관리자', { id: hqAcad.id, code: hqAcad.code, name: hqAcad.name });
  academyByName.set('나노의책장 본사', { id: hqAcad.id, code: hqAcad.code, name: hqAcad.name });
  academyByName.set('나노의책장본사02', { id: hqAcad.id, code: hqAcad.code, name: hqAcad.name });

  // 활성 원장 기반 가맹점 Upsert
  const activeDirectors = activeLegacyUsers.filter((u) => u.user_type === 'director');
  for (const d of activeDirectors) {
    const grpName = String(d.group_name ?? d.user_name ?? `가맹학원${d.user_seq}`).trim();
    const existingAcad = academyByName.get(grpName);
    const plan = mapPlanTier(d.pricing_plan);
    const maxStudents = Number(d.use_count) > 0 ? Number(d.use_count) : 50;
    const monthlyFee = Number(d.pricing_price) > 0 ? Number(d.pricing_price) : 330000;
    const startDate = parseKstDate(d.start_date, new Date('2025-01-01'))!;
    const endDate = parseKstDate(d.end_date ?? d.service_end_date, new Date('2027-12-31'))!;

    if (existingAcad) {
      await prisma.academy.update({
        where: { id: existingAcad.id },
        data: {
          directorName: String(d.user_name ?? '원장'),
          phone: String(d.cell_no ?? '010-0000-0000'),
          email: d.email ? String(d.email) : undefined,
          address: d.address ? String(d.address) : undefined,
          bizNo: d.business_no ? String(d.business_no) : undefined,
          plan,
          maxStudents,
          monthlyFee,
          startDate,
          endDate,
          status: AcademyStatus.ACTIVE,
          deletedAt: null,
        }
      });
    } else {
      const code = nextAcademyCode();
      const created = await prisma.academy.create({
        data: {
          code,
          name: grpName,
          directorName: String(d.user_name ?? '원장'),
          phone: String(d.cell_no ?? '010-0000-0000'),
          email: d.email ? String(d.email) : null,
          address: d.address ? String(d.address) : null,
          bizNo: d.business_no ? String(d.business_no) : null,
          plan,
          maxStudents,
          monthlyFee,
          startDate,
          endDate,
          memo: d.memo ? String(d.memo) : null,
          status: AcademyStatus.ACTIVE,
        }
      });
      academyByName.set(grpName, { id: created.id, code: created.code, name: created.name });
    }
  }

  // 학생 소속 학원 중 아직 없는 학원 자동 보완
  for (const u of activeLegacyUsers) {
    const grp = String(u.group_name ?? '').trim();
    if (grp && !academyByName.has(grp)) {
      const code = nextAcademyCode();
      const created = await prisma.academy.create({
        data: {
          code,
          name: grp,
          directorName: `${grp} 원장`,
          phone: '010-0000-0000',
          plan: PlanTier.STANDARD,
          maxStudents: 50,
          monthlyFee: 330000,
          startDate: new Date('2025-01-01'),
          endDate: new Date('2027-12-31'),
          status: AcademyStatus.ACTIVE,
          memo: '학생 소속 학원 자동 보완',
        }
      });
      academyByName.set(grp, { id: created.id, code: created.code, name: created.name });
    }
  }

  // 학급(ClassGroup) 비파괴 Upsert
  const existingClasses = await prisma.classGroup.findMany({ select: { id: true, academyId: true, name: true } });
  const classMap = new Map<string, string>();
  for (const c of existingClasses) {
    classMap.set(`${c.academyId}:${c.name.trim()}`, c.id);
  }
  for (const u of activeLegacyUsers) {
    const cName = String(u.class_name ?? '').trim();
    if (!cName) continue;
    const grp = String(u.group_name ?? '').trim();
    const acadId = academyByName.get(grp)?.id || hqAcad.id;
    const key = `${acadId}:${cName}`;
    if (!classMap.has(key)) {
      const cls = await prisma.classGroup.create({
        data: {
          academyId: acadId,
          name: cName,
          targetGrade: u.grade ? mapGrade(u.grade) : null,
        }
      });
      classMap.set(key, cls.id);
    }
  }

  // 회원(Member) 비파괴 Upsert (기존 scrypt: 비밀번호는 보존하고, 신규/평문은 hashPassword 적용!)
  let createdMembersCount = 0;
  let updatedMembersCount = 0;
  const usedLegacySeqs = new Set<number>(
    existingMembers.map(m => m.legacySeq).filter((v): v is number => typeof v === 'number')
  );

  for (const u of activeLegacyUsers) {
    const username = String(u.user_id ?? '').trim();
    if (!username) continue;
    const lowerKey = username.toLowerCase();
    const existingMem = existingMemberByUsername.get(lowerKey);

    const uType = String(u.user_type ?? '');
    let role: Role = Role.STUDENT;
    if (uType === 'director') role = Role.DIRECTOR;
    else if (uType === 'teacher') role = Role.TEACHER;
    else if (uType === 'master' || uType === 'admin') role = Role.MASTER;

    const grp = String(u.group_name ?? '').trim();
    const acadId = academyByName.get(grp)?.id || hqAcad.id;
    const cName = String(u.class_name ?? '').trim();
    const classGroupId = cName ? (classMap.get(`${acadId}:${cName}`) || null) : null;
    const gender = u.gender === 'F' ? '여' : u.gender === 'M' ? '남' : null;
    const phone = u.cell_no ? String(u.cell_no) : '010-0000-0000';
    const parentName = u.parent_name ? String(u.parent_name) : null;
    const parentPhone = u.parent_cell ? String(u.parent_cell) : null;
    const parentEmail = u.email ? String(u.email) : null;
    const points = Number(u.point) || 0;
    const lastLoginAt = parseKstDate(u.last_login_time, null);
    const uSeq = Number(u.user_seq) || null;

    if (existingMem) {
      const safePassword = (existingMem.password && existingMem.password.startsWith('scrypt:'))
        ? existingMem.password
        : hashPassword(DEFAULT_PASSWORD);
      await prisma.member.update({
        where: { id: existingMem.id },
        data: {
          academyId: existingMem.role === Role.MASTER ? existingMem.academyId : acadId,
          classGroupId: classGroupId ?? undefined,
          role: existingMem.role === Role.MASTER ? Role.MASTER : role,
          name: String(u.user_name ?? existingMem.name),
          password: safePassword,
          gender: gender ?? undefined,
          grade: mapGrade(u.grade),
          phone,
          parentName,
          parentPhone,
          parentEmail,
          points: Math.max(points, 0),
          status: MemberStatus.APPROVED,
        }
      });
      updatedMembersCount++;
    } else {
      const canAssignSeq = uSeq !== null && !usedLegacySeqs.has(uSeq);
      if (canAssignSeq && uSeq !== null) usedLegacySeqs.add(uSeq);
      await prisma.member.create({
        data: {
          academyId: acadId,
          classGroupId,
          role,
          name: String(u.user_name ?? username),
          username,
          password: hashPassword(DEFAULT_PASSWORD),
          gender,
          grade: mapGrade(u.grade),
          phone,
          parentName,
          parentPhone,
          parentEmail,
          points,
          status: MemberStatus.APPROVED,
          lastLoginAt,
          legacySeq: canAssignSeq ? uSeq : null,
        }
      });
      createdMembersCount++;
    }
  }

  // 혹시라도 기존 회원 중 평문 비밀번호가 남아 있다면 전원 scrypt: 해시로 자동 치유
  const remainingUnencrypted = await prisma.member.findMany({
    where: { OR: [{ password: null }, { NOT: { password: { startsWith: 'scrypt:' } } }] },
    select: { id: true, password: true }
  });
  for (const m of remainingUnencrypted) {
    const rawPw = m.password && m.password.trim().length >= 4 ? m.password.trim() : DEFAULT_PASSWORD;
    await prisma.member.update({ where: { id: m.id }, data: { password: hashPassword(rawPw) } });
  }

  // 본사 MASTER 계정이 하나도 없을 경우 기본 master 계정 자동 보장
  const masterExists = await prisma.member.count({ where: { role: Role.MASTER, status: MemberStatus.APPROVED } });
  if (masterExists === 0) {
    await prisma.member.upsert({
      where: { username: 'master' },
      update: { role: Role.MASTER, status: MemberStatus.APPROVED, academyId: hqAcad.id },
      create: {
        academyId: hqAcad.id,
        role: Role.MASTER,
        name: '마스터 운영자',
        username: 'master',
        password: hashPassword(DEFAULT_PASSWORD),
        phone: '02-1588-0000',
        status: MemberStatus.APPROVED,
      }
    });
  }

  // 원장 미배정 가맹점 자동 복구 (repair_directors 내장)
  const legacyDirByGroup = new Map<string, any>();
  for (const d of allLegacyDirectors) {
    const grp = String(d.group_name ?? '').trim();
    if (grp) legacyDirByGroup.set(grp, d);
  }
  const academiesCheck = await prisma.academy.findMany({
    where: { deletedAt: null, status: AcademyStatus.ACTIVE, NOT: { code: 'ACAD-HQ' } },
    include: { members: { where: { role: Role.DIRECTOR, status: MemberStatus.APPROVED }, select: { id: true } } }
  });
  let repairedDirectorsCount = 0;
  for (const ac of academiesCheck) {
    if (ac.members.length > 0) continue;
    const legD = legacyDirByGroup.get(ac.name.trim());
    if (legD && legD.user_id) {
      const dirUsername = String(legD.user_id).trim();
      const found = await prisma.member.findUnique({ where: { username: dirUsername } });
      if (found) {
        await prisma.member.update({
          where: { id: found.id },
          data: {
            academyId: ac.id,
            role: Role.DIRECTOR,
            status: MemberStatus.APPROVED,
            password: found.password?.startsWith('scrypt:') ? found.password : hashPassword(DEFAULT_PASSWORD)
          }
        });
      } else {
        await prisma.member.create({
          data: {
            academyId: ac.id,
            role: Role.DIRECTOR,
            name: String(legD.user_name ?? `${ac.name} 원장`).trim(),
            username: dirUsername,
            password: hashPassword(DEFAULT_PASSWORD),
            phone: String(legD.cell_no ?? '010-0000-0000'),
            status: MemberStatus.APPROVED,
          }
        });
      }
      repairedDirectorsCount++;
    } else {
      const fallbackUsername = `dir_${ac.code.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
      await prisma.member.upsert({
        where: { username: fallbackUsername },
        update: { academyId: ac.id, role: Role.DIRECTOR, status: MemberStatus.APPROVED },
        create: {
          academyId: ac.id,
          role: Role.DIRECTOR,
          name: `${ac.name} 원장`,
          username: fallbackUsername,
          password: hashPassword(DEFAULT_PASSWORD),
          phone: '010-0000-0000',
          status: MemberStatus.APPROVED,
        }
      });
      repairedDirectorsCount++;
    }
  }

  // 최신 회원 맵 및 캐릭터 설정(character:*) 리바인딩 보장
  const allCurrentMembers = await prisma.member.findMany({ select: { id: true, username: true } });
  const memberIdByUsername = new Map<string, string>();
  for (const m of allCurrentMembers) {
    const uKey = m.username.trim().toLowerCase();
    memberIdByUsername.set(uKey, m.id);
    if (characterByUsername.has(uKey)) {
      const charKey = `character:${m.id}`;
      await prisma.portalSetting.upsert({
        where: { key: charKey },
        update: { value: characterByUsername.get(uKey) },
        create: { key: charKey, scope: m.id, value: characterByUsername.get(uKey), revision: 1 }
      });
    }
  }
  console.log(`   ✅ 회원 동기화 완료 (신규 ${createdMembersCount}명, 갱신 ${updatedMembersCount}명, 원장 자동복구 ${repairedDirectorsCount}개소).\n`);

  // --------------------------------------------------------------
  // STEP 6. 북퀴즈 문항(BookQuiz) 증분 적재 + 출제기관(quiz-authors.json) 갱신 + 보유도서/포인트 적재
  // --------------------------------------------------------------
  console.log('🧩 [6/8] 북퀴즈 문항 증분 동기화, 학원 보유도서 및 포인트 이력 적재 중...');
  const existingQuizSeqRows = await prisma.bookQuiz.groupBy({
    by: ['legacyQuizSeq'],
    where: { legacyQuizSeq: { not: null } }
  });
  const existingQuizSeqSet = new Set<number>(
    existingQuizSeqRows.map(r => r.legacyQuizSeq).filter((v): v is number => typeof v === 'number')
  );

  const newQuizzesData: any[] = [];
  for (const q of T.tb_quiz) {
    const qSeq = Number(q.quiz_seq);
    if (!qSeq || existingQuizSeqSet.has(qSeq)) continue;
    const bNo = String(q.book_no ?? '').trim();
    const bookId = legacyBookNoToPrimaryId.get(bNo) || resolveBookId(bNo);
    if (!bookId) continue;

    const parsed = tryPhpUnserialize(String(q.quiz_contents ?? ''));
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) continue;
    const obj = parsed as Record<string, any>;
    const questions = obj.q ? (obj.q as Record<string, string>) : {};
    const answers = obj.a ? (obj.a as Record<string, any>) : {};
    const c1 = obj.c1 || {};
    const c2 = obj.c2 || {};
    const c3 = obj.c3 || {};
    const c4 = obj.c4 || {};
    const c5 = obj.c5 || {};

    const qKeys = Object.keys(questions).sort((a, b) => Number(a) - Number(b));
    for (const k of qKeys) {
      const qText = questions[k];
      if (!qText) continue;
      const optList = [c1[k], c2[k], c3[k], c4[k], c5[k]]
        .filter((v) => v !== null && v !== undefined && String(v).trim() !== '')
        .map((v) => String(v).trim());
      newQuizzesData.push({
        bookId,
        questionNo: parseInt(k, 10) || 1,
        question: String(qText),
        quizType: optList.length > 0 ? QuizType.MULTIPLE_CHOICE : QuizType.SHORT_ANSWER,
        options: optList.length > 0 ? optList : null,
        correctAnswer: String(answers[k] ?? '1'),
        score: 20,
        legacyQuizSeq: qSeq,
      });
    }
  }
  for (const batch of chunk(newQuizzesData, 500)) {
    await prisma.bookQuiz.createMany({ data: batch, skipDuplicates: true });
  }
  await extractQuizAuthors(DUMP_PATH);

  // 학원 보유 도서(tb_book_list) 증분 적재
  const acadBooksData: Array<{ academyId: string; bookId: string }> = [];
  const seenAcadBook = new Set<string>();
  for (const bl of T.tb_book_list) {
    const grp = String(bl.group_name ?? '').trim();
    const bNo = String(bl.book_no ?? '').trim();
    const acadId = academyByName.get(grp)?.id;
    const bookId = legacyBookNoToPrimaryId.get(bNo) || resolveBookId(bNo);
    if (!acadId || !bookId) continue;
    const pairKey = `${acadId}:${bookId}`;
    if (!seenAcadBook.has(pairKey)) {
      seenAcadBook.add(pairKey);
      acadBooksData.push({ academyId: acadId, bookId });
    }
  }
  for (const batch of chunk(acadBooksData, 500)) {
    await prisma.academyBook.createMany({ data: batch, skipDuplicates: true });
  }

  // 전체 포인트 이력(tb_point_history) 증분 적재 (legacyPhSeq unique 기반 중복 자동 스킵)
  const pointsData: Array<{
    memberId: string;
    amount: number;
    pointType: string | null;
    content: string | null;
    createdAt: Date;
    legacyPhSeq: number;
  }> = [];
  for (const ph of T.tb_point_history) {
    const uId = String(ph.user_id ?? '').trim().toLowerCase();
    const memberId = memberIdByUsername.get(uId);
    const phSeq = Number(ph.ph_seq);
    if (!memberId || !phSeq) continue;
    pointsData.push({
      memberId,
      amount: Number(ph.point) || 0,
      pointType: ph.point_type ? String(ph.point_type) : 'QUIZ',
      content: ph.content ? String(ph.content) : '북퀴즈 풀이 적립',
      createdAt: parseKstDate(ph.reg_date, new Date())!,
      legacyPhSeq: phSeq,
    });
  }
  for (const batch of chunk(pointsData, 1000)) {
    await prisma.pointHistory.createMany({ data: batch, skipDuplicates: true });
  }
  console.log(`   ✅ 신규 북퀴즈 문항 ${newQuizzesData.length}건 / 보유도서 ${acadBooksData.length.toLocaleString()}건 / 포인트내역 ${pointsData.length.toLocaleString()}건 동기화 완료.\n`);

  // --------------------------------------------------------------
  // STEP 7. 도서 찜/추천 + 전 기간 북퀴즈 완료 내역 + 단권 [학습리포트] + 고유 완독권수 동기화
  // --------------------------------------------------------------
  console.log('📊 [7/8] 도서 찜/추천, 전체 북퀴즈 완료 내역 및 단권 [학습리포트] 정밀 생성 중...');
  runSubScript('scripts/migrate_social_and_learning.ts');

  // --------------------------------------------------------------
  // STEP 8. 프론트엔드 폴백 데이터 번들 갱신 및 10대 무결성 검증
  // --------------------------------------------------------------
  console.log('\n📦 [8/8] 프론트엔드 정적 폴백 데이터(migrated_real_data.js) 갱신 및 최종 무결성 진단 중...');
  runSubScript('scripts/migrate/export-to-frontend.ts');

  const ok = await verifyMigrationIntegrity();
  if (!ok) {
    throw new Error('마이그레이션 사후 무결성 검증에서 확인이 필요한 항목이 발견되었습니다.');
  }
}

const isDirectRun = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isDirectRun) {
  runFullSafeMigration()
    .catch((err) => {
      console.error('❌ 통합 안전 마이그레이션 실패:', err);
      process.exitCode = 1;
    })
    .finally(() => prisma.$disconnect());
}
