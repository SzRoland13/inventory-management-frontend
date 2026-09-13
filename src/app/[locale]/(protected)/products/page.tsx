import MainHeader from '@/components/common/MainHeader';
import { PackageSearch } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

export default async function ProductsPage() {
  const t = await getTranslations();

  return (
    <div className='flex flex-col w-full'>
      <MainHeader
        title={t('pages.products.title')}
        icon={<PackageSearch className='w-6 h-6 self-center' />}
      />
    </div>
  );
}
