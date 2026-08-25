import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

import { kluztdDataPlugin } from './vite.kluztd-data';

export default defineConfig({
  // 상대 경로 — dist 정적 미리보기용 (데이터 저장은 dev/preview API 필요)
  base: './',
  plugins: [react(), tailwindcss(), kluztdDataPlugin()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 5173,
    open: true,
    // 저장 시 data 파일 쓰기가 HMR·전체 새로고침을 일으키지 않도록
    watch: {
      ignored: ['**/data/kluztd.json', '**/data/**'],
    },
  },
  preview: {
    port: 4273,
    open: true,
  },
});
