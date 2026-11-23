'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { confirmMealDraftAction, createManualMealDraftAction } from '@/actions/manual-core';
import { Button, Input, Label } from '@/components/UiComponents';

type FoodOption = {
  id: string;
  name: string;
  type: 'CATALOG' | 'USER_FOOD';
  hasNutrients: boolean;
};
type SlotOption = { id: string; label: string };

export function ManualMealForm({
  locale,
  foodOptions,
  slots,
}: Readonly<{ locale: 'fa' | 'en'; foodOptions: FoodOption[]; slots: SlotOption[] }>) {
  const t = useTranslations('meal');
  const router = useRouter();
  const [draftId, setDraftId] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(false);

  async function create(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(false);
    const form = new FormData(event.currentTarget);
    try {
      const sourceValue = String(form.get('foodSource') ?? '');
      const [sourceType, sourceId] = sourceValue ? sourceValue.split(':', 2) : [];
      const selected = foodOptions.find((option) => option.id === sourceId);
      if (selected && !String(form.get('grams') ?? '').trim()) throw new Error('PORTION_REQUIRED');
      const draft = await createManualMealDraftAction({
        locale,
        displayName: selected?.name ?? String(form.get('displayName') ?? ''),
        grams: form.get('grams'),
        energyKcal: form.get('energyKcal'),
        proteinG: form.get('proteinG'),
        carbohydrateG: form.get('carbohydrateG'),
        fatG: form.get('fatG'),
        fiberG: form.get('fiberG'),
        linkedSlotId: String(form.get('linkedSlotId') ?? '') || undefined,
        sourceType: sourceType || undefined,
        sourceId: sourceId || undefined,
      });
      setDraftId(draft.id);
    } catch {
      setError(true);
    } finally {
      setPending(false);
    }
  }

  async function confirm() {
    if (!draftId) return;
    setPending(true);
    setError(false);
    try {
      await confirmMealDraftAction({ locale, draftId });
      router.push(`/${locale}/today`);
      router.refresh();
    } catch {
      setError(true);
      setPending(false);
    }
  }

  if (draftId) {
    return (
      <div className="space-y-5">
        <p className="rounded-lg border bg-muted/40 p-4 text-sm">{t('ready')}</p>
        {error ? (
          <p role="alert" className="text-sm text-error">
            {t('error')}
          </p>
        ) : null}
        <Button loading={pending} onClick={confirm}>
          {t('confirm')}
        </Button>
      </div>
    );
  }

  return (
    <form className="space-y-5" onSubmit={create} noValidate>
      <p className="text-sm text-muted-foreground">{t('description')}</p>
      {foodOptions.length > 0 ? (
        <div className="space-y-2">
          <Label htmlFor="foodSource">{t('foodSource')}</Label>
          <select
            id="foodSource"
            name="foodSource"
            defaultValue=""
            className="w-full rounded-md border bg-background p-2"
          >
            <option value="">{t('manualFood')}</option>
            {foodOptions.map((food) => (
              <option key={`${food.type}:${food.id}`} value={`${food.type}:${food.id}`}>
                {food.name} · {food.type === 'CATALOG' ? t('catalogSource') : t('userFoodSource')}
              </option>
            ))}
          </select>
          <p className="text-xs text-muted-foreground">{t('catalogFixtureNotice')}</p>
        </div>
      ) : null}
      <div className="space-y-2">
        <Label htmlFor="displayName">{t('foodName')}</Label>
        <Input id="displayName" name="displayName" dir="auto" required />
      </div>
      {slots.length > 0 ? (
        <div className="space-y-2">
          <Label htmlFor="linkedSlotId">{t('plannedSlot')}</Label>
          <select
            id="linkedSlotId"
            name="linkedSlotId"
            defaultValue=""
            className="w-full rounded-md border bg-background p-2"
          >
            <option value="">{t('unplanned')}</option>
            {slots.map((slot) => (
              <option key={slot.id} value={slot.id}>
                {slot.label}
              </option>
            ))}
          </select>
        </div>
      ) : null}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="grams">{t('grams')}</Label>
          <Input id="grams" name="grams" inputMode="decimal" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="energyKcal">{t('energy')}</Label>
          <Input id="energyKcal" name="energyKcal" inputMode="decimal" />
        </div>
      </div>
      <details className="rounded-lg border p-3">
        <summary className="cursor-pointer text-sm font-medium">{t('optionalNutrients')}</summary>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {(['proteinG', 'carbohydrateG', 'fatG', 'fiberG'] as const).map((key) => (
            <div className="space-y-1" key={key}>
              <Label htmlFor={key}>{t(key)}</Label>
              <Input id={key} name={key} inputMode="decimal" />
            </div>
          ))}
        </div>
      </details>
      {error ? (
        <p role="alert" className="text-sm text-error">
          {t('error')}
        </p>
      ) : null}
      <Button type="submit" loading={pending}>
        {pending ? t('pending') : t('review')}
      </Button>
    </form>
  );
}
