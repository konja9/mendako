import { defineConfig } from 'vitest/config';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
  // 公開ページや GitHub Pages でもそのまま動くよう相対パスで出力する
  base: './',
  plugins: [svelte()],
  build: {
    target: 'es2022',
    chunkSizeWarningLimit: 1500,
  },
  test: {
    include: ['tests/**/*.test.ts'],
  },
});
