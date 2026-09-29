/**
 * 주휴 포함 시급 계산기 (2026년 기준)
 *
 * 계산 방식:
 *  1. 2026년 최저시급 10,320원
 *  2. 주휴수당: 주 15시간 이상 근무 + 개근 시 발생
 *     주휴시간 = (주 소정근로시간 ÷ 40) × 8시간, 상한 8시간
 *  3. 월 환산: (주 소정근로시간 + 주휴시간) × 4.345주 → 정수 시간 반올림
 *     (주 40시간 → 48 × 4.345 = 208.56 → 209시간, 고용노동부 고시와 일치)
 *  4. 월급(세전) = 월 환산 시간 × 시급
 *  5. 주휴 포함 실질 시급 = 시급 × (유급 주 시간 ÷ 주 소정근로시간)
 *
 * 참고용 추정치. 개근 여부·수습 감액 등 개별 조건은 반영하지 않음.
 */

export const WAGE_2026 = {
  minHourly: 10_320, // 2026년 최저시급
  weeklyFactor: 4.345, // 월 평균 주 수 (365 ÷ 7 ÷ 12)
  leaveThreshold: 15, // 주휴수당 발생 최소 주 근로시간
  maxLeaveHours: 8, // 주휴시간 상한
};

/** 주 소정근로시간 → 주휴시간 */
export function calcWeeklyLeaveHours(weeklyHours) {
  weeklyHours = Math.max(0, weeklyHours || 0);
  if (weeklyHours < WAGE_2026.leaveThreshold) return 0;
  return Math.min((weeklyHours / 40) * WAGE_2026.maxLeaveHours, WAGE_2026.maxLeaveHours);
}

/**
 * @param {object} opts
 * @param {number} opts.hourlyWage 시급 (원)
 * @param {number} opts.weeklyHours 주 소정근로시간
 */
export function calcHourlyWage({ hourlyWage, weeklyHours }) {
  hourlyWage = Math.max(0, Math.floor(hourlyWage || 0));
  weeklyHours = Math.max(0, weeklyHours || 0);

  const leaveHours = calcWeeklyLeaveHours(weeklyHours);
  const hasLeavePay = leaveHours > 0;
  const paidWeeklyHours = weeklyHours + leaveHours;
  const monthlyHours = Math.round(paidWeeklyHours * WAGE_2026.weeklyFactor);
  const monthlyPay = monthlyHours * hourlyWage;
  const weeklyLeavePay = Math.round(leaveHours * hourlyWage);
  const monthlyLeavePay = Math.round(weeklyLeavePay * WAGE_2026.weeklyFactor);
  const effectiveHourly =
    weeklyHours > 0 ? Math.round(hourlyWage * (paidWeeklyHours / weeklyHours)) : 0;
  const belowMinimum = hourlyWage > 0 && hourlyWage < WAGE_2026.minHourly;

  return {
    hourlyWage,
    weeklyHours,
    hasLeavePay,
    leaveHours: Math.round(leaveHours * 100) / 100,
    weeklyLeavePay,
    paidWeeklyHours: Math.round(paidWeeklyHours * 100) / 100,
    monthlyHours,
    monthlyPay,
    monthlyLeavePay,
    effectiveHourly,
    belowMinimum,
    minHourly: WAGE_2026.minHourly,
  };
}
