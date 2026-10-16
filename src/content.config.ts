import { defineCollection, type SchemaContext } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const schema = ({ image }: SchemaContext) =>
  z.object({
    title: z.string(),
    date: z.coerce.date(),
    cover: image(),
    coverAlt: z.string().default(''),
    excerpt: z.string(),
    /** Optional YouTube videos, shown under the header (click-to-play). */
    videos: z.array(z.object({ id: z.string(), title: z.string(), poster: image() })).default([]),
  });

// Nederlands (hoofdtaal) en Engels: dezelfde velden. Engelse slugs staan gekoppeld in src/i18n/index.ts.
const news = defineCollection({ loader: glob({ pattern: '**/*.md', base: './src/content/news' }), schema });
const newsEn = defineCollection({ loader: glob({ pattern: '**/*.md', base: './src/content/news-en' }), schema });

export const collections = { news, newsEn };
