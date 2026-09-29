import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS, normalizeSettings } from '../src/app/settings';
import { degreeToMidi, inScale, moodParams, planNotes, type ScoreState } from '../src/audio/score';

/** 決まった順に数を返す乱数（テスト用） */
function seeded(seed = 1) {
  let x = seed;
  return () => {
    x = (x * 1103515245 + 12345) % 2147483648;
    return x / 2147483648;
  };
}

describe('音の設定', () => {
  it('何もなければ既定値（効果音・BGM ともオン）', () => {
    expect(normalizeSettings(null)).toEqual(DEFAULT_SETTINGS);
    expect(DEFAULT_SETTINGS.sfx).toBe(true);
    expect(DEFAULT_SETTINGS.bgm).toBe(true);
  });

  it('おかしな値は既定値に戻し、音量は 0〜1 におさめる', () => {
    expect(normalizeSettings({ sfx: 'yes', bgm: false, volume: 3 })).toEqual({ sfx: true, bgm: false, volume: 1 });
    expect(normalizeSettings({ volume: -1 }).volume).toBe(0);
    expect(normalizeSettings({ volume: Number.NaN }).volume).toBe(DEFAULT_SETTINGS.volume);
    expect(normalizeSettings('broken')).toEqual(DEFAULT_SETTINGS);
  });
});

describe('BGM の音選び', () => {
  it('音階の番号は D のペンタトニックの音になる', () => {
    expect(degreeToMidi(0)).toBe(50); // D3
    expect(degreeToMidi(5)).toBe(62); // D4
    for (let d = 0; d < 25; d++) expect(inScale(degreeToMidi(d))).toBe(true);
    expect(inScale(51)).toBe(false);
  });

  it('選んだ音はすべて音階の中・範囲の中で、時刻は順に進む', () => {
    for (const mood of ['tank', 'sleep', 'catch', 'dive'] as const) {
      const p = moodParams(mood);
      const state: ScoreState = { next: 0, degree: p.low };
      const notes = planNotes(p, state, 120, seeded(7));
      expect(notes.length).toBeGreaterThan(0);
      for (const n of notes) {
        expect(inScale(n.midi)).toBe(true);
        expect(n.midi).toBeLessThanOrEqual(degreeToMidi(p.high));
        expect(n.midi).toBeGreaterThanOrEqual(degreeToMidi(p.low - 2));
        expect(n.velocity).toBeGreaterThan(0);
        expect(n.velocity).toBeLessThanOrEqual(1);
      }
      const times = notes.map((n) => n.time);
      expect([...times].sort((a, b) => a - b)).toEqual(times);
      expect(state.next).toBeGreaterThanOrEqual(120);
    }
  });

  it('音の多さは場面の雰囲気に合う（ミニゲーム > 水槽 > おやすみ）', () => {
    const rate = (mood: 'tank' | 'sleep' | 'catch') => {
      const p = moodParams(mood);
      const notes = planNotes(p, { next: 0, degree: p.low }, 600, seeded(3));
      return notes.length / 600;
    };
    expect(rate('catch')).toBeGreaterThan(rate('tank'));
    expect(rate('tank')).toBeGreaterThan(rate('sleep'));
    // 平均はだいたい density のあたり（和音を添える分だけ少し多い）
    const tank = moodParams('tank');
    expect(rate('tank')).toBeGreaterThan(tank.density * 0.7);
    expect(rate('tank')).toBeLessThan(tank.density * 1.5);
  });

  it('探索は深くなるほど音が減り、暗くなる', () => {
    const top = moodParams('dive', 0);
    const bottom = moodParams('dive', 1);
    expect(bottom.density).toBeLessThan(top.density);
    expect(bottom.brightness).toBeLessThan(top.brightness);
    expect(bottom.high).toBeLessThan(top.high);
    expect(bottom.drone).toBeGreaterThan(top.drone);
  });

  it('止めていた間の遅れはまとめて鳴らさない（次の時刻から続ける）', () => {
    const p = moodParams('tank');
    const state: ScoreState = { next: 10, degree: 10 };
    expect(planNotes(p, state, 10, seeded())).toEqual([]);
    expect(state.next).toBe(10);
  });
});
