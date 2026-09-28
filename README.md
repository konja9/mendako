# しんかいぷかぷか（仮）

深海いきものを育てて、着せ替えて、眺めて癒やされるブラウザゲーム。
育てるキャラクターは **めんだこ**。スマホの縦画面を基準に作っています。

- ごはん・なでる・ねる でお世話すると、なかよし度がたまって大きくなる
- ミニゲーム「マリンスノーキャッチ」で真珠を集める
- 真珠でリボン・王冠・ちょうちんカチューシャ・からだの色などを買って着せ替え（試着もできる）

## 使っているもの

| 役割 | ライブラリ |
| --- | --- |
| 開発・ビルド | Vite |
| 言語 | TypeScript |
| 水槽・ミニゲームの描画 | PixiJS |
| 画面まわり（HUD・シート） | Svelte 5 |
| テスト | Vitest |

## 動かしかた

Node.js 22.12 以上が必要です。

```sh
npm install
npm run dev              # 開発サーバー（同じネットワークのスマホからも開ける）
npm test                 # ゲームのルール（src/game）のテスト
npm run check            # 型チェック
npm run build            # 本番用のファイルを dist/ に作る
npm run build:artifact   # claude.ai の公開ページ用のファイルを dist-artifact/ に作る
```

## ファイル構成

```
index.html
src/main.ts          起動（Svelte の画面と Pixi の水槽を立ち上げる）
src/game/            描画に依存しない状態とルール（テストあり）
src/app/             画面の操作とルールをつなぐ（actions）・演出の通知（events）・画面の状態
src/art/             めんだこ・アイコンなどの絵（SVG 文字列）
src/world/           PixiJS の描画（水槽・深海の粒・ミニゲーム）
src/ui/              Svelte の画面部品
tests/               ルールのテスト
docs/game-design.md  ゲームデザインメモ
```
