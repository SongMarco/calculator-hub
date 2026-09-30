/**
 * 생애최초 주택구입 취득세 감면 계산 (2026년 기준)
 *
 * - 대상: 본인·배우자 모두 주택 소유 이력 없음 + 실거래가 12억원 이하 주택 + 유상취득
 * - 감면: 산출세액에서 최대 200만원 차감 (인구감소지역 300만원, 2026년부터)
 * - 취득세율(1주택): 6억 이하 1%, 6억 초과~9억 이하 누진(취득가액×2/3억-3)%, 9억 초과 3%
 * - 지방교육세: 취득세액의 10% (주택 유상거래)
 * - 농어촌특별세: 서민주택 감면 시 비과세 → 계산에서 제외
 * - 2026.1.1부터 '3개월 이내 전입' 요건 삭제. 취득일부터 3년 내 매각·증여·임대 시 추징.
 *
 * @param {object} opts
 * @param {number} opts.price 취득가액 (실거래가, 원)
 * @param {boolean} opts.isFirstTimer 생애최초 해당 여부 (본인·배우자 무주택)
 * @param {boolean} opts.isDepopulated 인구감소지역 여부
 */
export function calcFirstHomeTax({ price, isFirstTimer, isDepopulated }) {
  price = Math.max(0, Math.floor(price || 0));

  // 1주택 취득세율
  let rate;
  if (price <= 600_000_000) rate = 0.01;
  else if (price <= 900_000_000) rate = (price * 2) / 300_000_000 / 100 - 0.03;
  else rate = 0.03;

  const acqTax = Math.floor(price * rate);
  const eduTax = Math.floor(acqTax * 0.1);
  const total = acqTax + eduTax;

  const eligible = isFirstTimer && price > 0 && price <= 1_200_000_000;
  const cap = isDepopulated ? 3_000_000 : 2_000_000;
  const reduction = eligible ? Math.min(cap, total) : 0;

  return {
    price,
    rate: +(rate * 100).toFixed(2),
    acqTax,
    eduTax,
    total,
    eligible,
    cap: eligible ? cap : 0,
    reduction,
    payable: total - reduction,
    overLimit: price > 1_200_000_000,
  };
}
