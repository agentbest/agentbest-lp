// src/content/config.ts … メディア記事（src/content/media/*.md）のfrontmatter定義
import { defineCollection, z } from 'astro:content';

const media = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    category: z.enum(['職種', '業界', '企業']),
    jobType: z.string().optional(),
    industry: z.string().optional(),
    companyName: z.string().optional(),
    // ハブページのslug。未指定の記事は記事slugの共通接頭辞から推定される（後方互換）
    hub: z.string().optional(),
    theme: z.string(),
    tags: z.array(z.string()),
    pubDate: z.date(),
    image: z.string().optional(),
    related: z.array(z.string()).optional(),
    // 出典と情報の基準日（企業別記事などファクトを扱う記事で使用）
    sources: z
      .array(z.object({ name: z.string(), url: z.string().optional() }))
      .optional(),
    reviewedAt: z.date().optional(),
  }),
});

// M&Aニュース（src/content/news/*.md）。tools/ma-news が適時開示から自動生成する。
// 記事（media）とは体裁も更新頻度も違うので、コレクションを分けている。
// 同じコレクションに入れるとハブ・タグの集計に毎日ニュースが流れ込み、/media の分類が崩れる。
const news = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    /** buy=子会社化 sell=譲渡 merger=合併 split=会社分割 transfer=事業譲渡 exchange=株式交換 alliance=資本業務提携 */
    dealType: z.string(),
    /** 開示した上場企業 */
    issuer: z.string(),
    issuerCode: z.string().optional(),
    /** 対象会社 */
    targetName: z.string(),
    industry: z.string(),
    tags: z.array(z.string()),
    pubDate: z.date(),
    /** 出典は必ず持たせる。一次情報にたどり着けない記事は出さない */
    sourceName: z.string(),
    sourceUrl: z.string(),
    tdnetId: z.string(),
  }),
});

export const collections = { media, news };
