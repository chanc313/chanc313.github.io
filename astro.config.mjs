// Astro 配置文件：网站地址、插件、Markdown 代码高亮等全局设置
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://chanc313.github.io',
  integrations: [sitemap()],
  markdown: {
    shikiConfig: {
      // 代码块同时生成浅色、深色两套配色，随网站主题切换
      themes: { light: 'github-light', dark: 'github-dark' },
      defaultColor: false,
      wrap: true,
    },
  },
});
