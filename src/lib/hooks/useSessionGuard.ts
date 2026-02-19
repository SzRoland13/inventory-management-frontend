import { useAuthStore } from '@/lib/stores/authStore';
import { useUserStore } from '@/lib/stores/userStore';
import { useLocalizedRouter } from '@/lib/hooks/useLocalizedRouter';
import { Routes } from '@/lib/utils/enums';
import { UserService } from '@/lib/services/UserService';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

type GuardType = 'auth' | 'protected';

export function useSessionGuard(type: GuardType) {
  const { accessToken, refreshToken, clearUser } = useUserStore();
  const { shortLifeToken } = useAuthStore();
  const { pushLocalized } = useLocalizedRouter();
  const t = useTranslations();

  const [hydrated, setHydrated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [redirecting, setRedirecting] = useState(false);

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
      const hasTokens = accessToken && refreshToken;
      const in2faFlow = Boolean(shortLifeToken);

      if (type === 'protected') {
        // Protected pages allow if user is authenticated OR in 2fa flow
        if (!hasTokens && !in2faFlow) {
          setRedirecting(true);
          toast(t('messagekey.guard.session-expired'));
          pushLocalized(Routes.Login_Start);
          return;
        }

        if (hasTokens) {
          try {
            await UserService.checkSession();
          } catch (err) {
            console.error(err);
            clearUser();
            setRedirecting(true);
            toast(t('messagekey.guard.session-expired'));
            pushLocalized(Routes.Login_Start);
            return;
          }
        }
      }

      if (type === 'auth') {
        // Auth pages allow if we're in the 2fa flow
        if (hasTokens && !in2faFlow) {
          setRedirecting(true);
          toast(t('messagekey.guard.logged-in-redirect'));
          pushLocalized(Routes.Dashboard);
          return;
        }
      }

      setLoading(false);
    };

    check();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken, refreshToken, shortLifeToken, hydrated]);

  return { hydrated, loading };
}
