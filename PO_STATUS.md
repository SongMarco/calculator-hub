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

## 2026-09-30 10:15 KST — 신규 계산기 3종 완료·푸시
- 생애최초 취득세 감면 (/first-home-tax/): 2026년 기준 12억 이하·200만원 한도(인구감소지역 300만원), 1~3% 누진세율 + 지방교육세, 3개월 전입요건 삭제 반영.
- 3.3% 환급금 (/refund33/): 종합소득세 간이 정산, 환급/추가납부 판정.
- 단순경비율 vs 기준경비율 (/expense-ratio/): 940909 프리셋(64.1%/17.4%), 직전연도 수입 기준 적용 가능 여부 판정.
- 공통 lib: src/lib/income-tax.js (2026년 세율표). 테스트 65/65 통과. 카드 이미지 3종 AI 생성.
- GovSupport 매핑: first-home-tax→디딤돌/버팀목, refund33→근로장려금, expense-ratio→두루누리.
- 빌드 14페이지 성공, 푸시 완료.

## 2026-09-30 10:35 KST — SEO/내부링크 개선 완료·푸시
- 신규 계산기 교차 링크: freelancer→refund33/expense-ratio, dsr→first-home-tax.
- 404 페이지 신규 (noindex). BaseLayout에 noindex prop 추가.
- docs/keywords.md 우선순위 표에 구현 완료 표시, 허브 upcoming 목록 갱신.
- 빌드 15페이지, 테스트 65/65, 푸시 완료.

## 2026-09-30 11:00 KST — 한부모 육아휴직 특례 추가·푸시
- /parental/에 한부모 토글: 1~3개월 상한 300만원(일반 250만원). lib singleParent 옵션 + 테스트 2개 추가.
- FAQ·keywords 메타에 '한부모 육아휴직 특례' 키워드 반영. docs/keywords.md #8 구현 표시.
- 테스트 67/67, 빌드 15페이지, 푸시 완료.

## 2026-09-30 11:25 KST — 실업급여 계산기 신규 추가·푸시
- /unemployment/: 2026년 1일 상한 68,100원·하한 66,048원, 소정급여일수 120~270일(연령·가입기간별) 반영.
- welfare.js 구직급여에 pages: ['severance','unemployment'] 추가. 허브 메인 카드 추가. AI 카드 이미지 생성.
- 테스트 74/74, 빌드 16페이지, sitemap 포함 확인, 푸시 완료. (Faq 컴포넌트 prop 오타 수정)

## 2026-09-30 11:45 KST — 전월세 전환율 계산기 신규 추가·푸시
- /rent-conversion/: 전세↔월세 양방향 변환, 법정 상한(min 10%, 기준금리+2%) 자동 계산·초과 경고. 기준금리는 사용자 입력(기본 3.00%).
- 월세 세액공제 페이지 관련 계산기에 연결. 허브 메인 카드 추가. AI 카드 이미지 생성.
- 테스트 78/78, 빌드 17페이지, sitemap 포함 확인, 푸시 완료.

## 2026-09-30 12:05 KST — BreadcrumbList 구조화 데이터 적용·푸시
- BaseLayout에서 FAQPage + BreadcrumbList를 @graph로 자동 결합. 홈·404 제외 전 페이지 적용.
- 404.html 루트 출력·noindex 확인. 테스트 78/78, 빌드 17페이지, 푸시 완료.

## 2026-09-30 12:30 KST — 연장·야간·휴일 수당 계산기 신규 추가·푸시
- /overtime/: 연장·야간 50% 가산, 휴일 8h 초과 100% 가산, 항목별 breakdown. 5인 미만 제외 안내.
- 주휴 시급 페이지 관련 계산기에 연결. 허브 메인 카드 추가. AI 카드 이미지 생성.
- 테스트 82/82, 빌드 18페이지, sitemap 포함 확인, 푸시 완료.

## 2026-09-30 13:00 KST — 연말정산 미리보기 계산기 신규 추가·푸시
- /yearend-tax/: 근로소득공제·인적공제·근로소득세액공제·연금계좌세액공제 반영, 환급/추가납부 판정. income-tax.js 세율표 재사용.
- 연봉·IRP 페이지 관련 계산기에 연결. 허브 메인 카드 추가. AI 카드 이미지 생성.
- 테스트 87/87, 빌드 19페이지, sitemap 포함 확인, 푸시 완료.

