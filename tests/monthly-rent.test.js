import { test } from 'node:test';
import assert from 'node:assert/strict';
import { calcRentCredit, rentCreditRate, RENT_CREDIT_2026 } from '../src/lib/monthly-rent.js';

test('2026년 월세 세액공제 상수', () => {
  assert.equal(RENT_CREDIT_2026.incomeLimit, 80_000_000);
  assert.equal(RENT_CREDIT_2026.rateLow, 0.17);
  assert.equal(RENT_CREDIT_2026.rateHigh, 0.15);
  assert.equal(RENT_CREDIT_2026.annualCap, 10_000_000);
});

test('공제율 구간 경계', () => {
  assert.equal(rentCreditRate(55_000_000), 0.17);
  assert.equal(rentCreditRate(55_000_001), 0.15);
  assert.equal(rentCreditRate(80_000_000), 0.15);
  assert.equal(rentCreditRate(80_000_001), 0); // 초과 시 공제 불가
  assert.equal(rentCreditRate(0), 0.17);
});

test('월세 60만원·총급여 5000만원 → 720만원 × 17%', () => {
  const r = calcRentCredit({ monthlyRent: 600_000, totalSalary: 50_000_000 });
  assert.equal(r.annualRent, 7_200_000);
  assert.equal(r.rate, 0.17);
  assert.equal(r.capped, false);
  assert.equal(r.credit, 1_224_000);
  assert.equal(r.refund, 1_224_000);
  assert.equal(r.eligible, true);
});

test('한도 초과: 월세 100만원 → 1000만원 × 17% = 170만원', () => {
  const r = calcRentCredit({ monthlyRent: 1_000_000, totalSalary: 50_000_000 });
  assert.equal(r.capped, true);
  assert.equal(r.credit, 1_700_000);
});

test('총급여 6000만원 구간 → 15%', () => {
  const r = calcRentCredit({ monthlyRent: 800_000, totalSalary: 60_000_000 });
  assert.equal(r.rate, 0.15);
  assert.equal(r.credit, 1_440_000); // 960만원 × 15%
});

test('총급여 8000만원 초과 → 공제 불가', () => {
  const r = calcRentCredit({ monthlyRent: 600_000, totalSalary: 85_000_000 });
  assert.equal(r.eligible, false);
  assert.equal(r.credit, 0);
});

test('자격 미달(전입신고 누락 등) → 공제 불가', () => {
  const r = calcRentCredit({ monthlyRent: 600_000, totalSalary: 50_000_000, eligible: false });
  assert.equal(r.credit, 0);
});

test('결정세액이 공제액보다 작으면 환급액은 결정세액까지만', () => {
  const r = calcRentCredit({
    monthlyRent: 600_000,
    totalSalary: 50_000_000,
    determinedTax: 800_000,
  });
  assert.equal(r.credit, 1_224_000);
  assert.equal(r.refund, 800_000);
});

test('엣지 케이스', () => {
  const zero = calcRentCredit({ monthlyRent: 0, totalSalary: 50_000_000 });
  assert.equal(zero.credit, 0);
  const neg = calcRentCredit({ monthlyRent: -100, totalSalary: -50 });
  assert.equal(neg.credit, 0);
});
