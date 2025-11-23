'use client';

import { UsersTable } from '@/components/users/UsersTable';
import useScreenSizeWatcher from '@/lib/hooks/useScreenSizeWatcher';
import { USER_ROLE, ACCOUNT_STATUS } from '@/lib/utils/enums';
import { User } from '@/lib/utils/types';
import { Users } from 'lucide-react';
import { useTranslations } from 'next-intl';

export default function UsersPage() {
  const t = useTranslations();
  const { isLargeScreen } = useScreenSizeWatcher();
  const mockUsers: User[] = [
    {
      id: 1,
      username: 'admin_user',
      email: 'admin@example.com',
      role: USER_ROLE.ADMIN,
      twoFaStatus: true,
      firstLoginStatus: true,
      accountStatus: ACCOUNT_STATUS.ACTIVE,
    },
    {
      id: 2,
      username: 'manager_john',
      email: 'john.manager@example.com',
      role: USER_ROLE.MANAGER,
      twoFaStatus: false,
      firstLoginStatus: true,
      accountStatus: ACCOUNT_STATUS.ACTIVE,
    },
    {
      id: 3,
      username: 'sales_emma',
      email: 'emma.sales@example.com',
      role: USER_ROLE.SALES,
      twoFaStatus: true,
      firstLoginStatus: false,
      accountStatus: ACCOUNT_STATUS.SUSPENDED,
    },
    {
      id: 4,
      username: 'manager_sophia',
      email: 'sophia.manager@example.com',
      role: USER_ROLE.MANAGER,
      twoFaStatus: false,
      firstLoginStatus: false,
      accountStatus: ACCOUNT_STATUS.ACTIVE,
    },
    {
      id: 5,
      username: 'sales_liam',
      email: 'liam.sales@example.com',
      role: USER_ROLE.SALES,
      twoFaStatus: true,
      firstLoginStatus: true,
      accountStatus: ACCOUNT_STATUS.ACTIVE,
    },
    {
      id: 6,
      username: 'sales_liam',
      email: 'liam.sales@example.com',
      role: USER_ROLE.SALES,
      twoFaStatus: true,
      firstLoginStatus: true,
      accountStatus: ACCOUNT_STATUS.ACTIVE,
    },
    {
      id: 7,
      username: 'sales_liam',
      email: 'liam.sales@example.com',
      role: USER_ROLE.SALES,
      twoFaStatus: true,
      firstLoginStatus: true,
      accountStatus: ACCOUNT_STATUS.ACTIVE,
    },
    {
      id: 8,
      username: 'sales_liam',
      email: 'liam.sales@example.com',
      role: USER_ROLE.SALES,
      twoFaStatus: true,
      firstLoginStatus: true,
      accountStatus: ACCOUNT_STATUS.ACTIVE,
    },
  ];
  return (
    <div className='flex flex-col w-full'>
      <div className='flex w-full bg-gradient-to-r from-zinc-800 to-zinc-900 p-4 rounded-t-lg border-b border-zinc-700 items-center justify-between'>
        <h1
          className={`${
            isLargeScreen ? '' : 'pl-10'
          }text-2xl font-semibold text-zinc-100 tracking-tight align-center flex flex-row gap-2`}
        >
          <Users className='w-6 h-6 self-center' />
          {t('pages.users.title')}
        </h1>
      </div>
      <div className='flex m-3 border-1 rounded-lg bg-zinc-900 overflow-hidden'>
        <UsersTable data={mockUsers} />
      </div>
    </div>
  );
}
