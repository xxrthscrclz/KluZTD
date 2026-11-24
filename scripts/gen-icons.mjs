/**
 * build/icon-source.png → 앱 아이콘·로고 PNG 전부.  `pnpm icons`
 *
 * 원본 그림은 둥근 사각 테두리 바깥에도 배경이 있어서, 테두리 바깥선(CROP)에 맞춰 잘라 내고
 * 모서리를 테두리 곡률(RADIUS)대로 둥글게 깎는다. 그림을 바꾸면 CROP·RADIUS 만 다시 맞추면 된다.
 *
 * 만드는 것
 *   build/icon.png                 macOS 앱 아이콘 (1024, 애플 규격 여백 + 그림자) — electron-builder 가 씀
 *   public/logo.png                앱 안 로고(사이드바)·파비콘
 *   public/icons/*.png             PWA 아이콘
 *
 * Playwright 의 Chromium canvas 로 그린다 (따로 이미지 도구가 필요 없음).
 */
import { chromium } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const SOURCE = path.join(root, 'build/icon-source.png');

/** 원본(2048²)에서 테두리 바깥선 기준 정사각형 — 바깥 빛번짐이 안 들어가게 몇 px 안쪽 */
const CROP = { x: 300, y: 292, size: 1448 };
/** 테두리 모서리 반지름 (원본 px) */
const RADIUS = 268;
/** 테두리 바깥 배경색 (maskable 여백 등) */
const NAVY = '#0a1a4f';

const targets = [
  // macOS: 1024 캔버스에 824 그림 + 아래로 떨어지는 그림자 (Big Sur 이후 아이콘 규격)
  { file: 'build/icon.png', size: 1024, inner: 824, shadow: true },
  { file: 'public/logo.png', size: 256, inner: 256 },
  { file: 'public/icons/icon-192.png', size: 192, inner: 192 },
  { file: 'public/icons/icon-512.png', size: 512, inner: 512 },
  { file: 'public/icons/favicon-32.png', size: 32, inner: 32 },
  // maskable: 안드로이드가 원·둥근 사각으로 잘라도 그림이 남도록 배경 + 여백
  { file: 'public/icons/maskable-512.png', size: 512, inner: 400, bg: NAVY },
  // iOS 는 직접 둥글게 깎으므로 모서리까지 꽉 채운 사각형
  { file: 'public/icons/apple-touch-icon.png', size: 180, inner: 180, square: true },
];

const src = `data:image/png;base64,${fs.readFileSync(SOURCE).toString('base64')}`;
const browser = await chromium.launch();
const page = await browser.newPage();

for (const t of targets) {
  const dataUrl = await page.evaluate(
    async ({ src, t, CROP, RADIUS }) => {
      const img = new Image();
      img.src = src;
      await img.decode();
      const c = document.createElement('canvas');
      c.width = c.height = t.size;
      const g = c.getContext('2d');
      g.imageSmoothingQuality = 'high';
      if (t.bg) {
        g.fillStyle = t.bg;
        g.fillRect(0, 0, t.size, t.size);
      }
      const off = (t.size - t.inner) / 2;
      const r = (RADIUS / CROP.size) * t.inner;
      const shape = () => {
        g.beginPath();
        g.roundRect(off, off, t.inner, t.inner, r);
      };
      if (t.shadow) {
        g.save();
        g.shadowColor = 'rgba(0, 0, 0, 0.35)';
        g.shadowBlur = t.size * 0.03;
        g.shadowOffsetY = t.size * 0.012;
        shape();
        g.fillStyle = '#000';
        g.fill();
        g.restore();
      }
      g.save();
      if (!t.square) {
        shape();
        g.clip();
      }
      g.drawImage(img, CROP.x, CROP.y, CROP.size, CROP.size, off, off, t.inner, t.inner);
      g.restore();
      return c.toDataURL('image/png');
    },
    { src, t, CROP, RADIUS },
  );
  const out = path.join(root, t.file);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, Buffer.from(dataUrl.split(',')[1], 'base64'));
  console.log('✓', t.file);
}
await browser.close();
