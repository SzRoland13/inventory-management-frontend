'use client';

import MainHeader from '@/components/common/MainHeader';
import { Inbox } from 'lucide-react';
import { useTranslations } from 'next-intl';

export default function DocumentsPage() {
  const t = useTranslations();

  return (
    <div className='flex flex-col w-full'>
      <MainHeader
        title={t('pages.documents.title')}
        icon={<Inbox className='w-6 h-6 self-center' />}
      />
    </div>
  );
}
