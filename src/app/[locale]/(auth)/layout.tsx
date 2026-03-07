'use client';

import { Loader2 } from 'lucide-react';
import useSessionGuard from '@/lib/hooks/useSessionGuard';
import { useTranslations } from 'next-intl';
import { useEffect } from 'react';
import { toast } from 'sonner';
import { Routes } from '@/lib/utils/enums/routes';
import { useLocalizedRouter } from '@/lib/hooks/useLocalizedRouter';

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const t = useTranslations();
  const { loading, isAuthenticated } = useSessionGuard();
  const { replaceLocalized } = useLocalizedRouter();

  useEffect(() => {
    if (!loading && isAuthenticated) {
      toast.info(t('messagekey.guard.logged-in-redirect'));
      replaceLocalized(Routes.Dashboard);
    }
  }, [loading, isAuthenticated, replaceLocalized, t]);

  if (loading) {
    return (
      <div className='flex min-h-screen items-center justify-center bg-zinc-950'>
        <Loader2 className='w-6 h-6 animate-spin text-zinc-300' />
      </div>
    );
  }

  return (
    <main className='flex min-h-screen items-center justify-center'>
      {children}
    </main>
  );
}
