import { BaseService } from '@/features/shared/api/BaseService';
import { handleRequest } from '@/features/shared/api/service';
import type { ApiResponse } from '@/features/shared/types/genericDtos';
import type { ProductUnit } from '@/features/products/types/product';

export const UnitsService = {
  list: async (): Promise<ApiResponse<ProductUnit[]>> =>
    handleRequest(BaseService.get('/product-settings/units')),
};
