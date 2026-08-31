// tools/cases/generate.mjs … 転職事例集（1,000件）を生成して src/data/cases.json に書き出す。
//
//   node tools/cases/generate.mjs
//
// ⚠ 事例は「転職市場で実際に成立している異動パターン」をもとに構成したモデルケース。
//   特定の個人の転職を記述したものではなく、実在の企業名も出さない。
//   この前提は /cases/ の各ページに明記している。前提を変えるならページ側の文言も直すこと。
//
// 乱数は seed 固定。再生成しても同じ内容になるので、差分レビューができる。

import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PATTERNS, AREAS } from './patterns.mjs';
import { MOTIVES as M0, BARRIERS as BA0, BREAKS as BR0, INCOME_LOGIC as IL0, TAKEAWAYS as TA0 } from './banks.mjs';
import { MOTIVES_EXTRA, BARRIERS_EXTRA, BREAKS_EXTRA, INCOME_LOGIC_EXTRA, TAKEAWAYS_EXTRA } from './banks-extra.mjs';

// 追加分は banks-extra.mjs 側。既存エントリの body 配列は絶対に増やさない
// （選ばれる文がずれて、公開済みの事例の本文が入れ替わるため）
const MOTIVES = { ...M0, ...MOTIVES_EXTRA };
const BARRIERS = { ...BA0, ...BARRIERS_EXTRA };
const BREAKS = { ...BR0, ...BREAKS_EXTRA };
const INCOME_LOGIC = { ...IL0, ...INCOME_LOGIC_EXTRA };
const TAKEAWAYS = { ...TA0, ...TAKEAWAYS_EXTRA };

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(HERE, '../../src/data/cases.json');
const PER_PATTERN = 25;

/* ---------- 決定的な乱数 ---------- */
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const mk = (rng) => ({
  int: (min, max) => min + Math.floor(rng() * (max - min + 1)),
  pick: (arr) => arr[Math.floor(rng() * arr.length)],
  /** min〜max を step 刻みで */
  step: (min, max, step) => {
    const n = Math.floor((max - min) / step) + 1;
    return min + Math.floor(rng() * n) * step;
  },
});

/* ---------- 年収ロジックの整合 ---------- */
function incomeLogicFor(delta, candidates) {
  const up = ['up_scope', 'up_scarcity', 'up_stage', 'up_role', 'up_domain', 'up_negotiation', 'up_market', 'up_shortage'];
  let ok;
  if (delta > 40) ok = candidates.filter((k) => up.includes(k));
  else if (delta < -40) ok = candidates.filter((k) => k === 'down_then_up' || k === 'down_life');
  else ok = candidates.filter((k) => k === 'flat_tradeoff' || k === 'flat_stage');
  if (ok.length) return ok;
  // パターン側が持っていない符号になった場合の受け皿
  if (delta > 40) return ['up_scope'];
  if (delta < -40) return ['down_then_up'];
  return ['flat_tradeoff'];
}

const bandOf = (v) => {
  if (v < 500) return '〜500万円';
  if (v < 700) return '500〜700万円';
  if (v < 900) return '700〜900万円';
  if (v < 1200) return '900〜1200万円';
  return '1200万円〜';
};
const ageBandOf = (a) => (a < 30 ? '20代' : a < 40 ? '30代' : a < 50 ? '40代' : '50代');

