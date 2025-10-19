'use client';

import { Loader2 } from 'lucide-react';
import Sidebar from '@/components/common/Sidebar';
import { useSessionGuard } from '@/lib/hooks/useSessionGuard';

export default function ProtectedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { hydrated, loading } = useSessionGuard('protected');

  if (!hydrated || loading) {
    return (
      <div className='flex min-h-screen items-center justify-center bg-zinc-950'>
        <Loader2 className='w-6 h-6 animate-spin text-zinc-300' />
      </div>
    );
  }

  return (
    <div className='flex min-h-screen bg-muted/10'>
      <Sidebar />
      <main className='flex-1 p-6 lg:ml-[15vw] transition-all duration-300'>
        {children}
      </main>
    </div>
  );
}
