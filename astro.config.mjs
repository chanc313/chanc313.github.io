// Astro 配置文件：网站地址、插件、Markdown 处理方式等全局设置
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { unified } from '@astrojs/markdown-remark';
import remarkChatTurns from './src/plugins/remark-chat-turns.mjs';
import pageBundles from './src/integrations/page-bundles.mjs';
import structureCheck from './src/integrations/structure-check.mjs';
import { COLUMNS } from './src/columns.ts';

export default defineConfig({
  site: 'https://chanc313.github.io',
  // 网址统一以 / 结尾。资源包里的相对引用（./bgm.mp3）依赖这一点才能解析到正确位置
  trailingSlash: 'always',
  integrations: [
    // 结构检查：栏目文件是否齐全、后台配置是否同步、独立页面名是否与已有网址冲突（说明见集成文件开头）
    structureCheck({ columns: COLUMNS }),
    sitemap(),
    // 页面资源包：把每个页面文件夹里的私有资源发布到该页面网址下（说明见集成文件开头）
    pageBundles({
      // 各栏目从 src/columns.ts 读取，新增栏目无需改这里；独立页面在站点根目录下
      bundles: [
        ...COLUMNS.map((c) => ({ dir: `src/content/${c.id}`, url: c.path })),
        { dir: 'src/content/pages', url: '/' },
      ],
    }),
  ],
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
