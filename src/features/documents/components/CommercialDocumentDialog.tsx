'use client';

import { useMemo, useState } from 'react';
import { FilePlus2 } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { useCreateCommercialDraftMutation, useDocumentsQuery, useUpdateCommercialDraftMutation } from '@/features/documents/queries/documentQueries';
import { DocumentQueueView, DocumentRelationKind, DocumentStatus, DocumentType } from '@/features/documents/enums/documentEnums';
import type { BusinessDocument, CommercialDocumentType, DocumentLine } from '@/features/documents/types/documents';
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

type Props = { open: boolean; type: CommercialDocumentType | null; editDocument?: BusinessDocument | null; onOpenChange: (open: boolean) => void };

function sourceLines(document: BusinessDocument): DocumentLine[] {
  return document.lines;
}

export function CommercialDocumentDialog({ open, type, editDocument = null, onOpenChange }: Props) {
  const t = useTranslations();
  const docsQuery = useDocumentsQuery({ view: DocumentQueueView.ALL, page: 0, pageSize: 100 });
  const create = useCreateCommercialDraftMutation();
  const update = useUpdateCommercialDraftMutation();
  const activeType = type ?? (editDocument?.type as CommercialDocumentType | undefined) ?? null;
  const [sourceIds, setSourceIds] = useState<number[]>(() => editDocument?.relatedDocuments.filter((doc) => doc.relationKind === DocumentRelationKind.CREATED_FROM || doc.relationKind === DocumentRelationKind.FINANCIAL_CREDIT).map((doc) => doc.id) ?? []);
  const [date, setDate] = useState(() => editDocument?.date ?? new Date().toISOString().slice(0, 10));
  const [reason, setReason] = useState(() => activeType === DocumentType.FINANCIAL_CREDIT ? editDocument?.reason ?? '' : editDocument?.referenceNumber ?? '');
  const [quantities, setQuantities] = useState<Record<number, string>>(() => Object.fromEntries((editDocument?.lines ?? []).filter((line) => line.sourceLineId).map((line) => [line.sourceLineId!, String(line.operationQuantity ?? line.orderedQuantity)])));
  const [prices, setPrices] = useState<Record<number, string>>(() => Object.fromEntries((editDocument?.lines ?? []).filter((line) => line.sourceLineId).map((line) => [line.sourceLineId!, String(line.unitPrice ?? '')])));
  const [vatRates, setVatRates] = useState<Record<number, string>>(() => Object.fromEntries((editDocument?.lines ?? []).filter((line) => line.sourceLineId && line.vatRate !== null && line.vatRate !== undefined).map((line) => [line.sourceLineId!, String(line.vatRate)])));
  const [amounts, setAmounts] = useState<Record<number, string>>(() => Object.fromEntries((editDocument?.lines ?? []).filter((line) => line.sourceLineId && line.netAmount !== null && line.netAmount !== undefined).map((line) => [line.sourceLineId!, String(line.netAmount)])));

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
  const selected = candidates.filter((doc) => sourceIds.includes(doc.id));
  const editableLineIds = new Set((editDocument?.lines ?? []).map((line) => line.sourceLineId).filter((id): id is number => id !== null && id !== undefined));
  const lines = selected.flatMap((doc) => sourceLines(doc).map((line) => ({ document: doc, line })))
    .filter(({ line }) => !editDocument || editableLineIds.has(line.id));

  function toggleSource(id: number) {
    setSourceIds((current) => current.includes(id) ? current.filter((value) => value !== id) : [...current, id]);
  }

  async function submit() {
    if (!activeType || !selected.length || !lines.length || !selected[0].currencyId) return;
    try {
      const request = {
        type: activeType,
        sourceDocumentIds: selected.map((doc) => doc.id),
        date,
        currencyId: selected[0].currencyId,
        ...(activeType === DocumentType.FINANCIAL_CREDIT
          ? { reason: reason.trim() || undefined }
          : { referenceNumber: reason.trim() || undefined }),
        lines: lines.map(({ line }) => ({
          sourceLineId: line.id,
          quantity: Number(quantities[line.id] ?? line.operationQuantity ?? line.orderedQuantity),
          unitPrice: prices[line.id] ? Number(prices[line.id]) : line.unitPrice,
          vatRate: vatRates[line.id] ? Number(vatRates[line.id]) : line.vatRate ?? undefined,
          ...(activeType === DocumentType.FINANCIAL_CREDIT
            ? { amount: Number(amounts[line.id] ?? (Number(quantities[line.id] ?? line.operationQuantity ?? line.orderedQuantity) * Number(line.unitPrice ?? 0))) }
            : {}),
        })),
      };
      if (editDocument) await update.mutateAsync({ id: editDocument.id, request: { version: editDocument.version, draft: request } });
      else await create.mutateAsync(request);
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
            <div className='max-h-48 space-y-2 overflow-auto rounded-lg border border-zinc-700 p-3'>
              {candidates.map((doc) => (
                <label key={doc.id} className='flex items-center gap-3 text-sm text-zinc-200'>
                  <input type='checkbox' checked={sourceIds.includes(doc.id)} disabled={Boolean(editDocument)} onChange={() => toggleSource(doc.id)} />
                  <span>{doc.number ?? `#${doc.id}`} · {doc.partnerName ?? t('pages.documents.noPartner')}</span>
                </label>
              ))}
              {!candidates.length && <p className='text-sm text-zinc-400'>{t('pages.documents.commercial.noSources')}</p>}
            </div>
          </fieldset>
          <div className='grid gap-3 sm:grid-cols-2'>
            <div className='space-y-2'><Label htmlFor='commercial-date'>{t('pages.documents.create.date')}</Label><Input id='commercial-date' type='date' value={date} onChange={(event) => setDate(event.target.value)} /></div>
            <div className='space-y-2'><Label htmlFor='commercial-reason'>{t(activeType === DocumentType.FINANCIAL_CREDIT ? 'pages.documents.commercial.reason' : 'pages.documents.commercial.referenceNumber')}</Label><Input id='commercial-reason' value={reason} onChange={(event) => setReason(event.target.value)} /></div>
          </div>
          {!!lines.length && <section className='space-y-2'>
            <h3 className='text-sm font-medium text-zinc-200'>{t('pages.documents.commercial.lines')}</h3>
            {lines.map(({ document, line }) => {
              const max = line.operationQuantity ?? line.orderedQuantity;
              return <div key={`${document.id}-${line.id}`} className={`grid ${activeType === DocumentType.FINANCIAL_CREDIT ? 'grid-cols-[1fr_5rem_5rem_4rem_6rem]' : 'grid-cols-[1fr_6rem_6rem_5rem]'} items-center gap-3 rounded-lg border border-zinc-800 p-3 text-sm`}>
                <div className='min-w-0'><p className='truncate text-zinc-100'>{line.productName}</p><p className='text-xs text-zinc-400'>{document.number} · {line.unitName} · {t('pages.documents.commercial.available', { quantity: max })}</p></div>
                <Input aria-label={t('pages.documents.commercial.quantity')} type='number' min={activeType === DocumentType.FINANCIAL_CREDIT ? '0' : '0.00000001'} max={max} step='any' value={quantities[line.id] ?? String(max)} onChange={(event) => setQuantities((current) => ({ ...current, [line.id]: event.target.value }))} />
                <Input aria-label={t('pages.documents.details.unitPrice')} type='number' min='0' step='any' value={prices[line.id] ?? String(line.unitPrice ?? '')} onChange={(event) => setPrices((current) => ({ ...current, [line.id]: event.target.value }))} />
                <Input aria-label={t('pages.documents.commercial.vat')} type='number' min='0' max='99.999' step='0.001' value={vatRates[line.id] ?? String(line.vatRate ?? 0)} onChange={(event) => setVatRates((current) => ({ ...current, [line.id]: event.target.value }))} />
                {activeType === DocumentType.FINANCIAL_CREDIT && <Input aria-label={t('pages.documents.commercial.amount')} type='number' min='0' step='0.01' value={amounts[line.id] ?? String(Number(quantities[line.id] ?? max) * Number(line.unitPrice ?? 0))} onChange={(event) => setAmounts((current) => ({ ...current, [line.id]: event.target.value }))} />}
              </div>;
            })}
          </section>}
        </AppDialogBody>
        <AppDialogFooter>
          <Button variant='mutedOutline' onClick={() => onOpenChange(false)}>{t('common.cancel')}</Button>
          <Button variant='accentSolid' onClick={() => void submit()} disabled={create.isPending || update.isPending || !selected.length || !lines.length}>
            {create.isPending || update.isPending ? t('pages.documents.commercial.saving') : editDocument ? t('pages.documents.commercial.saveChanges') : t('pages.documents.commercial.createDraft')}
          </Button>
        </AppDialogFooter>
      </ThemedDialogContent>
    </Dialog>
  );
}
