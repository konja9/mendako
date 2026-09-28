// 深海探索の画面。めんだこを指で泳がせ、ちょうちんの光で暗い海を照らしながら潜る。
// 座標：画面座標で描く。深さ d（m）の物は、ワールド上で y = d × PX_PER_M に置き、カメラで動かす。

import { Container, Graphics, Rectangle, Sprite, Text, type FederatedPointerEvent, type Texture } from 'pixi.js';
import { CREATURE_ART } from '../../art/creatures';
import { HAZARD_ART, MATERIAL_ART } from '../../art/dive';
import type { DiveResult, PlanItem } from '../../game/dive';
import { CREATURE_BY_ID, type CreatureDef } from '../../game/data/creatures';
import { MATERIAL_BY_ID } from '../../game/data/materials';
import type { ZoneDef } from '../../game/data/zones';
import type { Equipped } from '../../game/data/outfits';
import type { DiveHud } from '../../app/ui-state';
import { Ocean } from '../tank/Ocean';
import { Mendako } from '../tank/Mendako';
import { glowTexture, svgTexture } from '../textures';
import { Darkness } from './Darkness';

const PX_PER_M = 4;
const FIELD_MAX_W = 480;
const DRAG_GAIN = 1.25;
const PLAYER_SIZE = 96;
const PLAYER_R = 34;
const BUMP_COST = 18;
const INTRO_SEC = 2.2;
const MEET_SEC = 1.5;

export interface DiveCallbacks {
  hud(patch: Partial<DiveHud>): void;
  meet(id: string): void;
  finish(result: DiveResult): void;
}

interface Entity {
  item: PlanItem;
  sprite: Sprite;
  /** 暗闇の上に出す、かすかな光（居場所のヒント・自分で光る生き物） */
  glow: Sprite | null;
  ring: Graphics | null;
  def?: CreatureDef;
  baseX: number;
  y: number;
  r: number;
  phase: number;
  met: boolean;
  taken: boolean;
  progress: number;
  flee: number;
  fleeDir: number;
  offsetX: number;
}

export class DiveScene extends Container {
  private bg = new Graphics();
  private ocean: Ocean;
  private world = new Container();
  private above = new Container();
  private darkness = new Darkness();
  private player: Mendako;
  private pops = new Container();
  private entities: Entity[] = [];
  private textures = new Map<string, Promise<Texture>>();
  private glowCyan = glowTexture(40, '143, 227, 255', 1);
  private glowPink = glowTexture(40, '255, 170, 220', 1);

  private w = 0;
  private h = 0;
  private left = 0;
  private fieldW = 0;
  private px = 0;
  private py = 0;
  private target = { x: 0, y: 0 };
  private depth: number;
  private speedPx = 0;
  private lastPos = { x: 0, y: 0 };
  private gauge = 100;
  private drainPerSec: number;
  private baseSpeed: number;
  private light = true;
  private stunned = 0;
  private invulnerable = 0;
  private time = 0;
  private phase: 'intro' | 'play' | 'done' = 'intro';
  private met = new Set<string>();
  private materials: Record<string, number> = {};
  private trash = 0;
  private maxDepth: number;
  private drag: { x: number; y: number } | null = null;
  private keys = new Set<string>();
  private shown = { depth: -1, gauge: -1, items: -1 };

