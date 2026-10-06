/**
 * public/logo.svg → PWA 아이콘 PNG 들.
 * 로고를 바꾼 뒤 `pnpm icons` 로 다시 만든다. (Playwright 의 Chromium 으로 렌더링)
 * 직접 만든 PNG 를 쓰고 싶으면 public/icons/ 의 같은 이름 파일을 그냥 덮어써도 된다.
 */
import { chromium } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const svg = fs.readFileSync(path.join(root, 'public/logo.svg'), 'utf8');
const outDir = path.join(root, 'public/icons');
fs.mkdirSync(outDir, { recursive: true });

const targets = [
  { file: 'icon-192.png', size: 192, pad: 0 },
  { file: 'icon-512.png', size: 512, pad: 0 },
  // maskable: 안드로이드가 원/둥근 사각으로 잘라도 로고가 안 잘리게 여백 + 배경
  { file: 'maskable-512.png', size: 512, pad: 0.12, bg: '#141413' },
  { file: 'apple-touch-icon.png', size: 180, pad: 0.06, bg: '#141413' },
  { file: 'favicon-32.png', size: 32, pad: 0 },
];

const browser = await chromium.launch();
const page = await browser.newPage({ deviceScaleFactor: 1 });
for (const t of targets) {
  const inner = Math.round(t.size * (1 - t.pad * 2));
  await page.setViewportSize({ width: t.size, height: t.size });
  await page.setContent(
    `<html><body style="margin:0;width:${t.size}px;height:${t.size}px;display:grid;place-items:center;background:${t.bg ?? 'transparent'}">
      <div style="width:${inner}px;height:${inner}px">${svg.replace('<svg', `<svg width="${inner}" height="${inner}"`)}</div>
    </body></html>`,
  );
  await page.screenshot({ path: path.join(outDir, t.file), omitBackground: !t.bg });
  console.log('✓', t.file);
}
await browser.close();
