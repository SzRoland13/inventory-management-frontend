'use client';

import { useState } from 'react';
import MainHeader from '@/components/common/MainHeader';
import { Settings } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { SettingsTab } from '@/lib/enums/settings';
import UserTab from '@/components/settings/UserTab';
import GeneralTab from '@/components/settings/GeneralTab';
import ProductTab from '@/components/settings/ProductTab';
import CompanyTab from '@/components/settings/CompanyTab';
import { castToEnum } from '@/lib/helpers/enum';
import { Card, CardContent } from '@/components/ui/card';
import { useTranslations } from 'next-intl';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>(SettingsTab.General);

  const t = useTranslations();

  const onValueChange = (value: string) => {
    const enumValue = castToEnum(SettingsTab, value);
    setActiveTab(enumValue ?? SettingsTab.General);
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
            value={activeTab}
            onValueChange={onValueChange}
            className='py-0 rounded-none w-full h-full'
          >
            <TabsList className='mb-6 grid rounded-none w-full grid-cols-4 bg-zinc-700 py-0 data-[state=active]:bg-zinc-500'>
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

            <TabsContent value={SettingsTab.General} className='w-full h-full'>
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
