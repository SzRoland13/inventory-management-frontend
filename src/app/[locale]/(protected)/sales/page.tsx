'use client';

import MainHeader from '@/components/common/MainHeader';
import { BadgeDollarSign } from 'lucide-react';
import { useTranslations } from 'next-intl';

export default function SalesPage() {
  const t = useTranslations();

  return (
    <div className='flex flex-col w-full'>
      <MainHeader
        title={t('pages.sales.title')}
        icon={<BadgeDollarSign className='w-6 h-6 self-center' />}
      />
    </div>
  );
}
