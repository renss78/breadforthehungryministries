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
  content/news/       nieuwsberichten, Nederlands (Markdown)
  content/news-en/    dezelfde berichten in het Engels
  data/site.ts        sitegegevens + menu (per taal)
  i18n/index.ts       talen, routes (NL ↔ EN), vaste interface-teksten
  layouts/Layout.astro   <head>, SEO/Open Graph, header, footer
  pages/              Nederlandse routes (oeganda, kenia, media, sponsoring, …)
  pages/en/           Engelse routes: dunne wrappers rond dezelfde pagina's
  styles/global.css   Tailwind + ontwerptokens (kleuren, lettertypen)
public/
  _headers            beveiligings- en cache-headers
  _redirects          oude WordPress-URL's
  documenten/         ANBI-pdf's
  media/video/        video's (max. 25 MB per bestand!)
functions/api/contact.ts   Pages Function voor het contactformulier (verstuurt via Resend)
```

## Tweetalig: Nederlands (hoofdtaal) en Engels

Nederlands staat op de root (`/oeganda/`), Engels onder `/en/` (`/en/uganda/`). In de header staat een **NL | EN**-wisselaar
(in het mobiele menu onder "Taal") die naar dezelfde pagina in de andere taal linkt; er is geen automatische doorverwijzing.

- **De taal volgt uit de URL** (`getLang(Astro.url)` in `src/i18n/index.ts`). Pagina's, `Layout`, `Header`, `Footer` en de componenten kiezen daar hun teksten op.
- **Pagina's:** de Nederlandse pagina in `src/pages/` bevat beide talen (`const l = pick(lang); l('Nederlands', 'English')`, of een `lang === 'nl' ? … : …`-blok voor lange teksten). `src/pages/en/<naam>.astro` is een dunne wrapper die dezelfde pagina onder een Engelse URL toont.
- **Nieuwe pagina?** Voeg de route toe aan `routes` in `src/i18n/index.ts` (NL- en EN-pad), maak de NL-pagina en de wrapper in `src/pages/en/`, en zet de pagina in `getNav()` (`src/data/site.ts`) als hij in het menu moet.
- **Vaste teksten** (menu, footer, knoppen, CTA) staan in `ui` in `src/i18n/index.ts`.
- **SEO:** `<html lang>`, `hreflang` (nl-NL, en-GB, x-default), canonical per taal, `og:locale`, JSON-LD in de juiste taal, sitemap met `xhtml:link`-alternatieven en een aparte RSS-feed (`/en/feed.xml`) worden automatisch gezet.
- **Het contactformulier** stuurt een verborgen veld `lang` mee; de antwoordpagina's van de Function volgen die taal. De e-mail zelf blijft Nederlands.
- **Niet vertaald:** de prijsafbeeldingen op Sponsoring (de tekst zit in de plaatjes; alleen de alt-teksten zijn vertaald), de ANBI-pdf's in `public/documenten/` en de tekst in de video's.

## Licht en donker thema

De site volgt standaard het systeem (`prefers-color-scheme`); de maan/zon-knop in de header (mobiel: in het menu) wisselt en onthoudt de keuze in `localStorage`.
Een klein inline script in `<head>` (`Layout.astro`) zet `data-theme` op `<html>` vóór de eerste paint, zodat er geen flits is.

- De kleuren wisselen via CSS `light-dark()` op tokens in `src/styles/global.css` (blok onder `@supports`); de lichte waarden staan in `@theme`.
- Gebruik voor nieuwe stukken **semantische** kleuren: `text-fg`/`text-fg-soft` (tekst), `bg-card` (kaarten, invoervelden), `text-link` (links/accenttekst), `bg-cream`/`bg-sand` (paginavlakken), `--color-line` (randjes). `ink`, `teal-*`, `gold-*` en `clay` zijn merkkleuren die in beide thema's vast blijven (knoppen, hero, footer).
- Het logo heeft donkere letters en staat in donker op een lichte plaat (`--logo-bg`). Afbeeldingen met transparante achtergrond en donkere tekst (bijv. de prijsplaatjes op Sponsoring) kunnen in donker minder leesbaar zijn.

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
5. **Engelse versie:** maak `src/content/news-en/<engelse-slug>.md` (zelfde frontmatter en afbeeldingen; alt-tekst van foto's als `Photo for ‘<titel>’`) en koppel de slugs in `newsSlugs` in `src/i18n/index.ts` (Nederlandse slug → Engelse slug). De build faalt als een Engels bericht niet gekoppeld is. Zonder Engelse versie ontbreekt het bericht op de Engelse site en werkt de taalwisselaar op dat bericht niet (die valt terug op de Engelse homepage).
6. Controleer met `npm run dev`. De nieuwste 4 berichten komen vanzelf op de homepage; `/nieuws/` pagineert per 6.

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

## YouTube-video's toevoegen

Op de Oeganda-pagina staat een video-sectie (`src/pages/oeganda.astro`, lijst `videos`). Een video toevoegen of herschikken:

1. Download de miniatuur naar `src/assets/images/` (`https://i.ytimg.com/vi/<ID>/maxresdefault.jpg`; bestaat die niet, gebruik `sddefault.jpg`).
2. Voeg `{ id: '<ID>', title: '<titel>', poster }` toe aan de lijst. De volgorde in de lijst is de volgorde op de pagina.

