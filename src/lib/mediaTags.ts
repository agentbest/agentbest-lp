// src/lib/mediaTags.ts
//
// メディア（/media）の「タグから探す」の定義。
//
// ハブ（職種・業界・企業領域＝src/lib/mediaTaxonomy.ts）は 1記事＝1ハブ の縦の分類です。
// タグはそれと直交する横の分類で、たとえば「面接対策」は職種記事にも企業記事にも付きます。
// 職種ハブと同名のタグ（"バックエンドエンジニア" など）はハブと完全に重複して
// 「職種から探す」と見分けがつかなくなるので、ここには入れていません。
//
// 記事のfrontmatterの tags[] は自由記述で2,000種類以上あり、9割近くが1〜2本しか付いていません。
// そのまま出すと一覧として使えないので、
//   ・canonical なタグをこのファイルで決める
//   ・表記ゆれ（"AI" / "生成AI" / "生成AI・AI"）は aliases でひとつに寄せる
//   ・theme もタグの供給源として同じ表に通す（"志望動機" と "志望動機の書き方" など）
// という形にしています。ここに載っていない自由記述タグはページを持ちません。
//
// タグを増やすときは TAG_GROUPS に足すだけです（aliases に実際のfrontmatterの表記を並べる）。
// 記事が MIN_TAG_POSTS 本に満たないタグは自動的に一覧から落ちるので、
// 空ページが生えることはありません。

/** これ未満の本数しかないタグはページも一覧も作らない（1本しかないタグの一覧は使い物にならないため） */
export const MIN_TAG_POSTS = 8;

export type TagDef = {
  /** URL用。/media/tag/{slug}/ */
  slug: string;
  label: string;
  /** frontmatter の tags[] / theme に出てくる表記。label 自身は自動で別名に含まれる */
  aliases?: string[];
  /** 一覧カードの補足 */
  note?: string;
};

export type TagGroup = { key: string; name: string; note: string; tags: TagDef[] };

