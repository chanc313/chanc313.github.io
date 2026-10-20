# AI 维护规范

本文件写给维护本仓库的 AI（CLAUDE.md 指向本文件）。博客主人不一定阅读本文件：凡是博客主人需要知道的事，写进 `README.md` 或在对话中汇报，不能只写在这里。

本仓库是 chanc313 的个人博客，Astro 7 纯静态网站，GitHub Actions 部署到 GitHub Pages（https://chanc313.github.io）。

## 角色与汇报

- 网站由 AI 搭建和维护，博客主人是决策者，相当于上司。AI 对代码质量和可维护性负责。
- 每次改动后，用简短中文汇报：改了什么、为什么、读者能看到的变化（没有就说没有）、需要博客主人决定的事。只在有助于决策时解释技术原理，用一两句话说明白。
- **技术上不合理的要求，直接提出问题和替代方案**，不做不合理的技术妥协，除非博客主人明确要求按原样执行。
- 改变网址、外观或内容的决定由博客主人做；纯内部重构、检查、文档可直接做。
- **推送与合并**（博客主人 2026-10-16 授权）：AI 可以直接推送到 `main`，也可以自行合并自己的 PR。推送 `main` 即发布上线，所以推送前本地 `npm run build` 必须无报错。改动较大、想让 GitHub 先构建一遍时走 PR，构建通过后自行合并。涉及网址、外观或内容的改动，先得到博客主人确认再上线。
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
- 尽量不加客户端 JavaScript；需要交互时用组件内的 `<script>`，不依赖第三方库（例外：写作页打包 unified 管线与 KaTeX 做预览，只在 `/write/` 加载）。
- **博客页面不加载第三方 JavaScript**（CDN 脚本、统计代码、外部组件等）。后台 `/admin/` 与博客同源，登录令牌存在同源 localStorage（键 `sveltia-cms.user`），第三方脚本可读取。需要第三方功能（如评论）时选 iframe 隔离的方案。
- 代码注释用中文，写清楚"这段是干什么的"。
- Markdown 用 unified（remark/rehype）管线（`astro.config.mjs` 的 `processor: unified(...)`）。插件清单在 `src/plugins/markdown.mjs`（构建与写作页预览共用）；自定义处理写成 remark/rehype 插件，放 `src/plugins/`。
- 数学公式：remark-math + rehype-katex，构建时输出 HTML。KaTeX 样式 `src/styles/math.css` 在 `EntryLayout`、`PageLayout`、写作页引入。`katex` 版本须与 rehype-katex 依赖的版本一致（`npm ls katex` 只应有一份），否则样式与输出可能不匹配。
- 全站文字设置（站名、首页介绍）在 `src/consts.ts`。

## 栏目

每个栏目在五处有同名对应，以 id `notes` 为例：

1. `src/columns.ts`：`COLUMNS` 中加一项（id、label、path、description）
2. `src/content.config.ts`：加同名集合 `notes`，loader 用 `bundles('./src/content/notes')`，schema 用 `entry` 或其扩展
3. 新建 `src/content/notes/`
4. 新建 `src/pages/notes/index.astro` 与 `src/pages/notes/[...slug].astro`（复制 `posts/` 的，改集合名）
5. `public/admin/config.yml`：加 `folder: src/content/notes` 的集合，字段与第 2 步一致

导航、首页、标签、RSS、资源发布都从 `src/columns.ts` 读取，无需另改。不要让某个栏目独占首页或站点根级网址。栏目数量由博客主人控制（2026-10-18：文章、项目、技术理论），细分主题用标签或目录；不要为新主题主动提议开栏目。栏目本身不进目录树（2026-10-20 建议保持固定，等博客主人确认）。栏目特有的元信息与正文前内容，通过 `NodeLayout` 的 `meta`、`intro` 插槽在该栏目的 `[...slug].astro` 中补充（如 posts 的 `ai`、`note`）。`columns.ts` 的 `pinnedNav` 决定宽屏时目录侧栏是否常驻（只有项目为 true）。

