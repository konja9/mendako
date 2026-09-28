import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  createState,
  normalizeState,
  tick,
  feed,
  pet,
  toggleSleep,
  canPlay,
  finishPlay,
  buy,
  equip,
  rename,
  stageFor,
  conditionOf,
  MAX_OFFLINE_MIN,
  PET_LIMIT_PER_MIN,
  PLAY_ENERGY_COST,
} from '../src/game/state.js';
import { STAGE_UP_BONUS } from '../src/game/data.js';

const T0 = 1_700_000_000_000;
const MIN = 60_000;

test('時間がたつと ステータスが減り、0 で止まる', () => {
  const s = createState(T0);
  tick(s, T0 + 60 * MIN);
  assert.ok(s.stats.hunger < 70);
  assert.ok(s.stats.mood < 70);
  tick(s, T0 + 100 * 60 * MIN);
  assert.equal(s.stats.hunger, 0);
  assert.equal(s.stats.mood, 0);
});

test('長い放置は 12時間ぶんまでしか 計算しない', () => {
  const s = createState(T0);
  const r = tick(s, T0 + 48 * 60 * MIN);
  assert.equal(r.minutes, MAX_OFFLINE_MIN);
});

test('ねている間は げんきが回復し、満タンで 自然におきる', () => {
  const s = createState(T0);
  s.stats.energy = 10;
  toggleSleep(s);
  const r = tick(s, T0 + 60 * MIN);
  assert.equal(s.stats.energy, 100);
  assert.equal(s.sleeping, false);
  assert.equal(r.wokeUp, true);
});

test('ごはん: しんじゅを使って おなかが ふえる', () => {
  const s = createState(T0);
  s.stats.hunger = 40;
  const r = feed(s, 'amphipod');
  assert.equal(r.ok, true);
  assert.equal(s.stats.hunger, 70);
  assert.equal(s.pearls, 15);
  assert.equal(s.counts.fed, 1);
});

test('ごはん: おなか いっぱい・しんじゅ不足・ねている時は 食べない', () => {
  const s = createState(T0);
  s.stats.hunger = 99;
  assert.equal(feed(s, 'copepod').reason, 'full');
  s.stats.hunger = 10;
  s.pearls = 3;
  assert.deepEqual(feed(s, 'pudding'), { ok: false, reason: 'pearls', need: 9 });
  toggleSleep(s);
  assert.equal(feed(s, 'copepod').reason, 'sleeping');
});

test('なでる: 1分に なんども なでると くすぐったがる', () => {
  const s = createState(T0);
  for (let i = 0; i < PET_LIMIT_PER_MIN; i++) assert.equal(pet(s, T0 + i * 1000).ok, true);
  assert.equal(pet(s, T0 + 10_000).reason, 'tickled');
  assert.equal(pet(s, T0 + 2 * MIN).ok, true);
});

test('あそぶ: げんきが足りないと あそべない。結果で しんじゅが もらえる', () => {
  const s = createState(T0);
  s.stats.energy = PLAY_ENERGY_COST - 1;
  assert.equal(canPlay(s).reason, 'tired');
  s.stats.energy = 80;
  const r = finishPlay(s, { score: 40, pearls: 2 });
  assert.equal(r.reward, 12);
  assert.equal(r.isBest, true);
  assert.equal(s.pearls, 32);
  assert.equal(s.stats.energy, 80 - PLAY_ENERGY_COST);
  assert.equal(finishPlay(s, { score: 10, pearls: 0 }).isBest, false);
});

test('せいちょう: なかよし度が しきい値を こえると 段階が上がり ボーナス', () => {
  const s = createState(T0);
  assert.equal(stageFor(s.exp).id, 'baby');
  s.exp = 119;
  const pearls = s.pearls;
  const r = pet(s, T0);
  assert.equal(r.stageUp.id, 'child');
  assert.equal(s.pearls, pearls + STAGE_UP_BONUS);
  assert.equal(stageFor(10_000).next, null);
  assert.equal(stageFor(10_000).progress, 1);
});

test('調子が悪いと なかよし度の のびが 半分', () => {
  const s = createState(T0);
  s.stats.hunger = 5;
  pet(s, T0);
  assert.equal(s.exp, 0.5);
});

test('きせかえ: 買って つけて、もう一度で はずす。いろは はずせない', () => {
  const s = createState(T0);
  assert.equal(equip(s, 'crown').reason, 'not-owned');
  assert.equal(buy(s, 'crown').reason, 'pearls');
  s.pearls = 100;
  assert.equal(buy(s, 'crown').ok, true);
  assert.equal(buy(s, 'crown').reason, 'owned');
  equip(s, 'crown');
  assert.equal(s.equipped.head, 'crown');
  equip(s, 'crown');
  assert.equal(s.equipped.head, null);
  equip(s, 'color-coral');
  assert.equal(s.equipped.color, 'color-coral');
});

test('なまえ: 空は だめ、長すぎる名前は 切りつめる', () => {
  const s = createState(T0);
  assert.equal(rename(s, '   ').ok, false);
  rename(s, 'めんだこのめんちゃんです');
  assert.equal(s.name.length, 10);
});

test('調子の判定', () => {
  const s = createState(T0);
  assert.equal(conditionOf(s), 'normal');
  s.stats.hunger = 10;
  assert.equal(conditionOf(s), 'hungry');
  s.stats.hunger = 90;
  s.stats.mood = 90;
  assert.equal(conditionOf(s), 'great');
  s.sleeping = true;
  assert.equal(conditionOf(s), 'sleep');
});

test('保存データの読み込み: 壊れた値や 知らないアイテムは 既定値に戻す', () => {
  const saved = {
    ...createState(T0),
    name: 42,
    stats: { hunger: 'x', mood: 250, energy: 30 },
    owned: ['crown', 'unknown-hat'],
    equipped: { head: 'unknown-hat', face: 'round-glasses', neck: null, color: 'crown' },
    lastTick: T0 + 999 * MIN,
  };
  const s = normalizeState(saved, T0);
  assert.equal(s.name, 'めんちゃん');
  assert.equal(s.stats.hunger, 70);
  assert.equal(s.stats.mood, 100);
  assert.equal(s.stats.energy, 30);
  assert.deepEqual(s.owned.sort(), ['color-coral', 'crown', 'ribbon']);
  assert.equal(s.equipped.head, 'ribbon');
  assert.equal(s.equipped.face, null);
  assert.equal(s.equipped.color, 'color-coral');
  assert.equal(s.lastTick, T0);
  assert.equal(normalizeState({ version: 999 }, T0).name, 'めんちゃん');
  assert.equal(normalizeState(null, T0).pearls, 20);
});
