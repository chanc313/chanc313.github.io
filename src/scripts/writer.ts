// 写作页 /write/ 的交互：表单联动、自动存稿、工具栏、图片粘贴与拖入、预览、发布到 GitHub。
// 页面结构与样式在 src/pages/write.astro。
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import rehypeStringify from 'rehype-stringify';
import { remarkPlugins, rehypePlugins } from '../plugins/markdown.mjs';
import { getToken } from './login';
import { REPO } from '../consts';

interface WriteData {
  columns: { id: string; label: string; path: string }[];
  topics: { id: string; title: string; series: string[] }[];
  taken: Record<string, string[]>;
}

const data: WriteData = JSON.parse(document.getElementById('write-data')!.textContent!);
const form = document.querySelector<HTMLFormElement>('[data-writer]')!;
const field = <T extends Element>(name: string) => form.elements.namedItem(name) as unknown as T;
const columnSel = field<HTMLSelectElement>('column');
const topicSel = field<HTMLSelectElement>('topic');
const seriesSel = field<HTMLSelectElement>('series');
const titleInput = field<HTMLInputElement>('title');
const slugInput = field<HTMLInputElement>('slug');
const tagsInput = field<HTMLInputElement>('tags');
const descInput = field<HTMLInputElement>('description');
const body = field<HTMLTextAreaElement>('body');
const draftBox = field<HTMLInputElement>('draft');
const preview = form.querySelector<HTMLElement>('[data-preview]')!;
const statusEl = form.querySelector<HTMLElement>('[data-status]')!;
const publishBtn = form.querySelector<HTMLButtonElement>('[data-publish]')!;

/** 正文里插入的图片：文件名 → 文件内容。发布时只上传正文仍在引用的图片 */
const images = new Map<string, Blob>();

function setStatus(text: string, isError = false) {
  statusEl.textContent = text;
  statusEl.classList.toggle('error', isError);
}

// ---------- 登录检查 ----------

if (!getToken()) {
  document.querySelector('[data-login]')!.removeAttribute('hidden');
} else {
  form.removeAttribute('hidden');
}

// ---------- 栏目、话题、系列联动 ----------

for (const c of data.columns) columnSel.add(new Option(c.label, c.id));
for (const t of data.topics) topicSel.add(new Option(t.title, t.id));

/** 系列选项只列当前话题下的系列 */
function fillSeries(selected = '') {
  seriesSel.length = 1; // 保留"单篇文章"
  const topic = data.topics.find((t) => t.id === topicSel.value);
  for (const s of topic?.series ?? []) seriesSel.add(new Option(s, s));
  seriesSel.value = topic?.series.includes(selected) ? selected : '';
  seriesSel.disabled = !topic || topic.series.length === 0;
}

function onColumnChange() {
  const isTheory = columnSel.value === 'theory';
  for (const el of form.querySelectorAll('[data-theory-only]')) el.toggleAttribute('hidden', !isTheory);
  const column = data.columns.find((c) => c.id === columnSel.value)!;
  form.querySelector('[data-slug-prefix]')!.textContent = column.path;
  if (!slugEdited) slugInput.value = defaultSlug();
}

columnSel.addEventListener('change', () => {
  onColumnChange();
  saveDraft();
});
topicSel.addEventListener('change', () => {
  fillSeries();
  saveDraft();
});

// ---------- 网址名 ----------

/** 用户是否手动改过网址名；没改过时随栏目切换自动更新 */
let slugEdited = false;
slugInput.addEventListener('input', () => (slugEdited = true));

const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

/** 默认网址名：当天日期，被占用时加序号，如 2026-10-18-2 */
function defaultSlug() {
  const taken = data.taken[columnSel.value] ?? [];
  let slug = today();
  for (let i = 2; taken.includes(slug); i++) slug = `${today()}-${i}`;
  return slug;
}

/** 网址名只允许小写字母、数字和连字符（文件夹名只用 ASCII 的约定） */
function checkSlug(): string | null {
  const slug = slugInput.value.trim();
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) return '网址只能用小写英文字母、数字和连字符，如 ros2-topic';
  if ((data.taken[columnSel.value] ?? []).includes(slug)) return `网址 ${slug} 已被使用，请换一个`;
  return null;
}

// ---------- 自动存稿（文字存 localStorage，图片存 IndexedDB） ----------

