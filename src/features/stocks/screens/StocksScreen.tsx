'use client';

import { ArrowLeftRight, Barcode, Boxes } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import MainHeader from '@/features/shared/components/MainHeader';
import { Routes } from '@/features/shared/types/routes';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/features/shared/components/ui/tabs';
import { StockBalancesTable } from '@/features/stocks/components/StockBalancesTable';
import { StockMovementsTable } from '@/features/stocks/components/StockMovementsTable';

export default function StocksScreen() {
  const t = useTranslations();
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedProductId = Number(searchParams.get('productId'));
  const initialProductId =
    Number.isInteger(requestedProductId) && requestedProductId > 0
      ? String(requestedProductId)
      : undefined;
  const productFilterValue = initialProductId ?? 'ALL';
  const activeView =
    searchParams.get('view') === 'movements' ? 'movements' : 'balances';

  function updateProductFilter(productId: string) {
    const query = new URLSearchParams();
    if (activeView !== 'balances') query.set('view', activeView);
    if (productId !== 'ALL') query.set('productId', productId);
    const queryString = query.toString();
    router.replace(
      queryString ? `${Routes.Stocks}?${queryString}` : Routes.Stocks,
      { scroll: false },
    );
  }

  return (
    <div className='flex w-full flex-col'>
      <MainHeader
        title={t('pages.stocks.title')}
        icon={<Barcode className='h-6 w-6 self-center' />}
      />
      <section className='m-3 overflow-hidden rounded-lg border bg-zinc-900'>
        <Tabs
          value={activeView}
          onValueChange={(value) => {
            if (value === 'balances' || value === 'movements') {
              const query = new URLSearchParams({ view: value });
              if (productFilterValue !== 'ALL') {
                query.set('productId', productFilterValue);
              }
              router.replace(`${Routes.Stocks}?${query.toString()}`, {
                scroll: false,
              });
            }
          }}
        >
          <TabsList
            variant='default'
            className='mx-4 mt-4 w-fit max-w-full gap-1 rounded-xl border border-zinc-700/80 bg-zinc-950 p-1'
          >
            <TabsTrigger
              value='balances'
              className='h-9 gap-2 rounded-lg px-4 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-100 group-data-[variant=default]/tabs-list:data-[state=active]:border-indigo-400/30 group-data-[variant=default]/tabs-list:data-[state=active]:bg-indigo-500/15 group-data-[variant=default]/tabs-list:data-[state=active]:text-indigo-100 group-data-[variant=default]/tabs-list:data-[state=active]:shadow-none'
            >
              <Boxes aria-hidden='true' className='h-4 w-4' />
              {t('pages.stocks.views.balances')}
            </TabsTrigger>
            <TabsTrigger
              value='movements'
              className='h-9 gap-2 rounded-lg px-4 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-100 group-data-[variant=default]/tabs-list:data-[state=active]:border-indigo-400/30 group-data-[variant=default]/tabs-list:data-[state=active]:bg-indigo-500/15 group-data-[variant=default]/tabs-list:data-[state=active]:text-indigo-100 group-data-[variant=default]/tabs-list:data-[state=active]:shadow-none'
            >
              <ArrowLeftRight aria-hidden='true' className='h-4 w-4' />
              {t('pages.stocks.views.movements')}
            </TabsTrigger>
          </TabsList>
          <TabsContent
            value='balances'
            forceMount
            hidden={activeView !== 'balances'}
          >
            <StockBalancesTable
              productId={productFilterValue}
              onProductIdChange={updateProductFilter}
              enabled={activeView === 'balances'}
            />
          </TabsContent>
          <TabsContent
            value='movements'
            forceMount
            hidden={activeView !== 'movements'}
          >
            <StockMovementsTable
              productId={productFilterValue}
              onProductIdChange={updateProductFilter}
              enabled={activeView === 'movements'}
            />
          </TabsContent>
        </Tabs>
      </section>
    </div>
  );
}
