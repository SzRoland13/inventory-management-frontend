import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CompanyService } from '@/lib/services/CompanyService';
import { CurrencyService } from '@/lib/services/CurrencyService';
import { requireSuccessfulResponse } from '@/lib/queries/apiResponse';
import { queryKeys } from '@/lib/queries/queryKeys';

export function useMinimalCompanyQuery(enabled = true) {
  return useQuery({
    queryKey: queryKeys.company.minimal,
    queryFn: () =>
      requireSuccessfulResponse(CompanyService.getMinimalCompanyData()),
    enabled,
  });
}

export function useExtendedCompanyQuery() {
  return useQuery({
    queryKey: queryKeys.company.extended,
    queryFn: () =>
      requireSuccessfulResponse(CompanyService.getExtendedCompanyData()),
  });
}

function useInvalidateCompany() {
  const queryClient = useQueryClient();

  return () =>
    queryClient.invalidateQueries({ queryKey: queryKeys.company.all });
}

export function useUpdateCompanyBaseDataMutation() {
  const invalidateCompany = useInvalidateCompany();

  return useMutation({
    mutationFn: (
      request: Parameters<typeof CompanyService.updateCompanyBaseData>[0],
    ) =>
      requireSuccessfulResponse(CompanyService.updateCompanyBaseData(request)),
    onSuccess: invalidateCompany,
  });
}

export function useUpdateCompanyBillingDataMutation() {
  const invalidateCompany = useInvalidateCompany();

  return useMutation({
    mutationFn: (
      request: Parameters<typeof CompanyService.updateCompanyBillingData>[0],
    ) =>
      requireSuccessfulResponse(
        CompanyService.updateCompanyBillingData(request),
      ),
    onSuccess: invalidateCompany,
  });
}

export function useUpdateCompanyLogoMutation() {
  const invalidateCompany = useInvalidateCompany();

  return useMutation({
    mutationFn: (request: Parameters<typeof CompanyService.updateLogo>[0]) =>
      requireSuccessfulResponse(CompanyService.updateLogo(request)),
    onSuccess: invalidateCompany,
  });
}

export function useUpdatePreferredCurrencyMutation() {
  const invalidateCompany = useInvalidateCompany();

  return useMutation({
    mutationFn: (
      request: Parameters<typeof CompanyService.updatePreferredCurrency>[0],
    ) =>
      requireSuccessfulResponse(
        CompanyService.updatePreferredCurrency(request),
      ),
    onSuccess: invalidateCompany,
  });
}

export function useCurrenciesQuery() {
  return useQuery({
    queryKey: queryKeys.currencies.all,
    queryFn: () => requireSuccessfulResponse(CurrencyService.getAll()),
    staleTime: 5 * 60_000,
  });
}
