'use client';

import { useLocalizedRouter } from '@/lib/hooks/useLocalizedRouter';
import { useUserStore } from '@/lib/stores/userStore';
import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Routes } from '@/lib/utils/enums';
import { UserService } from '@/lib/services/UserService';

export default function ProtectedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { accessToken, refreshToken, clearUser } = useUserStore();
  const { pushLocalized } = useLocalizedRouter();
  const userService = UserService.instance();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const validateSession = async () => {
      if (!accessToken && !refreshToken) {
        pushLocalized(Routes.Login_Start);
        return;
      }

      try {
        await userService.checkSession();
        setLoading(false);
      } catch (err) {
        console.error('Session invalid:', err);
        clearUser();
        pushLocalized(Routes.Login_Start);
      }
    };

    validateSession();
  }, [accessToken, refreshToken, clearUser, pushLocalized, userService]);

  if (loading) {
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
