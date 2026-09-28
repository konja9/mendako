// 画面全体の深海の粒：ゆっくり降るマリンスノー、のぼる泡、ときどき光る発光生物。

import { Container, Particle, ParticleContainer, Sprite, type Texture } from 'pixi.js';
import { canvasTexture, glowTexture } from '../textures';

interface Snow {
  p: Particle;
  vy: number;
  sway: number;
}

interface Glow {
  sprite: Sprite;
  phase: number;
  speed: number;
}

interface Bubble {
  sprite: Sprite;
  vy: number;
  phase: number;
}

export class Ocean extends Container {
  private snowLayer = new ParticleContainer({ dynamicProperties: { position: true } });
  private glowLayer = new Container();
  private bubbleLayer = new Container();
  private snow: Snow[] = [];
  private glows: Glow[] = [];
  private bubbles: Bubble[] = [];
  private snowTexture: Texture;
  private bubbleTexture: Texture;
  private glowTextures: Texture[];
  private width_ = 0;
  private height_ = 0;
  private time = 0;
  private bubbleTimer = 2;

  constructor(
    resolution: number,
    private reducedMotion: boolean,
  ) {
    super();
    this.snowTexture = canvasTexture(8, 8, resolution, (ctx) => {
      ctx.fillStyle = 'rgb(235, 244, 255)';
      ctx.beginPath();
      ctx.arc(4, 4, 3.5, 0, Math.PI * 2);
      ctx.fill();
    });
    this.bubbleTexture = canvasTexture(24, 24, resolution, (ctx) => {
      ctx.fillStyle = 'rgba(200, 235, 255, 0.08)';
      ctx.strokeStyle = 'rgba(200, 235, 255, 0.6)';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.arc(12, 12, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
      ctx.beginPath();
      ctx.arc(8.5, 8.5, 2.5, 0, Math.PI * 2);
      ctx.fill();
    });
    this.glowTextures = [glowTexture(16, '143, 227, 255', resolution), glowTexture(16, '255, 160, 210', resolution)];
    this.addChild(this.glowLayer, this.snowLayer, this.bubbleLayer);
  }

  resize(w: number, h: number) {
    this.width_ = w;
    this.height_ = h;
    this.snowLayer.removeParticles();
    this.snow = [];
    this.glowLayer.removeChildren().forEach((c) => c.destroy());
    this.glows = [];

    // 画面の広さに合わせて数を決める（スマホで多すぎないように上限あり）
    const count = Math.min(220, Math.round((w * h) / 6500));
    for (let i = 0; i < count; i++) {
      const r = 0.6 + Math.random() * 1.8;
      const p = new Particle({
        texture: this.snowTexture,
        x: Math.random() * w,
        y: Math.random() * h,
        anchorX: 0.5,
        anchorY: 0.5,
        scaleX: r / 3.5,
        scaleY: r / 3.5,
        alpha: 0.2 + Math.random() * 0.5,
      });
      this.snowLayer.addParticle(p);
      this.snow.push({ p, vy: 5 + Math.random() * 12, sway: Math.random() * Math.PI * 2 });
    }
    for (let i = 0; i < Math.max(6, count / 10); i++) {
      const sprite = new Sprite(this.glowTextures[Math.random() < 0.7 ? 0 : 1]);
      sprite.anchor.set(0.5);
      sprite.position.set(Math.random() * w, h * (0.12 + Math.random() * 0.62));
      sprite.scale.set(0.5 + Math.random() * 0.6);
      this.glowLayer.addChild(sprite);
      this.glows.push({ sprite, phase: Math.random() * Math.PI * 2, speed: 0.4 + Math.random() * 0.8 });
    }
    this.update(0);
  }

  /** 画面上の位置から泡をぽこぽこ出す */
  bubblesAt(x: number, y: number, count = 4) {
    if (this.reducedMotion) return;
    for (let i = 0; i < count; i++) this.spawnBubble(x + (Math.random() - 0.5) * 30, y + Math.random() * 20, 0.7);
  }

  private spawnBubble(x: number, y: number, size = 1) {
    const sprite = new Sprite(this.bubbleTexture);
    sprite.anchor.set(0.5);
    sprite.position.set(x, y);
    sprite.scale.set(((2 + Math.random() * 4) / 10) * size * 1.4);
    this.bubbleLayer.addChild(sprite);
    this.bubbles.push({ sprite, vy: 22 + Math.random() * 26, phase: Math.random() * Math.PI * 2 });
  }

  update(dt: number) {
    if (this.reducedMotion) dt = 0;
    this.time += dt;
    const t = this.time;
    const { width_: w, height_: h } = this;

    for (const s of this.snow) {
      s.p.y += s.vy * dt;
      s.p.x += Math.sin(t * 0.4 + s.sway) * 4 * dt;
      if (s.p.y > h + 4) {
        s.p.y = -4;
        s.p.x = Math.random() * w;
      }
    }
    for (const g of this.glows) {
      g.sprite.alpha = 0.15 + 0.85 * Math.max(0, Math.sin(t * g.speed + g.phase)) ** 3;
    }

    this.bubbleTimer -= dt;
    if (this.bubbleTimer <= 0 && dt > 0) {
      this.bubbleTimer = 1.5 + Math.random() * 3.5;
      const x = Math.random() * w;
      for (let i = 0; i < 1 + Math.floor(Math.random() * 3); i++) this.spawnBubble(x + Math.random() * 12, h + 10 + i * 14);
    }
    for (let i = this.bubbles.length - 1; i >= 0; i--) {
      const b = this.bubbles[i];
      b.sprite.y -= b.vy * dt;
      b.sprite.x += Math.sin(t * 2 + b.phase) * 10 * dt;
      if (b.sprite.y < -20) {
        b.sprite.destroy();
        this.bubbles.splice(i, 1);
      }
    }
  }
}
