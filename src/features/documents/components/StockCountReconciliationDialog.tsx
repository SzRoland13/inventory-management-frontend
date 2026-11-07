'use client';

import { useMemo, useState } from 'react';
import { ClipboardList } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import {
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
  AppDialogHeader,
  appDialogCancelButtonClass,
  appDialogPrimaryButtonClass,
} from '@/features/shared/components/AppDialogLayout';
import { ThemedDialogContent } from '@/features/shared/components/ThemedDialogWrapper';
import { convertLineQuantity, lineUnitName, lineUnitOptions } from '@/features/documents/utils/lineUnits';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/features/shared/components/ui/select';

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
      document.lines
        .map((line) => ({
          sourceLineId: line.id,
          productId: line.productId,
          unitId: unitIds[line.id] ?? undefined,
          quantity: Number(quantities[line.id] ?? 0),
          countedQuantity: Number(quantities[line.id] ?? 0),
          varianceReason: reasons[line.id] || undefined,
        }))
        .filter((line) => line.quantity >= 0),
    [document.lines, quantities, reasons, unitIds],
  );
  const countedAt = document.countedAt ?? document.date;
  const signature = JSON.stringify({
    version: document.version,
    countedAt,
    lines,
  });
  const previewIsCurrent = Boolean(preview?.valid && previewKey === signature);
  const busy = previewMutation.isPending || postMutation.isPending;

  async function previewCount() {
    if (busy) return;
    setPreview(null);
    try {
      const response = await previewMutation.mutateAsync({
        id: document.id,
        request: { version: document.version, countedAt, lines },
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
          version: document.version,
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
          {document.lines.map((line) => (
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
            onClick={() => void previewCount()}
            disabled={busy}
          >
            {t(
              busy
                ? 'pages.documents.operations.loading'
                : 'pages.documents.operations.previewReconciliation',
            )}
          </Button>
          <Button
            className={appDialogPrimaryButtonClass}
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
