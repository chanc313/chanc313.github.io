---
title: Hello, world!
description: 本站的搭建记录：技术选型、内容组织、发布流程与写作格式。
date: 2026-10-14
tags: [随笔, 建站记录]
---

本站于 2026 年 10 月 14 日上线，托管于 GitHub Pages。本文记录初始搭建时的技术选型与结构，作为后续修改的基准。

## 技术选型

| 项目 | 选择 |
|---|---|
| 静态站点生成 | Astro 7 |
| 样式 | 原生 CSS，不使用主题与 UI 框架 |
| 内容格式 | Markdown |
| 托管与部署 | GitHub Pages，GitHub Actions 自动构建 |

选择 Astro 而非 Hugo、Hexo 等，原因是后者的定制通常依赖现成主题及其模板语法，修改深度受限于主题结构。Astro 的页面组件接近普通 HTML 与 CSS，站点的全部代码均位于本仓库，可在任意层级修改。

## 内容组织

站点内容分为平行的栏目，每个栏目对应独立的内容目录和网址：

| 栏目 | 内容目录 | 网址 |
|---|---|---|
| 文章 | `src/content/posts/` | `/posts/` |
| AI对话 | `src/content/chats/` | `/chats/` |

首页按年份汇总全部栏目的内容。标签跨栏目生效，由各条内容的 `tags` 字段自动汇总。

## 发布流程

日常写作在后台 `/admin/` 完成，保存即提交并触发部署。也可直接操作仓库：

1. 在对应栏目的内容目录中新建一个文件夹，正文写在其中的 `index.md`，文件夹名即网址的最后一段
2. 推送到 `main` 分支
3. GitHub Actions 执行构建，约两分钟后站点更新

## 写作格式

文件开头的 frontmatter 记录元信息：

```yaml
---
title: 标题
description: 摘要（可选，用于搜索引擎与 RSS）
date: 2026-10-14
tags: [标签一, 标签二]
draft: true   # 可选：草稿仅在本地开发环境中显示
---
```

正文支持标准 Markdown：**加粗**、*斜体*、[链接](https://chanc313.github.io)、行内代码 `npm run dev`、列表、表格、引用：

> 引用以行首的 `>` 标记。

代码块按语言高亮，配色随浅色/深色主题切换：

```js
function greet(name) {
  return `Hello, ${name}!`;
}
```

## 资源

每个页面是一个文件夹（资源包），页面私有的图片、音频、视频与正文放在同一文件夹内，以相对路径引用：

```
src/content/posts/hello-world/
├── index.md
├── photo.jpg      ![说明](./photo.jpg)，构建时自动压缩为 WebP
└── bgm.mp3        <audio controls src="./bgm.mp3"></audio>
```

多个页面共用的资源（排版背景图、通用音频等）存放于 `public/`，以根路径引用，如 `/shared/bg.jpg`。
