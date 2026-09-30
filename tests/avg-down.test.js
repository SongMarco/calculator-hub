import { test } from 'node:test';
import assert from 'node:assert/strict';
import { calcAvgDown, calcReverseAvgDown } from '../src/lib/avg-down.js';

const close = (a, b, eps = 1e-9) => Math.abs(a - b) < eps;

test('기본: 100주×50,000원 + 100주×30,000원 → 평단가 40,000원', () => {
  const r = calcAvgDown({ qty: 100, avgPrice: 50000, addQty: 100, addPrice: 30000 });
  assert.equal(r.qty, 200);
  assert.ok(close(r.avg, 40000));
  assert.equal(r.totalCost, 8000000);
  assert.ok(close(r.reduceAmount, 10000));
  assert.ok(close(r.reduceRate, 20));
});

test('기본: 추가 매수 0주면 평단가 그대로', () => {
  const r = calcAvgDown({ qty: 50, avgPrice: 20000, addQty: 0, addPrice: 15000 });
  assert.equal(r.qty, 50);
  assert.ok(close(r.avg, 20000));
  assert.ok(close(r.reduceAmount, 0));
});

test('기본: 현재가보다 비싸게 사면 평단가 상승 (불타기)', () => {
  const r = calcAvgDown({ qty: 100, avgPrice: 30000, addQty: 100, addPrice: 50000 });
  assert.ok(close(r.avg, 40000));
  assert.ok(r.reduceAmount < 0); // 인하액이 음수 = 평단가 상승
});

test('기본: 보유 수량 0이면 null', () => {
  assert.equal(calcAvgDown({ qty: 0, avgPrice: 50000, addQty: 10, addPrice: 30000 }), null);
});

test('기본: 평단가 0이면 null', () => {
  assert.equal(calcAvgDown({ qty: 10, avgPrice: 0, addQty: 10, addPrice: 30000 }), null);
});

test('기본: 음수 입력이면 null', () => {
  assert.equal(calcAvgDown({ qty: -5, avgPrice: 50000, addQty: 10, addPrice: 30000 }), null);
  assert.equal(calcAvgDown({ qty: 10, avgPrice: 50000, addQty: 10, addPrice: -100 }), null);
});

test('역계산: 100주×50,000원, 현재가 30,000원, 목표 40,000원 → 100주 추가', () => {
  const r = calcReverseAvgDown({ qty: 100, avgPrice: 50000, buyPrice: 30000, targetAvg: 40000 });
  assert.equal(r.ok, true);
  assert.ok(close(r.addQty, 100));
  assert.ok(close(r.addCost, 3000000));
  // 검증: 역산 결과로 다시 계산하면 목표 평단가와 일치
  const check = calcAvgDown({ qty: 100, avgPrice: 50000, addQty: r.addQty, addPrice: 30000 });
  assert.ok(close(check.avg, 40000));
});

test('역계산: 목표가 현재 평단가 이상이면 already', () => {
  const r = calcReverseAvgDown({ qty: 100, avgPrice: 50000, buyPrice: 30000, targetAvg: 50000 });
  assert.equal(r.ok, false);
  assert.equal(r.reason, 'already');
});

test('역계산: 목표가 현재가 이하면 impossible', () => {
  const r = calcReverseAvgDown({ qty: 100, avgPrice: 50000, buyPrice: 30000, targetAvg: 30000 });
  assert.equal(r.ok, false);
  assert.equal(r.reason, 'impossible');
  const r2 = calcReverseAvgDown({ qty: 100, avgPrice: 50000, buyPrice: 30000, targetAvg: 20000 });
  assert.equal(r2.reason, 'impossible');
});

test('역계산: 입력 오류면 invalid', () => {
  assert.equal(calcReverseAvgDown({ qty: 0, avgPrice: 50000, buyPrice: 30000, targetAvg: 40000 }).reason, 'invalid');
  assert.equal(calcReverseAvgDown({ qty: 100, avgPrice: 50000, buyPrice: -1, targetAvg: 40000 }).reason, 'invalid');
});

test('역계산: 소수점 수량도 처리', () => {
  const r = calcReverseAvgDown({ qty: 10, avgPrice: 100000, buyPrice: 60000, targetAvg: 80000 });
  // 10×(100000−80000)/(80000−60000) = 10
  assert.equal(r.ok, true);
  assert.ok(close(r.addQty, 10));
});
