import { useSidebar } from '@/lib/providers/SidebarContext';
import { Menu } from 'lucide-react';

export default function SidebarButton() {
  const { toggle } = useSidebar();

  return (
    <button onClick={toggle} className='p-2 rounded-lg bg-zinc-900'>
      <Menu className='w-5 h-5 self-center' />
    </button>
  );
}
