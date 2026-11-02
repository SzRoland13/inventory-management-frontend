'use client';

import { useEffect, useMemo, useState } from 'react';
import { ChevronsUpDown, FileClock, Search } from 'lucide-react';
import { Popover as PopoverPrimitive } from 'radix-ui';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import {
  DocumentAction,
  DocumentCorrectionIntent,
  DocumentCorrectionOperation,
  DocumentType,
} from '@/features/documents/enums/documentEnums';
import type {
  BusinessDocument,
  CorrectionPreviewRequest,
  CorrectionRequest,
  DocumentOperationPreview,
} from '@/features/documents/types/documents';
import {
  useCorrectionPreviewMutation,
  useCorrectPostedDocumentMutation,
} from '@/features/documents/queries/documentQueries';
import { createIdempotencyKey } from '@/features/shared/api/idempotencyKey';
import { useInfiniteProductsQuery } from '@/features/products/queries/productQueries';
import { useWarehousesQuery } from '@/features/warehouses/queries/warehouseQueries';
import {
  WarehouseStatus,
  WarehouseType,
} from '@/features/warehouses/types/warehouse';
import { toastApiError } from '@/features/shared/api/apiResponse';
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
import { ReturnOperationDialog } from '@/features/documents/components/ReturnOperationDialog';

