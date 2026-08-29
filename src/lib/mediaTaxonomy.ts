// src/lib/mediaTaxonomy.ts
//
// メディア（/media）のカテゴリ定義。
//
// ハブの表示名とグループ分けを「記事のfrontmatterから推測する」のをやめて、ここに一本化しています。
// 以前は jobType / industry の文字列でグループを作っていたため、
//   ・同じハブが表記ゆれで複数のカードに割れる
//   ・職種ハブに業界記事が相乗りしていると、職種と業界の両方に同じカードが出る
// という崩れが出ていました。記事側は hub だけを持ち、見せ方はこのファイルが決めます。
//
// ハブを増やしたら HUB_LABEL と、対応するグループの hubs に必ず足してください。
// 足し忘れは `npm run build` 時に警告が出ます（getMediaGroups の未分類チェック）。

/** ハブslug → 一覧・パンくずでの表示名 */
export const HUB_LABEL: Record<string, string> = {
  // ===== 職種 =====
  // エンジニア（開発）
  'backend-engineer': 'バックエンドエンジニア',
  'frontend-engineer': 'フロントエンドエンジニア',
  'fullstack-engineer': 'フルスタックエンジニア',
  'mobile-engineer': 'モバイルエンジニア',
  'game-engineer': 'ゲームエンジニア',
  'embedded-engineer': '組み込みエンジニア',
  'bridge-se': 'ブリッジSE',
  'qa-engineer': 'QAエンジニア',
  'tech-lead': 'テックリード',
  'db-engineer': 'データベースエンジニア',
  'forward-deployed-engineer': 'フォワードデプロイドエンジニア（FDE）',
  // インフラ・SRE・セキュリティ
  'infra-engineer': 'インフラエンジニア',
  'cloud-engineer': 'クラウドエンジニア',
  'network-engineer': 'ネットワークエンジニア',
  sre: 'SRE',
  'devops-engineer': 'DevOpsエンジニア',
  'platform-engineer': 'プラットフォームエンジニア',
  'security-engineer': 'セキュリティエンジニア',
  'corporate-it': '社内SE',
  // データ・AI
  'ai-engineer': 'AIエンジニア',
  'ml-engineer': '機械学習エンジニア',
  'mlops-engineer': 'MLOpsエンジニア',
  'data-engineer': 'データエンジニア',
  'data-analyst': 'データアナリスト',
  'data-scientist': 'データサイエンティスト',
  // アーキテクト・技術マネジメント
  'it-architect': 'ITアーキテクト',
  'solution-architect': 'ソリューションアーキテクト',
  'cto-vpoe': 'CTO・VPoE候補',
  'engineering-manager': 'エンジニアリングマネージャー',
  'dev-director': '開発ディレクター',
  // プロダクト・プロジェクト
  'product-manager': 'プロダクトマネージャー（PdM）',
  'project-manager': 'プロジェクトマネージャー（PM・PjM）',
  pmo: 'PMO',
  'scrum-master': 'スクラムマスター',
  'product-designer': 'プロダクトデザイナー',
  'uiux-designer': 'UI/UXデザイナー',
  // コンサルタント
  'strategy-consultant': '戦略コンサルタント',
  'big4-consultant': '総合コンサルタント（Big4等）',
  'business-consultant': '業務・業務改革コンサルタント',
  'it-consultant': 'ITコンサルタント',
  'dx-consultant': 'DXコンサルタント・DX推進',
  'data-consultant': 'データ・アナリティクスコンサルタント',
  'hr-consultant': '人事・組織コンサルタント',
  'erp-consultant': 'ERPコンサルタント（SAP以外）',
  'sap-consultant': 'SAPコンサルタント',
  'salesforce-consultant': 'Salesforceコンサルタント',
  'scm-consultant': 'SCM・調達コンサルタント',
  'security-consultant': 'セキュリティコンサルタント',
  'risk-consultant': 'リスク・ガバナンスコンサルタント',
  'pmo-consultant': 'PMOコンサルタント',
  'sustainability-consultant': 'サステナビリティコンサルタント',
  thinktank: 'シンクタンク研究員',
  'freelance-consultant': 'フリーコンサルタント',
  'post-consultant': 'ポストコンサル（事業会社転身）',
  // M&A・投資・ファイナンス
  'ma-advisor': 'M&Aアドバイザー・仲介営業',
  'ib-analyst': '投資銀行アナリスト',
  'pe-investor': 'PEファンド投資担当',
  'venture-capitalist': 'ベンチャーキャピタリスト',
  'fas-consultant': 'FAS・会計財務コンサルタント',
  'turnaround-consultant': '事業再生コンサルタント',
  finance: '財務・経理',
  // セールス・カスタマーサクセス
  'saas-sales': 'SaaS営業（フィールドセールス）',
  'inside-sales': 'インサイドセールス',
  'enterprise-sales': 'エンタープライズセールス',
  'partner-sales': 'パートナーセールス／アライアンス',
  presales: 'セールスエンジニア／プリセールス',
  'customer-success': 'カスタマーサクセス',
  // マーケティング・広報
  'web-marketer': 'Webマーケター',
  'digital-marketer': 'デジタルマーケター',
  'marketing-manager': 'マーケティングマネージャー',
  pr: '広報／PR',
  // 経営・事業企画
  'corporate-planning': '経営企画',
  'business-planning': '事業企画',
  bizdev: '事業開発（BizDev）',
  cxo: 'CxO候補・経営幹部',
  'revenue-officer': 'CRO（最高収益責任者）',
  // 人事・法務・管理
  hrbp: '人事（HRBP）',
  recruiter: '採用担当（リクルーター）',
  legal: '法務',

  // ===== 業界 =====
  // コンサルティング・シンクタンク
  // 企業ハブの consul と同名にならないよう「業界」を付ける（一覧で見分けがつかなくなるため）
  'consulting-industry': 'コンサルティング業界',
  'big4-industry': '総合コンサルティングファーム（Big4）',
  'it-consulting-industry': 'ITコンサルティングファーム',
  'dx-consulting-industry': 'DXコンサルティング',
  'hr-consulting-industry': '人事・組織コンサルティング',
  'smb-consulting-industry': '中小企業向けコンサルティング',
  'boutique-consulting-industry': '業界特化型コンサルティング',
  'thinktank-industry': 'シンクタンク',
  // M&A・投資
  'ma-industry': 'M&A仲介',
  'fas-industry': 'FAS（財務アドバイザリー）',
  'ibd-industry': '投資銀行（IBD）',
  'pe-industry': 'PEファンド',
  'vc-industry': 'ベンチャーキャピタル',
  'turnaround-industry': '事業再生',
  'succession-industry': '事業承継支援',
  // SaaS・スタートアップ
  'saas-industry': 'SaaS・SaaSスタートアップ',
  'ai-industry': '生成AI・AI',
  'fintech-industry': 'フィンテック・金融IT',
  'hrtech-industry': 'HRテック',
  'healthtech-industry': 'ヘルステック',
  'edtech-industry': 'エドテック',
  'legaltech-industry': 'リーガルテック',
  'proptech-industry': '建設・不動産DX',
  'logitech-industry': '物流DX・物流テック',
  'adtech-industry': 'アドテック・マーケティングテック',
  'govtech-industry': 'GovTech',
  'ec-industry': 'Eコマース',
  'web3-industry': 'Web3・ブロックチェーン',
  'mobility-industry': 'モビリティ・自動運転',
  'iot-industry': 'IoT・ハードウェアテック',
  'game-industry': 'ゲーム・エンタメテック',
  'security-industry': 'サイバーセキュリティ',
  'cloud-industry': 'クラウドインフラ',
  'megaventure-industry': 'メガベンチャー',
  // 事業会社IT・SIer
  'sier-industry': 'SIer（システムインテグレーター）',
  'manufacturing-it-industry': 'メーカーIT・製造業DX',
  'telecom-industry': '通信キャリア',
  'product-dev-industry': '事業会社のプロダクト開発',

  // ===== 企業（領域ごとのハブ。1ハブに多数の企業がぶら下がる） =====
  consul: 'コンサルティングファーム',
  ma: 'M&A・投資ファンド',
  pm: '事業会社・SIer',
  startup: 'スタートアップ・IT',
};

