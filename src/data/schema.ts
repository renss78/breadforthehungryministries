import { site, siteDescription } from './site';
import { bcp47, route, type Lang } from '../i18n';

const abs = (path: string) => new URL(path, site.url).href;

/** Organisation + website graph (homepage). Facts come from the ANBI profile and contact page. */
export const organizationGraph = (lang: Lang = 'nl') => {
  const en = lang === 'en';
  return [
  {
    '@type': ['NGO', 'Organization'],
    '@id': `${site.url}/#organization`,
    name: site.name,
    legalName: 'Stichting Bread for the Hungry Ministries',
    alternateName: 'Bread for the Hungry',
    url: abs(route('home', lang)),
    logo: { '@type': 'ImageObject', url: abs('/logo-512.png'), width: 512, height: 512 },
    image: abs('/logo-512.png'),
    description: siteDescription(lang),
    email: site.email,
    telephone: '+31655750601',
    foundingDate: '2017-02-24',
    address: { '@type': 'PostalAddress', addressLocality: 'Zwijndrecht', addressCountry: 'NL' },
    identifier: [
      { '@type': 'PropertyValue', propertyID: 'KvK', value: site.kvk },
      { '@type': 'PropertyValue', propertyID: 'RSIN', value: site.rsin },
    ],
    areaServed: [
      { '@type': 'Country', name: en ? 'Uganda' : 'Oeganda' },
      { '@type': 'Country', name: en ? 'Kenya' : 'Kenia' },
    ],
    knowsAbout: en
      ? ['mission work', 'Bible schools', 'church planting', 'pastors’ conferences', 'water wells', 'agricultural projects']
      : ['zendingswerk', 'bijbelscholen', 'kerkplanting', 'pastorconferenties', 'waterputten', 'agrarische projecten'],
    contactPoint: { '@type': 'ContactPoint', contactType: 'customer support', email: site.email, telephone: '+31655750601', availableLanguage: ['nl', 'en'] },
    potentialAction: { '@type': 'DonateAction', name: en ? 'Support us' : 'Steun ons', target: abs(route('sponsorship', lang)) },
  },
  {
    '@type': 'WebSite',
    '@id': `${site.url}/#website`,
    url: abs(route('home', lang)),
    name: site.name,
    inLanguage: bcp47[lang],
    publisher: { '@id': `${site.url}/#organization` },
  },
  ];
};

export type Crumb = { name: string; path: string };

export const breadcrumbList = (crumbs: Crumb[]) => ({
  '@type': 'BreadcrumbList',
  itemListElement: crumbs.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c.name, item: abs(c.path) })),
});

export const newsArticle = (a: { title: string; description: string; path: string; image: string; published: Date; lang?: Lang }) => ({
  '@type': 'NewsArticle',
  headline: a.title,
  description: a.description,
  url: abs(a.path),
  mainEntityOfPage: abs(a.path),
  image: [a.image],
  datePublished: a.published.toISOString(),
  dateModified: a.published.toISOString(),
  inLanguage: bcp47[a.lang ?? 'nl'],
  author: { '@id': `${site.url}/#organization` },
  publisher: { '@id': `${site.url}/#organization` },
});
