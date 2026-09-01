# キャリア相談フォームの受け皿を作る手順

`/consultation` の相談フォーム（自作・4ステップ）の送信先を用意する手順です。
**このSQLを実行するまで、フォームは送信時にエラーになります**（画面には「送信できませんでした。こちらのフォームからご記入いただくか…」と出て、Airtableのフォームとメールアドレスへの逃げ道が表示されるので、相談を取りこぼすことはありません）。

```
/consultation のフォーム（www.agent-best.net）
  → Supabase の public.consultations に INSERT（匿名キー・INSERTのみ許可）
  → Database Webhook が発火
  → Google Apps Script のウェブアプリ
      ├ Gmail で担当者へ通知
      └ Airtable「求職者（HP）」に1行追加（今までと同じ場所で確認できる）
  → 送信した人は /consultation/thanks/ へ遷移（GA4の consult_submit がここで1件計上される）
```

Supabase プロジェクトは求人サイト・マイページと同じ **`jobsite-tokyo`（`jvdnabtpxcyfnogdulea`・東京）** を使います。

---

## 1. テーブルとRLSを作る（Supabase → SQL Editor に貼って実行）

```sql
create table if not exists public.consultations (
  id                 uuid primary key default gen_random_uuid(),
  created_at         timestamptz not null default now(),

  -- 本人
  full_name          text not null,
  kana               text,
  email              text not null,
  phone              text,

  -- いまの状況
  status             text,   -- 在職中 / 離職中 / 学生
  current_company    text,
  timing             text,   -- 転職の温度感

  -- 希望
  desired_salary     text,
  desired_role       text,
  applied_companies  text,

  -- 相談内容
  message            text,
  scout_consent      text,   -- 希望する / 希望しない
  consent            boolean not null default false,

  -- どこから来たか
  source             text,
  page_path          text,

  -- 対応状況（Supabase上で軽く管理したいとき用。ふだんはAirtableで見る）
  handled            boolean not null default false
);

alter table public.consultations enable row level security;

-- 匿名キーには「入れる」だけを許可する。読み取り・更新・削除は許可しない。
drop policy if exists "anon can insert consultations" on public.consultations;
create policy "anon can insert consultations"
  on public.consultations for insert to anon
  with check (true);

create index if not exists consultations_created_at_idx
  on public.consultations (created_at desc);
```

⚠ **select のポリシーは作らないこと。** 匿名キーはブラウザに書いてあるため、読み取りを許可すると相談内容が誰でも取得できてしまいます。

---

## 2. 動作確認（SQL実行の直後）

1. https://www.agent-best.net/consultation/ を開く
2. 適当な内容（氏名「テスト」など）で4ステップを最後まで進めて送信
3. `/consultation/thanks/` に遷移すれば成功
4. Supabase → Table Editor → `consultations` に行が入っていることを確認
5. 確認できたらテスト行は削除

---

## 3. 通知（Database Webhook → Apps Script）

求人応募（`applications`）と同じ仕組みです。**`jobsite-notify` フォルダの通知スクリプトを流用**します。

### 3-1. Apps Script 側

`jobsite-notify` のウェブアプリに、相談用の分岐を足します（テーブル名で振り分ける）。

