// めんだこの 2D 描画（SVG 文字列）。座標は viewBox 0 0 200 200 基準。
// 同じ SVG を画面表示・きせかえプレビュー・ミニゲームの canvas で使い回す。

export const PALETTES = {
  'color-coral': { body: '#ff8d6e', skirt: '#f06f5a', fin: '#ffa085', finIn: '#ffc6b3', line: '#7a2d38', cheek: '#ff5c86' },
  'color-sakura': { body: '#ffb3c7', skirt: '#f693b0', fin: '#ffc3d3', finIn: '#ffe2ea', line: '#7d3352', cheek: '#ff6f9c' },
  'color-lavender': { body: '#b9a5f6', skirt: '#9d88e8', fin: '#c9b9fa', finIn: '#e6defd', line: '#3d2f78', cheek: '#ff7fb4' },
  'color-snow': { body: '#f5f2fc', skirt: '#dcd6ee', fin: '#fbfaff', finIn: '#ffffff', line: '#4a4769', cheek: '#ff9fbb' },
};

const EYE_DARK = '#2a1b2e';
const MOUTH_RED = '#b83a55';
const EYES = [78, 122];
const EYE_Y = 100;

// 調子（conditionOf の値）から表情を選ぶ。
export function expressionFor(condition) {
  return { sleep: 'sleep', hungry: 'hungry', tired: 'tired', sad: 'sad', great: 'great' }[condition] ?? 'normal';
}

const OPEN_EYES = new Set(['normal', 'great', 'hungry', 'sad']);

function eyes(expression, p) {
  const stroke = `stroke="${EYE_DARK}" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" fill="none"`;
  if (OPEN_EYES.has(expression)) {
    const shine = expression === 'sad' ? 4 : 3.3;
    const open = EYES.map(
      (x) => `<ellipse cx="${x}" cy="${EYE_Y}" rx="8.5" ry="10.5" fill="${EYE_DARK}"/>
        <circle cx="${x + 3}" cy="${EYE_Y - 4}" r="${shine}" fill="#fff"/>
        <circle cx="${x - 2.5}" cy="${EYE_Y + 4.5}" r="1.6" fill="#fff"/>`,
    ).join('');
    const brows =
      expression === 'sad'
        ? `<path d="M68 89 L84 84 M132 89 L116 84" stroke="${p.line}" stroke-width="2.5" stroke-linecap="round"/>`
        : '';
    return `<g class="m-eyes m-blink">${open}</g>${brows}`;
  }
  if (expression === 'happy' || expression === 'eat') {
    return EYES.map((x) => `<path d="M${x - 8} ${EYE_Y + 2} Q${x} ${EYE_Y - 9} ${x + 8} ${EYE_Y + 2}" ${stroke}/>`).join('');
  }
  if (expression === 'sleep') {
    return EYES.map((x) => `<path d="M${x - 8} ${EYE_Y - 1} Q${x} ${EYE_Y + 7} ${x + 8} ${EYE_Y - 1}" ${stroke}/>`).join('');
  }
  if (expression === 'tired') {
    return EYES.map(
      (x) => `<path d="M${x - 8.5} ${EYE_Y} A8.5 10.5 0 0 0 ${x + 8.5} ${EYE_Y} Z" fill="${EYE_DARK}"/>
        <path d="M${x - 10} ${EYE_Y} L${x + 10} ${EYE_Y}" stroke="${p.line}" stroke-width="2.5" stroke-linecap="round"/>
        <circle cx="${x + 3}" cy="${EYE_Y + 4}" r="1.8" fill="#fff"/>`,
    ).join('');
  }
  // tickled: > <
  return `<path d="M72 94 L84 100 L72 106" ${stroke}/><path d="M128 94 L116 100 L128 106" ${stroke}/>`;
}

