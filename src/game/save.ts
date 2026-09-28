// localStorage への保存。使えない環境（プライベートモード等）でもゲームは動く。

import { serialize, type GameState } from './state';

const KEY = 'shinkai-pukapuka.save';
// 最初のプロトタイプ（v0.1）が使っていたキー。見つかれば引き継ぐ。
const LEGACY_KEYS = ['shinkai-pukapuka.save.v1'];

export function loadSave(): unknown {
  try {
    for (const key of [KEY, ...LEGACY_KEYS]) {
      const raw = localStorage.getItem(key);
      if (raw) return JSON.parse(raw);
    }
  } catch {
    // 読めなければ新しく始める
  }
  return null;
}

export function writeSave(state: GameState): boolean {
  try {
    localStorage.setItem(KEY, serialize(state));
    return true;
  } catch {
    return false;
  }
}

export function clearSave(): void {
  try {
    for (const key of [KEY, ...LEGACY_KEYS]) localStorage.removeItem(key);
  } catch {
    // 保存できない環境では消すものもない
  }
}
