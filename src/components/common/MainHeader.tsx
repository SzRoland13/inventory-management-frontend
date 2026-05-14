import SidebarButton from '@/components/sidebar/SidebarButton';
import { ReactNode } from 'react';

type Props = {
  title: string;
  icon?: ReactNode;
};

export default function MainHeader({ title, icon }: Props) {
  return (
    <header className='flex items-center justify-between h-16 px-6 bg-zinc-900 border-b border-zinc-800 shadow-md'>
      <div className='flex items-center gap-3'>
        <SidebarButton />

        {icon && (
          <div className='flex items-center justify-center w-8 h-8 rounded-md bg-zinc-800 text-zinc-300'>
            {icon}
          </div>
        )}

        <h1 className='text-xl font-semibold text-zinc-100 tracking-tight'>
          {title}
        </h1>
      </div>
    </header>
  );
}
