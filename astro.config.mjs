// @ts-check
import { readdirSync, readFileSync } from 'node:fs';
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

const site = 'https://breadforthehungryministries.nl';

// lastmod per nieuwsbericht = publicatiedatum uit de frontmatter (de overige pagina's krijgen geen lastmod).
const postDates = new Map(
  readdirSync('./src/content/news')
    .filter((f) => f.endsWith('.md'))
    .map((f) => {
      const date = readFileSync(`./src/content/news/${f}`, 'utf8').match(/^date:\s*(.+)$/m)?.[1];
      return [`${site}/${f.replace(/\.md$/, '')}/`, date ? new Date(date).toISOString() : undefined];
    }),
);

export default defineConfig({
  site,
  output: 'static',
  build: { inlineStylesheets: 'always' },
  trailingSlash: 'always',
  integrations: [
    sitemap({
      filter: (page) => !page.includes('/404'),
      serialize: (item) => {
        const lastmod = postDates.get(item.url);
        if (lastmod) item.lastmod = lastmod;
        return item;
      },
    }),
  ],
  // esbuild keeps animation-timeline as a longhand (lightningcss merges it into a shorthand some browsers drop).
  vite: { plugins: [tailwindcss()], build: { cssMinify: 'esbuild' } },
});
