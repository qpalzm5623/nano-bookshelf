import { prisma } from '../lib/prisma';

// 카카오 도서 검색 API 설정
const KAKAO_API_KEY = "11d75cc8189f15ddf547b5538827d04d";

function normalizeTitle(t: string): string {
  return (t || '')
    .replace(/\s+/g, '')
    .replace(/[\[\(].*?[\]\)]/g, '')
    .replace(/[^\w\s가-힣]/g, '')
    .toLowerCase();
}

function isSameBookTitle(t1: string, t2: string): boolean {
  const n1 = normalizeTitle(t1);
  const n2 = normalizeTitle(t2);
  if (!n1 || !n2) return false;
  if (n1 === n2) return true;
  if (n1.startsWith(n2) || n2.startsWith(n1)) {
    const shorter = n1.length < n2.length ? n1 : n2;
    if (shorter.length >= 3) return true;
  }
  if (Math.abs(n1.length - n2.length) <= 1 && n1.length >= 4) {
    let diff = 0;
    const len = Math.min(n1.length, n2.length);
    for (let i = 0; i < len; i++) {
      if (n1[i] !== n2[i]) diff++;
    }
    if (diff <= 1) return true;
  }
  return false;
}

function detectBookGrade(doc: any): string {
  const text = `${(doc && doc.title) || ""} ${(doc && doc.contents) || ""}`;
  if (/유아|그림책|보드북|미취학|유치부|[3-7]세|누리과정/.test(text)) return "유치부";
  if (/초등\s*1|초1|초등\s*저학년|저학년용/.test(text)) return "초등 1학년";
  if (/초등\s*2|초2/.test(text)) return "초등 2학년";
  if (/초등\s*3|초3|초등\s*중학년|중학년용/.test(text)) return "초등 3학년";
  if (/초등\s*4|초4/.test(text)) return "초등 4학년";
  if (/초등\s*5|초5|초등\s*고학년|고학년용/.test(text)) return "초등 5학년";
  if (/초등\s*6|초6/.test(text)) return "초등 6학년";
  if (/중등\s*1|중1|중학생|청소년\s*초기/.test(text)) return "중등 1학년";
  if (/중등\s*2|중2|청소년\s*문학|청소년용/.test(text)) return "중등 2학년";
  if (/중등\s*3|중3/.test(text)) return "중등 3학년";
  return "초등 5학년";
}

function detectBookSeries(title: string, rawSeries?: string | null): { isSeries: boolean; seriesName: string } {
  if (rawSeries && rawSeries.trim() && rawSeries !== "단권") {
    return { isSeries: true, seriesName: rawSeries.trim() };
  }
  if (!title) return { isSeries: false, seriesName: "단권" };
  const clean = title.trim();
  const bracketMatch = clean.match(/^(.*?)\s*[\(\[](.*?(?:권|탄|부|시리즈|편|vol|season|\d+).*?)[\)\]]/i);
  if (bracketMatch) {
    const sName = bracketMatch[1].trim();
    if (sName.length >= 2 && !/^\d+$/.test(sName)) {
      return { isSeries: true, seriesName: sName };
    }
  }
  const endNumMatch = clean.match(/^(.*?)\s+(\d{1,3})\s*(?:권|탄|부|편|화)?$/);
  if (endNumMatch) {
    const sName = endNumMatch[1].trim();
    if (sName.length >= 2 && !/^(19|20)\d\d$/.test(sName)) {
      return { isSeries: true, seriesName: sName };
    }
  }
  if (clean.includes("시리즈") || clean.includes("세트") || clean.includes("전집") || clean.includes("문고")) {
    const sName = clean.replace(/\s*(?:전집|세트|시리즈|문고).*$/, " 시리즈").trim();
    return { isSeries: true, seriesName: sName };
  }
  return { isSeries: false, seriesName: "단권" };
}

