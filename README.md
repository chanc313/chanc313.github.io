# chanc313.github.io

个人博客。站点地址：<https://chanc313.github.io>

## 技术栈

| 项目 | 说明 |
|---|---|
| 框架 | [Astro](https://astro.build) 7，输出纯静态 HTML |
| 样式 | 原生 CSS，设计变量集中于 `src/styles/tokens.css`；未使用 UI 框架 |
| 内容 | Markdown，经 Astro Content Collections 校验 |
| 代码高亮 | Shiki（Astro 内置），浅色 `github-light` / 深色 `github-dark` |
| 字体 | 标题：霞鹜文楷 LXGW WenKai Screen（`lxgw-wenkai-screen-webfont`，自托管，按 unicode-range 分片加载）；正文：系统中文无衬线字体 |
| 部署 | GitHub Actions → GitHub Pages，推送 `main` 分支触发 |
| 运行环境 | Node.js ≥ 22 |

## 目录结构

```
.
├── .github/workflows/deploy.yml   构建与部署流程
├── public/                        原样复制到站点根目录的静态文件（favicon、图片等）
├── src/
│   ├── content/blog/              文章（Markdown）
│   ├── content.config.ts          文章 frontmatter 的字段定义与校验
│   ├── consts.ts                  站点名称、描述、首页介绍文字、外部链接
│   ├── utils.ts                   文章读取、排序、按年分组、标签统计、日期格式化
│   ├── pages/                     路由：文件路径即网址
│   │   ├── index.astro            /
│   │   ├── about.md               /about/
│   │   ├── 404.astro              /404.html
│   │   ├── rss.xml.js             /rss.xml
│   │   ├── blog/[...slug].astro   /blog/<文件名>/
│   │   └── tags/
│   │       ├── index.astro        /tags/
│   │       └── [tag].astro        /tags/<标签>/
│   ├── layouts/
│   │   ├── BaseLayout.astro       全站外壳：<head>、页头、页脚、主题初始化
│   │   └── AboutLayout.astro      独立 Markdown 页面的布局
│   ├── components/
│   │   ├── Header.astro           站名与导航
│   │   ├── Footer.astro           页脚
│   │   ├── PostIndex.astro        按年份分组的文章目录
│   │   └── ThemeToggle.astro      浅色/深色切换
│   └── styles/
│       ├── tokens.css             设计变量：颜色、字体、字号、版心宽度
│       └── global.css             全站基础样式与 `.prose` 正文排版
├── astro.config.mjs               站点地址、插件、Markdown 配置
├── AGENTS.md / CLAUDE.md          面向 AI 编码助手的项目约定
└── package.json
```

## 文章

### 文件与网址

文章位于 `src/content/blog/`，文件名决定网址：`my-post.md` → `/blog/my-post/`。文件名建议使用英文或拼音，避免网址中出现编码后的中文。

### Frontmatter

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `title` | 字符串 | 是 | 标题 |
| `date` | 日期 `YYYY-MM-DD` | 是 | 发布日期，决定排序与年份分组 |
| `description` | 字符串 | 否 | 摘要，用于 `<meta name="description">` 与 RSS |
| `updated` | 日期 | 否 | 更新日期，显示于文章页 |
| `tags` | 字符串数组 | 否 | 标签，默认 `[]` |
| `draft` | 布尔 | 否 | 为 `true` 时仅在 `npm run dev` 中可见，不进入构建产物 |

示例：

```yaml
---
title: 文章标题
description: 一句话摘要
date: 2026-10-14
tags: [标签一, 标签二]
draft: true
---
```

字段定义见 `src/content.config.ts`。frontmatter 不符合定义时构建失败，并在错误信息中指出文件与字段。

### 图片

放置于 `public/images/`，以根路径引用：`![说明](/images/name.jpg)`。

### 标签

标签由各文章 `tags` 字段汇总生成，无需单独登记。重命名标签需修改所有使用该标签的文章。

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
