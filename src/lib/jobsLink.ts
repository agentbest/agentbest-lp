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

/* メディアのハブ → 求人サイトの職種一覧（jobs.agent-best.net/jobs/<slug>/）。
   記事を「職業の解説」で終わらせず、同じ職種の求人に必ずつなぐための対応表。
   求人サイト側の職種の大分類は static-pages.js の GROUP_SLUG が原本。
   ここに無いハブ（事業会社・SIerの企業記事など）は全件一覧に飛ばす。 */
const GROUP_BY_HUB: Record<string, [string, string]> = {};
const put = (slug: string, label: string, hubs: string[]) => hubs.forEach((h) => (GROUP_BY_HUB[h] = [slug, label]));
put('engineer', 'エンジニア', [
  'backend-engineer', 'frontend-engineer', 'fullstack-engineer', 'mobile-engineer', 'game-engineer',
  'embedded-engineer', 'bridge-se', 'qa-engineer', 'tech-lead', 'db-engineer', 'forward-deployed-engineer',
  'infra-engineer', 'cloud-engineer', 'network-engineer', 'sre', 'devops-engineer', 'platform-engineer',
  'security-engineer', 'corporate-it', 'ai-engineer', 'ml-engineer', 'mlops-engineer', 'data-engineer',
  'data-analyst', 'data-scientist', 'it-architect', 'solution-architect', 'cto-vpoe', 'engineering-manager',
  'dev-director', 'sier-industry', 'manufacturing-it-industry', 'telecom-industry', 'product-dev-industry',
]);
put('project-management', 'プロジェクト管理', ['project-manager', 'pmo', 'scrum-master']);
put('business-planning', '事業企画', ['product-manager', 'business-planning', 'bizdev']);
put('design', 'デザイン', ['product-designer', 'uiux-designer']);
put('it-consultant', 'ITコンサルタント', [
  'it-consultant', 'dx-consultant', 'data-consultant', 'erp-consultant', 'sap-consultant',
  'salesforce-consultant', 'security-consultant', 'pmo-consultant', 'it-consulting-industry', 'dx-consulting-industry',
]);
put('consultant', 'コンサルタント', [
  'strategy-consultant', 'big4-consultant', 'business-consultant', 'hr-consultant', 'scm-consultant',
  'risk-consultant', 'sustainability-consultant', 'thinktank', 'freelance-consultant', 'post-consultant',
  'fas-consultant', 'turnaround-consultant', 'ma-advisor', 'consulting-industry', 'big4-industry',
  'hr-consulting-industry', 'smb-consulting-industry', 'boutique-consulting-industry', 'thinktank-industry',
  'fas-industry', 'turnaround-industry', 'ma-industry', 'succession-industry', 'consul',
]);
put('finance', '金融', ['ib-analyst', 'pe-investor', 'venture-capitalist', 'finance', 'ibd-industry', 'pe-industry', 'vc-industry', 'ma']);
put('sales', '営業', ['saas-sales', 'inside-sales', 'enterprise-sales', 'partner-sales', 'presales', 'customer-success']);
put('marketing', 'マーケティング', ['web-marketer', 'digital-marketer', 'marketing-manager', 'pr']);
put('corporate-planning', '経営企画', ['corporate-planning']);
put('executive', '経営', ['cxo', 'revenue-officer']);
put('hr', '人事', ['hrbp', 'recruiter']);
put('corporate', '管理', ['legal']);
put('internet-service', 'インターネットサービス', [
  'saas-industry', 'ai-industry', 'fintech-industry', 'hrtech-industry', 'healthtech-industry', 'edtech-industry',
  'legaltech-industry', 'proptech-industry', 'logitech-industry', 'adtech-industry', 'govtech-industry',
  'ec-industry', 'web3-industry', 'mobility-industry', 'iot-industry', 'game-industry', 'security-industry',
  'cloud-industry', 'megaventure-industry', 'startup',
]);

/** ハブに対応する求人サイトの職種一覧。無ければ null */
export function jobsGroupOf(hub: string): { slug: string; label: string } | null {
  const g = GROUP_BY_HUB[hub];
  return g ? { slug: g[0], label: g[1] } : null;
}

/** 求人サイトの職種一覧ページへのURL（utm付き） */
export function jobsGroupUrl(slug: string, { medium, campaign }: { medium: string; campaign?: string }): string {
  const p = new URLSearchParams();
  p.set('utm_source', 'corporate');
  p.set('utm_medium', medium);
  if (campaign) p.set('utm_campaign', campaign);
  return `${JOBS_URL}jobs/${slug}/?${p.toString()}`;
}
