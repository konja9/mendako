// 生き物の来訪と深海図鑑のルール（ねこあつめ型）。
// 30分ごとに抽選し、置いた飾りの好みに合う生き物ほど来やすい。閉じていた時間も計算する（最大12時間ぶん）。

import { CREATURE_BY_ID, CREATURES, VISITORS, type CreatureDef } from './data/creatures';
import { DECOR_BY_ID } from './data/decor';
import type { Fail } from './care';
import { tagsInTank } from './decor';
import { newUid, type GameState, type Visitor } from './state';

export const VISIT_INTERVAL_MS = 30 * 60_000;
export const MAX_VISITORS = 3;
export const MAX_ROLLS = 24;
export const STAY_MIN_MS = 2 * 3600_000;
export const STAY_MAX_MS = 8 * 3600_000;
const RARITY_WEIGHT = { 1: 6, 2: 3, 3: 1 } as const;
const GIFT_CHANCE = 0.35;

export type Rng = () => number;

/** 1回の抽選で誰かが来る確率。飾りが多いほど上がる */
export function visitChance(state: GameState): number {
  return Math.min(0.6, 0.25 + 0.025 * state.decor.placed.length);
}

/** 今来られる生き物と、その来やすさ */
export function candidates(state: GameState): { def: CreatureDef; weight: number }[] {
  const tags = tagsInTank(state);
  const present = new Set(state.visitors.map((v) => v.id));
  return VISITORS.filter((def) => !present.has(def.id) && (!def.requires || tags.has(def.requires))).map((def) => ({
    def,
    weight: RARITY_WEIGHT[def.rarity] * (1 + 2 * def.likes.filter((tag) => tags.has(tag)).length),
  }));
}

function pick<T extends { weight: number }>(list: T[], rng: Rng): T | null {
  const total = list.reduce((sum, c) => sum + c.weight, 0);
  let roll = rng() * total;
  for (const c of list) {
    roll -= c.weight;
    if (roll < 0) return c;
  }
  return list.at(-1) ?? null;
}

/** 生き物の動き方に合わせた、水槽の中の居場所 */
/** 泳ぐ生き物の高さの範囲（論理座標）。上層は画面が低いと描画側で縮める */
export const LAYER_Y = { upper: [-500, -330], middle: [-300, -160] } as const;

/** 泳ぐ生き物の居場所：好む層の中で、ほかの来訪者や浮かべた飾りから離れた場所を選ぶ */
function swimPosition(state: GameState, def: CreatureDef, rng: Rng) {
  const [top, bottom] = LAYER_Y[def.layer ?? 'middle'];
  const others = [
    ...state.visitors.map((v) => ({ x: v.x, y: v.y })),
    ...state.decor.placed.filter((p) => DECOR_BY_ID[p.id]?.place === 'float').map((p) => ({ x: p.x, y: p.y })),
  ];
  let best = { x: 200, y: (top + bottom) / 2 };
  let bestGap = -1;
  for (let i = 0; i < 6; i++) {
    const p = { x: 60 + rng() * 280, y: bottom + rng() * (top - bottom) };
    const gap = Math.min(Infinity, ...others.map((o) => Math.hypot(o.x - p.x, (o.y - p.y) * 1.5)));
    if (gap > bestGap) {
      best = p;
      bestGap = gap;
    }
    if (gap > 110) break;
  }
  return best;
}

function spawnPosition(state: GameState, def: CreatureDef, rng: Rng): { x: number; y: number } {
  const x = 50 + rng() * 300;
  if (def.motion === 'swim') return swimPosition(state, def, rng);
  if (def.motion === 'sit') {
    // 好きな飾りにくっつく（オオグチボヤは岩、ホネクイハナムシは骨）
    const spots = state.decor.placed.filter((p) => DECOR_BY_ID[p.id]?.place === 'floor' && DECOR_BY_ID[p.id].tags.some((t) => def.likes.includes(t)));
    const spot = spots[Math.floor(rng() * spots.length)];
    if (spot) {
      const d = DECOR_BY_ID[spot.id];
      return { x: spot.x + (rng() - 0.5) * d.w * 0.4, y: spot.y - d.h * 0.55 };
    }
  }
  return { x, y: -30 + rng() * 26 };
}

