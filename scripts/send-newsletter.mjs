#!/usr/bin/env node
// 복지 뉴스레터 주간 발송 스크립트 (매주 화요일 cron에서 실행)
// 1. hidden_files/newsletter-digest.json 읽기 (정책 워처가 월요일에 작성)
// 2. Resend audience 'calc-hub-welfare' 컨택트 조회 (active만)
// 3. 소득구간(b1~b5) 세그먼트별로 해당되는 신규 제도만 골라 Resend batch 발송
// 4. 발송 완료 시 다이제스트에 sent_at 기록
//
// Resend 인증: custom.resend 커넥터 (scripts/resend-cred.py 경유, surrogate 방식)
// 종료 코드: 0=정상(발송 또는 스킵), 1=오류, 2=인증 미연결
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { MEDIAN_INCOME_2026 } from '../src/data/welfare.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIGEST_PATH = '/home/hatch/workspace/goals/calculator-hub-adsense-side-project/hidden_files/newsletter-digest.json';
const AUDIENCE_NAME = 'calc-hub-welfare';
const FROM = '계산기허브 뉴스레터 <news@calc.choronglight.com>';
const UNSUB_PAGE = 'https://calc.choronglight.com/welfare/unsubscribe/';

const BRACKETS = [
  { id: 'b1', label: '3천만원 미만', lower: 0, upper: 3000 },
  { id: 'b2', label: '3천 ~ 5천만원', lower: 3000, upper: 5000 },
  { id: 'b3', label: '5천 ~ 7천만원', lower: 5000, upper: 7000 },
  { id: 'b4', label: '7천 ~ 1억원', lower: 7000, upper: 10000 },
  { id: 'b5', label: '1억원 이상', lower: 10000, upper: null },
];

function apiKey() {
  try {
    const out = execFileSync('python3', [path.join(__dirname, 'resend-cred.py')], { encoding: 'utf8', timeout: 15000 });
    const { surrogate, placement, error } = JSON.parse(out);
    if (error || !surrogate || !String(surrogate).startsWith('hsurr:')) throw new Error(error || 'bad surrogate');
    if (placement && placement !== 'bearer_header') throw new Error(`unsupported placement: ${JSON.stringify(placement)}`);
    return surrogate;
  } catch (e) {
    console.error(JSON.stringify({ ok: false, error: 'auth', message: 'custom.resend 커넥터가 연결되지 않았습니다.' }));
    process.exit(2);
  }
}

