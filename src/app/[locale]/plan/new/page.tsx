import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { defaultEffectiveDate } from '@/domain/plans/timeline';
import { AppNav } from '@/features/app-shell/AppNav';
import { ManualPlanForm } from '@/features/plans/ManualPlanForm';
import { auth } from '@/lib/auth';
import { getOwnedPlanDraft, getPlanOverview } from '@/services/plans/plan-service';
import { getOnboardingData } from '@/services/profiles/profile-service';

function localDate(timezone: string) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value;
  return `${value('year')}-${value('month')}-${value('day')}`;
}

export default async function NewPlanPage({
  params,
  searchParams,
}: Readonly<{
  params: Promise<{ locale: 'fa' | 'en' }>;
  searchParams: Promise<{ draft?: string }>;
}>) {
  const { locale } = await params;
  setRequestLocale(locale);
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect(`/${locale}/login`);
  const query = await searchParams;
  const [onboarding, overview, draft] = await Promise.all([
    getOnboardingData(session.user.id),
    getPlanOverview(session.user.id),
    typeof query.draft === 'string' ? getOwnedPlanDraft(session.user.id, query.draft) : null,
  ]);
  const today = localDate(onboarding.profile?.timezone ?? 'Asia/Tehran');
  const effectiveFrom = defaultEffectiveDate(today, overview.versions.length > 0);
  const t = await getTranslations('manualPlan');
  return (
    <main className="mx-auto min-h-screen max-w-3xl p-6">
      <AppNav locale={locale} />
      <section className="rounded-2xl border bg-card p-6 shadow-sm">
        <h1 className="mb-6 text-2xl font-bold">{t('newTitle')}</h1>
        <ManualPlanForm
          locale={locale}
          effectiveFrom={effectiveFrom}
          initialDraft={
            draft
              ? {
                  id: draft.id,
                  revision: draft.revision,
                  title: draft.title ?? '',
                  sourceNote: draft.sourceNote ?? '',
                  content: draft.content,
                }
              : undefined
          }
        />
      </section>
    </main>
  );
}
