/* 求人サイト（jobs.agent-best.net）の掲載求人の集計（data/market-index.json）をビルド時に1回だけ読む（2026-11-18）。
   作っているのは jobsite の market.js（毎朝のビルド）。年収系の記事に「当サイト掲載求人の提示年収の中央値」を出すのに使う（SalaryFacts.astro）。
   取れないとき（ネットワーク・形式の変化）は null を返し、記事側は何も出さない＝ビルドは止めない。
   ⚠ 数字はビルドした日の値。このリポジトリは毎日どこかの自動更新で push されるので、だいたい1日おきに入れ替わる。 */
import { JOBS_URL } from './jobsLink';

export interface MarketRow { n: number; cos: number; nSal: number; medMin: number | null; medMax: number | null; g?: string; l?: string }
export interface MarketIndex { updated: string; groups: Record<string, MarketRow>; hubs: Record<string, MarketRow> }

let cache: Promise<MarketIndex | null> | null = null;
export function getMarketIndex(): Promise<MarketIndex | null> {
  if (!cache) {
    cache = fetch(`${JOBS_URL}data/market-index.json`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => (d && d.groups && d.hubs ? (d as MarketIndex) : null))
      .catch(() => null);
  }
  return cache;
}
