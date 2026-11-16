export const KAKAO_UNIT = 85; // 0.1원 단위
export const PRODUCTS = [
  { code: 'BASIC', name: '베이직 (Basic)', price: 88000, slots: 25 },
  { code: 'STANDARD', name: '스탠다드 (Standard)', price: 132000, slots: 50 },
  { code: 'PREMIUM', name: '프리미엄 (Premium)', price: 198000, slots: 100 },
  { code: 'ROYAL', name: '로열 (Royal)', price: 330000, slots: 0 },
  { code: 'KAKAO', name: '카카오톡 알림', price: 5500, slots: 0 },
];
export function paymentAmounts(amount: number, productCode: string) {
  if (!Number.isSafeInteger(amount) || amount <= 0 || amount > 100000000) throw new Error('결제 금액을 확인해 주세요.');
  if (productCode === 'KAKAO' && amount % 5500 !== 0) throw new Error('카카오톡 알림은 5,500원 단위로 구매할 수 있습니다.');
  const supply = Math.round(amount / 1.1);
  return { supply, vat: amount - supply, credit: productCode === 'KAKAO' ? amount * 10 : 0 };
}
// 결과가 확정되지 않으면 과금 상태를 유지합니다. 대체문자 접수는 환급 대상이 아닙니다.
export function deliveryOutcome(row: any): 'SUCCESS' | 'FAILED' | 'SMS_FALLBACK' | null {
  if (!row || String(row.msgid || '').startsWith('Q')) return null;
  if (Number(row.smid) > 0) return 'SMS_FALLBACK';
  if (!row.rsltdate || String(row.rsltdate).startsWith('0000') || row.rslt == null || row.rslt === '' || !row.rslt_message) return null;
  const msg = String(row.rslt_message).trim();
  const code = String(row.rslt).trim().toUpperCase();
  const isFailureText = /실패|불가|불일치|일치하지|차단|미등록|존재하지|유효하지|만료|초과|오류|거부|거절|미사용|미설치|해지|중단|제한|등록되지|허용되지/.test(msg);
  if (!isFailureText && (/^(정상|성공|전송\s*성공|정상\s*처리|정상\s*발송|전송\s*완료)/.test(msg) || code === 'Y')) return 'SUCCESS';
  // 최종 실패 코드가 문서화된 경우에만 환급합니다. 미확인 코드는 확인 대기 유지.
  if (['U', 'N', 'E', 'F'].includes(code) || isFailureText) return 'FAILED';
  return null;
}

/** 알리고 상세/목록 응답이 아직 최종 확정(SUCCESS/FAILED)되지 않았을 때 사용자·로그용 상태 요약을 생성합니다. */
export function describePendingAligoRow(row?: any, summary?: any): string | null {
  if (summary && Number(summary.fcnt) > 0 && Number(summary.scnt || 0) === 0) {
    return `알리고 발송 실패(수신 오류 · fcnt:${summary.fcnt}${summary.reserve_state ? ' · ' + summary.reserve_state : ''})`;
  }
  if (row) {
    const msgid = String(row.msgid || '').trim();
    const rowStatus = row.status == null ? '' : String(row.status).trim();
    const sentdate = String(row.sentdate || '').trim();
    const rsltMsg = String(row.rslt_message || '').trim();
    if (rsltMsg) return rsltMsg.slice(0, 120);
    if (msgid.startsWith('Q')) {
      return rowStatus === '2'
        ? '카카오 수신번호 형식 확인 필요 (큐 대기 · status:2)'
        : '알리고 큐 발송 대기 중 (잠시 후 자동 갱신)';
    }
    if (rowStatus === '2') return '카카오 수신번호 인식 불가 (status:2)';
    if (!sentdate || sentdate.startsWith('0000')) {
      return '알리고 발송 처리 대기 중' + (summary?.reserve_state ? ` (${summary.reserve_state})` : '');
    }
    return '카카오/통신사 최종 결과 회신 대기 중';
  }
  if (summary?.reserve_state) {
    return `알리고 ${String(summary.reserve_state)}${summary.fcnt ? ` (실패 ${summary.fcnt})` : ''}`;
  }
  return '알리고 전송 상세 내역 반영 대기 중';
}
