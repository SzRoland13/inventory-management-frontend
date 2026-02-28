import SidebarButton from '@/components/common/SidebarButton';
import { ReactNode } from 'react';

type Props = {
  title: string;
  icon: ReactNode;
};

export default function MainHeader({ title, icon }: Props) {
  return (
    <div className='flex w-full bg-gradient-to-r from-zinc-800 to-zinc-900 p-4 rounded-t-lg border-b border-zinc-700 items-center justify-between'>
      <h1
        className={
          'text-2xl font-semibold text-zinc-100 tracking-tight align-center flex flex-row gap-2'
        }
      >
        <SidebarButton />
        {icon}
        {title}
      </h1>
    </div>
  );
}
