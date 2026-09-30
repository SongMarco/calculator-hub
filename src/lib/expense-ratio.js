/**
 * 단순경비율 vs 기준경비율 비교 (2026년 5월 종합소득세 추계신고 기준)
 *
 * - 단순경비율: 수입금액 × 단순경비율 = 필요경비 (증빙 불필요)
 * - 기준경비율: 주요경비(증빙분) + 수입금액 × 기준경비율 = 필요경비
 * - 단순경비율 적용 가능: 직전연도 수입금액이 업종별 기준 미만
 *   (인적용역 3,600만원 / 전문·과학·기술·교육 2,400만원 / 도소매 등 6,000만원)
 * - 대표 업종코드 940909(2025년 귀속): 단순경비율 64.1%, 기준경비율 17.4%
 *
 * @param {object} opts
 * @param {number} opts.revenue 당해연도 수입금액 (원)
 * @param {number} opts.simpleRate 단순경비율 (%, 예: 64.1)
 * @param {number} opts.standardRate 기준경비율 (%, 예: 17.4)
 * @param {number} opts.documentedExpenses 주요경비 증빙액 (원, 기준경비율용)
 * @param {number} opts.prevRevenue 직전연도 수입금액 (원)
 * @param {number} opts.simpleThreshold 단순경비율 적용 상한 (원, 기본 36,000,000)
 */
import { calcIncomeTax } from './income-tax.js';

export function calcExpenseRatio({
  revenue,
  simpleRate,
  standardRate,
  documentedExpenses = 0,
  prevRevenue = 0,
  simpleThreshold = 36_000_000,
}) {
  revenue = Math.max(0, Math.floor(revenue || 0));
  simpleRate = Math.min(100, Math.max(0, Number(simpleRate) || 0));
  standardRate = Math.min(100, Math.max(0, Number(standardRate) || 0));
  documentedExpenses = Math.max(0, Math.floor(documentedExpenses || 0));
  prevRevenue = Math.max(0, Math.floor(prevRevenue || 0));

  const simpleEligible = prevRevenue > 0 && prevRevenue < simpleThreshold;

  // 단순경비율 추계
  const simpleExpenses = Math.round(revenue * (simpleRate / 100));
  const simpleIncome = Math.max(0, revenue - simpleExpenses);

  // 기준경비율 추계
  const standardExpenses = Math.min(
    revenue,
    documentedExpenses + Math.round(revenue * (standardRate / 100)),
  );
  const standardIncome = Math.max(0, revenue - standardExpenses);

  // 간이 세액 비교 (소득공제 150만원 가정)
  const personalDeduction = 1_500_000;
  const simpleTax = calcIncomeTax(Math.max(0, simpleIncome - personalDeduction));
  const standardTax = calcIncomeTax(Math.max(0, standardIncome - personalDeduction));

  return {
    revenue,
    simpleRate,
    standardRate,
    simpleEligible,
    simple: { expenses: simpleExpenses, income: simpleIncome, tax: simpleTax },
    standard: { expenses: standardExpenses, income: standardIncome, tax: standardTax },
    // 단순경비율이 유리한지 (소득금액 기준)
    simpleBetter: simpleIncome <= standardIncome,
  };
}
