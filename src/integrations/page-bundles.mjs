// Astro 集成：发布页面资源包里的私有资源。
//
// 每个页面是一个文件夹（资源包），例如：
//   src/content/posts/hello-world/
//   ├── index.md        正文
//   ├── cover.jpg       私有资源
//   └── bgm.mp3
// 栏目里的目录也是资源包，它的子文件夹里有 index.md 的是下一层页面，不算它的资源：
//   src/content/theory/ros/            /theory/ros/
//   ├── index.md
//   └── notes/                         /theory/ros/notes/（另一个资源包）
//
// 资源的处理方式：
//   - Markdown 图片语法 ![](./cover.jpg)：由 Astro 原生处理（压缩、转 WebP），不经过本集成。
//   - 其他相对引用，如 <audio src="./bgm.mp3">、<video>、链接到 PDF、HTML 里的 <img>：
//     本集成把资源包里除 Markdown 以外的所有文件，复制到页面网址下，
//     使 ./bgm.mp3 在 /posts/hello-world/ 页面上能找到 /posts/hello-world/bgm.mp3。
//
// 三个时机：
//   1. 启动时（开发与构建）：检查内容目录，散落在资源包外的 .md 文件直接报错，避免被静默忽略。
//   2. 开发时：拦截对 /<网址>/<文件> 的请求，直接返回资源包里的文件。
//   3. 构建完成后：把资源复制进 dist/。没有生成页面的（草稿等）不复制，避免草稿素材被公开。

import { readdirSync, readFileSync, statSync, existsSync, mkdirSync, copyFileSync, createReadStream } from 'node:fs';
import { join, dirname, extname, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * @param {{ bundles: { dir: string, url: string }[] }} options
 *   dir：内容目录（相对项目根目录）；url：该目录下页面的网址前缀
 */
export default function pageBundles({ bundles }) {
  let root = '';

  return {
    name: 'page-bundles',
    hooks: {
      'astro:config:setup': ({ config }) => {
        root = fileURLToPath(config.root);
        for (const { dir } of bundles) checkLooseMarkdown(join(root, dir));
      },

      'astro:server:setup': ({ server }) => {
        server.middlewares.use((req, res, next) => {
          const file = resolveRequest(root, bundles, decodeURIComponent((req.url ?? '').split('?')[0]));
          if (!file) return next();
          const size = statSync(file).size;
          res.setHeader('Content-Type', MIME[extname(file).toLowerCase()] ?? 'application/octet-stream');
          res.setHeader('Accept-Ranges', 'bytes');
          // 音视频拖动进度条时，浏览器只请求文件的一段（Range 请求）
          const range = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range ?? '');
          if (range && (range[1] || range[2])) {
            const start = range[1] ? Number(range[1]) : Math.max(0, size - Number(range[2]));
            const end = range[1] && range[2] ? Math.min(Number(range[2]), size - 1) : size - 1;
            res.statusCode = 206;
            res.setHeader('Content-Range', `bytes ${start}-${end}/${size}`);
            res.setHeader('Content-Length', end - start + 1);
            createReadStream(file, { start, end }).pipe(res);
          } else {
            res.setHeader('Content-Length', size);
            createReadStream(file).pipe(res);
          }
        });
      },

      'astro:build:done': ({ dir: outDir, logger }) => {
        const out = fileURLToPath(outDir);
        let count = 0;
        for (const { dir, url } of bundles) {
          for (const bundle of listBundles(join(root, dir))) {
            // 没有生成页面的资源包不复制：草稿，或所在目录是草稿，避免素材被公开
            if (!existsSync(join(out, url, bundle.name, 'index.html'))) continue;
            const imageOnly = imageOnlyRefs(bundle.index);
            for (const file of listResources(bundle.path)) {
              // 只以 ![](./x) 形式引用的图片已由 Astro 压缩输出，原图不再复制
              if (imageOnly.has(relative(bundle.path, file).split(sep).join('/'))) continue;
              const target = join(out, url, bundle.name, relative(bundle.path, file));
              mkdirSync(dirname(target), { recursive: true });
              copyFileSync(file, target);
              count++;
            }
          }
        }
        logger.info(`已复制 ${count} 个页面私有资源`);
      },
    },
  };
}

/** 文件夹里的 index.md 或 index.mdx；没有时返回 undefined */
const indexFile = (dir) => ['index.md', 'index.mdx'].map((f) => join(dir, f)).find(existsSync);

