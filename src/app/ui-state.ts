// 保存しない「画面の状態」。Svelte と Pixi の両方から読む。

import { writable } from 'svelte/store';
import type { ScreenPoint } from './events';

export type Mode = 'home' | 'catch';
export type SheetKind = 'food' | 'dress' | 'settings';

export const mode = writable<Mode>('home');
export const sheet = writable<SheetKind | null>(null);
/** きせかえで試着中のアイテム */
export const tryOn = writable<string | null>(null);
/** 画面下を覆っているシートの高さ（px）。水槽をその分持ち上げる */
export const bottomInset = writable(0);

export interface CatchHud {
  phase: 'intro' | 'play' | 'result';
  count: string;
  time: number;
  score: number;
  pearls: number;
  result: { score: number; reward: number; isBest: boolean } | null;
}

export const catchHud = writable<CatchHud>({ phase: 'intro', count: '3', time: 30, score: 0, pearls: 0, result: null });

/** 描画側が提供する「めんだこの頭の位置（画面座標）」。ふきだしの位置合わせに使う */
export const worldLink: { mendakoHead: () => ScreenPoint | null } = {
  mendakoHead: () => null,
};
