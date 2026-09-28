// 深海の暗闇。画面全体を暗くし、めんだこのまわりだけ光の輪でくり抜く。
// 合成モードやマスクを使わず、「真ん中が透明な大きな黒い絵」＋まわりを埋める黒い四角で作る（軽くて確実）。

import { Container, Graphics, Sprite, type Texture } from 'pixi.js';
import { canvasTexture } from '../textures';

const SIZE = 512;
const HOLE = 128;

let holeTexture: Texture | null = null;

function makeHole(): Texture {
  return canvasTexture(SIZE, SIZE, 1, (ctx) => {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, SIZE, SIZE);
    ctx.globalCompositeOperation = 'destination-out';
    const g = ctx.createRadialGradient(SIZE / 2, SIZE / 2, 0, SIZE / 2, SIZE / 2, HOLE);
    g.addColorStop(0, 'rgba(0,0,0,1)');
    g.addColorStop(0.6, 'rgba(0,0,0,0.92)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(SIZE / 2, SIZE / 2, HOLE, 0, Math.PI * 2);
    ctx.fill();
  });
}

export class Darkness extends Container {
  private hole: Sprite;
  private fill = new Graphics();
  private w = 0;
  private h = 0;
  /** 今の光の輪の半径（px）。なめらかに変える */
  radius = 100;

  constructor() {
    super();
    holeTexture ??= makeHole();
    this.hole = new Sprite(holeTexture);
    this.hole.anchor.set(0.5);
    this.addChild(this.fill, this.hole);
  }

  resize(w: number, h: number) {
    this.w = w;
    this.h = h;
  }

  /** 光の輪を (x, y) に置き、まわりを埋める */
  place(x: number, y: number) {
    const scale = this.radius / HOLE;
    const half = (SIZE / 2) * scale;
    this.hole.position.set(x, y);
    this.hole.scale.set(scale);
    const left = x - half;
    const right = x + half;
    const top = y - half;
    const bottom = y + half;
    const pad = 4;
    this.fill
      .clear()
      .rect(-pad, -pad, this.w + pad * 2, Math.max(0, top) + pad)
      .rect(-pad, bottom, this.w + pad * 2, Math.max(0, this.h - bottom) + pad)
      .rect(-pad, top, Math.max(0, left) + pad, half * 2)
      .rect(right, top, Math.max(0, this.w - right) + pad, half * 2)
      .fill(0x000000);
  }
}
