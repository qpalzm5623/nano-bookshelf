import { timingSafeEqual } from 'node:crypto';
import { ensureAnnualGradePromotion } from '../lib/grade-promotion';
import { failure } from '../lib/portal-http';

// Vercel Cron (0 15 31 12 * UTC = 매년 1월 1일 00:00 KST) 자동 학년 진급 엔드포인트
export default async function handler(req: any, res: any) {
  res.setHeader('Cache-Control', 'no-store');
  const secret = process.env.CRON_SECRET;
  const actual = Buffer.from(String(req.headers.authorization || ''));
  const expected = Buffer.from('Bearer ' + (secret || ''));
  if (req.method !== 'GET' || !secret || actual.length !== expected.length || !timingSafeEqual(actual, expected)) {
    return res.status(401).json({ error: '인증이 필요합니다.' });
  }

  try {
    const started = Date.now();
    const result = await ensureAnnualGradePromotion({ bypassCache: true });
    console.info('[GradePromotion] cron_done', { ...result, elapsedMs: Date.now() - started });
    return res.json(result);
  } catch (error: any) {
    console.error('[GradePromotion] cron_error', { error: error?.message || String(error) });
    return failure(res, error);
  }
}
