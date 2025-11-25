'use client';

import MobileSidebarToggle from '@/components/common/MobileSidebarToggle';
import { UsersTable } from '@/components/users/UsersTable';
import { UserRole, UserStatus } from '@/lib/utils/enums';
import { User } from '@/lib/utils/types';
import { Users } from 'lucide-react';
import { useTranslations } from 'next-intl';

export default function UsersPage() {
  const t = useTranslations();
  const mockUsers: User[] = [
    {
      id: 1,
      username: 'admin_user',
      email: 'admin@example.com',
      role: UserRole.ADMIN,
      twoFaStatus: true,
      firstLoginStatus: true,
      accountStatus: UserStatus.ACTIVE,
    },
    {
      id: 2,
      username: 'manager_john',
      email: 'john.manager@example.com',
      role: UserRole.MANAGER,
      twoFaStatus: false,
      firstLoginStatus: true,
      accountStatus: UserStatus.ACTIVE,
    },
    {
      id: 3,
      username: 'sales_emma',
      email: 'emma.sales@example.com',
      role: UserRole.SALES,
      twoFaStatus: true,
      firstLoginStatus: false,
      accountStatus: UserStatus.SUSPENDED,
    },
    {
      id: 4,
      username: 'manager_sophia',
      email: 'sophia.manager@example.com',
      role: UserRole.MANAGER,
      twoFaStatus: false,
      firstLoginStatus: false,
      accountStatus: UserStatus.ACTIVE,
    },
    {
      id: 5,
      username: 'sales_liam',
      email: 'liam.sales@example.com',
      role: UserRole.SALES,
      twoFaStatus: true,
      firstLoginStatus: true,
      accountStatus: UserStatus.ACTIVE,
    },
    {
      id: 6,
      username: 'sales_liam',
      email: 'liam.sales@example.com',
      role: UserRole.SALES,
      twoFaStatus: true,
      firstLoginStatus: true,
      accountStatus: UserStatus.ACTIVE,
    },
    {
      id: 7,
      username: 'sales_liam',
      email: 'liam.sales@example.com',
      role: UserRole.SALES,
      twoFaStatus: true,
      firstLoginStatus: true,
      accountStatus: UserStatus.ACTIVE,
    },
    {
      id: 8,
      username: 'sales_liam',
      email: 'liam.sales@example.com',
      role: UserRole.SALES,
      twoFaStatus: true,
      firstLoginStatus: true,
      accountStatus: UserStatus.ACTIVE,
    },
  ];
  return (
    <div className='flex flex-col w-full'>
      <div className='flex w-full bg-gradient-to-r from-zinc-800 to-zinc-900 p-4 rounded-t-lg border-b border-zinc-700 items-center justify-between'>
        <h1
          className={
            'text-2xl font-semibold text-zinc-100 tracking-tight align-center flex flex-row gap-2'
          }
        >
          <MobileSidebarToggle />
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
