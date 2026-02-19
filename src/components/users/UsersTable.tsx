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
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { ApiResponse } from '@/lib/services/dtos/genericDtos';

type UsersTableProps = {
  data: UserDto[];
  onSave: () => void;
};

export function UsersTable({ data, onSave }: UsersTableProps) {
  const t = useTranslations();
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
    enableMultiRowSelection: false, // Only allow single selection
  });

  const selectedIds = React.useMemo(
    () =>
      Object.keys(rowSelection)
        .map((id) => Number(table.getRow(id)?.original.id))
        .filter((v) => !isNaN(v)),
    [rowSelection, table],
  );

  const selectedUser = React.useMemo(
    () =>
      selectedIds.length === 1
        ? data.find((u) => u.id === selectedIds[0])
        : null,
    [selectedIds, data],
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
    onSave();
  };

  const handleToggleSuspend = () => {
    if (selectedIds.length !== 1 || !selectedUser) return;

    const isSuspended = selectedUser.userStatus === 'SUSPENDED';
    const action = isSuspended
      ? UserService.activateUser(selectedIds[0])
      : UserService.suspendUser(selectedIds[0]);
    const successMessage = isSuspended
      ? 'messages.user-activated'
      : 'messages.user-suspended';

    action
      .then(() => {
        toast.success(t(successMessage));
        setRowSelection({});
        onSave();
      })
      .catch((error: ApiResponse<void>) => {
        toast.error(t(`messagekey.${error.messageKey}`));
      });
  };

  const handleResetPassword = () => {
    if (selectedIds.length !== 1) return;

    UserService.resetPassword(selectedIds[0])
      .then(() => {
        toast.success(t('messages.password-reset'));
        setRowSelection({});
        onSave();
      })
      .catch((error: ApiResponse<void>) => {
        toast.error(t(`messagekey.${error.messageKey}`));
      });
  };

  const handleReset2FA = () => {
    if (selectedIds.length !== 1) return;

    UserService.reset2fa(selectedIds[0])
      .then(() => {
        toast.success(t('messages.2fa-reset'));
        setRowSelection({});
        onSave();
      })
      .catch((error: ApiResponse<void>) => {
        toast.error(t(`messagekey.${error.messageKey}`));
      });
  };

  return (
    <div className='flex flex-col w-full rounded-lg bg-zinc-900'>
      <UsersToolbar
        selectedUser={selectedUser}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onToggleSuspend={handleToggleSuspend}
        onReset2FA={handleReset2FA}
        onResetPassword={handleResetPassword}
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
