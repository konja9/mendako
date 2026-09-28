// 水槽の中のちょっとした演出：ハート、キラキラ、落ちてくるごはん。

import { Container, Sprite, type Texture } from 'pixi.js';
import { FOOD_ICONS, HEART, SPARKLE } from '../../art/icons';
import type { FoodId } from '../../game/data/care';
import { svgTexture } from '../textures';

interface Floaty {
  sprite: Sprite;
  t: number;
  delay: number;
  duration: number;
  from: { x: number; y: number };
  rise: number;
}

interface Drop {
  sprite: Sprite;
  t: number;
  duration: number;
  from: { x: number; y: number };
  to: { x: number; y: number };
  done: () => void;
}

export class Effects extends Container {
  private heart: Promise<Texture>;
  private sparkle: Promise<Texture>;
  private foods = new Map<FoodId, Promise<Texture>>();
  private floaties: Floaty[] = [];
  private drops: Drop[] = [];

  constructor(
    private resolution: number,
    private reducedMotion: boolean,
  ) {
    super();
    this.heart = svgTexture(HEART, 28, 28, resolution);
    this.sparkle = svgTexture(SPARKLE, 26, 26, resolution);
  }

  private async float(texture: Promise<Texture>, at: { x: number; y: number }, count: number, spread: number) {
    const tex = await texture;
    const n = this.reducedMotion ? 1 : count;
    for (let i = 0; i < n; i++) {
      const sprite = new Sprite(tex);
      sprite.anchor.set(0.5);
      sprite.alpha = 0;
      this.addChild(sprite);
      this.floaties.push({
        sprite,
        t: 0,
        delay: i * 0.07,
        duration: 1.1,
        from: { x: at.x + (Math.random() - 0.5) * spread, y: at.y + (Math.random() - 0.5) * spread * 0.4 },
        rise: 110,
      });
    }
  }

  hearts(at: { x: number; y: number }) {
    return this.float(this.heart, at, 3, 60);
  }

  sparkles(at: { x: number; y: number }, count: number) {
    return this.float(this.sparkle, at, count, 110);
  }

  /** ごはんを from から to へ落とす。着いたら done */
  async dropFood(foodId: FoodId, from: { x: number; y: number }, to: { x: number; y: number }, done: () => void) {
    if (!this.foods.has(foodId)) this.foods.set(foodId, svgTexture(FOOD_ICONS[foodId], 46, 46, this.resolution));
    const sprite = new Sprite(await this.foods.get(foodId)!);
    sprite.anchor.set(0.5);
    sprite.position.set(from.x, from.y);
    this.addChild(sprite);
    this.drops.push({ sprite, t: 0, duration: this.reducedMotion ? 0.01 : 0.9, from, to, done });
  }

  update(dt: number) {
    for (let i = this.floaties.length - 1; i >= 0; i--) {
      const f = this.floaties[i];
      f.t += dt;
      const k = (f.t - f.delay) / f.duration;
      if (k < 0) continue;
      if (k >= 1) {
        f.sprite.destroy();
        this.floaties.splice(i, 1);
        continue;
      }
      const ease = 1 - (1 - k) ** 2;
      f.sprite.alpha = 1 - k;
      f.sprite.position.set(f.from.x, f.from.y - f.rise * ease);
      f.sprite.scale.set(0.5 + 0.65 * ease);
    }
    for (let i = this.drops.length - 1; i >= 0; i--) {
      const d = this.drops[i];
      d.t += dt;
      const k = Math.min(1, d.t / d.duration);
      const ease = k * k * (3 - 2 * k);
      d.sprite.position.set(d.from.x + (d.to.x - d.from.x) * ease, d.from.y + (d.to.y - d.from.y) * ease);
      d.sprite.rotation = -0.35 + 0.53 * ease;
      if (k >= 1) {
        d.sprite.destroy();
        this.drops.splice(i, 1);
        d.done();
      }
    }
  }
}
