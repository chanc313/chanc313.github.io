// Astro 集成：启动时检查栏目与页面的结构是否完整、有没有网址冲突。
//
// 为什么需要：新增栏目要改好几处（见 AGENTS.md「栏目」），漏掉任何一处，
// Astro 不一定报错，常见结果是导航链接 404、后台看不到栏目、页面被静默跳过。
// 这里把这些"静默出错"变成启动时的明确报错，开发（npm run dev）和构建都会检查。
//
// 检查项：
//   1. 每个栏目（src/columns.ts）都有 src/pages/<id>/index.astro 和 [...slug].astro
//   2. 后台配置 public/admin/config.yml 里有每个栏目和独立页面的集合（folder: src/content/<id>）
//   3. src/content/ 下没有未登记的目录（未登记的目录不会生成任何页面）
//   4. 独立页面名不与已有网址冲突：如 tags、admin、posts。
//      冲突时 Astro 只给一条警告并跳过该页面，页面会"消失"。
// 栏目内的目录结构（每层文件夹都有 index.md、文章下面不放页面）在生成页面时由 src/utils.ts 的 getTree() 检查。

import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

/** 栏目以外的内容集合：独立页面 */
const EXTRA_COLLECTIONS = ['pages'];

/**
 * @param {{ columns: readonly { id: string }[] }} options  栏目列表，来自 src/columns.ts
 */
export default function structureCheck({ columns }) {
  return {
    name: 'structure-check',
    hooks: {
      'astro:config:setup': ({ config }) => {
        const root = fileURLToPath(config.root);
        const errors = [
          ...checkColumnPages(root, columns),
          ...checkAdminConfig(root, columns),
          ...checkContentDirs(root, columns),
          ...checkPageNames(root),
        ];
        if (errors.length > 0) {
          throw new Error(`网站结构检查未通过：\n${errors.map((e) => `  - ${e}`).join('\n')}`);
        }
      },
    },
  };
}

/** 1. 每个栏目都要有栏目首页和内容页两个页面文件 */
function checkColumnPages(root, columns) {
  const errors = [];
  for (const { id } of columns) {
    for (const file of ['index.astro', '[...slug].astro']) {
      if (!existsSync(join(root, 'src/pages', id, file))) {
        errors.push(`栏目 ${id} 缺少 src/pages/${id}/${file}（可复制 src/pages/posts/ 下的同名文件）`);
      }
    }
  }
  return errors;
}

/** 2. 后台配置要包含每个栏目和独立页面的集合，否则后台里看不到、无法编辑 */
function checkAdminConfig(root, columns) {
  const file = join(root, 'public/admin/config.yml');
  if (!existsSync(file)) return [];
  const text = readFileSync(file, 'utf-8');
  return [...columns.map((c) => c.id), ...EXTRA_COLLECTIONS]
    .filter((id) => !new RegExp(`^\\s*folder:\\s*['"]?src/content/${id}['"]?\\s*$`, 'm').test(text))
    .map((id) => `public/admin/config.yml 中没有 folder: src/content/${id} 的集合，后台无法编辑该栏目`);
}

/** 3. src/content/ 下的每个目录都应是登记过的栏目或 EXTRA_COLLECTIONS */
function checkContentDirs(root, columns) {
  const known = new Set([...columns.map((c) => c.id), ...EXTRA_COLLECTIONS]);
  return subdirs(join(root, 'src/content'))
    .filter((name) => !known.has(name))
    .map((name) => `src/content/${name}/ 不是已登记的栏目，其中的内容不会生成页面（在 src/columns.ts 登记，或移走该目录）`);
}

/**
 * 4. 独立页面的网址是 /<页面名>/，与站点根目录下已有的网址共用一层，名字不能重复。
 * 已占用的名字从 src/pages/ 和 public/ 的顶层自动读取，栏目 id 已包含在 src/pages/ 中。
 */
function checkPageNames(root) {
  const taken = new Set([
    '_astro', // Astro 构建产物（压缩后的图片、样式）的输出目录
    ...topLevelNames(join(root, 'src/pages')),
    ...topLevelNames(join(root, 'public')),
  ]);
  return subdirs(join(root, 'src/content/pages'))
    .filter((name) => taken.has(name))
    .map((name) => `独立页面 src/content/pages/${name}/ 的网址 /${name}/ 已被占用，请给页面文件夹换个名字`);
}

/** 目录下的子目录名（目录不存在时返回空列表） */
function subdirs(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isDirectory() && !d.name.startsWith('.'))
    .map((d) => d.name);
}

/** 目录顶层占用的网址名：文件去掉扩展名（404.astro → 404），跳过 [page] 这类动态路由 */
function topLevelNames(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((name) => !name.startsWith('[') && !name.startsWith('.'))
    .flatMap((name) => [name, name.replace(/\.(astro|md|mdx|js|ts)$/, '')]);
}
