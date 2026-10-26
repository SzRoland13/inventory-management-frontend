'use client';

import { Button } from '@/features/shared/components/ui/button';
import {
  PlusCircle,
  Edit,
  ShieldX,
  RotateCcw,
  KeyRound,
  ShieldCheck,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { UserDto } from '@/features/users/types/userDtos';
import { UserStatus } from '@/features/users/types/user';

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
  const canResetPassword =
    hasSelection && (selectedUser?.otcSetupCompleted ?? false);
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
    <div className='flex flex-wrap items-center gap-2 border-b border-zinc-700 bg-zinc-800 p-3'>
      <Button onClick={onAdd} className='gap-2'>
        <PlusCircle className='h-4 w-4' />
        {t('pages.users.toolbar.add')}
      </Button>

      <Button
        variant='outline'
        disabled={!hasSelection}
        onClick={onEdit}
        className='gap-2 border-zinc-600 bg-zinc-800 text-zinc-100 hover:bg-zinc-700 hover:text-white disabled:border-zinc-700 disabled:bg-zinc-800 disabled:text-zinc-500 disabled:opacity-100'
      >
        <Edit className='h-4 w-4' />
        {t('pages.users.toolbar.edit')}
      </Button>

      <Button
        variant='outline'
        disabled={!canResetPassword}
        onClick={onResetPassword}
        className='gap-2 border-zinc-600 bg-zinc-800 text-zinc-100 hover:bg-zinc-700 hover:text-white disabled:border-zinc-700 disabled:bg-zinc-800 disabled:text-zinc-500 disabled:opacity-100'
      >
        <KeyRound className='h-4 w-4' />
        {t('pages.users.toolbar.reset-password')}
      </Button>

      <Button
        variant='outline'
        disabled={!canReset2FA}
        onClick={onReset2FA}
        className='gap-2 border-zinc-600 bg-zinc-800 text-zinc-100 hover:bg-zinc-700 hover:text-white disabled:border-zinc-700 disabled:bg-zinc-800 disabled:text-zinc-500 disabled:opacity-100'
      >
        <RotateCcw className='h-4 w-4' />
        {t('pages.users.toolbar.reset-2fa')}
      </Button>

      <Button
        variant='outline'
        disabled={!canToggleSuspend}
        onClick={onToggleSuspend}
        className='gap-2 border-zinc-600 bg-zinc-800 text-zinc-100 hover:bg-zinc-700 hover:text-white disabled:border-zinc-700 disabled:bg-zinc-800 disabled:text-zinc-500 disabled:opacity-100'
      >
        {suspendButtonIcon}
        {suspendButtonText}
      </Button>
    </div>
  );
}
