import { expect, test } from '@playwright/test';

const PREVIEW = 'http://localhost:4299/';

test('PWA: 매니페스트·아이콘·서비스워커 (빌드본)', async ({ page, request }) => {
  const manifest = await (await request.get(`${PREVIEW}manifest.webmanifest`)).json();
  expect(manifest).toMatchObject({ name: 'KluZTD', display: 'standalone' });
  for (const icon of manifest.icons as { src: string }[]) {
    expect((await request.get(`${PREVIEW}${icon.src}`)).status()).toBe(200);
  }
  await page.goto(PREVIEW);
  await expect(page.locator('link[rel="manifest"]')).toHaveCount(1);
  const registered = await page.evaluate(async () => {
    const reg = await Promise.race([navigator.serviceWorker.ready, new Promise((r) => setTimeout(() => r(null), 8000))]);
    return Boolean(reg);
  });
  expect(registered).toBe(true);
});
