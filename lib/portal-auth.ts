import { createHmac, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex');
  return `scrypt:${salt}:${scryptSync(password, salt, 64).toString('hex')}`;
}
export function verifyPassword(password: string, stored: string) {
  if (typeof password !== 'string' || password.length > 256) return false;
  const [type, salt, hash] = stored.split(':');
  if (type !== 'scrypt' || !/^[a-f0-9]{32}$/.test(salt || '') || !/^[a-f0-9]{128}$/.test(hash || '')) return false;
  return timingSafeEqual(scryptSync(password, salt, 64), Buffer.from(hash, 'hex'));
}
export function passwordVersion(hash: string) {
  return createHmac('sha256', getSecret()).update(hash).digest('hex');
}
function getSecret() {
  const secret = process.env.PORTAL_AUTH_SECRET || '';
  if (secret.length < 32) throw new Error('PORTAL_AUTH_SECRET must contain at least 32 characters');
  return secret;
}
export function signSession(memberId: string, hash: string, now = Date.now()) {
  const payload = Buffer.from(JSON.stringify({ sub: memberId, version: passwordVersion(hash), exp: now + 8 * 3600000 })).toString('base64url');
  return payload + '.' + createHmac('sha256', getSecret()).update(payload).digest('base64url');
}
export function readSession(token: string, now = Date.now()): { sub: string; version: string; exp: number } | null {
  try {
    const [payload, signature, extra] = token.split('.');
    if (extra || !payload || !signature) return null;
    const expected = createHmac('sha256', getSecret()).update(payload).digest();
    const actual = Buffer.from(signature, 'base64url');
    if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return null;
    const session = JSON.parse(Buffer.from(payload, 'base64url').toString());
    return typeof session.sub === 'string' && typeof session.version === 'string' && session.exp > now ? session : null;
  } catch { return null; }
}
