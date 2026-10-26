'use client';

import MainHeader from '@/features/shared/components/MainHeader';
import { UsersTable } from '@/features/users/components/UsersTable';
import { Users } from 'lucide-react';
import { useTranslations } from 'next-intl';

export default function UsersPage() {
  const t = useTranslations();

  return (
    <div className='flex flex-col w-full'>
      <MainHeader
        title={t('pages.users.title')}
        icon={<Users className='w-6 h-6 self-center' />}
      />
      <UsersTable />
    </div>
  );
}
