# しんかいぷかぷか（仮）

深海いきものを育てて、着せ替えて、眺めて癒やされるブラウザゲーム。
育てるキャラクターは **めんだこ**。スマホの縦画面を基準に作っています。

- ごはん・なでる・ねる でお世話すると、なかよし度がたまって大きくなる
- ミニゲーム「マリンスノーキャッチ」で真珠を集める
- 真珠でリボン・王冠・ちょうちんカチューシャ・からだの色などを買って着せ替え（試着もできる）
- 水槽を模様替えすると、飾りの好みに合った深海生物が遊びに来る。タップすると深海図鑑に載る
- 「もぐる」でめんだこを操作して深い海へ。ちょうちんの光で暗い海を照らして生き物に出会い、拾った素材を真珠に換える
- 効果音と、場面で雰囲気が変わる BGM（どちらもブラウザの中で合成。設定でオン/オフ・音量）
- スマホのホーム画面に置けて、電波がなくても遊べる（GitHub Pages 版）
- スタート画面（遊びのコツや深海の豆知識つき）。はじめての人は、名前をつけてから めんだこが遊びかたを案内する
- 機能を初めて使うときの説明と、いつでも開ける「あそびかた」（設定画面・スタート画面から）

## 遊べる場所

- **ホーム画面に置ける版**：https://konja9.github.io/mendako/ （スマホで開いて、設定画面の案内どおりにホーム画面に追加）
- claude.ai の公開ページ版もある（ホーム画面には置けない）。記録は版ごとに別々

## 使っているもの

| 役割 | ライブラリ |
| --- | --- |
| 開発・ビルド | Vite |
| 言語 | TypeScript |
| 水槽・ミニゲームの描画 | PixiJS |
| 画面まわり（HUD・シート） | Svelte 5 |
| テスト | Vitest |
| 音 | Web Audio API（音声ファイルなし） |
| ホーム画面・オフライン（PWA） | vite-plugin-pwa（Workbox） |

## 動かしかた

Node.js 22.12 以上が必要です。

```sh
npm install
npm run dev              # 開発サーバー（同じネットワークのスマホからも開ける）
npm test                 # ゲームのルール（src/game）のテスト
npm run check            # 型チェック
npm run build            # 本番用のファイルを dist/ に作る
npm run build:pages      # GitHub Pages 版（PWA 入り）を dist/ に作る
npm run build:artifact   # claude.ai の公開ページ用のファイルを dist-artifact/ に作る
npm run make-icons       # ホーム画面用のアイコン（public/icons）を作り直す（Playwright が必要）
```

GitHub Pages へは、既定のブランチに push すると自動で公開されます（`.github/workflows/pages.yml`）。
最初に一度だけ、リポジトリの Settings → Pages → Source を「GitHub Actions」にしてください。

## ファイル構成

```
index.html
src/main.ts          起動（Svelte の画面と Pixi の水槽を立ち上げる）
src/game/            描画に依存しない状態とルール（テストあり）
src/app/             画面の操作とルールをつなぐ（actions）・演出の通知（events）・画面の状態
src/art/             めんだこ・アイコンなどの絵（SVG 文字列）
src/world/           PixiJS の描画（水槽・深海の粒・ミニゲーム・深海探索）
src/audio/           音（効果音・BGM）。Web Audio でその場で合成する
src/ui/              Svelte の画面部品
tests/               ルールのテスト
public/icons/        ホーム画面用のアイコン（scripts/make-icons.mjs で作る）
docs/game-design.md  ゲームデザインメモ
```
