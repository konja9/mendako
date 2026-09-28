// ミニゲーム「マリンスノーキャッチ」。30秒間、降ってくるものを めんだこで あつめる。
// ゲームの報酬計算は state.js の finishPlay に任せ、ここは遊びと表示だけを持つ。

import { mendakoImage } from './mendako.js';
import { PEARL } from './icons.js';

const DURATION = 30;
const KINDS = [
  { id: 'snow', points: 1, weight: 58, r: 8 },
  { id: 'copepod', points: 3, weight: 20, r: 11 },
  { id: 'pearl', points: 0, pearl: 1, weight: 7, r: 10 },
  { id: 'trash', points: -3, weight: 15, r: 15 },
];
const TOTAL_WEIGHT = KINDS.reduce((sum, k) => sum + k.weight, 0);

function pickKind() {
  let roll = Math.random() * TOTAL_WEIGHT;
  for (const kind of KINDS) {
    roll -= kind.weight;
    if (roll <= 0) return kind;
  }
  return KINDS[0];
}

function drawItem(ctx, item, t) {
  const { x, y } = item;
  ctx.save();
  ctx.translate(x, y);
  switch (item.kind.id) {
    case 'snow': {
      ctx.fillStyle = 'rgba(235, 245, 255, 0.25)';
      ctx.beginPath();
      ctx.arc(0, 0, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#f4f9ff';
      for (const [dx, dy, r] of [[0, 0, 4.5], [4, -3, 3], [-4, 2, 3], [2, 4, 2.5]]) {
        ctx.beginPath();
        ctx.arc(dx, dy, r, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }
    case 'copepod': {
      ctx.rotate(Math.sin(t * 6 + item.seed) * 0.25);
      ctx.strokeStyle = '#ffd9b8';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(-3, -7);
      ctx.quadraticCurveTo(-12, -12, -16, -6);
      ctx.moveTo(3, -7);
      ctx.quadraticCurveTo(12, -12, 16, -6);
      ctx.moveTo(0, 9);
      ctx.lineTo(-3, 15);
      ctx.moveTo(0, 9);
      ctx.lineTo(3, 15);
      ctx.stroke();
      ctx.fillStyle = '#ffab66';
      ctx.beginPath();
      ctx.ellipse(0, 0, 6, 9, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#e0484f';
      ctx.beginPath();
      ctx.arc(0, -4.5, 1.8, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'pearl': {
      const glow = 0.3 + 0.2 * Math.sin(t * 5 + item.seed);
      ctx.fillStyle = `rgba(255, 244, 200, ${glow})`;
      ctx.beginPath();
      ctx.arc(0, 0, 16, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fbf7ff';
      ctx.strokeStyle = '#b9a5f6';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(-2.5, -2.5, 2.5, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'trash': {
      // 深海にも とどいてしまう ビニールぶくろ
      ctx.rotate(Math.sin(t * 2 + item.seed) * 0.35);
      ctx.fillStyle = 'rgba(214, 226, 240, 0.55)';
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(-12, -6);
      ctx.quadraticCurveTo(-14, 14, -8, 15);
      ctx.lineTo(8, 15);
      ctx.quadraticCurveTo(14, 14, 12, -6);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-10, -6);
      ctx.quadraticCurveTo(-9, -16, -4, -6);
      ctx.moveTo(10, -6);
      ctx.quadraticCurveTo(9, -16, 4, -6);
      ctx.stroke();
      break;
    }
  }
  ctx.restore();
}

// host に全画面のゲームを重ねる。「もどる」を押すと Promise が解決する。
// onFinish({ score, pearls }) は報酬を反映して { reward, isBest } を返す関数。
export async function runMinigame({ equipped, onFinish, reducedMotion = false }) {
  const [happyImg, ouchImg] = await Promise.all([
    mendakoImage({ equipped, expression: 'happy' }),
    mendakoImage({ equipped, expression: 'tickled' }),
  ]);

  const root = document.createElement('div');
  root.className = 'game';
  root.setAttribute('role', 'dialog');
  root.setAttribute('aria-modal', 'true');
  root.setAttribute('aria-label', 'マリンスノーキャッチ');
  root.innerHTML = `
    <canvas class="game-canvas"></canvas>
    <div class="game-hud">
      <span class="game-chip">のこり <b class="js-time">${DURATION}</b>びょう</span>
      <span class="game-chip">スコア <b class="js-score">0</b></span>
      <span class="game-chip">${PEARL}<b class="js-pearls">0</b></span>
      <button class="game-quit js-quit" type="button">やめる</button>
    </div>
    <div class="game-intro js-intro">
      <p class="game-count js-count">3</p>
      <p class="game-help">マリンスノーと カイアシを あつめよう。<br>ビニールぶくろには ぶつからないでね。</p>
      <p class="game-keys">ゆびで なぞる / ← → キー</p>
    </div>
    <div class="game-result js-result" hidden></div>`;
  document.body.append(root);

  const canvas = root.querySelector('canvas');
  const ctx = canvas.getContext('2d');
  const timeEl = root.querySelector('.js-time');
  const scoreEl = root.querySelector('.js-score');
  const pearlsEl = root.querySelector('.js-pearls');
  const intro = root.querySelector('.js-intro');
  const countEl = root.querySelector('.js-count');
  const resultEl = root.querySelector('.js-result');

  let width = 0;
  let height = 0;
  function resize() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    width = root.clientWidth;
    height = root.clientHeight;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();
  window.addEventListener('resize', resize);

  const size = () => Math.min(120, Math.max(84, width * 0.24));
  const player = { x: width / 2, target: width / 2, stunned: 0, tilt: 0 };
  const items = [];
  const pops = [];
  const keys = new Set();
  let score = 0;
  let pearls = 0;
  let elapsed = 0;
  let spawnIn = 0.4;
  let running = false;
  let finished = false;
  let last = 0;
  let raf = 0;

  const moveTo = (clientX) => {
    player.target = clientX - root.getBoundingClientRect().left;
  };
  const onPointer = (e) => {
    if (e.target.closest('button')) return;
    moveTo(e.clientX);
  };
  const onKey = (e) => {
    const dir = { ArrowLeft: -1, a: -1, A: -1, ArrowRight: 1, d: 1, D: 1 }[e.key];
    if (!dir) return;
    e.preventDefault();
    if (e.type === 'keydown') keys.add(dir);
    else keys.delete(dir);
  };
  root.addEventListener('pointerdown', onPointer);
  root.addEventListener('pointermove', onPointer);
  window.addEventListener('keydown', onKey);
  window.addEventListener('keyup', onKey);

  function spawn() {
    const kind = pickKind();
    const progress = elapsed / DURATION;
    items.push({
      kind,
      x: 24 + Math.random() * (width - 48),
      y: -20,
      vy: (110 + 90 * progress) * (0.85 + Math.random() * 0.3),
      seed: Math.random() * 10,
    });
  }

  function pop(x, y, text, color) {
    pops.push({ x, y, text, color, life: 0.9 });
  }

  function update(dt) {
    elapsed += dt;
    const s = size();
    for (const dir of keys) player.target += dir * 420 * dt;
    player.target = Math.max(s / 2, Math.min(width - s / 2, player.target));
    if (player.stunned > 0) {
      player.stunned -= dt;
    } else {
      const before = player.x;
      player.x += (player.target - player.x) * Math.min(1, dt * 10);
      player.tilt = Math.max(-0.3, Math.min(0.3, (player.x - before) / (dt * 900 || 1)));
    }

    spawnIn -= dt;
    if (spawnIn <= 0) {
      spawn();
      spawnIn = 0.55 - 0.27 * (elapsed / DURATION);
    }

    const cy = height - s * 0.62 - 28;
    const catchR = s * 0.4;
    for (let i = items.length - 1; i >= 0; i--) {
      const item = items[i];
      item.y += item.vy * dt;
      if (item.kind.id === 'snow') item.x += Math.sin(elapsed * 3 + item.seed) * 20 * dt;
      const dist = Math.hypot(item.x - player.x, item.y - cy);
      if (dist < catchR + item.kind.r) {
        items.splice(i, 1);
        if (item.kind.id === 'trash') {
          if (player.stunned <= 0) {
            score = Math.max(0, score + item.kind.points);
            player.stunned = 0.9;
            pop(item.x, item.y, `${item.kind.points}`, '#ffb0c0');
          }
        } else {
          score += item.kind.points;
          pearls += item.kind.pearl ?? 0;
          pop(item.x, item.y, item.kind.pearl ? 'しんじゅ!' : `+${item.kind.points}`, item.kind.pearl ? '#fff1a0' : '#ffffff');
        }
        continue;
      }
      if (item.y > height + 30) items.splice(i, 1);
    }
    for (let i = pops.length - 1; i >= 0; i--) {
      pops[i].life -= dt;
      pops[i].y -= 40 * dt;
      if (pops[i].life <= 0) pops.splice(i, 1);
    }

    timeEl.textContent = Math.max(0, Math.ceil(DURATION - elapsed));
    scoreEl.textContent = score;
    pearlsEl.textContent = pearls;
  }

  function draw(t) {
    ctx.clearRect(0, 0, width, height);
    for (const item of items) drawItem(ctx, item, t);

    const s = size();
    const cy = height - s * 0.62 - 28;
    const shake = player.stunned > 0 && !reducedMotion ? Math.sin(t * 60) * 4 : 0;
    const bob = reducedMotion ? 0 : Math.sin(t * 3) * 3;
    ctx.fillStyle = 'rgba(4, 12, 30, 0.35)';
    ctx.beginPath();
    ctx.ellipse(player.x, height - 26, s * 0.32, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.save();
    ctx.translate(player.x + shake, cy + bob);
    ctx.rotate(player.tilt);
    ctx.drawImage(player.stunned > 0 ? ouchImg : happyImg, -s / 2, -s * 0.62, s, s);
    ctx.restore();

    ctx.font = 'bold 18px "Mochiy Pop One", "Zen Maru Gothic", sans-serif';
    ctx.textAlign = 'center';
    for (const p of pops) {
      ctx.globalAlpha = Math.min(1, p.life * 2);
      ctx.fillStyle = p.color;
      ctx.fillText(p.text, p.x, p.y);
    }
    ctx.globalAlpha = 1;
  }

  function frame(now) {
    const t = now / 1000;
    // タブを離れている間は時間を進めない（dt の上限で止まる）
    const dt = Math.min(0.05, last ? t - last : 0);
    last = t;
    if (running) {
      update(dt);
      if (elapsed >= DURATION) {
        end();
        return;
      }
    }
    draw(t);
    raf = requestAnimationFrame(frame);
  }

  let resolveDone;
  const done = new Promise((resolve) => {
    resolveDone = resolve;
  });

  function cleanup() {
    cancelAnimationFrame(raf);
    window.removeEventListener('resize', resize);
    window.removeEventListener('keydown', onKey);
    window.removeEventListener('keyup', onKey);
    root.remove();
  }

  function end() {
    running = false;
    finished = true;
    draw(last);
    const result = onFinish({ score, pearls });
    resultEl.innerHTML = `
      <h2>おしまい！</h2>
      <p class="game-score">スコア <b>${score}</b></p>
      ${result.isBest ? '<p class="game-best">ベストきろく！</p>' : ''}
      <p class="game-reward">${PEARL} しんじゅ <b>+${result.reward}</b></p>
      <p class="game-note">ごきげん +15 / げんき -15</p>
      <button class="btn btn-primary js-back" type="button">もどる</button>`;
    resultEl.hidden = false;
    root.querySelector('.js-quit').hidden = true;
    const back = resultEl.querySelector('.js-back');
    back.focus();
    back.addEventListener('click', () => {
      cleanup();
      resolveDone({ played: true, ...result });
    });
  }

  root.querySelector('.js-quit').addEventListener('click', () => {
    if (finished) return;
    cleanup();
    resolveDone({ played: false });
  });

  // カウントダウンしてから開始
  raf = requestAnimationFrame(frame);
  for (const label of ['3', '2', '1']) {
    countEl.textContent = label;
    await new Promise((r) => setTimeout(r, reducedMotion ? 450 : 700));
    if (!root.isConnected) return done;
  }
  countEl.textContent = 'スタート！';
  await new Promise((r) => setTimeout(r, 450));
  if (!root.isConnected) return done;
  intro.hidden = true;
  running = true;
  return done;
}
