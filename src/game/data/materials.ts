// 探索で拾う素材。成果画面でまとめて真珠に換える。

export interface MaterialDef {
  id: string;
  name: string;
  /** 真珠に換えたときの数 */
  value: number;
  /** 出やすさ（重み） */
  weight: number;
}

export const MATERIALS: MaterialDef[] = [
  { id: 'shell', name: '貝がら', value: 3, weight: 5 },
  { id: 'glow-sand', name: '光る砂', value: 5, weight: 3 },
  { id: 'bone-chip', name: 'クジラの骨片', value: 6, weight: 2 },
  { id: 'pretty-stone', name: 'きれいな石', value: 9, weight: 1 },
];

export const MATERIAL_BY_ID: Record<string, MaterialDef> = Object.fromEntries(MATERIALS.map((m) => [m.id, m]));

/** 拾ったゴミ1つあたりのお礼の真珠 */
export const TRASH_VALUE = 2;
/** 底まで着いたときのボーナス */
export const BOTTOM_BONUS = 15;
