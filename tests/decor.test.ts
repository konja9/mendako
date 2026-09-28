import { describe, expect, test } from 'vitest';
import { MAX_PLACED, PLACE_BOUNDS } from '../src/game/data/decor';
import { availableCount, buyDecor, buyFloor, flipDecor, moveDecor, placeDecor, setFloor, storeDecor, tagsInTank } from '../src/game/decor';
import { createState, normalizeState } from '../src/game/state';

const T0 = 1_700_000_000_000;

describe('模様替え', () => {
  test('最初から岩とウミエラが置いてある', () => {
    const s = createState(T0);
    expect(s.decor.placed.map((p) => p.id)).toEqual(['rock', 'sea-pen']);
    expect(availableCount(s, 'rock')).toBe(0);
  });

  test('買うと持ち物が増え、置ける数だけ置ける', () => {
    const s = createState(T0);
    s.pearls = 100;
    expect(buyDecor(s, 'shell').ok).toBe(true);
    expect(s.pearls).toBe(94);
    expect(placeDecor(s, 'shell').ok).toBe(true);
    expect(placeDecor(s, 'shell')).toMatchObject({ ok: false, reason: 'none-left' });
    s.pearls = 10;
    expect(buyDecor(s, 'whale-bone')).toMatchObject({ ok: false, reason: 'pearls', need: 50 });
  });

  test('置ける数には上限がある', () => {
    const s = createState(T0);
    s.decor.owned.shell = 20;
    for (let i = s.decor.placed.length; i < MAX_PLACED; i++) expect(placeDecor(s, 'shell').ok).toBe(true);
    expect(placeDecor(s, 'shell')).toMatchObject({ ok: false, reason: 'full' });
  });

  test('動かすと水槽の中に収まるよう直される。反転・しまうもできる', () => {
    const s = createState(T0);
    const uid = s.decor.placed[0].uid;
    moveDecor(s, uid, -500, 999);
    expect(s.decor.placed[0]).toMatchObject({ x: PLACE_BOUNDS.x[0], y: PLACE_BOUNDS.floorY[1] });
    flipDecor(s, uid);
    expect(s.decor.placed[0].flip).toBe(true);
    storeDecor(s, uid);
    expect(s.decor.placed.find((p) => p.uid === uid)).toBeUndefined();
    expect(availableCount(s, 'rock')).toBe(1);
  });

  test('浮かべる飾りは水中の高さに置かれる', () => {
    const s = createState(T0);
    s.decor.owned['lantern-lamp'] = 1;
    const r = placeDecor(s, 'lantern-lamp', { x: 200, y: 0 });
    const placed = s.decor.placed.find((p) => r.ok && p.uid === r.uid)!;
    expect(placed.y).toBe(PLACE_BOUNDS.floatY[1]);
  });

  test('海底を買って切り替える。タグに海底の分も入る', () => {
    const s = createState(T0);
    expect(tagsInTank(s).has('bone')).toBe(false);
    s.pearls = 100;
    expect(buyFloor(s, 'bone-valley').ok).toBe(true);
    expect(s.decor.floor).toBe('bone-valley');
    expect(tagsInTank(s).has('bone')).toBe(true);
    expect(setFloor(s, 'sand').ok).toBe(true);
    expect(setFloor(s, 'vent-field')).toMatchObject({ reason: 'not-owned' });
  });
});

describe('保存データ（模様替え）', () => {
  test('Phase 1 のデータには模様替えが無いので、最初の配置になる', () => {
    const phase1 = { ...createState(T0) } as Record<string, unknown>;
    delete phase1.decor;
    delete phase1.zukan;
    const s = normalizeState(phase1, T0);
    expect(s.decor.placed).toHaveLength(2);
    expect(s.zukan.mendako).toBeDefined();
  });

  test('持っていない飾りや知らない飾りの配置は外す。通し番号は重ならない', () => {
    const saved = {
      ...createState(T0),
      decor: {
        owned: { rock: 1, 'mystery-box': 3 },
        placed: [
          { uid: 'd7', id: 'rock', x: 100, y: 0, flip: false },
          { uid: 'd8', id: 'rock', x: 120, y: 0, flip: false },
          { uid: 'd9', id: 'mystery-box', x: 0, y: 0 },
        ],
        floor: 'vent-field',
        floors: ['sand'],
      },
      nextUid: 2,
    };
    const s = normalizeState(saved, T0);
    expect(s.decor.placed.map((p) => p.uid)).toEqual(['d7']);
    expect(s.decor.floor).toBe('sand');
    expect(s.nextUid).toBeGreaterThan(7);
  });
});