export const TAG_GROUPS: TagGroup[] = [
  {
    key: 'step',
    name: '選考の進め方から探す',
    note: '書類・面接・志望動機など、選考のどの段階で困っているかで選べます。',
    tags: [
      { slug: 'interview', label: '面接対策', aliases: ['選考フロー・面接対策', '選考対策', 'ケース面接', '面接'], note: '想定質問と受け答えの型' },
      { slug: 'motivation', label: '志望動機', aliases: ['志望動機の書き方'], note: '書き方と落ちる型' },
      { slug: 'resume', label: '職務経歴書', aliases: ['転職書類', '書類選考', 'レジュメ'], note: '書類の通し方' },
      { slug: 'selection-flow', label: '選考フロー', aliases: ['選考プロセス', '選考ステップ'], note: '何次面接まであるか' },
      { slug: 'difficulty', label: '転職難易度', aliases: ['難易度', '有効求人倍率'], note: '受かる人の条件' },
      { slug: 'company-research', label: '企業研究', aliases: ['業界研究', '業界企業選び', 'IR'], note: '調べ方と見るべき数字' },
      { slug: 'agent', label: '転職エージェント活用', aliases: ['転職エージェント', 'ビズリーチ'], note: '使い方と選び方' },
      { slug: 'failure', label: '転職失敗', aliases: ['転職の失敗', 'ミスマッチ'], note: 'よくある失敗と回避策' },
      { slug: 'guide', label: '転職ガイド', aliases: ['転職', '転職の進め方'], note: '全体の進め方' },
    ],
  },
  {
    key: 'money',
    name: '年収・働き方から探す',
    note: '待遇と働き方の実態。年収は有価証券報告書や賃金構造基本統計調査などの一次情報をもとにしています。',
    tags: [
      { slug: 'salary', label: '年収相場', aliases: ['年収', '業界年収', '賃金構造基本統計調査', '時給換算', '平均年収'], note: '相場と決まり方' },
      { slug: 'salary-600', label: '年収600万円', aliases: ['年収600万'], note: '600万円に届く道筋' },
      { slug: 'salary-1000', label: '年収1000万円', aliases: ['年収1000万'], note: '1000万円に届く道筋' },
      { slug: 'worklife', label: '働き方', aliases: ['ワークライフバランス', '残業', 'リモートワーク', '働き方指針'], note: '残業・リモートの実態' },
      { slug: 'reward', label: '評価・報酬制度', aliases: ['報酬制度', '等級', '職位', 'ストックオプション', 'インセンティブ', '評価制度', '昇進'], note: '昇給と評価の仕組み' },
    ],
  },
  {
    key: 'stage',
    name: 'キャリアの段階から探す',
    note: '年代や経験の有無、次に何を身につけるかで選べます。',
    tags: [
      { slug: 'career-path', label: 'キャリアパス', aliases: ['業界キャリア', 'キャリア'], note: '5年後10年後の選択肢' },
      { slug: 'skills', label: '必要スキル', aliases: ['スキル', 'デジタルスキル標準', 'スキルセット'], note: '求められる力' },
      { slug: 'qualification', label: '資格', aliases: ['公認会計士', '中小企業診断士', '社会保険労務士', '税理士', '資格取得'], note: '効く資格・効かない資格' },
      { slug: 'inexperienced', label: '未経験転職', aliases: ['未経験', '未経験OK', '第二新卒'], note: '未経験から入る道' },
      { slug: 'twenties', label: '20代の転職', aliases: ['20代転職', '20代'], note: '20代で見るべき論点' },
      { slug: 'thirties', label: '30代の転職', aliases: ['30代転職', '30代'], note: '30代で見るべき論点' },
      { slug: 'english', label: '英語力', aliases: ['英語', 'TOEIC', 'グローバル案件'], note: 'どこまで必要か' },
      { slug: 'big-vs-startup', label: '大手かスタートアップか', aliases: ['大手vsスタートアップ', '大手企業', '大企業'], note: '規模で変わるもの' },
      { slug: 'market', label: '市場動向・将来性', aliases: ['市場動向', '将来性', '業界動向', 'マーケット'], note: '伸びる領域を見極める' },
      { slug: 'post-consul', label: 'ポストコンサル', aliases: ['ポストコンサルキャリア', 'コンサルからの転職'], note: 'ファームを出たあと' },
      { slug: 'consul-tenshoku', label: 'コンサル転職', aliases: ['コンサルへの転職', 'コンサルティング'], note: 'ファームに入る' },
    ],
  },
  {
    key: 'company',
    name: '企業の特徴から探す',
    note: '上場区分や資本の性格など、会社の成り立ちから探せます。企業記事に付くタグです。',
    tags: [
      { slug: 'tse-prime', label: '東証プライム上場', aliases: ['東証プライム', 'プライム市場'], note: '主力の上場企業' },
      { slug: 'tse-standard', label: '東証スタンダード上場', aliases: ['東証スタンダード', 'スタンダード市場'] },
      { slug: 'tse-growth', label: '東証グロース上場', aliases: ['東証グロース', 'グロース市場', '上場準備', 'IPO', 'TOKYO PRO Market'], note: '新興・成長企業' },
      { slug: 'unlisted', label: '非上場企業', aliases: ['非上場', '未上場', '上場廃止'], note: 'オーナー系・外資日本法人など' },
      { slug: 'foreign', label: '外資系', aliases: ['外資系金融', '外資系IT', '外資系証券', '外資系コンサル', '外資'], note: '日本法人の実態' },
      { slug: 'holdings', label: '持株会社', aliases: ['純粋持株会社', 'ホールディングス', 'グループ会社'], note: 'グループ構造の読み方' },
      { slug: 'independent', label: '独立系', aliases: ['独立系ファンド', '独立系アドバイザリー', '独立性', '独立系SIer'], note: '資本に縛られない会社' },
      { slug: 'mega-venture', label: 'メガベンチャー', aliases: ['メガベンチャー企業'], note: '成長しきったベンチャー' },
      { slug: 'startup', label: 'スタートアップ', aliases: ['AIスタートアップ', 'ベンチャー', 'スタートアップ企業'], note: '資金調達と成長段階' },
      { slug: 'yuho', label: '有価証券報告書', aliases: ['有報', 'IFRS', '決算', '受注残高', 'ARR'], note: '開示資料から読む' },
      { slug: 'global', label: 'グローバル展開', aliases: ['グローバル', '海外展開', 'ベトナム', 'オフショア'], note: '海外拠点と越境案件' },
    ],
  },
  {
    key: 'keyword',
    name: '領域・キーワードから探す',
    note: '職種や業界をまたいで、扱っているテーマから探せます。',
    tags: [
      { slug: 'saas', label: 'SaaS', aliases: ['SaaSベンダー', 'サブスクリプション', 'リカーリング', 'ノーコード', 'データ連携', 'ビジネスチャット', 'BPaaS', 'プロジェクト管理', '帳票', 'グループウェア', 'CRM'], note: 'サブスク型ソフトウェア' },
      { slug: 'ai', label: 'AI・生成AI', aliases: ['AI', '生成AI', '生成AI・AI', '機械学習', 'エッジAI', 'LLM', 'ディープテック'], note: '生成AIと機械学習' },
      { slug: 'cloud', label: 'クラウド', aliases: ['クラウドインフラ', 'AWS', 'Azure', 'GCP', 'データセンター', 'サーバー', 'クラウド移行', 'SaaS基盤'], note: '基盤とインフラ' },
      { slug: 'sier', label: 'SIer・受託開発', aliases: ['SIer', 'ユーザー系SIer', 'システムインテグレーション', 'システム開発', '受託開発', '多重下請け', '上流工程', '要件定義', '請負', '準委任', 'SI', '品質保証', 'デバッグ', 'ニアショア開発', 'ITオフショア開発', 'ITアウトソーシング', 'オフショア開発'], note: '受託の構造' },
      { slug: 'dx', label: 'DX推進', aliases: ['DX', 'DXコンサル', 'DX推進', '内製化', '業務改革', 'BPR', '業務可視化', 'デジタル化', 'DX伴走支援', '中小企業DX', 'スタッフDX', '業務効率化'], note: '社内の変革を進める' },
      { slug: 'security', label: 'セキュリティ', aliases: ['情報セキュリティ', 'サイバーセキュリティ', '営業秘密', 'ITセキュリティ', '投稿監視', '情報漏洩'], note: '守る側の仕事' },
      { slug: 'erp', label: 'ERP・SAP', aliases: ['ERP', 'SAP', 'パッケージソフト', '会計ソフト'], note: '基幹システム' },
      { slug: 'ma', label: 'M&A', aliases: ['M&A仲介', 'M&Aアドバイザリー', 'M&A営業', 'FA', 'M&Aプラットフォーム', 'バリュエーション', 'M&A支援機関登録制度', '財務アドバイザリー', 'FAS'], note: '買収・売却の実務' },
      { slug: 'succession', label: '事業承継', aliases: ['経営承継円滑化法', '遺留分', '後継者不在'], note: '中小企業の出口' },
      { slug: 'pe', label: 'PEファンド', aliases: ['プライベートエクイティ', 'バイアウト', 'ファンド'], note: '買って伸ばす投資' },
      { slug: 'vc', label: 'ベンチャーキャピタル', aliases: ['VC', 'シード投資', 'CVC', '資金調達'], note: '出資する側' },
      { slug: 'ibd', label: '投資銀行', aliases: ['IBD', '証券会社', 'ネット証券', 'アナリスト'], note: 'IBD・証券' },
      { slug: 'turnaround', label: '事業再生', aliases: ['ターンアラウンド', '事業再生コンサルタント', '再生支援'], note: '立て直す仕事' },
      { slug: 'big4', label: 'Big4・監査法人', aliases: ['Big4', '監査法人', '総合コンサル', '総合コンサルティング', '総合コンサルティングファーム'], note: '総合ファームの中身' },
      { slug: 'strategy', label: '戦略コンサル', aliases: ['戦略コンサルティング', 'MBB', '経営コンサルティング'], note: '戦略ファームの中身' },
      { slug: 'thinktank', label: 'シンクタンク', aliases: ['受託調査', 'リサーチ', 'エコノミスト', '野村総合研究所'], note: '調査・政策提言' },
      { slug: 'fintech', label: 'フィンテック', aliases: ['金融IT', '決済', '資金決済法', '資金移動業', 'クレジットカード', '保険システム', '金融システム'], note: '金融×IT' },
      { slug: 'finance-industry', label: '銀行・保険', aliases: ['金融', '銀行', 'メガバンク', '保険', 'MUFG', 'SMBC', 'みずほフィナンシャルグループ', '金融庁', '金融転職'], note: '金融機関そのもの' },
      { slug: 'maker', label: 'メーカー・製造業', aliases: ['メーカー', 'メーカーIT', '製造業DX', '半導体', '電子部品', '自動車', '生産管理', '設計', '素材'], note: 'ものづくりの現場' },
      { slug: 'telecom', label: '通信・キャリア', aliases: ['通信', '通信キャリア', 'NTTグループ', 'NTTドコモ', 'NTTデータ', 'NTTデータグループ', 'KDDI', '電気通信事業法', 'ネットワーク', 'ISP', 'MVNO', 'MVNE', 'ネットワークサービス', '情報通信サービス', '光回線'], note: '通信インフラ' },
      { slug: 'retail', label: '小売・消費財', aliases: ['小売', '消費財', 'EC', 'Eコマース', 'コンビニエンスストア', '食品', '飲料', '化粧品', 'アパレル', '小売DX', 'ネットショップ', 'マーケットプレイス', '越境EC', '飲食店DX', 'モバイルオーダー', 'OMO', '中古車流通', '外食'], note: '生活に近い産業' },
      { slug: 'healthcare', label: 'ヘルスケア・医療', aliases: ['ヘルスケア', '医療', 'ヘルステック', '製薬', '電子カルテ', '医療DX', '介護', '薬事承認', 'AI医療機器', '外資系製薬', 'オンコロジー', 'MR', '治療用アプリ', 'プログラム医療機器', 'DTx', 'レセプト', 'PHR', '遠隔医療', 'ヘルスビッグデータ', '高齢社会'], note: '医療とその周辺' },
      { slug: 'hr-service', label: '人材サービス', aliases: ['人材紹介', '人材派遣', '人材サービス', '技術者派遣', '労働者派遣法', 'HRテック', '人材', '採用支援', 'HR Tech', 'PeopleTech', 'エンジニア転職', '求人メディア'], note: '採用と人材の産業' },
      { slug: 'realestate', label: '不動産・建設', aliases: ['不動産', '不動産DX', '不動産テック', '建設DX', '施工管理', '注文住宅', 'リフォーム', '建設', '建設ICT', '測量計測', '住宅'], note: '不動産とその周辺' },
      { slug: 'logistics', label: '物流', aliases: ['物流DX', '物流テック', '物流効率化法', '物流効率化', '倉庫', '運送'], note: '物流と2024年問題' },
      { slug: 'entertainment', label: 'ゲーム・エンタメ', aliases: ['ゲーム', 'ゲーム・エンタメテック', 'エンタメ', 'メディア', 'アニメ'], note: 'コンテンツ産業' },
      { slug: 'adtech', label: '広告・マーケティング', aliases: ['広告', 'インターネット広告', 'デジタルマーケティング', 'アドテック・マーケティングテック', 'マーケティング', '電通グループ', 'アフィリエイト', '成果報酬型広告', 'SNSマーケティング', 'インフルエンサー', 'WEBマーケティング', '広告審査'], note: '広告とマーケ支援' },
      { slug: 'iot', label: 'IoT・組み込み', aliases: ['IoT', 'IoT・ハードウェアテック', '組込みシステム', '組込みソフトウェア', 'ハードウェア', '組込み', 'ドローン', 'ロボット', '宇宙', '衛星', 'センサー'], note: 'ハードに近い開発' },
      { slug: 'bpo', label: 'BPO・アウトソーシング', aliases: ['BPO', 'アウトソーシング', 'シェアードサービス', 'バックオフィス', 'システム運用'], note: '業務を引き受ける' },
      { slug: 'govtech', label: 'GovTech・公共', aliases: ['GovTech', '公共調達', '自治体', '官公庁', '行政DX', '自治体システム', '公共分野', '地方公共団体', '官民協働', '消防防災システム', '公共システム'], note: '行政向けの仕事' },
      { slug: 'sustainability', label: 'サステナビリティ・GX', aliases: ['サステナビリティ', 'サステナビリティ開示', 'GX', '人的資本', 'ESG', '脱炭素DX', 'サステナビリティ保証', '非財務情報', 'SSBJ', '脱炭素'], note: '非財務と脱炭素' },
      { slug: 'mobility', label: 'モビリティ・自動運転', aliases: ['モビリティ・自動運転', '自動運転', '鉄道', 'MaaS', 'マイクロモビリティ', '電動キックボード', '次世代モビリティ', 'モビリティ産業', '自動車整備', 'シェアリング'], note: '移動の産業' },
      { slug: 'web3', label: 'Web3・ブロックチェーン', aliases: ['Web3', 'ブロックチェーン', '暗号資産'], note: '分散型の技術' },
      { slug: 'edtech', label: 'エドテック', aliases: ['EdTech', '教育', '教育DX'], note: '教育×IT' },
      { slug: 'legaltech', label: 'リーガルテック', aliases: ['法務DX', '契約管理', 'CLO'], note: '法務×IT' },
      { slug: 'agile', label: 'アジャイル・プロダクト開発', aliases: ['アジャイル', 'スクラム', 'プロダクト開発', 'プロダクトマネジメント', 'プロジェクトマネジメント', '開発生産性', 'UIUX'], note: '作り方の話' },
      { slug: 'data', label: 'データ活用', aliases: ['データ分析', 'データ利活用', 'BI', 'データ基盤', 'ビッグデータ', 'データクレンジング', '位置情報', '衛星データ', 'ダッシュボード'], note: '数字を仕事にする' },
      { slug: 'org', label: '人事・組織', aliases: ['組織人事', '組織コンサル', '人事コンサル', '人事コンサルタント', '人事コンサルティング', '組織開発', '人材育成', '人事'], note: '組織をつくる' },
    ],
  },
];

