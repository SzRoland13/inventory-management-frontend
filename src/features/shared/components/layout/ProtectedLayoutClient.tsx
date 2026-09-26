'use client';

import Sidebar from '@/features/shared/components/sidebar/Sidebar';
import { SidebarProvider } from '@/features/shared/providers/SidebarContext';
import { usePresignedMediaRefresher } from '@/features/shared/media/usePresignedMediaRefresher';

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
