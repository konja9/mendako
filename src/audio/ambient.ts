// BGM：ゆらぐ環境音楽。ループする曲ではなく、その場で音を選んで鳴らし続ける。
// オルゴール風の音（score.ts が選ぶ）＋低い持続音＋海の響き（ノイズ）＋ときどき泡。
// 場面（水槽・おやすみ・ミニゲーム・探索）が変わると、2秒ほどかけて雰囲気を移す。

import { hz, noiseBuffer } from './sfx';
import { moodParams, planNotes, type Mood, type MoodParams, type ScoreState } from './score';

const LOOKAHEAD = 0.8;
const TICK_MS = 200;
const FADE = 0.7; // 雰囲気の移り変わり（setTargetAtTime の時定数。約3倍で落ち着く）

function reverbImpulse(ctx: BaseAudioContext, seconds = 2.6) {
  const length = Math.floor(ctx.sampleRate * seconds);
  const buf = ctx.createBuffer(2, length, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const data = buf.getChannelData(ch);
    for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * Math.exp((-3.2 * i) / length) ** 1.5;
  }
  return buf;
}

export class Ambient {
  private params: MoodParams;
  private mood: Mood = 'tank';
  private depth = 0;
  private state: ScoreState = { next: 0, degree: 11 };
  private timer: ReturnType<typeof setInterval> | null = null;
  private enabled = true;

  private master: GainNode;
  private notes: GainNode;
  private noteFilter: BiquadFilterNode;
  private drone: GainNode;
  private droneOscs: OscillatorNode[] = [];
  private sea: GainNode;

  constructor(
    private ctx: BaseAudioContext,
    out: AudioNode,
  ) {
    this.params = moodParams('tank');
    const t = ctx.currentTime;

    // 全体：最初は3秒かけてふわっと始める
    this.master = ctx.createGain();
    this.master.gain.setValueAtTime(0.0001, t);
    this.master.gain.exponentialRampToValueAtTime(1, t + 3);
    this.master.connect(out);

    // 残響（大きな水の中にいるような響き）
    const reverb = ctx.createConvolver();
    reverb.buffer = reverbImpulse(ctx);
    const wet = ctx.createGain();
    wet.gain.value = 0.55;
    reverb.connect(wet).connect(this.master);

    // オルゴール風の音の通り道
    this.notes = ctx.createGain();
    this.notes.gain.value = 1;
    this.noteFilter = ctx.createBiquadFilter();
    this.noteFilter.type = 'lowpass';
    this.noteFilter.frequency.value = this.params.brightness;
    this.notes.connect(this.noteFilter);
    this.noteFilter.connect(this.master);
    this.noteFilter.connect(reverb);

    // 低い持続音：根音・5度上・オクターブ上を少しずつずらして重ね、ゆっくり揺らす
    this.drone = ctx.createGain();
    this.drone.gain.value = this.params.drone * 0.055;
    const droneFilter = ctx.createBiquadFilter();
    droneFilter.type = 'lowpass';
    droneFilter.frequency.value = 420;
    const tremolo = ctx.createOscillator();
    const tremoloDepth = ctx.createGain();
    tremolo.frequency.value = 0.07;
    tremoloDepth.gain.value = 0.02;
    tremolo.connect(tremoloDepth).connect(this.drone.gain);
    tremolo.start(t);
    [
      { interval: 0, detune: -4, gain: 1, type: 'sine' as OscillatorType },
      { interval: 7, detune: 5, gain: 0.55, type: 'sine' as OscillatorType },
      { interval: 12, detune: 2, gain: 0.25, type: 'triangle' as OscillatorType },
    ].forEach((v) => {
      const osc = ctx.createOscillator();
      osc.type = v.type;
      osc.frequency.value = hz(this.params.droneRoot + v.interval);
      osc.detune.value = v.detune;
      const g = ctx.createGain();
      g.gain.value = v.gain;
      osc.connect(g).connect(droneFilter);
      osc.start(t);
      this.droneOscs.push(osc);
    });
    droneFilter.connect(this.drone);
    this.drone.connect(this.master);
    this.drone.connect(reverb);

    // 海の響き：ノイズをこもらせ、こもり具合をゆっくり揺らす
    const seaSrc = ctx.createBufferSource();
    seaSrc.buffer = noiseBuffer(ctx);
    seaSrc.loop = true;
    const seaFilter = ctx.createBiquadFilter();
    seaFilter.type = 'lowpass';
    seaFilter.frequency.value = 320;
    seaFilter.Q.value = 0.7;
    const swell = ctx.createOscillator();
    const swellDepth = ctx.createGain();
    swell.frequency.value = 0.045;
    swellDepth.gain.value = 180;
    swell.connect(swellDepth).connect(seaFilter.frequency);
    swell.start(t);
    this.sea = ctx.createGain();
    this.sea.gain.value = this.params.sea * 0.05;
    seaSrc.connect(seaFilter).connect(this.sea).connect(this.master);
    seaSrc.start(t);
  }