const DRAFT_KEY = 'write-draft';
const textFields = { column: columnSel, topic: topicSel, series: seriesSel, title: titleInput, slug: slugInput, tags: tagsInput, description: descInput, body };

function saveDraft() {
  const values: Record<string, string | boolean> = { draft: draftBox.checked, slugEdited };
  for (const [k, el] of Object.entries(textFields)) values[k] = el.value;
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(values));
  } catch {}
}

let saveTimer = 0;
form.addEventListener('input', () => {
  clearTimeout(saveTimer);
  saveTimer = window.setTimeout(saveDraft, 500);
});

const db = () =>
  new Promise<IDBDatabase>((resolve, reject) => {
    const req = indexedDB.open('write-draft', 1);
    req.onupgradeneeded = () => req.result.createObjectStore('images');
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });

async function imageStore(mode: IDBTransactionMode) {
  return (await db()).transaction('images', mode).objectStore('images');
}

const done = (req: IDBRequest | IDBTransaction) =>
  new Promise((resolve, reject) => {
    if (req instanceof IDBTransaction) req.oncomplete = resolve;
    else req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });

async function saveImage(name: string, blob: Blob) {
  try {
    await done((await imageStore('readwrite')).put(blob, name));
  } catch {}
}

async function loadImages() {
  try {
    const store = await imageStore('readonly');
    const [keys, values] = await Promise.all([done(store.getAllKeys()), done(store.getAll())]);
    (keys as string[]).forEach((k, i) => images.set(k, (values as Blob[])[i]));
  } catch {}
}

async function clearDraft() {
  localStorage.removeItem(DRAFT_KEY);
  images.clear();
  try {
    await done((await imageStore('readwrite')).clear());
  } catch {}
}

/** 打开页面时：恢复上次没发布的草稿；没有草稿时按网址参数预选栏目、话题、系列 */
async function restore() {
  let saved: Record<string, string | boolean> | null = null;
  try {
    saved = JSON.parse(localStorage.getItem(DRAFT_KEY) ?? 'null');
  } catch {}
  const params = new URLSearchParams(location.search);
  const hasDraft = !!(saved && ((saved.title as string) || (saved.body as string)));

  if (hasDraft && saved) {
    columnSel.value = saved.column as string;
    topicSel.value = saved.topic as string;
    fillSeries(saved.series as string);
    for (const k of ['title', 'slug', 'tags', 'description', 'body'] as const) textFields[k].value = (saved[k] as string) ?? '';
    draftBox.checked = !!saved.draft;
    slugEdited = !!saved.slugEdited;
    await loadImages();
    setStatus('已恢复上次未发布的草稿');
  } else {
    const column = params.get('column');
    if (data.columns.some((c) => c.id === column)) columnSel.value = column!;
    topicSel.value = data.topics.some((t) => t.id === params.get('topic')) ? params.get('topic')! : '';
    fillSeries(params.get('series') ?? '');
  }
  onColumnChange();
  autoGrow();
}

// ---------- 正文：自动增高、图片粘贴与拖入 ----------

function autoGrow() {
  body.style.height = 'auto';
  body.style.height = `${body.scrollHeight + 2}px`;
}
body.addEventListener('input', autoGrow);

/**
 * 用 text 替换 [start, end) 这段正文，并选中替换后文字里的 [selStart, selEnd)（相对 text 开头）。
 * 优先用 execCommand('insertText')：它保留浏览器的撤销记录，Ctrl+Z 能撤回按钮插入的内容；
 * 不支持时退回 setRangeText（不能撤销，但内容正确）。
 */
function replaceRange(start: number, end: number, text: string, selStart = text.length, selEnd = selStart) {
  body.focus();
  body.setSelectionRange(start, end);
  if (!document.execCommand('insertText', false, text)) {
    body.setRangeText(text, start, end, 'end');
    body.dispatchEvent(new Event('input', { bubbles: true }));
  }
  body.setSelectionRange(start + selStart, start + selEnd);
}

/** 在光标处插入文字 */
function insertAtCursor(text: string) {
  replaceRange(body.selectionStart, body.selectionEnd, text);
}

// ---------- 工具栏 ----------

/** 用 before / after 包住选中的文字；没选中时插入示例文字并选中它，方便直接改 */
function wrap(before: string, after: string, example: string) {
  const { selectionStart: start, selectionEnd: end, value } = body;
  const inner = value.slice(start, end) || example;
  replaceRange(start, end, before + inner + after, before.length, before.length + inner.length);
}

