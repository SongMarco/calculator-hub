# METRICS.md — 계산기 허브 지표

North Star: 3개월 내 AdSense 월 300만원 (월 PV × RPM).

## 기준선 (2026-09-30 14:00, GA4·서치콘솔·Postmaster 설치 직후)
| 지표 | 값 | 출처 | 비고 |
|---|---|---|---|
| 월 PV | ~0 | GA4 (G-9X0RGDJTGV) | 2026-09-30 설치, 데이터 수집 시작 |
| AdSense 노출 (calc.choronglight.com) | 0 (보고서상 행 없음, 2026-09-30 확인) | AdSense 보고서 | 실광고 렌더링은 스크린샷으로 확인됨. 노출 집계는 상위 도메인 합산 또는 지연 가능 |
| AdSense 계정 전체 (최근 7일) | 노출 54 · 클릭 0 · 예상 US$0.21 (PV 279) | AdSense 보고서 | 주로 tiny.choronglight.com(35)·choronglight.com(19) |
| AdSense 잔고 | US$59.23 | AdSense 계정 | 지급 기준 $100 미달 |
| 뉴스레터 실구독자 | 0 | Resend audience | 테스트 1건은 수신거부 상태 |
| 뉴스레터 Gmail 도착률 | 0% (조용히 차단) | Gmail 확인 | 신규 도메인 워밍업 이슈, Postmaster 등록됨 |
| Search Console 노출/클릭 | 0 | Search Console | 2026-09-30 소유권 확인, 색인 대기 |
| 계산기 수 | 19 | 사이트 | - |
| 테스트 | 139/139 | npm test | - |
| 개인정보처리방침 | 있음 (/privacy/) | 사이트 | 2026-09-30 신설, 푸터·구독폼 연결 |
| 네이버 서치어드바이저 | 등록 완료 (2026-09-30) | - | 소유확인·사이트맵 제출·수집 요청 3건 완료. 색인은 10/01 08:38 기준 미반영 |

## 2026-10-01 08:40 KST 갱신
- AdSense calc.choronglight.com 개별 행 **최초 집계**: 예상 US$0.01 · PV 30 · 노출 18 · 클릭 0 (페이지 RPM US$0.17, Active View 27.78%). 어제(9/30 14:17)까지 행 자체가 없었음 → 광고 노출 집계 시작 확인 (헌장 완료 정의 충족).
- AdSense 계정 전체 (최근 7일, 9/24~9/30): PV 321 · 노출 75 · 클릭 0 · 예상 US$0.23 (어제 279/54/0/US$0.21 대비 +42/+21/0/+$0.02, 기간 1일 이동 포함).
- 사이트별: tiny.choronglight.com US$0.21 (183 PV/41 노출), choronglight.com US$0.01 (93 PV/16 노출), steady.choronglight.com US$0.00 (4 PV). 전 사이트 클릭 0.
- 네이버 색인: 10/01 08:38 확인 결과 미반영 (수집 요청 후 ~18시간, 수일 소요 예상).

## 갱신 규칙
- 매주 목요일 SEO 닥터(calc-hub-seo-doctor)가 PV·노출·클릭 갱신
- 매월 1일 수익 리포터(calc-hub-revenue-reporter)가 AdSense 잔고·수익 갱신
- North Star 대비 진척은 월간으로 평가
