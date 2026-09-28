// 起動：画面の部品（Svelte）を置いてから、その下に水槽（Pixi）を描く。

// 公開ページなど eval が禁止された環境でも Pixi を動かすため
import 'pixi.js/unsafe-eval';
import { mount } from 'svelte';
import { startLoops } from './app/actions';
import App from './ui/App.svelte';
import './ui/global.css';
import { World } from './world/stage';

// 日本語の文節で改行させるため（word-break: auto-phrase は lang="ja" が必要）
document.documentElement.lang = 'ja';
// iOS Safari のピンチ拡大を止める
document.addEventListener('gesturestart', (e) => e.preventDefault());

mount(App, { target: document.getElementById('app')! });

const host = document.getElementById('world')!;
const measureFloor = () => {
  const actions = document.querySelector('.actions');
  // 下のボタンの少し上を海底の線にする（手前の飾りがボタンに隠れないように）
  return actions ? actions.getBoundingClientRect().top - 14 : window.innerHeight - 120;
};

const world = new World({
  host,
  reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  measureFloor,
});

// 開発サーバーのときだけ、確認用に描画の中身をのぞけるようにする
if (import.meta.env.DEV) (window as unknown as { __world: World }).__world = world;

try {
  await world.init();
  // 文字の読み込みやアドレスバーの出入りで、下のボタンの位置が変わったら測り直す
  const actions = document.querySelector('.actions');
  if (actions) new ResizeObserver(() => world.resize()).observe(actions);
  document.fonts?.ready.then(() => world.resize());
} catch (error) {
  console.error(error);
  host.innerHTML = '<p class="world-error">この端末では水槽を表示できませんでした。<br>ブラウザを新しくしてお試しください。</p>';
}

startLoops();
