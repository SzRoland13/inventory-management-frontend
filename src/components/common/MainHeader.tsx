import SidebarButton from '@/components/sidebar/SidebarButton';
import { ReactNode } from 'react';

type Props = {
  title: string;
  icon: ReactNode;
};

export default function MainHeader({ title, icon }: Props) {
  return (
    <div className='flex w-full bg-gradient-to-r from-zinc-800 to-zinc-900 p-4 items-center justify-between shadow-md'>
      <div className='align-center flex flex-row gap-2'>
        <SidebarButton />
        {icon}
        <h1 className='flex align-bottom text-2xl leading-normal font-bold text-zinc-100 tracking-tight'>
          {title}
        </h1>
      </div>
    </div>
  );
}
