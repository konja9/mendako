import { describe, expect, test, vi } from 'vitest';
import { createState, normalizeState, SAVE_VERSION, serialize } from '../src/game/state';
import { createStore } from '../src/game/store';

const T0 = 1_700_000_000_000;
const MIN = 60_000;

describe('保存データの読み込み', () => {
  test('v1（最初のプロトタイプ）の進行を引き継ぐ', () => {
    const v1 = {
      version: 1,
      species: 'mendako',
      name: 'たこすけ',
      bornAt: T0 - 3 * 86_400_000,
      lastTick: T0 - 10 * MIN,
      stats: { hunger: 40, mood: 55, energy: 66 },
      exp: 210,
      pearls: 87,
      owned: ['ribbon', 'color-coral', 'crown', 'color-lavender'],
      equipped: { head: 'crown', face: null, neck: null, color: 'color-lavender' },
      sleeping: true,
      recentPets: [T0 - 1000],
      bestScore: 41,
      counts: { fed: 12, petted: 30, played: 4 },
    };
    const s = normalizeState(v1, T0);
    expect(s.version).toBe(SAVE_VERSION);
    expect(s).toMatchObject({
      name: 'たこすけ',
      exp: 210,
      pearls: 87,
      sleeping: true,
      bestScore: 41,
      lastTick: T0 - 10 * MIN,
      stats: { hunger: 40, mood: 55, energy: 66 },
      equipped: { head: 'crown', face: null, neck: null, color: 'color-lavender' },
      counts: { fed: 12, petted: 30, played: 4 },
    });
    expect(s.recentPets).toEqual([]);
  });

  test('壊れた値や知らないアイテムは既定値に戻す', () => {
    const saved = {
      ...createState(T0),
      name: 42,
      stats: { hunger: 'x', mood: 250, energy: 30 },
      owned: ['crown', 'unknown-hat'],
      equipped: { head: 'unknown-hat', face: 'round-glasses', neck: null, color: 'crown' },
      lastTick: T0 + 999 * MIN,
    };
    const s = normalizeState(saved, T0);
    expect(s.name).toBe('めんちゃん');
    expect(s.stats).toEqual({ hunger: 70, mood: 100, energy: 30 });
    expect([...s.owned].sort()).toEqual(['color-coral', 'crown', 'ribbon']);
    expect(s.equipped).toEqual({ head: 'ribbon', face: null, neck: null, color: 'color-coral' });
    expect(s.lastTick).toBe(T0);
  });

  test('知らない版や空のデータなら新しく始める', () => {
    expect(normalizeState({ version: 999 }, T0).name).toBe('めんちゃん');
    expect(normalizeState(null, T0).pearls).toBe(20);
    expect(normalizeState('abc', T0).pearls).toBe(20);
  });

  test('保存するときは連打判定用の一時データを含めない', () => {
    const s = createState(T0);
    s.recentPets = [T0];
    expect(JSON.parse(serialize(s))).not.toHaveProperty('recentPets');
  });
});

describe('ストア', () => {
  test('更新すると保存され、購読者に新しい参照で通知される', () => {
    const persist = vi.fn();
    const store = createStore(createState(T0), persist);
    const seen: unknown[] = [];
    store.subscribe((s) => seen.push(s));
    const before = store.get();
    const result = store.update((s) => {
      s.pearls += 5;
      return 'done';
    });
    expect(result).toBe('done');
    expect(store.get().pearls).toBe(25);
    expect(store.get()).not.toBe(before);
    expect(persist).toHaveBeenCalledTimes(1);
    expect(seen).toHaveLength(2);
  });
});
