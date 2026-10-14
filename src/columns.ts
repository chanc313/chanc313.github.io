// 栏目登记表：网站有哪些平行栏目，都在这里定义。
// 导航、首页汇总、标签页、RSS 都从这里读取栏目信息。
//
// 新增一个栏目需要四处改动（以 id 为 notes 为例）：
//   1. 这里加一项
//   2. src/content.config.ts 加一个同名集合
//   3. 新建 src/content/notes/ 存放内容
//   4. 新建 src/pages/notes/index.astro 和 src/pages/notes/[...slug].astro（可复制现有栏目的）

export const COLUMNS = [
  {
    id: 'posts',
    label: '文章',
    path: '/posts/',
    description: '文章与随笔',
  },
  {
    id: 'chats',
    label: 'AI对话',
    path: '/chats/',
    description: '与 AI 对话中值得留下的记录',
  },
] as const;

export type Column = (typeof COLUMNS)[number];
export type ColumnId = Column['id'];

export function getColumn(id: ColumnId): Column {
  return COLUMNS.find((c) => c.id === id)!;
}
