'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { deleteWeightEntryAction, updateWeightEntryAction } from '@/actions/manual-core';
import { Button, Input } from '@/components/UiComponents';
type Entry = { id: string; measuredOn: string; weightKg: string; note: string };
export function WeightEntries({ locale, entries }: { locale: 'fa' | 'en'; entries: Entry[] }) {
  const t = useTranslations('history');
  const router = useRouter();
  const [pending, setPending] = useState<string | null>(null);
  async function remove(id: string) {
    setPending(id);
    try {
      await deleteWeightEntryAction({ locale, id });
      router.refresh();
    } finally {
      setPending(null);
    }
  }
  async function update(e: React.FormEvent<HTMLFormElement>, entry: Entry) {
    e.preventDefault();
    setPending(entry.id);
    const f = new FormData(e.currentTarget);
    try {
      await updateWeightEntryAction({
        locale,
        id: entry.id,
        measuredOn: f.get('measuredOn'),
        weightKg: f.get('weightKg'),
        note: f.get('note'),
      });
      router.refresh();
    } finally {
      setPending(null);
    }
  }
  return (
    <div className="mt-5 space-y-3">
      {entries.map((entry) => (
        <form
          key={entry.id}
          className="grid gap-2 rounded-lg border p-3 sm:grid-cols-[1fr_1fr_1fr_auto_auto]"
          onSubmit={(e) => update(e, entry)}
        >
          <Input name="measuredOn" type="date" defaultValue={entry.measuredOn} />
          <Input name="weightKg" defaultValue={entry.weightKg} />
          <Input name="note" defaultValue={entry.note} dir="auto" />
          <Button type="submit" loading={pending === entry.id}>
            {t('updateWeight')}
          </Button>
          <Button type="button" variant="outline" onClick={() => remove(entry.id)}>
            {t('deleteWeight')}
          </Button>
        </form>
      ))}
    </div>
  );
}
