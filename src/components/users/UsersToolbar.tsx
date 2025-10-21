'use client';

import {
  Menubar,
  MenubarMenu,
  MenubarTrigger,
  MenubarContent,
  MenubarItem,
} from '@/components/ui/menubar';
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

  return (
    <div className='flex justify-between items-center p-2 border-b bg-background'>
      <Menubar>
        <MenubarMenu>
          <MenubarTrigger>Actions</MenubarTrigger>
          <MenubarContent>
            <MenubarItem onClick={onAdd}>
              <PlusCircle className='mr-2 h-4 w-4' /> Add user
            </MenubarItem>
            <MenubarItem disabled={!hasSelection} onClick={onEdit}>
              <Edit className='mr-2 h-4 w-4' /> Edit
            </MenubarItem>
            <MenubarItem disabled={!hasSelection} onClick={onSuspend}>
              <ShieldX className='mr-2 h-4 w-4' /> Suspend
            </MenubarItem>
            <MenubarItem disabled={!hasSelection} onClick={onReset2FA}>
              <RotateCcw className='mr-2 h-4 w-4' /> Reset 2FA
            </MenubarItem>
          </MenubarContent>
        </MenubarMenu>
      </Menubar>
    </div>
  );
}
