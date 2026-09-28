import { describe, expect, test } from 'vitest';
import {
  buy,
  canPlay,
  conditionOf,
  equip,
  feed,
  finishPlay,
  gainExp,
  MAX_OFFLINE_MIN,
  pet,
  PET_LIMIT_PER_MIN,
  PLAY_ENERGY_COST,
  rename,
  stageFor,
  tick,
  toggleSleep,
} from '../src/game/care';
import { STAGE_UP_BONUS } from '../src/game/data/care';
import { createState } from '../src/game/state';

const T0 = 1_700_000_000_000;
const MIN = 60_000;

describe('時間の経過', () => {
  test('ステータスが減り、0 で止まる', () => {
    const s = createState(T0);
    tick(s, T0 + 60 * MIN);
    expect(s.stats.hunger).toBeLessThan(70);
    expect(s.stats.mood).toBeLessThan(70);
    tick(s, T0 + 100 * 60 * MIN);
    expect(s.stats.hunger).toBe(0);
    expect(s.stats.mood).toBe(0);
  });

  test('長い放置は 12 時間ぶんまでしか計算しない', () => {
    const s = createState(T0);
    expect(tick(s, T0 + 48 * 60 * MIN).minutes).toBe(MAX_OFFLINE_MIN);
  });

  test('寝ている間はげんきが回復し、満タンで自然に起きる', () => {
    const s = createState(T0);
    s.stats.energy = 10;
    toggleSleep(s);
    const r = tick(s, T0 + 60 * MIN);
    expect(s.stats.energy).toBe(100);
    expect(s.sleeping).toBe(false);
    expect(r.wokeUp).toBe(true);
  });
});

describe('お世話', () => {
  test('ごはん: 真珠を使っておなかが増える', () => {
    const s = createState(T0);
    s.stats.hunger = 40;
    expect(feed(s, 'amphipod').ok).toBe(true);
    expect(s.stats.hunger).toBe(70);
    expect(s.pearls).toBe(15);
    expect(s.counts.fed).toBe(1);
  });

  test('ごはん: おなかいっぱい・真珠不足・寝ている時は食べない', () => {
    const s = createState(T0);
    s.stats.hunger = 99;
    expect(feed(s, 'copepod')).toMatchObject({ ok: false, reason: 'full' });
    s.stats.hunger = 10;
    s.pearls = 3;
    expect(feed(s, 'pudding')).toEqual({ ok: false, reason: 'pearls', need: 9 });
    toggleSleep(s);
    expect(feed(s, 'copepod')).toMatchObject({ ok: false, reason: 'sleeping' });
  });

  test('なでる: 1分に何度もなでるとくすぐったがる', () => {
    const s = createState(T0);
    for (let i = 0; i < PET_LIMIT_PER_MIN; i++) expect(pet(s, T0 + i * 1000).ok).toBe(true);
    expect(pet(s, T0 + 10_000)).toMatchObject({ ok: false, reason: 'tickled' });
    expect(pet(s, T0 + 2 * MIN).ok).toBe(true);
  });

  test('あそぶ: げんきが足りないと遊べない。結果で真珠がもらえる', () => {
    const s = createState(T0);
    s.stats.energy = PLAY_ENERGY_COST - 1;
    expect(canPlay(s)).toMatchObject({ ok: false, reason: 'tired' });
    s.stats.energy = 80;
    const r = finishPlay(s, { score: 40, pearls: 2 });
    expect(r.reward).toBe(12);
    expect(r.isBest).toBe(true);
    expect(s.pearls).toBe(32);
    expect(s.stats.energy).toBe(80 - PLAY_ENERGY_COST);
    expect(finishPlay(s, { score: 10, pearls: 0 }).isBest).toBe(false);
  });

  test('調子の判定', () => {
    const s = createState(T0);
    expect(conditionOf(s)).toBe('normal');
    s.stats.hunger = 10;
    expect(conditionOf(s)).toBe('hungry');
    s.stats.hunger = 90;
    s.stats.mood = 90;
    expect(conditionOf(s)).toBe('great');
    s.sleeping = true;
    expect(conditionOf(s)).toBe('sleep');
  });
});

describe('成長', () => {
  test('なかよし度がしきい値を超えると段階が上がり、お祝いの真珠がもらえる', () => {
    const s = createState(T0);
    expect(stageFor(s.exp).id).toBe('baby');
    s.exp = 119;
    const pearls = s.pearls;
    expect(pet(s, T0).ok && s.exp).toBe(120);
    expect(stageFor(s.exp).id).toBe('child');
    expect(s.pearls).toBe(pearls + STAGE_UP_BONUS);
    expect(stageFor(10_000).next).toBeNull();
    expect(stageFor(10_000).progress).toBe(1);
  });

  test('一気に 2 段階上がったら、お祝いも 2 回分', () => {
    const s = createState(T0);
    const pearls = s.pearls;
    expect(gainExp(s, 500)?.id).toBe('adult');
    expect(s.pearls).toBe(pearls + STAGE_UP_BONUS * 2);
  });

  test('調子が悪いと伸びが半分。テスト用の加算は調子に関係なく満額', () => {
    const s = createState(T0);
    s.stats.hunger = 5;
    pet(s, T0);
    expect(s.exp).toBe(0.5);
    gainExp(s, 10, { ignoreCondition: true });
    expect(s.exp).toBe(10.5);
  });
});

describe('きせかえ・なまえ', () => {
  test('買ってつけて、もう一度で外す。からだの色は外せない', () => {
    const s = createState(T0);
    expect(equip(s, 'crown')).toMatchObject({ reason: 'not-owned' });
    expect(buy(s, 'crown')).toMatchObject({ reason: 'pearls' });
    s.pearls = 100;
    expect(buy(s, 'crown').ok).toBe(true);
    expect(buy(s, 'crown')).toMatchObject({ reason: 'owned' });
    equip(s, 'crown');
    expect(s.equipped.head).toBe('crown');
    equip(s, 'crown');
    expect(s.equipped.head).toBeNull();
    equip(s, 'color-coral');
    expect(s.equipped.color).toBe('color-coral');
  });

  test('空の名前はだめ、長すぎる名前は切りつめる', () => {
    const s = createState(T0);
    expect(rename(s, '   ').ok).toBe(false);
    rename(s, 'めんだこのめんちゃんです');
    expect(s.name).toHaveLength(10);
  });
});
