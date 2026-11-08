'use client';

import { useMemo, useState } from 'react';
import { ClipboardList } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import {
  useAddStockCountItemsMutation,
  usePostStockCountMutation,
  useStockCountPreviewMutation,
} from '@/features/documents/queries/documentQueries';
import type {
  BusinessDocument,
  DocumentOperationPreview,
} from '@/features/documents/types/documents';
import { createIdempotencyKey } from '@/features/shared/api/idempotencyKey';
import { toastApiError } from '@/features/shared/api/apiResponse';
import { Button } from '@/features/shared/components/ui/button';
import { Input } from '@/features/shared/components/ui/input';
import { Label } from '@/features/shared/components/ui/label';
import { Dialog } from '@/features/shared/components/ui/dialog';
import {
  AppDialogBody,
  AppDialogFooter,
  AppDialogHeader
} from '@/features/shared/components/AppDialogLayout';
import { ThemedDialogContent } from '@/features/shared/components/ThemedDialogWrapper';
import { convertLineQuantity, lineUnitName, lineUnitOptions } from '@/features/documents/utils/lineUnits';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/features/shared/components/ui/select';
import { useInfiniteProductsQuery } from '@/features/products/queries/productQueries';
import { ScrollArea } from '@/features/shared/components/ui/scroll-area';

