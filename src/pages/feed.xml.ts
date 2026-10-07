import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { getCollection } from 'astro:content';
import { site } from '../data/site';

export async function GET(context: APIContext) {
  const posts = (await getCollection('news')).sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
  return rss({
    title: `Nieuws — ${site.name}`,
    description: 'Nieuwsupdates van het zendingswerk in Oeganda en Kenia.',
    site: context.site!,
    trailingSlash: true,
    customData: '<language>nl-NL</language>',
    items: posts.map((p) => ({ title: p.data.title, pubDate: p.data.date, description: p.data.excerpt, link: `/${p.id}/` })),
  });
}
