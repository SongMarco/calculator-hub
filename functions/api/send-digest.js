// POST /api/send-digest — 주간 뉴스레터 발송 (런타임 크론이 호출)
// 헤더: Authorization: Bearer <NEWSLETTER_SEND_SECRET>
// body: { programs: [{ title, summary, url, brackets: ['b1'~'b5'] }] }
// Resend Audience 컨택트를 조회해 first_name(소득구간)이 program.brackets에 포함되고
// 수신거부하지 않은(active) 구독자에게 발송. 발신자는 _lib.js 의 FROM.
import {
  resend, getAudienceId, signToken,
  siteUrl, FROM, BRACKETS, jsonResponse, safeEqual,
} from '../_lib.js';

function checkAuth(env, request) {
  const h = request.headers.get('authorization') || '';
  const m = /^Bearer\s+(.+)$/.exec(h);
  if (!m) return false;
  const expected = env.NEWSLETTER_SEND_SECRET || '';
  if (!expected) return false;
  return safeEqual(m[1], expected);
}

async function allContacts(env, audienceId) {
  const out = [];
  let page = 1;
  for (;;) {
    const r = await resend(env, `/audiences/${audienceId}/contacts?page=${page}&per_page=100`);
    if (!r.ok) throw new Error(`contacts 조회 실패: ${r.status}`);
    const j = await r.json();
    const items = j.data || [];
    out.push(...items);
    if (items.length < 100) break;
    page += 1;
    if (page > 50) break; // 안전 상한 5000명
  }
  return out;
}

function esc(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

async function digestHtml(env, email, programs) {
  const cards = programs.map((p) => `
    <div style="background:#f8fafc;border:1px solid #e5e7eb;border-radius:14px;padding:18px 20px;margin:0 0 14px">
      <div style="font-weight:800;font-size:16px;color:#191f28;margin:0 0 6px">${esc(p.title)}</div>
      <p style="margin:0 0 10px;color:#4b5563;font-size:14px;line-height:1.7">${esc(p.summary)}</p>
      <a href="${esc(p.url)}" style="color:#1d4ed8;font-weight:700;font-size:14px">공식 안내 보기 →</a>
    </div>`).join('');
  const unsub = `${siteUrl(env)}/api/unsubscribe?token=${await signToken(env, email)}`;
  return `<!DOCTYPE html><html lang="ko"><head><meta charset="utf-8"></head>
<body style="font-family:-apple-system,'Apple SD Gothic Neo','Pretendard','Noto Sans KR',sans-serif;max-width:600px;margin:0 auto;padding:24px 16px;color:#191f28;line-height:1.7;background:#ffffff">
  <div style="margin:0 0 20px">
    <div style="font-size:22px;font-weight:800;margin:0 0 6px">🧮 이번 주 새로 나온 정부 지원금</div>
    <p style="margin:0;color:#6b7280;font-size:14px">내 연봉 구간에 해당되는 새 제도만 골라 보내드립니다.</p>
  </div>
  ${cards}
  <hr style="border:none;border-top:1px solid #e5e7eb;margin:28px 0 16px">
  <p style="font-size:12px;color:#9aa1ad;line-height:1.8;margin:0">
    발신자: 계산기허브 뉴스레터 &lt;news@news.calc.choronglight.com&gt;<br>
    본 메일은 calc.choronglight.com/welfare/ 에서 뉴스레터 구독을 신청하신 분께 발송되었습니다.<br>
    수신을 원치 않으시면 <a href="${unsub}" style="color:#1d4ed8">여기에서 수신거부</a>할 수 있습니다.
  </p>
</body></html>`;
}

export async function onRequestPost({ request, env }) {
  if (!checkAuth(env, request)) {
    return jsonResponse({ ok: false, error: 'unauthorized' }, 401);
  }

  try {
    let body = {};
    try {
      body = await request.json();
    } catch {
      body = {};
    }
    const { programs } = body;
    if (!Array.isArray(programs)) {
      return jsonResponse({ ok: false, error: 'programs 배열이 필요합니다.' }, 400);
    }
    const valid = programs.filter(
      (p) => p && typeof p.title === 'string' && p.title.trim() &&
        Array.isArray(p.brackets) && p.brackets.every((b) => BRACKETS[b]),
    );
    if (valid.length === 0) {
      return jsonResponse({ ok: true, sent: 0, note: '발송할 프로그램이 없습니다.' });
    }

    const audienceId = await getAudienceId(env);
    const contacts = await allContacts(env, audienceId);
    // 수신 대상: 수신거부하지 않은(active) 컨택트
    const active = contacts.filter((c) => c.unsubscribed === false && c.email);

    // 수신자별 매칭 프로그램 수집 (중복 발송 방지: 1인 1통)
    const perRecipient = new Map(); // email -> { programs: [] }
    for (const p of valid) {
      for (const c of active) {
        const bracket = c.first_name; // 소득구간 id (b1~b5) 인코딩 규칙
        if (!bracket || !p.brackets.includes(bracket)) continue;
        const em = String(c.email).toLowerCase();
        if (!perRecipient.has(em)) perRecipient.set(em, { programs: [] });
        const entry = perRecipient.get(em);
        if (!entry.programs.includes(p)) entry.programs.push(p);
      }
    }

    const batch = [];
    for (const [em, entry] of perRecipient) {
      batch.push({
        from: FROM,
        to: em,
        subject: `이번 주 새 정부 지원금 ${entry.programs.length}건이 나왔어요`,
        html: await digestHtml(env, em, entry.programs),
      });
    }

    let sent = 0;
    for (let i = 0; i < batch.length; i += 100) {
      const chunk = batch.slice(i, i + 100);
      const r = await resend(env, '/emails/batch', { method: 'POST', body: chunk });
      if (!r.ok) {
        console.error('batch send failed', r.status, await r.text());
        return jsonResponse({ ok: false, error: '발송 중 오류가 발생했습니다.', sent }, 502);
      }
      sent += chunk.length;
    }

    return jsonResponse({ ok: true, sent, programs: valid.length });
  } catch (e) {
    console.error(e);
    return jsonResponse({ ok: false, error: '서버 오류가 발생했습니다.' }, 500);
  }
}
