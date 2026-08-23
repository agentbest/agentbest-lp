// tools/ma-news/extract.mjs … 1件の適時開示 → 記事に必要な事実だけの構造体
//
// 事実（誰が・誰を・いくらで・いつ）以外は持ち出さない。開示文の文章をそのまま記事にすると
// 他社の書いたものを写すことになるので、本文は数値と固有名詞から組み立てる（render.mjs）。
import { pdfText, realUrl } from './pdf.mjs';
import { normalize, sections, moneyIn, pickDates, yen, flat } from './parse.mjs';
import { summaryMerged, looksCompany } from './fields.mjs';

const pickSec = (secs, re, ngRe) =>
  secs.find((s) => re.test(s.head) && !(ngRe && ngRe.test(s.head)))?.text ?? '';

/** 開示元の正式社名。TDnetの一覧名は「Ｇ－ブランディング」のような略号なのでPDFの頭から拾う */
export function issuerOf(layoutText, fallback) {
  for (const line of String(layoutText).split(/\n/).slice(0, 40)) {
    const f = flat(line).trim();
    const m = /^(会社名|商号|会社の名称|上場会社名)[:：]?(.+)$/.exec(f);
    if (!m) continue;
    const v = m[2].split(/[(（]/)[0].trim();
    if (v.length >= 3 && v.length <= 40) return v;
  }
  // 拾えなければ一覧の名前を整える（Ｇ－／Ｐ－ は市場区分の接頭辞）
  return String(fallback || '')
    .replace(/[Ａ-Ｚａ-ｚ０-９]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0))
    .replace(/^[GPTM]-/, '')
    .trim();
}

const TARGET_RE = /(異動|取得|譲渡|譲受|対象|買収|分割|合併).{0,12}(会社|子会社|事業).{0,10}概要|^対象会社の概要/;
const TARGET_NG = /(相手先|譲渡先|取得者|割当先|買付者|公開買付者|当社の概要)/;
const COUNTER_RE = /(相手先|譲渡先|取得者|譲受人|割当先|買付者|公開買付者).{0,8}概要|^(相手先|譲渡先)/;

/** タイトルから対象会社名を拾う保険 */
export function targetFromTitle(title) {
  const t = String(title).replace(/\s+/g, ' ');
  const m = /([^\s、。（(）)「」]{2,24}?(?:株式会社|有限会社|合同会社|Inc\.|LLC|Ltd\.|Corporation|Corp\.|GmbH))/.exec(t);
  if (m) return m[1].replace(/^(の|による|及び|並びに)/, '').trim();
  const p = /[（(]([^）)]{2,30})[）)]/.exec(t);
  return p && looksCompany(p[1]) ? p[1].trim() : '';
}

const UNIT = { 円: 1, 千円: 1e3, 万円: 1e4, 百万円: 1e6, 億円: 1e8 };

