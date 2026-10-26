import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { requireSuccessfulResponse } from '@/features/shared/api/apiResponse';
import { queryKeys } from '@/features/shared/api/queryKeys';
import { WarehouseService } from '@/features/warehouses/services/WarehouseService';
import type { WarehouseRequest } from '@/features/warehouses/types/warehouse';

export function useWarehousesQuery() {
  return useQuery({
    queryKey: queryKeys.warehouses.all,
    queryFn: () => requireSuccessfulResponse(WarehouseService.list()),
  });
}

function useInvalidateWarehouses() {
  const queryClient = useQueryClient();
  return () =>
    queryClient.invalidateQueries({ queryKey: queryKeys.warehouses.all });
}

export function useCreateWarehouseMutation() {
  const invalidate = useInvalidateWarehouses();
  return useMutation({
    mutationFn: (request: WarehouseRequest) =>
      requireSuccessfulResponse(WarehouseService.create(request)),
    onSuccess: invalidate,
  });
}

export function useUpdateWarehouseMutation() {
  const invalidate = useInvalidateWarehouses();
  return useMutation({
    mutationFn: ({ id, request }: { id: number; request: WarehouseRequest }) =>
      requireSuccessfulResponse(WarehouseService.update(id, request)),
    onSuccess: invalidate,
  });
}

export function useArchiveWarehouseMutation() {
  const invalidate = useInvalidateWarehouses();
  return useMutation({
    mutationFn: (id: number) =>
      requireSuccessfulResponse(WarehouseService.archive(id)),
    onSuccess: invalidate,
  });
}

export function useRestoreWarehouseMutation() {
  const invalidate = useInvalidateWarehouses();
  return useMutation({
    mutationFn: (id: number) =>
      requireSuccessfulResponse(WarehouseService.restore(id)),
    onSuccess: invalidate,
  });
}