### 目录树

博客主人 2026-10-20 定：栏目以下是一棵树，加话题、系列、章节、项目、项目下的日志都只是在某个节点下新建子页面，网址即路径。取代了原来的话题集合 + `topic`/`series` 字段（技术理论）和 `project` 字段（项目）。

- 页面类型 `kind`：`article`（默认）或 `folder`。目录的 `index.md` 正文可空；上级关系只由文件夹路径决定，不是字段。集合 loader 用 `bundles()` 的 `**/index.{md,mdx}`，条目 id 是相对路径（`ros/notes`）。
- `getTree(column)`（`src/utils.ts`）：校验每层文件夹都有 `index.md`、上级必须是目录，不符合时抛错（这是结构检查之外的另一道检查）；生产构建隐藏草稿及草稿目录的全部后代；按阅读顺序排好 `children`（子目录在前，`order` 再日期；文章按日期从早到晚）。`treePaths()` 生成各栏目 `[...slug].astro` 的 `getStaticPaths`。
- 首页、标签、RSS 用 `getEntries()`：文章 + 有正文的目录；只用来归类的空目录不算。
- `src/layouts/NodeLayout.astro` 统一渲染：文章、有正文的目录走 `EntryLayout`；没正文的目录是年份目录（`indexItems()`，子目录算一项，日期取目录下最新文章，标「共 N 篇」），不显示大标题，子目录页上方有路径行。
- `columnOverride`：目录页显示自己的名称、链接上级；文章显示上级目录名、链接上级目录。即点击回到上一级。
- 翻页只在同一目录的文章之间（`EntryLayout` 的 `prev`、`next`）；不在目录里的文章不翻页（博客主人 2026-10-18）。
- 侧栏 `src/components/FolderNav.astro` + `FolderTree.astro`（递归，`Astro.self`）+ `Outline.astro`：目录里的每一页都有，列出所在一级目录的整棵树，当前路径展开、其他目录收起显示篇数，当前页下列出二、三级标题。宽屏 `position: fixed`，悬停、键盘聚焦或点击把手（`data-open`）时展开；手机（< 48rem）为页面顶部的折叠目录。`pinned`（项目）配合 `BaseLayout` 的 `wide`：≥ 68rem 时整页容器加宽到 `--measure-wide`，`.with-sidebar`（`global.css`）排成「15rem 侧栏 + 3rem 间距 + 正文」两列，侧栏 `sticky` 常驻；博客主人 2026-10-19 先要左侧常驻，后嫌两侧留白太大，故不用贴窗口边缘的固定侧栏。68rem 断点写在 `global.css` 与 `FolderNav` 两处，改时一起改。
- 这次改动推翻了两条旧决定，由博客主人在 PR 里确认：「项目只有两级」（2026-10-19）和「侧栏只列本系列」（2026-10-18）。
- `/theory/` 是一级目录（话题）的扁平列表（同标签页，不显示简介），根下的文章列在「未归入话题」。话题由博客主人维护，不要主动增删。话题与标签可以同名，是博客主人的决定，不要提议合并。

### 结构检查

`src/integrations/structure-check.mjs` 在 `npm run dev` / `npm run build` 启动时检查，不通过即报错：

| 检查项 | 不检查时的后果 |
|---|---|
| 每个栏目有 `src/pages/<id>/index.astro` 与 `[...slug].astro` | 导航链接 404 |
| `public/admin/config.yml` 含每个栏目及 `pages` 的 `folder: src/content/<id>` | 后台缺少该栏目 |
| `src/content/` 下每个目录都是已登记栏目或 `pages` | 内容不生成页面 |
| 独立页面名不与 `src/pages/`、`public/` 顶层名称及 `_astro` 重名 | Astro 只警告并跳过该页面 |

目录树的结构（每层有 `index.md`、文章下不放页面）由 `getTree()` 在生成页面时检查。后台字段与 `src/content.config.ts` 的逐项一致性不在检查范围内，改字段时人工核对。新增类似"漏改不报错"的约定时，把检查补进这个集成。

