import { test } from 'node:test';
import assert from 'node:assert/strict';
import { calcNationalPension, A_VALUE_2026 } from '../src/lib/national-pension.js';

test('A값 2026 상수', () => {
  assert.equal(A_VALUE_2026, 3_193_511);
});

test('20년 가입·월소득 300만원', () => {
  const r = calcNationalPension({ monthlyIncome: 3_000_000, months: 240 });
  assert.equal(r.factor, 1);
  assert.equal(r.monthlyBase, Math.floor(1.2 * (3_193_511 + 3_000_000) / 12));
  assert.ok(r.monthly > 600_000 && r.monthly < 700_000);
});

test('10년 가입은 50%', () => {
  const r = calcNationalPension({ monthlyIncome: 3_000_000, months: 120 });
  assert.equal(r.factor, 0.5);
});

test('30년 가입은 150%', () => {
  const r = calcNationalPension({ monthlyIncome: 3_000_000, months: 360 });
  assert.equal(r.factor, 1.5);
});

test('부양가족 가산', () => {
  const base = calcNationalPension({ monthlyIncome: 3_000_000, months: 240 });
  const fam = calcNationalPension({ monthlyIncome: 3_000_000, months: 240, spouse: 1, others: 2 });
  assert.equal(fam.dependentMonthly, Math.floor((306_630 + 204_360 * 2) / 12));
  assert.equal(fam.monthly, base.monthly + fam.dependentMonthly);
});

test('최소 가입기간 120개월 적용', () => {
  const r = calcNationalPension({ monthlyIncome: 3_000_000, months: 60 });
  assert.equal(r.months, 120);
});
