import { defineConfig } from 'astro/config';

export default defineConfig({
  site: process.env.SITE_URL || 'https://cv.ghvineria.com',
  base: process.env.BASE_PATH || '/',
  output: 'static',
  outDir: process.env.ASTRO_OUT_DIR || './dist',
  vite: {
    cacheDir: '/tmp/online-cv-vite',
    server: {
      watch: { usePolling: true, interval: 150 },
    },
  },
});
