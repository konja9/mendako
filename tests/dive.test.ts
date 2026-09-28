import { describe, expect, test } from 'vitest';
import { canDive, DIVE_ENERGY, finishDive, planDive, startDive } from '../src/game/dive';
import { CREATURE_BY_ID } from '../src/game/data/creatures';
import { BOTTOM_BONUS, TRASH_VALUE } from '../src/game/data/materials';
import { ZONE_BY_ID } from '../src/game/data/zones';
import { createState, normalizeState } from '../src/game/state';

const T0 = 1_700_000_000_000;
const lcg = (seed: number) => () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);

describe('潜れるか', () => {
  test('げんき不足・寝ている・未解放では潜れない', () => {
    const s = createState(T0);
    s.stats.energy = DIVE_ENERGY - 1;
    expect(canDive(s, 'meso')).toMatchObject({ ok: false, reason: 'tired' });
    s.stats.energy = 80;
    s.sleeping = true;
    expect(canDive(s, 'meso')).toMatchObject({ ok: false, reason: 'sleeping' });
    s.sleeping = false;
    expect(canDive(s, 'bathy')).toMatchObject({ ok: false, reason: 'locked', need: 5 });
    expect(canDive(s, 'meso').ok).toBe(true);
  });

  test('図鑑で6種見つけると漸深層に行ける。潜るとげんきを使う', () => {
    const s = createState(T0);
    for (const id of ['hotaruika', 'hadakaiwashi', 'demenigisu', 'takaashi', 'honekui']) s.zukan[id] = { count: 1, firstAt: T0 };
    expect(startDive(s, 'bathy').ok).toBe(true);
    expect(s.stats.energy).toBe(80 - DIVE_ENERGY);
  });
});

describe('出現の組み立て', () => {
  test('生き物はゾーンの範囲で、なるべく重ならず、深さ順に並ぶ', () => {
    for (const zoneId of ['meso', 'bathy']) {
      const zone = ZONE_BY_ID[zoneId];
      const plan = planDive(zone, lcg(3));
      const creatures = plan.filter((p) => p.kind === 'creature');
      expect(creatures).toHaveLength(zone.creatureCount);
      for (const c of creatures) {
        expect(zone.creatures.map((z) => z.id)).toContain(c.id);
        expect(c.depth).toBeGreaterThanOrEqual(zone.top);
        expect(c.depth).toBeLessThanOrEqual(zone.bottom);
      }
      expect(new Set(creatures.map((c) => c.id)).size).toBeGreaterThanOrEqual(Math.min(zone.creatures.length, 5));
      expect(plan.map((p) => p.depth)).toEqual([...plan.map((p) => p.depth)].sort((a, b) => a - b));
      expect(plan.some((p) => p.kind === 'hazard')).toBe(true);
      expect(plan.some((p) => p.kind === 'material')).toBe(true);
    }
  });

  test('本来もっと深い生き物（ジュウモンジダコ）は漸深層の底に出る', () => {
    for (let seed = 1; seed < 30; seed++) {
      const jumonji = planDive(ZONE_BY_ID.bathy, lcg(seed)).find((p) => p.id === 'jumonji');
      if (jumonji) expect(jumonji.depth).toBe(ZONE_BY_ID.bathy.bottom - 40);
    }
    expect(CREATURE_BY_ID.jumonji.meet).toBe('dive');
  });
});

describe('結果の反映', () => {
  const base = { zoneId: 'meso', met: ['koumori', 'hotaruika', 'koumori'], materials: { shell: 2, 'pretty-stone': 1 }, trash: 3, maxDepth: 1000 };

  test('底まで着くと、素材は満額・ボーナスあり。図鑑に載る', () => {
    const s = createState(T0);
    const pearls = s.pearls;
    const r = finishDive(s, { ...base, reachedBottom: true }, T0);
    expect(r.materialPearls).toBe(3 * 2 + 9);
    expect(r.trashPearls).toBe(3 * TRASH_VALUE);
    expect(r.bonus).toBe(BOTTOM_BONUS);
    expect(s.pearls).toBe(pearls + r.pearls);
    expect(r.newIds.sort()).toEqual(['hotaruika', 'koumori']);
    expect(s.zukan.koumori.count).toBe(1);
    expect(s.dive).toEqual({ bestDepth: 1000, dives: 1 });
  });

  test('途中で浮上すると素材の換金は半分。図鑑の記録は失わない', () => {
    const s = createState(T0);
    const r = finishDive(s, { ...base, reachedBottom: false, maxDepth: 640 }, T0);
    expect(r.halved).toBe(true);
    expect(r.materialPearls).toBe(Math.floor(15 / 2));
    expect(r.bonus).toBe(0);
    expect(s.zukan.koumori).toBeDefined();
    expect(s.dive.bestDepth).toBe(640);
  });

  test('保存データの探索記録を読み込む', () => {
    const s = normalizeState({ ...createState(T0), dive: { bestDepth: 812.4, dives: 3 } }, T0);
    expect(s.dive).toEqual({ bestDepth: 812, dives: 3 });
    const old = { ...createState(T0) } as Record<string, unknown>;
    delete old.dive;
    expect(normalizeState(old, T0).dive).toEqual({ bestDepth: 0, dives: 0 });
  });
});
