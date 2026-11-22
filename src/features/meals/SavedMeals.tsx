'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  confirmMealDraftAction,
  createDraftFromSavedMealAction,
  deleteSavedMealAction,
  renameSavedMealAction,
} from '@/actions/manual-core';
import { Button, Input } from '@/components/UiComponents';
export function SavedMeals({
  locale,
  meals,
}: {
  locale: 'fa' | 'en';
  meals: Array<{ id: string; name: string }>;
}) {
  const t = useTranslations('meal');
  const router = useRouter();
  const [pending, setPending] = useState<string | null>(null);
  async function use(id: string) {
    setPending(id);
    try {
      const draft = await createDraftFromSavedMealAction({ locale, id });
      await confirmMealDraftAction({ locale, draftId: draft.id });
      router.push(`/${locale}/today`);
      router.refresh();
    } finally {
      setPending(null);
    }
  }
  async function mutate(id: string, operation: () => Promise<unknown>) {
    setPending(id);
    try {
      await operation();
      router.refresh();
    } finally {
      setPending(null);
    }
  }
  return (
    <section className="mt-6 rounded-2xl border bg-card p-6">
      <h2 className="mb-4 text-xl font-semibold">{t('savedTitle')}</h2>
      {meals.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t('noSaved')}</p>
      ) : (
        <div className="space-y-2">
          {meals.map((meal) => (
            <div key={meal.id} className="space-y-2 rounded-lg border p-3">
              <form
                className="flex flex-wrap items-center gap-2"
                onSubmit={(event) => {
                  event.preventDefault();
                  const form = new FormData(event.currentTarget);
                  void mutate(meal.id, () =>
                    renameSavedMealAction({ locale, id: meal.id, name: form.get('name') }),
                  );
                }}
              >
                <Input
                  name="name"
                  defaultValue={meal.name}
                  aria-label={t('savedMealName')}
                  dir="auto"
                  required
                />
                <Button type="submit" variant="outline" disabled={pending === meal.id}>
                  {t('renameSaved')}
                </Button>
              </form>
              <div className="flex flex-wrap gap-2">
                <Button loading={pending === meal.id} onClick={() => use(meal.id)}>
                  {t('useSaved')}
                </Button>
                <Button
                  variant="outline"
                  disabled={pending === meal.id}
                  onClick={() =>
                    mutate(meal.id, () => deleteSavedMealAction({ locale, id: meal.id }))
                  }
                >
                  {t('deleteSaved')}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
