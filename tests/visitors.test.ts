import { describe, expect, test } from 'vitest';
import { placeDecor } from '../src/game/decor';
import { createState, normalizeState } from '../src/game/state';
import {
  callVisitor,
  candidates,
  MAX_VISITORS,
  meetVisitor,
  rollVisitors,
  VISIT_INTERVAL_MS,
  zukanProgress,
} from '../src/game/visitors';

const T0 = 1_700_000_000_000;
const HOUR = 3600_000;

/** 決まった順に値を返す乱数 */
const seq = (...values: number[]) => {
  let i = 0;
  return () => values[i++ % values.length];
};

describe('来訪', () => {
  test('30分たつまでは抽選しない', () => {
    const s = createState(T0);
    expect(rollVisitors(s, T0 + VISIT_INTERVAL_MS - 1, seq(0))).toEqual([]);
    expect(s.lastVisitRoll).toBe(T0);
  });

  test('図鑑がめんだこだけのうちは、最初の1匹が必ず来る', () => {
    const s = createState(T0);
    const arrivals = rollVisitors(s, T0 + VISIT_INTERVAL_MS, seq(0.99));
    expect(arrivals).toHaveLength(1);
    expect(s.visitors).toHaveLength(1);
    expect(s.lastVisitRoll).toBe(T0 + VISIT_INTERVAL_MS);
  });

  test('必要な飾りがないと来ない（骨がなければホネクイハナムシは来ない）', () => {
    const s = createState(T0);
    expect(candidates(s).map((c) => c.def.id)).not.toContain('honekui');
    s.decor.owned['whale-bone'] = 1;
    placeDecor(s, 'whale-bone');
    expect(candidates(s).map((c) => c.def.id)).toContain('honekui');
  });

  test('好きな飾りがあると来やすくなる', () => {
    const s = createState(T0);
    // 岩をしまった状態（砂だけ）と、岩を置いた状態をくらべる
    s.decor.placed = s.decor.placed.filter((p) => p.id !== 'rock');
    const before = candidates(s).find((c) => c.def.id === 'takaashi')!.weight;
    placeDecor(s, 'rock');
    const after = candidates(s).find((c) => c.def.id === 'takaashi')!.weight;
    expect(after).toBeGreaterThan(before);
  });

  test('一度に来るのは3匹まで。同じ生き物は重ならない', () => {
    const s = createState(T0);
    s.zukan.hotaruika = { count: 1, firstAt: T0 };
    rollVisitors(s, T0 + 10 * VISIT_INTERVAL_MS, seq(0, 0.5, 0.1, 0.9));
    expect(s.visitors.length).toBeLessThanOrEqual(MAX_VISITORS);
    expect(new Set(s.visitors.map((v) => v.id)).size).toBe(s.visitors.length);
  });

  test('滞在時間が過ぎると帰る', () => {
    const s = createState(T0);
    rollVisitors(s, T0 + VISIT_INTERVAL_MS, seq(0.99));
    const visitor = s.visitors[0];
    rollVisitors(s, visitor.leavesAt + 1, seq(0.99));
    expect(s.visitors.find((v) => v.uid === visitor.uid)).toBeUndefined();
  });

  test('長く閉じていても、抽選は12時間ぶんまで', () => {
    const s = createState(T0);
    s.zukan.hotaruika = { count: 1, firstAt: T0 };
    let calls = 0;
    rollVisitors(s, T0 + 100 * HOUR, () => {
      calls++;
      return 0.99;
    });
    expect(calls).toBe(24);
    expect(s.lastVisitRoll).toBe(T0 + 100 * HOUR);
  });
});

describe('会う・図鑑', () => {
  test('タップすると図鑑に載り、おみやげを受け取る。二度目は数えない', () => {
    const s = createState(T0);
    const r = callVisitor(s, T0, seq(0.01));
    expect(r.ok).toBe(true);
    const visitor = s.visitors[0];
    visitor.gift = 7;
    const pearls = s.pearls;
    const first = meetVisitor(s, visitor.uid, T0 + 1000);
    expect(first).toMatchObject({ ok: true, isNew: true, gift: 7 });
    expect(s.pearls).toBe(pearls + 7);
    expect(s.zukan[visitor.id]).toEqual({ count: 1, firstAt: T0 + 1000 });
    const again = meetVisitor(s, visitor.uid, T0 + 2000);
    expect(again).toMatchObject({ ok: true, isNew: false, gift: 0 });
    expect(s.zukan[visitor.id].count).toBe(1);
  });

  test('発見数はめんだこを含めて数える', () => {
    const s = createState(T0);
    expect(zukanProgress(s)).toEqual({ found: 1, total: 10 });
  });

  test('保存データの来訪者と図鑑を読み込む（知らない生き物は外す）', () => {
    const saved = {
      ...createState(T0),
      visitors: [
        { uid: 'v5', id: 'hotaruika', arrivedAt: T0, leavesAt: T0 + HOUR, x: 100, y: -150, met: false, gift: 3 },
        { uid: 'v6', id: 'unicorn', arrivedAt: T0, leavesAt: T0 + HOUR },
      ],
      zukan: { hotaruika: { count: 2, firstAt: T0 }, unicorn: { count: 1, firstAt: T0 } },
    };
    const s = normalizeState(saved, T0);
    expect(s.visitors.map((v) => v.id)).toEqual(['hotaruika']);
    expect(Object.keys(s.zukan).sort()).toEqual(['hotaruika', 'mendako']);
    expect(s.nextUid).toBeGreaterThan(5);
  });
});