## 2026-09-30 13:35 KST — 국민연금 예상수령액 계산기 신규 추가·푸시
- /national-pension/: 기본연금액=1.2(A+B)×가입계수(연액), 2026년 A값 3,193,511원, 부양가족연금액 반영.
- B값은 현재 소득 가정 간이 계산임을 명시. 허브 메인 카드 추가. AI 카드 이미지 생성.
- 테스트 93/93, 빌드 20페이지, sitemap 포함 확인, 푸시 완료.

## 2026-09-30 14:00 KST — PO 루프 최종 요약 (마감 14:45)
### 오늘 성과
- 계산기 8종 → 16종 (신규 8종 추가)
  1. 생애최초 취득세 감면 (/first-home-tax/)
  2. 프리랜서 3.3% 환급금 (/refund33/)
  3. 단순경비율 vs 기준경비율 (/expense-ratio/)
  4. 실업급여(구직급여) (/unemployment/)
  5. 전월세 전환율 (/rent-conversion/)
  6. 연장·야간·휴일 수당 (/overtime/)
  7. 연말정산 미리보기 (/yearend-tax/)
  8. 국민연금 예상수령액 (/national-pension/)
- 육아휴직 계산기에 한부모 특례 토글 추가 (1~3개월 상한 300만원)
- SEO: 404 페이지(noindex), BreadcrumbList 구조화 데이터 전 페이지 자동 적용, FAQ JSON-LD 유지
- 내부링크: 신규↔기존 계산기 교차 링크, welfare 제도↔계산기 매핑 갱신, 허브 upcoming 목록 정리
- docs/keywords.md 우선순위 8개 전부 구현 완료 표시

### 최종 검증
- 테스트 93/93 통과, 빌드 20페이지 성공
- sitemap 19 URL (404 제외), AdSense 스크립트 전 페이지 유지
- Vercel(/) · GitHub Pages(/calculator-hub/) base 경로 빌드 검증 완료
- 내부 링크 깨짐 0건

### 커밋 목록 (main)
- 0374e15 신규 계산기 3종 → 4a9892b 404·내부링크 → 395c868 한부모 특례
- 131f65f 실업급여 → 74094fd 전월세 전환율 → 96eb05e BreadcrumbList
- 1637c78 시간외수당 → 19fdd4a 연말정산 → 2c7d157 국민연금 → 577e71c 키워드 문서

### 다음 후보
- 알바 퇴직금 계산기 (별도 페이지 vs 기존 퇴직금 계산기 확장 검토)
- 정책 워처 다음 실행 2026-10-05 09:52 KST — 신규 제도 변경 감시 시 계산기 수치 업데이트 필요
- Resend 도메인 인증·뉴스레터 E2E는 부모 에이전트 담당 (본 루프 범위 외)

## 2026-09-30 09:35 KST — Wave 2 시작 (마감 14:00)
- 방향: 계산기 수 늘리기보다 깊이. (1) 17개 페이지 콘텐츠 품질 감사 (2) 알바 퇴직금 1종 검토 (3) 모바일 UX 다듬기 (4) 경쟁사 스윕 (5) 광고 배치 설계.
- 감사 에이전트 2명 투입 (기존 9페이지 / wave1 8페이지), 경쟁사 스윕 에이전트 1명 투입.

