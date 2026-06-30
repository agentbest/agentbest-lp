# 株式会社エージェントベスト — コーポレートLP（Astro）

ミドル・ハイクラス向け転職エージェントのコーポレート／ランディングページ。
Astro で構築した静的サイトです。

## 必要環境
- Node.js 18 以上（推奨 20+）

## セットアップ

```bash
npm install      # 依存関係のインストール
npm run dev      # 開発サーバー起動（http://localhost:4321）
npm run build    # 本番ビルド（dist/ に出力）
npm run preview  # ビルド結果をローカル確認
```

## デプロイ
`npm run build` で生成される `dist/` を、そのまま静的ホスティングに置くだけで公開できます。
おすすめ: Vercel / Netlify / Cloudflare Pages（いずれも無料枠あり、Git連携で自動デプロイ可）。

## 公開前に差し替えるところ
- `astro.config.mjs` の `site`：実際のドメインに変更
- `src/pages/index.astro` の問い合わせ先メール（`info@agent-best.co.jp` は仮）
- 必要に応じて取引企業の実績・ロゴ（※掲載は各社の許可を取得のうえで）

## 構成
```
src/
├─ layouts/Layout.astro      共通レイアウト・フォント・meta
├─ components/Header.astro    ヘッダー／ナビ
├─ pages/index.astro          トップページ（全セクション）
└─ styles/global.css          デザイントークン・基本スタイル
public/
└─ favicon.svg
```

## デザイン方針
- コンセプト：「領域を絞った、確かな提案」＝ 精度と集中
- 配色：ペーパー白 × インクネイビー × ディープティール（アクセント1色）
- 書体：見出し Shippori Mincho／本文 Noto Sans JP

## 更新履歴
- v2: VISION（縦書き）／取扱領域／転職支援事例セクションを追加。スクロール演出を実装。ミドル・ハイクラス系エージェントの高級感を反映。

## 注意：転職支援事例について
`src/pages/index.astro` の `cases` 配列は**サンプルです**。実際の匿名化した支援実績に差し替えてください（個人が特定されない範囲で）。実績がまだ無い場合は、セクションごと削除しても構いません（`<!-- CASES -->` のsectionブロックを削除）。
