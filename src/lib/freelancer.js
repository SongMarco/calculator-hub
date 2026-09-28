/**
 * 프리랜서·사업소득 원천징수 (3.3%) 계산
 *
 * 사업소득 지급 시 원천징수세율: 소득세 3% + 지방소득세 0.3% = 3.3%
 * (필요경비를 제외한 금액이 기준이지만, 이 계산기는 지급액 전체 기준 간이 계산)
 *
 * @param {object} opts
 * @param {number} opts.payment 지급액 (세전, 원)
 */
export function calcFreelancer({ payment }) {
  payment = Math.max(0, Math.floor(payment || 0));
  const incomeTax = Math.floor(payment * 0.03);
  const localTax = Math.floor(payment * 0.003);
  const withholding = incomeTax + localTax;
  return {
    payment,
    incomeTax,
    localTax,
    withholding,
    withholdingRate: 3.3,
    net: payment - withholding,
  };
}
