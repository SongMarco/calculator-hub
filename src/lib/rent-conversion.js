/**
 * 전월세 전환율 계산 (2026년 기준)
 *
 * 공식:
 *  - 전세 → 월세: 월세 = 보증금 감액분 × 전환율 ÷ 12
 *  - 월세 → 전세: 보증금 증액분 = 월세 × 12 ÷ 전환율
 *  - 법정 상한 (주택임대차보호법 시행령 제9조):
 *    min(연 10%, 한국은행 기준금리 + 2%p)
 *    ※ 이미 살고 있는 집의 계약 기간 중·갱신 시 보증금↔월세 전환에 적용.
 *       신규 계약은 당사자 합의 금액이 우선.
 *
 * 기준금리는 변동되므로 사용자 입력값 사용 (기본값 2026년 9월 기준 3.00%).
 * 참고용 추정치.
 */

/** 법정 전월세전환율 상한 (%) */
export function legalMaxRate(baseRatePct) {
  const b = Math.max(0, Number(baseRatePct) || 0);
  return Math.min(10, b + 2);
}

/**
 * @param {object} opts
 * @param {number} opts.depositDrop 보증금 감액분 (원)
 * @param {number} opts.rate 적용 전환율 (%)
 * @returns {number} 월세 (원)
 */
export function depositToMonthly({ depositDrop, rate }) {
  depositDrop = Math.max(0, Number(depositDrop) || 0);
  rate = Math.max(0, Number(rate) || 0);
  return Math.floor((depositDrop * rate) / 100 / 12);
}

/**
 * @param {object} opts
 * @param {number} opts.monthly 월세 (원)
 * @param {number} opts.rate 적용 전환율 (%)
 * @returns {number} 보증금 증액분 (원)
 */
export function monthlyToDeposit({ monthly, rate }) {
  monthly = Math.max(0, Number(monthly) || 0);
  rate = Math.max(0, Number(rate) || 0);
  if (rate === 0) return 0;
  return Math.floor(((monthly * 12) / rate) * 100);
}
