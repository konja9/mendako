// Pixi 上のめんだこ。左ヒレ・右ヒレ・からだの3枚を重ね、ヒレのぱたぱた・ぷかぷか・まばたきを動かす。
// ローカル座標は SVG と同じ 200×200。足もと（スカートの下の中央）が原点になるよう pivot を置く。

import { Circle, Container, Sprite, type Texture } from 'pixi.js';
import { FIN_PIVOTS, MENDAKO_FOOT, mendakoSVG, OPEN_EYES, type Expression } from '../../art/mendako';
import type { Equipped } from '../../game/data/outfits';
import { glowTexture, svgTexture } from '../textures';

type Part = 'finL' | 'finR' | 'body';

/** ひとつの着こなし（色・服）に対するテクスチャの入れ物 */
class LookTextures {
  private map = new Map<string, Promise<Texture>>();
  constructor(
    private look: Partial<Equipped>,
    private resolution: number,
  ) {}

  get(part: Part, expression: Expression = 'normal', blink = false): Promise<Texture> {
    const key = part === 'body' ? `body|${expression}|${blink}` : part;
    let texture = this.map.get(key);
    if (!texture) {
      const svg = mendakoSVG({ equipped: this.look, expression, blink, part });
      texture = svgTexture(svg, 200, 200, this.resolution);
      this.map.set(key, texture);
    }
    return texture;
  }

  destroy() {
    for (const texture of this.map.values()) texture.then((t) => t.destroy(true)).catch(() => {});
    this.map.clear();
  }
}

let lanternGlow: Texture | null = null;

export const lookKey = (look: Partial<Equipped>) => `${look.color}|${look.head}|${look.face}|${look.neck}`;

export class Mendako extends Container {
  readonly inner = new Container();
  private finL = new Sprite();
  private finR = new Sprite();
  private body = new Sprite();
  private glow: Sprite | null = null;

  private textures: LookTextures | null = null;
  private currentKey = '';
  private token = 0;

  private baseExpression: Expression = 'normal';
  private override: { expression: Expression; until: number } | null = null;
  private shownBody = '';
  private blinkUntil = 0;
  private nextBlink = 0;

  sleeping = false;
  time = Math.random() * 10;
  private squishT = -1;

  constructor(private resolution: number) {
    super();
    this.pivot.set(MENDAKO_FOOT.x, MENDAKO_FOOT.y);
    this.inner.pivot.set(MENDAKO_FOOT.x, MENDAKO_FOOT.y);
    this.inner.position.set(MENDAKO_FOOT.x, MENDAKO_FOOT.y);
    for (const [sprite, key] of [
      [this.finL, 'finL'],
      [this.finR, 'finR'],
    ] as const) {
      sprite.pivot.set(FIN_PIVOTS[key].x, FIN_PIVOTS[key].y);
      sprite.position.set(FIN_PIVOTS[key].x, FIN_PIVOTS[key].y);
    }
    this.inner.addChild(this.finL, this.finR, this.body);
    this.addChild(this.inner);
    this.hitArea = new Circle(100, 108, 64);
  }

  /** 着こなしを変える。テクスチャが用意できてから差し替えるので、ちらつかない */
  async setLook(look: Partial<Equipped>) {
    const key = lookKey(look);
    if (key === this.currentKey) return;
    this.currentKey = key;
    const token = ++this.token;
    const next = new LookTextures(look, this.resolution);
    const expression = this.expressionNow();
    const [finL, finR, body] = await Promise.all([next.get('finL'), next.get('finR'), next.get('body', expression)]);
    if (token !== this.token) {
      next.destroy();
      return;
    }
    const previous = this.textures;
    this.textures = next;
    this.finL.texture = finL;
    this.finR.texture = finR;
    this.body.texture = body;
    this.shownBody = `${expression}|false`;
    previous?.destroy();
    this.setGlow(look.head === 'lantern');
  }

  setBaseExpression(expression: Expression) {
    this.baseExpression = expression;
  }

  express(expression: Expression, ms: number) {
    this.override = { expression, until: performance.now() + ms };
  }

  squish() {
    this.squishT = 0;
  }

  /** 頭のてっぺん付近（ふきだしを出す位置）のローカル座標 */
  static readonly HEAD = { x: 100, y: 44 };

  private expressionNow(): Expression {
    if (this.override && this.override.until > performance.now()) return this.override.expression;
    return this.baseExpression;
  }

  // ちょうちんカチューシャの先を光らせる
  private setGlow(on: boolean) {
    if (on && !this.glow) {
      lanternGlow ??= glowTexture(24, '255, 245, 168', 2);
      this.glow = new Sprite(lanternGlow);
      this.glow.anchor.set(0.5);
      this.glow.position.set(132, 28);
      this.inner.addChild(this.glow);
    } else if (!on && this.glow) {
      this.glow.destroy();
      this.glow = null;
    }
  }

  update(dt: number) {
    this.time += dt;
    const t = this.time;

    // ぷかぷか（寝ているときはゆっくり小さく）
    const bobPeriod = this.sleeping ? 6 : 3.4;
    const bobAmp = this.sleeping ? 4 : 7;
    this.inner.position.y = MENDAKO_FOOT.y - (Math.sin((t / bobPeriod) * Math.PI * 2) * 0.5 + 0.5) * bobAmp;

    // ヒレ
    const flap = this.sleeping ? 0 : (Math.sin((t / 1.7) * Math.PI * 2) * 0.5 + 0.5) * 0.24;
    this.finL.rotation += (-flap - this.finL.rotation) * Math.min(1, dt * 12);
    this.finR.rotation += (flap - this.finR.rotation) * Math.min(1, dt * 12);

    // ぷにっ
    if (this.squishT >= 0) {
      this.squishT += dt / 0.45;
      const k = this.squishT;
      let sx = 1;
      let sy = 1;
      if (k < 0.3) {
        sx = 1 + 0.08 * (k / 0.3);
        sy = 1 - 0.1 * (k / 0.3);
      } else if (k < 0.6) {
        const u = (k - 0.3) / 0.3;
        sx = 1.08 - 0.12 * u;
        sy = 0.9 + 0.15 * u;
      } else if (k < 1) {
        const u = (k - 0.6) / 0.4;
        sx = 0.96 + 0.04 * u;
        sy = 1.05 - 0.05 * u;
      } else {
        this.squishT = -1;
      }
      this.inner.scale.set(sx, sy);
    }

    if (this.glow) {
      const pulse = 0.5 + 0.5 * Math.sin(t * 2.6);
      this.glow.alpha = 0.35 + 0.35 * pulse;
      this.glow.scale.set(0.9 + 0.3 * pulse);
    }

    // まばたき
    const now = performance.now();
    const expression = this.expressionNow();
    if (now > this.nextBlink) {
      this.blinkUntil = now + 130;
      this.nextBlink = now + 3000 + Math.random() * 3500;
    }
    const blink = now < this.blinkUntil && OPEN_EYES.has(expression);
    const bodyKey = `${expression}|${blink}`;
    if (bodyKey !== this.shownBody && this.textures) {
      this.shownBody = bodyKey;
      const textures = this.textures;
      textures.get('body', expression, blink).then((texture) => {
        if (this.textures === textures && this.shownBody === bodyKey) this.body.texture = texture;
      });
    }
  }

  override destroy() {
    this.token++;
    this.textures?.destroy();
    super.destroy({ children: true });
  }
}
