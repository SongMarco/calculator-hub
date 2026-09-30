import { test } from 'node:test';
import assert from 'node:assert/strict';
import { calcOvertimePay } from '../src/lib/overtime.js';

test('연장 2시간 × 시급 1만원 = 3만원', () => {
  const r = calcOvertimePay({ hourlyWage: 10000, overtime: 2 });
  assert.equal(r.breakdown.overtime.pay, 30000);
  assert.equal(r.total, 30000);
});

test('야간 3시간 × 시급 10320원', () => {
  const r = calcOvertimePay({ hourlyWage: 10320, night: 3 });
  assert.equal(r.breakdown.night.pay, Math.floor(10320 * 1.5 * 3));
});

test('휴일 8시간 초과분은 100% 가산', () => {
  const r = calcOvertimePay({ hourlyWage: 10000, holiday: 8, holidayOver: 2 });
  assert.equal(r.breakdown.holiday.pay, 120000);
  assert.equal(r.breakdown.holidayOver.pay, 40000);
  assert.equal(r.total, 160000);
});

test('엣지 케이스', () => {
  const r = calcOvertimePay({ hourlyWage: 0, overtime: 5 });
  assert.equal(r.total, 0);
});
