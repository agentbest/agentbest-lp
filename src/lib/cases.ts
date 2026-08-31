// src/lib/cases.ts … 転職事例集（/cases）のデータ読み込みと共通ヘルパー。
//
// データの生成元は tools/cases/（generate.mjs）。手で src/data/*.json を編集しない。
// 事例を増やす・文面を直すときは tools/cases/ を直して再生成する。

import casesJson from '../data/cases.json';
import patternsJson from '../data/case-patterns.json';

export interface CaseSection { h: string; p: string[] }
export interface CaseSide { industry: string; company: string; role: string; income: number }
export interface CaseItem {
  id: string;
  no: number;
  pattern: string;
  patternLabel: string;
  area: string;
  areaLabel: string;
  title: string;
  subtitle: string;
  summary: string;
  age: number;
  ageBand: string;
  years: number;
  before: CaseSide;
  after: CaseSide;
  delta: number;
  deltaLabel: string;
  incomeBand: string;
  process: { applied: number; docPass: number; finals: number; offers: number; months: number };
  motive: string;
  barrier: string;
  breaks: string[];
  tags: string[];
  sections: CaseSection[];
}
export interface CasePattern {
  slug: string;
  area: string;
  areaLabel: string;
  label: string;
  question: string;
  lead: string;
  tags: string[];
  beforeIndustry: string;
  afterIndustry: string;
  count: number;
}

export const CASES = casesJson as unknown as CaseItem[];
export const PATTERNS = (patternsJson as any).patterns as CasePattern[];
export const AREAS = (patternsJson as any).areas as Record<string, { label: string; note: string }>;

export const AREA_ORDER = ['pm', 'consul', 'ma', 'eng', 'biz'];

export const CASE_BY_ID = new Map(CASES.map((c) => [c.id, c]));
export const PATTERN_BY_SLUG = new Map(PATTERNS.map((p) => [p.slug, p]));

export const casesOfPattern = (slug: string) => CASES.filter((c) => c.pattern === slug);

/** 領域ごとにパターンをまとめる。表示順は AREA_ORDER に従う */
export function patternGroups() {
  return AREA_ORDER
    .filter((a) => AREAS[a])
    .map((a) => ({
      key: a,
      label: AREAS[a].label,
      note: AREAS[a].note,
      patterns: PATTERNS.filter((p) => p.area === a),
      count: CASES.filter((c) => c.area === a).length,
    }));
}

/**
 * 事例集全体の注記。
 * ⚠ ここが唯一の原本。/cases 配下の全ページがこれを表示する。文言を変えるならここだけ直す。
 */
export const DISCLAIMER =
  '本事例集は、転職市場で実際に成立している異動パターンをもとに構成したモデルケースです。' +
  '特定の個人の転職を記述したものではなく、当社が支援した案件の実績を示すものでもありません。' +
  '氏名・イニシャル・写真・本人のコメントは掲載しておらず、企業名も「大手SIer」「上場SaaS企業」のような類型で表しています。' +
  '年収は求人票で提示されるレンジをもとにした目安です。';

/** 一覧の表示件数（1ページあたり） */
export const PER_PAGE = 40;
