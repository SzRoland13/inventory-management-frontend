'use client';

import * as React from 'react';
import { useState } from 'react';
import { useReactTable, getCoreRowModel } from '@tanstack/react-table';
import { User } from '@/lib/utils/types';
import { userColumns } from '@/components/users/UsersColumns';
import { UsersToolbar } from '@/components/users/UsersToolbar';
import { EditUserDialog } from '@/components/users/EditUserDialog';
import { DataTable } from '@/components/users/UserDataTable';

export function UsersTable({ data }: { data: User[] }) {
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | undefined>();

  const table = useReactTable({
    data,
    columns: userColumns,
    getCoreRowModel: getCoreRowModel(),
    state: { rowSelection: {} },
    onRowSelectionChange: (updater) => {
      const selected = Object.keys(
        typeof updater === 'function' ? updater({}) : updater,
      );
      setSelectedIds(selected);
    },
  });

  const handleAdd = () => {
    setEditingUser(undefined);
    setDialogOpen(true);
  };

  const handleEdit = () => {
    const selectedUser = data.find((u) => u.id === selectedIds[0]);
    if (selectedUser) {
      setEditingUser(selectedUser);
      setDialogOpen(true);
    }
  };

  const handleSave = (updated: User) => {
    console.log('Save user', updated);
    setDialogOpen(false);
  };

  const handleSuspend = () => {
    console.log('Suspend users:', selectedIds);
  };

  const handleReset2FA = () => {
    console.log('Reset 2FA for users:', selectedIds);
  };

  return (
    <div className='w-full'>
      <UsersToolbar
        selectedIds={selectedIds}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onSuspend={handleSuspend}
        onReset2FA={handleReset2FA}
      />
      <DataTable table={table} />
      <EditUserDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        user={editingUser}
        onSave={handleSave}
      />
    </div>
  );
}
