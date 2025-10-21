'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useUserStore } from '@/lib/stores/userStore';
import { sidebarItems } from '@/lib/config/sidebarConfig';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils/utils';
import { Menu } from 'lucide-react';
import { DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { useLocaleStore } from '@/lib/stores/localeStore';
import { useTranslations } from 'next-intl';
import useScreenSizeWatcher from '@/lib/hooks/useScreenSizeWatcher';

export default function Sidebar() {
  const { isLargeScreen } = useScreenSizeWatcher();
  const router = useRouter();
  const t = useTranslations();
  const pathname = usePathname();
  const { role } = useUserStore();
  const [sheetOpen, setSheetOpen] = useState<boolean>(false);

  // Filter sidebar items by user role
  const visibleItems = sidebarItems.filter(
    (item) => !item.roles || item.roles.includes(role!),
  );

  const getPath = () => {
    return `/${pathname.split('/')[2]}`;
  };

  const SidebarContent = (
    <div className='flex flex-col h-full w-full'>
      <div className='border-b p-4'>
        <h2 className='text-xl font-semibold text-center'>
          Inventory Management App
        </h2>
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

  return (
    <>
      {!isLargeScreen && (
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger asChild>
            <Button
              variant='secondary'
              size='icon'
              className='fixed top-4 left-2 z-50'
            >
              <Menu className='h-5 w-5' />
            </Button>
          </SheetTrigger>
          <SheetContent
            side='left'
            className='p-0 w-[90%] max-w-sm bg-zinc-900'
          >
            <DialogTitle className='sr-only'>Menu</DialogTitle>
            <DialogDescription className='sr-only'>
              Navigation menu with links to all pages.
            </DialogDescription>
            {SidebarContent}
          </SheetContent>
        </Sheet>
      )}

      {isLargeScreen && (
        <aside className='fixed left-0 top-0 h-screen w-[15vw] bg-zinc-900 border-r shadow-sm'>
          {SidebarContent}
        </aside>
      )}
    </>
  );
}
