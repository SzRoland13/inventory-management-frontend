'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  getCoreRowModel,
  type PaginationState,
  type RowSelectionState,
  type SortingState,
  useReactTable,
} from '@tanstack/react-table';
import { PackageSearch, Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { useSessionQuery } from '@/features/auth/queries/authQueries';
import { UserRole } from '@/features/users/types/user';
import { useCurrenciesQuery } from '@/features/settings/queries/companyQueries';
import { Button } from '@/features/shared/components/ui/button';
import { toastApiError } from '@/features/shared/api/apiResponse';
import { DataTable } from '@/features/shared/table/DataTable';
import { DataTableEmptyState } from '@/features/shared/table/DataTableEmptyState';
import { DataTableLoadingState } from '@/features/shared/table/DataTableLoadingState';
import { DataTablePagination } from '@/features/shared/table/DataTablePagination';
import { ProductFormDialog } from '@/features/products/components/ProductFormDialog';
import { ProductArchiveDialog } from '@/features/products/components/ProductArchiveDialog';
import { ProductsToolbar } from '@/features/products/components/ProductsToolbar';
import { useProductsColumns } from '@/features/products/hooks/useProductsColumns';
import {
  useArchiveProductMutation,
  useProductAttributeDefinitionsQuery,
  useProductCategoriesQuery,
  useProductQuery,
  useProductUnitsQuery,
  useProductsQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
} from '@/features/products/queries/productQueries';
import type {
  ProductListRequest,
  ProductRequest,
  ProductStatus,
} from '@/features/products/types/product';
import {
  ProductSortDirection,
  ProductSortField,
  ProductStatus as ProductStatusValue,
} from '@/features/products/types/product';

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];
const DEFAULT_PAGE_SIZE = 25;

const sortFieldByColumn: Record<string, ProductSortField> = {
  sku: ProductSortField.SKU,
  name: ProductSortField.NAME,
  brand: ProductSortField.BRAND,
  status: ProductSortField.STATUS,
  netPrice: ProductSortField.NET_PRICE,
};

