import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { UserService } from '@/lib/services/UserService';
import { requireSuccessfulResponse } from '@/lib/queries/apiResponse';
import { queryKeys } from '@/lib/queries/queryKeys';

export function useUsersQuery() {
  return useQuery({
    queryKey: queryKeys.users.all,
    queryFn: () => requireSuccessfulResponse(UserService.getAllUsers()),
  });
}

function useInvalidateUsers() {
  const queryClient = useQueryClient();

  return () => queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
}

export function useRegisterUserMutation() {
  const invalidateUsers = useInvalidateUsers();

  return useMutation({
    mutationFn: (request: Parameters<typeof UserService.registerUser>[0]) =>
      requireSuccessfulResponse(UserService.registerUser(request)),
    onSuccess: invalidateUsers,
  });
}

export function useUpdateUserMutation() {
  const invalidateUsers = useInvalidateUsers();

  return useMutation({
    mutationFn: ({
      id,
      request,
    }: {
      id: number;
      request: Parameters<typeof UserService.updateUser>[1];
    }) => requireSuccessfulResponse(UserService.updateUser(id, request)),
    onSuccess: invalidateUsers,
  });
}

export function useSetUserSuspendedMutation() {
  const invalidateUsers = useInvalidateUsers();

  return useMutation({
    mutationFn: ({
      id,
      suspended,
    }: {
      id: number;
      suspended: boolean;
    }) =>
      requireSuccessfulResponse(
        suspended
          ? UserService.suspendUser(id)
          : UserService.activateUser(id),
      ),
    onSuccess: invalidateUsers,
  });
}

export function useResetUserPasswordMutation() {
  const invalidateUsers = useInvalidateUsers();

  return useMutation({
    mutationFn: (id: number) =>
      requireSuccessfulResponse(UserService.resetPassword(id)),
    onSuccess: invalidateUsers,
  });
}

export function useResetUserTwoFaMutation() {
  const invalidateUsers = useInvalidateUsers();

  return useMutation({
    mutationFn: (id: number) =>
      requireSuccessfulResponse(UserService.reset2fa(id)),
    onSuccess: invalidateUsers,
  });
}

export function useUpdateUserAvatarMutation() {
  return useMutation({
    mutationFn: ({
      id,
      request,
    }: {
      id: number;
      request: Parameters<typeof UserService.uploadUserAvatar>[1];
    }) => requireSuccessfulResponse(UserService.uploadUserAvatar(id, request)),
  });
}
