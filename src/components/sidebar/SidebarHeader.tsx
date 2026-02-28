'use client';

import { useCompanyStore } from '@/lib/stores/companyStore';
import { useTranslations } from 'next-intl';
import Image from 'next/image';

export default function SidebarHeader() {
  const { name, logoUrl } = useCompanyStore();
  const t = useTranslations();

  return (
    <div className='flex items-center border-b border-zinc-800 p-6'>
      <div className='p-3 rounded-2xl bg-zinc-800 shadow-inner flex-1'>
        <Image
          src={logoUrl ?? '/fallback-logo.png'}
          width={80}
          height={80}
          alt={name ?? 'Company logo'}
        />
      </div>
      <span className='text-lg font-semibold text-center flex-4 tracking-wide text-zinc-100'>
        {name ?? t('sidebar.header.company-fallback')}
      </span>
    </div>
  );
}