/** 选中的每一行（光标所在行）的范围 */
function selectedLines() {
  const { selectionStart, selectionEnd, value } = body;
  const start = value.lastIndexOf('\n', selectionStart - 1) + 1;
  const nl = value.indexOf('\n', selectionEnd);
  const end = nl === -1 ? value.length : nl;
  return { start, end, lines: value.slice(start, end).split('\n') };
}

/** 设定标题级别：去掉行首已有的 #，换成 level 个；同级再点一次则取消标题 */
function heading(level: number) {
  const { start, end, lines } = selectedLines();
  const mark = '#'.repeat(level) + ' ';
  const toggleOff = lines.every((l) => l.startsWith(mark));
  const text = lines.map((l) => (toggleOff ? '' : mark) + l.replace(/^#{1,6}\s+/, '')).join('\n');
  replaceRange(start, end, text);
}

/** 行首标记（列表、引用）：所有行都有时去掉，否则加上。编号列表按行编号 */
function linePrefix(prefix: (i: number) => string, pattern: RegExp) {
  const { start, end, lines } = selectedLines();
  const toggleOff = lines.every((l) => pattern.test(l));
  const text = lines.map((l, i) => (toggleOff ? l.replace(pattern, '') : prefix(i) + l)).join('\n');
  replaceRange(start, end, text);
}

/**
 * 插入独立成段的内容（代码块、公式块、表格）：前后各留一个空行，与上下文隔开。
 * 选中 example 那一段，直接输入即可替换
 */
function block(open: string, example: string, close: string) {
  const { selectionStart: start, selectionEnd: end, value } = body;
  const inner = value.slice(start, end) || example;
  const before = value.slice(0, start);
  const lead = before === '' || before.endsWith('\n\n') ? '' : before.endsWith('\n') ? '\n' : '\n\n';
  const after = value.slice(end);
  const tail = after.startsWith('\n\n') ? '' : after.startsWith('\n') ? '\n' : '\n\n';
  const text = lead + open + inner + close + tail;
  replaceRange(start, end, text, lead.length + open.length, lead.length + open.length + inner.length);
}

const imagePicker = form.querySelector<HTMLInputElement>('[data-image-picker]')!;

const TOOLS: Record<string, () => void> = {
  h2: () => heading(2),
  h3: () => heading(3),
  h4: () => heading(4),
  bold: () => wrap('**', '**', '粗体'),
  italic: () => wrap('*', '*', '斜体'),
  link: () => {
    const { selectionStart: start, selectionEnd: end, value } = body;
    const label = value.slice(start, end) || '链接文字';
    // 选中网址部分，粘贴即可
    replaceRange(start, end, `[${label}](https://)`, label.length + 3, label.length + 11);
  },
  ul: () => linePrefix(() => '- ', /^[-*+]\s+/),
  ol: () => linePrefix((i) => `${i + 1}. `, /^\d+\.\s+/),
  quote: () => linePrefix(() => '> ', /^>\s?/),
  table: () => block('', '| 列 1 | 列 2 |\n| --- | --- |\n| 内容 | 内容 |', ''),
  code: () => wrap('`', '`', 'code'),
  // 选中示例文字，直接输入代码；在开头的 ``` 后补上语言名（python、cpp、bash……）上线后有语法高亮
  codeblock: () => block('```\n', '代码', '\n```'),
  math: () => wrap('$', '$', 'x^2'),
  mathblock: () => block('$$\n', '\\int_0^1 f(x)\\,dx', '\n$$'),
  image: () => imagePicker.click(),
};

const tools = form.querySelector<HTMLElement>('[data-tools]')!;
tools.addEventListener('click', (e) => {
  const button = (e.target as Element).closest<HTMLButtonElement>('[data-tool]');
  if (button) TOOLS[button.dataset.tool!]();
});
imagePicker.addEventListener('change', () => {
  addImages([...(imagePicker.files ?? [])]);
  imagePicker.value = '';
});

// 快捷键：Ctrl/⌘ + B 粗体、I 斜体、K 链接
body.addEventListener('keydown', (e) => {
  if (!(e.ctrlKey || e.metaKey) || e.altKey || e.shiftKey) return;
  const tool = { b: 'bold', i: 'italic', k: 'link' }[e.key.toLowerCase()];
  if (tool) {
    e.preventDefault();
    TOOLS[tool]();
  }
});

const EXT: Record<string, string> = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/gif': 'gif', 'image/webp': 'webp', 'image/svg+xml': 'svg' };

/** 收下图片：起一个不重复的文件名，存起来，在正文插入 ![](./文件名) */
async function addImages(files: File[]) {
  for (const file of files) {
    const ext = EXT[file.type];
    if (!ext) continue;
    const stamp = new Date().toISOString().replace(/\D/g, '').slice(0, 14);
    let name = `img-${stamp}.${ext}`;
    for (let i = 2; images.has(name); i++) name = `img-${stamp}-${i}.${ext}`;
    images.set(name, file);
    await saveImage(name, file);
    insertAtCursor(`![](./${name})\n`);
  }
}

body.addEventListener('paste', (e) => {
  const files = [...(e.clipboardData?.files ?? [])].filter((f) => f.type.startsWith('image/'));
  if (files.length > 0) {
    e.preventDefault();
    addImages(files);
  }
});
body.addEventListener('dragover', (e) => {
  e.preventDefault();
  body.classList.add('dragging');
});
body.addEventListener('dragleave', () => body.classList.remove('dragging'));
body.addEventListener('drop', (e) => {
  e.preventDefault();
  body.classList.remove('dragging');
  addImages([...(e.dataTransfer?.files ?? [])]);
});

/** 正文里实际引用到的图片（被删掉引用的图片不上传） */
const usedImages = () => [...images.keys()].filter((name) => body.value.includes(name));

// ---------- 预览 ----------

const objectUrls = new Map<string, string>();

// 与网站构建用同一套插件（src/plugins/markdown.mjs），预览里的公式、对话分段与上线后一致。
// 不含代码高亮与图片压缩，这两项只在构建时做
const processor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkPlugins)
  .use(remarkRehype, { allowDangerousHtml: true })
  .use(rehypePlugins)
  .use(rehypeStringify, { allowDangerousHtml: true });

function renderPreview() {
  preview.innerHTML = String(processor.processSync(body.value));
  // 把 ./img-xxx.png 换成浏览器里的图片地址，预览时才能显示
  for (const img of preview.querySelectorAll('img')) {
    const name = (img.getAttribute('src') ?? '').replace(/^\.\//, '');
    const blob = images.get(name);
    if (!blob) continue;
    if (!objectUrls.has(name)) objectUrls.set(name, URL.createObjectURL(blob));
    img.src = objectUrls.get(name)!;
  }
}

for (const tab of form.querySelectorAll<HTMLButtonElement>('[data-tab]')) {
  tab.addEventListener('click', () => {
    const showPreview = tab.dataset.tab === 'preview';
    for (const t of form.querySelectorAll('[data-tab]')) t.setAttribute('aria-selected', String(t === tab));
    if (showPreview) renderPreview();
    preview.hidden = !showPreview;
    body.hidden = showPreview;
    tools.hidden = showPreview;
  });
}

// ---------- 发布 ----------

class AuthError extends Error {}

/** 调用 GitHub 接口；令牌失效时抛出 AuthError */
async function github(path: string, init: { method?: string; body?: unknown } = {}) {
  const token = getToken();
  if (!token) throw new AuthError();
  const res = await fetch(`https://api.github.com/repos/${REPO}${path}`, {
    method: init.method ?? 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: init.body ? JSON.stringify(init.body) : undefined,
  });
  if (res.status === 401) throw new AuthError();
  return res;
}

async function githubJson(path: string, init?: { method?: string; body?: unknown }) {
  const res = await github(path, init);
  if (!res.ok) throw new Error(`GitHub 返回 ${res.status}：${(await res.json().catch(() => ({}))).message ?? ''}`);
  return res.json();
}

const toBase64 = (blob: Blob) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });

