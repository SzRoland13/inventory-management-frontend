'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AuthService } from '@/lib/services/AuthService';
import { useTranslations } from 'next-intl';

type Props = {
  userAvatarUrl: string;
  username: string | null;
};

export default function SidebarFooter({ userAvatarUrl, username }: Props) {
  const t = useTranslations();

  return (
    <div className='border-t border-zinc-800 p-4 space-y-3'>
      <div className='flex items-center gap-3'>
        <Avatar>
          <AvatarImage src={userAvatarUrl} />
          <AvatarFallback>{username?.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>

        <div className='flex-1'>
          <div className='text-sm text-white'>{username}</div>
          <button
            onClick={AuthService.logout}
            className='text-xs text-zinc-400 hover:text-red-400'
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
