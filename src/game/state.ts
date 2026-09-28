// ゲーム全体の状態の型・初期値・保存データの読み込み（移行）。

import type { StatId } from './data/care';
import { CREATURE_BY_ID } from './data/creatures';
import { clampPlacement, DECOR_BY_ID, FLOOR_BY_ID, MAX_PLACED } from './data/decor';
import { ITEM_BY_ID, SLOTS, type Equipped } from './data/outfits';

export const SAVE_VERSION = 2;
export const STAT_MAX = 100;
export const NAME_MAX = 10;

/** 水槽に置いた飾り（x, y は水槽の論理座標） */
export interface PlacedDecor {
  uid: string;
  id: string;
  x: number;
  y: number;
  flip: boolean;
}

/** 水槽に遊びに来ている生き物 */
export interface Visitor {
  uid: string;
  id: string;
  arrivedAt: number;
  leavesAt: number;
  x: number;
  y: number;
  /** タップして会えたか */
  met: boolean;
  /** 置いていくおみやげ（真珠の数。0 ならなし） */
  gift: number;
}

export interface ZukanEntry {
  count: number;
  firstAt: number;
}

export interface GameState {
  version: typeof SAVE_VERSION;
  species: 'mendako';
  name: string;
  bornAt: number;
  lastTick: number;
  stats: Record<StatId, number>;
  exp: number;
  pearls: number;
  owned: string[];
  equipped: Equipped;
  sleeping: boolean;
  /** 直近1分に なでた時刻（連打の判定用。保存しない） */
  recentPets: number[];
  bestScore: number;
  counts: { fed: number; petted: number; played: number };
  decor: {
    /** 持っている飾りの数（同じものを複数持てる） */
    owned: Record<string, number>;
    placed: PlacedDecor[];
    floor: string;
    floors: string[];
  };
  visitors: Visitor[];
  /** 来訪の抽選をどこまで済ませたか */
  lastVisitRoll: number;
  zukan: Record<string, ZukanEntry>;
  /** 飾りや来訪者に付ける通し番号 */
  nextUid: number;
}

export function createState(now = Date.now()): GameState {
  return {
    version: SAVE_VERSION,
    species: 'mendako',
    name: 'めんちゃん',
    bornAt: now,
    lastTick: now,
    stats: { hunger: 70, mood: 70, energy: 80 },
    exp: 0,
    pearls: 20,
    owned: ['ribbon', 'color-coral'],
    equipped: { head: 'ribbon', face: null, neck: null, color: 'color-coral' },
    sleeping: false,
    recentPets: [],
    bestScore: 0,
    counts: { fed: 0, petted: 0, played: 0 },
    decor: {
      owned: { rock: 1, 'sea-pen': 1 },
      placed: [
        { uid: 'd1', id: 'rock', x: 52, y: 2, flip: false },
        { uid: 'd2', id: 'sea-pen', x: 356, y: -6, flip: false },
      ],
      floor: 'sand',
      floors: ['sand'],
    },
    visitors: [],
    lastVisitRoll: now,
    zukan: { mendako: { count: 1, firstAt: now } },
    nextUid: 3,
  };
}

export function clamp(value: number): number {
  return Math.max(0, Math.min(STAT_MAX, value));
}

const num = (value: unknown, fallback: number): number =>
  typeof value === 'number' && Number.isFinite(value) ? value : fallback;

type Saved = Partial<Record<keyof GameState, unknown>> & { version?: unknown };

/**
 * 保存データを現在の形に合わせる。v1（最初のプロトタイプ）の進行も引き継ぐ。
 * 壊れた値・未知のアイテムは既定値に戻す。足りない項目は既定値で埋める。
 */
