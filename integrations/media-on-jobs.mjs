// /media と /cases を jobs.agent-best.net で公開するためのビルド後処理（2026-10-17・松岡さん決定）
//
// 仕組み:
//   jobs.agent-best.net は Vercel の小さなプロジェクト（agentbest/jobs-front）が入口になり、
//   /media/・/cases/・/_astro/・/images/ などはこのサイトの本番（agentbest-lp.vercel.app）を、
//   それ以外は GitHub Pages の jobsite を、パスで振り分けて表示する。
//   www.agent-best.net/media/・/cases/ は vercel.json で jobs へ 301 転送する（host が www のときだけ）。
//
// このファイルがすること（dist の HTML を直接書き換える）:
//   1. /media・/cases 配下のページ
//      - canonical・og:url・JSON-LD などの https://www.agent-best.net/media|cases/ を jobs に置き換える
//      - コーポレートのページへのルート相対リンク（/consultation/ /company/ /business/ / など）を
//        https://www.agent-best.net/... の絶対URLにする（jobs 上では /company/ が求人サイトの企業一覧と衝突するため）
//      - /media/ /cases/ /_astro/ /images/ などはルート相対のまま（jobs-front が同じ場所に出す）
//   2. それ以外のコーポレートのページ
//      - /media/・/cases/ へのリンクを https://jobs.agent-best.net/... にする（301 を経由させない）
//   3. sitemap
//      - sitemap-0.xml から /media・/cases の URL を抜き、jobs のURLにして dist/media/sitemap.xml に移す
//        （jobs.agent-best.net/media/sitemap.xml。jobsite の robots.txt から参照する）
//
// ⚠ sitemap() より後ろに並べること（sitemap-0.xml が書かれてから動く必要がある）。
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const WWW = 'https://www.agent-best.net';
const JOBS = 'https://jobs.agent-best.net';
const MOVED = /^\/(media|cases)(\/|$)/;
// jobs-front がこのサイトから出すパス（ルート相対のままでよいもの）
const PASSTHROUGH = /^\/(media|cases|_astro|images|ogp|video)(\/|$)|^\/(logo[^/]*\.png|apple-touch-icon\.png|icon-\d+\.png)$/;

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (e.name.endsWith('.html')) out.push(p);
  }
  return out;
}

const ATTR = /(\s(?:href|src|action|content|poster)=")(\/(?!\/)[^"]*)"/g;
const absWww = (s) => s.split(`${WWW}/media/`).join(`${JOBS}/media/`).split(`${WWW}/cases/`).join(`${JOBS}/cases/`)
  .split(`${WWW}/media"`).join(`${JOBS}/media/"`).split(`${WWW}/cases"`).join(`${JOBS}/cases/"`);

function rewriteMoved(html) {
  html = absWww(html);
  return html.replace(ATTR, (m, pre, url) => (PASSTHROUGH.test(url) ? m : `${pre}${WWW}${url}"`));
}
function rewriteCorporate(html) {
  html = absWww(html);
  return html.replace(ATTR, (m, pre, url) => (MOVED.test(url) ? `${pre}${JOBS}${url}"` : m));
}

function splitSitemap(dist) {
  const file = path.join(dist, 'sitemap-0.xml');
  if (!fs.existsSync(file)) { console.warn('[media-on-jobs] sitemap-0.xml がありません。sitemap の移動をとばします'); return; }
  const xml = fs.readFileSync(file, 'utf-8');
  const head = xml.slice(0, xml.indexOf('<url>'));
  const urls = xml.match(/<url>[\s\S]*?<\/url>/g) || [];
  const isMoved = (u) => /<loc>https:\/\/www\.agent-best\.net\/(media|cases)\//.test(u);
  const keep = urls.filter((u) => !isMoved(u));
  const moved = urls.filter(isMoved).map((u) => absWww(u.replace(/<loc>https:\/\/www\.agent-best\.net\//, `<loc>${JOBS}/`)));
  fs.writeFileSync(file, head + keep.join('') + '</urlset>', 'utf-8');
  fs.writeFileSync(path.join(dist, 'media', 'sitemap.xml'), head + moved.join('') + '</urlset>', 'utf-8');
  console.log(`[media-on-jobs] sitemap: www に ${keep.length} URL を残し、${moved.length} URL を jobs.agent-best.net/media/sitemap.xml へ移しました`);
}

export default function mediaOnJobs({ enabled = true } = {}) {
  return {
    name: 'media-on-jobs',
    hooks: {
      'astro:build:done': ({ dir }) => {
        if (!enabled) { console.log('[media-on-jobs] 無効（www のまま公開）'); return; }
        const dist = fileURLToPath(dir);
        let nMoved = 0, nCorp = 0;
        for (const f of walk(dist)) {
          const rel = '/' + path.relative(dist, f).split(path.sep).join('/');
          const src = fs.readFileSync(f, 'utf-8');
          const out = MOVED.test(rel) ? rewriteMoved(src) : rewriteCorporate(src);
          if (out !== src) { fs.writeFileSync(f, out, 'utf-8'); MOVED.test(rel) ? nMoved++ : nCorp++; }
        }
        console.log(`[media-on-jobs] /media・/cases のページ ${nMoved} 件、コーポレートのページ ${nCorp} 件を書き換えました`);
        splitSitemap(dist);
      },
    },
  };
}
