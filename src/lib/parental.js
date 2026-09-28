/**
 * 2026년 육아휴직 급여 계산
 *
 * 지급 기준 (2026년):
 *  - 1~3개월차: 통상임금의 100%, 월 상한 250만원
 *  - 4~6개월차: 통상임금의 100%, 월 상한 200만원
 *  - 7개월차 이후: 통상임금의 80%, 월 상한 160만원
 *  - 월 하한 70만원
 *  - 사후지급금 제도 폐지 → 휴직 중 전액 매월 지급
 *  - 기본 최대 1년, 조건 충족 시 1년 6개월까지 가능
 *
 * 6+6 부모함께육아휴직 특례는 별도 계산이 필요하므로 이 계산기에서는 일반 육아휴직만 다룸.
 * 참고용 추정치. 실제 지급액은 고용센터 확인 필요.
 */

/** 개월차별 지급 기준 */
export const LEAVE_BRACKETS_2026 = [
  { from: 1, to: 3, rate: 1.0, cap: 2_500_000 },
  { from: 4, to: 6, rate: 1.0, cap: 2_000_000 },
  { from: 7, to: 18, rate: 0.8, cap: 1_600_000 },
];
export const LEAVE_MIN_PAY = 700_000;
export const LEAVE_MAX_MONTHS = 18;

/**
 * @param {object} opts
 * @param {number} opts.monthlyWage 통상임금 월액 (원)
 * @param {number} opts.months 휴직 개월수 (1~18)
 */
export function calcParentalLeave({ monthlyWage, months }) {
  monthlyWage = Math.max(0, Math.floor(monthlyWage || 0));
  months = Math.min(LEAVE_MAX_MONTHS, Math.max(1, Math.floor(months || 1)));

  const schedule = [];
  let total = 0;
  for (let m = 1; m <= months; m++) {
    const b = LEAVE_BRACKETS_2026.find((x) => m >= x.from && m <= x.to);
    let pay = 0;
    if (monthlyWage > 0) {
      pay = Math.min(monthlyWage * b.rate, b.cap);
      pay = Math.max(pay, LEAVE_MIN_PAY);
    }
    pay = Math.floor(pay);
    schedule.push({ month: m, rate: b.rate, cap: b.cap, pay });
    total += pay;
  }
  return { monthlyWage, months, schedule, total };
}
