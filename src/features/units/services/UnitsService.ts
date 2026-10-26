import { BaseService } from '@/features/shared/api/BaseService';
import { handleRequest } from '@/features/shared/api/service';
import type { ApiResponse } from '@/features/shared/types/genericDtos';
import type { ProductUnit } from '@/features/products/types/product';

export type UnitRequest = {
  code: string;
  name: string;
  symbol: string;
};

export const UnitsService = {
  list: async (): Promise<ApiResponse<ProductUnit[]>> =>
    handleRequest(BaseService.get('/product-settings/units')),
  create: async (request: UnitRequest): Promise<ApiResponse<ProductUnit>> =>
    handleRequest(BaseService.post('/product-settings/units', request)),
  update: async (
    id: number,
    request: UnitRequest,
  ): Promise<ApiResponse<ProductUnit>> =>
    handleRequest(BaseService.put(`/product-settings/units/${id}`, request)),
  delete: async (id: number): Promise<ApiResponse<void>> =>
    handleRequest(BaseService.delete(`/product-settings/units/${id}`)),
};
