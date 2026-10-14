# chanc313 的博客

网址：<https://chanc313.github.io>

 [Astro](https://astro.build) 搭建

## 写文章

1. 在 `src/content/blog/` 里新建一个 `.md` 文件，文件名是文章网址，比如 `my-first-post.md` 对应 `/blog/my-first-post/`。

   ```yaml
   ---
   title: 文章标题
   description: 一句话简介（可选）
   date: 2026-10-14
   tags: [标签一, 标签二]
   draft: true   # 可选，写完删掉这一行就会发布
   ---
   ```

3. 用 Markdown 写正文。图片放进 `public/images/`，用 `![说明](/images/文件名.jpg)` 引用。
4. 提交并推送到 GitHub，网站自动更新。

不装任何软件：直接在 GitHub 网页上进入 `src/content/blog/`，点 **Add file → Create new file** 写文章并提交。

## 在自己电脑上预览

需要先装 [Node.js](https://nodejs.org)（22 或更新版本）。第一次：

```bash
git clone https://github.com/chanc313/chanc313.github.io.git
cd chanc313.github.io
npm install
```

之后每次预览：

```bash
npm run dev
```

打开 <http://localhost:4321>。改了文件，浏览器会自动刷新。草稿（`draft: true`）只在这里能看到。

## 文件结构：

```
src/
├── content/blog/      ← 文章
├── consts.ts          ← 网站名、首页介绍文字、GitHub 链接
├── pages/
│   ├── index.astro    ← 首页
│   ├── about.md       ← "关于"页的内容
│   ├── blog/          ← 文章页的模板
│   └── tags/          ← 标签页
├── layouts/           ← 页面外壳（<head>、页头页脚的组合）
├── components/        ← 页头、页脚、文章目录、深色切换按钮
└── styles/
    ├── tokens.css     ← 颜色、字体、字号、宽度
    └── global.css     ← 全站通用样式、文章正文排版
public/                ← 图片、图标等原样发布的文件
```

## AI-assistant

把这个仓库交给 AI（Claude Code、Cursor 等）时，它会先读 `CLAUDE.md` / `AGENTS.md` 了解项目规则。描述想要的**效果**，不说怎么实现。例如：

- "把强调色换成墨绿色，深色模式也要配套"
- "首页每篇文章标题下面加一行简介"
- "文章页加一个目录，长文章才显示"
- "加一个'读书'页面，列出我读过的书"

改完先 `npm run dev` 看效果。

## 前端学习

不用系统学，按需要一点点来：

1. 先改 `src/styles/tokens.css` 里的颜色和字号，理解"变量"的意思
2. 读一个组件，比如 `src/components/Footer.astro`：上面 `---` 之间是数据，中间是 HTML，下面是这个组件自己的 CSS
3. 让 AI 加功能时，看它改了哪些文件、为什么改
