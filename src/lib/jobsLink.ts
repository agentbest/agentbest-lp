/* 求人サイト（jobs.agent-best.net / shinsotsu.agent-best.net）への導線をここに集約する。
   コーポレートから求人サイトへの流入は、これまでヘッダーのドロップダウン2箇所しか
   無く、GA4でもどのページから飛んだのか分からなかった。リンクは必ずこの関数で組み、
   utm を付けて出す。

   ⚠ q（キーワード）は jobs.agent-best.net 側が対応したら効く。未対応のあいだは
   無視されて全件一覧が出るだけなので、付けておいても害はない。 */
export const JOBS_URL = 'https://jobs.agent-best.net/';
export const SHINSOTSU_URL = 'https://shinsotsu.agent-best.net/';

type JobsLinkOpts = {
  /** どのページから飛んだか。utm_medium に入れる */
  medium: string;
  /** 記事slugなど。utm_campaign に入れる */
  campaign?: string;
  /** 求人検索にあらかじめ入れるキーワード */
  q?: string;
};

export function jobsUrl({ medium, campaign, q }: JobsLinkOpts): string {
  const p = new URLSearchParams();
  if (q) p.set('q', q);
  p.set('utm_source', 'corporate');
  p.set('utm_medium', medium);
  if (campaign) p.set('utm_campaign', campaign);
  return `${JOBS_URL}?${p.toString()}`;
}
