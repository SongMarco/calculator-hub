/**
 * 퇴직금 계산 (세전 → 퇴직소득세 → 세후 실수령액)
 *
 * 계산 방식:
 *  1. 1일 평균임금 = (퇴직 전 3개월 임금총액 + 연간상여금×3/12 + 연차수당×3/12) ÷ 3개월 총일수
 *  2. 퇴직금(세전) = 1일 평균임금 × 30일 × (재직일수 ÷ 365)
 *  3. 퇴직소득세 (연평균과세):
 *     - 근속연수공제 → 과세대상 퇴직소득금액
 *     - 환산급여 = 과세대상 ÷ 근속연수 × 12 → 환산급여공제 → 과세표준
 *     - 기본세율 적용 → 산출세액 ÷ 12 × 근속연수 = 퇴직소득세
 *     - 지방소득세 = 퇴직소득세의 10%
 *
 * 근속연수는 세법상 월 단위(1개월 미만은 1개월로)로 계산.
 * 참고용 추정치. 실제 지급액은 회사 취업규칙·단체협약이 법정 기준보다 우선할 수 있음.
 */
import { baseTax } from './salary.js';

const M = 1_000_000;

/** 근속연수공제 */
export function seniorityDeduction(years) {
  if (years <= 5) return 1 * M * years;
  if (years <= 10) return 5 * M + 2 * M * (years - 5);
  if (years <= 20) return 15 * M + 3 * M * (years - 10);
  return 45 * M + 5 * M * (years - 20);
}

/** 환산급여공제 */
export function convertedSalaryDeduction(converted) {
  if (converted <= 8 * M) return converted;
  if (converted <= 70 * M) return 8 * M + (converted - 8 * M) * 0.6;
  if (converted <= 100 * M) return 45.2 * M + (converted - 70 * M) * 0.55;
  return 61.7 * M + (converted - 100 * M) * 0.45;
}

/**
 * @param {object} opts
 * @param {number} opts.wages3mo 퇴직 전 3개월 임금총액 (세전, 원)
 * @param {number} opts.days3mo 3개월 총일수 (달력일수)
 * @param {number} [opts.bonusAnnual=0] 연간 상여금 총액 (원)
 * @param {number} [opts.leavePay=0] 미사용 연차수당 (원)
 * @param {number} opts.tenureDays 재직일수
 */
export function calcSeverance({ wages3mo, days3mo, bonusAnnual = 0, leavePay = 0, tenureDays }) {
  wages3mo = Math.max(0, wages3mo || 0);
  days3mo = Math.max(1, Math.floor(days3mo || 1));
  bonusAnnual = Math.max(0, bonusAnnual || 0);
  leavePay = Math.max(0, leavePay || 0);
  tenureDays = Math.max(0, Math.floor(tenureDays || 0));

  const avgDaily = (wages3mo + (bonusAnnual * 3) / 12 + (leavePay * 3) / 12) / days3mo;
  const years = tenureDays / 365;
  const gross = avgDaily * 30 * years;

  // 세법상 근속연수 (월 단위, 1개월 미만은 1개월)
  const months = Math.max(1, Math.ceil(tenureDays / 30));
  const taxYears = months / 12;

  const deduction = seniorityDeduction(taxYears);
  const taxable = Math.max(0, gross - deduction);
  const converted = (taxable / taxYears) * 12;
  const convertedDeduction = convertedSalaryDeduction(converted);
  const taxBase = Math.max(0, converted - convertedDeduction);
  const grossTax = baseTax(taxBase);
  const retireTax = (grossTax / 12) * taxYears;
  const localTax = retireTax * 0.1;
  const net = gross - retireTax - localTax;

  return {
    avgDaily: Math.round(avgDaily),
    years: Math.round(years * 100) / 100,
    taxYears: Math.round(taxYears * 100) / 100,
    gross: Math.round(gross),
    seniorityDeduction: Math.round(deduction),
    convertedSalary: Math.round(converted),
    convertedDeduction: Math.round(convertedDeduction),
    taxBase: Math.round(taxBase),
    retireTax: Math.round(retireTax),
    localTax: Math.round(localTax),
    totalTax: Math.round(retireTax + localTax),
    net: Math.round(net),
  };
}
