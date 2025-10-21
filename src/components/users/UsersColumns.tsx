/* eslint-disable indent */
'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { User } from '@/lib/utils/types';
import { USER_STATUS } from '@/lib/utils/enums';

export const userColumns: ColumnDef<User>[] = [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected()}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label='Select all'
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label='Select row'
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  { accessorKey: 'id', header: 'ID' },
  { accessorKey: 'username', header: 'Username' },
  { accessorKey: 'email', header: 'Email' },
  { accessorKey: 'role', header: 'Role' },
  {
    accessorKey: 'is2FaEnabled',
    header: '2FA Enabled',
    cell: ({ row }) =>
      row.original.is2FaEnabled ? (
        <Badge variant='default'>Enabled</Badge>
      ) : (
        <Badge variant='secondary'>Disabled</Badge>
      ),
  },
  {
    accessorKey: 'isOtcSetupCompleted',
    header: 'OTC Completed',
    cell: ({ row }) =>
      row.original.isOtcSetupCompleted ? (
        <Badge variant='default'>Completed</Badge>
      ) : (
        <Badge variant='secondary'>Not completed</Badge>
      ),
  },
  {
    accessorKey: 'userStatus',
    header: 'Status',
    cell: ({ row }) => {
      const status = row.original.userStatus;
      return (
        <Badge
          variant={
            status === USER_STATUS.ACTIVE
              ? 'default'
              : status === USER_STATUS.SUSPENDED
              ? 'destructive'
              : 'secondary'
          }
        >
          {status}
        </Badge>
      );
    },
  },
];
