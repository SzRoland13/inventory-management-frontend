import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import type { DashboardLowStockProduct } from '@/features/dashboard/types/dashboard';
import type { StockMovement } from '@/features/stocks/types/stock';
import { DashboardPanel } from '@/features/dashboard/components/DashboardPanel';
import { DashboardEmptyState, DashboardRowsSkeleton } from '@/features/dashboard/components/DashboardStates';

export function DashboardLowStockPanel({
  products,
  loading,
}: {
  products: DashboardLowStockProduct[];
  loading: boolean;
}) {
  const t = useTranslations('pages.dashboard');
  const locale = useLocale();
  const formatNumber = (value: number) =>
    new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(value);

  return (
    <DashboardPanel>
      <div className='mb-4 flex items-center justify-between gap-3'>
        <div><h3 className='font-semibold text-zinc-100'>{t('lowStock')}</h3><p className='mt-1 text-sm text-zinc-400'>{t('lowStockHint')}</p></div>
        <WidgetLink href='/stocks' label={t('viewStock')} />
      </div>
      {loading ? <DashboardRowsSkeleton /> : products.length === 0 ? <DashboardEmptyState text={t('noLowStock')} /> : (
        <div className='divide-y divide-zinc-800'>
          {products.slice(0, 6).map((product) => (
            <Link key={product.id} href={`/products/${product.id}`} className='flex min-w-0 items-center justify-between gap-3 py-3 first:pt-0 last:pb-0'>
              <div className='min-w-0'><p className='truncate text-sm font-medium text-zinc-100'>{product.name}</p><p className='mt-0.5 truncate text-xs text-zinc-500'>{product.sku}</p></div>
              <span className='shrink-0 rounded-full bg-amber-400/10 px-2.5 py-1 text-xs font-semibold text-amber-300'>
                {formatNumber(product.quantity)} / {formatNumber(product.minimumStockQuantity!)} {product.units.main.symbol}
              </span>
            </Link>
          ))}
        </div>
      )}
    </DashboardPanel>
  );
}

export function DashboardRecentActivityPanel({
  movements,
  loading,
}: {
  movements: StockMovement[];
  loading: boolean;
}) {
  const t = useTranslations('pages.dashboard');
  const locale = useLocale();

  return (
    <DashboardPanel>
      <div className='mb-4 flex items-center justify-between gap-3'>
        <div><h3 className='font-semibold text-zinc-100'>{t('recentActivity')}</h3><p className='mt-1 text-sm text-zinc-400'>{t('recentActivityHint')}</p></div>
        <WidgetLink href='/stocks' label={t('viewAll')} />
      </div>
      {loading ? <DashboardRowsSkeleton /> : movements.length === 0 ? <DashboardEmptyState text={t('noMovements')} /> : (
        <div className='divide-y divide-zinc-800'>
          {movements.slice(0, 6).map((movement) => (
            <MovementRow key={movement.id} movement={movement} locale={locale} />
          ))}
        </div>
      )}
    </DashboardPanel>
  );
}

function WidgetLink({ href, label }: { href: string; label: string }) {
  return <Link href={href} className='inline-flex shrink-0 items-center gap-1 text-sm text-indigo-300 hover:text-indigo-200'>{label}<ArrowRight className='h-4 w-4' /></Link>;
}

function MovementRow({ movement, locale }: { movement: StockMovement; locale: string }) {
  const positive = movement.quantityChange > 0;
  return (
    <div className='flex min-w-0 items-center justify-between gap-3 py-3 first:pt-0 last:pb-0'>
      <div className='min-w-0'><p className='truncate text-sm font-medium text-zinc-100'>{movement.productName}</p><p className='mt-0.5 truncate text-xs text-zinc-500'>{movement.documentNumber ?? movement.warehouseName} · {new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric' }).format(new Date(movement.date))}</p></div>
      <span className={`shrink-0 text-sm font-semibold ${positive ? 'text-emerald-300' : 'text-rose-300'}`}>
        {positive ? '+' : ''}{new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(movement.quantityChange)} {movement.unit.symbol}
      </span>
    </div>
  );
}
