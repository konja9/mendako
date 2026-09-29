// 音の入口。ゲームのほかの部分はここの関数だけを使う。
// 音が使えない環境（古い端末・テスト）や、まだタップされていないときは、何もしない。

import { Ambient } from './ambient';
import { audioOut, installAudio, onAudioReady, setLevels } from './engine';
import type { Mood } from './score';
import { SFX, type SfxId, type SfxOptions } from './sfx';

export type { Mood } from './score';
export type { SfxId } from './sfx';

let ambient: Ambient | null = null;
const wanted = { mood: 'tank' as Mood, depth: 0, bgm: true };

export function playSfx(id: SfxId, opts: SfxOptions = {}) {
  const out = audioOut();
  if (!out) return;
  try {
    SFX[id](out.ctx, out.sfx, out.ctx.currentTime + 0.005, opts.pitch ?? 1);
  } catch {
    // 音が鳴らせなくても、遊びは止めない
  }
}

/** BGM の雰囲気を変える（depth は探索でどこまで潜ったか 0〜1） */
export function setMood(mood: Mood, depth = 0) {
  wanted.mood = mood;
  wanted.depth = depth;
  ambient?.setMood(mood, depth);
}

export function applySoundSettings(s: { sfx: boolean; bgm: boolean; volume: number }) {
  setLevels({ sfx: s.sfx ? s.volume : 0, bgm: s.bgm ? s.volume : 0 });
  wanted.bgm = s.bgm;
  ambient?.setEnabled(s.bgm);
}

export function initAudio() {
  installAudio();
  onAudioReady((out) => {
    ambient = new Ambient(out.ctx, out.bgm);
    ambient.setEnabled(wanted.bgm);
    ambient.setMood(wanted.mood, wanted.depth);
    ambient.start();
  });
}
