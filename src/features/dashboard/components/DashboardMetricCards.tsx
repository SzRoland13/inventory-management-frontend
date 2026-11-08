import type { ReactNode } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Boxes, CircleAlert, FileText, TrendingUp } from 'lucide-react';
import { DashboardPanel } from '@/features/dashboard/components/DashboardPanel';

type Props = {
  activeProducts: number;
  lowStockProducts: number;
  salesDocuments: number;
  stockMovements: number;
  loading: boolean;
};

export function DashboardMetricCards(props: Props) {
  const t = useTranslations('pages.dashboard');
  const locale = useLocale();
  const number = (value: number) => new Intl.NumberFormat(locale).format(value);

  return (
    <div className='grid gap-3 sm:grid-cols-2 xl:grid-cols-4'>
      <Metric title={t('activeProducts')} value={number(props.activeProducts)} icon={<Boxes className='h-5 w-5' />} tone='indigo' loading={props.loading} />
      <Metric title={t('lowStock')} value={number(props.lowStockProducts)} icon={<CircleAlert className='h-5 w-5' />} tone='amber' loading={props.loading} />
      <Metric title={t('salesDocuments')} value={number(props.salesDocuments)} icon={<FileText className='h-5 w-5' />} tone='emerald' loading={props.loading} />
      <Metric title={t('stockMovements')} value={number(props.stockMovements)} icon={<TrendingUp className='h-5 w-5' />} tone='sky' loading={props.loading} />
    </div>
  );
}

function Metric({
  title,
  value,
  icon,
  tone,
  loading,
}: {
  title: string;
  value: string;
  icon: ReactNode;
  tone: 'indigo' | 'amber' | 'emerald' | 'sky';
  loading: boolean;
}) {
  const toneClass = {
    indigo: 'bg-indigo-400/10 text-indigo-300',
    amber: 'bg-amber-400/10 text-amber-300',
    emerald: 'bg-emerald-400/10 text-emerald-300',
    sky: 'bg-sky-400/10 text-sky-300',
  }[tone];

  return (
    <DashboardPanel className='flex items-center justify-between gap-3 !p-4 sm:!p-5'>
      <div className='min-w-0'>
        <p className='truncate text-sm text-zinc-400'>{title}</p>
        <p className={`mt-2 text-2xl font-semibold text-zinc-100 ${loading ? 'animate-pulse' : ''}`}>
          {loading ? '—' : value}
        </p>
      </div>
      <span className={`rounded-xl p-3 ${toneClass}`}>{icon}</span>
    </DashboardPanel>
  );
}
