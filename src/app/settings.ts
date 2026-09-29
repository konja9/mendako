// 端末ごとの設定（音など）。ゲームの記録とは別のキーに保存する。
// 保存できない環境（プライベートモード等）でも、その場では設定どおりに動く。

import { writable } from 'svelte/store';

export interface Settings {
  /** 効果音 */
  sfx: boolean;
  /** BGM */
  bgm: boolean;
  /** 全体の音量（0〜1） */
  volume: number;
}

const KEY = 'shinkai-pukapuka.settings';

export const DEFAULT_SETTINGS: Settings = { sfx: true, bgm: true, volume: 0.8 };

/** 読み込んだ値の足りない所・おかしな所を既定値で補う */
export function normalizeSettings(raw: unknown): Settings {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const volume = typeof r.volume === 'number' && Number.isFinite(r.volume) ? Math.min(1, Math.max(0, r.volume)) : DEFAULT_SETTINGS.volume;
  return {
    sfx: typeof r.sfx === 'boolean' ? r.sfx : DEFAULT_SETTINGS.sfx,
    bgm: typeof r.bgm === 'boolean' ? r.bgm : DEFAULT_SETTINGS.bgm,
    volume,
  };
}

function load(): Settings {
  try {
    const raw = localStorage.getItem(KEY);
    return normalizeSettings(raw ? JSON.parse(raw) : null);
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export const settings = writable<Settings>(load());

settings.subscribe((value) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(value));
  } catch {
    // 保存できなくても、その場の設定は使える
  }
});
