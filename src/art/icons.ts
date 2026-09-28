// UI アイコンとごはんのアイコン（SVG 文字列）。

import type { FoodId } from '../game/data/care';

const ui = (body: string, extra = '') =>
  `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" ${extra}>${body}</svg>`;

export type IconName = 'food' | 'pet' | 'play' | 'dress' | 'moon' | 'sun' | 'menu' | 'close' | 'decor' | 'book' | 'flip' | 'store' | 'check' | 'back' | 'dive' | 'light' | 'up';

export const ICONS: Record<IconName, string> = {
  food: ui(
    '<path d="M3.5 11.5H20.5A8.5 7 0 0 1 3.5 11.5Z" fill="currentColor" fill-opacity=".18"/><circle cx="8" cy="7.2" r="1.3" fill="currentColor"/><circle cx="12" cy="5.2" r="1.3" fill="currentColor"/><circle cx="16" cy="7.2" r="1.3" fill="currentColor"/>',
  ),
  pet: ui('<path d="M12 20C6 16 3 12.5 3 9A4.5 4.5 0 0 1 12 6.5A4.5 4.5 0 0 1 21 9C21 12.5 18 16 12 20Z" fill="currentColor" fill-opacity=".18"/>'),
  play: ui('<path d="M12 3C12.8 8 16 11.2 21 12C16 12.8 12.8 16 12 21C11.2 16 8 12.8 3 12C8 11.2 11.2 8 12 3Z" fill="currentColor" fill-opacity=".18"/>'),
  dress: ui(
    '<path d="M12 12C9 7 4 7 4 10.5C4 14 8.5 15 12 12ZM12 12C15 7 20 7 20 10.5C20 14 15.5 15 12 12Z" fill="currentColor" fill-opacity=".18"/><path d="M11 13.5L8.5 19M13 13.5L15.5 19"/><circle cx="12" cy="12" r="1.8" fill="currentColor"/>',
  ),
  moon: ui('<path d="M19 14.5A7.5 7.5 0 1 1 9.5 5A6 6 0 0 0 19 14.5Z" fill="currentColor" fill-opacity=".18"/>'),
  sun: ui(
    '<circle cx="12" cy="12" r="4" fill="currentColor" fill-opacity=".18"/><path d="M12 2.5V4.5M12 19.5V21.5M2.5 12H4.5M19.5 12H21.5M5.3 5.3L6.7 6.7M17.3 17.3L18.7 18.7M5.3 18.7L6.7 17.3M17.3 6.7L18.7 5.3"/>',
  ),
  menu: ui('<path d="M5 7H19M5 12H19M5 17H19"/>'),
  // 模様替え：海底のサンゴと岩
  decor: ui(
    '<path d="M3 20H21"/><path d="M4 20C4 16 7 14 10 15C12 13 15 14 15 17C17 17 18 18 18 20Z" fill="currentColor" fill-opacity=".18"/><path d="M17 20V9M17 13L14 10M17 11L20 7M14 10L13 7" />',
  ),
  book: ui(
    '<path d="M4 5C6.5 4 9.5 4 12 6C14.5 4 17.5 4 20 5V19C17.5 18 14.5 18 12 20C9.5 18 6.5 18 4 19Z" fill="currentColor" fill-opacity=".18"/><path d="M12 6V20"/>',
  ),
  flip: ui('<path d="M12 4V20"/><path d="M9 7L4 12L9 17Z" fill="currentColor" fill-opacity=".18"/><path d="M15 7L20 12L15 17Z"/>'),
  store: ui('<path d="M4 9H20L18.5 20H5.5Z" fill="currentColor" fill-opacity=".18"/><path d="M9 9V6A3 3 0 0 1 15 6V9"/>'),
  check: ui('<path d="M5 12.5L10 17L19 7"/>'),
  back: ui('<path d="M15 5L8 12L15 19"/>'),
  // もぐる：下向きの矢印と泡
  dive: ui('<path d="M12 4V17M6.5 11.5L12 17L17.5 11.5"/><circle cx="18" cy="5" r="1.6" fill="currentColor"/><circle cx="6" cy="6.5" r="1.1" fill="currentColor"/><path d="M5 20.5H19"/>'),
  light: ui('<path d="M9 18H15M10 21H14"/><path d="M12 3A6 6 0 0 0 8 13.5C9 14.5 9 16 9 16H15S15 14.5 16 13.5A6 6 0 0 0 12 3Z" fill="currentColor" fill-opacity=".18"/>'),
  up: ui('<path d="M12 20V7M6.5 12.5L12 7L17.5 12.5"/><path d="M5 3.5H19"/>'),
  close: ui('<path d="M6 6L18 18M18 6L6 18"/>'),
};

