import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// `base: './'` keeps every asset path relative so the build works from any
// sub-path (GitHub Pages project sites) and from the iPad home-screen app.
export default defineConfig({
  base: './',
  plugins: [react()],
  build: { target: 'es2019', chunkSizeWarningLimit: 900 },
  test: { include: ['src/**/*.test.ts'] },
});
