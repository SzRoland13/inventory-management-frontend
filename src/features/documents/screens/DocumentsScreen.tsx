'use client';

import { useEffect, useState } from 'react';
import { ArrowRight, FilePlus2, Inbox, Search } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { DocumentDetailsDialog } from '@/features/documents/components/DocumentDetailsDialog';
import { DocumentQueue } from '@/features/documents/components/DocumentQueue';
import { CreateDocumentDialog } from '@/features/documents/components/CreateDocumentDialog';
import {
  useDocumentCapabilitiesQuery,
  useDocumentsQuery,
} from '@/features/documents/queries/documentQueries';
import { DocumentQueueView } from '@/features/documents/enums/documentEnums';
import type { BusinessDocument } from '@/features/documents/types/documents';
import MainHeader from '@/features/shared/components/MainHeader';
import { Button } from '@/features/shared/components/ui/button';
import { Input } from '@/features/shared/components/ui/input';

const PAGE_SIZE = 20;

export default function DocumentsScreen() {
  const t = useTranslations();
  const [view, setView] = useState<DocumentQueueView>(DocumentQueueView.MY_DRAFTS);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(0);
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] =
    useState<BusinessDocument | null>(null);

  const capabilitiesQuery = useDocumentCapabilitiesQuery();
  const availableViews = capabilitiesQuery.data?.payload.availableQueueViews;
  const activeView = availableViews?.includes(view)
    ? view
    : availableViews?.[0] ?? view;

  useEffect(() => {
    const timeout = window.setTimeout(
      () => setDebouncedSearch(search.trim()),
      300,
    );
    return () => window.clearTimeout(timeout);
  }, [search]);

  const documentsQuery = useDocumentsQuery({
    view: activeView,
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
    page,
    pageSize: PAGE_SIZE,
  });
  const response = documentsQuery.data?.payload;
  const pageCount = Math.ceil((response?.total ?? 0) / PAGE_SIZE);
  const summaryCards = response
    ? [
        { label: t('pages.documents.summary.drafts'), count: response.counts.MY_DRAFTS, tone: 'indigo' as const },
        { label: t('pages.documents.summary.toReceive'), count: response.counts.READY_TO_RECEIVE, tone: 'sky' as const },
        { label: t('pages.documents.summary.toShip'), count: response.counts.READY_TO_SHIP, tone: 'emerald' as const },
      ].filter((card): card is typeof card & { count: number } => card.count !== undefined)
    : [];

  function changeView(nextView: DocumentQueueView) {
    setView(nextView);
    setPage(0);
  }

  function updateSearch(value: string) {
    setSearch(value);
    setPage(0);
  }

  return (
    <div className='flex w-full flex-col'>
      <MainHeader
        title={t('pages.documents.title')}
        icon={<Inbox className='h-6 w-6 self-center' />}
      />

      <main className='mx-auto w-full max-w-[1440px] space-y-6 p-4 sm:p-6 lg:p-8'>
        <section className='relative overflow-hidden rounded-2xl border border-zinc-700/80 bg-gradient-to-br from-zinc-800 via-zinc-900 to-indigo-950/40 p-5 shadow-xl sm:p-7'>
          <div className='pointer-events-none absolute -right-10 -top-16 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl' />
          <div className='relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between'>
            <div className='max-w-2xl'>
              <p className='mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-indigo-300'>
                {t('pages.documents.eyebrow')}
              </p>
              <h2 className='text-2xl font-semibold tracking-tight text-zinc-50 sm:text-3xl'>
                {t('pages.documents.heading')}
              </h2>
              <p className='mt-2 max-w-xl text-sm leading-6 text-zinc-400'>
                {t('pages.documents.description')}
              </p>
            </div>
            <Button
              onClick={() => setCreateOpen(true)}
              className='h-10 shrink-0 gap-2 bg-indigo-500 px-4 text-white shadow-lg shadow-indigo-950/30 hover:bg-indigo-400'
            >
              <FilePlus2 className='h-4 w-4' />
              {t('pages.documents.create.new')}
            </Button>
          </div>

          {!documentsQuery.isError && (!response || summaryCards.length > 0) && (
            <div className='relative mt-6 grid gap-3 sm:grid-cols-3'>
              {!response ? (
                [0, 1, 2].map((item) => (
                  <div
                    key={item}
                    className='h-[62px] animate-pulse rounded-xl border border-zinc-700/70 bg-zinc-950/40'
                  />
                ))
              ) : summaryCards.map((card) => (
                <SummaryCard
                  key={card.label}
                  label={card.label}
                  count={card.count}
                  tone={card.tone}
                />
              ))}
            </div>
          )}
        </section>

        <section className='rounded-2xl border border-zinc-700/80 bg-zinc-900/70 p-4 shadow-xl sm:p-6'>
          <div className='mb-5 flex flex-col gap-4 border-b border-zinc-800 pb-5 sm:flex-row sm:items-center sm:justify-between'>
            <div>
              <h2 className='text-lg font-semibold text-zinc-100'>
                {t('pages.documents.queue.heading')}
              </h2>
              <p className='mt-1 text-sm text-zinc-400'>
                {t('pages.documents.queue.description')}
              </p>
            </div>
            <label className='relative flex w-full sm:max-w-xs'>
              <Search className='pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500' />
              <Input
                value={search}
                onChange={(event) => updateSearch(event.target.value)}
                placeholder={t('pages.documents.search')}
                aria-label={t('pages.documents.search')}
                className='border-zinc-700 bg-zinc-950/70 pl-9 text-zinc-100 placeholder:text-zinc-500'
              />
            </label>
          </div>

          <DocumentQueue
            activeView={activeView}
            counts={response?.counts}
            documents={response?.items ?? []}
            onViewChange={changeView}
            onSelect={setSelectedDocument}
            isLoading={documentsQuery.isPending}
            error={documentsQuery.isError}
            onRetry={() => void documentsQuery.refetch()}
            availableViews={availableViews}
          />

          {response && response.total > PAGE_SIZE && (
            <div className='mt-5 flex items-center justify-between border-t border-zinc-800 pt-4'>
              <p className='text-sm text-zinc-500'>
                {t('pages.documents.pagination.page', {
                  page: page + 1,
                  pages: pageCount,
                })}
              </p>
              <div className='flex gap-2'>
                <Button
                  variant='outline'
                  size='sm'
                  disabled={page === 0}
                  onClick={() => setPage((current) => Math.max(0, current - 1))}
                  className='border-zinc-700 bg-zinc-900'
                >
                  {t('pages.documents.pagination.previous')}
                </Button>
                <Button
                  variant='outline'
                  size='sm'
                  disabled={(page + 1) * PAGE_SIZE >= response.total}
                  onClick={() => setPage((current) => current + 1)}
                  className='border-zinc-700 bg-zinc-900'
                >
                  {t('pages.documents.pagination.next')}
                  <ArrowRight />
                </Button>
              </div>
            </div>
          )}
        </section>
      </main>

      <CreateDocumentDialog open={createOpen} onOpenChange={setCreateOpen} />
      <DocumentDetailsDialog
        key={selectedDocument?.id ?? 'closed'}
        document={selectedDocument}
        onClose={() => setSelectedDocument(null)}
      />
    </div>
  );
}

function SummaryCard({
  label,
  count,
  tone,
}: {
  label: string;
  count: number;
  tone: 'indigo' | 'sky' | 'emerald';
}) {
  const accents = {
    indigo: { label: 'text-indigo-200', dot: 'bg-indigo-400' },
    sky: { label: 'text-sky-200', dot: 'bg-sky-400' },
    emerald: { label: 'text-emerald-200', dot: 'bg-emerald-400' },
  };

  return (
    <div className='flex items-center gap-3 rounded-xl border border-zinc-700/70 bg-zinc-950/50 p-4'>
      <span className={`h-2.5 w-2.5 rounded-full ${accents[tone].dot}`} />
      <span className='min-w-0 flex-1 text-sm text-zinc-400'>{label}</span>
      <span className={`text-xl font-semibold tabular-nums ${accents[tone].label}`}>
        {count}
      </span>
    </div>
  );
}
