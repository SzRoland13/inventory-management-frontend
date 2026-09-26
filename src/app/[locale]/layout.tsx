import { NextIntlClientProvider } from 'next-intl';
import { hasLocale } from 'next-intl';
import { notFound } from 'next/navigation';
import React from 'react';
import '@/app/globals.css';
import { QueryProvider } from '@/lib/providers/QueryProvider';
import { routing } from '@/i18n/routing';

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  return (
    <div className='w-full'>
      <NextIntlClientProvider>
        <QueryProvider>{children}</QueryProvider>
      </NextIntlClientProvider>
    </div>
  );
}
