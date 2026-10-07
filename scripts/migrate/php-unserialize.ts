// ==============================================================
// PHP serialize() 문자열 파서 (scripts/migrate/php-unserialize.ts)
// ==============================================================
// 왜 필요한가?
//  - 레거시 퀴즈 내용/학습 결과가 PHP의 serialize() 문자열로 저장되어 있다.
//    예) a:2:{s:1:"q";a:1:{i:1;a:3:{i:0;s:6:"보기";...}}}
//  - 문자열 길이(s:39)가 "글자 수"가 아니라 "UTF-8 바이트 수"라서
//    Buffer 기준으로 읽어야 한글이 깨지지 않는다.
// ==============================================================

export type PhpValue = string | number | boolean | null | PhpValue[] | { [key: string]: PhpValue };

export function phpUnserialize(input: string): PhpValue {
  const buf = Buffer.from(input, 'utf8');
  let pos = 0;

  // 지정한 구분 문자(코드)까지 읽고, 구분 문자 다음으로 커서를 옮긴다
  const readUntil = (stop: number): string => {
    const start = pos;
    while (buf[pos] !== stop) {
      if (pos >= buf.length) throw new Error('serialize 문자열이 중간에 끝났습니다.');
      pos++;
    }
    const text = buf.toString('utf8', start, pos);
    pos++;
    return text;
  };

  const parse = (): PhpValue => {
    const type = String.fromCharCode(buf[pos]);
    switch (type) {
      case 'N': // N;
        pos += 2;
        return null;
      case 'b': // b:1;
        pos += 2;
        return readUntil(59) === '1';
      case 'i': // i:42;
        pos += 2;
        return parseInt(readUntil(59), 10);
      case 'd': // d:0.5;
        pos += 2;
        return parseFloat(readUntil(59));
      case 's': {
        // s:6:"문자열";
        pos += 2;
        const byteLength = parseInt(readUntil(58), 10);
        pos++; // 여는 따옴표
        const text = buf.toString('utf8', pos, pos + byteLength);
        pos += byteLength + 2; // 닫는 따옴표 + ;
        return text;
      }
      case 'a': {
        // a:2:{ key value key value }
        pos += 2;
        const count = parseInt(readUntil(58), 10);
        pos++; // {
        const entries: Array<[string, PhpValue]> = [];
        for (let k = 0; k < count; k++) {
          const key = parse();
          const value = parse();
          entries.push([String(key), value]);
        }
        pos++; // }
        // 키가 0,1,2... 로 이어지면 배열로, 아니면 객체로 돌려준다
        const isList = entries.every(([key], idx) => key === String(idx));
        if (isList) return entries.map(([, value]) => value);
        const obj: { [key: string]: PhpValue } = {};
        for (const [key, value] of entries) obj[key] = value;
        return obj;
      }
      default:
        throw new Error(`지원하지 않는 serialize 타입: ${type} (위치 ${pos})`);
    }
  };

  return parse();
}

/** 안전 버전: 실패하면 null (깨진 레거시 데이터 한 건 때문에 전체 이관이 멈추지 않게) */
export function tryPhpUnserialize(input: string | null | undefined): PhpValue | null {
  if (!input) return null;
  try {
    return phpUnserialize(input);
  } catch {
    return null;
  }
}

/** 키가 1,2,3.. 인 객체/배열을 번호순 값 배열로 통일 (퀴즈 문항 키가 i:1 부터 시작함) */
export function phpOrderedValues(value: PhpValue | undefined): PhpValue[] {
  if (value === null || value === undefined) return [];
  if (Array.isArray(value)) return value;
  if (typeof value === 'object') {
    return Object.keys(value)
      .sort((a, b) => Number(a) - Number(b))
      .map((key) => (value as { [key: string]: PhpValue })[key]);
  }
  return [];
}