export function StockCountReconciliationDialog({
  document,
  onClose,
  onComplete,
}: {
  document: BusinessDocument;
  onClose: () => void;
  onComplete: () => void;
}) {
  const t = useTranslations();
  const previewMutation = useStockCountPreviewMutation();
  const postMutation = usePostStockCountMutation();
  const addItemsMutation = useAddStockCountItemsMutation();
  const [countLines, setCountLines] = useState(document.lines);
  const [version, setVersion] = useState(document.version);
  const [productSearch, setProductSearch] = useState('');
  const productsQuery = useInfiniteProductsQuery(productSearch, true);
  const products = useMemo(
    () => productsQuery.data?.pages.flatMap((page) => page.content) ?? [],
    [productsQuery.data?.pages],
  );
  const [quantities, setQuantities] = useState<Record<number, string>>(() =>
    Object.fromEntries(
      document.lines.map((line) => [
        line.id,
        String(line.countedQuantity ?? 0),
      ]),
    ),
  );
  const [reasons, setReasons] = useState<Record<number, string>>({});
  const [unitIds, setUnitIds] = useState<Record<number, number | null>>(() =>
    Object.fromEntries(document.lines.map((line) => [line.id, line.unitId ?? null])),
  );
  const [preview, setPreview] = useState<DocumentOperationPreview | null>(null);
  const [previewKey, setPreviewKey] = useState('');
  const lines = useMemo(
    () =>
      countLines
        .map((line) => ({
          sourceLineId: line.id,
          productId: line.productId,
          unitId: unitIds[line.id] ?? undefined,
          countedQuantity: Number(quantities[line.id]),
          varianceReason: reasons[line.id] || undefined,
        }))
        .filter((line) => line.countedQuantity >= 0),
    [countLines, quantities, reasons, unitIds],
  );
  const countedAt = document.countedAt ?? document.date;
  const signature = JSON.stringify({
    version,
    countedAt,
    lines,
  });
  const previewIsCurrent = Boolean(preview?.valid && previewKey === signature);
  const allQuantitiesEntered = countLines.length > 0 && countLines.every((line) => {
    const value = quantities[line.id]?.trim();
    return value !== undefined && value !== '' && Number.isFinite(Number(value)) && Number(value) >= 0;
  });
  const busy = previewMutation.isPending || postMutation.isPending || addItemsMutation.isPending;

  async function addProduct(productId: number) {
    if (busy) return;
    try {
      const response = await addItemsMutation.mutateAsync({
        id: document.id,
        request: { version, productIds: [productId] },
      });
      const updated = response.payload;
      setCountLines(updated.lines);
      setVersion(updated.version);
      setQuantities((current) => ({
        ...Object.fromEntries(
          updated.lines.map((line) => [
            line.id,
            current[line.id] ?? String(line.countedQuantity ?? 0),
          ]),
        ),
      }));
      setUnitIds((current) => ({
        ...Object.fromEntries(
          updated.lines.map((line) => [line.id, current[line.id] ?? line.unitId ?? null]),
        ),
      }));
      setPreview(null);
    } catch (error) {
      toastApiError(t, error);
    }
  }

  async function previewCount() {
    if (busy || !allQuantitiesEntered) return;
    setPreview(null);
    try {
      const response = await previewMutation.mutateAsync({
        id: document.id,
        request: { version, countedAt, lines },
      });
      setPreview(response.payload);
      setPreviewKey(signature);
    } catch (error) {
      toastApiError(t, error);
    }
  }

  async function postCount() {
    if (!previewIsCurrent || busy) return;
    try {
      await postMutation.mutateAsync({
        id: document.id,
        request: {
          version,
          calculationVersion: preview?.calculationVersion,
          idempotencyKey: createIdempotencyKey(),
          countedAt,
          confirmed: true,
          lines,
        },
      });
      toast.success(t('pages.documents.operations.countPosted'));
      onComplete();
    } catch (error) {
      toastApiError(t, error);
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && !busy && onClose()}>
      <ThemedDialogContent className='!max-w-3xl'>
        <AppDialogHeader
          title={t('pages.documents.actions.RECONCILE')}
          description={t('pages.documents.operations.countDescription', {
            number: document.number ?? t('pages.documents.draft'),
          })}
          icon={ClipboardList}
        />
        <AppDialogBody className='space-y-4'>
          <p className='text-sm text-zinc-400'>
            {t('pages.documents.operations.countedAt')}:{' '}
            {new Intl.DateTimeFormat(undefined, {
              dateStyle: 'medium',
              timeStyle: 'short',
            }).format(new Date(countedAt))}
          </p>
          {countLines.length === 0 && (
            <p className='rounded-lg border border-zinc-700 bg-zinc-900/60 p-3 text-sm text-zinc-300'>
              {t('pages.documents.operations.emptyStockCount')}
            </p>
          )}
          <section className='space-y-2 rounded-lg border border-zinc-700 bg-zinc-900/40 p-3'>
            <Label htmlFor='stock-count-product-search'>
              {t('pages.documents.operations.addCountProducts')}
            </Label>
            <Input
              id='stock-count-product-search'
              value={productSearch}
              onChange={(event) => setProductSearch(event.target.value)}
              placeholder={t('pages.documents.operations.selectProduct')}
            />
            <ScrollArea className='h-40 rounded-md border border-zinc-700'>
              <div className='space-y-1 p-2'>
                {products.filter((product) => !countLines.some((line) => line.productId === product.id)).map((product) => (
                  <div key={product.id} className='flex items-center justify-between gap-3 rounded-md px-2 py-1.5 hover:bg-zinc-800'>
                    <span className='min-w-0 truncate text-sm'>{product.name} · {product.sku}</span>
                    <Button type='button' variant='subtleOutline' onClick={() => void addProduct(product.id)} disabled={busy}>
                      {t('pages.documents.operations.addLine')}
                    </Button>
                  </div>
                ))}
                {!productsQuery.isPending && products.length === 0 && (
                  <p className='px-2 py-3 text-sm text-zinc-400'>
                    {t('pages.documents.operations.noCountProducts')}
                  </p>
                )}
              </div>
            </ScrollArea>
            {productsQuery.hasNextPage && (
              <Button type='button' variant='mutedOutline' onClick={() => void productsQuery.fetchNextPage()} disabled={productsQuery.isFetchingNextPage}>
                {t(productsQuery.isFetchingNextPage ? 'pages.documents.operations.loading' : 'pages.documents.pagination.next')}
              </Button>
            )}
          </section>
          {countLines.map((line) => (
            <div
              key={line.id}
              className='grid gap-3 rounded-lg border border-zinc-700 bg-zinc-900/60 p-3 sm:grid-cols-[minmax(0,1fr)_8rem]'
            >
              <div className='min-w-0'>
                <p className='truncate text-sm font-medium'>
                  {line.productName}
                </p>
                <p className='text-xs text-zinc-400'>
                  {t('pages.documents.operations.expectedAtCount')}:{' '}
                  {convertLineQuantity(line.expectedQuantity ?? 0, line, line.unitId, unitIds[line.id] ?? line.unitId)} {lineUnitName(line, unitIds[line.id] ?? line.unitId)}
                </p>
                {lineUnitOptions(line).length > 1 && (
                  <Select
                    value={String(unitIds[line.id] ?? line.unitId ?? line.mainUnit?.id)}
                    onValueChange={(value) => {
                      const nextUnitId = Number(value);
                      const previousUnitId = unitIds[line.id] ?? line.unitId;
                      setQuantities((current) => {
                        const currentValue = current[line.id];
                        return {
                          ...current,
                          [line.id]: currentValue === undefined || currentValue.trim() === ''
                            ? ''
                            : String(convertLineQuantity(Number(currentValue), line, previousUnitId, nextUnitId)),
                        };
                      });
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
                <Input
                  className='mt-2'
                  aria-label={`${line.productName} ${t('pages.documents.operations.varianceReason')}`}
                  placeholder={t('pages.documents.operations.varianceReason')}
                  value={reasons[line.id] ?? ''}
                  onChange={(event) => {
                    setReasons((current) => ({
                      ...current,
                      [line.id]: event.target.value,
                    }));
                    setPreview(null);
                  }}
                />
              </div>
              <div className='space-y-1'>
                <Label>{t('pages.documents.operations.counted')}</Label>
                <Input
                  type='number'
                  min='0'
                  step='any'
                  value={quantities[line.id] ?? ''}
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
                  {t('pages.documents.operations.countEffect', {
                    expected: line.expectedQuantity ?? 0,
                    counted: line.countedQuantity ?? 0,
                    variance: line.variance ?? 0,
                    target: line.rebasedTargetQuantity ?? 0,
                    adjustment: line.adjustmentQuantity ?? 0,
                  })}
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
            variant='mutedOutline'
            onClick={onClose}
            disabled={busy}
          >
            {t('common.cancel')}
          </Button>
          <Button
            variant='mutedOutline'
            onClick={() => void previewCount()}
            disabled={busy || !allQuantitiesEntered}
          >
            {t(
              busy
                ? 'pages.documents.operations.loading'
                : 'pages.documents.operations.previewReconciliation',
            )}
          </Button>
          <Button
            variant='accentSolid'
            onClick={() => void postCount()}
            disabled={busy || !previewIsCurrent}
          >
            {t(
              busy
                ? 'pages.documents.operations.saving'
                : 'pages.documents.operations.postAdjustments',
            )}
          </Button>
        </AppDialogFooter>
      </ThemedDialogContent>
    </Dialog>
  );
}
