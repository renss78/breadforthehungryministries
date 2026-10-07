// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://breadforthehungryministries.nl',
  output: 'static',
  build: { inlineStylesheets: 'always' },
  trailingSlash: 'always',
  integrations: [sitemap({ filter: (page) => !page.includes('/404') })],
  // esbuild keeps animation-timeline as a longhand (lightningcss merges it into a shorthand some browsers drop).
  vite: { plugins: [tailwindcss()], build: { cssMinify: 'esbuild' } },
});
