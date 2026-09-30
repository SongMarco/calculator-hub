/**
 * 연말정산 간이 미리보기 (근로소득자용, 2026년 기준)
 *
 * 계산 흐름:
 *  1. 근로소득금액 = 총급여 − 근로소득공제
 *  2. 과세표준 = 근로소득금액 − 인적공제(1인당 150만원)
 *  3. 산출세액 = 기본세율표 적용 (income-tax.js 재사용)
 *  4. 세액공제 = 근로소득세액공제 + 연금계좌세액공제
 *  5. 결정세액 = 산출세액 − 세액공제
 *  6. 차감징수세액 = 결정세액 − 기납부세액 (음수면 환급)
 *
 * 근로소득공제:
 *  500만원 이하: 70% / 1,500만원 이하: 350만원 + 40% / 4,500만원 이하: 750만원 + 15%
 *  1억원 이하: 1,450만원 + 5% / 1억원 초과: 1,750만원 + 2% (한도 2,000만원)
 *
 * 근로소득세액공제:
 *  산출세액 130만원 이하: 55% / 초과: 71.5만원 + 초과분의 30%
 *  한도: 총급여 3,300만원 이하 74만원 / 7,000만원 이하 66만원 / 초과 50만원
 *
 * 연금계좌 세액공제: 납입액(연 900만원 한도)의 12% (총급여 5,500만원 이하 15%)
 *
 * 간이 계산이며 신용카드·의료비·교육비·기부금 등 다른 공제는 미반영.
 * 참고용 추정치. 실제 정산은 홈택스 미리보기로 확인 필요.
 */
import { calcIncomeTax } from './income-tax.js';

/** 근로소득공제 */
export function earnedIncomeDeduction(totalPay) {
  totalPay = Math.max(0, Math.floor(totalPay || 0));
  let d;
  if (totalPay <= 5_000_000) d = totalPay * 0.7;
  else if (totalPay <= 15_000_000) d = 3_500_000 + (totalPay - 5_000_000) * 0.4;
  else if (totalPay <= 45_000_000) d = 7_500_000 + (totalPay - 15_000_000) * 0.15;
  else if (totalPay <= 100_000_000) d = 14_500_000 + (totalPay - 45_000_000) * 0.05;
  else d = 17_500_000 + (totalPay - 100_000_000) * 0.02;
  return Math.min(Math.floor(d), 20_000_000);
}

/** 근로소득세액공제 */
export function earnedTaxCredit(totalPay, computedTax) {
  totalPay = Math.max(0, Math.floor(totalPay || 0));
  computedTax = Math.max(0, Math.floor(computedTax || 0));
  let c;
  if (computedTax <= 1_300_000) c = computedTax * 0.55;
  else c = 715_000 + (computedTax - 1_300_000) * 0.3;
  const cap = totalPay <= 33_000_000 ? 740_000 : totalPay <= 70_000_000 ? 660_000 : 500_000;
  return Math.min(Math.floor(c), cap);
}

/** 연금계좌 세액공제 */
export function pensionTaxCredit(totalPay, contribution) {
  totalPay = Math.max(0, Math.floor(totalPay || 0));
  contribution = Math.max(0, Math.floor(contribution || 0));
  const rate = totalPay <= 55_000_000 ? 0.15 : 0.12;
  return Math.floor(Math.min(contribution, 9_000_000) * rate);
}

/**
 * @param {object} opts
 * @param {number} opts.totalPay 연간 총급여 (원)
 * @param {number} opts.dependents 인적공제 대상 인원 (본인 포함)
 * @param {number} opts.pensionContribution 연금계좌 연간 납입액 (원)
 * @param {number} opts.prepaid 기납부세액 (원)
 */
export function calcYearEndTax({ totalPay, dependents = 1, pensionContribution = 0, prepaid = 0 }) {
  totalPay = Math.max(0, Math.floor(totalPay || 0));
  dependents = Math.max(1, Math.floor(dependents || 1));
  prepaid = Math.max(0, Math.floor(prepaid || 0));

  const incomeDeduction = earnedIncomeDeduction(totalPay);
  const personalDeduction = dependents * 1_500_000;
  const earnedIncome = totalPay - incomeDeduction;
  const taxBase = Math.max(0, earnedIncome - personalDeduction);
  const computedTax = calcIncomeTax(taxBase);
  const creditEarned = earnedTaxCredit(totalPay, computedTax);
  const creditPension = pensionTaxCredit(totalPay, pensionContribution);
  const finalTax = Math.max(0, computedTax - creditEarned - creditPension);
  const balance = finalTax - prepaid; // 양수: 추가 납부, 음수: 환급

  return {
    totalPay, dependents, prepaid,
    incomeDeduction, personalDeduction, earnedIncome, taxBase,
    computedTax, creditEarned, creditPension, finalTax, balance,
    isRefund: balance < 0,
  };
}
