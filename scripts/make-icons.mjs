// ホーム画面用のアイコン（public/icons/*.png）を作る。アイコンの絵を変えたときだけ使う。
// めんだこの絵（src/art/mendako.ts）を Vite で読み込み、Playwright（Chromium）で PNG にする。
//
//   node scripts/make-icons.mjs
//
// Playwright がこのプロジェクトに入っていない場合は、PLAYWRIGHT_MODULE で場所を指定する
// （例：PLAYWRIGHT_MODULE=/opt/node22/lib/node_modules/playwright/index.mjs）。

import { mkdir, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { createServer } from 'vite';

const root = resolve(import.meta.dirname, '..');
const outDir = join(root, 'public', 'icons');

const vite = await createServer({ root, server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' });
const { mendakoSVG } = await vite.ssrLoadModule('/src/art/mendako.ts');
await vite.close();

const mendako = mendakoSVG({ equipped: { head: 'ribbon', color: 'color-coral' }, expression: 'happy', label: 'めんだこ' });

/**
 * 深い海のグラデーションの上に、めんだこを置いたアイコン。
 * scale：めんだこの大きさ（マスカブルは端が切られるので小さめにする）
 */
function iconSVG(scale) {
  const inner = mendako.replace(/<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
  const size = 200 * scale;
  const offset = (200 - size) / 2;
  const snow = [
    [30, 40, 2.2],
    [160, 30, 1.6],
    [175, 120, 2],
    [22, 140, 1.4],
    [60, 175, 1.8],
    [140, 178, 1.3],
    [100, 18, 1.2],
  ]
    .map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#eef6ff" opacity=".7"/>`)
    .join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
  <defs>
    <radialGradient id="sea" cx="50%" cy="28%" r="80%">
      <stop offset="0" stop-color="#2a6aa8"/>
      <stop offset=".55" stop-color="#0e2d5c"/>
      <stop offset="1" stop-color="#050f29"/>
    </radialGradient>
    <radialGradient id="glow" cx="50%" cy="50%" r="50%">
      <stop offset="0" stop-color="#8fe3ff" stop-opacity=".35"/>
      <stop offset="1" stop-color="#8fe3ff" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="200" height="200" fill="url(#sea)"/>
  ${snow}
  <circle cx="100" cy="108" r="${78 * scale}" fill="url(#glow)"/>
  <g transform="translate(${offset} ${offset + 6 * scale}) scale(${scale})">${inner}</g>
</svg>`;
}

const ICONS = [
  { file: 'icon-192.png', px: 192, scale: 0.86 },
  { file: 'icon-512.png', px: 512, scale: 0.86 },
  // マスカブル：端末が丸や角丸に切り抜くので、中心の 80% に収める
  { file: 'icon-maskable-512.png', px: 512, scale: 0.66 },
  { file: 'apple-touch-icon.png', px: 180, scale: 0.8 },
  { file: 'favicon-64.png', px: 64, scale: 0.95 },
];

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE ?? 'playwright');
const browser = await chromium.launch();
const page = await browser.newPage();
await mkdir(outDir, { recursive: true });
for (const icon of ICONS) {
  const svg = iconSVG(icon.scale).replace('width="200" height="200"', `width="${icon.px}" height="${icon.px}"`);
  await page.setViewportSize({ width: icon.px, height: icon.px });
  await page.setContent(`<body style="margin:0">${svg}</body>`);
  await page.waitForTimeout(50);
  const png = await page.screenshot({ clip: { x: 0, y: 0, width: icon.px, height: icon.px }, omitBackground: false });
  await writeFile(join(outDir, icon.file), png);
  console.log(`public/icons/${icon.file}`);
}
await browser.close();
