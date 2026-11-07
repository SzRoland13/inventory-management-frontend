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
  DocumentOperationPreview,
  TransferDraftRequest,
  TransferPreviewRequest,
  TransferActionRequest,
  ReturnRequest,
  QuarantineReleaseRequest,
  ReplacementDeliveryRequest,
  StockCountRequest,
  ReconciliationRequest,
  CorrectionRequest,
  CorrectionPreviewRequest,
  ReturnMutationRequest,
  ReplacementDeliveryMutationRequest,
} from '@/features/documents/types/documents';

const DOCUMENTS_URL = '/documents';

export const DocumentService = {
  capabilities: () =>
    BaseService.get<ApiResponse<DocumentCapabilitiesResponse>>(
      `${DOCUMENTS_URL}/capabilities`,
    ),

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
    BaseService.post<ApiResponse<BusinessDocument>>(
      `${DOCUMENTS_URL}/${id}/confirm`,
      undefined,
      {
        headers: { 'If-Match': version },
      },
    ),

  previewFulfillment: (request: FulfillmentPreviewRequest) =>
    BaseService.post<ApiResponse<FulfillmentPreviewResponse>>(
      `${DOCUMENTS_URL}/fulfillments/preview`,
      request,
    ),

  postFulfillment: (
    id: number,
    version: string,
    idempotencyKey: string,
    effectiveAt?: string,
  ) =>
    BaseService.post<ApiResponse<BusinessDocument>>(
      `${DOCUMENTS_URL}/${id}/post`,
      effectiveAt ? { effectiveAt } : undefined,
      { headers: { 'Idempotency-Key': idempotencyKey, 'If-Match': version } },
    ),

  closeRemaining: (
    id: number,
    version: string,
    request: CloseRemainingRequest,
  ) =>
    BaseService.post<ApiResponse<BusinessDocument>>(
      `${DOCUMENTS_URL}/${id}/close-remaining`,
      request,
      { headers: { 'If-Match': version } },
    ),

  createTransferDraft: (request: TransferDraftRequest) =>
    BaseService.post<ApiResponse<BusinessDocument>>(
      `${DOCUMENTS_URL}/transfers/drafts`,
      request,
    ),
  previewTransfer: (request: TransferPreviewRequest) =>
    BaseService.post<ApiResponse<DocumentOperationPreview>>(
      `${DOCUMENTS_URL}/transfers/preview`,
      request,
    ),
  previewTransitResolution: (id: number, request: TransferActionRequest) =>
    BaseService.post<ApiResponse<DocumentOperationPreview>>(
      `${DOCUMENTS_URL}/transfers/${id}/resolution-preview`,
      request,
    ),
  dispatchTransfer: (id: number, request: TransferActionRequest) =>
    BaseService.post<ApiResponse<BusinessDocument>>(
      `${DOCUMENTS_URL}/transfers/${id}/dispatch`,
      request,
      {
        headers: {
          'If-Match': request.version,
          'Idempotency-Key': request.idempotencyKey,
        },
      },
    ),
  receiveTransfer: (id: number, request: TransferActionRequest) =>
    BaseService.post<ApiResponse<BusinessDocument>>(
      `${DOCUMENTS_URL}/transfers/${id}/receipt`,
      request,
      {
        headers: {
          'If-Match': request.version,
          'Idempotency-Key': request.idempotencyKey,
        },
      },
    ),
  resolveTransfer: (id: number, request: TransferActionRequest) =>
    BaseService.post<ApiResponse<BusinessDocument>>(
      `${DOCUMENTS_URL}/transfers/${id}/resolve`,
      request,
      {
        headers: {
          'If-Match': request.version,
          'Idempotency-Key': request.idempotencyKey,
        },
      },
    ),
  previewReturn: (request: ReturnRequest) =>
    BaseService.post<ApiResponse<DocumentOperationPreview>>(
      `${DOCUMENTS_URL}/returns/preview`,
      request,
    ),
  createReturn: (request: ReturnMutationRequest) => {
    const { idempotencyKey, ...body } = request;
    return BaseService.post<ApiResponse<BusinessDocument>>(
      `${DOCUMENTS_URL}/returns`,
      body,
      { headers: { 'Idempotency-Key': idempotencyKey } },
    );
  },
  previewQuarantineRelease: (id: number, request: QuarantineReleaseRequest) =>
    BaseService.post<ApiResponse<DocumentOperationPreview>>(
      `${DOCUMENTS_URL}/${id}/quarantine-release/preview`,
      request,
    ),
  releaseQuarantinedStock: (id: number, request: QuarantineReleaseRequest) =>
    BaseService.post<ApiResponse<BusinessDocument>>(
      `${DOCUMENTS_URL}/${id}/quarantine-release`,
      request,
      {
        headers: {
          'If-Match': request.version,
          'Idempotency-Key': request.idempotencyKey,
        },
      },
    ),
  previewReplacementDelivery: (request: ReplacementDeliveryRequest) =>
    BaseService.post<ApiResponse<DocumentOperationPreview>>(
      `${DOCUMENTS_URL}/returns/replacement-deliveries/preview`,
      request,
    ),
  createReplacementDelivery: (request: ReplacementDeliveryMutationRequest) => {
    const { idempotencyKey, ...body } = request;
    return BaseService.post<ApiResponse<BusinessDocument>>(
      `${DOCUMENTS_URL}/returns/replacement-deliveries`,
      body,
      { headers: { 'Idempotency-Key': idempotencyKey } },
    );
  },
  createStockCount: (request: StockCountRequest) =>
    BaseService.post<ApiResponse<BusinessDocument>>(
      `${DOCUMENTS_URL}/stock-counts`,
      request,
    ),
  previewStockCount: (id: number, request: ReconciliationRequest) =>
    BaseService.post<ApiResponse<DocumentOperationPreview>>(
      `${DOCUMENTS_URL}/stock-counts/${id}/reconciliation-preview`,
      request,
    ),
  postStockCount: (id: number, request: ReconciliationRequest) =>
    BaseService.post<ApiResponse<BusinessDocument>>(
      `${DOCUMENTS_URL}/stock-counts/${id}/post`,
      request,
      {
        headers: {
          'If-Match': request.version,
          ...(request.idempotencyKey
            ? { 'Idempotency-Key': request.idempotencyKey }
            : {}),
          ...(request.calculationVersion
            ? { 'X-Calculation-Version': request.calculationVersion }
            : {}),
        },
      },
    ),
  previewCorrection: (id: number, request: CorrectionPreviewRequest) =>
    BaseService.post<ApiResponse<DocumentOperationPreview>>(
      `${DOCUMENTS_URL}/${id}/corrections/preview`,
      request,
    ),
  correctPostedDocument: (id: number, request: CorrectionRequest) =>
    BaseService.post<ApiResponse<BusinessDocument>>(
      `${DOCUMENTS_URL}/${id}/corrections`,
      request,
      {
        headers: {
          'If-Match': request.version,
          'Idempotency-Key': request.idempotencyKey,
        },
      },
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
    return axiosClient
      .post<ApiResponse<BusinessDocument>>(`${DOCUMENTS_URL}/${id}/files`, body)
      .then((response) => response.data);
  },

  retryPdf: (id: number, idempotencyKey: string) =>
    BaseService.post<ApiResponse<BusinessDocument>>(
      `${DOCUMENTS_URL}/${id}/pdf/retry`,
      undefined,
      { headers: { 'Idempotency-Key': idempotencyKey } },
    ),
};
