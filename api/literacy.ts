import { prisma } from '../lib/prisma';
import { authenticate, staff, master, need, failure, academyScope } from '../lib/portal-http';
import { createHash, createHmac, randomUUID, timingSafeEqual } from 'node:crypto';
import { ProxyAgent } from 'undici';
import seedBank from '../lib/literacy-item-bank.json';
import {
  AREAS, PER_AREA, TOTAL_OF_BAND, bankCoverage, parseGradeStep, publicItem, selectItems, summarize, BAND_OF_GRADE,
  type Area, type Band, type GradeStep, type ItemBank, type ItemResponse, type LiteracyItem,
} from '../lib/literacy-engine';

// ==============================================================
// 초등 문해력 진단 API (배정 · 응시 · 결과지 · 문항 은행 관리)
//
// [저장소 선택 이유]
// 별도 DB 테이블을 만들면 운영 DB 마이그레이션(prisma db push)이 먼저 필요합니다.
// 포트폴리오 등 기존 기능이 쓰는 PortalSetting(JSON 저장소)을 scope로 구분해 사용하면
// 배포만으로 바로 동작하고, 실패해도 기존 데이터에 영향이 없습니다.
//   - literacy_bank                : 문항 은행(마스터 편집본, 없으면 기본 문항 사용)
//   - literacy_assign:<학원ID>      : 테스트 배정 + 완료 시 결과 요약
//   - literacy_result:<학원ID>      : 문항별 응답을 포함한 결과 원본
// ==============================================================

export const config = { api: { bodyParser: { sizeLimit: '1mb' } } };

const BANK_KEY = 'literacy_bank';
const defaultBank = seedBank as unknown as { meta: { version: string }; items: LiteracyItem[] };
const ACTIVE = ['PENDING', 'IN_PROGRESS'];

// 알림톡 설정: 기존 서비스와 같은 환경변수를 쓰되, 문해력 결과지는 별도 승인 템플릿이 필요합니다.
const fixieUrl = process.env.FIXIE_URL;
const proxyDispatcher = fixieUrl ? new ProxyAgent(fixieUrl) : undefined;

// ---------- 문항 은행 읽기/쓰기 ----------
async function readBank() {
  const row = await prisma.portalSetting.findUnique({ where: { key: BANK_KEY } });
  if (row) {
    const v = row.value as any;
    return { items: (v.items || []) as LiteracyItem[], version: String(v.version || ''), revision: row.revision, isDefault: false };
  }
  return { items: defaultBank.items, version: String(defaultBank.meta.version), revision: 0, isDefault: true };
}
async function writeBank(items: LiteracyItem[], revision: number) {
  const value = { version: new Date().toISOString().slice(0, 10) + '-edited', items } as any;
  if (revision === 0) {
    // 최초 편집: 기본 문항을 복사해 편집본을 만든다 (동시에 두 명이 만들면 키 중복으로 거절)
    await prisma.portalSetting.create({ data: { key: BANK_KEY, scope: BANK_KEY, value, revision: 1 } });
  } else {
    const saved = await prisma.portalSetting.updateMany({ where: { key: BANK_KEY, revision }, data: { value, revision: { increment: 1 } } });
    need(saved.count === 1, '다른 관리자가 먼저 문항을 수정했습니다. 새로고침 후 다시 시도해 주세요.', 409);
  }
}

/** 규정 문항 수 점검: 어느 밴드·영역이든 "선정" 문항이 모자라면 출제가 깨지므로 저장을 막는다 */
function assertCoverage(items: LiteracyItem[]) {
  const lacking = bankCoverage(items).filter((r) => r.selected < r.required);
  need(!lacking.length,
    '출제(선정) 문항이 부족해 저장할 수 없습니다: ' + lacking.map((r) => `밴드${r.band} ${r.area} ${r.selected}/${r.required}`).join(', ') +
    '. 대체 문항을 먼저 "선정"으로 등록한 뒤 변경해 주세요.');
}

