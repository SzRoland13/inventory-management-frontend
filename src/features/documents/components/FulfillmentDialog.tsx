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
  AppDialogHeader
} from '@/features/shared/components/AppDialogLayout';
import { ThemedDialogContent } from '@/features/shared/components/ThemedDialogWrapper';
import { convertLineQuantity, lineUnitName, lineUnitOptions } from '@/features/documents/utils/lineUnits';

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
  const [effectiveAt, setEffectiveAt] = useState('');
  const [quantities, setQuantities] = useState<Record<number, string>>(() =>
    Object.fromEntries(
      source.lines.map((line) => [line.id, String(line.remainingQuantity)]),
    ),
  );
  const [unitIds, setUnitIds] = useState<Record<number, number | null>>(() =>
    Object.fromEntries(source.lines.map((line) => [line.id, line.unitId ?? null])),
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
          unitId: unitIds[line.id] ?? undefined,
          quantity: Number(quantities[line.id] ?? 0),
        }))
        .filter((line) => line.quantity > 0),
    [source.lines, quantities, unitIds],
  );
  const signature = JSON.stringify({ warehouseId, type, lines, effectiveAt });
  const selectedWarehouse = warehouses.find(
    (warehouse) => String(warehouse.id) === warehouseId,
  );
  const warehouseRequired = needsWarehouseSelection && !warehouseId;

  async function saveDirectDraftEdits() {
    const targetCurrencyId =
      source.currencyId ?? company.data?.payload.preferredCurrency?.id;
    if (!targetCurrencyId) {
      toast.error(t('pages.documents.validation.currencyUnavailable'));
      return false;
    }
    const resolvedLines = await Promise.all(source.lines.map(async (line) => ({
      line,
      unitId: unitIds[line.id] ?? await resolveUnitId(line),
    })));
    if (resolvedLines.some(({ unitId }) => unitId === null)) {
      toast.error(t('pages.documents.editor.unitUnavailable'));
      return false;
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
          ...(line.sourceUnitPrice === undefined && line.unitPrice === undefined
            ? {}
            : { sourceUnitPrice: line.sourceUnitPrice ?? line.unitPrice }),
        }))
        .filter((line) => line.quantity > 0),
    };
    const updated = await updateDraft.mutateAsync({
      id: source.id,
      request: { version: documentVersion.current, draft },
    });
    documentVersion.current = updated.payload.version;
    return true;
  }

  async function checkStock() {
    if (!lines.length || warehouseRequired || previewing || postingAttempted)
      return;
    const submittedSignature = signature;
    setPreview(null);
    setPreviewSignature('');
    setPreviewing(true);
    try {
      const result = await requireSuccessfulResponse(
        DocumentService.previewFulfillment({
          ...(isDirectDraft
            ? { documentId: source.id }
            : { sourceDocumentId: source.id }),
          type,
          warehouseId: Number(warehouseId || source.warehouseId),
          effectiveAt: effectiveAt || undefined,
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
      if (isDirectDraft && !(await saveDirectDraftEdits())) return;
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
        effectiveAt: effectiveAt || undefined,
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
            <label className='block space-y-2 text-sm text-zinc-300'>
              <span>{t('pages.documents.operations.effectiveAt')}</span>
              <Input type='datetime-local' value={effectiveAt} onChange={(event) => {
                setEffectiveAt(event.target.value);
                setPreview(null);
                setPreviewSignature('');
              }} />
            </label>
            {source.lines.map((line) => (
              <div
                key={line.id}
                className='grid grid-cols-1 items-center gap-4 rounded-xl border border-zinc-700/80 bg-zinc-800/40 p-4 transition-colors hover:border-zinc-600 sm:grid-cols-[minmax(0,1fr)_12rem] sm:gap-6 sm:p-5'
              >
                <div className='min-w-0 space-y-2'>
                  <p className='break-words text-base font-semibold tracking-tight text-zinc-100'>
                    {line.productName}
                  </p>
                  <p className='text-sm leading-relaxed text-zinc-400'>
                    {t('pages.documents.fulfillment.progress', {
                      ordered: line.orderedQuantity,
                      done: line.fulfilledQuantity,
                      remaining: line.remainingQuantity,
                      unit: line.unitName,
                    })}
                  </p>
                  {lineUnitOptions(line).length > 1 && (
                    <Select value={String(unitIds[line.id] ?? line.unitId ?? line.mainUnit?.id)} onValueChange={(value) => {
                      const nextUnitId = Number(value);
                      const previousUnitId = unitIds[line.id] ?? line.unitId;
                      setQuantities((current) => ({ ...current, [line.id]: String(convertLineQuantity(Number(current[line.id] ?? 0), line, previousUnitId, nextUnitId)) }));
                      setUnitIds((current) => ({ ...current, [line.id]: nextUnitId }));
                      setPreview(null);
                      setPreviewSignature('');
                    }} disabled={postingAttempted}>
                      <SelectTrigger className='w-40 border-zinc-600 bg-zinc-900 text-zinc-100'><SelectValue /></SelectTrigger>
                      <SelectContent className='border-zinc-700 bg-zinc-900 text-zinc-100'>{lineUnitOptions(line).map((unit) => <SelectItem key={unit.id} value={String(unit.id)}>{unit.name} · {unit.symbol}</SelectItem>)}</SelectContent>
                    </Select>
                  )}
                </div>
                <label className='block min-w-0'>
                  <span className='mb-2 block text-xs font-medium uppercase tracking-wide text-zinc-400'>
                    {t('pages.documents.fulfillment.quantity')}
                  </span>
                  <Input
                    type='number'
                    min='0'
                    max={convertLineQuantity(line.remainingQuantity, line, line.unitId, unitIds[line.id] ?? line.unitId)}
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
                    className='h-11 border-zinc-600 bg-zinc-950/80 text-right text-base font-semibold tabular-nums shadow-inner shadow-black/20 focus-visible:border-indigo-400 focus-visible:ring-indigo-400/20'
                  />
                  <span className='mt-1 block text-right text-xs text-zinc-400'>{lineUnitName(line, unitIds[line.id] ?? line.unitId)}</span>
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
            variant='mutedOutline' className='h-11 px-5'
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
            variant='accentSolid' className='h-11 px-5'
          >
            {t('pages.documents.fulfillment.post')}
          </Button>
        </AppDialogFooter>
      </ThemedDialogContent>
    </Dialog>
  );
}
