import { headers } from 'next/headers';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { AppNav } from '@/features/app-shell/AppNav';
import { PlanVersionActions } from '@/features/plans/PlanVersionActions';
import { auth } from '@/lib/auth';
import { getPlanOverview } from '@/services/plans/plan-service';

function titleOf(snapshot: unknown) {
  if (!snapshot || typeof snapshot !== 'object' || Array.isArray(snapshot)) return null;
  const title = (snapshot as Record<string, unknown>).title;
  return typeof title === 'string' ? title : null;
}

export default async function PlanPage({
  params,
}: Readonly<{ params: Promise<{ locale: 'fa' | 'en' }> }>) {
  const { locale } = await params;
  setRequestLocale(locale);
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect(`/${locale}/login`);
  const overview = await getPlanOverview(session.user.id);
  const t = await getTranslations('manualPlan');
  return (
    <main className="mx-auto min-h-screen max-w-4xl p-6">
      <AppNav locale={locale} />
      <div className="mb-6 flex items-center justify-between gap-4">
        <h1 className="text-3xl font-bold">{t('overviewTitle')}</h1>
        <Link
          className="rounded-md bg-primary px-4 py-2 text-primary-foreground"
          href={`/${locale}/plan/new`}
        >
          {t('add')}
        </Link>
      </div>
      {overview.versions.length === 0 ? (
        <p className="rounded-2xl border bg-card p-6 text-muted-foreground">{t('noPlan')}</p>
      ) : (
        <div className="space-y-4">
          {overview.versions.map((version) => (
            <article key={version.id} className="rounded-2xl border bg-card p-6 shadow-sm">
              <div className="flex flex-wrap justify-between gap-3">
                <h2 className="font-semibold" dir="auto">
                  {titleOf(version.snapshot) ?? t('overviewTitle')}
                </h2>
                <span className="rounded-full bg-muted px-3 py-1 text-xs">
                  {t(
                    version.status === 'ACTIVE'
                      ? 'active'
                      : version.status === 'SCHEDULED'
                        ? 'scheduled'
                        : 'historical',
                  )}
                </span>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">
                {version.effectiveFrom.toISOString().slice(0, 10)}
                {version.effectiveTo ? ` – ${version.effectiveTo.toISOString().slice(0, 10)}` : ''}
              </p>
              {version.correctionReason ? (
                <p className="mt-2 text-sm text-muted-foreground" dir="auto">
                  {t('correctionReason')}: {version.correctionReason}
                </p>
              ) : null}
              <PlanVersionActions locale={locale} versionId={version.id} />
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
