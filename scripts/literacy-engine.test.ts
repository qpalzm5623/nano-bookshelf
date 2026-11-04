// 문해력 진단 엔진 테스트 (npx tsx --test scripts/literacy-engine.test.ts)
// 원본 프로그램(Korean Test)의 설계 규칙(레벨 컷, 영역 판정, 출제 수)이 그대로 이식되었는지 확인합니다.
import test from 'node:test';
import assert from 'node:assert/strict';
import seed from '../lib/literacy-item-bank.json';
import {
  AREAS, PER_AREA, TOTAL_OF_BAND, bankCoverage, categorize, judgeArea, levelOf, parseGradeStep, publicItem, selectItems, summarize,
  type Band, type ItemBank, type ItemResponse, type LiteracyItem,
} from '../lib/literacy-engine';

const bank = { version: 'test', items: (seed as any).items as LiteracyItem[] } as ItemBank;

test('문항 수: 밴드0=15, 밴드1·2=25 (영역당 3/5문항)', () => {
  assert.equal(selectItems(bank, 0).length, 15);
  assert.equal(selectItems(bank, 1).length, 25);
  assert.equal(selectItems(bank, 2).length, 25);
  assert.deepEqual(TOTAL_OF_BAND, { 0: 15, 1: 25, 2: 25 });
});

test('"선정" 문항만, 해당 밴드 문항만 출제된다', () => {
  for (const band of [0, 1, 2] as Band[]) {
    for (const it of selectItems(bank, band)) {
      assert.equal(it.status, '선정');
      assert.equal(it.band, band);
    }
  }
});

test('영역 순서(어휘→학습도구어→요약→비교→추론)대로 출제된다', () => {
  for (const band of [0, 1, 2] as Band[]) {
    const order = selectItems(bank, band).map((i) => AREAS.indexOf(i.area));
    assert.deepEqual(order, [...order].sort((a, b) => a - b));
  }
});

test('학습도구어는 매번 추첨되지만 4개 영역은 고정이다', () => {
  const a = selectItems(bank, 1, () => 0.1), b = selectItems(bank, 1, () => 0.9);
  const fixed = (l: LiteracyItem[]) => l.filter((i) => i.area !== '학습도구어').map((i) => i.id);
  assert.deepEqual(fixed(a), fixed(b));
  const tool = (l: LiteracyItem[]) => l.filter((i) => i.area === '학습도구어').map((i) => i.id);
  assert.notDeepEqual(tool(a), tool(b));
  // 밴드1 학습도구어: 1학년 층 3 + 2학년 층 2
  const strata = selectItems(bank, 1).filter((i) => i.area === '학습도구어').map((i) => i.stratum);
  assert.equal(strata.filter((s) => s === '1').length, 3);
  assert.equal(strata.filter((s) => s === '2').length, 2);
});

test('레벨 컷: 레벨산출_가안.md 표와 동일', () => {
  assert.deepEqual([0, 5, 6, 9, 10, 12, 13, 15].map((c) => levelOf(0, c)), [1, 1, 2, 2, 3, 3, 4, 4]);
  assert.deepEqual([0, 7, 8, 13, 14, 18, 19, 22, 23, 25].map((c) => levelOf(1, c)), [2, 2, 3, 3, 4, 4, 5, 5, 6, 6]);
  assert.deepEqual([0, 7, 8, 13, 14, 18, 19, 22, 23, 25].map((c) => levelOf(2, c)), [6, 6, 7, 7, 8, 8, 9, 9, 10, 10]);
});

test('영역 판정: 5문항 5/4/3/0~2, 3문항 3/2/0~1', () => {
  assert.deepEqual([5, 4, 3, 2, 0].map((c) => judgeArea(1, c)), ['기대 이상', '도달', '근접', '보완 필요', '보완 필요']);
  assert.deepEqual([3, 2, 1, 0].map((c) => judgeArea(0, c)), ['도달', '근접', '보완 필요', '보완 필요']);
});

test('기대 구간 대비 총평', () => {
  assert.equal(categorize(7, 2), 'above');
  assert.equal(categorize(5, 2), 'at');
  assert.equal(categorize(4, 2), 'near');
  assert.equal(categorize(2, 2), 'needs-support');
});

function respond(items: LiteracyItem[], rightCount: number): ItemResponse[] {
  return items.map((it, i) => ({ itemId: it.id, area: it.area, choice: i < rightCount ? it.answer : (it.answer + 1) % it.choices.length, correct: i < rightCount, ms: 1000 }));
}

test('바닥/천장 보정 플래그', () => {
  const items1 = selectItems(bank, 1);
  assert.equal(summarize(1, 1, respond(items1, 7), 25).floor, true);   // 28% ≤ 30%
  assert.equal(summarize(1, 1, respond(items1, 8), 25).floor, false);
  assert.equal(summarize(1, 1, respond(items1, 23), 25).ceiling, true); // 92% ≥ 90%
  const items2 = selectItems(bank, 2);
  assert.equal(summarize(2, 4, respond(items2, 25), 25).ceiling, false); // 최상위 밴드는 천장 권장 없음
  assert.equal(summarize(0, 0, respond(selectItems(bank, 0), 0), 15).floor, false); // 7세는 바닥 권장 없음
});

test('요약 결과: 영역별 정답 수가 응답과 일치', () => {
  const items = selectItems(bank, 2);
  const result = summarize(2, 3, respond(items, 25), 25);
  assert.equal(result.correct, 25);
  assert.equal(result.level, 10);
  assert.ok(result.areas.every((a) => a.correct === PER_AREA[2] && a.judgement === '기대 이상'));
});

test('학생에게 내려가는 문항에는 정답과 출제 근거가 없다', () => {
  const pub = publicItem(selectItems(bank, 1)[0]) as any;
  assert.equal('answer' in pub, false);
  assert.equal('rationale' in pub, false);
});

test('학년 문자열 해석', () => {
  assert.equal(parseGradeStep('7세'), 0);
  assert.equal(parseGradeStep('유치'), 0);
  assert.equal(parseGradeStep('초1'), 1);
  assert.equal(parseGradeStep('초등 3학년'), 3);
  assert.equal(parseGradeStep('초4'), 4);
  assert.equal(parseGradeStep('초6'), 4); // 초5 이상은 4로 보정
  assert.equal(parseGradeStep(''), null);
  assert.equal(parseGradeStep('중1'), null);
});

test('기본 문항 은행은 모든 밴드·영역에서 규정 수 이상의 선정 문항을 가진다', () => {
  for (const row of bankCoverage(bank.items)) assert.ok(row.selected >= row.required, `${row.band}/${row.area}`);
});

test('모든 문항의 보기 수와 정답 번호가 규격에 맞는다', () => {
  for (const it of bank.items) {
    assert.equal(it.choices.length, it.band === 2 ? 4 : 3, it.id);
    assert.ok(it.answer >= 0 && it.answer < it.choices.length, it.id);
  }
});

