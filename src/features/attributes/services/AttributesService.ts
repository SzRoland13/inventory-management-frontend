import { BaseService } from '@/features/shared/api/BaseService';
import { handleRequest } from '@/features/shared/api/service';
import type { ApiResponse } from '@/features/shared/types/genericDtos';
import type {
  ProductAttributeDefinition,
  ProductAttributeDefinitionRequest,
  ProductAttributeOption,
  ProductAttributeOptionRequest,
} from '@/features/products/types/product';

export const AttributesService = {
  list: async (): Promise<ApiResponse<ProductAttributeDefinition[]>> =>
    handleRequest(BaseService.get('/product-settings/attributes')),
  create: async (
    request: ProductAttributeDefinitionRequest,
  ): Promise<ApiResponse<ProductAttributeDefinition>> =>
    handleRequest(BaseService.post('/product-settings/attributes', request)),
  update: async (
    id: number,
    request: ProductAttributeDefinitionRequest,
  ): Promise<ApiResponse<ProductAttributeDefinition>> =>
    handleRequest(
      BaseService.put(`/product-settings/attributes/${id}`, request),
    ),
  delete: async (id: number): Promise<ApiResponse<void>> =>
    handleRequest(BaseService.delete(`/product-settings/attributes/${id}`)),
  createOption: async (
    definitionId: number,
    request: ProductAttributeOptionRequest,
  ): Promise<ApiResponse<ProductAttributeOption>> =>
    handleRequest(
      BaseService.post(
        `/product-settings/attributes/${definitionId}/options`,
        request,
      ),
    ),
  updateOption: async (
    definitionId: number,
    optionId: number,
    request: ProductAttributeOptionRequest,
  ): Promise<ApiResponse<ProductAttributeOption>> =>
    handleRequest(
      BaseService.put(
        `/product-settings/attributes/${definitionId}/options/${optionId}`,
        request,
      ),
    ),
  deleteOption: async (
    definitionId: number,
    optionId: number,
  ): Promise<ApiResponse<void>> =>
    handleRequest(
      BaseService.delete(
        `/product-settings/attributes/${definitionId}/options/${optionId}`,
      ),
    ),
};
