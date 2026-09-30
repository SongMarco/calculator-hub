import { test } from 'node:test';
import assert from 'node:assert/strict';
import { legalMaxRate, depositToMonthly, monthlyToDeposit } from '../src/lib/rent-conversion.js';

test('법정 상한 = min(10%, 기준금리+2%)', () => {
  assert.equal(legalMaxRate(3.0), 5.0);
  assert.equal(legalMaxRate(2.5), 4.5);
  assert.equal(legalMaxRate(9), 10);
});

test('보증금 1억 → 월세, 전환율 5%', () => {
  assert.equal(depositToMonthly({ depositDrop: 100_000_000, rate: 5 }), 416_666);
});

test('월세 50만원 → 보증금, 전환율 5%', () => {
  assert.equal(monthlyToDeposit({ monthly: 500_000, rate: 5 }), 120_000_000);
});

test('엣지 케이스', () => {
  assert.equal(depositToMonthly({ depositDrop: 0, rate: 5 }), 0);
  assert.equal(monthlyToDeposit({ monthly: 500_000, rate: 0 }), 0);
});