export function ProductsTable() {
  const t = useTranslations();
  const sessionQuery = useSessionQuery();
  const role = sessionQuery.data?.payload.role;
  const canManage = role === UserRole.ADMIN || role === UserRole.MANAGER;

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ProductStatus | 'ALL'>(
    'ALL',
  );
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [unitFilter, setUnitFilter] = useState('ALL');
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'name', desc: false },
  ]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: DEFAULT_PAGE_SIZE,
  });
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState<number | null>(null);
  const [archiveOpen, setArchiveOpen] = useState(false);

  const sort = sorting[0];
  const sortBy = sortFieldByColumn[sort?.id ?? ''] ?? 'NAME';
  const sortDirection: ProductSortDirection = sort?.desc ? 'DESC' : 'ASC';
  const listRequest = useMemo<ProductListRequest>(
    () => ({
      page: pagination.pageIndex,
      size: pagination.pageSize,
      search: debouncedSearch.trim() || undefined,
      status: statusFilter === 'ALL' ? undefined : statusFilter,
      categoryId: categoryFilter === 'ALL' ? undefined : Number(categoryFilter),
      unitId: unitFilter === 'ALL' ? undefined : Number(unitFilter),
      sortBy,
      sortDirection,
    }),
    [
      categoryFilter,
      debouncedSearch,
      pagination.pageIndex,
      pagination.pageSize,
      sortBy,
      sortDirection,
      statusFilter,
      unitFilter,
    ],
  );

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedSearch(search), 300);
    return () => window.clearTimeout(timeout);
  }, [search]);

  const productsQuery = useProductsQuery(listRequest);
  const unitsQuery = useProductUnitsQuery();
  const categoriesQuery = useProductCategoriesQuery();
  const attributesQuery = useProductAttributeDefinitionsQuery();
  const currenciesQuery = useCurrenciesQuery();
  const createProduct = useCreateProductMutation();
  const updateProduct = useUpdateProductMutation();
  const archiveProduct = useArchiveProductMutation();

  const products = productsQuery.data?.payload.content ?? [];
  const pageMetadata = productsQuery.data?.payload.page;
  const units = unitsQuery.data?.payload ?? [];
  const categories = categoriesQuery.data?.payload ?? [];
  const definitions = attributesQuery.data?.payload ?? [];
  const currencies = currenciesQuery.data?.payload.currencies ?? [];
  const selectedId = Object.keys(rowSelection).find((id) => rowSelection[id]);
  const selectedProduct = products.find(
    (product) => String(product.id) === selectedId,
  );
  const selectedProductQuery = useProductQuery(
    editorOpen && canManage ? editingProductId : null,
    editorOpen && editingProductId !== null,
  );
  const editingProduct =
    selectedProductQuery.data?.payload ??
    products.find((product) => product.id === editingProductId);
  const columns = useProductsColumns(currencies);

  const lookupsReady =
    unitsQuery.isSuccess &&
    categoriesQuery.isSuccess &&
    attributesQuery.isSuccess &&
    currenciesQuery.isSuccess;
  const lookupsLoading =
    unitsQuery.isPending ||
    categoriesQuery.isPending ||
    attributesQuery.isPending ||
    currenciesQuery.isPending;
  const pageCount = Math.max(pageMetadata?.totalPages ?? 1, 1);
  const totalRows = pageMetadata?.totalElements ?? 0;

  useEffect(() => {
    if (productsQuery.error) toastApiError(t, productsQuery.error);
  }, [productsQuery.error, t]);
  useEffect(() => {
    const error =
      unitsQuery.error ??
      categoriesQuery.error ??
      attributesQuery.error ??
      currenciesQuery.error;
    if (error) toastApiError(t, error);
  }, [
    attributesQuery.error,
    categoriesQuery.error,
    currenciesQuery.error,
    t,
    unitsQuery.error,
  ]);
  useEffect(() => {
    if (selectedProductQuery.error)
      toastApiError(t, selectedProductQuery.error);
  }, [selectedProductQuery.error, t]);

  useEffect(() => {
    if (
      pageMetadata &&
      pagination.pageIndex > Math.max(pageMetadata.totalPages - 1, 0)
    ) {
      setPagination((current) => ({
        ...current,
        pageIndex: Math.max(pageMetadata.totalPages - 1, 0),
      }));
    }
  }, [pageMetadata, pagination.pageIndex]);

  const handleFilterChange = (update: () => void) => {
    update();
    setPagination((current) => ({ ...current, pageIndex: 0 }));
    setRowSelection({});
  };

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: products,
    columns,
    state: { sorting, rowSelection, pagination },
    manualPagination: true,
    manualSorting: true,
    enableMultiSort: false,
    pageCount,
    getRowId: (row) => String(row.id),
    onRowSelectionChange: setRowSelection,
    onPaginationChange: setPagination,
    onSortingChange: (updater) => {
      setSorting(updater);
      setPagination((current) => ({ ...current, pageIndex: 0 }));
      setRowSelection({});
    },
    getCoreRowModel: getCoreRowModel(),
    enableMultiRowSelection: false,
  });

  const handleSave = async (
    request: Parameters<typeof createProduct.mutateAsync>[0],
    status?: ProductRequest['status'],
  ) => {
    try {
      if (editingProductId !== null) {
        await updateProduct.mutateAsync({ id: editingProductId, request });
        toast.success(t('pages.products.messages.updated'));
      } else {
        await createProduct.mutateAsync({
          ...request,
          status: status ?? ProductStatusValue.DRAFT,
        });
        toast.success(t('pages.products.messages.created'));
        setPagination((current) => ({ ...current, pageIndex: 0 }));
      }
      setEditorOpen(false);
      setEditingProductId(null);
      setRowSelection({});
    } catch (error) {
      toastApiError(t, error);
    }
  };

  const handleArchive = async () => {
    if (!selectedProduct) return;
    try {
      await archiveProduct.mutateAsync(selectedProduct.id);
      toast.success(t('pages.products.messages.archived'));
      setArchiveOpen(false);
      setRowSelection({});
    } catch (error) {
      toastApiError(t, error);
    }
  };

  const retryLookups = () => {
    void Promise.all([
      unitsQuery.refetch(),
      categoriesQuery.refetch(),
      attributesQuery.refetch(),
      currenciesQuery.refetch(),
    ]);
  };

  return (
    <section className='m-3 overflow-hidden rounded-lg border bg-zinc-900'>
      <ProductsToolbar
        search={search}
        statusFilter={statusFilter}
        categoryFilter={categoryFilter}
        unitFilter={unitFilter}
        hasSelection={!!selectedProduct}
        canManage={canManage}
        actionsDisabled={lookupsLoading || !lookupsReady}
        categories={categories}
        units={units}
        onSearchChange={(value) => {
          setSearch(value);
          setPagination((current) => ({ ...current, pageIndex: 0 }));
          setRowSelection({});
        }}
        onStatusFilterChange={(value) =>
          handleFilterChange(() =>
            setStatusFilter(value === 'ALL' ? 'ALL' : (value as ProductStatus)),
          )
        }
        onCategoryFilterChange={(value) =>
          handleFilterChange(() => setCategoryFilter(value))
        }
        onUnitFilterChange={(value) =>
          handleFilterChange(() => setUnitFilter(value))
        }
        onAdd={() => {
          setRowSelection({});
          setEditingProductId(null);
          setEditorOpen(true);
        }}
        onEdit={() => {
          if (selectedProduct) {
            setEditingProductId(selectedProduct.id);
            setEditorOpen(true);
          }
        }}
        onArchive={() => setArchiveOpen(true)}
      />

      {!lookupsReady && !lookupsLoading && (
        <div className='flex items-center justify-between gap-3 border-b border-zinc-700 bg-zinc-800 px-4 py-3 text-sm text-zinc-300'>
          <span>{t('pages.products.lookup-error')}</span>
          <Button size='sm' variant='outline' onClick={retryLookups}>
            {t('common.retry')}
          </Button>
        </div>
      )}

      {productsQuery.isPending || productsQuery.isPlaceholderData ? (
        <DataTableLoadingState label={t('pages.products.loading')} />
      ) : productsQuery.isError ? (
        <DataTableEmptyState
          icon={<PackageSearch className='h-10 w-10 text-zinc-500' />}
          title={t('pages.products.error.title')}
          description={t('pages.products.error.description')}
          action={
            <Button onClick={() => void productsQuery.refetch()}>
              {t('common.retry')}
            </Button>
          }
        />
      ) : products.length === 0 ? (
        <DataTableEmptyState
          icon={<PackageSearch className='h-10 w-10 text-zinc-500' />}
          title={t('pages.products.empty.title')}
          description={t('pages.products.empty.description')}
          action={
            canManage ? (
              <Button
                onClick={() => {
                  setEditingProductId(null);
                  setEditorOpen(true);
                }}
                disabled={!lookupsReady}
                className='gap-2'
              >
                <Plus />
                {t('pages.products.actions.add')}
              </Button>
            ) : undefined
          }
        />
      ) : (
        <DataTable table={table} />
      )}

      <DataTablePagination
        totalRows={totalRows}
        pageIndex={pagination.pageIndex}
        pageSize={pagination.pageSize}
        pageCount={pageCount}
        canPreviousPage={pagination.pageIndex > 0}
        canNextPage={pagination.pageIndex + 1 < pageCount}
        onPageChange={(pageIndex) => {
          setRowSelection({});
          setPagination((current) => ({ ...current, pageIndex }));
        }}
        onPageSizeChange={(pageSize) => {
          setRowSelection({});
          setPagination({ pageIndex: 0, pageSize });
        }}
        pageSizes={PAGE_SIZE_OPTIONS}
      />

      <ProductFormDialog
        open={editorOpen}
        editing={editingProductId !== null}
        onOpenChange={(open) => {
          setEditorOpen(open);
          if (!open) setEditingProductId(null);
        }}
        product={editingProduct}
        isLoadingProduct={
          editingProductId !== null && selectedProductQuery.isPending
        }
        saving={createProduct.isPending || updateProduct.isPending}
        units={units}
        currencies={currencies}
        categories={categories}
        definitions={definitions}
        onSave={handleSave}
      />

      <ProductArchiveDialog
        open={archiveOpen}
        onOpenChange={setArchiveOpen}
        productName={selectedProduct?.name}
        saving={archiveProduct.isPending}
        canArchive={!!selectedProduct}
        onArchive={() => void handleArchive()}
      />
    </section>
  );
}
