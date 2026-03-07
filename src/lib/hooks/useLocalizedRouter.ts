'use client';

import { useRouter } from 'next/navigation';
import { useLocaleStore } from '@/lib/stores/localeStore';
import { Routes } from '@/lib/enums/routes';

export function useLocalizedRouter() {
  const router = useRouter();
  const locale = useLocaleStore((s) => s.locale);

  function pushLocalized(route: Routes) {
    router.push(`/${locale}${route}`);
  }

  function replaceLocalized(route: Routes) {
    router.replace(`/${locale}${route}`);
  }

  function getLocalizedPath(route: Routes) {
    return `/${locale}${route}`;
  }

  return { pushLocalized, replaceLocalized, getLocalizedPath };
}
