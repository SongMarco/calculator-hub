/**
 * 프리랜서 3.3% 환급금 계산 (2026년 5월 종합소득세 신고 기준)
 *
 * 원천징수(사업소득 3.3%)로 미리 낸 세금과 실제 종합소득세 결정세액을 비교해
 * 환급 예상액을 계산한다. 세액공제는 반영하지 않은 간이 계산.
 *
 * @param {object} opts
 * @param {number} opts.income 연간 사업소득 지급액 총액 (세전, 원)
 * @param {number} opts.expenses 필요경비 (원)
 * @param {number} opts.prepaid 기납부세액 (원, 기본: income × 3.3%)
 * @param {number} opts.personalDeduction 인적공제 (원, 기본: 본인 150만원)
 */
import { calcIncomeTax } from './income-tax.js';

export function calcRefund33({ income, expenses, prepaid, personalDeduction = 1_500_000 }) {
  income = Math.max(0, Math.floor(income || 0));
  expenses = Math.max(0, Math.floor(expenses || 0));
  prepaid = prepaid == null ? Math.floor(income * 0.033) : Math.max(0, Math.floor(prepaid));
  personalDeduction = Math.max(0, Math.floor(personalDeduction || 0));

  const taxableIncome = Math.max(0, income - expenses); // 소득금액
  const taxBase = Math.max(0, taxableIncome - personalDeduction); // 과세표준
  const assessed = calcIncomeTax(taxBase); // 산출세액 (결정세액 간주)
  const refund = prepaid - assessed; // +면 환급, -면 추가 납부

  return {
    income,
    expenses,
    prepaid,
    personalDeduction,
    taxableIncome,
    taxBase,
    assessed,
    refund,
    isRefund: refund > 0,
  };
}
