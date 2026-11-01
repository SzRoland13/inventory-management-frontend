import {
  AlertCircle,
  ArrowUpRight,
  ClipboardList,
  FileClock,
  FileText,
  PackageCheck,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  Truck,
  Warehouse,
} from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import {
  documentActionLabel,
  documentStatusLabel,
  documentTypeLabel,
  formatDocumentAmount,
  formatDocumentDate,
} from '@/features/documents/helpers/documentPresentation';
import { DocumentQueueView } from '@/features/documents/enums/documentEnums';
import type { BusinessDocument } from '@/features/documents/types/documents';
import { Badge } from '@/features/shared/components/ui/badge';
import { Button } from '@/features/shared/components/ui/button';

const queueViews: Array<{ id: DocumentQueueView; icon: typeof FileText }> = [
  { id: DocumentQueueView.MY_DRAFTS, icon: FileText },
  { id: DocumentQueueView.READY_TO_RECEIVE, icon: PackageCheck },
  { id: DocumentQueueView.READY_TO_SHIP, icon: Truck },
  { id: DocumentQueueView.PARTIALLY_FULFILLED, icon: ArrowUpRight },
  { id: DocumentQueueView.TRANSFERS, icon: Warehouse },
  { id: DocumentQueueView.IN_TRANSIT, icon: Truck },
  { id: DocumentQueueView.RETURNS, icon: RotateCcw },
  { id: DocumentQueueView.STOCK_COUNTS, icon: ClipboardList },
  { id: DocumentQueueView.CORRECTIONS, icon: FileClock },
  { id: DocumentQueueView.SUPPLIER_BILLS, icon: FileText },
  { id: DocumentQueueView.CUSTOMER_INVOICES, icon: FileText },
  { id: DocumentQueueView.FINANCIAL_CREDITS, icon: RotateCcw },
  { id: DocumentQueueView.NEEDS_APPROVAL, icon: ShieldCheck },
  { id: DocumentQueueView.ALL, icon: FileText },
];

const defaultQueueViews: DocumentQueueView[] = [
  DocumentQueueView.MY_DRAFTS,
  DocumentQueueView.READY_TO_RECEIVE,
  DocumentQueueView.READY_TO_SHIP,
  DocumentQueueView.PARTIALLY_FULFILLED,
  DocumentQueueView.ALL,
];

type Props = {
  activeView: DocumentQueueView;
  counts?: Partial<Record<DocumentQueueView, number>>;
  documents: BusinessDocument[];
  onViewChange: (view: DocumentQueueView) => void;
  onSelect: (document: BusinessDocument) => void;
  isLoading?: boolean;
  error?: boolean;
  onRetry?: () => void;
  availableViews?: DocumentQueueView[];
};

export function DocumentQueue({
  activeView,
  counts,
  documents,
  onViewChange,
  onSelect,
  isLoading = false,
  error = false,
  onRetry,
  availableViews,
}: Props) {
  const t = useTranslations();
  const visibleViews = queueViews.filter(({ id }) =>
    (availableViews ?? defaultQueueViews).includes(id),
  );

  return (
    <div className='space-y-5'>
      <nav
        aria-label={t('pages.documents.queue.title')}
        className='flex gap-2 overflow-x-auto pb-1'
      >
        {visibleViews.map(({ id, icon: Icon }) => (
          <Button
            key={id}
            variant={activeView === id ? 'secondary' : 'ghost'}
            onClick={() => onViewChange(id)}
            data-active={activeView === id}
            className='h-10 shrink-0 gap-2 border border-zinc-700 bg-zinc-900/70 text-zinc-300 hover:bg-zinc-800 hover:text-white data-[active=true]:border-indigo-400/40 data-[active=true]:bg-indigo-500/10 data-[active=true]:text-indigo-200'
          >
            <Icon className='h-4 w-4' />
            {t(`pages.documents.queue.views.${id}`)}
            <span className='rounded-full bg-zinc-700/80 px-2 py-0.5 text-xs tabular-nums text-zinc-300'>
              {counts?.[id] ?? '–'}
            </span>
          </Button>
        ))}
      </nav>

      {isLoading ? (
        <LoadingRows label={t('pages.documents.loading')} />
      ) : error ? (
        <DocumentLoadError onRetry={onRetry} />
      ) : documents.length ? (
        <div className='grid gap-3'>
          {documents.map((document) => (
            <DocumentQueueRow
              key={document.id}
              document={document}
              onClick={() => onSelect(document)}
            />
          ))}
        </div>
      ) : (
        <DocumentEmptyState />
      )}
    </div>
  );
}

