// 水槽の飾り。表示と、模様替え中の「選ぶ・指で動かす」を受け持つ。
// 動かしている間は描画だけ更新し、指を離したときに位置を保存する（毎フレーム保存しない）。

import { Container, Graphics, Rectangle, Sprite, type FederatedPointerEvent, type Texture } from 'pixi.js';
import { DECOR_ART } from '../../art/decor';
import { clampPlacement, DECOR_BY_ID, type DecorDef } from '../../game/data/decor';
import type { PlacedDecor } from '../../game/state';
import { svgTexture } from '../textures';

interface Item {
  sprite: Sprite;
  def: DecorDef;
  base: { x: number; y: number };
  flip: boolean;
  phase: number;
}

export interface DecorCallbacks {
  select(uid: string | null): void;
  commit(uid: string, x: number, y: number): void;
  /** 熱水チムニーから泡を出す（画面座標） */
  bubble(global: { x: number; y: number }): void;
}

/** スマホで指に隠れないよう、ドラッグ中は少し上に持ち上げる（論理座標） */
const TOUCH_LIFT = 26;

export class DecorLayer extends Container {
  private items = new Map<string, Item>();
  private textures = new Map<string, Promise<Texture>>();
  private outline = new Graphics();
  private drag: { uid: string; dx: number; dy: number; lift: number } | null = null;
  private selected: string | null = null;
  private bubbleTimer = 0;
  private time = 0;
  editing = false;
  /** 画面が低いとき、浮かべる飾りの高さを縮める倍率（1 = そのまま） */
  vScale = 1;

  constructor(
    private resolution: number,
    private cb: DecorCallbacks,
  ) {
    super();
    this.sortableChildren = true;
    this.outline.zIndex = 100000;
    this.addChild(this.outline);
    this.eventMode = 'static';
    this.on('globalpointermove', this.onMove);
    this.on('pointerup', this.onUp);
    this.on('pointerupoutside', this.onUp);
  }

  private texture(id: string) {
    let t = this.textures.get(id);
    if (!t) {
      const def = DECOR_BY_ID[id];
      t = svgTexture(DECOR_ART[id], def.w, def.h, this.resolution);
      this.textures.set(id, t);
    }
    return t;
  }

  /** ゲームの状態の配置に合わせる（ドラッグ中の飾りは指の位置を優先） */
  sync(placed: PlacedDecor[]) {
    const seen = new Set<string>();
    for (const p of placed) {
      seen.add(p.uid);
      let item = this.items.get(p.uid);
      if (!item) {
        const def = DECOR_BY_ID[p.id];
        const sprite = new Sprite();
        sprite.anchor.set(0.5, def.place === 'floor' ? 1 : 0.5);
        sprite.on('pointerdown', (e) => this.onDown(p.uid, e));
        sprite.cursor = 'grab';
        this.texture(p.id).then((t) => {
          if (!sprite.destroyed) sprite.texture = t;
        });
        this.addChild(sprite);
        item = { sprite, def, base: { x: p.x, y: p.y }, flip: p.flip, phase: Math.random() * 10 };
        this.items.set(p.uid, item);
      }
      if (this.drag?.uid !== p.uid) item.base = { x: p.x, y: p.y };
      item.flip = p.flip;
      this.applyInteractivity(item);
    }
    for (const [uid, item] of this.items) {
      if (seen.has(uid)) continue;
      item.sprite.destroy();
      this.items.delete(uid);
      if (this.selected === uid) this.setSelected(null);
    }
  }

  private applyInteractivity(item: Item) {
    item.sprite.eventMode = this.editing ? 'static' : 'none';
    const { w, h } = item.def;
    // 小さい飾りも指で押しやすいよう、当たり判定を少し広げる
    const padX = Math.max(10, (56 - w) / 2);
    const padY = Math.max(10, (56 - h) / 2);
    item.sprite.hitArea = new Rectangle(-w / 2 - padX, (item.def.place === 'floor' ? -h : -h / 2) - padY, w + padX * 2, h + padY * 2);
  }

