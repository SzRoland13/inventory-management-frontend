import MainHeader from '@/components/common/MainHeader';
import { BadgeDollarSign } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

export default async function SalesPage() {
  const t = await getTranslations();

  return (
    <div className='flex flex-col w-full'>
      <MainHeader
        title={t('pages.sales.title')}
        icon={<BadgeDollarSign className='w-6 h-6 self-center' />}
      />
    </div>
  );
}
