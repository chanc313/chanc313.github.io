// Markdown 插件：把对话记录按发言人分段。
//
// 写法：单独一行 @me 或 @ai，表示下一位发言人开始；直到下一个标记之前的内容都属于这段发言。
//
//   @me
//   我的问题……
//
//   @ai
//   AI 的回答，可以包含标题、列表、代码块、表格……
//
// 输出 HTML：
//   <section class="turn turn-me"><p class="turn-label">我</p>…</section>
//   <section class="turn turn-ai"><p class="turn-label">Claude Opus 5.5</p>…</section>
//
// 发言人名称取自 frontmatter：ai 字段（默认 "AI"），me 字段（默认 "我"）。
// 选用 @me / @ai 而不是标题（## 我）作为标记，是因为粘贴进来的 AI 回答本身常含标题，
// 用标题做标记会和正文混淆；单独一行的 @me / @ai 几乎不会出现在正常内容里。
//
// 不含标记的 Markdown 不受影响，所以插件对所有栏目全局启用是安全的。

const MARKER = /^@(me|ai)[ \t]*(?:\n|$)/;

export default function remarkChatTurns() {
  return (tree, file) => {
    const frontmatter = file.data?.astro?.frontmatter ?? {};
    const names = { me: frontmatter.me ?? '我', ai: frontmatter.ai ?? 'AI' };

    const output = [];
    let current = null;

    for (const node of tree.children) {
      const speaker = takeMarker(node);
      if (speaker) {
        current = createTurn(speaker, names[speaker]);
        output.push(current);
        // 标记和正文写在同一段里（@me 下一行紧接文字、没有空行）时，剩下的文字仍保留
        if (node.children.length > 0) current.children.push(node);
      } else if (current) {
        current.children.push(node);
      } else {
        output.push(node); // 第一个标记之前的内容保持原样
      }
    }

    tree.children = output;
  };
}

/** 如果段落以 @me / @ai 开头，去掉标记并返回发言人；否则返回 null */
function takeMarker(node) {
  if (node.type !== 'paragraph') return null;
  const first = node.children[0];
  if (!first || first.type !== 'text') return null;

  const match = first.value.match(MARKER);
  if (!match) return null;

  first.value = first.value.slice(match[0].length);
  if (first.value === '') node.children.shift();
  return match[1];
}

/** 创建一个发言段节点，转成 HTML 时成为 <section class="turn turn-xx"> */
function createTurn(speaker, name) {
  return {
    type: 'chatTurn',
    data: {
      hName: 'section',
      hProperties: { className: ['turn', `turn-${speaker}`] },
    },
    children: [
      {
        type: 'chatTurnLabel',
        data: { hName: 'p', hProperties: { className: ['turn-label'] } },
        children: [{ type: 'text', value: name }],
      },
    ],
  };
}
