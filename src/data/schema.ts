import { site } from './site';

const abs = (path: string) => new URL(path, site.url).href;

/** Organisation + website graph (homepage). Facts come from the ANBI profile and contact page. */
export const organizationGraph = () => [
  {
    '@type': ['NGO', 'Organization'],
    '@id': `${site.url}/#organization`,
    name: site.name,
    legalName: 'Stichting Bread for the Hungry Ministries',
    alternateName: 'Bread for the Hungry',
    url: `${site.url}/`,
    logo: { '@type': 'ImageObject', url: abs('/logo-512.png'), width: 512, height: 512 },
    image: abs('/logo-512.png'),
    description: site.description,
    email: site.email,
    telephone: '+31655750601',
    foundingDate: '2017-02-24',
    address: { '@type': 'PostalAddress', addressLocality: 'Zwijndrecht', addressCountry: 'NL' },
    identifier: [
      { '@type': 'PropertyValue', propertyID: 'KvK', value: site.kvk },
      { '@type': 'PropertyValue', propertyID: 'RSIN', value: site.rsin },
    ],
    areaServed: [
      { '@type': 'Country', name: 'Oeganda' },
      { '@type': 'Country', name: 'Kenia' },
    ],
    knowsAbout: ['zendingswerk', 'bijbelscholen', 'kerkplanting', 'pastorconferenties', 'waterputten', 'agrarische projecten'],
    contactPoint: { '@type': 'ContactPoint', contactType: 'customer support', email: site.email, telephone: '+31655750601', availableLanguage: 'nl' },
    potentialAction: { '@type': 'DonateAction', name: 'Steun ons', target: abs('/sponsoring/') },
  },
  {
    '@type': 'WebSite',
    '@id': `${site.url}/#website`,
    url: `${site.url}/`,
    name: site.name,
    inLanguage: 'nl-NL',
    publisher: { '@id': `${site.url}/#organization` },
  },
];

export type Crumb = { name: string; path: string };

export const breadcrumbList = (crumbs: Crumb[]) => ({
  '@type': 'BreadcrumbList',
  itemListElement: crumbs.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c.name, item: abs(c.path) })),
});

export const newsArticle = (a: { title: string; description: string; path: string; image: string; published: Date }) => ({
  '@type': 'NewsArticle',
  headline: a.title,
  description: a.description,
  url: abs(a.path),
  mainEntityOfPage: abs(a.path),
  image: [a.image],
  datePublished: a.published.toISOString(),
  dateModified: a.published.toISOString(),
  inLanguage: 'nl-NL',
  author: { '@id': `${site.url}/#organization` },
  publisher: { '@id': `${site.url}/#organization` },
});
