import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://songmarco.github.io/calculator-hub',
  base: '/calculator-hub',
  output: 'static',
  build: {
    format: 'directory',
  },
});