```javascript
function doPost(e) {
  var body = JSON.parse(e.postData.contents);
  var r = body.record || {};
  var table = body.table || '';

  if (table === 'consultations') {
    // ① 担当者へメール
    var lines = [
      '■ キャリア相談（www.agent-best.net/consultation/）',
      '氏名: ' + (r.full_name || '') + '（' + (r.kana || '') + '）',
      'メール: ' + (r.email || ''),
      '電話: ' + (r.phone || ''),
      '状況: ' + (r.status || '') + ' / ' + (r.current_company || ''),
      '温度感: ' + (r.timing || ''),
      '希望年収: ' + (r.desired_salary || ''),
      '希望職種・勤務地: ' + (r.desired_role || ''),
      '応募・選考中: ' + (r.applied_companies || ''),
      'ご相談: ' + (r.message || ''),
      'スカウト受信: ' + (r.scout_consent || '')
    ];
    GmailApp.sendEmail(
      'r_matsuoka@agent-best.net',
      '【キャリア相談】' + (r.full_name || '') + ' 様',
      lines.join('\n')
    );

    // ② Airtable「求職者（HP）」にも登録する（今までと同じ場所で見られるように）
    var AIRTABLE_TOKEN = PropertiesService.getScriptProperties().getProperty('AIRTABLE_TOKEN');
    var url = 'https://api.airtable.com/v0/appYkc36EvioYoL1A/tbl4SgAxixgbv76Vk';
    var fields = {
      '氏名': r.full_name || '',
      'フリガナ': r.kana || '',
      'メールアドレス': r.email || '',
      '電話番号': r.phone || '',
      '現在の状況': r.status || undefined,
      '現在の所属（企業・部署）': r.current_company || '',
      '転職の温度感': r.timing || undefined,
      '希望年収（万円）': r.desired_salary ? Number(r.desired_salary) : undefined,
      '希望職種・勤務地': r.desired_role || '',
      '既に応募・選考中の企業': r.applied_companies || '',
      'ご希望・ご質問': r.message || '',
      '求人案内・スカウト受信の同意': r.scout_consent || undefined
    };
    Object.keys(fields).forEach(function (k) {
      if (fields[k] === undefined || fields[k] === '') delete fields[k];
    });
    UrlFetchApp.fetch(url, {
      method: 'post',
      contentType: 'application/json',
      headers: { Authorization: 'Bearer ' + AIRTABLE_TOKEN },
      payload: JSON.stringify({ records: [{ fields: fields }], typecast: true }),
      muteHttpExceptions: true
    });
    return ContentService.createTextOutput('ok');
  }

  // ここから下は既存の応募通知の処理（そのまま残す）
}
```

- `AIRTABLE_TOKEN` は Apps Script の「プロジェクトの設定 → スクリプト プロパティ」に入れます。
  お問い合わせのAirtable連携で使っているトークンをそのまま使えます（必要な権限は `data.records:write`）。
- 単一選択（現在の状況・温度感・スカウト受信の同意）は選択肢名が一致している必要があります。`typecast: true` を付けてあるので、名前が一致すればそのまま入ります。
- 保存後、**「デプロイ → 新しいデプロイ」でウェブアプリを更新**してください（既存URLを使い続ける場合は「デプロイを管理 → 編集 → 新バージョン」）。

### 3-2. Supabase 側

Database → Webhooks → Create a new hook

| 項目 | 値 |
|---|---|
| Name | `consultations_notify` |
| Table | `public.consultations` |
| Events | `Insert` |
| Type | HTTP Request（POST） |
| URL | Apps Script ウェブアプリのURL（`https://script.google.com/macros/s/…/exec`） |
| HTTP Headers | `Content-Type: application/json` |

---

## 4. Airtableのフォームはどうするか

`/consultation` からは使わなくなりますが、**送信エラー時の逃げ道として残してあります**（ページ内のエラーメッセージからリンクしています）。
消さないでください。消す場合は `src/pages/consultation.astro` の `FORM_DIRECT_URL` も直す必要があります。

---

## 5. 計測

自作フォームになったので、以下がGA4で取れます。

| イベント | 意味 |
|---|---|
| `consult_form_view` | フォームが画面に入った |
| `consult_step` | ステップを進んだ（`step` パラメータに2〜4） |
| `consult_send` | 送信ボタンで送信が成功した |
| `consult_submit` | `/consultation/thanks/` に到達した（=送信1件。キーイベントに指定するのはこれ） |
| `consult_error` | 送信に失敗した（受け皿が落ちているとここが増える） |

⚠ **`consult_error` が増えていたら、受け皿かRLSが壊れている合図**です。まず上のSQLのポリシーを確認してください。
