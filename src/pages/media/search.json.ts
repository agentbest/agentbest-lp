// src/pages/media/search.json.ts … サイト内検索用のインデックス（ビルド時に静的生成）
//
// 検索ページからfetchで読む。トップやハブページにインラインで埋め込むとHTMLが1MB以上増えるので、
// 「検索を使う人だけが読み込む」形にしています。
//
// 2,487本ぶんあるので、キー名の繰り返しとラベルの重複を削ってサイズを抑えています。
//   { c: [カテゴリ名...], h: [ハブ名...], g: [タグ名...],
//     i: [[slug, title, desc, カテゴリ番号, ハブ番号, 企業名, タグ番号の配列], ...] }
// 展開は /media/search/ 側でやります。
//
// タグ名も入れているのは、「外資系」「年収1000万」のようにタイトルにも説明文にも
// 出てこない語で検索されたときに拾えるようにするためです（タグ名は71種類しかないので容量はほぼ増えません）。
import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { hubLabel } from '../../lib/mediaTaxonomy';
import { getTagGroups, tagSlugsOf, TAG_BY_SLUG } from '../../lib/mediaTags';

/** 検索結果は2行までしか表示しないので、説明文はそのぶんだけ持たせる */
const DESC_MAX = 90;

export const GET: APIRoute = async () => {
  const posts = await getCollection('media');
  const { live } = getTagGroups(posts);

  const cats: string[] = [];
  const hubs: string[] = [];
  const tags: string[] = [];
  const idOf = (arr: string[], v: string) => {
    const i = arr.indexOf(v);
    return i >= 0 ? i : arr.push(v) - 1;
  };

  const items = posts
    .map((p) => {
      const d = p.data.description ?? '';
      return [
        p.slug,
        p.data.title,
        d.length > DESC_MAX ? `${d.slice(0, DESC_MAX)}…` : d,
        idOf(cats, p.data.category),
        idOf(hubs, hubLabel(p.data.hub ?? '')),
        p.data.companyName ?? '',
        tagSlugsOf(p)
          .filter((s) => live.has(s))
          .map((s) => idOf(tags, TAG_BY_SLUG.get(s)!.label)),
      ];
    })
    .sort((a, b) => String(a[1]).localeCompare(String(b[1]), 'ja'));

  return new Response(JSON.stringify({ c: cats, h: hubs, g: tags, i: items }), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
