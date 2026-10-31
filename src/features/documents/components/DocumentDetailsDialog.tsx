'use client';

import { useRef, useState } from 'react';
import { Activity, ArrowLeft, ArrowUpRight, Check, Download, ExternalLink, FileText, PackageCheck, RefreshCw, Upload, X } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { useConfirmOrderMutation, useDocumentQuery, useRetryPdfMutation } from '@/features/documents/queries/documentQueries';
import { DocumentService } from '@/features/documents/services/DocumentService';
import { DocumentAction, DocumentFileSource, DocumentFileStatus } from '@/features/documents/enums/documentEnums';
import type { BusinessDocument } from '@/features/documents/types/documents';
import { requireSuccessfulResponse, toastApiError } from '@/features/shared/api/apiResponse';
import { Badge } from '@/features/shared/components/ui/badge';
import { Button } from '@/features/shared/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/features/shared/components/ui/dialog';
import { FulfillmentDialog } from '@/features/documents/components/FulfillmentDialog';
import { CloseRemainingDialog } from '@/features/documents/components/CloseRemainingDialog';
import { DocumentDraftEditor } from '@/features/documents/components/DocumentDraftEditor';
import { documentRelationLabel, documentStatusLabel, documentTypeLabel } from '@/features/documents/helpers/documentPresentation';

type Props = { document: BusinessDocument | null; onClose: () => void };