/** 表記ゆれ → canonical なタグslug */
const ALIAS_TO_SLUG = new Map<string, string>();
/** slug → 定義 */
export const TAG_BY_SLUG = new Map<string, TagDef & { group: string; groupKey: string }>();

for (const g of TAG_GROUPS) {
  for (const t of g.tags) {
    if (TAG_BY_SLUG.has(t.slug)) {
      console.warn(`[mediaTags] タグslugが重複しています: ${t.slug}`);
    }
    TAG_BY_SLUG.set(t.slug, { ...t, group: g.name, groupKey: g.key });
    for (const a of [t.label, ...(t.aliases ?? [])]) {
      const key = normalize(a);
      // 先に登録されたタグを優先する（同じ別名を2つのタグが取り合うと記事の行き先が不定になるため）
      if (ALIAS_TO_SLUG.has(key) && ALIAS_TO_SLUG.get(key) !== t.slug) {
        console.warn(`[mediaTags] 別名「${a}」が ${ALIAS_TO_SLUG.get(key)} と ${t.slug} で重複しています`);
        continue;
      }
      ALIAS_TO_SLUG.set(key, t.slug);
    }
  }
}

/** 別名の突き合わせ用。全角空白・記号のゆれと大文字小文字を吸収する */
function normalize(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .replace(/[\s　]/g, '')
    .replace(/[・･／/]/g, '');
}

