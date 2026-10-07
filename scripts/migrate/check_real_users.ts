import fs from 'fs';
import readline from 'readline';
import path from 'path';

async function main() {
  const dumpPath = path.join(process.cwd(), 'backups', 'nanobook_backup.sql');
  const fileStream = fs.createReadStream(dumpPath);
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  const uniqueGroups = new Set<string>();
  const directorNames: string[] = [];
  const teacherNames: string[] = [];
  const studentNames: string[] = [];

  for await (const line of rl) {
    if (line.startsWith("INSERT INTO `tb_user`")) {
      // 튜플 단위 파싱
      const regex = /\((\d+),'([^']+)',/g;
      // 간단히 정규식이나 split으로 추출
      const rows = line.split("),(");
      for (const r of rows) {
        // user_id, user_type, group_name, user_name 등 추출
        const parts = r.split("','");
        // parts 구조 대략 확인
      }
    }
  }
}
