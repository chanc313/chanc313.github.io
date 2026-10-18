// 内容集合定义：每个栏目一个集合，外加独立页面集合 pages。
// 规定 Markdown 开头（frontmatter）能填哪些字段。栏目集合名必须与 src/columns.ts 里的 id 一致。
//
// 每个页面是一个"资源包"文件夹：
//   src/content/<集合>/<页面名>/index.md   正文
//   src/content/<集合>/<页面名>/...        这个页面私有的图片、音频、视频等
// 页面名即网址的最后一段。资源文件的发布由 src/integrations/page-bundles.mjs 处理。
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

/** 读取某个目录下所有资源包的 index.md；条目 id 取文件夹名 */
function bundles(base: string) {
  return glob({
    base,
    pattern: '*/index.{md,mdx}',
    generateId: ({ entry }) => entry.replace(/\/index\.mdx?$/, ''),
  });
}

/**
 * 可选字段：空字符串和 null 视为"没填"。
 * 后台编辑器（Sveltia CMS）可能把留空的可选字段写成 '' 或 null，不处理会导致校验失败。
 */
const optional = <T extends z.ZodTypeAny>(schema: T) =>
  z.preprocess((v) => (v === '' || v === null ? undefined : v), schema.optional());

// 栏目内容共用的字段
const entry = z.object({
  title: z.string(),
  description: optional(z.string()),
  date: z.coerce.date(),
  updated: optional(z.coerce.date()),
  tags: optional(z.array(z.string())).transform((v) => v ?? []),
  draft: optional(z.boolean()).transform((v) => v ?? false),
});

// 栏目：文章
const posts = defineCollection({
  loader: bundles('./src/content/posts'),
  schema: entry,
});

// 栏目：AI 对话，多两个字段
const chats = defineCollection({
  loader: bundles('./src/content/chats'),
  schema: entry.extend({
    ai: optional(z.string()).transform((v) => v ?? 'AI'), // 对话对象，如 "Claude Opus 5.5"，显示在每段 AI 发言上方
    note: optional(z.string()),                             // 批注：这段对话为什么值得留下，显示在正文之前
  }),
});

// 栏目：ROS
const ros = defineCollection({
  loader: bundles('./src/content/ros'),
  schema: entry,
});

// 栏目：项目
const projects = defineCollection({
  loader: bundles('./src/content/projects'),
  schema: entry,
});

// 栏目：框架和工具
const tools = defineCollection({
  loader: bundles('./src/content/tools'),
  schema: entry,
});

// 栏目：技术理论
const theory = defineCollection({
  loader: bundles('./src/content/theory'),
  schema: entry,
});

// 独立页面（不属于任何栏目，如"关于"），网址为 /<页面名>/
const pages = defineCollection({
  loader: bundles('./src/content/pages'),
  schema: z.object({
    title: z.string(),
    description: optional(z.string()),
    draft: optional(z.boolean()).transform((v) => v ?? false),
  }),
});

export const collections = { posts, chats, ros, projects, tools, theory, pages };
