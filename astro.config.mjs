import fs from 'node:fs';
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// 記事の更新日を frontmatter から拾って sitemap の <lastmod> に入れる。
//
// これが無いと Google はサイトマップの中身が変わったことに気づけず、
// 子サイトマップ（sitemap-0.xml）を自分の都合でしか読み直さない。
// 実際 2026-08-13 に構造を変えたあとも、Search Console 上の sitemap-0.xml は
// 8/09 の読み込みのままで、検出ページ数が 1,828 件（実際は 2,621 件）に留まっていた。
//
// content collection は astro.config からは読めないので、Markdown を直接見ている。
const MEDIA_DIR = new URL('./src/content/media/', import.meta.url);

// タグの別名解決はページ側と同じ定義を使う（ここで独自実装すると必ずズレる）。
// astro.config から .ts を読めない環境でも落ちないように動的 import + フォールバック。
let tagSlugsOf = null;
try {
  ({ tagSlugsOf } = await import('./src/lib/mediaTags.ts'));
} catch {
  console.warn('[sitemap] mediaTags.ts を読めなかったので、タグ一覧の lastmod は全体の最新日にします');
}

function readArticles() {
  const out = [];
  for (const file of fs.readdirSync(MEDIA_DIR)) {
    if (!file.endsWith('.md')) continue;
    // frontmatter だけ見れば足りるので先頭のみ読む
    const head = fs.readFileSync(new URL(file, MEDIA_DIR), 'utf-8').slice(0, 2000);
    // reviewedAt（情報の基準日）があればそれを優先し、無ければ公開日
    const m = /^reviewedAt:\s*(\S+)/m.exec(head) || /^pubDate:\s*(\S+)/m.exec(head);
    if (!m) continue;
    const date = new Date(m[1]);
    if (Number.isNaN(date.getTime())) continue;
    const hub = /^hub:\s*"?([^"\r\n]+?)"?\s*$/m.exec(head)?.[1] ?? '';
    const theme = /^theme:\s*"?([^"\r\n]+?)"?\s*$/m.exec(head)?.[1] ?? '';
    const tags = (/^tags:\s*\[(.*)\]/m.exec(head)?.[1] ?? '')
      .split(',')
      .map((s) => s.trim().replace(/^["']|["']$/g, ''))
      .filter(Boolean);
    out.push({ slug: file.slice(0, -3), date, hub, data: { tags, theme } });
  }
  return out;
}

const ARTICLES = readArticles();
const BUILT_AT = new Date();

// 先付けの日付が紛れ込んだ場合の保険。未来の lastmod はサイトマップとして不正なので頭打ちにする。
// （2026-08-20 に先付け183本を実際の執筆日へ直したので、通常はここに掛からない）
const clamp = (d) => (d > BUILT_AT ? BUILT_AT : d);

const newestOf = (list) =>
  clamp(new Date(Math.max(...list.map((a) => a.date.getTime()))));

const ARTICLE_LASTMOD = new Map(ARTICLES.map((a) => [a.slug, a.date]));

// 一覧ページは「そこに載っている記事の最新日」を使う。
//
// 以前はサイト全体の最新記事日を全一覧ページに配っていたため、
// 記事を1本足すだけで無関係なハブ・タグ264ページの lastmod がいっせいに動いていた。
// 中身が変わっていないのに更新を主張すると Google は lastmod ごと信用しなくなる。
const groupLastmod = (keyOf) => {
  const m = new Map();
  for (const a of ARTICLES) {
    for (const k of keyOf(a)) {
      const cur = m.get(k);
      if (!cur || a.date > cur) m.set(k, a.date);
    }
  }
  return m;
};

const HUB_LASTMOD = groupLastmod((a) => (a.hub ? [a.hub] : []));
const TAG_LASTMOD = tagSlugsOf ? groupLastmod((a) => tagSlugsOf(a)) : new Map();

// メディアトップ・企業一覧・コーポレート各ページは全体の最新日で構わない
const NEWEST = newestOf(ARTICLES);

export default defineConfig({
  site: 'https://www.agent-best.net',
  integrations: [
    sitemap({
      // 旧トップの残骸。現トップとほぼ重複するのでサイトマップから除外（ページ側は noindex）
      // 記事検索は結果が毎回変わるので同じく noindex。載せると「noindexなのにサイトマップにある」
      // という矛盾を Search Console に指摘される
      filter: (page) => !page.includes('/index_old') && !page.includes('/media/search'),
      serialize(item) {
        // 2ページ目以降（/2/ など）は1ページ目と同じ集合の続きなので同じ日付でよい
        const hub = /\/media\/hub\/([^/]+)\/(?:\d+\/)?$/.exec(item.url)?.[1];
        const tag = /\/media\/tag\/([^/]+)\/(?:\d+\/)?$/.exec(item.url)?.[1];
        // 記事ページ（/media/{slug}/）だけ slug が1階層。/media/hub/... は上で拾い済み
        const art = /\/media\/([^/]+)\/$/.exec(item.url)?.[1];

        const d =
          (hub && HUB_LASTMOD.get(hub)) ||
          (tag && TAG_LASTMOD.get(tag)) ||
          (art && ARTICLE_LASTMOD.get(art)) ||
          NEWEST;

        item.lastmod = clamp(d).toISOString();
        return item;
      },
    }),
  ],
});
