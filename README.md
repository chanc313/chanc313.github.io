# chanc313.github.io

个人博客。站点地址：<https://chanc313.github.io>

## 技术栈

| 项目 | 说明 |
|---|---|
| 框架 | [Astro](https://astro.build) 7，输出纯静态 HTML |
| Markdown 处理 | unified（remark/rehype），经 `@astrojs/markdown-remark`；未使用 Astro 7 默认的 Sätteri |
| 样式 | 原生 CSS，设计变量集中于 `src/styles/tokens.css`；未使用 UI 框架 |
| 内容 | Markdown，经 Astro Content Collections 校验 |
| 代码高亮 | Shiki，浅色 `github-light` / 深色 `github-dark` |
| 字体 | 标题：霞鹜文楷 LXGW WenKai Screen（`lxgw-wenkai-screen-webfont`，自托管，按 unicode-range 分片加载）；正文：系统中文无衬线字体 |
| 部署 | GitHub Actions → GitHub Pages，推送 `main` 分支触发 |
| 运行环境 | Node.js ≥ 22 |

## 栏目

站点内容划分为平行栏目。每个栏目在三处各有一个同名位置：内容集合、内容目录、页面目录。

| 栏目 | id | 内容目录 | 页面目录 | 网址 |
|---|---|---|---|---|
| 文章 | `posts` | `src/content/posts/` | `src/pages/posts/` | `/posts/` |
| AI对话 | `chats` | `src/content/chats/` | `src/pages/chats/` | `/chats/` |

栏目登记于 `src/columns.ts`。导航、首页汇总、标签页与 RSS 从该文件读取栏目列表。

首页按年份汇总全部栏目内容并标注所属栏目。标签跨栏目生效。

### 新增栏目

以 id `notes` 为例：

1. `src/columns.ts`：在 `COLUMNS` 中添加一项
2. `src/content.config.ts`：添加同名集合 `notes`
3. 创建 `src/content/notes/`
4. 创建 `src/pages/notes/index.astro` 与 `src/pages/notes/[...slug].astro`（结构同 `posts/`）

## 目录结构

```
.
├── .github/workflows/deploy.yml     构建与部署流程
├── public/                          原样复制到站点根目录的静态文件（favicon、图片等）
├── src/
│   ├── columns.ts                   栏目登记表
│   ├── content.config.ts            各栏目内容集合的 frontmatter 字段定义
│   ├── consts.ts                    站点名称、描述、首页介绍文字、外部链接
│   ├── utils.ts                     内容读取、网址生成、按年分组、标签统计、日期格式化
│   ├── content/
│   │   ├── posts/                   栏目「文章」的内容
│   │   └── chats/                   栏目「AI对话」的内容
│   ├── pages/                       路由：文件路径即网址
│   │   ├── index.astro              /           全部栏目汇总
│   │   ├── posts/
│   │   │   ├── index.astro          /posts/     栏目首页
│   │   │   └── [...slug].astro      /posts/<文件名>/
│   │   ├── chats/
│   │   │   ├── index.astro          /chats/     栏目首页
│   │   │   └── [...slug].astro      /chats/<文件名>/
│   │   ├── tags/
│   │   │   ├── index.astro          /tags/
│   │   │   └── [tag].astro          /tags/<标签>/
│   │   ├── about.md                 /about/
│   │   ├── 404.astro                /404.html
│   │   └── rss.xml.js               /rss.xml    全部栏目
│   ├── layouts/
│   │   ├── BaseLayout.astro         全站外壳：<head>、页头、页脚、主题初始化
│   │   ├── ColumnLayout.astro       栏目首页：栏目名 + 年份目录
│   │   ├── EntryLayout.astro        内容页：标题、元信息、标签、正文、上一篇/下一篇
│   │   └── AboutLayout.astro        独立 Markdown 页面
│   ├── components/
│   │   ├── Header.astro             站名与导航（栏目组 | 独立页面组）
│   │   ├── Footer.astro             页脚
│   │   ├── EntryIndex.astro         按年份分组的目录，可标注所属栏目
│   │   └── ThemeToggle.astro        浅色/深色切换
│   ├── plugins/
│   │   └── remark-chat-turns.mjs    Markdown 插件：对话记录按发言人分段
│   └── styles/
│       ├── tokens.css               设计变量：颜色、字体、字号、版心宽度
│       └── global.css               全站基础样式、`.prose` 正文排版、对话记录样式
├── astro.config.mjs                 站点地址、集成、Markdown 处理器与插件
├── AGENTS.md                        面向 AI 编码助手的项目约定
├── CLAUDE.md                        引用 AGENTS.md
└── package.json
```

## 内容

### 文件与网址

内容文件位于对应栏目的内容目录，文件名决定网址：`src/content/posts/my-post.md` → `/posts/my-post/`。文件名使用英文或拼音，避免网址中出现编码后的中文。

### Frontmatter：全部栏目共用字段

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `title` | 字符串 | 是 | 标题 |
| `date` | 日期 `YYYY-MM-DD` | 是 | 发布日期，决定排序与年份分组 |
| `description` | 字符串 | 否 | 摘要，用于 `<meta name="description">` 与 RSS |
| `updated` | 日期 | 否 | 更新日期 |
| `tags` | 字符串数组 | 否 | 标签，默认 `[]` |
| `draft` | 布尔 | 否 | 为 `true` 时仅在 `npm run dev` 中可见，不进入构建产物 |

### Frontmatter：AI对话 额外字段

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `ai` | 字符串 | 否 | 对话对象，如 `Claude Opus 5.5`，默认 `AI`；显示于元信息与每段 AI 发言上方 |
| `note` | 字符串 | 否 | 批注：记录保留理由，显示于正文之前 |

字段定义见 `src/content.config.ts`。frontmatter 不符合定义时构建失败，错误信息指出文件与字段。

### 对话记录格式

单独一行的 `@me` / `@ai` 标记一段发言的开始，持续至下一个标记：

```markdown
---
title: 标题
date: 2026-10-14
ai: Claude Opus 5.5
note: 保留理由
tags: [标签]
---

@me

提问内容

@ai

回答内容，可包含标题、列表、表格、代码块
```

处理由 `src/plugins/remark-chat-turns.mjs` 完成，输出 `<section class="turn turn-me">` / `<section class="turn turn-ai">`。不使用标题作为发言标记，因为 AI 回答本身常含 Markdown 标题。第一个标记之前的内容按普通正文渲染。

### 图片

放置于 `public/images/`，以根路径引用：`![说明](/images/name.jpg)`。

### 标签

标签由全部栏目内容的 `tags` 字段汇总生成，无需单独登记。重命名标签需修改所有使用该标签的内容文件。

## 本地开发

```bash
npm install        # 首次
npm run dev        # 开发服务器 http://localhost:4321，含草稿，文件修改后自动刷新
npm run build      # 构建到 dist/
npm run preview    # 预览 dist/
```

## 部署

`.github/workflows/deploy.yml` 在推送 `main` 分支或手动触发时运行：`npm ci` → `npm run build` → 上传 `dist/` → 发布至 GitHub Pages。

前置条件：仓库 Settings → Pages → Source 设为 **GitHub Actions**。

部署状态与日志见仓库 Actions 页面。

## 约定

样式、组件与代码注释的约定见 `AGENTS.md`。