function mouth(expression, p) {
  const line = `stroke="${p.line}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none"`;
  switch (expression) {
    case 'great':
    case 'happy':
      return `<path d="M92 112 Q100 124 108 112 Q100 115 92 112 Z" fill="${MOUTH_RED}" stroke="${p.line}" stroke-width="2" stroke-linejoin="round"/>`;
    case 'eat':
      return `<ellipse cx="100" cy="115" rx="5" ry="6" fill="${MOUTH_RED}" stroke="${p.line}" stroke-width="2"/>`;
    case 'tickled':
      return `<ellipse cx="100" cy="115" rx="4.5" ry="4" fill="${MOUTH_RED}" stroke="${p.line}" stroke-width="2"/>`;
    case 'sleep':
      return `<ellipse cx="100" cy="115" rx="2.6" ry="2" fill="${MOUTH_RED}"/>`;
    case 'sad':
      return `<path d="M94 117 Q100 111 106 117" ${line}/>`;
    case 'hungry':
      return `<path d="M91 115 Q94 112 97 115 Q100 118 103 115 Q106 112 109 115" ${line}/>`;
    case 'tired':
      return `<path d="M96 115 L104 115" ${line}/>`;
    default:
      return `<path d="M93 113 Q96.5 117.5 100 113 Q103.5 117.5 107 113" ${line}/>`;
  }
}

function heartPath(cx, cy, s) {
  const pt = (x, y) => `${(cx + x * s).toFixed(1)} ${(cy + y * s).toFixed(1)}`;
  return `M${pt(0, -0.35)} C${pt(-0.2, -0.9)} ${pt(-1, -0.75)} ${pt(-1, -0.15)} C${pt(-1, 0.35)} ${pt(-0.45, 0.7)} ${pt(0, 1)} C${pt(0.45, 0.7)} ${pt(1, 0.35)} ${pt(1, -0.15)} C${pt(1, -0.75)} ${pt(0.2, -0.9)} ${pt(0, -0.35)} Z`;
}

function starPath(cx, cy, outer, inner, rotateDeg) {
  const points = [];
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = ((rotateDeg + i * 36 - 90) * Math.PI) / 180;
    points.push(`${(cx + r * Math.cos(a)).toFixed(1)} ${(cy + r * Math.sin(a)).toFixed(1)}`);
  }
  return `M${points.join(' L')} Z`;
}

function pearlsAlong(p) {
  const out = [];
  const count = 13;
  for (let i = 0; i < count; i++) {
    const t = i / (count - 1);
    const x = (1 - t) ** 2 * 54 + 2 * (1 - t) * t * 100 + t ** 2 * 146;
    const y = (1 - t) ** 2 * 116 + 2 * (1 - t) * t * 142 + t ** 2 * 116;
    const r = i === (count - 1) / 2 ? 6 : 4.2;
    out.push(`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r}" fill="#f4efff" stroke="${p.line}" stroke-width="1.6"/>
      <circle cx="${(x - r * 0.35).toFixed(1)}" cy="${(y - r * 0.35).toFixed(1)}" r="${(r * 0.32).toFixed(1)}" fill="#fff"/>`);
  }
  return out.join('');
}

