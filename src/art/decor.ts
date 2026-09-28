// 水槽の飾りの絵（SVG 文字列）。viewBox は各飾りの論理サイズ（w×h）と同じ。
// 主役のめんだこより少し落ち着いた色にして、画面がうるさくならないようにしている。

const LINE = '#0a1a38';

const svg = (w: number, h: number, body: string) =>
  `<svg viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg">${body}</svg>`;

export const DECOR_ART: Record<string, string> = {
  rock: svg(
    90,
    50,
    `<path d="M6 48C2 34 12 20 28 18C36 6 58 6 66 18C80 20 90 34 86 48Z" fill="#24487f" stroke="#10254a" stroke-width="2"/>
     <path d="M26 24C34 14 52 12 60 20" stroke="#3d68a8" stroke-width="3" fill="none" stroke-linecap="round"/>`,
  ),
  'big-rock': svg(
    140,
    90,
    `<path d="M6 88C2 62 16 44 38 42C44 18 82 8 100 28C122 26 138 54 134 88Z" fill="#264c88" stroke="#10254a" stroke-width="2"/>
     <path d="M70 88C66 70 76 58 92 58C104 58 116 70 114 88Z" fill="#1d3f75"/>
     <path d="M44 44C54 26 84 20 98 32" stroke="#4470b0" stroke-width="3.5" fill="none" stroke-linecap="round"/>
     <circle cx="30" cy="70" r="3" fill="#3d68a8"/><circle cx="54" cy="62" r="2.2" fill="#3d68a8"/><circle cx="118" cy="66" r="2.6" fill="#3d68a8"/>`,
  ),
  'sea-pen': svg(
    40,
    96,
    `<path d="M20 94Q18 56 21 8" stroke="#ffb7c9" stroke-width="3" fill="none" stroke-linecap="round"/>
     <g fill="#ffb7c9" fill-opacity=".55"><ellipse cx="12" cy="22" rx="8" ry="3" transform="rotate(-25 12 22)"/><ellipse cx="29" cy="20" rx="8" ry="3" transform="rotate(25 29 20)"/><ellipse cx="11" cy="34" rx="9" ry="3.2" transform="rotate(-25 11 34)"/><ellipse cx="29" cy="32" rx="9" ry="3.2" transform="rotate(25 29 32)"/><ellipse cx="11" cy="46" rx="9" ry="3.2" transform="rotate(-25 11 46)"/><ellipse cx="29" cy="44" rx="9" ry="3.2" transform="rotate(25 29 44)"/><ellipse cx="12" cy="57" rx="7" ry="2.8" transform="rotate(-25 12 57)"/><ellipse cx="28" cy="56" rx="7" ry="2.8" transform="rotate(25 28 56)"/></g>`,
  ),
  'deep-coral': svg(
    100,
    100,
    `<g stroke-linecap="round" fill="none">
       <path d="M50 96L50 60M50 72L30 46M50 64L72 38M30 46L22 28M30 46L40 26M72 38L64 20M72 38L86 24M50 60L53 40" stroke="#7a2d48" stroke-width="10"/>
       <path d="M50 96L50 60M50 72L30 46M50 64L72 38M30 46L22 28M30 46L40 26M72 38L64 20M72 38L86 24M50 60L53 40" stroke="#ff9fb8" stroke-width="6"/>
     </g>
     <g fill="#ffc9d6" stroke="#7a2d48" stroke-width="2"><circle cx="22" cy="28" r="4.5"/><circle cx="40" cy="26" r="4.5"/><circle cx="64" cy="20" r="4.5"/><circle cx="86" cy="24" r="4.5"/><circle cx="53" cy="40" r="4.5"/></g>
     <path d="M34 98C36 88 64 88 66 98Z" fill="#17376a"/>`,
  ),
  'sea-lily': svg(
    56,
    110,
    `<path d="M28 108Q26 76 28 44" stroke="#b58a3a" stroke-width="6" fill="none" stroke-linecap="round"/>
     <path d="M28 108Q26 76 28 44" stroke="#ffd66b" stroke-width="3" fill="none" stroke-linecap="round"/>
     <g stroke="#ffd66b" stroke-width="3" fill="none" stroke-linecap="round">
       <path d="M28 44C18 36 10 24 12 8"/><path d="M28 44C22 30 22 18 26 4"/><path d="M28 44C36 32 38 20 34 6"/><path d="M28 44C40 36 48 24 46 10"/>
     </g>
     <g stroke="#ffe7a8" stroke-width="1.6" stroke-linecap="round">
       <path d="M13 30L7 28M14 22L8 18M18 36L13 38M23 26L17 24M24 16L19 12M33 24L39 22M34 14L40 10M38 36L44 38M42 28L48 26M44 18L50 16"/>
     </g>
     <ellipse cx="28" cy="45" rx="6" ry="4" fill="#ffd66b" stroke="#b58a3a" stroke-width="2"/>`,
  ),
  shell: svg(
    44,
    32,
    `<path d="M22 30L6 13C11 2 33 2 38 13Z" fill="#ffd9c7" stroke="#8a5a4a" stroke-width="2.2" stroke-linejoin="round"/>
     <path d="M22 30L12 8M22 30L19 5M22 30L25 5M22 30L32 8" stroke="#e8b3a0" stroke-width="1.8"/>
     <path d="M16 30H28L26 25H18Z" fill="#f5c3ae" stroke="#8a5a4a" stroke-width="2" stroke-linejoin="round"/>`,
  ),
  'octopus-pot': svg(
    64,
    56,
    `<ellipse cx="32" cy="52" rx="28" ry="4" fill="#07142e" opacity=".5"/>
     <path d="M8 44C2 30 8 12 26 8C44 4 58 16 60 30C62 44 50 52 34 52C22 52 12 50 8 44Z" fill="#c9774f" stroke="#5a2e1c" stroke-width="2.5"/>
     <ellipse cx="18" cy="30" rx="10" ry="14" fill="#3a1d1a" stroke="#5a2e1c" stroke-width="2.5"/>
     <path d="M30 10C28 22 30 40 34 51" stroke="#e39a73" stroke-width="3" fill="none"/>
     <path d="M44 12C46 24 46 40 44 50" stroke="#a85e3b" stroke-width="2" fill="none"/>`,
  ),
  'whale-bone': svg(
    190,
    70,
    `<g fill="#efe6d6" stroke="#6e6250" stroke-width="2.5" stroke-linejoin="round">
       <path d="M36 62C30 40 44 16 70 10" fill="none" stroke-width="7" stroke-linecap="round"/>
       <path d="M36 62C30 40 44 16 70 10" fill="none" stroke="#efe6d6" stroke-width="3.5" stroke-linecap="round"/>
       <path d="M82 64C78 42 92 20 116 14" fill="none" stroke-width="7" stroke-linecap="round"/>
       <path d="M82 64C78 42 92 20 116 14" fill="none" stroke="#efe6d6" stroke-width="3.5" stroke-linecap="round"/>
       <path d="M128 64C126 46 138 28 158 22" fill="none" stroke-width="7" stroke-linecap="round"/>
       <path d="M128 64C126 46 138 28 158 22" fill="none" stroke="#efe6d6" stroke-width="3.5" stroke-linecap="round"/>
       <rect x="12" y="50" width="30" height="16" rx="6"/><rect x="50" y="52" width="30" height="15" rx="6"/>
       <rect x="88" y="53" width="30" height="14" rx="6"/><rect x="126" y="54" width="28" height="13" rx="6"/><rect x="160" y="56" width="24" height="11" rx="5"/>
     </g>
     <g fill="#d6cab4"><circle cx="27" cy="58" r="3"/><circle cx="65" cy="59" r="3"/><circle cx="103" cy="60" r="3"/><circle cx="140" cy="60" r="2.6"/></g>`,
  ),
  chimney: svg(
    70,
    150,
    `<path d="M6 148C8 132 18 126 22 116L20 70C18 50 24 30 30 18L42 18C48 34 50 54 48 74L50 116C54 128 64 134 64 148Z" fill="#4a3f4f" stroke="#1e1824" stroke-width="2.5" stroke-linejoin="round"/>
     <path d="M26 40C32 44 38 42 44 46M24 72C32 76 40 74 48 78M24 100C32 104 42 102 50 106" stroke="#c0703f" stroke-width="3" fill="none" stroke-linecap="round"/>
     <path d="M30 18C28 10 36 4 36 4C36 4 44 10 42 18" fill="#2a2330"/>
     <g fill="#6b6475" opacity=".7"><circle cx="36" cy="6" r="6"/><circle cx="30" cy="0" r="5"/><circle cx="42" cy="-2" r="5"/></g>
     <path d="M10 144C16 136 30 134 36 140" stroke="#ffb36b" stroke-width="2" fill="none" opacity=".6"/>`,
  ),
  anchor: svg(
    80,
    110,
    `<g fill="none" stroke-linecap="round" stroke-linejoin="round">
       <circle cx="40" cy="14" r="9" stroke="#3a2c24" stroke-width="8"/><circle cx="40" cy="14" r="9" stroke="#8a6f5a" stroke-width="4.5"/>
       <path d="M40 22V96M22 34H58" stroke="#3a2c24" stroke-width="10"/><path d="M40 22V96M22 34H58" stroke="#8a6f5a" stroke-width="6"/>
       <path d="M10 70C12 90 26 100 40 100C54 100 68 90 70 70" stroke="#3a2c24" stroke-width="10"/>
       <path d="M10 70C12 90 26 100 40 100C54 100 68 90 70 70" stroke="#8a6f5a" stroke-width="6"/>
     </g>
     <path d="M4 66L10 58L16 68Z M64 68L70 58L76 66Z" fill="#8a6f5a" stroke="#3a2c24" stroke-width="2.5" stroke-linejoin="round"/>
     <g fill="#b86b3c" opacity=".7"><circle cx="38" cy="52" r="2.4"/><circle cx="43" cy="74" r="2"/><circle cx="24" cy="90" r="2.2"/></g>
     <path d="M0 108C14 100 66 100 80 108Z" fill="#0f2750"/>`,
  ),
  chest: svg(
    80,
    64,
    `<ellipse cx="40" cy="30" rx="26" ry="10" fill="#fff1a0" opacity=".45"/>
     <path d="M8 34H72V60H8Z" fill="#a86b3c" stroke="#4a2a18" stroke-width="2.5" stroke-linejoin="round"/>
     <path d="M8 34L14 14C30 8 50 8 66 14L72 34" fill="#bd7c47" stroke="#4a2a18" stroke-width="2.5" stroke-linejoin="round" transform="rotate(-8 8 34)"/>
     <path d="M8 44H72M36 34V60M44 34V60" stroke="#ffd66b" stroke-width="3"/>
     <rect x="35" y="40" width="10" height="9" rx="2" fill="#ffd66b" stroke="#4a2a18" stroke-width="1.6"/>
     <g fill="#fbf7ff" stroke="#b9a5f6" stroke-width="1.4"><circle cx="24" cy="31" r="3.5"/><circle cx="31" cy="29" r="3"/><circle cx="52" cy="30" r="3.5"/></g>`,
  ),
  'lantern-lamp': svg(
    44,
    64,
    `<path d="M22 0V10" stroke="#8fa6c8" stroke-width="2"/>
     <circle cx="22" cy="36" r="21" fill="#fff5a8" opacity=".25"/>
     <rect x="15" y="9" width="14" height="5" rx="2" fill="#6b5a8e" stroke="${LINE}" stroke-width="1.6"/>
     <ellipse cx="22" cy="36" rx="15" ry="21" fill="#ffe7a0" stroke="#b5873a" stroke-width="2.2"/>
     <path d="M22 15C14 22 14 50 22 57M22 15C30 22 30 50 22 57M9 30H35M9 42H35" stroke="#e8b95a" stroke-width="1.5" fill="none"/>
     <rect x="15" y="56" width="14" height="5" rx="2" fill="#6b5a8e" stroke="${LINE}" stroke-width="1.6"/>`,
  ),
  'jelly-mobile': svg(
    60,
    84,
    `<path d="M30 0V8" stroke="#8fa6c8" stroke-width="2"/>
     <path d="M6 34C6 16 16 8 30 8C44 8 54 16 54 34C46 38 14 38 6 34Z" fill="#c9b6ff" fill-opacity=".8" stroke="#6a55b8" stroke-width="2.2"/>
     <path d="M16 22C18 16 24 13 30 13" stroke="#fff" stroke-opacity=".7" stroke-width="3" fill="none" stroke-linecap="round"/>
     <g stroke="#b9a5f6" stroke-width="2.2" fill="none" stroke-linecap="round">
       <path d="M14 37C10 48 18 56 14 68"/><path d="M24 38C22 52 28 62 24 80"/><path d="M36 38C38 52 32 62 36 80"/><path d="M46 37C50 48 42 56 46 68"/>
     </g>
     <g fill="#8fe3ff"><circle cx="14" cy="68" r="2.4"/><circle cx="24" cy="80" r="2.4"/><circle cx="36" cy="80" r="2.4"/><circle cx="46" cy="68" r="2.4"/></g>`,
  ),
};
