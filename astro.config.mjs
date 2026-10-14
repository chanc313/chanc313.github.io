// Astro 配置文件：网站地址、插件、Markdown 处理方式等全局设置
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { unified } from '@astrojs/markdown-remark';
import remarkChatTurns from './src/plugins/remark-chat-turns.mjs';

export default defineConfig({
  site: 'https://chanc313.github.io',
  integrations: [sitemap()],
  markdown: {
    // Markdown 处理器：使用 unified（remark/rehype）管线，而非 Astro 7 默认的 Sätteri。
    // 原因：remark 插件生态成熟（脚注、数学公式、目录等现成可用），文档与示例丰富。
    processor: unified({
      // 自定义插件：对话记录按发言人分段（用法见插件文件开头）
      remarkPlugins: [remarkChatTurns],
    }),
    shikiConfig: {
      // 代码块同时生成浅色、深色两套配色，随网站主题切换
      themes: { light: 'github-light', dark: 'github-dark' },
      defaultColor: false,
      wrap: true,
    },
  },
});
