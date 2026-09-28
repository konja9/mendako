// 水槽（ホーム画面の海底）。座標は「横幅 TANK_W の論理座標、y=0 が海底の線（上がマイナス）」。
// 画面幅に合わせて親コンテナごと拡大縮小されるので、機種が変わっても配置は同じ。
// 重なり順：海底 → 飾り → 遊びに来た生き物 → めんだこ → 演出

import { Container, Graphics, Rectangle, Text } from 'pixi.js';
import { expressionFor, MENDAKO_FOOT } from '../../art/mendako';
import { conditionOf, stageFor } from '../../game/care';
import { FLOOR_BY_ID } from '../../game/data/decor';
import type { GameState } from '../../game/state';
import { DecorLayer } from './DecorLayer';
import { Effects } from './Effects';
import { Mendako } from './Mendako';
import { VisitorLayer } from './VisitorLayer';

export const TANK_W = 400;
/** めんだこの SVG（200）を水槽の中で何倍で表示するか */
const MENDAKO_BASE = 1.25;

export interface TankCallbacks {
  selectDecor(uid: string | null): void;
  commitDecor(uid: string, x: number, y: number): void;
  meetVisitor(uid: string, global: { x: number; y: number }): void;
  bubble(global: { x: number; y: number }): void;
}

export class TankScene extends Container {
  readonly floor = new Graphics();
  readonly specks = new Graphics();
  /** 模様替え中に何もないところを押したら、選択をはずすための面 */
  private readonly backdropHit = new Container();
  readonly decor: DecorLayer;
  readonly visitors: VisitorLayer;
  readonly shadow = new Graphics();
  readonly mendako: Mendako;
  readonly fx: Effects;
  /** 寝ているときの Zzz */
  private readonly zzz = new Container();

  private pos = { x: TANK_W / 2, y: -10 };
  private target = { x: TANK_W / 2, y: -10 };
  private nextWander = 2;
  private tilt = 0;
  private scaleNow = 0.8;
  private scaleTarget = 0.8;
  private time = 0;
  private floorId = '';
  private floorExtent = { xMin: 0, xMax: TANK_W, bottom: 200 };
  private editing = false;
  /** 海底の線から画面の上（ステータス欄の下）までの高さ（論理座標） */
  private waterH = 540;

  /** きせかえ中など、真ん中でじっとしてほしいとき */
  focus = false;

  constructor(
    resolution: number,
    private reducedMotion: boolean,
    cb: TankCallbacks,
  ) {
    super();
    this.mendako = new Mendako(resolution);
    this.mendako.eventMode = 'static';
    this.mendako.cursor = 'pointer';
    this.fx = new Effects(resolution, reducedMotion);
    this.decor = new DecorLayer(resolution, { select: cb.selectDecor, commit: cb.commitDecor, bubble: cb.bubble });
    this.visitors = new VisitorLayer(resolution, cb.meetVisitor);
    this.shadow.ellipse(0, 0, 48, 7).fill({ color: 0x020818, alpha: 0.45 });

    this.backdropHit.hitArea = new Rectangle(-2000, -2000, 4400, 4400);
    this.backdropHit.eventMode = 'none';
    this.backdropHit.on('pointertap', () => cb.selectDecor(null));

    for (const [i, size] of [22, 17, 13].entries()) {
      const letter = new Text({
        text: i === 0 ? 'Z' : 'z',
        style: { fontFamily: '"Mochiy Pop One", "Zen Maru Gothic", sans-serif', fontSize: size, fill: 0xeef6ff },
      });
      letter.anchor.set(0.5);
      this.zzz.addChild(letter);
    }
    this.zzz.visible = false;
    this.addChild(this.floor, this.specks, this.backdropHit, this.decor, this.visitors, this.shadow, this.mendako, this.fx, this.zzz);
  }

  /** 海底の砂丘を、画面の左右いっぱい（xMin〜xMax）まで描く */
  drawFloor(xMin: number, xMax: number, bottom: number) {
    this.floorExtent = { xMin, xMax, bottom };
    const colors = FLOOR_BY_ID[this.floorId]?.colors ?? FLOOR_BY_ID.sand.colors;
    const g = this.floor.clear();
    const dune = (top: number, amp: number, phase: number, color: number) => {
      g.moveTo(xMin, top);
      const step = 100;
      for (let x = xMin; x < xMax; x += step) {
        const y = top + Math.sin((x + phase) / 70) * amp;
        g.quadraticCurveTo(x + step / 2, y - amp, x + step, top + Math.sin((x + step + phase) / 70) * amp);
      }
      g.lineTo(xMax, bottom).lineTo(xMin, bottom).closePath().fill(color);
    };
    dune(-40, 6, 0, colors.back);
    dune(2, 5, 120, colors.front);

    // 海底の小石（海底の種類で色が変わる）。毎回同じ並びになるよう固定の式で置く
    const s = this.specks.clear();
    for (let i = 0; i < 26; i++) {
      const x = xMin + ((i * 97) % 1000) / 1000 * (xMax - xMin);
      const y = -26 + ((i * 53) % 60);
      s.ellipse(x, y, 3 + (i % 3), 1.6 + (i % 2)).fill({ color: colors.speck, alpha: 0.55 });
    }
  }

  /** ゲームの状態を見た目に反映する */
  sync(state: GameState, tryOn: string | null, tryOnSlot: string | null) {
    const look = { ...state.equipped };
    if (tryOn && tryOnSlot) (look as Record<string, string | null>)[tryOnSlot] = tryOn;
    this.mendako.setLook(look);
    this.mendako.setBaseExpression(expressionFor(conditionOf(state)));
    this.mendako.sleeping = state.sleeping;
    this.scaleTarget = stageFor(state.exp).scale;
    this.decor.sync(state.decor.placed);
    this.visitors.sync(state.visitors);
    if (state.decor.floor !== this.floorId) {
      this.floorId = state.decor.floor;
      const { xMin, xMax, bottom } = this.floorExtent;
      this.drawFloor(xMin, xMax, bottom);
    }
  }

