import { test } from 'node:test';
import assert from 'node:assert/strict';
import { calcFreelancer } from '../src/lib/freelancer.js';

test('프리랜서 3.3% 원천징수', () => {
  const r = calcFreelancer({ payment: 1_000_000 });
  assert.equal(r.incomeTax, 30000); // 3%
  assert.equal(r.localTax, 3000); // 0.3%
  assert.equal(r.withholding, 33000);
  assert.equal(r.withholdingRate, 3.3);
  assert.equal(r.net, 967000);
});

test('엣지 케이스', () => {
  assert.equal(calcFreelancer({ payment: 0 }).net, 0);
  assert.equal(calcFreelancer({ payment: -500 }).net, 0);
  const r = calcFreelancer({ payment: 3_333_333 });
  assert.equal(r.net, r.payment - r.withholding);
});
