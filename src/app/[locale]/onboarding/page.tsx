import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import { OnboardingForm } from '@/features/onboarding/OnboardingForm';
import { auth } from '@/lib/auth';
import { getOnboardingData } from '@/services/profiles/profile-service';

export default async function OnboardingPage({
  params,
}: Readonly<{ params: Promise<{ locale: 'fa' | 'en' }> }>) {
  const { locale } = await params;
  setRequestLocale(locale);
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect(`/${locale}/login`);
  const onboarding = await getOnboardingData(session.user.id);
  const profile = onboarding.profile;
  if (profile?.onboardingCompleteAt) redirect(`/${locale}/today`);
  const t = await getTranslations('onboarding');
  return (
    <main className="grid min-h-screen place-items-center bg-muted/25 p-6">
      <section className="w-full max-w-md rounded-2xl border bg-card p-7 shadow-sm">
        <h1 className="text-2xl font-bold">{t('title')}</h1>
        <div className="mt-6">
          <OnboardingForm
            locale={locale}
            initial={{
              step: profile?.onboardingStep ?? 2,
              age: profile?.age,
              preferredName: profile?.preferredName,
              unitSystem: profile?.unitSystem,
              heightCm: profile?.heightCm?.toString(),
              profileWeightKg: profile?.profileWeightKg?.toString(),
              birthYear: profile?.birthYear,
              timezone: profile?.timezone,
            }}
          />
        </div>
      </section>
    </main>
  );
}
