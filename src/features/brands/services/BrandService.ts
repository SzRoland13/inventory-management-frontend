import { BaseService } from '@/features/shared/api/BaseService';
import { handleRequest } from '@/features/shared/api/service';
import type { ApiResponse } from '@/features/shared/types/genericDtos';
import type { Brand, BrandRequest } from '@/features/brands/types/brand';

export const BrandService = {
  search: async (query = ''): Promise<ApiResponse<Brand[]>> =>
    handleRequest(BaseService.get('/brands', { query })),
  create: async (request: BrandRequest): Promise<ApiResponse<Brand>> =>
    handleRequest(BaseService.post('/brands', request)),
  update: async (
    id: number,
    request: BrandRequest,
  ): Promise<ApiResponse<Brand>> =>
    handleRequest(BaseService.put(`/brands/${id}`, request)),
  delete: async (id: number): Promise<ApiResponse<void>> =>
    handleRequest(BaseService.delete(`/brands/${id}`)),
};
