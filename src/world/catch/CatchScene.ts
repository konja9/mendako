// ミニゲーム「マリンスノーキャッチ」。30秒間、降ってくるものをめんだこで集める。
// 報酬の計算はゲームのルール側（finishPlay）に任せ、ここは遊びと表示だけを持つ。
// スマホでは指がめんだこを隠さないよう、画面のどこでもドラッグした分だけ動く（相対操作）。

import { Container, Graphics, Rectangle, Sprite, Text, type FederatedPointerEvent, type Texture } from 'pixi.js';
import { CATCH_ITEM_SIZE, drawCatchItem, type CatchKind } from '../../art/catch-items';
import type { CatchHud } from '../../app/ui-state';
import type { Equipped } from '../../game/data/outfits';
import { Mendako } from '../tank/Mendako';
import { canvasTexture } from '../textures';

export const CATCH_DURATION = 30;
const FIELD_MAX_W = 480;
const DRAG_GAIN = 1.4;

const KINDS: { id: CatchKind; points: number; pearl?: number; weight: number; r: number }[] = [
  { id: 'snow', points: 1, weight: 58, r: 8 },
  { id: 'copepod', points: 3, weight: 20, r: 11 },
  { id: 'pearl', points: 0, pearl: 1, weight: 7, r: 10 },
  { id: 'trash', points: -3, weight: 15, r: 15 },
];
const TOTAL_WEIGHT = KINDS.reduce((sum, k) => sum + k.weight, 0);

function pickKind() {
  let roll = Math.random() * TOTAL_WEIGHT;
  for (const kind of KINDS) {
    roll -= kind.weight;
    if (roll <= 0) return kind;
  }
  return KINDS[0];
}

interface Item {
  sprite: Sprite;
  kind: (typeof KINDS)[number];
  vy: number;
  seed: number;
}

export interface CatchCallbacks {
  hud(patch: Partial<CatchHud>): void;
  finish(score: number, pearls: number): void;
}

export class CatchScene extends Container {
  private textures: Record<CatchKind, Texture>;
  private player: Mendako;
  private shadow = new Graphics();
  private itemLayer = new Container();
  private popLayer = new Container();
  private items: Item[] = [];
  private pops: { text: Text; life: number }[] = [];

  private w = 0;
  private h = 0;
  private left = 0;
  private fieldW = 0;
  private px = 0;
  private target = 0;
  private stunned = 0;
  private tilt = 0;
  private time = 0;

  private phase: 'intro' | 'play' | 'done' = 'intro';
  private introT = 0;
  private elapsed = 0;
  private spawnIn = 0.4;
  private score = 0;
  private pearls = 0;
  private shownTime = CATCH_DURATION;
  private shownCount = '3';
  private shownScore = 0;
  private shownPearls = 0;

  private keys = new Set<number>();
  private drag: { startX: number; fromX: number } | null = null;

  constructor(
    resolution: number,
    look: Partial<Equipped>,
    private cb: CatchCallbacks,
    private reducedMotion: boolean,
  ) {
    super();
    const tex = (kind: CatchKind) => canvasTexture(CATCH_ITEM_SIZE, CATCH_ITEM_SIZE, resolution, (ctx) => drawCatchItem(ctx, kind));
    this.textures = { snow: tex('snow'), copepod: tex('copepod'), pearl: tex('pearl'), trash: tex('trash') };
    this.player = new Mendako(resolution);
    this.player.setLook(look);
    this.player.setBaseExpression('happy');
    this.shadow.ellipse(0, 0, 1, 1).fill({ color: 0x040c1e, alpha: 0.4 });
    this.addChild(this.itemLayer, this.shadow, this.player, this.popLayer);

    this.eventMode = 'static';
    this.on('pointerdown', this.onDown);
    this.on('globalpointermove', this.onMove);
    this.on('pointerup', this.onUp);
    this.on('pointerupoutside', this.onUp);
    window.addEventListener('keydown', this.onKey);
    window.addEventListener('keyup', this.onKey);
  }

  private size() {
    return Math.min(120, Math.max(84, this.fieldW * 0.24));
  }

  resize(w: number, h: number) {
    const first = this.w === 0;
    this.w = w;
    this.h = h;
    this.fieldW = Math.min(w, FIELD_MAX_W);
    this.left = (w - this.fieldW) / 2;
    this.hitArea = new Rectangle(0, 0, w, h);
    if (first) this.px = this.target = w / 2;
    this.clampTarget();
  }

  private clampTarget() {
    const half = this.size() / 2;
    this.target = Math.max(this.left + half, Math.min(this.left + this.fieldW - half, this.target));
  }

  private onDown = (e: FederatedPointerEvent) => {
    this.drag = { startX: e.global.x, fromX: this.target };
  };

  private onMove = (e: FederatedPointerEvent) => {
    if (!this.drag) return;
    this.target = this.drag.fromX + (e.global.x - this.drag.startX) * DRAG_GAIN;
    this.clampTarget();
  };

  private onUp = () => {
    this.drag = null;
  };

  private onKey = (e: KeyboardEvent) => {
    const dir = ({ ArrowLeft: -1, a: -1, A: -1, ArrowRight: 1, d: 1, D: 1 } as Record<string, number>)[e.key];
    if (!dir) return;
    e.preventDefault();
    if (e.type === 'keydown') this.keys.add(dir);
    else this.keys.delete(dir);
  };

