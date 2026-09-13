'use client';

import * as React from 'react';
import { useEffect, useMemo, useState } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  RowSelectionState,
} from '@tanstack/react-table';
import { ModificationUser } from '@/lib/services/dtos/userDtos';
import { useUserColumns } from '@/components/users/UsersColumns';
import { UsersToolbar } from '@/components/users/UsersToolbar';
import { AddEditUserDialog } from '@/components/users/AddEditUserDialog';
import { DataTable } from '@/components/common/DataTable';
import {
  mapModificationUserToAddEditUserRequest,
  mapUserDtoToModificationUser,
} from '@/lib/helpers/user';
import {
  useUsersQuery,
  useRegisterUserMutation,
  useUpdateUserMutation,
  useSetUserSuspendedMutation,
  useResetUserPasswordMutation,
  useResetUserTwoFaMutation,
} from '@/lib/queries/userQueries';
import { getApiErrorMessageKey } from '@/lib/queries/apiResponse';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { UserStatus } from '@/lib/enums/user';

export function UsersTable() {
  const t = useTranslations();
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<
    ModificationUser | undefined
  >();

  const usersQuery = useUsersQuery();
  const data = useMemo(
    () => usersQuery.data?.payload.users ?? [],
    [usersQuery.data],
  );

  useEffect(() => {
    if (usersQuery.error) {
      toast.error(t(`messagekey.${getApiErrorMessageKey(usersQuery.error)}`));
    }
  }, [usersQuery.error, t]);

  const registerUser = useRegisterUserMutation();
  const updateUser = useUpdateUserMutation();
  const setSuspended = useSetUserSuspendedMutation();
  const resetPassword = useResetUserPasswordMutation();
  const resetTwoFa = useResetUserTwoFaMutation();

  const table = useReactTable({
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
    const onError = (error: unknown) =>
      toast.error(t(`messagekey.${getApiErrorMessageKey(error)}`));

    if (user.id) {
      updateUser.mutate(
        { id: user.id, request: userRequest },
        {
          onSuccess: () => {
            toast.success(t('messagekey.user.update-success'));
            setRowSelection({});
            setDialogOpen(false);
          },
          onError,
        },
      );
    } else {
      registerUser.mutate(userRequest, {
        onSuccess: () => {
          toast.success(t('messagekey.user.registration-successful'));
          setRowSelection({});
          setDialogOpen(false);
        },
        onError,
      });
    }
  };

  const handleToggleSuspend = () => {
    if (selectedIds.length !== 1 || !selectedUser) return;

    const isSuspended = selectedUser.userStatus === UserStatus.SUSPENDED;

    setSuspended.mutate(
      { id: selectedIds[0], suspended: !isSuspended },
      {
        onSuccess: () => {
          toast.success(
            t(
              isSuspended
                ? 'messagekey.user.activated'
                : 'messagekey.user.suspended',
            ),
          );
          setRowSelection({});
        },
        onError: (error) =>
          toast.error(t(`messagekey.${getApiErrorMessageKey(error)}`)),
      },
    );
  };

  const handleResetPassword = () => {
    if (selectedIds.length !== 1) return;

    resetPassword.mutate(selectedIds[0], {
      onSuccess: () => {
        toast.success(t('messagekey.user.password-reset-complete'));
        setRowSelection({});
      },
      onError: (error) =>
        toast.error(t(`messagekey.${getApiErrorMessageKey(error)}`)),
    });
  };

  const handleReset2FA = () => {
    if (selectedIds.length !== 1) return;

    resetTwoFa.mutate(selectedIds[0], {
      onSuccess: () => {
        toast.success(t('messagekey.user.two-fa-setup-reset-complete'));
        setRowSelection({});
      },
      onError: (error) =>
        toast.error(t(`messagekey.${getApiErrorMessageKey(error)}`)),
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
