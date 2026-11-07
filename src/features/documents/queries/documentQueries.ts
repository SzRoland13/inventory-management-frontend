import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { requireSuccessfulResponse } from '@/features/shared/api/apiResponse';
import { queryKeys } from '@/features/shared/api/queryKeys';
import { DocumentService } from '@/features/documents/services/DocumentService';
import { DocumentFileStatus } from '@/features/documents/enums/documentEnums';
import type {
  CloseRemainingRequest,
  DocumentDraftRequest,
  DocumentListRequest,
  DraftUpdateRequest,
  FulfillmentDraftRequest,
  FulfillmentPreviewRequest,
  CorrectionRequest,
  CorrectionPreviewRequest,
  DocumentOperationPreview,
  QuarantineReleaseRequest,
  ReconciliationRequest,
  ReplacementDeliveryMutationRequest,
  ReplacementDeliveryRequest,
  ReturnMutationRequest,
  ReturnRequest,
  StockCountRequest,
  TransferActionRequest,
  TransferDraftRequest,
  TransferPreviewRequest,
} from '@/features/documents/types/documents';

export function useDocumentsQuery(params: DocumentListRequest) {
  return useQuery({
    queryKey: queryKeys.documents.list(params),
    queryFn: () => requireSuccessfulResponse(DocumentService.list(params)),
    placeholderData: (previous) => previous,
    staleTime: 15_000,
  });
}

export function useDocumentCapabilitiesQuery(enabled = true) {
  return useQuery({
    queryKey: queryKeys.documents.capabilities,
    queryFn: () => requireSuccessfulResponse(DocumentService.capabilities()),
    enabled,
    staleTime: 5 * 60_000,
  });
}

export function useDocumentQuery(id: number | null, enabled = true) {
  return useQuery({
    queryKey: id
      ? queryKeys.documents.detail(id)
      : [...queryKeys.documents.all, 'detail', null],
    queryFn: () => requireSuccessfulResponse(DocumentService.get(id!)),
    enabled: enabled && id !== null,
    refetchInterval: (query) => {
      const files = query.state.data?.payload.files ?? [];
      return files.some(
        (file) =>
          file.status === DocumentFileStatus.QUEUED ||
          file.status === DocumentFileStatus.PROCESSING,
      )
        ? 3000
        : false;
    },
  });
}

function useInvalidateDocuments() {
  const client = useQueryClient();
  return async (id?: number) => {
    await Promise.all([
      client.invalidateQueries({ queryKey: queryKeys.documents.lists() }),
      ...(id
        ? [
            client.invalidateQueries({
              queryKey: queryKeys.documents.detail(id),
            }),
          ]
        : []),
    ]);
  };
}

export function useCreateDocumentDraftMutation() {
  const invalidate = useInvalidateDocuments();
  return useMutation({
    mutationFn: (request: DocumentDraftRequest) =>
      requireSuccessfulResponse(DocumentService.createDraft(request)),
    onSuccess: () => invalidate(),
  });
}

export function useUpdateDocumentDraftMutation(
  { updateDetailCache = true }: { updateDetailCache?: boolean } = {},
) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      request,
    }: {
      id: number;
      request: DraftUpdateRequest;
    }) => requireSuccessfulResponse(DocumentService.updateDraft(id, request)),
    onSuccess: async (saved, variables) => {
      if (updateDetailCache) {
        client.setQueryData(queryKeys.documents.detail(variables.id), saved);
      }
      await client.invalidateQueries({
        queryKey: queryKeys.documents.lists(),
      });
    },
  });
}

export function usePostFulfillmentMutation() {
  const invalidate = useInvalidateDocuments();
  return useMutation({
    mutationFn: ({
      id,
      version,
      idempotencyKey,
      effectiveAt,
    }: {
      id: number;
      version: string;
      sourceId?: number;
      idempotencyKey: string;
      effectiveAt?: string;
    }) =>
      requireSuccessfulResponse(
        DocumentService.postFulfillment(id, version, idempotencyKey, effectiveAt),
      ),
    onSuccess: (_, variables) =>
      Promise.all([
        invalidate(variables.id),
        ...(variables.sourceId ? [invalidate(variables.sourceId)] : []),
      ]),
  });
}

