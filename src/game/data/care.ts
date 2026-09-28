// お世話まわりの定義データ。描画方法に依存しない値だけを置く。

export type StatId = 'hunger' | 'mood' | 'energy';

export const STATS: { id: StatId; label: string }[] = [
  { id: 'hunger', label: 'おなか' },
  { id: 'mood', label: 'ごきげん' },
  { id: 'energy', label: 'げんき' },
];

export type StageId = 'baby' | 'child' | 'adult';

export interface Stage {
  id: StageId;
  label: string;
  minExp: number;
  /** 見た目の大きさ */
  scale: number;
}

// なかよし度（exp）で成長段階が決まる。
export const STAGES: Stage[] = [
  { id: 'baby', label: 'あかちゃん', minExp: 0, scale: 0.8 },
  { id: 'child', label: 'こども', minExp: 120, scale: 0.92 },
  { id: 'adult', label: 'おとな', minExp: 400, scale: 1.04 },
];

export const STAGE_UP_BONUS = 20;

export type FoodId = 'copepod' | 'amphipod' | 'pudding';

export interface Food {
  id: FoodId;
  name: string;
  price: number;
  hunger: number;
  mood: number;
  exp: number;
  note: string;
}

// めんだこは小さな甲殻類（カイアシ類・ヨコエビ類）を食べる。
export const FOODS: Food[] = [
  { id: 'copepod', name: 'カイアシ', price: 0, hunger: 15, mood: 2, exp: 2, note: '小さなプランクトン' },
  { id: 'amphipod', name: 'ヨコエビ', price: 5, hunger: 30, mood: 12, exp: 5, note: 'めんだこの大好物' },
  { id: 'pudding', name: '深海プリン', price: 12, hunger: 20, mood: 30, exp: 8, note: '特別なおやつ' },
];

export const FOOD_BY_ID = Object.fromEntries(FOODS.map((food) => [food.id, food])) as Record<FoodId, Food>;
