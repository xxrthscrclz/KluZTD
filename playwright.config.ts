import { defineConfig, devices } from '@playwright/test';
import path from 'node:path';

/** e2e 는 실제 data/kluztd.json 대신 e2e/.data/ 의 파일을 쓴다 */
export const E2E_DATA_FILE = path.resolve(import.meta.dirname, 'e2e/.data/kluztd.e2e.json');
const PORT = 5199;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 45_000,
  expect: { timeout: 6_000 },
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: `http://localhost:${PORT}/`,
    locale: 'ko-KR',
    timezoneId: 'Asia/Seoul',
    trace: 'retain-on-failure',
    // 기능 테스트는 애니메이션 없이 (빠르고 위치 측정이 흔들리지 않게). 모션은 motion.spec 에서 따로 검사
    reducedMotion: 'reduce',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'desktop',
      testIgnore: /mobile\.spec/,
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } },
    },
    {
      name: 'mobile',
      testMatch: /(mobile|ux)\.spec/,
      use: { ...devices['Pixel 7'] },
    },
  ],
  webServer: [
    {
      command: `vite --port ${PORT} --strictPort`,
      url: `http://localhost:${PORT}/`,
      reuseExistingServer: false,
      env: { KLUZTD_DATA_FILE: E2E_DATA_FILE, KLUZTD_NO_OPEN: '1' },
      timeout: 60_000,
    },
    {
      // PWA(서비스워커)는 빌드본에서만 동작하므로 따로 띄운다
      command: 'vite build --logLevel error && vite preview --port 4299 --strictPort',
      url: 'http://localhost:4299/',
      reuseExistingServer: false,
      env: { KLUZTD_DATA_FILE: E2E_DATA_FILE, KLUZTD_NO_OPEN: '1' },
      timeout: 120_000,
    },
  ],
});
