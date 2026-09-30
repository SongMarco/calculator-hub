// 계산기허브 뉴스레터 API 공용 모듈 (Vercel Serverless Functions)
// Resend Contacts API: 커스텀 메타데이터 미지원 → first_name=소득구간(b1~b5), last_name=가구원수("1"~"4") 로 인코딩
// 구독 상태: unsubscribed=true → 확인 대기(pending), false → 구독 중(active)
import crypto from 'node:crypto';

export const SITE_URL = process.env.SITE_URL || 'https://calc.choronglight.com';
export const AUDIENCE_NAME = 'calc-hub-welfare';
export const FROM = '계산기허브 뉴스레터 <news@calc.choronglight.com>';
const RESEND_BASE = 'https://api.resend.com';

export const BRACKETS = {
  b1: '3천만원 미만',
  b2: '3천 ~ 5천만원',
  b3: '5천 ~ 7천만원',
  b4: '7천 ~ 1억원',
  b5: '1억원 이상',
};

function env(name) {
  const v = process.env[name];
  if (!v) throw new Error(`missing env ${name}`);
  return v;
}

export async function resend(path, { method = 'GET', body } = {}) {
  const r = await fetch(RESEND_BASE + path, {
    method,
    headers: {
      Authorization: `Bearer ${env('RESEND_API_KEY')}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  return r;
}

export async function getAudienceId() {
  if (process.env.RESEND_AUDIENCE_ID) return process.env.RESEND_AUDIENCE_ID;
  const r = await resend('/audiences');
  if (!r.ok) throw new Error('audiences 조회 실패');
  const j = await r.json();
  const found = (j.data || []).find((a) => a.name === AUDIENCE_NAME);
  if (!found) throw new Error('audience 미생성: scripts/create-audience.mjs 실행 필요');
  return found.id;
}

export async function findContact(audienceId, email) {
  const target = email.toLowerCase();
  const r = await resend(`/audiences/${audienceId}/contacts`);
  if (!r.ok) throw new Error('contacts 조회 실패');
  const j = await r.json();
  return (j.data || []).find((c) => (c.email || '').toLowerCase() === target) || null;
}

// 이중 옵트인/수신거부용 상태 비보존 토큰: base64url(email).hmac_sha256(email)
export function signToken(email) {
  const em = email.toLowerCase();
  const e = Buffer.from(em, 'utf8').toString('base64url');
  const sig = crypto.createHmac('sha256', env('SIGNING_SECRET')).update(em).digest('hex');
  return `${e}.${sig}`;
}

export function verifyToken(token) {
  if (typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 2 || !parts[0] || !parts[1]) return null;
  let email;
  try {
    email = Buffer.from(parts[0], 'base64url').toString('utf8');
  } catch {
    return null;
  }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return null;
  const em = email.toLowerCase();
  const expected = crypto.createHmac('sha256', env('SIGNING_SECRET')).update(em).digest('hex');
  const a = Buffer.from(parts[1], 'utf8');
  const b = Buffer.from(expected, 'utf8');
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  return em;
}

export function isValidEmail(s) {
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(String(s || '').trim());
}

// 간단한 결과 HTML 페이지
export function resultPage(title, heading, bodyHtml) {
  return `<!DOCTYPE html><html lang="ko"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title} | 계산기허브</title>
<style>
body{font-family:-apple-system,'Apple SD Gothic Neo','Pretendard','Noto Sans KR',sans-serif;
max-width:560px;margin:0 auto;padding:56px 20px;color:#191f28;line-height:1.7;background:#f8fafc}
.box{background:#fff;border-radius:20px;padding:36px 28px;text-align:center;box-shadow:0 4px 24px rgba(0,0,0,.06)}
h1{font-size:1.3rem;margin:0 0 12px}
p{margin:8px 0;color:#4b5563}
a{color:#1d4ed8;font-weight:700}
.home{display:inline-block;margin-top:18px;padding:12px 28px;background:#1d4ed8;color:#fff!important;
border-radius:999px;text-decoration:none;font-weight:800}
</style></head><body><div class="box"><h1>${heading}</h1>${bodyHtml}
<a class="home" href="${SITE_URL}/welfare/">정부 지원금 찾기로 돌아가기</a></div></body></html>`;
}

export function mailFooter() {
  return `<hr style="border:none;border-top:1px solid #e5e7eb;margin:28px 0 16px">
<p style="font-size:12px;color:#9aa1ad;line-height:1.8;margin:0">
발신자: 계산기허브 뉴스레터 &lt;news@calc.choronglight.com&gt;<br>
본 메일은 calc.choronglight.com/welfare/ 에서 뉴스레터 구독을 신청하신 분께 발송되었습니다.<br>
수신을 원치 않으시면 <a href="${SITE_URL}/welfare/unsubscribe/" style="color:#1d4ed8">여기에서 수신거부</a>할 수 있습니다.
</p>`;
}
