import { test } from 'node:test';
import assert from 'node:assert/strict';
import { calcUnemployment, getBenefitDays, DAILY_CAP_2026, DAILY_FLOOR_2026 } from '../src/lib/unemployment.js';

test('2026년 상한·하한 상수', () => {
  assert.equal(DAILY_CAP_2026, 68_100);
  assert.equal(DAILY_FLOOR_2026, 66_048);
});

test('50세 미만 소정급여일수', () => {
  assert.equal(getBenefitDays(0.5), 120);
  assert.equal(getBenefitDays(2), 150);
  assert.equal(getBenefitDays(4), 180);
  assert.equal(getBenefitDays(7), 210);
  assert.equal(getBenefitDays(12), 240);
});

test('50세 이상·장애인 소정급여일수', () => {
  assert.equal(getBenefitDays(0.5, true), 120);
  assert.equal(getBenefitDays(2, true), 180);
  assert.equal(getBenefitDays(4, true), 210);
  assert.equal(getBenefitDays(7, true), 240);
  assert.equal(getBenefitDays(12, true), 270);
});

test('상한·하한 사이 구간은 실액 지급', () => {
  const r = calcUnemployment({ avgWage: 112_000, years: 10 });
  assert.equal(r.daily, 67_200);
  assert.equal(r.days, 240);
  assert.equal(r.total, 67_200 * 240);
  assert.equal(r.cappedHigh, false);
  assert.equal(r.cappedLow, false);
});

test('상한 적용: 고소득자도 68,100원', () => {
  const r = calcUnemployment({ avgWage: 300_000, years: 5 });
  assert.equal(r.daily, 68_100);
  assert.equal(r.cappedHigh, true);
});

test('하한 적용: 저소득자도 66,048원', () => {
  const r = calcUnemployment({ avgWage: 50_000, years: 0.5 });
  assert.equal(r.daily, 66_048);
  assert.equal(r.cappedLow, true);
  assert.equal(r.total, 66_048 * 120);
});

test('엣지 케이스', () => {
  const r = calcUnemployment({ avgWage: 0, years: 0 });
  assert.equal(r.days, 120);
  assert.equal(r.total, 66_048 * 120);
});
