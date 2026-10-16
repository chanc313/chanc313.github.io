# AI 维护规范

本文件写给维护本仓库的 AI（CLAUDE.md 指向本文件）。博客主人不一定阅读本文件：凡是博客主人需要知道的事，写进 `README.md` 或在对话中汇报，不能只写在这里。

本仓库是 chanc313 的个人博客，Astro 7 纯静态网站，GitHub Actions 部署到 GitHub Pages（https://chanc313.github.io）。

## 角色与汇报

- 网站由 AI 搭建和维护，博客主人是决策者，相当于上司。AI 对代码质量和可维护性负责。
- 每次改动后，用简短中文汇报：改了什么、为什么、读者能看到的变化（没有就说没有）、需要博客主人决定的事。只在有助于决策时解释技术原理，用一两句话说明白。
- **技术上不合理的要求，直接提出问题和替代方案**，不做不合理的技术妥协，除非博客主人明确要求按原样执行。
- 改变网址、外观或内容的决定由博客主人做；纯内部重构、检查、文档可直接做。
- **合并**：所有改动走 PR，不直接推送 `main`。PR 构建通过后由 AI 自行合并（博客主人 2026-10-16 授权）。涉及网址、外观或内容的 PR，等博客主人确认后再合并。
- 网站界面文字用中文。

## README 的写法

`README.md` 是写给博客主人（以及其他人类）的项目汇报，目标是不读代码也能完整理解项目：

- 内容：当前状态与待处理事项、读者看到的网站结构、架构概览、内容组织规则、发布流程、注意事项（含原因）、外部账号与服务、文件位置。
- 写法：陈述句，表格优先，说明"是什么、在哪里、有什么影响"，不堆实现细节。操作步骤、实现机制写在本文件。
- 结构、功能、待处理事项或外部服务变化时，同一个 PR 内更新 README，「当前状态」表保持准确。

## 技术约束

- **不引入 UI 框架**（React、Vue、Tailwind 等）。页面用 `.astro` 组件 + 原生 CSS，每一行都要容易读懂。真的需要依赖时先向博客主人说明理由。
- **颜色、字体、尺寸只在 `src/styles/tokens.css` 定义**，其他地方用 `var(--...)` 引用，不写死色值。新增颜色时，浅色和两段深色规则都要补上。
- 组件样式写在组件底部的 `<style>`（Astro 自动限定作用域）；只有全站通用规则放 `src/styles/global.css`。
- 正文排版统一用 `.prose`；对话记录的每段发言是 `.turn`，内部排版与 `.prose` 共用规则。
- 尽量不加客户端 JavaScript；需要交互时用组件内的 `<script>`，不依赖第三方库。
- **博客页面不加载第三方 JavaScript**（CDN 脚本、统计代码、外部组件等）。后台 `/admin/` 与博客同源，登录令牌存在同源 localStorage（键 `sveltia-cms.user`），第三方脚本可读取。需要第三方功能（如评论）时选 iframe 隔离的方案。
- 代码注释用中文，写清楚"这段是干什么的"。
- Markdown 用 unified（remark/rehype）管线（`astro.config.mjs` 的 `processor: unified(...)`）。自定义处理写成 remark/rehype 插件，放 `src/plugins/`。
- 全站文字设置（站名、首页介绍）在 `src/consts.ts`。

## 栏目

每个栏目在五处有同名对应，以 id `notes` 为例：

1. `src/columns.ts`：`COLUMNS` 中加一项（id、label、path、description）
2. `src/content.config.ts`：加同名集合 `notes`，loader 用 `bundles('./src/content/notes')`，schema 用 `entry` 或其扩展
3. 新建 `src/content/notes/`
4. 新建 `src/pages/notes/index.astro` 与 `src/pages/notes/[...slug].astro`（复制 `posts/` 的，改集合名）
5. `public/admin/config.yml`：加 `folder: src/content/notes` 的集合，字段与第 2 步一致

导航、首页、标签、RSS、资源发布都从 `src/columns.ts` 读取，无需另改。不要让某个栏目独占首页或站点根级网址。栏目特有的元信息与正文前内容，通过 `EntryLayout` 的 `meta`、`intro` 插槽和 `bodyClass` 在该栏目的 `[...slug].astro` 中补充。

### 结构检查

`src/integrations/structure-check.mjs` 在 `npm run dev` / `npm run build` 启动时检查，不通过即报错：

| 检查项 | 不检查时的后果 |
|---|---|
| 每个栏目有 `src/pages/<id>/index.astro` 与 `[...slug].astro` | 导航链接 404 |
| `public/admin/config.yml` 含每个栏目及 `pages` 的 `folder: src/content/<id>` | 后台缺少该栏目 |
| `src/content/` 下每个目录都是已登记栏目或 `pages` | 内容不生成页面 |
| 独立页面名不与 `src/pages/`、`public/` 顶层名称及 `_astro` 重名 | Astro 只警告并跳过该页面 |

后台字段与 `src/content.config.ts` 的逐项一致性不在检查范围内，改字段时人工核对。新增类似"漏改不报错"的约定时，把检查补进这个集成。

## 内容格式

字段定义在 `src/content.config.ts`。**改格式时同步修改 `public/admin/config.yml`**，并更新 README「每篇内容可填的信息」。可选字段用 `optional()` 包装，接受后台写入的 `''` 和 `null`。

