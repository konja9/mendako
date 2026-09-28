// 画面の操作 → ゲームのルール → 保存・演出 をつなぐ。
// UI（Svelte）はここの関数を呼び、描画（Pixi）は store と bus を見て動く。

import { get } from 'svelte/store';
import * as Care from '../game/care';
import type { FoodId } from '../game/data/care';
import { DECOR_BY_ID, FLOOR_BY_ID, MAX_PLACED } from '../game/data/decor';
import * as Decor from '../game/decor';
import { clearSave, loadSave, writeSave } from '../game/save';
import { createState, normalizeState } from '../game/state';
import { createStore } from '../game/store';
import * as Visitors from '../game/visitors';
import { bus, type ScreenPoint } from './events';
import { catchHud, decorSelected, mode, pendingBuy, sheet, tryOn, type SheetKind } from './ui-state';

export const game = createStore(normalizeState(loadSave()), writeSave);
const away = game.update((s) => ({ ...Care.tick(s), arrivals: Visitors.rollVisitors(s) }));

const FAIL: Record<string, string> = {
  sleeping: '寝てるよ。そっとしておこう',
  full: 'おなかいっぱいみたい',
  tired: 'つかれてるみたい。寝かせてあげよう',
};

const LINES: Record<Care.Condition, string[]> = {
  hungry: ['おなかすいたなぁ…', 'ヨコエビ食べたい…'],
  tired: ['ねむたい…', 'ふぁ〜あ'],
  sad: ['かまってほしいな', 'さみしいよ〜'],
  great: ['ぷかぷか〜♪', '今日もごきげん！', 'マリンスノー、きれいだね'],
  normal: ['ぷかぷか〜', 'ヒレをぱたぱた', '水深400メートルは静かだね', 'マリンスノーが降ってる'],
  sleep: [],
};

const pearlsShort = (need = 0) => `真珠があと${need}個たりないよ`;

function celebrateLater(stageUp: Care.StageInfo | null, delay = 700) {
  if (stageUp) setTimeout(() => bus.emit('celebrate', stageUp), delay);
}

// ---------- お世話 ----------

export function petMendako(point: ScreenPoint | null = null) {
  const result = game.update((s) => Care.pet(s));
  if (!result.ok) {
    if (result.reason === 'tickled') {
      bus.emit('express', { expression: 'tickled', ms: 1400 });
      bus.emit('say', { text: 'くすぐったい〜！', ms: 1800 });
    } else {
      bus.emit('toast', FAIL[result.reason]);
    }
    return;
  }
  bus.emit('squish');
  bus.emit('express', { expression: 'happy', ms: 1200 });
  bus.emit('hearts', point);
  if (Math.random() < 0.3) bus.emit('say', { text: ['えへへ', 'もっと〜', 'ふにゃ'][Math.floor(Math.random() * 3)], ms: 1600 });
  celebrateLater(result.stageUp);
}

export async function feedFood(foodId: FoodId) {
  const result = game.update((s) => Care.feed(s, foodId));
  if (!result.ok) {
    bus.emit('toast', result.reason === 'pearls' ? pearlsShort(result.need) : FAIL[result.reason]);
    return;
  }
  sheet.set(null);
  // ごはんが落ちてくる演出を待つ（描画側が応答しなくても先へ進める）
  await new Promise<void>((resolve) => {
    const timer = setTimeout(resolve, 1600);
    bus.emit('feed', {
      foodId,
      done: () => {
        clearTimeout(timer);
        resolve();
      },
    });
  });
  bus.emit('express', { expression: 'eat', ms: 1300 });
  bus.emit('sparkle', 3);
  setTimeout(() => bus.emit('express', { expression: 'happy', ms: 1200 }), 1300);
  bus.emit('toast', `${result.food.name}を食べた！ おなか +${result.food.hunger}`);
  if (foodId === 'amphipod') bus.emit('say', { text: 'だいすき〜！', ms: 2000 });
  celebrateLater(result.stageUp);
}

export function toggleSleep() {
  const { sleeping } = game.update((s) => Care.toggleSleep(s));
  bus.emit('toast', sleeping ? 'おやすみ… げんきがたまるよ' : 'おはよう！');
}

// ---------- ミニゲーム ----------

let lastPlay: Care.PlayResult | null = null;

export function startPlay() {
  const check = Care.canPlay(game.get());
  if (!check.ok) {
    bus.emit('toast', FAIL[check.reason]);
    return;
  }
  lastPlay = null;
  sheet.set(null);
  catchHud.set({ phase: 'intro', count: '3', time: 30, score: 0, pearls: 0, result: null });
  mode.set('catch');
}

