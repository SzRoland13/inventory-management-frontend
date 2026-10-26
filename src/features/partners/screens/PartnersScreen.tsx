'use client';

import { useMemo, useState } from 'react';
import { getCoreRowModel, useReactTable, type ColumnDef, type RowSelectionState } from '@tanstack/react-table';
import { Archive, ContactRound, Eye, Pencil, Plus, RotateCcw, Search } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { useSessionQuery } from '@/features/auth/queries/authQueries';
import { toastApiError } from '@/features/shared/api/apiResponse';
import {
  AppDialogBody,
  AppDialogCard,
  AppDialogFooter,
  AppDialogHeader,
  AppDialogSection,
  appDialogCancelButtonClass,
} from '@/features/shared/components/AppDialogLayout';
import { Badge } from '@/features/shared/components/ui/badge';
import { Button } from '@/features/shared/components/ui/button';
import { Checkbox } from '@/features/shared/components/ui/checkbox';
import { Dialog } from '@/features/shared/components/ui/dialog';
import { Input } from '@/features/shared/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/features/shared/components/ui/select';
import { ThemedDialogContent } from '@/features/shared/components/ThemedDialogWrapper';
import MainHeader from '@/features/shared/components/MainHeader';
import { DataTable } from '@/features/shared/table/DataTable';
import { DataTableEmptyState } from '@/features/shared/table/DataTableEmptyState';
import { DataTableLoadingState } from '@/features/shared/table/DataTableLoadingState';
import { UserRole } from '@/features/users/types/user';
import { PartnerFormDialog } from '@/features/partners/components/PartnerFormDialog';
import { PartnerContactsDialog } from '@/features/partners/components/PartnerContactsDialog';
import {
  useCreatePartnerMutation,
  useSetPartnerArchivedMutation,
  useUpdatePartnerMutation,
  usePartnersQuery,
} from '@/features/partners/queries/partnerQueries';
import type { PartnerRequest, PartnerResponse } from '@/features/partners/types/partner';

type StateFilter = 'ALL' | 'ACTIVE' | 'ARCHIVED';
type LifecycleAction = 'archive' | 'restore';
const EMPTY_PARTNERS: PartnerResponse[] = [];

