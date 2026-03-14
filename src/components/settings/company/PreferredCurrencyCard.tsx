'use client';

import CardWrapper from '@/components/common/CardWrapper';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CompanyService } from '@/lib/services/CompanyService';
import { CurrencyService } from '@/lib/services/CurrencyService';
import { Currency } from '@/lib/services/dtos/currencyDtos';
import { useCompanyStore } from '@/lib/stores/companyStore';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

type Props = {
  preferredCurrency?: Currency | null;
};

export default function PreferredCurrencyCard({ preferredCurrency }: Props) {
  const t = useTranslations();

  const [currencies, setCurrencies] = useState<Currency[]>([]);

  const [savedCurrencyId, setSavedCurrencyId] = useState<string | undefined>(
    preferredCurrency?.id?.toString(),
  );

  const [selectedCurrencyId, setSelectedCurrencyId] = useState<
    string | undefined
  >(preferredCurrency?.id?.toString());

  const hasChanges =
    selectedCurrencyId !== savedCurrencyId && selectedCurrencyId !== 'none';

  useEffect(() => {
    const loadCurrencies = async () => {
      const response = await CurrencyService.getAll();

      if (response.success && response.payload) {
        setCurrencies(response.payload.currencies);
      }
    };

    loadCurrencies();
  }, []);

  // ha később jön a company adat
  useEffect(() => {
    const id = preferredCurrency?.id?.toString() ?? '';
    setSelectedCurrencyId(id);
    setSavedCurrencyId(id);
  }, [preferredCurrency]);

  const handleReset = () => {
    setSelectedCurrencyId(savedCurrencyId);
  };

  const handleSave = async () => {
    const companyId = useCompanyStore.getState().id;
    if (!companyId) return;

    const currencyId =
      selectedCurrencyId === 'none' || !selectedCurrencyId
        ? null
        : Number(selectedCurrencyId);

    const res = await CompanyService.updatePreferredCurrency({
      companyId,
      currencyId,
    });

    if (res.success) {
      const newId = res.payload.currency?.id?.toString();

      setSavedCurrencyId(newId);
      setSelectedCurrencyId(newId);

      toast(t(`messageKey.${res.messageKey}`));
    }
  };

  return (
    <CardWrapper
      title={t('pages.settings.tabs.company.currency.title')}
      description={t('pages.settings.tabs.company.currency.description')}
      cardContentExtraClass='flex flex-col items-center gap-6'
      headerAction={
        <Button
          type='button'
          variant='outline'
          size='sm'
          disabled={!hasChanges}
          onClick={handleReset}
        >
          {t('common.reset')}
        </Button>
      }
    >
      <div className='flex flex-col gap-6'>
        <Select
          value={selectedCurrencyId}
          onValueChange={setSelectedCurrencyId}
        >
          <SelectTrigger className='bg-zinc-800 border-zinc-700 text-zinc-100 min-w-72'>
            <SelectValue
              placeholder={t(
                'pages.settings.tabs.company.currency.select.placeholder',
              )}
            />
          </SelectTrigger>

          <SelectContent className='bg-zinc-800 text-zinc-300'>
            <SelectItem
              value='none'
              className='focus:bg-zinc-700 focus:text-zinc-100'
            >
              {t('common.none')}
            </SelectItem>

            <SelectSeparator />

            {currencies.map((currency) => (
              <SelectItem
                key={currency.id}
                value={currency.id.toString()}
                className='focus:bg-zinc-700 focus:text-zinc-100'
              >
                <span className='font-medium'>{currency.code}</span>
                <span className='mx-1 text-zinc-500'>—</span>
                {t(
                  `pages.settings.tabs.company.currency.select.${currency.code}`,
                  { defaultValue: currency.name },
                )}
                <span className='text-zinc-400'>({currency.symbol})</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          onClick={handleSave}
          disabled={!hasChanges}
          className='bg-zinc-500 w-72 self-center'
        >
          {t('common.save')}
        </Button>
      </div>
    </CardWrapper>
  );
}