## 内容格式

字段定义在 `src/content.config.ts`。**改格式时同步修改 `public/admin/config.yml` 与写作页（`src/pages/write.astro` 的表单、`src/scripts/writer.ts` 的 `buildMarkdown()`）**，并更新 README「每篇内容可填的信息」。可选字段用 `optional()` 包装，接受后台写入的 `''` 和 `null`。

| 字段 | 类型 | 适用 | 说明 |
|---|---|---|---|
| `title` | 字符串，必填 | 全部 | |
| `kind` | `article` / `folder` | 栏目 | 默认 `article`；见「目录树」 |
| `date` | `YYYY-MM-DD`，必填 | 栏目 | 排序与年份分组；目录在年份目录里按其下最新文章的日期排 |
| `description` | 字符串 | 全部 | `<meta name="description">` 与 RSS |
| `updated` | 日期 | 栏目 | |
| `tags` | 字符串数组 | 栏目 | 默认 `[]` |
| `draft` | 布尔 | 全部 | `true` 时仅 `npm run dev` 可见，资源不进入构建产物 |
| `ai` | 字符串 | posts | 对话对象；填了才显示于元信息，也是每段 AI 发言上方的名称（未填时插件用 `AI`） |
| `note` | 字符串 | posts | 批注，显示于正文前 |
| `order` | 数字 | 栏目 | 只对目录有效：在上级目录里小的在前，默认 0，相同按日期 |

### 对话记录

单独一行的 `@me` / `@ai` 开始一段发言，持续到下一个标记。`src/plugins/remark-chat-turns.mjs` 输出 `<section class="turn turn-me">` / `<section class="turn turn-ai">`。不用标题做标记，因为 AI 回答本身常含标题。对话记录发在 `posts`，打标签 `AI对话`（原 `chats` 栏目已并入，旧网址在 `astro.config.mjs` 的 `redirects` 跳转）。第一个标记之前的内容按普通正文渲染；插件对所有集合启用，不含标记的 Markdown 不受影响。

## 页面资源包

每个页面是 `src/content/<集合>/<路径>/` 文件夹（栏目里可嵌套，独立页面只有一层），正文为 `index.md`（或 `index.mdx`），私有资源放同一文件夹，用 `./` 相对路径引用。目录文件夹里含 `index.md` 的子文件夹是下一层页面，不算它的资源（`page-bundles.mjs` 的 `listResources`）。`public/` 只放全站共用资源，不放某个页面的私有资源。内容目录根部的散落 `.md` 会在启动时报错。

| 引用方式 | 处理 |
|---|---|
| `![说明](./photo.jpg)` | Astro 图片管线：压缩、转 WebP，输出到 `/_astro/`，原图不复制 |
| 其他相对引用（`<audio>`、`<video>`、HTML `<img>`、链接到文件） | `src/integrations/page-bundles.mjs` 构建后复制到页面网址下；开发服务器直接提供，支持 Range 请求 |

- 资源包内的 `.md` 与 `.` 开头的文件不发布；没有生成页面的资源包（`draft: true`、所在目录是草稿）资源不发布：`page-bundles.mjs` 以 `dist/` 里是否有该页的 `index.html` 为准。
- 相对引用依赖 `trailingSlash: 'always'`。
- 后台写入的引用不带 `./`（如 `photo.jpg`），与 `./photo.jpg` 等效。
- 文件夹名只用 ASCII（英文、拼音、连字符）。

## 内容管理后台

Sveltia CMS，入口 `public/admin/index.html`（版本固定在脚本网址中），配置 `public/admin/config.yml`。保存即提交到 `main`。

- 集合：各栏目与 `pages` 存为 `<folder>/{{slug}}/index.md`，`media_folder: ''` 使上传的素材进入页面文件夹；全站媒体库为 `public/shared/`。
- 栏目集合是 Sveltia 的嵌套集合：`nested`（默认 `subfolders: true`，每个页面一个文件夹）+ `meta: { path: { index_file: index } }` + `path: '{{slug}}/index'`（`path` 的最后一段须与 `index_file` 一致）。新建时先在左侧进入目标目录；编辑页的上级文件夹选择器可移动页面（连同子页面和素材，一次提交），会改变网址。正文 `required: false`，因为目录可以没有正文。
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

