import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://www.agent-best.net',
  integrations: [
    sitemap({
      // 旧トップの残骸。現トップとほぼ重複するのでサイトマップから除外（ページ側は noindex）
      filter: (page) => !page.includes('/index_old'),
    }),
  ],
});
