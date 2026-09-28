import { test } from 'node:test';
import assert from 'node:assert/strict';
import { calcDSR, monthlyPayment, STRESS_RATE_METRO_MORTGAGE, DSR_LIMIT_BANK } from '../src/lib/dsr.js';

test('원리금균등상환 공식', () => {
  // 3억원, 연 4%, 30년 → 월 약 1,432,246원 (공개 레퍼런스 일치)
  assert.equal(Math.round(monthlyPayment(300_000_000, 0.04, 30)), 1432246);
  // 무이자
  assert.equal(monthlyPayment(12_000_000, 0, 1), 1_000_000);
});

test('DSR 기본 계산: 연소득 6000만원, 3억 주담대', () => {
  const r = calcDSR({
    annualIncome: 60_000_000,
    newLoan: { amount: 300_000_000, rate: 0.04, years: 30, type: 'mortgage', region: 'metro', rateType: 'variable' },
  });
  assert.equal(r.newMonthly, 1432246);
  assert.equal(r.dsr, 28.64);
  assert.equal(r.withinLimit, true);
  // 스트레스 DSR: 수도권 주담대 변동형 → +3.0%p
  assert.equal(r.stressApplied, true);
  assert.equal(r.stressRate, 7);
  assert.ok(r.stressDsr > r.dsr);
  assert.equal(r.stressWithinLimit, true);
});

test('DSR 한도 초과 케이스', () => {
  const r = calcDSR({
    annualIncome: 60_000_000,
    existingAnnualPayments: 20_000_000,
    newLoan: { amount: 300_000_000, rate: 0.04, years: 30 },
  });
  assert.equal(r.withinLimit, false);
  assert.ok(r.dsr > DSR_LIMIT_BANK);
});

test('지방 주담대는 스트레스 미적용', () => {
  const r = calcDSR({
    annualIncome: 60_000_000,
    newLoan: { amount: 300_000_000, rate: 0.04, years: 30, region: 'local' },
  });
  assert.equal(r.stressApplied, false);
  assert.equal(r.stressDsr, r.dsr);
});

test('엣지 케이스', () => {
  const r = calcDSR({ annualIncome: 0, newLoan: { amount: 100_000_000, rate: 0.04, years: 10 } });
  assert.equal(r.dsr, 0);
});
