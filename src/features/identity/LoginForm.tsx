'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Button, Input, Label } from '@/components/UiComponents';

export function LoginForm({ locale }: Readonly<{ locale: string }>) {
  const router = useRouter();
  const t = useTranslations('login');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(false);
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: String(form.get('username') ?? ''),
          password: String(form.get('password') ?? ''),
        }),
      });
      if (!response.ok) {
        setError(true);
        return;
      }
      router.push(`/${locale}/onboarding`);
      router.refresh();
    } catch {
      setError(true);
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="space-y-5" onSubmit={submit} noValidate>
      <p className="text-sm leading-6 text-muted-foreground">{t('description')}</p>
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
          autoComplete="current-password"
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
      <Link
        className="block text-center text-sm text-primary underline-offset-4 hover:underline"
        href={`/${locale}/recover`}
      >
        {t('recover')}
      </Link>
    </form>
  );
}
