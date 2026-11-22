import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { DemoLogin } from '@/features/demo/DemoLogin';
import { auth } from '@/lib/auth';
import { getOnboardingProgress } from '@/services/profiles/profile-service';

export default async function FoundationPage({
  params,
}: Readonly<{ params: Promise<{ locale: string }> }>) {
  const { locale } = await params;
  setRequestLocale(locale);
  const session = await auth.api.getSession({ headers: await headers() });
  if (session) {
    const progress = await getOnboardingProgress(session.user.id);
    if (progress && progress.onboardingStep < 9) {
      redirect(`/${locale}/demo/O${String(progress.onboardingStep).padStart(2, '0')}`);
    }
    redirect(`/${locale}/demo/T01`);
  }
  return <DemoLogin locale={locale} />;
}
