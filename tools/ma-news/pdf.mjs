// tools/ma-news/pdf.mjs … 適時開示PDFを取ってきてテキストにする
//
// TDnetのPDFはテキストPDF（スキャンではない）なので pdftotext でそのまま読める。
// 同じPDFを何度も取りに行かないよう cache/ に置く。TDnetへの負荷を抑える意味もある。
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const CACHE = path.join(HERE, 'cache');

/** yanoshinのリダイレクタ経由URLから、TDnetの実URLだけ取り出す */
export const realUrl = (u) => String(u).replace(/^.*rd\.php\?/, '');

/** 適時開示PDF → テキスト。
 *  layout: 表の桁が揃うので財務テーブル向き。
 *  raw   : 読み順で出るので「(1)名称 (2)所在地 …」の2列表の値を順番で拾える。
 *  得意分野が逆なので両方作って使い分ける。 */
export async function pdfText(id, docUrl, mode = 'layout') {
  fs.mkdirSync(CACHE, { recursive: true });
  const pdf = path.join(CACHE, `${id}.pdf`);
  const txt = path.join(CACHE, mode === 'raw' ? `${id}.raw.txt` : `${id}.txt`);
  if (fs.existsSync(txt)) return fs.readFileSync(txt, 'utf-8');

  if (!fs.existsSync(pdf)) {
    const res = await fetch(realUrl(docUrl), {
      headers: { 'User-Agent': 'Mozilla/5.0 (agent-best.net ma-news bot)' },
    });
    if (!res.ok) throw new Error(`PDF取得失敗 ${res.status}`);
    fs.writeFileSync(pdf, Buffer.from(await res.arrayBuffer()));
  }
  // -layout を付けると概要テーブルの行がまとまり、項目名と値がつながって拾いやすい
  execFileSync('pdftotext', ['-enc', 'UTF-8', ...(mode === 'raw' ? [] : ['-layout']), pdf, txt]);
  return fs.readFileSync(txt, 'utf-8');
}
