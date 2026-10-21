'use client';

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/features/shared/components/ui/avatar';
import { useRouter } from '@/i18n/navigation';
import {
  useLogoutMutation,
  useSessionQuery,
} from '@/features/auth/queries/authQueries';
import { toastApiError } from '@/features/shared/api/apiResponse';
import { useCompanyStore } from '@/features/settings/stores/companyStore';
import { useAvatarStore } from '@/features/shared/media/avatarStore';
import { Routes } from '@/features/shared/types/routes';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

export default function SidebarFooter() {
  const t = useTranslations();
  const router = useRouter();
  const username = useSessionQuery().data?.payload.username;
  const avatarUrl = useAvatarStore((state) => state.avatarUrl);
  const logout = useLogoutMutation();

  const handleLogout = () => {
    logout.mutate(undefined, {
      onSuccess: (response) => {
        useAvatarStore.getState().clearAvatar();
        useCompanyStore.getState().clearCompanyData();

        router.push(Routes.Login_Start);

        toast(t(`messagekey.${response.messageKey}`));
      },
      onError: (error) => {
        toastApiError(t, error);
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
