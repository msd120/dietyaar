'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  requestMealDeletionAction,
  reviseConfirmedMealAction,
  saveMealSnapshotAction,
  setDayCompleteAction,
  setSlotSkippedAction,
  undoMealDeletionAction,
} from '@/actions/manual-core';
import { Button, Input } from '@/components/UiComponents';
export function TodayActions({
  locale,
  localDate,
  completed,
  meals,
  planVersionId,
  slots,
}: {
  locale: 'fa' | 'en';
  localDate: string;
  completed: boolean;
  meals: Array<{
    id: string;
    revision: number;
    displayName: string;
    grams: string;
    energyKcal: string;
  }>;
  planVersionId?: string;
  slots: Array<{ id: string; label: string; state: 'RECORDED' | 'SKIPPED' | 'NOT_RECORDED' }>;
}) {
  const t = useTranslations('today');
  const router = useRouter();
  const [pending, setPending] = useState<string | null>(null);
  const [deleted, setDeleted] = useState<string | null>(null);
  const [error, setError] = useState(false);
  async function run(key: string, fn: () => Promise<unknown>) {
    setPending(key);
    setError(false);
    try {
      await fn();
      router.refresh();
    } catch {
      setError(true);
    } finally {
      setPending(null);
    }
  }
  return (
    <div className="mt-5 space-y-3">
      <Button
        variant="outline"
        loading={pending === 'day'}
        onClick={() =>
          run('day', () => setDayCompleteAction({ locale, localDate, complete: !completed }))
        }
      >
        {completed ? t('reopenDay') : t('completeDay')}
      </Button>
      {planVersionId && slots.length > 0 ? (
        <div className="space-y-2 rounded-xl border p-3">
          <h3 className="font-medium">{t('slots')}</h3>
          {slots.map((slot) => (
            <div className="flex flex-wrap items-center justify-between gap-2" key={slot.id}>
              <span dir="auto">
                {slot.label} · {t(`slot${slot.state}`)}
              </span>
              {slot.state !== 'RECORDED' ? (
                <Button
                  type="button"
                  variant="outline"
                  loading={pending === `slot-${slot.id}`}
                  onClick={() =>
                    run(`slot-${slot.id}`, () =>
                      setSlotSkippedAction({
                        locale,
                        localDate,
                        planVersionId,
                        slotId: slot.id,
                        skipped: slot.state !== 'SKIPPED',
                      }),
                    )
                  }
                >
                  {slot.state === 'SKIPPED' ? t('unskipSlot') : t('skipSlot')}
                </Button>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}
      {meals.map((meal) => (
        <div key={meal.id} className="space-y-3 rounded-lg border p-3">
          <div className="flex flex-wrap gap-2">
            {deleted === meal.id ? (
              <Button
                variant="outline"
                onClick={() =>
                  run(meal.id, async () => {
                    await undoMealDeletionAction({ locale, id: meal.id });
                    setDeleted(null);
                  })
                }
              >
                {t('undo')}
              </Button>
            ) : (
              <Button
                variant="outline"
                onClick={() =>
                  run(meal.id, async () => {
                    await requestMealDeletionAction({ locale, id: meal.id });
                    setDeleted(meal.id);
                  })
                }
              >
                {t('deleteMeal')}
              </Button>
            )}
            <form
              className="flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                const f = new FormData(e.currentTarget);
                void run(`save-${meal.id}`, () =>
                  saveMealSnapshotAction({
                    locale,
                    id: meal.id,
                    name: String(f.get('name') ?? ''),
                  }),
                );
              }}
            >
              <Input
                name="name"
                aria-label={t('savedMealName')}
                placeholder={t('savedMealName')}
                required
              />
              <Button type="submit" loading={pending === `save-${meal.id}`}>
                {t('saveMeal')}
              </Button>
            </form>
          </div>
          <details>
            <summary className="cursor-pointer text-sm font-medium">{t('editMeal')}</summary>
            <form
              className="mt-3 grid gap-2 sm:grid-cols-4"
              onSubmit={(event) => {
                event.preventDefault();
                const form = new FormData(event.currentTarget);
                void run(`edit-${meal.id}`, () =>
                  reviseConfirmedMealAction({
                    locale,
                    id: meal.id,
                    expectedRevision: meal.revision,
                    displayName: form.get('displayName'),
                    grams: form.get('grams'),
                    energyKcal: form.get('energyKcal'),
                  }),
                );
              }}
            >
              <Input
                name="displayName"
                defaultValue={meal.displayName}
                aria-label={t('foodName')}
                required
                dir="auto"
              />
              <Input
                name="grams"
                defaultValue={meal.grams}
                aria-label={t('grams')}
                inputMode="decimal"
              />
              <Input
                name="energyKcal"
                defaultValue={meal.energyKcal}
                aria-label={t('energy')}
                inputMode="decimal"
              />
              <Button type="submit" loading={pending === `edit-${meal.id}`}>
                {t('saveEdit')}
              </Button>
            </form>
          </details>
        </div>
      ))}
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {t('actionError')}
        </p>
      ) : null}
    </div>
  );
}
