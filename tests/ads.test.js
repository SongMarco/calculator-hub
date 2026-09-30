import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { AD_CLIENT, AD_SLOTS, AD_FORMAT } from '../src/lib/ads.js';

test('광고 설정: 게시자 ID 형식', () => {
  assert.match(AD_CLIENT, /^ca-pub-\d+$/);
});

test('광고 설정: 슬롯 ID는 실제 발급된 숫자 ID', () => {
  assert.match(AD_SLOTS.RESULT_BOTTOM, /^\d{10}$/);
  assert.match(AD_SLOTS.IN_CONTENT, /^\d{10}$/);
  assert.notEqual(AD_SLOTS.RESULT_BOTTOM, AD_SLOTS.IN_CONTENT);
  assert.ok(!AD_SLOTS.RESULT_BOTTOM.includes('XXXX'));
});

test('광고 설정: 반응형 포맷', () => {
  assert.equal(AD_FORMAT, 'auto');
});

test('AdSlot 컴포넌트가 ads.js 상수를 참조 (하드코딩 금지)', () => {
  const src = readFileSync('src/components/AdSlot.astro', 'utf8');
  assert.ok(src.includes("from '../lib/ads.js'"));
  assert.ok(src.includes('data-ad-slot={slotId}'));
  assert.ok(!src.includes('XXXX'));
  // 광고/콘텐츠 구분 라벨 존재
  assert.ok(src.includes('광고'));
});

test('계산기 페이지의 광고 밀도: 페이지당 최대 2개', () => {
  const dirs = readdirSync('src/pages', { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);
  for (const d of dirs) {
    const p = `src/pages/${d}/index.astro`;
    let s;
    try {
      s = readFileSync(p, 'utf8');
    } catch {
      continue;
    }
    const count = (s.match(/<AdSlot /g) || []).length;
    // 계산기·복지 페이지만 광고 허용, 그 외(404 등)는 0개
    const isCalcPage = s.includes('class="calc"');
    if (isCalcPage) {
      assert.ok(count >= 1 && count <= 2, `${d}: AdSlot ${count}개 (1~2개여야 함)`);
    } else {
      assert.equal(count, 0, `${d}: 비계산기 페이지에 광고 금지`);
    }
  }
});

test('구 플레이스홀더(data-ad-slot="XXXX") 잔재 없음', () => {
  const layout = readFileSync('src/layouts/BaseLayout.astro', 'utf8');
  assert.ok(!layout.includes('XXXX'));
});
