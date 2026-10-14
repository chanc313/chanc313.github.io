// 内容集合定义：每个栏目一个集合，规定 Markdown 开头（frontmatter）能填哪些字段。
// 集合名必须与 src/columns.ts 里的栏目 id 一致。
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const pattern = '**/*.{md,mdx}';

// 所有栏目共用的字段
const base = z.object({
  title: z.string(),
  description: z.string().optional(),
  date: z.coerce.date(),
  updated: z.coerce.date().optional(),
  tags: z.array(z.string()).default([]),
  draft: z.boolean().default(false),
});

// 文章：只用公共字段
const posts = defineCollection({
  loader: glob({ base: './src/content/posts', pattern }),
  schema: base,
});

// AI 对话：多两个字段
const chats = defineCollection({
  loader: glob({ base: './src/content/chats', pattern }),
  schema: base.extend({
    ai: z.string().default('AI'),   // 对话对象，如 "Claude Opus 5.5"，显示在每段 AI 发言上方
    note: z.string().optional(),    // 批注：这段对话为什么值得留下，显示在正文之前
  }),
});

export const collections = { posts, chats };
