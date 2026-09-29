import { test } from 'node:test';
import assert from 'node:assert/strict';
import { calcHourlyWage, calcWeeklyLeaveHours, WAGE_2026 } from '../src/lib/hourly-wage.js';

test('2026년 상수: 최저시급 10,320원', () => {
  assert.equal(WAGE_2026.minHourly, 10_320);
  assert.equal(WAGE_2026.weeklyFactor, 4.345);
  assert.equal(WAGE_2026.leaveThreshold, 15);
});

test('주휴시간: (주 근로시간 ÷ 40) × 8, 상한 8시간, 15시간 미만 0', () => {
  assert.equal(calcWeeklyLeaveHours(40), 8);
  assert.equal(calcWeeklyLeaveHours(50), 8); // 상한
  assert.equal(calcWeeklyLeaveHours(20), 4);
  assert.equal(calcWeeklyLeaveHours(15), 3);
  assert.equal(calcWeeklyLeaveHours(14), 0);
  assert.equal(calcWeeklyLeaveHours(0), 0);
});

test('최저시급 주 40시간 → 월 209시간, 2,156,880원 (고시와 일치)', () => {
  const r = calcHourlyWage({ hourlyWage: 10_320, weeklyHours: 40 });
  assert.equal(r.hasLeavePay, true);
  assert.equal(r.leaveHours, 8);
  assert.equal(r.weeklyLeavePay, 82_560);
  assert.equal(r.paidWeeklyHours, 48);
  assert.equal(r.monthlyHours, 209);
  assert.equal(r.monthlyPay, 2_156_880);
  assert.equal(r.effectiveHourly, 12_384); // 주휴 포함 실질 시급
  assert.equal(r.belowMinimum, false);
});

test('주 20시간 → 주휴 4시간, 월 104시간', () => {
  const r = calcHourlyWage({ hourlyWage: 10_320, weeklyHours: 20 });
  assert.equal(r.leaveHours, 4);
  assert.equal(r.monthlyHours, 104);
  assert.equal(r.monthlyPay, 1_073_280);
});

test('주 15시간 미만 → 주휴수당 없음', () => {
  const r = calcHourlyWage({ hourlyWage: 10_320, weeklyHours: 12 });
  assert.equal(r.hasLeavePay, false);
  assert.equal(r.leaveHours, 0);
  assert.equal(r.monthlyHours, 52);
  assert.equal(r.monthlyPay, 536_640);
});

test('최저임금 미달 경고', () => {
  assert.equal(calcHourlyWage({ hourlyWage: 9_000, weeklyHours: 40 }).belowMinimum, true);
  assert.equal(calcHourlyWage({ hourlyWage: 10_320, weeklyHours: 40 }).belowMinimum, false);
  assert.equal(calcHourlyWage({ hourlyWage: 0, weeklyHours: 40 }).belowMinimum, false);
});

test('엣지 케이스', () => {
  const zero = calcHourlyWage({ hourlyWage: 0, weeklyHours: 0 });
  assert.equal(zero.monthlyPay, 0);
  assert.equal(zero.effectiveHourly, 0);
});
