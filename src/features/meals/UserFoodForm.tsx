'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { createUserFoodAction, deleteUserFoodAction } from '@/actions/manual-core';
import { Button, Input, Label } from '@/components/UiComponents';

export function UserFoodForm({
  locale,
  foods,
}: {
  locale: 'fa' | 'en';
  foods: Array<{ id: string; name: string }>;
}) {
  const t = useTranslations('meal');
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(false);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(false);
    const form = new FormData(event.currentTarget);
    try {
      await createUserFoodAction({
        locale,
        name: form.get('name'),
        basisAmount: form.get('basisAmount'),
        energyKcal: form.get('energyKcal'),
        proteinG: form.get('proteinG'),
        carbohydrateG: form.get('carbohydrateG'),
        fatG: form.get('fatG'),
        fiberG: form.get('fiberG'),
        sourceNote: form.get('sourceNote'),
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
    <section className="mt-6 rounded-2xl border bg-card p-6">
      <details>
        <summary className="cursor-pointer text-xl font-semibold">{t('userFoods')}</summary>
        <p className="mt-2 text-sm text-muted-foreground">{t('userFoodsHelp')}</p>
        <form className="mt-4 grid gap-3 sm:grid-cols-2" onSubmit={submit}>
          <div className="space-y-1 sm:col-span-2">
            <Label htmlFor="userFoodName">{t('foodName')}</Label>
            <Input id="userFoodName" name="name" dir="auto" required />
          </div>
          <div className="space-y-1">
            <Label htmlFor="basisAmount">{t('basisAmount')}</Label>
            <Input id="basisAmount" name="basisAmount" inputMode="decimal" required />
          </div>
          {(['energyKcal', 'proteinG', 'carbohydrateG', 'fatG', 'fiberG'] as const).map((key) => (
            <div className="space-y-1" key={key}>
              <Label htmlFor={`user-${key}`}>{t(key === 'energyKcal' ? 'energy' : key)}</Label>
              <Input id={`user-${key}`} name={key} inputMode="decimal" />
            </div>
          ))}
          <div className="space-y-1 sm:col-span-2">
            <Label htmlFor="sourceNote">{t('sourceNote')}</Label>
            <Input id="sourceNote" name="sourceNote" dir="auto" />
          </div>
          {error ? <p className="text-sm text-error">{t('userFoodError')}</p> : null}
          <Button className="sm:col-span-2" type="submit" loading={pending}>
            {t('saveUserFood')}
          </Button>
        </form>
        {foods.length > 0 ? (
          <div className="mt-4 space-y-2">
            {foods.map((food) => (
              <div
                className="flex items-center justify-between gap-3 rounded-lg border p-2"
                key={food.id}
              >
                <span dir="auto">{food.name}</span>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    void deleteUserFoodAction({ locale, id: food.id }).then(() => router.refresh())
                  }
                >
                  {t('deleteSaved')}
                </Button>
              </div>
            ))}
          </div>
        ) : null}
      </details>
    </section>
  );
}
