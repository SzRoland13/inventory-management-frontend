import { useSidebar } from '@/lib/providers/SidebarContext';
import { Menu } from 'lucide-react';

export default function MobileSidebarToggle() {
  const { toggle } = useSidebar();

  return (
    <button
      onClick={toggle}
      className='p-2 rounded-lg bg-zinc-900 lg:invisible'
    >
      <Menu className='w-5 h-5 self-center' />
    </button>
  );
}