export function DocumentCorrectionDialog({
  document,
  onClose,
  onComplete,
}: {
  document: BusinessDocument;
  onClose: () => void;
  onComplete: () => void;
}) {
  const t = useTranslations();
  const previewMutation = useCorrectionPreviewMutation();
  const correctionMutation = useCorrectPostedDocumentMutation();
  const warehousesQuery = useWarehousesQuery();
  const allWarehouses = warehousesQuery.data?.payload ?? [];
  const warehouses = allWarehouses.filter(
    (warehouse) =>
      warehouse.status === WarehouseStatus.ACTIVE &&
      warehouse.type === WarehouseType.STANDARD,
  );
  const defaultWarehouseId =
    document.type === DocumentType.GOODS_RECEIPT ||
    document.type === DocumentType.TRANSFER_RECEIPT
      ? (document.destinationWarehouseId ?? document.warehouseId)
      : (document.sourceWarehouseId ?? document.warehouseId);
  const [intent, setIntent] = useState<DocumentCorrectionIntent | null>(null);
  const [reason, setReason] = useState('');
  const [quantities, setQuantities] = useState<Record<number, string>>(() =>
    Object.fromEntries(
      document.lines.map((line) => [line.id, String(line.fulfilledQuantity)]),
    ),
  );
  const [correctedProductIds, setCorrectedProductIds] = useState<
    Record<number, string>
  >(() =>
    Object.fromEntries(
      document.lines.map((line) => [line.id, String(line.productId)]),
    ),
  );
  const [correctedProductNames, setCorrectedProductNames] = useState<
    Record<number, string>
  >({});
  const [correctedWarehouseIds, setCorrectedWarehouseIds] = useState<
    Record<number, string>
  >(() =>
    Object.fromEntries(
      document.lines.map((line) => [line.id, String(defaultWarehouseId ?? '')]),
    ),
  );
  const [preview, setPreview] = useState<DocumentOperationPreview | null>(null);
  const [previewKey, setPreviewKey] = useState('');
  const lines = useMemo(
    () =>
      document.lines.map((line) => ({
        sourceLineId: line.id,
        productId: line.productId,
        quantity: Number(quantities[line.id] ?? 0),
        correctedQuantity: Number(quantities[line.id] ?? 0),
        correctedProductId: Number(
          correctedProductIds[line.id] ?? line.productId,
        ),
        ...(correctedWarehouseIds[line.id]
          ? { correctedWarehouseId: Number(correctedWarehouseIds[line.id]) }
          : {}),
      })),
    [document.lines, quantities, correctedProductIds, correctedWarehouseIds],
  );
  const signature = JSON.stringify({
    version: document.version,
    reason,
    lines,
  });
  const busy = previewMutation.isPending || correctionMutation.isPending;
  const currentPreview = preview?.valid && previewKey === signature;

  async function previewCorrection() {
    if (!reason.trim() || busy) return;
    setPreview(null);
    try {
      const request: CorrectionPreviewRequest = {
        version: document.version,
        operation: DocumentCorrectionOperation.CORRECT_RECORDING,
        reason: reason.trim(),
        lines,
      };
      const response = await previewMutation.mutateAsync({
        id: document.id,
        request,
      });
      setPreview(response.payload);
      setPreviewKey(signature);
    } catch (error) {
      toastApiError(t, error);
    }
  }

  async function submitCorrection() {
    if (!currentPreview || !reason.trim() || busy) return;
    try {
      await correctionMutation.mutateAsync({
        id: document.id,
        request: {
          version: document.version,
          operation: DocumentCorrectionOperation.CORRECT_RECORDING,
          reason: reason.trim(),
          idempotencyKey: createIdempotencyKey(),
          lines,
        },
      });
      toast.success(t('pages.documents.operations.correctionSaved'));
      onComplete();
    } catch (error) {
      toastApiError(t, error);
    }
  }

  if (intent === DocumentCorrectionIntent.PHYSICAL_RETURN)
    return (
      <ReturnOperationDialog
        document={document}
        action={DocumentAction.CREATE_RETURN}
        onClose={onClose}
        onComplete={onComplete}
      />
    );
  return (
    <Dialog open onOpenChange={(open) => !open && !busy && onClose()}>
      <ThemedDialogContent className='!max-w-3xl'>
        <AppDialogHeader
          title={t('pages.documents.actions.CORRECT')}
          description={t('pages.documents.operations.correctionDescription', {
            number: document.number ?? document.id,
          })}
          icon={FileClock}
        />
        <AppDialogBody className='space-y-4'>
          {!intent ? (
            <div className='grid gap-3 sm:grid-cols-2'>
              <button
                type='button'
                onClick={() =>
                  setIntent(DocumentCorrectionIntent.RECORDING_ERROR)
                }
                className='rounded-xl border border-zinc-700 bg-zinc-900 p-4 text-left hover:border-indigo-400'
              >
                <span className='block text-sm font-semibold'>
                  {t('pages.documents.operations.recordingError')}
                </span>
                <span className='mt-1 block text-xs text-zinc-400'>
                  {t('pages.documents.operations.recordingErrorDescription')}
                </span>
              </button>
              <button
                type='button'
                onClick={() =>
                  setIntent(DocumentCorrectionIntent.PHYSICAL_RETURN)
                }
                className='rounded-xl border border-zinc-700 bg-zinc-900 p-4 text-left hover:border-indigo-400'
              >
                <span className='block text-sm font-semibold'>
                  {t('pages.documents.operations.physicalReturn')}
                </span>
                <span className='mt-1 block text-xs text-zinc-400'>
                  {t('pages.documents.operations.physicalReturnDescription')}
                </span>
              </button>
            </div>
          ) : (
            <>
              <div className='rounded-lg border border-zinc-700 bg-zinc-900/60 p-3 text-sm text-zinc-300'>
                {t('pages.documents.operations.originalWillStay')}
              </div>
              {document.lines.map((line) => (
                <div
                  key={line.id}
                  className='grid grid-cols-1 gap-4 rounded-lg border border-zinc-700 bg-zinc-900/60 p-4 sm:grid-cols-[minmax(0,1fr)_9rem]'
                >
                  <div className='min-w-0 space-y-3'>
                    <div>
                      <p className='truncate text-sm font-medium'>
                        {line.productName}
                      </p>
                      <p className='text-xs text-zinc-400'>
                        {t('pages.documents.operations.correctionProgress', {
                          original: line.orderedQuantity,
                          fulfilled: line.fulfilledQuantity,
                          closed: line.closedQuantity ?? 0,
                          returned: line.returnedQuantity ?? 0,
                          remaining: line.remainingQuantity,
                        })}
                      </p>
                    </div>
                    <div className='grid gap-3 sm:grid-cols-2'>
                      <div className='space-y-1.5'>
                        <Label>
                          {t('pages.documents.operations.correctedProduct')}
                        </Label>
                        <CorrectedProductPicker
                          productId={Number(
                            correctedProductIds[line.id] ?? line.productId,
                          )}
                          productName={
                            correctedProductNames[line.id] ?? line.productName
                          }
                          onSelect={(product) => {
                            setCorrectedProductIds((current) => ({
                              ...current,
                              [line.id]: String(product.id),
                            }));
                            setCorrectedProductNames((current) => ({
                              ...current,
                              [line.id]: product.name,
                            }));
                            setPreview(null);
                          }}
                        />
                      </div>
                      <div className='space-y-1.5'>
                        <Label>
                          {t('pages.documents.operations.correctedWarehouse')}
                        </Label>
                        <Select
                          value={correctedWarehouseIds[line.id] ?? ''}
                          onValueChange={(value) => {
                            setCorrectedWarehouseIds((current) => ({
                              ...current,
                              [line.id]: value,
                            }));
                            setPreview(null);
                          }}
                        >
                          <SelectTrigger className='w-full border-zinc-600 bg-zinc-900 text-zinc-100'>
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
                                  warehouse.id ===
                                    Number(correctedWarehouseIds[line.id]) &&
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
                              <SelectItem
                                key={warehouse.id}
                                value={String(warehouse.id)}
                              >
                                {warehouse.name} · {warehouse.code}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                  <div className='space-y-1.5 sm:self-end'>
                    <Label>
                      {t('pages.documents.operations.correctedQuantity')}
                    </Label>
                    <Input
                      aria-label={`${line.productName} ${t('pages.documents.operations.correctedQuantity')}`}
                      type='number'
                      min='0'
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
                </div>
              ))}
              <div className='space-y-2'>
                <Label htmlFor='correction-reason'>
                  {t('pages.documents.operations.reason')}
                </Label>
                <textarea
                  id='correction-reason'
                  maxLength={500}
                  value={reason}
                  onChange={(event) => {
                    setReason(event.target.value);
                    setPreview(null);
                  }}
                  className='min-h-20 w-full rounded-md border border-zinc-600 bg-zinc-900 px-3 py-2 text-sm text-zinc-100'
                />
              </div>
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
                      {correctedProductNames[line.sourceLineId] ??
                        document.lines.find(
                          (source) => source.id === line.sourceLineId,
                        )?.productName ??
                        line.productName}:{' '}
                      {t('pages.documents.operations.correctionEffect', {
                        original: line.originalQuantity ?? 0,
                        corrected: line.correctedQuantity ?? 0,
                        fulfilled: line.correctedFulfilledQuantity ?? 0,
                        closed: line.closedQuantity ?? 0,
                        remaining: line.remainingQuantity ?? 0,
                        delta: line.quantityDelta ?? 0,
                      })}
                      {line.targetWarehouseId != null && (
                        <span>
                          {' · '}
                          {t('pages.documents.operations.targetWarehouseResult', {
                            warehouse:
                              allWarehouses.find(
                                (warehouse) =>
                                  warehouse.id === line.targetWarehouseId,
                              )?.name ?? `#${line.targetWarehouseId}`,
                          })}
                        </span>
                      )}
                      {line.errorMessageKey
                        ? ` · ${t(`messagekey.${line.errorMessageKey}`)}`
                        : ''}
                    </p>
                  ))}
                  {preview.relatedMovements?.map((movement, index) => (
                    <p
                      key={`${movement.effectiveAt}-${index}`}
                      className='mt-2 text-zinc-300'
                    >
                      {movement.description} · {movement.quantity} ·{' '}
                      {movement.effectiveAt}
                    </p>
                  ))}
                  {preview.relatedReturns?.map((item) => (
                    <p key={item.id} className='mt-2 text-zinc-300'>
                      {t('pages.documents.operations.relatedReturn', {
                        number: item.number ?? item.id,
                        quantity: item.quantity,
                      })}
                    </p>
                  ))}
                  {preview.blockers?.map((blocker) => (
                    <p role='alert' key={blocker}>
                      {t(`messagekey.${blocker}`)}
                    </p>
                  ))}
                </div>
              )}
            </>
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
          {intent === DocumentCorrectionIntent.RECORDING_ERROR && (
            <>
              <Button
                variant='outline'
                className={appDialogCancelButtonClass}
                onClick={() => void previewCorrection()}
                disabled={busy || !reason.trim()}
              >
                {t(
                  busy
                    ? 'pages.documents.operations.loading'
                    : 'pages.documents.operations.preview',
                )}
              </Button>
              <Button
                className={appDialogPrimaryButtonClass}
                onClick={() => void submitCorrection()}
                disabled={busy || !currentPreview}
              >
                {t(
                  busy
                    ? 'pages.documents.operations.saving'
                    : 'pages.documents.operations.confirm',
                )}
              </Button>
            </>
          )}
        </AppDialogFooter>
      </ThemedDialogContent>
    </Dialog>
  );
}

