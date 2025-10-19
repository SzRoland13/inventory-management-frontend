'use client';

import { useLocalizedRouter } from '@/lib/hooks/useLocalizedRouter';
import { useUserStore } from '@/lib/stores/userStore';
import { Routes } from '@/lib/utils/enums';
import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { UserService } from '@/lib/services/UserService';

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { pushLocalized } = useLocalizedRouter();
  const userService = UserService.instance();
  const { accessToken, refreshToken, clearUser } = useUserStore();
  const [loading, setLoading] = useState<boolean>(true);
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      if (!accessToken && !refreshToken) {
        setLoading(false);
        return;
      }

      try {
        await userService.checkSession();

        setRedirecting(true);
        pushLocalized(Routes.Dashboard);
      } catch (error) {
        console.error(error);
        clearUser();
        setLoading(false);
      }
    };

    checkSession();
  }, [accessToken, userService, clearUser, pushLocalized, refreshToken]);

  if (loading || redirecting) {
    return (
      <div className='flex min-h-screen items-center justify-center bg-zinc-950'>
        <Loader2 className='w-6 h-6 animate-spin text-zinc-300' />
      </div>
    );
  }

  return (
    <div className='flex min-h-screen items-center justify-center'>
      {children}
    </div>
  );
}
