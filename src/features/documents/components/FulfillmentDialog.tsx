'use client';

import { useMemo, useRef, useState } from 'react';
import { ClipboardCheck } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { DocumentType } from '@/features/documents/enums/documentEnums';
import type {
  BusinessDocument,
  DocumentDraftRequest,
  FulfillmentPreviewResponse,
} from '@/features/documents/types/documents';
import { DocumentService } from '@/features/documents/services/DocumentService';
import { useDocumentLineUnitResolver } from '@/features/documents/hooks/useDocumentLineUnitResolver';
import {
  useCreateFulfillmentDraftMutation,
  usePostFulfillmentMutation,
  useUpdateDocumentDraftMutation,
} from '@/features/documents/queries/documentQueries';
import { useWarehousesQuery } from '@/features/warehouses/queries/warehouseQueries';
import { useExtendedCompanyQuery } from '@/features/settings/queries/companyQueries';
import {
  WarehouseStatus,
  WarehouseType,
} from '@/features/warehouses/types/warehouse';
import {
  requireSuccessfulResponse,
  toastApiError,
} from '@/features/shared/api/apiResponse';
import { createIdempotencyKey } from '@/features/shared/api/idempotencyKey';
import { Button } from '@/features/shared/components/ui/button';
import { Dialog } from '@/features/shared/components/ui/dialog';
import { Input } from '@/features/shared/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/features/shared/components/ui/select';
import {
  AppDialogBody,
  AppDialogFooter,
  AppDialogHeader,
  appDialogCancelButtonClass,
  appDialogPrimaryButtonClass,
} from '@/features/shared/components/AppDialogLayout';
import { ThemedDialogContent } from '@/features/shared/components/ThemedDialogWrapper';

type Props = {
  source: BusinessDocument;
  onClose: () => void;
  onComplete: () => void;
};

