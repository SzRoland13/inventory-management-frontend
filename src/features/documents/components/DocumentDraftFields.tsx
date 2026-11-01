'use client';

import { useTranslations } from 'next-intl';
import type { Currency } from '@/features/settings/types/currencyDtos';
import { Input } from '@/features/shared/components/ui/input';
import { Label } from '@/features/shared/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/features/shared/components/ui/select';

export function DocumentDraftDateField({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const t = useTranslations();
  return <div className='space-y-2'>
    <Label htmlFor='document-date'>{t('pages.documents.create.date')}</Label>
    <Input id='document-date' type='date' value={value} onChange={(event) => onChange(event.target.value)} className='border-zinc-600 bg-zinc-800 text-zinc-100' />
  </div>;
}

export function DocumentDraftNotesField({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const t = useTranslations();
  return <div className='space-y-2'>
    <Label htmlFor='document-notes'>{t('pages.documents.create.notes')}</Label>
    <textarea id='document-notes' value={value} onChange={(event) => onChange(event.target.value)} rows={2} maxLength={2000} placeholder={t('pages.documents.create.notesPlaceholder')} className='flex min-h-16 max-h-[40vh] w-full resize-y rounded-md border border-zinc-600 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus-visible:border-indigo-400 focus-visible:ring-0' />
  </div>;
}

export function DocumentDraftCurrencyFields({
  isAdmin,
  currencies,
  preferredCurrencyId,
  currencyId,
  staticCurrencyCode,
  exchangeRates,
  sourceCurrencyIds,
  onCurrencyChange,
  onExchangeRateChange,
  currencyError,
  exchangeRateError,
}: {
  isAdmin: boolean;
  currencies: Currency[];
  preferredCurrencyId?: number;
  currencyId: number;
  staticCurrencyCode?: string | null;
  exchangeRates: Record<number, string>;
  sourceCurrencyIds: number[];
  onCurrencyChange: (value: string) => void;
  onExchangeRateChange: (sourceCurrencyId: number, value: string) => void;
  currencyError?: string;
  exchangeRateError?: boolean;
}) {
  const t = useTranslations();
  const currencyById = new Map(currencies.map((currency) => [currency.id, currency]));
  const currencyCode = currencyById.get(currencyId)?.code ?? staticCurrencyCode ?? '';
  const hasInvalidRate = sourceCurrencyIds.some((id) => !Number.isFinite(Number(exchangeRates[id])) || Number(exchangeRates[id]) <= 0);

  return <div className='space-y-2'>
    <Label>{t('pages.documents.create.currency')}</Label>
    {isAdmin ? <Select value={String(currencyId || '')} onValueChange={onCurrencyChange}>
      <SelectTrigger className='w-full border-zinc-600 bg-zinc-800 text-zinc-100'><SelectValue placeholder={t('pages.documents.create.selectCurrency')} /></SelectTrigger>
      <SelectContent position='popper' side='bottom' sideOffset={4} avoidCollisions={false} className='border-zinc-700 bg-zinc-800 text-zinc-100'>{currencies.map((currency) => <SelectItem key={currency.id} value={String(currency.id)}>{currency.code} · {currency.name}{currency.id === preferredCurrencyId ? ` (${t('pages.documents.create.preferredCurrency')})` : ''}</SelectItem>)}</SelectContent>
    </Select> : <div className='flex h-10 items-center rounded-md border border-zinc-700 bg-zinc-800/60 px-3 text-sm text-zinc-300'>{currencyCode || t('pages.documents.create.selectCurrency')}</div>}
    {currencyError && <p className='text-xs text-rose-300'>{t(currencyError)}</p>}
    {sourceCurrencyIds.length > 0 && <section className='space-y-3 rounded-lg border border-zinc-700 bg-zinc-800/30 p-3'>
      <div><h3 className='text-sm font-medium'>{t('pages.documents.create.exchangeRates')}</h3><p className='mt-1 text-xs text-zinc-400'>{t('pages.documents.create.exchangeRatesHint', { currency: currencyCode })}</p></div>
      {sourceCurrencyIds.map((sourceCurrencyId) => {
        const sourceCurrency = currencyById.get(sourceCurrencyId);
        return <div key={sourceCurrencyId} className='grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] items-center gap-3'>
          <Label htmlFor={`exchange-rate-${sourceCurrencyId}`} className='text-sm'>{sourceCurrency?.code ?? `#${sourceCurrencyId}`} → {currencyCode}</Label>
          <Input id={`exchange-rate-${sourceCurrencyId}`} type='number' min='0.000000000001' step='any' inputMode='decimal' value={exchangeRates[sourceCurrencyId] ?? ''} onChange={(event) => onExchangeRateChange(sourceCurrencyId, event.target.value)} placeholder='1.000000' className='border-zinc-600 bg-zinc-950 text-zinc-100 tabular-nums' />
        </div>;
      })}
      {(exchangeRateError || hasInvalidRate) && <p className='text-xs text-rose-300'>{t('pages.documents.validation.exchangeRate')}</p>}
    </section>}
  </div>;
}
