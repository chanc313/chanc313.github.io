// 公共工具函数：读取各栏目内容、生成网址、按年分组、统计标签、技术理论的话题目录、格式化日期
import { getCollection, type CollectionEntry } from 'astro:content';
import { COLUMNS, getColumn, type Column, type ColumnId } from './columns';

/** 任意栏目中的一条内容（一篇文章或一段对话） */
export type Entry = CollectionEntry<ColumnId>;

const byDateDesc = (a: Entry, b: Entry) => b.data.date.valueOf() - a.data.date.valueOf();

/** 取某个栏目里已发布的内容，从新到旧。草稿只在本地开发时出现。 */
export async function getEntries<C extends ColumnId>(column: C): Promise<CollectionEntry<C>[]> {
  const entries: CollectionEntry<C>[] = await getCollection(column);
  return entries
    .filter((e) => (import.meta.env.PROD ? !e.data.draft : true))
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

/** 按年份分组，供年份目录使用 */
export function groupByYear(entries: Entry[]): [number, Entry[]][] {
  const groups = new Map<number, Entry[]>();
  for (const entry of entries) {
    const year = entry.data.date.getFullYear();
    groups.set(year, [...(groups.get(year) ?? []), entry]);
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

/** 一个话题的目录：先是各系列（按话题里 series 的顺序），最后是不属于系列的文章 */
export interface TopicTree {
  topic: Topic;
  groups: { series?: string; entries: TheoryEntry[] }[];
  /** 话题内全部文章按目录顺序排成一列，用于「上一篇 / 下一篇」 */
  sequence: TheoryEntry[];
}

/**
 * 技术理论栏目的完整目录：每个话题一棵树，外加未归入话题的文章（从新到旧）。
 * 同时检查文章填写的话题、系列是否存在，填错直接报错，避免文章从目录中"消失"。
 * 话题、系列内的文章按发布日期从早到晚排列（学习笔记的阅读顺序）。
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

  const oldestFirst = [...entries].sort(
    (a, b) => a.data.date.valueOf() - b.data.date.valueOf() || a.id.localeCompare(b.id),
  );
  const trees = topics.map((topic) => {
    const mine = oldestFirst.filter((e) => e.data.topic === topic.id);
    const groups = [
      ...topic.data.series.map((series) => ({ series, entries: mine.filter((e) => e.data.series === series) })),
      { entries: mine.filter((e) => !e.data.series) },
    ].filter((g) => g.entries.length > 0);
    return { topic, groups, sequence: groups.flatMap((g) => g.entries) };
  });
  return { trees, loose: entries.filter((e) => !e.data.topic) };
}

export function formatDate(date: Date, style: 'full' | 'short' = 'full'): string {
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  const d = date.getDate();
  if (style === 'short') return `${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  return `${y}年${m}月${d}日`;
}
