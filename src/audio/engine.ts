// 音を鳴らす土台。AudioContext は1つだけ作り、効果音用と BGM 用に音量の通り道を分ける。
// ブラウザの決まりで、音は最初のタップ（かキー入力）のあとからしか鳴らせない。
// 別のアプリやタブに移ったら止め、戻ってきたら再開する。

export interface AudioOut {
  ctx: AudioContext;
  sfx: AudioNode;
  bgm: AudioNode;
}

let out: AudioOut | null = null;
let sfxGain: GainNode | null = null;
let bgmGain: GainNode | null = null;
let levels = { sfx: 0, bgm: 0 };

/** 効果音・BGM の基準の大きさ。スマホのスピーカーで聞き取りやすく、割れない大きさに合わせてある */
export const SFX_GAIN = 2.2;
export const BGM_GAIN = 1.2;
const readyListeners: ((out: AudioOut) => void)[] = [];

type AudioContextCtor = typeof AudioContext;
const Ctor: AudioContextCtor | undefined =
  typeof window === 'undefined'
    ? undefined
    : (window.AudioContext ?? (window as unknown as { webkitAudioContext?: AudioContextCtor }).webkitAudioContext);

/** 鳴らせる状態なら通り道を返す（まだタップされていない・止めている間は null） */
export function audioOut(): AudioOut | null {
  return out && out.ctx.state === 'running' ? out : null;
}

/** 通り道ができたとき（最初のタップ）に呼んでほしい処理を登録する */
export function onAudioReady(fn: (out: AudioOut) => void) {
  if (out) fn(out);
  else readyListeners.push(fn);
}

/** 効果音・BGM の音量（0〜1）。なめらかに変える */
export function setLevels(next: { sfx: number; bgm: number }) {
  levels = next;
  if (!out || !sfxGain || !bgmGain) return;
  const t = out.ctx.currentTime;
  sfxGain.gain.setTargetAtTime(next.sfx * SFX_GAIN, t, 0.05);
  bgmGain.gain.setTargetAtTime(next.bgm * BGM_GAIN, t, 0.08);
}

function create() {
  if (!Ctor) return;
  // iPhone：マナーモードでは鳴らさず、ほかのアプリの音楽も止めない
  const session = (navigator as unknown as { audioSession?: { type: string } }).audioSession;
  if (session) session.type = 'ambient';

  const ctx = new Ctor({ latencyHint: 'interactive' });
  // 音が重なっても割れないように、最後に軽くおさえる
  const limiter = ctx.createDynamicsCompressor();
  limiter.threshold.value = -8;
  limiter.knee.value = 6;
  limiter.ratio.value = 6;
  limiter.attack.value = 0.003;
  limiter.release.value = 0.2;
  limiter.connect(ctx.destination);

  sfxGain = ctx.createGain();
  bgmGain = ctx.createGain();
  sfxGain.gain.value = levels.sfx * SFX_GAIN;
  bgmGain.gain.value = levels.bgm * BGM_GAIN;
  sfxGain.connect(limiter);
  bgmGain.connect(limiter);
  out = { ctx, sfx: sfxGain, bgm: bgmGain };
  for (const fn of readyListeners.splice(0)) fn(out);
}

let installed = false;

/** 最初のタップで音を使えるようにし、画面の出入りで止めたり再開したりする */
export function installAudio() {
  if (installed || !Ctor) return;
  installed = true;

  const wake = () => {
    if (document.hidden) return;
    if (!out) create();
    if (out && out.ctx.state !== 'running') out.ctx.resume().catch(() => {});
  };
  // iPhone は電話などで止められたあと、次のタップで再開が必要なことがあるので、ずっと見ておく。
  // 端末によって「音を許すきっかけ」になる操作が違うので、いくつか見る
  for (const type of ['pointerdown', 'touchend', 'click', 'keydown']) {
    window.addEventListener(type, wake, { capture: true, passive: true });
  }

  document.addEventListener('visibilitychange', () => {
    if (!out) return;
    if (document.hidden) out.ctx.suspend().catch(() => {});
    else out.ctx.resume().catch(() => {});
  });
}
