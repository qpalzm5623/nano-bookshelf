/**
 * 요청 헤더 및 소켓에서 실제 클라이언트 IP 주소를 안전하게 추출합니다.
 * 프록시 체인(x-forwarded-for 등)의 첫 번째 IP를 우선 사용하며 IP 형식만 허용합니다.
 */
function extractClientIp(req) {
  var headers = (req && req.headers) || {};
  var candidates = [
    headers['x-vercel-forwarded-for'],
    headers['x-real-ip'],
    headers['x-forwarded-for'],
    req && req.socket && req.socket.remoteAddress,
    req && req.connection && req.connection.remoteAddress
  ];
  for (var i = 0; i < candidates.length; i++) {
    var raw = candidates[i];
    if (!raw) continue;
    var first = (Array.isArray(raw) ? String(raw[0] || '') : String(raw))
      .split(',')[0]
      .trim()
      .replace(/^::ffff:/i, '');
    if (first && first.length <= 64 && /^[0-9a-fA-F.:]+$/.test(first)) {
      return first === '::1' ? '127.0.0.1' : first;
    }
  }
  return '';
}

module.exports = { extractClientIp: extractClientIp };
