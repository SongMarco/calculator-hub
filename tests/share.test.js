import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readField, collectParams, applyParams, trackShare } from '../src/lib/share.js';

// 가짜 필드 디스크립터 (DOM 없이 get/set 동작 검증)
function textField(key, initial = '') {
  let v = initial;
  return { key, get: () => v, set: (nv) => { v = nv; } };
}
function checkField(key, initial = false) {
  let c = initial;
  return { key, get: () => (c ? '1' : '0'), set: (nv) => { c = nv === '1'; }, _is: () => c };
}
function radioField(key, options, initial = '') {
  let v = initial;
  assert.ok(options.includes(v) || v === '');
  return { key, get: () => v, set: (nv) => { if (options.includes(nv)) v = nv; } };
}

test('readField: null/undefined는 빈 문자열', () => {
  assert.equal(readField({ get: () => null }), '');
  assert.equal(readField({ get: () => undefined }), '');
  assert.equal(readField({ get: () => 0 }), '0');
});

test('collectParams: 빈 값은 제외, 나머지는 인코딩', () => {
  const fields = [textField('annual', '5000'), textField('nontax', ''), textField('dependents', '2')];
  const qs = collectParams(fields);
  assert.equal(qs, 'annual=5000&dependents=2');
});

test('collectParams: 체크박스는 1/0으로 직렬화', () => {
  const fields = [checkField('agree', true), checkField('extra', false)];
  assert.equal(collectParams(fields), 'agree=1&extra=0');
});

test('collectParams: 라디오 값 직렬화', () => {
  const fields = [radioField('first', ['y', 'n'], 'y')];
  assert.equal(collectParams(fields), 'first=y');
});

test('applyParams: 쿼리스트링 복원 + 변경 여부', () => {
  const a = textField('annual');
  const b = textField('nontax');
  const changed = applyParams([a, b], '?annual=7000&unknown=1');
  assert.equal(changed, true);
  assert.equal(a.get(), '7000');
  assert.equal(b.get(), '');
});

test('applyParams: 매칭되는 키가 없으면 false', () => {
  const a = textField('annual', '5000');
  assert.equal(applyParams([a], '?foo=1'), false);
  assert.equal(a.get(), '5000');
});

test('applyParams: 체크박스·라디오 복원', () => {
  const c = checkField('agree', false);
  const r = radioField('first', ['y', 'n'], 'n');
  applyParams([c, r], '?agree=1&first=y');
  assert.equal(c._is(), true);
  assert.equal(r.get(), 'y');
});

test('applyParams: 라디오는 허용되지 않은 값 무시', () => {
  const r = radioField('first', ['y', 'n'], 'n');
  applyParams([r], '?first=x');
  assert.equal(r.get(), 'n');
});

test('round-trip: collect → apply 복원', () => {
  const src = [textField('annual', '6500'), checkField('agree', true), radioField('first', ['y', 'n'], 'y')];
  const qs = collectParams(src);
  const dst = [textField('annual'), checkField('agree'), radioField('first', ['y', 'n'])];
  assert.equal(applyParams(dst, '?' + qs), true);
  assert.equal(dst[0].get(), '6500');
  assert.equal(dst[1]._is(), true);
  assert.equal(dst[2].get(), 'y');
});

test('trackShare: gtag 목업으로 share 이벤트 전송', () => {
  const calls = [];
  globalThis.gtag = (...args) => { calls.push(args); };
  try {
    trackShare('calculator', '/salary/');
    assert.equal(calls.length, 1);
    assert.equal(calls[0][0], 'event');
    assert.equal(calls[0][1], 'share');
    assert.deepEqual(calls[0][2], { method: 'copy_link', content_type: 'calculator', item_id: '/salary/' });
  } finally {
    delete globalThis.gtag;
  }
});

test('trackShare: gtag이 없으면 에러 없이 무시', () => {
  delete globalThis.gtag;
  assert.doesNotThrow(() => trackShare('welfare', '/welfare/'));
});

test('trackShare: gtag이 예외를 던져도 공유 동작에 영향 없음', () => {
  globalThis.gtag = () => { throw new Error('blocked'); };
  try {
    assert.doesNotThrow(() => trackShare('calculator', '/salary/'));
  } finally {
    delete globalThis.gtag;
  }
});
