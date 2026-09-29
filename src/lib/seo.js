/** SEO 헬퍼 */

/** FAQ 배열 → FAQPage JSON-LD */
export function faqJsonLd(faqs, pageUrl) {
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

export const SITE_URL = 'https://songmarco.github.io/calculator-hub';
