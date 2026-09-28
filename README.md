# 계산기허브 (calculator-hub)

한국 시장 대상 AdSense 수익화용 계산기 허브 사이트. Astro 정적 사이트.

## 구조

```
src/
  lib/            # 계산 로직 (프레임워크 무의존 JS, 단위 테스트 대상)
    salary.js       # 2026년 연봉 실수령액
    severance.js    # 퇴직금 (세후)
    freelancer.js   # 프리랜서 3.3%
    parental.js     # 2026년 육아휴직 급여
    dsr.js          # DSR·스트레스 DSR
  pages/          # 라우트 (index.astro 허브 + 계산기 5종)
  layouts/        # BaseLayout (SEO 메타·헤더·푸터·면책)
  components/     # Faq 아코디언
  styles/         # global.css
tests/            # node:test 단위 테스트 (26개)
docs/
  site-structure.md # 사이트 구조 설계
  keywords.md       # 롱테일 키워드 30개 (별도 에이전트 작성 중)
```

## 명령어

```bash
npm install     # 의존성 설치
npm test        # 단위 테스트 (node --test)
npm run dev     # 개발 서버
npm run build   # 정적 빌드 → dist/
```

## 2026년 적용 요율

- 국민연금 4.75% (상한 659만원, 2026.7~2027.6)
- 건강보험 3.595% (전체 7.19%의 절반)
- 장기요양보험: 건강보험료의 13.14%
- 고용보험 0.9%
- 육아휴직 급여: 1~3개월 최대 250만원 / 4~6개월 최대 200만원 / 7개월~ 최대 160만원
- 스트레스 DSR: 수도권 주담대 +3.0%p

모든 결과는 참고용 추정치. 계산 로직 변경은 사용자 승인 후 배포.
