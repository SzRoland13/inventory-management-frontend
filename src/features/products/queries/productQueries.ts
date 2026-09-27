import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { requireSuccessfulResponse } from '@/features/shared/api/apiResponse';
import { queryKeys } from '@/features/shared/api/queryKeys';
import { UnitsService } from '@/features/units/services/UnitsService';
import { CategoriesService } from '@/features/categories/services/CategoriesService';
import { AttributesService } from '@/features/attributes/services/AttributesService';
import { ProductService } from '@/features/products/services/ProductService';
import type {
  ProductCategory,
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
    queryKey: id
      ? queryKeys.products.detail(id)
      : [...queryKeys.products.all, 'detail', null],
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

function useInvalidateUnits() {
  const queryClient = useQueryClient();
  return async () => {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: queryKeys.products.lookups.units,
      }),
      queryClient.invalidateQueries({ queryKey: queryKeys.products.all }),
    ]);
  };
}

export function useCreateUnitMutation() {
  const invalidate = useInvalidateUnits();
  return useMutation({
    mutationFn: (request: Parameters<typeof UnitsService.create>[0]) =>
      requireSuccessfulResponse(UnitsService.create(request)),
    onSuccess: invalidate,
  });
}

export function useUpdateUnitMutation() {
  const invalidate = useInvalidateUnits();
  return useMutation({
    mutationFn: ({
      id,
      request,
    }: {
      id: number;
      request: Parameters<typeof UnitsService.update>[1];
    }) => requireSuccessfulResponse(UnitsService.update(id, request)),
    onSuccess: invalidate,
  });
}

export function useDeleteUnitMutation() {
  const invalidate = useInvalidateUnits();
  return useMutation({
    mutationFn: (id: number) =>
      requireSuccessfulResponse(UnitsService.delete(id)),
    onSuccess: invalidate,
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
    queryFn: () => requireSuccessfulResponse(AttributesService.list()),
    staleTime: 5 * 60_000,
  });
}

function useInvalidateProductCatalog() {
  const queryClient = useQueryClient();
  return async () => {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: queryKeys.products.lookups.categories,
      }),
      queryClient.invalidateQueries({
        queryKey: queryKeys.products.lookups.attributes,
      }),
      queryClient.invalidateQueries({ queryKey: queryKeys.products.all }),
    ]);
  };
}

export function useCreateCategoryMutation() {
  const invalidate = useInvalidateProductCatalog();
  return useMutation({
    mutationFn: (request: Parameters<typeof CategoriesService.create>[0]) =>
      requireSuccessfulResponse(CategoriesService.create(request)),
    onSuccess: invalidate,
  });
}

export function useUpdateCategoryMutation() {
  const invalidate = useInvalidateProductCatalog();
  return useMutation({
    mutationFn: ({
      id,
      request,
    }: {
      id: number;
      request: Parameters<typeof CategoriesService.update>[1];
    }) => requireSuccessfulResponse(CategoriesService.update(id, request)),
    onSuccess: invalidate,
  });
}

export function useDeleteCategoryMutation() {
  const invalidate = useInvalidateProductCatalog();
  return useMutation({
    mutationFn: (id: number) =>
      requireSuccessfulResponse(CategoriesService.delete(id)),
    onSuccess: invalidate,
  });
}

export function useReorderCategoriesMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (orderedCategories: ProductCategory[]) =>
      requireSuccessfulResponse(
        CategoriesService.reorder(
          orderedCategories.map((category) => category.id),
        ),
      ),
    onSettled: () =>
      queryClient.invalidateQueries({
        queryKey: queryKeys.products.lookups.categories,
      }),
  });
}

export function useCreateAttributeMutation() {
  const invalidate = useInvalidateProductCatalog();
  return useMutation({
    mutationFn: (request: Parameters<typeof AttributesService.create>[0]) =>
      requireSuccessfulResponse(AttributesService.create(request)),
    onSuccess: invalidate,
  });
}

export function useUpdateAttributeMutation() {
  const invalidate = useInvalidateProductCatalog();
  return useMutation({
    mutationFn: ({
      id,
      request,
    }: {
      id: number;
      request: Parameters<typeof AttributesService.update>[1];
    }) => requireSuccessfulResponse(AttributesService.update(id, request)),
    onSuccess: invalidate,
  });
}

export function useDeleteAttributeMutation() {
  const invalidate = useInvalidateProductCatalog();
  return useMutation({
    mutationFn: (id: number) =>
      requireSuccessfulResponse(AttributesService.delete(id)),
    onSuccess: invalidate,
  });
}

export function useCreateAttributeOptionMutation() {
  const invalidate = useInvalidateProductCatalog();
  return useMutation({
    mutationFn: ({
      definitionId,
      request,
    }: {
      definitionId: number;
      request: Parameters<typeof AttributesService.createOption>[1];
    }) =>
      requireSuccessfulResponse(
        AttributesService.createOption(definitionId, request),
      ),
    onSuccess: invalidate,
  });
}

export function useUpdateAttributeOptionMutation() {
  const invalidate = useInvalidateProductCatalog();
  return useMutation({
    mutationFn: ({
      definitionId,
      optionId,
      request,
    }: {
      definitionId: number;
      optionId: number;
      request: Parameters<typeof AttributesService.updateOption>[2];
    }) =>
      requireSuccessfulResponse(
        AttributesService.updateOption(definitionId, optionId, request),
      ),
    onSuccess: invalidate,
  });
}

export function useDeleteAttributeOptionMutation() {
  const invalidate = useInvalidateProductCatalog();
  return useMutation({
    mutationFn: ({
      definitionId,
      optionId,
    }: {
      definitionId: number;
      optionId: number;
    }) =>
      requireSuccessfulResponse(
        AttributesService.deleteOption(definitionId, optionId),
      ),
    onSuccess: invalidate,
  });
}

function useInvalidateProducts() {
  const queryClient = useQueryClient();

  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.products.lists() }),
      queryClient.invalidateQueries({
        queryKey: queryKeys.products.archivedLists(),
      }),
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
        queryClient.invalidateQueries({
          queryKey: queryKeys.products.detail(id),
        }),
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

export function useArchivedProductsQuery(
  params: ProductListRequest,
  enabled = true,
) {
  return useQuery({
    queryKey: queryKeys.products.archivedList(params),
    queryFn: () =>
      requireSuccessfulResponse(ProductService.listArchived(params)),
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
