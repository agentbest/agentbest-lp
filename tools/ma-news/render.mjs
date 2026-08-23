// tools/ma-news/render.mjs … 抽出した事実から記事Markdownを組み立てる
//
// 開示文の言い回しは持ってこない（他社の文章を写すことになる）。
// 使うのは固有名詞・数値・日付だけで、文はこのファイルの型から作る。
import { yen, jpDate } from './parse.mjs';

/* 事業内容や開示文から業種タグを当てる。上から見て最初に当たったものを採る */
const INDUSTRY = [
  ['IT・ソフトウェア', /ソフトウェア|システム(開発|構築|設計)|SaaS|クラウド|アプリ|Web|DX|情報処理|受託開発|IT/],
  ['人材・HR', /人材|採用|求人|派遣|職業紹介|研修|教育|HR/],
  ['医療・ヘルスケア', /医療|病院|クリニック|介護|調剤|薬局|ヘルスケア|福祉|歯科/],
  ['建設・不動産', /建設|工事|建築|土木|不動産|住宅|プラント|設備/],
  ['製造', /製造|メーカー|工業|部品|加工|生産|機械/],
  ['商社・卸', /商社|卸売|卸|輸出入/],
  ['小売・EC', /小売|店舗|EC|通販|物販|スーパー|ドラッグ|アパレル/],
  ['飲食・フード', /飲食|レストラン|外食|食品|食材/],
  ['金融', /金融|銀行|保険|証券|リース|ファイナンス|決済|フィンテック|Fintech/i],
  ['物流・運輸', /物流|運送|倉庫|配送|海運|陸運|輸送/],
  ['広告・マーケティング', /広告|マーケティング|販促|メディア|出版/],
  ['コンサルティング', /コンサル|アドバイザリー/],
  ['エネルギー・環境', /エネルギー|電力|再エネ|太陽光|環境|リサイクル|蓄電/],
  ['通信', /通信|基地局|ネットワーク|回線/],
];

export function industryOf(text) {
  const s = String(text || '');
  for (const [label, re] of INDUSTRY) if (re.test(s)) return label;
  return 'その他';
}

/** 見出しと本文では「株式会社」を落とす。付けたままだと1文に3回出て読みにくい */
export function shortName(s) {
  return String(s || '')
    .replace(/^(株式会社|有限会社|合同会社|合資会社|一般社団法人|医療法人(社団)?)/, '')
    .replace(/(株式会社|有限会社|合同会社|合資会社)$/, '')
    .trim() || String(s || '');
}

/** 開示文の断片が事業内容として紛れ込むことがある。本文に置けないものは落とす */
export function cleanBiz(s) {
  const v = String(s || '').replace(/\s+/g, '');
  if (!v || v.length < 3) return '';
  if (/概要|お知らせ|に関する|連結子会社|を行う|該当事項|ありません/.test(v)) return '';
  // コロンや「◯◯現在」は表のラベル・注記が混ざった証拠。事業内容の文ではない
  if (/[:：]|現在|時点|同左/.test(v)) return '';
  // 折り返しの1行目だけを拾うと「…工事にお」のように文が途中で切れる。
  // 助詞や接続で終わっているものは、続きが別の行にあるとみて捨てる。
  if (/(の|に|お|は|を|が|で|と|や|へ|から|および|及び|ならびに|または|又は|によ|につ)$/.test(v)) return '';
  // 逆に、折り返しの2行目だけを拾うと「ける計測…」のように語の途中から始まる。
  // 事業内容がひらがなで始まることはまずない。
  if (/^[ぁ-ん]/.test(v)) return '';
  return v;
}

/** 「10,000千円」は読みにくいので「1,000万円」に直す */
function capitalText(s) {
  const m = /([0-9][0-9,]*)\s*(千円|百万円|億円|万円|円)/.exec(String(s || '').replace(/\s+/g, ''));
  if (!m) return '';
  const unit = { 円: 1, 千円: 1e3, 万円: 1e4, 百万円: 1e6, 億円: 1e8 }[m[2]];
  return yen(Number(m[1].replace(/,/g, '')) * unit);
}