/* ---------- 1件 ---------- */
function buildCase(pattern, i, serial) {
  const rng = mulberry32(serial * 7919 + 13);
  const r = mk(rng);

  const age = r.int(pattern.age[0], pattern.age[1]);
  // 経験年数は年齢と整合させる（新卒22歳前提で上限を切る）
  const years = Math.max(2, Math.min(r.int(3, 14), age - 22));
  const incomeBefore = r.step(pattern.income[0], pattern.income[1], 10);
  const delta = r.step(pattern.delta[0], pattern.delta[1], 10);
  const incomeAfter = incomeBefore + delta;

  const beforeCompany = r.pick(pattern.before.companies);
  const beforeRole = r.pick(pattern.before.roles);
  const afterCompany = r.pick(pattern.after.companies);
  const afterRole = r.pick(pattern.after.roles);

  const applied = r.int(6, 34);
  const docPass = Math.max(2, Math.round(applied * (0.28 + rng() * 0.34)));
  const finals = Math.max(1, Math.min(docPass, r.int(1, 4)));
  const offers = Math.max(1, Math.min(finals, r.int(1, 2)));
  const months = r.int(2, 8);

  const ctx = {
    age, years, teamSize: r.int(5, 60), shortYears: r.int(1, 2),
    beforeCompany, beforeRole, beforeIndustry: pattern.before.industry,
    afterCompany, afterRole, afterIndustry: pattern.after.industry,
    incomeBefore, incomeAfter, delta, negoUp: r.step(20, 90, 10),
    applied, docPass, finals, offers, months, weeks: r.int(3, 10),
  };

  const motiveKey = r.pick(pattern.motives);
  const barrierKey = r.pick(pattern.barriers);
  const breakPool = pattern.breaks.slice();
  const b1 = r.pick(breakPool);
  const b2 = r.pick(breakPool.filter((k) => k !== b1)) ?? null;
  const incomeKey = r.pick(incomeLogicFor(delta, pattern.incomeLogic));
  const takeawayKey = r.pick(pattern.takeaways);

  const pickBody = (bank, key) => r.pick(bank[key].body)(ctx);

  const deltaLabel = delta === 0 ? '横ばい' : `${delta > 0 ? '+' : ''}${delta}万円`;
  const title = `${beforeCompany}の${beforeRole} → ${afterCompany}の${afterRole}`;
  const subtitle = `${age}歳／${incomeBefore}万円 → ${incomeAfter}万円（${deltaLabel}）`;

  const processLine =
    `応募${applied}社、書類通過${docPass}社、最終面接まで進んだのが${finals}社、内定${offers}社。` +
    `情報収集を始めてから内定まで約${months}か月かかっている。`;

  const sections = [
    { h: '転職前の状況', p: [r.pick(pattern.situations)(ctx)] },
    { h: '転職を考えたきっかけ', p: [pickBody(MOTIVES, motiveKey)] },
    { h: '選考でネックになったこと', p: [pickBody(BARRIERS, barrierKey)] },
    {
      h: 'どう進めたか',
      p: [pickBody(BREAKS, b1), b2 ? pickBody(BREAKS, b2) : null, processLine].filter(Boolean),
    },
    { h: '年収の動き', p: [INCOME_LOGIC[incomeKey](ctx)] },
    { h: 'このケースから読み取れること', p: [TAKEAWAYS[takeawayKey]()] },
  ];

  const tags = Array.from(new Set([
    ...pattern.tags,
    ageBandOf(age),
    bandOf(incomeAfter),
    MOTIVES[motiveKey].label,
    BARRIERS[barrierKey].label,
  ]));

  const summary =
    `${pattern.before.industry}の${beforeRole}から${afterRole}へ。` +
    `選考の論点は「${BARRIERS[barrierKey].label}」。${BREAKS[b1].label}ことで前に進んだケース。`;

  return {
    id: `case-${String(serial).padStart(4, '0')}`,
    no: i + 1,
    pattern: pattern.slug,
    patternLabel: pattern.label,
    area: pattern.area,
    areaLabel: AREAS[pattern.area].label,
    title, subtitle, summary,
    age, ageBand: ageBandOf(age), years,
    before: { industry: pattern.before.industry, company: beforeCompany, role: beforeRole, income: incomeBefore },
    after: { industry: pattern.after.industry, company: afterCompany, role: afterRole, income: incomeAfter },
    delta, deltaLabel, incomeBand: bandOf(incomeAfter),
    process: { applied, docPass, finals, offers, months },
    motive: MOTIVES[motiveKey].label,
    barrier: BARRIERS[barrierKey].label,
    breaks: [BREAKS[b1].label, b2 ? BREAKS[b2].label : null].filter(Boolean),
    tags,
    sections,
  };
}

/* ---------- 全件 ---------- */
const cases = [];
let serial = 0;
for (const pattern of PATTERNS) {
  for (let i = 0; i < PER_PATTERN; i++) {
    serial += 1;
    cases.push(buildCase(pattern, i, serial));
  }
}

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, JSON.stringify(cases), 'utf8');

// パターンの定義は tools/ 側にあるので、ページから読めるように JSON でも出す。
// （Astro から tools/*.mjs を直接importしない。ビルド対象の外に出しておきたい）
const patternMeta = PATTERNS.map((p) => ({
  slug: p.slug, area: p.area, areaLabel: AREAS[p.area].label,
  label: p.label, question: p.question, lead: p.lead, tags: p.tags,
  beforeIndustry: p.before.industry, afterIndustry: p.after.industry,
  count: cases.filter((c) => c.pattern === p.slug).length,
}));
// generatedAt は sitemap の <lastmod> に使う（astro.config.mjs）。
// ファイルの mtime だと Vercel の clone でビルド日に化けるので、生成時刻を中に持たせる。
writeFileSync(resolve(HERE, '../../src/data/case-patterns.json'),
  JSON.stringify({ generatedAt: new Date().toISOString(), areas: AREAS, patterns: patternMeta }), 'utf8');

/* ---------- 自己点検 ---------- */
const ids = new Set(cases.map((c) => c.id));
const bodies = cases.map((c) => c.sections.map((s) => s.p.join('')).join(''));
const dupBodies = bodies.length - new Set(bodies).size;
const avgLen = Math.round(bodies.reduce((n, b) => n + b.length, 0) / bodies.length);

console.log(`生成: ${cases.length}件 / パターン${PATTERNS.length}種 × ${PER_PATTERN}件`);
console.log(`ID重複: ${cases.length - ids.size}件、本文の完全一致: ${dupBodies}件、本文の平均文字数: ${avgLen}`);
console.log(`出力: ${OUT}`);
