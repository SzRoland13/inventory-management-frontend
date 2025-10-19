'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useUserStore } from '@/lib/stores/userStore';
import { useLocalizedRouter } from '@/lib/hooks/useLocalizedRouter';
import { Routes } from '@/lib/utils/enums';
import { UserService } from '@/lib/services/UserService';
import { useTranslations } from 'next-intl';

type GuardType = 'auth' | 'protected';

export function useSessionGuard(type: GuardType) {
  const { accessToken, refreshToken, clearUser } = useUserStore();
  const { pushLocalized } = useLocalizedRouter();
  const userService = UserService.instance();
  const t = useTranslations();

  const [hydrated, setHydrated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [redirecting, setRedirecting] = useState(false);

  // Wait for Zustand hydration
  useEffect(() => {
    const unsub = useUserStore.persist.onFinishHydration(() =>
      setHydrated(true),
    );
    setHydrated(useUserStore.persist.hasHydrated());
    return () => unsub?.();
  }, []);

  useEffect(() => {
    if (!hydrated || redirecting) return;

    const check = async () => {
      // If no tokens
      if (type === 'protected' && !accessToken && !refreshToken) {
        setRedirecting(true);
        toast(t('messagekey.guard.session-expired'));
        pushLocalized(Routes.Login_Start);
        return;
      }

      try {
        await userService.checkSession();

        if (type === 'auth' && (accessToken || refreshToken)) {
          setRedirecting(true);
          toast(t('messagekey.guard.logged-in-redirect'));
          pushLocalized(Routes.Dashboard);
          return;
        }
      } catch (err) {
        console.error('Session invalid:', err);
        clearUser();

        if (type === 'protected') {
          setRedirecting(true);
          toast(t('messagekey.guard.session-expired'));
          pushLocalized(Routes.Login_Start);
        } else {
          toast(t('messagekey.guard.invalid-session'));
        }
        return;
      }

      // Only set loading false if not redirecting
      setLoading(false);
    };

    check();
  }, [
    hydrated,
    accessToken,
    refreshToken,
    clearUser,
    pushLocalized,
    userService,
    t,
    type,
    redirecting,
  ]);

  return { hydrated, loading };
}
