import { headers } from 'next/headers';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { AppNav } from '@/features/app-shell/AppNav';
import { SettingsForm } from '@/features/settings/SettingsForm';
import { AccountControls } from '@/features/settings/AccountControls';
import { auth } from '@/lib/auth';
import { getOnboardingData } from '@/services/profiles/profile-service';
export default async function SettingsPage({
  params,
}: {
  params: Promise<{ locale: 'fa' | 'en' }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect(`/${locale}/login`);
  const data = await getOnboardingData(session.user.id);
  const p = data.profile;
  const pref = data.preferences;
  const granted = (purpose: string) =>
    data.consents.some((c) => c.purpose === purpose && c.grantedAt && !c.revokedAt);
  const t = await getTranslations('settings');
  return (
    <main className="mx-auto min-h-screen max-w-3xl p-6">
      <AppNav locale={locale} />
      <section className="rounded-2xl border bg-card p-6">
        <h1 className="mb-6 text-3xl font-bold">{t('title')}</h1>
        <SettingsForm
          locale={locale}
          initial={{
            preferredName: p?.preferredName ?? '',
            unitSystem: p?.unitSystem ?? 'METRIC',
            heightCm: p?.heightCm?.toString() ?? '',
            profileWeightKg: p?.profileWeightKg?.toString() ?? '',
            birthYear: p?.birthYear?.toString() ?? '',
            gender: p?.gender ?? '',
            genderSelfDescription: p?.genderSelfDescription ?? '',
            timezone: p?.timezone ?? 'Asia/Tehran',
            morningTime: pref?.morningTime ?? '08:00',
            theme: pref?.theme ?? 'SYSTEM',
            planImage: granted('PLAN_IMAGE'),
            mealImage: granted('MEAL_IMAGE'),
            aiReflection: granted('AI_REFLECTION'),
            weightTrackingEnabled: pref?.weightTrackingEnabled ?? false,
          }}
        />
        <AccountControls locale={locale} />
        <nav className="mt-8 flex flex-wrap gap-4 border-t pt-6 text-sm">
          <Link className="underline" href={`/${locale}/legal/privacy`}>
            {t('privacy')}
          </Link>
          <Link className="underline" href={`/${locale}/legal/terms`}>
            {t('terms')}
          </Link>
        </nav>
      </section>
    </main>
  );
}
