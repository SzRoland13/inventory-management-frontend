'use client';

import { useProductsColumns } from '@/features/products/components/ProductsColumns';
import { ProductsToolbar } from '@/features/products/components/ProductsToolbar';
import type { ProductTableRow } from '@/features/products/types/product';
import { Button } from '@/features/shared/components/ui/button';
import { DataTable } from '@/features/shared/table/DataTable';
import { DataTableEmptyState } from '@/features/shared/table/DataTableEmptyState';
import { DataTableLoadingState } from '@/features/shared/table/DataTableLoadingState';
import { DataTablePagination } from '@/features/shared/table/DataTablePagination';
import {
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  PaginationState,
  RowSelectionState,
  SortingState,
  useReactTable,
} from '@tanstack/react-table';
import { PackageSearch, Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { toast } from 'sonner';

const initialProducts: ProductTableRow[] = [];

export function ProductsTable() {
  const t = useTranslations();
  const columns = useProductsColumns();
  const [products] = useState(initialProducts);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: products,
    columns,
    state: {
      globalFilter: search,
      sorting,
      rowSelection,
      pagination,
      columnFilters:
        statusFilter === 'ALL' ? [] : [{ id: 'status', value: statusFilter }],
    },
    globalFilterFn: (row, _columnId, filterValue: string) =>
      `${row.original.sku} ${row.original.name} ${row.original.brand ?? ''}`
        .toLocaleLowerCase()
        .includes(filterValue.toLocaleLowerCase()),
    onGlobalFilterChange: setSearch,
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    enableMultiRowSelection: false,
  });

  const selectedProduct = table.getSelectedRowModel().rows[0]?.original;
  // Replace this placeholder state with the products query loading flag.
  const isLoading = false;

  const handleAdd = () =>
    toast.info(t('pages.products.messages.backend-pending'));
  const handleEdit = () => {
    if (selectedProduct) {
      toast.info(t('pages.products.messages.backend-pending'));
    }
  };

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
    table.setPageIndex(0);
  };

  return (
    <section className='m-3 overflow-hidden rounded-lg border bg-zinc-900'>
      <ProductsToolbar
        search={search}
        statusFilter={statusFilter}
        hasSelection={!!selectedProduct}
        onSearchChange={setSearch}
        onStatusFilterChange={handleStatusFilterChange}
        onAdd={handleAdd}
        onEdit={handleEdit}
      />

      {isLoading ? (
        <DataTableLoadingState label={t('pages.products.loading')} />
      ) : products.length === 0 ? (
        <DataTableEmptyState
          icon={<PackageSearch className='h-10 w-10 text-zinc-500' />}
          title={t('pages.products.empty.title')}
          description={t('pages.products.empty.description')}
          action={
            <Button onClick={handleAdd} className='gap-2'>
              <Plus />
              {t('pages.products.actions.add')}
            </Button>
          }
        />
      ) : (
        <DataTable table={table} />
      )}

      <DataTablePagination table={table} />
    </section>
  );
}
