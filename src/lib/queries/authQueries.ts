import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { AuthService } from '@/lib/services/AuthService';
import { requireSuccessfulResponse } from '@/lib/queries/apiResponse';
import { queryKeys } from '@/lib/queries/queryKeys';

export function useSessionQuery() {
  return useQuery({
    queryKey: queryKeys.auth.session,
    queryFn: () => requireSuccessfulResponse(AuthService.checkSession()),
    staleTime: 60_000,
  });
}

export function useCheckFirstLoginMutation() {
  return useMutation({
    mutationFn: (
      request: Parameters<typeof AuthService.checkIfFirstLogin>[0],
    ) => requireSuccessfulResponse(AuthService.checkIfFirstLogin(request)),
  });
}

export function useRequestOneTimeCodeMutation() {
  return useMutation({
    mutationFn: (
      request: Parameters<typeof AuthService.requestOneTimeCode>[0],
    ) => requireSuccessfulResponse(AuthService.requestOneTimeCode(request)),
  });
}

export function useValidateOneTimeCodeMutation() {
  return useMutation({
    mutationFn: (
      request: Parameters<typeof AuthService.validateOneTimeCode>[0],
    ) => requireSuccessfulResponse(AuthService.validateOneTimeCode(request)),
  });
}

export function useSetupNewPasswordMutation() {
  return useMutation({
    mutationFn: (
      request: Parameters<typeof AuthService.setupNewPassword>[0],
    ) => requireSuccessfulResponse(AuthService.setupNewPassword(request)),
  });
}

export function useLoginMutation() {
  return useMutation({
    mutationFn: (request: Parameters<typeof AuthService.login>[0]) =>
      requireSuccessfulResponse(AuthService.login(request)),
  });
}

export function useTwoFaSetupMutation() {
  return useMutation({
    mutationFn: (request: Parameters<typeof AuthService.twoFaSetup>[0]) =>
      requireSuccessfulResponse(AuthService.twoFaSetup(request)),
  });
}

export function useTwoFaLoginMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: Parameters<typeof AuthService.twoFaLogin>[0]) =>
      requireSuccessfulResponse(AuthService.twoFaLogin(request)),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.auth.session,
      });
    },
  });
}

export function useLogoutMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => requireSuccessfulResponse(AuthService.logout()),
    onSuccess: () => {
      queryClient.clear();
    },
  });
}
