/**
 * 2026년 종합소득세율 (2025년 귀속분, 2026년 5월 신고 기준)
 * 과세표준 구간별 세율 + 누진공제
 */
const BRACKETS = [
  { limit: 14_000_000, rate: 0.06, deduction: 0 },
  { limit: 50_000_000, rate: 0.15, deduction: 1_260_000 },
  { limit: 88_000_000, rate: 0.24, deduction: 5_760_000 },
  { limit: 150_000_000, rate: 0.35, deduction: 15_440_000 },
  { limit: 300_000_000, rate: 0.38, deduction: 19_940_000 },
  { limit: 500_000_000, rate: 0.40, deduction: 25_940_000 },
  { limit: 1_000_000_000, rate: 0.42, deduction: 35_940_000 },
  { limit: Infinity, rate: 0.45, deduction: 65_940_000 },
];

/**
 * 종합소득세 산출세액 (간이 계산, 세액공제 미반영)
 * @param {number} taxBase 과세표준 (원)
 * @returns {number} 산출세액 (원, 절사)
 */
export function calcIncomeTax(taxBase) {
  taxBase = Math.max(0, Math.floor(taxBase || 0));
  if (taxBase === 0) return 0;
  const b = BRACKETS.find((x) => taxBase <= x.limit);
  return Math.max(0, Math.floor(taxBase * b.rate - b.deduction));
}

export const INCOME_TAX_BRACKETS = BRACKETS;
