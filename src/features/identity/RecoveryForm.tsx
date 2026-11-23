'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Button, Input, Label } from '@/components/UiComponents';

export function RecoveryForm({ locale }: Readonly<{ locale: string }>) {
  const router = useRouter();
  const t = useTranslations('recovery');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(false);
  const [replacementCode, setReplacementCode] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(false);
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch('/api/recover', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: String(form.get('username') ?? ''),
          code: String(form.get('code') ?? ''),
          password: String(form.get('password') ?? ''),
        }),
      });
      const payload = (await response.json().catch(() => null)) as {
        replacementCode?: string;
      } | null;
      if (!response.ok || !payload?.replacementCode) {
        setError(true);
        return;
      }
      setReplacementCode(payload.replacementCode);
    } catch {
      setError(true);
    } finally {
      setPending(false);
    }
  }

  if (replacementCode) {
    return (
      <div className="space-y-5">
        <h2 className="text-lg font-semibold">{t('saveTitle')}</h2>
        <p className="text-sm leading-6 text-muted-foreground">{t('replacementDescription')}</p>
        <output
          className="block rounded-md border bg-muted p-4 text-center font-mono text-base tracking-wider"
          dir="ltr"
        >
          {replacementCode}
        </output>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(event) => setConfirmed(event.target.checked)}
          />
          {t('confirm')}
        </label>
        <Button
          className="w-full"
          disabled={!confirmed}
          onClick={() => router.push(`/${locale}/login`)}
        >
          {t('continueLogin')}
        </Button>
      </div>
    );
  }

  return (
    <form className="space-y-5" onSubmit={submit} noValidate>
      <p className="text-sm leading-6 text-muted-foreground">{t('description')}</p>
      <div className="space-y-2">
        <Label htmlFor="username">{t('username')}</Label>
        <Input id="username" name="username" dir="ltr" autoComplete="username" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="code">{t('code')}</Label>
        <Input id="code" name="code" dir="ltr" autoComplete="off" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">{t('password')}</Label>
        <Input
          id="password"
          name="password"
          dir="ltr"
          type="password"
          autoComplete="new-password"
          required
        />
      </div>
      {error ? (
        <p role="alert" className="text-sm text-error">
          {t('error')}
        </p>
      ) : null}
      <Button className="w-full" type="submit" loading={pending}>
        {pending ? t('pending') : t('submit')}
      </Button>
    </form>
  );
}
