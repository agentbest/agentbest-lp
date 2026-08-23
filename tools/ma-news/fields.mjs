// tools/ma-news/fields.mjs … 「(1)名称 (2)所在地 …」の会社概要テーブルから値を取る
//
// 適時開示の会社概要は2列の表で、PDFをテキストに落とすと
//   ・ラベルと値が同じ行に並ぶ（素直なケース）
//   ・ラベルだけ先に全部並び、そのあとに値が同じ順で並ぶ（崩れるケース）
// の2通りになる。後者を「値が空」と読むと、名称に住所が入るような取り違えが起きる。
//
// ラベルの出現順と値の出現順は必ず一致するので、読み順にイベントを並べ、
// 値が来たら「待っている一番古いラベル」に配る。これで両方のケースを1本で扱える。
// それでも多行の値でズレることがあるため、最後に型チェック（住所っぽい／金額っぽい）で捨てる。

const NUM = '[(（]\s*([0-9]{1,2})\s*[)）]';

/** ページ番号や記号だけの行は値ではない */
const isNoise = (s) => !s || /^[0-9\s.\-―－/]+$/.test(s) || s.length <= 1;

/**
 * @param {string} sec 概要セクションのテキスト（rawモードのPDFテキスト推奨）
 * @returns {Array<{n:number, label:string, value:string}>} 出現順
 */
export function pairFields(sec) {
  const markRe = new RegExp(NUM + '\s*([^\n(（]{0,20}?)(?=\s|$|[(（])', 'g');
  const events = [];
  for (const line of sec.split(/\n/)) {
    let last = 0;
    let m;
    markRe.lastIndex = 0;
    while ((m = markRe.exec(line))) {
      const before = line.slice(last, m.index).trim();
      if (!isNoise(before)) events.push({ t: 'v', s: before });
      events.push({ t: 'l', label: m[2].replace(/\s/g, ''), n: Number(m[1]) });
      last = m.index + m[0].length;
    }
    const rest = line.slice(last).trim();
    if (!isNoise(rest)) events.push({ t: 'v', s: rest });
  }

  const out = [];
  const pending = [];
  for (const e of events) {
    if (e.t === 'l') {
      const rec = { n: e.n, label: e.label, value: '' };
      out.push(rec);
      pending.push(rec);
    } else if (pending.length) {
      pending.shift().value = e.s;
    }
  }
  return out;
}

/* ---- 値の型チェック。取り違えを検出して捨てるために使う ---- */
export const looksAddress = (v) =>
  /^(北海道|東京都|京都府|大阪府|.{2,3}[県府])|[都道府県].{0,12}[市区郡町村]|^(アメリカ|米国|中華人民共和国|中国|シンガポール|英国|ドイツ|オランダ|タイ|ベトナム|インド|韓国|台湾)/.test(v);
export const looksMoney = (v) => /[0-9][0-9,.]*\s*(千円|百万円|億円|円|ドル|USD|EUR)/.test(v);
export const looksDate = (v) => /[0-9]{4}\s*年/.test(v);
export const looksPerson = (v) => /代表(取締役|者|社員|執行役)|会長|社長|CEO|理事長/.test(v);
export const looksCompany = (v) =>
  /(株式会社|有限会社|合同会社|合資会社|Inc\.?|LLC|Ltd\.?|Corp|GmbH|B\.V\.|S\.A\.|Pte|Co\.,?)/i.test(v);

const CHECK = {
  name: (v) => !looksAddress(v) && !looksMoney(v) && !looksDate(v) && !looksPerson(v) && v.length >= 2,
  location: (v) => looksAddress(v),
  business: (v) =>
    !looksAddress(v) && !looksMoney(v) && !looksDate(v) && !looksPerson(v) && v.length >= 4 &&
    // 「資本関係／取引関係」の説明文を事業内容として拾わない
    !/(該当事項|ありません|当社と当該|資本関係|人的関係|取引関係|関連当事者|持株比率|%)/.test(v),
  capital: (v) => looksMoney(v),
  founded: (v) => looksDate(v),
  ceo: (v) => looksPerson(v),
};

const LABEL_RE = {
  name: /^(名称|商号|会社名|氏名)/,   // 「(1)名称」「商号」など
  location: /^(所在地|本店所在地|住所|本社)/,
  business: /^事業(の)?(内容|概要)|^主?な?事業/,
  capital: /^資本金/,
  founded: /^(設立|創業)(年月日|年月|日)?/,
  ceo: /^代表者|^代表取締役/,
};

/** 概要セクションから主要項目を取り出す。型に合わない値は採らない（空で返す） */
export function summaryOf(sec) {
  const pairs = pairFields(sec);
  const out = {};
  for (const key of Object.keys(LABEL_RE)) {
    const hit = pairs.find((p) => LABEL_RE[key].test(p.label));
    if (!hit) continue;
    const v = hit.value.trim();
    if (v && CHECK[key](v)) out[key] = v;
  }
  return out;
}

/** 字間が空いたラベル（「名　称」「事 業 内 容」）は、空白を潰した1行から前方一致で拾える。
 *  pairFields は行が折り返されると弱いので、layoutモードのテキストに対してこちらを併用する。 */
export function scanLabels(sec) {
  const out = {};
  for (const line of sec.split(/\n/)) {
    const f = String(line)
      .replace(/[　]/g, ' ')
      .replace(/\s+(?=[^\x00-\x7F])/g, '')
      .replace(/(?<=[^\x00-\x7F])\s+/g, '')
      .replace(/^[(（]\s*[0-9]{1,2}\s*[)）]/, '')
      .trim();
    for (const key of Object.keys(LABEL_RE)) {
      if (out[key]) continue;
      const m = LABEL_RE[key].exec(f);
      if (!m || m.index !== 0) continue;
      const v = f.slice(m[0].length).replace(/^[:：]/, '').trim();
      if (v && CHECK[key](v)) out[key] = v;
    }
  }
  return out;
}

/** rawモードとlayoutモード、それぞれ得意な崩れ方が違うので両方から拾って埋め合わせる */
export function summaryMerged(rawSec, layoutSec) {
  const a = summaryOf(rawSec);
  const b = scanLabels(layoutSec || '');
  const out = {};
  for (const k of Object.keys(LABEL_RE)) {
    // 折り返しでカッコ書きだけを拾ってしまうことがあるので、素直な方を選ぶ
    // 折り返しでカッコ書きだけを拾ったり、1行に4項目まとめて入ったりする。
    // どちらのモードも「短く素直に取れている方」が正しいことが多い。
    const cands = [a[k], b[k]].filter(Boolean).filter((v) => !/^[(（]/.test(v));
    const all = cands.length ? cands : [a[k], b[k]].filter(Boolean);
    out[k] = all.sort((x, y) => x.length - y.length)[0] || '';
  }
  // 注記つきの長い社名は最初のカッコで切る（「A社(登記上の名称は…)」など）
  if (out.name.length > 30) out.name = out.name.split(/[(（]/)[0].trim() || out.name;
  out.founded = out.founded.replace(/^(年月日|年月|日)/, '');
  return out;
}
