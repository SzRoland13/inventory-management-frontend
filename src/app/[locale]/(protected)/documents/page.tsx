import MainHeader from '@/components/common/MainHeader';
import { Inbox } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

export default async function DocumentsPage() {
  const t = await getTranslations();

  return (
    <div className='flex flex-col w-full'>
      <MainHeader
        title={t('pages.documents.title')}
        icon={<Inbox className='w-6 h-6 self-center' />}
      />
    </div>
  );
}
