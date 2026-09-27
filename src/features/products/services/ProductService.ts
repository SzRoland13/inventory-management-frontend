import { BaseService } from '@/features/shared/api/BaseService';
import { handleRequest } from '@/features/shared/api/service';
import type { ApiResponse } from '@/features/shared/types/genericDtos';
import type {
  ProductListRequest,
  ProductPage,
  ProductRequest,
  ProductResponse,
} from '@/features/products/types/product';

export const ProductService = {
  list: async (
    params: ProductListRequest,
  ): Promise<ApiResponse<ProductPage<ProductResponse>>> =>
    handleRequest(BaseService.get('/products', params)),

  get: async (id: number): Promise<ApiResponse<ProductResponse>> =>
    handleRequest(BaseService.get(`/products/${id}`)),

  create: async (request: ProductRequest): Promise<ApiResponse<ProductResponse>> =>
    handleRequest(BaseService.post('/products', request)),

  update: async (
    id: number,
    request: ProductRequest,
  ): Promise<ApiResponse<ProductResponse>> =>
    handleRequest(BaseService.put(`/products/${id}`, request)),

  archive: async (id: number): Promise<ApiResponse<void>> =>
    handleRequest(BaseService.delete(`/products/${id}`)),

  listArchived: async (
    params: ProductListRequest,
  ): Promise<ApiResponse<ProductPage<ProductResponse>>> =>
    handleRequest(BaseService.get('/products/archived', params)),

  restore: async (id: number): Promise<ApiResponse<ProductResponse>> =>
    handleRequest(BaseService.post(`/products/${id}/restore`)),
};
