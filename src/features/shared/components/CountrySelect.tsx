'use client';

import { useMemo, useRef, useState } from 'react';
import { Check, ChevronsUpDown, Search } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { Popover as PopoverPrimitive } from 'radix-ui';
import { Button } from '@/features/shared/components/ui/button';
import { Input } from '@/features/shared/components/ui/input';
import { ISO_3166_ALPHA_2_CODES } from '@/features/shared/helpers/countries';

interface CountrySelectProps {
  id?: string;
  value: string;
  onValueChange: (countryCode: string) => void;
  disabled?: boolean;
  invalid?: boolean;
  ariaLabel?: string;
}

export function CountrySelect({ id, value, onValueChange, disabled, invalid, ariaLabel }: CountrySelectProps) {
  const locale = useLocale();
  const t = useTranslations();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const countries = useMemo(() => {
    const displayNames = new Intl.DisplayNames([locale], { type: 'region' });
    return ISO_3166_ALPHA_2_CODES
      .map((code) => ({ code, name: displayNames.of(code) ?? code }))
      .sort((left, right) => left.name.localeCompare(right.name, locale));
  }, [locale]);

  const selectedCountry = countries.find((country) => country.code === value.toUpperCase());
  const normalizedSearch = search.trim().toLocaleLowerCase(locale);
  const filteredCountries = normalizedSearch
    ? countries.filter(({ code, name }) =>
        name.toLocaleLowerCase(locale).includes(normalizedSearch) ||
        code.toLocaleLowerCase(locale).includes(normalizedSearch),
      )
    : countries;

  return (
    <PopoverPrimitive.Root
      open={open}
      onOpenChange={(isOpen) => {
        setOpen(isOpen);
        if (isOpen) setSearch('');
      }}
    >
      <PopoverPrimitive.Trigger asChild>
        <Button
          type='button'
          id={id}
          variant='outline'
          role='combobox'
          aria-expanded={open}
          aria-invalid={invalid}
          aria-label={ariaLabel}
          disabled={disabled}
          className='w-full justify-between border-zinc-700 bg-zinc-900 font-normal text-zinc-100 hover:bg-zinc-800 hover:text-zinc-100'
        >
          <span className='truncate'>
            {selectedCountry
              ? `${selectedCountry.name} (${selectedCountry.code})`
              : value || t('common.country.placeholder')}
          </span>
          <ChevronsUpDown className='ml-2 h-4 w-4 shrink-0 opacity-50' />
        </Button>
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          align='start'
          sideOffset={4}
          onOpenAutoFocus={(event) => {
            event.preventDefault();
            requestAnimationFrame(() => inputRef.current?.focus());
          }}
          className='z-[100] w-[var(--radix-popover-trigger-width)] min-w-64 overflow-hidden rounded-md border border-zinc-700 bg-zinc-900 p-0 text-zinc-100 shadow-lg'
        >
          <div className='relative border-b border-zinc-700 p-2'>
            <Search className='pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400' />
            <Input
              ref={inputRef}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t('common.country.search')}
              aria-label={t('common.country.search')}
              className='border-zinc-700 bg-zinc-800 pl-8 text-zinc-100 placeholder:text-zinc-400'
            />
          </div>
          <div role='listbox' aria-label={t('common.country.label')} className='max-h-64 overflow-y-auto p-1'>
            {filteredCountries.length ? filteredCountries.map(({ code, name }) => (
              <button
                key={code}
                type='button'
                role='option'
                aria-selected={code === value.toUpperCase()}
                onClick={() => {
                  onValueChange(code);
                  setOpen(false);
                }}
                className='flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm outline-none hover:bg-zinc-800 focus:bg-zinc-800'
              >
                <Check className={`h-4 w-4 shrink-0 ${code === value.toUpperCase() ? 'opacity-100' : 'opacity-0'}`} />
                <span className='min-w-0 flex-1 truncate'>{name}</span>
                <span className='font-mono text-xs text-zinc-400'>{code}</span>
              </button>
            )) : (
              <p className='px-3 py-6 text-center text-sm text-zinc-400'>{t('common.country.no-results')}</p>
            )}
          </div>
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}
