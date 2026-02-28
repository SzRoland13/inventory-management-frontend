'use client';

import MainHeader from '@/components/common/MainHeader';
import { Clipboard } from 'lucide-react';
import { useTranslations } from 'next-intl';

export default function ReportsPage() {
  const t = useTranslations();

  return (
    <div className='flex flex-col w-full'>
      <MainHeader
        title={t('pages.reports.title')}
        icon={<Clipboard className='w-6 h-6 self-center' />}
      />
    </div>
  );
}