/**
 * ハブslug → 対応する特設サイト（LP）。
 * 該当するハブのページに「特設サイトを見る」の導線が1本出ます。無いハブは何も出ません。
 * ハブと同じテーマのLPを公開したら、ここに1行足してください（LP側からハブへのリンクも忘れずに）。
 */
export const HUB_SITE: Record<string, { label: string; href: string }> = {
  'forward-deployed-engineer': {
    label: 'FDE（フォワードデプロイドエンジニア）への転職',
    href: 'https://fde.agent-best.net/',
  },
  // PMはPjM・PdMの両方から入れる。対外表記は「PM特化」に統一（PMOハブは対象外なので繋がない）
  'project-manager': { label: 'PM特化の転職', href: 'https://pm.agent-best.net/' },
  'product-manager': { label: 'PM特化の転職', href: 'https://pm.agent-best.net/' },
  'it-consultant': { label: 'エンジニア→コンサル転職', href: 'https://eng.agent-best.net/' },
  'ma-advisor': { label: '未経験からM&A', href: 'https://ma.agent-best.net/' },
  'ma-industry': { label: '未経験からM&A', href: 'https://ma.agent-best.net/' },
  'consulting-industry': { label: '未経験からコンサル', href: 'https://consul.agent-best.net/' },
  'embedded-engineer': { label: 'IoT・組込みエンジニアの転職', href: 'https://embedded.agent-best.net/' },
  'iot-industry': { label: 'IoT・組込みエンジニアの転職', href: 'https://embedded.agent-best.net/' },
  'post-consultant': {
    label: 'ファーム出身者の次のキャリア（50代）',
    href: 'https://consultingcareerchange50.agent-best.net/',
  },
  // 未経験→エンジニア（engineer.agent-best.net）と学生キャリア支援（student.agent-best.net）は
  // 対応する職種・業界ハブが無いため意図的に繋いでいない。近いハブに寄せると読み手がずれる。
};

