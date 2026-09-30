import { test } from 'node:test';
import assert from 'node:assert/strict';
import { calcFirstHomeTax } from '../src/lib/first-home-tax.js';

test('3억원 주택 생애최초: 취득세 300만 − 감면 200만 + 교육세 10만 + 농특세 40만', () => {
  const r = calcFirstHomeTax({ price: 300_000_000, isFirstTimer: true, isDepopulated: false });
  assert.equal(r.acqTax, 3_000_000);
  assert.equal(r.reduction, 2_000_000);
  // 지방교육세는 감면 후 취득세액(100만원)의 10%
  assert.equal(r.eduTax, 100_000);
  // 농어촌특별세는 감면세액의 20% 별도 과세
  assert.equal(r.ruralTax, 400_000);
  assert.equal(r.payable, 1_500_000);
});

test('인구감소지역은 한도 300만원', () => {
  const r = calcFirstHomeTax({ price: 300_000_000, isFirstTimer: true, isDepopulated: true });
  assert.equal(r.cap, 3_000_000);
  assert.equal(r.reduction, 3_000_000);
  assert.equal(r.eduTax, 0);
  assert.equal(r.ruralTax, 600_000);
  assert.equal(r.payable, 600_000);
});

test('6억 초과 누진세율 (8억원 → 2.33%)', () => {
  const r = calcFirstHomeTax({ price: 800_000_000, isFirstTimer: true, isDepopulated: false });
  assert.equal(r.rate, 2.33);
  assert.equal(r.acqTax, 18_666_666);
  assert.equal(r.reduction, 2_000_000);
  assert.equal(r.eduTax, 1_666_666);
  assert.equal(r.ruralTax, 400_000);
  assert.equal(r.payable, 18_733_332);
});

test('12억원 초과는 감면 대상 아님', () => {
  const r = calcFirstHomeTax({ price: 1_300_000_000, isFirstTimer: true, isDepopulated: false });
  assert.equal(r.eligible, false);
  assert.equal(r.overLimit, true);
  assert.equal(r.reduction, 0);
  assert.equal(r.ruralTax, 0);
  assert.equal(r.payable, r.acqTax + r.eduTax);
});

test('생애최초 해당 없으면 감면 없음', () => {
  const r = calcFirstHomeTax({ price: 300_000_000, isFirstTimer: false, isDepopulated: false });
  assert.equal(r.reduction, 0);
  assert.equal(r.ruralTax, 0);
  assert.equal(r.payable, r.acqTax + r.eduTax);
});

test('감면액이 취득세(본세)를 초과하지 않음 (1억원 → 전액 감면 + 농특세 20만원)', () => {
  const r = calcFirstHomeTax({ price: 100_000_000, isFirstTimer: true, isDepopulated: false });
  // 취득세 100만원 전액 감면, 교육세 0원, 농특세 20만원은 별도 과세
  assert.equal(r.acqTax, 1_000_000);
  assert.equal(r.reduction, 1_000_000);
  assert.equal(r.eduTax, 0);
  assert.equal(r.ruralTax, 200_000);
  assert.equal(r.payable, 200_000);
});