const clean = (v: any, max: number) => String(v ?? '').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '').trim().slice(0, max);
const IMAGE_PATH = /^(resources\/literacy\/[\w./-]+|https:\/\/[^\s<>"']+|\/api\/literacy\?action=image&id=[a-f0-9]{64})$/;
const AREA_CODE: Record<string, string> = { 어휘이해력: 'VOC', 학습도구어: 'TOOL', 요약: 'SUM', 비교: 'CMP', 추론: 'INF' };

/** 마스터가 보낸 문항을 검증·정리한다 (밴드0·1 = 3보기, 밴드2 = 4보기 규격 유지) */
function validateItem(raw: any, existing?: LiteracyItem): LiteracyItem {
  need(raw && typeof raw === 'object', '문항 정보를 확인해 주세요.');
  const band = Number(raw.band);
  need([0, 1, 2].includes(band), '밴드를 선택해 주세요.');
  need(AREAS.includes(raw.area), '영역을 선택해 주세요.');
  need(['선정', '예비'].includes(raw.status), '상태(선정/예비)를 선택해 주세요.');
  const question = clean(raw.question, 300);
  need(question, '문제(발문)를 입력해 주세요.');
  const passage = clean(raw.passage, 1500) || null;
  need(Array.isArray(raw.choices), '보기를 입력해 주세요.');
  const choices = raw.choices.map((c: any) => clean(c, 120));
  const expected = band === 2 ? 4 : 3;
  need(choices.length === expected && choices.every(Boolean), `밴드${band}는 보기가 ${expected}개여야 하며 빈 보기가 없어야 합니다.`);
  need(new Set(choices).size === choices.length, '중복된 보기가 있습니다.');
  const answer = Number(raw.answer);
  need(Number.isInteger(answer) && answer >= 0 && answer < choices.length, '정답 번호를 확인해 주세요.');
  const image = clean(raw.image, 300) || null;
  need(!image || IMAGE_PATH.test(image), '그림 주소는 resources/literacy/ 경로 또는 https 주소만 사용할 수 있습니다.');
  let choiceImages: (string | null)[] | null = null;
  if (Array.isArray(raw.choiceImages) && raw.choiceImages.some(Boolean)) {
    const images = choices.map((_: any, i: number) => clean(raw.choiceImages[i], 300) || null);
    need(images.every((p: string | null) => !p || IMAGE_PATH.test(p)), '보기 그림 주소를 확인해 주세요.');
    choiceImages = images;
  }
  const stratum = raw.area === '학습도구어' ? clean(raw.stratum, 2) : '';
  need(raw.area !== '학습도구어' || ['0', '1', '2', '3', '4'].includes(stratum), '학습도구어 문항은 난이도 층(0~4)을 선택해 주세요.');
  const id = existing?.id || '';
  return {
    id, area: raw.area as Area, band: band as Band, status: raw.status, setId: clean(raw.setId, 30) || null,
    itemType: clean(raw.itemType, 20) || '기타', word: clean(raw.word, 30) || null, passage, question, choices, answer,
    imageDesc: clean(raw.imageDesc, 200) || null, image, choiceImages, ...(stratum ? { stratum } : {}),
    rationale: clean(raw.rationale, 300) || undefined,
  };
}

// ---------- 학부모 공유 링크 (로그인 없이 결과지 열람) ----------
// 결과지 ID를 서버 비밀키로 서명한 토큰을 붙여, 링크를 아는 사람만 열 수 있게 한다.
function shareToken(resultId: string) {
  const secret = process.env.PORTAL_AUTH_SECRET || '';
  need(secret.length >= 32, '운영 서버 설정이 필요합니다.', 503);
  return createHmac('sha256', secret).update('literacy-report:' + resultId).digest('base64url').slice(0, 32);
}
function tokenOk(resultId: string, token: string) {
  try {
    const a = Buffer.from(shareToken(resultId)); const b = Buffer.from(String(token || ''));
    return a.length === b.length && timingSafeEqual(a, b);
  } catch { return false; }
}
function shareUrl(req: any, resultId: string) {
  const host = String(req.headers.host || '').trim();
  const base = host.includes('nanosbook.co.kr') || host.includes('vercel.app')
    ? 'https://nanosbook.co.kr'
    : `${String(req.headers['x-forwarded-proto'] || 'https').split(',')[0]}://${host || 'nanosbook.co.kr'}`;
  return `${base}/literacy_report.html?r=${encodeURIComponent(resultId)}&t=${shareToken(resultId)}`;
}

// ---------- 배정/결과 조회 헬퍼 ----------
const assignScope = (academyId: string) => 'literacy_assign:' + academyId;
const resultScope = (academyId: string) => 'literacy_result:' + academyId;
async function findAssignment(id: string) {
  need(typeof id === 'string' && /^[\w-]{8,64}$/.test(id), '배정 정보를 확인해 주세요.');
  const row = await prisma.portalSetting.findUnique({ where: { key: 'literacy_assign:' + id } });
  need(row, '배정을 찾을 수 없습니다.', 404);
  return { row, value: row.value as any };
}
async function saveAssignment(row: { key: string; revision: number }, value: any, db: Pick<typeof prisma, 'portalSetting'> = prisma) {
  const saved = await db.portalSetting.updateMany({ where: { key: row.key, revision: row.revision }, data: { value, revision: { increment: 1 } } });
  need(saved.count === 1, '다른 요청이 먼저 처리되었습니다. 새로고침 후 다시 시도해 주세요.', 409);
}
async function listAssignments(academyId: string, memberId?: string) {
  const rows = await prisma.portalSetting.findMany({
    where: { scope: assignScope(academyId), ...(memberId ? { value: { path: ['memberId'], equals: memberId } } : {}) },
    orderBy: { updatedAt: 'desc' }, take: 1000,
  });
  return rows.map((r) => r.value as any);
}
/** 같은 학생의 완료 기록(오래된 순) - 결과지의 "레벨 변화" 추이 */
function historyOf(all: any[], memberId: string) {
  return all.filter((a) => a.memberId === memberId && a.status === 'COMPLETED' && a.summary)
    .map((a) => ({ id: a.resultId, finishedAt: a.summary.finishedAt, level: a.summary.level, gradeStep: a.summary.gradeStep, band: a.summary.band }))
    .sort((x, y) => String(x.finishedAt).localeCompare(String(y.finishedAt)));
}

// 학생 화면에 보여줄 배정 정보 (결과 요약에서 레벨·영역 등 리포트 성격 정보는 제외)
const studentView = (a: any) => ({ id: a.id, status: a.status, assignedAt: a.assignedAt, dueDate: a.dueDate || '', band: a.band, total: TOTAL_OF_BAND[a.band as Band] });

export default async function handler(req: any, res: any) {
  res.setHeader('Cache-Control', 'no-store');
  try {
    const action = String(req.query.action || '');
    const body = req.body || {};

    // ----- 로그인 없이 열리는 학부모 결과지 -----
    if (action === 'public_report' && req.method === 'GET') {
      const id = String(req.query.id || '');
      need(/^[\w-]{8,64}$/.test(id) && tokenOk(id, String(req.query.t || '')), '유효하지 않은 결과지 링크입니다.', 403);
      const row = await prisma.portalSetting.findUnique({ where: { key: 'literacy_result:' + id } });
      need(row, '결과지를 찾을 수 없습니다.', 404);
      const record = row.value as any;
      const history = historyOf(await listAssignments(record.academyId, record.memberId), record.memberId);
      return res.json({ record: publicRecord(record), history });
    }

    const user = await authenticate(req);
    const isStudent = user.role === 'STUDENT';

    // 문항 이미지는 기존 JSON 저장소에 보관하며 로그인한 사용자에게 제공한다.
    if (action === 'image' && req.method === 'GET') {
      const id = String(req.query.id || '');
      need(/^[a-f0-9]{64}$/.test(id), '이미지를 확인해 주세요.');
      const row = await prisma.portalSetting.findUnique({ where: { key: 'literacy_image:' + id } });
      need(row, '이미지를 찾을 수 없습니다.', 404);
      const image = row.value as any;
      res.setHeader('Content-Type', image.mime);
      res.setHeader('X-Content-Type-Options', 'nosniff');
      return res.status(200).send(Buffer.from(image.base64, 'base64'));
    }
    if (action === 'image_upload' && req.method === 'POST') {
      master(user);
      need(typeof body.base64 === 'string' && body.base64.length <= 700000 && /^[A-Za-z0-9+/]+={0,2}$/.test(body.base64), '이미지는 500KB 이하로 올려 주세요.', 413);
      const bytes = Buffer.from(body.base64, 'base64');
      need(bytes.length >= 12 && bytes.length <= 500 * 1024, '이미지는 500KB 이하로 올려 주세요.', 413);
      const mime = bytes.subarray(0, 8).toString('hex') === '89504e470d0a1a0a' ? 'image/png'
        : bytes.subarray(0, 3).toString('hex') === 'ffd8ff' ? 'image/jpeg'
        : bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP' ? 'image/webp' : '';
      need(mime && mime === body.mime, 'PNG, JPG, WEBP 이미지 파일만 사용할 수 있습니다.');
      const id = createHash('sha256').update(bytes).digest('hex');
      await prisma.portalSetting.upsert({ where: { key: 'literacy_image:' + id }, update: {},
        create: { key: 'literacy_image:' + id, scope: 'literacy_image', value: { mime, base64: bytes.toString('base64') } } });
      return res.json({ url: '/api/literacy?action=image&id=' + id });
    }

    // ================= 학생 =================
    if (action === 'my' && req.method === 'GET') {
      need(isStudent, '원생 전용 기능입니다.', 403);
      const mine = await listAssignments(user.academyId, user.id);
      return res.json({
        active: mine.filter((a) => ACTIVE.includes(a.status)).sort((x, y) => String(y.assignedAt).localeCompare(String(x.assignedAt))).map(studentView),
        // 학생에게는 날짜와 점수만 공개 (레벨·영역별 분석 리포트는 원장/학부모용)
        history: mine.filter((a) => a.status === 'COMPLETED' && a.summary)
          .map((a) => ({ id: a.id, date: a.summary.finishedAt, correct: a.summary.correct, total: a.summary.total, score: Math.round((a.summary.correct / a.summary.total) * 100) }))
          .sort((x, y) => String(y.date).localeCompare(String(x.date))),
      });
    }
    if (action === 'start' && req.method === 'POST') {
      need(isStudent, '원생 전용 기능입니다.', 403);
      const { row, value } = await findAssignment(body.assignmentId);
      need(value.memberId === user.id, '본인에게 배정된 테스트만 시작할 수 있습니다.', 403);
      need(ACTIVE.includes(value.status), '이미 완료되었거나 취소된 테스트입니다.', 409);
      const bank = await readBank();
      let itemIds: string[] = Array.isArray(value.itemIds) ? value.itemIds : [];
      // 이어 풀기: 이미 출제된 문항이 있으면 그대로(문항이 바뀌면 점수 비교가 흔들리므로), 없을 때만 새로 추첨
      if (!itemIds.length || itemIds.some((id) => !bank.items.find((it) => it.id === id))) {
        itemIds = selectItems({ version: bank.version, items: bank.items } as ItemBank, value.band).map((it) => it.id);
        need(itemIds.length === TOTAL_OF_BAND[value.band as Band], '출제 문항이 부족합니다. 선생님께 문의해 주세요.', 409);
        await saveAssignment(row, { ...value, status: 'IN_PROGRESS', itemIds, startedAt: value.startedAt || new Date().toISOString() });
      } else if (value.status !== 'IN_PROGRESS') {
        await saveAssignment(row, { ...value, status: 'IN_PROGRESS', startedAt: value.startedAt || new Date().toISOString() });
      }
      const items = itemIds.map((id) => publicItem(bank.items.find((it) => it.id === id)!));
      return res.json({
        assignmentId: value.id, band: value.band, total: items.length, items,
        // 7세·초1은 읽어주기 기본 켜짐
        autoRead: value.band === 0 || value.gradeStep <= 1, big: value.band === 0 || value.gradeStep <= 2,
      });
    }
    if (action === 'submit' && req.method === 'POST') {
      need(isStudent, '원생 전용 기능입니다.', 403);
      const { row, value } = await findAssignment(body.assignmentId);
      need(value.memberId === user.id, '본인에게 배정된 테스트만 제출할 수 있습니다.', 403);
      // 응답 유실 후 재제출해도 이미 저장된 결과를 반환한다.
      if (value.status === 'COMPLETED' && value.summary && value.resultId) {
        const { correct, total } = value.summary;
        return res.json({ ok: true, correct, total, score: Math.round((correct / total) * 100) });
      }
      need(value.status === 'IN_PROGRESS' && Array.isArray(value.itemIds), '진행 중인 테스트가 아닙니다.', 409);
      const answers = Array.isArray(body.answers) ? body.answers : [];
      need(answers.length === value.itemIds.length, '모든 문항에 답해 주세요.');
      const bank = await readBank();
      const responses: ItemResponse[] = [];
      for (let i = 0; i < value.itemIds.length; i++) {
        const item = bank.items.find((it) => it.id === value.itemIds[i]);
        // 푸는 도중 마스터가 문항을 삭제한 경우: 점수 오류를 막기 위해 처음부터 다시 출제
        if (!item) { await saveAssignment(row, { ...value, status: 'PENDING', itemIds: [] }); need(false, '문항이 변경되어 테스트를 처음부터 다시 시작해야 합니다.', 409); }
        const a = answers.find((x: any) => x && x.itemId === item.id);
        const choice = a?.choice;
        need(Number.isInteger(choice) && choice >= 0 && choice < item.choices.length, '선택한 답을 확인해 주세요.');
        responses.push({ itemId: item.id, area: item.area, choice, correct: choice === item.answer, ms: Math.min(3600000, Math.max(0, Math.round(Number(a?.ms) || 0))) });
      }
      const result = summarize(value.band, value.gradeStep, responses, value.itemIds.length);
      const finishedAt = new Date().toISOString();
      const resultId = randomUUID();
      // 완료 상태와 결과 원본을 함께 저장해 결과지 누락을 방지한다.
      const summary = { level: result.level, correct: result.correct, total: result.total, category: result.category, band: value.band, gradeStep: value.gradeStep, finishedAt };
      await prisma.$transaction(async (tx) => {
        await saveAssignment(row, { ...value, status: 'COMPLETED', resultId, completedAt: finishedAt, summary }, tx);
        await tx.portalSetting.create({
          data: {
            key: 'literacy_result:' + resultId, scope: resultScope(user.academyId),
            value: {
              id: resultId, assignmentId: value.id, academyId: user.academyId, memberId: user.id,
              student: { name: user.name, username: user.username, gradeStep: value.gradeStep, classGroup: user.classGroup?.name || '' },
              band: value.band, startedAt: value.startedAt || finishedAt, finishedAt, itemBankVersion: bank.version, responses, result,
            } as any,
          },
        });
      });
      return res.json({ ok: true, correct: result.correct, total: result.total, score: Math.round((result.correct / result.total) * 100) });
    }

    // ================= 마스터: 문항 은행 =================
    if (action === 'bank' && req.method === 'GET') {
      master(user);
      const bank = await readBank();
      return res.json({ version: bank.version, revision: bank.revision, isDefault: bank.isDefault, items: bank.items, coverage: bankCoverage(bank.items), perArea: PER_AREA });
    }
    if (action === 'bank_save' && req.method === 'POST') {
      master(user);
      const bank = await readBank();
      const items = [...bank.items];
      const idx = body.item?.id ? items.findIndex((it) => it.id === body.item.id) : -1;
      need(!body.item?.id || idx >= 0, '수정할 문항을 찾을 수 없습니다.', 404);
      const next = validateItem(body.item, idx >= 0 ? items[idx] : undefined);
      if (idx >= 0) items[idx] = next;
      else {
        // 새 문항 ID: 기존 문항과 겹치지 않는 사용자 추가 번호(U + 4자리)
        const used = new Set(items.map((i) => i.id));
        let n = 1; let id = '';
        do { id = `B${next.band}-${AREA_CODE[next.area]}-U${String(n++).padStart(4, '0')}`; } while (used.has(id));
        next.id = id; items.push(next);
      }
      assertCoverage(items);
      await writeBank(items, Number(body.revision) || 0);
      return res.json({ ok: true, id: next.id });
    }
    if (action === 'bank_delete' && req.method === 'POST') {
      master(user);
      const bank = await readBank();
      need(bank.items.some((it) => it.id === body.id), '삭제할 문항을 찾을 수 없습니다.', 404);
      const items = bank.items.filter((it) => it.id !== body.id);
      assertCoverage(items);
      await writeBank(items, Number(body.revision) || 0);
      return res.json({ ok: true });
    }
    if (action === 'bank_reset' && req.method === 'POST') {
      master(user);
      await prisma.portalSetting.deleteMany({ where: { key: BANK_KEY } });
      return res.json({ ok: true });
    }

    // ================= 원장/선생님 =================
    staff(user);
    const academyId = await academyScope(user, req.query.academy);

    if (action === 'assignments' && req.method === 'GET') {
      return res.json({ items: await listAssignments(academyId) });
    }
    // 배정 화면용 원생 목록: 등록 학년으로 추천 검사지(밴드)를 계산해 내려준다 (원장이 화면에서 조정 가능)
    if (action === 'students' && req.method === 'GET') {
      const [members, current] = await Promise.all([
        prisma.member.findMany({ where: { academyId, role: 'STUDENT', status: 'APPROVED' }, include: { classGroup: true }, orderBy: { name: 'asc' } }),
        listAssignments(academyId),
      ]);
      return res.json({
        items: members.map((m) => {
          const step = parseGradeStep(m.grade) as GradeStep | null;
          return {
            id: m.id, name: m.name, username: m.username, grade: m.grade || '', classGroup: m.classGroup?.name || '미지정',
            gradeStep: step, band: step === null ? null : BAND_OF_GRADE[step],
            hasActive: current.some((a) => a.memberId === m.id && ACTIVE.includes(a.status)),
          };
        }),
      });
    }
    if (action === 'assign' && req.method === 'POST') {
      const entries = Array.isArray(body.items) ? body.items.slice(0, 200) : [];
      need(entries.length > 0, '테스트를 부여할 원생을 선택해 주세요.');
      const dueDate = clean(body.dueDate, 10);
      need(!dueDate || /^\d{4}-\d{2}-\d{2}$/.test(dueDate), '마감일 형식을 확인해 주세요.');
      const memo = clean(body.memo, 200);
      const members = await prisma.member.findMany({
        where: { id: { in: entries.map((e: any) => String(e.memberId)) }, academyId, role: 'STUDENT', status: 'APPROVED' },
        include: { classGroup: true },
      });
      const current = await listAssignments(academyId);
      const created: string[] = []; const skipped: string[] = [];
      for (const e of entries) {
        const m = members.find((x) => x.id === e.memberId);
        if (!m) { skipped.push('(알 수 없는 원생)'); continue; }
        const band = Number(e.band); const gradeStep = Number(e.gradeStep);
        need([0, 1, 2].includes(band) && [0, 1, 2, 3, 4].includes(gradeStep), `${m.name}: 검사지 밴드와 학년을 확인해 주세요.`);
        // 이미 진행 대기 중인 테스트가 있으면 중복 배정하지 않는다
        if (current.some((a) => a.memberId === m.id && ACTIVE.includes(a.status))) { skipped.push(m.name + '(이미 배정됨)'); continue; }
        const id = randomUUID();
        await prisma.portalSetting.create({
          data: {
            key: 'literacy_assign:' + id, scope: assignScope(academyId),
            value: {
              id, academyId, memberId: m.id, studentName: m.name, username: m.username, classGroup: m.classGroup?.name || '미지정',
              gradeStep, band, status: 'PENDING', assignedAt: new Date().toISOString(), dueDate, memo, assignedBy: user.name,
            } as any,
          },
        });
        created.push(m.name);
        current.push({ memberId: m.id, status: 'PENDING' });
      }
      return res.json({ ok: true, created, skipped });
    }
    if (action === 'cancel' && req.method === 'POST') {
      const { row, value } = await findAssignment(body.id);
      need(value.academyId === academyId, '권한이 없습니다.', 403);
      need(ACTIVE.includes(value.status), '진행 대기 중인 테스트만 취소할 수 있습니다.', 409);
      await saveAssignment(row, { ...value, status: 'CANCELLED', cancelledAt: new Date().toISOString() });
      return res.json({ ok: true });
    }
    if ((action === 'result' || action === 'share_link' || action === 'kakao') && ['GET', 'POST'].includes(req.method)) {
      const id = String(req.query.id || body.id || '');
      need(/^[\w-]{8,64}$/.test(id), '결과지를 확인해 주세요.');
      const row = await prisma.portalSetting.findUnique({ where: { key: 'literacy_result:' + id } });
      need(row, '결과지를 찾을 수 없습니다.', 404);
      const record = row.value as any;
      need(record.academyId === academyId, '권한이 없습니다.', 403);
      if (action === 'result') {
        const history = historyOf(await listAssignments(academyId, record.memberId), record.memberId);
        return res.json({ record, history });
      }
      if (action === 'share_link') return res.json({ url: shareUrl(req, id) });
      return sendKakao(req, res, academyId, record, !!body.preview, String(body.fingerprint || ''));
    }
    return res.status(404).json({ error: '지원하지 않는 요청입니다.' });
  } catch (error) { return failure(res, error); }
}

/** 공개/전달용 결과지에서는 문항별 응답 원본을 빼고 결과 요약만 내보낸다 */
function publicRecord(record: any) {
  const minutes = Math.max(1, Math.round((record.responses || []).reduce((s: number, r: any) => s + (r.ms || 0), 0) / 60000));
  return { id: record.id, student: record.student, band: record.band, finishedAt: record.finishedAt, result: record.result, minutes };
}

// 24시간 형식 날짜시간 포맷터: "2026년 11월 09일 14:30"
function formatKstDateTime24(dateInput: any): string {
  if (!dateInput) return '';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return String(dateInput);
  const kst = new Date(d.getTime() + 9 * 3600000);
  const yyyy = kst.getUTCFullYear();
  const mm = String(kst.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(kst.getUTCDate()).padStart(2, '0');
  const hh = String(kst.getUTCHours()).padStart(2, '0');
  const min = String(kst.getUTCMinutes()).padStart(2, '0');
  return `${yyyy}년 ${mm}월 ${dd}일 ${hh}:${min}`;
}

const DEFAULT_LITERACY_TEMPLATE =
  '#{학생명} 학생이\n#{진단일}에 문해력 진단을 완료했어요!\n\n우리 아이의 글 읽기와 이해 능력은 어느 정도일까요?\n진단 결과를 확인해보세요~\n\n[진단 결과 확인]';

/** 학부모 알림톡: 결과지 링크가 담긴 승인 템플릿으로 발송 (미리보기 → 확인 후 발송, 중복 발송 방지) */
async function sendKakao(req: any, res: any, academyId: string, record: any, preview: boolean, fingerprintIn: string) {
  const apiKey = process.env.ALIGO_API_KEY, userId = process.env.ALIGO_USER_ID, senderKey = process.env.ALIGO_SENDER_KEY, sender = process.env.ALIGO_SENDER;
  const tplCode = process.env.ALIGO_LITERACY_TEMPLATE_CODE || 'TT_4292';
  const tpl = process.env.ALIGO_LITERACY_TEMPLATE || DEFAULT_LITERACY_TEMPLATE;
  need(apiKey && userId && senderKey && sender,
    '문해력 결과지 알림톡 설정(ALIGO_API_KEY 등)이 아직 완료되지 않았습니다. 우선 "링크 복사"로 학부모에게 공유해 주세요.', 503);
  const member = await prisma.member.findFirst({ where: { id: record.memberId, academyId } });
  need(member, '원생 정보를 찾을 수 없습니다.', 404);
  need(member.reportYn && member.parentPhone, '보호자 연락처와 리포트 발송 동의를 확인해 주세요.');
  const phone = member.parentPhone!.replace(/\D/g, '');
  need(/^0\d{8,10}$/.test(phone), '보호자 연락처 형식을 확인해 주세요.');
  const targetUrl = shareUrl(req, record.id);
  const diagDate = formatKstDateTime24(record.finishedAt);
  const subs: Record<string, string> = { 학생명: member.name, 진단일: diagDate, 레벨: String(record.result.level), 링크: targetUrl };
  const message = tpl.replace(/#\{([^}]+)\}/g, (_, key) => subs[key] || '');
  need(message.length <= 1000, '알림톡 내용이 1,000자를 초과합니다.');
  const buttonJson = JSON.stringify({
    button: [
      {
        name: '진단 결과 확인',
        linkType: 'WL',
        linkTypeName: '웹링크',
        linkM: targetUrl,
        linkP: targetUrl,
      },
    ],
  });
  const fingerprint = createHash('sha256').update(JSON.stringify([record.id, phone, message, tplCode])).digest('hex');
  if (preview) return res.json({ message, recipient: phone, name: member.parentName || member.name + ' 보호자', targetUrl, fingerprint });
  need(fingerprint === fingerprintIn, '발송 전 최신 결과지 내용을 확인해 주세요.', 409);
  const logId = 'literacy_' + fingerprint;
  const existing = await prisma.aligoDispatchLog.findUnique({ where: { id: logId } });
  if (existing) return res.json({ status: existing.status, duplicate: true });
  // 외부 요청 전에 발송 기록을 먼저 남겨, 더블클릭이나 응답 유실로 인한 중복 발송을 막는다
  await prisma.aligoDispatchLog.create({ data: { id: logId, academyId, recipientName: member.parentName || member.name, recipientPhone: phone, templateCode: tplCode, message, status: 'SENDING', cost: 0 } });
  try {
    const fields = new URLSearchParams({
      apikey: apiKey!,
      userid: userId!,
      senderkey: senderKey!,
      tpl_code: tplCode,
      sender: sender!,
      receiver_1: phone,
      recvname_1: member.name,
      subject_1: '문해력 진단 결과지',
      message_1: message,
      button_1: buttonJson,
    });
    const options: any = { method: 'POST', body: fields, signal: AbortSignal.timeout(12000) };
    if (proxyDispatcher) options.dispatcher = proxyDispatcher;
    const response = await fetch('https://kakaoapi.aligo.in/akv10/alimtalk/send/', options);
    const result: any = await response.json();
    const status = response.ok && Number(result.code) === 0 ? 'ACCEPTED' : 'FAILED';
    await prisma.aligoDispatchLog.update({ where: { id: logId }, data: { status } });
    return res.json({ status });
  } catch {
    await prisma.aligoDispatchLog.update({ where: { id: logId }, data: { status: 'UNKNOWN' } });
    return res.status(502).json({ error: '발송 결과를 확인하지 못했습니다. 중복 발송을 막기 위해 재전송하지 않았습니다. 카톡 발송 내역에서 확인해 주세요.' });
  }
}
