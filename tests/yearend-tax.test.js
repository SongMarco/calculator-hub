import { test } from 'node:test';
import assert from 'node:assert/strict';
import { earnedIncomeDeduction, earnedTaxCredit, pensionTaxCredit, calcYearEndTax } from '../src/lib/yearend-tax.js';

test('근로소득공제 구간', () => {
  assert.equal(earnedIncomeDeduction(5_000_000), 3_500_000);
  assert.equal(earnedIncomeDeduction(40_000_000), 7_500_000 + 25_000_000 * 0.15);
  assert.equal(earnedIncomeDeduction(50_000_000), 14_500_000 + 5_000_000 * 0.05);
  assert.equal(earnedIncomeDeduction(200_000_000), 17_500_000 + 100_000_000 * 0.02);
  assert.equal(earnedIncomeDeduction(300_000_000), 20_000_000); // 한도
});

test('근로소득세액공제', () => {
  assert.equal(earnedTaxCredit(30_000_000, 1_000_000), 550_000);
  assert.equal(earnedTaxCredit(30_000_000, 10_000_000), 740_000); // 한도
  assert.equal(earnedTaxCredit(80_000_000, 10_000_000), 500_000); // 총급여 초과 한도
});

test('연금계좌 세액공제', () => {
  assert.equal(pensionTaxCredit(50_000_000, 9_000_000), 1_350_000); // 15%
  assert.equal(pensionTaxCredit(80_000_000, 9_000_000), 1_080_000); // 12%
  assert.equal(pensionTaxCredit(80_000_000, 12_000_000), 1_080_000); // 납입 한도
});

test('총급여 5천만원·1인·연금 600만원·기납부 300만원', () => {
  const r = calcYearEndTax({ totalPay: 50_000_000, dependents: 1, pensionContribution: 6_000_000, prepaid: 3_000_000 });
  // 근로소득공제: 1450만 + 500만*0.05 = 1475만
  assert.equal(r.incomeDeduction, 14_750_000);
  assert.equal(r.personalDeduction, 1_500_000);
  assert.equal(r.taxBase, 50_000_000 - 14_750_000 - 1_500_000);
  assert.ok(r.computedTax > 0);
  assert.ok(r.finalTax >= 0);
  assert.equal(r.balance, r.finalTax - 3_000_000);
});

test('과세표준 0이면 결정세액 0', () => {
  const r = calcYearEndTax({ totalPay: 5_000_000, dependents: 3, pensionContribution: 0, prepaid: 100_000 });
  assert.equal(r.taxBase, 0);
  assert.equal(r.finalTax, 0);
  assert.equal(r.isRefund, true);
  assert.equal(r.balance, -100_000);
});
