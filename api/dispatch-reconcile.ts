import { timingSafeEqual } from 'node:crypto';
import { reconcileDispatches } from '../lib/kakao-wallet';
import { ensureAnnualGradePromotion } from '../lib/grade-promotion';
import { failure } from '../lib/portal-http';

export default async function handler(req: any, res: any) {
  res.setHeader('Cache-Control', 'no-store');
  const secret = process.env.CRON_SECRET;
  const actual = Buffer.from(String(req.headers.authorization || ''));
  const expected = Buffer.from('Bearer ' + (secret || ''));
  if (req.method !== 'GET' || !secret || actual.length !== expected.length || !timingSafeEqual(actual, expected)) return res.status(401).json({ error: '인증이 필요합니다.' });
  try {
    const started = Date.now(); const cutoff = new Date(started); let checked = 0;
    console.info('[Aligo] cron_reconcile_start', { cutoff: cutoff.toISOString() });
    // 실행 시간 내에서 순차 배치 처리하고 남은 기록은 다음 실행/화면 조회에 이어 처리합니다.
    while (Date.now() - started < 240000) {
      const count = await reconcileDispatches(undefined, undefined, cutoff);
      checked += count;
      if (count < 20) break;
    }
    // 1월 1일 전용 크론이 누락된 경우를 대비한 일일 백업 진급 점검 (이미 완료된 연도면 즉시 통과)
    const gradePromotion = await ensureAnnualGradePromotion().catch((err: any) => {
      console.error('[GradePromotion] reconcile_backup_error', { error: err?.message || String(err) });
      return null;
    });
    console.info('[Aligo] cron_reconcile_done', { checked, gradePromotion, elapsedMs: Date.now() - started });
    return res.json({ checked, gradePromotion });
  } catch(error: any) {
    console.error('[Aligo] cron_reconcile_error', { error: error?.message || String(error) });
    return failure(res, error);
  }
}
