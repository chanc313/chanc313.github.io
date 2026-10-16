# chanc313.github.io

chanc313 的个人博客：<https://chanc313.github.io>

本文件是写给博客主人的项目汇报，说明网站现在是什么样、由哪些部分组成、哪些地方需要注意。网站由 AI 搭建和维护，AI 遵守的技术规范与维护步骤在 [`AGENTS.md`](AGENTS.md)。

## 当前状态

| 项目 | 状态 |
|---|---|
| 上线 | 2026-10-14，GitHub Pages |
| 栏目 | 文章（1 篇）、AI对话（1 篇） |
| 独立页面 | 关于（正文仍是占位文字） |
| 内容后台 | `/admin/` 可用，支持 GitHub 登录与访问令牌登录 |
| 自动检查 | 每次构建检查网站结构；PR 合并前自动构建一次 |

### 待处理

| 事项 | 说明 |
|---|---|
| 「关于」页正文 | 仍是占位文字，需要博客主人提供内容 |
| 页头「后台」链接 | 临时方案（`src/components/AdminLink.astro`），只在登录过后台的浏览器显示 |
| 导航里的独立页面 | 「标签」「关于」两个链接写在 `src/components/Header.astro` 中；在后台新建的独立页面不会自动进入导航，需要时可加一个「显示在导航」字段 |

## 网站结构（读者看到的）

| 网址 | 内容 |
|---|---|
| `/` | 一句大字介绍 + 全部栏目的内容，按年份排列，每条标注所属栏目 |
| `/posts/` | 栏目「文章」的目录 |
| `/posts/<页面名>/` | 一篇文章 |
| `/chats/` | 栏目「AI对话」的目录 |
| `/chats/<页面名>/` | 一段对话记录：按「我 / AI」分段显示，正文前可有一段批注 |
| `/tags/`、`/tags/<标签>/` | 全部标签；某个标签下的所有内容（跨栏目） |
| `/about/` 等 | 独立页面，不属于任何栏目 |
| `/rss.xml` | RSS 订阅，包含全部栏目 |
| `/admin/` | 内容管理后台（不对搜索引擎公开） |

页面外观：单栏、正文宽约 40rem、青灰纸色底与靛蓝强调色，支持浅色 / 深色切换，手机宽度下自动调整排版。标题用霞鹜文楷，正文用系统字体。

## 架构

```
 内容（Markdown）          规则与登记                 页面模板                 发布
 ─────────────────       ─────────────────       ─────────────────       ─────────────
 src/content/posts/  ┐   src/columns.ts          src/pages/   网址与页面一一对应
 src/content/chats/  ├─▶ 栏目登记表          ─▶   src/layouts/ 页面骨架          ─▶ GitHub Actions
 src/content/pages/  ┘   src/content.config.ts   src/components/ 页头、目录等       构建并发布到
                         每类内容可填的字段       src/styles/  颜色、字体、排版        GitHub Pages
```

- **内容与代码分开。** 文字和图片只放在 `src/content/`；改内容不需要碰代码，改外观也不需要碰内容。
- **一张栏目登记表。** `src/columns.ts` 列出全部栏目。导航、首页汇总、标签、RSS、资源发布都读这张表，新增栏目时它们自动跟上。
- **三层页面骨架。** 全站外壳（页头、页脚、深色模式）→ 栏目目录页 / 内容页 / 独立页面。所有栏目共用同一套内容页骨架，栏目之间的差别（如 AI对话 的批注）在各自的页面文件里补充。
- **外观集中管理。** 颜色、字体、尺寸只在 `src/styles/tokens.css` 定义一次，换配色只改这一个文件。
- **不依赖框架。** 页面由 Astro 在构建时生成纯 HTML，样式是原生 CSS，浏览器端只有几段很短的脚本（深色模式切换、后台入口）。不使用 React、Vue、Tailwind 等 UI 框架。

