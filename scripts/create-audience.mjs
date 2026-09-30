#!/usr/bin/env node
// Resend audience 'calc-hub-welfare' 부트스트랩: 없으면 생성하고 ID를 출력.
// 사용법: node scripts/create-audience.mjs
// 출력된 ID를 Vercel 환경변수 RESEND_AUDIENCE_ID에 등록한다.
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const AUDIENCE_NAME = 'calc-hub-welfare';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

function apiKey() {
  try {
    const out = execFileSync('python3', [path.join(__dirname, 'resend-cred.py')], { encoding: 'utf8', timeout: 15000 });
    const { surrogate, placement, error } = JSON.parse(out);
    if (error || !surrogate || !String(surrogate).startsWith('hsurr:')) {
      throw new Error(error || 'bad surrogate');
    }
    if (placement && placement !== 'bearer_header') {
      throw new Error(`unsupported placement: ${JSON.stringify(placement)}`);
    }
    return surrogate;
  } catch (e) {
    console.error('❌ custom.resend 커넥터가 연결되지 않았습니다. Resend API 키를 먼저 연결해주세요.');
    process.exit(2);
  }
}

async function main() {
  const key = apiKey();
  const headers = { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' };

  const lr = await fetch('https://api.resend.com/audiences', { headers });
  if (!lr.ok) throw new Error(`audiences 조회 실패: ${lr.status} ${await lr.text()}`);
  const { data } = await lr.json();
  const found = (data || []).find((a) => a.name === AUDIENCE_NAME);
  if (found) {
    console.log(`이미 존재함: ${AUDIENCE_NAME} (id=${found.id})`);
    console.log(`Vercel 환경변수: RESEND_AUDIENCE_ID=${found.id}`);
    return;
  }
  const cr = await fetch('https://api.resend.com/audiences', {
    method: 'POST', headers, body: JSON.stringify({ name: AUDIENCE_NAME }),
  });
  if (!cr.ok) throw new Error(`audience 생성 실패: ${cr.status} ${await cr.text()}`);
  const created = await cr.json();
  console.log(`생성됨: ${AUDIENCE_NAME} (id=${created.id})`);
  console.log(`Vercel 환경변수: RESEND_AUDIENCE_ID=${created.id}`);
}

main().catch((e) => { console.error('❌', e.message); process.exit(1); });
