// スタート画面 → （はじめての人は）名前をつける → はじめの案内 の流れと、初めて使うときの説明。

import { get } from 'svelte/store';
import { playSfx } from '../audio';
import type { IntroKey } from '../game/data/intro-keys';
import * as Care from '../game/care';
import * as Help from '../game/help';
import { closeSheet, game, greet } from './actions';
import { bus } from './events';
import { introCard, mode, naming, tutorialStep, type TutorialStep } from './ui-state';

const ORDER: TutorialStep[] = ['pet', 'food', 'status', 'actions'];

/** スタート画面で「はじめる」 */
export function startFromTitle() {
  if (get(mode) !== 'title') return;
  mode.set('home');
  const state = game.get();
  if (!state.help.tutorialDone) naming.set(true);
  else greet();
}

/** 名前を決めたら、はじめの案内へ */
export function confirmName(name: string) {
  const trimmed = name.trim();
  if (trimmed && trimmed !== game.get().name) game.update((s) => Care.rename(s, trimmed));
  naming.set(false);
  playSfx('discover');
  startTutorial();
}

function startTutorial() {
  closeSheet();
  tutorialStep.set('pet');
}

export function nextTutorial() {
  const step = get(tutorialStep);
  if (!step) return;
  const next = ORDER[ORDER.indexOf(step) + 1];
  if (next) {
    tutorialStep.set(next);
    playSfx('tap');
  } else {
    endTutorial();
  }
}

function endTutorial() {
  tutorialStep.set(null);
  game.update((s) => Help.finishTutorial(s));
  playSfx('wake');
  bus.emit('say', { text: 'これからよろしくね！', ms: 2600 });
}

/** 案内をとばす */
export function skipTutorial() {
  tutorialStep.set(null);
  game.update((s) => Help.finishTutorial(s));
}

/** あそびかたから：はじめの案内と初めての説明を、もう一度 */
export function restartGuide() {
  game.update((s) => Help.restartTutorial(s));
  startTutorial();
}

/**
 * その機能を初めて使うときだけ、説明カードを出す。
 * then は、説明を閉じたあとに続ける操作（説明を出さなかったときは呼ばない。呼んだ側がそのまま続ける）。
 * 説明を出したら true。
 */
export function showIntro(key: IntroKey, then?: () => void): boolean {
  const state = game.get();
  // はじめの案内の途中や、まだ始めていないときは出さない（あとで出す）
  if (!state.help.tutorialDone || get(tutorialStep) || get(naming) || get(mode) === 'title' || Help.hasSeen(state, key)) {
    return false;
  }
  introCard.set({ key, then });
  return true;
}

export function closeIntro() {
  const card = get(introCard);
  if (!card) return;
  game.update((s) => Help.markSeen(s, card.key));
  introCard.set(null);
  card.then?.();
}

/** 案内の進み具合を見張る：なでたら・ごはんをあげたら次へ */
export function startOnboarding() {
  let last = { ...game.get().counts };
  game.subscribe((state) => {
    const step = get(tutorialStep);
    if (step === 'pet' && state.counts.petted > last.petted) setTimeout(nextTutorial, 900);
    if (step === 'food' && state.counts.fed > last.fed) setTimeout(nextTutorial, 1800);
    last = { ...state.counts };
  });
}
