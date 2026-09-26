'use client';

import { ProductsTable } from '@/features/products/components/ProductsTable';
import MainHeader from '@/features/shared/components/MainHeader';
import { PackageSearch } from 'lucide-react';
import { useTranslations } from 'next-intl';

export default function ProductsScreen() {
  const t = useTranslations();

  return (
    <div className='flex w-full flex-col'>
      <MainHeader
        title={t('pages.products.title')}
        icon={<PackageSearch className='h-6 w-6 self-center' />}
      />
      <ProductsTable />
    </div>
  );
}
