'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
  type RowSelectionState,
} from '@tanstack/react-table';
import {
  Archive,
  Eye,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  Warehouse as WarehouseIcon,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { useSessionQuery } from '@/features/auth/queries/authQueries';
import { toastApiError } from '@/features/shared/api/apiResponse';
import {
  AppDialogBody,
  AppDialogCard,
  AppDialogFooter,
  AppDialogHeader,
  appDialogCancelButtonClass,
  appDialogPrimaryButtonClass,
} from '@/features/shared/components/AppDialogLayout';
import { Button } from '@/features/shared/components/ui/button';
import { Badge } from '@/features/shared/components/ui/badge';
import { Checkbox } from '@/features/shared/components/ui/checkbox';
import { Dialog } from '@/features/shared/components/ui/dialog';
import { Input } from '@/features/shared/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/features/shared/components/ui/select';
import { ThemedDialogContent } from '@/features/shared/components/ThemedDialogWrapper';
import { DataTable } from '@/features/shared/table/DataTable';
import { DataTableEmptyState } from '@/features/shared/table/DataTableEmptyState';
import { DataTableLoadingState } from '@/features/shared/table/DataTableLoadingState';
import { UserRole } from '@/features/users/types/user';
import { WarehouseFormDialog } from '@/features/warehouses/components/WarehouseFormDialog';
import {
  useArchiveWarehouseMutation,
  useCreateWarehouseMutation,
  useRestoreWarehouseMutation,
  useUpdateWarehouseMutation,
  useWarehousesQuery,
} from '@/features/warehouses/queries/warehouseQueries';
import {
  WarehouseStatus,
  type WarehouseRequest,
  type WarehouseResponse,
} from '@/features/warehouses/types/warehouse';

const EMPTY_WAREHOUSES: WarehouseResponse[] = [];

function formatAddress(warehouse: WarehouseResponse) {
  const address = warehouse.address;
  if (!address) return null;
  return [
    address.addressLine1,
    address.addressLine2,
    address.city,
    address.country,
  ]
    .filter(Boolean)
    .join(', ');
}

export function WarehousesTable() {
  const t = useTranslations();
  const sessionQuery = useSessionQuery();
  const canManage = sessionQuery.data?.payload.role === UserRole.ADMIN;
  const warehousesQuery = useWarehousesQuery();
  const createWarehouse = useCreateWarehouseMutation();
  const updateWarehouse = useUpdateWarehouseMutation();
  const archiveWarehouse = useArchiveWarehouseMutation();
  const restoreWarehouse = useRestoreWarehouseMutation();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<WarehouseStatus | 'ALL'>(
    'ALL',
  );
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [lifecycleOpen, setLifecycleOpen] = useState(false);

  const warehouses = warehousesQuery.data?.payload ?? EMPTY_WAREHOUSES;
  const selectedId = Object.keys(rowSelection).find((id) => rowSelection[id]);
  const selectedWarehouse = warehouses.find(
    (warehouse) => String(warehouse.id) === selectedId,
  );
  const editingWarehouse = warehouses.find(
    (warehouse) => warehouse.id === editingId,
  );
  const filtered = useMemo(() => {
    const term = search.trim().toLocaleLowerCase();
    return warehouses
      .filter(
        (warehouse) =>
          statusFilter === 'ALL' || warehouse.status === statusFilter,
      )
      .filter((warehouse) => {
        if (!term) return true;
        return [
          warehouse.name,
          warehouse.code,
          warehouse.type,
          formatAddress(warehouse) ?? '',
        ].some((value) => value.toLocaleLowerCase().includes(term));
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [warehouses, search, statusFilter]);

  useEffect(() => {
    if (warehousesQuery.error) toastApiError(t, warehousesQuery.error);
  }, [warehousesQuery.error, t]);

  const columns = useMemo<ColumnDef<WarehouseResponse>[]>(
    () => [
      {
        id: 'select',
        header: () => null,
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(value === true)}
            aria-label={t('common.select-row')}
          />
        ),
      },
      { accessorKey: 'name', header: t('pages.warehouses.fields.name') },
      { accessorKey: 'code', header: t('pages.warehouses.fields.code') },
      {
        accessorKey: 'type',
        header: t('pages.warehouses.fields.type'),
        cell: ({ row }) => t(`pages.warehouses.types.${row.original.type}`),
      },
      {
        id: 'address',
        header: t('pages.warehouses.fields.address'),
        cell: ({ row }) => formatAddress(row.original) ?? t('common.none'),
      },
      {
        accessorKey: 'status',
        header: t('pages.warehouses.fields.status'),
        cell: ({ row }) => (
          <Badge
            variant={
              row.original.status === WarehouseStatus.ARCHIVED
                ? 'secondary'
                : 'default'
            }
          >
            {t(`pages.warehouses.status.${row.original.status}`)}
          </Badge>
        ),
      },
    ],
    [t],
  );

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

  async function save(request: WarehouseRequest) {
    if (!canManage) return;
    try {
      if (editingId === null) {
        await createWarehouse.mutateAsync(request);
        toast.success(t('pages.warehouses.messages.created'));
      } else {
        await updateWarehouse.mutateAsync({ id: editingId, request });
        toast.success(t('pages.warehouses.messages.updated'));
      }
      setFormOpen(false);
      setEditingId(null);
    } catch (error) {
      toastApiError(t, error);
    }
  }

  async function changeLifecycle() {
    if (!canManage || !selectedWarehouse) return;
    try {
      if (selectedWarehouse.status === WarehouseStatus.ACTIVE) {
        await archiveWarehouse.mutateAsync(selectedWarehouse.id);
        toast.success(t('pages.warehouses.messages.archived'));
      } else {
        await restoreWarehouse.mutateAsync(selectedWarehouse.id);
        toast.success(t('pages.warehouses.messages.restored'));
      }
      setLifecycleOpen(false);
    } catch (error) {
      toastApiError(t, error);
    }
  }

  const busy =
    createWarehouse.isPending ||
    updateWarehouse.isPending ||
    archiveWarehouse.isPending ||
    restoreWarehouse.isPending;
  const archived = selectedWarehouse?.status === WarehouseStatus.ARCHIVED;

  return (
    <section className='m-3 overflow-hidden rounded-lg border bg-zinc-900'>
      <div className='flex flex-wrap items-center gap-2 border-b border-zinc-700 bg-zinc-800 p-3'>
        {canManage && (
          <>
            <Button
              disabled={busy}
              className='gap-2'
              onClick={() => {
                setEditingId(null);
                setFormOpen(true);
              }}
            >
              <Plus /> {t('pages.warehouses.actions.add')}
            </Button>
            <Button
              variant='outline'
              className='gap-2 border-zinc-600 bg-zinc-800 text-zinc-100 hover:bg-zinc-700 hover:text-white disabled:border-zinc-700 disabled:bg-zinc-800 disabled:text-zinc-500 disabled:opacity-100'
              disabled={!selectedWarehouse || busy}
              onClick={() => {
                if (!selectedWarehouse) return;
                setEditingId(selectedWarehouse.id);
                setFormOpen(true);
              }}
            >
              <Pencil /> {t('pages.warehouses.actions.edit')}
            </Button>
            <Button
              variant='outline'
              className='gap-2 border-zinc-600 bg-zinc-800 text-zinc-100 hover:bg-zinc-700 hover:text-white disabled:border-zinc-700 disabled:bg-zinc-800 disabled:text-zinc-500 disabled:opacity-100'
              disabled={!selectedWarehouse || busy}
              onClick={() => setLifecycleOpen(true)}
            >
              {archived ? <RotateCcw /> : <Archive />}
              {t(
                archived
                  ? 'pages.warehouses.actions.restore'
                  : 'pages.warehouses.actions.archive',
              )}
            </Button>
          </>
        )}
        <Button
          variant='outline'
          className='gap-2 border-zinc-600 bg-zinc-800 text-zinc-100 hover:bg-zinc-700 hover:text-white disabled:border-zinc-700 disabled:bg-zinc-800 disabled:text-zinc-500 disabled:opacity-100'
          disabled={!selectedWarehouse}
          onClick={() => setDetailsOpen(true)}
        >
          <Eye /> {t('pages.warehouses.actions.view')}
        </Button>
        <div className='ml-auto flex w-full flex-wrap gap-2 sm:w-auto'>
          <label className='relative flex-1 sm:w-64'>
            <Search className='pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400' />
            <Input
              className='border-zinc-600 bg-zinc-900 pl-9 text-zinc-100'
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setRowSelection({});
              }}
              placeholder={t('pages.warehouses.search')}
              aria-label={t('pages.warehouses.search')}
            />
          </label>
          <Select
            value={statusFilter}
            onValueChange={(value) => {
              setStatusFilter(value as WarehouseStatus | 'ALL');
              setRowSelection({});
            }}
          >
            <SelectTrigger
              aria-label={t('pages.warehouses.filters.status')}
              className='w-40 border-zinc-600 bg-zinc-900 text-zinc-100'
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent
              position='popper'
              side='bottom'
              align='end'
              avoidCollisions={false}
              className='border-zinc-700 bg-zinc-800 text-zinc-100'
            >
              <SelectItem value='ALL'>
                {t('pages.warehouses.filters.all')}
              </SelectItem>
              {Object.values(WarehouseStatus).map((status) => (
                <SelectItem key={status} value={status}>
                  {t(`pages.warehouses.status.${status}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {warehousesQuery.isPending ? (
        <DataTableLoadingState label={t('pages.warehouses.loading')} />
      ) : warehousesQuery.isError ? (
        <DataTableEmptyState
          title={t('pages.warehouses.load-error')}
          action={
            <Button onClick={() => void warehousesQuery.refetch()}>
              {t('common.retry')}
            </Button>
          }
        />
      ) : warehouses.length === 0 ? (
        <DataTableEmptyState
          icon={<WarehouseIcon className='h-10 w-10 text-zinc-500' />}
          title={t('pages.warehouses.empty')}
        />
      ) : (
        <DataTable table={table} horizontalScroll />
      )}

      {canManage && (
        <WarehouseFormDialog
          open={formOpen}
          warehouse={editingWarehouse}
          saving={busy}
          onOpenChange={setFormOpen}
          onSave={save}
        />
      )}

      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <ThemedDialogContent>
          <AppDialogHeader
            title={selectedWarehouse?.name ?? ''}
            description={t('pages.warehouses.details-description')}
            icon={WarehouseIcon}
          />
          {selectedWarehouse && (
            <AppDialogBody>
              <AppDialogCard>
                <dl className='grid grid-cols-[auto_1fr] gap-x-4 gap-y-2'>
                  <dt>{t('pages.warehouses.fields.code')}</dt>
                  <dd>{selectedWarehouse.code}</dd>
                  <dt>{t('pages.warehouses.fields.type')}</dt>
                  <dd>
                    {t(`pages.warehouses.types.${selectedWarehouse.type}`)}
                  </dd>
                  <dt>{t('pages.warehouses.fields.status')}</dt>
                  <dd>
                    {t(`pages.warehouses.status.${selectedWarehouse.status}`)}
                  </dd>
                  <dt>{t('pages.warehouses.fields.address')}</dt>
                  <dd>
                    {formatAddress(selectedWarehouse) ?? t('common.none')}
                  </dd>
                  {selectedWarehouse.address?.phone && (
                    <>
                      <dt>{t('pages.warehouses.fields.phone')}</dt>
                      <dd>{selectedWarehouse.address.phone}</dd>
                    </>
                  )}
                  {selectedWarehouse.address?.email && (
                    <>
                      <dt>{t('pages.warehouses.fields.email')}</dt>
                      <dd>{selectedWarehouse.address.email}</dd>
                    </>
                  )}
                </dl>
              </AppDialogCard>
            </AppDialogBody>
          )}
        </ThemedDialogContent>
      </Dialog>

      {canManage && (
        <Dialog open={lifecycleOpen} onOpenChange={setLifecycleOpen}>
          <ThemedDialogContent>
            <AppDialogHeader
              title={t(
                archived
                  ? 'pages.warehouses.confirm.restore-title'
                  : 'pages.warehouses.confirm.archive-title',
              )}
              description={t(
                archived
                  ? 'pages.warehouses.confirm.restore-description'
                  : 'pages.warehouses.confirm.archive-description',
                { name: selectedWarehouse?.name ?? '' },
              )}
              icon={archived ? RotateCcw : Archive}
              hideDescription
            />
            <AppDialogBody>
              <AppDialogCard>
                {t(
                  archived
                    ? 'pages.warehouses.confirm.restore-description'
                    : 'pages.warehouses.confirm.archive-description',
                  { name: selectedWarehouse?.name ?? '' },
                )}
              </AppDialogCard>
            </AppDialogBody>
            <AppDialogFooter>
              <Button
                variant='outline'
                className={appDialogCancelButtonClass}
                disabled={busy}
                onClick={() => setLifecycleOpen(false)}
              >
                {t('common.cancel')}
              </Button>
              <Button
                variant={archived ? 'default' : 'destructive'}
                className={archived ? appDialogPrimaryButtonClass : undefined}
                disabled={busy || !selectedWarehouse}
                onClick={() => void changeLifecycle()}
              >
                {t(
                  archived
                    ? 'pages.warehouses.actions.restore'
                    : 'pages.warehouses.actions.archive',
                )}
              </Button>
            </AppDialogFooter>
          </ThemedDialogContent>
        </Dialog>
      )}
    </section>
  );
}
