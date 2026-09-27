import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { requireSuccessfulResponse } from '@/features/shared/api/apiResponse';
import { queryKeys } from '@/features/shared/api/queryKeys';
import { UnitsService } from '@/features/units/services/UnitsService';
import { CategoriesService } from '@/features/categories/services/CategoriesService';
import { AttributesService } from '@/features/attributes/services/AttributesService';
import { ProductService } from '@/features/products/services/ProductService';
import type {
  ProductListRequest,
  ProductRequest,
} from '@/features/products/types/product';

export function useProductsQuery(params: ProductListRequest) {
  return useQuery({
    queryKey: queryKeys.products.list(params),
    queryFn: () => requireSuccessfulResponse(ProductService.list(params)),
    placeholderData: (previous) => previous,
  });
}

export function useProductQuery(id: number | null, enabled = true) {
  return useQuery({
    queryKey: id ? queryKeys.products.detail(id) : [...queryKeys.products.all, 'detail', null],
    queryFn: () => requireSuccessfulResponse(ProductService.get(id!)),
    enabled: enabled && id !== null,
  });
}

export function useProductUnitsQuery() {
  return useQuery({
    queryKey: queryKeys.products.lookups.units,
    queryFn: () => requireSuccessfulResponse(UnitsService.list()),
    staleTime: 5 * 60_000,
  });
}

export function useProductCategoriesQuery() {
  return useQuery({
    queryKey: queryKeys.products.lookups.categories,
    queryFn: () => requireSuccessfulResponse(CategoriesService.list()),
    staleTime: 5 * 60_000,
  });
}

export function useProductAttributeDefinitionsQuery() {
  return useQuery({
    queryKey: queryKeys.products.lookups.attributes,
    queryFn: () =>
      requireSuccessfulResponse(AttributesService.list()),
    staleTime: 5 * 60_000,
  });
}

function useInvalidateProducts() {
  const queryClient = useQueryClient();

  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.products.lists() }),
      queryClient.invalidateQueries({ queryKey: queryKeys.products.archivedLists() }),
    ]);
}

export function useCreateProductMutation() {
  const invalidateProducts = useInvalidateProducts();

  return useMutation({
    mutationFn: (request: ProductRequest) =>
      requireSuccessfulResponse(ProductService.create(request)),
    onSuccess: invalidateProducts,
  });
}

export function useUpdateProductMutation() {
  const queryClient = useQueryClient();
  const invalidateProducts = useInvalidateProducts();

  return useMutation({
    mutationFn: ({ id, request }: { id: number; request: ProductRequest }) =>
      requireSuccessfulResponse(ProductService.update(id, request)),
    onSuccess: async (_response, { id }) => {
      await Promise.all([
        invalidateProducts(),
        queryClient.invalidateQueries({ queryKey: queryKeys.products.detail(id) }),
      ]);
    },
  });
}

export function useArchiveProductMutation() {
  const invalidateProducts = useInvalidateProducts();

  return useMutation({
    mutationFn: (id: number) =>
      requireSuccessfulResponse(ProductService.archive(id)),
    onSuccess: invalidateProducts,
  });
}

export function useArchivedProductsQuery(params: ProductListRequest, enabled = true) {
  return useQuery({
    queryKey: queryKeys.products.archivedList(params),
    queryFn: () => requireSuccessfulResponse(ProductService.listArchived(params)),
    enabled,
  });
}

export function useRestoreProductMutation() {
  const invalidateProducts = useInvalidateProducts();

  return useMutation({
    mutationFn: (id: number) =>
      requireSuccessfulResponse(ProductService.restore(id)),
    onSuccess: invalidateProducts,
  });
}
