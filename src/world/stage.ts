// Pixi の世界全体。背景・深海の粒・水槽（パンできる層）・ミニゲームを重ね、
// ゲームの状態（store）と演出（bus）を見て動く。

import { Application, Container, Graphics } from 'pixi.js';
import { get } from 'svelte/store';
import { finishCatch, game, petMendako } from '../app/actions';
import { bus, type ScreenPoint } from '../app/events';
import { bottomInset, catchHud, mode, sheet, tryOn, worldLink } from '../app/ui-state';
import { ITEM_BY_ID } from '../game/data/outfits';
import { CatchScene } from './catch/CatchScene';
import { Backdrop } from './tank/Backdrop';
import { Ocean } from './tank/Ocean';
import { TANK_W, TankScene } from './tank/TankScene';
import { deviceResolution } from './textures';

/** スマホ縦画面が基準。PC ではこの幅の縦長の画面を中央に置く */
export const COLUMN_MAX = 430;

export interface WorldOptions {
  host: HTMLElement;
  reducedMotion: boolean;
  /** 海底の線の画面上の y（下のボタンの少し上）。DOM を測って返す */
  measureFloor: () => number;
}

export class World {
  readonly app = new Application();
  private backdrop!: Backdrop;
  private ocean!: Ocean;
  private readonly pan = new Container();
  private tank!: TankScene;
  private readonly dim = new Graphics();
  private catchScene: CatchScene | null = null;
  private textureResolution = 2;

  private layout = { w: 0, h: 0, left: 0, scale: 1, floorY: 0 };
  private panY = 0;
  private panTarget = 0;
  private dimTarget = 0;

  constructor(private options: WorldOptions) {}

  async init() {
    const resolution = deviceResolution();
    await this.app.init({
      resizeTo: window,
      background: '#050f29',
      antialias: true,
      resolution,
      autoDensity: true,
      preference: 'webgl',
    });
    this.options.host.appendChild(this.app.canvas);

    // めんだこは水槽の中で最大 1.4 倍くらいに拡大されるので、その分細かく描いておく
    this.textureResolution = Math.min(3, resolution * 1.4);
    this.backdrop = new Backdrop();
    this.ocean = new Ocean(resolution, this.options.reducedMotion);
    this.tank = new TankScene(this.textureResolution, this.options.reducedMotion);
    this.pan.addChild(this.tank);
    this.dim.alpha = 0;
    this.app.stage.addChild(this.backdrop, this.ocean, this.pan, this.dim);

    this.tank.mendako.on('pointertap', (e) => petMendako({ x: e.global.x, y: e.global.y }));
    this.wire();
    this.resize();
    window.addEventListener('resize', () => this.resize());
    // 描画が遅い端末でも時間が遅れないよう 0.1 秒までは実時間で進める（それ以上はタブを離れた等とみなす）
    this.app.ticker.add((ticker) => this.update(Math.min(0.1, ticker.deltaMS / 1000)));
  }

  private wire() {
    const syncTank = () => {
      const id = get(tryOn);
      this.tank.sync(game.get(), id, id ? ITEM_BY_ID[id].slot : null);
    };
    game.subscribe((state) => {
      syncTank();
      this.dimTarget = state.sleeping ? 0.45 : 0;
    });
    tryOn.subscribe(syncTank);
    sheet.subscribe((kind) => {
      this.tank.focus = kind === 'dress';
      this.updatePanTarget();
    });
    bottomInset.subscribe(() => this.updatePanTarget());
    mode.subscribe((m) => (m === 'catch' ? this.startCatch() : this.endCatch()));

    const head = () => this.tank.headGlobal();
    const local = (p: ScreenPoint) => this.tank.toLocal(p);
    bus.on('express', ({ expression, ms }) => this.tank.mendako.express(expression, ms));
    bus.on('squish', () => this.tank.mendako.squish());
    bus.on('hearts', (point) => {
      const h = head();
      this.tank.fx.hearts(local(point ?? { x: h.x, y: h.y + 30 }));
    });
    bus.on('sparkle', (count) => {
      const h = head();
      this.tank.fx.sparkles(local({ x: h.x, y: h.y + 20 }), count);
    });
    bus.on('feed', ({ foodId, done }) => {
      const mouth = this.tank.mouthLocal();
      const from = local({ x: head().x, y: -50 });
      this.tank.fx.dropFood(foodId, { x: mouth.x, y: from.y }, mouth, done);
    });
    bus.on('say', () => {
      const h = head();
      this.ocean.bubblesAt(h.x, h.y - 10, 3);
    });
    worldLink.mendakoHead = () => (get(mode) === 'home' ? head() : null);
  }

  private updatePanTarget() {
    const inset = get(bottomInset);
    const kind = get(sheet);
    // ごはんときせかえのシートでは、めんだこが隠れないよう水槽を持ち上げる
    const raise = inset > 0 && (kind === 'food' || kind === 'dress');
    this.panTarget = raise ? Math.max(0, this.layout.floorY - (this.layout.h - inset - 14)) : 0;
  }

  resize() {
    if (!this.tank) return;
    const w = window.innerWidth;
    const h = window.innerHeight;
    const col = Math.min(w, COLUMN_MAX);
    const scale = col / TANK_W;
    const left = (w - col) / 2;
    const floorY = this.options.measureFloor();
    this.layout = { w, h, left, scale, floorY };

    this.backdrop.resize(w, h);
    this.ocean.resize(w, h);
    this.pan.scale.set(scale);
    this.pan.x = left;
    this.tank.drawFloor(-left / scale - 20, (w - left) / scale + 20, (h - floorY) / scale + 60);
    this.dim.clear().rect(0, 0, w, h).fill(0x020614);
    this.catchScene?.resize(w, h);
    this.updatePanTarget();
  }

  private startCatch() {
    if (this.catchScene || !this.tank) return;
    this.pan.visible = false;
    this.dim.visible = false;
    this.catchScene = new CatchScene(
      this.textureResolution / 1.4,
      game.get().equipped,
      {
        hud: (patch) => catchHud.update((hud) => ({ ...hud, ...patch })),
        finish: finishCatch,
      },
      this.options.reducedMotion,
    );
    this.catchScene.resize(this.layout.w, this.layout.h);
    this.app.stage.addChild(this.catchScene);
  }

  private endCatch() {
    if (!this.catchScene) return;
    this.catchScene.destroy();
    this.catchScene = null;
    this.pan.visible = true;
    this.dim.visible = true;
  }

  private update(dt: number) {
    this.backdrop.update(dt);
    this.ocean.update(dt);
    if (this.catchScene) {
      this.catchScene.update(dt);
      return;
    }
    this.panY += (this.panTarget - this.panY) * Math.min(1, dt * 6);
    this.pan.y = this.layout.floorY - this.panY;
    this.tank.update(dt);
    this.dim.alpha += (this.dimTarget - this.dim.alpha) * Math.min(1, dt * 2);
  }
}
