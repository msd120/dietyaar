'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { clonePlanVersionAction } from '@/actions/manual-core';
import { Button } from '@/components/UiComponents';

export function PlanVersionActions({
  locale,
  versionId,
}: {
  locale: 'fa' | 'en';
  versionId: string;
}) {
  const t = useTranslations('manualPlan');
  const router = useRouter();
  const [pending, setPending] = useState(false);
  async function clone() {
    setPending(true);
    try {
      const draft = await clonePlanVersionAction({ locale, id: versionId });
      router.push(`/${locale}/plan/new?draft=${draft.id}`);
    } finally {
      setPending(false);
    }
  }
  return (
    <Button className="mt-4" type="button" variant="outline" loading={pending} onClick={clone}>
      {t('replaceFromVersion')}
    </Button>
  );
}