export const PEARL =
  '<svg class="pearl-icon" viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="7.5" fill="#fbf7ff" stroke="#b9a5f6" stroke-width="2"/><circle cx="7.6" cy="7.4" r="2.3" fill="#fff"/><path d="M13.5 12.5A4.5 4.5 0 0 1 9 14.5" stroke="#d8ccfb" stroke-width="1.6" fill="none" stroke-linecap="round"/></svg>';

const LINE = '#4a2c3f';

export const FOOD_ICONS: Record<FoodId, string> = {
  // カイアシ類にはノープリウス眼という赤い目がひとつある。
  copepod: `<svg viewBox="0 0 48 48" aria-hidden="true">
    <path d="M20 13Q8 7 4 14M28 13Q40 7 44 14" stroke="${LINE}" stroke-width="2" fill="none" stroke-linecap="round"/>
    <path d="M24 33L19 43M24 33L29 43" stroke="${LINE}" stroke-width="2" stroke-linecap="round"/>
    <ellipse cx="24" cy="22" rx="8.5" ry="11.5" fill="#ffab66" stroke="${LINE}" stroke-width="2.2"/>
    <path d="M17 24H31M18 29H30" stroke="${LINE}" stroke-opacity=".35" stroke-width="1.6"/>
    <circle cx="24" cy="16" r="2.3" fill="#e0484f"/></svg>`,
  amphipod: `<svg viewBox="0 0 48 48" aria-hidden="true">
    <path d="M38 14Q44 6 47 8M36 13Q39 4 43 3" stroke="${LINE}" stroke-width="1.8" fill="none" stroke-linecap="round"/>
    <path d="M16 30L13 37M22 27L20 35M28 24L28 32M33 21L35 28" stroke="${LINE}" stroke-width="1.8" stroke-linecap="round"/>
    <path d="M8 32C6 19 19 8 34 11C41 12.5 42 19 38 21C29 17 19 22 16 33C13 36 9 36 8 32Z" fill="#ff9fa4" stroke="${LINE}" stroke-width="2.2" stroke-linejoin="round"/>
    <path d="M14 26Q16 22 19 21M20 20Q23 17 26 16M27 15Q30 13 33 13" stroke="${LINE}" stroke-opacity=".35" stroke-width="1.6" fill="none"/>
    <circle cx="36" cy="15" r="1.8" fill="${LINE}"/></svg>`,
  pudding: `<svg viewBox="0 0 48 48" aria-hidden="true">
    <ellipse cx="24" cy="40" rx="16" ry="3.5" fill="#dfe9ff" stroke="${LINE}" stroke-width="2"/>
    <path d="M13 39L17.5 17H30.5L35 39Z" fill="#ffe08a" stroke="${LINE}" stroke-width="2.2" stroke-linejoin="round"/>
    <path d="M17.5 17H30.5L29.5 23Q24 26 18.5 23Z" fill="#b8672e" stroke="${LINE}" stroke-width="2.2" stroke-linejoin="round"/>
    <circle cx="24" cy="13.5" r="3.4" fill="#ff5f7e" stroke="${LINE}" stroke-width="2"/>
    <circle cx="23" cy="12.5" r="1" fill="#fff"/></svg>`,
};

export const HEART =
  '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20C6 16 3 12.5 3 9A4.5 4.5 0 0 1 12 6.5A4.5 4.5 0 0 1 21 9C21 12.5 18 16 12 20Z" fill="#ff7fb0" stroke="#fff" stroke-width="1.5"/></svg>';

export const SPARKLE =
  '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2C12.9 8 16 11.1 22 12C16 12.9 12.9 16 12 22C11.1 16 8 12.9 2 12C8 11.1 11.1 8 12 2Z" fill="#fff4b8"/></svg>';