function LoadingRows({ label }: { label: string }) {
  return (
    <div
      className='grid gap-3'
      aria-busy='true'
      role='status'
      aria-label={label}
    >
      {[0, 1, 2].map((row) => (
        <div
          key={row}
          className='h-[88px] animate-pulse rounded-xl border border-zinc-800 bg-zinc-900/70'
        />
      ))}
    </div>
  );
}

function DocumentLoadError({ onRetry }: { onRetry?: () => void }) {
  const t = useTranslations();

  return (
    <div className='flex flex-col gap-4 rounded-xl border border-amber-500/20 bg-amber-500/[0.04] p-4 sm:flex-row sm:items-center'>
      <span className='flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-400/10 text-amber-200'>
        <AlertCircle className='h-5 w-5' />
      </span>
      <div className='min-w-0 flex-1'>
        <h3 className='text-sm font-semibold text-zinc-100'>
          {t('pages.documents.loadError.title')}
        </h3>
        <p className='mt-1 text-sm text-zinc-400'>
          {t('pages.documents.loadError.description')}
        </p>
      </div>
      <Button
        variant='outline'
        size='sm'
        onClick={onRetry}
        className='shrink-0 border-zinc-600 bg-zinc-800 text-zinc-100'
      >
        <RefreshCw className='h-4 w-4' />
        {t('common.retry')}
      </Button>
    </div>
  );
}

function DocumentQueueRow({
  document,
  onClick,
}: {
  document: BusinessDocument;
  onClick: () => void;
}) {
  const t = useTranslations();
  const locale = useLocale();

  return (
    <button
      type='button'
      onClick={onClick}
      className='group grid w-full gap-4 rounded-xl border border-zinc-700/80 bg-zinc-900/70 p-4 text-left transition hover:border-indigo-400/50 hover:bg-zinc-800/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:p-5'
    >
      <div className='min-w-0'>
        <div className='mb-2 flex flex-wrap items-center gap-2'>
          <span className='font-semibold text-zinc-100'>
            {document.number || t('pages.documents.draft')}
          </span>
          <Badge
            variant='outline'
            className='border-zinc-600 bg-zinc-800/70 text-zinc-300'
          >
            {documentTypeLabel(document.type, t)}
          </Badge>
          <StatusBadge status={document.status} />
        </div>
        <div className='flex flex-wrap gap-x-4 gap-y-1 text-sm text-zinc-400'>
          <span>
            {document.partnerName ||
              document.routeName ||
              t('pages.documents.noPartner')}
          </span>
          <span>
            {t('pages.documents.owner', { name: document.ownerName ?? '' })}
          </span>
          <span>{formatDocumentDate(document.date, locale)}</span>
          {document.totals && (
            <span className='font-medium tabular-nums text-zinc-300'>
              {formatDocumentAmount(
                document.totals.gross,
                document.totals.currencyCode ?? document.currencyCode,
                locale,
              )}
            </span>
          )}
        </div>
      </div>
      <div className='flex items-center justify-between gap-4 sm:justify-end'>
        <span className='text-sm text-zinc-400'>
          {t('pages.documents.lineCount', { count: document.lines.length })}
        </span>
        <span className='flex items-center gap-2 text-sm font-medium text-indigo-300 group-hover:text-indigo-200'>
          {documentActionLabel(document.allowedActions[0], t)}
          <ArrowUpRight className='h-4 w-4' />
        </span>
      </div>
    </button>
  );
}

function DocumentEmptyState() {
  const t = useTranslations();

  return (
    <div className='rounded-xl border border-dashed border-zinc-700 bg-zinc-900/40 px-6 py-14 text-center'>
      <span className='mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-800 text-zinc-400'>
        <FileText className='h-6 w-6' />
      </span>
      <h3 className='text-base font-semibold text-zinc-100'>
        {t('pages.documents.empty.title')}
      </h3>
      <p className='mx-auto mt-1 max-w-md text-sm leading-6 text-zinc-400'>
        {t('pages.documents.empty.description')}
      </p>
    </div>
  );
}

function StatusBadge({ status }: { status: BusinessDocument['status'] }) {
  const t = useTranslations();
  const colors: Partial<Record<BusinessDocument['status'], string>> = {
    DRAFT: 'border-zinc-600 bg-zinc-800 text-zinc-300',
    SENT: 'border-sky-500/30 bg-sky-500/10 text-sky-200',
    CONFIRMED: 'border-indigo-500/30 bg-indigo-500/10 text-indigo-200',
    PARTIALLY_COMPLETED: 'border-amber-500/30 bg-amber-500/10 text-amber-200',
    COMPLETED: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200',
    CANCELLED: 'border-rose-500/30 bg-rose-500/10 text-rose-200',
  };

  return (
    <Badge
      variant='outline'
      className={colors[status] ?? 'border-zinc-600 bg-zinc-800 text-zinc-300'}
    >
      {documentStatusLabel(status, t)}
    </Badge>
  );
}
