# 사이트 구조 설계 (Phase 2)

## URL 맵

| URL | 페이지 | 상태 |
|---|---|---|
| `/` | 허브 인덱스 (계산기 목록 + 소개) | ✅ |
| `/salary/` | 2026년 연봉 실수령액 계산기 | ✅ |
| `/severance/` | 퇴직금 계산기 (세후 실수령액) | ✅ |
| `/freelancer/` | 프리랜서 3.3% 계산기 | ✅ |
| `/parental/` | 2026년 육아휴직 급여 계산기 | ✅ |
| `/dsr/` | DSR·스트레스 DSR 계산기 | ✅ |
| `/monthly-rent/` | 2026년 월세 세액공제 한도 계산기 | ✅ (Phase 2) |
| `/irp/` | IRP 일시금 vs 연금 수령 세금 비교 | ✅ (Phase 2) |
| `/hourly-wage/` | 주휴 포함 시급 계산기 (2026년) | ✅ (Phase 2) |

### URL 설계 원칙
- 한국어 키워드를 영문 slug로 매핑 (`salary`, `severance`, `freelancer`, `parental`, `dsr`)
- 디렉토리형 trailing slash (`/salary/`) — Astro `build.format: 'directory'`
- 향후 롱테일 페이지는 `/<slug>/` 1depth 유지 (예: `/night-shift-pay/`, `/jeonse-conversion/`)
- 연도 한정 키워드는 slug에 연도 포함하지 않고, 페이지 내 "2026년 기준" 명시 + 매년 요율 업데이트 (URL 자산 유지)

## 페이지 템플릿 (전 계산기 공통)

모든 계산기 페이지는 다음 섹션 순서로 구성 — AdSense thin content 정책 회피용:

1. **breadcrumb + H1 + 한 줄 설명 + 업데이트 일자**
2. **🧮 계산기 UI** — 입력 폼 + 계산 버튼 + 결과 영역 (초기에는 숨김, 계산 후 표시)
3. **계산 방법 해설** — 공식, 요율 표, 계산 흐름 설명 (200자 이상)
4. **꼭 알아두세요** — 주의사항 불릿 3~5개
5. **자주 묻는 질문 (FAQ)** — 4~6개, `<details>` 아코디언
6. **관련 계산기** — 내부 링크 카드 2~3개
7. **면책 문구** — 푸터 공통 ("참고용 추정치…")

### 허브 인덱스 (`/`) 구조
- hero (H1: "돈 계산, 쉽게")
- 계산기 카드 그리드 (태그 + 제목 + 설명)
- "계산기는 어떻게 만드나요?" (신뢰 요소: 공식 출처·단위 테스트·추정치 안내)
- "곧 추가될 계산기" (롱테일 키워드 티저 → 내부 검색 수요 선점)

## 컴포넌트

| 파일 | 역할 |
|---|---|
| `src/layouts/BaseLayout.astro` | HTML 뼈대, SEO 메타, 헤더/푸터, AdSense 슬롯 주석 |
| `src/components/Faq.astro` | FAQ 아코디언 (items prop) |
| `src/styles/global.css` | 전역 스타일 (모바일 반응형) |
| `src/lib/*.js` | 계산 로직 (프레임워크 무의존, 단위 테스트 대상) |

계산 UI의 `<script>`는 Astro가 Vite로 번들하며 `src/lib`을 import한다.
빌드 결과 `dist/_astro/`에 청크가 생성되고, lib는 페이지 간 공유 청크로 묶인다.

## SEO 컨벤션

- `<title>`: `{페이지명} | 계산기허브` (H1과 차별화)
- `meta description`: 120~155자, "2026년" 등 시의성 키워드 포함
- `og:*` 기본 포함, `robots: index, follow`
- lang="ko", 시맨틱 태그 (h1 단일, h2 섹션)
- FAQ JSON-LD: 전 계산기 페이지에 `FAQPage` 스키마 삽입 (`src/lib/seo.js`의 `faqJsonLd`, BaseLayout `jsonLd` prop)
- `public/sitemap.xml`: 허브 + 8개 계산기, `public/robots.txt` (사이트맵 링크 포함)
- GitHub Pages 배포 기준 canonical: `https://songmarco.github.io/calculator-hub/...`
  (내부 링크는 `/calculator-hub/` prefix 필수 — Astro `base` 설정과 일치)

## AdSense 계획

- `BaseLayout`에 광고 슬롯 주석으로 위치 확보 (main 하단, 결과 영역 하단)
- 승인 후 `ca-pub-XXXX`로 교체, 페이지당 최대 3개
- thin content 회피: 계산기 UI만 있는 페이지 금지 → 해설+FAQ 필수 (템플릿으로 강제)

## 계산기별 공식 데이터 출처·업데이트 주기

| 계산기 | 기준 데이터 | 출처 | 업데이트 |
|---|---|---|---|
| 연봉 실수령액 | 4대보험 요율, 세율표 | 국민연금공단·건보공단 고시, 국세청 | 매년 1월 (요율 변경 시 즉시) |
| 퇴직금 | 퇴직소득세 공제표 | 국세청 (소득세법) | 세법 개정 시 |
| 프리랜서 3.3% | 원천징수세율 | 국세청 | 세율 변경 시 (드묾) |
| 육아휴직 급여 | 지급 기준·상한 | 고용노동부 | 매년 1월 |
| DSR | 스트레스 금리 | 금융위원회·은행연합회 | 반기 (1월·7월) |
| 월세 세액공제 | 공제율·한도·소득 기준 | 국세청 (소득세법, 연말정산) | 매년 1월 (세법 개정 시 즉시) |
| IRP 세금 비교 | 연금외수령 감면율·연금소득세율 | 국세청 (소득세법 제129조) | 세법 개정 시 |
| 주휴 포함 시급 | 최저임금·주휴수당 | 고용노동부 (최저임금 고시) | 매년 1월 |

## 확장 계획 (Phase 2) — 완료

1. ~~키워드 리서치 결과(`docs/keywords.md`) 기준 롱테일 페이지 추가~~ → 월세 세액공제·IRP·주휴 시급 3종 추가 ✅
2. ~~FAQ JSON-LD 스키마, sitemap, robots.txt~~ ✅
3. 정책 워처 (주 1회): 요율·세법 변경 감지 → 이 채팅에 보고 (변경 있을 때만)
4. SEO 닥터 (주 1회): 키워드 노출 현황 점검 → 이 채팅에 보고
5. 수익 리포터 (월 1회): AdSense 미연동 시 연동 필요 알림

## 확장 계획 (Phase 3 후보)

- 남은 우선 키워드 계산기 추가 (3.3% 환급금, 생애최초 취득세 감면, 단순경비율 vs 기준경비율 등)
- Search Console 연동 후 실측 기반 SEO 닥터 고도화
- AdSense 승인 후 광고 슬롯 활성화 (`ca-pub-XXXX` 교체)
