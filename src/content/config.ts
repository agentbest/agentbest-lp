// src/content/config.ts に追記してください
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

export const collections = { media };
