import fs from 'fs';
import readline from 'readline';
import path from 'path';

async function main() {
  const dumpPath = path.join(process.cwd(), 'backups', 'nanobook_backup.sql');
  const fileStream = fs.createReadStream(dumpPath);
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  let inUserTable = false;
  let count = 0;

  for await (const line of rl) {
    if (line.includes("INSERT INTO `tb_user`")) {
      console.log('--- FOUND INSERT INTO tb_user ---');
      console.log(line.slice(0, 1000));
      break;
    }
  }
}

main();
