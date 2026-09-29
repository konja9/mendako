// BGM の「どの音をいつ鳴らすか」を決める部分。音は鳴らさない純粋な関数なので、テストできる。
// オルゴールのような音を、ペンタトニック音階の中でゆっくり不規則に並べる。

export type Mood = 'tank' | 'sleep' | 'catch' | 'dive';

export interface MoodParams {
  /** 1秒あたりに鳴らす音の数（平均） */
  density: number;
  /** 使う音の範囲（音階の何番目から何番目まで） */
  low: number;
  high: number;
  /** 音の大きさ（0〜1） */
  velocity: number;
  /** 音の明るさ（こもらせるフィルタの周波数 Hz） */
  brightness: number;
  /** 低い持続音の音番号（MIDI）と大きさ */
  droneRoot: number;
  drone: number;
  /** 海の響き（ノイズ）の大きさ */
  sea: number;
  /** 泡の音が鳴る頻度（1秒あたり） */
  bubbles: number;
}

/** D のペンタトニック（レ・ミ・ファ#・ラ・シ）。音階の番号 → MIDI の音番号 */
const STEPS = [0, 2, 4, 7, 9];
const BASE = 50; // D3

export function degreeToMidi(degree: number) {
  const octave = Math.floor(degree / STEPS.length);
  const step = STEPS[((degree % STEPS.length) + STEPS.length) % STEPS.length];
  return BASE + octave * 12 + step;
}

/** この音番号が音階に入っているか */
export function inScale(midi: number) {
  const pc = (((midi - BASE) % 12) + 12) % 12;
  return STEPS.includes(pc);
}

const lerp = (a: number, b: number, k: number) => a + (b - a) * k;

/** 場面ごとの雰囲気。探索は depth（0〜1、ゾーンの中でどこまで潜ったか）で暗く・静かになる */
export function moodParams(mood: Mood, depth = 0): MoodParams {
  const k = Math.min(1, Math.max(0, depth));
  switch (mood) {
    case 'sleep':
      return { density: 0.3, low: 3, high: 10, velocity: 0.5, brightness: 1400, droneRoot: 38, drone: 0.5, sea: 0.7, bubbles: 0.08 };
    case 'catch':
      return { density: 2.2, low: 8, high: 17, velocity: 0.75, brightness: 5200, droneRoot: 50, drone: 0.35, sea: 0.35, bubbles: 0.4 };
    case 'dive':
      return {
        density: lerp(0.55, 0.18, k),
        low: Math.round(lerp(5, 2, k)),
        high: Math.round(lerp(13, 8, k)),
        velocity: lerp(0.6, 0.45, k),
        brightness: lerp(1800, 700, k),
        droneRoot: 38,
        drone: lerp(0.7, 1, k),
        sea: lerp(0.8, 1, k),
        bubbles: lerp(0.3, 0.1, k),
      };
    default:
      return { density: 0.9, low: 7, high: 16, velocity: 0.65, brightness: 3600, droneRoot: 50, drone: 0.45, sea: 0.5, bubbles: 0.2 };
  }
}

export interface Note {
  /** 鳴らす時刻（秒） */
  time: number;
  midi: number;
  /** 大きさ（0〜1） */
  velocity: number;
  /** 余韻の長さ（秒） */
  decay: number;
}

export interface ScoreState {
  /** 次の音を鳴らす時刻 */
  next: number;
  /** 直前の音（音階の番号） */
  degree: number;
}

const MIN_GAP = 0.16;

/**
 * state.next から until までに鳴らす音を決め、state を進める。
 * 音は前の音から近いところへ動くことが多く、ときどき跳ぶ・休む・下に和音を添える。
 */
export function planNotes(p: MoodParams, state: ScoreState, until: number, rng: () => number = Math.random): Note[] {
  const notes: Note[] = [];
  while (state.next < until) {
    let degree = state.degree;
    const r = rng();
    if (r < 0.7) degree += rng() < 0.5 ? -1 : 1;
    else if (r < 0.9) degree += rng() < 0.5 ? -2 : 2;
    else degree = p.low + Math.floor(rng() * (p.high - p.low + 1));
    // 範囲の外に出たら、はね返す
    if (degree > p.high) degree = p.high - (degree - p.high);
    if (degree < p.low) degree = p.low + (p.low - degree);
    degree = Math.min(p.high, Math.max(p.low, degree));
    state.degree = degree;

    const velocity = p.velocity * (0.6 + 0.4 * rng());
    const decay = 1.6 + rng() * 2.2;
    notes.push({ time: state.next, midi: degreeToMidi(degree), velocity, decay });
    // ときどき、下に音を添える（音階で2つ下）
    if (rng() < 0.18 && degree >= 2) {
      notes.push({ time: state.next + 0.02, midi: degreeToMidi(degree - 2), velocity: velocity * 0.6, decay });
    }

    // 次の音までの間隔：平均がおよそ 1/density になるばらつき（指数分布）。ときどき長めに休む
    let gap = (-Math.log(1 - rng() * 0.999) * 0.8) / p.density;
    if (rng() < 0.12) gap += 2 / p.density;
    state.next += Math.max(MIN_GAP, gap);
  }
  return notes;
}
