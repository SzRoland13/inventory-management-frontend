import { BaseService } from '@/features/shared/api/BaseService';
import { handleRequest } from '@/features/shared/api/service';
import type { ApiResponse } from '@/features/shared/types/genericDtos';
import type { Brand } from '@/features/brands/types/brand';

export const BrandService = {
  search: async (query = ''): Promise<ApiResponse<Brand[]>> =>
    handleRequest(BaseService.get('/brands', { query })),
};