async function resend(key, p, { method = 'GET', body } = {}) {
  const r = await fetch('https://api.resend.com' + p, {
    method,
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!r.ok) throw new Error(`Resend ${method} ${p} → ${r.status}: ${await r.text()}`);
  return r.json();
}

// 제도 소득 상한(만원). src/pages/welfare/index.astro의 capOf와 동일 로직
function capOf(income, household) {
  if (!income || income.type === 'none') return Infinity;
  if (income.type === 'median') {
    const base = MEDIAN_INCOME_2026[Math.min(household, 6)] || MEDIAN_INCOME_2026[4];
    return Math.floor((base * income.percent) / 100 / 10000);
  }
  return income.amount;
}

function matches(cap, br) {
  const upper = br.upper === null ? Infinity : br.upper;
  if (cap >= upper) return true;   // ok
  if (cap < br.lower) return false; // no
  return true; // warn: 경계 구간도 "연봉에 따라 해당 가능"으로 포함
}

function hhLabel(hh) {
  return hh === 4 ? '4인 이상' : `${hh}인`;
}

function buildHtml(bracketLabel, items) {
  const cards = items.map((it) => `
    <div style="border:1px solid #e5e7eb;border-radius:14px;padding:18px;margin:14px 0">
      <div style="font-size:17px;font-weight:800;margin-bottom:6px">${it.title}</div>
      <div style="font-size:14px;color:#4b5563;line-height:1.7">${it.summary}</div>
      <div style="font-size:13px;color:#1d4ed8;font-weight:700;margin-top:8px">💰 ${it.benefit}</div>
      <div style="font-size:13px;color:#6b7280;margin-top:4px">대상: ${it.target}</div>
      <div style="margin-top:10px"><a href="${it.url}" style="color:#1d4ed8;font-weight:700;font-size:14px">${it.urlLabel || '공식 안내 확인하기'} ↗</a></div>
    </div>`).join('');
  return `<div style="font-family:-apple-system,'Apple SD Gothic Neo',sans-serif;max-width:600px;margin:0 auto;line-height:1.8;color:#191f28">
<h2 style="font-size:20px">📬 이번 주 새로운 정부 지원금 소식</h2>
<p><strong>${bracketLabel}</strong> 구간에 해당될 수 있는 신규 제도 <strong>${items.length}건</strong>이 발표되었습니다.</p>
${cards}
<p style="font-size:13px;color:#6b7280">소득 기준만으로 가린 1차 참고 결과입니다. 나이·무주택 여부 등 다른 조건도 함께 충족해야 하며, 신청 전 반드시 공식 사이트의 최신 공고를 확인하세요.</p>
<hr style="border:none;border-top:1px solid #e5e7eb;margin:28px 0 16px">
<p style="font-size:12px;color:#9aa1ad;line-height:1.8;margin:0">
발신자: 계산기허브 뉴스레터 &lt;news@calc.choronglight.com&gt;<br>
본 메일은 calc.choronglight.com/welfare/ 에서 뉴스레터 구독을 신청하신 분께 발송되었습니다.<br>
수신을 원치 않으시면 <a href="${UNSUB_PAGE}" style="color:#1d4ed8">여기에서 수신거부</a>할 수 있습니다.
</p></div>`;
}

async function main() {
  let digest;
  try {
    digest = JSON.parse(fs.readFileSync(DIGEST_PATH, 'utf8'));
  } catch {
    console.log(JSON.stringify({ ok: true, skipped: 'no-digest' }));
    return;
  }
  const items = digest.items || [];
  if (items.length === 0 || digest.sent_at) {
    console.log(JSON.stringify({ ok: true, skipped: digest.sent_at ? 'already-sent' : 'empty' }));
    return;
  }

  const key = apiKey();
  const { data: audiences } = await resend(key, '/audiences');
  const audience = (audiences || []).find((a) => a.name === AUDIENCE_NAME);
  if (!audience) throw new Error(`audience '${AUDIENCE_NAME}' 없음: scripts/create-audience.mjs 실행 필요`);

  const { data: contacts } = await resend(key, `/audiences/${audience.id}/contacts`);
  const active = (contacts || []).filter((c) => !c.unsubscribed && BRACKETS.some((b) => b.id === c.first_name));
  if (active.length === 0) {
    console.log(JSON.stringify({ ok: true, skipped: 'no-subscribers' }));
    return;
  }

  // 세그먼트별 매칭
  const jobs = [];
  for (const br of BRACKETS) {
    const seg = active.filter((c) => c.first_name === br.id);
    if (seg.length === 0) continue;
    // 가구원수별로 매칭 (가구원수는 last_name)
    const matchedByHh = new Map();
    for (const c of seg) {
      const hh = [1, 2, 3, 4].includes(Number(c.last_name)) ? Number(c.last_name) : 1;
      if (!matchedByHh.has(hh)) {
        matchedByHh.set(hh, items.filter((it) => matches(capOf(it.income, hh), br)));
      }
    }
    for (const c of seg) {
      const hh = [1, 2, 3, 4].includes(Number(c.last_name)) ? Number(c.last_name) : 1;
      const matched = matchedByHh.get(hh);
      if (matched.length === 0) continue;
      jobs.push({
        from: FROM,
        to: [c.email],
        subject: `[계산기허브] 이번 주 새 정부 지원금 ${matched.length}건 (${br.label} 구간)`,
        html: buildHtml(`${br.label} · ${hhLabel(hh)} 가구`, matched),
      });
    }
  }

  if (jobs.length === 0) {
    console.log(JSON.stringify({ ok: true, skipped: 'no-matching-items' }));
    return;
  }

  let sent = 0;
  for (let i = 0; i < jobs.length; i += 100) {
    const batch = jobs.slice(i, i + 100);
    const r = await resend(key, '/emails/batch', { method: 'POST', body: batch });
    sent += (r.data || []).length;
  }

  digest.sent_at = new Date().toISOString();
  digest.sent_count = sent;
  fs.writeFileSync(DIGEST_PATH, JSON.stringify(digest, null, 2) + '\n');
  const stamp = new Date().toISOString().slice(0, 10);
  fs.writeFileSync(
    path.join(path.dirname(DIGEST_PATH), `newsletter-digest-sent-${stamp}.json`),
    JSON.stringify(digest, null, 2) + '\n',
  );
  console.log(JSON.stringify({ ok: true, sent, segments: BRACKETS.map((b) => b.id) }));
}

main().catch((e) => {
  console.error(JSON.stringify({ ok: false, error: e.message }));
  process.exit(1);
});
