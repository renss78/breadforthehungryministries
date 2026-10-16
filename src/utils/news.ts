import { getCollection } from 'astro:content';
import type { Lang } from '../i18n';

/** Nieuwsberichten in de gevraagde taal, nieuwste eerst. */
export const getNews = async (lang: Lang) =>
  (await getCollection(lang === 'en' ? 'newsEn' : 'news')).sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
