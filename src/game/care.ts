// お世話・成長・きせかえ・ミニゲーム報酬のルール。
// 各操作は state をその場で書き換え、結果オブジェクトを返す（DOM や描画には触れない）。

import { FOOD_BY_ID, STAGES, STAGE_UP_BONUS, type Food, type FoodId, type Stage } from './data/care';
import { ITEM_BY_ID, SLOTS, type OutfitItem } from './data/outfits';
import { clamp, NAME_MAX, STAT_MAX, type GameState } from './state';

// 1分あたりの減り方。おなかは満タンから約3時間で空になる。
export const DECAY_PER_MIN = { hunger: 0.55, mood: 0.4, energy: 0.3 };
export const SLEEP_ENERGY_PER_MIN = 2.5;
export const MAX_OFFLINE_MIN = 60 * 12;
export const PLAY_ENERGY_COST = 15;
export const PET_LIMIT_PER_MIN = 6;
export const LOW_STAT = 25;

export type Condition = 'sleep' | 'hungry' | 'tired' | 'sad' | 'great' | 'normal';

export interface StageInfo extends Stage {
  index: number;
  next: Stage | null;
  /** 次の段階までの進み具合（0〜1） */
  progress: number;
}

export type Fail<R extends string> = { ok: false; reason: R; need?: number };

export function stageFor(exp: number): StageInfo {
  let index = 0;
  STAGES.forEach((stage, i) => {
    if (exp >= stage.minExp) index = i;
  });
  const stage = STAGES[index];
  const next = STAGES[index + 1] ?? null;
  const progress = next ? (exp - stage.minExp) / (next.minExp - stage.minExp) : 1;
  return { ...stage, index, next, progress };
}

// 見た目と台詞を決めるための「いまの調子」。
export function conditionOf(state: GameState): Condition {
  if (state.sleeping) return 'sleep';
  const { hunger, mood, energy } = state.stats;
  if (hunger < LOW_STAT) return 'hungry';
  if (energy < LOW_STAT) return 'tired';
  if (mood < LOW_STAT) return 'sad';
  if (hunger > 70 && mood > 70) return 'great';
  return 'normal';
}

// 経過時間ぶんステータスを進める。放置しても 0 で止まり、いなくなったりはしない。
export function tick(state: GameState, now = Date.now()) {
  const minutes = Math.min(Math.max(0, (now - state.lastTick) / 60000), MAX_OFFLINE_MIN);
  state.lastTick = now;
  if (minutes === 0) return { minutes, wokeUp: false };

  const s = state.stats;
  let wokeUp = false;
  if (state.sleeping) {
    s.hunger = clamp(s.hunger - DECAY_PER_MIN.hunger * 0.5 * minutes);
    s.energy = clamp(s.energy + SLEEP_ENERGY_PER_MIN * minutes);
    if (s.energy >= STAT_MAX) {
      state.sleeping = false;
      wokeUp = true;
    }
  } else {
    s.hunger = clamp(s.hunger - DECAY_PER_MIN.hunger * minutes);
    s.mood = clamp(s.mood - DECAY_PER_MIN.mood * minutes);
    s.energy = clamp(s.energy - DECAY_PER_MIN.energy * minutes);
  }
  return { minutes, wokeUp };
}

/**
 * なかよし度を増やす。調子が悪いと伸びが半分になる。
 * 成長段階が上がったら、その段階を返す（お祝いの真珠も加算）。
 */
export function gainExp(state: GameState, amount: number, { ignoreCondition = false } = {}): StageInfo | null {
  const before = stageFor(state.exp);
  const low = !ignoreCondition && Object.values(state.stats).some((v) => v < LOW_STAT);
  state.exp += low ? amount / 2 : amount;
  const after = stageFor(state.exp);
  if (after.index > before.index) {
    state.pearls += STAGE_UP_BONUS * (after.index - before.index);
    return after;
  }
  return null;
}

