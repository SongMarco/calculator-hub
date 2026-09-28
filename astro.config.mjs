import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://example.com', // 실제 도메인 확정 후 교체
  output: 'static',
  build: {
    format: 'directory',
  },
});
