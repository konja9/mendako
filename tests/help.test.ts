import { describe, expect, it } from 'vitest';
import { HELP_SECTIONS, INTROS, TIPS } from '../src/game/data/help';
import { INTRO_KEYS } from '../src/game/data/intro-keys';
import { finishTutorial, hasSeen, markSeen, pickTip, restartTutorial } from '../src/game/help';
import { createState, normalizeState } from '../src/game/state';

describe('案内の進み具合', () => {
  it('新しく始めると、案内も初めての説明もまだ', () => {
    const s = createState();
    expect(s.help.tutorialDone).toBe(false);
    expect(s.help.seen).toEqual([]);
  });

  it('案内がなかったころの保存データ（前から遊んでいる人）には、案内も説明も出さない', () => {
    const old = { ...createState(), help: undefined };
    const s = normalizeState(JSON.parse(JSON.stringify(old)));
    expect(s.help.tutorialDone).toBe(true);
    expect(s.help.seen).toEqual(INTRO_KEYS);
  });

  it('保存した進み具合を読み込み、知らない説明の名前は捨てる', () => {
    const saved = { ...createState(), help: { tutorialDone: true, seen: ['dive', 'nothing', 3, 'dress', 'dive'] } };
    const s = normalizeState(JSON.parse(JSON.stringify(saved)));
    expect(s.help.tutorialDone).toBe(true);
    expect(s.help.seen).toEqual(['dive', 'dress']);
  });

  it('初めての説明は1回だけ', () => {
    const s = createState();
    expect(markSeen(s, 'dive')).toBe(true);
    expect(markSeen(s, 'dive')).toBe(false);
    expect(hasSeen(s, 'dive')).toBe(true);
    expect(hasSeen(s, 'decor')).toBe(false);
  });

  it('もう一度見る：案内と説明をやり直せる', () => {
    const s = createState();
    finishTutorial(s);
    markSeen(s, 'play');
    restartTutorial(s);
    expect(s.help.tutorialDone).toBe(false);
    expect(s.help.seen).toEqual([]);
  });
});

describe('案内の文章', () => {
  it('初めての説明は、すべての機能の分そろっている', () => {
    for (const key of INTRO_KEYS) {
      expect(INTROS[key].title).toBeTruthy();
      expect(INTROS[key].lines.length).toBeGreaterThan(0);
    }
  });

  it('あそびかたの項目は、名前が重ならず中身がある', () => {
    const ids = HELP_SECTIONS.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const s of HELP_SECTIONS) expect(s.lines.length).toBeGreaterThan(0);
  });

  it('Tips は遊びのコツと豆知識の両方があり、同じ文がない', () => {
    expect(TIPS.some((t) => t.kind === 'play')).toBe(true);
    expect(TIPS.some((t) => t.kind === 'sea')).toBe(true);
    expect(new Set(TIPS.map((t) => t.text)).size).toBe(TIPS.length);
  });

  it('Tips は前回と同じものを続けて出さない', () => {
    const last = TIPS[0].text;
    for (let i = 0; i < 50; i++) expect(pickTip(TIPS, last).text).not.toBe(last);
    // 1つしかなければ、それを出す
    expect(pickTip([TIPS[0]], last)).toBe(TIPS[0]);
  });
});
