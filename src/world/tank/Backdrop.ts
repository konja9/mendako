// 画面いっぱいの海の背景：深さのグラデーションと、上から差す光の筋。

import { Container, Sprite } from 'pixi.js';
import { canvasTexture } from '../textures';

export class Backdrop extends Container {
  private gradient: Sprite;
  private rays: Sprite;
  private time = 0;

  constructor() {
    super();
    this.gradient = new Sprite(
      canvasTexture(4, 512, 1, (ctx) => {
        const g = ctx.createLinearGradient(0, 0, 0, 512);
        g.addColorStop(0, '#1b4f8a');
        g.addColorStop(0.38, '#0e2d5c');
        g.addColorStop(0.72, '#07173a');
        g.addColorStop(1, '#050f29');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, 4, 512);
      }),
    );
    this.rays = new Sprite(
      canvasTexture(1024, 900, 1, (ctx) => {
        const cx = 512;
        const cy = -120;
        ctx.fillStyle = 'rgba(190, 230, 255, 0.075)';
        for (let deg = 25; deg < 155; deg += 11) {
          const a0 = (deg * Math.PI) / 180;
          const a1 = ((deg + 4) * Math.PI) / 180;
          ctx.beginPath();
          ctx.moveTo(cx, cy);
          ctx.lineTo(cx + Math.cos(a0) * 1600, cy + Math.sin(a0) * 1600);
          ctx.lineTo(cx + Math.cos(a1) * 1600, cy + Math.sin(a1) * 1600);
          ctx.closePath();
          ctx.fill();
        }
        // 下に行くほど消える
        ctx.globalCompositeOperation = 'destination-in';
        const fade = ctx.createLinearGradient(0, 0, 0, 900);
        fade.addColorStop(0, 'rgba(0,0,0,1)');
        fade.addColorStop(0.85, 'rgba(0,0,0,0)');
        ctx.fillStyle = fade;
        ctx.fillRect(0, 0, 1024, 900);
      }),
    );
    this.rays.anchor.set(0.5, 0);
    this.addChild(this.gradient, this.rays);
  }

  resize(w: number, h: number) {
    this.gradient.width = w;
    this.gradient.height = h;
    const scale = Math.max(w / 700, h / 900) * 1.1;
    this.rays.scale.set(scale);
    this.rays.position.set(w / 2, -20);
  }

  update(dt: number) {
    this.time += dt;
    this.rays.rotation = Math.sin((this.time / 18) * Math.PI * 2) * 0.035;
  }
}
