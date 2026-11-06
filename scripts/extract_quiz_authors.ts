import * as fs from 'fs';
import * as readline from 'readline';
import { prisma } from '../lib/prisma';

async function main() {
  console.log('Building quiz authors map from backup SQL...');

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
    input: fs.createReadStream('backups/nanobook_backup_20261026_140403.sql'),
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
      if (line.includes("UNLOCK TABLES") || line.includes("INSERT INTO `") || line.includes("CREATE TABLE `")) {
        inTbQuiz = false;
        break;
      }

      const seqMatch = line.match(/^\s*\(([0-9]+),/);
      if (!seqMatch) continue;
      const quizSeq = parseInt(seqMatch[1], 10);

      // Matches: ..., NULL, 'katelee00', '2024-08-21 14:26:31'
      const userMatch = line.match(/(?:,\s*|',\s*)'([a-zA-Z0-9_-]+)',\s*'(?:202[0-9]-[0-9]{2}-[0-9]{2})/);
      const userId = userMatch ? userMatch[1].toLowerCase() : 'admin';

      if (userId === 'admin' || userId === 'master') {
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
  console.log(`Extracted ${count} tb_quiz author mappings.`);
  fs.writeFileSync('lib/quiz-authors.json', JSON.stringify(quizAuthorMap, null, 2));
  console.log('Saved to lib/quiz-authors.json');
}

main().catch(console.error).finally(() => prisma.$disconnect());
