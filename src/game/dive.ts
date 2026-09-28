// 深海探索のルール：行けるか・潜る・何がどこに出るか・結果の反映。
// 泳ぐ・当たる・出会うといった操作の部分は描画側（src/world/dive）が受け持つ。

import { gainExp, type Fail, type StageInfo } from './care';
import { CREATURE_BY_ID } from './data/creatures';
import { BOTTOM_BONUS, MATERIAL_BY_ID, MATERIALS, TRASH_VALUE } from './data/materials';
import { ZONE_BY_ID, ZONES, type ZoneDef } from './data/zones';
import { clamp, type GameState } from './state';
import { registerMeet, type Rng } from './visitors';

export const DIVE_ENERGY = 20;
export const HAZARDS = ['shadow', 'trashball'] as const;
export type HazardId = (typeof HAZARDS)[number];

export interface PlanItem {
  kind: 'creature' | 'material' | 'trash' | 'hazard';
  id: string;
  /** 深さ（m） */
  depth: number;
  /** 横位置（0〜1） */
  x: number;
}

export interface DiveResult {
  zoneId: string;
  met: string[];
  materials: Record<string, number>;
  trash: number;
  reachedBottom: boolean;
  maxDepth: number;
}

/** 図鑑で見つけた数（めんだこを含む） */
const foundCount = (state: GameState) => Object.keys(state.zukan).length;

export function isUnlocked(state: GameState, zone: ZoneDef) {
  return foundCount(state) >= zone.unlockFound;
}

export function canDive(state: GameState, zoneId: string) {
  const zone = ZONE_BY_ID[zoneId];
  if (!zone) return { ok: false, reason: 'unknown' } as Fail<'unknown'>;
  if (!isUnlocked(state, zone)) return { ok: false, reason: 'locked', need: zone.unlockFound - foundCount(state) } as Fail<'locked'>;
  if (state.sleeping) return { ok: false, reason: 'sleeping' } as Fail<'sleeping'>;
  if (state.stats.energy < DIVE_ENERGY) return { ok: false, reason: 'tired' } as Fail<'tired'>;
  return { ok: true as const, zone };
}

export function startDive(state: GameState, zoneId: string) {
  const check = canDive(state, zoneId);
  if (!check.ok) return check;
  state.stats.energy = clamp(state.stats.energy - DIVE_ENERGY);
  return check;
}

function pickWeighted<T extends { weight: number }>(list: T[], rng: Rng): T {
  const total = list.reduce((sum, c) => sum + c.weight, 0);
  let roll = rng() * total;
  for (const c of list) {
    roll -= c.weight;
    if (roll < 0) return c;
  }
  return list[list.length - 1];
}

const between = (a: number, b: number, rng: Rng) => a + rng() * (b - a);

/** 1回の探索で、どの深さに何を置くかを決める（乱数を差し込めるのでテストできる） */
export function planDive(zone: ZoneDef, rng: Rng = Math.random): PlanItem[] {
  const items: PlanItem[] = [];
  const x = () => 0.12 + rng() * 0.76;

  // 生き物：なるべく違う種類が出るように、一度出たものは次の一巡まで外す
  let pool = [...zone.creatures];
  for (let i = 0; i < zone.creatureCount; i++) {
    if (!pool.length) pool = [...zone.creatures];
    const choice = pickWeighted(pool, rng);
    pool = pool.filter((c) => c !== choice);
    const def = CREATURE_BY_ID[choice.id];
    let lo = Math.max(zone.top + 60, def.depth[0]);
    let hi = Math.min(zone.bottom - 30, def.depth[1]);
    // 本来もっと深い生き物（ジュウモンジダコなど）は、いちばん底に出る
    if (lo > hi) lo = hi = def.depth[0] > zone.top ? zone.bottom - 40 : zone.top + 80;
    items.push({ kind: 'creature', id: choice.id, depth: Math.round(between(lo, hi, rng)), x: x() });
  }

  const span = (margin = 60) => between(zone.top + margin, zone.bottom - 40, rng);
  for (let i = 0; i < 14; i++) items.push({ kind: 'material', id: pickWeighted(MATERIALS, rng).id, depth: Math.round(span(40)), x: x() });
  for (let i = 0; i < 5; i++) items.push({ kind: 'trash', id: 'trash', depth: Math.round(span()), x: x() });
  const hazards = zone.bottom - zone.top > 1000 ? 8 : 6;
  for (let i = 0; i < hazards; i++) items.push({ kind: 'hazard', id: HAZARDS[Math.floor(rng() * HAZARDS.length)], depth: Math.round(span(100)), x: x() });

  return items.sort((a, b) => a.depth - b.depth);
}

export interface DiveReward {
  newIds: string[];
  metIds: string[];
  materialPearls: number;
  trashPearls: number;
  bonus: number;
  halved: boolean;
  pearls: number;
  newBest: boolean;
  stageUp: StageInfo | null;
}

/** 探索の結果を反映する。途中で浮上したときは素材の換金が半分。図鑑の記録は失わない */
export function finishDive(state: GameState, result: DiveResult, now = Date.now()): DiveReward {
  const metIds = [...new Set(result.met.filter((id) => CREATURE_BY_ID[id]))];
  const newIds = metIds.filter((id) => registerMeet(state, id, now).isNew);

  let materialPearls = 0;
  for (const [id, count] of Object.entries(result.materials)) {
    materialPearls += (MATERIAL_BY_ID[id]?.value ?? 0) * Math.max(0, Math.floor(count));
  }
  const halved = !result.reachedBottom;
  if (halved) materialPearls = Math.floor(materialPearls / 2);
  const trashPearls = Math.max(0, Math.floor(result.trash)) * TRASH_VALUE;
  const bonus = result.reachedBottom ? BOTTOM_BONUS : 0;
  const pearls = materialPearls + trashPearls + bonus;

  state.pearls += pearls;
  state.dive.dives += 1;
  const newBest = result.maxDepth > state.dive.bestDepth;
  if (newBest) state.dive.bestDepth = Math.round(result.maxDepth);
  state.stats.mood = clamp(state.stats.mood + 10);
  const stageUp = gainExp(state, 6 + newIds.length * 4);
  return { newIds, metIds, materialPearls, trashPearls, bonus, halved, pearls, newBest, stageUp };
}

export { ZONES };
