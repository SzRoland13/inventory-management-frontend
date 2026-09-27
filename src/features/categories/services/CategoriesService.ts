import { BaseService } from '@/features/shared/api/BaseService';
import { handleRequest } from '@/features/shared/api/service';
import type { ApiResponse } from '@/features/shared/types/genericDtos';
import type { ProductCategory } from '@/features/products/types/product';

export const CategoriesService = {
  list: async (): Promise<ApiResponse<ProductCategory[]>> =>
    handleRequest(BaseService.get('/product-settings/categories')),
};
