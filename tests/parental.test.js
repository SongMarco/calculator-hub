import { test } from 'node:test';
import assert from 'node:assert/strict';
import { calcParentalLeave, LEAVE_BRACKETS_2026, LEAVE_MIN_PAY } from '../src/lib/parental.js';

test('2026년 지급 기준 상수', () => {
  assert.deepEqual(LEAVE_BRACKETS_2026[0], { from: 1, to: 3, rate: 1.0, cap: 2_500_000 });
  assert.deepEqual(LEAVE_BRACKETS_2026[1], { from: 4, to: 6, rate: 1.0, cap: 2_000_000 });
  assert.deepEqual(LEAVE_BRACKETS_2026[2], { from: 7, to: 18, rate: 0.8, cap: 1_600_000 });
  assert.equal(LEAVE_MIN_PAY, 700_000);
});

test('통상임금 300만원 × 12개월', () => {
  const r = calcParentalLeave({ monthlyWage: 3_000_000, months: 12 });
  assert.equal(r.schedule[0].pay, 2_500_000); // 1개월차: 상한
  assert.equal(r.schedule[2].pay, 2_500_000); // 3개월차
  assert.equal(r.schedule[3].pay, 2_000_000); // 4개월차
  assert.equal(r.schedule[6].pay, 1_600_000); // 7개월차
  assert.equal(r.schedule[11].pay, 1_600_000); // 12개월차
  assert.equal(r.total, 23_100_000); // 250×3 + 200×3 + 160×6
});

test('통상임금이 상한보다 낮으면 실액 지급', () => {
  const r = calcParentalLeave({ monthlyWage: 1_800_000, months: 3 });
  assert.equal(r.schedule[0].pay, 1_800_000);
  assert.equal(r.total, 5_400_000);
});

test('7개월차 80% 적용', () => {
  const r = calcParentalLeave({ monthlyWage: 1_800_000, months: 7 });
  assert.equal(r.schedule[6].pay, 1_440_000); // 180만 × 80%
});

test('엣지 케이스', () => {
  assert.equal(calcParentalLeave({ monthlyWage: 0, months: 12 }).total, 0);
  const over = calcParentalLeave({ monthlyWage: 3_000_000, months: 30 });
  assert.equal(over.months, 18); // 최대 18개월로 제한
});
