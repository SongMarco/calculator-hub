import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  calcSalary, calcPension, calcHealth, calcLongTermCare, calcEmployment,
  earnedIncomeDeduction, baseTax, earnedTaxCreditLimit, cut10, RATES_2026,
} from '../src/lib/salary.js';

test('2026년 요율 상수', () => {
  assert.equal(RATES_2026.pensionRate, 0.0475);
  assert.equal(RATES_2026.healthRate, 0.03595);
  assert.equal(RATES_2026.longTermCareRate, 0.1314);
  assert.equal(RATES_2026.employmentRate, 0.009);
});

test('cut10: 10원 미만 절사 (부동소수점 오차 방지)', () => {
  assert.equal(cut10(29699.999999996), 29700);
  assert.equal(cut10(118634.9999), 118630);
  assert.equal(cut10(156750), 156750);
});

test('국민연금: 상한액 적용 (2026년 7월 기준 659만원)', () => {
  assert.equal(calcPension(3_300_000), 156750); // 330만원 × 4.75%
  assert.equal(calcPension(10_000_000), 313020); // 659만원 × 4.75% 절사 (상한)
  assert.equal(calcPension(0), 0);
});

test('건강보험·장기요양·고용보험', () => {
  assert.equal(calcHealth(3_300_000), 118630); // ×3.595% 절사
  assert.equal(calcLongTermCare(118630), 15580); // ×13.14% 절사
  assert.equal(calcEmployment(3_300_000), 29700); // ×0.9%
});

test('근로소득공제 구간표', () => {
  assert.equal(earnedIncomeDeduction(42_000_000), 11_550_000);
  assert.equal(earnedIncomeDeduction(5_000_000), 3_500_000);
});

test('기본세율 누진공제 경계', () => {
  assert.equal(baseTax(14_000_000), 840_000);
  assert.equal(baseTax(15_000_000), 990_000); // 15M×15% − 126만
  assert.equal(baseTax(0), 0);
});

test('근로소득세액공제 한도', () => {
  assert.equal(earnedTaxCreditLimit(30_000_000), 1_000_000);
  assert.equal(earnedTaxCreditLimit(100_000_000), 750_000);
});

test('연봉 4200만원 실수령액 (2026년 요율)', () => {
  const r = calcSalary({ annualSalary: 42_000_000 });
  assert.equal(r.insuranceMonthly, 320660);
  assert.equal(r.taxMonthly, 144587);
  assert.equal(r.netMonthly, 3034753);
  // sanity 범위: 외부 레퍼런스(약 281만원, 간이세액표 기준)와 ±10% 이내여야 함
  assert.ok(r.netMonthly > 2_500_000 && r.netMonthly < 3_200_000);
});

test('엣지 케이스', () => {
  const zero = calcSalary({ annualSalary: 0 });
  assert.equal(zero.netMonthly, 0);
  assert.equal(zero.insuranceMonthly, 0);
  const neg = calcSalary({ annualSalary: -100 });
  assert.equal(neg.netMonthly, 0);
});
