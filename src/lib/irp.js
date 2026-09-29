/**
 * IRP 일시금 vs 연금 수령 세금 비교 (2026년 기준)
 *
 * 계산 방식:
 *  1. 퇴직소득세 (연평균과세): severance.js와 동일한 공식
 *     근속연수공제 → 환산급여공제 → 기본세율 → 산출세액 ÷ 12 × 근속연수
 *  2. 일시금 수령: 퇴직소득세 100% + 지방소득세 10%
 *  3. 연금 수령: 수령 연차별 감면율 적용 (소득세법 제129조)
 *     - 1~10년차: 연금외수령 원천징수세율의 70% (30% 감면)
 *     - 11~20년차: 60% (40% 감면)
 *     - 21년차 이후: 50% (50% 감면)
 *     균등 분할 수령 가정 → 수령 기간 가중평균 실효세율 적용
 *  4. IRP 내 운용수익·세액공제분: 일시금 시 기타소득세 16.5%,
 *     연금 수령 시 수령 개시 나이에 따라 연금소득세 5.5% / 4.4% / 3.3%
 *
 * 연금 수령 조건: 만 55세 이상. 연금소득 연 1,500만원 초과 시 종합과세 가능.
 * 참고용 추정치. 실제 세액은 국세청 퇴직소득세 계산기로 확인할 것.
 */
import { baseTax } from './salary.js';
import { seniorityDeduction, convertedSalaryDeduction } from './severance.js';

export const IRP_2026 = {
  /** 수령 연차 구간별 실효세율 (연금외수령 원천징수세율 대비) */
  pensionRates: [
    { upTo: 10, rate: 0.7 },
    { upTo: 20, rate: 0.6 },
    { upTo: Infinity, rate: 0.5 },
  ],
  lumpSumEarningRate: 0.165, // 운용수익 일시금 수령 시 기타소득세
  pensionAge: 55, // 연금 수령 가능 나이
};

/** 퇴직금 총액 + 근속연수 → 퇴직소득세 (국세, 연평균과세) */
export function calcRetireTax(gross, years) {
  gross = Math.max(0, gross || 0);
  years = Math.max(0, years || 0);
  if (gross <= 0 || years <= 0) return 0;
  const taxable = Math.max(0, gross - seniorityDeduction(years));
  const converted = (taxable / years) * 12;
  const taxBase = Math.max(0, converted - convertedSalaryDeduction(converted));
  return (baseTax(taxBase) / 12) * years;
}

/** 연금 수령 기간(년) → 감면율 가중평균 실효세율 */
export function pensionEffectiveRate(years) {
  years = Math.max(0, years || 0);
  if (years <= 0) return 1;
  let weighted = 0;
  let prev = 0;
  for (const { upTo, rate } of IRP_2026.pensionRates) {
    const span = Math.min(years, upTo) - prev;
    if (span <= 0) break;
    weighted += span * rate;
    prev = upTo;
  }
  return weighted / years;
}

/** 수령 개시 나이 → 운용수익분 연금소득세율 */
export function pensionEarningRate(age) {
  if (age >= 80) return 0.033;
  if (age >= 70) return 0.044;
  return 0.055; // 55~69세
}

/**
 * @param {object} opts
 * @param {number} opts.severanceGross 퇴직금 총액 (원)
 * @param {number} opts.tenureYears 근속연수 (년)
 * @param {number} [opts.pensionYears=10] 연금 수령 기간 (년)
 * @param {number} [opts.startAge=60] 연금 수령 개시 나이 (만)
 * @param {number} [opts.extraEarnings=0] IRP 내 운용수익·세액공제분 (원)
 */
export function calcIrp({
  severanceGross,
  tenureYears,
  pensionYears = 10,
  startAge = 60,
  extraEarnings = 0,
}) {
  severanceGross = Math.max(0, Math.floor(severanceGross || 0));
  tenureYears = Math.max(0, tenureYears || 0);
  pensionYears = Math.max(0, pensionYears || 0);
  startAge = Math.max(0, Math.floor(startAge || 0));
  extraEarnings = Math.max(0, Math.floor(extraEarnings || 0));

  // 퇴직금 원금분 세금
  const retireTax = calcRetireTax(severanceGross, tenureYears);
  const lumpLocal = retireTax * 0.1;
  const lumpTax = retireTax + lumpLocal;

  const effRate = pensionEffectiveRate(pensionYears);
  const pensionTax = retireTax * effRate;
  const pensionLocal = pensionTax * 0.1;
  const pensionTaxTotal = pensionTax + pensionLocal;
  const saving = lumpTax - pensionTaxTotal;

  // 운용수익·세액공제분 세금 비교
  const earnLumpTax = extraEarnings * IRP_2026.lumpSumEarningRate;
  const earnRate = pensionEarningRate(startAge);
  const earnPensionTax = extraEarnings * earnRate;
  const earnSaving = earnLumpTax - earnPensionTax;

  return {
    severanceGross,
    tenureYears,
    pensionYears,
    startAge,
    retireTax: Math.round(retireTax),
    // 일시금
    lumpTax: Math.round(lumpTax),
    lumpNet: Math.round(severanceGross - lumpTax),
    // 연금
    effRate: Math.round(effRate * 1000) / 10, // %
    pensionTax: Math.round(pensionTaxTotal),
    pensionNet: Math.round(severanceGross - pensionTaxTotal),
    saving: Math.round(saving),
    // 운용수익분
    extraEarnings,
    earnLumpTax: Math.round(earnLumpTax),
    earnPensionTax: Math.round(earnPensionTax),
    earnRatePct: Math.round(earnRate * 1000) / 10,
    earnSaving: Math.round(earnSaving),
    // 합계
    totalSaving: Math.round(saving + earnSaving),
    pensionEligible: startAge >= IRP_2026.pensionAge,
  };
}
