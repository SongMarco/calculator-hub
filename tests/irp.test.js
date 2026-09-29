import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  calcIrp, calcRetireTax, pensionEffectiveRate, pensionEarningRate, IRP_2026,
} from '../src/lib/irp.js';

test('IRP 2026 상수', () => {
  assert.deepEqual(IRP_2026.pensionRates, [
    { upTo: 10, rate: 0.7 },
    { upTo: 20, rate: 0.6 },
    { upTo: Infinity, rate: 0.5 },
  ]);
  assert.equal(IRP_2026.lumpSumEarningRate, 0.165);
  assert.equal(IRP_2026.pensionAge, 55);
});

test('수령 기간별 실효세율 (가중평균)', () => {
  assert.equal(pensionEffectiveRate(10), 0.7);
  assert.equal(pensionEffectiveRate(1), 0.7);
  // 20년: (10×0.7 + 10×0.6) / 20 = 0.65
  assert.equal(pensionEffectiveRate(20), 0.65);
  // 25년: (10×0.7 + 10×0.6 + 5×0.5) / 25 = 0.62
  assert.equal(pensionEffectiveRate(25), 0.62);
  assert.equal(pensionEffectiveRate(0), 1);
});

test('수령 개시 나이별 운용수익 연금소득세율', () => {
  assert.equal(pensionEarningRate(60), 0.055);
  assert.equal(pensionEarningRate(70), 0.044);
  assert.equal(pensionEarningRate(85), 0.033);
});

test('퇴직소득세: 퇴직금 1억·근속 10년 → 약 388만원 (공개 예시와 유사)', () => {
  const tax = calcRetireTax(100_000_000, 10);
  // 근속연수공제 1,500만원 → 과세 8,500만원 → 환산 1억200만원
  // 환산급여공제 6,260만원 → 과세표준 3,940만원 → 세율 15%
  // 산출세액 465만원 ÷ 12 × 10 = 387.5만원
  assert.equal(Math.round(tax), 3_875_000);
  assert.equal(calcRetireTax(0, 10), 0);
  assert.equal(calcRetireTax(100_000_000, 0), 0);
});

test('퇴직금 1억·근속 10년·10년 연금: 절세액 ≈ 일시금 세금의 30%', () => {
  const r = calcIrp({ severanceGross: 100_000_000, tenureYears: 10, pensionYears: 10 });
  assert.equal(r.lumpTax, 4_262_500); // 387.5만원 × 1.1
  assert.equal(r.effRate, 70);
  assert.equal(r.pensionTax, 2_983_750); // 387.5만원 × 0.7 × 1.1
  assert.equal(r.saving, 1_278_750); // = 4,262,500 × 0.3
  assert.equal(r.lumpNet + r.lumpTax, 100_000_000);
});

test('운용수익 1000만원: 일시금 16.5% vs 연금(60세) 5.5%', () => {
  const r = calcIrp({
    severanceGross: 100_000_000,
    tenureYears: 10,
    pensionYears: 10,
    startAge: 60,
    extraEarnings: 10_000_000,
  });
  assert.equal(r.earnLumpTax, 1_650_000);
  assert.equal(r.earnPensionTax, 550_000);
  assert.equal(r.earnSaving, 1_100_000);
  assert.equal(r.totalSaving, r.saving + r.earnSaving);
});

test('55세 미만 개시 → 연금 수령 불가 플래그', () => {
  const r = calcIrp({ severanceGross: 50_000_000, tenureYears: 5, startAge: 50 });
  assert.equal(r.pensionEligible, false);
  const ok = calcIrp({ severanceGross: 50_000_000, tenureYears: 5, startAge: 55 });
  assert.equal(ok.pensionEligible, true);
});

test('엣지 케이스', () => {
  const zero = calcIrp({ severanceGross: 0, tenureYears: 10 });
  assert.equal(zero.lumpTax, 0);
  assert.equal(zero.saving, 0);
});
