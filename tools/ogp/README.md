# OGP画像（1200×630）

X・LINE・Slackでシェアされたときのカード画像。**トップ・会社情報・キャリア相談の3枚**。
記事はアイキャッチ（`/images/media/*.png`）をそのまま使うので、ここには含めない。

## 再出力

文言を変えたら該当のHTMLを直して、これを流すだけ。

```bash
cd C:/Users/user/agentbest-lp
for n in home company consultation; do
  "/c/Program Files/Google/Chrome/Application/chrome.exe" --headless=new --disable-gpu \
    --hide-scrollbars --window-size=1200,630 \
    --screenshot="C:/Users/user/agentbest-lp/public/ogp/$n.png" \
    "file:///C:/Users/user/agentbest-lp/tools/ogp/$n.html"
done
```

- ⚠ `--screenshot` の出力先は**絶対パス**。相対だと「アクセスが拒否されました」で落ちる。
- ⚠ **出力したPNGは必ず目で見る。** はみ出しても警告は出ず、静かに切れる。
- フォントはWindowsのもの（明朝＝游明朝／ゴシック＝游ゴシック）。Hiraginoを書いてもMac専用で効かない。

## 貼り先

| 画像 | 使うページ |
|---|---|
| `home.png` | `src/pages/index.astro` |
| `company.png` | `src/pages/company.astro` |
| `consultation.png` | `src/pages/consultation.astro` |

`Layout.astro` に `image="/ogp/xxx.png"` を渡すと `og:image` と `twitter:card=summary_large_image` が出る。
**渡さないページには og:image が出ない**（＝シェアしても白いカードになる）。
