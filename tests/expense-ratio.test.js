import { test } from 'node:test';
import assert from 'node:assert/strict';
import { calcExpenseRatio } from '../src/lib/expense-ratio.js';

test('940909 업종 4천만원: 단순경비율이 유리', () => {
  const r = calcExpenseRatio({
    revenue: 40_000_000,
    simpleRate: 64.1,
    standardRate: 17.4,
    documentedExpenses: 5_000_000,
    prevRevenue: 30_000_000,
  });
  assert.equal(r.simpleEligible, true);
  assert.equal(r.simple.expenses, 25_640_000);
  assert.equal(r.simple.income, 14_360_000);
  // 기준경비율: 5,000,000 + 40,000,000×17.4% = 11,960,000
  assert.equal(r.standard.expenses, 11_960_000);
  assert.equal(r.standard.income, 28_040_000);
  assert.equal(r.simpleBetter, true);
  assert.ok(r.simple.tax < r.standard.tax);
});

test('직전연도 수입이 상한 이상이면 단순경비율 적용 불가', () => {
  const r = calcExpenseRatio({
    revenue: 40_000_000,
    simpleRate: 64.1,
    standardRate: 17.4,
    prevRevenue: 40_000_000,
  });
  assert.equal(r.simpleEligible, false);
});

test('엣지 케이스', () => {
  const r = calcExpenseRatio({ revenue: 0, simpleRate: 64.1, standardRate: 17.4 });
  assert.equal(r.simple.income, 0);
  assert.equal(r.standard.income, 0);
  assert.equal(r.simple.tax, 0);
});
