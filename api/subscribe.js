// POST /api/subscribe — 뉴스레터 구독 신청 (이중 옵트인 1단계)
// body: { email, bracket: 'b1'~'b5', household: 1~4, consent: true }
// → Resend 컨택트 생성(unsubscribed=true, pending) → 확인 이메일 발송
import {
  resend, getAudienceId, findContact, signToken, isValidEmail,
  SITE_URL, FROM, BRACKETS, mailFooter,
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
    const { email, bracket, household, consent } = req.body || {};
    const em = String(email || '').trim().toLowerCase();

    if (!isValidEmail(em)) return res.status(400).json({ ok: false, error: '이메일 형식이 올바르지 않습니다.' });
    if (!BRACKETS[bracket]) return res.status(400).json({ ok: false, error: '연봉 구간을 선택해주세요.' });
    const hh = Number(household);
    if (![1, 2, 3, 4].includes(hh)) return res.status(400).json({ ok: false, error: '가구원 수를 선택해주세요.' });
    if (consent !== true) return res.status(400).json({ ok: false, error: '개인정보 수집·이용에 동의해주세요.' });

    const audienceId = await getAudienceId();
    const existing = await findContact(audienceId, em);
    if (existing && !existing.unsubscribed) {
      return res.status(200).json({ ok: true, already: true, message: '이미 구독 중인 이메일입니다. 매주 화요일에 새 소식을 보내드립니다.' });
    }

    if (!existing) {
      const cr = await resend(`/audiences/${audienceId}/contacts`, {
        method: 'POST',
        // first_name=소득구간, last_name=가구원수 (Resend 커스텀 필드 미지원으로 인코딩)
        body: { email: em, first_name: bracket, last_name: String(hh), unsubscribed: true },
      });
      if (!cr.ok && cr.status !== 409) {
        console.error('contact create failed', cr.status, await cr.text());
        return res.status(502).json({ ok: false, error: '구독 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.' });
      }
    }

    const token = signToken(em);
    const link = `${SITE_URL}/api/confirm?token=${token}`;
    const hhLabel = hh === 4 ? '4인 이상' : `${hh}인`;
    const er = await resend('/emails', {
      method: 'POST',
      body: {
        from: FROM,
        to: [em],
        subject: '[계산기허브] 뉴스레터 구독을 확인해주세요',
        html: `<div style="font-family:-apple-system,'Apple SD Gothic Neo',sans-serif;max-width:560px;margin:0 auto;line-height:1.8;color:#191f28">
<h2 style="font-size:20px">📬 구독 확인</h2>
<p>안녕하세요. 계산기허브 <strong>새 지원금 알림 뉴스레터</strong> 구독을 신청해주셔서 감사합니다.</p>
<ul>
<li>연봉 구간: <strong>${BRACKETS[bracket]}</strong></li>
<li>가구원 수: <strong>${hhLabel}</strong></li>
</ul>
<p>아래 버튼을 눌러 구독을 완료해주세요. 매주 화요일, 새로 발표되는 정부 지원금·소비쿠폰 중 내 구간에 해당되는 것만 골라 보내드립니다.</p>
<p style="margin:24px 0"><a href="${link}" style="display:inline-block;background:#1d4ed8;color:#fff;text-decoration:none;font-weight:800;padding:14px 32px;border-radius:999px">구독 확인하기</a></p>
<p style="font-size:13px;color:#6b7280">버튼이 동작하지 않으면 아래 주소를 복사해 브라우저에 붙여넣어주세요.<br>${link}</p>
<p style="font-size:13px;color:#6b7280">본인이 신청하지 않으셨다면 이 메일을 무시하시면 됩니다. 구독이 완료되지 않습니다.</p>
${mailFooter()}
</div>`,
      },
    });
    if (!er.ok) {
      console.error('confirm mail failed', er.status, await er.text());
      return res.status(502).json({ ok: false, error: '확인 이메일 발송에 실패했습니다. 잠시 후 다시 시도해주세요.' });
    }
    return res.status(200).json({ ok: true, message: '확인 이메일이 발송되었습니다. 메일함에서 구독 확인을 눌러주세요.' });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ ok: false, error: '서버 오류가 발생했습니다.' });
  }
}
