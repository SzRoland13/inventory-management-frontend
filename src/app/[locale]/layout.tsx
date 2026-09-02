import { NextIntlClientProvider } from 'next-intl';
import { notFound } from 'next/navigation';
import React from 'react';
import '@/app/globals.css';
import LocaleSetter from '@/components/common/LocaleSetter';
import { QueryProvider } from '@/lib/providers/QueryProvider';

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  let messages;

  try {
    messages = (await import(`@/lib/locales/messages/${locale}.json`)).default;
  } catch (error) {
    console.error(error);
    notFound();
  }

  return (
    <div className='w-full'>
      <NextIntlClientProvider locale={locale} messages={messages}>
        <QueryProvider>
          <LocaleSetter locale={locale} />
          {children}
        </QueryProvider>
      </NextIntlClientProvider>
    </div>
  );
}