/** ミニゲームが終わったときに描画側から呼ばれる */
export function finishCatch(score: number, pearls: number) {
  lastPlay = game.update((s) => Care.finishPlay(s, { score, pearls }));
  catchHud.update((hud) => ({ ...hud, phase: 'result', result: { score, reward: lastPlay!.reward, isBest: lastPlay!.isBest } }));
}

/** 途中でやめる（報酬なし・げんきも減らない） */
export function quitCatch() {
  lastPlay = null;
  mode.set('home');
}

export function leaveCatch() {
  mode.set('home');
  if (lastPlay) {
    bus.emit('express', { expression: 'happy', ms: 1500 });
    celebrateLater(lastPlay.stageUp, 500);
  }
  lastPlay = null;
}

// ---------- シート ----------

/** シートを開く（前のシートの試着や選択は片付ける） */
export function openSheet(kind: SheetKind) {
  closeSheet();
  sheet.set(kind);
}

export function closeSheet() {
  sheet.set(null);
  tryOn.set(null);
  decorSelected.set(null);
  pendingBuy.set(null);
}

// ---------- きせかえ ----------

/** 持っているものは着る／外す。持っていないものは試着する（もう一度で試着をやめる） */
export function chooseOutfit(itemId: string) {
  if (game.get().owned.includes(itemId)) {
    tryOn.set(null);
    game.update((s) => Care.equip(s, itemId));
  } else {
    tryOn.set(get(tryOn) === itemId ? null : itemId);
  }
  bus.emit('squish');
}

export function buyTryOn() {
  const id = get(tryOn);
  if (!id) return;
  const result = game.update((s) => {
    const r = Care.buy(s, id);
    if (r.ok) Care.equip(s, id);
    return r;
  });
  if (!result.ok) {
    bus.emit('toast', result.reason === 'pearls' ? pearlsShort(result.need) : '買えなかったよ');
    return;
  }
  tryOn.set(null);
  bus.emit('toast', `${result.item.name}を買ったよ！`);
  bus.emit('express', { expression: 'happy', ms: 1400 });
  bus.emit('sparkle', 4);
}

// ---------- 模様替え ----------

const DECOR_FAIL: Record<string, string> = {
  'none-left': '持っている分は全部置いてあるよ',
  full: `水槽に置けるのは${MAX_PLACED}個までだよ`,
};

/** 一覧で飾りを押したとき：持っていれば置く、なければ「買う？」を出す */
export function chooseDecor(id: string) {
  const state = game.get();
  if ((state.decor.owned[id] ?? 0) === 0) {
    pendingBuy.set({ kind: 'decor', id });
    return;
  }
  pendingBuy.set(null);
  const result = game.update((s) => Decor.placeDecor(s, id));
  if (!result.ok) {
    bus.emit('toast', DECOR_FAIL[result.reason] ?? '置けなかったよ');
    return;
  }
  decorSelected.set(result.uid);
}

export function chooseFloor(id: string) {
  if (!game.get().decor.floors.includes(id)) {
    pendingBuy.set({ kind: 'floor', id });
    return;
  }
  pendingBuy.set(null);
  game.update((s) => Decor.setFloor(s, id));
}

/** 「買う？」で買う。飾りはそのまま水槽に置く */
export function buyPending() {
  const pending = get(pendingBuy);
  if (!pending) return;
  const result = game.update((s) => (pending.kind === 'decor' ? Decor.buyDecor(s, pending.id) : Decor.buyFloor(s, pending.id)));
  if (!result.ok) {
    bus.emit('toast', result.reason === 'pearls' ? pearlsShort(result.need) : '買えなかったよ');
    return;
  }
  pendingBuy.set(null);
  bus.emit('toast', `${result.def.name}を買ったよ！`);
  if (pending.kind === 'decor') chooseDecor(pending.id);
}

export function moveDecor(uid: string, x: number, y: number) {
  game.update((s) => Decor.moveDecor(s, uid, x, y));
}

export function flipSelectedDecor() {
  const uid = get(decorSelected);
  if (uid) game.update((s) => Decor.flipDecor(s, uid));
}

export function storeSelectedDecor() {
  const uid = get(decorSelected);
  if (!uid) return;
  game.update((s) => Decor.storeDecor(s, uid));
  decorSelected.set(null);
}