  /** 音を選んで予約し続ける（リアルタイムの AudioContext 用） */
  start() {
    if (this.timer) return;
    this.timer = setInterval(() => {
      // 止めている間（別のアプリを見ている間など）は予約しない
      if ((this.ctx as AudioContext).state === 'running') this.schedule(this.ctx.currentTime + LOOKAHEAD);
    }, TICK_MS);
  }

  setEnabled(on: boolean) {
    this.enabled = on;
  }

  setMood(mood: Mood, depth = 0) {
    if (mood === this.mood && Math.abs(depth - this.depth) < 0.02) return;
    this.mood = mood;
    this.depth = depth;
    this.params = moodParams(mood, depth);
    const t = this.ctx.currentTime;
    this.noteFilter.frequency.setTargetAtTime(this.params.brightness, t, FADE);
    this.drone.gain.setTargetAtTime(this.params.drone * 0.055, t, FADE);
    this.sea.gain.setTargetAtTime(this.params.sea * 0.05, t, FADE);
    [0, 7, 12].forEach((interval, i) => this.droneOscs[i].frequency.setTargetAtTime(hz(this.params.droneRoot + interval), t, FADE * 1.5));
  }

  /** until（秒）までの音を予約する。書き出し（OfflineAudioContext）でも使う */
  schedule(until: number) {
    const ctx = this.ctx;
    if (!this.enabled) return;
    const now = ctx.currentTime;
    // 止めていた間に遅れた分は取り戻さない（まとめて鳴らない）
    if (this.state.next < now) this.state.next = now + 0.05;
    const from = this.state.next;
    for (const note of planNotes(this.params, this.state, until)) this.voice(note.time, hz(note.midi), note.velocity, note.decay);
    // 泡：予約した時間の長さに応じて、ときどき
    const span = until - from;
    if (span > 0 && Math.random() < this.params.bubbles * span) this.bubble(from + Math.random() * span);
  }

  private voice(t: number, freq: number, velocity: number, decay: number) {
    const ctx = this.ctx;
    const g = ctx.createGain();
    const peak = velocity * 0.11;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + 0.006);
    g.gain.exponentialRampToValueAtTime(0.0001, t + decay);
    g.connect(this.notes);
    // 基音＋弱い倍音（オルゴールの櫛のような、丸い音）
    for (const [mult, amp] of [
      [1, 1],
      [2, 0.18],
      [3, 0.06],
    ]) {
      const osc = ctx.createOscillator();
      osc.frequency.value = freq * mult;
      const partial = ctx.createGain();
      partial.gain.value = amp;
      osc.connect(partial).connect(g);
      osc.start(t);
      osc.stop(t + (mult === 1 ? decay : decay * 0.5) + 0.05);
    }
  }

  private bubble(t: number) {
    const ctx = this.ctx;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    const f = 500 + Math.random() * 500;
    osc.frequency.setValueAtTime(f, t);
    osc.frequency.exponentialRampToValueAtTime(f * 2.2, t + 0.06);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.035, t + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.08);
    osc.connect(g).connect(this.master);
    osc.start(t);
    osc.stop(t + 0.1);
  }
}
