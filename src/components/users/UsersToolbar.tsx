'use client';

import { Button } from '@/components/ui/button';
import { PlusCircle, Edit, ShieldX, RotateCcw } from 'lucide-react';
import { useTranslations } from 'next-intl';

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
  const t = useTranslations();
  const hasSelection = selectedIds.length > 0;
  const hasSelectedOnlyOne = selectedIds.length === 1;

  return (
    <div className='flex gap-2 items-center p-2 bg-zinc-600 rounded-t-lg'>
      <Button
        variant='ghost'
        onClick={onAdd}
        className='flex items-center gap-2'
      >
        <PlusCircle className='h-4 w-4' />
        {t('pages.users.toolbar.add')}
      </Button>

      <Button
        variant='ghost'
        disabled={!hasSelectedOnlyOne}
        onClick={onEdit}
        className='flex items-center gap-2'
      >
        <Edit className='h-4 w-4' />
        {t('pages.users.toolbar.edit')}
      </Button>

      <Button
        variant='ghost'
        disabled={!hasSelection}
        onClick={onSuspend}
        className='flex items-center gap-2'
      >
        <ShieldX className='h-4 w-4' />
        {t('pages.users.toolbar.suspend')}
      </Button>

      <Button
        variant='ghost'
        disabled={!hasSelection}
        onClick={onReset2FA}
        className='flex items-center gap-2'
      >
        <RotateCcw className='h-4 w-4' />
        {t('pages.users.toolbar.reset')}
      </Button>
    </div>
  );
}
