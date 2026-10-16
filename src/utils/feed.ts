import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { site } from '../data/site';
import { getNews } from './news';
import { bcp47, postPath, ui, type Lang } from '../i18n';

export async function newsFeed(context: APIContext, lang: Lang) {
  const posts = await getNews(lang);
  return rss({
    title: `${ui[lang].feedTitle} — ${site.name}`,
    description: ui[lang].feedDescription,
    site: context.site!,
    trailingSlash: true,
    customData: `<language>${bcp47[lang]}</language>`,
    items: posts.map((p) => ({ title: p.data.title, pubDate: p.data.date, description: p.data.excerpt, link: postPath(p.id, lang) })),
  });
}
