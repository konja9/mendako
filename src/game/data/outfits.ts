// きせかえの定義データ。

export type SlotId = 'head' | 'face' | 'neck' | 'color';

export const SLOTS: { id: SlotId; label: string; removable: boolean }[] = [
  { id: 'head', label: 'あたま', removable: true },
  { id: 'face', label: 'かお', removable: true },
  { id: 'neck', label: 'むなもと', removable: true },
  { id: 'color', label: 'からだの色', removable: false },
];

export interface OutfitItem {
  id: string;
  slot: SlotId;
  name: string;
  price: number;
}

export const ITEMS: OutfitItem[] = [
  { id: 'ribbon', slot: 'head', name: 'ピンクのリボン', price: 0 },
  { id: 'starfish', slot: 'head', name: 'ヒトデのヘアピン', price: 15 },
  { id: 'beret', slot: 'head', name: 'ベレー帽', price: 25 },
  { id: 'crown', slot: 'head', name: '小さな王冠', price: 40 },
  { id: 'lantern', slot: 'head', name: 'ちょうちんカチューシャ', price: 60 },
  { id: 'round-glasses', slot: 'face', name: '丸メガネ', price: 20 },
  { id: 'heart-glasses', slot: 'face', name: 'ハートのサングラス', price: 35 },
  { id: 'bowtie', slot: 'neck', name: '蝶ネクタイ', price: 15 },
  { id: 'scarf', slot: 'neck', name: 'しましまマフラー', price: 30 },
  { id: 'pearl-necklace', slot: 'neck', name: '真珠のネックレス', price: 50 },
  { id: 'color-coral', slot: 'color', name: 'コーラル', price: 0 },
  { id: 'color-sakura', slot: 'color', name: 'さくら', price: 30 },
  { id: 'color-lavender', slot: 'color', name: 'ラベンダー', price: 45 },
  { id: 'color-snow', slot: 'color', name: 'ゆきしろ', price: 80 },
];

export const ITEM_BY_ID: Record<string, OutfitItem> = Object.fromEntries(ITEMS.map((item) => [item.id, item]));

export type Equipped = Record<SlotId, string | null>;
