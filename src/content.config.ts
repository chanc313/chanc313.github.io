// 内容集合定义：每个栏目一个集合，外加独立页面集合 pages。
// 规定 Markdown 开头（frontmatter）能填哪些字段。栏目集合名必须与 src/columns.ts 里的 id 一致。
//
// 每个页面是一个"资源包"文件夹：
//   src/content/<集合>/<页面名>/index.md   正文
//   src/content/<集合>/<页面名>/...        这个页面私有的图片、音频、视频等
// 资源文件的发布由 src/integrations/page-bundles.mjs 处理。
//
// 栏目里的页面分两种（kind 字段）：文章和目录。目录的文件夹里可以再放目录或文章，层数不限，
// 网址就是文件夹路径：src/content/theory/ros/notes/index.md → /theory/ros/notes/。
// 文章下面不能再放页面。目录结构的整理和检查在 src/utils.ts 的 getTree()。
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

/**
 * 读取某个目录下所有资源包的 index.md；条目 id 取相对路径，如 ros/notes。
 * nested 为 false 时只读一层（独立页面的网址只有一段）
 */
function bundles(base: string, nested = true) {
  return glob({
    base,
    pattern: nested ? '**/index.{md,mdx}' : '*/index.{md,mdx}',
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
  // 页面类型：article 文章（默认），folder 目录。目录下可以放目录或文章，正文是目录的简介（可空）
  kind: optional(z.enum(['article', 'folder'])).transform((v) => v ?? 'article'),
  description: optional(z.string()),
  date: z.coerce.date(),
  updated: optional(z.coerce.date()),
  tags: optional(z.array(z.string())).transform((v) => v ?? []),
  draft: optional(z.boolean()).transform((v) => v ?? false),
  // 目录在上级目录里的排序，数字小的在前；不填按日期。文章按日期排，不用填
  order: optional(z.number()).transform((v) => v ?? 0),
});

// 栏目：文章。也可以放对话记录：正文用 @me / @ai 分段（见 src/plugins/remark-chat-turns.mjs），
// 并填 ai、note 两个字段
const posts = defineCollection({
  loader: bundles('./src/content/posts'),
  schema: entry.extend({
    ai: optional(z.string()),   // 对话对象，如 "Claude Opus 5.5"；填了才显示在日期后，也用作每段 AI 发言上方的名称
    note: optional(z.string()), // 批注：显示在正文之前
  }),
});

// 栏目：项目。一个项目是一个目录，项目的各页（开发日志、环境说明等）放在它下面
const projects = defineCollection({
  loader: bundles('./src/content/projects'),
  schema: entry,
});

// 栏目：技术理论。话题（ROS、控制理论等）是一级目录，系列、章节是下面的子目录
const theory = defineCollection({
  loader: bundles('./src/content/theory'),
  schema: entry,
});

// 独立页面（不属于任何栏目，如"关于"），网址为 /<页面名>/
const pages = defineCollection({
  loader: bundles('./src/content/pages', false),
  schema: z.object({
    title: z.string(),
    description: optional(z.string()),
    draft: optional(z.boolean()).transform((v) => v ?? false),
  }),
});

export const collections = { posts, projects, theory, pages };
