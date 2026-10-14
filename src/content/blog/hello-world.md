---
title: Hello, world!
description: 博客的第一篇文章，也是一份写作格式的示范。
date: 2026-10-14
tags: [随笔, 建站]
---

这是博客的第一篇文章。你现在看到的这一页，就是由一个普通的 Markdown 文件生成的：`src/content/blog/hello-world.md`。

写新文章只需要在同一个文件夹里新建一个 `.md` 文件，推送到 GitHub，几分钟后网站就会自动更新。

## 文章开头的信息

每篇文章最上面两条 `---` 之间的部分叫 frontmatter，用来填写标题、日期等信息：

```yaml
---
title: 文章标题
description: 一句话简介（可选，用于搜索引擎和 RSS）
date: 2026-10-14
tags: [标签一, 标签二]
draft: true   # 可选：草稿只在本地预览时显示，不会发布
---
```

## 常用的写作格式

正文用 Markdown 写，几种最常用的：

- **加粗**、*斜体*、[链接](https://chanc313.github.io)
- 列表，就像这一段
- 行内代码，比如 `npm run dev`

> 引用这样写：在行首加一个 `>`。

代码块会自动高亮，并且跟随深色模式变色：

```js
function greet(name) {
  return `你好，${name}`;
}
```

图片放在 `public/images/` 文件夹里，然后这样引用：`![说明文字](/images/图片名.jpg)`。

---

以上就是全部需要知道的。剩下的，就是写。
