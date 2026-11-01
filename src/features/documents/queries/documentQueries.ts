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
    queryKey: id ? queryKeys.documents.detail(id) : [...queryKeys.documents.all, 'detail', null],
    queryFn: () => requireSuccessfulResponse(DocumentService.get(id!)),
    enabled: enabled && id !== null,
    refetchInterval: (query) => {
      const files = query.state.data?.payload.files ?? [];
      return files.some((file) => file.status === DocumentFileStatus.QUEUED || file.status === DocumentFileStatus.PROCESSING)
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
      ...(id ? [client.invalidateQueries({ queryKey: queryKeys.documents.detail(id) })] : []),
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

export function useUpdateDocumentDraftMutation() {
  const invalidate = useInvalidateDocuments();
  return useMutation({
    mutationFn: ({ id, request }: { id: number; request: DraftUpdateRequest }) =>
      requireSuccessfulResponse(DocumentService.updateDraft(id, request)),
    onSuccess: (_, variables) => invalidate(variables.id),
  });
}

export function usePostFulfillmentMutation() {
  const invalidate = useInvalidateDocuments();
  return useMutation({
    mutationFn: ({ id, version, idempotencyKey }: { id: number; version: string; sourceId?: number; idempotencyKey: string }) => requireSuccessfulResponse(DocumentService.postFulfillment(id, version, idempotencyKey)),
    onSuccess: (_, variables) => Promise.all([invalidate(variables.id), ...(variables.sourceId ? [invalidate(variables.sourceId)] : [])]),
  });
}

export function useConfirmOrderMutation() {
  const invalidate = useInvalidateDocuments();
  return useMutation({
    mutationFn: ({ id, version }: { id: number; version: string }) => requireSuccessfulResponse(DocumentService.confirmOrder(id, version)),
    onSuccess: (_, variables) => invalidate(variables.id),
  });
}

export function useCreateFulfillmentDraftMutation() {
  const invalidate = useInvalidateDocuments();
  return useMutation({
    mutationFn: (request: FulfillmentDraftRequest) =>
      requireSuccessfulResponse(DocumentService.createFulfillmentDraft(request)),
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
    mutationFn: ({ id, version, request }: { id: number; version: string; request: CloseRemainingRequest }) =>
      requireSuccessfulResponse(DocumentService.closeRemaining(id, version, request)),
    onSuccess: (_, variables) => invalidate(variables.id),
  });
}

export function useRetryPdfMutation() {
  const invalidate = useInvalidateDocuments();
  return useMutation({
    mutationFn: ({ id, idempotencyKey }: { id: number; idempotencyKey: string }) => requireSuccessfulResponse(DocumentService.retryPdf(id, idempotencyKey)),
    onSuccess: (_, variables) => invalidate(variables.id),
  });
}

export function useGeneratePdfMutation() {
  const invalidate = useInvalidateDocuments();
  return useMutation({
    mutationFn: ({ id, language, idempotencyKey }: { id: number; language: string; idempotencyKey: string }) =>
      requireSuccessfulResponse(DocumentService.generatePdf(id, language, idempotencyKey)),
    onSuccess: (_, variables) => invalidate(variables.id),
  });
}
