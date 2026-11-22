import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { AppNav } from '@/features/app-shell/AppNav';
import { WeightForm } from '@/features/weights/WeightForm';
import { WeightEntries } from '@/features/weights/WeightEntries';
import { auth } from '@/lib/auth';
import { listMealHistory } from '@/services/meals/meal-service';
import { getOnboardingData } from '@/services/profiles/profile-service';
import { listWeightEntries } from '@/services/weights/weight-service';
import { getSevenDaySummaryRows } from '@/services/days/day-summary-service';

export default async function HistoryPage({
  params,
}: Readonly<{ params: Promise<{ locale: 'fa' | 'en' }> }>) {
  const { locale } = await params;
  setRequestLocale(locale);
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect(`/${locale}/login`);
  const onboarding = await getOnboardingData(session.user.id);
  const timezone = onboarding.profile?.timezone ?? 'Asia/Tehran';
  const [meals, weights, dayRows] = await Promise.all([
    listMealHistory({ userId: session.user.id, timezone }),
    listWeightEntries(session.user.id),
    getSevenDaySummaryRows({ userId: session.user.id, timezone }),
  ]);
  const grouped = Map.groupBy(meals, (meal) => meal.localDate.toISOString().slice(0, 10));
  const t = await getTranslations('history');
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: timezone }).format(new Date());
  return (
    <main className="mx-auto min-h-screen max-w-4xl p-6">
      <AppNav locale={locale} />
      <h1 className="mb-6 text-3xl font-bold">{t('title')}</h1>
      <div className="space-y-4">
        {dayRows.map((row) => {
          const dayMeals = grouped.get(row.localDate) ?? [];
          return (
            <section key={row.localDate} className="rounded-2xl border bg-card p-6 shadow-sm">
              <div className="flex justify-between">
                <h2 className="font-semibold">
                  {new Intl.DateTimeFormat(locale === 'fa' ? 'fa-IR-u-ca-persian' : 'en-US', {
                    dateStyle: 'medium',
                    timeZone: 'UTC',
                  }).format(new Date(`${row.localDate}T00:00:00.000Z`))}
                </h2>
                <span className="text-sm text-muted-foreground">
                  {t('mealCount', { count: row.mealCount })}
                </span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
                <span>{row.completed ? t('dayComplete') : t('dayIncomplete')}</span>
                <span>· {row.nutrition.energyKcal.knownTotal.toFixed(1)} kcal</span>
                {row.nutrition.energyKcal.unknownItemCount > 0 ? (
                  <span>· {t('unknownNutrition')}</span>
                ) : null}
                <span>· {row.hasPlan ? t('hasPlan') : t('noApplicablePlan')}</span>
                {row.energyAlignment ? (
                  <span>· {t(`alignment${row.energyAlignment.status}`)}</span>
                ) : null}
              </div>
              <div className="mt-4 space-y-2">
                {dayMeals.map((meal) => (
                  <article key={meal.id} className="rounded-lg border p-3">
                    {meal.items.map((item) => (
                      <p key={item.id} dir="auto">
                        {item.displayName}
                      </p>
                    ))}
                  </article>
                ))}
              </div>
            </section>
          );
        })}
      </div>
      <section className="mt-6 rounded-2xl border bg-card p-6 shadow-sm">
        <h2 className="mb-4 text-xl font-semibold">{t('weightTitle')}</h2>
        {!onboarding.preferences?.weightTrackingEnabled ? (
          <p className="text-sm text-muted-foreground">{t('weightTrackingDisabled')}</p>
        ) : (
          <WeightForm
            locale={locale}
            today={today}
            initialWeightKg={
              weights.length === 0 ? onboarding.profile?.profileWeightKg?.toString() : undefined
            }
          />
        )}
        {onboarding.preferences?.weightTrackingEnabled && weights.length === 0 ? (
          <p className="mt-5 text-sm text-muted-foreground">{t('noWeights')}</p>
        ) : onboarding.preferences?.weightTrackingEnabled ? (
          <WeightEntries
            locale={locale}
            entries={weights.map((entry) => ({
              id: entry.id,
              measuredOn: entry.measuredOn.toISOString().slice(0, 10),
              weightKg: entry.weightKg.toString(),
              note: entry.note ?? '',
            }))}
          />
        ) : null}
      </section>
    </main>
  );
}