export async function extract(item) {
  const raw = normalize(await pdfText(item.id, item.document_url, 'raw'));
  const lay = normalize(await pdfText(item.id, item.document_url, 'layout'));
  const rsec = sections(raw);
  const lsec = sections(lay);

  const targetRaw = pickSec(rsec, TARGET_RE, TARGET_NG) || pickSec(rsec, /概要/, TARGET_NG);
  const targetLay = pickSec(lsec, TARGET_RE, TARGET_NG) || pickSec(lsec, /概要/, TARGET_NG);
  const counterRaw = pickSec(rsec, COUNTER_RE);
  const counterLay = pickSec(lsec, COUNTER_RE);
  const shareLay = pickSec(lsec, /(取得|譲渡)株式数|所有株式の状況|株式数.{0,6}価[額格]|異動前後/);
  const schedLay = pickSec(lsec, /日程|スケジュール/);
  const reasonLay = pickSec(lsec, /(理由|目的|背景)/);

  const t = summaryMerged(targetRaw, targetLay);
  const c = summaryMerged(counterRaw, counterLay);

  const fin = {
    sales: moneyIn(targetLay, /^(売上高|営業収益|売上収益)/) || moneyIn(targetRaw, /^(売上高|営業収益|売上収益)/),
    op: moneyIn(targetLay, /^営業利益/) || moneyIn(targetRaw, /^営業利益/),
    netAssets: moneyIn(targetLay, /^純資産(額|合計)?/) || moneyIn(targetRaw, /^純資産(額|合計)?/),
    totalAssets: moneyIn(targetLay, /^総資産(額|合計)?/) || moneyIn(targetRaw, /^総資産(額|合計)?/),
    netIncome: moneyIn(targetLay, /^当期純利益/) || moneyIn(targetRaw, /^当期純利益/),
  };

  const flatShare = flat(shareLay);
  const undisclosed = /非開示|非公表|開示(を)?(差し)?控え|公表を控え/.test(flatShare);
  // 価額はラベル付きでしか採らない。近くの無関係な数字を価額として出すと誤報になる
  const priceM = /(取得|譲渡)価[額格][^0-9]{0,24}?([0-9][0-9,]*)\s*(百万円|千円|億円|万円|円)/.exec(flatShare);
  const price = !undisclosed && priceM ? Number(priceM[2].replace(/,/g, '')) * UNIT[priceM[3]] : null;

  const ratioAfter =
    /異動後[^%]{0,40}?([0-9]{1,3}(?:\.[0-9])?)\s*%/.exec(flatShare)?.[1] ||
    /議決権(?:所有)?割合[^0-9%]{0,4}([0-9]{1,3}(?:\.[0-9])?)\s*%/.exec(flatShare)?.[1] || '';

  const dates = pickDates(schedLay);

  return {
    type: item.dealType || '',
    id: String(item.id),
    code: String(item.company_code || '').slice(0, 4),
    issuer: issuerOf(lay, item.company_name),
    listName: item.company_name,
    title: item.title,
    disclosedAt: String(item.pubdate).slice(0, 10),
    sourceUrl: realUrl(item.document_url),
    target: {
      name: t.name || targetFromTitle(item.title),
      location: t.location,
      business: t.business,
      founded: t.founded,
      capital: t.capital,
    },
    counterparty: c.name && looksCompany(c.name) ? c.name : '',
    // 業種タグを当てるための材料。事業内容だけだと当たらないことが多い
    bizHint: reasonLay.slice(0, 400),
    fin,
    price,
    priceUndisclosed: undisclosed,
    ratioAfter,
    closingDate: dates.length ? dates[dates.length - 1] : '',
    yen,
  };
}

/** 記事として出してよいか。中途半端な情報で出すくらいなら落とす。
 *  ここを緩めると「対象会社名が住所になっている」ような記事が世に出る。 */
const WRITABLE = new Set(['buy', 'sell', 'merger', 'split', 'transfer', 'exchange', 'alliance']);

export function gate(r) {
  const n = r.target.name || '';
  // 公開買付は様式が別（買付価格・応募期間が主）で、この型では正しく書けない
  if (!WRITABLE.has(r.type)) return `この取引形態は対象外（${r.type || '不明'}）`;
  if (/概要|お知らせ|に関する|による|並びに|を行う|に対する|証券コード|の異動|当社/.test(n)) {
    return '対象会社名が文章になっている';
  }
  if (!n || n.length < 3 || n.length > 40) return '対象会社名が取れない';
  if (/[、。]|による|及び|並びに|に関する|お知らせ|予定|株式会社$/.test(n) && !/^(株式会社|有限会社|合同会社)/.test(n)) {
    if (/による|及び|並びに|に関する|お知らせ/.test(n)) return '対象会社名が文章になっている';
  }
  if (!r.issuer || r.issuer.length < 2) return '開示元の社名が取れない';
  const facts = [r.target.business, r.fin.sales, r.closingDate, r.price || r.priceUndisclosed, r.ratioAfter]
    .filter(Boolean).length;
  if (facts < 2) return '事実が足りない（本文が薄くなる）';
  return '';
}
