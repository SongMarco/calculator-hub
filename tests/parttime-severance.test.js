import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  weeklyHolidayPay,
  checkEligibility,
  calcParttimeSeverance,
} from '../src/lib/parttime-severance.js';

test('주휴수당: 주 20시간 × 시급 10,320원', () => {
  // (20/40)×8×10320 = 41,280
  assert.equal(weeklyHolidayPay(10320, 20), 41280);
});

test('주휴수당: 주 40시간이면 1일 8시간 상한', () => {
  assert.equal(weeklyHolidayPay(10320, 40), 10320 * 8);
});

test('주휴수당: 주 15시간 미만이면 0', () => {
  assert.equal(weeklyHolidayPay(10320, 14), 0);
});

test('자격 판정: 1년 이상 + 주 15시간 이상이면 대상', () => {
  const r = checkEligibility(400, 20);
  assert.equal(r.eligible, true);
  assert.equal(r.reasons.length, 0);
});

test('자격 판정: 1년 미만이면 탈락 + 사유 명시', () => {
  const r = checkEligibility(300, 20);
  assert.equal(r.eligible, false);
  assert.ok(r.reasons.some((x) => x.includes('1년 미만')));
});

test('자격 판정: 주 15시간 미만이면 탈락', () => {
  const r = checkEligibility(400, 10);
  assert.equal(r.eligible, false);
  assert.ok(r.reasons.some((x) => x.includes('15시간 미만')));
});

test('표준 예시: 시급 10,320원 × 주 20시간 × 1년 6개월, 주휴 별도', () => {
  const r = calcParttimeSeverance({
    hourlyWage: 10320,
    weeklyHours: 20,
    weeklyDays: 5,
    holidaySeparate: true,
    tenureDays: 548, // 1년 6개월 ≈ 548일
  });
  assert.equal(r.holidayPay, 41280);
  assert.equal(r.weeklyPay, 10320 * 20 + 41280);
  assert.equal(r.wages3mo, r.weeklyPay * 13);
  assert.equal(r.eligibility.eligible, true);
  // 1일 통상임금(10320×4=41280)이 평균임금보다 크면 통상임금 적용
  assert.equal(r.dailyContract, 41280);
  assert.equal(r.appliedFloor, true);
  assert.equal(r.avgDaily, 41280);
  // 세전 퇴직금 = 41280 × 30 × (548/365) ≈ 1,859,506
  assert.ok(r.gross > 1_800_000 && r.gross < 1_900_000);
  assert.ok(r.net <= r.gross && r.net > 0);
});

test('주휴수당 미포함 모드: 통상임금 하한이 받쳐줘 결과는 동일', () => {
  const withH = calcParttimeSeverance({
    hourlyWage: 10320, weeklyHours: 20, weeklyDays: 5, holidaySeparate: true, tenureDays: 400,
  });
  const withoutH = calcParttimeSeverance({
    hourlyWage: 10320, weeklyHours: 20, weeklyDays: 5, holidaySeparate: false, tenureDays: 400,
  });
  assert.ok(withoutH.wages3mo < withH.wages3mo);
  assert.equal(withoutH.holidayPay, 0);
  // 1일 통상임금(시급×1일 소정시간)이 3개월 평균(달력일 기준)보다 크면
  // 주휴수당 포함 여부와 무관하게 통상임금으로 계산됨 (근로기준법)
  assert.equal(withoutH.appliedFloor, true);
  assert.equal(withoutH.gross, withH.gross);
});