De miniatuur staat lokaal, dus er gaat pas een verzoek naar YouTube als iemand op afspelen klikt; dan laadt `youtube-nocookie.com` (toegestaan via `frame-src` in `public/_headers`).

**In een nieuwsbericht:** voeg bovenaan in de frontmatter van het bericht toe (de video's staan dan onder de kop, boven de tekst):

```yaml
videos:
  - id: "Qt1-PqSqAcU"
    title: "Titel van de video"
    poster: "../../assets/images/video-Qt1-PqSqAcU-maxresdefault.jpg"
```

## Contactformulier

Het formulier op `/contact/` (en `/en/contact/`) POST naar `/api/contact`; [functions/api/contact.ts](functions/api/contact.ts)
valideert de velden en mailt het bericht via [Resend](https://resend.com) (met `reply-to` = e-mailadres van de bezoeker).
Spamwering: een honeypot-veld (`website`). Zet in Cloudflare onder *Settings → Variables and Secrets* (secrets als *Secret*) en lokaal in `.dev.vars`:

| Variabele | Waar | Doel |
|---|---|---|
| `RESEND_API_KEY` | secret | API-sleutel van Resend |
| `CONTACT_TO` | variabele | ontvangeradres (bijv. `info@breadforthehungryministries.nl`) |
| `CONTACT_FROM` | variabele | afzenderadres op het in Resend geverifieerde domein |

Variabelen gelden pas voor deploys ná het toevoegen. Fouten van Resend staan in Cloudflare onder *Pages → Functions → Real-time logs*.
Meer spamwering nodig? Voeg Cloudflare Turnstile toe (widget in `contact.astro`, token controleren in de Function, CSP in `public/_headers` verruimen voor `https://challenges.cloudflare.com`).

## Vindbaarheid (SEO)

Wat de site automatisch doet:

- Per pagina een zoekwoordgerichte `<title>` (≤ 60 tekens) en meta description (≤ 155 tekens), `seoTitle`/`description` in de `<Layout>`-aanroep van elke pagina. Nieuwsberichten gebruiken hun eigen titel en een ingekorte samenvatting.
- Gestructureerde data (JSON-LD): `NGO`/`Organization` (met ANBI-gegevens, werkgebied Oeganda en Kenia, contactgegevens, `DonateAction`) en `WebSite` op de homepage, `BreadcrumbList` op elke pagina en `NewsArticle` bij elk nieuwsbericht (`src/data/schema.ts`).
- `sitemap-index.xml` (met `lastmod` voor nieuwsberichten), `robots.txt`, canonical-URL's, `hreflang` (nl-NL/en-GB/x-default), Open Graph/Twitter-kaarten, RSS-feeds op `/feed.xml` en `/en/feed.xml` (oude `/feed/` verwijst naar de eerste).
- Snelle pagina's (Lighthouse ≥ 96), semantische koppen, `lang` per taal en alt-teksten op afbeeldingen.

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
