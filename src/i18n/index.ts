/**
 * Tweetalig: Nederlands is de hoofdtaal (op de root, `/…`), Engels staat onder `/en/…`.
 * Pagina's kiezen hun taal aan de hand van de URL (`getLang(Astro.url)`).
 */
export type Lang = 'nl' | 'en';
export const langs: Lang[] = ['nl', 'en'];
export const defaultLang: Lang = 'nl';

export const getLang = (url: URL): Lang => (url.pathname === '/en' || url.pathname.startsWith('/en/') ? 'en' : 'nl');

/** BCP 47-tags voor `<html lang>`, hreflang en Intl. */
export const bcp47: Record<Lang, string> = { nl: 'nl-NL', en: 'en-GB' };
export const ogLocale: Record<Lang, string> = { nl: 'nl_NL', en: 'en_GB' };

/** Vaste pagina's: dezelfde pagina in beide talen. */
export const routes = {
  home: { nl: '/', en: '/en/' },
  news: { nl: '/nieuws/', en: '/en/news/' },
  uganda: { nl: '/oeganda/', en: '/en/uganda/' },
  kenya: { nl: '/kenia/', en: '/en/kenya/' },
  media: { nl: '/media/', en: '/en/media/' },
  sponsorship: { nl: '/sponsoring/', en: '/en/sponsorship/' },
  about: { nl: '/over/', en: '/en/about/' },
  board: { nl: '/bestuur/', en: '/en/board/' },
  anbi: { nl: '/anbi-profiel/', en: '/en/anbi-profile/' },
  contact: { nl: '/contact/', en: '/en/contact/' },
  feed: { nl: '/feed.xml', en: '/en/feed.xml' },
} as const;
export type RouteKey = keyof typeof routes;

export const route = (key: RouteKey, lang: Lang) => routes[key][lang];

/**
 * Nieuwsberichten: Nederlandse slug → Engelse slug. Elk Engels bericht (`src/content/news-en/<slug>.md`)
 * moet hier staan; de taalwisselaar en de hreflang-links gebruiken deze tabel.
 */
export const newsSlugs: Record<string, string> = {
  'hello-world': 'welcome-to-our-new-website',
  'nieuwe-bijbelscholen': 'new-bible-schools',
  'oogsttijd-in-oeganda-een-beweging-van-geloof-groei-en-genade': 'harvest-time-in-uganda-a-movement-of-faith-growth-and-grace',
  'bezoek-kenia-november-2025': 'visit-to-kenya-november-2025',
  'nieuwsupdate-oeganda': 'news-update-uganda',
  'nieuwsupdate-vanuit-kenia': 'news-update-from-kenya',
  'distributie-van-bijbels-is-in-volle-gang-in-oeganda': 'bible-distribution-in-full-swing-in-uganda',
  'nieuwsupdate-van-6-februari-een-dag-van-doorbraak-en-genade': 'news-update-6-february-a-day-of-breakthrough-and-grace',
  'nieuwsupdate-van-7-februari-gods-werk-vandaag-in-volle-kracht': 'news-update-7-february-gods-work-today-in-full-power',
  'nieuwsupdate-van-8-februari-op-de-terugweg-uit-entebbe-massale-bekeringen-en-genezingen-zetten-door':
    'news-update-8-february-on-the-way-back-from-entebbe-mass-conversions-and-healings-continue',
  'verslag-van-onze-laatste-missietrip-naar-oeganda': 'report-on-our-latest-mission-trip-to-uganda',
  zendingsprojecten: 'mission-projects',
};
const newsSlugsEn = Object.fromEntries(Object.entries(newsSlugs).map(([nl, en]) => [en, nl]));

/** Pad van een nieuwsbericht, gegeven de id (slug) in de taal van de collectie. */
export const postPath = (id: string, lang: Lang) => (lang === 'en' ? `/en/${id}/` : `/${id}/`);
/** Pad van hetzelfde bericht in een andere taal (vanaf de Nederlandse slug). */
export const postPathFromNl = (nlId: string, lang: Lang) => {
  const id = lang === 'en' ? newsSlugs[nlId] : nlId;
  if (!id) throw new Error(`Geen Engelse slug voor nieuwsbericht "${nlId}" (zie src/i18n/index.ts)`);
  return postPath(id, lang);
};
export const nlIdOfEn = (enId: string) => {
  const nl = newsSlugsEn[enId];
  if (!nl) throw new Error(`Engels nieuwsbericht "${enId}" staat niet in newsSlugs (src/i18n/index.ts)`);
  return nl;
};

