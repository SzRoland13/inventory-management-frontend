'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import {
  DocumentAction,
  TransferMovementOperation,
  TransferResolutionOperation,
} from '@/features/documents/enums/documentEnums';
import type {
  BusinessDocument,
  DocumentOperationPreview,
  TransferActionRequest,
} from '@/features/documents/types/documents';
import {
  useTransitResolutionPreviewMutation,
  useTransferActionMutation,
  useTransferPreviewMutation,
} from '@/features/documents/queries/documentQueries';
import { createIdempotencyKey } from '@/features/shared/api/idempotencyKey';
import { toastApiError } from '@/features/shared/api/apiResponse';
import { useWarehousesQuery } from '@/features/warehouses/queries/warehouseQueries';
import {
  WarehouseStatus,
  WarehouseType,
} from '@/features/warehouses/types/warehouse';
import { TransferOperationForm } from '@/features/documents/components/TransferOperationForm';
import type { TransferAction } from '@/features/documents/components/TransferOperationFields';

type Props = {
  document: BusinessDocument;
  action: TransferAction;
  onClose: () => void;
  onComplete: () => void;
};

export function TransferOperationDialog({
  document,
  action,
  onClose,
  onComplete,
}: Props) {
  const t = useTranslations();
  const warehousesQuery = useWarehousesQuery();
  const warehouses = (warehousesQuery.data?.payload ?? []).filter(
    (item) =>
      item.status === WarehouseStatus.ACTIVE &&
      item.type === WarehouseType.STANDARD,
  );
  const transferPreview = useTransferPreviewMutation();
  const resolutionPreview = useTransitResolutionPreviewMutation();
  const submitAction = useTransferActionMutation();
  const [sourceId, setSourceId] = useState(
    String(document.sourceWarehouseId ?? ''),
  );
  const [destinationId, setDestinationId] = useState(
    String(document.destinationWarehouseId ?? ''),
  );
  const [transitId, setTransitId] = useState(
    String(document.transitWarehouseId ?? ''),
  );
  const [reason, setReason] = useState('');
  const [effectiveAt, setEffectiveAt] = useState('');
  const [resolution, setResolution] = useState<TransferResolutionOperation>(
    TransferResolutionOperation.LOSS,
  );
  const [quantities, setQuantities] = useState<Record<number, string>>(() =>
    Object.fromEntries(
      document.lines.map((line) => [
        line.id,
        String(
          action === DocumentAction.RECEIVE_TRANSFER
            ? (line.inTransitQuantity ?? 0)
            : line.remainingQuantity,
        ),
      ]),
    ),
  );
  const [preview, setPreview] = useState<DocumentOperationPreview | null>(null);
  const lines = useMemo(
    () =>
      document.lines
        .map((line) => ({
          sourceLineId: line.id,
          productId: line.productId,
          quantity: Number(quantities[line.id] ?? 0),
        }))
        .filter((line) => line.quantity > 0),
    [document.lines, quantities],
  );
  const selectionValid =
    action === DocumentAction.RESOLVE_TRANSIT ||
    Boolean(sourceId && destinationId && sourceId !== destinationId);
  const isResolution = action === DocumentAction.RESOLVE_TRANSIT;

  async function previewOperation() {
    if (!lines.length || !selectionValid || (isResolution && !reason.trim()))
      return;
    setPreview(null);
    try {
      const response =
        action === DocumentAction.RESOLVE_TRANSIT
          ? await resolutionPreview.mutateAsync({
              id: document.id,
              request: {
                version: document.version,
                idempotencyKey: createIdempotencyKey(),
                operation: resolution,
                reason: reason.trim(),
                effectiveAt: effectiveAt || undefined,
                lines,
              },
            })
          : await transferPreview.mutateAsync({
              documentId: document.id,
              operation:
                action === DocumentAction.DISPATCH
                  ? TransferMovementOperation.DISPATCH
                  : TransferMovementOperation.RECEIPT,
              sourceWarehouseId: Number(sourceId),
              destinationWarehouseId: Number(destinationId),
              transitWarehouseId: Number(transitId) || undefined,
              effectiveAt: effectiveAt || undefined,
              lines,
            });
      setPreview(response.payload);
    } catch (error) {
      toastApiError(t, error);
    }
  }

  async function submit() {
    if (
      !preview?.valid ||
      !lines.length ||
      !selectionValid ||
      (isResolution && !reason.trim())
    )
      return;
    const request: TransferActionRequest = {
      version: document.version,
      idempotencyKey: createIdempotencyKey(),
      ...(action === DocumentAction.RESOLVE_TRANSIT
        ? { operation: resolution }
        : {}),
      ...(isResolution ? { reason: reason.trim() } : {}),
      effectiveAt: effectiveAt || undefined,
      lines,
    };
    try {
      await submitAction.mutateAsync({
        id: document.id,
        action:
          action === DocumentAction.DISPATCH
            ? 'dispatch'
            : action === DocumentAction.RECEIVE_TRANSFER
              ? 'receive'
              : 'resolve',
        request,
      });
      toast.success(t('pages.documents.operations.transferSaved'));
      onComplete();
    } catch (error) {
      toastApiError(t, error);
    }
  }

  const busy =
    transferPreview.isPending ||
    resolutionPreview.isPending ||
    submitAction.isPending;
  return (
    <TransferOperationForm
      document={document}
      action={action}
      warehouses={warehouses}
      sourceId={sourceId}
      destinationId={destinationId}
      transitId={transitId}
      resolution={resolution}
      reason={reason}
      effectiveAt={effectiveAt}
      quantities={quantities}
      preview={preview}
      busy={busy}
      selectionValid={selectionValid}
      lineCount={lines.length}
      onSourceChange={(value) => {
        setSourceId(value);
        setPreview(null);
      }}
      onDestinationChange={(value) => {
        setDestinationId(value);
        setPreview(null);
      }}
      onTransitChange={(value) => {
        setTransitId(value);
        setPreview(null);
      }}
      onResolutionChange={(value) => {
        setResolution(value);
        setPreview(null);
      }}
      onReasonChange={(value) => {
        setReason(value);
        setPreview(null);
      }}
      onEffectiveAtChange={(value) => {
        setEffectiveAt(value);
        setPreview(null);
      }}
      onQuantityChange={(lineId, value) => {
        setQuantities((current) => ({ ...current, [lineId]: value }));
        setPreview(null);
      }}
      onPreview={() => void previewOperation()}
      onSubmit={() => void submit()}
      onClose={onClose}
    />
  );
}
