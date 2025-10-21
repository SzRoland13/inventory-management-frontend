/* eslint-disable indent */
'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { User } from '@/lib/utils/types';
import { ACCOUNT_STATUS } from '@/lib/utils/enums';
import { useTranslations } from 'next-intl';

export const useUserColumns = (): ColumnDef<User>[] => {
  const t = useTranslations();

  return [
    {
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label={t('common.select-all')}
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label={t('common.select-row')}
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    { accessorKey: 'id', header: t('common.id') },
    { accessorKey: 'username', header: t('common.username.title') },
    { accessorKey: 'email', header: t('common.email.title') },
    { accessorKey: 'role', header: t('common.role.title') },
    {
      accessorKey: 'twoFaStatus',
      header: t('common.two-fa-status.title'),
      cell: ({ row }) =>
        row.original.twoFaStatus ? (
          <Badge variant='default'>{t('common.two-fa-status.enabled')}</Badge>
        ) : (
          <Badge variant='secondary'>
            {t('common.two-fa-status.disabled')}
          </Badge>
        ),
    },
    {
      accessorKey: 'firstLoginStatus',
      header: t('common.first-login-status.title'),
      cell: ({ row }) =>
        row.original.firstLoginStatus ? (
          <Badge variant='default'>
            {t('common.first-login-status.completed')}
          </Badge>
        ) : (
          <Badge variant='secondary'>
            {t('common.first-login-status.not-completed')}
          </Badge>
        ),
    },
    {
      accessorKey: 'accountStatus',
      header: t('common.account-status.title'),
      cell: ({ row }) => {
        const status = row.original.accountStatus;
        const variant =
          status === ACCOUNT_STATUS.ACTIVE
            ? 'default'
            : status === ACCOUNT_STATUS.SUSPENDED
            ? 'destructive'
            : 'secondary';
        return (
          <Badge variant={variant}>
            {t(`common.account-status.${status}`)}
          </Badge>
        );
      },
    },
  ];
};
