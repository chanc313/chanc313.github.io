// 公共工具函数：读取各栏目内容、生成网址、按年分组、统计标签、技术理论的话题目录、项目目录、格式化日期
import { getCollection, type CollectionEntry } from 'astro:content';
import { COLUMNS, getColumn, type Column, type ColumnId } from './columns';

/** 任意栏目中的一条内容（一篇文章或一段对话） */
export type Entry = CollectionEntry<ColumnId>;

const byDateDesc = (a: Entry, b: Entry) => b.data.date.valueOf() - a.data.date.valueOf();

/** 取某个栏目里已发布的内容，从新到旧。草稿只在本地开发时出现。 */
export async function getEntries<C extends ColumnId>(column: C): Promise<CollectionEntry<C>[]> {
  const entries: CollectionEntry<C>[] = await getCollection(column);
  const published = entries.filter((e) => (import.meta.env.PROD ? !e.data.draft : true));
  // 项目下的页面随项目首页发布：首页是草稿时，这些页面也不出现
  const ids = new Set(published.map((e) => e.id));
  return published
    .filter((e) => !('project' in e.data && e.data.project) || ids.has(e.data.project))
    .sort(byDateDesc);
}

/** 取所有栏目的内容，合在一起从新到旧排列（首页、标签页、RSS 用） */
export async function getAllEntries(): Promise<Entry[]> {
  const lists = await Promise.all(COLUMNS.map((c) => getEntries(c.id)));
  return lists.flat().sort(byDateDesc);
}

/** 这条内容属于哪个栏目 */
export function columnOf(entry: Entry): Column {
  return getColumn(entry.collection);
}

/** 这条内容的网址，如 /posts/hello-world/ */
export function entryUrl(entry: Entry): string {
  return `${columnOf(entry).path}${entry.id}/`;
}

/** 年份目录里的一行：标题、链接、日期，可带一个小标注（所属栏目、"系列 · 3 篇"等） */
export interface IndexItem {
  title: string;
  url: string;
  date: Date;
  label?: string;
  draft?: boolean;
}

/** 按年份分组，供年份目录使用（输入已按日期排好） */
export function groupByYear(items: IndexItem[]): [number, IndexItem[]][] {
  const groups = new Map<number, IndexItem[]>();
  for (const item of items) {
    const year = item.date.getFullYear();
    groups.set(year, [...(groups.get(year) ?? []), item]);
  }
  return [...groups.entries()];
}

/** 统计每个标签下的内容数，按数量从多到少 */
export function countTags(entries: Entry[]): [string, number][] {
  const counts = new Map<string, number>();
  for (const entry of entries) {
    for (const tag of entry.data.tags) counts.set(tag, (counts.get(tag) ?? 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]);
}

export type Topic = CollectionEntry<'topics'>;
export type TheoryEntry = CollectionEntry<'theory'>;

/** 话题内的一个系列：文章按发布日期从早到晚（阅读顺序） */
export interface Series {
  name: string;
  entries: TheoryEntry[];
}

/** 一个话题的内容：各系列（按话题里 series 的顺序）与不属于系列的单篇文章（从新到旧） */
export interface TopicTree {
  topic: Topic;
  series: Series[];
  singles: TheoryEntry[];
  /** 文章总数 */
  count: number;
}

/**
 * 技术理论栏目的结构：每个话题一份，外加未归入话题的文章（从新到旧）。
 * 同时检查文章填写的话题、系列是否存在，填错直接报错，避免文章从目录中"消失"。
 */
export async function getTheoryTree(): Promise<{ trees: TopicTree[]; loose: TheoryEntry[] }> {
  const topics = (await getCollection('topics')).sort(
    (a, b) => a.data.order - b.data.order || a.id.localeCompare(b.id),
  );
  const entries = await getEntries('theory');

  const errors: string[] = [];
  for (const { id, data } of entries) {
    const topic = topics.find((t) => t.id === data.topic);
    if (data.topic && !topic) {
      errors.push(`src/content/theory/${id}：话题 ${data.topic} 不存在（话题在 src/content/topics/ 中定义）`);
    } else if (data.series && !topic) {
      errors.push(`src/content/theory/${id}：填了系列「${data.series}」但没有填话题`);
    } else if (data.series && topic && !topic.data.series.includes(data.series)) {
      errors.push(`src/content/theory/${id}：系列「${data.series}」不在话题 ${topic.id} 的系列列表中`);
    }
  }
  if (errors.length > 0) throw new Error(`技术理论目录检查未通过：\n${errors.map((e) => `  - ${e}`).join('\n')}`);

  const trees = topics.map((topic) => {
    const mine = entries.filter((e) => e.data.topic === topic.id);
    const series = topic.data.series
      .map((name) => ({
        name,
        entries: mine
          .filter((e) => e.data.series === name)
          .sort((a, b) => a.data.date.valueOf() - b.data.date.valueOf() || a.id.localeCompare(b.id)),
      }))
      .filter((s) => s.entries.length > 0);
    return { topic, series, singles: mine.filter((e) => !e.data.series), count: mine.length };
  });
  return { trees, loose: entries.filter((e) => !e.data.topic) };
}

export type ProjectEntry = CollectionEntry<'projects'>;

/** 一个项目：首页与其下各页（按发布日期从早到晚） */
export interface ProjectTree {
  home: ProjectEntry;
  pages: ProjectEntry[];
}

/**
 * 项目栏目的结构：每个项目首页一份，从新到旧。
 * 检查每页填写的 project 是否指向一个项目首页，填错直接报错，避免页面从目录中"消失"。
 */
export async function getProjectTree(): Promise<ProjectTree[]> {
  // 检查用全部内容（含草稿）：项目首页是草稿时，它的各页随之不发布，不算错误
  const all = await getCollection('projects');
  const errors: string[] = [];
  for (const { id, data } of all) {
    if (!data.project) continue;
    const parent = all.find((e) => e.id === data.project);
    if (!parent) errors.push(`src/content/projects/${id}：项目 ${data.project} 不存在`);
    else if (parent.data.project) errors.push(`src/content/projects/${id}：${data.project} 本身是某个项目下的一页，页面下不能再挂页面`);
  }
  if (errors.length > 0) throw new Error(`项目目录检查未通过：\n${errors.map((e) => `  - ${e}`).join('\n')}`);

  const entries = await getEntries('projects');
  return entries.filter((e) => !e.data.project).map((home) => ({
    home,
    pages: entries
      .filter((e) => e.data.project === home.id)
      .sort((a, b) => a.data.date.valueOf() - b.data.date.valueOf() || a.id.localeCompare(b.id)),
  }));
}

export function formatDate(date: Date, style: 'full' | 'short' = 'full'): string {
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  const d = date.getDate();
  if (style === 'short') return `${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  return `${y}年${m}月${d}日`;
}