const OUTFITS = {
  ribbon: (p) => `<g transform="rotate(16 120 48)" stroke="${p.line}" stroke-width="2.5" stroke-linejoin="round">
      <path d="M120 48 C108 34 96 40 100 50 C102 58 112 56 120 48 Z" fill="#ff86b5"/>
      <path d="M120 48 C132 34 144 40 140 50 C138 58 128 56 120 48 Z" fill="#ff86b5"/>
      <ellipse cx="120" cy="48" rx="5" ry="5.5" fill="#ff5f9e"/></g>`,
  starfish: (p) => `<g>
      <path d="${starPath(132, 57, 12, 5.5, 14)}" fill="#ffb454" stroke="${p.line}" stroke-width="2.5" stroke-linejoin="round"/>
      <circle cx="132" cy="57" r="1.8" fill="#fff3d6"/><circle cx="133" cy="50" r="1.2" fill="#fff3d6"/>
      <circle cx="138" cy="59" r="1.2" fill="#fff3d6"/><circle cx="127" cy="60" r="1.2" fill="#fff3d6"/></g>`,
  beret: (p) => `<g transform="rotate(8 104 46)">
      <path d="M106 32 q1 -6 6 -6" stroke="${p.line}" stroke-width="3" fill="none" stroke-linecap="round"/>
      <path d="M68 54 C64 40 92 30 114 33 C134 36 142 48 134 55 C118 60 86 61 68 54 Z" fill="#6f8dff" stroke="${p.line}" stroke-width="2.5" stroke-linejoin="round"/>
      <path d="M76 49 C90 41 118 39 131 47" stroke="#fff" stroke-opacity=".35" stroke-width="3" fill="none" stroke-linecap="round"/></g>`,
  crown: (p) => `<g transform="rotate(-6 100 50)" stroke="${p.line}" stroke-width="2.5" stroke-linejoin="round">
      <path d="M84 52 L82 33 L92 41 L100 29 L108 41 L118 33 L116 52 Z" fill="#ffd66b"/>
      <circle cx="82" cy="32" r="2.6" fill="#fff2b3"/><circle cx="100" cy="28" r="3" fill="#fff2b3"/><circle cx="118" cy="32" r="2.6" fill="#fff2b3"/>
      <circle cx="100" cy="45" r="3.2" fill="#ff7fb0" stroke-width="1.6"/></g>`,
  lantern: (p) => `<g>
      <path d="M58 70 C70 50 130 50 142 70" stroke="#3b3f78" stroke-width="5" fill="none" stroke-linecap="round"/>
      <path d="M100 55 C98 34 116 20 130 26" stroke="#3b3f78" stroke-width="3.5" fill="none" stroke-linecap="round"/>
      <circle class="m-glow" cx="132" cy="28" r="15" fill="#fff5a8" opacity=".3"/>
      <circle cx="132" cy="28" r="7.5" fill="#fff1a0" stroke="${p.line}" stroke-width="2.5"/>
      <circle cx="129.5" cy="25.5" r="2.2" fill="#fff"/></g>`,
  'round-glasses': () => `<g stroke="#3a2a55" stroke-width="3" stroke-linecap="round">
      <circle cx="78" cy="100" r="13" fill="#fff" fill-opacity=".2"/><circle cx="122" cy="100" r="13" fill="#fff" fill-opacity=".2"/>
      <path d="M91 98 Q100 93 109 98 M65 97 L54 94 M135 97 L146 94" fill="none"/></g>`,
  'heart-glasses': (p) => `<g stroke="${p.line}" stroke-width="2.5" stroke-linejoin="round">
      <path d="${heartPath(78, 100, 13)}" fill="#ff4f8b" fill-opacity=".9"/>
      <path d="${heartPath(122, 100, 13)}" fill="#ff4f8b" fill-opacity=".9"/>
      <path d="M91 96 Q100 92 109 96" fill="none" stroke-linecap="round"/>
      <ellipse cx="72" cy="95" rx="3" ry="2" fill="#fff" stroke="none" opacity=".8"/>
      <ellipse cx="116" cy="95" rx="3" ry="2" fill="#fff" stroke="none" opacity=".8"/></g>`,
  bowtie: (p) => `<g stroke="${p.line}" stroke-width="2.5" stroke-linejoin="round">
      <path d="M100 125 L84 116 Q80 125 84 134 Z" fill="#ff5f6d"/><path d="M100 125 L116 116 Q120 125 116 134 Z" fill="#ff5f6d"/>
      <rect x="95" y="120.5" width="10" height="9" rx="3" fill="#e0485a"/>
      <g fill="#fff" fill-opacity=".75" stroke="none"><circle cx="88" cy="122" r="1.6"/><circle cx="89" cy="129" r="1.6"/><circle cx="112" cy="122" r="1.6"/><circle cx="111" cy="129" r="1.6"/></g></g>`,
  scarf: (p) => `<g stroke-linejoin="round">
      <path d="M38 112 Q100 136 162 112 L166 124 Q100 148 34 124 Z" fill="#6fd6c4" stroke="${p.line}" stroke-width="2.5"/>
      <path d="M37 118.5 Q100 142 164 118.5" stroke="#fff" stroke-opacity=".85" stroke-width="3" fill="none"/>
      <path d="M124 132 L134 154 Q128 157 121 155 L114 134 Z" fill="#6fd6c4" stroke="${p.line}" stroke-width="2.5"/>
      <path d="M119 141 L129 140 M122 148 L131 147" stroke="#fff" stroke-opacity=".85" stroke-width="2.5" stroke-linecap="round"/></g>`,
  'pearl-necklace': (p) => `<g>${pearlsAlong(p)}</g>`,
};

