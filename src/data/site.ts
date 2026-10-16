import { route, type Lang } from '../i18n';

export const site = {
  name: 'Bread for the Hungry Ministries',
  shortName: 'Bread for the Hungry',
  url: 'https://breadforthehungryministries.nl',
  description:
    'Bread for the Hungry Ministries zet zich in voor bijbelscholen, seminars en pastorconferenties in Kenia en Oeganda en steunt kansarme gemeenschappen met waterputten en agrarische projecten.',
  descriptionEn:
    'Bread for the Hungry Ministries supports Bible schools, seminars and pastors’ conferences in Kenya and Uganda, and helps disadvantaged communities with wells and agricultural projects.',
  email: 'info@breadforthehungryministries.nl',
  phone: '0655750601',
  /** Internationaal formaat voor wa.me-links (zonder +). */
  whatsapp: '31655750601',
  iban: 'NL11RABO 0317 2284 63',
  kvk: '68179901',
  rsin: '857334591',
  locale: 'nl_NL',
};

export const siteDescription = (lang: Lang) => (lang === 'en' ? site.descriptionEn : site.description);

export type NavItem = { label: string; href: string; children?: { label: string; href: string }[] };

export const getNav = (lang: Lang): NavItem[] => {
  const nl = lang === 'nl';
  return [
    { label: nl ? 'Nieuws' : 'News', href: route('news', lang) },
    {
      label: nl ? 'Projecten' : 'Projects',
      href: '#',
      children: [
        { label: nl ? 'Oeganda' : 'Uganda', href: route('uganda', lang) },
        { label: nl ? 'Kenia' : 'Kenya', href: route('kenya', lang) },
      ],
    },
    { label: 'Media', href: route('media', lang) },
    { label: nl ? 'Sponsoring' : 'Sponsorship', href: route('sponsorship', lang) },
    {
      label: nl ? 'Over ons' : 'About us',
      href: '#',
      children: [
        { label: nl ? 'Over ons' : 'About us', href: route('about', lang) },
        { label: nl ? 'Het Bestuur' : 'The Board', href: route('board', lang) },
        { label: nl ? 'ANBI Profiel' : 'ANBI profile', href: route('anbi', lang) },
      ],
    },
    { label: 'Contact', href: route('contact', lang) },
  ];
};
