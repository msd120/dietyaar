import { hasLocale } from 'next-intl';
import { getRequestConfig } from 'next-intl/server';
import { en } from '@/messages/en';
import { fa } from '@/messages/fa';
import { routing } from './routing';

const dictionaries = { en, fa } as const;

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale;
  return { locale, messages: dictionaries[locale] };
});