  constructor(
    resolution: number,
    look: Partial<Equipped>,
    private zone: ZoneDef,
    plan: PlanItem[],
    private cb: DiveCallbacks,
    private reducedMotion: boolean,
  ) {
    super();
    this.depth = zone.top;
    this.maxDepth = zone.top;
    // 普通の速さで泳ぐと 約2分で底に着き、探検ゲージが3割ほど残る
    const span = zone.bottom - zone.top;
    this.baseSpeed = span / (zone.bottom > 1000 ? 140 : 110);
    this.drainPerSec = 68 / (span / this.baseSpeed);

    this.ocean = new Ocean(resolution, reducedMotion);
    this.player = new Mendako(resolution * 0.6);
    this.player.setLook(look);
    this.player.setBaseExpression('normal');
    // ちょうちんカチューシャを着けていると、光の輪が大きい
    this.lightRadius = look.head === 'lantern' ? 140 : 100;
    this.darkness.radius = this.lightRadius;

    this.addChild(this.bg, this.ocean, this.world, this.player, this.darkness, this.above, this.pops);
    for (const item of plan) this.addEntity(item, resolution);

    this.eventMode = 'static';
    this.on('pointerdown', (e: FederatedPointerEvent) => (this.drag = { x: e.global.x, y: e.global.y }));
    this.on('globalpointermove', this.onMove);
    this.on('pointerup', () => (this.drag = null));
    this.on('pointerupoutside', () => (this.drag = null));
    window.addEventListener('keydown', this.onKey);
    window.addEventListener('keyup', this.onKey);
    cb.hud({ phase: 'intro', zoneId: zone.id, depth: zone.top, gauge: 100, light: true, met: 0, items: 0, lastMet: null, result: null });
  }

  private lightRadius: number;

  private texture(key: string, svg: string, w: number, h: number, resolution: number) {
    let t = this.textures.get(key);
    if (!t) {
      t = svgTexture(svg, w, h, resolution);
      this.textures.set(key, t);
    }
    return t;
  }

  private addEntity(item: PlanItem, resolution: number) {
    let art: { svg: string; w: number; h: number };
    let displayW: number;
    let def: CreatureDef | undefined;
    if (item.kind === 'creature') {
      def = CREATURE_BY_ID[item.id];
      art = CREATURE_ART[item.id];
      displayW = Math.min(def.displayW * 0.9, 120);
    } else if (item.kind === 'hazard') {
      art = HAZARD_ART[item.id];
      displayW = item.id === 'shadow' ? 170 : 70;
    } else {
      art = MATERIAL_ART[item.kind === 'trash' ? 'trash' : item.id];
      displayW = 34;
    }
    const scale = displayW / art.w;
    const sprite = new Sprite();
    sprite.anchor.set(0.5);
    sprite.scale.set(scale);
    this.texture(item.kind === 'creature' ? item.id : `${item.kind}:${item.id}`, art.svg, art.w, art.h, resolution).then((t) => {
      if (!sprite.destroyed) sprite.texture = t;
    });

    // 自分で光る生き物は暗闇の上に描く（ライトを消すとよく見える）
    const glows = def?.encounter === 'glow';
    (glows ? this.above : this.world).addChild(sprite);

    let glow: Sprite | null = null;
    if (item.kind === 'creature' || item.id === 'shadow' || item.kind === 'material') {
      glow = new Sprite(def?.encounter === 'glow' || item.kind === 'material' ? this.glowCyan : this.glowPink);
      glow.anchor.set(0.5);
      glow.scale.set(item.kind === 'material' ? 0.35 : item.id === 'shadow' ? 0.3 : 0.7);
      this.above.addChildAt(glow, 0);
    }
    let ring: Graphics | null = null;
    if (item.kind === 'creature') {
      ring = new Graphics();
      this.above.addChild(ring);
    }
    const h = art.h * scale;
    this.entities.push({
      item,
      sprite,
      glow,
      ring,
      def,
      baseX: 0,
      y: item.depth * PX_PER_M,
      r: Math.max(18, Math.min(displayW, h) * 0.42),
      phase: Math.random() * 10,
      met: false,
      taken: false,
      progress: 0,
      flee: 0,
      fleeDir: 1,
      offsetX: 0,
    });
  }

  resize(w: number, h: number) {
    const first = this.w === 0;
    this.w = w;
    this.h = h;
    this.fieldW = Math.min(w, FIELD_MAX_W);
    this.left = (w - this.fieldW) / 2;
    this.hitArea = new Rectangle(0, 0, w, h);
    this.ocean.resize(w, h);
    this.darkness.resize(w, h);
    for (const e of this.entities) e.baseX = this.left + e.item.x * this.fieldW;
    if (first) {
      this.px = this.target.x = w / 2;
      this.py = this.target.y = h * 0.4;
      this.lastPos = { x: this.px, y: this.py };
    }
  }

  setLight(on: boolean) {
    this.light = on;
  }

