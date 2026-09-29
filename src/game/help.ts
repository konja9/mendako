// 案内の進み具合（チュートリアル・初めての説明）と Tips の選び方。

import type { IntroKey } from './data/intro-keys';
import type { Tip } from './data/help';
import type { GameState } from './state';

export function hasSeen(state: GameState, key: IntroKey) {
  return state.help.seen.includes(key);
}

/** 説明を見たことにする。初めてだったら true */
export function markSeen(state: GameState, key: IntroKey) {
  if (state.help.seen.includes(key)) return false;
  state.help.seen.push(key);
  return true;
}

export function finishTutorial(state: GameState) {
  state.help.tutorialDone = true;
}

/** はじめの案内と、初めて使うときの説明を、もう一度見られるようにする */
export function restartTutorial(state: GameState) {
  state.help.tutorialDone = false;
  state.help.seen = [];
}

/** Tips を1つ選ぶ。前回と同じものは避ける */
export function pickTip(tips: Tip[], last: string | null, rng: () => number = Math.random): Tip {
  const pool = tips.length > 1 ? tips.filter((t) => t.text !== last) : tips;
  return pool[Math.floor(rng() * pool.length)];
}
