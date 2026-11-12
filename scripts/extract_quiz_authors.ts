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

  const academies = await prisma.academy.findMany({
    select: { code: true, name: true }
  });
  const acadByName = new Map<string, { code: string; name: string }>();
  for (const a of academies) {
    if (a.name) {
      acadByName.set(a.name.trim(), a);
      acadByName.set(a.name.replace(/\s+/g, ''), a);
    }
  }

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

  let inTbUser = false;
  let inTbQuiz = false;
  const legacyUserGroupMap = new Map<string, string>();
  const quizSeqUserMap = new Map<number, string>();

  for await (const line of rl) {
    if (line.includes("INSERT INTO `tb_user` VALUES") || line.includes("INSERT INTO `tb_user` ")) {
      inTbUser = true;
      continue;
    }
    if (inTbUser) {
      if (line.startsWith('UNLOCK TABLES') || (line.startsWith('INSERT INTO') && !line.includes('`tb_user`'))) {
        inTbUser = false;
      } else {
        const m = line.match(/^\s*\(\s*\d+\s*,\s*'([^']+)'\s*,\s*'[^']*'\s*,\s*'[^']*'\s*,\s*[^,]+\s*,\s*[^,]+\s*,\s*[^,]+\s*,\s*'([^']+)'/);
        if (m) {
          legacyUserGroupMap.set(m[1].toLowerCase(), m[2].trim());
        }
      }
    }

    if (line.includes("INSERT INTO `tb_quiz` VALUES") || line.includes("INSERT INTO `tb_quiz` ")) {
      inTbQuiz = true;
      continue;
    }
    if (inTbQuiz) {
      if (line.includes('UNLOCK TABLES') || line.includes('INSERT INTO `') || line.includes('CREATE TABLE `')) {
        inTbQuiz = false;
        continue;
      }

      const seqMatch = line.match(/^\s*\(([0-9]+),/);
      if (!seqMatch) continue;
      const quizSeq = parseInt(seqMatch[1], 10);

      const userMatch = line.match(/(?:,\s*|',\s*)'([a-zA-Z0-9_-]+)',\s*'(?:202[0-9]-[0-9]{2}-[0-9]{2})/);
      const userId = userMatch ? userMatch[1].toLowerCase() : 'admin';
      quizSeqUserMap.set(quizSeq, userId);
    }
  }

  // 스트리밍 완료 후 전체 사용자/학원 매핑으로 출제기관 맵 구성
  const quizAuthorMap: Record<number, { authorType: 'HQ' | 'ACADEMY'; authorName: string; academyName: string; academyCode?: string }> = {};

  for (const [quizSeq, userId] of quizSeqUserMap.entries()) {
    if (userId === 'admin' || userId === 'master' || memberMap.get(userId)?.role === 'MASTER') {
      quizAuthorMap[quizSeq] = {
        authorType: 'HQ',
        authorName: '본사',
        academyName: '본사 직속 (공용)',
        academyCode: 'HQ'
      };
    } else {
      const mem = memberMap.get(userId);
      let acadName = (mem && mem.academyName && mem.academyName !== '가맹 학원') ? mem.academyName : '';
      let acadCode = (mem && mem.academyCode && mem.academyCode !== 'ACADEMY') ? mem.academyCode : '';

      // memberMap에서 학원을 찾지 못한 경우 레거시 tb_user의 group_name과 Academy 매핑 확인
      if (!acadName) {
        const groupName = legacyUserGroupMap.get(userId);
        if (groupName) {
          const matchedAcad = acadByName.get(groupName) || acadByName.get(groupName.replace(/\s+/g, ''));
          acadName = matchedAcad ? matchedAcad.name : groupName;
          acadCode = matchedAcad ? matchedAcad.code : 'ACADEMY';
        }
      }

      acadName = acadName || '가맹 학원';
      acadCode = acadCode || 'ACADEMY';

      quizAuthorMap[quizSeq] = {
        authorType: 'ACADEMY',
        authorName: acadName,
        academyName: acadName,
        academyCode: acadCode
      };
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
