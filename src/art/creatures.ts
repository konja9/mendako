// 深海図鑑の生き物の絵（SVG 文字列）。めんだこと同じ「太い線のステッカー風」の仮デザイン。
// 泳ぐ・歩く生き物は左向きに描く（右へ進むときは描画側で反転する）。

export interface CreatureArt {
  svg: string;
  w: number;
  h: number;
}

const art = (w: number, h: number, body: string): CreatureArt => ({
  w,
  h,
  svg: `<svg viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg">${body}</svg>`,
});

const eye = (x: number, y: number, r: number) =>
  `<circle cx="${x}" cy="${y}" r="${r}" fill="#1d1a2e"/><circle cx="${x + r * 0.35}" cy="${y - r * 0.35}" r="${r * 0.38}" fill="#fff"/>`;

export const CREATURE_ART: Record<string, CreatureArt> = {
  hotaruika: art(
    60,
    90,
    `<path d="M22 12L10 22L22 26Z M38 12L50 22L38 26Z" fill="#ff9a80" stroke="#7a2d38" stroke-width="2" stroke-linejoin="round"/>
     <g stroke-linecap="round" fill="none">
       <path d="M21 60Q15 72 18 84M26 62Q24 75 25 87M30 62V89M34 62Q36 75 35 87M39 60Q45 72 42 84" stroke="#7a2d38" stroke-width="5"/>
       <path d="M21 60Q15 72 18 84M26 62Q24 75 25 87M30 62V89M34 62Q36 75 35 87M39 60Q45 72 42 84" stroke="#ff9a80" stroke-width="2.6"/>
     </g>
     <path d="M30 4C42 16 44 36 40 50L20 50C16 36 18 16 30 4Z" fill="#ffae94" stroke="#7a2d38" stroke-width="2.5" stroke-linejoin="round"/>
     <ellipse cx="30" cy="56" rx="14" ry="8.5" fill="#ffae94" stroke="#7a2d38" stroke-width="2.5"/>
     ${eye(24, 56, 4.2)}${eye(36, 56, 4.2)}
     <g fill="#8fe3ff"><circle cx="30" cy="14" r="1.8"/><circle cx="25" cy="23" r="1.8"/><circle cx="34" cy="27" r="1.8"/><circle cx="27" cy="36" r="1.8"/><circle cx="35" cy="41" r="1.8"/>
       <circle cx="18" cy="84" r="2.6"/><circle cx="25" cy="87" r="2.6"/><circle cx="30" cy="89" r="2.6"/><circle cx="35" cy="87" r="2.6"/><circle cx="42" cy="84" r="2.6"/></g>`,
  ),
  hadakaiwashi: art(
    100,
    56,
    `<path d="M44 13L52 3L60 14Z" fill="#7f97bd" stroke="#2e3f66" stroke-width="2" stroke-linejoin="round"/>
     <path d="M8 28C18 10 58 8 78 20L96 10L94 28L96 46L78 36C58 48 18 46 8 28Z" fill="#9fb6d6" stroke="#2e3f66" stroke-width="2.5" stroke-linejoin="round"/>
     <path d="M14 32C30 42 58 42 76 34" stroke="#c9d8ee" stroke-width="5" fill="none" stroke-linecap="round"/>
     ${eye(23, 25, 7)}
     <path d="M9 29L15 30" stroke="#2e3f66" stroke-width="2" stroke-linecap="round"/>
     <g fill="#8fe3ff" stroke="#e8fbff" stroke-width=".8"><circle cx="30" cy="38" r="2.3"/><circle cx="40" cy="40" r="2.3"/><circle cx="50" cy="40.5" r="2.3"/><circle cx="60" cy="39" r="2.3"/><circle cx="70" cy="36" r="2.3"/></g>`,
  ),
  demenigisu: art(
    110,
    70,
    `<path d="M14 44C18 30 44 26 72 32L96 22L92 42L96 62L72 52C44 60 18 58 14 44Z" fill="#6f7fae" stroke="#2e3666" stroke-width="2.5" stroke-linejoin="round"/>
     <path d="M50 50C56 64 70 66 72 56Z" fill="#8d9bc8" stroke="#2e3666" stroke-width="2" stroke-linejoin="round"/>
     <ellipse cx="38" cy="29" rx="24" ry="20" fill="#cdefff" fill-opacity=".38" stroke="#bfe9ff" stroke-width="2"/>
     <ellipse cx="31" cy="29" rx="4.8" ry="8.5" fill="#5fe08a" stroke="#2a8a55" stroke-width="1.6"/>
     <ellipse cx="44" cy="27" rx="4.8" ry="8.5" fill="#5fe08a" stroke="#2a8a55" stroke-width="1.6"/>
     <circle cx="31" cy="22" r="2.8" fill="#1d1a2e"/><circle cx="44" cy="20" r="2.8" fill="#1d1a2e"/>
     <path d="M26 16C30 12 38 11 44 13" stroke="#fff" stroke-opacity=".7" stroke-width="2.5" fill="none" stroke-linecap="round"/>
     <circle cx="19" cy="43" r="2" fill="#1d1a2e"/><circle cx="24" cy="44.5" r="2" fill="#1d1a2e"/>
     <path d="M14 47L19 48" stroke="#2e3666" stroke-width="1.8" stroke-linecap="round"/>`,
  ),
  chochin: art(
    100,
    90,
    `<path d="M40 30C36 8 60 0 72 10" stroke="#4a3d66" stroke-width="3" fill="none" stroke-linecap="round"/>
     <circle cx="74" cy="12" r="13" fill="#fff5a8" opacity=".35"/>
     <circle cx="74" cy="12" r="6" fill="#fff1a0" stroke="#6b5a2e" stroke-width="2"/>
     <path d="M84 52L98 40L98 72Z" fill="#4a3f70" stroke="#2a2140" stroke-width="2.5" stroke-linejoin="round"/>
     <ellipse cx="50" cy="56" rx="38" ry="30" fill="#5d4f86" stroke="#2a2140" stroke-width="2.5"/>
     <path d="M14 58C24 78 46 80 56 66C42 72 24 68 14 58Z" fill="#2a2140"/>
     <path d="M20 64L22 69L25 65M29 69L31 74L33 70M38 71L40 75L42 71M47 69L49 73L51 68" stroke="#fff" stroke-width="1.6" fill="none" stroke-linejoin="round"/>
     <circle cx="36" cy="44" r="5.5" fill="#fff"/><circle cx="35" cy="45" r="3" fill="#1d1a2e"/>
     <g fill="#7a6aa8"><circle cx="62" cy="44" r="2.2"/><circle cx="70" cy="56" r="2.2"/><circle cx="60" cy="68" r="2.2"/></g>`,
  ),
  daiogusoku: art(
    120,
    66,
    `<g stroke="#8a7a66" stroke-width="3" stroke-linecap="round"><path d="M24 56L20 64M36 57L33 65M48 58L46 66M60 58L60 66M72 58L74 66M84 57L87 65M96 56L100 64"/></g>
     <path d="M100 50L118 44L116 58Z" fill="#c9bba9" stroke="#5e5244" stroke-width="2" stroke-linejoin="round"/>
     <path d="M10 56C10 26 36 10 64 10C94 10 112 28 112 56Z" fill="#d9ccbd" stroke="#5e5244" stroke-width="2.5" stroke-linejoin="round"/>
     <g stroke="#b8a894" stroke-width="2" fill="none"><path d="M34 16Q28 34 32 56M46 12Q40 34 44 56M58 11Q52 34 56 56M70 11Q66 34 68 56M82 13Q80 34 82 56M94 19Q94 36 96 56"/></g>
     <path d="M12 36Q2 24 1 12M15 33Q9 20 11 8" stroke="#8a7a66" stroke-width="2" fill="none" stroke-linecap="round"/>
     <ellipse cx="19" cy="41" rx="5.5" ry="7.5" fill="#2a2230"/><circle cx="21" cy="37.5" r="2" fill="#fff"/>`,
  ),
  takaashi: art(
    140,
    92,
    `<g fill="none" stroke-linecap="round" stroke-linejoin="round">
       <path d="M50 50L26 28L6 62M50 55L22 44L8 80M53 60L30 60L20 88M90 50L114 28L134 62M90 55L118 44L132 80M87 60L110 60L120 88" stroke="#6b2a1a" stroke-width="7"/>
       <path d="M50 50L26 28L6 62M50 55L22 44L8 80M53 60L30 60L20 88M90 50L114 28L134 62M90 55L118 44L132 80M87 60L110 60L120 88" stroke="#ff8a5c" stroke-width="4"/>
     </g>
     <path d="M52 62L40 76M88 62L100 76" stroke="#6b2a1a" stroke-width="6" stroke-linecap="round"/>
     <path d="M52 62L40 76M88 62L100 76" stroke="#ff9a70" stroke-width="3.5" stroke-linecap="round"/>
     <path d="M62 36L60 26M78 36L80 26" stroke="#6b2a1a" stroke-width="3" stroke-linecap="round"/>
     <ellipse cx="70" cy="52" rx="26" ry="20" fill="#ff8a5c" stroke="#6b2a1a" stroke-width="2.5"/>
     ${eye(60, 24, 3.6)}${eye(80, 24, 3.6)}
     <g fill="#ffe0cc"><circle cx="61" cy="45" r="3"/><circle cx="76" cy="42" r="2.4"/><circle cx="82" cy="54" r="2.8"/><circle cx="66" cy="58" r="2.2"/></g>
     <path d="M64 60Q70 64 76 60" stroke="#6b2a1a" stroke-width="2" fill="none" stroke-linecap="round"/>`,
  ),
  ooguchiboya: art(
    70,
    90,
    `<path d="M36 88Q31 72 38 58" stroke="#b56a82" stroke-width="9" fill="none" stroke-linecap="round"/>
     <path d="M36 88Q31 72 38 58" stroke="#f2c6d3" stroke-width="5" fill="none" stroke-linecap="round"/>
     <path d="M12 40C8 14 52 6 62 30C66 48 52 62 36 60C22 58 14 50 12 40Z" fill="#ffe1ea" stroke="#b56a82" stroke-width="2.5" stroke-linejoin="round"/>
     <path d="M30 34C42 22 62 26 60 40C56 52 40 52 30 34Z" fill="#e8657d" stroke="#b56a82" stroke-width="2" stroke-linejoin="round"/>
     <path d="M36 36C44 30 54 32 55 39" stroke="#ffb3c2" stroke-width="2" fill="none" stroke-linecap="round"/>
     <path d="M18 26C22 18 32 14 40 15" stroke="#fff" stroke-width="2.5" fill="none" stroke-linecap="round"/>`,
  ),
  honekui: art(
    80,
    52,
    `<path d="M6 42C2 36 8 32 12 36H68C72 32 78 36 74 42C78 48 72 52 68 48H12C8 52 2 48 6 42Z" fill="#efe6d6" stroke="#6e6250" stroke-width="2.2" stroke-linejoin="round"/>
     <g stroke="#b13a50" stroke-width="2.4" stroke-linecap="round" fill="none"><path d="M24 38Q22 28 24 20M40 38Q41 26 40 14M56 38Q58 28 56 22"/></g>
     <g fill="#ff5f7a" stroke="#b13a50" stroke-width="1.4">
       <ellipse cx="20" cy="16" rx="4" ry="6" transform="rotate(-30 20 16)"/><ellipse cx="28" cy="16" rx="4" ry="6" transform="rotate(30 28 16)"/><ellipse cx="24" cy="12" rx="3.5" ry="5"/>
       <ellipse cx="36" cy="10" rx="4" ry="6.5" transform="rotate(-30 36 10)"/><ellipse cx="44" cy="10" rx="4" ry="6.5" transform="rotate(30 44 10)"/><ellipse cx="40" cy="6" rx="3.5" ry="5"/>
       <ellipse cx="52" cy="18" rx="3.6" ry="5.5" transform="rotate(-30 52 18)"/><ellipse cx="60" cy="18" rx="3.6" ry="5.5" transform="rotate(30 60 18)"/><ellipse cx="56" cy="14" rx="3.2" ry="4.6"/>
     </g>`,
  ),
  goemon: art(
    92,
    64,
    `<g stroke="#7a6a5a" stroke-width="2.6" stroke-linecap="round"><path d="M40 52L36 60M50 53L48 61M60 52L61 60M70 50L73 58"/></g>
     <path d="M30 36L10 28" stroke="#7a6a5a" stroke-width="7" stroke-linecap="round"/><path d="M30 36L10 28" stroke="#f3ece4" stroke-width="4" stroke-linecap="round"/>
     <path d="M12 22C4 20 2 30 6 34L14 32Z M6 34L2 40L12 36Z" fill="#f3ece4" stroke="#7a6a5a" stroke-width="2" stroke-linejoin="round"/>
     <ellipse cx="52" cy="36" rx="30" ry="18" fill="#f3ece4" stroke="#7a6a5a" stroke-width="2.5"/>
     <path d="M80 36C88 38 90 46 84 50L76 46Z" fill="#e9dfd2" stroke="#7a6a5a" stroke-width="2" stroke-linejoin="round"/>
     <path d="M36 24C46 20 60 20 70 24" stroke="#d9cfc2" stroke-width="2" fill="none" stroke-linecap="round"/>
     <g stroke="#c8baa8" stroke-width="1.6" stroke-linecap="round"><path d="M32 46L30 52M36 48L35 55M41 49L40 56M46 50L46 57M51 50L52 57M56 50L57 57M61 49L63 56M66 48L68 54M71 46L73 52"/></g>
     ${eye(30, 28, 3)}`,
  ),
};
