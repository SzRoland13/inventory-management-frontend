'use client';

import MainHeader from '@/components/common/MainHeader';
import { Settings } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { SettingsTab } from '@/lib/enums/settings';
import UserTab from '@/components/settings/user/UserTab';
import GeneralTab from '@/components/settings/general/GeneralTab';
import ProductTab from '@/components/settings/product/ProductTab';
import CompanyTab from '@/components/settings/company/CompanyTab';
import { castToEnum } from '@/lib/helpers/enum';
import { Card, CardContent } from '@/components/ui/card';
import { useTranslations } from 'next-intl';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';

export default function SettingsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const t = useTranslations();

  const currentTab =
    castToEnum(SettingsTab, searchParams.get('tab') ?? '') ??
    SettingsTab.General;

  const onTabChange = (tab: string) => {
    const enumValue = castToEnum(SettingsTab, tab) ?? SettingsTab.General;
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', enumValue);
    router.replace(`${pathname}?${params.toString()}`);
  };

  const triggerStyle = `
        text-lg font-semibold
        text-zinc-400
        hover:text-zinc-200
        hover:bg-zinc-500
        data-[state=active]:bg-zinc-500
        data-[state=active]:text-white
        data-[state=active]:shadow-none
        transition-colors
        mx-1
      `;

  return (
    <div className='flex flex-col w-full'>
      <MainHeader title='Settings' icon={<Settings className='w-6 h-6' />} />

      <Card className='bg-zinc-750 border-zinc-700 shadow-xl h-full rounded-none border-0 p-0 m-0'>
        <CardContent className='p-0 m-0 rounded-none w-full h-full'>
          <Tabs
            value={currentTab}
            onValueChange={onTabChange}
            className='rounded-none w-full h-full py-0'
          >
            <TabsList className='mb-6 grid grid-cols-2 sm:grid-cols-4 rounded-none w-full py-0 bg-zinc-700 data-[state=active]:bg-zinc-500'>
              <TabsTrigger value={SettingsTab.General} className={triggerStyle}>
                {t('pages.settings.tabs.general.title')}
              </TabsTrigger>

              <TabsTrigger value={SettingsTab.User} className={triggerStyle}>
                {t('pages.settings.tabs.user.title')}
              </TabsTrigger>

              <TabsTrigger value={SettingsTab.Product} className={triggerStyle}>
                {t('pages.settings.tabs.product.title')}
              </TabsTrigger>

              <TabsTrigger value={SettingsTab.Company} className={triggerStyle}>
                {t('pages.settings.tabs.company.title')}
              </TabsTrigger>
            </TabsList>

            <TabsContent value={SettingsTab.General}>
              <GeneralTab />
            </TabsContent>

            <TabsContent value={SettingsTab.User}>
              <UserTab />
            </TabsContent>

            <TabsContent value={SettingsTab.Product}>
              <ProductTab />
            </TabsContent>

            <TabsContent value={SettingsTab.Company}>
              <CompanyTab />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
