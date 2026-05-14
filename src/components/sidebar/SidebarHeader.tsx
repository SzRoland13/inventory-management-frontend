'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useCompanyStore } from '@/lib/stores/companyStore';
import { useTranslations } from 'next-intl';

export default function SidebarHeader() {
  const { name, logoUrl } = useCompanyStore();
  const t = useTranslations();

  return (
    <div className='flex items-center border-b border-zinc-800 p-6'>
      <div className='p-3 rounded-2xl bg-zinc-800 shadow-inner flex-1'>
        <Avatar className='w-20 h-20 border border-zinc-700'>
          <AvatarImage src={logoUrl ?? ''} alt='Company logo' />
          <AvatarFallback className='bg-zinc-800 text-zinc-400'>
            {'LOGO'}
          </AvatarFallback>
        </Avatar>
      </div>
      <span className='text-lg font-semibold text-center flex-4 tracking-wide text-zinc-100'>
        {name ?? t('sidebar.header.company-fallback')}
      </span>
    </div>
  );
}
