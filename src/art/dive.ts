// 深海探索で拾う素材と、ぶつかると困るもの（SVG 文字列）。

const svg = (w: number, h: number, body: string) => ({
  w,
  h,
  svg: `<svg viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg">${body}</svg>`,
});

export const MATERIAL_ART: Record<string, { svg: string; w: number; h: number }> = {
  shell: svg(
    36,
    28,
    `<path d="M18 26L4 11C8 2 28 2 32 11Z" fill="#ffd9c7" stroke="#8a5a4a" stroke-width="2" stroke-linejoin="round"/>
     <path d="M18 26L10 7M18 26L16 4M18 26L21 4M18 26L27 7" stroke="#e8b3a0" stroke-width="1.6"/>`,
  ),
  'glow-sand': svg(
    36,
    28,
    `<ellipse cx="18" cy="20" rx="15" ry="7" fill="#8fe3ff" opacity=".25"/>
     <path d="M4 24C8 14 28 14 32 24Z" fill="#d8f6ff" stroke="#4aa8c8" stroke-width="2" stroke-linejoin="round"/>
     <g fill="#8fe3ff"><circle cx="12" cy="18" r="1.8"/><circle cx="20" cy="15" r="2"/><circle cx="26" cy="19" r="1.6"/><circle cx="17" cy="21" r="1.4"/></g>`,
  ),
  'bone-chip': svg(
    36,
    24,
    `<path d="M6 12C2 8 6 3 10 7H26C30 3 34 8 30 12C34 16 30 21 26 17H10C6 21 2 16 6 12Z" fill="#efe6d6" stroke="#6e6250" stroke-width="2" stroke-linejoin="round"/>`,
  ),
  'pretty-stone': svg(
    32,
    30,
    `<ellipse cx="16" cy="16" rx="14" ry="12" fill="#ffb3e6" opacity=".25"/>
     <path d="M16 3L27 11L23 26H9L5 11Z" fill="#c9a8ff" stroke="#5a3a9a" stroke-width="2" stroke-linejoin="round"/>
     <path d="M16 3L16 26M5 11L27 11M9 26L16 11L23 26" stroke="#efe4ff" stroke-width="1.3" fill="none"/>`,
  ),
  trash: svg(
    34,
    34,
    `<path d="M5 12Q3 30 9 31H25Q31 30 29 12Z" fill="#d6e2f0" fill-opacity=".6" stroke="#fff" stroke-width="1.8" stroke-linejoin="round"/>
     <path d="M7 12Q8 2 13 12M27 12Q26 2 21 12" stroke="#fff" stroke-width="1.8" fill="none"/>`,
  ),
};

export const HAZARD_ART: Record<string, { svg: string; w: number; h: number }> = {
  // 大きな魚の影。近くを横切る
  shadow: svg(
    190,
    72,
    `<path d="M6 36C30 10 110 6 150 30L184 10L178 36L184 62L150 42C110 66 30 62 6 36Z" fill="#0a1026" stroke="#1c2a52" stroke-width="3" stroke-linejoin="round"/>
     <path d="M70 12L88 2L96 16Z" fill="#0a1026" stroke="#1c2a52" stroke-width="3" stroke-linejoin="round"/>
     <circle cx="34" cy="30" r="4" fill="#ffd66b"/>`,
  ),
  // からまった網とゴミのかたまり
  trashball: svg(
    76,
    70,
    `<circle cx="38" cy="36" r="30" fill="#2a3a52" fill-opacity=".8" stroke="#6a7e9a" stroke-width="2.4"/>
     <g stroke="#9ab0cc" stroke-width="1.8" fill="none"><path d="M10 30C24 20 52 50 66 38M14 50C30 34 50 20 62 22M24 10C30 30 44 50 40 66M52 8C44 26 30 44 20 62"/></g>
     <path d="M44 20Q42 32 54 30Q52 40 44 42Z" fill="#d6e2f0" fill-opacity=".7"/>
     <circle cx="26" cy="42" r="5" fill="#e0485a" fill-opacity=".8"/>`,
  ),
};
