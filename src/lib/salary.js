/**
 * 2026년 연봉 실수령액 계산 (근로소득자, 월급 기준 추정치)
 *
 * 계산 방식 (근사):
 *  1. 4대보험: 비과세액을 제외한 보수월액에 요율 적용, 10원 미만 절사
 *     - 국민연금 4.75% (기준소득월액 상한 659만원 / 하한 41만원, 2026.7~2027.6 기준)
 *     - 건강보험 3.595% (보수월액 상한 약 1억 2,773만원)
 *     - 장기요양보험: 건강보험료의 13.14%
 *     - 고용보험 0.9%
 *  2. 소득세: 연간 정산 방식 근사
 *     - 근로소득공제 → 근로소득금액 → 인적공제(150만원×부양가족수) + 4대보험료 공제
 *     - 과세표준에 기본세율(6~45%, 누진공제) 적용 → 산출세액
 *     - 근로소득세액공제 + 자녀세액공제 차감 → 결정세액 → 12로 나눔
 *     - 지방소득세 = 소득세의 10%
 *
 * 주의: 실제 월 급여에서 원천징수되는 금액은 간이세액표 기준이라 이 추정치와 다를 수 있음.
 * 참고용으로만 사용할 것.
 */

export const RATES_2026 = {
  pensionRate: 0.0475,
  pensionCap: 6_590_000, // 기준소득월액 상한 (2026.7.1~2027.6.30)
  pensionFloor: 410_000, // 기준소득월액 하한
  healthRate: 0.03595, // 7.19%의 1/2 (근로자 부담분)
  healthCap: 127_725_730, // 보수월액 상한 (월 보험료 상한 918만3480원 역산)
  longTermCareRate: 0.1314, // 건강보험료 대비
  employmentRate: 0.009,
};

/** 10원 미만 절사 (원 단위 반올림 후 절사로 부동소수점 오차 방지) */
export function cut10(n) {
  return Math.floor(Math.round(n) / 10) * 10;
}

export function calcPension(monthly) {
  const base = Math.min(Math.max(monthly, RATES_2026.pensionFloor), RATES_2026.pensionCap);
  // 하한 미만이어도 하한 기준으로 계산 (실무 기준). 단, 월급이 0이면 0.
  if (monthly <= 0) return 0;
  return cut10(base * RATES_2026.pensionRate);
}

export function calcHealth(monthly) {
  if (monthly <= 0) return 0;
  return cut10(Math.min(monthly, RATES_2026.healthCap) * RATES_2026.healthRate);
}

export function calcLongTermCare(healthFee) {
  if (healthFee <= 0) return 0;
  return cut10(healthFee * RATES_2026.longTermCareRate);
}

export function calcEmployment(monthly) {
  if (monthly <= 0) return 0;
  return cut10(monthly * RATES_2026.employmentRate);
}

/** 근로소득공제 (2026년 구간표) */
export function earnedIncomeDeduction(annual) {
  const M = 1_000_000;
  if (annual <= 5 * M) return annual * 0.7;
  if (annual <= 15 * M) return 3.5 * M + (annual - 5 * M) * 0.4;
  if (annual <= 45 * M) return 7.5 * M + (annual - 15 * M) * 0.15;
  if (annual <= 100 * M) return 12 * M + (annual - 45 * M) * 0.05;
  return Math.min(14.75 * M + (annual - 100 * M) * 0.02, 20 * M);
}

/** 과세표준 → 산출세액 (기본세율, 누진공제 적용) */
export function baseTax(base) {
  const M = 1_000_000;
  if (base <= 0) return 0;
  if (base <= 14 * M) return base * 0.06;
  if (base <= 50 * M) return base * 0.15 - 1_260_000;
  if (base <= 88 * M) return base * 0.24 - 5_760_000;
  if (base <= 150 * M) return base * 0.35 - 15_440_000;
  if (base <= 300 * M) return base * 0.38 - 19_940_000;
  if (base <= 500 * M) return base * 0.4 - 25_940_000;
  if (base <= 1000 * M) return base * 0.42 - 35_940_000;
  return base * 0.45 - 65_940_000;
}

/** 근로소득세액공제 한도 (총급여 기준) */
export function earnedTaxCreditLimit(annual) {
  const M = 1_000_000;
  if (annual <= 33 * M) return 1_000_000;
  if (annual <= 70 * M) return Math.max(1_000_000 - (annual - 33 * M) * 0.008, 750_000);
  return 750_000;
}

/**
 * 연봉 실수령액 계산
 * @param {object} opts
 * @param {number} opts.annualSalary 세전 연봉 (원)
 * @param {number} [opts.nonTaxableMonthly=200000] 월 비과세액 (식대 등, 원)
 * @param {number} [opts.dependents=1] 부양가족 수 (본인 포함)
 * @param {number} [opts.children=0] 8세 이상 20세 이하 자녀 수
 */
