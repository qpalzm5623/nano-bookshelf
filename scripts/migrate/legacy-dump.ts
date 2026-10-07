// ==============================================================
// 레거시 mysqldump 파서 (scripts/migrate/legacy-dump.ts)
// ==============================================================
// 왜 직접 파싱하나?
//  - 로컬에 MySQL이 없고, 이관은 "한 번 읽어서 변환"만 하면 되므로
//    DB 설치 없이 덤프(.sql)를 스트리밍으로 읽어 행(row) 객체로 바꾼다.
//  - mysqldump의 확장 INSERT( VALUES (..),(..),(..); )는 한 줄이 수 MB가 될 수 있어
//    정규식 대신 문자 단위 상태 머신으로 파싱한다.
// ==============================================================

import fs from 'fs';
import path from 'path';
import readline from 'readline';

export type LegacyValue = string | number | null;
export type LegacyRow = Record<string, LegacyValue>;

// 덤프 파일 위치 (환경변수로 덮어쓸 수 있음)
export const DUMP_PATH =
  process.env.LEGACY_DUMP_PATH ?? path.join(process.cwd(), 'backups', 'nanobook_backup.sql');

// MySQL 문자열 이스케이프 → 실제 문자
const ESCAPES: Record<string, string> = {
  '0': '\0',
  n: '\n',
  r: '\r',
  t: '\t',
  b: '\b',
  Z: '\x1a',
  '\\': '\\',
  "'": "'",
  '"': '"',
};

/** `INSERT ... VALUES` 뒤의 튜플 목록을 한 행씩 콜백으로 넘긴다 */
function parseTuples(line: string, startIdx: number, onRow: (values: LegacyValue[]) => void): void {
  const n = line.length;
  let i = startIdx;

  while (i < n) {
    // 튜플 사이의 ',' 와 마지막 ';' 는 건너뛴다
    if (line.charCodeAt(i) !== 40 /* ( */) {
      i++;
      continue;
    }
    i++;

    const row: LegacyValue[] = [];
    for (;;) {
      if (line.charCodeAt(i) === 39 /* ' */) {
        // ---- 문자열 값 ----
        i++;
        let out = '';
        let chunkStart = i;
        for (;;) {
          const c = line.charCodeAt(i);
          if (c === 92 /* \ */) {
            out += line.slice(chunkStart, i);
            const next = line[i + 1];
            // \% 와 \_ 는 MySQL에서 백슬래시를 유지한다
            out += next === '%' || next === '_' ? '\\' + next : (ESCAPES[next] ?? next);
            i += 2;
            chunkStart = i;
          } else if (c === 39) {
            if (line.charCodeAt(i + 1) === 39) {
              // '' → 작은따옴표 하나
              out += line.slice(chunkStart, i + 1);
              i += 2;
              chunkStart = i;
            } else {
              out += line.slice(chunkStart, i);
              i++;
              break;
            }
          } else if (Number.isNaN(c)) {
            throw new Error('문자열이 닫히지 않은 INSERT 라인입니다.');
          } else {
            i++;
          }
        }
        row.push(out);
      } else {
        // ---- NULL / 숫자 값 ----
        let j = i;
        while (j < n && line.charCodeAt(j) !== 44 /* , */ && line.charCodeAt(j) !== 41 /* ) */) j++;
        const token = line.slice(i, j);
        if (token === 'NULL') row.push(null);
        else if (token.startsWith('0x')) row.push(token); // 16진 BLOB은 문자열로 보관
        else row.push(Number(token));
        i = j;
      }

      const sep = line.charCodeAt(i);
      if (sep === 44) {
        i++;
        continue;
      }
      if (sep === 41) {
        i++;
        break;
      }
      throw new Error(`예상치 못한 문자(코드 ${sep}) 위치 ${i}`);
    }
    onRow(row);
  }
}

/**
 * 덤프를 한 번만 읽어서 필요한 테이블을 한꺼번에 메모리에 올린다.
 * (257MB 파일을 테이블마다 다시 읽으면 오래 걸리기 때문)
 * filters: 테이블별 행 필터 — 큰 테이블은 읽는 순간 걸러서 메모리를 아낀다.
 */
export async function loadTables(
  tables: string[],
  filters: Record<string, (row: LegacyRow) => boolean> = {},
): Promise<Record<string, LegacyRow[]>> {
  if (!fs.existsSync(DUMP_PATH)) {
    throw new Error(`덤프 파일이 없습니다: ${DUMP_PATH}`);
  }

  const wanted = new Set(tables);
  const result: Record<string, LegacyRow[]> = {};
  for (const t of tables) result[t] = [];

  const columns: Record<string, string[]> = {};
  let creating: string | null = null;

  const rl = readline.createInterface({
    input: fs.createReadStream(DUMP_PATH, { encoding: 'utf8' }),
    crlfDelay: Infinity,
  });

  for await (const line of rl) {
    // 1) CREATE TABLE 블록에서 컬럼 이름 순서를 기억한다
    if (line.startsWith('CREATE TABLE `')) {
      creating = line.slice(14, line.indexOf('`', 14));
      columns[creating] = [];
      continue;
    }
    if (creating) {
      if (line.startsWith('  `')) {
        columns[creating].push(line.slice(3, line.indexOf('`', 3)));
      } else if (line.startsWith(')')) {
        creating = null;
      }
      continue;
    }

    // 2) 필요한 테이블의 INSERT 라인만 파싱한다
    if (!line.startsWith('INSERT INTO `')) continue;
    const nameEnd = line.indexOf('`', 13);
    const table = line.slice(13, nameEnd);
    if (!wanted.has(table)) continue;

    const cols = columns[table];
    const valuesIdx = line.indexOf(' VALUES ', nameEnd) + 8;
    const filter = filters[table];

    parseTuples(line, valuesIdx, (values) => {
      const row: LegacyRow = {};
      for (let k = 0; k < cols.length; k++) row[cols[k]] = values[k] ?? null;
      if (!filter || filter(row)) result[table].push(row);
    });
  }

  return result;
}
