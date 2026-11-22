'use client';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  updateAiConsentSettingsAction,
  updatePreferenceSettingsAction,
  updateProfileSettingsAction,
} from '@/actions/manual-core';
import { Button, Input, Label } from '@/components/UiComponents';

type Initial = {
  preferredName: string;
  unitSystem: string;
  heightCm: string;
  profileWeightKg: string;
  birthYear: string;
  gender: string;
  genderSelfDescription: string;
  timezone: string;
  morningTime: string;
  theme: string;
  planImage: boolean;
  mealImage: boolean;
  aiReflection: boolean;
  weightTrackingEnabled: boolean;
};
export function SettingsForm({
  locale,
  initial,
}: Readonly<{ locale: 'fa' | 'en'; initial: Initial }>) {
  const t = useTranslations('settings');
  const [pending, setPending] = useState(false);
  const [status, setStatus] = useState<'saved' | 'error' | null>(null);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setStatus(null);
    const f = new FormData(event.currentTarget);
    try {
      await updateProfileSettingsAction({
        locale,
        value: {
          preferredName: f.get('preferredName'),
          unitSystem: f.get('unitSystem'),
          heightCm: f.get('heightCm'),
          profileWeightKg: f.get('profileWeightKg'),
          birthYear: f.get('birthYear'),
          birthYearCalendar: f.get('birthYear')
            ? locale === 'fa'
              ? 'JALALI'
              : 'GREGORIAN'
            : undefined,
          gender: f.get('gender') || undefined,
          genderSelfDescription:
            f.get('gender') === 'SELF_DESCRIBED' ? f.get('genderSelfDescription') : undefined,
        },
      });
      await updatePreferenceSettingsAction({
        locale,
        value: {
          timezone: f.get('timezone'),
          morningTime: f.get('morningTime'),
          theme: f.get('theme'),
          locale,
          weightTrackingEnabled: f.get('weightTrackingEnabled') === 'on',
        },
      });
      await updateAiConsentSettingsAction({
        locale,
        grants: {
          planImage: f.get('planImage') === 'on',
          mealImage: f.get('mealImage') === 'on',
          aiReflection: f.get('aiReflection') === 'on',
        },
      });
      setStatus('saved');
    } catch {
      setStatus('error');
    } finally {
      setPending(false);
    }
  }
  return (
    <form className="space-y-6" onSubmit={submit}>
      <fieldset className="space-y-3">
        <legend className="text-lg font-semibold">{t('profile')}</legend>
        <Label htmlFor="preferredName">{t('preferredName')}</Label>
        <Input
          id="preferredName"
          name="preferredName"
          defaultValue={initial.preferredName}
          dir="auto"
        />
        <Label htmlFor="unitSystem">{t('units')}</Label>
        <select
          id="unitSystem"
          name="unitSystem"
          defaultValue={initial.unitSystem}
          className="w-full rounded-md border bg-background p-2"
        >
          <option value="METRIC">{t('metric')}</option>
          <option value="IMPERIAL">{t('imperial')}</option>
        </select>
        <Label htmlFor="heightCm">{t('height')}</Label>
        <Input id="heightCm" name="heightCm" defaultValue={initial.heightCm} />
        <Label htmlFor="profileWeightKg">{t('profileWeight')}</Label>
        <Input id="profileWeightKg" name="profileWeightKg" defaultValue={initial.profileWeightKg} />
        <Label htmlFor="birthYear">{t('birthYear')}</Label>
        <Input id="birthYear" name="birthYear" defaultValue={initial.birthYear} />
        <Label htmlFor="gender">{t('gender')}</Label>
        <select
          id="gender"
          name="gender"
          defaultValue={initial.gender}
          className="w-full rounded-md border bg-background p-2"
        >
          <option value="">{t('notSet')}</option>
          <option value="WOMAN">{t('woman')}</option>
          <option value="MAN">{t('man')}</option>
          <option value="NON_BINARY">{t('nonBinary')}</option>
          <option value="SELF_DESCRIBED">{t('selfDescribed')}</option>
          <option value="PREFER_NOT_TO_SAY">{t('preferNotToSay')}</option>
        </select>
        <Label htmlFor="genderSelfDescription">{t('genderDescription')}</Label>
        <Input
          id="genderSelfDescription"
          name="genderSelfDescription"
          defaultValue={initial.genderSelfDescription}
          dir="auto"
        />
      </fieldset>
      <label className="flex gap-2">
        <input
          type="checkbox"
          name="weightTrackingEnabled"
          defaultChecked={initial.weightTrackingEnabled}
        />
        {t('weightTracking')}
      </label>
      <fieldset className="space-y-3">
        <legend className="text-lg font-semibold">{t('preferences')}</legend>
        <Label htmlFor="timezone">{t('timezone')}</Label>
        <Input id="timezone" name="timezone" defaultValue={initial.timezone} dir="ltr" />
        <Label htmlFor="morningTime">{t('morningTime')}</Label>
        <Input id="morningTime" name="morningTime" type="time" defaultValue={initial.morningTime} />
        <Label htmlFor="theme">{t('theme')}</Label>
        <select
          id="theme"
          name="theme"
          defaultValue={initial.theme}
          className="w-full rounded-md border bg-background p-2"
        >
          <option value="SYSTEM">{t('system')}</option>
          <option value="LIGHT">{t('light')}</option>
          <option value="DARK">{t('dark')}</option>
        </select>
      </fieldset>
      <fieldset className="space-y-3">
        <legend className="text-lg font-semibold">{t('aiPrivacy')}</legend>
        {(['planImage', 'mealImage', 'aiReflection'] as const).map((key) => (
          <label key={key} className="flex gap-2">
            <input type="checkbox" name={key} defaultChecked={initial[key]} />
            {t(key)}
          </label>
        ))}
      </fieldset>
      {status ? (
        <p role="status" className={status === 'error' ? 'text-destructive' : 'text-primary'}>
          {t(status)}
        </p>
      ) : null}
      <Button type="submit" loading={pending}>
        {t('save')}
      </Button>
    </form>
  );
}
