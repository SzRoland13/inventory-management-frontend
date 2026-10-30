'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { ArrowLeft, PackageSearch, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import { Link } from '@/i18n/navigation';
import { useSessionQuery } from '@/features/auth/queries/authQueries';
import { useCurrenciesQuery } from '@/features/settings/queries/companyQueries';
import { ProductFormDialog } from '@/features/products/components/ProductFormDialog';
import { ProductDetailsOverview } from '@/features/products/components/ProductDetailsOverview';
import { ProductImagesGallery } from '@/features/products/components/ProductImagesGallery';
import { ProductInventorySections } from '@/features/products/components/ProductInventorySections';
import {
  useProductAttributeDefinitionsQuery,
  useProductCategoriesQuery,
  useProductQuery,
  useProductUnitsQuery,
  useUpdateProductMutation,
} from '@/features/products/queries/productQueries';
import type { ProductRequest } from '@/features/products/types/product';
import { DataTableEmptyState } from '@/features/shared/table/DataTableEmptyState';
import MainHeader from '@/features/shared/components/MainHeader';
import { Button } from '@/features/shared/components/ui/button';
import { Spinner } from '@/features/shared/components/ui/spinner';
import { toastApiError } from '@/features/shared/api/apiResponse';
import { Routes } from '@/features/shared/types/routes';
import { UserRole } from '@/features/users/types/user';

export function ProductDetailsScreen({ productId }: { productId: number }) {
  const t = useTranslations();
  const searchParams = useSearchParams();
  const returnToStocks = searchParams.get('from') === 'stocks';
  const stockView =
    searchParams.get('view') === 'movements' ? 'movements' : 'balances';
  const sessionQuery = useSessionQuery();
  const role = sessionQuery.data?.payload.role;
  const canManage = role === UserRole.ADMIN || role === UserRole.MANAGER;
  const productQuery = useProductQuery(productId);
  const unitsQuery = useProductUnitsQuery();
  const categoriesQuery = useProductCategoriesQuery();
  const definitionsQuery = useProductAttributeDefinitionsQuery();
  const currenciesQuery = useCurrenciesQuery();
  const updateProduct = useUpdateProductMutation();
  const [editorOpen, setEditorOpen] = useState(false);

  const product = productQuery.data?.payload;
  const units = unitsQuery.data?.payload ?? [];
  const categories = categoriesQuery.data?.payload ?? [];
  const definitions = definitionsQuery.data?.payload ?? [];
  const currencies = currenciesQuery.data?.payload.currencies ?? [];
  const editorLookupsReady =
    unitsQuery.isSuccess &&
    categoriesQuery.isSuccess &&
    definitionsQuery.isSuccess &&
    currenciesQuery.isSuccess;
  const editorLookupsFailed =
    unitsQuery.isError ||
    categoriesQuery.isError ||
    definitionsQuery.isError ||
    currenciesQuery.isError;

  const retryEditorLookups = () => {
    void Promise.all([
      unitsQuery.refetch(),
      categoriesQuery.refetch(),
      definitionsQuery.refetch(),
      currenciesQuery.refetch(),
    ]);
  };

  const handleSave = async (request: ProductRequest) => {
    try {
      await updateProduct.mutateAsync({ id: productId, request });
      toast.success(t('pages.products.messages.updated'));
      setEditorOpen(false);
    } catch (error) {
      toastApiError(t, error);
    }
  };

  return (
    <div className='flex min-h-screen w-full flex-col'>
      <MainHeader
        title={t('pages.products.title')}
        icon={<PackageSearch className='h-6 w-6 self-center' />}
      />
      <main className='w-full min-w-0 flex-1 p-3 sm:p-5 lg:p-6'>
        <div className='mx-auto w-full max-w-7xl space-y-4'>
          <div className='flex flex-wrap items-center justify-between gap-3'>
            <Button
              variant='ghost'
              asChild
              className='-ml-2 gap-2 text-zinc-300 hover:bg-zinc-800 hover:text-white'
            >
              <Link
                href={
                  returnToStocks
                    ? `${Routes.Stocks}?view=${stockView}&productId=${productId}`
                    : Routes.Products
                }
              >
                <ArrowLeft aria-hidden='true' />
                {t(
                  returnToStocks
                    ? 'pages.products.details.back-to-stocks'
                    : 'pages.products.details.back-to-list',
                )}
              </Link>
            </Button>
            {canManage && product && (
              <Button
                onClick={() => setEditorOpen(true)}
                disabled={!editorLookupsReady || updateProduct.isPending}
                className='gap-2'
              >
                <Pencil aria-hidden='true' />
                {t('pages.products.actions.edit')}
              </Button>
            )}
          </div>

          {canManage && editorLookupsFailed && (
            <div
              role='alert'
              className='flex flex-wrap items-center justify-between gap-3 rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-3 text-sm text-zinc-300'
            >
              <span>{t('pages.products.lookup-error')}</span>
              <Button
                size='sm'
                variant='outline'
                onClick={retryEditorLookups}
              >
                {t('common.retry')}
              </Button>
            </div>
          )}

          {productQuery.isPending ? (
            <div className='flex min-h-64 items-center justify-center rounded-xl border border-zinc-700 bg-zinc-900 text-zinc-400'>
              <Spinner className='mr-3 h-5 w-5' />
              {t('pages.products.details.loading')}
            </div>
          ) : productQuery.isError ? (
            <DataTableEmptyState
              icon={<PackageSearch className='h-10 w-10 text-zinc-500' />}
              title={t('pages.products.details.error-title')}
              description={t('pages.products.details.error-description')}
              action={
                <Button onClick={() => void productQuery.refetch()}>
                  {t('common.retry')}
                </Button>
              }
            />
          ) : product ? (
            <div className='space-y-4'>
              <ProductDetailsOverview
                product={product}
                categories={categories}
                currencies={currencies}
              />
              <ProductImagesGallery product={product} />
              <ProductInventorySections product={product} />
            </div>
          ) : (
            <DataTableEmptyState
              icon={<PackageSearch className='h-10 w-10 text-zinc-500' />}
              title={t('pages.products.details.not-found-title')}
              description={t('pages.products.details.not-found-description')}
            />
          )}
        </div>
      </main>

      {product && (
        <ProductFormDialog
          open={editorOpen}
          editing
          onOpenChange={setEditorOpen}
          product={product}
          saving={updateProduct.isPending}
          units={units}
          currencies={currencies}
          categories={categories}
          definitions={definitions}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