export function useConfirmOrderMutation() {
  const invalidate = useInvalidateDocuments();
  return useMutation({
    mutationFn: ({ id, version }: { id: number; version: string }) =>
      requireSuccessfulResponse(DocumentService.confirmOrder(id, version)),
    onSuccess: (_, variables) => invalidate(variables.id),
  });
}

export function useCreateFulfillmentDraftMutation() {
  const invalidate = useInvalidateDocuments();
  return useMutation({
    mutationFn: (request: FulfillmentDraftRequest) =>
      requireSuccessfulResponse(
        DocumentService.createFulfillmentDraft(request),
      ),
    onSuccess: (_, request) => invalidate(request.sourceDocumentId),
  });
}

export function usePreviewFulfillmentMutation() {
  return useMutation({
    mutationFn: (request: FulfillmentPreviewRequest) =>
      requireSuccessfulResponse(DocumentService.previewFulfillment(request)),
  });
}

export function useCloseRemainingMutation() {
  const invalidate = useInvalidateDocuments();
  return useMutation({
    mutationFn: ({
      id,
      version,
      request,
    }: {
      id: number;
      version: string;
      request: CloseRemainingRequest;
    }) =>
      requireSuccessfulResponse(
        DocumentService.closeRemaining(id, version, request),
      ),
    onSuccess: (_, variables) => invalidate(variables.id),
  });
}

export function useCreateTransferDraftMutation() {
  const invalidate = useInvalidateDocuments();
  return useMutation({
    mutationFn: (request: TransferDraftRequest) =>
      requireSuccessfulResponse(DocumentService.createTransferDraft(request)),
    onSuccess: () => invalidate(),
  });
}

export function useTransferPreviewMutation() {
  return useMutation({
    mutationFn: (request: TransferPreviewRequest) =>
      requireSuccessfulResponse<DocumentOperationPreview>(
        DocumentService.previewTransfer(request),
      ),
  });
}

export function useTransferActionMutation() {
  const invalidate = useInvalidateDocuments();
  return useMutation({
    mutationFn: ({
      id,
      action,
      request,
    }: {
      id: number;
      action: 'dispatch' | 'receive' | 'resolve';
      request: TransferActionRequest;
    }) =>
      requireSuccessfulResponse(
        action === 'dispatch'
          ? DocumentService.dispatchTransfer(id, request)
          : action === 'receive'
            ? DocumentService.receiveTransfer(id, request)
            : DocumentService.resolveTransfer(id, request),
      ),
    onSuccess: (_, variables) => invalidate(variables.id),
  });
}

export function useTransitResolutionPreviewMutation() {
  return useMutation({
    mutationFn: ({
      id,
      request,
    }: {
      id: number;
      request: TransferActionRequest;
    }) =>
      requireSuccessfulResponse<DocumentOperationPreview>(
        DocumentService.previewTransitResolution(id, request),
      ),
  });
}

