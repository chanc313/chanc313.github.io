// 栏目登记表：网站有哪些平行栏目，都在这里定义。
// 导航、首页汇总、标签页、RSS 都从这里读取栏目信息。
//
// 新增一个栏目需要五处改动（以 id 为 notes 为例）：
//   1. 这里加一项
//   2. src/content.config.ts 加一个同名集合
//   3. 新建 src/content/notes/ 存放内容
//   4. 新建 src/pages/notes/index.astro 和 src/pages/notes/[...slug].astro（可复制现有栏目的）
//   5. public/admin/config.yml 加一个 folder: src/content/notes 的集合（后台编辑用）
// 漏掉 3 以外的任何一处，npm run dev / build 启动时会报错指出（src/integrations/structure-check.mjs）。

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
  {
    id: 'ros',
    label: 'ROS',
    path: '/ros/',
    description: 'ROS（机器人操作系统）学习笔记',
  },
  {
    id: 'projects',
    label: '项目',
    path: '/projects/',
    description: '做过的项目与记录',
  },
  {
    id: 'tools',
    label: '框架和工具',
    path: '/tools/',
    description: '框架、库与工具的使用笔记',
  },
  {
    id: 'theory',
    label: '技术理论',
    path: '/theory/',
    description: '技术背后的原理与理论',
  },
] as const;

export type Column = (typeof COLUMNS)[number];
export type ColumnId = Column['id'];

export function getColumn(id: ColumnId): Column {
  return COLUMNS.find((c) => c.id === id)!;
}
