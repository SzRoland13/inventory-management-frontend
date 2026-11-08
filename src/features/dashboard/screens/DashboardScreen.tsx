'use client';

import { Boxes, RefreshCw } from 'lucide-react';
import { useTranslations } from 'next-intl';
import MainHeader from '@/features/shared/components/MainHeader';
import { Button } from '@/features/shared/components/ui/button';
import { DashboardPanel } from '@/features/dashboard/components/DashboardPanel';
import { DashboardMetricCards } from '@/features/dashboard/components/DashboardMetricCards';
import {
  DashboardLowStockPanel,
  DashboardRecentActivityPanel,
} from '@/features/dashboard/components/DashboardInventoryPanels';
import {
  DashboardMovementMix,
  DashboardSalesChart,
} from '@/features/dashboard/components/DashboardCharts';
import { getDashboardDateRange } from '@/features/dashboard/helpers/dashboardData';
import { useDashboardQuery } from '@/features/dashboard/queries/dashboardQueries';

export default function DashboardScreen() {
  const t = useTranslations('pages.dashboard');
  const dateRange = getDashboardDateRange();
  const dashboardQuery = useDashboardQuery(dateRange);
  const data = dashboardQuery.data;

  return (
    <div className='flex min-h-full w-full flex-col'>
      <MainHeader
        title={t('title')}
        icon={<Boxes className='h-6 w-6 self-center' />}
      />
      <main className='mx-auto w-full max-w-[1440px] space-y-5 p-4 sm:p-6 lg:p-8'>
        <div className='flex flex-wrap items-end justify-between gap-3'>
          <div>
            <h2 className='text-2xl font-semibold tracking-tight text-zinc-100'>
              {t('welcome')}
            </h2>
            <p className='mt-1 text-sm text-zinc-400'>{t('subtitle')}</p>
          </div>
          <span className='rounded-full border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-300'>
            {t('last30Days')}
          </span>
        </div>

        {dashboardQuery.isError && (
          <DashboardPanel className='flex flex-wrap items-center justify-between gap-3 border-rose-900/70'>
            <p className='text-sm text-rose-200'>{t('loadError')}</p>
            <Button variant='outline' onClick={() => void dashboardQuery.refetch()}>
              <RefreshCw className='mr-2 h-4 w-4' />
              {t('retry')}
            </Button>
          </DashboardPanel>
        )}

        <DashboardMetricCards
          activeProducts={data?.activeProductCount ?? 0}
          lowStockProducts={data?.lowStockProducts.length ?? 0}
          salesDocuments={data?.salesDocumentCount ?? 0}
          stockMovements={data?.movements.length ?? 0}
          loading={dashboardQuery.isPending}
        />

        <div className='grid gap-4 xl:grid-cols-5'>
          <DashboardSalesChart
            data={data?.salesTrend ?? []}
            totals={data?.salesTotals ?? []}
            startDate={dateRange.start}
            loading={dashboardQuery.isPending}
          />
          <DashboardMovementMix
            inbound={data?.inboundMovementCount ?? 0}
            outbound={data?.outboundMovementCount ?? 0}
            loading={dashboardQuery.isPending}
          />
        </div>

        <div className='grid gap-4 xl:grid-cols-2'>
          <DashboardLowStockPanel
            products={data?.lowStockProducts ?? []}
            loading={dashboardQuery.isPending}
          />
          <DashboardRecentActivityPanel
            movements={data?.movements ?? []}
            loading={dashboardQuery.isPending}
          />
        </div>
      </main>
    </div>
  );
}