export function normalizeState(input: unknown, now = Date.now()): GameState {
  const base = createState(now);
  if (!input || typeof input !== 'object') return base;
  const saved = input as Saved;
  if (saved.version !== 1 && saved.version !== SAVE_VERSION) return base;

  const state = base;
  const stats = (saved.stats ?? {}) as Record<string, unknown>;
  const equipped = (saved.equipped ?? {}) as Record<string, unknown>;
  const counts = (saved.counts ?? {}) as Record<string, unknown>;

  state.name = typeof saved.name === 'string' && saved.name.trim() ? saved.name.trim().slice(0, NAME_MAX) : base.name;
  state.bornAt = num(saved.bornAt, now);
  state.lastTick = Math.min(num(saved.lastTick, now), now);
  for (const key of Object.keys(base.stats) as StatId[]) {
    state.stats[key] = clamp(num(stats[key], base.stats[key]));
  }
  state.exp = Math.max(0, num(saved.exp, 0));
  state.pearls = Math.max(0, Math.floor(num(saved.pearls, base.pearls)));

  const owned = Array.isArray(saved.owned) ? saved.owned.filter((id): id is string => typeof id === 'string' && !!ITEM_BY_ID[id]) : [];
  state.owned = [...new Set([...base.owned, ...owned])];
  for (const slot of SLOTS) {
    const id = equipped[slot.id];
    if (id === null && slot.removable) state.equipped[slot.id] = null;
    if (typeof id === 'string' && ITEM_BY_ID[id]?.slot === slot.id && state.owned.includes(id)) state.equipped[slot.id] = id;
  }

  state.sleeping = saved.sleeping === true;
  state.bestScore = Math.max(0, num(saved.bestScore, 0));
  for (const key of Object.keys(base.counts) as (keyof GameState['counts'])[]) {
    state.counts[key] = Math.max(0, num(counts[key], 0));
  }

  // ---- 模様替え・来訪・図鑑（Phase 2 で追加。古いデータには無いので既定値のまま） ----
  const obj = (value: unknown) => (value && typeof value === 'object' ? (value as Record<string, unknown>) : null);
  const decor = obj(saved.decor);
  if (decor) {
    const ownedDecor: Record<string, number> = {};
    for (const [id, count] of Object.entries(obj(decor.owned) ?? {})) {
      if (DECOR_BY_ID[id]) ownedDecor[id] = Math.max(0, Math.floor(num(count, 0)));
    }
    const used: Record<string, number> = {};
    const placed: PlacedDecor[] = [];
    for (const raw of Array.isArray(decor.placed) ? decor.placed : []) {
      const item = obj(raw);
      const def = item && typeof item.id === 'string' ? DECOR_BY_ID[item.id] : undefined;
      if (!item || !def || typeof item.uid !== 'string' || placed.length >= MAX_PLACED) continue;
      if ((used[def.id] ?? 0) >= (ownedDecor[def.id] ?? 0)) continue;
      used[def.id] = (used[def.id] ?? 0) + 1;
      placed.push({ uid: item.uid, id: def.id, ...clampPlacement(def, num(item.x, 200), num(item.y, 0)), flip: item.flip === true });
    }
    const floors = Array.isArray(decor.floors) ? decor.floors.filter((id): id is string => typeof id === 'string' && !!FLOOR_BY_ID[id]) : [];
    state.decor.owned = ownedDecor;
    state.decor.placed = placed;
    state.decor.floors = [...new Set(['sand', ...floors])];
    state.decor.floor = typeof decor.floor === 'string' && state.decor.floors.includes(decor.floor) ? decor.floor : 'sand';
  }

  if (Array.isArray(saved.visitors)) {
    state.visitors = saved.visitors.flatMap((raw) => {
      const v = obj(raw);
      if (!v || typeof v.uid !== 'string' || typeof v.id !== 'string' || CREATURE_BY_ID[v.id]?.meet !== 'visit') return [];
      return [{
        uid: v.uid,
        id: v.id,
        arrivedAt: num(v.arrivedAt, now),
        leavesAt: num(v.leavesAt, now),
        x: num(v.x, 200),
        y: num(v.y, -120),
        met: v.met === true,
        gift: Math.max(0, Math.floor(num(v.gift, 0))),
      }];
    });
  }
  state.lastVisitRoll = Math.min(num(saved.lastVisitRoll, now), now);

  for (const [id, raw] of Object.entries(obj(saved.zukan) ?? {})) {
    const entry = obj(raw);
    if (!entry || !CREATURE_BY_ID[id]) continue;
    state.zukan[id] = { count: Math.max(1, Math.floor(num(entry.count, 1))), firstAt: num(entry.firstAt, now) };
  }
  if (!state.zukan.mendako) state.zukan.mendako = { count: 1, firstAt: state.bornAt };

  // 通し番号は、使われている番号より大きくしておく
  const maxUid = Math.max(
    0,
    ...[...state.decor.placed, ...state.visitors].map((item) => Number(item.uid.slice(1)) || 0),
  );
  state.nextUid = Math.max(maxUid + 1, Math.floor(num(saved.nextUid, 0)));
  return state;
}

/** 新しい通し番号（飾りは d、来訪者は v で始まる） */
export function newUid(state: GameState, prefix: 'd' | 'v'): string {
  return `${prefix}${state.nextUid++}`;
}

/** 保存用。連打判定用の一時データは含めない。 */
export function serialize(state: GameState): string {
  return JSON.stringify({ ...state, recentPets: undefined });
}
