import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const news = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/news' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      date: z.coerce.date(),
      cover: image(),
      coverAlt: z.string().default(''),
      excerpt: z.string(),
      /** Optional YouTube videos, shown under the header (click-to-play). */
      videos: z
        .array(z.object({ id: z.string(), title: z.string(), poster: image() }))
        .default([]),
    }),
});

export const collections = { news };
