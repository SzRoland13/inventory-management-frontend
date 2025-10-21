'use client';

import { Menubar, MenubarMenu, MenubarTrigger } from '@/components/ui/menubar';
import { PlusCircle, Edit, ShieldX, RotateCcw } from 'lucide-react';

interface UsersToolbarProps {
  selectedIds: number[];
  onAdd: () => void;
  onEdit: () => void;
  onSuspend: () => void;
  onReset2FA: () => void;
}

export function UsersToolbar({
  selectedIds,
  onAdd,
  onEdit,
  onSuspend,
  onReset2FA,
}: UsersToolbarProps) {
  const hasSelection = selectedIds.length > 0;
  const hasSelectedOnlyOne = selectedIds.length === 1;

  return (
    <div className='flex justify-between items-center p-2 bg-zinc-600 rounded-t-lg'>
      <Menubar className='bg-(--muted-background) w-full'>
        <MenubarMenu>
          <MenubarTrigger
            onClick={onAdd}
            className='cursor-pointer flex items-center gap-2'
          >
            <PlusCircle className='h-4 w-4' /> Add user
          </MenubarTrigger>
        </MenubarMenu>

        <MenubarMenu>
          <MenubarTrigger
            onClick={hasSelectedOnlyOne ? onEdit : undefined}
            disabled={!hasSelectedOnlyOne}
            className='cursor-pointer flex items-center gap-2 data-[disabled]:opacity-50'
          >
            <Edit className='h-4 w-4' /> Edit
          </MenubarTrigger>
        </MenubarMenu>

        <MenubarMenu>
          <MenubarTrigger
            onClick={hasSelection ? onSuspend : undefined}
            disabled={!hasSelection}
            className='cursor-pointer flex items-center gap-2 data-[disabled]:opacity-50'
          >
            <ShieldX className='h-4 w-4' /> Suspend
          </MenubarTrigger>
        </MenubarMenu>

        <MenubarMenu>
          <MenubarTrigger
            onClick={hasSelection ? onReset2FA : undefined}
            disabled={!hasSelection}
            className='cursor-pointer flex items-center gap-2 data-[disabled]:opacity-50'
          >
            <RotateCcw className='h-4 w-4' /> Reset 2FA
          </MenubarTrigger>
        </MenubarMenu>
      </Menubar>
    </div>
  );
}
