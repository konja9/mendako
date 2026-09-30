// 深海探索の「潜る動き」。ページをスクロールするのと同じ感覚にする。
// 上にスワイプすると深く、下にスワイプすると浅く。指を離すと勢いが少し残って止まる。
// 何もしなくても、ゆっくり沈んでいく。描画に依存しない純粋な計算なので、テストできる。

/** 深さ 1m を画面上で何 px にするか */
export const PX_PER_M = 6;

export const MOTION = {
  /** 何もしなくても沈む速さ（m/秒） */
  drift: 3,
  /** 指の動きに追いつくときの、いちばん速い速さ（px/秒） */
  maxSpeed: 1000,
  /** 指を離したときの勢いの上限（px/秒） */
  maxFling: 800,
  /** 勢いの減り方（1/秒）。大きいほど早く止まる */
  friction: 3.5,
  /** まだ追いついていない指の動きを、ためておける量（px） */
  maxPending: 900,
};

export interface DiveMotion {
  /** いまの深さ（m） */
  depth: number;
  /** 指を離したあとの勢い（px/秒。深くなる向きが +） */
  velocity: number;
  /** 指は動いたが、まだ深さに反映していない分（px。深くなる向きが +） */
  pending: number;
  dragging: boolean;
}

export interface StepOptions {
  top: number;
  bottom: number;
  /** ぶつかって動けない間は、指の動きも勢いも止める */
  stunned?: boolean;
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

export function createMotion(depth: number): DiveMotion {
  return { depth, velocity: 0, pending: 0, dragging: false };
}

/** 指が画面の上で dyPx 動いた（上へ動くと負の値 → 深くなる） */
export function dragBy(m: DiveMotion, dyPx: number) {
  m.dragging = true;
  m.velocity = 0;
  m.pending = clamp(m.pending - dyPx, -MOTION.maxPending, MOTION.maxPending);
}

/** 指を離した。fingerVy は離す直前の指の縦の速さ（px/秒、上へ動いていれば負） */
export function release(m: DiveMotion, fingerVy: number) {
  m.dragging = false;
  m.velocity = clamp(-fingerVy, -MOTION.maxFling, MOTION.maxFling);
}

/**
 * 時間を dt 秒進める。
 * speed は画面上の縦の動きの速さ（px/秒、恥ずかしがりの生き物が逃げる判定に使う）、
 * atBottom はゾーンの底に着いたか。
 */
export function step(m: DiveMotion, dt: number, o: StepOptions) {
  if (dt <= 0) return { speed: 0, atBottom: m.depth >= o.bottom };
  if (o.stunned) {
    m.pending = 0;
    m.velocity = 0;
  }
  let move = MOTION.drift * PX_PER_M * dt;

  // 指の動いた分に、上限の速さで追いつく
  const maxStep = MOTION.maxSpeed * dt;
  const take = clamp(m.pending, -maxStep, maxStep);
  m.pending -= take;
  move += take;

  // 指を離したあとの勢い
  if (!m.dragging && m.velocity !== 0) {
    move += m.velocity * dt;
    m.velocity *= Math.exp(-MOTION.friction * dt);
    if (Math.abs(m.velocity) < 5) m.velocity = 0;
  }

  const before = m.depth;
  m.depth = clamp(m.depth + move / PX_PER_M, o.top, o.bottom);
  // 入口や底に着いたら、その向きにためた動きは捨てる（はね返らないように）
  if (m.depth <= o.top) {
    if (m.pending < 0) m.pending = 0;
    if (m.velocity < 0) m.velocity = 0;
  }
  if (m.depth >= o.bottom) {
    if (m.pending > 0) m.pending = 0;
    if (m.velocity > 0) m.velocity = 0;
  }
  return { speed: (Math.abs(m.depth - before) * PX_PER_M) / dt, atBottom: m.depth >= o.bottom };
}
