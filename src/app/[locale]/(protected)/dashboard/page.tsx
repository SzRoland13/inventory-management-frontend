import MainHeader from '@/components/common/MainHeader';
import { Home } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

export default async function DashboardPage() {
  const t = await getTranslations();

  return (
    <div className='flex flex-col w-full'>
      <MainHeader
        title={t('pages.dashboard.title')}
        icon={<Home className='w-6 h-6 self-center' />}
      />
    </div>
  );
}
