'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { FilePlus2 } from 'lucide-react';
import { toast } from 'sonner';
import { useLocale, useTranslations } from 'next-intl';
import { useCommercialDraftPreviewMutation, useCreateCommercialDraftMutation, useDocumentsQuery, useUpdateCommercialDraftMutation } from '@/features/documents/queries/documentQueries';
import { DocumentQueueView, DocumentRelationKind, DocumentStatus, DocumentType } from '@/features/documents/enums/documentEnums';
import type { BusinessDocument, CommercialDocumentType, DocumentLine } from '@/features/documents/types/documents';
import { toastApiError } from '@/features/shared/api/apiResponse';
import { Button } from '@/features/shared/components/ui/button';
import { Checkbox } from '@/features/shared/components/ui/checkbox';
import { Input } from '@/features/shared/components/ui/input';
import { Label } from '@/features/shared/components/ui/label';
import { Dialog } from '@/features/shared/components/ui/dialog';
import { ScrollArea } from '@/features/shared/components/ui/scroll-area';
import {
  AppDialogBody,
  AppDialogFooter,
  AppDialogHeader
} from '@/features/shared/components/AppDialogLayout';
import { ThemedDialogContent } from '@/features/shared/components/ThemedDialogWrapper';
import { formatDocumentAmount } from '@/features/documents/helpers/documentPresentation';

type Props = { open: boolean; type: CommercialDocumentType | null; editDocument?: BusinessDocument | null; onOpenChange: (open: boolean) => void };

function sourceLines(document: BusinessDocument): DocumentLine[] {
  return document.lines;
}

