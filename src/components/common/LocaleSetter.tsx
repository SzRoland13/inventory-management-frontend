'use client';
import { useLocaleStore } from '@/lib/stores/localeStore';
import { useEffect } from 'react';

export default function LocaleSetter({ locale }: { locale: string }) {
  const setLocale = useLocaleStore((s) => s.setLocale);

  useEffect(() => {
    setLocale(locale);
  }, [locale, setLocale]);

  return null;
}