/** 事業内容を見出しに差し込める長さに詰める */
function shortBiz(s) {
  if (!s) return '';
  let v = String(s).split(/[、,。（(]/)[0].trim();
  v = v.replace(/等$/, '').replace(/^(主に|主として)/, '');
  // 「添好運(Tim Ho Wan)」のような引用符が途中で切れると見出しが壊れる
  const open = (v.match(/「/g) || []).length, close = (v.match(/」/g) || []).length;
  if (open !== close) v = v.split('「')[0].trim();
  // 開示文の断片が紛れ込むことがある。見出しに置けない言葉なら修飾を諦める
  if (/概要|お知らせ|に関する|当社|連結子会社|を行う|における|に係る/.test(v)) return '';
  if (/(の|に|は|を|が|で|と)$/.test(v)) return '';
  return v.length >= 4 && v.length <= 20 ? v : '';
}

const DEAL_VERB = {
  buy: '子会社化', sell: '譲渡', merger: '合併', split: '会社分割',
  transfer: '事業譲渡', exchange: '株式交換', tob: '公開買付け', alliance: '資本業務提携',
};

export function buildTitle(r) {
  const biz = shortBiz(cleanBiz(r.target.business));
  const of = biz ? `${biz}の` : '';
  const t = shortName(r.target.name);
  const i = shortName(r.issuer);
  const c = r.counterparty ? shortName(r.counterparty) : '';
  switch (r.type) {
    case 'sell':     return c ? `${i}、${of}子会社${t}を${c}に譲渡` : `${i}、${of}子会社${t}を譲渡`;
    case 'merger':   return `${i}、${of}${t}を吸収合併`;
    case 'transfer': return `${i}、${t}の${biz || '事業'}を譲受`;
    case 'exchange': return `${i}、${of}${t}を株式交換で子会社化`;
    case 'split':    return `${i}、${t}に係る事業を会社分割`;
    case 'alliance': return `${i}、${of}${t}と資本業務提携`;
    default:         return `${i}、${of}${t}を子会社化`;
  }
}

/** 本文。事実の並べ方だけを決める */
export function buildBody(r) {
  const p = [];
  const disclosed = jpDate(r.disclosedAt);
  const t = shortName(r.target.name);
  const i = shortName(r.issuer);
  const c = r.counterparty ? shortName(r.counterparty) : '';
  const loc = r.target.location ? `（${r.target.location.replace(/\s+/g, '')}）` : '';
  const verb = DEAL_VERB[r.type] || '取引';

  if (r.type === 'sell') {
    p.push(`${i}は${disclosed}、連結子会社の${t}${loc}の株式を${c ? `${c}へ` : ''}譲渡すると発表した。`
      + (/^0(\.0)?$/.test(r.ratioAfter) ? `譲渡後、${t}は同社の連結範囲から外れる。` : ''));
  } else if (r.type === 'buy' || r.type === 'exchange') {
    p.push(`${i}は${disclosed}、${t}${loc}の株式を取得し子会社化すると発表した。`
      + (r.ratioAfter ? `取得後の議決権所有割合は${r.ratioAfter}％となる。` : ''));
  } else if (r.type === 'transfer') {
    p.push(`${i}は${disclosed}、${t}${loc}の事業を譲り受けると発表した。`);
  } else {
    p.push(`${i}は${disclosed}、${t}${loc}に関する${verb}を発表した。`);
  }

  const biz = cleanBiz(r.target.business);
  const cap = capitalText(r.target.capital);
  if (biz || cap || r.target.founded) {
    const extra = [
      r.target.founded ? `設立は${r.target.founded.replace(/\s+/g, '')}` : '',
      cap ? `資本金は${cap}` : '',
    ].filter(Boolean).join('、');
    p.push(biz ? `${t}は${biz}を手がける会社。${extra ? `${extra}。` : ''}` : (extra ? `${t}の${extra}。` : ''));
  }

  const f = [];
  if (r.fin.sales) f.push(`売上高${yen(r.fin.sales.raw)}`);
  if (r.fin.op) f.push(`営業利益${yen(r.fin.op.raw)}`);
  if (r.fin.netAssets) f.push(`純資産${yen(r.fin.netAssets.raw)}`);
  if (f.length >= 2) p.push(`開示によると、${t}の直近期の業績は${f.join('、')}。`);

  const priceLabel = r.type === 'sell' ? '譲渡価額' : '取得価額';
  const tail = [
    r.priceUndisclosed ? `${priceLabel}は非公表` : r.price ? `${priceLabel}は${yen(r.price)}` : '',
    r.closingDate ? `実行日は${jpDate(r.closingDate)}を予定する` : '',
  ].filter(Boolean).join('、');
  if (tail) p.push(`${tail}。`);

  return p.filter(Boolean).join('\n\n');
}

const esc = (s) => String(s).replace(/"/g, '”');

export function buildMarkdown(r) {
  const title = buildTitle(r);
  const body = buildBody(r);
  const industry = industryOf(`${r.target.business} ${r.bizHint || ''} ${r.title}`);
  const verb = DEAL_VERB[r.type] || 'M&A';
  const t = shortName(r.target.name);
  const desc = `${shortName(r.issuer)}が${t}の${verb}を発表。`
    + (r.fin.sales ? `${t}の直近期の売上高は${yen(r.fin.sales.raw)}。` : '')
    + '適時開示をもとに要点をまとめました。';

  return [
    '---',
    `title: "${esc(title)}"`,
    `description: "${esc(desc).slice(0, 118)}"`,
    `dealType: "${r.type}"`,
    `issuer: "${esc(r.issuer)}"`,
    r.code ? `issuerCode: "${r.code}"` : '',
    `targetName: "${esc(r.target.name)}"`,
    `industry: "${industry}"`,
    `tags: [${[verb, industry].map((x) => `"${x}"`).join(', ')}]`,
    `pubDate: ${r.disclosedAt}`,
    `sourceName: "TDnet 適時開示情報"`,
    `sourceUrl: "${r.sourceUrl}"`,
    `tdnetId: "${r.id}"`,
    '---',
    '',
    body,
    '',
  ].filter((l) => l !== '').join('\n');
}
