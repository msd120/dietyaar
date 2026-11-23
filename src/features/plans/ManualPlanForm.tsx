'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  activateManualPlanAction,
  createManualPlanDraftAction,
  updateManualPlanDraftAction,
} from '@/actions/manual-core';
import { Button, Input, Label, Textarea } from '@/components/UiComponents';
import { parseStructuredPlan } from '@/domain/plans/structured-plan';

const slotDefinitions = [
  ['breakfast', 'BREAKFAST'],
  ['morningSnack', 'MORNING_SNACK'],
  ['lunch', 'LUNCH'],
  ['afternoonSnack', 'AFTERNOON_SNACK'],
  ['dinner', 'DINNER'],
] as const;

const targetDefinitions = [
  ['energyKcal', 'energyTarget'],
  ['proteinG', 'proteinTarget'],
  ['carbohydrateG', 'carbohydrateTarget'],
  ['fatG', 'fatTarget'],
  ['fiberG', 'fiberTarget'],
] as const;

function optionalNumber(value: FormDataEntryValue | null) {
  const text = String(value ?? '').trim();
  return text === '' ? undefined : Number(text);
}

function targetRule(form: FormData, key: string) {
  const minimum = optionalNumber(form.get(`${key}Min`));
  const maximum = optionalNumber(form.get(`${key}Max`));
  if (minimum !== undefined && maximum !== undefined) return { type: 'RANGE', minimum, maximum };
  if (minimum !== undefined) return { type: 'MIN', minimum };
  if (maximum !== undefined) return { type: 'MAX', maximum };
  return undefined;
}

export function ManualPlanForm({
  locale,
  effectiveFrom,
  initialDraft,
}: Readonly<{
  locale: 'fa' | 'en';
  effectiveFrom: string;
  initialDraft?: {
    id: string;
    revision: number;
    title: string;
    sourceNote: string;
    content: unknown;
  };
}>) {
  const router = useRouter();
  const t = useTranslations('manualPlan');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(false);
  const existingPlan = parseStructuredPlan(initialDraft?.content);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(false);
    const form = new FormData(event.currentTarget);
    try {
      const title = String(form.get('title') ?? '');
      const sourceNote = String(form.get('sourceNote') ?? '');
      const draft = initialDraft ?? (await createManualPlanDraftAction({ locale, title }));
      const updated = await updateManualPlanDraftAction({
        locale,
        draftId: draft.id,
        revision: draft.revision,
        title,
        sourceNote,
        medicalBoundary: form.get('medicalBoundary') === 'on',
        content: {
          schemaVersion: 2,
          title,
          sourceNote,
          mealGuidance: String(form.get('mealGuidance') ?? ''),
          slots: slotDefinitions.flatMap(([id, mealType]) => {
            const label = String(form.get(`${id}Label`) ?? '').trim();
            return label ? [{ id, label, mealType }] : [];
          }),
          targets: Object.fromEntries(
            targetDefinitions.flatMap(([key]) => {
              const rule = targetRule(form, key);
              return rule ? [[key, rule]] : [];
            }),
          ),
        },
      });
      await activateManualPlanAction({
        locale,
        draftId: updated.id,
        revision: updated.revision,
        effectiveFrom: String(form.get('effectiveFrom') ?? effectiveFrom),
        correctionReason: String(form.get('correctionReason') ?? '').trim() || undefined,
      });
      router.push(`/${locale}/today`);
      router.refresh();
    } catch {
      setError(true);
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="space-y-5" onSubmit={submit}>
      <div className="space-y-2">
        <Label htmlFor="title">{t('title')}</Label>
        <Input id="title" name="title" defaultValue={initialDraft?.title} required dir="auto" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="mealGuidance">{t('guidance')}</Label>
        <Textarea
          id="mealGuidance"
          name="mealGuidance"
          defaultValue={
            initialDraft?.content &&
            typeof initialDraft.content === 'object' &&
            !Array.isArray(initialDraft.content) &&
            typeof (initialDraft.content as Record<string, unknown>).mealGuidance === 'string'
              ? String((initialDraft.content as Record<string, unknown>).mealGuidance)
              : ''
          }
          required
          dir="auto"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="sourceNote">{t('sourceNote')}</Label>
        <Textarea
          id="sourceNote"
          name="sourceNote"
          defaultValue={initialDraft?.sourceNote}
          dir="auto"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="correctionReason">{t('correctionReason')}</Label>
        <Textarea id="correctionReason" name="correctionReason" dir="auto" />
        <p className="text-xs text-muted-foreground">{t('correctionHelp')}</p>
      </div>
      <label className="flex gap-2 text-sm">
        <input name="medicalBoundary" type="checkbox" />
        {t('medical')}
      </label>
      <p className="text-xs text-muted-foreground">{t('medicalHelp')}</p>
      <fieldset className="space-y-3 rounded-xl border p-4">
        <legend className="px-2 font-semibold">{t('slots')}</legend>
        <p className="text-xs text-muted-foreground">{t('slotsHelp')}</p>
        {slotDefinitions.map(([id]) => (
          <div className="space-y-1" key={id}>
            <Label htmlFor={`${id}Label`}>{t(id)}</Label>
            <Input
              id={`${id}Label`}
              name={`${id}Label`}
              defaultValue={existingPlan?.slots.find((slot) => slot.id === id)?.label ?? ''}
              dir="auto"
            />
          </div>
        ))}
      </fieldset>
      <fieldset className="space-y-3 rounded-xl border p-4">
        <legend className="px-2 font-semibold">{t('numericTargets')}</legend>
        <p className="text-xs text-muted-foreground">{t('targetsHelp')}</p>
        {targetDefinitions.map(([key, label]) => {
          const rule = existingPlan?.targets[key];
          const minimum =
            rule && (rule.type === 'MIN' || rule.type === 'RANGE') ? rule.minimum : '';
          const maximum =
            rule && (rule.type === 'MAX' || rule.type === 'RANGE') ? rule.maximum : '';
          return (
            <div className="grid gap-2 sm:grid-cols-3" key={key}>
              <span className="text-sm font-medium">{t(label)}</span>
              <Input
                name={`${key}Min`}
                inputMode="decimal"
                defaultValue={minimum}
                aria-label={`${t(label)} ${t('minimum')}`}
                placeholder={t('minimum')}
              />
              <Input
                name={`${key}Max`}
                inputMode="decimal"
                defaultValue={maximum}
                aria-label={`${t(label)} ${t('maximum')}`}
                placeholder={t('maximum')}
              />
            </div>
          );
        })}
      </fieldset>
      <div className="space-y-2">
        <Label htmlFor="effectiveFrom">{t('effectiveFrom')}</Label>
        <Input
          id="effectiveFrom"
          name="effectiveFrom"
          type="date"
          defaultValue={effectiveFrom}
          required
        />
      </div>
      {error ? (
        <p role="alert" className="text-sm text-error">
          {t('error')}
        </p>
      ) : null}
      <Button type="submit" loading={pending}>
        {pending ? t('pending') : t('activate')}
      </Button>
    </form>
  );
}
