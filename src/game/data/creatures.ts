// 深海図鑑に載る生き物。解説は実在の知識にもとづく（出典は docs/zukan-sources.md）。
// meet: self = 自分（めんだこ）/ visit = 水槽に遊びに来る / dive = 深海探索で会える（Phase 3）

import type { DecorTag } from './decor';

export interface CreatureDef {
  id: string;
  name: string;
  /** 学名 */
  sci: string;
  /** 主な生息水深（m） */
  depth: [number, number];
  size: string;
  text: string;
  /** 未発見のときに出すヒント */
  hint: string;
  meet: 'self' | 'visit' | 'dive';
  /** 好きな飾りのタグ（来訪の起こりやすさに効く） */
  likes: DecorTag[];
  /** このタグの飾りか海底がないと来ない */
  requires?: DecorTag;
  /** 1: よく来る 〜 3: めったに来ない */
  rarity: 1 | 2 | 3;
  /** 水槽での動き方 */
  motion: 'swim' | 'crawl' | 'sit';
  /** 泳ぐ生き物が好む高さ（upper: 上層 / middle: 中層） */
  layer?: 'upper' | 'middle';
  /** 水槽での表示の横幅（論理座標） */
  displayW: number;
}

export const CREATURES: CreatureDef[] = [
  {
    id: 'mendako',
    name: 'メンダコ',
    sci: 'Opisthoteuthis depressa',
    depth: [200, 1000],
    size: '直径 約20cm',
    text: '耳のように見えるのはヒレ。海底では腕のあいだの膜を広げて、円盤のような平たい姿になる。',
    hint: '',
    meet: 'self',
    likes: [],
    rarity: 1,
    motion: 'swim',
    displayW: 0,
  },
  {
    id: 'hotaruika',
    name: 'ホタルイカ',
    sci: 'Watasenia scintillans',
    depth: [200, 600],
    size: '胴の長さ 約4〜7cm',
    text: '腕の先や体に千個ほどの小さな発光器を持ち、青く光る。春には産卵のため富山湾の岸近くまで集まる。',
    hint: '光る飾りが好きみたい',
    meet: 'visit',
    likes: ['light'],
    rarity: 1,
    motion: 'swim',
    layer: 'upper',
    displayW: 54,
  },
  {
    id: 'hadakaiwashi',
    name: 'ハダカイワシ',
    sci: 'Myctophidae（ハダカイワシ科）',
    depth: [100, 2000],
    size: '体長 数cm〜約17cm',
    text: 'おなか側の発光器で光り、下から見上げた相手に自分の影を見せない。夜になると浅いところまで上がってくる。',
    hint: '光があると寄ってくる',
    meet: 'visit',
    likes: ['light', 'coral'],
    rarity: 1,
    motion: 'swim',
    layer: 'upper',
    displayW: 64,
  },
  {
    id: 'demenigisu',
    name: 'デメニギス',
    sci: 'Macropinna microstoma',
    depth: [400, 800],
    size: '全長 約15cm',
    text: '頭は透明なドーム。中にある緑色の筒のような目を動かして、真上も前も見られる。目に見える2つの点は鼻にあたる器官。',
    hint: 'サンゴのそばを泳ぐらしい',
    meet: 'visit',
    likes: ['coral'],
    rarity: 2,
    motion: 'swim',
    layer: 'middle',
    displayW: 70,
  },
  {
    id: 'chochin',
    name: 'チョウチンアンコウ',
    sci: 'Himantolophus groenlandicus',
    depth: [200, 800],
    size: 'メス 約60cm・オス 約4cm',
    text: '頭の「ちょうちん」から光る液を出して小魚をおびき寄せる。オスはメスよりずっと小さい。',
    hint: '光とかくれががそろうと…',
    meet: 'visit',
    likes: ['light', 'hide'],
    rarity: 3,
    motion: 'swim',
    layer: 'middle',
    displayW: 80,
  },
  {
    id: 'daiogusoku',
    name: 'ダイオウグソクムシ',
    sci: 'Bathynomus giganteus',
    depth: [350, 2300],
    size: '体長 約20〜45cm',
    text: 'ダンゴムシの仲間で世界最大級。水族館で5年以上えさを食べずに過ごした記録がある。',
    hint: '砂地や骨のそばを歩くらしい',
    meet: 'visit',
    likes: ['sand', 'bone'],
    rarity: 2,
    motion: 'crawl',
    displayW: 92,
  },
  {
    id: 'takaashi',
    name: 'タカアシガニ',
    sci: 'Macrocheira kaempferi',
    depth: [200, 600],
    size: '脚を広げると 最大約3.8m',
    text: '現生の節足動物で世界最大。駿河湾や相模湾など、日本近海の深い海にすむ。',
    hint: '岩場を歩きまわるのが好き',
    meet: 'visit',
    likes: ['rock', 'sand'],
    rarity: 2,
    motion: 'crawl',
    displayW: 110,
  },
  {
    id: 'ooguchiboya',
    name: 'オオグチボヤ',
    sci: 'Megalodicopia hians',
    depth: [300, 1000],
    size: '本体の直径 約5〜7cm',
    text: '岩や沈木にくっつき、流れに向かって大きな口を開けて、流れてきた小さな生き物を捕まえる。富山湾で大きな群れが見つかっている。',
    hint: '岩がないと落ち着けないみたい',
    meet: 'visit',
    likes: ['rock'],
    requires: 'rock',
    rarity: 2,
    motion: 'sit',
    displayW: 58,
  },
  {
    id: 'honekui',
    name: 'ホネクイハナムシ',
    sci: 'Osedax japonicus',
    depth: [200, 300],
    size: '体長 約1cm',
    text: '口も消化管もない。根のような部分をクジラの骨にのばし、共生する細菌の力を借りて栄養を取りこむ。鹿児島県の野間岬沖に沈められたマッコウクジラの骨から見つかった。',
    hint: 'クジラの骨がないと会えない',
    meet: 'visit',
    likes: ['bone'],
    requires: 'bone',
    rarity: 2,
    motion: 'sit',
    displayW: 46,
  },
  {
    id: 'goemon',
    name: 'ゴエモンコシオリエビ',
    sci: 'Shinkaia crosnieri',
    depth: [700, 1600],
    size: '体長 約5cm',
    text: '沖縄トラフの熱水噴出孔のまわりにすむ。胸の毛に細菌を育て、それをかき集めて食べている。',
    hint: '熱水のそばにしかいない',
    meet: 'visit',
    likes: ['vent'],
    requires: 'vent',
    rarity: 2,
    motion: 'crawl',
    displayW: 62,
  },
];

export const CREATURE_BY_ID: Record<string, CreatureDef> = Object.fromEntries(CREATURES.map((c) => [c.id, c]));
export const VISITORS = CREATURES.filter((c) => c.meet === 'visit');
