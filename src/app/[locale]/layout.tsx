import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import localFont from 'next/font/local';
import { hasLocale, NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { DirectionProvider, Toaster } from '@/components/UiComponents';
import { OnlineStatus } from '@/features/system/OnlineStatus';
import { routing } from '@/i18n/routing';
import { APP_DESCRIPTION, APP_NAME } from '@/lib/app-config';
import '../globals.css';

const yekanBakh = localFont({
  src: '../fonts/YekanBakh-VF.woff2',
  display: 'swap',
  weight: '100 900',
  variable: '--font-yekan-bakh',
});

export const metadata: Metadata = { title: APP_NAME, description: APP_DESCRIPTION };

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: Readonly<{ children: ReactNode; params: Promise<{ locale: string }> }>) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  setRequestLocale(locale);
  const messages = await getMessages();
  const direction = locale === 'fa' ? 'rtl' : 'ltr';

  return (
    <html lang={locale} dir={direction} className={`dark ${yekanBakh.variable}`} data-theme="dark">
      <body className="bg-background font-sans text-foreground antialiased">
        <NextIntlClientProvider messages={messages}>
          <DirectionProvider dir={direction}>
            <OnlineStatus />
            {children}
            <Toaster />
          </DirectionProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
