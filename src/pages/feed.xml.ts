import type { APIContext } from 'astro';
import { newsFeed } from '../utils/feed';

export const GET = (context: APIContext) => newsFeed(context, 'nl');
