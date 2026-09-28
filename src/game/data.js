// ゲームの定義データ。描画方法（2D/3D）に依存しない値だけをここに置く。

export const STATS = [
  { id: 'hunger', label: 'おなか' },
  { id: 'mood', label: 'ごきげん' },
  { id: 'energy', label: 'げんき' },
];

// なかよし度（exp）で成長段階が決まる。scale は見た目の大きさ。
export const STAGES = [
  { id: 'baby', label: 'あかちゃん', minExp: 0, scale: 0.8 },
  { id: 'child', label: 'こども', minExp: 120, scale: 0.92 },
  { id: 'adult', label: 'おとな', minExp: 400, scale: 1.04 },
];

export const STAGE_UP_BONUS = 20;

// めんだこは小さな甲殻類（カイアシ類・ヨコエビ類）を食べる。
export const FOODS = [
  { id: 'copepod', name: 'カイアシ', price: 0, hunger: 15, mood: 2, exp: 2, note: 'ちいさなプランクトン' },
  { id: 'amphipod', name: 'ヨコエビ', price: 5, hunger: 30, mood: 12, exp: 5, note: 'めんだこの だいこうぶつ' },
  { id: 'pudding', name: 'しんかいプリン', price: 12, hunger: 20, mood: 30, exp: 8, note: 'とくべつな おやつ' },
];

export const SLOTS = [
  { id: 'head', label: 'あたま', removable: true },
  { id: 'face', label: 'かお', removable: true },
  { id: 'neck', label: 'むなもと', removable: true },
  { id: 'color', label: 'からだのいろ', removable: false },
];

export const ITEMS = [
  { id: 'ribbon', slot: 'head', name: 'ピンクのリボン', price: 0 },
  { id: 'starfish', slot: 'head', name: 'ヒトデのヘアピン', price: 15 },
  { id: 'beret', slot: 'head', name: 'ベレーぼう', price: 25 },
  { id: 'crown', slot: 'head', name: 'ちいさなおうかん', price: 40 },
  { id: 'lantern', slot: 'head', name: 'ちょうちんカチューシャ', price: 60 },
  { id: 'round-glasses', slot: 'face', name: 'まるメガネ', price: 20 },
  { id: 'heart-glasses', slot: 'face', name: 'ハートのサングラス', price: 35 },
  { id: 'bowtie', slot: 'neck', name: 'ちょうネクタイ', price: 15 },
  { id: 'scarf', slot: 'neck', name: 'しましまマフラー', price: 30 },
  { id: 'pearl-necklace', slot: 'neck', name: 'しんじゅのネックレス', price: 50 },
  { id: 'color-coral', slot: 'color', name: 'コーラル', price: 0 },
  { id: 'color-sakura', slot: 'color', name: 'さくら', price: 30 },
  { id: 'color-lavender', slot: 'color', name: 'ラベンダー', price: 45 },
  { id: 'color-snow', slot: 'color', name: 'ゆきしろ', price: 80 },
];

export const ITEM_BY_ID = Object.fromEntries(ITEMS.map((item) => [item.id, item]));
export const FOOD_BY_ID = Object.fromEntries(FOODS.map((food) => [food.id, food]));
