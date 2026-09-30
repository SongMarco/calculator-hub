/**
 * 연장·야간·휴일근로 수당 계산 (근로기준법 기준)
 *
 * 가산율:
 *  - 연장근로: 통상임금의 50% 가산
 *  - 야간근로(22:00~익일 06:00): 50% 가산
 *  - 휴일근로: 8시간 이내 50% 가산, 8시간 초과분 100% 가산
 *  ※ 연장+야간이 겹치면 각각 가산 (중복 가산)
 *  ※ 5인 미만 사업장은 가산수당 적용 제외 (별도 안내)
 *  ※ 2026년 최저시급 10,320원
 *
 * 참고용 추정치.
 */

/**
 * @param {object} opts
 * @param {number} opts.hourlyWage 통상시급 (원)
 * @param {number} opts.overtime 연장근로 시간 (주간)
 * @param {number} opts.night 야간근로 시간
 * @param {number} opts.holiday 휴일근로 시간 (8시간 이내분)
 * @param {number} opts.holidayOver 휴일근로 시간 (8시간 초과분)
 */
export function calcOvertimePay({ hourlyWage, overtime = 0, night = 0, holiday = 0, holidayOver = 0 }) {
  hourlyWage = Math.max(0, Math.floor(hourlyWage || 0));
  const h = (v) => Math.max(0, Number(v) || 0);
  overtime = h(overtime); night = h(night); holiday = h(holiday); holidayOver = h(holidayOver);

  const overtimePay = hourlyWage * 1.5 * overtime;
  const nightPay = hourlyWage * 1.5 * night;
  const holidayPay = hourlyWage * 1.5 * holiday;
  const holidayOverPay = hourlyWage * 2.0 * holidayOver;
  const total = Math.floor(overtimePay + nightPay + holidayPay + holidayOverPay);

  return {
    hourlyWage,
    breakdown: {
      overtime: { hours: overtime, pay: Math.floor(overtimePay) },
      night: { hours: night, pay: Math.floor(nightPay) },
      holiday: { hours: holiday, pay: Math.floor(holidayPay) },
      holidayOver: { hours: holidayOver, pay: Math.floor(holidayOverPay) },
    },
    total,
  };
}
