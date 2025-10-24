'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUserStore } from '@/lib/stores/userStore';
import { useSessionGuard } from '@/lib/hooks/useSessionGuard';
import { Routes } from '@/lib/utils/enums';
import { Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function AuthLoadingPage() {
  const router = useRouter();
  const { hydrated, loading } = useSessionGuard('protected');
  const { accessToken } = useUserStore();

  useEffect(() => {
    if (!hydrated || loading) return;

    // Guard handles redirect on failure — we only redirect on success
    if (accessToken) {
      router.replace(Routes.Dashboard);
    }
  }, [hydrated, loading, accessToken, router]);

  return (
    <div className='flex items-center justify-center h-screen bg-zinc-900 text-zinc-100'>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className='flex flex-col items-center gap-4'
      >
        <Loader2 className='animate-spin h-8 w-8' />
        <p>Checking session...</p>
      </motion.div>
    </div>
  );
}
