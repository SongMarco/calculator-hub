// GET /api/unsubscribe?token= — 수신거부 확정: 토큰 검증 → 컨택트 삭제
// 토큰은 /api/unsubscribe-request 에서 발송된 서명 링크의 것 (수신거부도 본인 확인 절차)
import { resend, getAudienceId, findContact, verifyToken, resultPage } from './_lib.js';

export default async function handler(req, res) {
  try {
    const email = verifyToken(req.query?.token);
    if (!email) {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.status(400).send(resultPage(
        '수신거부 실패',
        '❌ 유효하지 않은 링크입니다',
        '<p>링크가 만료되었거나 잘못되었습니다.</p>',
      ));
    }
    const audienceId = await getAudienceId();
    const contact = await findContact(audienceId, email);
    if (contact) {
      const dr = await resend(`/audiences/${audienceId}/contacts/${contact.id}`, { method: 'DELETE' });
      if (!dr.ok && dr.status !== 404) throw new Error(`contact delete failed: ${dr.status}`);
    }
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(200).send(resultPage(
      '수신거부 완료',
      '✅ 수신거부가 처리되었습니다',
      '<p>앞으로 뉴스레터가 발송되지 않습니다.<br>이용해주셔서 감사합니다.</p>',
    ));
  } catch (e) {
    console.error(e);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(500).send(resultPage(
      '오류',
      '❌ 처리 중 오류가 발생했습니다',
      '<p>잠시 후 다시 시도해주세요.</p>',
    ));
  }
}
