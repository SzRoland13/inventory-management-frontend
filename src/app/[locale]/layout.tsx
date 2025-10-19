import { NextIntlClientProvider } from 'next-intl';
import { notFound } from 'next/navigation';
import React from 'react';
import '@/app/globals.css';
import LocaleSetter from '@/components/common/LocaleSetter';

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { locale: string };
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
    <div className='flex-1'>
      <NextIntlClientProvider locale={locale} messages={messages}>
        <LocaleSetter locale={locale} />
        {children}
      </NextIntlClientProvider>
    </div>
  );
}
