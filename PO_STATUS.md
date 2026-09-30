# PO 상태 (프로덕트 오너 개선 루프)

## 2026-09-30 09:10 KST — 루프 시작
- 임무: 14:45까지 제품 개선 루프. 우선순위: (1) 뉴스레터 발송 리팩터 (2) 신규 계산기 2~3개 (3) SEO/콘텐츠 (4) 지속 탐색.

## 2026-09-30 09:20 KST — 뉴스레터 발송 리팩터 완료
- `api/send-digest.js` 신규: POST + Bearer(NEWSLETTER_SEND_SECRET) 인증, body {programs:[{title,summary,url,brackets}]} → Resend Audience 조회 → first_name(소득구간) 매칭 + active 구독자에게 /emails/batch 발송(100건 단위), 1인 1통 중복 제거, 서명 수신거부 링크 포함.
- 발신자 통일: `계산기허브 뉴스레터 <news@news.calc.choronglight.com>` (api/_lib.js FROM + mailFooter 수정).
- `scripts/send-newsletter.mjs` (구 custom.resend 방식) 삭제. calc-hub-newsletter-sender cron은 부모 에이전트가 재연결 예정 — 미터치.

## 2026-09-30 09:12 KST — 뉴스레터 후속 작업 완료 (부모 에이전트 지시)
- 발신자 `계산기허브 뉴스레터 <news@news.calc.choronglight.com>` 통일 (api/_lib.js FROM + mailFooter).
- Resend audience 자동 생성: getAudienceId()가 RESEND_AUDIENCE_ID env > 이름 조회 > 없으면 POST /audiences 생성.
- marco 지정 1차 모니터링 소스 등록: 정책브리핑(https://www.korea.kr/, 신규 발표 감시 최우선) + 복지로(https://www.bokjiro.go.kr/ssis-tbu/index.do, 검증용). 정책 워처 cron 본문 + docs/welfare-sources.md에 반영.
- 푸시: b5c22e1.

## 2026-09-30 09:12 KST — 신규 계산기 3종 착수
- 선정: 생애최초 취득세 감면 / 3.3% 환급금 / 단순경비율 vs 기준경비율.
- 2026년 기준 수치 웹 리서치 후 구현.
