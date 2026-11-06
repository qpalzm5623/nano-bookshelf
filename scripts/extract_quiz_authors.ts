import * as fs from 'fs';
import * as readline from 'readline';
import { pathToFileURL } from 'url';
import { prisma } from '../lib/prisma';
import { DUMP_PATH } from './migrate/legacy-dump';

export async function extractQuizAuthors(dumpFilePath: string = DUMP_PATH): Promise<number> {
  if (!fs.existsSync(dumpFilePath)) {
    console.warn(`⚠️ 덤프 파일을 찾을 수 없어 quiz-authors 추출을 건너뜁니다: ${dumpFilePath}`);
    return 0;
  }

  console.log(`🔍 백업 SQL에서 북퀴즈 출제기관 매핑 추출 중... (${dumpFilePath})`);

  const members = await prisma.member.findMany({
    select: {
      username: true,
      name: true,
      role: true,
      academy: { select: { code: true, name: true } }
    }
  });

  const memberMap = new Map<string, { name: string; role: string; academyCode: string; academyName: string }>();
  for (const m of members) {
    if (m.username) {
      memberMap.set(m.username.toLowerCase(), {
        name: m.name,
        role: m.role,
        academyCode: m.academy?.code || 'HQ',
        academyName: m.academy?.name || '본사 직속 (공용)'
      });
    }
  }

  const rl = readline.createInterface({
    input: fs.createReadStream(dumpFilePath),
    crlfDelay: Infinity
  });

  let inTbQuiz = false;
  const quizAuthorMap: Record<number, { authorType: 'HQ' | 'ACADEMY'; authorName: string; academyName: string; academyCode?: string }> = {};

  for await (const line of rl) {
    if (line.includes("INSERT INTO `tb_quiz` VALUES") || line.includes("INSERT INTO `tb_quiz` ")) {
      inTbQuiz = true;
      continue;
    }
    if (inTbQuiz) {
      if (line.includes('UNLOCK TABLES') || line.includes('INSERT INTO `') || line.includes('CREATE TABLE `')) {
        inTbQuiz = false;
        break;
      }

      const seqMatch = line.match(/^\s*\(([0-9]+),/);
      if (!seqMatch) continue;
      const quizSeq = parseInt(seqMatch[1], 10);

      const userMatch = line.match(/(?:,\s*|',\s*)'([a-zA-Z0-9_-]+)',\s*'(?:202[0-9]-[0-9]{2}-[0-9]{2})/);
      const userId = userMatch ? userMatch[1].toLowerCase() : 'admin';

      if (userId === 'admin' || userId === 'master' || memberMap.get(userId)?.role === 'MASTER') {
        quizAuthorMap[quizSeq] = {
          authorType: 'HQ',
          authorName: '본사',
          academyName: '본사 직속 (공용)',
          academyCode: 'HQ'
        };
      } else {
        const mem = memberMap.get(userId);
        const acadName = mem?.academyName || '가맹 학원';
        const acadCode = mem?.academyCode || 'ACADEMY';
        quizAuthorMap[quizSeq] = {
          authorType: 'ACADEMY',
          authorName: acadName,
          academyName: acadName,
          academyCode: acadCode
        };
      }
    }
  }

  const count = Object.keys(quizAuthorMap).length;
  fs.writeFileSync('lib/quiz-authors.json', JSON.stringify(quizAuthorMap, null, 2));
  console.log(`   ✅ 북퀴즈 출제기관 매핑 ${count.toLocaleString()}건 저장 완료 (lib/quiz-authors.json)`);
  return count;
}

const isDirectRun = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isDirectRun) {
  extractQuizAuthors()
    .catch((e) => {
      console.error('❌ 출제기관 매핑 추출 오류:', e);
      process.exitCode = 1;
    })
    .finally(() => prisma.$disconnect());
}
