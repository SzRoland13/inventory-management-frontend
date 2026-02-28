'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useUserStore } from '@/lib/stores/userStore';
import { sidebarItems } from '@/lib/config/sidebarConfig';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils/utils';
import { DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { useTranslations } from 'next-intl';
import { useSidebar } from '@/lib/providers/SidebarContext';
import SidebarHeader from '@/components/sidebar/SidebarHeader';
import SidebarFooter from '@/components/sidebar/SidebarFooter';
import { useLocalizedRouter } from '@/lib/hooks/useLocalizedRouter';

export default function Sidebar() {
  const { isOpen: sheetOpen, setOpen: setSheetOpen } = useSidebar();
  const { pushLocalized } = useLocalizedRouter();
  const t = useTranslations();
  const pathname = usePathname();
  const { role } = useUserStore();
  const { username } = useUserStore();

  useEffect(() => {
    setSheetOpen(false);
  }, [setSheetOpen]);

  // Filter sidebar items by user role
  const visibleItems = sidebarItems.filter(
    (item) => !item.roles || item.roles.includes(role!),
  );

  const getPath = () => {
    return `/${pathname.split('/')[2]}`;
  };

  const activePath = getPath();

  const SidebarContent = (
    <div className='flex flex-col h-full w-full bg-gradient-to-b from-zinc-900 to-zinc-950 text-zinc-200'>
      <SidebarHeader />
      {/* Navigation */}
      <ScrollArea className='flex-1 px-3 py-4'>
        <nav className='flex flex-col gap-1'>
          {visibleItems.map((item) => {
            const isActive = activePath === item.path;

            return (
              <Button
                key={item.path}
                variant='ghost'
                onClick={() => {
                  pushLocalized(item.path);
                  setSheetOpen(false);
                }}
                className={cn(
                  'relative justify-start w-full gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-zinc-800 text-white shadow-md'
                    : 'hover:bg-zinc-800/60 hover:text-white text-zinc-400',
                )}
              >
                <span
                  className={cn(
                    'transition-colors',
                    isActive ? 'text-primary' : 'text-zinc-400',
                  )}
                >
                  {item.icon}
                </span>

                {t(item.label)}
              </Button>
            );
          })}
        </nav>
      </ScrollArea>
      <SidebarFooter userAvatarUrl={''} username={username} />
    </div>
  );

  return (
    <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
      <SheetContent side='left' className='p-0 w-[90%] max-w-sm bg-zinc-900'>
        <DialogTitle className='sr-only'>Sidebar</DialogTitle>
        <DialogDescription className='sr-only'></DialogDescription>
        {SidebarContent}
      </SheetContent>
    </Sheet>
  );
}