function spawn(state: GameState, at: number, rng: Rng): Visitor | null {
  const choice = pick(candidates(state), rng);
  if (!choice) return null;
  const { x, y } = spawnPosition(state, choice.def, rng);
  const visitor: Visitor = {
    uid: newUid(state, 'v'),
    id: choice.def.id,
    arrivedAt: at,
    leavesAt: at + STAY_MIN_MS + rng() * (STAY_MAX_MS - STAY_MIN_MS),
    x: Math.round(x),
    y: Math.round(y),
    met: false,
    gift: rng() < GIFT_CHANCE ? 3 + Math.floor(rng() * 8) : 0,
  };
  state.visitors.push(visitor);
  return visitor;
}

/**
 * 前回から経過した時間ぶん、来訪の抽選をする。帰る時間になった生き物は帰る。
 * 新しく来た生き物を返す。
 */
export function rollVisitors(state: GameState, now = Date.now(), rng: Rng = Math.random): Visitor[] {
  const arrivals: Visitor[] = [];
  const due = Math.floor((now - state.lastVisitRoll) / VISIT_INTERVAL_MS);
  const steps = Math.min(MAX_ROLLS, Math.max(0, due));
  // 長く閉じていた場合は、最後の12時間ぶんだけ抽選する
  const start = due > MAX_ROLLS ? now - MAX_ROLLS * VISIT_INTERVAL_MS : state.lastVisitRoll;
  for (let i = 1; i <= steps; i++) {
    const t = start + i * VISIT_INTERVAL_MS;
    state.visitors = state.visitors.filter((v) => v.leavesAt > t);
    // 図鑑がめんだこだけのうちは、最初の1匹が必ず来る
    const firstTime = Object.keys(state.zukan).length === 1 && state.visitors.length === 0;
    if (state.visitors.length < MAX_VISITORS && (firstTime || rng() < visitChance(state))) {
      const visitor = spawn(state, t, rng);
      if (visitor) arrivals.push(visitor);
    }
  }
  if (steps > 0) state.lastVisitRoll = start + steps * VISIT_INTERVAL_MS;
  state.visitors = state.visitors.filter((v) => v.leavesAt > now);
  return arrivals.filter((v) => v.leavesAt > now);
}

/** テスト用：今すぐ誰かを呼ぶ */
export function callVisitor(state: GameState, now = Date.now(), rng: Rng = Math.random) {
  if (state.visitors.length >= MAX_VISITORS) return { ok: false, reason: 'full' } as Fail<'full'>;
  const visitor = spawn(state, now, rng);
  if (!visitor) return { ok: false, reason: 'nobody' } as Fail<'nobody'>;
  return { ok: true as const, visitor };
}

/** 図鑑に記録する。初めてなら isNew */
export function registerMeet(state: GameState, id: string, now = Date.now()) {
  const entry = state.zukan[id];
  if (entry) {
    entry.count += 1;
    return { isNew: false };
  }
  state.zukan[id] = { count: 1, firstAt: now };
  return { isNew: true };
}

/** 水槽の生き物をタップして会う。おみやげがあれば受け取る */
export function meetVisitor(state: GameState, uid: string, now = Date.now()) {
  const visitor = state.visitors.find((v) => v.uid === uid);
  if (!visitor) return { ok: false, reason: 'gone' } as Fail<'gone'>;
  const def = CREATURE_BY_ID[visitor.id];
  let isNew = false;
  if (!visitor.met) {
    visitor.met = true;
    isNew = registerMeet(state, visitor.id, now).isNew;
  }
  const gift = visitor.gift;
  state.pearls += gift;
  visitor.gift = 0;
  return { ok: true as const, def, isNew, gift };
}

export const creatureName = (id: string) => CREATURE_BY_ID[id]?.name ?? '生き物';

/** 図鑑の発見数。探索でしか会えない生き物（Phase 3）はまだ数えない */
export function zukanProgress(state: GameState) {
  const listed = CREATURES.filter((c) => c.meet !== 'dive');
  return { found: listed.filter((c) => state.zukan[c.id]).length, total: listed.length };
}
