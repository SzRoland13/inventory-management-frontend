import axiosClient from '@/features/shared/api/axios';
import { BaseService } from '@/features/shared/api/BaseService';
import type { ApiResponse } from '@/features/shared/types/genericDtos';
import type {
  BusinessDocument,
  DocumentCapabilitiesResponse,
  CloseRemainingRequest,
  DocumentDraftRequest,
  DocumentListRequest,
  DocumentListResponse,
  DraftUpdateRequest,
  FulfillmentDraftRequest,
  FulfillmentPreviewRequest,
  FulfillmentPreviewResponse,
} from '@/features/documents/types/documents';

const DOCUMENTS_URL = '/documents';

export const DocumentService = {
  capabilities: () =>
    BaseService.get<ApiResponse<DocumentCapabilitiesResponse>>(`${DOCUMENTS_URL}/capabilities`),

  list: (params: DocumentListRequest) =>
    BaseService.get<ApiResponse<DocumentListResponse>>(DOCUMENTS_URL, params),

  get: (id: number) =>
    BaseService.get<ApiResponse<BusinessDocument>>(`${DOCUMENTS_URL}/${id}`),

  createDraft: (request: DocumentDraftRequest) =>
    BaseService.post<ApiResponse<BusinessDocument>>(
      `${DOCUMENTS_URL}/drafts`,
      request,
    ),

  updateDraft: (id: number, request: DraftUpdateRequest) =>
    BaseService.put<ApiResponse<BusinessDocument>>(
      `${DOCUMENTS_URL}/${id}/draft`,
      request,
    ),

  createFulfillmentDraft: (request: FulfillmentDraftRequest) =>
    BaseService.post<ApiResponse<BusinessDocument>>(
      `${DOCUMENTS_URL}/fulfillments/drafts`,
      request,
    ),

  confirmOrder: (id: number, version: string) =>
    BaseService.post<ApiResponse<BusinessDocument>>(`${DOCUMENTS_URL}/${id}/confirm`, undefined, {
      headers: { 'If-Match': version },
    }),

  previewFulfillment: (request: FulfillmentPreviewRequest) =>
    BaseService.post<ApiResponse<FulfillmentPreviewResponse>>(
      `${DOCUMENTS_URL}/fulfillments/preview`,
      request,
    ),

  postFulfillment: (id: number, version: string, idempotencyKey: string) =>
    BaseService.post<ApiResponse<BusinessDocument>>(
      `${DOCUMENTS_URL}/${id}/post`,
      undefined,
      { headers: { 'Idempotency-Key': idempotencyKey, 'If-Match': version } },
    ),

  closeRemaining: (id: number, version: string, request: CloseRemainingRequest) =>
    BaseService.post<ApiResponse<BusinessDocument>>(
      `${DOCUMENTS_URL}/${id}/close-remaining`,
      request,
      { headers: { 'If-Match': version } },
    ),

  generatePdf: (id: number, language: string, idempotencyKey: string) =>
    BaseService.post<ApiResponse<BusinessDocument>>(
      `${DOCUMENTS_URL}/${id}/pdf`,
      undefined,
      { params: { language }, headers: { 'Idempotency-Key': idempotencyKey } },
    ),

  uploadFile: (id: number, file: File) => {
    const body = new FormData();
    body.append('file', file);
    return axiosClient.post<ApiResponse<BusinessDocument>>(
      `${DOCUMENTS_URL}/${id}/files`,
      body,
    ).then((response) => response.data);
  },

  retryPdf: (id: number, idempotencyKey: string) =>
    BaseService.post<ApiResponse<BusinessDocument>>(
      `${DOCUMENTS_URL}/${id}/pdf/retry`,
      undefined,
      { headers: { 'Idempotency-Key': idempotencyKey } },
    ),
};
