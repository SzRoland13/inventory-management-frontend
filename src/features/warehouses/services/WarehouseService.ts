import { BaseService } from '@/features/shared/api/BaseService';
import { handleRequest } from '@/features/shared/api/service';
import type { ApiResponse } from '@/features/shared/types/genericDtos';
import type {
  WarehouseRequest,
  WarehouseResponse,
} from '@/features/warehouses/types/warehouse';

export const WarehouseService = {
  list: (): Promise<ApiResponse<WarehouseResponse[]>> =>
    handleRequest(BaseService.get('/warehouses')),
  create: (
    request: WarehouseRequest,
  ): Promise<ApiResponse<WarehouseResponse>> =>
    handleRequest(BaseService.post('/warehouses', request)),
  update: (
    id: number,
    request: WarehouseRequest,
  ): Promise<ApiResponse<WarehouseResponse>> =>
    handleRequest(BaseService.put(`/warehouses/${id}`, request)),
  archive: (id: number): Promise<ApiResponse<WarehouseResponse>> =>
    handleRequest(BaseService.post(`/warehouses/${id}/archive`)),
  restore: (id: number): Promise<ApiResponse<WarehouseResponse>> =>
    handleRequest(BaseService.post(`/warehouses/${id}/restore`)),
};
