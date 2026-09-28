// 背景の深海：ゆっくり降るマリンスノー、のぼる泡、ときどき光る発光生物。

export function createOcean(canvas, { reducedMotion = false } = {}) {
  const ctx = canvas.getContext('2d');
  const snow = [];
  const glows = [];
  const bubbles = [];
  let width = 0;
  let height = 0;
  let last = 0;
  let bubbleTimer = 2;

  function resize() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    width = canvas.clientWidth;
    height = canvas.clientHeight;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    seed();
    if (reducedMotion) draw(0);
  }

  function seed() {
    snow.length = 0;
    glows.length = 0;
    const count = Math.round((width * height) / 7000);
    for (let i = 0; i < count; i++) {
      snow.push({
        x: Math.random() * width,
        y: Math.random() * height,
        r: 0.6 + Math.random() * 1.8,
        vy: 5 + Math.random() * 12,
        sway: Math.random() * Math.PI * 2,
        alpha: 0.2 + Math.random() * 0.5,
      });
    }
    for (let i = 0; i < Math.max(6, count / 10); i++) {
      glows.push({
        x: Math.random() * width,
        y: height * (0.15 + Math.random() * 0.7),
        r: 1.2 + Math.random() * 2,
        phase: Math.random() * Math.PI * 2,
        speed: 0.4 + Math.random() * 0.8,
        color: Math.random() < 0.7 ? '143, 227, 255' : '255, 160, 210',
      });
    }
  }

  function spawnBubble(x, y, size = 1) {
    bubbles.push({
      x,
      y,
      r: (2 + Math.random() * 4) * size,
      vy: 22 + Math.random() * 26,
      phase: Math.random() * Math.PI * 2,
    });
  }

  function update(dt, t) {
    for (const p of snow) {
      p.y += p.vy * dt;
      p.x += Math.sin(t * 0.4 + p.sway) * 4 * dt;
      if (p.y > height + 4) {
        p.y = -4;
        p.x = Math.random() * width;
      }
    }
    bubbleTimer -= dt;
    if (bubbleTimer <= 0) {
      bubbleTimer = 1.5 + Math.random() * 3.5;
      const x = Math.random() * width;
      for (let i = 0; i < 1 + Math.floor(Math.random() * 3); i++) spawnBubble(x + Math.random() * 12, height + 10 + i * 14);
    }
    for (let i = bubbles.length - 1; i >= 0; i--) {
      const b = bubbles[i];
      b.y -= b.vy * dt;
      b.x += Math.sin(t * 2 + b.phase) * 10 * dt;
      if (b.y < -20) bubbles.splice(i, 1);
    }
  }

  function draw(t) {
    ctx.clearRect(0, 0, width, height);
    for (const g of glows) {
      const a = 0.25 + 0.75 * Math.max(0, Math.sin(t * g.speed + g.phase)) ** 3;
      ctx.fillStyle = `rgba(${g.color}, ${a * 0.18})`;
      ctx.beginPath();
      ctx.arc(g.x, g.y, g.r * 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = `rgba(${g.color}, ${a})`;
      ctx.beginPath();
      ctx.arc(g.x, g.y, g.r, 0, Math.PI * 2);
      ctx.fill();
    }
    for (const p of snow) {
      ctx.fillStyle = `rgba(235, 244, 255, ${p.alpha})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.lineWidth = 1.2;
    for (const b of bubbles) {
      ctx.strokeStyle = 'rgba(200, 235, 255, 0.55)';
      ctx.fillStyle = 'rgba(200, 235, 255, 0.08)';
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.beginPath();
      ctx.arc(b.x - b.r * 0.35, b.y - b.r * 0.35, b.r * 0.25, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function frame(now) {
    const t = now / 1000;
    const dt = Math.min(0.05, last ? t - last : 0);
    last = t;
    update(dt, t);
    draw(t);
    requestAnimationFrame(frame);
  }

  window.addEventListener('resize', resize);
  resize();
  if (!reducedMotion) requestAnimationFrame(frame);

  return {
    // 画面上の座標から泡をぽこぽこ出す。
    bubblesAt(x, y, count = 5) {
      if (reducedMotion) return;
      for (let i = 0; i < count; i++) spawnBubble(x + (Math.random() - 0.5) * 30, y + Math.random() * 20, 0.8);
    },
  };
}