export type TaggablePost = {
  slug: string;
  data: { tags?: string[]; theme?: string; category?: string; hub?: string };
};

/**
 * 記事に付く canonical なタグslugを返す。
 * frontmatter の tags[] と theme の両方を同じ別名表に通す（theme も立派なタグなので）。
 */
export function tagSlugsOf(post: TaggablePost): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  const push = (raw?: string) => {
    if (!raw) return;
    const s = ALIAS_TO_SLUG.get(normalize(raw));
    if (s && !seen.has(s)) {
      seen.add(s);
      out.push(s);
    }
  };
  for (const t of post.data.tags ?? []) push(t);
  push(post.data.theme);
  return out;
}

export type TagCount = TagDef & { group: string; groupKey: string; count: number };

/**
 * 記事の集合から、実際に MIN_TAG_POSTS 本以上ある タグだけをグループ順に返す。
 * 一覧ページと /media/tag/ のパス生成の両方がこれを使う（載っているのに404、を防ぐため）。
 */
export function getTagGroups(posts: TaggablePost[]) {
  const count = new Map<string, number>();
  for (const p of posts) {
    for (const s of tagSlugsOf(p)) count.set(s, (count.get(s) ?? 0) + 1);
  }

  const groups = TAG_GROUPS.map((g) => ({
    key: g.key,
    name: g.name,
    note: g.note,
    tags: g.tags
      .filter((t) => (count.get(t.slug) ?? 0) >= MIN_TAG_POSTS)
      .map((t) => ({ ...t, group: g.name, groupKey: g.key, count: count.get(t.slug)! }))
      .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, 'ja')),
  })).filter((g) => g.tags.length > 0);

  const live = new Set(groups.flatMap((g) => g.tags.map((t) => t.slug)));
  return { groups, live, count };
}

/** タグページを持っているタグだけに絞る（記事ページのタグチップ用） */
export function liveTagsOf(post: TaggablePost, live: Set<string>): TagCount[] {
  return tagSlugsOf(post)
    .filter((s) => live.has(s))
    .map((s) => TAG_BY_SLUG.get(s)!)
    .filter(Boolean)
    .map((t) => ({ ...t, count: 0 }));
}
