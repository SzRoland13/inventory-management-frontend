'use client';

import * as React from 'react';
import { useState } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  RowSelectionState,
} from '@tanstack/react-table';
import { ModificationUser } from '@/lib/utils/types';
import { useUserColumns } from '@/components/users/UsersColumns';
import { UsersToolbar } from '@/components/users/UsersToolbar';
import { AddEditUserDialog } from '@/components/users/AddEditUserDialog';
import { DataTable } from '@/components/common/DataTable';
import { mapUserToModificationUser } from '@/lib/utils/helpers';
import { UserDto } from '@/lib/services/dtos/userDtos';

export function UsersTable({ data }: { data: UserDto[] }) {
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<
    ModificationUser | undefined
  >();

  const table = useReactTable<UserDto>({
    data,
    columns: useUserColumns(),
    getCoreRowModel: getCoreRowModel(),
    state: { rowSelection },
    onRowSelectionChange: setRowSelection,
  });

  const selectedIds = React.useMemo(
    () =>
      Object.keys(rowSelection)
        .map((id) => Number(table.getRow(id)?.original.id))
        .filter((v) => !isNaN(v)),
    [rowSelection, table],
  );

  const handleAdd = () => {
    setEditingUser(undefined);
    setDialogOpen(true);
  };

  const handleEdit = () => {
    const selectedUser = data.find((u) => u.id === selectedIds[0]);
    if (selectedUser) {
      setEditingUser(mapUserToModificationUser(selectedUser));
      setDialogOpen(true);
    }
  };

  const handleSave = (user: ModificationUser) => {
    if (user.id) {
      console.log('updating user: ', user);
    } else {
      console.log('saving new user: ', user);
    }

    setRowSelection({});
    setDialogOpen(false);
  };

  const handleSuspend = () => {
    console.log('Suspend users:', selectedIds);
  };

  const handleActivate = () => {
    console.log('Activate users:', selectedIds);
  };

  const handleReset2FA = () => {
    console.log('Reset 2FA for users:', selectedIds);
  };

  return (
    <div className='flex flex-col w-full rounded-lg bg-zinc-900'>
      <UsersToolbar
        selectedIds={selectedIds}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onSuspend={handleSuspend}
        onActivate={handleActivate}
        onReset2FA={handleReset2FA}
      />
      <div className='flex w-full bg-zinc-900'>
        <DataTable table={table} />
      </div>
      <AddEditUserDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        user={editingUser}
        onSave={handleSave}
      />
    </div>
  );
}
