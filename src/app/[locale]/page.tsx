import { getTranslations, setRequestLocale } from 'next-intl/server';

export default async function FoundationPage({
  params,
}: Readonly<{ params: Promise<{ locale: string }> }>) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('foundation');

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl items-center px-6 py-16 sm:px-10">
      <section className="max-w-3xl space-y-6">
        <p className="text-sm font-semibold tracking-wide text-primary">{t('eyebrow')}</p>
        <h1 className="text-balance text-4xl font-semibold leading-tight sm:text-6xl">
          {t('title')}
        </h1>
        <p className="max-w-2xl text-lg leading-8 text-muted-foreground">{t('description')}</p>
        <p className="inline-flex rounded-full border border-border bg-card px-4 py-2 text-sm">
          {t('status')}
        </p>
      </section>
    </main>
  );
}
