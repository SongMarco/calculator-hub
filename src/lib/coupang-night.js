/**
 * 쿠팡 물류센터 야간조 일급 계산기
 *
 * 근로기준법 야간근로(22:00~익일 06:00) 50% 가산 기준.
 *  - 일급 = (실근로시간 × 시급) + (야간근로시간 × 시급 × 0.5)
 *  - 휴게시간은 근로시간에서 제외 (야간·주간에 비례 배분한 간이 계산)
 *  - 5인 이상 사업장 적용 (쿠팡 물류센터 해당)
 *  - 2026년 최저시급 10,320원 (기본값)
 *
 * startMin/endMin: 자정 기준 분 (예: 22:00 → 1320). endMin <= startMin이면 익일로 간주.
 * 참고용 추정치 (세전, 4대보험·소득세 공제 전).
 */

const NIGHT_START = 22 * 60; // 1320
const NIGHT_END = 30 * 60; // 1800 (= 익일 06:00)

function overlap(a0, a1, b0, b1) {
  return Math.max(0, Math.min(a1, b1) - Math.max(a0, b0));
}

/**
 * @param {object} opts
 * @param {number} opts.hourlyWage 시급 (원)
 * @param {number} opts.startMin 출근 시각 (자정 기준 분)
 * @param {number} opts.endMin 퇴근 시각 (자정 기준 분, 출근보다 이르면 익일)
 * @param {number} opts.breakMin 휴게시간 (분)
 * @param {number} opts.workDays 월 근무일수 (월 예상 급여용)
 */
export function calcCoupangPay({ hourlyWage, startMin, endMin, breakMin = 60, workDays = 0 }) {
  hourlyWage = Math.max(0, Math.floor(hourlyWage || 0));
  let s = Number(startMin) || 0;
  let e = Number(endMin) || 0;
  breakMin = Math.max(0, Number(breakMin) || 0);
  workDays = Math.max(0, Number(workDays) || 0);

  if (e <= s) e += 24 * 60; // 자정을 넘기면 익일로 간주
  const totalMin = e - s;
  const workMin = Math.max(0, totalMin - breakMin);

  // 야간 시간대(22:00~06:00)와 겹치는 분 (새벽 근무조 대응 위해 하루 전 구간도 체크)
  const nightRaw =
    overlap(s, e, NIGHT_START, NIGHT_END) +
    overlap(s, e, NIGHT_START - 24 * 60, NIGHT_END - 24 * 60);
  // 휴게시간은 야간·주간에 비례 배분
  const nightMin = totalMin > 0 ? (nightRaw * workMin) / totalMin : 0;

  const workHours = workMin / 60;
  const nightHours = nightMin / 60;
  const basePay = Math.floor(hourlyWage * workHours);
  const nightBonus = Math.floor(hourlyWage * 0.5 * nightHours);
  const dailyTotal = basePay + nightBonus;
  const monthly = Math.floor(dailyTotal * workDays);

  return {
    hourlyWage,
    workHours,
    nightHours,
    basePay,
    nightBonus,
    dailyTotal,
    monthly,
    workDays,
  };
}

/** 근무조 프리셋 (쿠팡 공고 기준 대표 시간대) */
export const SHIFTS = [
  { id: 'day', name: '주간조', startMin: 9 * 60, endMin: 18 * 60, breakMin: 60, desc: '09:00~18:00 · 야간 없음' },
  { id: 'afternoon', name: '오후조', startMin: 14 * 60, endMin: 23 * 60, breakMin: 60, desc: '14:00~23:00 · 야간 1시간' },
  { id: 'dawn', name: '심야조', startMin: 19 * 60, endMin: 28 * 60, breakMin: 60, desc: '19:00~익일 04:00 · 야간 6시간' },
  { id: 'fullnight', name: '완전 야간조', startMin: 22 * 60, endMin: 30 * 60, breakMin: 60, desc: '22:00~익일 06:00 · 전 시간 야간' },
];