export function FulfillmentDialog({ source, onClose, onComplete }: Props) {
  const t = useTranslations();
  const isDirectDraft =
    source.type === DocumentType.GOODS_RECEIPT ||
    source.type === DocumentType.DELIVERY_NOTE;
  const type =
    source.type === DocumentType.GOODS_RECEIPT ||
    source.type === DocumentType.PURCHASE_ORDER
      ? DocumentType.GOODS_RECEIPT
      : DocumentType.DELIVERY_NOTE;
  const needsWarehouseSelection = !source.warehouseId;
  const warehousesQuery = useWarehousesQuery(needsWarehouseSelection);
  const company = useExtendedCompanyQuery();
  const warehouses = (warehousesQuery.data?.payload ?? []).filter(
    (warehouse) =>
      warehouse.status === WarehouseStatus.ACTIVE &&
      warehouse.type === WarehouseType.STANDARD,
  );
  const [warehouseId, setWarehouseId] = useState(
    source.warehouseId ? String(source.warehouseId) : '',
  );
  const [quantities, setQuantities] = useState<Record<number, string>>(() =>
    Object.fromEntries(
      source.lines.map((line) => [line.id, String(line.remainingQuantity)]),
    ),
  );
  const [preview, setPreview] = useState<FulfillmentPreviewResponse | null>(
    null,
  );
  const [previewSignature, setPreviewSignature] = useState('');
  const [previewing, setPreviewing] = useState(false);
  const [postingAttempted, setPostingAttempted] = useState(false);
  const createdDraftId = useRef<number | null>(
    isDirectDraft ? source.id : null,
  );
  const documentVersion = useRef(source.version);
  const idempotencyKey = useRef<string | null>(null);
  const directVersion = useRef(source.version);
  const createDraft = useCreateFulfillmentDraftMutation();
  const updateDraft = useUpdateDocumentDraftMutation();
  const post = usePostFulfillmentMutation();
  const resolveUnitId = useDocumentLineUnitResolver();
  const lines = useMemo(
    () =>
      source.lines
        .map((line) => ({
          sourceLineId: line.id,
          productId: line.productId,
          quantity: Number(quantities[line.id] ?? 0),
        }))
        .filter((line) => line.quantity > 0),
    [source.lines, quantities],
  );
  const signature = JSON.stringify({ warehouseId, type, lines });
  const selectedWarehouse = warehouses.find(
    (warehouse) => String(warehouse.id) === warehouseId,
  );
  const warehouseRequired = needsWarehouseSelection && !warehouseId;

  async function checkStock() {
    if (!lines.length || warehouseRequired || previewing || postingAttempted)
      return;
    const submittedSignature = signature;
    setPreview(null);
    setPreviewSignature('');
    setPreviewing(true);
    try {
      if (isDirectDraft) {
        const targetCurrencyId =
          source.currencyId ?? company.data?.payload.preferredCurrency?.id;
        if (!targetCurrencyId) {
          toast.error(t('pages.documents.validation.currencyUnavailable'));
          return;
        }
        const resolvedLines = await Promise.all(
          source.lines.map(async (line) => ({
            line,
            unitId: await resolveUnitId(line),
          })),
        );
        if (resolvedLines.some(({ unitId }) => unitId === null)) {
          toast.error(t('pages.documents.editor.unitUnavailable'));
          return;
        }
        const draft: DocumentDraftRequest = {
          type: source.type as DocumentDraftRequest['type'],
          currencyId: targetCurrencyId,
          exchangeRates: source.exchangeRates ?? [],
          partnerId: source.partnerId ?? undefined,
          warehouseId: Number(warehouseId || source.warehouseId),
          date: source.date,
          notes: source.notes ?? undefined,
          lines: resolvedLines
            .map(({ line, unitId }) => ({
              productId: line.productId,
              unitId: unitId!,
              quantity: Number(quantities[line.id] ?? 0),
              ...(line.sourceUnitPrice === undefined &&
              line.unitPrice === undefined
                ? {}
                : { sourceUnitPrice: line.sourceUnitPrice ?? line.unitPrice }),
            }))
            .filter((line) => line.quantity > 0),
        };
        const updated = await updateDraft.mutateAsync({
          id: source.id,
          request: { version: directVersion.current, draft },
        });
        directVersion.current = updated.payload.version;
        documentVersion.current = updated.payload.version;
      }
      const result = await requireSuccessfulResponse(
        DocumentService.previewFulfillment({
          ...(isDirectDraft
            ? { documentId: source.id }
            : { sourceDocumentId: source.id }),
          type,
          warehouseId: Number(warehouseId || source.warehouseId),
          lines,
        }),
      );
      setPreview(result.payload);
      setPreviewSignature(submittedSignature);
    } catch (error) {
      toastApiError(t, error);
    } finally {
      setPreviewing(false);
    }
  }

  async function submit() {
    if (
      !preview?.valid ||
      previewSignature !== signature ||
      !lines.length ||
      warehouseRequired
    )
      return;
    setPostingAttempted(true);
    try {
      let draftId = createdDraftId.current;
      if (draftId === null) {
        const created = await createDraft.mutateAsync({
          sourceDocumentId: source.id,
          type,
          warehouseId: Number(warehouseId),
          lines: lines.map(({ sourceLineId, ...line }) => ({
            sourceLineId,
            ...line,
          })),
        });
        draftId = created.payload.id;
        createdDraftId.current = draftId;
        documentVersion.current = created.payload.version;
      }
      idempotencyKey.current ??= createIdempotencyKey();
      await post.mutateAsync({
        id: draftId,
        sourceId: source.id,
        version: documentVersion.current,
        idempotencyKey: idempotencyKey.current,
      });
      toast.success(t('pages.documents.fulfillment.posted'));
      onComplete();
    } catch (error) {
      toastApiError(t, error);
    }
  }

  const busy =
    previewing ||
    updateDraft.isPending ||
    createDraft.isPending ||
    post.isPending;
  const previewIsCurrent = !!preview && previewSignature === signature;

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <ThemedDialogContent className='!max-w-2xl'>
        <AppDialogHeader
          title={t(`pages.documents.fulfillment.title.${type}`)}
          description={t('pages.documents.fulfillment.description', {
            number: source.number || t('pages.documents.draft'),
          })}
          icon={ClipboardCheck}
        />
        <AppDialogBody className='space-y-4'>
          {needsWarehouseSelection && (
            <div className='space-y-2'>
              <label className='text-sm text-zinc-300'>
                {t('pages.documents.create.warehouse')}
              </label>
              <Select
                value={warehouseId}
                onValueChange={(value) => {
                  setWarehouseId(value);
                  setPreview(null);
                  setPreviewSignature('');
                }}
                disabled={postingAttempted}
              >
                <SelectTrigger className='border-zinc-600 bg-zinc-800 text-zinc-100'>
                  <SelectValue
                    placeholder={t('pages.documents.create.selectWarehouse')}
                  />
                </SelectTrigger>
                <SelectContent className='border-zinc-700 bg-zinc-800 text-zinc-100'>
                  {warehouses.map((warehouse) => (
                    <SelectItem key={warehouse.id} value={String(warehouse.id)}>
                      {warehouse.name} · {warehouse.code}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {warehousesQuery.isError && (
                <p role='alert' className='text-xs text-rose-300'>
                  {t('pages.documents.create.optionsError')}
                </p>
              )}
            </div>
          )}
          <div className='space-y-3'>
            {source.lines.map((line) => (
              <div
                key={line.id}
                className='grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 rounded-lg border border-zinc-700 bg-zinc-800/50 p-3'
              >
                <div className='min-w-0'>
                  <p className='truncate text-sm font-medium'>
                    {line.productName}
                  </p>
                  <p className='mt-1 text-xs text-zinc-400'>
                    {t('pages.documents.fulfillment.progress', {
                      ordered: line.orderedQuantity,
                      done: line.fulfilledQuantity,
                      remaining: line.remainingQuantity,
                      unit: line.unitName,
                    })}
                  </p>
                </div>
                <label className='w-28'>
                  <span className='mb-1 block text-xs text-zinc-400'>
                    {t('pages.documents.fulfillment.quantity')}
                  </span>
                  <Input
                    type='number'
                    min='0'
                    max={line.remainingQuantity}
                    step='any'
                    value={quantities[line.id] ?? '0'}
                    disabled={postingAttempted}
                    onChange={(event) => {
                      setQuantities((current) => ({
                        ...current,
                        [line.id]: event.target.value,
                      }));
                      setPreview(null);
                      setPreviewSignature('');
                    }}
                    className='border-zinc-600 bg-zinc-950 text-right tabular-nums'
                  />
                </label>
              </div>
            ))}
          </div>
          {previewIsCurrent && preview && (
            <div
              className={`rounded-lg border p-3 text-sm ${preview.valid ? 'border-emerald-500/30 bg-emerald-500/5 text-emerald-200' : 'border-rose-500/30 bg-rose-500/5 text-rose-200'}`}
            >
              <p className='font-medium'>
                {t(
                  preview.valid
                    ? 'pages.documents.fulfillment.previewValid'
                    : 'pages.documents.fulfillment.previewInvalid',
                )}
              </p>
              {preview.lines.map((line) => {
                const submittedLine = lines.find(
                  (item) => item.sourceLineId === line.sourceLineId,
                );
                const delta =
                  line.quantityDelta ??
                  (submittedLine
                    ? submittedLine.quantity *
                      (type === DocumentType.GOODS_RECEIPT ? 1 : -1)
                    : 0);
                return (
                  <p key={line.sourceLineId} className='mt-2'>
                    {line.productName} ·{' '}
                    {line.warehouseName ?? selectedWarehouse?.name ?? ''}:{' '}
                    {line.errorMessageKey
                      ? t(`messagekey.${line.errorMessageKey}`)
                      : line.shortfall
                        ? t('pages.documents.fulfillment.shortfall', {
                            warehouse:
                              line.warehouseName ??
                              selectedWarehouse?.name ??
                              '',
                            available: line.availableQuantity ?? 0,
                            shortfall: line.shortfall,
                          })
                        : `${delta > 0 ? '+' : ''}${delta}${line.resultingQuantity === undefined ? '' : ` · ${t('pages.documents.fulfillment.resultingQuantity', { quantity: line.resultingQuantity })}`}`}
                  </p>
                );
              })}
            </div>
          )}
        </AppDialogBody>
        <AppDialogFooter className='gap-2 sm:gap-2'>
          <Button
            variant='outline'
            className={appDialogCancelButtonClass}
            disabled={
              busy || postingAttempted || warehouseRequired || !lines.length
            }
            onClick={() => void checkStock()}
          >
            {previewing
              ? t('pages.documents.fulfillment.checking')
              : t('pages.documents.fulfillment.preview')}
          </Button>
          <Button
            disabled={
              busy ||
              (postingAttempted && post.isPending) ||
              !previewIsCurrent ||
              !preview?.valid ||
              !lines.length ||
              warehouseRequired
            }
            onClick={() => void submit()}
            className={appDialogPrimaryButtonClass}
          >
            {t('pages.documents.fulfillment.post')}
          </Button>
        </AppDialogFooter>
      </ThemedDialogContent>
    </Dialog>
  );
}