| 字段 | 类型 | 适用 | 说明 |
|---|---|---|---|
| `title` | 字符串，必填 | 全部 | |
| `date` | `YYYY-MM-DD`，必填 | 栏目 | 排序与年份分组 |
| `description` | 字符串 | 全部 | `<meta name="description">` 与 RSS |
| `updated` | 日期 | 栏目 | |
| `tags` | 字符串数组 | 栏目 | 默认 `[]` |
| `draft` | 布尔 | 全部 | `true` 时仅 `npm run dev` 可见，资源不进入构建产物 |
| `ai` | 字符串 | chats | 默认 `AI`，显示于元信息与每段 AI 发言上方 |
| `note` | 字符串 | chats | 批注，显示于正文前 |

### 对话记录

单独一行的 `@me` / `@ai` 开始一段发言，持续到下一个标记。`src/plugins/remark-chat-turns.mjs` 输出 `<section class="turn turn-me">` / `<section class="turn turn-ai">`。不用标题做标记，因为 AI 回答本身常含标题。第一个标记之前的内容按普通正文渲染；插件对所有集合启用，不含标记的 Markdown 不受影响。

## 页面资源包

每个页面是 `src/content/<集合>/<页面名>/` 文件夹，正文为 `index.md`（或 `index.mdx`），私有资源放同一文件夹，用 `./` 相对路径引用。`public/` 只放全站共用资源，不放某个页面的私有资源。内容目录根部的散落 `.md` 会在启动时报错。

| 引用方式 | 处理 |
|---|---|
| `![说明](./photo.jpg)` | Astro 图片管线：压缩、转 WebP，输出到 `/_astro/`，原图不复制 |
| 其他相对引用（`<audio>`、`<video>`、HTML `<img>`、链接到文件） | `src/integrations/page-bundles.mjs` 构建后复制到页面网址下；开发服务器直接提供，支持 Range 请求 |

- 资源包内的 `.md` 与 `.` 开头的文件不发布；`draft: true` 页面的资源不发布。
- 相对引用依赖 `trailingSlash: 'always'`。
- 后台写入的引用不带 `./`（如 `photo.jpg`），与 `./photo.jpg` 等效。
- 文件夹名只用 ASCII（英文、拼音、连字符）。

## 内容管理后台

Sveltia CMS，入口 `public/admin/index.html`（版本固定在脚本网址中），配置 `public/admin/config.yml`。保存即提交到 `main`。

- 集合：`posts`、`chats`、`pages` 存为 `<folder>/{{slug}}/index.md`，`media_folder: ''` 使上传的素材进入页面文件夹；全站媒体库为 `public/shared/`。
- slug 只在新建时可编辑，保存后不可改，避免网址变化。
- 升级：改 `index.html` 中的版本号，在 `/admin/` 验证后提交，并更新 README 技术表中的版本。
- `src/components/AdminLink.astro` 是临时入口：检查 localStorage 中是否有令牌来显示「后台」链接，不读取令牌本身。重做入口时整个删除该组件及 `Header.astro` 中的引用。

### 后台登录服务

GitHub 登录经 Sveltia CMS Authenticator（Cloudflare Worker）完成 OAuth 授权码交换。`config.yml` 中 `base_url` 指向 Worker，`auth_scope: public_repo`。

初次部署：

1. 部署 <https://deploy.workers.cloudflare.com/?url=https://github.com/sveltia/sveltia-cms-auth>，得到 `https://sveltia-cms-auth.<子域>.workers.dev`
2. 注册 GitHub OAuth App（<https://github.com/settings/applications/new>），回调 `<Worker 网址>/callback`，生成 Client secret
3. Worker → Settings → Variables，全部用 Secret 类型：`GITHUB_CLIENT_ID`、`GITHUB_CLIENT_SECRET`、`ALLOWED_DOMAINS` = `chanc313.github.io`
4. `config.yml` 的 `backend` 下设 `base_url: <Worker 网址>`

自检：访问 `<Worker>/auth?provider=github&site_id=chanc313.github.io&scope=public_repo`，应跳转到 GitHub 授权页；空白页表示配置错误，错误信息在页面源代码中。OAuth App 启用了令牌过期，该授权服务不处理刷新令牌，令牌 8 小时后需重新登录。

## 部署

`.github/workflows/deploy.yml`：推送 `main` 或手动触发时 `npm ci` → `npm run build` → 上传 `dist/` → 发布。针对 `main` 的 PR 只构建不发布，按 PR 分组，不占用发布队列。仓库 Settings → Pages → Source 须为 GitHub Actions。

## 写作协作

- 博客主人可能贴来 Notion 笔记等素材。读懂素材后**根据内容写成博客**，再与博客主人一起修改；不做格式的一键转换，不把外部平台当作内容来源，不引用外部平台的文件链接（素材中的图片等文件下载后放进页面资源包）。
- 发布后以仓库为唯一内容来源。

## 设计方向

- 以阅读为中心：正文宽度约 40rem，单栏，左对齐。
- 配色：青灰纸色底、深石板色文字、靛蓝墨水色强调；深色模式同一套思路。
- 字体：标题用霞鹜文楷（LXGW WenKai Screen，npm 包 lxgw-wenkai-screen-webfont，随网站自托管），正文用系统中文无衬线字体。
- 克制：首页的大字介绍 + 按年份排列的目录是唯一的视觉重点，其他保持安静。不加卡片阴影、渐变、到处飞的动画。

## 检查

改完运行 `npm run build`，必须无报错。涉及外观的改动，用 `npm run dev` 在浏览器里同时检查浅色、深色和手机宽度。
