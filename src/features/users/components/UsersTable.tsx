'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  RowSelectionState,
} from '@tanstack/react-table';
import { ModificationUser } from '@/features/users/types/userDtos';
import { useUsersColumns } from '@/features/users/hooks/useUsersColumns';
import { UsersToolbar } from '@/features/users/components/UsersToolbar';
import { AddEditUserDialog } from '@/features/users/components/AddEditUserDialog';
import { DataTable } from '@/features/shared/table/DataTable';
import {
  mapModificationUserToAddEditUserRequest,
  mapUserDtoToModificationUser,
} from '@/features/users/helpers/user';
import {
  useUsersQuery,
  useRegisterUserMutation,
  useUpdateUserMutation,
  useSetUserSuspendedMutation,
  useResetUserPasswordMutation,
  useResetUserTwoFaMutation,
} from '@/features/users/queries/userQueries';
import { toastApiError } from '@/features/shared/api/apiResponse';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { UserStatus } from '@/features/users/types/user';

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
      toastApiError(t, usersQuery.error);
    }
  }, [usersQuery.error, t]);

  const registerUser = useRegisterUserMutation();
  const updateUser = useUpdateUserMutation();
  const setSuspended = useSetUserSuspendedMutation();
  const resetPassword = useResetUserPasswordMutation();
  const resetTwoFa = useResetUserTwoFaMutation();

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data,
    columns: useUsersColumns(),
    getRowId: (row) => String(row.id),
    getCoreRowModel: getCoreRowModel(),
    state: { rowSelection },
    onRowSelectionChange: setRowSelection,
    enableMultiRowSelection: false, // Only allow single selection
  });

  const selectedIds = useMemo(
    () =>
      Object.keys(rowSelection)
        .filter((id) => rowSelection[id])
        .map(Number),
    [rowSelection],
  );

  const selectedUser = useMemo(
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

  const handleSave = async (user: ModificationUser) => {
    const userRequest = mapModificationUserToAddEditUserRequest(user);
    try {
      if (user.id) {
        await updateUser.mutateAsync({ id: user.id, request: userRequest });
        toast.success(t('messagekey.user.update-success'));
      } else {
        await registerUser.mutateAsync(userRequest);
        toast.success(t('messagekey.user.registration-successful'));
      }
      setRowSelection({});
      setDialogOpen(false);
    } catch (error) {
      toastApiError(t, error);
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
        onError: (error) => toastApiError(t, error),
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
      onError: (error) => toastApiError(t, error),
    });
  };

  const handleReset2FA = () => {
    if (selectedIds.length !== 1) return;

    resetTwoFa.mutate(selectedIds[0], {
      onSuccess: () => {
        toast.success(t('messagekey.user.two-fa-setup-reset-complete'));
        setRowSelection({});
      },
      onError: (error) => toastApiError(t, error),
    });
  };

  return (
    <section className='m-3 overflow-hidden rounded-lg border bg-zinc-900'>
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
        saving={registerUser.isPending || updateUser.isPending}
        onSave={handleSave}
      />
    </section>
  );
}
