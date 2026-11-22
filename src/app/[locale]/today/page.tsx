import { headers } from 'next/headers';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { AppNav } from '@/features/app-shell/AppNav';
import { TodayActions } from '@/features/today/TodayActions';
import { ReflectionFeedback } from '@/features/today/ReflectionFeedback';
import { auth } from '@/lib/auth';
import { getTodayDaySummary } from '@/services/days/day-summary-service';
import { getOnboardingData } from '@/services/profiles/profile-service';
import { getOrCreateDeterministicReflection } from '@/services/reflections/reflection-service';

function snapshotText(snapshot: unknown, key: string) {
  if (!snapshot || typeof snapshot !== 'object' || Array.isArray(snapshot)) return null;
  const value = (snapshot as Record<string, unknown>)[key];
  return typeof value === 'string' ? value : null;
}

export default async function TodayPage({
  params,
}: Readonly<{ params: Promise<{ locale: 'fa' | 'en' }> }>) {
  const { locale } = await params;
  setRequestLocale(locale);
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect(`/${locale}/login`);
  const onboarding = await getOnboardingData(session.user.id);
  const timezone = onboarding.profile?.timezone ?? 'Asia/Tehran';
  const summary = await getTodayDaySummary({ userId: session.user.id, timezone });
  const plan = summary.planVersion;
  const reflection = await getOrCreateDeterministicReflection({
    userId: session.user.id,
    localDate: summary.localDate,
    mealCount: summary.meals.length,
    unknownEnergyItemCount: summary.nutrition.energyKcal.unknownItemCount,
    sourceRevision: summary.sourceRevision,
  });
  const t = await getTranslations('today');
  const nav = await getTranslations('appNav');
  return (
    <main className="mx-auto min-h-screen max-w-4xl p-6">
      <AppNav locale={locale} />
      <h1 className="mb-6 text-3xl font-bold">{t('title')}</h1>
      <div className="grid gap-5 md:grid-cols-2">
        <section className="rounded-2xl border bg-card p-6 shadow-sm">
          <h2 className="text-sm font-medium text-muted-foreground">{t('knownEnergy')}</h2>
          <p className="mt-2 text-4xl font-bold">
            {new Intl.NumberFormat(locale === 'fa' ? 'fa-IR' : 'en-US', {
              maximumFractionDigits: 1,
            }).format(summary.nutrition.energyKcal.knownTotal)}{' '}
            <span className="text-sm font-normal">kcal</span>
          </p>
          {summary.nutrition.energyKcal.unknownItemCount > 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">
              {t('unknownNotice', { count: summary.nutrition.energyKcal.unknownItemCount })}
            </p>
          ) : null}
        </section>
        <section className="rounded-2xl border bg-card p-6 shadow-sm">
          <h2 className="font-semibold">{t('plan')}</h2>
          {plan ? (
            <>
              <p className="mt-3" dir="auto">
                {summary.plan?.title ?? snapshotText(plan.snapshot, 'title') ?? t('plan')}
              </p>
              <p className="mt-2 text-sm text-muted-foreground" dir="auto">
                {snapshotText(plan.snapshot, 'mealGuidance')}
              </p>
            </>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">{t('noPlan')}</p>
          )}
        </section>
      </div>
      <section className="mt-5 rounded-2xl border bg-card p-6 shadow-sm">
        <h2 className="font-semibold">{t('nutrients')}</h2>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {(['proteinG', 'carbohydrateG', 'fatG', 'fiberG'] as const).map((key) => (
            <div className="rounded-lg bg-muted/40 p-3" key={key}>
              <p className="text-xs text-muted-foreground">{t(key)}</p>
              <p className="mt-1 font-semibold">
                {summary.nutrition[key].knownTotal.toFixed(1)} g
                {summary.nutrition[key].unknownItemCount > 0 ? ` ${t('atLeast')}` : ''}
              </p>
            </div>
          ))}
        </div>
        {Object.keys(summary.alignment).length > 0 ? (
          <div className="mt-4 space-y-2">
            {Object.entries(summary.alignment).map(([key, result]) => (
              <p className="text-sm" key={key}>
                {t(key as 'energyKcal' | 'proteinG' | 'carbohydrateG' | 'fatG' | 'fiberG')}:{' '}
                {t(
                  result.knownAlreadyAbove
                    ? 'alignmentKnownAbove'
                    : result.status === 'ABOVE'
                      ? 'alignmentAbove'
                      : result.status === 'BELOW'
                        ? 'alignmentBelow'
                        : result.status === 'WITHIN' || result.status === 'EXACT'
                          ? 'alignmentWithin'
                          : result.status === 'PARTIAL'
                            ? 'alignmentPartial'
                            : 'alignmentUnknown',
                )}
              </p>
            ))}
          </div>
        ) : (
          <p className="mt-4 text-sm text-muted-foreground">{t('noNumericTargets')}</p>
        )}
      </section>
      <section className="mt-5 rounded-2xl border bg-card p-6 shadow-sm">
        {summary.meals.length === 0 ? (
          <p className="text-muted-foreground">{t('noMeals')}</p>
        ) : (
          <div className="space-y-3">
            {summary.meals.map((meal) => (
              <article key={meal.id} className="rounded-xl border p-4">
                <time className="text-xs text-muted-foreground">
                  {new Intl.DateTimeFormat(locale === 'fa' ? 'fa-IR' : 'en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                    timeZone: timezone,
                  }).format(meal.consumedAtUtc)}
                </time>
                {meal.items.map((item) => (
                  <div key={item.id} className="mt-2 flex justify-between gap-4">
                    <span dir="auto">{item.displayName}</span>
                    <span>{item.energyKcal?.toString() ?? '—'} kcal</span>
                  </div>
                ))}
              </article>
            ))}
          </div>
        )}
        <Link
          className="mt-5 inline-block rounded-md bg-primary px-4 py-2 text-primary-foreground"
          href={`/${locale}/meals/new`}
        >
          {nav('logMeal')}
        </Link>
        <TodayActions
          locale={locale}
          localDate={summary.localDate}
          completed={summary.completed}
          meals={summary.meals.map((meal) => ({
            id: meal.id,
            revision: meal.revision,
            displayName: meal.items[0]?.displayName ?? '',
            grams: meal.items[0]?.grams?.toString() ?? '',
            energyKcal: meal.items[0]?.energyKcal?.toString() ?? '',
          }))}
          planVersionId={summary.planVersion?.id}
          slots={summary.slots.map((slot) => ({
            id: slot.id,
            label: slot.label,
            state: slot.state,
          }))}
        />
      </section>
      <section className="mt-5 rounded-2xl border bg-card p-6 shadow-sm">
        <h2 className="font-semibold">{t('reflectionTitle')}</h2>
        <p className="mt-3 text-sm leading-7 text-muted-foreground">
          {t(
            reflection.templateKey === 'noMeals'
              ? 'reflectionNoMeals'
              : reflection.templateKey === 'someUnknowns'
                ? 'reflectionSomeUnknowns'
                : 'reflectionMealsRecorded',
          )}
        </p>
        <ReflectionFeedback locale={locale} reflectionId={reflection.id} />
      </section>
    </main>
  );
}
