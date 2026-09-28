// 水槽の模様替えのルール：飾りを買う・置く・動かす・反転する・しまう、海底を変える。

import { clampPlacement, DECOR_BY_ID, FLOOR_BY_ID, MAX_PLACED, type DecorTag } from './data/decor';
import type { Fail } from './care';
import { newUid, type GameState } from './state';

/** 持っているうち、まだ水槽に置いていない数 */
export function availableCount(state: GameState, id: string): number {
  const placed = state.decor.placed.filter((p) => p.id === id).length;
  return (state.decor.owned[id] ?? 0) - placed;
}

/** 水槽にある飾りと海底のタグ（来訪の好みの判定に使う） */
export function tagsInTank(state: GameState): Set<DecorTag> {
  const tags = new Set<DecorTag>(FLOOR_BY_ID[state.decor.floor]?.tags ?? []);
  for (const p of state.decor.placed) for (const tag of DECOR_BY_ID[p.id]?.tags ?? []) tags.add(tag);
  return tags;
}

export function buyDecor(state: GameState, id: string) {
  const def = DECOR_BY_ID[id];
  if (!def) return { ok: false, reason: 'unknown' } as Fail<'unknown'>;
  if (state.pearls < def.price) return { ok: false, reason: 'pearls', need: def.price - state.pearls } as Fail<'pearls'>;
  state.pearls -= def.price;
  state.decor.owned[id] = (state.decor.owned[id] ?? 0) + 1;
  return { ok: true as const, def };
}

/** 持っている飾りを水槽に置く。位置を省くと、見えやすい真ん中あたりに置く */
export function placeDecor(state: GameState, id: string, at?: { x: number; y: number }) {
  const def = DECOR_BY_ID[id];
  if (!def) return { ok: false, reason: 'unknown' } as Fail<'unknown'>;
  if (availableCount(state, id) <= 0) return { ok: false, reason: 'none-left' } as Fail<'none-left'>;
  if (state.decor.placed.length >= MAX_PLACED) return { ok: false, reason: 'full' } as Fail<'full'>;
  const spot = at ?? { x: 200 + (Math.random() - 0.5) * 120, y: def.place === 'floor' ? -12 : -250 - Math.random() * 230 };
  const uid = newUid(state, 'd');
  state.decor.placed.push({ uid, id, ...clampPlacement(def, spot.x, spot.y), flip: false });
  return { ok: true as const, uid, def };
}

export function moveDecor(state: GameState, uid: string, x: number, y: number) {
  const item = state.decor.placed.find((p) => p.uid === uid);
  if (!item) return { ok: false, reason: 'missing' } as Fail<'missing'>;
  Object.assign(item, clampPlacement(DECOR_BY_ID[item.id], x, y));
  return { ok: true as const };
}

export function flipDecor(state: GameState, uid: string) {
  const item = state.decor.placed.find((p) => p.uid === uid);
  if (!item) return { ok: false, reason: 'missing' } as Fail<'missing'>;
  item.flip = !item.flip;
  return { ok: true as const };
}

/** 水槽から持ち物へしまう */
export function storeDecor(state: GameState, uid: string) {
  const index = state.decor.placed.findIndex((p) => p.uid === uid);
  if (index < 0) return { ok: false, reason: 'missing' } as Fail<'missing'>;
  state.decor.placed.splice(index, 1);
  return { ok: true as const };
}

export function buyFloor(state: GameState, id: string) {
  const def = FLOOR_BY_ID[id];
  if (!def) return { ok: false, reason: 'unknown' } as Fail<'unknown'>;
  if (state.decor.floors.includes(id)) return { ok: false, reason: 'owned' } as Fail<'owned'>;
  if (state.pearls < def.price) return { ok: false, reason: 'pearls', need: def.price - state.pearls } as Fail<'pearls'>;
  state.pearls -= def.price;
  state.decor.floors.push(id);
  state.decor.floor = id;
  return { ok: true as const, def };
}

export function setFloor(state: GameState, id: string) {
  if (!state.decor.floors.includes(id)) return { ok: false, reason: 'not-owned' } as Fail<'not-owned'>;
  state.decor.floor = id;
  return { ok: true as const };
}
