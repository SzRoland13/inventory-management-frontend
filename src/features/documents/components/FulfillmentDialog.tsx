'use client';

import { useMemo, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { DocumentType } from '@/features/documents/enums/documentEnums';
import type { BusinessDocument, FulfillmentPreviewResponse } from '@/features/documents/types/documents';
import { DocumentService } from '@/features/documents/services/DocumentService';
import { useCreateFulfillmentDraftMutation, usePostFulfillmentMutation } from '@/features/documents/queries/documentQueries';
import { requireSuccessfulResponse, toastApiError } from '@/features/shared/api/apiResponse';
import { Button } from '@/features/shared/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/features/shared/components/ui/dialog';
import { Input } from '@/features/shared/components/ui/input';

type Props = { source: BusinessDocument | null; onClose: () => void; onComplete: () => void };

export function FulfillmentDialog({ source, onClose, onComplete }: Props) {
  const t = useTranslations();
  const isDirectDraft = source?.type === DocumentType.GOODS_RECEIPT || source?.type === DocumentType.DELIVERY_NOTE;
  const type = source?.type === DocumentType.GOODS_RECEIPT || source?.type === DocumentType.PURCHASE_ORDER
    ? DocumentType.GOODS_RECEIPT
    : DocumentType.DELIVERY_NOTE;
  const [quantities, setQuantities] = useState<Record<number, string>>(() => Object.fromEntries((source?.lines ?? []).map((line) => [line.id, String(line.remainingQuantity)])));
  const [preview, setPreview] = useState<FulfillmentPreviewResponse | null>(null);
  const [previewing, setPreviewing] = useState(false);
  const idempotencyKey = useRef<string | null>(null);
  const createDraft = useCreateFulfillmentDraftMutation();
  const post = usePostFulfillmentMutation();
  const lines = useMemo(() => (source?.lines ?? []).map((line) => ({
    sourceLineId: line.id,
    productId: line.productId,
    quantity: Number(quantities[line.id] ?? 0),
  })).filter((line) => line.quantity > 0), [source, quantities]);

  if (!source) return null;

  async function checkStock() {
    if (!source || !lines.length) return;
    setPreviewing(true);
    try {
      const result = await requireSuccessfulResponse(DocumentService.previewFulfillment({
        ...(isDirectDraft ? { documentId: source.id } : { sourceDocumentId: source.id }),
        type,
        warehouseId: source.warehouseId,
        lines,
      }));
      setPreview(result.payload);
    } catch (error) {
      toastApiError(t, error);
    } finally {
      setPreviewing(false);
    }
  }

  async function submit() {
    if (!source || !preview?.valid || !lines.length) return;
    try {
      const draftId = isDirectDraft
        ? source.id
        : (await createDraft.mutateAsync({ sourceDocumentId: source.id, type, warehouseId: source.warehouseId, lines })).payload.id;
      idempotencyKey.current ??= window.crypto.randomUUID();
      await post.mutateAsync({ id: draftId, sourceId: source.sourceDocument?.id ?? source.id, idempotencyKey: idempotencyKey.current });
      toast.success(t('pages.documents.fulfillment.posted'));
      onComplete();
    } catch (error) {
      toastApiError(t, error);
    }
  }

  const busy = previewing || (!isDirectDraft && createDraft.isPending) || post.isPending;

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className='max-h-[90vh] max-w-2xl overflow-y-auto border-zinc-700 bg-zinc-900 text-zinc-100'>
        <DialogHeader>
          <DialogTitle>{t(`pages.documents.fulfillment.title.${type}`)}</DialogTitle>
          <DialogDescription className='text-zinc-400'>{t('pages.documents.fulfillment.description', { number: source.number || t('pages.documents.draft') })}</DialogDescription>
        </DialogHeader>
        <div className='space-y-3'>
          {source.lines.map((line) => (
            <div key={line.id} className='grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 rounded-lg border border-zinc-700 bg-zinc-800/50 p-3'>
              <div className='min-w-0'><p className='truncate text-sm font-medium'>{line.productName}</p><p className='mt-1 text-xs text-zinc-400'>{t('pages.documents.fulfillment.progress', { ordered: line.orderedQuantity, done: line.fulfilledQuantity, remaining: line.remainingQuantity, unit: line.unitName })}</p></div>
              <label className='w-28'><span className='mb-1 block text-xs text-zinc-400'>{t('pages.documents.fulfillment.quantity')}</span><Input type='number' min='0' max={line.remainingQuantity} step='any' value={quantities[line.id] ?? '0'} onChange={(event) => { setQuantities((current) => ({ ...current, [line.id]: event.target.value })); setPreview(null); }} className='border-zinc-600 bg-zinc-950 text-right tabular-nums' /></label>
            </div>
          ))}
        </div>
        {preview && <div className={`rounded-lg border p-3 text-sm ${preview.valid ? 'border-emerald-500/30 bg-emerald-500/5 text-emerald-200' : 'border-rose-500/30 bg-rose-500/5 text-rose-200'}`}>
          <p className='font-medium'>{t(preview.valid ? 'pages.documents.fulfillment.previewValid' : 'pages.documents.fulfillment.previewInvalid')}</p>
          {preview.lines.filter((line) => line.shortfall || line.errorMessageKey).map((line) => <p key={line.sourceLineId} className='mt-2'>{line.productName}: {line.errorMessageKey ? t(`messagekey.${line.errorMessageKey}`) : t('pages.documents.fulfillment.shortfall', { warehouse: line.warehouseName ?? '', available: line.availableQuantity ?? 0, shortfall: line.shortfall ?? 0 })}</p>)}
        </div>}
        <DialogFooter className='gap-2 sm:gap-2'>
          <Button variant='outline' className='border-zinc-600 bg-zinc-800' disabled={busy} onClick={() => void checkStock()}>{previewing ? t('pages.documents.fulfillment.checking') : t('pages.documents.fulfillment.preview')}</Button>
          <Button disabled={busy || !preview?.valid || !lines.length} onClick={() => void submit()} className='bg-indigo-500 text-white hover:bg-indigo-400'>{t('pages.documents.fulfillment.post')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
