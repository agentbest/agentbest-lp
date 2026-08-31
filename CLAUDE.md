# agentbest-lp — コーポレートサイト www.agent-best.net

株式会社エージェントベストの**本番コーポレートサイト**。キャリアメディア `/media`（記事2,486本）も同じリポジトリ。

- 技術: **Astro v4**（静的サイト）。`astro.config.mjs` に `site: 'https://www.agent-best.net'`
- デプロイ: **Vercel にGit連携で自動デプロイ**。`main` に push すると **1〜2分で本番反映**
- ローカル編集元: `C:\Users\user\agentbest-lp\`

## ⚠ 本番サイトである

`main` への push ＝ 本番公開。ビルドが通ることを確認してから push すること。

## 主要ファイル

| 用途 | パス |
|---|---|
| 全ページ共通ナビ | `src/components/Header.astro`（`const nav = [...]` をmapで描画。`specialSites` で特化サイトのドロップダウン） |
| レイアウト | `src/layouts/Layout.astro`（**共通フッターは無い**。フッターは各ページ内） |
| ページ | `src/pages/`（index / jobs / contact / consultation / media/…） |
| メディア記事 | `src/content/media/*.md`（2,486本） |
| カテゴリ定義 | `src/lib/mediaTaxonomy.ts` |
| シェアボタン | `src/components/ShareButtons.astro` |
| 著者ブロック | `src/components/AuthorBlock.astro` |
| 記事本数の表記 | `src/lib/mediaCount.ts`（**手打ち禁止**。100本単位で切り捨てて出す） |
| 求人サイトへのリンク | `src/lib/jobsLink.ts`（utm付き。ここを通す） |
| よくある質問の文面 | `src/lib/faq.ts`（トップと `/consultation` が共有） |
| OGP画像 | `public/ogp/*.png` ＋ 生成元 `tools/ogp/`（README に再出力手順） |

**ヘッダーの注意**: ナビ7項目でちょうど1120pxに収まる設計。**項目を足すと崩れる**。1240px以下はハンバーガー。

## メディア（/media）

### カテゴリ定義は `src/lib/mediaTaxonomy.ts` に一本化（最重要）

**ハブの表示名とグループ分けは、記事のfrontmatterから推測せずこのファイルが決める。** 以前は `jobType`／`industry` の文字列でグループを組み立てていたため、表記ゆれがそのまま構造の崩れになっていた（同じハブが職種と業界の両方にカードとして出る等）。

- `HUB_LABEL` … ハブslug → 表示名
- `JOB_GROUPS`（職種77ハブ→11グループ）／`INDUSTRY_GROUPS`（業界38ハブ→4グループ）／`COMPANY_HUBS`（企業別4領域）
- `companyRow()` / `companySortKey()` … 企業slug `company-{ローマ字}-reputation` のローマ字から50音の行と読み順を出す（社名の漢字からは読みが取れないため）

⚠ **ハブを増やしたら `HUB_LABEL` と対応するグループの `hubs` に必ず足す。** 足し忘れるとビルド時に `[mediaTaxonomy] グループ未分類のハブがあります` と警告が出る。

**カテゴリの原則**: 1ハブ＝1カテゴリ。領域ハブ `consul`／`ma`／`pm`／`startup` は**企業別記事の専用**で、ここに職種・業界記事を入れない。全119ハブ。

### 記事frontmatter

`title` / `description` / `category`（"職種"|"業界"|"企業"）/ `jobType`｜`industry`｜`companyName` / **`hub`（ハブの決定に使う唯一のキー）** / `theme` / `tags[]` / `pubDate` / `slug` / `image` / `related[]` / `sources[]` / `reviewedAt`

### ページ構成

- `src/pages/media/index.astro` … トップ。グループ→ハブの2階層
- `src/pages/media/hub/[cat]/[...page].astro` … ハブ一覧。**1ページ目のURLは `/media/hub/{cat}/` のまま**、2ページ目以降が `/2/`（企業60件・その他40件/ページ）
- `src/pages/media/companies/index.astro` … 企業686社の50音インデックス
- `src/pages/media/search/index.astro` ＋ `search.json.ts` … 全記事検索。インデックスは遅延fetch（gzip後約210KB）
- `src/pages/media/[slug].astro` … 記事詳細

## 転職事例集（/cases）

「どこから、どこへ」で整理した転職の事例集。**2,000件 = 80パターン × 25件**（8領域）。

### ⚠ 事例はモデルケースである（最重要）

**実支援実績ではない。** 転職市場で成立している異動パターンをもとに構成したモデルケースで、
氏名・イニシャル・写真・本人コメントは一切載せない。企業名も「大手SIer」「上場SaaS企業」の**類型**で書く。
- **実在の企業名を書かない。** 特定企業の選考について述べた記述と読まれる余地を残さないため。
- 「当社が支援した」「実績」と読める表現も足さない。
- ⚠ **ページ上のモデルケース注記は 2026-08-31 に松岡さんの指示で削除した**（`DISCLAIMER` 定数ごと）。
  戻すことになった場合は `src/lib/cases.ts` に定数を置き、/cases 配下の4ページで表示する形に戻す。

### 生成の流れ

`tools/cases/` → `src/data/*.json` → Astroページ。**`src/data/*.json` を手で編集しない。**

| ファイル | 役割 |
|---|---|
| `tools/cases/patterns.mjs` | 領域の定義＋パターン40（前職/転職後の類型・年齢/年収レンジ・想定質問・パターン固有の文）。末尾で extra を連結 |
| `tools/cases/patterns-extra.mjs` | 追加パターン40＋追加領域3（data／sales／corp） |
| `tools/cases/banks-extra.mjs` | 追加の文面バンク |
| `tools/cases/banks.mjs` | 動機10・ネック12・突破口12・年収ロジック8・示唆7の文面バンク（変種を複数持つ） |
| `tools/cases/generate.mjs` | `node tools/cases/generate.mjs` で `src/data/cases.json` と `case-patterns.json` を出力 |

- 乱数は **seed 固定**。再生成しても同じ内容になる（差分レビューができる）。
- ⚠ **事例の通し番号（= URL）はパターンの並び順で決まる。** 増やすときは必ず `patterns-extra.mjs` の**末尾に足す**。
  途中に挿すと公開済みURLの中身が総入れ替えになる。
- ⚠ **既存の文面バンク（`banks.mjs`）の `body` 配列に変種を足さない。** 選ばれる文がずれて公開済みの事例が書き換わる。
  文面を増やすときは `banks-extra.mjs` に**新しいキーとして**足す（generate.mjs 側でマージしている）。
- 拡張したら、拡張前の `cases.json` と突き合わせて**既存事例の変化が0件**であることを確認する。
- 生成時に自己点検を出す（ID重複・本文の完全一致・平均文字数）。**本文の完全一致は0であること。**

### ページ構成

- `src/pages/cases/index.astro` … トップ。領域8→パターン80の2階層（表示順は `src/lib/cases.ts` の `AREA_ORDER`）
- `src/pages/cases/pattern/[slug].astro` … パターンごとの事例25件（80ページ）。**ここが一番情報量の多い階層**
- `src/pages/cases/[id].astro` … 事例詳細（2,000ページ）
- `src/pages/cases/search/index.astro` ＋ `search.json.ts` … 絞り込み。インデックスは遅延fetch（gzip後約74KB）。結果はURLで変わるので **noindex**
- 導線: トップのフッター（`src/pages/index.astro`）と `/media/` のジャンプナビ。**ヘッダーには足さない**（7項目で崩れる）
- sitemap の `<lastmod>` は `src/data/case-patterns.json` の `generatedAt`（生成器が書く）を `astro.config.mjs` が読む。
  記事側の日付に引きずられないようにするため。ファイルのmtimeを使うとVercelのcloneでビルド日に化けるので使わない。

⚠ `search/index.astro` の `buildFacets()` 内でチップを描く関数を **`render` という名前にしない**。
外側の `render()`（結果の描画）を隠して、チップを押しても絞り込まれなくなる（一度やった）。

## ⚠ 技術的SEO（触るときは必ず読む）

- **canonical のホストは `https://www.agent-best.net`（wwwあり）。** apex `agent-best.net` は www へ **308リダイレクト**する。wwwなしで canonical や Sitemap を書くとリダイレクト先を正規URLに指定することになり逆効果。
- canonical は `Astro.url.pathname` に**末尾スラッシュを補ってから**組む（@astrojs/sitemap の出力に揃えるため）。
- `vercel.json` の **`trailingSlash: true`**。スラッシュ無しを308で1本に集約している。
  - ⚠ **`trailingSlash` の正規化は redirects より先に走る。** `source: "/NEWS"` は正規化後の `/NEWS/` にマッチせず404のまま。**source は必ず末尾スラッシュ有りで書く。** ワイルドカードも `/NEWS/:path*` ではなく **`/NEWS/:path+/`**。
  - ⚠ **内部リンクも全部スラッシュを付ける。** 付けないと全リンクが308経由になりクロール予算を食う。検証は、ビルド後に `dist` の全 `href="/…"` を走査して違反0を確認する。
- **`sitemap.xml` が404なのは不具合ではない。** @astrojs/sitemap は `sitemap-index.xml` と `sitemap-0.xml` を出す仕様。
- JSON-LD を `<script type="application/ld+json">` で書くときは **`is:inline` を付ける**（Astroの処理対象から外す）。GA4スクリプトも同様。
- 診断ツールやAIの「JSON-LDが無い」等の指摘は鵜呑みにせず、`curl` で実物のHTMLを見て裏を取る。
- **記事の量産＝重複、と決めつけない。** 同テーマ記事の本文重複率を実測したら4〜6%で内容は別物だった。GSCの「重複」588件の真因は**末尾スラッシュの二重URL**で、canonical未宣言だけが原因だった。同じ症状を他サイトで見たら、まず両形式のレスポンスをmd5比較する。

**未来日付の記事は 2026-08-31 時点で0本**（pubDate の最大が 2026-08-29）。以前は217本が先付けだったが、日付が追いついて解消した。`[slug].astro` の「ビルド日で頭打ち」の処理は、量産スクリプトが先の日付を振ったときの保険として残してある。

## GA4 / CTA / 相談導線

- GA4 測定ID `G-1XXMP8Y1B4`（`src/layouts/Layout.astro`、`is:inline` 必須）
- `Layout.astro` の共通クリック計測: `line_add_friend`（`data-line-cta`）/ `jobs_click`（求人サイトへのリンク全部）
- 相談ページの計測: `consult_form_view`（フォームが画面に入った）/ `consult_click`（`data-consult-cta`）/ **`consult_submit`＝`/consultation/thanks/` の page_view**
  - ⚠ **送信数は Airtable フォームの「送信後の遷移先」を `https://www.agent-best.net/consultation/thanks/` にして初めて数えられる。** iframeの中で完結するので、設定しないと送信0件のまま見える。
- CTA の既定リンクは `https://calendly.com/r_matsuoka`
- **`/consultation`** = 求人未定の求職者向けキャリア相談ページ。Airtable「人材紹介事業」`appYkc36EvioYoL1A` / テーブル `求職者（HP）`（`tbl4SgAxixgbv76Vk`）/ フォーム `pagFw3nywLJ4AJF3n` を埋め込み。**求人応募（jobsite側）とはテーブルごと別。**
  - 新世代（Interface）フォームには `shr…` 共有IDが**存在しない**。埋め込みURLは `https://airtable.com/embed/{baseId}/{pageId}/form`。旧フォームの `shr…` 形式と混同しない。
  - iframeの高さは固定。**項目を増減したら高さも直す**（2026-08時点でフォーム1,898px・iframe1,960px）。
- `/contact` のGoogleフォーム（フォームID・entry ID）は**B2B LP 4本が共通で使っている**。変更すると4LPが壊れる。

## 特化サイトへの導線

`Header.astro` の `specialSites` で管理。**求職者向けLPを新規追加したら `specialSites['求職者の方へ']` に1行足す**（LP側8本のフッターも同時に更新する）。

## ⚠ このリポジトリ特有のハマりどころ

- **`git pull --rebase` が未追跡のメディア画像と衝突して失敗しやすい。** リモート版とハッシュ比較して同一を確認してから退避 → rebase → push が定石。**画像を消さないこと。**
- **別セッションからも同時に更新される**（記事の量産作業）。ローカルの `dist` や記事数は平気で古くなるので、本番の実URLで確認する。
- 著者略歴・許可番号は `src/components/AuthorBlock.astro` / `/profile` ページ / `agentbest/jobsite` の求人詳細 の**3か所に重複**している。直すときは全部直す。

## push のルール

- ローカルで**ビルドを通してから** commit & push。コミットメッセージは日本語。**push後は必ず何を変えたか報告する。**
- **以下に触れるときは必ず止まって事前確認する**:
  1. ドメイン・DNS・CNAME（DNSは**Squarespace Domains**管理・松岡さんの手作業）
  2. 個人情報・フォーム・認証
  3. 費用が発生する変更
  4. 既存ページ・データの削除（記事の一括置換・大規模リライトを含む）
  5. 複数リポジトリへの一括変更
- Publicリポジトリ。push前にトークン・APIキーの混入をgrepで確認する。