function CorrectedProductPicker({
  productId,
  productName,
  onSelect,
}: {
  productId: number;
  productName: string;
  onSelect: (product: { id: number; name: string }) => void;
}) {
  const t = useTranslations();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const productsQuery = useInfiniteProductsQuery(debouncedSearch, open);
  const products =
    productsQuery.data?.pages.flatMap((page) => page.content) ?? [];

  useEffect(() => {
    const timeout = window.setTimeout(
      () => setDebouncedSearch(search.trim()),
      250,
    );
    return () => window.clearTimeout(timeout);
  }, [search]);

  function closePicker(nextOpen: boolean) {
    setOpen(nextOpen);
    if (!nextOpen) {
      setSearch('');
      setDebouncedSearch('');
    }
  }

  function loadMoreProducts() {
    if (productsQuery.hasNextPage && !productsQuery.isFetchingNextPage) {
      void productsQuery.fetchNextPage();
    }
  }

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={closePicker}>
      <PopoverPrimitive.Trigger asChild>
        <Button
          type='button'
          role='combobox'
          aria-haspopup='listbox'
          aria-expanded={open}
          className='w-full justify-between gap-2 border border-zinc-600 bg-zinc-900 text-left font-normal text-zinc-100 hover:bg-zinc-800'
        >
          <span className='truncate'>{productName}</span>
          <ChevronsUpDown className='h-4 w-4 shrink-0 opacity-50' />
        </Button>
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          side='bottom'
          align='start'
          sideOffset={4}
          avoidCollisions={false}
          className='z-50 w-[var(--radix-popover-trigger-width)] overflow-hidden rounded-md border border-zinc-700 bg-zinc-900 p-0 shadow-xl outline-none'
        >
          <div className='relative border-b border-zinc-700'>
            <Search className='pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500' />
            <Input
              autoFocus
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t('pages.documents.create.searchProducts')}
              className='h-10 rounded-none border-0 bg-transparent pl-9 text-zinc-100 focus-visible:ring-0'
            />
          </div>
          <div
            role='listbox'
            aria-label={t('pages.documents.operations.correctedProduct')}
            className='max-h-64 overflow-y-auto p-1'
          >
            {products.map((product) => (
              <button
                key={product.id}
                type='button'
                role='option'
                aria-selected={product.id === productId}
                onClick={() => {
                  onSelect({ id: product.id, name: product.name });
                  closePicker(false);
                }}
                className='flex w-full items-center justify-between rounded-sm px-2 py-2 text-left text-sm text-zinc-100 outline-none hover:bg-zinc-800 focus:bg-zinc-800'
              >
                <span className='min-w-0'>
                  <span className='block truncate'>{product.name}</span>
                  <span className='block truncate text-xs text-zinc-400'>
                    {product.sku}
                  </span>
                </span>
                {product.id === productId && (
                  <span className='ml-3 text-xs text-indigo-300'>
                    {t('pages.documents.create.added')}
                  </span>
                )}
              </button>
            ))}
            {productsQuery.isPending && (
              <p role='status' className='px-3 py-4 text-center text-sm text-zinc-400'>
                {t('pages.documents.create.loadingProducts')}
              </p>
            )}
            {!productsQuery.isPending &&
              !productsQuery.isError &&
              products.length === 0 && (
                <p className='px-3 py-4 text-center text-sm text-zinc-400'>
                  {t('pages.documents.create.noProducts')}
                </p>
              )}
            {productsQuery.isError && (
              <div className='flex items-center justify-between gap-3 px-3 py-3 text-xs text-rose-300'>
                <span>{t('pages.documents.create.productOptionsError')}</span>
                <Button
                  type='button'
                  size='sm'
                  variant='outline'
                  onClick={() => void productsQuery.refetch()}
                  className='border-zinc-600 bg-zinc-800'
                >
                  {t('common.retry')}
                </Button>
              </div>
            )}
            {productsQuery.hasNextPage && (
              <Button
                type='button'
                variant='ghost'
                onClick={loadMoreProducts}
                disabled={productsQuery.isFetchingNextPage}
                className='w-full text-xs text-zinc-300 hover:bg-zinc-800'
              >
                {t(
                  productsQuery.isFetchingNextPage
                    ? 'pages.documents.create.loadingMoreProducts'
                    : 'pages.documents.create.loadMoreProducts',
                )}
              </Button>
            )}
          </div>
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}
