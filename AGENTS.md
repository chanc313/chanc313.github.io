# 给 AI 助手的项目说明

这是 chanc313 的个人博客，用 Astro 7 构建的纯静态网站，通过 GitHub Actions 部署到 GitHub Pages（https://chanc313.github.io）。

## 关于博客主人

- 负责写内容，前端由 AI 协助完成。能看懂 CSS/JS 的意图，但没有系统学过前端，正在边做边学。
- 修改代码后，用简短中文说明改了哪些文件、为什么这样改，帮助他学习。不要只给结果。
- 网站界面文字用中文。
- **技术上不合理的要求，直接质疑、提出建议或反驳，不做不合理的技术妥协**，除非博客主人明确要求按原样执行。

## 项目约定

- **不引入 UI 框架**（React、Vue、Tailwind 等）。页面用 `.astro` 组件 + 原生 CSS 写成，保持每一行都容易读懂。真的需要时先说明理由。
- **颜色、字体、尺寸只在 `src/styles/tokens.css` 里定义**，其他地方用 `var(--...)` 引用，不写死色值。新增颜色时，浅色和两段深色规则都要补上。
- 组件自己的样式写在组件底部的 `<style>` 里（Astro 会自动限定作用域）；只有全站通用规则才放 `src/styles/global.css`。
- 正文排版统一用 `.prose` 类；对话记录的每段发言是 `.turn`，内部排版与 `.prose` 共用规则。
- 尽量不加客户端 JavaScript；需要交互时用组件内的 `<script>`，不依赖第三方库。
- **博客页面不加载第三方 JavaScript**（CDN 脚本、统计代码、外部组件等）。后台 `/admin/` 与博客同源，后台登录令牌存在同源 localStorage 中，第三方脚本可读取。需要第三方功能（如评论）时，选 iframe 隔离的方案。
- 代码里的注释用中文，写清楚"这段是干什么的"。
- **栏目平行**：每个栏目在 `src/columns.ts` 登记，并在 `src/content/<id>/`、`src/pages/<id>/`、`src/content.config.ts` 中各有同名对应。不要让某个栏目独占首页或站点根级网址。新增栏目的步骤见 README。
- **页面资源包**：每个页面是 `src/content/<集合>/<页面名>/` 文件夹，正文为 `index.md`，页面私有资源（图片、音视频等）放在同一文件夹，用 `./` 相对路径引用。`public/` 只放全站共用资源。不要把某个页面的私有资源放进 `public/`。私有资源的发布由 `src/integrations/page-bundles.mjs` 负责。
- 内容格式在 `src/content.config.ts` 定义。**改格式时同步修改后台配置 `public/admin/config.yml`**（Sveltia CMS），并更新 README 里的说明。可选字段用 `optional()` 包装，以接受后台写入的空值。
- Markdown 用 unified（remark/rehype）管线处理（`astro.config.mjs` 中的 `processor: unified(...)`）。自定义 Markdown 处理写成 remark/rehype 插件，放在 `src/plugins/`。
- 全站文字设置（站名、首页介绍）在 `src/consts.ts`。
- `README.md` 是客观的技术记录：陈述句，说明"是什么、在哪里、怎么用"，不用第二人称、不用对话或劝说口吻。结构或功能变化时同步更新。

## 写作协作

- 博客主人可能贴来 Notion 笔记等素材。AI 读懂素材后**根据内容写成博客**，再与博客主人一起修改；不做格式的一键转换，不把外部平台当作内容来源，不引用外部平台的文件链接（素材中的图片等文件下载后放进页面资源包）。
- 发布后以仓库为唯一内容来源。

## 设计方向

- 以阅读为中心：正文宽度约 40rem，单栏，左对齐。
- 配色：青灰纸色底、深石板色文字、靛蓝墨水色强调；深色模式同一套思路。
- 字体：标题用霞鹜文楷（LXGW WenKai Screen，npm 包 lxgw-wenkai-screen-webfont，随网站自托管），正文用系统中文无衬线字体。
- 克制：首页的大字介绍 + 按年份排列的目录是唯一的视觉重点，其他保持安静。不加卡片阴影、渐变、到处飞的动画。

## 检查

改完运行 `npm run build`，必须无报错。涉及外观的改动，用 `npm run dev` 在浏览器里同时检查浅色、深色和手机宽度。
