export const site = {
  name: 'Bread for the Hungry Ministries',
  url: 'https://breadforthehungryministries.nl',
  description:
    'Bread for the Hungry Ministries zet zich in voor bijbelscholen, seminars en pastorconferenties in Kenia en Oeganda en steunt kansarme gemeenschappen met waterputten en agrarische projecten.',
  email: 'info@breadforthehungryministries.nl',
  phone: '0655750601',
  iban: 'NL11RABO 0317 2284 63',
  kvk: '68179901',
  rsin: '857334591',
  locale: 'nl_NL',
};

export type NavItem = { label: string; href: string; children?: { label: string; href: string }[] };

export const nav: NavItem[] = [
  { label: 'Nieuws', href: '/nieuws/' },
  {
    label: 'Projecten',
    href: '#',
    children: [
      { label: 'Oeganda', href: '/oeganda/' },
      { label: 'Kenia', href: '/kenia/' },
      { label: 'Media', href: '/media/' },
    ],
  },
  { label: 'Sponsoring', href: '/sponsoring/' },
  {
    label: 'Over ons',
    href: '#',
    children: [
      { label: 'Over ons', href: '/over/' },
      { label: 'Het Bestuur', href: '/bestuur/' },
      { label: 'ANBI Profiel', href: '/anbi-profiel/' },
    ],
  },
  { label: 'Contact', href: '/contact/' },
];
