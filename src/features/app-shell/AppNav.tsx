import Link from 'next/link';
import { getTranslations } from 'next-intl/server';

export async function AppNav({ locale }: Readonly<{ locale: string }>) {
  const t = await getTranslations('appNav');
  return (
    <nav aria-label="Primary" className="mb-6 flex flex-wrap gap-2 border-b pb-4 text-sm">
      <Link className="rounded-md px-3 py-2 hover:bg-muted" href={`/${locale}/today`}>
        {t('today')}
      </Link>
      <Link className="rounded-md px-3 py-2 hover:bg-muted" href={`/${locale}/history`}>
        {t('history')}
      </Link>
      <Link className="rounded-md px-3 py-2 hover:bg-muted" href={`/${locale}/plan`}>
        {t('plan')}
      </Link>
      <Link
        className="rounded-md bg-primary px-3 py-2 text-primary-foreground"
        href={`/${locale}/meals/new`}
      >
        {t('logMeal')}
      </Link>
      <Link className="rounded-md px-3 py-2 hover:bg-muted" href={`/${locale}/settings`}>
        {t('settings')}
      </Link>
    </nav>
  );
}
