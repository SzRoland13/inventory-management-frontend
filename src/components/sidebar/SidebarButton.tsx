import { useSidebar } from '@/lib/providers/SidebarContext';
import { Menu } from 'lucide-react';

export default function SidebarButton() {
  const { toggle } = useSidebar();

  return (
    <button
      onClick={toggle}
      className='
        flex items-center justify-center
        w-9 h-9
        border
        border-zinc-800
        rounded-md
        text-zinc-300
        hover:bg-zinc-800
        hover:text-white
        transition-colors
      '
    >
      <Menu className='w-5 h-5' />
    </button>
  );
}
