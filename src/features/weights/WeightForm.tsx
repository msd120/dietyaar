'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { addWeightEntryAction } from '@/actions/manual-core';
import { Button, Input, Label } from '@/components/UiComponents';

export function WeightForm({
  locale,
  today,
  initialWeightKg,
}: Readonly<{ locale: 'fa' | 'en'; today: string; initialWeightKg?: string }>) {
  const t = useTranslations('history');
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(false);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(false);
    const form = new FormData(event.currentTarget);
    try {
      await addWeightEntryAction({
        locale,
        measuredOn: form.get('measuredOn'),
        weightKg: form.get('weightKg'),
        note: form.get('note'),
      });
      event.currentTarget.reset();
      router.refresh();
    } catch {
      setError(true);
    } finally {
      setPending(false);
    }
  }
  return (
    <form className="grid gap-3 sm:grid-cols-2" onSubmit={submit}>
      <div className="space-y-2">
        <Label htmlFor="weightKg">{t('weight')}</Label>
        <Input
          id="weightKg"
          name="weightKg"
          inputMode="decimal"
          defaultValue={initialWeightKg}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="measuredOn">{t('measuredOn')}</Label>
        <Input id="measuredOn" name="measuredOn" type="date" defaultValue={today} required />
      </div>
      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor="note">{t('weightNote')}</Label>
        <Input id="note" name="note" dir="auto" />
      </div>
      {error ? (
        <p role="alert" className="text-sm text-destructive sm:col-span-2">
          {t('weightError')}
        </p>
      ) : null}
      <Button className="sm:col-span-2" type="submit" loading={pending}>
        {t('addWeight')}
      </Button>
    </form>
  );
}
