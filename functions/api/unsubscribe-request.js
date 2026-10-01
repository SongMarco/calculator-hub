// POST /api/unsubscribe-request — 수신거부 링크 요청
// body: { email } → 컨택트가 있으면 서명된 수신거부 링크를 이메일로 발송
// (이메일이 등록되지 않아도 항상 성공 응답 → 이메일 존재 여부 노출 방지)
import {
  resend, getAudienceId, findContact, signToken, isValidEmail,
  siteUrl, FROM, mailFooter, jsonResponse,
} from '../_lib.js';

const ALLOWED_ORIGINS = ['https://calc.choronglight.com', 'https://songmarco.github.io'];

function corsHeaders(origin) {
  const h = {
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
  if (ALLOWED_ORIGINS.some((a) => origin === a || origin.startsWith(a + '/'))) {
    h['Access-Control-Allow-Origin'] = origin;
  }
  return h;
}

export async function onRequestOptions({ request }) {
  return new Response(null, {
    status: 204,
    headers: corsHeaders(request.headers.get('origin') || ''),
  });
}

export async function onRequestPost({ request, env }) {
  const cors = corsHeaders(request.headers.get('origin') || '');
  let body = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }
  const em = String(body.email || '').trim().toLowerCase();
  if (!isValidEmail(em)) return jsonResponse({ ok: false, error: '이메일 형식이 올바르지 않습니다.' }, 400, cors);

  try {
    const audienceId = await getAudienceId(env);
    const contact = await findContact(env, audienceId, em);
    if (contact) {
      const link = `${siteUrl(env)}/api/unsubscribe?token=${await signToken(env, em)}`;
      await resend(env, '/emails', {
        method: 'POST',
        body: {
          from: FROM,
          to: [em],
          subject: '[계산기허브] 수신거부 확인',
          html: `<div style="font-family:-apple-system,'Apple SD Gothic Neo',sans-serif;max-width:560px;margin:0 auto;line-height:1.8;color:#191f28">
<h2 style="font-size:20px">수신거부 확인</h2>
<p>뉴스레터 수신거부를 요청하셨습니다. 아래 버튼을 누르면 구독이 해지됩니다.</p>
<p style="margin:24px 0"><a href="${link}" style="display:inline-block;background:#4b5563;color:#fff;text-decoration:none;font-weight:800;padding:14px 32px;border-radius:999px">수신거부하기</a></p>
<p style="font-size:13px;color:#6b7280">본인이 요청하지 않으셨다면 이 메일을 무시하시면 됩니다.</p>
${mailFooter(env)}
</div>`,
        },
      });
    }
    return jsonResponse({ ok: true, message: '수신거부 확인 이메일이 발송되었습니다. 메일함의 링크를 눌러 해지를 완료해주세요.' }, 200, cors);
  } catch (e) {
    console.error(e);
    return jsonResponse({ ok: false, error: '서버 오류가 발생했습니다.' }, 500, cors);
  }
}
