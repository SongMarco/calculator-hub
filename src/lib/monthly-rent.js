/**
 * 2026년 월세 세액공제 계산 (연말정산 기준)
 *
 * 계산 방식:
 *  1. 소득 요건: 총급여 8,000만원 이하 (종합소득금액 7,000만원 이하)
 *  2. 공제율: 총급여 5,500만원 이하 → 17%, 5,500만원 초과 ~ 8,000만원 이하 → 15%
 *  3. 공제액 = min(연간 월세액, 1,000만원) × 공제율
 *  4. 실제 환급액은 연간 결정세액을 초과할 수 없음 (세액공제 특성)
 *
 * 자격 요건 (요약): 과세기간 종료일 기준 무주택 세대주,
 * 국민주택규모(85㎡) 이하 또는 기준시가 4억원 이하 주택,
 * 임대차계약서 주소 = 주민등록상 주소 (전입신고 필수).
 *
 * 참고용 추정치. 실제 공제 가능 여부는 국세청 기준을 따름.
 */

export const RENT_CREDIT_2026 = {
  incomeLimit: 80_000_000, // 총급여 기준 (원)
  midThreshold: 55_000_000, // 공제율 구간 경계 (원)
  rateLow: 0.17, // 5,500만원 이하
  rateHigh: 0.15, // 5,500만원 초과 ~ 8,000만원 이하
  annualCap: 10_000_000, // 연간 월세 한도 (원)
};

/** 총급여 → 월세 세액공제율 (요건 미달 시 0) */
export function rentCreditRate(totalSalary) {
  totalSalary = Math.max(0, totalSalary || 0);
  if (totalSalary > RENT_CREDIT_2026.incomeLimit) return 0;
  return totalSalary <= RENT_CREDIT_2026.midThreshold
    ? RENT_CREDIT_2026.rateLow
    : RENT_CREDIT_2026.rateHigh;
}

/**
 * @param {object} opts
 * @param {number} opts.monthlyRent 월세 (원/월)
 * @param {number} opts.totalSalary 총급여 (원/년)
 * @param {boolean} [opts.eligible=true] 무주택·전입신고 등 자격 요건 충족 여부
 * @param {number} [opts.determinedTax=0] 연간 결정세액 (원). 0이면 공제액 그대로 표시
 */
export function calcRentCredit({ monthlyRent, totalSalary, eligible = true, determinedTax = 0 }) {
  monthlyRent = Math.max(0, Math.floor(monthlyRent || 0));
  totalSalary = Math.max(0, Math.floor(totalSalary || 0));
  determinedTax = Math.max(0, Math.floor(determinedTax || 0));

  const annualRent = monthlyRent * 12;
  const rate = eligible ? rentCreditRate(totalSalary) : 0;
  const cappedBase = Math.min(annualRent, RENT_CREDIT_2026.annualCap);
  const credit = Math.round(cappedBase * rate);
  // 세액공제는 결정세액을 초과할 수 없음
  const refund = determinedTax > 0 ? Math.min(credit, determinedTax) : credit;

  return {
    monthlyRent,
    annualRent,
    totalSalary,
    eligible: rate > 0,
    rate,
    ratePct: Math.round(rate * 100),
    capped: annualRent > RENT_CREDIT_2026.annualCap,
    cappedBase,
    credit,
    determinedTax,
    refund,
    maxRefund: Math.round(RENT_CREDIT_2026.annualCap * RENT_CREDIT_2026.rateLow), // 170만원
  };
}
