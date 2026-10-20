// 公共工具函数：读取各栏目内容、整理目录树、生成网址、按年分组、统计标签、格式化日期
import { getCollection, type CollectionEntry } from 'astro:content';
import { COLUMNS, getColumn, type Column, type ColumnId } from './columns';

/** 任意栏目中的一个页面：文章或目录 */
export type Entry = CollectionEntry<ColumnId>;

const byDateDesc = (a: Entry, b: Entry) => b.data.date.valueOf() - a.data.date.valueOf();
const byDateAsc = (a: Entry, b: Entry) => a.data.date.valueOf() - b.data.date.valueOf() || a.id.localeCompare(b.id);

export const isFolder = (entry: Entry) => entry.data.kind === 'folder';

/** 正文是否有内容。目录的正文是简介，可以空着 */
export const hasBody = (entry: Entry) => !!entry.body?.trim();

/** 上级目录的 id：ros/notes/intro → ros/notes；栏目根下的页面返回 '' */
export const parentId = (id: string) => id.slice(0, Math.max(0, id.lastIndexOf('/')));

/** 目录树上的一个页面 */
export interface TreeNode {
  entry: Entry;
  /** 上级目录；栏目根下的页面没有 */
  parent?: TreeNode;
  /** 目录里的页面，按阅读顺序（见 readingOrder）；文章没有 */
  children: TreeNode[];
}

/** 一个栏目的目录树 */
export interface Tree {
  /** 栏目根下的页面，按阅读顺序 */
  roots: TreeNode[];
  /** 全部已发布页面，按 id 查找 */
  nodes: Map<string, TreeNode>;
}

/** 目录里的阅读顺序：子目录在前（order 小的在前，同 order 按日期），文章在后（按日期从早到晚） */
function readingOrder(a: TreeNode, b: TreeNode) {
  const [fa, fb] = [isFolder(a.entry), isFolder(b.entry)];
  if (fa !== fb) return fa ? -1 : 1;
  return (fa ? a.entry.data.order - b.entry.data.order : 0) || byDateAsc(a.entry, b.entry);
}

/**
 * 整理一个栏目的目录树。页面的上级目录由文件夹路径决定：src/content/theory/ros/notes/ 在 ros 目录下。
 * 同时检查结构：每一层文件夹都要有 index.md，且上级必须是目录（文章下面不能放页面），
 * 不对就直接报错，避免页面从目录中"消失"。
 * 草稿只在本地开发时出现；生产构建里，草稿目录下的页面也一起不发布。
 */
export async function getTree(column: ColumnId): Promise<Tree> {
  const all: Entry[] = await getCollection(column);
  const byId = new Map(all.map((e) => [e.id, e]));

  const errors: string[] = [];
  for (const { id } of all) {
    const pid = parentId(id);
    const parent = byId.get(pid);
    if (!pid) continue;
    if (!parent) errors.push(`src/content/${column}/${id}：上级文件夹 ${pid}/ 里没有 index.md，每一层目录都要有自己的 index.md`);
    else if (!isFolder(parent)) errors.push(`src/content/${column}/${id}：上级 ${pid} 是文章，文章下面不能放页面。把 ${pid} 的类型改成目录，或把这个页面移出来`);
  }
  if (errors.length > 0) throw new Error(`目录检查未通过：\n${errors.map((e) => `  - ${e}`).join('\n')}`);

  const hidden = (e: Entry): boolean => e.data.draft || (!!parentId(e.id) && hidden(byId.get(parentId(e.id))!));
  const nodes = new Map<string, TreeNode>();
  for (const entry of all) {
    if (!(import.meta.env.PROD && hidden(entry))) nodes.set(entry.id, { entry, children: [] });
  }
  const roots: TreeNode[] = [];
  for (const node of nodes.values()) {
    node.parent = nodes.get(parentId(node.entry.id));
    (node.parent?.children ?? roots).push(node);
  }
  roots.sort(readingOrder);
  for (const node of nodes.values()) node.children.sort(readingOrder);
  return { roots, nodes };
}

/** 生成栏目内容页的 getStaticPaths：每个已发布页面（文章和目录）一页，网址 /<栏目>/<路径>/ */
export async function treePaths(column: ColumnId) {
  const { nodes } = await getTree(column);
  return [...nodes.values()].map((node) => ({ params: { slug: node.entry.id }, props: { node } }));
}

/** 目录下（含各层子目录）的全部文章，按阅读顺序 */
export function articlesUnder(node: TreeNode): TreeNode[] {
  return node.children.flatMap((c) => (isFolder(c.entry) ? articlesUnder(c) : [c]));
}

/** 从一级目录到上级目录的路径，不含自己 */
export function ancestors(node: TreeNode): TreeNode[] {
  const list: TreeNode[] = [];
  for (let p = node.parent; p; p = p.parent) list.unshift(p);
  return list;
}

/** 所在的一级目录（栏目根下的目录），自己是一级目录时返回自己；栏目根下的文章返回 undefined */
export function topFolder(node: TreeNode): TreeNode | undefined {
  const top = ancestors(node)[0] ?? node;
  return isFolder(top.entry) ? top : undefined;
}

/**
 * 年份目录的条目，从新到旧：文章一篇一项；子目录算一项，链接到目录页，
 * 日期取目录里（含各层子目录）最新的一篇文章，还没有文章时取目录自己的日期；标注"共 N 篇"
 */
export function indexItems(nodes: TreeNode[]): IndexItem[] {
  return nodes
    .map((node) => {
      const { entry } = node;
      const item = { title: entry.data.title, url: entryUrl(entry), date: entry.data.date, draft: entry.data.draft };
      if (!isFolder(entry)) return item;
      const articles = articlesUnder(node);
      const latest = Math.max(...articles.map((a) => a.entry.data.date.valueOf()));
      return {
        ...item,
        date: articles.length > 0 ? new Date(latest) : entry.data.date,
        label: articles.length > 0 ? `共 ${articles.length} 篇` : undefined,
      };
    })
    .sort((a, b) => b.date.valueOf() - a.date.valueOf());
}

/**
 * 取某个栏目里出现在首页、标签页和 RSS 的页面，从新到旧：
 * 全部文章，加上有正文的目录（如项目介绍）；只用来归类、没有正文的目录不算
 */
export async function getEntries(column: ColumnId): Promise<Entry[]> {
  const { nodes } = await getTree(column);
  return [...nodes.values()]
    .map((n) => n.entry)
    .filter((e) => !isFolder(e) || hasBody(e))
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

/** 这个页面的网址，如 /posts/hello-world/、/theory/ros/notes/ */
export function entryUrl(entry: Entry): string {
  return `${columnOf(entry).path}${entry.id}/`;
}

/** 年份目录里的一行：标题、链接、日期，可带一个小标注（所属栏目、"共 3 篇"等） */
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

export function formatDate(date: Date, style: 'full' | 'short' = 'full'): string {
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  const d = date.getDate();
  if (style === 'short') return `${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  return `${y}年${m}月${d}日`;
}
