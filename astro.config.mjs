import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// 배포 타깃별 base/site 분리:
// - Vercel (루트 서빙, 정식 도메인): SITE_BASE 미설정 → '/', SITE_URL 미설정 → https://calc.choronglight.com
// - GitHub Pages (서브경로 서빙): deploy.yml에서 SITE_BASE=/calculator-hub, SITE_URL=https://songmarco.github.io/calculator-hub 주입
export default defineConfig({
  site: process.env.SITE_URL || 'https://calc.choronglight.com',
  base: process.env.SITE_BASE || '/',
  output: 'static',
  integrations: [sitemap()],
  build: {
    format: 'directory',
  },
});
