import { test } from 'node:test';
import assert from 'node:assert/strict';
import { calcSeverance, seniorityDeduction, convertedSalaryDeduction } from '../src/lib/severance.js';

test('근속연수공제 구간표', () => {
  assert.equal(seniorityDeduction(3), 3_000_000);
  assert.equal(seniorityDeduction(10), 15_000_000);
  assert.equal(seniorityDeduction(25), 45_000_000 + 25_000_000);
});

test('환산급여공제 구간표', () => {
  assert.equal(convertedSalaryDeduction(5_000_000), 5_000_000);
  assert.equal(convertedSalaryDeduction(70_000_000), 45_200_000);
});

test('퇴직금 표준 예시: 월급 300만원 × 3년 (상여 없음)', () => {
  // 3개월 900만원 / 92일 / 재직 1095일 → 세전 약 881만원 (공개 예시와 일치)
  const r = calcSeverance({ wages3mo: 9_000_000, days3mo: 92, tenureDays: 1095 });
  assert.equal(r.gross, 8804348);
  assert.equal(r.totalTax, 96768);
  assert.equal(r.net, 8707580);
  assert.ok(r.net < r.gross && r.net > r.gross * 0.9);
});

test('상여금·연차수당 반영', () => {
  const base = calcSeverance({ wages3mo: 9_000_000, days3mo: 92, tenureDays: 1095 });
  const withBonus = calcSeverance({
    wages3mo: 9_000_000, days3mo: 92, bonusAnnual: 6_000_000, leavePay: 1_000_000, tenureDays: 1095,
  });
  assert.ok(withBonus.gross > base.gross);
  assert.ok(withBonus.avgDaily > base.avgDaily);
});

test('엣지 케이스', () => {
  const r = calcSeverance({ wages3mo: 0, days3mo: 92, tenureDays: 0 });
  assert.equal(r.gross, 0);
  assert.equal(r.net, 0);
});
