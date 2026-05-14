'use client';

import MainHeader from '@/components/common/MainHeader';
import { Barcode } from 'lucide-react';
import { useTranslations } from 'next-intl';
export default function StocksPage() {
  const t = useTranslations();

  return (
    <div className='flex flex-col w-full'>
      <MainHeader
        title={t('pages.stocks.title')}
        icon={<Barcode className='w-6 h-6 self-center' />}
      />
    </div>
  );
}
