'use client';

import { useEffect, useState } from 'react';
import { WifiOff } from 'lucide-react';
import { useTranslations } from 'next-intl';

export function OnlineStatus() {
  const t = useTranslations('system');
  const [online, setOnline] = useState(true);

  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    update();
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
    };
  }, []);

  if (online) return null;

  return (
    <div
      className="fixed inset-x-3 top-3 z-[100] mx-auto flex max-w-xl items-center justify-center gap-2 rounded-lg border border-amber-400/60 bg-amber-950 px-4 py-3 text-sm text-amber-50 shadow-lg"
      role="status"
      aria-live="polite"
      data-testid="offline-status"
    >
      <WifiOff className="size-4 shrink-0" aria-hidden="true" />
      {t('offline')}
    </div>
  );
}
