/** SEO 헬퍼 */

// 빌드 환경의 site URL (astro.config.mjs의 site와 동일 값).
// GitHub Pages 빌드: SITE_URL=https://songmarco.github.io/calculator-hub
// Vercel 빌드(기본): https://calculator-hub-songmarcos-projects.vercel.app
const SITE =
  (typeof process !== 'undefined' && process.env.SITE_URL) ||
  'https://calculator-hub-songmarcos-projects.vercel.app';

/** 정규 URL의 site 부분 (trailing slash 없음). 기존 호환용으로 유지. */
export const SITE_URL = SITE.replace(/\/$/, '');

/** 내부 경로 → 정규(absolute) URL. SITE_URL에 subpath가 포함될 수 있으므로 base 중복 추가 금지. */
export function pageUrl(path) {
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${SITE_URL}${p}`;
}

/** FAQ 배열 → FAQPage JSON-LD */
export function faqJsonLd(faqs, url) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };
}
