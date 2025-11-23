'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useUserStore } from '@/lib/stores/userStore';
import { sidebarItems } from '@/lib/config/sidebarConfig';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils/utils';
import { DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { useLocaleStore } from '@/lib/stores/localeStore';
import { useTranslations } from 'next-intl';
import useScreenSizeWatcher from '@/lib/hooks/useScreenSizeWatcher';
import Image from 'next/image';
import { useSidebar } from '@/lib/providers/SidebarContext';

export default function Sidebar() {
  const { isLargeScreen } = useScreenSizeWatcher();
  const { isOpen: sheetOpen, setOpen: setSheetOpen } = useSidebar();
  const router = useRouter();
  const t = useTranslations();
  const pathname = usePathname();
  const { role } = useUserStore();

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

  const SidebarContent = (
    <div className='flex flex-col h-full w-full'>
      <div className='flex items-center justify-center border-b p-4'>
        <Image
          src='/icon.png'
          width={100}
          height={100}
          alt='Inventory Management App logo'
        />
      </div>

      <ScrollArea className='flex-1'>
        <nav className='flex flex-col py-2'>
          {visibleItems.map((item) => (
            <Button
              key={item.path}
              variant='ghost'
              disabled={getPath() === item.path}
              className={cn(
                'justify-start w-full gap-3 rounded-none px-6 py-4 text-base font-medium transition-colors',
                getPath() === item.path
                  ? null
                  : 'hover:text-primary hover:bg-muted',
              )}
              onClick={() => {
                router.push(`/${useLocaleStore.getState().locale}${item.path}`);
                setSheetOpen(false);
              }}
            >
              {item.icon}
              {t(item.label)}
            </Button>
          ))}
        </nav>
      </ScrollArea>
    </div>
  );

  return !isLargeScreen ? (
    <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
      <SheetContent side='left' className='p-0 w-[90%] max-w-sm bg-zinc-900'>
        <DialogTitle className='sr-only'>Menu</DialogTitle>
        <DialogDescription className='sr-only'>
          <Image
            src='/icon.png'
            width={100}
            height={100}
            alt='Inventory Management App logo'
          />
        </DialogDescription>
        {SidebarContent}
      </SheetContent>
    </Sheet>
  ) : (
    <aside className='h-screen w-1/6 bg-zinc-900 border-r shadow-sm'>
      {SidebarContent}
    </aside>
  );
}
