// 音とゲームの状態をつなぐ。設定を反映し、場面（水槽・おやすみ・ミニゲーム・探索）に合わせて BGM の雰囲気を変える。
// 一つひとつの効果音は、出来事が起きる場所（actions や各シーン）から playSfx で鳴らす。

import { derived } from 'svelte/store';
import { applySoundSettings, initAudio, setMood, type Mood } from '../audio';
import { ZONE_BY_ID } from '../game/data/zones';
import { game } from './actions';
import { settings } from './settings';
import { diveHud, mode } from './ui-state';

export function startSound() {
  initAudio();
  settings.subscribe(applySoundSettings);

  const scene = derived([mode, game, diveHud], ([$mode, $game, $dive]): { mood: Mood; depth: number } => {
    if ($mode === 'catch') return { mood: 'catch', depth: 0 };
    if ($mode === 'dive') {
      const zone = ZONE_BY_ID[$dive.zoneId];
      const k = zone ? ($dive.depth - zone.top) / (zone.bottom - zone.top) : 0;
      // 探索は、ゾーンの深さの割合を 0.05 刻みにして、細かく変わりすぎないようにする
      return { mood: 'dive', depth: Math.round(Math.min(1, Math.max(0, k)) * 20) / 20 };
    }
    return { mood: $game.sleeping ? 'sleep' : 'tank', depth: 0 };
  });
  scene.subscribe(({ mood, depth }) => setMood(mood, depth));
}
