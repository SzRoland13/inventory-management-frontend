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
import {
  mapModificationUserToAddEditUserRequest,
  mapUserDtoToModificationUser,
} from '@/lib/utils/helpers';
import { UserDto } from '@/lib/services/dtos/userDtos';
import { UserService } from '@/lib/services/UserService';

type UsersTableProps = {
  data: UserDto[];
};

export function UsersTable({ data }: UsersTableProps) {
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
      setEditingUser(mapUserDtoToModificationUser(selectedUser));
      setDialogOpen(true);
    }
  };

  const handleSave = (user: ModificationUser) => {
    const userRequest = mapModificationUserToAddEditUserRequest(user);

    if (user.id) {
      UserService.updateUser(user.id, userRequest);
    } else {
      UserService.registerUser(userRequest);
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
