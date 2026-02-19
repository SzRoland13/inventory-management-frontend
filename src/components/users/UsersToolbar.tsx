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
  selectedUser: UserDto | null | undefined;
  onAdd: () => void;
  onEdit: () => void;
  onToggleSuspend: () => void;
  onReset2FA: () => void;
  onResetPassword: () => void;
}

export function UsersToolbar({
  selectedUser,
  onAdd,
  onEdit,
  onToggleSuspend,
  onReset2FA,
  onResetPassword,
}: UsersToolbarProps) {
  const t = useTranslations();
  const hasSelection = !!selectedUser;

  const canReset2FA = hasSelection && (selectedUser?.twoFaEnabled ?? false);
  const isSuspended = selectedUser?.userStatus === UserStatus.SUSPENDED;

  const canToggleSuspend = hasSelection;

  // Determine button state for suspend/activate
  const suspendButtonIcon = !hasSelection ? (
    <ShieldX className='h-4 w-4' />
  ) : isSuspended ? (
    <ShieldCheck className='h-4 w-4' />
  ) : (
    <ShieldX className='h-4 w-4' />
  );

  const suspendButtonText = !hasSelection
    ? t('pages.users.toolbar.suspend-activate')
    : isSuspended
      ? t('pages.users.toolbar.activate')
      : t('pages.users.toolbar.suspend');

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
        disabled={!hasSelection}
        onClick={onEdit}
        className='flex items-center gap-2'
      >
        <Edit className='h-4 w-4' />
        {t('pages.users.toolbar.edit')}
      </Button>

      <Button
        variant='ghost'
        disabled={!hasSelection}
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

      <Button
        variant='ghost'
        disabled={!canToggleSuspend}
        onClick={onToggleSuspend}
        className='flex items-center gap-2'
      >
        {suspendButtonIcon}
        {suspendButtonText}
      </Button>
    </div>
  );
}
