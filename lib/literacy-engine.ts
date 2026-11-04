// ==============================================================
// 나노의 책장 - 초등 문해력 진단 엔진 (서버 전용, 순수 로직)
// 원본: Korean Test/byeolbyeol-literacy/lib/engine (화면·저장소와 무관한 채점/레벨 산출)
//
// [왜 서버에서 채점하는가]
// 학생 브라우저에 정답(answer)을 내려보내면 개발자도구로 정답을 볼 수 있습니다.
// 그래서 출제(selectItems)와 채점(summarize)을 모두 서버에서 하고,
// 학생에게는 정답이 제거된 문항만 내려보냅니다.
// ==============================================================

export type Area = '어휘이해력' | '학습도구어' | '요약' | '비교' | '추론';
export const AREAS: Area[] = ['어휘이해력', '학습도구어', '요약', '비교', '추론'];
/** 0 = 7세, 1 = 초1~2, 2 = 초3~4 */
export type Band = 0 | 1 | 2;
/** 0 = 7세, 1~4 = 초1~초4 */
export type GradeStep = 0 | 1 | 2 | 3 | 4;
export type AreaJudgement = '기대 이상' | '도달' | '근접' | '보완 필요';
export type OverallCategory = 'above' | 'at' | 'near' | 'needs-support';

export interface LiteracyItem {
  id: string;
  area: Area;
  band: Band;
  /** "선정"만 출제, "예비"는 교체용 보관 */
  status: '선정' | '예비';
  /** 세트형(한 지문에 여러 문항)은 같은 setId */
  setId: string | null;
  itemType: string;
  word?: string | null;
  /** [[ ]] = 밑줄, (    ) = 빈칸 */
  passage: string | null;
  question: string;
  choices: string[];
  /** 0부터 시작하는 정답 번호 */
  answer: number;
  imageDesc: string | null;
  /** 지문 그림(선택) */
  image?: string | null;
  /** 보기가 그림인 문항의 보기별 그림(선택) */
  choiceImages?: (string | null)[] | null;
  /** 학습도구어 로테이션 풀의 난이도 층 */
  stratum?: string;
  /** 출제 근거(운영자 메모, 학생에게 비공개) */
  rationale?: string;
}

export interface ItemBank { version: string; items: LiteracyItem[] }

export interface ItemResponse { itemId: string; area: Area; choice: number; correct: boolean; ms: number }
export interface AreaResult { area: Area; correct: number; total: number; judgement: AreaJudgement }
export interface LiteracyResult {
  band: Band; correct: number; total: number; level: number; areas: AreaResult[];
  floor: boolean; ceiling: boolean; category: OverallCategory;
}

// --------------------------------------------------------------
// 레벨 산출 상수 (파일럿 전 가안 - 운영 데이터로 조정 예정)
// --------------------------------------------------------------
/** 밴드별 영역당 선정 문항 수 */
export const PER_AREA: Record<Band, number> = { 0: 3, 1: 5, 2: 5 };
/** 학습도구어 로테이션 출제 계획: 난이도 층별 추첨 수 */
export const TOOL_PLAN: Record<Band, [string, number][]> = {
  0: [['0', 3]],
  1: [['1', 3], ['2', 2]],
  2: [['3', 3], ['4', 2]],
};
/** 밴드별 [최소 맞힌 수, 레벨] - 높은 쪽부터 검사 */
export const LEVEL_CUTS: Record<Band, [number, number][]> = {
  0: [[13, 4], [10, 3], [6, 2], [0, 1]],
  1: [[23, 6], [19, 5], [14, 4], [8, 3], [0, 2]],
  2: [[23, 10], [19, 9], [14, 8], [8, 7], [0, 6]],
};
const AREA_JUDGE_5: [number, AreaJudgement][] = [[5, '기대 이상'], [4, '도달'], [3, '근접'], [0, '보완 필요']];
const AREA_JUDGE_3: [number, AreaJudgement][] = [[3, '도달'], [2, '근접'], [0, '보완 필요']];
export const FLOOR_RATE = 0.3;
export const CEILING_RATE = 0.9;
export const EXPECTED_RANGE: Record<GradeStep, [number, number]> = { 0: [1, 2], 1: [3, 4], 2: [5, 6], 3: [7, 8], 4: [9, 10] };
export const BAND_OF_GRADE: Record<GradeStep, Band> = { 0: 0, 1: 1, 2: 1, 3: 2, 4: 2 };
/** 밴드별 총 문항 수 */
export const TOTAL_OF_BAND: Record<Band, number> = { 0: PER_AREA[0] * 5, 1: PER_AREA[1] * 5, 2: PER_AREA[2] * 5 };

export function levelOf(band: Band, correct: number): number {
  for (const [min, level] of LEVEL_CUTS[band]) if (correct >= min) return level;
  return LEVEL_CUTS[band][LEVEL_CUTS[band].length - 1][1];
}
export function judgeArea(band: Band, correct: number): AreaJudgement {
  const table = band === 0 ? AREA_JUDGE_3 : AREA_JUDGE_5;
  for (const [min, j] of table) if (correct >= min) return j;
  return '보완 필요';
}

