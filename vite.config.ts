import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

import { kluztdDataPlugin } from './vite.kluztd-data';

/** `pnpm dev:lan` 처럼 KLUZTD_LAN=1 이면 같은 와이파이의 휴대폰에서도 접속 가능 (데이터 API 가 열리므로 집/개인망에서만) */
const lan = process.env.KLUZTD_LAN === '1';
const noOpen = process.env.KLUZTD_NO_OPEN === '1';

export default defineConfig({
  base: './',
  plugins: [
    react(),
    tailwindcss(),
    kluztdDataPlugin(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: false,
      includeAssets: ['logo.png', 'icons/apple-touch-icon.png', 'icons/favicon-32.png'],
      manifest: {
        id: './',
        name: 'KluZTD',
        short_name: 'KluZTD',
        description: '다 적고, 분류하고, 보드에서 진행하고, 기록하는 나만의 할 일 관리',
        lang: 'ko',
        start_url: './#/board',
        scope: './',
        display: 'standalone',
        orientation: 'any',
        background_color: '#f6f5f2',
        theme_color: '#f6f5f2',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
        shortcuts: [
          { name: '수집', url: './#/capture', icons: [{ src: 'icons/icon-192.png', sizes: '192x192' }] },
          { name: '보드', url: './#/board', icons: [{ src: 'icons/icon-192.png', sizes: '192x192' }] },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,webmanifest}'],
        navigateFallback: 'index.html',
        navigateFallbackDenylist: [/^\/api\//],
        // 한글 폰트 조각(woff2)은 미리 다 받지 않고 쓸 때 캐시
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.endsWith('.woff2'),
            handler: 'CacheFirst',
            options: { cacheName: 'kluztd-fonts', expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 365 } },
          },
        ],
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
      },
      devOptions: { enabled: false },
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 5173,
    host: lan,
    open: !noOpen,
    watch: { ignored: ['**/data/**', '**/test-results/**', '**/playwright-report/**'] },
  },
  preview: {
    port: 4273,
    host: lan,
    open: !noOpen,
  },
});