| 技术 | 用途 |
|---|---|
| [Astro](https://astro.build) 7 | 把 Markdown 和模板生成静态网页 |
| unified（remark / rehype） | Markdown 处理；对话分段等自定义规则写成插件，在 `src/plugins/` |
| Sveltia CMS 0.237.0 | 网页版内容后台，直接读写本仓库 |
| GitHub Actions + GitHub Pages | 自动构建与托管 |

## 内容的组织规则

### 栏目、独立页面、标签

| 类型 | 是什么 | 例子 |
|---|---|---|
| 栏目 | 一类按日期排列的内容，有自己的目录页，进入首页汇总和 RSS | 文章、AI对话 |
| 独立页面 | 不按日期排列的单页，网址在站点根目录 | 关于 |
| 标签 | 跨栏目的分类，由内容里的 `tags` 自动汇总，无需登记 | 建站记录、随笔 |

栏目之间是平行关系，没有哪个栏目独占首页。新开栏目由 AI 按 `AGENTS.md` 中的步骤完成，涉及五处文件；漏改任何一处，构建会直接报错并指出缺什么。

### 每个页面是一个文件夹

```
src/content/posts/hello-world/
├── index.md      正文
├── cover.jpg     这个页面自己的图片、音频、视频、PDF……
└── bgm.mp3
```

文件夹名就是网址的最后一段（`/posts/hello-world/`）。页面私有的素材与正文放在同一个文件夹，删除页面时素材一起删除。全站共用的素材放在 `public/`，后台上传的共用素材在 `public/shared/`（网址 `/shared/`）。

### 每篇内容可填的信息

| 字段 | 必填 | 说明 |
|---|---|---|
| 标题 | 是 | |
| 日期 | 是 | 决定排序与年份分组 |
| 摘要 | 否 | 用于搜索引擎与 RSS |
| 标签 | 否 | |
| 更新日期 | 否 | |
| 草稿 | 否 | 勾选后不发布，素材也不发布 |
| 对话对象 | 否 | 仅 AI对话，如 `Claude Opus 5.5` |
| 批注 | 否 | 仅 AI对话，说明这段对话为什么值得留下 |

对话记录用单独一行的 `@me` / `@ai` 标出每段发言的开始。字段缺失或格式不对时，构建失败并指出是哪个文件、哪个字段。

## 内容如何发布

```
后台 /admin/ 保存 ─┐
                   ├─▶ 提交到 main 分支 ─▶ 自动构建（通常一两分钟）─▶ 网站更新
AI 的 PR 被合并  ──┘
```

- **后台保存即发布。** 后台的每次保存直接提交到 `main`，不经过 PR 检查。如果某次保存导致构建失败，网站停留在上一个版本，不会出现坏页面；失败记录在仓库的 Actions 页面。
- **AI 的改动走 PR。** PR 会先构建一次（只构建不发布），通过后由 AI 合并；涉及网址、外观或内容的 PR 等博客主人确认后再合并。
- **仓库是唯一的内容来源。** Notion 等外部素材由 AI 改写成博客后放入仓库，网站不引用外部平台的文件链接。

## 注意事项

| 事项 | 原因 |
|---|---|
| 页面文件夹名建好后不要改 | 文件夹名即网址，改名后旧链接失效。后台已禁止修改 |
| 独立页面不能与已有网址重名，如 `tags`、`admin`、`posts` | 重名的页面会被跳过。构建会报错拦下 |
| 单个文件不超过 100MB | GitHub Pages 的限制；大视频宜放视频平台后嵌入 |
| 博客页面不加载第三方脚本（统计代码、外部组件等） | 后台登录令牌存在浏览器里，与博客同域名，第三方脚本能读到。评论等功能需选用隔离在 iframe 里的方案 |
| 后台登录令牌泄露时，到 GitHub 撤销 | 令牌有本仓库（访问令牌方式）或全部公开仓库（GitHub 登录方式）的写权限 |

## 外部账号与服务

网站本身只依赖 GitHub。后台的「GitHub 登录」额外依赖以下服务，均在博客主人的账号下：

| 服务 | 作用 | 位置 |
|---|---|---|
| Cloudflare Worker | 代为完成 GitHub 登录授权 | `https://sveltia-cms-auth.hjchanc313.workers.dev`，代码来自 fork `chanc313/sveltia-cms-auth` |
| GitHub OAuth App | 登录授权的应用 | `chanc313blog`，回调 `<Worker 网址>/callback` |

- Worker 的三个设置 `GITHUB_CLIENT_ID`、`GITHUB_CLIENT_SECRET`、`ALLOWED_DOMAINS`（值为 `chanc313.github.io`）必须设为 Secret 类型；普通类型在 Worker 重新部署时会被清空。
- GitHub 登录的令牌 8 小时过期，过期后重新登录即可。
- 不想依赖 Worker 时，可改用「Sign In Using Access Token」：在 GitHub → Settings → Developer settings → Fine-grained tokens 创建令牌，仓库只选 `chanc313/chanc313.github.io`，权限 Contents 设为 Read and write。
- Worker 的初次部署与自检步骤见 `AGENTS.md`「后台登录服务」。

## 文件位置

```
.
├── src/
│   ├── content/            内容：posts/ chats/ pages/，每个页面一个文件夹
│   ├── columns.ts          栏目登记表
│   ├── content.config.ts   每类内容可填的字段
│   ├── consts.ts           站名、首页介绍文字、GitHub 链接
│   ├── pages/              网址与页面模板（文件路径即网址）
│   ├── layouts/            页面骨架：全站外壳、栏目目录、内容页、独立页面
│   ├── components/         页头、页脚、年份目录、深色切换、后台入口
│   ├── styles/             tokens.css（颜色字体尺寸）、global.css（正文排版）
│   ├── plugins/            Markdown 自定义规则（对话分段）
│   └── integrations/       构建扩展：发布页面素材、检查网站结构
├── public/                 原样发布的文件：网站图标、后台 admin/、共用素材 shared/
├── .github/workflows/      自动构建与发布
├── AGENTS.md               AI 维护规范（CLAUDE.md 指向它）
└── README.md               本文件
```

站名和首页介绍文字在 `src/consts.ts`，可直接修改。

## 本地运行

需要 Node.js 22 或更高版本。

```bash
npm install        # 首次
npm run dev        # 本地预览 http://localhost:4321，含草稿
npm run build      # 生成正式网站到 dist/
```
