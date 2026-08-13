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

function articleLastmod() {
  const map = new Map();
  for (const file of fs.readdirSync(MEDIA_DIR)) {
    if (!file.endsWith('.md')) continue;
    // frontmatter だけ見れば足りるので先頭のみ読む
    const head = fs.readFileSync(new URL(file, MEDIA_DIR), 'utf-8').slice(0, 2000);
    // reviewedAt（情報の基準日）があればそれを優先し、無ければ公開日
    const m = /^reviewedAt:\s*(\S+)/m.exec(head) || /^pubDate:\s*(\S+)/m.exec(head);
    if (!m) continue;
    const d = new Date(m[1]);
    if (!Number.isNaN(d.getTime())) map.set(file.slice(0, -3), d);
  }
  return map;
}

const LASTMOD = articleLastmod();
const BUILT_AT = new Date();

// 記事の pubDate / reviewedAt には先付けのもの（ビルド時点より未来）が217本ある。
// 未来の lastmod はサイトマップとして不正なので、ビルド日で頭打ちにする。
// ※記事側の表示日と JSON-LD は未来のままなので、そちらは別途そろえる必要がある
const clamp = (d) => (d > BUILT_AT ? BUILT_AT : d);

// 一覧・ハブ・トップは記事の更新に連動して中身が変わるので、記事の最新日（未来は除く）を使う
const NEWEST = clamp(
  new Date(Math.max(...[...LASTMOD.values()].map((d) => d.getTime()))),
);

export default defineConfig({
  site: 'https://www.agent-best.net',
  integrations: [
    sitemap({
      // 旧トップの残骸。現トップとほぼ重複するのでサイトマップから除外（ページ側は noindex）
      // 記事検索は結果が毎回変わるので同じく noindex。載せると「noindexなのにサイトマップにある」
      // という矛盾を Search Console に指摘される
      filter: (page) => !page.includes('/index_old') && !page.includes('/media/search'),
      serialize(item) {
        // 記事ページ（/media/{slug}/）だけ slug が1階層。/media/hub/... は対象外になる
        const m = /\/media\/([^/]+)\/$/.exec(item.url);
        const d = (m && LASTMOD.get(m[1])) || NEWEST;
        item.lastmod = clamp(d).toISOString();
        return item;
      },
    }),
  ],
});
