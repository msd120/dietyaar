'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

export function AccountControls({ locale }: { locale: 'fa' | 'en' }) {
  const t = useTranslations('settings');
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(false);

  async function deleteAccount(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!confirmed || pending) return;
    setPending(true);
    setError(false);
    try {
      const response = await fetch('/api/account/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      if (!response.ok) throw new Error('DELETE_FAILED');
      router.replace(`/${locale}/login`);
      router.refresh();
    } catch {
      setError(true);
      setPending(false);
    }
  }

  return (
    <section className="mt-8 border-t pt-8" aria-labelledby="data-controls-heading">
      <h2 id="data-controls-heading" className="text-xl font-semibold">
        {t('dataControls')}
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">{t('exportDescription')}</p>
      <Link
        className="mt-3 inline-flex min-h-10 items-center rounded-md border px-4 py-2 font-medium"
        href="/api/account/export"
        prefetch={false}
      >
        {t('exportData')}
      </Link>

      <form className="mt-8 rounded-xl border border-destructive/40 p-4" onSubmit={deleteAccount}>
        <h3 className="font-semibold text-error">{t('deleteAccount')}</h3>
        <p className="mt-2 text-sm text-muted-foreground">{t('deleteWarning')}</p>
        <label className="mt-4 block text-sm font-medium" htmlFor="delete-password">
          {t('password')}
        </label>
        <input
          id="delete-password"
          className="mt-1 min-h-10 w-full rounded-md border bg-background px-3"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />
        <label className="mt-4 flex items-start gap-2 text-sm">
          <input
            className="mt-1"
            type="checkbox"
            checked={confirmed}
            onChange={(event) => setConfirmed(event.target.checked)}
          />
          <span>{t('deleteConfirm')}</span>
        </label>
        {error ? (
          <p className="mt-3 text-sm text-error" role="alert">
            {t('deleteError')}
          </p>
        ) : null}
        <button
          className="mt-4 min-h-10 rounded-md bg-destructive px-4 py-2 font-semibold text-destructive-foreground disabled:opacity-50"
          type="submit"
          disabled={!confirmed || !password || pending}
        >
          {pending ? t('deleting') : t('deleteAccount')}
        </button>
      </form>
    </section>
  );
}
