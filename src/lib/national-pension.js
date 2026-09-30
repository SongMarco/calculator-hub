/**
 * 국민연금 노령연금 간이 예상액 (2026년 기준)
 *
 * 산식 (국민연금법):
 *  기본연금액(연액) = 1.2 × (A값 + B값) × (1 + 0.05 × (가입월수 − 240) / 12)
 *   - A값: 2026년 전체 가입자 평균소득월액 3,193,511원
 *   - B값: 가입자 본인의 가입기간 중 기준소득월액 평균액
 *          → 간이 계산에서는 현재 월소득이 가입기간 내내 동일했다고 가정 (재평가 미반영)
 *   - 가입월수 240개월(20년) 기준 100%, 1개월당 5%/12 가감 (최소 120개월)
 *  월 연금액 = 기본연금액 ÷ 12 + 부양가족연금액(월)
 *
 * 부양가족연금액 (2026년):
 *  - 배우자: 연 306,630원 / 자녀·부모(1인당): 연 204,360원
 *
 * 미반영: 소득 재평가, 조기노령·연기연금, 소득활동 감액, 장애·유족연금.
 * 참고용 추정치. 정확한 예상액은 국민연금공단 '내 연금 알아보기'로 확인 필요.
 */

/** 2026년 A값 (원) */
export const A_VALUE_2026 = 3_193_511;
/** 부양가족연금액 (연액, 원) */
export const DEPENDENT_SPOUSE_2026 = 306_630;
export const DEPENDENT_OTHER_2026 = 204_360;
export const MIN_MONTHS = 120;

/**
 * @param {object} opts
 * @param {number} opts.monthlyIncome 월 평균소득 (원, B값 대용)
 * @param {number} opts.months 가입기간 (월)
 * @param {number} opts.spouse 배우자 수 (0/1)
 * @param {number} opts.others 자녀·부모 수
 */
export function calcNationalPension({ monthlyIncome, months, spouse = 0, others = 0 }) {
  monthlyIncome = Math.max(0, Math.floor(monthlyIncome || 0));
  months = Math.max(MIN_MONTHS, Math.min(600, Math.floor(months || MIN_MONTHS)));
  spouse = spouse ? 1 : 0;
  others = Math.max(0, Math.floor(others || 0));

  const factor = 1 + 0.05 * ((months - 240) / 12);
  const baseAnnual = 1.2 * (A_VALUE_2026 + monthlyIncome) * factor;
  const monthlyBase = baseAnnual / 12;
  const dependentMonthly = (spouse * DEPENDENT_SPOUSE_2026 + others * DEPENDENT_OTHER_2026) / 12;
  const monthly = Math.floor(monthlyBase + dependentMonthly);

  return {
    monthlyIncome, months, spouse, others,
    factor: Math.round(factor * 1000) / 1000,
    monthlyBase: Math.floor(monthlyBase),
    dependentMonthly: Math.floor(dependentMonthly),
    monthly,
  };
}
