// Markdown 插件清单：网站构建（astro.config.mjs）与写作页预览（src/scripts/writer.ts）共用，
// 保证预览与上线后的排版一致。新增插件加在这里，两边同时生效。
//
//   remark-math + rehype-katex  数学公式：行内 $E=mc^2$，独立成行用 $$ … $$；
//                               构建时直接生成公式的 HTML，读者浏览器不需要运行脚本。
//                               样式与字体来自 katex 包，在 src/styles/math.css 引入。
//   remark-chat-turns           对话记录按发言人分段（用法见插件文件开头）
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import remarkChatTurns from './remark-chat-turns.mjs';

/** @type {import('unified').PluggableList} */
export const remarkPlugins = [remarkMath, remarkChatTurns];
// 公式写错时显示为红字而不是让整个构建失败
/** @type {import('unified').PluggableList} */
export const rehypePlugins = [[rehypeKatex, { throwOnError: false, strict: false }]];