export function feed(state: GameState, foodId: FoodId) {
  const food: Food | undefined = FOOD_BY_ID[foodId];
  if (!food) return { ok: false, reason: 'unknown' } as Fail<'unknown'>;
  if (state.sleeping) return { ok: false, reason: 'sleeping' } as Fail<'sleeping'>;
  if (state.stats.hunger >= 95) return { ok: false, reason: 'full' } as Fail<'full'>;
  if (state.pearls < food.price) return { ok: false, reason: 'pearls', need: food.price - state.pearls } as Fail<'pearls'>;

  state.pearls -= food.price;
  state.stats.hunger = clamp(state.stats.hunger + food.hunger);
  state.stats.mood = clamp(state.stats.mood + food.mood);
  state.counts.fed += 1;
  const stageUp = gainExp(state, food.exp);
  return { ok: true as const, food, stageUp };
}

export function pet(state: GameState, now = Date.now()) {
  if (state.sleeping) return { ok: false, reason: 'sleeping' } as Fail<'sleeping'>;
  state.recentPets = state.recentPets.filter((t) => now - t < 60000);
  if (state.recentPets.length >= PET_LIMIT_PER_MIN) return { ok: false, reason: 'tickled' } as Fail<'tickled'>;

  state.recentPets.push(now);
  state.stats.mood = clamp(state.stats.mood + 6);
  state.counts.petted += 1;
  const stageUp = gainExp(state, 1);
  return { ok: true as const, stageUp };
}

export function toggleSleep(state: GameState) {
  state.sleeping = !state.sleeping;
  return { ok: true as const, sleeping: state.sleeping };
}

export function canPlay(state: GameState) {
  if (state.sleeping) return { ok: false, reason: 'sleeping' } as Fail<'sleeping'>;
  if (state.stats.energy < PLAY_ENERGY_COST) return { ok: false, reason: 'tired' } as Fail<'tired'>;
  return { ok: true as const };
}

export interface PlayResult {
  ok: true;
  reward: number;
  isBest: boolean;
  stageUp: StageInfo | null;
}

// ミニゲームの結果を反映する。score はつかまえた数の合計、pearls は拾った真珠。
export function finishPlay(state: GameState, { score, pearls }: { score: number; pearls: number }): PlayResult {
  const safeScore = Math.max(0, Math.floor(score));
  const found = Math.max(0, Math.floor(pearls));
  const reward = Math.floor(safeScore / 4) + found;
  state.stats.energy = clamp(state.stats.energy - PLAY_ENERGY_COST);
  state.stats.mood = clamp(state.stats.mood + 15);
  state.pearls += reward;
  state.counts.played += 1;
  const isBest = safeScore > state.bestScore;
  if (isBest) state.bestScore = safeScore;
  const stageUp = gainExp(state, 4 + Math.floor(safeScore / 10));
  return { ok: true, reward, isBest, stageUp };
}

export function buy(state: GameState, itemId: string) {
  const item: OutfitItem | undefined = ITEM_BY_ID[itemId];
  if (!item) return { ok: false, reason: 'unknown' } as Fail<'unknown'>;
  if (state.owned.includes(itemId)) return { ok: false, reason: 'owned' } as Fail<'owned'>;
  if (state.pearls < item.price) return { ok: false, reason: 'pearls', need: item.price - state.pearls } as Fail<'pearls'>;
  state.pearls -= item.price;
  state.owned.push(itemId);
  return { ok: true as const, item };
}

// 同じアイテムをもう一度選ぶと外す。からだの色は外せない。
export function equip(state: GameState, itemId: string) {
  const item = ITEM_BY_ID[itemId];
  if (!item) return { ok: false, reason: 'unknown' } as Fail<'unknown'>;
  if (!state.owned.includes(itemId)) return { ok: false, reason: 'not-owned' } as Fail<'not-owned'>;
  const slot = SLOTS.find((s) => s.id === item.slot)!;
  if (state.equipped[item.slot] === itemId) {
    if (!slot.removable) return { ok: true as const, equipped: true };
    state.equipped[item.slot] = null;
    return { ok: true as const, equipped: false };
  }
  state.equipped[item.slot] = itemId;
  return { ok: true as const, equipped: true };
}

export function rename(state: GameState, name: string) {
  const trimmed = String(name ?? '').trim();
  if (!trimmed) return { ok: false, reason: 'empty' } as Fail<'empty'>;
  state.name = trimmed.slice(0, NAME_MAX);
  return { ok: true as const, name: state.name };
}
