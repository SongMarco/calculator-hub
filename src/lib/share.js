/**
 * 결과 공유링크 유틸리티
 *
 * 계산기 페이지의 입력값을 URL 쿼리스트링으로 인코딩해 "결과 링크 복사" 버튼으로
 * 공유하면, 링크를 받은 사람이 접속했을 때 입력값이 복원되고 자동으로 다시 계산된다.
 * (카톡·문자 공유를 노린 기능)
 *
 * 필드 디스크립터: { key, get(): string, set(v: string): void }
 * - text/select: key = input id
 * - radio: key = input name (같은 name 중 첫 번째 엘리먼트만 등록)
 * - checkbox: key = input id, 값은 '1'/'0'
 */

export function readField(f) {
  const v = f.get();
  return v == null ? '' : String(v);
}

export function collectParams(fields) {
  const p = new URLSearchParams();
  for (const f of fields) {
    const v = readField(f);
    if (v !== '') p.set(f.key, v);
  }
  return p.toString();
}

export function applyParams(fields, search) {
  const q = new URLSearchParams(search);
  let changed = false;
  for (const f of fields) {
    const v = q.get(f.key);
    if (v === null) continue;
    f.set(v);
    changed = true;
  }
  return changed;
}

function domFields(scope, skipIds) {
  const els = document.querySelectorAll(`${scope} input, ${scope} select`);
  const out = [];
  const seenRadio = new Set();
  els.forEach((el) => {
    if (el.type === 'button' || el.type === 'submit' || el.type === 'hidden') return;
    if (el.type === 'radio') {
      if (!el.name || seenRadio.has(el.name)) return;
      seenRadio.add(el.name);
      const name = el.name;
      out.push({
        key: name,
        get() {
          const c = document.querySelector(`input[name="${name}"]:checked`);
          return c ? c.value : '';
        },
        set(v) {
          const t = document.querySelector(`input[name="${name}"][value="${CSS.escape(v)}"]`);
          if (t) t.checked = true;
        },
      });
      return;
    }
    const id = el.id;
    if (!id || skipIds.has(id) || id.startsWith('r-')) return;
    out.push({
      key: id,
      get() {
        return el.type === 'checkbox' ? (el.checked ? '1' : '0') : el.value;
      },
      set(v) {
        if (el.type === 'checkbox') el.checked = v === '1';
        else el.value = v;
      },
    });
  });
  return out;
}

/**
 * 공유링크 초기화. 페이지 <script>에서 import 후 호출:
 *   import { initShareLink } from '../../lib/share.js';
 *   initShareLink();
 */
export function initShareLink(options = {}) {
  const {
    buttonId = 'share-btn',
    msgId = 'share-msg',
    calcBtnId = 'calc-btn',
    resultId = 'result',
    scope = '.calc',
  } = options;
  const $ = (id) => document.getElementById(id);
  const skipIds = new Set([buttonId, calcBtnId, msgId]);

  const btn = $(buttonId);
  if (btn) {
    btn.addEventListener('click', async () => {
      const url = new URL(location.href.split('?')[0]);
      const qs = collectParams(domFields(scope, skipIds));
      if (qs) url.search = qs;
      const msg = $(msgId);
      try {
        await navigator.clipboard.writeText(url.toString());
        if (msg) msg.textContent = '✅ 링크가 복사됐어요. 카톡·문자로 공유해 보세요!';
      } catch {
        if (msg) msg.textContent = '복사에 실패했어요. 주소창의 URL을 직접 복사해 주세요.';
      }
      if (msg) setTimeout(() => { msg.textContent = ''; }, 4000);
    });
  }

  // 공유 링크로 들어오면 입력값 복원 + 자동 계산
  if (location.search) {
    const changed = applyParams(domFields(scope, skipIds), location.search);
    if (changed) {
      const calcBtn = $(calcBtnId);
      if (calcBtn) calcBtn.click();
      const res = $(resultId);
      if (res) setTimeout(() => res.scrollIntoView({ behavior: 'smooth', block: 'start' }), 150);
    }
  }
}
