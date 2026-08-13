import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://www.agent-best.net',
  integrations: [
    sitemap({
      // 旧トップの残骸。現トップとほぼ重複するのでサイトマップから除外（ページ側は noindex）
      // 記事検索は結果が毎回変わるので同じく noindex。載せると「noindexなのにサイトマップにある」
      // という矛盾を Search Console に指摘される
      filter: (page) => !page.includes('/index_old') && !page.includes('/media/search'),
    }),
  ],
});