  /** 浮上する（途中でやめる） */
  surface() {
    if (this.phase === 'play') this.end(false);
  }

  private onMove = (e: FederatedPointerEvent) => {
    if (!this.drag) return;
    this.target.x += (e.global.x - this.drag.x) * DRAG_GAIN;
    this.target.y += (e.global.y - this.drag.y) * DRAG_GAIN;
    this.drag = { x: e.global.x, y: e.global.y };
  };

  private onKey = (e: KeyboardEvent) => {
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) return;
    e.preventDefault();
    if (e.type === 'keydown') this.keys.add(e.key);
    else this.keys.delete(e.key);
  };

  private pop(x: number, y: number, text: string, color = '#ffffff') {
    const t = new Text({
      text,
      style: { fontFamily: '"Mochiy Pop One", "Zen Maru Gothic", sans-serif', fontSize: 16, fill: color, stroke: { color: 0x061433, width: 4 } },
    });
    t.anchor.set(0.5);
    // 画面の端で切れないように、左右をおさめる
    const half = t.width / 2 + 8;
    t.position.set(Math.max(half, Math.min(this.w - half, x)), y);
    (t as Text & { life?: number }).life = 1.1;
    this.pops.addChild(t);
  }

  private end(reachedBottom: boolean) {
    this.phase = 'done';
    this.drag = null;
    this.cb.finish({
      zoneId: this.zone.id,
      met: [...this.met],
      materials: { ...this.materials },
      trash: this.trash,
      reachedBottom,
      maxDepth: Math.round(this.maxDepth),
    });
  }

  private darknessLevel() {
    const k = (this.depth - this.zone.top) / (this.zone.bottom - this.zone.top);
    return this.zone.top < 1000 ? 0.55 + 0.37 * k : 0.93 + 0.05 * k;
  }

  update(dt: number) {
    this.time += dt;
    const t = this.time;
    const { w, h } = this;

    // ---- めんだこを動かす ----
    if (this.phase !== 'done' && this.stunned <= 0) {
      const kx = (this.keys.has('ArrowRight') ? 1 : 0) - (this.keys.has('ArrowLeft') ? 1 : 0);
      const ky = (this.keys.has('ArrowDown') ? 1 : 0) - (this.keys.has('ArrowUp') ? 1 : 0);
      this.target.x += kx * 360 * dt;
      this.target.y += ky * 300 * dt;
    }
    this.target.x = Math.max(this.left + 40, Math.min(this.left + this.fieldW - 40, this.target.x));
    this.target.y = Math.max(h * 0.24, Math.min(h * 0.74, this.target.y));
    if (this.stunned <= 0) {
      this.px += (this.target.x - this.px) * Math.min(1, dt * 8);
      this.py += (this.target.y - this.py) * Math.min(1, dt * 8);
    }

    // ---- 潜る（下のほうへ泳ぐほど速く潜る）----
    if (this.phase === 'play') {
      const factor = Math.max(0.25, Math.min(3, 1 + (2.2 * (this.py - h * 0.4)) / (h * 0.35)));
      this.depth = Math.min(this.zone.bottom, this.depth + this.baseSpeed * factor * dt);
      this.maxDepth = Math.max(this.maxDepth, this.depth);
      this.gauge -= this.drainPerSec * dt;
      if (this.depth >= this.zone.bottom) this.end(true);
      else if (this.gauge <= 0) {
        this.gauge = 0;
        this.end(false);
      }
    } else if (this.phase === 'intro' && t > INTRO_SEC) {
      this.phase = 'play';
      this.cb.hud({ phase: 'play' });
    }
    if (this.stunned > 0) this.stunned -= dt;
    if (this.invulnerable > 0) this.invulnerable -= dt;

    // めんだこの速さ（画面上の動き＋潜る速さ）。恥ずかしがりの生き物が逃げるかの判定に使う
    const moved = Math.hypot(this.px - this.lastPos.x, this.py - this.lastPos.y) / (dt || 1);
    this.speedPx = moved;
    this.lastPos = { x: this.px, y: this.py };

    // ---- カメラ・背景 ----
    const camY = this.py - this.depth * PX_PER_M;
    this.world.y = camY;
    this.above.y = camY;
    const k = (this.depth - this.zone.top) / (this.zone.bottom - this.zone.top);
    this.bg.clear().rect(0, 0, w, h).fill(lerpColor(this.zone.colors[0], this.zone.colors[1], k));
    this.ocean.update(dt);

    // ---- 光の輪 ----
    const targetR = this.light ? this.lightRadius : 34;
    this.darkness.radius += (targetR - this.darkness.radius) * Math.min(1, dt * 6);
    this.darkness.alpha = this.light ? this.darknessLevel() : Math.min(0.99, this.darknessLevel() + 0.06);
    this.darkness.place(this.px, this.py);

    // ---- めんだこ ----
    const shake = this.stunned > 0 && !this.reducedMotion ? Math.sin(t * 60) * 4 : 0;
    this.player.position.set(this.px + shake, this.py + PLAYER_SIZE * 0.22);
    this.player.scale.set(PLAYER_SIZE / 200);
    this.player.rotation = Math.max(-0.25, Math.min(0.25, (this.target.x - this.px) / 300));
    this.player.update(dt);

    // ---- 生き物・素材・障害物 ----
    const playerWorldY = this.depth * PX_PER_M;
    const view = h / 2 + 200;
    for (const e of this.entities) {
      const onScreen = Math.abs(e.y - playerWorldY) < view;
      e.sprite.visible = onScreen && !e.taken;
      if (e.glow) e.glow.visible = e.sprite.visible;
      if (e.ring) e.ring.visible = false;
      if (!onScreen || e.taken) continue;

      let x = e.baseX;
      let y = e.y;
      if (e.item.kind === 'creature') {
        if (e.def?.motion !== 'sit') {
          x += Math.sin(t * 0.5 + e.phase) * 26;
          y += Math.sin(t * 1.1 + e.phase) * 8;
        }
        if (e.flee > 0) {
          e.flee -= dt;
          e.offsetX += e.fleeDir * 170 * dt;
        }
        x += e.offsetX;
        x = Math.max(this.left + 20, Math.min(this.left + this.fieldW - 20, x));
      } else if (e.item.id === 'shadow') {
        // 大きな影はフィールドを横切って行ったり来たり
        x = this.left + this.fieldW * (0.5 + 0.55 * Math.sin(t * 0.35 + e.phase));
        e.sprite.scale.x = Math.abs(e.sprite.scale.x) * (Math.cos(t * 0.35 + e.phase) > 0 ? -1 : 1);
      } else if (e.item.id === 'trashball') {
        x += Math.sin(t * 0.3 + e.phase) * 40;
        e.sprite.rotation = t * 0.3 + e.phase;
      } else {
        y += Math.sin(t * 1.4 + e.phase) * 3;
      }
      e.sprite.position.set(x, y);

      const sy = y + camY;
      const dist = Math.hypot(x - this.px, sy - this.py);

      if (e.item.kind === 'creature' && e.def) {
        const def = e.def;
        const glowType = def.encounter === 'glow';
        // 光る生き物：ライトがついていると暗闇にまぎれて見えにくい。消すとはっきり光る
        if (glowType) e.sprite.alpha = this.light ? 0.22 : 1;
        if (e.glow) {
          e.glow.position.set(x, y);
          e.glow.alpha = glowType ? (this.light ? 0.25 : 0.9) * (0.7 + 0.3 * Math.sin(t * 3 + e.phase)) : 0.22;
        }
        if (e.met || this.phase !== 'play') continue;

        // 恥ずかしがり：速く近づくと逃げる
        if (def.encounter === 'shy' && e.flee <= 0 && dist < this.lightRadius * 1.6 && this.speedPx > 260) {
          e.flee = 1.4;
          e.fleeDir = x < this.px ? -1 : 1;
          e.progress = 0;
          this.pop(x, sy - 30, 'にげちゃった…', '#b3cbeb');
          continue;
        }
        const reach = glowType ? (this.light ? 0 : this.lightRadius * 1.3) : this.darkness.radius * 0.9 + e.r;
        if (dist < reach && e.flee <= 0) {
          e.progress += dt / MEET_SEC;
          if (e.ring) {
            e.ring.visible = true;
            e.ring
              .clear()
              .arc(x, y, e.r + 10, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.min(1, e.progress))
              .stroke({ color: 0xffd66b, width: 4, cap: 'round' });
          }
          if (e.progress >= 1) {
            e.met = true;
            this.met.add(def.id);
            this.pop(x, sy - e.r - 16, 'であえた！', '#ffd66b');
            this.cb.meet(def.id);
            this.cb.hud({ met: this.met.size });
          }
        } else {
          e.progress = Math.max(0, e.progress - dt * 0.5);
        }
      } else if (e.item.kind === 'material' || e.item.kind === 'trash') {
        if (e.glow) {
          e.glow.position.set(x, y);
          e.glow.alpha = 0.25 + 0.15 * Math.sin(t * 2 + e.phase);
        }
        if (this.phase === 'play' && dist < PLAYER_R + e.r) {
          e.taken = true;
          if (e.item.kind === 'trash') {
            this.trash += 1;
            this.pop(x, sy - 20, 'ゴミを拾った', '#b3cbeb');
          } else {
            this.materials[e.item.id] = (this.materials[e.item.id] ?? 0) + 1;
            this.pop(x, sy - 20, `+${MATERIAL_BY_ID[e.item.id].name}`);
          }
        }
      } else if (e.item.kind === 'hazard') {
        if (e.glow) {
          // 大きな影の目だけがかすかに光る
          e.glow.position.set(x + (e.sprite.scale.x < 0 ? 1 : -1) * 55, y - 6);
          e.glow.alpha = 0.6;
        }
        if (this.phase === 'play' && this.invulnerable <= 0 && dist < PLAYER_R + e.r * 0.8) this.bump(x, sy);
      }
    }

    // ---- ふわっと消える文字 ----
    for (const child of [...this.pops.children] as (Text & { life?: number })[]) {
      child.life = (child.life ?? 1) - dt;
      child.y -= 30 * dt;
      child.alpha = Math.min(1, (child.life ?? 0) * 2);
      if ((child.life ?? 0) <= 0) child.destroy();
    }

    // ---- 画面の表示を更新（変わったときだけ）----
    const depthShown = Math.round(this.depth);
    const gaugeShown = Math.round(this.gauge);
    const itemsShown = Object.values(this.materials).reduce((a, b) => a + b, 0) + this.trash;
    if (depthShown !== this.shown.depth || gaugeShown !== this.shown.gauge || itemsShown !== this.shown.items) {
      this.shown = { depth: depthShown, gauge: gaugeShown, items: itemsShown };
      this.cb.hud({ depth: depthShown, gauge: Math.max(0, gaugeShown), items: itemsShown, light: this.light });
    }
  }

  /** 障害物にぶつかった：ゲージが減り、拾った素材を1つ落とす */
  private bump(x: number, y: number) {
    this.gauge = Math.max(0, this.gauge - BUMP_COST);
    this.stunned = 0.7;
    this.invulnerable = 1.6;
    this.player.express('tickled', 900);
    const owned = Object.keys(this.materials).filter((id) => this.materials[id] > 0);
    if (owned.length) {
      const id = owned[Math.floor(Math.random() * owned.length)];
      this.materials[id] -= 1;
      this.pop(x, y - 6, `${MATERIAL_BY_ID[id].name}を落とした…`, '#ffb0c0');
    }
    this.pop(x, y - 30, 'ぶつかった！', '#ffb0c0');
    if (this.gauge <= 0) this.end(false);
  }

  override destroy() {
    window.removeEventListener('keydown', this.onKey);
    window.removeEventListener('keyup', this.onKey);
    this.player.destroy();
    super.destroy({ children: true });
    for (const t of this.textures.values()) t.then((tex) => tex.destroy(true)).catch(() => {});
    this.glowCyan.destroy(true);
    this.glowPink.destroy(true);
  }
}

function lerpColor(a: number, b: number, k: number) {
  const c = (shift: number) => Math.round(((a >> shift) & 255) + (((b >> shift) & 255) - ((a >> shift) & 255)) * k);
  return (c(16) << 16) | (c(8) << 8) | c(0);
}
