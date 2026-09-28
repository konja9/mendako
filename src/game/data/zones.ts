// 深海探索の行き先（ゾーン）。今回は中深層と漸深層の2つ。

export interface ZoneDef {
  id: string;
  name: string;
  /** 潜り始めと底の深さ（m） */
  top: number;
  bottom: number;
  note: string;
  /** 図鑑でこの数以上見つけていると行ける */
  unlockFound: number;
  /** 出てくる生き物と出やすさ（重み） */
  creatures: { id: string; weight: number }[];
  /** 1回の探索で出てくる生き物の数 */
  creatureCount: number;
  /** 背景の色（上端・下端） */
  colors: [number, number];
}

export const ZONES: ZoneDef[] = [
  {
    id: 'meso',
    name: '中深層',
    top: 200,
    bottom: 1000,
    note: 'わずかに光が届く、たそがれの海',
    unlockFound: 0,
    creatures: [
      { id: 'hotaruika', weight: 5 },
      { id: 'hadakaiwashi', weight: 5 },
      { id: 'demenigisu', weight: 3 },
      { id: 'chochin', weight: 2 },
      { id: 'koumori', weight: 3 },
      { id: 'ryugu', weight: 1.5 },
      { id: 'kairou', weight: 2.5 },
    ],
    creatureCount: 8,
    colors: [0x123a6b, 0x061433],
  },
  {
    id: 'bathy',
    name: '漸深層',
    top: 1000,
    bottom: 3000,
    note: '光がまったく届かない、真っ暗な海',
    unlockFound: 6,
    creatures: [
      { id: 'fukurou', weight: 4 },
      { id: 'atolla', weight: 4 },
      { id: 'mitsukuri', weight: 2 },
      { id: 'jumonji', weight: 3 },
      { id: 'hadakaiwashi', weight: 2 },
    ],
    creatureCount: 8,
    colors: [0x061433, 0x02060f],
  },
];

export const ZONE_BY_ID: Record<string, ZoneDef> = Object.fromEntries(ZONES.map((z) => [z.id, z]));
