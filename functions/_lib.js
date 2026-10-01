// 계산기허브 뉴스레터 API 공용 모듈 (Cloudflare Pages Functions)
// api/_lib.js (Vercel)의 Workers 포팅. 차이점:
// - process.env 대신 context.env를 인자로 받는다
// - node:crypto 대신 Web Crypto API 사용 (nodejs_compat 불필요)
// - 토큰 형식은 Vercel 버전과 완전히 동일: base64url(email).hmac_sha256_hex(email)
//   → SIGNING_SECRET이 같으면 이전에 발급된 토큰도 그대로 검증됨
export const AUDIENCE_NAME = 'calc-hub-welfare';
export const FROM = '계산기허브 뉴스레터 <news@news.calc.choronglight.com>';
const RESEND_BASE = 'https://api.resend.com';

export const BRACKETS = {
  b1: '3천만원 미만',
  b2: '3천 ~ 5천만원',
  b3: '5천 ~ 7천만원',
  b4: '7천 ~ 1억원',
  b5: '1억원 이상',
};

export function siteUrl(env) {
  return env.SITE_URL || 'https://calc.choronglight.com';
}

function need(env, name) {
  const v = env[name];
  if (!v) throw new Error(`missing env ${name}`);
  return v;
}

export async function resend(env, path, { method = 'GET', body } = {}) {
  const r = await fetch(RESEND_BASE + path, {
    method,
    headers: {
      Authorization: `Bearer ${need(env, 'RESEND_API_KEY')}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  return r;
}

export async function getAudienceId(env) {
  if (env.RESEND_AUDIENCE_ID) return env.RESEND_AUDIENCE_ID;
  const r = await resend(env, '/audiences');
  if (!r.ok) throw new Error('audiences 조회 실패');
  const j = await r.json();
  const found = (j.data || []).find((a) => a.name === AUDIENCE_NAME);
  if (found) return found.id;
  // Resend 대시보드에는 audience 생성 UI가 없으므로(API 전용) 없으면 자동 생성
  const cr = await resend(env, '/audiences', { method: 'POST', body: { name: AUDIENCE_NAME } });
  if (!cr.ok) throw new Error(`audience 생성 실패: ${cr.status}`);
  const created = await cr.json();
  if (!created.id) throw new Error('audience 생성 응답에 id 없음');
  return created.id;
}

export async function findContact(env, audienceId, email) {
  const target = email.toLowerCase();
  const r = await resend(env, `/audiences/${audienceId}/contacts`);
  if (!r.ok) throw new Error('contacts 조회 실패');
  const j = await r.json();
  return (j.data || []).find((c) => (c.email || '').toLowerCase() === target) || null;
}

// base64url (패딩 없음) — Node의 Buffer.toString('base64url')과 동일
export function b64urlEncode(str) {
  const bytes = new TextEncoder().encode(str);
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function b64urlDecode(s) {
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(b64);
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

async function hmacHex(secret, message) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

// 상수 시간 문자열 비교 (timingSafeEqual 대체)
export function safeEqual(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

// 이중 옵트인/수신거부용 상태 비보존 토큰: base64url(email).hmac_sha256(email)
export async function signToken(env, email) {
  const em = email.toLowerCase();
  const e = b64urlEncode(em);
  const sig = await hmacHex(need(env, 'SIGNING_SECRET'), em);
  return `${e}.${sig}`;
}

export async function verifyToken(env, token) {
  if (typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 2 || !parts[0] || !parts[1]) return null;
  let email;
  try {
    email = b64urlDecode(parts[0]);
  } catch {
    return null;
  }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return null;
  const em = email.toLowerCase();
  const expected = await hmacHex(need(env, 'SIGNING_SECRET'), em);
  if (!safeEqual(parts[1], expected)) return null;
  return em;
}

export function isValidEmail(s) {
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(String(s || '').trim());
}

// 간단한 결과 HTML 페이지
export function resultPage(env, title, heading, bodyHtml) {
  const url = siteUrl(env);
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
<a class="home" href="${url}/welfare/">정부 지원금 찾기로 돌아가기</a></div></body></html>`;
}

export function mailFooter(env) {
  const url = siteUrl(env);
  return `<hr style="border:none;border-top:1px solid #e5e7eb;margin:28px 0 16px">
<p style="font-size:12px;color:#9aa1ad;line-height:1.8;margin:0">
발신자: 계산기허브 뉴스레터 &lt;news@news.calc.choronglight.com&gt;<br>
본 메일은 calc.choronglight.com/welfare/ 에서 뉴스레터 구독을 신청하신 분께 발송되었습니다.<br>
수신을 원치 않으시면 <a href="${url}/welfare/unsubscribe/" style="color:#1d4ed8">여기에서 수신거부</a>할 수 있습니다.
</p>`;
}

// 공용 응답 헬퍼
export function jsonResponse(obj, status = 200, headers = {}) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...headers },
  });
}

export function htmlResponse(env, title, heading, bodyHtml, status = 200) {
  return new Response(resultPage(env, title, heading, bodyHtml), {
    status,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}