export function DocumentDetailsDialog({ document, onClose }: Props) {
  const t = useTranslations();
  const locale = useLocale();
  const [documentPath, setDocumentPath] = useState<number[]>([]);
  const activeId = documentPath.at(-1) ?? document?.id ?? null;
  const fileInput = useRef<HTMLInputElement>(null);
  const detailQuery = useDocumentQuery(activeId);
  const retryPdf = useRetryPdfMutation();
  const confirmOrder = useConfirmOrderMutation();
  const [fulfillmentOpen, setFulfillmentOpen] = useState(false);
  const [closeRemainingOpen, setCloseRemainingOpen] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const current = detailQuery.data?.payload ?? (activeId === document?.id ? document : null);
  function closeDetails() {
    if (editorOpen) return;
    onClose();
  }
  if (!document) return null;

  if (!current) {
    return <Dialog open onOpenChange={(open) => !open && closeDetails()}><DialogContent className='max-w-lg border-zinc-700 bg-zinc-900 text-zinc-100'>
      <DialogTitle>{detailQuery.isError ? t('pages.documents.details.loadError') : t('pages.documents.loading')}</DialogTitle>
      {detailQuery.isError ? <Button variant='outline' onClick={() => void detailQuery.refetch()} className='mt-3 border-zinc-600 bg-zinc-800'>{t('common.retry')}</Button> : <div role='status' aria-busy='true' className='mt-4 h-20 animate-pulse rounded-xl bg-zinc-800' />}
    </DialogContent></Dialog>;
  }

  const showBillingProgress = current.lines.some(
    (line) => line.billedQuantity !== undefined,
  );

  function openRelated(id: number) {
    setDocumentPath((path) => [...path, id]);
  }

  function goBack() {
    setDocumentPath((path) => path.slice(0, -1));
  }

  async function uploadFile(file?: File) {
    if (!file || !current) return;
    try {
      await requireSuccessfulResponse(DocumentService.uploadFile(current.id, file));
      await detailQuery.refetch();
      toast.success(t('pages.documents.files.uploaded'));
    } catch (error) {
      toastApiError(t, error);
    }
  }

  async function retry() {
    if (!current) return;
    try {
      await retryPdf.mutateAsync(current.id);
      toast.success(t('pages.documents.files.retryQueued'));
    } catch (error) {
      toastApiError(t, error);
    }
  }

  async function confirm() {
    if (!current) return;
    try {
      await confirmOrder.mutateAsync(current.id);
      toast.success(t('pages.documents.actions.confirmed'));
    } catch (error) {
      toastApiError(t, error);
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && closeDetails()}>
      <DialogContent showCloseButton={false} className='max-h-[90vh] max-w-4xl overflow-y-auto border-zinc-700 bg-zinc-900 p-0 text-zinc-100'>
        <div className='sticky top-0 z-10 flex items-start justify-between border-b border-zinc-700 bg-zinc-900/95 px-6 py-5 backdrop-blur'>
          <div className='flex min-w-0 items-start gap-3'>
            {documentPath.length > 0 && <Button variant='ghost' size='icon-sm' onClick={goBack} aria-label={t('pages.documents.details.back')} className='mt-0.5 text-zinc-300'><ArrowLeft /></Button>}
            <div className='min-w-0'>
            <DialogTitle className='text-xl'>{current.number || t('pages.documents.draft')}</DialogTitle>
            <DialogDescription className='mt-1 text-zinc-400'>{documentTypeLabel(current.type, t)} · {current.partnerName || current.routeName || t('pages.documents.noPartner')}</DialogDescription>
            </div>
          </div>
          <Button variant='ghost' size='icon' onClick={closeDetails} aria-label={t('common.done')}><X /></Button>
        </div>

        <div className='grid gap-6 p-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(240px,0.8fr)]'>
          <div className='space-y-6'>
            {current.allowedActions.length > 0 && <div className='flex flex-wrap gap-2'>
              {current.allowedActions.includes(DocumentAction.EDIT) && <Button variant='outline' onClick={() => setEditorOpen(true)} className='border-zinc-600 bg-zinc-800'>{t('pages.documents.actions.EDIT')}</Button>}
              {current.allowedActions.includes(DocumentAction.CONFIRM) && <Button onClick={() => void confirm()} disabled={confirmOrder.isPending} className='bg-indigo-500 text-white hover:bg-indigo-400'><Check />{t('pages.documents.actions.CONFIRM')}</Button>}
              {(current.allowedActions.includes(DocumentAction.RECEIVE) || current.allowedActions.includes(DocumentAction.DELIVER)) && <Button onClick={() => setFulfillmentOpen(true)} className='bg-indigo-500 text-white hover:bg-indigo-400'><PackageCheck />{t(`pages.documents.actions.${current.allowedActions.includes(DocumentAction.RECEIVE) ? 'RECEIVE' : 'DELIVER'}`)}</Button>}
              {current.allowedActions.includes(DocumentAction.POST) && <Button onClick={() => setFulfillmentOpen(true)} className='bg-indigo-500 text-white hover:bg-indigo-400'><PackageCheck />{t('pages.documents.actions.POST')}</Button>}
              {current.allowedActions.includes(DocumentAction.CLOSE_REMAINING) && <Button variant='outline' onClick={() => setCloseRemainingOpen(true)} className='border-zinc-600 bg-zinc-800'>{t('pages.documents.actions.CLOSE_REMAINING')}</Button>}
            </div>}
            <section>
              <div className='mb-3 flex items-center justify-between'>
                <h3 className='font-semibold'>{t('pages.documents.details.items')}</h3>
                <Badge variant='outline' className='border-zinc-600 text-zinc-300'>{documentStatusLabel(current.status, t)}</Badge>
              </div>
              <div className='overflow-hidden rounded-xl border border-zinc-700'>
                <div className={`grid ${showBillingProgress ? 'grid-cols-[minmax(0,1fr)_repeat(4,auto)]' : 'grid-cols-[minmax(0,1fr)_repeat(3,auto)]'} gap-3 border-b border-zinc-700 bg-zinc-800/70 px-4 py-3 text-xs font-medium uppercase tracking-wide text-zinc-400`}>
                  <span>{t('pages.documents.details.product')}</span>
                  <span>{t('pages.documents.details.ordered')}</span>
                  <span>{t('pages.documents.details.done')}</span>
                  <span>{t('pages.documents.details.remaining')}</span>
                  {showBillingProgress && <span>{t('pages.documents.details.billed')}</span>}
                </div>
                {current.lines.map((line) => (
                  <div key={line.id} className={`grid ${showBillingProgress ? 'grid-cols-[minmax(0,1fr)_repeat(4,auto)]' : 'grid-cols-[minmax(0,1fr)_repeat(3,auto)]'} gap-3 border-b border-zinc-800 px-4 py-3 text-sm last:border-0`}>
                    <div className='min-w-0'>
                      <p className='truncate font-medium'>{line.productName}</p>
                      <p className='text-xs text-zinc-500'>{line.productCode}</p>
                      {line.sourceAllocations?.map((allocation) => <button key={`${allocation.sourceDocumentId}-${allocation.sourceLineId}`} type='button' onClick={() => openRelated(allocation.sourceDocumentId)} className='mt-1 block text-xs text-indigo-300 hover:text-indigo-200'>{t('pages.documents.details.allocatedFrom', { number: allocation.sourceDocumentNumber, quantity: allocation.quantity })}</button>)}
                    </div>
                    <span className='tabular-nums text-zinc-300'>{line.orderedQuantity} {line.unitName}</span>
                    <span className='tabular-nums text-zinc-400'>{line.fulfilledQuantity} {line.unitName}</span>
                    <span className='tabular-nums text-zinc-300'>{line.remainingQuantity} {line.unitName}</span>
                    {showBillingProgress && <span className='tabular-nums text-indigo-200'>{line.billedQuantity ?? 0} {line.unitName}</span>}
                  </div>
                ))}
                {!current.lines.length && <p className='p-5 text-sm text-zinc-400'>{t('pages.documents.details.noItems')}</p>}
              </div>
              {current.totals && <dl className='mt-3 grid grid-cols-3 gap-3 rounded-xl border border-zinc-700 bg-zinc-800/40 p-4 text-sm'>
                <div><dt className='text-xs text-zinc-500'>{t('pages.documents.details.net')}</dt><dd className='mt-1 font-medium tabular-nums'>{formatMoney(current.totals.net, current.totals.currencyCode, locale)}</dd></div>
                <div><dt className='text-xs text-zinc-500'>{t('pages.documents.details.tax')}</dt><dd className='mt-1 font-medium tabular-nums'>{formatMoney(current.totals.tax, current.totals.currencyCode, locale)}</dd></div>
                <div><dt className='text-xs text-zinc-500'>{t('pages.documents.details.gross')}</dt><dd className='mt-1 font-semibold tabular-nums text-zinc-100'>{formatMoney(current.totals.gross, current.totals.currencyCode, locale)}</dd></div>
              </dl>}
            </section>

            <section>
              <h3 className='mb-3 flex items-center gap-2 font-semibold'><Activity className='h-4 w-4 text-indigo-300' />{t('pages.documents.details.activity')}</h3>
              <div className='space-y-3'>
                {current.activity.map((event) => <div key={event.id} className='flex gap-3 text-sm'><span className='mt-1.5 h-2 w-2 shrink-0 rounded-full bg-indigo-400' /><div><p className='text-zinc-200'>{event.description}</p><p className='mt-0.5 text-xs text-zinc-500'>{event.actorName} · {event.occurredAt}</p></div></div>)}
                {!current.activity.length && <p className='text-sm text-zinc-500'>{t('pages.documents.details.noActivity')}</p>}
              </div>
            </section>
          </div>

          <aside className='space-y-5'>
            <section className='rounded-xl border border-zinc-700 bg-zinc-800/40 p-4'>
              <div className='mb-3 flex items-center justify-between gap-2'><h3 className='font-semibold'>{t('pages.documents.files.title')}</h3>{current.allowedActions.includes(DocumentAction.UPLOAD_FILE) && <Button size='sm' variant='outline' className='border-zinc-600 bg-zinc-800' onClick={() => fileInput.current?.click()}><Upload />{t('pages.documents.files.add')}</Button>}</div>
              <input ref={fileInput} type='file' className='hidden' onChange={(event) => { void uploadFile(event.target.files?.[0]); event.currentTarget.value = ''; }} />
              <div className='space-y-2'>
                {current.files.map((file) => (
                  <div key={file.id} className='flex items-center gap-3 rounded-lg border border-zinc-700 bg-zinc-900/70 p-3'>
                    <span className='flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-300'><FileText className='h-4 w-4' /></span>
                    <div className='min-w-0 flex-1'><p className='truncate text-sm font-medium'>{file.fileName}</p><p className='text-xs text-zinc-500'>{t(`pages.documents.files.sources.${file.source}`)}{file.status ? ` · ${t(`pages.documents.files.status.${file.status}`)}` : ''}</p>{file.errorMessage && <p role='alert' className='mt-1 text-xs text-rose-300'>{file.errorMessage}</p>}</div>
                    {file.status === DocumentFileStatus.FAILED && current.allowedActions.includes(DocumentAction.RETRY_PDF) && <Button variant='ghost' size='icon-sm' disabled={retryPdf.isPending} onClick={() => void retry()} aria-label={t('pages.documents.files.retry')}><RefreshCw className='h-4 w-4' /></Button>}
                    {(file.source !== DocumentFileSource.GENERATED_PDF || file.status === DocumentFileStatus.COMPLETED) && file.downloadUrl && <><Button asChild variant='ghost' size='icon-sm' aria-label={t('pages.documents.files.open')}><a href={file.downloadUrl} target='_blank' rel='noreferrer'><ExternalLink className='h-4 w-4' /></a></Button><Button asChild variant='ghost' size='icon-sm' aria-label={t('pages.documents.files.download')}><a href={file.downloadUrl} download><Download className='h-4 w-4' /></a></Button></>}
                  </div>
                ))}
                {!current.files.length && <p className='py-3 text-sm text-zinc-500'>{t('pages.documents.files.empty')}</p>}
              </div>
            </section>
            <section className='rounded-xl border border-zinc-700 bg-zinc-800/40 p-4'>
              <h3 className='mb-3 font-semibold'>{t('pages.documents.details.related')}</h3>
              <div className='space-y-2'>
                {current.sourceDocument && <RelatedDocument type={current.sourceDocument.type} number={current.sourceDocument.number} label={t('pages.documents.details.source')} onClick={() => openRelated(current.sourceDocument!.id)} />}
                {current.relatedDocuments.map((related) => <RelatedDocument key={related.id} type={related.type} number={related.number} label={related.relationKind ? documentRelationLabel(related.relationKind, t) : t('pages.documents.details.relatedDocument')} onClick={() => openRelated(related.id)} />)}
                {!current.sourceDocument && !current.relatedDocuments.length && <p className='text-sm text-zinc-500'>{t('pages.documents.details.noRelated')}</p>}
              </div>
            </section>
          </aside>
        </div>
      </DialogContent>
      {fulfillmentOpen && <FulfillmentDialog key={`${current.id}-${fulfillmentOpen}`} source={current} onClose={() => setFulfillmentOpen(false)} onComplete={() => { setFulfillmentOpen(false); onClose(); }} />}
      <CloseRemainingDialog document={closeRemainingOpen ? current : null} onClose={() => setCloseRemainingOpen(false)} />
      <DocumentDraftEditor document={editorOpen ? current : null} onClose={() => setEditorOpen(false)} />
    </Dialog>
  );
}

function RelatedDocument({ type, number, label, onClick }: { type: BusinessDocument['type']; number: string; label: string; onClick: () => void }) {
  const t = useTranslations();
  return <button type='button' onClick={onClick} className='group w-full rounded-lg border border-zinc-700 bg-zinc-900/60 p-3 text-left transition hover:border-indigo-400/50 hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400'><span className='flex items-center justify-between gap-2'><span className='text-xs text-zinc-500'>{label}</span><ArrowUpRight className='h-3.5 w-3.5 text-zinc-500 group-hover:text-indigo-300' /></span><span className='mt-1 block text-sm font-medium'>{number} <span className='font-normal text-zinc-400'>· {documentTypeLabel(type, t)}</span></span></button>;
}

function formatMoney(amount: number, currencyCode: string, locale: string) {
  return new Intl.NumberFormat(locale, { style: 'currency', currency: currencyCode }).format(amount);
}

