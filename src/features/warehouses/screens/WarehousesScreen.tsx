'use client';

import MainHeader from '@/features/shared/components/MainHeader';
import { WarehousesTable } from '@/features/warehouses/components/WarehousesTable';
import { Warehouse } from 'lucide-react';
import { useTranslations } from 'next-intl';

export default function WarehousesScreen() {
  const t = useTranslations();

  return (
    <div className='flex w-full flex-col'>
      <MainHeader
        title={t('pages.warehouses.title')}
        icon={<Warehouse className='h-6 w-6 self-center' />}
      />
      <WarehousesTable />
    </div>
  );
}