  setEditing(on: boolean) {
    this.editing = on;
    for (const item of this.items.values()) this.applyInteractivity(item);
    if (!on) {
      this.drag = null;
      this.setSelected(null);
    }
  }

  setSelected(uid: string | null) {
    this.selected = uid;
  }

  /** 飾りの画面上の範囲 */
  rectOf(uid: string) {
    const item = this.items.get(uid);
    if (!item || !item.sprite.texture || item.sprite.texture.width <= 1) return null;
    return item.sprite.getBounds();
  }

  private onDown(uid: string, e: FederatedPointerEvent) {
    if (!this.editing) return;
    e.stopPropagation();
    const item = this.items.get(uid)!;
    const local = this.toLocal(e.global);
    this.drag = { uid, dx: local.x - item.base.x, dy: local.y - this.displayY(item), lift: 0 };
    if (e.pointerType === 'touch') this.drag.lift = TOUCH_LIFT;
    this.cb.select(uid);
  }

  private onMove = (e: FederatedPointerEvent) => {
    if (!this.drag) return;
    const item = this.items.get(this.drag.uid);
    if (!item) return;
    const local = this.toLocal(e.global);
    const y = local.y - this.drag.dy - this.drag.lift;
    item.base = clampPlacement(item.def, local.x - this.drag.dx, item.def.place === 'float' ? y / this.vScale : y);
  };

  private onUp = () => {
    if (!this.drag) return;
    const item = this.items.get(this.drag.uid);
    if (item) this.cb.commit(this.drag.uid, item.base.x, item.base.y);
    this.drag = null;
  };

  private displayY(item: Item) {
    return item.def.place === 'float' ? item.base.y * this.vScale : item.base.y;
  }

  /** 浮かべた飾りの表示位置（めんだこの行き先えらびで避けるため） */
  floatPositions() {
    return [...this.items.values()].filter((i) => i.def.place === 'float').map((i) => ({ x: i.base.x, y: this.displayY(i) }));
  }

  update(dt: number) {
    this.time += dt;
    const t = this.time;
    this.outline.clear();
    for (const [uid, item] of this.items) {
      const { sprite, def, base } = item;
      const x = base.x;
      let y = this.displayY(item);
      let rotation = 0;
      // 浮かべる飾りはゆらゆら、ウミエラやウミユリはそよそよ
      if (def.place === 'float') {
        y += Math.sin(t * 1.3 + item.phase) * 4;
        rotation = Math.sin(t * 0.9 + item.phase) * 0.05;
      } else if (def.id === 'sea-pen' || def.id === 'sea-lily') {
        rotation = Math.sin((t / 6) * Math.PI + item.phase) * 0.06;
      }
      sprite.position.set(x, y);
      sprite.rotation = rotation;
      sprite.scale.x = item.flip ? -1 : 1;
      sprite.zIndex = def.place === 'floor' ? y : -1000 + y;
      if (def.id === 'lantern-lamp') sprite.alpha = 0.85 + 0.15 * Math.sin(t * 2.4 + item.phase);

      if (this.editing && uid === this.selected) {
        const top = def.place === 'floor' ? y - def.h : y - def.h / 2;
        this.outline
          .roundRect(x - def.w / 2 - 6, top - 6, def.w + 12, def.h + 12, 12)
          .stroke({ color: 0x8fe3ff, width: 2.5, alpha: 0.9 });
      }
    }

    // 熱水チムニーからときどき泡
    this.bubbleTimer -= dt;
    if (this.bubbleTimer <= 0) {
      this.bubbleTimer = 1.2 + Math.random() * 1.5;
      for (const item of this.items.values()) {
        if (item.def.id !== 'chimney') continue;
        this.cb.bubble(this.toGlobal({ x: item.base.x, y: item.base.y - item.def.h + 6 }));
      }
    }
  }
}