  private spawn() {
    const kind = pickKind();
    const sprite = new Sprite(this.textures[kind.id]);
    sprite.anchor.set(0.5);
    sprite.position.set(this.left + 24 + Math.random() * (this.fieldW - 48), -24);
    this.itemLayer.addChild(sprite);
    const progress = this.elapsed / CATCH_DURATION;
    this.items.push({ sprite, kind, vy: (110 + 90 * progress) * (0.85 + Math.random() * 0.3), seed: Math.random() * 10 });
  }

  private pop(x: number, y: number, text: string, color: string) {
    const t = new Text({
      text,
      style: { fontFamily: '"Mochiy Pop One", "Zen Maru Gothic", sans-serif', fontSize: 18, fill: color, fontWeight: 'bold' },
    });
    t.anchor.set(0.5);
    t.position.set(x, y);
    this.popLayer.addChild(t);
    this.pops.push({ text: t, life: 0.9 });
  }

  private playerCenterY() {
    return this.h - this.size() * 0.62 - 44;
  }

  update(dt: number) {
    this.time += dt;
    const t = this.time;

    if (this.phase === 'intro') {
      this.introT += dt;
      const step = this.reducedMotion ? 0.45 : 0.7;
      const count = this.introT < step ? '3' : this.introT < step * 2 ? '2' : this.introT < step * 3 ? '1' : 'スタート！';
      if (count !== this.shownCount) {
        this.shownCount = count;
        this.cb.hud({ count });
      }
      if (this.introT > step * 3 + 0.45) {
        this.phase = 'play';
        this.cb.hud({ phase: 'play' });
      }
    } else if (this.phase === 'play') {
      this.play(dt);
    }

    // めんだこ
    const s = this.size();
    if (this.phase !== 'done' && this.stunned <= 0) {
      for (const dir of this.keys) this.target += dir * 420 * dt;
      this.clampTarget();
      const before = this.px;
      this.px += (this.target - this.px) * Math.min(1, dt * 10);
      this.tilt = Math.max(-0.3, Math.min(0.3, (this.px - before) / (dt * 900 || 1)));
    }
    const shake = this.stunned > 0 && !this.reducedMotion ? Math.sin(t * 60) * 4 : 0;
    const cy = this.playerCenterY();
    this.player.position.set(this.px + shake, cy + s * 0.16);
    this.player.scale.set(s / 200);
    this.player.rotation = this.tilt;
    this.player.update(dt);
    this.shadow.position.set(this.px, this.h - 30);
    this.shadow.scale.set(s * 0.32, 6);

    for (const item of this.items) {
      if (item.kind.id === 'copepod') item.sprite.rotation = Math.sin(t * 6 + item.seed) * 0.25;
      if (item.kind.id === 'trash') item.sprite.rotation = Math.sin(t * 2 + item.seed) * 0.35;
      if (item.kind.id === 'pearl') item.sprite.scale.set(0.95 + 0.08 * Math.sin(t * 5 + item.seed));
    }
    for (let i = this.pops.length - 1; i >= 0; i--) {
      const p = this.pops[i];
      p.life -= dt;
      p.text.y -= 40 * dt;
      p.text.alpha = Math.min(1, p.life * 2);
      if (p.life <= 0) {
        p.text.destroy();
        this.pops.splice(i, 1);
      }
    }
  }

  private play(dt: number) {
    this.elapsed += dt;
    if (this.stunned > 0) this.stunned -= dt;

    this.spawnIn -= dt;
    if (this.spawnIn <= 0) {
      this.spawn();
      this.spawnIn = 0.55 - 0.27 * (this.elapsed / CATCH_DURATION);
    }

    const s = this.size();
    const cy = this.playerCenterY();
    const catchR = s * 0.4;
    for (let i = this.items.length - 1; i >= 0; i--) {
      const item = this.items[i];
      const sp = item.sprite;
      sp.y += item.vy * dt;
      if (item.kind.id === 'snow') sp.x += Math.sin(this.elapsed * 3 + item.seed) * 20 * dt;
      if (Math.hypot(sp.x - this.px, sp.y - cy) < catchR + item.kind.r) {
        if (item.kind.id === 'trash') {
          if (this.stunned <= 0) {
            this.score = Math.max(0, this.score + item.kind.points);
            this.stunned = 0.9;
            this.player.express('tickled', 900);
            this.pop(sp.x, sp.y, `${item.kind.points}`, '#ffb0c0');
          }
        } else {
          this.score += item.kind.points;
          this.pearls += item.kind.pearl ?? 0;
          this.pop(sp.x, sp.y, item.kind.pearl ? '真珠！' : `+${item.kind.points}`, item.kind.pearl ? '#fff1a0' : '#ffffff');
        }
        sp.destroy();
        this.items.splice(i, 1);
        continue;
      }
      if (sp.y > this.h + 30) {
        sp.destroy();
        this.items.splice(i, 1);
      }
    }

    const time = Math.max(0, Math.ceil(CATCH_DURATION - this.elapsed));
    if (time !== this.shownTime) {
      this.shownTime = time;
      this.cb.hud({ time });
    }
    if (this.score !== this.shownScore || this.pearls !== this.shownPearls) {
      this.shownScore = this.score;
      this.shownPearls = this.pearls;
      this.cb.hud({ score: this.score, pearls: this.pearls });
    }

    if (this.elapsed >= CATCH_DURATION) {
      this.phase = 'done';
      this.drag = null;
      this.cb.finish(this.score, this.pearls);
    }
  }

  override destroy() {
    window.removeEventListener('keydown', this.onKey);
    window.removeEventListener('keyup', this.onKey);
    this.player.destroy();
    super.destroy({ children: true });
    for (const texture of Object.values(this.textures)) texture.destroy(true);
  }
}
