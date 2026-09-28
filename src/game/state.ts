// ゲーム全体の状態の型・初期値・保存データの読み込み（移行）。

import type { StatId } from './data/care';
import { ITEM_BY_ID, SLOTS, type Equipped } from './data/outfits';

export const SAVE_VERSION = 2;
export const STAT_MAX = 100;
export const NAME_MAX = 10;

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
  return state;
}

/** 保存用。連打判定用の一時データは含めない。 */
export function serialize(state: GameState): string {
  return JSON.stringify({ ...state, recentPets: undefined });
}
