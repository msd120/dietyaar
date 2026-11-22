'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Button, Input, Label } from '@/components/UiComponents';

export function RegisterForm({ locale }: Readonly<{ locale: string }>) {
  const router = useRouter();
  const t = useTranslations('register');
  const recovery = useTranslations('recovery');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(false);
  const [recoveryCode, setRecoveryCode] = useState<string | null>(null);
  const [recoveryConfirmed, setRecoveryConfirmed] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(false);
    const form = new FormData(event.currentTarget);
    const response = await fetch('/api/register', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        displayName: String(form.get('displayName') ?? ''),
        username: String(form.get('username') ?? ''),
        password: String(form.get('password') ?? ''),
      }),
    });
    const payload = (await response.json().catch(() => null)) as { recoveryCode?: string } | null;
    setPending(false);
    if (!response.ok) {
      setError(true);
      return;
    }
    if (!payload?.recoveryCode) {
      setError(true);
      return;
    }
    setRecoveryCode(payload.recoveryCode);
  }

  if (recoveryCode) {
    return (
      <div className="space-y-5">
        <h2 className="text-lg font-semibold">{recovery('saveTitle')}</h2>
        <p className="text-sm leading-6 text-muted-foreground">{recovery('saveDescription')}</p>
        <output
          className="block rounded-md border bg-muted p-4 text-center font-mono text-base tracking-wider"
          dir="ltr"
        >
          {recoveryCode}
        </output>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={recoveryConfirmed}
            onChange={(event) => setRecoveryConfirmed(event.target.checked)}
          />
          {recovery('confirm')}
        </label>
        <Button
          className="w-full"
          disabled={!recoveryConfirmed}
          onClick={() => {
            router.push(`/${locale}/onboarding`);
            router.refresh();
          }}
        >
          {recovery('continueOnboarding')}
        </Button>
      </div>
    );
  }

  return (
    <form className="space-y-5" onSubmit={submit} noValidate>
      <p className="text-sm leading-6 text-muted-foreground">{t('description')}</p>
      <div className="space-y-2">
        <Label htmlFor="displayName">{t('name')}</Label>
        <Input id="displayName" name="displayName" autoComplete="name" maxLength={80} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="username">{t('username')}</Label>
        <Input id="username" name="username" dir="ltr" autoComplete="username" required />
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
      <p className="text-xs leading-6 text-muted-foreground">{t('validation')}</p>
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {t('error')}
        </p>
      ) : null}
      <Button className="w-full" type="submit" loading={pending}>
        {pending ? t('pending') : t('submit')}
      </Button>
    </form>
  );
}
