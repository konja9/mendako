// ゲーム状態の入れ物。更新 → 保存 → 購読者（Svelte の画面・Pixi の描画）へ通知する。
// Svelte の store 契約（subscribe）を満たすので、コンポーネントでは $game で読める。

import type { GameState } from './state';

type Listener = (state: GameState) => void;

export interface GameStore {
  get(): GameState;
  subscribe(listener: Listener): () => void;
  /** state を書き換える関数を実行し、その戻り値を返す。変更は保存・通知される。 */
  update<R>(mutate: (state: GameState) => R): R;
  /** 状態を丸ごと差し替える（データのリセットなど） */
  replace(state: GameState): void;
}

export function createStore(initial: GameState, persist: (state: GameState) => void): GameStore {
  let state = initial;
  const listeners = new Set<Listener>();

  const notify = () => {
    // 参照を変えて、Svelte に「変わった」と伝える
    state = { ...state };
    persist(state);
    for (const listener of listeners) listener(state);
  };

  return {
    get: () => state,
    subscribe(listener) {
      listeners.add(listener);
      listener(state);
      return () => listeners.delete(listener);
    },
    update(mutate) {
      const result = mutate(state);
      notify();
      return result;
    },
    replace(next) {
      state = next;
      notify();
    },
  };
}
