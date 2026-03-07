'use client';

import { Loader2 } from 'lucide-react';
import Sidebar from '@/components/sidebar/Sidebar';
import useSessionGuard from '@/lib/hooks/useSessionGuard';
import { SidebarProvider } from '@/lib/providers/SidebarContext';
import { useTranslations } from 'next-intl';
import { useLocalizedRouter } from '@/lib/hooks/useLocalizedRouter';
import { useEffect } from 'react';
import { toast } from 'sonner';
import { Routes } from '@/lib/enums/routes';

export default function ProtectedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const t = useTranslations();
  const { loading, isAuthenticated } = useSessionGuard();
  const { replaceLocalized } = useLocalizedRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      toast.info(t('messagekey.guard.session-expired'));
      replaceLocalized(Routes.Login_Start);
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
    <div className='w-full flex min-h-screen bg-muted/10'>
      <SidebarProvider>
        <Sidebar />
        <main className='flex w-full transition-all duration-300'>
          {children}
        </main>
      </SidebarProvider>
    </div>
  );
}