export function calcSalary({ annualSalary, nonTaxableMonthly = 200_000, dependents = 1, children = 0 }) {
  annualSalary = Math.max(0, Math.floor(annualSalary || 0));
  nonTaxableMonthly = Math.max(0, Math.floor(nonTaxableMonthly || 0));
  dependents = Math.max(1, Math.floor(dependents || 1));
  children = Math.max(0, Math.floor(children || 0));

  const monthly = annualSalary / 12;
  // 4대보험은 비과세액을 제외한 보수월액 기준
  const insurable = Math.max(0, monthly - nonTaxableMonthly);

  const pension = calcPension(insurable);
  const health = calcHealth(insurable);
  const longTermCare = calcLongTermCare(health);
  const employment = calcEmployment(insurable);
  const insuranceMonthly = pension + health + longTermCare + employment;
  const insuranceAnnual = insuranceMonthly * 12;

  const earnedDeduction = earnedIncomeDeduction(annualSalary);
  const earnedIncome = annualSalary - earnedDeduction;
  const personalDeduction = 1_500_000 * dependents + insuranceAnnual;
  const taxBase = Math.max(0, earnedIncome - personalDeduction);
  const grossTax = baseTax(taxBase);

  let credit = grossTax <= 1_300_000 ? grossTax * 0.55 : 715_000 + (grossTax - 1_300_000) * 0.3;
  credit = Math.min(credit, earnedTaxCreditLimit(annualSalary));

  let childCredit = 0;
  if (children === 1) childCredit = 150_000;
  else if (children === 2) childCredit = 350_000;
  else if (children > 2) childCredit = 350_000 + (children - 2) * 300_000;

  const incomeTaxAnnual = Math.max(0, grossTax - credit - childCredit);
  const localTaxAnnual = incomeTaxAnnual * 0.1;
  const taxMonthly = (incomeTaxAnnual + localTaxAnnual) / 12;

  const netMonthly = monthly - insuranceMonthly - taxMonthly;

  return {
    annualSalary,
    monthly: Math.round(monthly),
    nonTaxableMonthly,
    dependents,
    pension,
    health,
    longTermCare,
    employment,
    insuranceMonthly,
    insuranceAnnual: Math.round(insuranceAnnual),
    earnedDeduction: Math.round(earnedDeduction),
    taxBase: Math.round(taxBase),
    incomeTaxMonthly: Math.round(incomeTaxAnnual / 12),
    localTaxMonthly: Math.round(localTaxAnnual / 12),
    taxMonthly: Math.round(taxMonthly),
    netMonthly: Math.round(netMonthly),
    netAnnual: Math.round(netMonthly * 12),
  };
}

/**
 * 연봉 상위 퍼센타일 추정치 ("상위 X%")
 *
 * 2024년 귀속 국세청 연말정산 신고현황 기반 근로소득 구간 분포 (대략치):
 * 1억원 이상 7% / 7천~1억원 14% / 5천~7천만원 15% / 3천~5천만원 26% / 3천만원 미만 38%
 * 구간 내에서는 균등 분포로 가정해 선형 보간. 참고용 추정치.
 *
 * @param {number} annualManwon 연봉 (만원)
 * @returns {number} 상위 퍼센트 (0~100)
 */
const INCOME_BRACKETS = [
  { lower: 0, upper: 3000, share: 38 },
  { lower: 3000, upper: 5000, share: 26 },
  { lower: 5000, upper: 7000, share: 15 },
  { lower: 7000, upper: 10000, share: 14 },
  { lower: 10000, upper: Infinity, share: 7 },
];

export function topPercentile(annualManwon) {
  annualManwon = Math.max(0, annualManwon || 0);
  let belowOrEqual = 0;
  for (const b of INCOME_BRACKETS) {
    if (annualManwon >= b.upper) {
      belowOrEqual += b.share;
      continue;
    }
    if (annualManwon > b.lower) {
      belowOrEqual += (b.share * (annualManwon - b.lower)) / (b.upper - b.lower);
    }
    break;
  }
  return Math.min(100, Math.max(0, Math.round(100 - belowOrEqual)));
}

/**
 * 목표 월 실수령액에 필요한 세전 연봉 역산 (이분 탐색)
 * calcSalary가 단조증가 함수임을 이용. 50회 반복으로 원 단위 수렴.
 */
export function reverseSalary(targetNetMonthly, nonTaxableMonthly = 0, dependents = 1) {
  targetNetMonthly = Math.max(0, targetNetMonthly || 0);
  let lo = 0;
  let hi = Math.max(targetNetMonthly * 24, 10_000_000);
  for (let i = 0; i < 50; i++) {
    const mid = (lo + hi) / 2;
    const r = calcSalary({ annualSalary: mid, nonTaxableMonthly, dependents });
    if (r.netMonthly < targetNetMonthly) lo = mid;
    else hi = mid;
  }
  return Math.round((lo + hi) / 2);
}
