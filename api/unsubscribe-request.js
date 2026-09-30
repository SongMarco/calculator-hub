// POST /api/unsubscribe-request — 수신거부 링크 요청
// body: { email } → 컨택트가 있으면 서명된 수신거부 링크를 이메일로 발송
// (이메일이 등록되지 않아도 항상 성공 응답 → 이메일 존재 여부 노출 방지)
import {
  resend, getAudienceId, findContact, signToken, isValidEmail,
  SITE_URL, FROM, mailFooter,
} from './_lib.js';

const ALLOWED_ORIGINS = ['https://calc.choronglight.com', 'https://songmarco.github.io'];

function applyCors(req, res) {
  const origin = req.headers.origin || '';
  if (ALLOWED_ORIGINS.some((a) => origin === a || origin.startsWith(a + '/'))) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

export default async function handler(req, res) {
  applyCors(req, res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: '허용되지 않은 요청입니다.' });

  try {
    const em = String(req.body?.email || '').trim().toLowerCase();
    if (!isValidEmail(em)) return res.status(400).json({ ok: false, error: '이메일 형식이 올바르지 않습니다.' });

    const audienceId = await getAudienceId();
    const contact = await findContact(audienceId, em);
    if (contact) {
      const link = `${SITE_URL}/api/unsubscribe?token=${signToken(em)}`;
      await resend('/emails', {
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
${mailFooter()}
</div>`,
        },
      });
    }
    return res.status(200).json({ ok: true, message: '수신거부 확인 이메일이 발송되었습니다. 메일함의 링크를 눌러 해지를 완료해주세요.' });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ ok: false, error: '서버 오류가 발생했습니다.' });
  }
}