async function fetchKakaoBook(isbn: string): Promise<any | null> {
  try {
    const url = `https://dapi.kakao.com/v3/search/book?target=isbn&query=${encodeURIComponent(isbn)}`;
    const res = await fetch(url, {
      headers: { Authorization: `KakaoAK ${KAKAO_API_KEY}` },
      signal: AbortSignal.timeout(3000)
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data && Array.isArray(data.documents) && data.documents.length > 0) {
      return data.documents[0];
    }
  } catch (err) {
    // console.warn(`Kakao fetch timeout/error for ISBN ${isbn}`);
  }
  return null;
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function main() {
  console.log('🚀 [도서 중복 통합 및 정리 작업 시작]');

  const books = await prisma.book.findMany({
    where: {
      isbn: { not: null },
      NOT: [{ isbn: '' }]
    },
    include: {
      _count: { select: { quizzes: true } }
    },
    orderBy: { createdAt: 'asc' }
  });

  const isbnMap = new Map<string, typeof books>();
  for (const b of books) {
    const rawIsbn = (b.isbn || '').replace(/[^0-9X]/gi, '');
    if (rawIsbn.length < 10) continue;
    if (!isbnMap.has(rawIsbn)) isbnMap.set(rawIsbn, []);
    isbnMap.get(rawIsbn)!.push(b);
  }

  // 동일 도서 클러스터링
  const duplicateClusters: Array<{ isbn: string; primary: (typeof books)[0]; duplicates: typeof books }> = [];

  for (const [isbn, list] of isbnMap) {
    if (list.length <= 1) continue;

    const visited = new Set<string>();
    for (let i = 0; i < list.length; i++) {
      const b1 = list[i];
      if (visited.has(b1.id)) continue;

      const cluster = [b1];
      for (let j = i + 1; j < list.length; j++) {
        const b2 = list[j];
        if (visited.has(b2.id)) continue;

        if (isSameBookTitle(b1.title, b2.title)) {
          cluster.push(b2);
          visited.add(b2.id);
        }
      }

      if (cluster.length > 1) {
        visited.add(b1.id);
        const primary = cluster[0];
        const duplicates = cluster.slice(1);
        duplicateClusters.push({ isbn, primary, duplicates });
      }
    }
  }

  console.log(`✅ 통합 대상 클러스터: ${duplicateClusters.length}개 그룹`);
  const totalToRemove = duplicateClusters.reduce((sum, c) => sum + c.duplicates.length, 0);
  console.log(`✅ 삭제 및 마이그레이션 대상 중복 도서: 총 ${totalToRemove}권\n`);

  let processedCount = 0;
  let totalQuizzesTransferred = 0;
  let totalDeleted = 0;

  for (const cluster of duplicateClusters) {
    const { isbn, primary, duplicates } = cluster;
    processedCount++;

    // 1. 카카오 도서 검색 API 조회
    const kakaoDoc = await fetchKakaoBook(isbn);

    let newTitle = primary.title;
    let newAuthor = primary.author;
    let newPublisher = primary.publisher;
    let newGrade = primary.grade;
    let newSeries = primary.series || '단권';
    let newCover = primary.coverUrl;
    let newDesc = primary.description;

    if (kakaoDoc) {
      if (kakaoDoc.title) newTitle = kakaoDoc.title.trim();
      if (Array.isArray(kakaoDoc.authors) && kakaoDoc.authors.length > 0) {
        newAuthor = kakaoDoc.authors.join(', ');
      }
      if (kakaoDoc.publisher) newPublisher = kakaoDoc.publisher.trim();
      newGrade = detectBookGrade(kakaoDoc);
      newSeries = detectBookSeries(newTitle, primary.series).seriesName;
      if (kakaoDoc.thumbnail) {
        newCover = kakaoDoc.thumbnail.replace('R120x174', 'R300x0');
      }
      if (kakaoDoc.contents) newDesc = kakaoDoc.contents.trim();
    } else {
      newSeries = detectBookSeries(primary.title, primary.series).seriesName;
    }

    // 2. 가장 먼저 등록된 도서의 메타데이터 보존 (규칙 3)
    const newSubject = primary.subject || duplicates.find(d => d.subject)?.subject || '이야기';
    const newThemeId = primary.themeId || duplicates.find(d => d.themeId)?.themeId || null;
    const newTags = primary.tags || duplicates.find(d => d.tags)?.tags || '';
    const newThinkTitle = primary.thinkTitle || duplicates.find(d => d.thinkTitle)?.thinkTitle || '';
    const newThinkQuiz = primary.thinkQuiz || duplicates.find(d => d.thinkQuiz)?.thinkQuiz || '';

    // Primary Book 정보 업데이트
    await prisma.book.update({
      where: { id: primary.id },
      data: {
        title: newTitle,
        author: newAuthor,
        publisher: newPublisher,
        grade: newGrade,
        series: newSeries,
        coverUrl: newCover,
        description: newDesc,
        subject: newSubject,
        themeId: newThemeId,
        tags: newTags,
        thinkTitle: newThinkTitle,
        thinkQuiz: newThinkQuiz
      }
    });

    // 3. 중복 도서 데이터 이관 및 삭제 (규칙 1, 4)
    for (const dup of duplicates) {
      // (a) 북퀴즈 문항 이전
      const qRes = await prisma.bookQuiz.updateMany({
        where: { bookId: dup.id },
        data: { bookId: primary.id }
      });
      totalQuizzesTransferred += qRes.count;

      // (b) 학생 북퀴즈 응시 기록 이전
      await prisma.quizAttempt.updateMany({
        where: { OR: [{ bookId: dup.id }, { bookId: dup.bookNo }] },
        data: { bookId: primary.id }
      });

      // (c) 독서 리포트 이전 (동일 학생 충돌 방지)
      const reports = await prisma.readingReport.findMany({ where: { bookId: dup.id } });
      for (const rep of reports) {
        const existing = await prisma.readingReport.findFirst({
          where: { memberId: rep.memberId, bookId: primary.id }
        });
        if (existing) {
          await prisma.readingReport.delete({ where: { id: rep.id } });
        } else {
          await prisma.readingReport.update({ where: { id: rep.id }, data: { bookId: primary.id } });
        }
      }

      // (d) 가맹점 보유 도서 매핑 이전 (academyId, bookId unique 충돌 방지)
      const acadBooks = await prisma.academyBook.findMany({ where: { bookId: dup.id } });
      for (const ab of acadBooks) {
        const existing = await prisma.academyBook.findUnique({
          where: { academyId_bookId: { academyId: ab.academyId, bookId: primary.id } }
        });
        if (existing) {
          await prisma.academyBook.delete({ where: { id: ab.id } });
        } else {
          await prisma.academyBook.update({ where: { id: ab.id }, data: { bookId: primary.id } });
        }
      }

      // (e) 배정 도서 이전
      await prisma.bookAssignment.updateMany({
        where: { bookId: dup.id },
        data: { bookId: primary.id }
      });

      // (f) 중복 도서 삭제 (규칙 1)
      await prisma.book.delete({ where: { id: dup.id } });
      totalDeleted++;
    }

    if (processedCount % 10 === 0 || processedCount === duplicateClusters.length) {
      console.log(`[${processedCount}/${duplicateClusters.length}] 처리 중... (이전 퀴즈: ${totalQuizzesTransferred}개, 삭제 도서: ${totalDeleted}권) - 최근: ${primary.title}`);
    }
  }

  console.log(`\n🎉 [도서 중복 통합 및 삭제 완료]`);
  console.log(`- 처리한 중복 그룹: ${duplicateClusters.length}개`);
  console.log(`- 대표 도서로 이전된 퀴즈 문항: ${totalQuizzesTransferred}개`);
  console.log(`- 정리/삭제된 중복 도서: ${totalDeleted}권`);

  const finalCount = await prisma.book.count();
  console.log(`- 최종 데이터베이스 도서 수: ${finalCount}권`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
