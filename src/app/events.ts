// 画面（Svelte）と描画（Pixi）の間で「演出」を伝えるための小さなイベントバス。
// ゲームの状態そのものは store で共有し、ここでは一度きりの出来事だけを流す。

import type { StageInfo } from '../game/care';
import type { FoodId } from '../game/data/care';
import type { Expression } from '../art/mendako';

export interface ScreenPoint {
  x: number;
  y: number;
}

export interface GameEvents {
  toast: string;
  say: { text: string; ms?: number };
  express: { expression: Expression; ms: number };
  squish: void;
  hearts: ScreenPoint | null;
  sparkle: number;
  /** ごはんを落とす演出。終わったら done を呼ぶ */
  feed: { foodId: FoodId; done: () => void };
  celebrate: StageInfo;
  /** 探索：ライトの切り替え・浮上する */
  diveLight: boolean;
  diveSurface: void;
}

type Handler<T> = (payload: T) => void;

function createBus<E>() {
  const handlers = new Map<keyof E, Set<Handler<never>>>();
  return {
    on<K extends keyof E>(type: K, handler: Handler<E[K]>): () => void {
      if (!handlers.has(type)) handlers.set(type, new Set());
      handlers.get(type)!.add(handler as Handler<never>);
      return () => handlers.get(type)?.delete(handler as Handler<never>);
    },
    emit<K extends keyof E>(type: K, ...payload: E[K] extends void ? [] : [E[K]]): void {
      for (const handler of handlers.get(type) ?? []) (handler as Handler<E[K] | undefined>)(payload[0]);
    },
  };
}

export const bus = createBus<GameEvents>();
