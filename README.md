# chanc313 的博客

网址：<https://chanc313.github.io>

用 [Astro](https://astro.build) 搭建，没有套用现成主题，所有页面和样式都在这个仓库里，可以随意改。

## 写文章

1. 在 `src/content/blog/` 里新建一个 `.md` 文件，文件名就是文章网址，比如 `my-first-post.md` 对应 `/blog/my-first-post/`。建议用英文或拼音命名。
2. 文件开头写上：

   ```yaml
   ---
   title: 文章标题
   description: 一句话简介（可选）
   date: 2026-10-14
   tags: [标签一, 标签二]
   draft: true   # 可选，写完删掉这一行就会发布
   ---
   ```

3. 下面用 Markdown 写正文。图片放进 `public/images/`，用 `![说明](/images/文件名.jpg)` 引用。
4. 提交并推送到 GitHub，大约两分钟后网站自动更新。

不想装任何软件也可以：直接在 GitHub 网页上进入 `src/content/blog/`，点 **Add file → Create new file** 写文章并提交。

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

## 文件结构：哪里管什么

```
src/
├── content/blog/      ← 文章（你主要只动这里）
├── consts.ts          ← 网站名、首页介绍文字、GitHub 链接
├── pages/
│   ├── index.astro    ← 首页
│   ├── about.md       ← "关于"页的内容
│   ├── blog/          ← 文章页的模板
│   └── tags/          ← 标签页
├── layouts/           ← 页面外壳（<head>、页头页脚的组合）
├── components/        ← 页头、页脚、文章目录、深色切换按钮
└── styles/
    ├── tokens.css     ← 颜色、字体、字号、宽度（改外观先看这里）
    └── global.css     ← 全站通用样式、文章正文排版
public/                ← 图片、图标等原样发布的文件
```

## 让 AI 帮你改

把这个仓库交给 AI（Claude Code、Cursor 等）时，它会先读 `CLAUDE.md` / `AGENTS.md` 了解项目规则。描述你想要的**效果**就行，不用说怎么实现，例如：

- "把强调色换成墨绿色，深色模式也要配套"
- "首页每篇文章标题下面加一行简介"
- "文章页加一个目录，长文章才显示"
- "加一个'读书'页面，列出我读过的书"

改完先 `npm run dev` 看效果，满意再推送。

## 学前端的建议路径

不用系统学，按需要一点点来：

1. 先改 `src/styles/tokens.css` 里的颜色和字号，理解"变量"的意思
2. 读一个组件，比如 `src/components/Footer.astro`：上面 `---` 之间是数据，中间是 HTML，下面是这个组件自己的 CSS
3. 让 AI 加功能时，看它改了哪些文件、为什么改
