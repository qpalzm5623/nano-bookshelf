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

// 덤프 파일 위치 (환경변수 또는 backups 디렉토리 내 최신 .sql 파일 자동 감지)
function resolveDumpPath(): string {
  if (process.env.LEGACY_DUMP_PATH && fs.existsSync(process.env.LEGACY_DUMP_PATH)) {
    return process.env.LEGACY_DUMP_PATH;
  }
  const defaultPath = path.join(process.cwd(), 'backups', 'nanobook_backup.sql');
  if (fs.existsSync(defaultPath)) return defaultPath;

  const backupDir = path.join(process.cwd(), 'backups');
  if (fs.existsSync(backupDir)) {
    const files = fs.readdirSync(backupDir)
      .filter((f) => f.endsWith('.sql'))
      .map((f) => path.join(backupDir, f))
      .sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs);
    if (files.length > 0) return files[0];
  }
  return defaultPath;
}

export const DUMP_PATH = resolveDumpPath();

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
      while (i < n && (line.charCodeAt(i) === 32 || line.charCodeAt(i) === 9 || line.charCodeAt(i) === 10 || line.charCodeAt(i) === 13)) i++;

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
        while (i < n && (line.charCodeAt(i) === 32 || line.charCodeAt(i) === 9)) i++;
        let j = i;
        while (j < n && line.charCodeAt(j) !== 44 /* , */ && line.charCodeAt(j) !== 41 /* ) */) j++;
        const token = line.slice(i, j).trim();
        if (token === 'NULL' || token === '') row.push(null);
        else if (token.startsWith('0x')) row.push(token); // 16진 BLOB은 문자열로 보관
        else row.push(Number(token));
        i = j;
      }

      while (i < n && (line.charCodeAt(i) === 32 || line.charCodeAt(i) === 9)) i++;
      const sep = line.charCodeAt(i);
      if (sep === 44) {
        i++;
        continue;
      }
      if (sep === 41) {
        i++;
        break;
      }
      throw new Error(`예상치 못한 문자(코드 ${sep}: '${String.fromCharCode(sep)}') 위치 ${i}\n주변 내용: ${line.slice(Math.max(0, i - 50), i + 50)}`);
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
  let insertingTable: string | null = null;
  let pendingLine = '';
  let inQuote = false;
  let inTuple = false;

  const rl = readline.createInterface({
    input: fs.createReadStream(DUMP_PATH, { encoding: 'utf8' }),
    crlfDelay: Infinity,
  });

  for await (const rawLine of rl) {
    const trimmed = rawLine.trim();

    // 1) INSERT가 진행 중이 아닐 때는 DDL(CREATE TABLE 등)을 파싱
    if (!insertingTable) {
      if (trimmed.startsWith('CREATE TABLE')) {
        const m = trimmed.match(/^CREATE TABLE [`"']([^`"']+)[`"']/);
        if (m) {
          creating = m[1];
          columns[creating] = [];
        }
        continue;
      }
      if (creating) {
        const cm = trimmed.match(/^[`"']([^`"']+)[`"']/);
        if (cm) {
          columns[creating].push(cm[1]);
        } else if (trimmed.startsWith(')')) {
          creating = null;
        }
        continue;
      }
      if (trimmed.startsWith('INSERT INTO')) {
        const im = trimmed.match(/^INSERT INTO [`"']([^`"']+)[`"']/);
        if (im && wanted.has(im[1])) {
          insertingTable = im[1];
        }
        const vMatch = rawLine.search(/\bVALUES\b/i);
        if (vMatch !== -1) {
          const afterValues = vMatch + 6;
          if (rawLine.indexOf('(', afterValues) !== -1 && insertingTable) {
            const cols = columns[insertingTable];
            const filter = filters[insertingTable];
            parseTuples(rawLine, afterValues, (values) => {
              const row: LegacyRow = {};
              for (let k = 0; k < cols.length; k++) row[cols[k]] = values[k] ?? null;
              if (!filter || filter(row)) result[insertingTable!].push(row);
            });
            if (trimmed.endsWith(';')) insertingTable = null;
          }
        }
        continue;
      }
    }

    // 2) INSERT 데이터 행 파싱 (멀티라인 튜플 버퍼링 적용)
    if (insertingTable) {
      const line = pendingLine ? pendingLine + '\n' + rawLine : rawLine;

      let escaped = false;
      let quote = inQuote;
      let tuple = inTuple;
      const len = line.length;
      const startScan = pendingLine ? pendingLine.length + 1 : 0;

      for (let idx = startScan; idx < len; idx++) {
        const ch = line.charCodeAt(idx);
        if (escaped) {
          escaped = false;
          continue;
        }
        if (ch === 92 /* \ */) {
          if (quote) escaped = true;
          continue;
        }
        if (ch === 39 /* ' */) {
          if (quote && idx + 1 < len && line.charCodeAt(idx + 1) === 39) {
            idx++;
            continue;
          }
          quote = !quote;
          continue;
        }
        if (!quote) {
          if (ch === 40 /* ( */) tuple = true;
          else if (ch === 41 /* ) */) tuple = false;
        }
      }

      inQuote = quote;
      inTuple = tuple;

      if (inQuote || inTuple) {
        pendingLine = line;
        continue;
      }
      pendingLine = '';

      const lineTrim = line.trim();
      if (lineTrim.startsWith('(')) {
        const cols = columns[insertingTable];
        const filter = filters[insertingTable];
        parseTuples(line, 0, (values) => {
          const row: LegacyRow = {};
          for (let k = 0; k < cols.length; k++) row[cols[k]] = values[k] ?? null;
          if (!filter || filter(row)) result[insertingTable!].push(row);
        });
      }
      if (lineTrim.endsWith(';')) {
        insertingTable = null;
      }
    }
  }

  return result;
}