/** Hetzelfde pad in de andere taal (voor de taalwisselaar en hreflang). */
export const switchPath = (pathname: string, to: Lang): string => {
  const path = pathname.endsWith('/') || pathname.includes('.') ? pathname : `${pathname}/`;
  const from = getLang(new URL(path, 'https://x'));
  if (from === to) return path;

  for (const r of Object.values(routes)) if (r[from] === path) return r[to];

  // Paginering van het nieuwsoverzicht: /nieuws/2/ ↔ /en/news/2/
  const fromNews = routes.news[from];
  if (path.startsWith(fromNews)) return routes.news[to] + path.slice(fromNews.length);

  // Nieuwsbericht: /<slug>/ ↔ /en/<slug>/
  const slug = from === 'en' ? path.replace(/^\/en\//, '').replace(/\/$/, '') : path.replace(/^\//, '').replace(/\/$/, '');
  const target = from === 'nl' ? newsSlugs[slug] : newsSlugsEn[slug];
  if (target) return postPath(target, to);

  return routes.home[to];
};

const dateFormatters = Object.fromEntries(
  langs.map((l) => [l, new Intl.DateTimeFormat(bcp47[l], { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Amsterdam' })]),
) as Record<Lang, Intl.DateTimeFormat>;
export const formatDateLang = (date: Date, lang: Lang) => dateFormatters[lang].format(date);

/** Vaste interface-teksten (header, footer, knoppen). Paginateksten staan in de pagina's zelf. */
export const ui = {
  nl: {
    skip: 'Naar de inhoud',
    homeLabel: 'Bread for the Hungry Ministries — naar de homepage',
    homeLabelFooter: 'Naar de homepage',
    mainMenu: 'Hoofdmenu',
    mobileMenu: 'Mobiel menu',
    footerMenu: 'Footermenu',
    menu: 'Menu',
    menuClose: 'Menu sluiten',
    home: 'Home',
    support: 'Steun ons',
    language: 'Taal',
    tagline: 'Jezus zichtbaar maken in woord en daad, gedreven door Gods liefde.',
    navigation: 'Navigatie',
    contact: 'Contact',
    anbi: 'ANBI',
    anbiProfile: 'ANBI Profiel',
    rights: 'Alle rechten voorbehouden.',
    readMore: 'Lees verder',
    ctaTitle: 'Sponsoring',
    ctaText:
      'Wij zoeken donateurs om dit waardevolle werk voort te zetten. U kunt een student of aankomend pastor steunen met €35 per maand (tien maanden). Ook sponsors voor onze pastorconferentie en projecten zijn van harte welkom — elke euro wordt goed besteed!',
    ctaButton: 'Steun onze missie',
    feedTitle: 'Nieuws',
    feedDescription: 'Nieuwsupdates van het zendingswerk in Oeganda en Kenia.',
    photo: 'Foto',
    video: "Video's",
  },
  en: {
    skip: 'Skip to content',
    homeLabel: 'Bread for the Hungry Ministries — go to the homepage',
    homeLabelFooter: 'Go to the homepage',
    mainMenu: 'Main menu',
    mobileMenu: 'Mobile menu',
    footerMenu: 'Footer menu',
    menu: 'Menu',
    menuClose: 'Close menu',
    home: 'Home',
    support: 'Support us',
    language: 'Language',
    tagline: 'Making Jesus visible in word and deed, driven by God’s love.',
    navigation: 'Navigation',
    contact: 'Contact',
    anbi: 'ANBI',
    anbiProfile: 'ANBI profile',
    rights: 'All rights reserved.',
    readMore: 'Read more',
    ctaTitle: 'Sponsorship',
    ctaText:
      'We are looking for donors to continue this valuable work. You can support a student or future pastor with €35 per month (for ten months). Sponsors for our pastors’ conference and projects are also very welcome — every euro is spent well!',
    ctaButton: 'Support our mission',
    feedTitle: 'News',
    feedDescription: 'News updates from the mission work in Uganda and Kenya.',
    photo: 'Photo',
    video: 'Videos',
  },
} as const;

/** Korte hulp voor teksten in pagina's: `const l = pick(lang); l('Nederlands', 'English')`. */
export const pick = (lang: Lang) => (nl: string, en: string) => (lang === 'nl' ? nl : en);
