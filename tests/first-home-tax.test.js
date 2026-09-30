import { test } from 'node:test';
import assert from 'node:assert/strict';
import { calcFirstHomeTax } from '../src/lib/first-home-tax.js';

test('3억원 주택 생애최초: 취득세 300만 + 교육세 30만 − 감면 200만', () => {
  const r = calcFirstHomeTax({ price: 300_000_000, isFirstTimer: true, isDepopulated: false });
  assert.equal(r.acqTax, 3_000_000);
  assert.equal(r.eduTax, 300_000);
  assert.equal(r.total, 3_300_000);
  assert.equal(r.eligible, true);
  assert.equal(r.reduction, 2_000_000);
  assert.equal(r.payable, 1_300_000);
});

test('인구감소지역은 한도 300만원', () => {
  const r = calcFirstHomeTax({ price: 300_000_000, isFirstTimer: true, isDepopulated: true });
  assert.equal(r.cap, 3_000_000);
  assert.equal(r.reduction, 3_000_000);
  assert.equal(r.payable, 300_000);
});

test('6억 초과 누진세율 (8억원 → 2.33%)', () => {
  const r = calcFirstHomeTax({ price: 800_000_000, isFirstTimer: true, isDepopulated: false });
  assert.equal(r.rate, 2.33);
  assert.equal(r.acqTax, 18_666_666);
  assert.equal(r.reduction, 2_000_000);
});

test('12억원 초과는 감면 대상 아님', () => {
  const r = calcFirstHomeTax({ price: 1_300_000_000, isFirstTimer: true, isDepopulated: false });
  assert.equal(r.eligible, false);
  assert.equal(r.overLimit, true);
  assert.equal(r.reduction, 0);
});

test('생애최초 해당 없으면 감면 없음', () => {
  const r = calcFirstHomeTax({ price: 300_000_000, isFirstTimer: false, isDepopulated: false });
  assert.equal(r.reduction, 0);
  assert.equal(r.payable, r.total);
});

test('감면액이 산출세액을 초과하지 않음', () => {
  const r = calcFirstHomeTax({ price: 100_000_000, isFirstTimer: true, isDepopulated: false });
  // 취득세 100만 + 교육세 10만 = 110만 < 한도 200만
  assert.equal(r.reduction, 1_100_000);
  assert.equal(r.payable, 0);
});