export function CommercialDocumentDialog({ open, type, editDocument = null, onOpenChange }: Props) {
  const t = useTranslations();
  const locale = useLocale();
  const docsQuery = useDocumentsQuery({ view: DocumentQueueView.ALL, page: 0, pageSize: 100 });
  const create = useCreateCommercialDraftMutation();
  const update = useUpdateCommercialDraftMutation();
  const previewMutation = useCommercialDraftPreviewMutation();
  const activeType = type ?? (editDocument?.type as CommercialDocumentType | undefined) ?? null;
  const [sourceIds, setSourceIds] = useState<number[]>(() => editDocument?.relatedDocuments.filter((doc) => doc.relationKind === DocumentRelationKind.CREATED_FROM || doc.relationKind === DocumentRelationKind.FINANCIAL_CREDIT).map((doc) => doc.id) ?? []);
  const [date, setDate] = useState(() => editDocument?.date ?? new Date().toISOString().slice(0, 10));
  const [reason, setReason] = useState(() => activeType === DocumentType.FINANCIAL_CREDIT ? editDocument?.reason ?? '' : editDocument?.referenceNumber ?? '');
  const [quantities, setQuantities] = useState<Record<number, string>>(() => Object.fromEntries((editDocument?.lines ?? []).filter((line) => line.sourceLineId).map((line) => [line.sourceLineId!, String(line.operationQuantity ?? line.orderedQuantity)])));
  const [prices, setPrices] = useState<Record<number, string>>(() => Object.fromEntries((editDocument?.lines ?? []).filter((line) => line.sourceLineId).map((line) => [line.sourceLineId!, String(line.unitPrice ?? '')])));
  const [vatRates, setVatRates] = useState<Record<number, string>>(() => Object.fromEntries((editDocument?.lines ?? []).filter((line) => line.sourceLineId && line.vatRate !== null && line.vatRate !== undefined).map((line) => [line.sourceLineId!, String(line.vatRate)])));
  const [amounts, setAmounts] = useState<Record<number, string>>(() => Object.fromEntries((editDocument?.lines ?? []).filter((line) => line.sourceLineId && line.netAmount !== null && line.netAmount !== undefined).map((line) => [line.sourceLineId!, String(line.netAmount)])));
  const [previewResult, setPreviewResult] = useState<{
    key: string;
    payload: Awaited<ReturnType<typeof previewMutation.mutateAsync>>['payload'];
  } | null>(null);
  const [previewErrorKey, setPreviewErrorKey] = useState<string | null>(null);
  const previewSequence = useRef(0);

  const candidates = useMemo(() => {
    const docs = docsQuery.data?.payload.items ?? [];
    if (activeType === DocumentType.FINANCIAL_CREDIT) {
      return docs.filter((doc) =>
        (doc.type === DocumentType.SUPPLIER_BILL && doc.status === DocumentStatus.RECEIVED) ||
        (doc.type === DocumentType.CUSTOMER_INVOICE && doc.status === DocumentStatus.ISSUED),
      );
    }
    const expectedType = activeType === DocumentType.SUPPLIER_BILL ? DocumentType.GOODS_RECEIPT : DocumentType.DELIVERY_NOTE;
    return docs.filter((doc) => doc.type === expectedType && doc.status === DocumentStatus.COMPLETED && !doc.nonBillable);
  }, [docsQuery.data?.payload.items, activeType]);
  const selected = useMemo(() => candidates.filter((doc) => sourceIds.includes(doc.id)), [candidates, sourceIds]);
  const editableLineIds = useMemo(() => new Set((editDocument?.lines ?? []).map((line) => line.sourceLineId).filter((id): id is number => id !== null && id !== undefined)), [editDocument?.lines]);
  const lines = useMemo(() => selected.flatMap((doc) => sourceLines(doc).map((line) => ({ document: doc, line })))
    .filter(({ line }) => !editDocument || editableLineIds.has(line.id)), [selected, editDocument, editableLineIds]);

  const draftRequest = useMemo(() => {
    if (!activeType || !selected.length || !selected[0].currencyId || !lines.length) return null;
    return {
      type: activeType,
      sourceDocumentIds: selected.map((doc) => doc.id),
      date,
      currencyId: selected[0].currencyId,
      ...(activeType === DocumentType.FINANCIAL_CREDIT
        ? { reason: reason.trim() || undefined }
        : { referenceNumber: reason.trim() || undefined }),
      lines: lines.map(({ line }) => ({
        sourceLineId: line.id,
        quantity: Number(quantities[line.id] ?? (activeType === DocumentType.FINANCIAL_CREDIT
          ? line.operationQuantity ?? line.orderedQuantity
          : Math.max(0, (line.operationQuantity ?? line.orderedQuantity) - (line.billedQuantity ?? 0)))),
        unitPrice: prices[line.id] ? Number(prices[line.id]) : line.unitPrice,
        vatRate: vatRates[line.id] ? Number(vatRates[line.id]) : line.vatRate ?? undefined,
        ...(activeType === DocumentType.FINANCIAL_CREDIT
          ? { amount: Number(amounts[line.id] ?? (Number(quantities[line.id] ?? line.operationQuantity ?? line.orderedQuantity) * Number(line.unitPrice ?? 0))) }
          : {}),
      })),
    };
  }, [activeType, selected, lines, date, reason, quantities, prices, vatRates, amounts]);

  const previewKey = JSON.stringify({ draft: draftRequest, excludeDocumentId: editDocument?.id });
  const preview = previewResult?.key === previewKey ? previewResult.payload : null;
  const previewError = previewErrorKey === previewKey;
  const runPreview = previewMutation.mutateAsync;

  useEffect(() => {
    const sequence = ++previewSequence.current;
    if (!open || !draftRequest || draftRequest.lines.some((line) => !Number.isFinite(line.quantity) || line.quantity < 0)) return;
    const requestKey = JSON.stringify({ draft: draftRequest, excludeDocumentId: editDocument?.id });
    const timer = window.setTimeout(() => {
      void runPreview({ draft: draftRequest, excludeDocumentId: editDocument?.id })
        .then((response) => {
          if (previewSequence.current === sequence) {
            setPreviewResult({ key: requestKey, payload: response.payload });
            setPreviewErrorKey((current) => current === requestKey ? null : current);
            setQuantities((current) => {
              const defaults = { ...current };
              let changed = false;
              for (const line of response.payload.lines) {
                if (defaults[line.sourceLineId] === undefined) {
                  defaults[line.sourceLineId] = String(activeType === DocumentType.FINANCIAL_CREDIT
                    ? line.remainingCreditableQuantity
                    : line.remainingQuantity);
                  changed = true;
                }
              }
              return changed ? defaults : current;
            });
          }
        })
        .catch(() => {
          if (previewSequence.current === sequence) setPreviewErrorKey(requestKey);
        });
    }, 300);
    return () => window.clearTimeout(timer);
  }, [open, draftRequest, editDocument?.id, runPreview, activeType]);

  function toggleSource(id: number) {
    setSourceIds((current) => current.includes(id) ? current.filter((value) => value !== id) : [...current, id]);
  }

  async function submit() {
    if (!activeType || !selected.length || !lines.length || !selected[0].currencyId) return;
    try {
      if (!draftRequest || !preview) return;
      if (editDocument) await update.mutateAsync({ id: editDocument.id, request: { version: editDocument.version, draft: draftRequest } });
      else await create.mutateAsync(draftRequest);
      toast.success(t('pages.documents.commercial.created'));
      setSourceIds([]);
      setReason('');
      setQuantities({});
      onOpenChange(false);
    } catch (error) {
      toastApiError(t, error);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <ThemedDialogContent className='!max-h-[90vh] !max-w-3xl'>
        <AppDialogHeader
          title={activeType ? t(`pages.documents.types.${activeType}`) : t('pages.documents.commercial.title')}
          description={t('pages.documents.commercial.description')}
          icon={FilePlus2}
        />
        <AppDialogBody className='space-y-5'>
          {docsQuery.isError && <p role='alert' className='text-sm text-rose-300'>{t('pages.documents.loadError.title')}</p>}
          <fieldset className='space-y-2'>
            <legend className='text-sm font-medium text-zinc-200'>{t('pages.documents.commercial.sources')}</legend>
            <ScrollArea className='h-48 rounded-xl border border-zinc-700 bg-zinc-950/40'>
              <div className='space-y-1.5 p-2'>
                {candidates.map((doc) => {
                  const checkboxId = `commercial-source-${doc.id}`;
                  const checked = sourceIds.includes(doc.id);
                  return (
                    <div
                      key={doc.id}
                      onClick={(event) => {
                        if (
                          !(event.target as HTMLElement).closest(
                            '[data-slot="checkbox"]',
                          ) && !editDocument
                        ) {
                          toggleSource(doc.id);
                        }
                      }}
                      className={`flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border px-3 transition-colors ${
                        checked
                          ? 'border-indigo-400/40 bg-indigo-500/10'
                          : 'border-transparent hover:border-zinc-700 hover:bg-zinc-800/70'
                      } ${editDocument ? 'cursor-not-allowed opacity-60' : ''}`}
                    >
                      <Checkbox
                        id={checkboxId}
                        checked={checked}
                        disabled={Boolean(editDocument)}
                        onCheckedChange={() => toggleSource(doc.id)}
                        aria-label={`${doc.number ?? `#${doc.id}`} · ${doc.partnerName ?? t('pages.documents.noPartner')}`}
                        className='size-5 rounded-[5px] border-zinc-500 data-[state=checked]:border-indigo-400 data-[state=checked]:bg-indigo-500 data-[state=checked]:text-white'
                      />
                      <span className='min-w-0 flex-1 truncate text-sm font-medium text-zinc-100'>
                        {doc.number ?? `#${doc.id}`}
                      </span>
                      <span className='max-w-[45%] truncate text-xs text-zinc-400'>
                        {doc.partnerName ?? t('pages.documents.noPartner')}
                      </span>
                    </div>
                  );
                })}
                {!candidates.length && <p className='text-sm text-zinc-400'>{t('pages.documents.commercial.noSources')}</p>}
              </div>
            </ScrollArea>
          </fieldset>
          <div className='grid gap-3'>
            <div className='space-y-2'><Label htmlFor='commercial-date'>{t('pages.documents.create.date')}</Label><Input id='commercial-date' type='date' value={date} onChange={(event) => setDate(event.target.value)} /></div>
            <div className='space-y-2'><Label htmlFor='commercial-reason'>{t(activeType === DocumentType.FINANCIAL_CREDIT ? 'pages.documents.commercial.reason' : 'pages.documents.commercial.referenceNumber')}</Label><textarea id='commercial-reason' value={reason} onChange={(event) => setReason(event.target.value)} rows={2} maxLength={activeType === DocumentType.FINANCIAL_CREDIT ? 500 : 255} className='flex min-h-16 max-h-[40vh] w-full resize-y rounded-md border border-zinc-600 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus-visible:border-indigo-400 focus-visible:ring-0' /></div>
          </div>
          <section className='space-y-2'>
            <h3 className='text-sm font-medium text-zinc-200'>
              {t('pages.documents.commercial.lines')}
            </h3>
            <ScrollArea className='h-56 rounded-xl border border-zinc-700/80 bg-zinc-950/30'>
              <div className='space-y-3 p-2 sm:p-3'>
                {lines.map(({ document, line }) => {
                  const max = line.operationQuantity ?? line.orderedQuantity;
                  const isCredit = activeType === DocumentType.FINANCIAL_CREDIT;
                  const sourceProgress = preview?.lines.find((item) => item.sourceLineId === line.id);
                  const available = isCredit
                    ? sourceProgress?.remainingCreditableQuantity ?? max
                    : sourceProgress?.remainingQuantity ?? Math.max(0, max - (line.billedQuantity ?? 0));
                  const fieldClass = 'h-11 px-3 text-sm tabular-nums';
                  return (
                    <article
                      key={`${document.id}-${line.id}`}
                      className='grid gap-3 rounded-xl border border-zinc-700/80 bg-zinc-900/80 p-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,25rem)] sm:items-center'
                    >
                      <div className='min-w-0'>
                        <p className='truncate text-sm font-medium text-zinc-100'>
                          {line.productName}
                        </p>
                        <p className='mt-1 text-xs text-zinc-400'>
                          {document.number} · {line.unitName} ·{' '}
                    {activeType === DocumentType.FINANCIAL_CREDIT
                      ? <>
                          <span>{t('pages.documents.commercial.creditBalance', {
                            original: sourceProgress?.eligibleQuantity ?? max,
                            credited: sourceProgress?.creditedQuantity ?? 0,
                            remaining: sourceProgress?.remainingCreditableQuantity ?? max,
                          })}</span>
                          <br />
                          <span>{t('pages.documents.commercial.creditAmountBalance', {
                            original: formatDocumentAmount((sourceProgress?.creditedNetAmount ?? 0) + (sourceProgress?.remainingCreditableNetAmount ?? max * Number(line.unitPrice ?? 0)), document.currencyCode, locale),
                            credited: formatDocumentAmount(sourceProgress?.creditedNetAmount ?? 0, document.currencyCode, locale),
                            remaining: formatDocumentAmount(sourceProgress?.remainingCreditableNetAmount ?? max * Number(line.unitPrice ?? 0), document.currencyCode, locale),
                          })}</span>
                        </>
                      : t('pages.documents.commercial.billingBalance', {
                          eligible: preview?.lines.find((item) => item.sourceLineId === line.id)?.eligibleQuantity ?? max,
                          billed: sourceProgress?.billedQuantity ?? line.billedQuantity ?? 0,
                          remaining: sourceProgress?.remainingQuantity ?? Math.max(0, max - (line.billedQuantity ?? 0)),
                        })}
                        </p>
                        {activeType !== DocumentType.FINANCIAL_CREDIT && (
                          <p className='mt-1 text-xs text-zinc-500'>
                            {t('pages.documents.commercial.sourcePricing', {
                              price: formatDocumentAmount(line.unitPrice ?? 0, document.currencyCode, locale),
                              vat: line.vatRate ?? 0,
                            })}
                          </p>
                        )}
                      </div>
                      <div
                        className={`grid grid-cols-2 gap-2 ${
                          isCredit ? 'sm:grid-cols-4' : 'sm:grid-cols-3'
                        }`}
                      >
                        <label className='min-w-0 space-y-1 text-xs font-medium text-zinc-400'>
                          {t('pages.documents.commercial.quantity')}
                          <Input
                            aria-label={t('pages.documents.commercial.quantity')}
                            className={fieldClass}
                            type='number'
                            min={isCredit ? '0' : '0.00000001'}
                            max={isCredit
                              ? sourceProgress?.remainingCreditableQuantity ?? max
                              : preview?.lines.find((item) => item.sourceLineId === line.id)?.remainingQuantity ?? Math.max(0, max - (line.billedQuantity ?? 0))}
                            step='any'
                            value={quantities[line.id] ?? String(available)}
                            onChange={(event) =>
                              setQuantities((current) => ({
                                ...current,
                                [line.id]: event.target.value,
                              }))
                            }
                          />
                        </label>
                        <label className='min-w-0 space-y-1 text-xs font-medium text-zinc-400'>
                          {t('pages.documents.details.unitPrice')}
                          <Input
                            aria-label={t('pages.documents.details.unitPrice')}
                            className={fieldClass}
                            type='number'
                            min='0'
                            step='any'
                            value={prices[line.id] ?? String(line.unitPrice ?? '')}
                            onChange={(event) =>
                              setPrices((current) => ({
                                ...current,
                                [line.id]: event.target.value,
                              }))
                            }
                          />
                        </label>
                        <label className='min-w-0 space-y-1 text-xs font-medium text-zinc-400'>
                          {t('pages.documents.commercial.vat')}
                          <Input
                            aria-label={t('pages.documents.commercial.vat')}
                            className={fieldClass}
                            type='number'
                            min='0'
                            max='99.999'
                            step='0.001'
                            value={vatRates[line.id] ?? String(line.vatRate ?? 0)}
                            onChange={(event) =>
                              setVatRates((current) => ({
                                ...current,
                                [line.id]: event.target.value,
                              }))
                            }
                          />
                        </label>
                        {isCredit && (
                          <label className='min-w-0 space-y-1 text-xs font-medium text-zinc-400'>
                            {t('pages.documents.commercial.amount')}
                            <Input
                              aria-label={t('pages.documents.commercial.amount')}
                              className={fieldClass}
                              type='number'
                              min='0'
                              step='0.01'
                              value={
                                amounts[line.id] ??
                                String(
                                  Number(quantities[line.id] ?? max) *
                                    Number(line.unitPrice ?? 0),
                                )
                              }
                              onChange={(event) =>
                                setAmounts((current) => ({
                                  ...current,
                                  [line.id]: event.target.value,
                                }))
                              }
                            />
                          </label>
                        )}
                      </div>
                    </article>
                  );
                })}
                {!lines.length && (
                <p className='flex h-full items-center justify-center px-4 text-center text-sm text-zinc-500'>
                  {candidates.length
                    ? t('pages.documents.commercial.selectSources')
                    : t('pages.documents.commercial.noLines')}
                </p>
              )}
              </div>
            </ScrollArea>
          </section>
          {activeType === DocumentType.FINANCIAL_CREDIT && (
            <section aria-live='polite' className='rounded-xl border border-zinc-700 bg-zinc-950/40 p-4'>
              <h3 className='mb-3 text-sm font-medium text-zinc-200'>{t('pages.documents.commercial.previewTotals')}</h3>
              {previewError && <p role='alert' className='text-sm text-rose-300'>{t('pages.documents.commercial.previewError')}</p>}
              {!preview && !previewError && <p className='text-sm text-zinc-400'>{t('pages.documents.commercial.previewLoading')}</p>}
              {preview && !preview.valid && <p role='alert' className='mb-3 text-sm text-rose-300'>{t('pages.documents.commercial.allocationInvalid')}</p>}
              {preview && <dl className='grid grid-cols-3 gap-3 text-sm'>
                <div><dt className='text-xs text-zinc-500'>{t('pages.documents.details.net')}</dt><dd className='mt-1 font-medium'>{formatDocumentAmount(preview.totals.net, selected[0]?.currencyCode, locale)}</dd></div>
                <div><dt className='text-xs text-zinc-500'>{t('pages.documents.details.tax')}</dt><dd className='mt-1 font-medium'>{formatDocumentAmount(preview.totals.tax, selected[0]?.currencyCode, locale)}</dd></div>
                <div><dt className='text-xs text-zinc-500'>{t('pages.documents.details.gross')}</dt><dd className='mt-1 font-medium'>{formatDocumentAmount(preview.totals.gross, selected[0]?.currencyCode, locale)}</dd></div>
              </dl>}
            </section>
          )}
          {preview?.approvalRequired && (
            <p role='status' className='rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-100'>{t('pages.documents.commercial.approvalPreview')}</p>
          )}
          {preview && !preview.valid && activeType !== DocumentType.FINANCIAL_CREDIT && (
            <p role='alert' className='text-sm text-rose-300'>{t('pages.documents.commercial.allocationInvalid')}</p>
          )}
          {previewError && activeType !== DocumentType.FINANCIAL_CREDIT && (
            <p role='alert' className='text-sm text-rose-300'>{t('pages.documents.commercial.previewError')}</p>
          )}
        </AppDialogBody>
        <AppDialogFooter>
          <Button variant='mutedOutline' onClick={() => onOpenChange(false)}>{t('common.cancel')}</Button>
          <Button variant='accentSolid' onClick={() => void submit()} disabled={create.isPending || update.isPending || !selected.length || !lines.length || !preview || !preview.valid || previewError}>
            {create.isPending || update.isPending ? t('pages.documents.commercial.saving') : editDocument ? t('pages.documents.commercial.saveChanges') : t('pages.documents.commercial.createDraft')}
          </Button>
        </AppDialogFooter>
      </ThemedDialogContent>
    </Dialog>
  );
}