/**
 * 生成 index.md：frontmatter + 正文。
 * 字符串用 JSON 格式写出，它同时是合法的 YAML，标题里有冒号、引号也不会出错。
 */
function buildMarkdown() {
  const tags = tagsInput.value.split(/[,，、]/).map((t) => t.trim()).filter(Boolean);
  const lines = [`title: ${JSON.stringify(titleInput.value.trim())}`, `date: ${today()}`];
  if (descInput.value.trim()) lines.push(`description: ${JSON.stringify(descInput.value.trim())}`);
  if (tags.length > 0) lines.push(`tags: ${JSON.stringify(tags)}`);
  if (columnSel.value === 'theory' && topicSel.value) {
    lines.push(`topic: ${topicSel.value}`);
    if (seriesSel.value) lines.push(`series: ${JSON.stringify(seriesSel.value)}`);
  }
  if (draftBox.checked) lines.push('draft: true');
  return `---\n${lines.join('\n')}\n---\n\n${body.value.trim()}\n`;
}

/**
 * 把文章和图片作为一次提交推到 main：
 * 上传文件内容 → 在当前 main 的基础上建新目录树 → 建提交 → 移动 main。
 * 如果这期间 main 被别处更新（如后台保存），重来一次。
 */
async function commit(dir: string, message: string) {
  const files: { path: string; content: string; encoding: 'utf-8' | 'base64' }[] = [
    { path: `${dir}/index.md`, content: buildMarkdown(), encoding: 'utf-8' },
  ];
  for (const name of usedImages()) {
    files.push({ path: `${dir}/${name}`, content: await toBase64(images.get(name)!), encoding: 'base64' });
  }
  const blobs = await Promise.all(
    files.map(async (f) => ({
      path: f.path,
      mode: '100644',
      type: 'blob',
      sha: (await githubJson('/git/blobs', { method: 'POST', body: { content: f.content, encoding: f.encoding } })).sha,
    })),
  );

  for (let attempt = 0; attempt < 2; attempt++) {
    const head = (await githubJson('/git/ref/heads/main')).object.sha;
    const baseTree = (await githubJson(`/git/commits/${head}`)).tree.sha;
    const tree = await githubJson('/git/trees', { method: 'POST', body: { base_tree: baseTree, tree: blobs } });
    const created = await githubJson('/git/commits', { method: 'POST', body: { message, tree: tree.sha, parents: [head] } });
    const res = await github('/git/refs/heads/main', { method: 'PATCH', body: { sha: created.sha } });
    if (res.ok) return;
    if (res.status !== 422) throw new Error(`GitHub 返回 ${res.status}`);
  }
  throw new Error('网站仓库刚好在更新，请稍后再点一次发布');
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  saveDraft();
  if (!titleInput.value.trim()) return setStatus('请填写标题', true);
  if (!body.value.trim()) return setStatus('请填写正文', true);
  const slugError = checkSlug();
  if (slugError) return setStatus(slugError, true);

  const column = data.columns.find((c) => c.id === columnSel.value)!;
  const slug = slugInput.value.trim();
  const dir = `src/content/${column.id}/${slug}`;

  publishBtn.disabled = true;
  setStatus('正在发布…');
  try {
    // 再向 GitHub 确认一次这个网址没被占用（页面生成之后可能在后台新建过）
    const exists = await github(`/contents/${encodeURI(dir)}/index.md?ref=main`);
    if (exists.ok) throw new Error(`网址 ${slug} 已被使用，请换一个`);

    await commit(dir, `新建 ${column.id}：${slug}`);
    data.taken[column.id].push(slug);
    await clearDraft();
    const url = `${column.path}${slug}/`;
    const wasDraft = draftBox.checked;
    // 清空表单，但保留栏目、话题、系列，方便接着写下一篇
    const place = { column: columnSel.value, topic: topicSel.value, series: seriesSel.value };
    form.reset();
    columnSel.value = place.column;
    topicSel.value = place.topic;
    fillSeries(place.series);
    slugEdited = false;
    onColumnChange();
    autoGrow();
    statusEl.classList.remove('error');
    statusEl.innerHTML = wasDraft
      ? '已存为草稿，不会公开。之后可在后台修改并取消草稿'
      : `已发布，约一分钟后可在 <a href="${url}">${url}</a> 看到`;
  } catch (err) {
    if (err instanceof AuthError) {
      statusEl.classList.add('error');
      statusEl.innerHTML =
        '登录已过期。请<a href="/admin/" target="_blank">在新标签页打开后台</a>重新登录，再回来点发布（内容已自动保存）';
    } else {
      setStatus(err instanceof Error ? err.message : String(err), true);
    }
  } finally {
    publishBtn.disabled = false;
  }
});

// ---------- 清空 ----------

form.querySelector('[data-discard]')!.addEventListener('click', async () => {
  if (!confirm('清空这篇正在写的文章？内容和图片都会删除，无法恢复。')) return;
  await clearDraft();
  form.reset();
  slugEdited = false;
  fillSeries();
  onColumnChange();
  autoGrow();
  setStatus('');
});

restore();