export const decorName = (id: string) => DECOR_BY_ID[id]?.name ?? FLOOR_BY_ID[id]?.name ?? '';

// ---------- 来訪・図鑑 ----------

export function meetVisitor(uid: string, point: ScreenPoint | null) {
  const result = game.update((s) => Visitors.meetVisitor(s, uid));
  if (!result.ok) return;
  bus.emit('hearts', point);
  if (result.isNew) {
    bus.emit('toast', `図鑑に「${result.def.name}」が載ったよ！`);
    bus.emit('say', { text: `${result.def.name}、はじめまして！`, ms: 2600 });
    bus.emit('sparkle', 5);
  } else if (!result.gift) {
    bus.emit('toast', `${result.def.name}がのんびりしてるよ`);
  }
  if (result.gift) {
    setTimeout(() => bus.emit('toast', `おみやげに真珠を${result.gift}個もらったよ`), result.isNew ? 2200 : 0);
  }
}

function announceArrivals(arrivals: { id: string }[]) {
  if (!arrivals.length) return;
  const names = arrivals.map((a) => Visitors.creatureName(a.id));
  bus.emit('toast', arrivals.length === 1 ? `${names[0]}が遊びに来たよ` : `${names.length}匹が遊びに来たよ`);
}

// ---------- 設定 ----------

export function rename(name: string) {
  const result = game.update((s) => Care.rename(s, name));
  bus.emit('toast', result.ok ? `名前を「${result.name}」にしたよ` : '名前を入れてね');
}

export const dev = {
  advanceHour() {
    const r = game.update((s) => {
      s.lastTick -= 60 * 60_000;
      s.lastVisitRoll -= 60 * 60_000;
      for (const v of s.visitors) v.leavesAt -= 60 * 60_000;
      return { ...Care.tick(s), arrivals: Visitors.rollVisitors(s) };
    });
    bus.emit('toast', r.wokeUp ? '1時間たった。起きたよ！' : '1時間たったよ');
    if (r.arrivals.length) setTimeout(() => announceArrivals(r.arrivals), 1500);
  },
  addPearls() {
    game.update((s) => {
      s.pearls += 100;
    });
    bus.emit('toast', '真珠 +100');
  },
  callVisitor() {
    const result = game.update((s) => Visitors.callVisitor(s));
    if (!result.ok) bus.emit('toast', result.reason === 'full' ? 'もう3匹来ているよ' : '来られる生き物がいないみたい');
    else announceArrivals([result.visitor]);
    sheet.set(null);
  },
  addExp() {
    const stageUp = game.update((s) => Care.gainExp(s, 100, { ignoreCondition: true }));
    if (stageUp) {
      sheet.set(null);
      celebrateLater(stageUp, 300);
    } else {
      bus.emit('toast', 'なかよし +100');
    }
  },
};

export function resetAll() {
  clearSave();
  game.replace(createState());
  sheet.set(null);
  tryOn.set(null);
  bus.emit('toast', '最初から始めるよ');
}

// ---------- 時間の流れ ----------

function chatter() {
  const state = game.get();
  const condition = Care.conditionOf(state);
  const lines = LINES[condition];
  if (lines.length && !get(sheet) && get(mode) === 'home' && !document.hidden) {
    bus.emit('say', { text: lines[Math.floor(Math.random() * lines.length)] });
  }
  const urgent = condition === 'hungry' || condition === 'tired' || condition === 'sad';
  setTimeout(chatter, (urgent ? 9000 : 16000) + Math.random() * 8000);
}

export function startLoops() {
  const step = () => {
    const r = game.update((s) => ({ ...Care.tick(s), arrivals: Visitors.rollVisitors(s) }));
    if (r.wokeUp) bus.emit('toast', 'ぐっすり寝て、げんきいっぱい！');
    announceArrivals(r.arrivals);
  };
  setInterval(step, 3000);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) step();
  });

  setTimeout(chatter, 6000);

  const state = game.get();
  const waiting = state.visitors.filter((v) => !v.met).length;
  if (away.minutes > 20) {
    bus.emit('toast', waiting ? `おかえり！ 水槽にお客さんが来てるよ` : away.wokeUp ? 'おかえり！ ぐっすり寝てげんきだよ' : 'おかえり！');
  } else if (state.counts.fed + state.counts.petted === 0) {
    setTimeout(() => bus.emit('say', { text: `はじめまして、${state.name}だよ。タップするとなでられるよ`, ms: 4200 }), 800);
  } else {
    announceArrivals(away.arrivals);
  }
}
