import { BaseService } from '@/features/shared/api/BaseService';
import { handleRequest } from '@/features/shared/api/service';
import type { ApiResponse } from '@/features/shared/types/genericDtos';
import type {
  ContactRequest,
  ContactResponse,
  PartnerRequest,
  PartnerResponse,
} from '@/features/partners/types/partner';

export const PartnerService = {
  list: (): Promise<ApiResponse<PartnerResponse[]>> =>
    handleRequest(BaseService.get('/partners')),
  create: (request: PartnerRequest): Promise<ApiResponse<PartnerResponse>> =>
    handleRequest(BaseService.post('/partners', request)),
  update: (
    id: number,
    request: PartnerRequest,
  ): Promise<ApiResponse<PartnerResponse>> =>
    handleRequest(BaseService.put(`/partners/${id}`, request)),
  archive: (id: number): Promise<ApiResponse<PartnerResponse>> =>
    handleRequest(BaseService.post(`/partners/${id}/archive`)),
  restore: (id: number): Promise<ApiResponse<PartnerResponse>> =>
    handleRequest(BaseService.post(`/partners/${id}/restore`)),
  createContact: (
    partnerId: number,
    request: ContactRequest,
  ): Promise<ApiResponse<ContactResponse>> =>
    handleRequest(BaseService.post(`/partners/${partnerId}/contacts`, request)),
  updateContact: (
    partnerId: number,
    contactId: number,
    request: ContactRequest,
  ): Promise<ApiResponse<ContactResponse>> =>
    handleRequest(
      BaseService.put(
        `/partners/${partnerId}/contacts/${contactId}`,
        request,
      ),
    ),
  removeContact: (
    partnerId: number,
    contactId: number,
  ): Promise<ApiResponse<ContactResponse>> =>
    handleRequest(
      BaseService.delete(`/partners/${partnerId}/contacts/${contactId}`),
    ),
};