## 2026-09-30 09:50 KST — 광고 배치 설계·구현 완료 (marco 지시 반영)
- marco 광고 원칙 (절제): 히어로·계산기 입력 영역 주변 광고 금지, 첫 화면 광고 없이 깨끗하게. 수동 단위 페이지당 최대 1~2개 (결과 하단 전 페이지 + 본문 하단 긴 페이지만). 앵커/스티키/팝업성 포맷 금지. 광고 영역은 여백+구분선으로 은은하게, "광고" 라벨 작게 유지.
- `src/lib/ads.js` 신설: AD_CLIENT=ca-pub-8849084322770219, RESULT_BOTTOM=6390360473, IN_CONTENT=8801824831 (marco 발급 실제 ID). ID 변경 시 재배포 필요.
- `src/components/AdSlot.astro` 신설: ads.js 상수 참조 (하드코딩 금지), "광고" 라벨 + 구분선 스타일. 교훈: Astro에서 prop 이름 `slot`은 네임드 슬롯으로 해석되어 렌더링이 통째로 사라짐 → `slotId`로 변경.
- 배치: 16개 계산기 페이지 결과 하단(전 페이지) + article 본문 하단(긴 5개: salary/severance/unemployment/irp/first-home-tax) + welfare 페이지 하단 1개. 404·허브 메인에는 광고 없음.
- 구 `data-ad-slot="XXXX"` 플레이스홀더 전부 제거 (BaseLayout 주석 포함). 고정 스크립트 태그는 손대지 않음.
- 테스트: tests/ads.test.js 6개 (ID 형식·밀도 1~2개·플레이스홀더 잔재 검사). 전체 107/107.
- ⚠️ 부모 에이전트 전달 (marco가 AdSense에서 직접 처리): 자동 광고(Auto ads)가 켜져 있어 수동 배치와 겹치면 과밀해질 수 있음. **앵커 광고 + 바이넷(전면) 포맷은 AdSense 설정에서 OFF 권장** (marco의 앵커/스티키 금지 원칙과 일치). 인페이지 자동 광고까지 끄고 수동만 쓸지는 marco 판단.

## 2026-09-30 09:55 KST — 알바 퇴직금 계산기 신규 추가·푸시
- 키워드 검토: "알바 퇴직금 계산기" 실수요 확인 (네이버 블로그·blogspot 계산기 등이 경쟁, 권위 있는 전용 계산기 페이지는 희박). 별도 페이지로 결정 — /severance/(월급제 직접 입력)와 입력 모델이 다름 (시급 기반).
- /parttime-severance/: 시급·주당 시간·주 근무일수·주휴수당 별도 여부·재직기간 입력. 주휴수당=(주당시간÷40)×8×시급, 3개월=13주/91일 추정, 1일 통상임금 하한 적용 (calcSeverance에 minDaily 옵션 추가, 기존 테스트 호환).
- 핵심 차별점: "받을 수 있어요 / 법정 대상 아님" 수급 자격 판정 (1년 이상 + 주 15시간 이상)을 결과 최상단에 표시.
- 계산 예시 포함 (시급 10,320원×주 20시간×1년 6개월 → 약 1,859,296원, 세금 0원). FAQ 5개 (4주 평균·강행규정·포괄임금제 등 실제 질문). AI 카드 이미지 생성.
- 연동: 허브 메인 카드, /salary/·/severance/ 관련 카드, docs/keywords.md #18 구현 표시, GovSupport는 severance 매핑 재사용.
- 테스트 8개 추가 → 전체 107/107, 빌드 21페이지 (Vercel 루트·GH Pages /calculator-hub/ 둘 다 검증), sitemap 포함 확인.

## 2026-09-30 09:50 KST — Wave 2 콘텐츠 보강 완료·푸시
- 감사 에이전트 2명의 지적을 구현 에이전트 2명으로 반영 (17개 페이지):
  - [필수] 팩트 오류 2건 수정: national-pension FAQ "보험료 9%" → "9.5% (2026년 인상, 2033년까지 13%)", dsr 전세대출 FAQ "포함" → "원칙 제외" (+ article 표 행도 일치시킴)
  - [필수] freelancer thin content 보강 (FAQ 3개 + 예시), welfare FAQ 섹션 신설 (3개 + faqJsonLd 연결)
  - FAQ 총 40+개 추가 (실제 검색 질문 기반: "이 계산기로 알 수 없는 것" 계열 포함), 예시 박스 16개 + salary 연봉별 실수령액 예시표
  - first-home-tax: 농특세 별도 과세 반영 lib 수정 여파로 결과 표에 농특세 행 추가, 예시 박스 (3억원 → 총 150만원)
- 예시 수치는 전부 계산기 lib 실측값으로 검증 후 반영 (감사 제안 중 salary 예시표·yearend-tax 수치가 실측과 달라 정정)
- 모바일 UX: input 54개에 inputmode="decimal", .radio-row pill 스타일, article 표 table-scroll 래핑, salary 연봉 퀵버튼 (경쟁사 스윕 바로 적용 1순위)
- 테스트 107/107, 빌드 21페이지 (Vercel 루트·GH Pages /calculator-hub/ 둘 다 검증), sitemap 포함

