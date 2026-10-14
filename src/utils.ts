// 公共工具函数：读取各栏目内容、生成网址、按年分组、统计标签、格式化日期
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

export function formatDate(date: Date, style: 'full' | 'short' = 'full'): string {
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  const d = date.getDate();
  if (style === 'short') return `${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  return `${y}年${m}月${d}日`;
}
