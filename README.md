# Bread for the Hungry Ministries

Statische website (Astro, TypeScript strict, Tailwind CSS v4) voor <https://breadforthehungryministries.nl>,
gehost op Cloudflare Pages. Migratie van de oude WordPress/Elementor-site; zie [MIGRATION_NOTES.md](MIGRATION_NOTES.md)
voor wat er opviel tijdens het overzetten.

## Aan de slag

Vereist Node 24 (zie `.nvmrc`).

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # statische uitvoer in dist/
npm run preview  # build lokaal bekijken
npm run check    # Astro/TypeScript-controle
```

## Structuur

```
src/
  assets/images/      alle afbeeldingen (via astro:assets geoptimaliseerd naar WebP/JPG)
  components/         Header, Footer, Hero, NewsCard, ProjectCard, CTA
  content/news/       nieuwsberichten (Markdown)
  data/site.ts        sitegegevens + menu
  layouts/Layout.astro   <head>, SEO/Open Graph, header, footer
  pages/              routes (oeganda, kenia, media, sponsoring, …)
  styles/global.css   Tailwind + ontwerptokens (kleuren, lettertypen)
public/
  _headers            beveiligings- en cache-headers
  _redirects          oude WordPress-URL's
  documenten/         ANBI-pdf's
  media/video/        video's (max. 25 MB per bestand!)
functions/api/contact.ts   Pages Function voor het contactformulier (nu een stub)
```

## Een nieuwsbericht toevoegen

1. Zet de omslagfoto in `src/assets/images/` (bij voorkeur ≥ 1200 px breed).
2. Maak `src/content/news/<slug>.md`. De bestandsnaam is de URL: `mijn-bericht.md` → `/mijn-bericht/`.

   ```md
   ---
   title: "Nieuwsupdate van 12 maart"
   date: 2026-03-12
   cover: "../../assets/images/mijn-omslag.jpg"
   coverAlt: ""          # leeg laten als de foto puur decoratief is
   excerpt: "Korte samenvatting voor de kaart en de zoekresultaten."
   ---

   Tekst van het bericht in Markdown.

   ![Beschrijving van de foto](../../assets/images/foto-1.jpg)

   <video controls preload="none" playsinline src="/media/video/mijn-video.mp4"></video>
   ```

3. Meerdere foto's naast elkaar: zet ze in `<div class="gallery"> … </div>` met lege regels rond de afbeeldingen.
4. Video's gaan in `public/media/video/` en mogen **niet groter zijn dan 25 MB** (limiet van Cloudflare Pages).
   Verkleinen kan met `ffmpeg -i in.mp4 -vf scale=1280:-2 -c:v libx264 -crf 28 -c:a aac -b:a 96k -movflags +faststart uit.mp4`.
5. Controleer met `npm run dev`. De nieuwste 4 berichten komen vanzelf op de homepage; `/nieuws/` pagineert per 6.

## Deployen naar Cloudflare Pages

**Via Git (aanbevolen):**

1. Push deze repo naar GitHub/GitLab.
2. Cloudflare dashboard → *Workers & Pages* → *Create* → *Pages* → *Connect to Git*.
3. Instellingen:
   - Framework preset: **Astro** (of *None*)
   - Build command: `npm run build`
   - Build output directory: `dist`
   - Node-versie wordt vastgelegd via `.nvmrc` (24). Wil je het afdwingen: variabele `NODE_VERSION=24`.
4. Voeg onder *Custom domains* `breadforthehungryministries.nl` toe.

**Handmatig:** `npm run build && npx wrangler pages deploy dist`.

De map `functions/` wordt door Cloudflare automatisch als Pages Functions uitgerold; er is **geen** SSR-adapter nodig.

### Lokaal testen met Wrangler

```bash
npm run cf:dev        # = astro build && wrangler pages dev dist
```

Open <http://localhost:8788>. Geheime variabelen zet je lokaal in `.dev.vars` (staat in `.gitignore`, nooit committen).
Configuratie: [wrangler.toml](wrangler.toml).

## Contactformulier

Het formulier op `/contact/` is nu een **dummy**: het POST naar `/api/contact`, maar
[functions/api/contact.ts](functions/api/contact.ts) verstuurt nog niets en antwoordt met een nette
"nog niet actief"-pagina (HTTP 501). Er zit een honeypot-veld (`website`) in.

Bij het koppelen van een e-mail-API (bijv. Resend) en Cloudflare Turnstile:

| Variabele | Waar | Doel |
|---|---|---|
| `RESEND_API_KEY` | secret | API-sleutel van de e-mailprovider |
| `CONTACT_TO` | variabele | ontvangeradres (bijv. `info@breadforthehungryministries.nl`) |
| `CONTACT_FROM` | variabele | geverifieerd afzenderadres/-domein |
| `TURNSTILE_SECRET_KEY` | secret | server-side verificatie van het Turnstile-token |
| `PUBLIC_TURNSTILE_SITE_KEY` | variabele (build) | sitekey voor de widget in `contact.astro` |

Zet ze in Cloudflare onder *Settings → Variables and Secrets* (secrets als *Secret*) en lokaal in `.dev.vars`.
Verruim daarnaast de CSP in `public/_headers` voor Turnstile (`https://challenges.cloudflare.com` bij `script-src`, `frame-src` en `connect-src`).

