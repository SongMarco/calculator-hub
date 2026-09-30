/**
 * 알바(단시간 근로자) 퇴직금 계산
 *
 * 시급제 입력 → 주급 환산 → 3개월 임금 추정 → calcSeverance 재사용.
 * - 3개월 = 13주, 총일수 = 91일로 고정해 계산 (달력일수 기준 추정치임을 명시)
 * - 주휴수당: (1주 소정근로시간 ÷ 40) × 8 × 시급 (단시간 근로자 공식, 1일 8시간 상한)
 * - 1일 통상임금 = 시급 × (1주 소정근로시간 ÷ 주 근무일수), 평균임금보다 낮으면 통상임금 적용
 * - 자격: 계속근로 1년 이상 + 퇴직 전 4주 평균 주 소정근로시간 15시간 이상
 *
 * 참고용 추정치. 실제 지급액은 수당 포함 범위·결근·상여 등에 따라 달라질 수 있음.
 */
import { calcSeverance } from './severance.js';

export const MIN_WEEKLY_HOURS = 15;
export const MIN_TENURE_DAYS = 365;
export const WEEKS_PER_3MO = 13;
export const DAYS_PER_3MO = 91;

/** 주휴수당 (주 단위, 원) — 주 15시간 미만이면 0 */
export function weeklyHolidayPay(hourlyWage, weeklyHours) {
  hourlyWage = Math.max(0, hourlyWage || 0);
  weeklyHours = Math.max(0, weeklyHours || 0);
  if (weeklyHours < MIN_WEEKLY_HOURS) return 0;
  const holidayHours = Math.min(8, (weeklyHours / 40) * 8);
  return Math.round(hourlyWage * holidayHours);
}

/**
 * 퇴직금 수급 자격 판정
 * @returns {{ eligible: boolean, reasons: string[] }}
 */
export function checkEligibility(tenureDays, weeklyHours) {
  const reasons = [];
  if ((tenureDays || 0) < MIN_TENURE_DAYS) {
    reasons.push(`계속근로 1년 미만 (현재 약 ${Math.floor((tenureDays || 0) / 30)}개월)`);
  }
  if ((weeklyHours || 0) < MIN_WEEKLY_HOURS) {
    reasons.push(`주 소정근로시간 15시간 미만 (현재 ${weeklyHours || 0}시간)`);
  }
  return { eligible: reasons.length === 0, reasons };
}

/**
 * @param {object} opts
 * @param {number} opts.hourlyWage 시급 (원)
 * @param {number} opts.weeklyHours 1주 소정근로시간
 * @param {number} [opts.weeklyDays=5] 주 근무일수
 * @param {boolean} [opts.holidaySeparate=true] 주휴수당을 별도로 받는지
 * @param {number} opts.tenureDays 재직일수
 */
export function calcParttimeSeverance({
  hourlyWage,
  weeklyHours,
  weeklyDays = 5,
  holidaySeparate = true,
  tenureDays,
}) {
  hourlyWage = Math.max(0, hourlyWage || 0);
  weeklyHours = Math.max(0, weeklyHours || 0);
  weeklyDays = Math.max(1, Math.floor(weeklyDays || 5));
  tenureDays = Math.max(0, Math.floor(tenureDays || 0));

  const holidayPay = holidaySeparate ? weeklyHolidayPay(hourlyWage, weeklyHours) : 0;
  const weeklyPay = Math.round(hourlyWage * weeklyHours + holidayPay);
  const wages3mo = weeklyPay * WEEKS_PER_3MO;
  // 1일 통상임금 = 시급 × 1일 소정근로시간
  const dailyContract = Math.round(hourlyWage * (weeklyHours / weeklyDays));

  const r = calcSeverance({
    wages3mo,
    days3mo: DAYS_PER_3MO,
    tenureDays,
    minDaily: dailyContract,
  });

  return {
    ...r,
    holidayPay,
    weeklyPay,
    wages3mo,
    dailyContract,
    eligibility: checkEligibility(tenureDays, weeklyHours),
  };
}
