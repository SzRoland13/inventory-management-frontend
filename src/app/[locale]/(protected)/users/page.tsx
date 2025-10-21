'use client';

import { UsersTable } from '@/components/users/UsersTable';
import useScreenSizeWatcher from '@/lib/hooks/useScreenSizeWatcher';
import { USER_ROLE, USER_STATUS } from '@/lib/utils/enums';
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
      is2FaEnabled: true,
      isOtcSetupCompleted: true,
      userStatus: USER_STATUS.ACTIVE,
    },
    {
      id: 2,
      username: 'manager_john',
      email: 'john.manager@example.com',
      role: USER_ROLE.MANAGER,
      is2FaEnabled: false,
      isOtcSetupCompleted: true,
      userStatus: USER_STATUS.ACTIVE,
    },
    {
      id: 3,
      username: 'sales_emma',
      email: 'emma.sales@example.com',
      role: USER_ROLE.SALES,
      is2FaEnabled: true,
      isOtcSetupCompleted: false,
      userStatus: USER_STATUS.SUSPENDED,
    },
    {
      id: 4,
      username: 'manager_sophia',
      email: 'sophia.manager@example.com',
      role: USER_ROLE.MANAGER,
      is2FaEnabled: false,
      isOtcSetupCompleted: false,
      userStatus: USER_STATUS.ACTIVE,
    },
    {
      id: 5,
      username: 'sales_liam',
      email: 'liam.sales@example.com',
      role: USER_ROLE.SALES,
      is2FaEnabled: true,
      isOtcSetupCompleted: true,
      userStatus: USER_STATUS.ACTIVE,
    },
  ];
  return (
    <div className='w-full'>
      <div className='w-full bg-gradient-to-r from-zinc-800 to-zinc-900 p-4 rounded-t-lg border-b border-zinc-700 flex items-center justify-between'>
        <h1
          className={`${
            isLargeScreen ? '' : 'pl-10 '
          }text-2xl font-semibold text-zinc-100 tracking-tight align-center flex flex-row gap-2`}
        >
          <Users className='w-6 h-6 self-center' /> {t('pages.users.title')}
        </h1>
      </div>
      <div className='m-3 border-1 h-full rounded-lg bg-zinc-900'>
        <UsersTable data={mockUsers} />
      </div>
    </div>
  );
}
