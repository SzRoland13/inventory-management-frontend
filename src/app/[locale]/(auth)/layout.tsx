'use client';

import { Loader2 } from 'lucide-react';
import { useSessionGuard } from '@/lib/hooks/useSessionGuard';

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { hydrated, loading } = useSessionGuard('auth');

  if (!hydrated || loading) {
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
