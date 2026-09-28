// 保存しない「画面の状態」。Svelte と Pixi の両方から読む。

import { writable } from 'svelte/store';
import type { ScreenPoint } from './events';

export type Mode = 'home' | 'catch' | 'dive';
export type SheetKind = 'food' | 'dress' | 'settings' | 'decor' | 'zukan' | 'dive';

export const mode = writable<Mode>('home');
export const sheet = writable<SheetKind | null>(null);
/** きせかえで試着中のアイテム */
export const tryOn = writable<string | null>(null);
/** 模様替えで選んでいる飾り（uid） */
export const decorSelected = writable<string | null>(null);
/** 模様替え・きせかえで「買う？」と聞いているもの */
export const pendingBuy = writable<{ kind: 'decor' | 'floor'; id: string } | null>(null);
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

export interface DiveHud {
  phase: 'intro' | 'play' | 'result';
  zoneId: string;
  depth: number;
  /** 探検ゲージ（0〜100） */
  gauge: number;
  light: boolean;
  met: number;
  items: number;
  /** 直前に出会った生き物の名前（「であえた！」の表示用） */
  lastMet: { name: string; at: number } | null;
  result: {
    reachedBottom: boolean;
    maxDepth: number;
    newBest: boolean;
    met: { id: string; name: string; isNew: boolean }[];
    materials: { name: string; count: number }[];
    materialPearls: number;
    trashPearls: number;
    bonus: number;
    halved: boolean;
    pearls: number;
  } | null;
}

export const diveHud = writable<DiveHud>({
  phase: 'intro',
  zoneId: 'meso',
  depth: 0,
  gauge: 100,
  light: true,
  met: 0,
  items: 0,
  lastMet: null,
  result: null,
});

/** 描画側が提供する「めんだこの頭の位置（画面座標）」。ふきだしの位置合わせに使う */
export const worldLink: {
  mendakoHead: () => ScreenPoint | null;
  /** 選んでいる飾りの画面上の範囲（模様替えのボタンの位置合わせ用） */
  decorRect: (uid: string) => { x: number; y: number; width: number; height: number } | null;
} = {
  mendakoHead: () => null,
  decorRect: () => null,
};
