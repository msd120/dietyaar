'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  completeOnboardingAction,
  saveEligibilityAction,
  savePlanContextAction,
  savePreferencesAction,
  saveProfileBasicsAction,
} from '@/actions/manual-core';
import { Button, Input, Label, Textarea } from '@/components/UiComponents';

type Initial = {
  step: number;
  age?: number | null;
  preferredName?: string | null;
  unitSystem?: 'METRIC' | 'IMPERIAL';
  heightCm?: string | null;
  profileWeightKg?: string | null;
  birthYear?: number | null;
  timezone?: string;
};

export function OnboardingForm({
  locale,
  initial,
}: Readonly<{ locale: 'fa' | 'en'; initial: Initial }>) {
  const t = useTranslations('onboarding');
  const router = useRouter();
  const [step, setStep] = useState(Math.min(5, Math.max(2, initial.step)));
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(false);
    const form = new FormData(event.currentTarget);
    try {
      if (step === 2)
        await saveEligibilityAction({
          locale,
          value: {
            age: form.get('age'),
            acceptTerms: form.get('terms') === 'on',
            aiConsent: form.get('ai') === 'on',
          },
        });
      if (step === 3)
        await saveProfileBasicsAction({
          locale,
          value: {
            preferredName: form.get('preferredName'),
            unitSystem: form.get('unitSystem'),
            heightCm: form.get('heightCm'),
            profileWeightKg: form.get('profileWeightKg'),
            birthYear: form.get('birthYear'),
            birthYearCalendar: form.get('birthYear')
              ? locale === 'fa'
                ? 'JALALI'
                : 'GREGORIAN'
              : undefined,
          },
        });
      if (step === 4)
        await savePlanContextAction({
          locale,
          value: {
            goal: form.get('goal'),
            planSource: 'UNSPECIFIED',
            medicalPlan: form.get('medicalPlan') === 'on',
            dietaryNotes: form.get('dietaryNotes'),
          },
        });
      if (step === 5)
        await savePreferencesAction({
          locale,
          value: {
            timezone: form.get('timezone'),
            morningTime: form.get('morningTime'),
            theme: form.get('theme'),
            locale,
          },
        });
      if (step < 5) setStep(step + 1);
      else {
        await completeOnboardingAction({ locale });
        router.push(`/${locale}/plan`);
        router.refresh();
      }
    } catch {
      setError(true);
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="space-y-5" onSubmit={submit} noValidate>
      {step === 2 ? (
        <>
          <h2 className="text-lg font-semibold">{t('eligibility')}</h2>
          <div className="space-y-2">
            <Label htmlFor="age">{t('age')}</Label>
            <Input
              id="age"
              name="age"
              type="number"
              min="18"
              max="120"
              defaultValue={initial.age ?? ''}
              required
            />
          </div>
          <label className="flex gap-2 text-sm">
            <input name="terms" type="checkbox" required />
            {t('terms')}
          </label>
          <label className="flex gap-2 text-sm">
            <input name="ai" type="checkbox" />
            {t('ai')}
          </label>
        </>
      ) : null}
      {step === 3 ? (
        <>
          <h2 className="text-lg font-semibold">{t('profile')}</h2>
          <div className="space-y-2">
            <Label htmlFor="preferredName">{t('name')}</Label>
            <Input
              id="preferredName"
              name="preferredName"
              defaultValue={initial.preferredName ?? ''}
              dir="auto"
            />
          </div>
          <label className="block text-sm">
            {t('units')}
            <select
              className="mt-2 w-full rounded-md border bg-background p-2"
              name="unitSystem"
              defaultValue={initial.unitSystem ?? 'METRIC'}
            >
              <option value="METRIC">{t('metric')}</option>
              <option value="IMPERIAL">{t('imperial')}</option>
            </select>
          </label>
          <div className="space-y-2">
            <Label htmlFor="heightCm">{t('height')}</Label>
            <Input
              id="heightCm"
              name="heightCm"
              inputMode="decimal"
              defaultValue={initial.heightCm ?? ''}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="profileWeightKg">{t('profileWeight')}</Label>
            <Input
              id="profileWeightKg"
              name="profileWeightKg"
              inputMode="decimal"
              defaultValue={initial.profileWeightKg ?? ''}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="birthYear">{t('birthYear')}</Label>
            <Input
              id="birthYear"
              name="birthYear"
              inputMode="numeric"
              defaultValue={initial.birthYear ?? ''}
            />
          </div>
        </>
      ) : null}
      {step === 4 ? (
        <>
          <h2 className="text-lg font-semibold">{t('context')}</h2>
          <label className="block text-sm">
            <select
              className="w-full rounded-md border bg-background p-2"
              name="goal"
              defaultValue="MAINTAIN_WEIGHT"
            >
              <option value="LOSE_WEIGHT">{t('lose')}</option>
              <option value="MAINTAIN_WEIGHT">{t('maintain')}</option>
              <option value="GAIN_WEIGHT">{t('gain')}</option>
            </select>
          </label>
          <label className="flex gap-2 text-sm">
            <input name="medicalPlan" type="checkbox" />
            {t('medical')}
          </label>
          <div className="space-y-2">
            <Label htmlFor="dietaryNotes">{t('notes')}</Label>
            <Textarea id="dietaryNotes" name="dietaryNotes" dir="auto" />
          </div>
        </>
      ) : null}
      {step === 5 ? (
        <>
          <h2 className="text-lg font-semibold">{t('preferences')}</h2>
          <div className="space-y-2">
            <Label htmlFor="timezone">{t('timezone')}</Label>
            <Input
              id="timezone"
              name="timezone"
              dir="ltr"
              defaultValue={initial.timezone ?? 'Asia/Tehran'}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="morningTime">{t('morning')}</Label>
            <Input id="morningTime" name="morningTime" type="time" defaultValue="08:00" required />
          </div>
          <label className="block text-sm">
            {t('theme')}
            <select
              className="mt-2 w-full rounded-md border bg-background p-2"
              name="theme"
              defaultValue="SYSTEM"
            >
              <option value="SYSTEM">System</option>
              <option value="LIGHT">Light</option>
              <option value="DARK">Dark</option>
            </select>
          </label>
        </>
      ) : null}
      {error ? (
        <p role="alert" className="text-sm text-error">
          {t('error')}
        </p>
      ) : null}
      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          disabled={step === 2 || pending}
          onClick={() => setStep(step - 1)}
        >
          {t('back')}
        </Button>
        <Button className="flex-1" type="submit" loading={pending}>
          {step === 5 ? t('finish') : t('save')}
        </Button>
      </div>
    </form>
  );
}
