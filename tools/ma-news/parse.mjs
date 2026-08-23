// tools/ma-news/parse.mjs … PDFテキストの共通処理（正規化・セクション分割・金額・日付）
//
// 東証の開示は様式が決まっている（１．理由 ２．異動する子会社の概要 ３．相手先 ４．取得株式数
// ５．日程 …）ので、まず番号見出しでセクションに割り、その中だけを見る。

const Z2H = (s) =>
  String(s)
    .replace(/[０-９]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0))
    .replace(/[Ａ-Ｚａ-ｚ]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0))
    .replace(/[．，％（）：]/g, (c) => ({ '．': '.', '，': ',', '％': '%', '（': '(', '）': ')', '：': ':' }[c]));

/** ラベル比較用。「名 称」「事 業 内 容」の字間だけ潰す。
 *  数字どうしの空白まで潰すと「180,592 395,634」が1個の数値に化けるので、
 *  片側が日本語の空白に限って落とす。 */
export const flat = (s) =>
  String(s)
    .replace(/[　]/g, ' ')
    .replace(/\s+(?=[^\x00-\x7F])/g, '')
    .replace(/(?<=[^\x00-\x7F])\s+/g, '');

export function normalize(text) {
  return Z2H(text)
    .replace(/\r/g, '')
    .replace(/[ \t]+/g, ' ')
    .split('\n')
    .map((l) => l.trim())
    .join('\n');
}

/** 「１．株式取得の理由」などの番号見出しでセクションに割る */
export function sections(text) {
  const lines = text.split('\n');
  const out = [];
  let cur = { head: '', body: [] };
  for (const line of lines) {
    const m = /^([0-9]{1,2})\s*[.]\s*(\S.*)$/.exec(line);
    // 見出しの後ろに「(1)名称 (2)所在地 …」が続くことがあるので、長さの判定は最初の(1)までで見る。
    // 「1.」で始まる本文の箇条書きを見出しと誤認しないための歯止め。
    const headName = m ? flat(m[2].split(/[(（]/)[0]) : '';
    if (m && headName.length >= 2 && headName.length <= 40 && !/[。]/.test(headName)) {
      out.push(cur);
      cur = { head: flat(m[2]), body: [line.slice(line.indexOf(m[2]))] };
    } else {
      cur.body.push(line);
    }
  }
  out.push(cur);
  return out.map((s) => ({ head: s.head, text: s.body.join('\n').trim() }));
}

/* ---------- 金額 ---------- */

const UNIT = { 円: 1, 千円: 1e3, 万円: 1e4, 百万円: 1e6, 億円: 1e8 };
const NUM_UNIT = /(△|▲|-|−)?\s*([0-9][0-9,]*)(?:\.[0-9]+)?\s*(千円|百万円|億円|万円|円)?/g;

/** 846,874（千円） → 「8億4,687万円」。桁が読めないと記事にならないので日本語表記に直す */
export function yen(n) {
  if (!Number.isFinite(n) || n === 0) return '';
  const neg = n < 0;
  const a = Math.abs(n);
  let s;
  if (a >= 1e8) {
    const oku = Math.floor(a / 1e8);
    const man = Math.round((a - oku * 1e8) / 1e4);
    s = man ? `${oku.toLocaleString()}億${man.toLocaleString()}万円` : `${oku.toLocaleString()}億円`;
  } else if (a >= 1e4) {
    s = `${Math.round(a / 1e4).toLocaleString()}万円`;
  } else {
    s = `${Math.round(a).toLocaleString()}円`;
  }
  return (neg ? '△' : '') + s;
}

/** 財務テーブルの行「売上高(千円) 180,592 395,634 846,874」から直近期の値を取る。
 *  単位が確定できないときは値を捨てる。千円の表を百万円と読むと桁が1000倍ずれ、
 *  記事としては致命的なので推測はしない。 */
export function moneyIn(sec, labelRe) {
  const flatSec = flat(sec);
  const secUnit = /単位\s*[:：]?\s*(千円|百万円|億円|円)/.exec(flatSec)?.[1] || null;
  for (const line of String(sec).split(/\n/)) {
    const f = flat(line);
    const m = labelRe.exec(f);
    if (!m || m.index !== 0) continue;
    if (/1株当たり|1株あたり|1株につき/.test(f)) continue;
    const lineUnit = /[(（](千円|百万円|億円|円)[)）]/.exec(f)?.[1] || null;
    const rest = f.slice(m.index + m[0].length);
    // 「411,894 千円 408,667 千円 431,130 千円」のように値ごとに単位が付く様式と、
    // 「純資産額(千円) 304,442 375,573 559,278」のようにラベル側に付く様式がある。
    const hits = [...rest.matchAll(NUM_UNIT)]
      .map((x) => ({
        v: (x[1] && x[1] !== '-' ? -1 : 1) * Number(x[2].replace(/,/g, '')),
        u: x[3] || null,
      }))
      .filter((h) => Number.isFinite(h.v));
    if (!hits.length) continue;
    const last = hits[hits.length - 1];        // 表は「古い期 → 直近期」。最後が直近
    const unit = last.u || lineUnit || secUnit;
    if (!unit) continue;
    return { raw: last.v * UNIT[unit], unit, periods: hits.length };
  }
  return null;
}

export const unitOf = (u) => UNIT[u];

/* ---------- 日付 ---------- */

const DATE_RE = /(20[0-9]{2})\s*年\s*([0-9]{1,2})\s*月\s*([0-9]{1,2})\s*日/g;
export const pickDates = (s) =>
  [...String(s).matchAll(DATE_RE)].map(
    (m) => `${m[1]}-${String(m[2]).padStart(2, '0')}-${String(m[3]).padStart(2, '0')}`);
export const jpDate = (iso) =>
  iso ? `${iso.slice(0, 4)}年${Number(iso.slice(5, 7))}月${Number(iso.slice(8, 10))}日` : '';
