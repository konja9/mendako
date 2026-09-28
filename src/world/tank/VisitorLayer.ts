// 水槽に遊びに来た生き物。泳ぐ・歩く・くっつく、の3通りで動く。
// まだ会っていない生き物には「！」を出して、タップをうながす。

import { Container, Rectangle, Sprite, Text, type Texture } from 'pixi.js';
import { CREATURE_ART } from '../../art/creatures';
import { CREATURE_BY_ID, type CreatureDef } from '../../game/data/creatures';
import type { Visitor } from '../../game/state';
import { svgTexture } from '../textures';

interface Item {
  root: Container;
  sprite: Sprite;
  mark: Text;
  def: CreatureDef;
  base: { x: number; y: number };
  phase: number;
  lastX: number;
  facing: number;
  met: boolean;
}

export class VisitorLayer extends Container {
  private items = new Map<string, Item>();
  private textures = new Map<string, Promise<Texture>>();
  private time = 0;

  constructor(
    private resolution: number,
    private onTap: (uid: string, global: { x: number; y: number }) => void,
  ) {
    super();
    this.sortableChildren = true;
  }

  private texture(id: string) {
    let t = this.textures.get(id);
    if (!t) {
      const a = CREATURE_ART[id];
      t = svgTexture(a.svg, a.w, a.h, this.resolution);
      this.textures.set(id, t);
    }
    return t;
  }

  sync(visitors: Visitor[]) {
    const seen = new Set<string>();
    for (const v of visitors) {
      seen.add(v.uid);
      let item = this.items.get(v.uid);
      if (!item) {
        const def = CREATURE_BY_ID[v.id];
        const art = CREATURE_ART[v.id];
        const root = new Container();
        const sprite = new Sprite();
        const scale = def.displayW / art.w;
        sprite.anchor.set(0.5, def.motion === 'swim' ? 0.5 : 1);
        sprite.scale.set(scale);
        this.texture(v.id).then((t) => {
          if (!sprite.destroyed) sprite.texture = t;
        });
        const mark = new Text({
          text: '！',
          style: {
            fontFamily: '"Mochiy Pop One", "Zen Maru Gothic", sans-serif',
            fontSize: 22,
            fill: 0xffd66b,
            stroke: { color: 0x2b2352, width: 4 },
          },
        });
        mark.anchor.set(0.5, 1);
        const h = art.h * scale;
        mark.y = def.motion === 'swim' ? -h / 2 - 4 : -h - 4;
        root.addChild(sprite, mark);
        root.eventMode = 'static';
        root.cursor = 'pointer';
        const w = art.w * scale;
        const pad = Math.max(12, (60 - Math.min(w, h)) / 2);
        root.hitArea = new Rectangle(-w / 2 - pad, (def.motion === 'swim' ? -h / 2 : -h) - pad, w + pad * 2, h + pad * 2);
        root.on('pointertap', (e) => this.onTap(v.uid, { x: e.global.x, y: e.global.y }));
        this.addChild(root);
        item = { root, sprite, mark, def, base: { x: v.x, y: v.y }, phase: Math.random() * 10, lastX: v.x, facing: 1, met: v.met };
        this.items.set(v.uid, item);
      }
      item.met = v.met;
    }
    for (const [uid, item] of this.items) {
      if (seen.has(uid)) continue;
      item.root.destroy({ children: true });
      this.items.delete(uid);
    }
  }

  setInteractive(on: boolean) {
    for (const item of this.items.values()) item.root.eventMode = on ? 'static' : 'none';
  }

  update(dt: number) {
    this.time += dt;
    const t = this.time;
    for (const item of this.items.values()) {
      const { def, base, root, phase } = item;
      let x = base.x;
      let y = base.y;
      if (def.motion === 'swim') {
        x = base.x + Math.sin(t * 0.22 + phase) * 44;
        y = base.y + Math.sin(t * 0.9 + phase) * 6;
      } else if (def.motion === 'crawl') {
        x = base.x + Math.sin(t * 0.1 + phase) * 30;
        y = base.y;
      } else {
        root.scale.y = 1 + Math.sin(t * 1.4 + phase) * 0.025;
      }
      x = Math.max(24, Math.min(376, x));
      // 絵は左向き。右へ進むときは反転する
      if (Math.abs(x - item.lastX) > 0.01) item.facing = x > item.lastX ? -1 : 1;
      item.lastX = x;
      if (def.motion !== 'sit') item.sprite.scale.x = Math.abs(item.sprite.scale.x) * item.facing;
      root.position.set(x, y);
      root.zIndex = y;
      item.mark.visible = !item.met;
      item.mark.alpha = 0.7 + 0.3 * Math.sin(t * 4 + phase);
    }
  }
}
