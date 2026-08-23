// tools/ma-news/fields.mjs … 「(1)名称 (2)所在地 …」の会社概要テーブルから値を取る
//
// 適時開示の会社概要は2列の表で、PDFをテキストに落とすと崩れ方が3通りある。
//   ・ラベルと値が同じ行に並ぶ（素直）
//   ・ラベルだけ先に全部並び、そのあとに値が同じ順で並ぶ
//   ・値のほうが先に来て、ラベルが1行下にずれる
// 同じPDFでもWindows版とLinux版の pdftotext で崩れ方が逆になることがある（実例: 1276867）。
//
// ラベルの出現順と値の出現順は必ず一致するので、両側に待ち行列を持って先着順に組む。
// それでも多行の値でズレるため、最後に型チェック（住所っぽい／金額っぽい）で捨てる。

// 「(1)名称」の番号マーカーとラベル名。ラベルは次の空白かカッコまで。
// ここは new RegExp の文字列にするとエスケープを1段間違えやすいのでリテラルで書く。
const MARK_RE = /[(（]\s*([0-9]{1,2})\s*[)）]\s*([^\n(（]{0,20}?)(?=\s|$|[(（])/g;

/** ページ番号や記号だけの行は値ではない */
const isNoise = (s) =>
  !s || /^[0-9\s.\-―－/]+$/.test(s) || s.length <= 1 ||
  // 見出しの断片。値の列に混ざると1つずつ後ろにずれて全項目が壊れる
  /概要|お知らせ|に関する|下記のとおり|以下のとおり/.test(s);

/**
 * @param {string} sec 概要セクションのテキスト
 * @returns {Array<{n:number, label:string, value:string}>} 出現順
 */
export function pairFields(sec) {
  const events = [];
  for (const line of String(sec).split(/\n/)) {
    let last = 0;
    let m;
    MARK_RE.lastIndex = 0;
    while ((m = MARK_RE.exec(line))) {
      const before = line.slice(last, m.index).trim();
      if (!isNoise(before)) events.push({ t: 'v', s: before });
      events.push({ t: 'l', label: m[2].replace(/\s/g, ''), n: Number(m[1]) });
      last = m.index + m[0].length;
    }
    const rest = line.slice(last).trim();
    if (!isNoise(rest)) events.push({ t: 'v', s: rest });
  }

  const out = [];
  const pendingLabels = [];
  const pendingValues = [];
  for (const e of events) {
    if (e.t === 'l') {
      const rec = { n: e.n, label: e.label, value: '' };
      out.push(rec);
      if (pendingValues.length) rec.value = pendingValues.shift();
      else pendingLabels.push(rec);
    } else if (pendingLabels.length) {
      pendingLabels.shift().value = e.s;
    } else {
      pendingValues.push(e.s);
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
  name: /^(名称|商号|会社名|氏名)/,
  location: /^(所在地|本店所在地|住所|本社)/,
  business: /^事業(の)?(内容|概要)|^主?な?事業/,
  capital: /^資本金/,
  founded: /^(設立|創業)(年月日|年月|日)?/,
  ceo: /^代表者|^代表取締役/,
};

/** 概要セクションから主要項目を取り出す。型に合わない値は採らない */
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
 *  行が折り返される様式では pairFields が弱いので、layoutモードのテキストに対して併用する。 */
export function scanLabels(sec) {
  const out = {};
  for (const line of String(sec).split(/\n/)) {
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

/** 3通りの読み方から、いちばん素直に取れているものを項目ごとに選ぶ */
export function summaryMerged(rawSec, layoutSec) {
  const cands = [summaryOf(rawSec), scanLabels(layoutSec || ''), summaryOf(layoutSec || '')];
  const out = {};
  for (const k of Object.keys(LABEL_RE)) {
    const vs = cands.map((c) => c[k]).filter(Boolean);
    // 折り返しでカッコ書きだけを拾うことがあるので、そうでないものを優先。
    // 1行に4項目まとめて入った長い値より、短く取れている方が正しいことが多い。
    const clean = vs.filter((v) => !/^[(（]/.test(v));
    out[k] = (clean.length ? clean : vs).sort((x, y) => x.length - y.length)[0] || '';
  }
  if (out.name.length > 30) out.name = out.name.split(/[(（]/)[0].trim() || out.name;
  out.founded = out.founded.replace(/^(年月日|年月|日)/, '');
  return out;
}