const BODY = 'M38 112 C36 70 66 48 100 48 C134 48 164 70 162 112 C166 124 172 136 168 144 Q156 156 142 147 Q128 157 114 148 Q100 158 86 148 Q72 157 58 147 Q44 156 32 144 C28 136 34 124 38 112 Z';
const SKIRT = 'M37 116 Q100 136 163 116 C167 126 172 136 168 144 Q156 156 142 147 Q128 157 114 148 Q100 158 86 148 Q72 157 58 147 Q44 156 32 144 C28 136 33 126 37 116 Z';

export function mendakoSVG({ equipped = {}, expression = 'normal', label = 'めんだこ', size = null } = {}) {
  const p = PALETTES[equipped.color] ?? PALETTES['color-coral'];
  const wear = (slot) => (equipped[slot] && OUTFITS[equipped[slot]] ? OUTFITS[equipped[slot]](p) : '');
  const finStroke = `stroke="${p.line}" stroke-width="3"`;
  const dims = size ? ` width="${size}" height="${size}"` : '';
  return `<svg class="m-svg" viewBox="0 0 200 200"${dims} xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${label}">
  <g class="m-fin m-fin-l"><ellipse cx="56" cy="62" rx="17" ry="11.5" transform="rotate(-38 56 62)" fill="${p.fin}" ${finStroke}/>
    <ellipse cx="54" cy="61" rx="9" ry="5.2" transform="rotate(-38 54 61)" fill="${p.finIn}"/></g>
  <g class="m-fin m-fin-r"><ellipse cx="144" cy="62" rx="17" ry="11.5" transform="rotate(38 144 62)" fill="${p.fin}" ${finStroke}/>
    <ellipse cx="146" cy="61" rx="9" ry="5.2" transform="rotate(38 146 61)" fill="${p.finIn}"/></g>
  <path d="${BODY}" fill="${p.body}"/>
  <path d="${SKIRT}" fill="${p.skirt}"/>
  <path d="${BODY}" fill="none" stroke="${p.line}" stroke-width="3" stroke-linejoin="round"/>
  <ellipse cx="72" cy="68" rx="12" ry="6.5" transform="rotate(-32 72 68)" fill="#fff" opacity=".45"/>
  <circle cx="88" cy="60" r="3" fill="#fff" opacity=".45"/>
  <ellipse cx="62" cy="114" rx="8" ry="4.5" fill="${p.cheek}" opacity=".55"/>
  <ellipse cx="138" cy="114" rx="8" ry="4.5" fill="${p.cheek}" opacity=".55"/>
  ${eyes(expression, p)}
  ${mouth(expression, p)}
  ${wear('neck')}${wear('face')}${wear('head')}
</svg>`;
}

// canvas で使うための画像。読み込み完了を待つ Promise を返す。
export function mendakoImage(options) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(mendakoSVG({ size: 200, ...options }))}`;
  });
}
