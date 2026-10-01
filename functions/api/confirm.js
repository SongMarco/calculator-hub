// GET /api/confirm?token= — 이중 옵트인 2단계: 토큰 검증 → 컨택트 active 전환
import { resend, getAudienceId, findContact, verifyToken, htmlResponse, BRACKETS } from '../_lib.js';

export async function onRequestGet({ request, env }) {
  const fail = (title, heading, bodyHtml, status) => htmlResponse(env, title, heading, bodyHtml, status);
  try {
    const token = new URL(request.url).searchParams.get('token');
    const email = await verifyToken(env, token);
    if (!email) {
      return fail('구독 확인 실패', '❌ 유효하지 않은 링크입니다',
        '<p>링크가 만료되었거나 잘못되었습니다.<br>구독을 다시 신청해주세요.</p>', 400);
    }
    const audienceId = await getAudienceId(env);
    const contact = await findContact(env, audienceId, email);
    if (!contact) {
      return fail('구독 확인 실패', '❌ 구독 정보를 찾을 수 없습니다',
        '<p>이미 수신거부되었거나 존재하지 않는 구독입니다.</p>', 404);
    }
    if (!contact.unsubscribed) {
      return fail('구독 확인됨', '✅ 이미 구독 중입니다',
        '<p>매주 화요일에 새 소식을 보내드립니다.</p>', 200);
    }
    const ur = await resend(env, `/audiences/${audienceId}/contacts/${contact.id}`, {
      method: 'PATCH',
      body: { unsubscribed: false },
    });
    if (!ur.ok) throw new Error(`contact update failed: ${ur.status}`);
    const bracketLabel = BRACKETS[contact.first_name] || '선택 구간';
    return fail('구독 확인됨', '🎉 구독이 확인되었습니다',
      `<p><strong>${bracketLabel}</strong> 구간에 해당되는 새 정부 지원금·소비쿠폰 소식을<br>매주 화요일 이메일로 보내드립니다.</p>`, 200);
  } catch (e) {
    console.error(e);
    return fail('오류', '❌ 처리 중 오류가 발생했습니다',
      '<p>잠시 후 다시 시도해주세요.</p>', 500);
  }
}