export type Group = { key: string; name: string; note?: string; hubs: string[] };

/** 職種の大分類 */
export const JOB_GROUPS: Group[] = [
  {
    key: 'engineer',
    name: 'エンジニア（開発）',
    hubs: ['backend-engineer', 'frontend-engineer', 'fullstack-engineer', 'mobile-engineer',
      'game-engineer', 'embedded-engineer', 'bridge-se', 'qa-engineer', 'tech-lead', 'db-engineer',
      'forward-deployed-engineer'],
  },
  {
    key: 'infra',
    name: 'インフラ・SRE・セキュリティ',
    hubs: ['infra-engineer', 'cloud-engineer', 'network-engineer', 'sre', 'devops-engineer',
      'platform-engineer', 'security-engineer', 'corporate-it'],
  },
  {
    key: 'data',
    name: 'データ・AI',
    hubs: ['ai-engineer', 'ml-engineer', 'mlops-engineer', 'data-engineer', 'data-analyst', 'data-scientist'],
  },
  {
    key: 'tech-management',
    name: 'アーキテクト・技術マネジメント',
    hubs: ['it-architect', 'solution-architect', 'cto-vpoe', 'engineering-manager', 'dev-director'],
  },
  {
    key: 'product',
    name: 'プロダクト・プロジェクト・デザイン',
    hubs: ['product-manager', 'project-manager', 'pmo', 'scrum-master', 'product-designer', 'uiux-designer'],
  },
  {
    key: 'consultant',
    name: 'コンサルタント',
    hubs: ['strategy-consultant', 'big4-consultant', 'business-consultant', 'it-consultant',
      'dx-consultant', 'data-consultant', 'hr-consultant', 'erp-consultant', 'sap-consultant',
      'salesforce-consultant', 'scm-consultant', 'security-consultant', 'risk-consultant',
      'pmo-consultant', 'sustainability-consultant', 'thinktank', 'freelance-consultant', 'post-consultant'],
  },
  {
    key: 'finance',
    name: 'M&A・投資・ファイナンス',
    hubs: ['ma-advisor', 'ib-analyst', 'pe-investor', 'venture-capitalist', 'fas-consultant',
      'turnaround-consultant', 'finance'],
  },
  {
    key: 'sales',
    name: 'セールス・カスタマーサクセス',
    hubs: ['saas-sales', 'inside-sales', 'enterprise-sales', 'partner-sales', 'presales', 'customer-success'],
  },
  {
    key: 'marketing',
    name: 'マーケティング・広報',
    hubs: ['web-marketer', 'digital-marketer', 'marketing-manager', 'pr'],
  },
  {
    key: 'planning',
    name: '経営・事業企画',
    hubs: ['corporate-planning', 'business-planning', 'bizdev', 'cxo', 'revenue-officer'],
  },
  {
    key: 'corporate',
    name: '人事・法務・管理',
    hubs: ['hrbp', 'recruiter', 'legal'],
  },
];

/** 業界の大分類 */
export const INDUSTRY_GROUPS: Group[] = [
  {
    key: 'consulting',
    name: 'コンサルティング・シンクタンク',
    hubs: ['consulting-industry', 'big4-industry', 'it-consulting-industry', 'dx-consulting-industry',
      'hr-consulting-industry', 'smb-consulting-industry', 'boutique-consulting-industry', 'thinktank-industry'],
  },
  {
    key: 'ma',
    name: 'M&A・投資',
    hubs: ['ma-industry', 'fas-industry', 'ibd-industry', 'pe-industry', 'vc-industry',
      'turnaround-industry', 'succession-industry'],
  },
  {
    key: 'saas',
    name: 'SaaS・スタートアップ',
    hubs: ['saas-industry', 'ai-industry', 'fintech-industry', 'hrtech-industry', 'healthtech-industry',
      'edtech-industry', 'legaltech-industry', 'proptech-industry', 'logitech-industry', 'adtech-industry',
      'govtech-industry', 'ec-industry', 'web3-industry', 'mobility-industry', 'iot-industry',
      'game-industry', 'security-industry', 'cloud-industry', 'megaventure-industry'],
  },
  {
    key: 'enterprise',
    name: '事業会社IT・SIer',
    hubs: ['sier-industry', 'manufacturing-it-industry', 'telecom-industry', 'product-dev-industry'],
  },
];