export function useReturnMutation() {
  const invalidate = useInvalidateDocuments();
  return useMutation({
    mutationFn: (request: ReturnMutationRequest) =>
      requireSuccessfulResponse(DocumentService.createReturn(request)),
    onSuccess: (_, request) => invalidate(request.sourceDocumentId),
  });
}
export function useReturnPreviewMutation() {
  return useMutation({
    mutationFn: (request: ReturnRequest) =>
      requireSuccessfulResponse<DocumentOperationPreview>(
        DocumentService.previewReturn(request),
      ),
  });
}
export function useQuarantineReleaseMutation() {
  const invalidate = useInvalidateDocuments();
  return useMutation({
    mutationFn: ({
      id,
      request,
    }: {
      id: number;
      request: QuarantineReleaseRequest;
    }) =>
      requireSuccessfulResponse(
        DocumentService.releaseQuarantinedStock(id, request),
      ),
    onSuccess: (_, variables) => invalidate(variables.id),
  });
}
export function useQuarantineReleasePreviewMutation() {
  return useMutation({
    mutationFn: ({
      id,
      request,
    }: {
      id: number;
      request: QuarantineReleaseRequest;
    }) =>
      requireSuccessfulResponse<DocumentOperationPreview>(
        DocumentService.previewQuarantineRelease(id, request),
      ),
  });
}
export function useReplacementDeliveryMutation() {
  const invalidate = useInvalidateDocuments();
  return useMutation({
    mutationFn: (request: ReplacementDeliveryMutationRequest) =>
      requireSuccessfulResponse(
        DocumentService.createReplacementDelivery(request),
      ),
    onSuccess: (_, request) => invalidate(request.returnDocumentId),
  });
}
export function useReplacementDeliveryPreviewMutation() {
  return useMutation({
    mutationFn: (request: ReplacementDeliveryRequest) =>
      requireSuccessfulResponse<DocumentOperationPreview>(
        DocumentService.previewReplacementDelivery(request),
      ),
  });
}
export function useCreateStockCountMutation() {
  const invalidate = useInvalidateDocuments();
  return useMutation({
    mutationFn: (request: StockCountRequest) =>
      requireSuccessfulResponse(DocumentService.createStockCount(request)),
    onSuccess: () => invalidate(),
  });
}
export function useStockCountPreviewMutation() {
  return useMutation({
    mutationFn: ({
      id,
      request,
    }: {
      id: number;
      request: ReconciliationRequest;
    }) =>
      requireSuccessfulResponse<DocumentOperationPreview>(
        DocumentService.previewStockCount(id, request),
      ),
  });
}
export function usePostStockCountMutation() {
  const invalidate = useInvalidateDocuments();
  return useMutation({
    mutationFn: ({
      id,
      request,
    }: {
      id: number;
      request: ReconciliationRequest;
    }) =>
      requireSuccessfulResponse(DocumentService.postStockCount(id, request)),
    onSuccess: (_, variables) => invalidate(variables.id),
  });
}
export function useCorrectionPreviewMutation() {
  return useMutation({
    mutationFn: ({
      id,
      request,
    }: {
      id: number;
      request: CorrectionPreviewRequest;
    }) =>
      requireSuccessfulResponse<DocumentOperationPreview>(
        DocumentService.previewCorrection(id, request),
      ),
  });
}
export function useCorrectPostedDocumentMutation() {
  const invalidate = useInvalidateDocuments();
  return useMutation({
    mutationFn: ({ id, request }: { id: number; request: CorrectionRequest }) =>
      requireSuccessfulResponse(
        DocumentService.correctPostedDocument(id, request),
      ),
    onSuccess: (_, variables) => invalidate(variables.id),
  });
}

export function useRetryPdfMutation() {
  const invalidate = useInvalidateDocuments();
  return useMutation({
    mutationFn: ({
      id,
      idempotencyKey,
    }: {
      id: number;
      idempotencyKey: string;
    }) =>
      requireSuccessfulResponse(DocumentService.retryPdf(id, idempotencyKey)),
    onSuccess: (_, variables) => invalidate(variables.id),
  });
}

export function useGeneratePdfMutation() {
  const invalidate = useInvalidateDocuments();
  return useMutation({
    mutationFn: ({
      id,
      language,
      idempotencyKey,
    }: {
      id: number;
      language: string;
      idempotencyKey: string;
    }) =>
      requireSuccessfulResponse(
        DocumentService.generatePdf(id, language, idempotencyKey),
      ),
    onSuccess: (_, variables) => invalidate(variables.id),
  });
}
