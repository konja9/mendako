import { defineConfig } from 'vitest/config';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { VitePWA } from 'vite-plugin-pwa';

// GitHub Pages 版（`vite build --mode pages`）だけ、ホーム画面に置ける・オフラインで遊べる仕組み（PWA）を入れる。
// claude.ai の公開ページ版や開発サーバーには入れない。
export default defineConfig(({ mode }) => ({
  // 公開ページや GitHub Pages でもそのまま動くよう相対パスで出力する
  base: './',
  plugins: [
    svelte(),
    mode === 'pages' &&
      VitePWA({
        registerType: 'autoUpdate',
        // 登録用の小さなスクリプトを index.html に差し込む（main.ts は変えない）
        injectRegister: 'script',
        includeAssets: ['icons/apple-touch-icon.png', 'icons/favicon-64.png'],
        manifest: {
          name: 'しんかいぷかぷか',
          short_name: 'ぷかぷか',
          description: 'めんだこを育てて、着せ替えて、深海の生き物に出会うゲーム',
          lang: 'ja',
          start_url: './',
          scope: './',
          display: 'standalone',
          orientation: 'portrait',
          background_color: '#050f29',
          theme_color: '#050f29',
          icons: [
            { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
            { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
            { src: 'icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,png}'],
          navigateFallback: 'index.html',
          // 文字（Google Fonts）は、1回目に開いたときに保存しておく
          runtimeCaching: [
            {
              urlPattern: ({ url }) => url.origin === 'https://fonts.googleapis.com',
              handler: 'StaleWhileRevalidate',
              options: { cacheName: 'google-fonts-css' },
            },
            {
              urlPattern: ({ url }) => url.origin === 'https://fonts.gstatic.com',
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-files',
                cacheableResponse: { statuses: [0, 200] },
                expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 },
              },
            },
          ],
        },
      }),
  ],
  build: {
    target: 'es2022',
    chunkSizeWarningLimit: 1500,
  },
  test: {
    include: ['tests/**/*.test.ts'],
  },
}));