  /** 使える水の高さを受け取り、上の層の生き物・飾りが画面からはみ出ないよう縮める */
  setWater(height: number) {
    this.waterH = Math.max(240, height);
    const vScale = Math.min(1, (this.waterH - 50) / 520);
    this.decor.vScale = vScale;
    this.visitors.vScale = vScale;
  }

  /**
   * めんだこの次の行き先。海底でひと休み・中層・上層から選び、
   * 来ている生き物や浮かべた飾りから離れた場所をえらぶ。
   */
  private pickWanderTarget(forceWater = false): { x: number; y: number; stay: number } {
    // めんだこの頭〜リボンぶんの高さを空けておく
    const top = -Math.max(200, this.waterH - 175);
    const roll = forceWater ? 0.3 + Math.random() * 0.7 : Math.random();
    const layer = roll < 0.3 ? 'floor' : roll < 0.7 ? 'middle' : 'upper';
    const range: [number, number] =
      layer === 'floor' ? [-16, 0] : layer === 'middle' ? [top * 0.6, -100] : [top, top * 0.72];
    const others = [...this.visitors.positions(), ...this.decor.floatPositions()];
    let best = { x: TANK_W / 2, y: range[1] };
    let bestGap = -1;
    for (let i = 0; i < 5; i++) {
      const p = { x: 95 + Math.random() * (TANK_W - 190), y: range[0] + Math.random() * (range[1] - range[0]) };
      // めんだこの体の中心（足もとの少し上）で比べる
      const gap = Math.min(Infinity, ...others.map((o) => Math.hypot(o.x - p.x, o.y - (p.y - 70))));
      if (gap > bestGap) {
        best = p;
        bestGap = gap;
      }
      if (gap > 120) break;
    }
    // 海底が生き物でいっぱいなら、休むのはやめて泳ぎに行く
    if (layer === 'floor' && bestGap < 90) return this.pickWanderTarget(true);
    return { ...best, stay: layer === 'floor' ? 7 + Math.random() * 5 : 4.5 + Math.random() * 4 };
  }

  /** 模様替え中は飾りを動かせるようにし、めんだこと生き物は薄くして押せなくする */
  setEditing(on: boolean) {
    this.editing = on;
    this.decor.setEditing(on);
    this.visitors.setInteractive(!on);
    this.backdropHit.eventMode = on ? 'static' : 'none';
    this.mendako.eventMode = on ? 'none' : 'static';
  }

  /** めんだこの頭のてっぺんの画面座標 */
  headGlobal() {
    return this.mendako.inner.toGlobal({ x: 100, y: 44 });
  }

  /** めんだこの口もと（水槽座標） */
  mouthLocal() {
    return this.toLocal(this.mendako.inner.toGlobal({ x: 100, y: 112 }));
  }

  update(dt: number) {
    this.time += dt;
    this.nextWander -= dt;
    if (this.mendako.sleeping) {
      this.target = { x: this.pos.x, y: 6 };
    } else if (this.focus) {
      this.target = { x: TANK_W / 2, y: -8 };
    } else if (this.nextWander <= 0 && !this.reducedMotion) {
      const next = this.pickWanderTarget();
      this.nextWander = next.stay;
      this.target = { x: next.x, y: next.y };
    }

    // なめらかに目標へ。上下の移動は横よりゆっくり、ふわっと
    const k = Math.min(1, dt * 1.6);
    const vx = (this.target.x - this.pos.x) * k;
    this.pos.x += vx;
    this.pos.y += (this.target.y - this.pos.y) * Math.min(1, dt * 0.9);
    this.tilt += (Math.max(-0.12, Math.min(0.12, vx * 0.05)) - this.tilt) * Math.min(1, dt * 4);
    this.scaleNow += (this.scaleTarget - this.scaleNow) * Math.min(1, dt * 3);

    const s = this.scaleNow * MENDAKO_BASE;
    this.mendako.position.set(this.pos.x, this.pos.y);
    this.mendako.scale.set(s);
    this.mendako.rotation = this.tilt;
    this.mendako.update(dt);

    // 模様替え中は、めんだこと生き物を薄くして飾りを見やすくする
    const fade = this.editing ? 0.3 : 1;
    this.mendako.alpha += (fade - this.mendako.alpha) * Math.min(1, dt * 6);
    this.visitors.alpha = this.mendako.alpha;
    this.shadow.alpha = this.mendako.alpha;

    // 影は海底に。浮いているほど小さく薄く
    const lift = -this.pos.y + (MENDAKO_FOOT.y - this.mendako.inner.position.y);
    this.shadow.position.set(this.pos.x, 10);
    this.shadow.scale.set(this.scaleNow * Math.max(0.35, 1 - lift / 450));
    this.shadow.alpha *= Math.max(0.12, 1 - lift / 320);

    this.zzz.visible = this.mendako.sleeping;
    if (this.zzz.visible) {
      const head = this.toLocal(this.headGlobal());
      this.zzz.position.set(head.x + 36, head.y + 6);
      this.zzz.children.forEach((letter, i) => {
        const t = ((this.time + i) % 3) / 3;
        letter.position.set(t * 26, -t * 54);
        letter.alpha = t < 0.2 ? t / 0.2 : 1 - (t - 0.2) / 0.8;
      });
    }

    this.decor.update(this.reducedMotion ? 0 : dt);
    this.visitors.update(this.reducedMotion ? 0 : dt);
    this.fx.update(dt);
  }
}
