'use client';

import MainHeader from '@/components/common/MainHeader';
import { Home } from 'lucide-react';
import { useTranslations } from 'next-intl';

export default function DashboardPage() {
  const t = useTranslations();

  return (
    <div className='flex flex-col w-full'>
      <MainHeader
        title={t('pages.dashboard.title')}
        icon={<Home className='w-6 h-6 self-center' />}
      />
    </div>
  );
}
