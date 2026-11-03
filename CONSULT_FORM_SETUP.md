# 相談フォーム（/consultation）の受け口

`src/pages/consultation.astro` の自作4ステップフォームは、**Apps Script のウェブアプリに直接 POST** する（2026-11-03・ハチワレさん決定「Apps Script 直送にしよう」）。
以前の案（Supabase `public.consultations` に INSERT → Database Webhook → Apps Script）は使っていない。Supabase 側にテーブルも Webhook も要らない。

```
ブラウザ ── POST { kind:"consultation_form", record:{…} } ──▶ Apps Script ウェブアプリ（求人サイトの通知と同じ1本）
                                                              ├ receiveConsultationForm_()：ハニーポット・必須項目・長さを検査
                                                              ├ keepConsultationCopy_()：スプレッドシート「相談フォーム控え（www.agent-best.net）」に1行追記
                                                              └ notifyConsultation_()：Gmail 通知 ＋ Airtable「求職者（HP）」へ登録
```

| 項目 | 値 |
|---|---|
| 送信先 | `consultation.astro` 冒頭の `NOTIFY_URL`（Apps Script のウェブアプリURL。デプロイを「編集→新バージョン」で更新する限り変わらない） |
| コード | `C:\Users\user\jobsite-notify\通知スクリプト.gs`（Git に入れない）。Apps Script プロジェクトは /u/1/ の「無題のプロジェクト」、デプロイはバージョン8（2026-11-03） |
| 控え | Apps Script が初回に自動で作るスプレッドシート。ID はスクリプト プロパティ `CONSULT_SHEET_ID` |
| Airtable | `appYkc36EvioYoL1A` / `tbl4SgAxixgbv76Vk`「求職者（HP）」。スクリプト プロパティ `AIRTABLE_TOKEN`（`data.records:write`）が無いとメールだけ送って `ok (airtable skipped: no token)` を返す |
| 失敗時の逃げ道 | 送信に失敗したら Airtable のフォーム `FORM_DIRECT_URL` とメールアドレスを出す |

## なぜヘッダーを付けずに送るか

`fetch(NOTIFY_URL, { method:'POST', body: JSON.stringify(...) })` と **Content-Type を付けない**（＝text/plain の単純リクエスト）。
Apps Script はプリフライト（OPTIONS）に応えないので、`application/json` を付けると CORS で届かない。
応答は 302 → script.googleusercontent.com にリダイレクトされ、`{"result":"ok"}` 系の JSON が読める。`result` が `ok` で始まらなければ失敗扱い。

## 合言葉を使わない理由

求人サイトの Webhook は `?token=` で守っているが、相談フォームはブラウザから直接来るのでページに合言葉を書いても意味が無い。
代わりに `kind` で見分け、画面外の `website` 欄（ハニーポット）・氏名/メール/温度感の必須・各項目の長さ上限で弾く。

## 知ったきっかけ（2026-11-03）

ステップ2に「当社を知ったきっかけ」（任意・select）を追加。`record.referrer` で送り、メール・控え・Airtable「知ったきっかけ」（単一選択）に入る。
選択肢を変えるときは **フォーム・Airtable の選択肢・求人サイト `apply-template.html` の `REFERRER`** の3か所を揃える。

## 動作確認のやり方

```sh
# UTF-8 のファイルから投げる（Git Bash で日本語を直接 --data-binary に書くと文字化けして JSON parse エラーになる）
curl -s -D - -o /dev/null -X POST "$NOTIFY_URL" -H 'Content-Type: text/plain; charset=utf-8' --data-binary @payload.json
# → 302 の Location を GET すると {"result":"ok"} が返る。本番と同じく通知メールが1通届く
```

## 計測（GA4）

`consult_form_view` / `consult_step` / `consult_send` / `consult_error` ＋ `/consultation/thanks/` の page_view（`consult_submit`）。
