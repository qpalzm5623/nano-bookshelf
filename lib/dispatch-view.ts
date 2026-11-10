// 발송 기록의 고정 ID 접두사와 운영 템플릿 코드를 화면용 분류로 변환합니다.
export function dispatchTemplate(id: string, code: string) {
  if (id.startsWith('quiz_') || code === (process.env.ALIGO_TEMPLATE_CODE || 'TT_4291')) return { type: 'QUIZ', typeName: '학습 리포트' };
  if (id.startsWith('pf_') || code === (process.env.ALIGO_PORTFOLIO_TEMPLATE_CODE || 'TT_4290')) return { type: 'PORTFOLIO', typeName: '포트폴리오' };
  if (id.startsWith('lit_') || code === (process.env.ALIGO_LITERACY_TEMPLATE_CODE || 'TT_4292')) return { type: 'LITERACY', typeName: '문해력 테스트' };
  return { type: code, typeName: code };
}

export function dispatchDate(date: Date) {
  return new Date(date.getTime() + 9 * 3600000).toISOString().replace('T', ' ').slice(0, 19);
}
