'use client';

import { Button } from '@/components/ui/button';
import {
  PlusCircle,
  Edit,
  ShieldX,
  RotateCcw,
  KeyRound,
  ShieldCheck,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { UserDto } from '@/lib/services/dtos/userDtos';
import { UserStatus } from '@/lib/utils/enums';

interface UsersToolbarProps {
  selectedIds: number[];
  selectedUser: UserDto | null | undefined;
  onAdd: () => void;
  onEdit: () => void;
  onSuspend: () => void;
  onActivate: () => void;
  onReset2FA: () => void;
  onResetPassword: () => void;
}

export function UsersToolbar({
  selectedIds,
  selectedUser,
  onAdd,
  onEdit,
  onSuspend,
  onActivate,
  onReset2FA,
  onResetPassword,
}: UsersToolbarProps) {
  const t = useTranslations();
  const hasSelectedOnlyOne = selectedIds.length === 1;

  const canReset2FA =
    hasSelectedOnlyOne && (selectedUser?.twoFaEnabled ?? false);
  const canActivate =
    hasSelectedOnlyOne && selectedUser?.userStatus === UserStatus.SUSPENDED;
  const canSuspend =
    hasSelectedOnlyOne && selectedUser?.userStatus === UserStatus.ACTIVE;

  return (
    <div className='flex flex-wrap gap-2 items-center p-2 bg-zinc-600 rounded-t-lg'>
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
        disabled={!canSuspend}
        onClick={onSuspend}
        className='flex items-center gap-2'
      >
        <ShieldX className='h-4 w-4' />
        {t('pages.users.toolbar.suspend')}
      </Button>

      <Button
        variant='ghost'
        disabled={!canActivate}
        onClick={onActivate}
        className='flex items-center gap-2'
      >
        <ShieldCheck className='h-4 w-4' />
        {t('pages.users.toolbar.activate')}
      </Button>

      <Button
        variant='ghost'
        disabled={!hasSelectedOnlyOne}
        onClick={onResetPassword}
        className='flex items-center gap-2'
      >
        <KeyRound className='h-4 w-4' />
        {t('pages.users.toolbar.reset-password')}
      </Button>

      <Button
        variant='ghost'
        disabled={!canReset2FA}
        onClick={onReset2FA}
        className='flex items-center gap-2'
      >
        <RotateCcw className='h-4 w-4' />
        {t('pages.users.toolbar.reset-2fa')}
      </Button>
    </div>
  );
}
