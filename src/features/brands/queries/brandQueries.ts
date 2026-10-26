import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { requireSuccessfulResponse } from '@/features/shared/api/apiResponse';
import { queryKeys } from '@/features/shared/api/queryKeys';
import { BrandService } from '@/features/brands/services/BrandService';

export function useBrandsQuery(query = '', enabled = true) {
  return useQuery({
    queryKey: queryKeys.brands.list(query),
    queryFn: () => requireSuccessfulResponse(BrandService.search(query)),
    enabled,
    staleTime: 5 * 60_000,
  });
}

function useInvalidateBrands() {
  const queryClient = useQueryClient();
  return async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.brands.all }),
      queryClient.invalidateQueries({ queryKey: queryKeys.products.all }),
    ]);
  };
}

export function useCreateBrandMutation() {
  const invalidate = useInvalidateBrands();
  return useMutation({
    mutationFn: (request: Parameters<typeof BrandService.create>[0]) =>
      requireSuccessfulResponse(BrandService.create(request)),
    onSuccess: invalidate,
  });
}

export function useUpdateBrandMutation() {
  const invalidate = useInvalidateBrands();
  return useMutation({
    mutationFn: ({
      id,
      request,
    }: {
      id: number;
      request: Parameters<typeof BrandService.update>[1];
    }) => requireSuccessfulResponse(BrandService.update(id, request)),
    onSuccess: invalidate,
  });
}

export function useDeleteBrandMutation() {
  const invalidate = useInvalidateBrands();
  return useMutation({
    mutationFn: (id: number) =>
      requireSuccessfulResponse(BrandService.delete(id)),
    onSuccess: invalidate,
  });
}
