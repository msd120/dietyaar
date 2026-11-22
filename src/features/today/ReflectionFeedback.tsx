'use client';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { setReflectionFeedbackAction } from '@/actions/manual-core';
import { Button } from '@/components/UiComponents';

export function ReflectionFeedback({
  locale,
  reflectionId,
}: {
  locale: 'fa' | 'en';
  reflectionId: string;
}) {
  const t = useTranslations('today');
  const [pending, setPending] = useState(false);
  const [selected, setSelected] = useState<'HELPFUL' | 'NOT_HELPFUL' | null>(null);
  async function choose(value: 'HELPFUL' | 'NOT_HELPFUL') {
    setPending(true);
    try {
      const next = selected === value ? null : value;
      await setReflectionFeedbackAction({ locale, id: reflectionId, value: next });
      setSelected(next);
    } finally {
      setPending(false);
    }
  }
  return (
    <div className="mt-4 flex flex-wrap items-center gap-2">
      <span className="text-sm text-muted-foreground">{t('reflectionFeedback')}</span>
      <Button
        type="button"
        variant={selected === 'HELPFUL' ? 'default' : 'outline'}
        disabled={pending}
        onClick={() => choose('HELPFUL')}
      >
        {t('helpful')}
      </Button>
      <Button
        type="button"
        variant={selected === 'NOT_HELPFUL' ? 'default' : 'outline'}
        disabled={pending}
        onClick={() => choose('NOT_HELPFUL')}
      >
        {t('notHelpful')}
      </Button>
    </div>
  );
}
