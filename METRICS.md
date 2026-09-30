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
| 네이버 서치어드바이저 | 미등록 | - | 2026-09-30 등록 추진 중 |

## 갱신 규칙
- 매주 목요일 SEO 닥터(calc-hub-seo-doctor)가 PV·노출·클릭 갱신
- 매월 1일 수익 리포터(calc-hub-revenue-reporter)가 AdSense 잔고·수익 갱신
- North Star 대비 진척은 월간으로 평가
