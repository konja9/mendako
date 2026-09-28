// 水槽（ホーム画面の海底）。座標は「横幅 TANK_W の論理座標、y=0 が海底の線（上がマイナス）」。
// 画面幅に合わせて親コンテナごと拡大縮小されるので、機種が変わっても配置は同じ。

import { Container, Graphics, Sprite, Text } from 'pixi.js';
import { expressionFor, MENDAKO_FOOT } from '../../art/mendako';
import { conditionOf, stageFor } from '../../game/care';
import type { GameState } from '../../game/state';
import { svgTexture } from '../textures';
import { Effects } from './Effects';
import { Mendako } from './Mendako';

export const TANK_W = 400;
/** めんだこの SVG（200）を水槽の中で何倍で表示するか */
const MENDAKO_BASE = 1.25;

const ROCK_SVG = `<svg viewBox="0 0 90 50" xmlns="http://www.w3.org/2000/svg"><path d="M6 48C2 34 12 20 28 18C36 6 58 6 66 18C80 20 90 34 86 48Z" fill="#17376a"/><path d="M26 24C34 14 52 12 60 20" stroke="#2b5190" stroke-width="3" fill="none" stroke-linecap="round"/></svg>`;
const SEAPEN_SVG = `<svg viewBox="0 0 40 96" xmlns="http://www.w3.org/2000/svg"><path d="M20 94Q18 56 21 8" stroke="#ffb7c9" stroke-width="3" fill="none" stroke-linecap="round"/><g fill="#ffb7c9" fill-opacity=".55"><ellipse cx="12" cy="22" rx="8" ry="3" transform="rotate(-25 12 22)"/><ellipse cx="29" cy="20" rx="8" ry="3" transform="rotate(25 29 20)"/><ellipse cx="11" cy="34" rx="9" ry="3.2" transform="rotate(-25 11 34)"/><ellipse cx="29" cy="32" rx="9" ry="3.2" transform="rotate(25 29 32)"/><ellipse cx="11" cy="46" rx="9" ry="3.2" transform="rotate(-25 11 46)"/><ellipse cx="29" cy="44" rx="9" ry="3.2" transform="rotate(25 29 44)"/><ellipse cx="12" cy="57" rx="7" ry="2.8" transform="rotate(-25 12 57)"/><ellipse cx="28" cy="56" rx="7" ry="2.8" transform="rotate(25 28 56)"/></g></svg>`;

export class TankScene extends Container {
  readonly floor = new Graphics();
  readonly props = new Container();
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
  private seaPen: Sprite | null = null;
  private time = 0;

  /** きせかえ中など、真ん中でじっとしてほしいとき */
  focus = false;

  constructor(
    resolution: number,
    private reducedMotion: boolean,
  ) {
    super();
    this.mendako = new Mendako(resolution);
    this.mendako.eventMode = 'static';
    this.mendako.cursor = 'pointer';
    this.fx = new Effects(resolution, reducedMotion);
    this.shadow.ellipse(0, 0, 48, 7).fill({ color: 0x020818, alpha: 0.45 });
    for (const [i, size] of [22, 17, 13].entries()) {
      const letter = new Text({
        text: i === 0 ? 'Z' : 'z',
        style: { fontFamily: '"Mochiy Pop One", "Zen Maru Gothic", sans-serif', fontSize: size, fill: 0xeef6ff },
      });
      letter.anchor.set(0.5);
      this.zzz.addChild(letter);
    }
    this.zzz.visible = false;
    this.addChild(this.floor, this.props, this.shadow, this.mendako, this.fx, this.zzz);
    this.addProps(resolution);
  }

  private async addProps(resolution: number) {
    const [rock, seaPen] = await Promise.all([svgTexture(ROCK_SVG, 90, 50, resolution), svgTexture(SEAPEN_SVG, 40, 96, resolution)]);
    const rockSprite = new Sprite(rock);
    rockSprite.anchor.set(0.5, 1);
    rockSprite.position.set(52, 2);
    const penSprite = new Sprite(seaPen);
    penSprite.anchor.set(0.5, 1);
    penSprite.position.set(356, -6);
    this.seaPen = penSprite;
    this.props.addChild(rockSprite, penSprite);
  }

  /** 海底の砂丘を、画面の左右いっぱい（xMin〜xMax）まで描く */
  drawFloor(xMin: number, xMax: number, bottom: number) {
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
    dune(-30, 6, 0, 0x11305c);
    dune(4, 5, 120, 0x0b2248);
  }

  /** ゲームの状態を見た目に反映する */
  sync(state: GameState, tryOn: string | null, tryOnSlot: string | null) {
    const look = { ...state.equipped };
    if (tryOn && tryOnSlot) (look as Record<string, string | null>)[tryOnSlot] = tryOn;
    this.mendako.setLook(look);
    this.mendako.setBaseExpression(expressionFor(conditionOf(state)));
    this.mendako.sleeping = state.sleeping;
    this.scaleTarget = stageFor(state.exp).scale;
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
      this.nextWander = 4.2 + Math.random() * 4;
      this.target = { x: 95 + Math.random() * (TANK_W - 190), y: -Math.random() * 60 - 4 };
    }

    // なめらかに目標へ（約1.5秒で追いつく）
    const k = Math.min(1, dt * 1.6);
    const vx = (this.target.x - this.pos.x) * k;
    this.pos.x += vx;
    this.pos.y += (this.target.y - this.pos.y) * k;
    this.tilt += (Math.max(-0.12, Math.min(0.12, vx * 0.05)) - this.tilt) * Math.min(1, dt * 4);
    this.scaleNow += (this.scaleTarget - this.scaleNow) * Math.min(1, dt * 3);

    const s = this.scaleNow * MENDAKO_BASE;
    this.mendako.position.set(this.pos.x, this.pos.y);
    this.mendako.scale.set(s);
    this.mendako.rotation = this.tilt;
    this.mendako.update(dt);

    // 影は海底に。浮いているほど小さく薄く
    const lift = -this.pos.y + (MENDAKO_FOOT.y - this.mendako.inner.position.y);
    this.shadow.position.set(this.pos.x, 10);
    this.shadow.scale.set(this.scaleNow * Math.max(0.55, 1 - lift / 160));
    this.shadow.alpha = Math.max(0.3, 1 - lift / 120);

    this.zzz.visible = this.mendako.sleeping;
    if (this.zzz.visible) {
      const head = this.toLocal(this.headGlobal());
      this.zzz.position.set(head.x + 36, head.y + 6);
      this.zzz.children.forEach((letter, i) => {
        const k = (((this.time + i) % 3) + 3) % 3 / 3;
        letter.position.set(k * 26, -k * 54);
        letter.alpha = k < 0.2 ? k / 0.2 : 1 - (k - 0.2) / 0.8;
      });
    }

    if (this.seaPen && !this.reducedMotion) this.seaPen.rotation = Math.sin((this.time / 6) * Math.PI) * 0.07;
    this.fx.update(dt);
  }
}
