// ゲームの状態と、状態を変える操作。DOM や描画には触れない。
// 各操作は state をその場で書き換え、結果オブジェクトを返す。

import { FOOD_BY_ID, ITEM_BY_ID, SLOTS, STAGES, STAGE_UP_BONUS } from './data.js';

export const SAVE_VERSION = 1;
export const STAT_MAX = 100;

// 1分あたりの減り方。おなかは満タンから約3時間で空になる。
export const DECAY_PER_MIN = { hunger: 0.55, mood: 0.4, energy: 0.3 };
export const SLEEP_ENERGY_PER_MIN = 2.5;
export const MAX_OFFLINE_MIN = 60 * 12;
export const PLAY_ENERGY_COST = 15;
export const PET_LIMIT_PER_MIN = 6;
export const LOW_STAT = 25;
export const NAME_MAX = 10;

export function createState(now = Date.now()) {
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

// 保存データを現在の形に合わせる。壊れた値や未知のアイテムは既定値に戻す。
export function normalizeState(saved, now = Date.now()) {
  const base = createState(now);
  if (!saved || typeof saved !== 'object' || saved.version !== SAVE_VERSION) return base;

  const num = (value, fallback) => (Number.isFinite(value) ? value : fallback);
  const state = { ...base };
  state.name = typeof saved.name === 'string' && saved.name.trim() ? saved.name.trim().slice(0, NAME_MAX) : base.name;
  state.bornAt = num(saved.bornAt, now);
  state.lastTick = Math.min(num(saved.lastTick, now), now);
  for (const key of Object.keys(base.stats)) {
    state.stats[key] = clamp(num(saved.stats?.[key], base.stats[key]));
  }
  state.exp = Math.max(0, num(saved.exp, 0));
  state.pearls = Math.max(0, Math.floor(num(saved.pearls, base.pearls)));
  state.owned = [...new Set([...base.owned, ...(saved.owned ?? []).filter((id) => ITEM_BY_ID[id])])];
  state.equipped = { ...base.equipped };
  for (const slot of SLOTS) {
    const id = saved.equipped?.[slot.id];
    if (id === null && slot.removable) state.equipped[slot.id] = null;
    if (ITEM_BY_ID[id]?.slot === slot.id && state.owned.includes(id)) state.equipped[slot.id] = id;
  }
  state.sleeping = saved.sleeping === true;
  state.recentPets = [];
  state.bestScore = Math.max(0, num(saved.bestScore, 0));
  for (const key of Object.keys(base.counts)) {
    state.counts[key] = Math.max(0, num(saved.counts?.[key], 0));
  }
  return state;
}

export function clamp(value) {
  return Math.max(0, Math.min(STAT_MAX, value));
}

export function stageFor(exp) {
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
export function conditionOf(state) {
  if (state.sleeping) return 'sleep';
  const { hunger, mood, energy } = state.stats;
  if (hunger < LOW_STAT) return 'hungry';
  if (energy < LOW_STAT) return 'tired';
  if (mood < LOW_STAT) return 'sad';
  if (hunger > 70 && mood > 70) return 'great';
  return 'normal';
}

// 経過時間ぶんステータスを進める。放置しても 0 で止まり、いなくなったりはしない。
export function tick(state, now = Date.now()) {
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

// 調子が悪いと、なかよし度の伸びが半分になる。
function gainExp(state, amount) {
  const before = stageFor(state.exp);
  const low = Object.values(state.stats).some((v) => v < LOW_STAT);
  state.exp += low ? amount / 2 : amount;
  const after = stageFor(state.exp);
  if (after.index > before.index) {
    state.pearls += STAGE_UP_BONUS;
    return after;
  }
  return null;
}

export function feed(state, foodId) {
  const food = FOOD_BY_ID[foodId];
  if (!food) return { ok: false, reason: 'unknown' };
  if (state.sleeping) return { ok: false, reason: 'sleeping' };
  if (state.stats.hunger >= 95) return { ok: false, reason: 'full' };
  if (state.pearls < food.price) return { ok: false, reason: 'pearls', need: food.price - state.pearls };

  state.pearls -= food.price;
  state.stats.hunger = clamp(state.stats.hunger + food.hunger);
  state.stats.mood = clamp(state.stats.mood + food.mood);
  state.counts.fed += 1;
  const stageUp = gainExp(state, food.exp);
  return { ok: true, food, stageUp };
}

export function pet(state, now = Date.now()) {
  if (state.sleeping) return { ok: false, reason: 'sleeping' };
  state.recentPets = state.recentPets.filter((t) => now - t < 60000);
  if (state.recentPets.length >= PET_LIMIT_PER_MIN) return { ok: false, reason: 'tickled' };

  state.recentPets.push(now);
  state.stats.mood = clamp(state.stats.mood + 6);
  state.counts.petted += 1;
  const stageUp = gainExp(state, 1);
  return { ok: true, stageUp };
}

export function toggleSleep(state) {
  state.sleeping = !state.sleeping;
  return { ok: true, sleeping: state.sleeping };
}

export function canPlay(state) {
  if (state.sleeping) return { ok: false, reason: 'sleeping' };
  if (state.stats.energy < PLAY_ENERGY_COST) return { ok: false, reason: 'tired' };
  return { ok: true };
}

// ミニゲームの結果を反映する。score はつかまえた数の合計、pearls は拾ったしんじゅ。
export function finishPlay(state, { score, pearls }) {
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

export function buy(state, itemId) {
  const item = ITEM_BY_ID[itemId];
  if (!item) return { ok: false, reason: 'unknown' };
  if (state.owned.includes(itemId)) return { ok: false, reason: 'owned' };
  if (state.pearls < item.price) return { ok: false, reason: 'pearls', need: item.price - state.pearls };
  state.pearls -= item.price;
  state.owned.push(itemId);
  return { ok: true, item };
}

// 同じアイテムをもう一度選ぶと外す。からだのいろは外せない。
export function equip(state, itemId) {
  const item = ITEM_BY_ID[itemId];
  if (!item) return { ok: false, reason: 'unknown' };
  if (!state.owned.includes(itemId)) return { ok: false, reason: 'not-owned' };
  const slot = SLOTS.find((s) => s.id === item.slot);
  if (state.equipped[item.slot] === itemId) {
    if (!slot.removable) return { ok: true, equipped: true };
    state.equipped[item.slot] = null;
    return { ok: true, equipped: false };
  }
  state.equipped[item.slot] = itemId;
  return { ok: true, equipped: true };
}

export function rename(state, name) {
  const trimmed = String(name ?? '').trim();
  if (!trimmed) return { ok: false, reason: 'empty' };
  state.name = trimmed.slice(0, NAME_MAX);
  return { ok: true, name: state.name };
}
