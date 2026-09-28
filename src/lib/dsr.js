/**
 * DSR(총부채원리금상환비율) 및 스트레스 DSR 계산
 *
 * DSR = (모든 대출의 연간 원리금 상환액 합계) ÷ 연소득 × 100
 *  - 은행권 기준 40% 이내 (총대출 1억원 초과 차주)
 *  - 스트레스 DSR: 한도 산정 시 실제 금리에 스트레스 금리를 가산
 *    (2026년 하반기 기준: 수도권·규제지역 주담대 +3.0%p, 3단계 100% 반영)
 *
 * 원리금균등상환 월 상환액 = P × r(1+r)^n / ((1+r)^n − 1)
 * 참고용 추정치. 실제 대출 한도·승인 여부는 금융기관 심사 기준에 따름.
 */

export const STRESS_RATE_METRO_MORTGAGE = 0.03; // 3.0%p
export const DSR_LIMIT_BANK = 40; // 은행권 DSR 한도 (%)

/** 원리금균등상환 월 상환액 */
export function monthlyPayment(principal, annualRate, years) {
  principal = Math.max(0, principal || 0);
  const n = Math.max(1, Math.round((years || 0) * 12));
  const r = (annualRate || 0) / 12;
  if (r === 0) return principal / n;
  const f = Math.pow(1 + r, n);
  return (principal * r * f) / (f - 1);
}

/**
 * @param {object} opts
 * @param {number} opts.annualIncome 연소득 (세전, 원)
 * @param {number} [opts.existingAnnualPayments=0] 기존 대출 연간 원리금 합계 (원)
 * @param {object} opts.newLoan 신규 대출 조건
 * @param {number} opts.newLoan.amount 대출 원금 (원)
 * @param {number} opts.newLoan.rate 연 금리 (소수, 예: 0.04)
 * @param {number} opts.newLoan.years 만기 (년)
 * @param {string} [opts.newLoan.type='mortgage'] 'mortgage' | 'credit' | 'jeonse'
 * @param {string} [opts.newLoan.region='metro'] 'metro' | 'local'
 * @param {string} [opts.newLoan.rateType='variable'] 'variable' | 'fixed' (고정금리 5년 이상이면 스트레스 미적용)
 */
export function calcDSR({ annualIncome, existingAnnualPayments = 0, newLoan }) {
  annualIncome = Math.max(0, annualIncome || 0);
  existingAnnualPayments = Math.max(0, existingAnnualPayments || 0);
  const { amount, rate, years, type = 'mortgage', region = 'metro', rateType = 'variable' } = newLoan || {};

  const newMonthly = monthlyPayment(amount, rate, years);
  const newAnnual = newMonthly * 12;
  const totalAnnual = existingAnnualPayments + newAnnual;
  const dsr = annualIncome > 0 ? (totalAnnual / annualIncome) * 100 : 0;

  // 스트레스 DSR: 수도권 주담대(고정 5년 이상 제외)에 스트레스 금리 가산
  let stressRate = rate;
  let stressApplied = false;
  if (type === 'mortgage' && region !== 'local' && rateType !== 'fixed') {
    stressRate = rate + STRESS_RATE_METRO_MORTGAGE;
    stressApplied = true;
  }
  const stressMonthly = monthlyPayment(amount, stressRate, years);
  const stressAnnual = stressMonthly * 12;
  const stressTotalAnnual = existingAnnualPayments + stressAnnual;
  const stressDsr = annualIncome > 0 ? (stressTotalAnnual / annualIncome) * 100 : 0;

  return {
    annualIncome,
    existingAnnualPayments: Math.round(existingAnnualPayments),
    newMonthly: Math.round(newMonthly),
    newAnnual: Math.round(newAnnual),
    totalAnnual: Math.round(totalAnnual),
    dsr: Math.round(dsr * 100) / 100,
    stressApplied,
    stressRate: Math.round(stressRate * 10000) / 100, // % 단위
    stressMonthly: Math.round(stressMonthly),
    stressDsr: Math.round(stressDsr * 100) / 100,
    withinLimit: dsr <= DSR_LIMIT_BANK,
    stressWithinLimit: stressDsr <= DSR_LIMIT_BANK,
    limit: DSR_LIMIT_BANK,
  };
}
