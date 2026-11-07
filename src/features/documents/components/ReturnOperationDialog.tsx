'use client';

import { useMemo, useRef, useState } from 'react';
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
  ReplacementDeliveryMutationRequest,
  ReplacementDeliveryRequest,
  ReturnMutationRequest,
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
import { convertLineQuantity, lineUnitName, lineUnitOptions } from '@/features/documents/utils/lineUnits';

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
  const allWarehouses = warehousesQuery.data?.payload ?? [];
  const warehouses = allWarehouses.filter(
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
  const submissionKeysRef = useRef(new Map<string, string>());
  const returnDirection =
    document.type === DocumentType.GOODS_RECEIPT
      ? ReturnDirection.SUPPLIER_RETURN
      : ReturnDirection.CUSTOMER_RETURN;
  const customerReturn =
    action === DocumentAction.CREATE_RETURN &&
    returnDirection === ReturnDirection.CUSTOMER_RETURN;
  const defaultDisposition =
    returnDirection === ReturnDirection.SUPPLIER_RETURN
      ? ReturnDisposition.SUPPLIER_RETURN
      : ReturnDisposition.RESTOCK;
  const availableDispositions =
    returnDirection === ReturnDirection.SUPPLIER_RETURN
      ? [ReturnDisposition.SUPPLIER_RETURN]
      : [
          ReturnDisposition.RESTOCK,
          ReturnDisposition.QUARANTINE,
          ReturnDisposition.DAMAGED,
        ];
  const [reason, setReason] = useState('');
  const [effectiveAt, setEffectiveAt] = useState('');
  const [replacementDate] = useState(() =>
    new Date().toISOString().slice(0, 10),
  );
  const [warehouseId, setWarehouseId] = useState(
    String(document.warehouseId ?? document.sourceWarehouseId ?? ''),
  );
  const [dispositions, setDispositions] = useState<
    Record<number, ReturnDisposition>
  >({});
  const [unitIds, setUnitIds] = useState<Record<number, number | null>>(() =>
    Object.fromEntries(document.lines.map((line) => [line.id, line.unitId ?? null])),
  );
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
        )?.id;
  const lines = useMemo(
    () =>
      document.lines
        .map((line) => ({
          sourceLineId: line.id,
          productId: line.productId,
          unitId: unitIds[line.id] ?? undefined,
          quantity: Number(quantities[line.id] ?? 0),
          reason: reason.trim(),
          ...(action === DocumentAction.CREATE_RETURN
            ? {
                disposition: dispositions[line.id] ?? defaultDisposition,
              }
            : {}),
        }))
        .filter((line) => line.quantity > 0),
    [
      document.lines,
      quantities,
      reason,
      action,
      dispositions,
      unitIds,
      defaultDisposition,
    ],
  );
  const busy =
    createReturn.isPending ||
    previewReturn.isPending ||
    releaseStock.isPending ||
    previewRelease.isPending ||
    createReplacement.isPending ||
    previewReplacement.isPending;

  function getSubmissionKey(signature: string) {
    const existing = submissionKeysRef.current.get(signature);
    if (existing) return existing;
    const key = createIdempotencyKey();
    submissionKeysRef.current.set(signature, key);
    return key;
  }

  async function previewOperation() {
    if (!lines.length || !reason.trim() || (customerReturn && !warehouseId))
      return;
    setPreview(null);
    try {
      let response;
      if (action === DocumentAction.CREATE_RETURN) {
        const request: ReturnRequest = {
          sourceDocumentId: document.id,
          direction: returnDirection,
          reason: reason.trim(),
          effectiveAt: effectiveAt || undefined,
          ...(customerReturn && warehouseId
            ? { warehouseId: Number(warehouseId) }
            : {}),
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
          date: replacementDate,
          nonBillable: true,
          effectiveAt: effectiveAt || undefined,
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
        const request: ReturnRequest = {
          sourceDocumentId: document.id,
          direction: returnDirection,
          reason: reason.trim(),
          effectiveAt: effectiveAt || undefined,
          ...(customerReturn && warehouseId
            ? { warehouseId: Number(warehouseId) }
            : {}),
          lines,
        };
        const mutationRequest: ReturnMutationRequest = {
          ...request,
          idempotencyKey: getSubmissionKey(JSON.stringify(request)),
        };
        await createReturn.mutateAsync(mutationRequest);
      } else if (action === DocumentAction.RELEASE_QUARANTINE) {
        await releaseStock.mutateAsync({
          id: document.id,
          request: {
            version: document.version,
            idempotencyKey: createIdempotencyKey(),
            targetWarehouseId: Number(warehouseId),
            reason: reason.trim(),
            effectiveAt: effectiveAt || undefined,
            lines,
          },
        });
      } else {
        if (!originalDeliveryId) return;
        const request: ReplacementDeliveryRequest = {
          returnDocumentId: document.id,
          originalDeliveryId,
          warehouseId: Number(warehouseId),
          date: replacementDate,
          nonBillable: true,
          effectiveAt: effectiveAt || undefined,
          lines,
        };
        const mutationRequest: ReplacementDeliveryMutationRequest = {
          ...request,
          idempotencyKey: getSubmissionKey(JSON.stringify(request)),
        };
        await createReplacement.mutateAsync(mutationRequest);
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
            number: document.number ?? t('pages.documents.draft'),
          })}
          icon={RotateCcw}
        />
        <AppDialogBody className='space-y-4'>
          {(needsWarehouse || customerReturn) && (
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
                  {allWarehouses
                    .filter(
                      (warehouse) =>
                        warehouse.id === Number(warehouseId) &&
                        !warehouses.some(
                          (active) => active.id === warehouse.id,
                        ),
                    )
                    .map((warehouse) => (
                      <SelectItem
                        key={warehouse.id}
                        value={String(warehouse.id)}
                        disabled
                      >
                        {warehouse.name} · {warehouse.code}
                      </SelectItem>
                    ))}
                  {warehouses.map((warehouse) => (
                    <SelectItem key={warehouse.id} value={String(warehouse.id)}>
                      {warehouse.name} · {warehouse.code}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          {action === DocumentAction.CREATE_RETURN && (
            <p className='rounded-lg border border-zinc-700 bg-zinc-900/60 px-3 py-2 text-sm text-zinc-300'>
              {t('pages.documents.operations.returnDirection', {
                direction: t(
                  `pages.documents.operations.direction.${returnDirection}`,
                ),
              })}
            </p>
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
                  {lineUnitOptions(line).length > 1 && (
                    <Select
                      value={String(unitIds[line.id] ?? line.unitId ?? line.mainUnit?.id)}
                      onValueChange={(value) => {
                        const nextUnitId = Number(value);
                        const previousUnitId = unitIds[line.id] ?? line.unitId;
                        setQuantities((current) => ({
                          ...current,
                          [line.id]: String(convertLineQuantity(Number(current[line.id] ?? 0), line, previousUnitId, nextUnitId)),
                        }));
                        setUnitIds((current) => ({ ...current, [line.id]: nextUnitId }));
                        setPreview(null);
                      }}
                    >
                      <SelectTrigger className='mt-2 w-40 border-zinc-600 bg-zinc-900 text-zinc-100'><SelectValue /></SelectTrigger>
                      <SelectContent className='border-zinc-700 bg-zinc-900 text-zinc-100'>
                        {lineUnitOptions(line).map((unit) => <SelectItem key={unit.id} value={String(unit.id)}>{unit.name} · {unit.symbol}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  )}
                  {action === DocumentAction.CREATE_RETURN && (
                    <Select
                      value={dispositions[line.id] ?? defaultDisposition}
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
                        {availableDispositions.map((value) => (
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
                      ? convertLineQuantity(line.returnableQuantity ?? line.remainingQuantity, line, line.unitId, unitIds[line.id] ?? line.unitId)
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
                <span className='text-xs text-zinc-400'>{lineUnitName(line, unitIds[line.id] ?? line.unitId)}</span>
              </div>
            ))}
          </div>
          <div className='space-y-2'>
            <Label htmlFor='movement-effective-at'>
              {t('pages.documents.operations.effectiveAt')}
            </Label>
            <Input id='movement-effective-at' type='datetime-local' value={effectiveAt} onChange={(event) => {
              setEffectiveAt(event.target.value);
              setPreview(null);
            }} />
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
                  {line.targetWarehouseId != null && (
                    <span>
                      {' · '}
                      {t('pages.documents.operations.targetWarehouseResult', {
                        warehouse:
                          allWarehouses.find(
                            (item) => item.id === line.targetWarehouseId,
                          )?.name ?? `#${line.targetWarehouseId}`,
                      })}
                    </span>
                  )}
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
              (customerReturn && !warehouseId) ||
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
