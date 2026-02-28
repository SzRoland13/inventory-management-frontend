'use client';

import MainHeader from '@/components/common/MainHeader';
import { Settings } from 'lucide-react';
import { useTranslations } from 'next-intl';

export default function SettingsPage() {
  const t = useTranslations();

  return (
    <div className='flex flex-col w-full'>
      <MainHeader
        title={t('pages.settings.title')}
        icon={<Settings className='w-6 h-6 self-center' />}
      />
    </div>
  );
}
