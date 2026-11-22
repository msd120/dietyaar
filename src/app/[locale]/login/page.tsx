import { getTranslations, setRequestLocale } from 'next-intl/server';
import { LoginForm } from '@/features/identity/LoginForm';

export default async function LoginPage({
  params,
}: Readonly<{ params: Promise<{ locale: string }> }>) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('login');
  return (
    <main className="grid min-h-screen place-items-center bg-muted/25 p-6">
      <section className="w-full max-w-md rounded-2xl border bg-card p-7 shadow-sm">
        <h1 className="text-2xl font-bold">{t('title')}</h1>
        <div className="mt-6">
          <LoginForm locale={locale} />
        </div>
      </section>
    </main>
  );
}
