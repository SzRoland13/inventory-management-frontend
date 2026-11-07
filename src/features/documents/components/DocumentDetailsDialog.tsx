'use client';

import { useRef, useState } from 'react';
import {
  Activity,
  ArrowLeft,
  ArrowUpRight,
  Check,
  CircleDollarSign,
  Download,
  ExternalLink,
  FileText,
  Package,
  PackageCheck,
  RefreshCw,
  Upload,
} from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { toast } from 'sonner';
import {
  useConfirmOrderMutation,
  useCommercialActionMutation,
  useDocumentQuery,
  useGeneratePdfMutation,
  useRetryPdfMutation,
  useSettlementOwnersQuery,
} from '@/features/documents/queries/documentQueries';
import { DocumentService } from '@/features/documents/services/DocumentService';
import { createIdempotencyKey } from '@/features/shared/api/idempotencyKey';
import {
  CommercialDocumentOperation,
  DocumentAction,
  DocumentFileSource,
  DocumentFileStatus,
  DocumentType,
} from '@/features/documents/enums/documentEnums';
import type { BusinessDocument } from '@/features/documents/types/documents';
import {
  requireSuccessfulResponse,
  toastApiError,
} from '@/features/shared/api/apiResponse';
import { Badge } from '@/features/shared/components/ui/badge';
import { Button } from '@/features/shared/components/ui/button';
import { Dialog } from '@/features/shared/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/features/shared/components/ui/select';
import { ScrollArea } from '@/features/shared/components/ui/scroll-area';
import {
  AppDialogBody,
  AppDialogFooter,
  AppDialogHeader,
  AppDialogSection,
  appDialogCancelButtonClass,
  appDialogPrimaryButtonClass,
} from '@/features/shared/components/AppDialogLayout';
import { ThemedDialogContent } from '@/features/shared/components/ThemedDialogWrapper';
import { FulfillmentDialog } from '@/features/documents/components/FulfillmentDialog';
import { CloseRemainingDialog } from '@/features/documents/components/CloseRemainingDialog';
import { TransferOperationDialog } from '@/features/documents/components/TransferOperationDialog';
import { ReturnOperationDialog } from '@/features/documents/components/ReturnOperationDialog';
import { StockCountReconciliationDialog } from '@/features/documents/components/StockCountReconciliationDialog';
import { DocumentCorrectionDialog } from '@/features/documents/components/DocumentCorrectionDialog';
import { DocumentDraftEditor } from '@/features/documents/components/DocumentDraftEditor';
import { CommercialDocumentDialog } from '@/features/documents/components/CommercialDocumentDialog';
import {
  documentRelationLabel,
  documentStatusLabel,
  documentTypeLabel,
  formatDocumentAmount,
  formatDocumentTimestamp,
} from '@/features/documents/helpers/documentPresentation';
import { useCurrenciesQuery } from '@/features/settings/queries/companyQueries';

type Props = { document: BusinessDocument | null; onClose: () => void };
type DocumentWorkflowAction = Extract<
  DocumentAction,
  | DocumentAction.DISPATCH
  | DocumentAction.RECEIVE_TRANSFER
  | DocumentAction.RESOLVE_TRANSIT
  | DocumentAction.RELEASE_QUARANTINE
  | DocumentAction.CREATE_RETURN
  | DocumentAction.CREATE_REPLACEMENT_DELIVERY
  | DocumentAction.RECONCILE
  | DocumentAction.CORRECT
>;
const documentWorkflowActions: DocumentWorkflowAction[] = [
  DocumentAction.DISPATCH,
  DocumentAction.RECEIVE_TRANSFER,
  DocumentAction.RESOLVE_TRANSIT,
  DocumentAction.RELEASE_QUARANTINE,
  DocumentAction.CREATE_RETURN,
  DocumentAction.CREATE_REPLACEMENT_DELIVERY,
  DocumentAction.RECONCILE,
  DocumentAction.CORRECT,
];

