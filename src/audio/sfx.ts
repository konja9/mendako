// 効果音。音声ファイルは使わず、発振器とノイズをその場で組み合わせて作る。
// どれも「ぷかぷか」した、やわらかい音にする（大きな音・鋭い音は使わない）。

export type SfxId =
  | 'tap'
  | 'nope'
  | 'pet'
  | 'drop'
  | 'munch'
  | 'sleep'
  | 'wake'
  | 'buy'
  | 'equip'
  | 'place'
  | 'flip'
  | 'store'
  | 'visitor'
  | 'hello'
  | 'discover'
  | 'levelUp'
  | 'count'
  | 'go'
  | 'catch'
  | 'pearl'
  | 'miss'
  | 'finish'
  | 'diveStart'
  | 'meet'
  | 'pickup'
  | 'trash'
  | 'bump'
  | 'flee'
  | 'light'
  | 'bottom'
  | 'surface';

export interface SfxOptions {
  /** 音の高さの倍率（続けて取るほど高くする、など） */
  pitch?: number;
}

type Recipe = (ctx: BaseAudioContext, out: AudioNode, t: number, pitch: number) => void;

// ---------- 部品 ----------

/** MIDI の音番号 → 周波数 */
export const hz = (midi: number) => 440 * 2 ** ((midi - 69) / 12);

interface ToneOptions {
  freq: number;
  /** 終わりの高さ（指定すると、なめらかに変わる） */
  to?: number;
  type?: OscillatorType;
  gain?: number;
  attack?: number;
  decay: number;
  /** 高さが変わるまでの時間（省略時は decay と同じ） */
  glide?: number;
}

function tone(ctx: BaseAudioContext, out: AudioNode, t: number, o: ToneOptions) {
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = o.type ?? 'sine';
  osc.frequency.setValueAtTime(o.freq, t);
  if (o.to) osc.frequency.exponentialRampToValueAtTime(o.to, t + (o.glide ?? o.decay));
  const peak = o.gain ?? 0.3;
  const attack = o.attack ?? 0.005;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + attack + o.decay);
  osc.connect(g).connect(out);
  osc.start(t);
  osc.stop(t + attack + o.decay + 0.05);
}

/** ガラスの鈴のような音（基音＋少し高い倍音） */
function bell(ctx: BaseAudioContext, out: AudioNode, t: number, freq: number, gain = 0.18, decay = 0.9) {
  tone(ctx, out, t, { freq, gain, decay });
  tone(ctx, out, t, { freq: freq * 2.76, gain: gain * 0.25, decay: decay * 0.35 });
}

const noiseBuffers = new WeakMap<BaseAudioContext, AudioBuffer>();

/** 使い回す白色ノイズ（1秒） */
export function noiseBuffer(ctx: BaseAudioContext) {
  let buf = noiseBuffers.get(ctx);
  if (!buf) {
    buf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    noiseBuffers.set(ctx, buf);
  }
  return buf;
}

interface NoiseOptions {
  dur: number;
  gain?: number;
  filter?: BiquadFilterType;
  freq: number;
  to?: number;
  q?: number;
  attack?: number;
}

function noise(ctx: BaseAudioContext, out: AudioNode, t: number, o: NoiseOptions) {
  const src = ctx.createBufferSource();
  src.buffer = noiseBuffer(ctx);
  const f = ctx.createBiquadFilter();
  f.type = o.filter ?? 'bandpass';
  f.frequency.setValueAtTime(o.freq, t);
  if (o.to) f.frequency.exponentialRampToValueAtTime(o.to, t + o.dur);
  f.Q.value = o.q ?? 1;
  const g = ctx.createGain();
  const attack = o.attack ?? 0.005;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(o.gain ?? 0.2, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + attack + o.dur);
  src.connect(f).connect(g).connect(out);
  src.start(t, Math.random() * 0.5);
  src.stop(t + attack + o.dur + 0.05);
}

/** 泡の「ぽっ」 */
function bubble(ctx: BaseAudioContext, out: AudioNode, t: number, freq = 420, gain = 0.25) {
  tone(ctx, out, t, { freq, to: freq * 2.4, gain, decay: 0.09, glide: 0.07 });
}

// D のペンタトニック（レ・ミ・ファ#・ラ・シ）。BGM と同じ音階にして、効果音が浮かないようにする
const D5 = 74;
const E5 = 76;
const FS5 = 78;
const A5 = 81;
const B5 = 83;
const D6 = 86;
const FS6 = 90;
const A6 = 93;