/** 企業別の領域ハブ。1つのハブに多数の企業記事がぶら下がる */
export const COMPANY_HUBS: { hub: string; name: string; note: string }[] = [
  { hub: 'consul', name: 'コンサルティングファーム', note: '戦略・総合・IT・シンクタンク' },
  { hub: 'ma', name: 'M&A・投資ファンド', note: 'M&A仲介・FA・PE・VC・証券' },
  { hub: 'pm', name: '事業会社・SIer', note: 'メーカー・金融・通信・SIer' },
  { hub: 'startup', name: 'スタートアップ・IT', note: 'SaaS・メガベンチャー・IT' },
];

export const CATEGORY_LABEL = { 職種: '職種別', 業界: '業界別', 企業: '企業別' } as const;

/** 企業インデックスの見出し。並び順もこの配列のとおり */
export const KANA_ROWS = ['英数字', 'あ行', 'か行', 'さ行', 'た行', 'な行', 'は行', 'ま行', 'や行', 'ら行', 'わ行'] as const;

// 企業記事のslugは company-{社名のローマ字}-reputation で統一されているので、
// ローマ字の頭文字から五十音の行を割り出せる（社名の漢字表記からは読みが取れないため）
const ROMAJI_ROW: Record<string, string> = {
  a: 'あ行', i: 'あ行', u: 'あ行', e: 'あ行', o: 'あ行',
  k: 'か行', g: 'か行',
  s: 'さ行', z: 'さ行', j: 'さ行',
  t: 'た行', d: 'た行', c: 'た行',
  n: 'な行',
  h: 'は行', f: 'は行', b: 'は行', p: 'は行',
  m: 'ま行', y: 'や行', r: 'ら行', l: 'ら行', w: 'わ行',
};

/** 企業名とslugから、50音インデックスの行を返す */
export function companyRow(companyName: string, slug: string): string {
  // 社名が英数字で始まるものは読みではなく綴りで探されるので「英数字」にまとめる
  if (/^[0-9A-Za-z]/.test(companyName)) return '英数字';
  const m = /^company-([a-z])/.exec(slug);
  return (m && ROMAJI_ROW[m[1]]) || 'わ行';
}

/** 企業記事の並び順キー。slugのローマ字＝読み順になる */
export function companySortKey(slug: string): string {
  return slug.replace(/^company-/, '').replace(/-reputation$/, '');
}

/** ハブの表示名。定義漏れは slug をそのまま返す */
export function hubLabel(hub: string, fallback?: string): string {
  return HUB_LABEL[hub] ?? fallback ?? hub;
}

/** hub → 所属グループ名（パンくず用） */
const HUB_TO_GROUP = new Map<string, string>();
for (const g of [...JOB_GROUPS, ...INDUSTRY_GROUPS]) {
  for (const h of g.hubs) HUB_TO_GROUP.set(h, g.name);
}
export function groupOf(hub: string): string | undefined {
  return HUB_TO_GROUP.get(hub);
}

/**
 * 記事の集合をグループ→ハブの2階層にまとめる。
 * どのグループにも属さないハブがあれば分類漏れなのでビルド時に警告する。
 */
export function getMediaGroups(posts: { data: { hub?: string; category: string } }[]) {
  const count = new Map<string, number>();
  for (const p of posts) {
    const h = p.data.hub;
    if (h) count.set(h, (count.get(h) ?? 0) + 1);
  }
  const build = (groups: Group[]) =>
    groups
      .map((g) => ({
        ...g,
        items: g.hubs
          .filter((h) => count.has(h))
          .map((h) => ({ hub: h, name: hubLabel(h), count: count.get(h)! }))
          .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'ja')),
      }))
      .filter((g) => g.items.length > 0);

  const known = new Set([...JOB_GROUPS, ...INDUSTRY_GROUPS].flatMap((g) => g.hubs));
  for (const h of COMPANY_HUBS) known.add(h.hub);
  const orphans = [...count.keys()].filter((h) => !known.has(h));
  if (orphans.length) {
    console.warn(`[mediaTaxonomy] グループ未分類のハブがあります: ${orphans.join(', ')}\n` +
      '  → src/lib/mediaTaxonomy.ts の JOB_GROUPS / INDUSTRY_GROUPS に追加してください');
  }

  return {
    jobGroups: build(JOB_GROUPS),
    industryGroups: build(INDUSTRY_GROUPS),
    companyHubs: COMPANY_HUBS.filter((c) => count.has(c.hub))
      .map((c) => ({ ...c, count: count.get(c.hub)! })),
    orphans,
  };
}