export default function PartnersScreen() {
  const t = useTranslations();
  const session = useSessionQuery();
  const canManage = session.data?.payload.role === UserRole.ADMIN;
  const partnersQuery = usePartnersQuery();
  const createPartner = useCreatePartnerMutation();
  const updatePartner = useUpdatePartnerMutation();
  const setArchived = useSetPartnerArchivedMutation();
  const partners = partnersQuery.data?.payload ?? EMPTY_PARTNERS;
  const [search, setSearch] = useState('');
  const [stateFilter, setStateFilter] = useState<StateFilter>('ALL');
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [contactsOpen, setContactsOpen] = useState(false);
  const [formPartner, setFormPartner] = useState<PartnerResponse | null | undefined>(undefined);
  const [lifecycleAction, setLifecycleAction] = useState<LifecycleAction | null>(null);

  const selectedId = Object.keys(rowSelection).find((id) => rowSelection[id]);
  const selectedPartner = partners.find((partner) => String(partner.id) === selectedId);
  const editingPartner = formPartner
    ? partners.find((partner) => partner.id === formPartner.id) ?? formPartner
    : undefined;
  const filtered = useMemo(() => {
    const term = search.trim().toLocaleLowerCase();
    return partners
      .filter((partner) => stateFilter === 'ALL' || (stateFilter === 'ARCHIVED') === partner.archived)
      .filter((partner) => !term || [partner.name, partner.type, partner.taxNumber ?? ''].some((value) => value.toLocaleLowerCase().includes(term)))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [partners, search, stateFilter]);

  const columns = useMemo<ColumnDef<PartnerResponse>[]>(() => [
    {
      id: 'select',
      header: () => null,
      cell: ({ row }) => <Checkbox checked={row.getIsSelected()} onCheckedChange={(value) => row.toggleSelected(value === true)} aria-label={t('common.select-row')} />,
    },
    { accessorKey: 'name', header: t('pages.partners.fields.name') },
    { accessorKey: 'type', header: t('pages.partners.fields.type'), cell: ({ row }) => t(`pages.partners.types.${row.original.type}`) },
    { accessorKey: 'taxNumber', header: t('pages.partners.fields.taxNumber'), cell: ({ row }) => row.original.taxNumber || t('common.none') },
    { accessorKey: 'archived', header: t('pages.partners.fields.status'), cell: ({ row }) => <Badge variant={row.original.archived ? 'secondary' : 'default'}>{t(`pages.partners.status.${row.original.archived ? 'ARCHIVED' : 'ACTIVE'}`)}</Badge> },
    { id: 'contacts', header: t('pages.partners.fields.contacts'), cell: ({ row }) => row.original.contacts.filter((contact) => !contact.removed).length },
  ], [t]);

  // The shared DataTable renderer consumes the TanStack instance directly.
  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: filtered,
    columns,
    getRowId: (row) => String(row.id),
    getCoreRowModel: getCoreRowModel(),
    enableMultiRowSelection: false,
    state: { rowSelection },
    onRowSelectionChange: setRowSelection,
  });

  async function savePartner(request: PartnerRequest) {
    if (!canManage) return;
    try {
      if (editingPartner) {
        await updatePartner.mutateAsync({ id: editingPartner.id, request });
        toast.success(t('pages.partners.messages.updated'));
        setFormPartner(undefined);
      } else {
        const response = await createPartner.mutateAsync(request);
        toast.success(t('pages.partners.messages.created'));
        setFormPartner(undefined);
        setRowSelection({ [response.payload.id]: true });
      }
    } catch (error) {
      toastApiError(t, error);
    }
  }

  async function changeLifecycle() {
    if (!canManage || !selectedPartner || !lifecycleAction) return;
    try {
      await setArchived.mutateAsync({ id: selectedPartner.id, archived: lifecycleAction === 'archive' });
      toast.success(t(`pages.partners.messages.${lifecycleAction === 'archive' ? 'archived' : 'restored'}`));
      setLifecycleAction(null);
    } catch (error) {
      toastApiError(t, error);
    }
  }

  const busy = createPartner.isPending || updatePartner.isPending || setArchived.isPending;
  const archived = selectedPartner?.archived ?? false;

  return (
    <div className='flex w-full flex-col'>
      <MainHeader title={t('pages.partners.title')} icon={<ContactRound className='h-6 w-6 self-center' />} />
      <section className='m-3 overflow-hidden rounded-lg border bg-zinc-900'>
        <div className='flex flex-wrap items-center gap-2 border-b border-zinc-700 bg-zinc-800 p-3'>
          {canManage && <>
            <Button disabled={busy} className='gap-2' onClick={() => setFormPartner(null)}><Plus />{t('pages.partners.actions.add')}</Button>
            <Button variant='outline' className='gap-2 border-zinc-600 bg-zinc-800 text-zinc-100 hover:bg-zinc-700 hover:text-white disabled:border-zinc-700 disabled:bg-zinc-800 disabled:text-zinc-500 disabled:opacity-100' disabled={!selectedPartner || archived || busy} onClick={() => setFormPartner(selectedPartner)}><Pencil />{t('pages.partners.actions.edit')}</Button>
            <Button variant='outline' className='gap-2 border-zinc-600 bg-zinc-800 text-zinc-100 hover:bg-zinc-700 hover:text-white disabled:border-zinc-700 disabled:bg-zinc-800 disabled:text-zinc-500 disabled:opacity-100' disabled={!selectedPartner || busy} onClick={() => setLifecycleAction(archived ? 'restore' : 'archive')}>{archived ? <RotateCcw /> : <Archive />}{t(`pages.partners.actions.${archived ? 'restore' : 'archive'}`)}</Button>
          </>}
          <Button variant='outline' className='gap-2 border-zinc-600 bg-zinc-800 text-zinc-100 hover:bg-zinc-700 hover:text-white disabled:border-zinc-700 disabled:bg-zinc-800 disabled:text-zinc-500 disabled:opacity-100' disabled={!selectedPartner} onClick={() => setDetailsOpen(true)}><Eye />{t('pages.partners.actions.view')}</Button>
          <Button variant='outline' className='gap-2 border-zinc-600 bg-zinc-800 text-zinc-100 hover:bg-zinc-700 hover:text-white disabled:border-zinc-700 disabled:bg-zinc-800 disabled:text-zinc-500 disabled:opacity-100' disabled={!selectedPartner} onClick={() => setContactsOpen(true)}><ContactRound />{t(canManage ? 'pages.partners.contacts.manage' : 'pages.partners.contacts.view')}</Button>
          <div className='ml-auto flex w-full flex-wrap gap-2 sm:w-auto'>
            <label className='relative flex-1 sm:w-64'>
              <Search className='pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400' />
              <Input className='border-zinc-600 bg-zinc-900 pl-9 text-zinc-100' value={search} onChange={(event) => { setSearch(event.target.value); setRowSelection({}); }} placeholder={t('pages.partners.search')} aria-label={t('pages.partners.search')} />
            </label>
            <Select value={stateFilter} onValueChange={(value) => { setStateFilter(value as StateFilter); setRowSelection({}); }}>
              <SelectTrigger aria-label={t('pages.partners.filters.status')} className='w-40 border-zinc-600 bg-zinc-900 text-zinc-100'><SelectValue /></SelectTrigger>
              <SelectContent position='popper' side='bottom' align='end' avoidCollisions={false} className='border-zinc-700 bg-zinc-800 text-zinc-100'>
                {(['ALL', 'ACTIVE', 'ARCHIVED'] as const).map((value) => <SelectItem key={value} value={value}>{t(`pages.partners.filters.${value.toLowerCase()}`)}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        {partnersQuery.isPending ? <DataTableLoadingState label={t('pages.partners.loading')} /> : partnersQuery.isError ? <DataTableEmptyState title={t('pages.partners.load-error')} action={<Button onClick={() => void partnersQuery.refetch()}>{t('common.retry')}</Button>} /> : partners.length === 0 ? <DataTableEmptyState icon={<ContactRound className='h-10 w-10 text-zinc-500' />} title={t('pages.partners.empty')} /> : <DataTable table={table} horizontalScroll />}
      </section>

      {canManage && <PartnerFormDialog open={formPartner !== undefined} partner={editingPartner} saving={createPartner.isPending || updatePartner.isPending} onOpenChange={(open) => { if (!open) setFormPartner(undefined); }} onSave={savePartner} />}

      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <ThemedDialogContent className='!max-w-3xl'>
          <AppDialogHeader title={selectedPartner?.name ?? ''} description={t('pages.partners.details-description')} icon={ContactRound} />
          {selectedPartner && <AppDialogBody className='space-y-4'>
            <AppDialogSection title={t('pages.partners.form-details')} icon={ContactRound}>
              <dl className='grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm'>
                <dt className='text-zinc-400'>{t('pages.partners.fields.type')}</dt><dd>{t(`pages.partners.types.${selectedPartner.type}`)}</dd>
                <dt className='text-zinc-400'>{t('pages.partners.fields.taxNumber')}</dt><dd>{selectedPartner.taxNumber || t('common.none')}</dd>
                <dt className='text-zinc-400'>{t('pages.partners.fields.status')}</dt><dd>{t(`pages.partners.status.${selectedPartner.archived ? 'ARCHIVED' : 'ACTIVE'}`)}</dd>
              </dl>
            </AppDialogSection>
          </AppDialogBody>}
          <AppDialogFooter>
            <Button variant='outline' className={appDialogCancelButtonClass} onClick={() => setDetailsOpen(false)}>{t('common.done')}</Button>
          </AppDialogFooter>
        </ThemedDialogContent>
      </Dialog>

      <PartnerContactsDialog open={contactsOpen} partner={selectedPartner} canManage={canManage} onOpenChange={setContactsOpen} />

      <Dialog open={lifecycleAction !== null} onOpenChange={(open) => { if (!open) setLifecycleAction(null); }}>
        <ThemedDialogContent>
          <AppDialogHeader title={t(`pages.partners.confirm.${lifecycleAction ?? 'archive'}-title`)} description={t(`pages.partners.confirm.${lifecycleAction ?? 'archive'}-description`, { name: selectedPartner?.name ?? '' })} icon={lifecycleAction === 'restore' ? RotateCcw : Archive} hideDescription />
          <AppDialogBody><AppDialogCard>{t(`pages.partners.confirm.${lifecycleAction ?? 'archive'}-description`, { name: selectedPartner?.name ?? '' })}</AppDialogCard></AppDialogBody>
          <AppDialogFooter>
            <Button variant='outline' className={appDialogCancelButtonClass} disabled={busy} onClick={() => setLifecycleAction(null)}>{t('common.cancel')}</Button>
            <Button variant={lifecycleAction === 'archive' ? 'destructive' : 'default'} disabled={busy || !selectedPartner} onClick={() => void changeLifecycle()}>{busy ? t('common.saving') : t(`pages.partners.actions.${lifecycleAction ?? 'archive'}`)}</Button>
          </AppDialogFooter>
        </ThemedDialogContent>
      </Dialog>

    </div>
  );
}
