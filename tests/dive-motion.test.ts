import { describe, expect, it } from 'vitest';
import { createMotion, dragBy, MOTION, PX_PER_M, release, step } from '../src/game/dive-motion';

const zone = { top: 200, bottom: 1000 };
/** dt ずつ n 回進める */
const run = (m: ReturnType<typeof createMotion>, n: number, dt = 1 / 60, opts = {}) => {
  let last = { speed: 0, atBottom: false };
  for (let i = 0; i < n; i++) last = step(m, dt, { ...zone, ...opts });
  return last;
};

describe('潜る動き（スクロール感覚）', () => {
  it('何もしなくても、ゆっくり沈む', () => {
    const m = createMotion(300);
    run(m, 60);
    expect(m.depth).toBeCloseTo(300 + MOTION.drift, 1);
  });

  it('上にスワイプすると深く、下にスワイプすると浅くなる（指と同じだけ動く）', () => {
    const down = createMotion(300);
    dragBy(down, -120); // 指を 120px 上へ
    run(down, 30);
    expect(down.depth).toBeGreaterThan(300 + 120 / PX_PER_M - 0.01);

    const up = createMotion(300);
    dragBy(up, 120); // 指を 120px 下へ
    run(up, 30);
    expect(up.depth).toBeLessThan(300 - 120 / PX_PER_M + MOTION.drift);
  });

  it('入口より上には戻れず、底で止まって「着いた」とわかる', () => {
    const m = createMotion(210);
    dragBy(m, 5000);
    step(m, 0.5, zone);
    expect(m.depth).toBe(200);
    expect(m.pending).toBe(0);
    // 入口に着いたあとは、ためた動きではね返らず、ゆっくり沈むだけ
    run(m, 60);
    expect(m.depth).toBeCloseTo(200 + MOTION.drift, 1);

    const b = createMotion(990);
    dragBy(b, -5000);
    const r = run(b, 120);
    expect(b.depth).toBe(1000);
    expect(r.atBottom).toBe(true);
  });

  it('いちばん速い速さを超えない', () => {
    const m = createMotion(300);
    dragBy(m, -100000);
    const r = step(m, 0.1, zone);
    expect(r.speed).toBeLessThanOrEqual(MOTION.maxSpeed + MOTION.drift * PX_PER_M + 1e-6);
  });

  it('指を離すと勢いが残り、だんだん止まる', () => {
    const m = createMotion(300);
    dragBy(m, -10);
    run(m, 5);
    release(m, -2000); // 速く上へはじいた
    expect(m.velocity).toBe(MOTION.maxFling);
    const before = m.depth;
    run(m, 20);
    expect(m.depth).toBeGreaterThan(before + 1);
    run(m, 240);
    expect(m.velocity).toBe(0);
  });

  it('ぶつかって動けない間は、指の動きも勢いも止まる（沈むのは続く）', () => {
    const m = createMotion(300);
    dragBy(m, -600);
    release(m, -800);
    step(m, 1 / 60, { ...zone, stunned: true });
    expect(m.pending).toBe(0);
    expect(m.velocity).toBe(0);
    const before = m.depth;
    run(m, 60, 1 / 60, { stunned: true });
    expect(m.depth).toBeCloseTo(before + MOTION.drift, 1);
  });
});
