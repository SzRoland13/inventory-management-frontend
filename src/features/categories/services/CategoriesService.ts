import { BaseService } from '@/features/shared/api/BaseService';
import { handleRequest } from '@/features/shared/api/service';
import type { ApiResponse } from '@/features/shared/types/genericDtos';
import type {
  ProductCategory,
  ProductCategoryRequest,
} from '@/features/products/types/product';

export const CategoriesService = {
  list: async (): Promise<ApiResponse<ProductCategory[]>> =>
    handleRequest(BaseService.get('/product-settings/categories')),
  reorder: async (
    categoryIds: number[],
  ): Promise<ApiResponse<ProductCategory[]>> =>
    handleRequest(
      BaseService.put('/product-settings/categories/reorder', { categoryIds }),
    ),
  create: async (
    request: ProductCategoryRequest,
  ): Promise<ApiResponse<ProductCategory>> =>
    handleRequest(BaseService.post('/product-settings/categories', request)),
  update: async (
    id: number,
    request: ProductCategoryRequest,
  ): Promise<ApiResponse<ProductCategory>> =>
    handleRequest(
      BaseService.put(`/product-settings/categories/${id}`, request),
    ),
  delete: async (id: number): Promise<ApiResponse<void>> =>
    handleRequest(BaseService.delete(`/product-settings/categories/${id}`)),
};
