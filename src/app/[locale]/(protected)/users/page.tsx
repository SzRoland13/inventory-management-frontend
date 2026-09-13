'use client';

import MainHeader from '@/components/common/MainHeader';
import { UsersTable } from '@/components/users/UsersTable';
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
      <div className='flex m-3 border-1 rounded-lg bg-zinc-900 overflow-hidden'>
        <UsersTable />
      </div>
    </div>
  );
}
