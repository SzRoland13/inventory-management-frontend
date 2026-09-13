'use client';

import Sidebar from '@/components/sidebar/Sidebar';
import { SidebarProvider } from '@/lib/providers/SidebarContext';
import { usePresignedMediaRefresher } from '@/lib/hooks/usePresignedMediaRefresher';

export default function ProtectedLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  usePresignedMediaRefresher();

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
