import { BaseService } from '@/features/shared/api/BaseService';
import { handleRequest } from '@/features/shared/api/service';
import type { ApiResponse } from '@/features/shared/types/genericDtos';
import type { ProductAttributeDefinition } from '@/features/products/types/product';

export const AttributesService = {
  list: async (): Promise<ApiResponse<ProductAttributeDefinition[]>> =>
    handleRequest(BaseService.get('/product-settings/attributes')),
};
