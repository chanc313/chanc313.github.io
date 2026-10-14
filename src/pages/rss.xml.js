// RSS 订阅源：包含所有栏目的内容，每条标注所属栏目
import rss from '@astrojs/rss';
import { SITE_TITLE, SITE_DESCRIPTION } from '../consts';
import { getAllEntries, entryUrl, columnOf } from '../utils';

export async function GET(context) {
  const entries = await getAllEntries();
  return rss({
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    site: context.site,
    items: entries.map((entry) => ({
      title: entry.data.title,
      description: entry.data.description,
      pubDate: entry.data.date,
      link: entryUrl(entry),
      categories: [columnOf(entry).label, ...entry.data.tags],
    })),
  });
}
