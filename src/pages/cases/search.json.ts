// src/pages/cases/search.json.ts … 事例のしぼり込み用インデックス（ビルド時に静的生成）。
//
// /cases/search/ からのみ fetch する。1,000件ぶんあるので、
// 一覧に必要な項目だけを配列で持ち、ラベルは辞書に逃がして重複を削っている。
//
//   { a: [領域名...], p: [パターン名...], g: [タグ名...],
//     i: [[id, title, subtitle, summary, 領域番号, パターン番号, 年代, 年収帯,
//          転職後年収, タグ番号の配列], ...] }
import type { APIRoute } from 'astro';
import { CASES } from '../../lib/cases';

export const GET: APIRoute = async () => {
  const areas: string[] = [];
  const patterns: string[] = [];
  const tags: string[] = [];
  const idOf = (arr: string[], v: string) => {
    const i = arr.indexOf(v);
    return i >= 0 ? i : arr.push(v) - 1;
  };

  const items = CASES.map((c) => [
    c.id,
    c.title,
    c.subtitle,
    c.summary,
    idOf(areas, c.areaLabel),
    idOf(patterns, c.patternLabel),
    c.ageBand,
    c.incomeBand,
    c.after.income,
    c.tags.map((t) => idOf(tags, t)),
  ]);

  return new Response(JSON.stringify({ a: areas, p: patterns, g: tags, i: items }), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
