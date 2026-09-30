import { test } from 'node:test';
import assert from 'node:assert/strict';
import { calcIncomeTax } from '../src/lib/income-tax.js';

test('종합소득세 기본 구간', () => {
  assert.equal(calcIncomeTax(0), 0);
  assert.equal(calcIncomeTax(10_000_000), 600_000); // 6%
  assert.equal(calcIncomeTax(14_000_000), 840_000);
  // 15% 구간: 30,000,000 × 0.15 − 1,260,000 = 3,240,000
  assert.equal(calcIncomeTax(30_000_000), 3_240_000);
  // 24% 구간: 60,000,000 × 0.24 − 5,760,000 = 8,640,000
  assert.equal(calcIncomeTax(60_000_000), 8_640_000);
  // 35% 구간: 100,000,000 × 0.35 − 15,440,000 = 19,560,000
  assert.equal(calcIncomeTax(100_000_000), 19_560_000);
});

test('엣지 케이스', () => {
  assert.equal(calcIncomeTax(-100), 0);
  assert.equal(calcIncomeTax(14_000_001), Math.floor(14_000_001 * 0.15 - 1_260_000));
});
