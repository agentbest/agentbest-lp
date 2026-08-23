// tools/ma-news/run.mjs … M&Aニュースの日次生成
//
//   node tools/ma-news/run.mjs             直近2日分（既定。取りこぼし防止に前日も見る）
//   node tools/ma-news/run.mjs --days 7    直近7日分
//   node tools/ma-news/run.mjs --date 20260820
//   node tools/ma-news/run.mjs --dry       ファイルを書かずに結果だけ出す
//
// 出力は src/content/news/*.md。すでにあるファイルは触らないので、何度流しても増えない。
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { classify } from './classify.mjs';
import { extract, gate } from './extract.mjs';
import { buildMarkdown, buildTitle } from './render.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(HERE, '../../src/content/news');
const LOG = path.join(HERE, 'log');

const argv = process.argv.slice(2);
const opt = (k, d) => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : d; };
const has = (k) => argv.includes(k);

const ymd = (d) => `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;

async function listDay(date) {
  const url = `https://webapi.yanoshin.jp/webapi/tdnet/list/${date}.json?limit=500`;
  const res = await fetch(url, { headers: { 'User-Agent': 'agent-best.net ma-news bot' } });
  if (!res.ok) throw new Error(`TDnet一覧の取得に失敗 ${res.status} (${date})`);
  const j = await res.json();
  return (j.items || []).map((x) => x.Tdnet);
}

/** 同じ案件が「適時開示」と「説明資料」で二重に流れる。開示様式のほうを残す */
function dedupe(items) {
  const score = (i) => (/に関するお知らせ$/.test(i.title) ? 2 : /お知らせ|通知/.test(i.title) ? 1 : 0);
  const byKey = new Map();
  for (const i of items) {
    const key = `${i.company_code}|${String(i.title).replace(/[\s（(].*$/, '').slice(0, 12)}`;
    const cur = byKey.get(key);
    if (!cur || score(i) > score(cur)) byKey.set(key, i);
  }
  return [...byKey.values()];
}

const main = async () => {
  const dates = [];
  if (opt('--date')) dates.push(opt('--date'));
  else {
    const days = Number(opt('--days', 2));
    for (let i = 0; i < days; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      dates.push(ymd(d));
    }
  }

  fs.mkdirSync(OUT, { recursive: true });
  fs.mkdirSync(LOG, { recursive: true });

  const written = [];
  const skipped = [];

  for (const date of dates) {
    let items;
    try { items = await listDay(date); } catch (e) { console.error(`× ${date}: ${e.message}`); continue; }

    const picked = [];
    for (const i of items) {
      const c = classify(i.title);
      if (!c.ok || c.followup) continue;
      picked.push({ ...i, dealType: c.type });
    }

    for (const item of dedupe(picked)) {
      const slug = `${String(item.pubdate).slice(0, 10).replace(/-/g, '')}-${item.id}`;
      const file = path.join(OUT, `${slug}.md`);
      if (fs.existsSync(file)) continue;

      let r;
      try { r = await extract(item); } catch (e) {
        skipped.push({ date, id: item.id, title: item.title, why: `PDFを読めない: ${e.message}` });
        continue;
      }
      const why = gate(r);
      if (why) { skipped.push({ date, id: item.id, title: item.title, why }); continue; }

      const md = buildMarkdown(r);
      if (!has('--dry')) fs.writeFileSync(file, md, 'utf-8');
      written.push({ slug, title: buildTitle(r), issuer: r.issuer });
    }
  }

  const stamp = dates[0];
  const report = {
    ranAt: new Date().toISOString(),
    dates,
    written: written.length,
    skipped: skipped.length,
    writtenItems: written,
    skippedItems: skipped,
  };
  if (!has('--dry')) fs.writeFileSync(path.join(LOG, `${stamp}.json`), JSON.stringify(report, null, 2), 'utf-8');

  console.log(`\n記事 ${written.length}本${has('--dry') ? '（dry run・未書き込み）' : 'を生成'} ／ 見送り ${skipped.length}件`);
  written.forEach((w) => console.log(`  ＋ ${w.slug}  ${w.title}`));
  if (skipped.length) {
    console.log('\n見送り:');
    skipped.forEach((s) => console.log(`  － ${s.why} … ${String(s.title).slice(0, 50)}`));
  }
};

main();