/**
 * 회원 DB의 학년 문자열("초5", "초등 2학년", "7세", "유치" ...)을 진단 학년 단계로 바꿉니다.
 * 이 진단은 7세~초4 대상이라 초5 이상은 4로 보정(원장이 배정 화면에서 수동 조정 가능)하고,
 * 알 수 없는 값은 null을 돌려 화면에서 원장이 직접 고르게 합니다.
 */
export function parseGradeStep(raw: any): GradeStep | null {
  const s = String(raw ?? '').replace(/\s/g, '');
  if (!s) return null;
  if (/7세|유치|미취학|예비초|누리/.test(s)) return 0;
  const m = s.match(/초(?:등)?(\d)/) || s.match(/(\d)학년/);
  if (!m) return null;
  const n = Number(m[1]);
  if (n < 1) return null;
  return Math.min(n, 4) as GradeStep;
}

// --------------------------------------------------------------
// 출제 / 채점
// --------------------------------------------------------------
function shuffle<T>(arr: T[], rng: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** 학습도구어 층화 추첨: 층별 정원대로 뽑고, 모자라면 남은 풀에서 채운다. 쉬운 층부터 낸다 */
function sampleToolItems(pool: LiteracyItem[], band: Band, per: number, rng: () => number): LiteracyItem[] {
  const chosen: LiteracyItem[] = [];
  for (const [stratum, count] of TOOL_PLAN[band]) {
    const layer = shuffle(pool.filter((it) => it.stratum === stratum && !chosen.includes(it)), rng);
    chosen.push(...layer.slice(0, count));
  }
  if (chosen.length < per) {
    const rest = shuffle(pool.filter((it) => !chosen.includes(it)), rng);
    chosen.push(...rest.slice(0, per - chosen.length));
  }
  return chosen.slice(0, per).sort((a, b) => (a.stratum ?? '').localeCompare(b.stratum ?? '') || a.id.localeCompare(b.id));
}

/**
 * 출제 문항 고르기: 밴드의 "선정" 문항을 영역 순서대로, 같은 세트는 붙여서 낸다.
 * 4개 영역은 고정형(레벨 비교성), 학습도구어만 풀에서 층화 추첨.
 */
export function selectItems(bank: ItemBank, band: Band, rng: () => number = Math.random): LiteracyItem[] {
  const per = PER_AREA[band];
  const picked: LiteracyItem[] = [];
  for (const area of AREAS) {
    const pool = bank.items.filter((it) => it.band === band && it.area === area && it.status === '선정');
    if (area === '학습도구어' && pool.some((it) => it.stratum)) {
      picked.push(...sampleToolItems(pool, band, per, rng));
      continue;
    }
    const inArea: LiteracyItem[] = [];
    for (const it of pool) {
      if (inArea.length >= per) break;
      if (inArea.includes(it)) continue;
      if (it.setId) inArea.push(...pool.filter((s) => s.setId === it.setId && !inArea.includes(s)));
      else inArea.push(it);
    }
    picked.push(...inArea.slice(0, per));
  }
  return picked;
}

export function categorize(level: number, grade: GradeStep): OverallCategory {
  const [min, max] = EXPECTED_RANGE[grade];
  if (level > max) return 'above';
  if (level >= min) return 'at';
  if (level === min - 1) return 'near';
  return 'needs-support';
}

/** 응답 목록으로 최종 결과 산출 (정답 여부는 서버가 문항은행과 직접 비교해 판정) */
export function summarize(band: Band, grade: GradeStep, responses: ItemResponse[], totalItems: number): LiteracyResult {
  const correct = responses.filter((r) => r.correct).length;
  const areas: AreaResult[] = AREAS.map((area) => {
    const rs = responses.filter((r) => r.area === area);
    const c = rs.filter((r) => r.correct).length;
    return { area, correct: c, total: PER_AREA[band], judgement: judgeArea(band, c) };
  });
  const rate = totalItems ? correct / totalItems : 0;
  const level = levelOf(band, correct);
  return {
    band, correct, total: totalItems, level, areas,
    floor: band > 0 && rate <= FLOOR_RATE,
    ceiling: rate >= CEILING_RATE && band < 2,
    category: categorize(level, grade),
  };
}

/** 학생 화면에 내려보낼 문항: 정답·출제 근거 제거 */
export function publicItem(it: LiteracyItem) {
  return {
    id: it.id, area: it.area, setId: it.setId, passage: it.passage, question: it.question, choices: it.choices,
    imageDesc: it.imageDesc, image: it.image || null, choiceImages: it.choiceImages || null,
  };
}

/** 문항 은행 점검: 밴드·영역별 선정 문항 수와 규정 수 비교 (운영자 화면 경고용) */
export function bankCoverage(items: LiteracyItem[]) {
  const rows: { band: Band; area: Area; selected: number; reserve: number; required: number }[] = [];
  for (const band of [0, 1, 2] as Band[]) {
    for (const area of AREAS) {
      const group = items.filter((i) => i.band === band && i.area === area);
      rows.push({
        band, area, required: PER_AREA[band],
        selected: group.filter((i) => i.status === '선정').length,
        reserve: group.filter((i) => i.status === '예비').length,
      });
    }
  }
  return rows;
}