## 2026-09-30 09:55 KST — Wave 2 차별화 기능 (salary 고도화) 완료·푸시
- 경쟁사 스윕 "우리가 이길 포인트" 중 즉시 적용 가능한 것들을 salary 페이지에 구현:
  1. 연봉 퀵버튼 (3,000만~1억원 칩, 클릭 즉시 자동 계산)
  2. 결과 항목별 ? 툴팁 (공제 항목 한줄 설명, 모바일 탭 대응)
  3. 결과 링크 복사 (입력값 URL 인코딩 → 카톡 공유, 접속 시 자동 복원·계산)
  4. "상위 X%" 해석 (topPercentile: 2024년 귀속 국세청 연말정산 통계 기반, lib + 테스트)
  5. 공제 구성 도넛 차트 (경량 SVG, 라이브러리 없음)
  6. 세후→세전 역계산 모드 (reverseSalary 이분탐색, lib + 테스트, "월 300만원 받으려면 연봉 약 4,146만원" 검증)
- 테스트 109/109, 빌드 21페이지 양쪽 base 검증.

## 2026-09-30 10:00 KST — Wave 2 최종 요약 (마감 14:00)
### 성과
- 계산기 16종 → 17종 (알바 퇴직금 /parttime-severance/ 신규)
- 17개 페이지 전수 콘텐츠 감사 → FAQ 40+개·예시 박스 17개 추가, 팩트 오류 2건 수정 (national-pension 9.5%, dsr 전세대출, first-home-tax 농특세 계산 로직)
- 광고: 실슬롯 ID 상수화(src/lib/ads.js) + AdSlot 컴포넌트, 페이지당 1~2개 절제 배치, 플레이스홀더 전부 제거
- 모바일 UX: inputmode 54개, radio pill, 표 스크롤 래핑
- 차별화: 퀵버튼·툴팁·공유링크·상위%·도넛차트·역계산 (salary)
### 검증
- 테스트 109/109, 빌드 21페이지 (Vercel 루트·GH Pages /calculator-hub/ 둘 다)
- sitemap 20 URL, AdSense 스크립트 전 페이지 유지
### Wave 3 후보 (경쟁사 스윕 Top 7 중 대형)
- 시나리오 비교 (A vs B), 결과 공유 확장 (전 페이지), 그래프 시각화 확대, 스트레스 DSR 규제 반영 자동화
- ⚠️ marco/AdSense 직접 처리: 앵커+바이넷 포맷 OFF 권장 (자동 광고와 수동 배치 과밀 방지)

## 2026-09-30 13:45 KST — 물타기 계산기 신규 (Wave 3)
### 구현
- 계산기 17종 → 18종: 주식 물타기 계산기 (/avg-down/) 신규
- 입력: 현재 보유 수량·평단가·추가 매수 단가·수량 / 출력: 물타기 후 평단가·총 보유 수량·총 투자금액·평단가 인하액·인하율
- 차별화: 목표 평단가 역계산 모드 (현재가 기준 추가 매수 필요 수량·금액 역산, 기존 .mode-toggle UI 재사용)
- FAQ 5개 (물타기 뜻, 물타기 vs 불타기, 역계산 안내, 떨어지는 칼날, 손절라인 활용) + 예시 박스 2개 (lib 실측값 검증: 50,000원×100주 + 30,000원×100주 → 40,000원/20%)
- 결과 영역에 "투자 참고용이며 투자 권유가 아닙니다" 문구 포함
- 광고: 결과 하단 AdSlot 1개만 (RESULT_BOTTOM 슬롯, 첫 화면 광고 없음)
- 메인 허브 카드 추가 (IRP 옆 배치), 관련 계산기: IRP, docs/keywords.md 우선순위 외 발굴 표에 구현 표시
### 검증
- 테스트 120/120 (avg-down.test.js 11개 신규: 수량 0·단가 0·음수 → null, 역계산 already/impossible/invalid)
- 빌드 22페이지 (Vercel 루트·GH Pages /calculator-hub/ 둘 다 검증, sitemap·FAQPage JSON-LD·광고슬롯 포함 확인)
- 푸시: 53af5c17fc0cd8081a012cbce9a1d9191082b755
