/**
 * build/icon-source.png → 앱 아이콘·로고 PNG 전부.  `pnpm icons`
 *
 * 원본 그림에는 둥근 테두리와 그 바깥 배경이 그려져 있는데, 그 테두리는 macOS 아이콘 모양과 곡률이 달라
 * 그대로 쓰면 어긋나 보인다. 그래서 테두리 안쪽(CROP)의 그림만 잘라 애플 아이콘 모양(모서리 22.5%)으로 깎고,
 * 원본과 같은 색(왼쪽 파랑 → 오른쪽 금색)의 테두리를 그 모양 그대로 다시 그린다 (FRAME).
 * 그림을 바꾸면 CROP 만 다시 맞추면 된다 (테두리 안쪽 선보다 살짝 안으로).
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

/** 원본(2048²)에서 테두리 안쪽 정사각형 — 테두리 빛번짐이 안 들어가게 10px 더 안쪽 */
const CROP = { x: 372, y: 352, size: 1304 };
/** macOS(Big Sur 이후) 아이콘 모서리 반지름 — 폭 대비 */
const CORNER = 0.225;
/** 다시 그리는 테두리 — 두께는 아이콘 폭 대비, 색은 원본 테두리에서 따옴 (왼쪽 → 오른쪽) */
const FRAME = {
  width: 0.04,
  band: ['#1f6fe0', '#3a8cf0', '#8f9fd8', '#c9a57a', '#a8865e'],
  line: ['#7fd4ff', '#a9d8ff', '#e6dcf0', '#ffe3b0', '#f2cf95'],
};
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
    async ({ src, t, CROP, CORNER, FRAME }) => {
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
      // 애플 아이콘 비율: 모서리 반지름 = 폭의 22.5%. 안쪽으로 줄여도 가장자리와 같은 간격을 유지한다
      const R = t.inner * CORNER;
      const shape = (inset = 0) => {
        g.beginPath();
        g.roundRect(off + inset, off + inset, t.inner - inset * 2, t.inner - inset * 2, Math.max(0, R - inset));
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
      if (!t.square) {
        // 테두리: 가장자리 띠 + 안쪽의 밝은 선 + 그림 쪽으로 번지는 은은한 빛 (클립 안이라 모양 밖으로 안 나감)
        const grad = (stops, alpha = 1) => {
          const lg = g.createLinearGradient(off, off, off + t.inner, off + t.inner * 0.35);
          stops.forEach((c, i) => lg.addColorStop(i / (stops.length - 1), c));
          g.globalAlpha = alpha;
          return lg;
        };
        const w = t.inner * FRAME.width;
        g.save();
        g.shadowColor = 'rgba(90, 170, 255, 0.55)';
        g.shadowBlur = w * 0.9;
        shape(w * 0.5);
        g.lineWidth = w;
        g.strokeStyle = grad(FRAME.band, 0.95);
        g.stroke();
        g.restore();
        shape(w * 0.55);
        g.lineWidth = Math.max(1, w * 0.16);
        g.strokeStyle = grad(FRAME.line, 0.95);
        g.stroke();
        // 바깥 가장자리를 살짝 어둡게 — 배경이 밝아도 윤곽이 보이게
        shape(Math.max(0.5, w * 0.04));
        g.lineWidth = Math.max(1, w * 0.08);
        g.strokeStyle = 'rgba(10, 20, 60, 0.6)';
        g.globalAlpha = 1;
        g.stroke();
      }
      g.restore();
      return c.toDataURL('image/png');
    },
    { src, t, CROP, CORNER, FRAME },
  );
  const out = path.join(root, t.file);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, Buffer.from(dataUrl.split(',')[1], 'base64'));
  console.log('✓', t.file);
}
await browser.close();