export function DocumentDetailsDialog({ document, onClose }: Props) {
  const t = useTranslations();
  const locale = useLocale();
  const [documentPath, setDocumentPath] = useState<number[]>([]);
  const activeId = documentPath.at(-1) ?? document?.id ?? null;
  const fileInput = useRef<HTMLInputElement>(null);
  const retryKeys = useRef(new Map<number, string>());
  const detailQuery = useDocumentQuery(activeId);
  const currenciesQuery = useCurrenciesQuery();
  const retryPdf = useRetryPdfMutation();
  const generatePdf = useGeneratePdfMutation();
  const confirmOrder = useConfirmOrderMutation();
  const commercialAction = useCommercialActionMutation();
  const [fulfillmentOpen, setFulfillmentOpen] = useState(false);
  const [closeRemainingOpen, setCloseRemainingOpen] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [commercialEditorOpen, setCommercialEditorOpen] = useState(false);
  const [selectedSettlementOwner, setSelectedSettlementOwner] = useState('');
  const [workflowAction, setWorkflowAction] =
    useState<DocumentWorkflowAction | null>(null);
  const [pdfLanguage, setPdfLanguage] = useState<'en' | 'hu'>(
    locale === 'hu' ? 'hu' : 'en',
  );
  const current =
    detailQuery.data?.payload ?? (activeId === document?.id ? document : null);
  const settlementOwnersQuery = useSettlementOwnersQuery(Boolean(current?.financialSettlementRequired));
  const currenciesById = new Map(
    (currenciesQuery.data?.payload.currencies ?? []).map((currency) => [
      currency.id,
      currency,
    ]),
  );
  function closeDetails() {
    if (editorOpen || commercialEditorOpen) return;
    onClose();
  }
  if (!document) return null;

  if (!current) {
    return (
      <Dialog open onOpenChange={(open) => !open && closeDetails()}>
        <ThemedDialogContent className='!max-w-2xl'>
          <AppDialogHeader
            title={
              detailQuery.isError
                ? t('pages.documents.details.loadError')
                : t('pages.documents.loading')
            }
            description={t('pages.documents.details.loadError')}
            icon={FileText}
            hideDescription
          />
          <AppDialogBody>
            {detailQuery.isError ? (
              <Button
                variant='outline'
                onClick={() => void detailQuery.refetch()}
                className={appDialogCancelButtonClass}
              >
                {t('common.retry')}
              </Button>
            ) : (
              <div
                role='status'
                aria-busy='true'
                className='h-20 animate-pulse rounded-xl bg-zinc-800'
              />
            )}
          </AppDialogBody>
        </ThemedDialogContent>
      </Dialog>
    );
  }

  const documentCurrency = currenciesById.get(current.currencyId ?? -1);
  const documentCurrencyCode =
    current.currencyCode ?? documentCurrency?.code ?? null;
  const currencyNotRecorded = t('pages.documents.details.currencyNotRecorded');
  const latestGeneratedPdf = current.files.find(
    (file) => file.source === DocumentFileSource.GENERATED_PDF,
  );

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
      await requireSuccessfulResponse(
        DocumentService.uploadFile(current.id, file),
      );
      await detailQuery.refetch();
      toast.success(t('pages.documents.files.uploaded'));
    } catch (error) {
      toastApiError(t, error);
    }
  }

  async function retry(fileId: number) {
    if (!current) return;
    const idempotencyKey =
      retryKeys.current.get(fileId) ?? createIdempotencyKey();
    retryKeys.current.set(fileId, idempotencyKey);
    try {
      await retryPdf.mutateAsync({
        id: current.id,
        idempotencyKey,
      });
      retryKeys.current.delete(fileId);
      toast.success(t('pages.documents.files.retryQueued'));
    } catch (error) {
      toastApiError(t, error);
    }
  }

  async function generate() {
    if (!current) return;
    try {
      await generatePdf.mutateAsync({
        id: current.id,
        language: pdfLanguage,
        idempotencyKey: createIdempotencyKey(),
      });
      toast.success(t('pages.documents.files.generationQueued'));
    } catch (error) {
      toastApiError(t, error);
    }
  }

  async function confirm() {
    if (!current) return;
    try {
      await confirmOrder.mutateAsync({
        id: current.id,
        version: current.version,
      });
      toast.success(t('pages.documents.actions.confirmed'));
    } catch (error) {
      toastApiError(t, error);
    }
  }

  async function runCommercialAction(action: CommercialDocumentOperation) {
    if (!current) {
      return;
    }

    try {
      if (action === CommercialDocumentOperation.APPROVE || action === CommercialDocumentOperation.REJECT) {
        const comment = window.prompt(t('pages.documents.commercial.decisionComment'));
        if (!comment?.trim()) {
          return;
        }

        await commercialAction.mutateAsync({ action, id: current.id, version: current.version, comment });
      } else if (action === CommercialDocumentOperation.FINALIZE) {
        await commercialAction.mutateAsync({ action, id: current.id, version: current.version });
      } else {
        if (!selectedSettlementOwner) {
          return;
        }

        await commercialAction.mutateAsync({ action, id: current.id, version: current.version, ownerId: Number(selectedSettlementOwner) });
      }

      await detailQuery.refetch();
      toast.success(t('pages.documents.commercial.actionSaved'));
    } catch (error) {
      toastApiError(t, error);
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && closeDetails()}>
      <ThemedDialogContent className='!h-[min(90vh,56rem)] !max-h-[90vh] !max-w-2xl'>
        <AppDialogHeader
          title={current.number || t('pages.documents.draft')}
          description={`${documentTypeLabel(current.type, t)} · ${current.partnerName || current.routeName || t('pages.documents.noPartner')}`}
          icon={FileText}
        />
        <AppDialogBody className='!overflow-hidden !p-0'>
          <ScrollArea className='h-full'>
            <div className='space-y-6 px-6 py-6 pr-8 sm:px-8'>
              {documentPath.length > 0 && (
                <Button
                  variant='ghost'
                  size='sm'
                  onClick={goBack}
                  className='-ml-2 text-zinc-300'
                >
                  <ArrowLeft />
                  {t('pages.documents.details.back')}
                </Button>
              )}
              <AppDialogSection
                title={t('pages.documents.details.currencyAndRates')}
                icon={CircleDollarSign}
                className='w-full'
              >
                <div className='mb-3 flex flex-wrap items-end justify-between gap-3'>
                  <div>
                    <p className='text-xs text-zinc-500'>
                      {t('pages.documents.details.documentCurrency')}
                    </p>
                    <p className='mt-1 text-sm font-medium text-zinc-100'>
                      {documentCurrencyCode ?? currencyNotRecorded}
                      {documentCurrency?.name
                        ? ` · ${documentCurrency.name}`
                        : ''}
                    </p>
                  </div>
                  <Badge
                    variant='outline'
                    className='border-indigo-400/30 bg-indigo-500/10 text-indigo-200'
                  >
                    {documentCurrencyCode ?? currencyNotRecorded}
                  </Badge>
                </div>
                <div className='mt-4 border-t border-zinc-700 pt-3'>
                  <p className='mb-2 text-xs font-medium uppercase tracking-wide text-zinc-500'>
                    {t('pages.documents.details.appliedExchangeRates')}
                  </p>
                  {(current.exchangeRates ?? []).length > 0 ? (
                    <div className='grid gap-2 sm:grid-cols-2'>
                      {current.exchangeRates!.map((exchangeRate) => {
                        const sourceCurrency = currenciesById.get(
                          exchangeRate.sourceCurrencyId,
                        );
                        const rateText = new Intl.NumberFormat(locale, {
                          maximumFractionDigits: 12,
                        }).format(exchangeRate.rate);
                        return (
                          <div
                            key={exchangeRate.sourceCurrencyId}
                            className='flex items-center justify-between gap-3 rounded-lg border border-zinc-700/80 bg-zinc-900/60 px-3 py-2 text-sm'
                          >
                            <span className='text-zinc-300'>
                              {t('pages.documents.details.exchangeRateFrom', {
                                source:
                                  sourceCurrency?.code ??
                                  `#${exchangeRate.sourceCurrencyId}`,
                              })}
                            </span>
                            <span className='shrink-0 font-medium tabular-nums text-zinc-100'>
                              {rateText}{' '}
                              {documentCurrencyCode ?? currencyNotRecorded}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className='text-sm text-zinc-500'>
                      {t('pages.documents.details.noExchangeRates')}
                    </p>
                  )}
                </div>
              </AppDialogSection>
              <div className='space-y-6'>
                <div className='space-y-6'>
                  {current.nonBillable && (
                    <p className='rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-100'>
                      {t('pages.documents.operations.nonBillable')}
                    </p>
                  )}
                  {current.allowedActions.some((action) =>
                    documentWorkflowActions.includes(
                      action as DocumentWorkflowAction,
                    ),
                  ) && (
                    <div className='flex flex-wrap gap-2'>
                      {current.allowedActions
                        .filter((action): action is DocumentWorkflowAction =>
                          documentWorkflowActions.includes(
                            action as DocumentWorkflowAction,
                          ),
                        )
                        .map((action) => (
                          <Button
                            key={action}
                            variant='outline'
                            onClick={() => setWorkflowAction(action)}
                            className='border-zinc-600 bg-zinc-800'
                          >
                            {t(`pages.documents.actions.${action}`)}
                          </Button>
                        ))}
                    </div>
                  )}
                  <AppDialogSection
                    title={t('pages.documents.details.items')}
                    icon={Package}
                  >
                    <div className='mb-3 flex justify-end'>
                      <Badge
                        variant='outline'
                        className='border-zinc-600 text-zinc-300'
                      >
                        {documentStatusLabel(current.status, t)}
                      </Badge>
                    </div>
                    {(current.paymentTerms || current.approvalRequired || current.financialSettlementRequired) && (
                      <div className='mb-3 space-y-2 rounded-lg border border-zinc-700 bg-zinc-950/40 p-3 text-sm'>
                        {current.paymentTerms && <p className='text-zinc-300'>{t('pages.documents.commercial.paymentTerms')}: {current.paymentTerms}</p>}
                        {current.approvalRequired && current.approvalStatus && <p className='text-amber-200'>{t('pages.documents.commercial.approval')}: {t(`pages.documents.commercial.approvalStatus.${current.approvalStatus}`)} {current.approvalComment ? `· ${current.approvalComment}` : ''}</p>}
                        {current.financialSettlementRequired && <p className='text-amber-200'>{t('pages.documents.commercial.settlementRequired')} · {current.financialSettlementOwnerName ?? t('pages.documents.commercial.unassigned')}</p>}
                      </div>
                    )}
                    <div className='space-y-2'>
                      {current.lines.map((line) => (
                        <article
                          key={line.id}
                          className='w-full rounded-xl border border-zinc-700 bg-zinc-800/40 p-4'
                        >
                          <div className='flex min-w-0 items-start justify-between gap-3'>
                            <div className='min-w-0'>
                              <p className='truncate text-sm font-medium'>
                                {line.productName}
                              </p>
                              <p className='text-xs text-zinc-500'>
                                {line.productCode}
                              </p>
                              {line.sourceAllocations?.map((allocation) => (
                                <button
                                  key={`${allocation.sourceDocumentId}-${allocation.sourceLineId}`}
                                  type='button'
                                  onClick={() =>
                                    openRelated(allocation.sourceDocumentId)
                                  }
                                  className='mt-1 block text-xs text-indigo-300 hover:text-indigo-200'
                                >
                                  {t('pages.documents.details.allocatedFrom', {
                                    number: allocation.sourceDocumentNumber,
                                    quantity: allocation.quantity,
                                  })}
                                </button>
                              ))}
                            </div>
                            {line.unitPrice !== undefined && (
                              <div className='shrink-0 text-right'>
                                <p className='text-[10px] uppercase tracking-wide text-zinc-500'>
                                  {t('pages.documents.details.unitPrice')}
                                </p>
                                <p className='mt-0.5 text-xs tabular-nums text-zinc-300'>
                                  {formatDocumentAmount(
                                    line.unitPrice,
                                    current.totals?.currencyCode ??
                                      documentCurrencyCode,
                                    locale,
                                  )}
                                </p>
                              </div>
                            )}
                          </div>
                          <div
                            className={`mt-3 grid ${showBillingProgress ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-2 sm:grid-cols-3'} gap-3`}
                          >
                            <LineMetric
                              label={t('pages.documents.details.ordered')}
                              value={line.orderedQuantity}
                              unit={line.unitName}
                            />
                            <LineMetric
                              label={t('pages.documents.details.done')}
                              value={line.fulfilledQuantity}
                              unit={line.unitName}
                            />
                            <LineMetric
                              label={t('pages.documents.details.remaining')}
                              value={line.remainingQuantity}
                              unit={line.unitName}
                            />
                            {showBillingProgress && (
                              <LineMetric
                                label={t('pages.documents.details.billed')}
                                value={line.billedQuantity ?? 0}
                                unit={line.unitName}
                                accent
                              />
                            )}
                          </div>
                        </article>
                      ))}
                      {!current.lines.length && (
                        <p className='rounded-xl border border-zinc-700 bg-zinc-800/40 p-5 text-sm text-zinc-400'>
                          {t('pages.documents.details.noItems')}
                        </p>
                      )}
                    </div>
                    {current.totals && (
                      <dl className='mt-3 grid grid-cols-3 gap-3 rounded-xl border border-zinc-700 bg-zinc-800/40 p-4 text-sm'>
                        <div>
                          <dt className='text-xs text-zinc-500'>
                            {t('pages.documents.details.net')}
                          </dt>
                          <dd className='mt-1 font-medium tabular-nums'>
                            {formatDocumentAmount(
                              current.totals.net,
                              current.totals.currencyCode ??
                                current.currencyCode,
                              locale,
                            )}
                          </dd>
                        </div>
                        <div>
                          <dt className='text-xs text-zinc-500'>
                            {t('pages.documents.details.tax')}
                          </dt>
                          <dd className='mt-1 font-medium tabular-nums'>
                            {formatDocumentAmount(
                              current.totals.tax,
                              current.totals.currencyCode ??
                                current.currencyCode,
                              locale,
                            )}
                          </dd>
                        </div>
                        <div>
                          <dt className='text-xs text-zinc-500'>
                            {t('pages.documents.details.gross')}
                          </dt>
                          <dd className='mt-1 font-semibold tabular-nums text-zinc-100'>
                            {formatDocumentAmount(
                              current.totals.gross,
                              current.totals.currencyCode ??
                                current.currencyCode,
                              locale,
                            )}
                          </dd>
                        </div>
                      </dl>
                    )}
                  </AppDialogSection>

                  <AppDialogSection
                    title={t('pages.documents.details.activity')}
                    icon={Activity}
                  >
                    <div className='space-y-3'>
                      {current.activity.map((event) => (
                        <div key={event.id} className='flex gap-3 text-sm'>
                          <span className='mt-1.5 h-2 w-2 shrink-0 rounded-full bg-indigo-400' />
                          <div>
                            <p className='text-zinc-200'>{event.description}</p>
                            <p className='mt-0.5 text-xs text-zinc-500'>
                              {event.actorName ? `${event.actorName} · ` : ''}
                              {formatDocumentTimestamp(
                                event.occurredAt,
                                locale,
                              )}
                            </p>
                          </div>
                        </div>
                      ))}
                      {!current.activity.length && (
                        <p className='text-sm text-zinc-500'>
                          {t('pages.documents.details.noActivity')}
                        </p>
                      )}
                    </div>
                  </AppDialogSection>
                </div>

                <aside className='grid gap-5 md:grid-cols-2'>
                  <AppDialogSection
                    title={t('pages.documents.files.title')}
                    icon={FileText}
                  >
                    <div className='mb-3 flex items-center justify-end gap-2'>
                      {current.allowedActions.includes(
                        DocumentAction.UPLOAD_FILE,
                      ) && (
                        <Button
                          size='sm'
                          variant='outline'
                          className='border-zinc-600 bg-zinc-800'
                          onClick={() => fileInput.current?.click()}
                        >
                          <Upload />
                          {t('pages.documents.files.add')}
                        </Button>
                      )}
                    </div>
                    <input
                      ref={fileInput}
                      type='file'
                      className='hidden'
                      onChange={(event) => {
                        void uploadFile(event.target.files?.[0]);
                        event.currentTarget.value = '';
                      }}
                    />
                    <div className='space-y-2'>
                      {current.files.map((file) => (
                        <div
                          key={file.id}
                          className='flex items-center gap-3 rounded-lg border border-zinc-700 bg-zinc-900/70 p-3'
                        >
                          <span className='flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-300'>
                            <FileText className='h-4 w-4' />
                          </span>
                          <div className='min-w-0 flex-1'>
                            <p className='truncate text-sm font-medium'>
                              {file.fileName}
                            </p>
                            <p className='text-xs text-zinc-500'>
                              {t(
                                `pages.documents.files.sources.${file.source}`,
                              )}
                              {file.status
                                ? ` · ${t(`pages.documents.files.status.${file.status}`)}`
                                : ''}
                            </p>
                            {file.errorMessage && (
                              <p
                                role='alert'
                                className='mt-1 text-xs text-rose-300'
                              >
                                {file.errorMessage}
                              </p>
                            )}
                          </div>
                          {file.id === latestGeneratedPdf?.id &&
                            file.source === DocumentFileSource.GENERATED_PDF &&
                            file.status === DocumentFileStatus.FAILED &&
                            current.allowedActions.includes(
                              DocumentAction.RETRY_PDF,
                            ) && (
                              <Button
                                variant='ghost'
                                size='icon-sm'
                                disabled={retryPdf.isPending}
                                onClick={() => void retry(file.id)}
                                aria-label={t('pages.documents.files.retry')}
                              >
                                <RefreshCw className='h-4 w-4' />
                              </Button>
                            )}
                          {(file.source !== DocumentFileSource.GENERATED_PDF ||
                            file.status === DocumentFileStatus.COMPLETED) &&
                            file.downloadUrl && (
                              <>
                                <Button
                                  asChild
                                  variant='ghost'
                                  size='icon-sm'
                                  aria-label={t('pages.documents.files.open')}
                                >
                                  <a
                                    href={file.downloadUrl}
                                    target='_blank'
                                    rel='noreferrer'
                                  >
                                    <ExternalLink className='h-4 w-4' />
                                  </a>
                                </Button>
                                <Button
                                  asChild
                                  variant='ghost'
                                  size='icon-sm'
                                  aria-label={t(
                                    'pages.documents.files.download',
                                  )}
                                >
                                  <a href={file.downloadUrl} download>
                                    <Download className='h-4 w-4' />
                                  </a>
                                </Button>
                              </>
                            )}
                        </div>
                      ))}
                      {!current.files.length && (
                        <p className='py-3 text-sm text-zinc-500'>
                          {t('pages.documents.files.empty')}
                        </p>
                      )}
                    </div>
                  </AppDialogSection>
                  <AppDialogSection
                    title={t('pages.documents.details.related')}
                    icon={ArrowUpRight}
                  >
                    <div className='space-y-2'>
                      {current.relatedDocuments.map((related) => (
                        <RelatedDocument
                          key={related.id}
                          type={related.type}
                          number={related.number}
                          label={
                            related.relationKind
                              ? documentRelationLabel(related.relationKind, t)
                              : t('pages.documents.details.relatedDocument')
                          }
                          onClick={() => openRelated(related.id)}
                        />
                      ))}
                      {!current.relatedDocuments.length && (
                        <p className='text-sm text-zinc-500'>
                          {t('pages.documents.details.noRelated')}
                        </p>
                      )}
                    </div>
                  </AppDialogSection>
                </aside>
              </div>
            </div>
          </ScrollArea>
        </AppDialogBody>
        {(current.allowedActions.includes(DocumentAction.EDIT) ||
          current.allowedActions.includes(DocumentAction.CONFIRM) ||
          current.allowedActions.includes(DocumentAction.POST) ||
          current.allowedActions.includes(DocumentAction.CLOSE_REMAINING) ||
          current.allowedActions.includes(DocumentAction.GENERATE_PDF) ||
          current.allowedActions.includes(DocumentAction.APPROVE) ||
          current.allowedActions.includes(DocumentAction.REJECT) ||
          current.allowedActions.includes(DocumentAction.FINALIZE) ||
          current.allowedActions.includes(DocumentAction.ASSIGN_SETTLEMENT)) && (
          <AppDialogFooter>
            {current.allowedActions.includes(DocumentAction.POST) && (
              <Button
                onClick={() => setFulfillmentOpen(true)}
                className='bg-indigo-500 text-white hover:bg-indigo-400'
              >
                <PackageCheck />
                {t('pages.documents.actions.POST')}
              </Button>
            )}
            {current.allowedActions.includes(
              DocumentAction.CLOSE_REMAINING,
            ) && (
              <Button
                variant='outline'
                onClick={() => setCloseRemainingOpen(true)}
                className={appDialogCancelButtonClass}
              >
                {t('pages.documents.actions.CLOSE_REMAINING')}
              </Button>
            )}
            {current.allowedActions.includes(DocumentAction.GENERATE_PDF) && (
              <div className='flex items-center gap-2'>
                <Select
                  value={pdfLanguage}
                  onValueChange={(value) =>
                    setPdfLanguage(value as 'en' | 'hu')
                  }
                  disabled={generatePdf.isPending}
                >
                  <SelectTrigger
                    aria-label={t('pages.documents.files.pdfLanguage')}
                    className='w-36 border-zinc-600 bg-zinc-800 text-zinc-100'
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className='border-zinc-700 bg-zinc-800 text-zinc-100'>
                    <SelectItem value='en'>
                      {t('pages.documents.files.languages.en')}
                    </SelectItem>
                    <SelectItem value='hu'>
                      {t('pages.documents.files.languages.hu')}
                    </SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant='outline'
                  onClick={() => void generate()}
                  disabled={generatePdf.isPending}
                  className={appDialogCancelButtonClass}
                >
                  <FileText />
                  {t(
                    generatePdf.isPending
                      ? 'pages.documents.files.generating'
                      : 'pages.documents.actions.GENERATE_PDF',
                  )}
                </Button>
              </div>
            )}
            {current.allowedActions.includes(DocumentAction.EDIT) && (
              <Button
                variant='outline'
                onClick={() => {
                  if ([DocumentType.SUPPLIER_BILL, DocumentType.CUSTOMER_INVOICE, DocumentType.FINANCIAL_CREDIT].includes(current.type as DocumentType)) setCommercialEditorOpen(true);
                  else setEditorOpen(true);
                }}
                className={appDialogCancelButtonClass}
              >
                {t('pages.documents.actions.EDIT')}
              </Button>
            )}
            {current.allowedActions.includes(DocumentAction.CONFIRM) && (
              <Button
                onClick={() => void confirm()}
                disabled={confirmOrder.isPending}
                className={appDialogPrimaryButtonClass}
              >
                <Check />
                {t('pages.documents.actions.CONFIRM')}
              </Button>
            )}
            {current.allowedActions.includes(DocumentAction.APPROVE) && <Button onClick={() => void runCommercialAction(CommercialDocumentOperation.APPROVE)} disabled={commercialAction.isPending}>{t('pages.documents.actions.APPROVE')}</Button>}
            {current.allowedActions.includes(DocumentAction.REJECT) && <Button variant='outline' onClick={() => void runCommercialAction(CommercialDocumentOperation.REJECT)} disabled={commercialAction.isPending}>{t('pages.documents.actions.REJECT')}</Button>}
            {current.allowedActions.includes(DocumentAction.FINALIZE) && <Button onClick={() => void runCommercialAction(CommercialDocumentOperation.FINALIZE)} disabled={commercialAction.isPending}>{t('pages.documents.actions.FINALIZE')}</Button>}
            {current.allowedActions.includes(DocumentAction.ASSIGN_SETTLEMENT) && <div className='flex items-center gap-2'>
              <Select value={selectedSettlementOwner} onValueChange={setSelectedSettlementOwner}>
                <SelectTrigger aria-label={t('pages.documents.commercial.ownerSelect')} className='w-56 border-zinc-600 bg-zinc-800 text-zinc-100'><SelectValue placeholder={t('pages.documents.commercial.ownerSelect')} /></SelectTrigger>
                <SelectContent className='border-zinc-700 bg-zinc-800 text-zinc-100'>
                  {(settlementOwnersQuery.data?.payload ?? []).map((owner) => <SelectItem key={owner.id} value={String(owner.id)}>{owner.username} · {owner.role}</SelectItem>)}
                </SelectContent>
              </Select>
              <Button variant='outline' onClick={() => void runCommercialAction(CommercialDocumentOperation.ASSIGN_SETTLEMENT)} disabled={commercialAction.isPending || !selectedSettlementOwner}>{t('pages.documents.actions.ASSIGN_SETTLEMENT')}</Button>
            </div>}
          </AppDialogFooter>
        )}
      </ThemedDialogContent>
      {fulfillmentOpen && (
        <FulfillmentDialog
          key={`${current.id}-${fulfillmentOpen}`}
          source={current}
          onClose={() => setFulfillmentOpen(false)}
          onComplete={() => {
            setFulfillmentOpen(false);
            onClose();
          }}
        />
      )}
      <CloseRemainingDialog
        document={closeRemainingOpen ? current : null}
        onClose={() => setCloseRemainingOpen(false)}
      />
      <DocumentDraftEditor
        document={editorOpen ? current : null}
        onClose={() => {
          setEditorOpen(false);
          void detailQuery.refetch();
        }}
      />
      <CommercialDocumentDialog
        key={`commercial-edit-${current.id}-${current.version}`}
        open={commercialEditorOpen}
        type={null}
        editDocument={commercialEditorOpen ? current : null}
        onOpenChange={(open) => {
          setCommercialEditorOpen(open);
          if (!open) void detailQuery.refetch();
        }}
      />
      {(workflowAction === DocumentAction.DISPATCH ||
        workflowAction === DocumentAction.RECEIVE_TRANSFER ||
        workflowAction === DocumentAction.RESOLVE_TRANSIT) && (
        <TransferOperationDialog
          key={`${current.id}-${workflowAction}`}
          document={current}
          action={workflowAction}
          onClose={() => setWorkflowAction(null)}
          onComplete={() => {
            setWorkflowAction(null);
            void detailQuery.refetch();
          }}
        />
      )}
      {(workflowAction === DocumentAction.CREATE_RETURN ||
        workflowAction === DocumentAction.RELEASE_QUARANTINE ||
        workflowAction === DocumentAction.CREATE_REPLACEMENT_DELIVERY) && (
        <ReturnOperationDialog
          key={`${current.id}-${workflowAction}`}
          document={current}
          action={workflowAction}
          onClose={() => setWorkflowAction(null)}
          onComplete={() => {
            setWorkflowAction(null);
            void detailQuery.refetch();
          }}
        />
      )}
      {workflowAction === DocumentAction.RECONCILE && (
        <StockCountReconciliationDialog
          key={current.id}
          document={current}
          onClose={() => setWorkflowAction(null)}
          onComplete={() => {
            setWorkflowAction(null);
            void detailQuery.refetch();
          }}
        />
      )}
      {workflowAction === DocumentAction.CORRECT && (
        <DocumentCorrectionDialog
          key={current.id}
          document={current}
          onClose={() => setWorkflowAction(null)}
          onComplete={() => {
            setWorkflowAction(null);
            void detailQuery.refetch();
          }}
        />
      )}
    </Dialog>
  );
}

function LineMetric({
  label,
  value,
  unit,
  accent = false,
}: {
  label: string;
  value: number;
  unit: string;
  accent?: boolean;
}) {
  return (
    <div className='min-w-0 rounded-lg bg-zinc-900/60 px-2.5 py-2'>
      <p className='truncate text-[10px] font-medium uppercase tracking-wide text-zinc-500'>
        {label}
      </p>
      <p
        className={`mt-1 truncate text-sm tabular-nums ${accent ? 'text-indigo-200' : 'text-zinc-200'}`}
      >
        {value} <span className='text-xs text-zinc-500'>{unit}</span>
      </p>
    </div>
  );
}

function RelatedDocument({
  type,
  number,
  label,
  onClick,
}: {
  type: BusinessDocument['type'];
  number: string | null;
  label: string;
  onClick: () => void;
}) {
  const t = useTranslations();
  return (
    <button
      type='button'
      onClick={onClick}
      className='group w-full rounded-lg border border-zinc-700 bg-zinc-900/60 p-3 text-left transition hover:border-indigo-400/50 hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400'
    >
      <span className='flex items-center justify-between gap-2'>
        <span className='text-xs text-zinc-500'>{label}</span>
        <ArrowUpRight className='h-3.5 w-3.5 text-zinc-500 group-hover:text-indigo-300' />
      </span>
      <span className='mt-1 block text-sm font-medium'>
        {number || t('pages.documents.draft')}{' '}
        <span className='font-normal text-zinc-400'>
          · {documentTypeLabel(type, t)}
        </span>
      </span>
    </button>
  );
}
