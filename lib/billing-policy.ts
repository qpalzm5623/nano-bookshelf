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
  const supply = productCode === 'KAKAO' ? amount / 5500 * 5000 : Math.round(amount / 1.1);
  return { supply, vat: amount - supply, credit: productCode === 'KAKAO' ? supply * 10 : 0 };
}
// 결과가 확정되지 않으면 과금 상태를 유지합니다. 대체문자 접수는 환급 대상이 아닙니다.
export function deliveryOutcome(row: any): 'SUCCESS' | 'FAILED' | 'SMS_FALLBACK' | null {
  if (!row || String(row.msgid || '').startsWith('Q')) return null;
  if (Number(row.smid) > 0) return 'SMS_FALLBACK';
  if (!row.rsltdate || String(row.rsltdate).startsWith('0000') || row.rslt == null || row.rslt === '' || !row.rslt_message) return null;
  if (/^(정상|성공|전송성공|전송 성공|정상처리|정상 처리|정상발송|정상 발송)$/.test(String(row.rslt_message).trim())) return 'SUCCESS';
  // 최종 실패 코드가 문서화된 경우에만 환급합니다. 미확인 코드는 확인 대기 유지.
  if (['U'].includes(String(row.rslt)) || /실패|불가|불일치|일치하지|차단|미등록|존재하지|유효하지|만료|초과/.test(String(row.rslt_message))) return 'FAILED';
  return null;
}
