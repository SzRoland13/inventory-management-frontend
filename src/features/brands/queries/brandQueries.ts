import { useQuery } from '@tanstack/react-query';
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
