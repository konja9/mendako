// 水槽の模様替え：飾りと海底（背景）の定義。
// 飾りのタグは、遊びに来る生き物の好みと結びついている。

export type DecorTag = 'rock' | 'sand' | 'bone' | 'vent' | 'light' | 'coral' | 'hide';

export const TAG_LABEL: Record<DecorTag, string> = {
  rock: '岩',
  sand: '砂',
  bone: '骨',
  vent: '熱水',
  light: '光',
  coral: 'サンゴ',
  hide: 'かくれが',
};

export interface DecorDef {
  id: string;
  name: string;
  note: string;
  price: number;
  /** floor: 海底に置く（下端が基準） / float: 水中に浮かべる（中心が基準） */
  place: 'floor' | 'float';
  tags: DecorTag[];
  /** 水槽の論理座標での表示サイズ */
  w: number;
  h: number;
}

export const DECOR: DecorDef[] = [
  { id: 'rock', name: '岩', note: 'ちょうどいい大きさ', price: 8, place: 'floor', tags: ['rock', 'hide'], w: 90, h: 50 },
  { id: 'big-rock', name: '大きな岩', note: '裏にかくれられる', price: 25, place: 'floor', tags: ['rock', 'hide'], w: 140, h: 90 },
  { id: 'sea-pen', name: 'ウミエラ', note: 'ふれるとほんのり光る', price: 15, place: 'floor', tags: ['coral', 'light'], w: 40, h: 96 },
  { id: 'deep-coral', name: '深海サンゴ', note: '桃色の枝サンゴ', price: 30, place: 'floor', tags: ['coral'], w: 100, h: 100 },
  { id: 'sea-lily', name: 'ウミユリ', note: '花のように見えて動物', price: 25, place: 'floor', tags: ['coral'], w: 56, h: 110 },
  { id: 'shell', name: '貝がら', note: '砂の上にころん', price: 6, place: 'floor', tags: ['sand'], w: 44, h: 32 },
  { id: 'octopus-pot', name: 'タコつぼ', note: 'せまいところは落ち着く', price: 18, place: 'floor', tags: ['hide', 'sand'], w: 64, h: 56 },
  { id: 'whale-bone', name: 'クジラの骨', note: '深海のにぎやかな場所', price: 60, place: 'floor', tags: ['bone'], w: 190, h: 70 },
  { id: 'chimney', name: '熱水チムニー', note: '温かい水がわき出る', price: 70, place: 'floor', tags: ['vent'], w: 70, h: 150 },
  { id: 'anchor', name: '沈没船のいかり', note: 'さびついた古いいかり', price: 35, place: 'floor', tags: ['rock', 'hide'], w: 80, h: 110 },
  { id: 'chest', name: '宝箱', note: 'ふたが少し開いている', price: 45, place: 'floor', tags: ['hide'], w: 80, h: 64 },
  { id: 'lantern-lamp', name: 'ちょうちんライト', note: 'やさしい光で照らす', price: 40, place: 'float', tags: ['light'], w: 44, h: 64 },
  { id: 'jelly-mobile', name: 'クラゲのモビール', note: 'ゆらゆら光る', price: 30, place: 'float', tags: ['light'], w: 60, h: 84 },
  { id: 'glass-float', name: '浮き玉', note: '網からはぐれたガラスの浮き', price: 20, place: 'float', tags: ['hide'], w: 50, h: 58 },
  { id: 'driftwood', name: '漂う流木', note: '水の中をゆっくり漂う', price: 25, place: 'float', tags: ['hide', 'rock'], w: 110, h: 40 },
  { id: 'siphonophore', name: 'クダクラゲのリボン', note: '長くたなびいて光る', price: 45, place: 'float', tags: ['light', 'coral'], w: 36, h: 130 },
  { id: 'plankton', name: '光るプランクトン', note: '小さな光の群れ', price: 35, place: 'float', tags: ['light'], w: 90, h: 70 },
];

export const DECOR_BY_ID: Record<string, DecorDef> = Object.fromEntries(DECOR.map((d) => [d.id, d]));

export interface FloorDef {
  id: string;
  name: string;
  note: string;
  price: number;
  tags: DecorTag[];
  /** 奥の砂丘・手前の砂丘・小石の色 */
  colors: { back: number; front: number; speck: number };
}

export const FLOORS: FloorDef[] = [
  { id: 'sand', name: '砂地', note: 'やわらかい泥と砂', price: 0, tags: ['sand'], colors: { back: 0x11305c, front: 0x0b2248, speck: 0x2b5190 } },
  { id: 'rocky', name: '岩場', note: 'ごつごつした海底', price: 30, tags: ['rock'], colors: { back: 0x1b2d57, front: 0x111f42, speck: 0x3a4f80 } },
  { id: 'vent-field', name: '熱水域', note: '地面の下から熱い水', price: 60, tags: ['vent'], colors: { back: 0x2a2448, front: 0x1c1733, speck: 0xc0703f } },
  { id: 'bone-valley', name: '鯨骨の谷', note: '骨が眠る静かな谷', price: 60, tags: ['bone'], colors: { back: 0x22304f, front: 0x161f38, speck: 0xd8cdb8 } },
];

export const FLOOR_BY_ID: Record<string, FloorDef> = Object.fromEntries(FLOORS.map((f) => [f.id, f]));

/** 水槽に置ける飾りの数の上限（見た目とスマホの負荷のため） */
export const MAX_PLACED = 12;

/** 置ける範囲（水槽の論理座標。y=0 が海底の線、上がマイナス） */
export const PLACE_BOUNDS = {
  x: [24, 376] as const,
  floorY: [-44, 4] as const,
  floatY: [-520, -90] as const,
};

/** 置き場所の種類に合わせて、水槽の中に収まる位置に直す */
export function clampPlacement(def: DecorDef, x: number, y: number): { x: number; y: number } {
  const [yMin, yMax] = def.place === 'floor' ? PLACE_BOUNDS.floorY : PLACE_BOUNDS.floatY;
  return {
    x: Math.round(Math.max(PLACE_BOUNDS.x[0], Math.min(PLACE_BOUNDS.x[1], x))),
    y: Math.round(Math.max(yMin, Math.min(yMax, y))),
  };
}
