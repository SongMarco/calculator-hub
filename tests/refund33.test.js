import { test } from 'node:test';
import assert from 'node:assert/strict';
import { calcRefund33 } from '../src/lib/refund33.js';

test('4천만원 수입·단순경비율 64.1% → 환급 (블로그 검증 케이스)', () => {
  // 필요경비 25,640,000 / 소득금액 14,360,000 / 과세표준 12,860,000
  // 산출세액 771,600 / 기납부 1,320,000 → 환급 548,400
  const r = calcRefund33({
    income: 40_000_000,
    expenses: 25_640_000,
    prepaid: 1_320_000,
    personalDeduction: 1_500_000,
  });
  assert.equal(r.taxableIncome, 14_360_000);
  assert.equal(r.taxBase, 12_860_000);
  assert.equal(r.assessed, 771_600);
  assert.equal(r.refund, 548_400);
  assert.equal(r.isRefund, true);
});

test('기납부세액 기본값은 수입의 3.3%', () => {
  const r = calcRefund33({ income: 10_000_000, expenses: 0 });
  assert.equal(r.prepaid, 330_000);
});

test('소득이 크면 추가 납부', () => {
  const r = calcRefund33({ income: 100_000_000, expenses: 10_000_000 });
  // 소득금액 9,000만 / 과세표준 8,850만 / 산출세액 35% 구간
  assert.equal(r.isRefund, false);
  assert.ok(r.refund < 0);
});

test('엣지 케이스', () => {
  const r = calcRefund33({ income: 0, expenses: 0 });
  assert.equal(r.refund, 0);
  assert.equal(r.assessed, 0);
});