/**
 * 列出内容目录下的所有资源包（含 index.md 或 index.mdx 的文件夹，各层都算）。
 * name 是相对内容目录的路径，如 ros/notes，与页面网址对应
 */
function listBundles(contentDir, prefix = '') {
  if (!existsSync(contentDir)) return [];
  return readdirSync(contentDir, { withFileTypes: true })
    .filter((d) => d.isDirectory() && !d.name.startsWith('.'))
    .flatMap((d) => {
      const path = join(contentDir, d.name);
      const name = prefix + d.name;
      const index = indexFile(path);
      return [...(index ? [{ name, path, index }] : []), ...listBundles(path, `${name}/`)];
    });
}

/** 列出资源包里除 Markdown 以外的所有文件（含子文件夹），跳过隐藏文件和下一层页面的文件夹 */
function listResources(dir) {
  const files = [];
  for (const d of readdirSync(dir, { withFileTypes: true })) {
    if (d.name.startsWith('.')) continue;
    const path = join(dir, d.name);
    if (d.isDirectory()) {
      if (!indexFile(path)) files.push(...listResources(path));
    } else if (!/\.mdx?$/.test(d.name)) files.push(path);
  }
  return files;
}

/**
 * 找出只通过 Markdown 图片语法 ![](./x) 引用的文件（返回相对资源包的路径集合）。
 * 同一文件若还在别处出现（如 HTML 的 <img src="./x">、链接），则不算，仍需复制。
 */
function imageOnlyRefs(indexFile) {
  const text = readFileSync(indexFile, 'utf-8');
  // Markdown 图片里的相对路径：./photo.jpg 或 photo.jpg（CMS 写入的是后者）；排除 / 开头和网址
  const imageRef = /!\[[^\]]*\]\(<?(?:\.\/)?((?![a-z]+:|\/)[^)\s>]+)/gi;
  const asImage = new Map();
  for (const [, ref] of text.matchAll(imageRef)) asImage.set(ref, (asImage.get(ref) ?? 0) + 1);

  const result = new Set();
  for (const [ref, count] of asImage) {
    // 文件名在全文中出现的次数等于作为图片出现的次数，说明没有别处引用
    const total = text.split(ref).length - 1;
    if (total === count) result.add(decodeURI(ref));
  }
  return result;
}

/** 内容目录根部不允许直接放 .md：每个页面必须是文件夹 */
function checkLooseMarkdown(contentDir) {
  if (!existsSync(contentDir)) return;
  const loose = readdirSync(contentDir).filter((f) => /\.mdx?$/.test(f));
  if (loose.length > 0) {
    throw new Error(
      `${contentDir} 下有未放入文件夹的 Markdown：${loose.join('、')}。\n` +
        `每个页面需要是一个文件夹，正文命名为 index.md，例如 ${loose[0].replace(/\.mdx?$/, '')}/index.md`,
    );
  }
}

/**
 * 开发时：把请求网址对应到资源包里的文件；对应不上返回 null。
 * 网址与文件位置一一对应（/theory/ros/notes/a.png → src/content/theory/ros/notes/a.png），与构建后相同
 */
function resolveRequest(root, bundles, pathname) {
  for (const { dir, url } of bundles) {
    if (!pathname.startsWith(url)) continue;
    const rest = pathname.slice(url.length).split('/');
    if (rest.length < 2 || !rest.at(-1)) continue; // 至少要有 <页面名>/<文件>
    const contentDir = join(root, dir);
    const file = join(contentDir, ...rest);
    // 防止 ../ 跳出内容目录；不提供 Markdown 源文件和隐藏文件
    if (!file.startsWith(contentDir + sep) || /\.mdx?$/.test(file) || rest.some((p) => p.startsWith('.'))) continue;
    if (existsSync(file) && statSync(file).isFile()) return file;
  }
  return null;
}

/** 开发服务器返回文件时使用的类型，覆盖常见的图片、音视频、文档格式 */
const MIME = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.svg': 'image/svg+xml',
  '.mp3': 'audio/mpeg',
  '.m4a': 'audio/mp4',
  '.ogg': 'audio/ogg',
  '.wav': 'audio/wav',
  '.flac': 'audio/flac',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.pdf': 'application/pdf',
  '.json': 'application/json',
  '.txt': 'text/plain; charset=utf-8',
  '.csv': 'text/csv; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.zip': 'application/zip',
};
