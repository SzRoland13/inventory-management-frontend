import MainHeader from '@/components/common/MainHeader';
import { Clipboard } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

export default async function ReportsPage() {
  const t = await getTranslations();

  return (
    <div className='flex flex-col w-full'>
      <MainHeader
        title={t('pages.reports.title')}
        icon={<Clipboard className='w-6 h-6 self-center' />}
      />
    </div>
  );
}
