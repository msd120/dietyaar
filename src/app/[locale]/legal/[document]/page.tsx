import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';

export default async function LegalPage({
  params,
}: {
  params: Promise<{ locale: 'fa' | 'en'; document: string }>;
}) {
  const { locale, document } = await params;
  setRequestLocale(locale);
  if (document !== 'privacy' && document !== 'terms') notFound();
  const t = await getTranslations('legal');
  const title = document === 'privacy' ? t('privacyTitle') : t('termsTitle');
  const body = document === 'privacy' ? t('privacyBody') : t('termsBody');
  return (
    <main className="mx-auto min-h-screen max-w-3xl p-6">
      <article className="rounded-2xl border bg-card p-6 shadow-sm">
        <h1 className="text-3xl font-bold">{title}</h1>
        <p className="mt-5 leading-8 text-muted-foreground">{body}</p>
      </article>
    </main>
  );
}