## Vindbaarheid (SEO)

Wat de site automatisch doet:

- Per pagina een zoekwoordgerichte `<title>` (≤ 60 tekens) en meta description (≤ 155 tekens), `seoTitle`/`description` in de `<Layout>`-aanroep van elke pagina. Nieuwsberichten gebruiken hun eigen titel en een ingekorte samenvatting.
- Gestructureerde data (JSON-LD): `NGO`/`Organization` (met ANBI-gegevens, werkgebied Oeganda en Kenia, contactgegevens, `DonateAction`) en `WebSite` op de homepage, `BreadcrumbList` op elke pagina en `NewsArticle` bij elk nieuwsbericht (`src/data/schema.ts`).
- `sitemap-index.xml` (met `lastmod` voor nieuwsberichten), `robots.txt`, canonical-URL's, `hreflang="nl-NL"`, Open Graph/Twitter-kaarten, RSS-feed op `/feed.xml` (oude `/feed/` verwijst hiernaartoe).
- Snelle pagina's (Lighthouse ≥ 96), semantische koppen, `lang="nl"` en alt-teksten op afbeeldingen.

**Wat jij nog moet doen** (kan ik niet vanuit de code regelen):

1. **Google Search Console**: voeg `https://breadforthehungryministries.nl` toe als *domein*-eigenschap (DNS-verificatie via Cloudflare) of als URL-prefix. Wil je de meta-tag-methode: zet `PUBLIC_GOOGLE_SITE_VERIFICATION=<code>` als build-variabele in Cloudflare Pages en herbouw.
2. Dien in Search Console `https://breadforthehungryministries.nl/sitemap-index.xml` in. Doe hetzelfde in **Bing Webmaster Tools** (voedt ook DuckDuckGo en Ecosia).
3. Laat na livegang in Search Console de belangrijkste pagina's (`/`, `/oeganda/`, `/kenia/`, `/sponsoring/`) indexeren (*URL-inspectie → Indexering aanvragen*).
4. Controleer na livegang de gestructureerde data met <https://search.google.com/test/rich-results> en <https://validator.schema.org>.
5. Zorg dat `www.breadforthehungryministries.nl` (301) naar het domein zonder `www` verwijst en dat alle oude WordPress-URL's blijven werken (`public/_redirects`).
6. **Backlinks** zijn voor een kleine stichting de grootste zoekwinst: vraag links aan van bevriende kerken en organisaties, vermeld de site op ANBI/giftenaftrek-overzichten, zendingsplatforms en in sociale profielen, en verwijs vanuit nieuwsbrieven en socials naar de nieuwsberichten.
7. Publiceer regelmatig nieuwsberichten (dat doen jullie al): verse, inhoudelijke pagina's met zoektermen als "zendingswerk Oeganda", "bijbelschool Kenia" en "opwekking Oeganda" leveren de meeste vindbaarheid op.
8. Maak (eventueel) een Google Bedrijfsprofiel aan als er een postadres of ontmoetingsplek is.

## Ontwerp

- Kleuren afgeleid van het logo: leisteen `#2b3a4a`, teal `#0f6b63`/`#10a090`, goud `#c99a4e`, klei `#b4532a` (donatieknop), crème `#fbf6ec`.
- Lettertypen (zelf gehost, alleen Latin-subset): Fraunces met de zachte "SOFT"-as voor koppen, Figtree voor tekst. De `@font-face`-regels staan in `src/styles/global.css`.
- "Soepele" uitstraling: golvende sectie-overgangen (`Wave.astro`), grote ronde hoeken, warme gelaagde schaduwen, glazen header met schaduw bij scrollen.
- Beweging, volledig in CSS en alleen zonder `prefers-reduced-motion: reduce`: crossfade tussen pagina's (cross-document view transitions), kaarten die zacht in beeld komen (scroll-gestuurde `.rise`-animatie), een rustige zoom op hero-foto's en soepele hover-effecten. Browsers zonder ondersteuning tonen alles gewoon statisch.
- Alleen het menu gebruikt JavaScript (±1 kB); de rest werkt zonder JS.
- `astro.config.mjs` zet `cssMinify: 'esbuild'`: de standaard-minifier voegt `animation-timeline` samen met `animation`, wat sommige browsers laten vallen.
- Het jaartal in de footer wordt tijdens de build bepaald; een build in het nieuwe jaar werkt het bij.
