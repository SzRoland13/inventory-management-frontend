'use client';

import MainHeader from '@/components/common/MainHeader';
import { UsersTable } from '@/components/users/UsersTable';
import { ApiResponse } from '@/lib/services/dtos/genericDtos';
import { AllUserResponse, UserDto } from '@/lib/services/dtos/userDtos';
import { UserService } from '@/lib/services/UserService';
import { Users } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

export default function UsersPage() {
  const t = useTranslations();

  const [users, setUsers] = useState<UserDto[]>([]);

  const fetchUsers = useCallback(() => {
    UserService.getAllUsers()
      .then((response) => setUsers(response.payload.users))
      .catch((error: ApiResponse<AllUserResponse>) => {
        console.log(error);
        toast(t(`messagekey.${error.messageKey}`));
      });
  }, [t]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  return (
    <div className='flex flex-col w-full'>
      <MainHeader
        title={t('pages.users.title')}
        icon={<Users className='w-6 h-6 self-center' />}
      />
      <div className='flex m-3 border-1 rounded-lg bg-zinc-900 overflow-hidden'>
        <UsersTable data={users} onSave={fetchUsers} />
      </div>
    </div>
  );
}
