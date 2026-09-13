import MainHeader from '@/components/common/MainHeader';
import { Barcode } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

export default async function StocksPage() {
  const t = await getTranslations();

  return (
    <div className='flex flex-col w-full'>
      <MainHeader
        title={t('pages.stocks.title')}
        icon={<Barcode className='w-6 h-6 self-center' />}
      />
    </div>
  );
}
