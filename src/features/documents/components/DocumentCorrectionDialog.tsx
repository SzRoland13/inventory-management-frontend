'use client';

import { useMemo, useState } from 'react';
import { FileClock } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import {
  DocumentAction,
  DocumentCorrectionIntent,
  DocumentCorrectionOperation,
} from '@/features/documents/enums/documentEnums';
import type {
  BusinessDocument,
  CorrectionRequest,
  DocumentOperationPreview,
} from '@/features/documents/types/documents';
import {
  useCorrectionPreviewMutation,
  useCorrectPostedDocumentMutation,
} from '@/features/documents/queries/documentQueries';
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
  const [intent, setIntent] = useState<DocumentCorrectionIntent | null>(null);
  const [reason, setReason] = useState('');
  const [quantities, setQuantities] = useState<Record<number, string>>(() =>
    Object.fromEntries(
      document.lines.map((line) => [line.id, String(line.fulfilledQuantity)]),
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
      })),
    [document.lines, quantities],
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
      const request: CorrectionRequest = {
        version: document.version,
        operation: DocumentCorrectionOperation.CORRECT_RECORDING,
        reason: reason.trim(),
        idempotencyKey: createIdempotencyKey(),
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
                  className='grid grid-cols-[minmax(0,1fr)_8rem] items-center gap-3 rounded-lg border border-zinc-700 bg-zinc-900/60 p-3'
                >
                  <div className='min-w-0'>
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
                      {line.productName}:{' '}
                      {t('pages.documents.operations.correctionEffect', {
                        original: line.originalQuantity ?? 0,
                        corrected: line.correctedQuantity ?? 0,
                        fulfilled: line.correctedFulfilledQuantity ?? 0,
                        closed: line.closedQuantity ?? 0,
                        remaining: line.remainingQuantity ?? 0,
                        delta: line.quantityDelta ?? 0,
                      })}
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
