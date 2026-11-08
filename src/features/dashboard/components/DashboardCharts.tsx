import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { DashboardCurrencyTotal } from '@/features/dashboard/types/dashboard';
import { DashboardPanel } from '@/features/dashboard/components/DashboardPanel';
import { DashboardChartSkeleton, DashboardEmptyState } from '@/features/dashboard/components/DashboardStates';

type SalesProps = {
  data: number[];
  totals: DashboardCurrencyTotal[];
  startDate: Date;
  loading: boolean;
};

export function DashboardSalesChart({ data, totals, startDate, loading }: SalesProps) {
  const t = useTranslations('pages.dashboard');
  const locale = useLocale();

  return (
    <DashboardPanel className='xl:col-span-3'>
      <PanelHeading title={t('salesTrend')} subtitle={t('salesTrendHint')} icon={<ArrowUpRight className='h-4 w-4' />} tone='emerald' />
      {loading ? <DashboardChartSkeleton /> : data.every((value) => value === 0) ? <DashboardEmptyState text={t('noSales')} /> : <TrendChart data={data} label={t('salesTrendAccessible')} color='bg-emerald-400' startDate={startDate} />}
      {totals.length > 0 && (
        <div className='mt-4 flex flex-wrap gap-2'>
          {totals.map(({ currency, amount }) => (
            <span key={currency} className='rounded-lg bg-zinc-800 px-3 py-2 text-sm text-zinc-300'>
              <strong className='mr-1 text-zinc-100'>{currency}</strong>
              {new Intl.NumberFormat(locale, currency === '—' ? { maximumFractionDigits: 0 } : { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount)}
            </span>
          ))}
        </div>
      )}
    </DashboardPanel>
  );
}

export function DashboardMovementMix({
  inbound,
  outbound,
  loading,
}: {
  inbound: number;
  outbound: number;
  loading: boolean;
}) {
  const t = useTranslations('pages.dashboard');
  const total = Math.max(inbound + outbound, 1);

  return (
    <DashboardPanel className='xl:col-span-2'>
      <PanelHeading title={t('stockActivity')} subtitle={t('stockActivityHint')} icon={<ArrowDownRight className='h-4 w-4' />} tone='sky' />
      {loading ? <DashboardChartSkeleton /> : total === 1 && inbound + outbound === 0 ? <DashboardEmptyState text={t('noMovements')} /> : (
        <div className='mt-7 space-y-5'>
          <MovementBar count={inbound} total={total} label={t('inbound')} color='bg-sky-400' />
          <MovementBar count={outbound} total={total} label={t('outbound')} color='bg-violet-400' />
          <p className='text-xs text-zinc-500'>{t('movementDistribution')}</p>
        </div>
      )}
    </DashboardPanel>
  );
}

function PanelHeading({ title, subtitle, icon, tone }: { title: string; subtitle: string; icon: React.ReactNode; tone: 'emerald' | 'sky' }) {
  const iconTone = tone === 'emerald' ? 'bg-emerald-400/10 text-emerald-300' : 'bg-sky-400/10 text-sky-300';
  return (
    <div className='flex items-start justify-between gap-3'>
      <div><h3 className='font-semibold text-zinc-100'>{title}</h3><p className='mt-1 text-sm text-zinc-400'>{subtitle}</p></div>
      <span className={`rounded-lg p-2 ${iconTone}`}>{icon}</span>
    </div>
  );
}

function TrendChart({ data, label, color, startDate }: { data: number[]; label: string; color: string; startDate: Date }) {
  const max = Math.max(...data, 1);
  const locale = useLocale();
  const endDate = new Date(startDate.getTime() + (data.length - 1) * 24 * 60 * 60 * 1000);
  return (
    <div role='img' aria-label={label} className='mt-5'>
      <div className='flex h-36 items-end gap-1.5 sm:gap-2' aria-hidden='true'>
        {data.map((value, index) => (
          <div key={index} className='group relative flex h-full flex-1 items-end'>
            <div className={`w-full rounded-t-md ${color} opacity-80 transition-opacity group-hover:opacity-100`} style={{ height: `${Math.max(5, (value / max) * 100)}%` }} />
            <span className='pointer-events-none absolute -top-7 left-1/2 hidden -translate-x-1/2 rounded bg-zinc-700 px-2 py-1 text-xs text-white group-hover:block'>{value}</span>
          </div>
        ))}
      </div>
      <div className='mt-2 flex justify-between text-[11px] text-zinc-500'>
        <span>{new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric' }).format(startDate)}</span>
        <span>{new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric' }).format(endDate)}</span>
      </div>
    </div>
  );
}

function MovementBar({ count, total, label, color }: { count: number; total: number; label: string; color: string }) {
  const percentage = Math.round((count / total) * 100);
  return (
    <div>
      <div className='mb-2 flex justify-between text-sm'><span className='text-zinc-300'>{label} · {count}</span><span className='text-zinc-500'>{percentage}%</span></div>
      <div className='h-2.5 overflow-hidden rounded-full bg-zinc-800'><div className={`h-full rounded-full ${color}`} style={{ width: `${percentage}%` }} /></div>
    </div>
  );
}
