/**
 * 2026년 구직급여(실업급여) 간이 모의계산
 *
 * 지급 기준 (2026년, 2019.10.1 이후 이직자):
 *  - 1일 지급액 = 이직 전 3개월 평균임금의 60%
 *    · 상한 68,100원, 하한 66,048원 (1일 소정근로 8시간 기준)
 *  - 소정급여일수: 나이·고용보험 가입기간에 따라 120~270일
 *    · 50세 미만: 1년 미만 120일 / 1~3년 150일 / 3~5년 180일 / 5~10년 210일 / 10년 이상 240일
 *    · 50세 이상·장애인: 1년 미만 120일 / 1~3년 180일 / 3~5년 210일 / 5~10년 240일 / 10년 이상 270일
 *  - 총액 = 1일 지급액 × 소정급여일수
 *
 * 간이 계산이며, 하한액은 실제 1일 소정근로시간에 따라 달라질 수 있음.
 * 수급자격(18개월 중 180일 이상·비자발적 이직 등) 충족 여부와 별개로 금액만 산정.
 * 참고용 추정치. 실제 지급액은 고용센터 확인 필요.
 */

/** 2026년 1일 지급액 상한·하한 (원) */
export const DAILY_CAP_2026 = 68_100;
export const DAILY_FLOOR_2026 = 66_048;

/**
 * 소정급여일수 조회
 * @param {number} years 고용보험 가입기간 (년, 소수 허용)
 * @param {boolean} senior 50세 이상 또는 장애인 여부
 * @returns {number} 소정급여일수
 */
export function getBenefitDays(years, senior = false) {
  const y = Math.max(0, Number(years) || 0);
  if (senior) {
    if (y < 1) return 120;
    if (y < 3) return 180;
    if (y < 5) return 210;
    if (y < 10) return 240;
    return 270;
  }
  if (y < 1) return 120;
  if (y < 3) return 150;
  if (y < 5) return 180;
  if (y < 10) return 210;
  return 240;
}

/**
 * @param {object} opts
 * @param {number} opts.avgWage 이직 전 3개월 1일 평균임금 (원)
 * @param {number} opts.years 고용보험 가입기간 (년)
 * @param {boolean} opts.senior 50세 이상 또는 장애인 여부
 */
export function calcUnemployment({ avgWage, years, senior = false }) {
  avgWage = Math.max(0, Math.floor(avgWage || 0));
  const days = getBenefitDays(years, senior);
  const raw = avgWage * 0.6;
  const daily = Math.min(Math.max(raw, DAILY_FLOOR_2026), DAILY_CAP_2026);
  const total = Math.floor(daily * days);
  return {
    avgWage,
    years,
    senior,
    days,
    daily: Math.floor(daily),
    total,
    cappedHigh: raw > DAILY_CAP_2026,
    cappedLow: raw < DAILY_FLOOR_2026,
  };
}
