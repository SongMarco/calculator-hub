import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { calcCoupangPay, SHIFTS } from '../src/lib/coupang-night.js';

const W = 10320; // 2026년 최저시급

describe('calcCoupangPay', () => {
  it('완전 야간조(22:00~06:00, 휴게 60분): 전 시간 야간 가산', () => {
    const r = calcCoupangPay({ hourlyWage: W, startMin: 22 * 60, endMin: 30 * 60, breakMin: 60, workDays: 22 });
    assert.equal(r.workHours, 7);
    assert.equal(r.nightHours, 7);
    assert.equal(r.basePay, 72240); // 10320 × 7
    assert.equal(r.nightBonus, 36120); // 10320 × 0.5 × 7
    assert.equal(r.dailyTotal, 108360);
    assert.equal(r.monthly, 108360 * 22);
  });

  it('주간조(09:00~18:00): 야간 가산 없음', () => {
    const r = calcCoupangPay({ hourlyWage: W, startMin: 9 * 60, endMin: 18 * 60, breakMin: 60 });
    assert.equal(r.nightHours, 0);
    assert.equal(r.nightBonus, 0);
    assert.equal(r.dailyTotal, 82560); // 10320 × 8
  });

  it('오후조(14:00~23:00): 야간 1시간 비례 배분', () => {
    const r = calcCoupangPay({ hourlyWage: W, startMin: 14 * 60, endMin: 23 * 60, breakMin: 60 });
    // 야간 원시 60분 × (480/540) = 53.333…분
    const expectedNightHours = (60 * (480 / 540)) / 60;
    assert.ok(Math.abs(r.nightHours - expectedNightHours) < 1e-9);
    assert.equal(r.basePay, 82560);
    assert.equal(r.nightBonus, Math.floor(W * 0.5 * expectedNightHours));
    assert.equal(r.dailyTotal, r.basePay + r.nightBonus);
  });

  it('심야조(19:00~익일 04:00): 자정 경계 야간 계산', () => {
    const r = calcCoupangPay({ hourlyWage: W, startMin: 19 * 60, endMin: 28 * 60, breakMin: 60 });
    // 야간 원시 360분(22:00~04:00) × (480/540) = 320분
    assert.ok(Math.abs(r.nightHours - 320 / 60) < 1e-9);
    assert.equal(r.basePay, 82560);
    assert.equal(r.nightBonus, 27520); // 10320 × 0.5 × 320/60
    assert.equal(r.dailyTotal, 110080);
  });

  it('새벽 근무(00:00~09:00): 하루 전 야간 구간 매칭', () => {
    const r = calcCoupangPay({ hourlyWage: W, startMin: 0, endMin: 9 * 60, breakMin: 60 });
    // 야간 원시 360분(00:00~06:00) × (480/540) = 320분
    assert.ok(Math.abs(r.nightHours - 320 / 60) < 1e-9);
  });

  it('휴게시간 0분이면 전 시간 근로', () => {
    const r = calcCoupangPay({ hourlyWage: W, startMin: 22 * 60, endMin: 30 * 60, breakMin: 0 });
    assert.equal(r.workHours, 8);
    assert.equal(r.nightHours, 8);
    assert.equal(r.dailyTotal, 123840); // 10320 × 8 × 1.5
  });

  it('월 근무일수 0이면 월 예상 0원', () => {
    const r = calcCoupangPay({ hourlyWage: W, startMin: 9 * 60, endMin: 18 * 60, breakMin: 60, workDays: 0 });
    assert.equal(r.monthly, 0);
  });

  it('잘못된 입력은 0으로 처리', () => {
    const r = calcCoupangPay({ hourlyWage: -100, startMin: 0, endMin: 0, breakMin: -30 });
    assert.equal(r.dailyTotal, 0);
    assert.equal(r.hourlyWage, 0);
  });
});

describe('SHIFTS', () => {
  it('프리셋 4종이 있고 시간대가 유효함', () => {
    assert.equal(SHIFTS.length, 4);
    for (const s of SHIFTS) {
      assert.ok(s.startMin >= 0 && s.startMin < 24 * 60);
      assert.ok(s.endMin > 0);
    }
  });

  it('프리셋으로 계산이 동작함', () => {
    for (const s of SHIFTS) {
      const r = calcCoupangPay({ hourlyWage: W, startMin: s.startMin, endMin: s.endMin, breakMin: s.breakMin, workDays: 20 });
      assert.ok(r.dailyTotal > 0, s.name);
    }
  });
});
