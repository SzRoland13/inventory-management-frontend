'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';

import CardWrapper from '@/features/shared/components/CardWrapper';
import { Label } from '@/features/shared/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/features/shared/components/ui/select';
import { usePathname, useRouter } from '@/i18n/navigation';

const supportedLocales = ['en', 'hu'] as const;
type SupportedLocale = (typeof supportedLocales)[number];

export default function LanguageCard() {
  const locale = useLocale() as SupportedLocale;
  const t = useTranslations();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  const changeLocale = (nextLocale: string) => {
    if (!supportedLocales.includes(nextLocale as SupportedLocale)) return;

    router.replace(
      {
        pathname,
        query: Object.fromEntries(searchParams.entries()),
      },
      { locale: nextLocale as SupportedLocale },
    );
  };

  return (
    <CardWrapper
      title={t('pages.settings.tabs.user.language.title')}
      description={t('pages.settings.tabs.user.language.description')}
    >
      <div className='flex flex-col gap-2'>
        <Label className='text-zinc-400'>
          {t('pages.settings.tabs.user.language.label')}
        </Label>
        <Select value={locale} onValueChange={changeLocale}>
          <SelectTrigger className='w-full border-zinc-700 bg-zinc-900 text-zinc-100'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent className='border-zinc-700 bg-zinc-800 text-zinc-100'>
            <SelectItem value='en'>
              {t('pages.settings.tabs.user.language.options.en')}
            </SelectItem>
            <SelectItem value='hu'>
              {t('pages.settings.tabs.user.language.options.hu')}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
    </CardWrapper>
  );
}
