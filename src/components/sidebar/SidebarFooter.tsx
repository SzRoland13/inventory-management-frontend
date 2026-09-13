'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useLocalizedRouter } from '@/lib/hooks/useLocalizedRouter';
import { useLogoutMutation, useSessionQuery } from '@/lib/queries/authQueries';
import { getApiErrorMessageKey } from '@/lib/queries/apiResponse';
import { useCompanyStore } from '@/lib/stores/companyStore';
import { useAvatarStore } from '@/lib/stores/avatarStore';
import { Routes } from '@/lib/enums/routes';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

export default function SidebarFooter() {
  const t = useTranslations();
  const { pushLocalized } = useLocalizedRouter();
  const username = useSessionQuery().data?.payload.username;
  const avatarUrl = useAvatarStore((state) => state.avatarUrl);
  const logout = useLogoutMutation();

  const handleLogout = () => {
    logout.mutate(undefined, {
      onSuccess: (response) => {
        useAvatarStore.getState().clearAvatar();
        useCompanyStore.getState().clearCompanyData();

        pushLocalized(Routes.Login_Start);

        toast(t(`messagekey.${response.messageKey}`));
      },
      onError: (error) => {
        toast.error(t(`messagekey.${getApiErrorMessageKey(error)}`));
      },
    });
  };

  return (
    <div className='border-t border-zinc-800 p-4 space-y-3'>
      <div className='flex items-center gap-3'>
        <Avatar>
          <AvatarImage src={avatarUrl ?? ''} />
          <AvatarFallback>{username?.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>

        <div className='flex-1'>
          <div className='text-sm text-white'>{username}</div>
          <button
            onClick={handleLogout}
            className='text-xs text-zinc-400 hover:text-red-800'
          >
            {t('sidebar.footer.logout')}
          </button>
        </div>
      </div>
      <div className='text-xs text-zinc-500 border-t border-zinc-800 pt-2'>
        {`v${process.env.NEXT_PUBLIC_APP_VERSION}`}
      </div>
    </div>
  );
}
