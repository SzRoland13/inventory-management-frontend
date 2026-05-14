'use client';

import MainHeader from '@/components/common/MainHeader';
import { PackageSearch } from 'lucide-react';
import { useTranslations } from 'next-intl';

export default function ProductsPage() {
  const t = useTranslations();

  return (
    <div className='flex flex-col w-full'>
      <MainHeader
        title={t('pages.products.title')}
        icon={<PackageSearch className='w-6 h-6 self-center' />}
      />
    </div>
  );
}
