'use client';

import { useLocalizedRouter } from '@/lib/hooks/useLocalizedRouter';
import { Routes } from '@/lib/enums/routes';
import { useEffect } from 'react';

export default function Home({ locale }: { locale: string }) {
  const { pushLocalized } = useLocalizedRouter();

  useEffect(() => {
    pushLocalized(Routes.Login_Start);
  }, [locale, pushLocalized]);

  return <div></div>;
}
