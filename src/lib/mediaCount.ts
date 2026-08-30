import { getCollection } from 'astro:content';

/* 記事本数の表記をここに一本化する。
   トップと会社情報ページは「1,400記事以上」「2,400本以上」と手打ちしていて、
   量産で本数が増えても誰も直さないまま古い数字が出ていた（実数2,500本のとき
   トップの表記は1,400本）。表記は必ずこの関数を通すこと。

   端数の切り捨ては100本単位。「2,506本」と1本単位で出すと、記事を1本足すたびに
   全ページのHTMLが変わってしまうため。 */
export async function getArticleCount() {
  const posts = await getCollection('media');
  const total = posts.length;
  const rounded = Math.floor(total / 100) * 100;
  return {
    /** 実数 */
    total,
    /** 100本単位に切り捨てた数 */
    rounded,
    /** 「2,500」。"◯◯記事以上" のように使う */
    label: rounded.toLocaleString('ja-JP'),
  };
}
