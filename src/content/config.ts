// src/content/config.ts に追記してください
import { defineCollection, z } from 'astro:content';

const media = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    category: z.enum(['職種', '業界']),
    jobType: z.string().optional(),
    industry: z.string().optional(),
    theme: z.string(),
    tags: z.array(z.string()),
    pubDate: z.date(),
    image: z.string().optional(),
    related: z.array(z.string()).optional(),
  }),
});

export const collections = { media };