// ---------- 効果音の表 ----------

export const SFX: Record<SfxId, Recipe> = {
  tap: (ctx, out, t) => bubble(ctx, out, t, 520, 0.26),
  nope: (ctx, out, t) => {
    tone(ctx, out, t, { freq: 294, to: 262, type: 'triangle', gain: 0.16, decay: 0.12 });
    tone(ctx, out, t + 0.13, { freq: 262, to: 233, type: 'triangle', gain: 0.14, decay: 0.16 });
  },
  pet: (ctx, out, t, p) => {
    // ぷにっ
    tone(ctx, out, t, { freq: 360 * p, to: 620 * p, type: 'triangle', gain: 0.22, decay: 0.13, glide: 0.06 });
    tone(ctx, out, t + 0.06, { freq: 620 * p, to: 300 * p, gain: 0.12, decay: 0.12 });
    bell(ctx, out, t + 0.1, hz(FS6) * p, 0.07, 0.5);
  },
  drop: (ctx, out, t) => {
    tone(ctx, out, t, { freq: 1100, to: 420, gain: 0.18, decay: 0.12 });
    bubble(ctx, out, t + 0.16, 380, 0.12);
  },
  munch: (ctx, out, t) => {
    for (let i = 0; i < 3; i++) {
      const s = t + i * 0.16;
      noise(ctx, out, s, { dur: 0.06, gain: 0.12, freq: 1400, q: 2 });
      tone(ctx, out, s, { freq: 210 - i * 15, to: 150, gain: 0.16, decay: 0.08 });
    }
  },
  sleep: (ctx, out, t) => {
    [A5, FS5, D5].forEach((m, i) => bell(ctx, out, t + i * 0.28, hz(m), 0.12, 1.2));
  },
  wake: (ctx, out, t) => {
    [D5, FS5, A5, D6].forEach((m, i) => bell(ctx, out, t + i * 0.1, hz(m), 0.12, 0.7));
  },
  buy: (ctx, out, t) => {
    bell(ctx, out, t, hz(A6), 0.14, 0.4);
    bell(ctx, out, t + 0.08, hz(D6 + 12), 0.16, 0.9);
  },
  equip: (ctx, out, t) => {
    // しゃらん
    const notes = [D6, E5 + 12, FS6, A6, B5 + 12];
    notes.forEach((m, i) => bell(ctx, out, t + i * 0.045, hz(m), 0.08 - i * 0.008, 0.6));
    noise(ctx, out, t, { dur: 0.25, gain: 0.04, filter: 'highpass', freq: 5000 });
  },
  place: (ctx, out, t) => {
    tone(ctx, out, t, { freq: 190, to: 120, gain: 0.25, decay: 0.1 });
    noise(ctx, out, t, { dur: 0.04, gain: 0.08, filter: 'lowpass', freq: 1200 });
  },
  flip: (ctx, out, t) => noise(ctx, out, t, { dur: 0.16, gain: 0.8, freq: 700, to: 3200, q: 1.5 }),
  store: (ctx, out, t) => {
    noise(ctx, out, t, { dur: 0.16, gain: 0.4, freq: 3000, to: 700, q: 1.5 });
    bubble(ctx, out, t + 0.1, 360, 0.16);
  },
  visitor: (ctx, out, t) => {
    // 風鈴のように、少しずらして2つ
    bell(ctx, out, t, hz(B5 + 12), 0.1, 1.4);
    bell(ctx, out, t + 0.18, hz(FS6), 0.09, 1.6);
  },
  hello: (ctx, out, t) => {
    bell(ctx, out, t, hz(A5), 0.1, 0.8);
    bell(ctx, out, t + 0.12, hz(D6), 0.1, 0.9);
  },
  discover: (ctx, out, t) => {
    [D5, FS5, A5, D6].forEach((m, i) => bell(ctx, out, t + i * 0.09, hz(m), 0.13, i === 3 ? 1.6 : 0.7));
  },
  levelUp: (ctx, out, t) => {
    [D5, FS5, A5].forEach((m, i) => tone(ctx, out, t + i * 0.11, { freq: hz(m), type: 'triangle', gain: 0.14, decay: 0.3 }));
    for (const m of [D6, FS6, A6]) tone(ctx, out, t + 0.36, { freq: hz(m), type: 'triangle', gain: 0.08, attack: 0.02, decay: 1.4 });
    [A6, D6 + 12, FS6 + 12].forEach((m, i) => bell(ctx, out, t + 0.4 + i * 0.07, hz(m), 0.05, 0.8));
  },
  count: (ctx, out, t) => tone(ctx, out, t, { freq: hz(A5), gain: 0.24, decay: 0.12 }),
  go: (ctx, out, t) => {
    tone(ctx, out, t, { freq: hz(D6), gain: 0.18, decay: 0.35 });
    tone(ctx, out, t, { freq: hz(FS6), gain: 0.08, decay: 0.3 });
  },
  catch: (ctx, out, t, p) => bubble(ctx, out, t, 480 * p, 0.3),
  pearl: (ctx, out, t) => {
    bell(ctx, out, t, hz(FS6), 0.12, 0.5);
    bell(ctx, out, t + 0.07, hz(A6), 0.12, 0.8);
  },
  miss: (ctx, out, t) => {
    // ぼよん
    const osc = ctx.createOscillator();
    const lfo = ctx.createOscillator();
    const depth = ctx.createGain();
    const g = ctx.createGain();
    osc.frequency.setValueAtTime(260, t);
    osc.frequency.exponentialRampToValueAtTime(130, t + 0.35);
    lfo.frequency.value = 16;
    depth.gain.value = 18;
    lfo.connect(depth).connect(osc.frequency);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.22, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.4);
    osc.connect(g).connect(out);
    osc.start(t);
    lfo.start(t);
    osc.stop(t + 0.45);
    lfo.stop(t + 0.45);
  },
  finish: (ctx, out, t) => {
    [A5, D6, FS6, A6].forEach((m, i) => bell(ctx, out, t + i * 0.08, hz(m), 0.12, i === 3 ? 1.2 : 0.4));
  },
  diveStart: (ctx, out, t) => {
    noise(ctx, out, t, { dur: 0.9, gain: 0.25, filter: 'lowpass', freq: 1800, to: 200, attack: 0.1 });
    for (let i = 0; i < 7; i++) bubble(ctx, out, t + 0.05 + i * 0.08 + Math.random() * 0.04, 300 + Math.random() * 400, 0.15);
  },
  meet: (ctx, out, t) => {
    [A5, D6, FS6].forEach((m, i) => bell(ctx, out, t + i * 0.12, hz(m), 0.13, i === 2 ? 1.8 : 0.9));
  },
  pickup: (ctx, out, t) => {
    tone(ctx, out, t, { freq: hz(A5), type: 'triangle', gain: 0.14, decay: 0.07 });
    tone(ctx, out, t + 0.06, { freq: hz(D6), type: 'triangle', gain: 0.14, decay: 0.16 });
  },
  trash: (ctx, out, t) => {
    noise(ctx, out, t, { dur: 0.08, gain: 0.25, filter: 'lowpass', freq: 700 });
    tone(ctx, out, t, { freq: 240, to: 180, gain: 0.2, decay: 0.1 });
  },
  bump: (ctx, out, t) => {
    tone(ctx, out, t, { freq: 120, to: 50, gain: 0.3, decay: 0.4 });
    noise(ctx, out, t, { dur: 0.22, gain: 0.2, filter: 'lowpass', freq: 400 });
    SFX.miss(ctx, out, t + 0.08, 1);
  },
  flee: (ctx, out, t) => noise(ctx, out, t, { dur: 0.22, gain: 0.8, filter: 'bandpass', freq: 1800, to: 5000, q: 2 }),
  light: (ctx, out, t) => {
    tone(ctx, out, t, { freq: 1800, gain: 0.24, decay: 0.02 });
    tone(ctx, out, t + 0.03, { freq: 1200, gain: 0.18, decay: 0.03 });
  },
  bottom: (ctx, out, t) => {
    [D5, A5, D6, FS6].forEach((m, i) => bell(ctx, out, t + i * 0.12, hz(m), 0.12, i === 3 ? 2 : 0.8));
    for (const m of [D5 - 12, A5 - 12]) tone(ctx, out, t + 0.1, { freq: hz(m), type: 'triangle', gain: 0.08, attack: 0.1, decay: 1.8 });
  },
  surface: (ctx, out, t) => {
    for (let i = 0; i < 10; i++) bubble(ctx, out, t + i * 0.09, 280 + i * 60 + Math.random() * 60, 0.15);
  },
};
