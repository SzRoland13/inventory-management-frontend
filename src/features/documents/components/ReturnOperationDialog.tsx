'use client';

import { useMemo, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import {
  DocumentAction,
  DocumentType,
  ReturnDirection,
  ReturnDisposition,
} from '@/features/documents/enums/documentEnums';
import type {
  BusinessDocument,
  DocumentOperationPreview,
  QuarantineReleaseRequest,
  ReplacementDeliveryRequest,
  ReturnRequest,
} from '@/features/documents/types/documents';
import {
  useQuarantineReleaseMutation,
  useQuarantineReleasePreviewMutation,
  useReplacementDeliveryMutation,
  useReplacementDeliveryPreviewMutation,
  useReturnMutation,
  useReturnPreviewMutation,
} from '@/features/documents/queries/documentQueries';
import { createIdempotencyKey } from '@/features/shared/api/idempotencyKey';
import { toastApiError } from '@/features/shared/api/apiResponse';
import { useWarehousesQuery } from '@/features/warehouses/queries/warehouseQueries';
import {
  WarehouseStatus,
  WarehouseType,
} from '@/features/warehouses/types/warehouse';
import { Button } from '@/features/shared/components/ui/button';
import { Input } from '@/features/shared/components/ui/input';
import { Label } from '@/features/shared/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/features/shared/components/ui/select';
import { Dialog } from '@/features/shared/components/ui/dialog';
import {
  AppDialogBody,
  AppDialogFooter,
  AppDialogHeader,
  appDialogCancelButtonClass,
  appDialogPrimaryButtonClass,
} from '@/features/shared/components/AppDialogLayout';
import { ThemedDialogContent } from '@/features/shared/components/ThemedDialogWrapper';

type Action =
  | DocumentAction.CREATE_RETURN
  | DocumentAction.RELEASE_QUARANTINE
  | DocumentAction.CREATE_REPLACEMENT_DELIVERY;
type Props = {
  document: BusinessDocument;
  action: Action;
  onClose: () => void;
  onComplete: () => void;
};

export function ReturnOperationDialog({
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
  const createReturn = useReturnMutation();
  const previewReturn = useReturnPreviewMutation();
  const releaseStock = useQuarantineReleaseMutation();
  const previewRelease = useQuarantineReleasePreviewMutation();
  const createReplacement = useReplacementDeliveryMutation();
  const previewReplacement = useReplacementDeliveryPreviewMutation();
  const [reason, setReason] = useState('');
  const [warehouseId, setWarehouseId] = useState(
    String(document.warehouseId ?? ''),
  );
  const [dispositions, setDispositions] = useState<
    Record<number, ReturnDisposition>
  >({});
  const [quantities, setQuantities] = useState<Record<number, string>>(() =>
    Object.fromEntries(
      document.lines.map((line) => [
        line.id,
        String(
          action === DocumentAction.CREATE_RETURN
            ? (line.returnableQuantity ?? line.remainingQuantity)
            : action === DocumentAction.RELEASE_QUARANTINE
              ? line.remainingQuantity
              : line.fulfilledQuantity,
        ),
      ]),
    ),
  );
  const [preview, setPreview] = useState<DocumentOperationPreview | null>(null);
  const originalDeliveryId =
    document.type === DocumentType.DELIVERY_NOTE
      ? document.id
      : document.relatedDocuments.find(
          (item) => item.type === DocumentType.DELIVERY_NOTE,
        )
          ?.id;
  const lines = useMemo(
    () =>
      document.lines
        .map((line) => ({
          sourceLineId: line.id,
          productId: line.productId,
          quantity: Number(quantities[line.id] ?? 0),
          reason: reason.trim(),
          ...(action === DocumentAction.CREATE_RETURN
            ? {
                disposition:
                  dispositions[line.id] ?? ReturnDisposition.RESTOCK,
              }
            : {}),
        }))
        .filter((line) => line.quantity > 0),
    [document.lines, quantities, reason, action, dispositions],
  );
  const busy =
    createReturn.isPending ||
    previewReturn.isPending ||
    releaseStock.isPending ||
    previewRelease.isPending ||
    createReplacement.isPending ||
    previewReplacement.isPending;

  async function previewOperation() {
    if (!lines.length || !reason.trim()) return;
    setPreview(null);
    try {
      let response;
      if (action === DocumentAction.CREATE_RETURN) {
        const request: ReturnRequest = {
          sourceDocumentId: document.id,
          direction:
            document.type === DocumentType.GOODS_RECEIPT
              ? ReturnDirection.SUPPLIER_RETURN
              : ReturnDirection.CUSTOMER_RETURN,
          reason: reason.trim(),
          lines,
        };
        response = await previewReturn.mutateAsync(request);
      } else if (action === DocumentAction.RELEASE_QUARANTINE) {
        if (!warehouseId) return;
        const request: QuarantineReleaseRequest = {
          version: document.version,
          idempotencyKey: createIdempotencyKey(),
          targetWarehouseId: Number(warehouseId),
          reason: reason.trim(),
          lines,
        };
        response = await previewRelease.mutateAsync({
          id: document.id,
          request,
        });
      } else {
        if (!warehouseId || !originalDeliveryId) return;
        const request: ReplacementDeliveryRequest = {
          returnDocumentId: document.id,
          originalDeliveryId,
          warehouseId: Number(warehouseId),
          date: new Date().toISOString().slice(0, 10),
          nonBillable: true,
          lines,
        };
        response = await previewReplacement.mutateAsync(request);
      }
      setPreview(response.payload);
    } catch (error) {
      toastApiError(t, error);
    }
  }

  async function submit() {
    if (!preview?.valid || !lines.length || !reason.trim()) return;
    try {
      if (action === DocumentAction.CREATE_RETURN) {
        await createReturn.mutateAsync({
          sourceDocumentId: document.id,
          direction:
            document.type === DocumentType.GOODS_RECEIPT
              ? ReturnDirection.SUPPLIER_RETURN
              : ReturnDirection.CUSTOMER_RETURN,
          reason: reason.trim(),
          lines,
        });
      } else if (action === DocumentAction.RELEASE_QUARANTINE) {
        await releaseStock.mutateAsync({
          id: document.id,
          request: {
            version: document.version,
            idempotencyKey: createIdempotencyKey(),
            targetWarehouseId: Number(warehouseId),
            reason: reason.trim(),
            lines,
          },
        });
      } else {
        if (!originalDeliveryId) return;
        await createReplacement.mutateAsync({
          returnDocumentId: document.id,
          originalDeliveryId,
          warehouseId: Number(warehouseId),
          date: new Date().toISOString().slice(0, 10),
          nonBillable: true,
          lines,
        });
      }
      toast.success(t('pages.documents.operations.saved'));
      onComplete();
    } catch (error) {
      toastApiError(t, error);
    }
  }

  const needsWarehouse = action !== DocumentAction.CREATE_RETURN;
  return (
    <Dialog open onOpenChange={(open) => !open && !busy && onClose()}>
      <ThemedDialogContent className='!max-w-3xl'>
        <AppDialogHeader
          title={t(`pages.documents.actions.${action}`)}
          description={t('pages.documents.operations.returnDescription', {
            number: document.number ?? document.id,
          })}
          icon={RotateCcw}
        />
        <AppDialogBody className='space-y-4'>
          {needsWarehouse && (
            <div className='space-y-2'>
              <Label>
                {t(
                  action === DocumentAction.RELEASE_QUARANTINE
                    ? 'pages.documents.operations.targetWarehouse'
                    : 'pages.documents.operations.destinationWarehouse',
                )}
              </Label>
              <Select
                value={warehouseId}
                onValueChange={(value) => {
                  setWarehouseId(value);
                  setPreview(null);
                }}
              >
                <SelectTrigger className='border-zinc-600 bg-zinc-900 text-zinc-100'>
                  <SelectValue
                    placeholder={t(
                      'pages.documents.operations.selectWarehouse',
                    )}
                  />
                </SelectTrigger>
                <SelectContent className='border-zinc-700 bg-zinc-900 text-zinc-100'>
                  {warehouses.map((warehouse) => (
                    <SelectItem key={warehouse.id} value={String(warehouse.id)}>
                      {warehouse.name} · {warehouse.code}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          {action === DocumentAction.CREATE_REPLACEMENT_DELIVERY && (
            <p className='rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-100'>
              {t('pages.documents.operations.nonBillable')}
            </p>
          )}
          {action === DocumentAction.CREATE_RETURN &&
            Object.values(dispositions).some(
              (disposition) =>
                disposition === ReturnDisposition.QUARANTINE ||
                disposition === ReturnDisposition.DAMAGED,
            ) && (
              <p className='rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-100'>
                {t('pages.documents.operations.quarantineNotice')}
              </p>
            )}
          <div className='space-y-2'>
            {document.lines.map((line) => (
              <div
                key={line.id}
                className='grid grid-cols-[minmax(0,1fr)_7rem] gap-3 rounded-lg border border-zinc-700 bg-zinc-900/60 p-3'
              >
                <div className='min-w-0'>
                  <p className='truncate text-sm font-medium'>
                    {line.productName}
                  </p>
                  <p className='text-xs text-zinc-400'>
                    {t('pages.documents.operations.returnProgress', {
                      original: line.orderedQuantity,
                      returned: line.returnedQuantity ?? 0,
                      returnable:
                        line.returnableQuantity ?? line.remainingQuantity,
                      unit: line.unitName,
                    })}
                  </p>
                  {action === DocumentAction.CREATE_RETURN && (
                    <Select
                      value={dispositions[line.id] ?? ReturnDisposition.RESTOCK}
                      onValueChange={(value) => {
                        setDispositions((current) => ({
                          ...current,
                          [line.id]: value as ReturnDisposition,
                        }));
                        setPreview(null);
                      }}
                    >
                      <SelectTrigger className='mt-2 border-zinc-600 bg-zinc-900 text-zinc-100'>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className='border-zinc-700 bg-zinc-900 text-zinc-100'>
                        {(
                          Object.values(ReturnDisposition)
                        ).map((value) => (
                          <SelectItem key={value} value={value}>
                            {t(
                              `pages.documents.operations.disposition.${value}`,
                            )}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
                <Input
                  aria-label={`${line.productName} ${t('pages.documents.operations.quantity')}`}
                  type='number'
                  min='0'
                  max={
                    action === DocumentAction.CREATE_RETURN
                      ? line.returnableQuantity
                      : undefined
                  }
                  step='any'
                  value={quantities[line.id] ?? '0'}
                  onChange={(event) => {
                    setQuantities((current) => ({
                      ...current,
                      [line.id]: event.target.value,
                    }));
                    setPreview(null);
                  }}
                />
              </div>
            ))}
          </div>
          <div className='space-y-2'>
            <Label htmlFor='return-reason'>
              {t('pages.documents.operations.reason')}
            </Label>
            <textarea
              id='return-reason'
              value={reason}
              maxLength={500}
              onChange={(event) => {
                setReason(event.target.value);
                setPreview(null);
              }}
              className='min-h-20 w-full rounded-md border border-zinc-600 bg-zinc-900 px-3 py-2 text-sm text-zinc-100'
            />
          </div>
          <p className='text-xs text-zinc-400'>
            {t('pages.documents.operations.returnDoesNotReopen')}
          </p>
          {preview && (
            <div
              className={`rounded-lg border p-3 text-sm ${preview.valid ? 'border-emerald-500/30 text-emerald-200' : 'border-rose-500/30 text-rose-200'}`}
            >
              <p>
                {t(
                  preview.valid
                    ? 'pages.documents.operations.previewValid'
                    : 'pages.documents.operations.previewInvalid',
                )}
              </p>
              {preview.lines.map((line) => (
                <p key={line.sourceLineId} className='mt-2'>
                  {line.productName}:{' '}
                  {t('pages.documents.operations.returnEffect', {
                    returnable: line.returnableQuantity ?? 0,
                    resulting: line.resultingQuantity ?? 0,
                    quantity: line.quantityDelta ?? 0,
                  })}
                  {line.errorMessageKey
                    ? ` · ${t(`messagekey.${line.errorMessageKey}`)}`
                    : ''}
                </p>
              ))}
              {preview.blockers?.map((blocker) => (
                <p role='alert' key={blocker}>
                  {t(`messagekey.${blocker}`)}
                </p>
              ))}
            </div>
          )}
        </AppDialogBody>
        <AppDialogFooter>
          <Button
            variant='outline'
            className={appDialogCancelButtonClass}
            onClick={onClose}
            disabled={busy}
          >
            {t('common.cancel')}
          </Button>
          <Button
            variant='outline'
            className={appDialogCancelButtonClass}
            onClick={() => void previewOperation()}
            disabled={
              busy ||
              !lines.length ||
              !reason.trim() ||
              (needsWarehouse && !warehouseId) ||
              (action === DocumentAction.CREATE_REPLACEMENT_DELIVERY &&
                !originalDeliveryId)
            }
          >
            {t(
              busy
                ? 'pages.documents.operations.loading'
                : 'pages.documents.operations.preview',
            )}
          </Button>
          <Button
            className={appDialogPrimaryButtonClass}
            onClick={() => void submit()}
            disabled={busy || !preview?.valid}
          >
            {t(
              busy
                ? 'pages.documents.operations.saving'
                : 'pages.documents.operations.confirm',
            )}
          </Button>
        </AppDialogFooter>
      </ThemedDialogContent>
    </Dialog>
  );
}
