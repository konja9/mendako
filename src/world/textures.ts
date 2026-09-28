// SVG 文字列や canvas の絵を Pixi のテクスチャにする。

import { CanvasSource, ImageSource, Texture } from 'pixi.js';
import { svgDataUrl } from '../art/mendako';

export const deviceResolution = () => Math.min(2, window.devicePixelRatio || 1);

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('SVG の読み込みに失敗しました'));
    img.src = url;
  });
}

/**
 * width / height 属性を付け直した SVG 文字列。
 * 画像として読むには xmlns が必須なので、画面用に書いたアイコン（xmlns なし）にも付ける。
 */
function sizedSvg(svg: string, w: number, h: number): string {
  const open = svg.match(/<svg\b[^>]*>/)![0];
  let cleaned = open.replace(/\s(width|height)="[^"]*"/g, '');
  if (!/\sxmlns=/.test(cleaned)) cleaned = cleaned.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
  return svg.replace(open, cleaned.replace('<svg', `<svg width="${Math.round(w)}" height="${Math.round(h)}"`));
}

/**
 * SVG を、論理サイズ w×h のテクスチャにする。resolution 倍の細かさで描く。
 * （テクスチャの width/height は論理サイズのまま）
 */
export async function svgTexture(svg: string, w: number, h: number, resolution: number): Promise<Texture> {
  const img = await loadImage(svgDataUrl(sizedSvg(svg, w * resolution, h * resolution)));
  return new Texture({ source: new ImageSource({ resource: img, resolution }) });
}

/** canvas に描いた絵をテクスチャにする。draw には論理座標で描ける ctx が渡る */
export function canvasTexture(w: number, h: number, resolution: number, draw: (ctx: CanvasRenderingContext2D) => void): Texture {
  const canvas = document.createElement('canvas');
  canvas.width = Math.ceil(w * resolution);
  canvas.height = Math.ceil(h * resolution);
  const ctx = canvas.getContext('2d')!;
  ctx.scale(resolution, resolution);
  draw(ctx);
  return new Texture({ source: new CanvasSource({ resource: canvas, resolution }) });
}

/** ふんわり光る丸（発光・光の輪に使う） */
export function glowTexture(radius: number, color = '255, 255, 255', resolution = 1): Texture {
  return canvasTexture(radius * 2, radius * 2, resolution, (ctx) => {
    const g = ctx.createRadialGradient(radius, radius, 0, radius, radius, radius);
    g.addColorStop(0, `rgba(${color}, 1)`);
    g.addColorStop(0.35, `rgba(${color}, 0.45)`);
    g.addColorStop(1, `rgba(${color}, 0)`);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, radius * 2, radius * 2);
  });
}