## 前台写作页

`/write/`（`src/pages/write.astro` + `src/scripts/writer.ts`）供博客主人在前台新建文章或目录，不经过后台。只做新建；修改、删除、移动留在后台。

- 登录：读取后台保存的令牌（`src/scripts/login.ts` 的 `getToken()`），不自己做登录。令牌 401 时提示去 `/admin/` 重新登录，表单内容保留。
- 入口：`src/components/WriteLink.astro`，有令牌才显示。栏目目录页（`ColumnLayout`）、`/theory/`、目录页放「+」，`FolderNav` 底部放「在「某目录」里新建」。网址参数 `column`、`parent`（目录路径）、`kind` 预选表单。
- 构建时数据：栏目、各栏目的目录（按目录树顺序，显示标题路径；取自 `getTree()`，生产构建不含草稿目录）、各栏目已占用的页面路径（含草稿），以 JSON 嵌入页面。网址名只填最后一段，不能含 `/`；发布前再用 `GET /contents/...` 确认目录不存在。新建目录后把它加进本页的目录列表并选中，便于接着写第一篇。
- 发布：GitHub Git Data API（blobs → trees → commits → 更新 `refs/heads/main`，ref 冲突时重试），文章与图片一次提交，路径 `src/content/<栏目>/<目录路径>/<网址名>/`。仓库名在 `src/consts.ts` 的 `REPO`。frontmatter 字符串用 `JSON.stringify` 写（合法 YAML）。
- 草稿：文字存 localStorage（`write-draft`），图片存 IndexedDB（库 `write-draft`）。发布或「清空」后删除。只提交正文仍引用的图片。
- 预览在浏览器里跑与构建相同的插件清单（`src/plugins/markdown.mjs`），只缺 Shiki 代码高亮与图片优化。插件改动只改这个清单。
- 工具栏：`write.astro` 的 `data-tool` 按钮对应 `writer.ts` 的 `TOOLS`。插入走 `replaceRange()`，用 `execCommand('insertText')` 保留撤销记录。
- 写作页 `noindex`，不进 sitemap（`astro.config.mjs` 的 `filter`）。

## 部署

`.github/workflows/deploy.yml`：推送 `main` 或手动触发时 `npm ci` → `npm run build` → 上传 `dist/` → 发布。针对 `main` 的 PR 只构建不发布，按 PR 分组，不占用发布队列。仓库 Settings → Pages → Source 须为 GitHub Actions。

## 写作协作

- 博客主人可能贴来 Notion 笔记等素材。读懂素材后**根据内容写成博客**，再与博客主人一起修改；不做格式的一键转换，不把外部平台当作内容来源，不引用外部平台的文件链接（素材中的图片等文件下载后放进页面资源包）。
- 发布后以仓库为唯一内容来源。

## 设计方向

- 目录类页面（栏目首页、标签、没有正文的目录）不显示大标题（博客主人 2026-10-18），`<h1>` 保留为 `visually-hidden`，供读屏软件与搜索引擎使用。

- 以阅读为中心：正文宽度约 40rem，单栏，左对齐。
- 配色：青灰纸色底、深石板色文字、靛蓝墨水色强调；深色模式同一套思路。
- 字体：标题用霞鹜文楷（LXGW WenKai Screen，npm 包 lxgw-wenkai-screen-webfont，随网站自托管），正文用系统中文无衬线字体。
- 克制：首页的大字介绍 + 按年份排列的目录是唯一的视觉重点，其他保持安静。不加卡片阴影、渐变、到处飞的动画。

## 检查

改完运行 `npm run build`，必须无报错。涉及外观的改动，用 `npm run dev` 在浏览器里同时检查浅色、深色和手机宽度。
