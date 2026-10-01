// 企業記事 → 求人サイトの企業ページ（jobs.agent-best.net/company/<企業ID>/）の対応表を作る。
//   node tools/jobsite-companies/fetch.mjs  → src/data/jobsite-companies.json（{ 記事slug: [企業ID, 求人サイト上の社名] }）
//
// 企業記事の「〇〇への転職を考えている方へ」ボックスから、その会社の会社概要・募集中の求人へ直接つなぐため（2026-10-01）。
// 求人サイトの企業ページは求人が0件になっても消えない（URLは固定）ので、表は時々作り直せば足りる。
// 企業記事を増やしたとき・求人DB（企業）が増えたときに回す。⚠ ビルド時には取りに行かない（Vercelのビルドを外部に依存させない）。
//
// 逆向き（求人サイト→記事）は jobsite の fetch-media-companies.js。社名の正規化 norm() は同じものを使う。
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '../..');
const MEDIA = path.join(ROOT, 'src/content/media');
const OUT = path.join(ROOT, 'src/data/jobsite-companies.json');
const SRC = 'https://jobs.agent-best.net/data/companies-list.json';   // [[id, 社名, 業種, 大分類, 都道府県, 規模, 上場, 求人数], ...]

function norm(s) {
  return String(s || '').normalize('NFKC').toLowerCase()
    .replace(/(株式会社|有限会社|合同会社|合資会社|一般社団法人|一般財団法人|公益財団法人|\(株\)|co\.,? ?ltd\.?|inc\.?|corporation|corp\.?|k\.k\.)/g, '')
    .replace(/[\s・.,\-‐－ー&＆'’]/g, '');
}

const res = await fetch(SRC);
if (!res.ok) throw new Error(`${SRC}: HTTP ${res.status}`);
const list = await res.json();
const byNorm = new Map();
// 同じ社名が二重登録されているときは求人の多い方を採る
for (const r of list) {
  const k = norm(r[1]);
  const cur = byNorm.get(k);
  if (!cur || (r[7] || 0) > (cur[7] || 0)) byNorm.set(k, r);
}

const out = {};
let total = 0;
for (const f of fs.readdirSync(MEDIA)) {
  const t = fs.readFileSync(path.join(MEDIA, f), 'utf8').slice(0, 3000);
  if (!/^category:\s*"企業"/m.test(t)) continue;
  const m = t.match(/^companyName:\s*"?(.*?)"?\s*$/m);
  if (!m) continue;
  total++;
  const r = byNorm.get(norm(m[1]));
  if (r) out[f.replace(/\.md$/, '')] = [r[0], r[1]];
}
fs.writeFileSync(OUT, JSON.stringify(out, null, 0) + '\n');
console.log(`企業記事 ${total}本 → 求人サイトの企業ページと一致 ${Object.keys(out).length}本 → ${path.relative(ROOT, OUT)}`);
