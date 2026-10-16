// @ts-check
import { readdirSync, readFileSync } from 'node:fs';
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

const site = 'https://breadforthehungryministries.nl';

// lastmod per nieuwsbericht = publicatiedatum uit de frontmatter (de overige pagina's krijgen geen lastmod).
// Nederlandse berichten staan op /<slug>/, Engelse op /en/<slug>/.
const postDates = new Map(
  [
    ['./src/content/news', ''],
    ['./src/content/news-en', 'en/'],
  ].flatMap(([dir, prefix]) =>
    readdirSync(dir)
      .filter((f) => f.endsWith('.md'))
      .map((f) => {
        const date = readFileSync(`${dir}/${f}`, 'utf8').match(/^date:\s*(.+)$/m)?.[1];
        return [`${site}/${prefix}${f.replace(/\.md$/, '')}/`, date ? new Date(date).toISOString() : undefined];
      }),
  ),
);

export default defineConfig({
  site,
  output: 'static',
  build: { inlineStylesheets: 'always' },
  trailingSlash: 'always',
  integrations: [
    sitemap({
      // Nederlands is de hoofdtaal (root); Engels staat onder /en/. Zorgt voor hreflang-koppelingen in de sitemap.
      i18n: { defaultLocale: 'nl', locales: { nl: 'nl-NL', en: 'en-GB' } },
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
