/**
 * 주식 물타기(평균단가 낮추기) 계산
 *
 * 새 평단가 = (보유수량 × 평단가 + 추가수량 × 추가단가) / (보유수량 + 추가수량)
 * 수수료·세금은 제외한 참고용 계산.
 *
 * @param {object} opts
 * @param {number} opts.qty 현재 보유 수량 (주)
 * @param {number} opts.avgPrice 현재 평단가 (원)
 * @param {number} opts.addQty 추가 매수 수량 (주)
 * @param {number} opts.addPrice 추가 매수 단가 (원)
 * @returns 계산 결과 객체, 입력이 유효하지 않으면 null
 */
export function calcAvgDown({ qty, avgPrice, addQty, addPrice }) {
  qty = Number(qty);
  avgPrice = Number(avgPrice);
  addQty = Number(addQty);
  addPrice = Number(addPrice);
  if (![qty, avgPrice, addQty, addPrice].every(Number.isFinite)) return null;
  if (qty <= 0 || avgPrice <= 0 || addQty < 0 || addPrice <= 0) return null;

  const prevCost = qty * avgPrice;
  const addCost = addQty * addPrice;
  const newQty = qty + addQty;
  const totalCost = prevCost + addCost;
  const newAvg = newQty > 0 ? totalCost / newQty : 0;
  const reduceAmount = avgPrice - newAvg;
  const reduceRate = avgPrice > 0 ? (reduceAmount / avgPrice) * 100 : 0;

  return {
    qty: newQty,
    avg: newAvg,
    totalCost,
    prevCost,
    addCost,
    reduceAmount,
    reduceRate,
  };
}

/**
 * 목표 평단가 역계산: 현재가(buyPrice)에 추가 매수해 목표 평단가(targetAvg)를
 * 맞추려면 몇 주를 더 사야 하는지 역산한다.
 *
 * addQty = qty × (avgPrice − targetAvg) / (targetAvg − buyPrice)
 *
 * @param {object} opts
 * @param {number} opts.qty 현재 보유 수량 (주)
 * @param {number} opts.avgPrice 현재 평단가 (원)
 * @param {number} opts.buyPrice 추가 매수 단가 = 현재가 (원)
 * @param {number} opts.targetAvg 목표 평단가 (원)
 * @returns { ok:true, addQty, addCost } 또는 { ok:false, reason }
 *   reason: 'already' (이미 목표 이하) | 'impossible' (현재가로는 도달 불가) | 'invalid' (입력 오류)
 */
export function calcReverseAvgDown({ qty, avgPrice, buyPrice, targetAvg }) {
  qty = Number(qty);
  avgPrice = Number(avgPrice);
  buyPrice = Number(buyPrice);
  targetAvg = Number(targetAvg);
  if (![qty, avgPrice, buyPrice, targetAvg].every(Number.isFinite)) {
    return { ok: false, reason: 'invalid' };
  }
  if (qty <= 0 || avgPrice <= 0 || buyPrice <= 0 || targetAvg <= 0) {
    return { ok: false, reason: 'invalid' };
  }
  if (targetAvg >= avgPrice) return { ok: false, reason: 'already' };
  if (targetAvg <= buyPrice) return { ok: false, reason: 'impossible' };

  const addQty = (qty * (avgPrice - targetAvg)) / (targetAvg - buyPrice);
  return {
    ok: true,
    addQty,
    addCost: addQty * buyPrice,
  };
}
