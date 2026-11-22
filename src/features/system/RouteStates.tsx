'use client';

import type { ReactNode } from 'react';
import { AlertTriangle, Home, RefreshCw } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { Button, Spinner } from '@/components/UiComponents';

function StateShell({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <main className="grid min-h-screen place-items-center bg-muted/25 p-6">
      <section className="w-full max-w-md rounded-2xl border bg-card p-7 text-center shadow-sm">
        {children}
      </section>
    </main>
  );
}

export function RouteLoading() {
  const t = useTranslations('system');
  return (
    <StateShell>
      <Spinner className="mx-auto size-7 animate-spin text-primary" aria-hidden="true" />
      <p className="mt-4 text-sm text-muted-foreground" role="status">
        {t('loading')}
      </p>
    </StateShell>
  );
}

export function RouteError({ reset }: Readonly<{ reset: () => void }>) {
  const t = useTranslations('system');
  return (
    <StateShell>
      <AlertTriangle className="mx-auto size-9 text-destructive" aria-hidden="true" />
      <h1 className="mt-4 text-xl font-bold">{t('errorTitle')}</h1>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{t('errorDescription')}</p>
      <Button className="mt-6" onClick={reset}>
        <RefreshCw />
        {t('retry')}
      </Button>
    </StateShell>
  );
}

export function RouteNotFound() {
  const locale = useLocale();
  const router = useRouter();
  const t = useTranslations('system');
  return (
    <StateShell>
      <h1 className="text-xl font-bold">{t('notFoundTitle')}</h1>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{t('notFoundDescription')}</p>
      <Button className="mt-6" onClick={() => router.push(`/${locale}`)}>
        <Home />
        {t('goHome')}
      </Button>
    </StateShell>
  );
}
