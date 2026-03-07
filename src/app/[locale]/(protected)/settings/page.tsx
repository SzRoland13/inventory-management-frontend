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

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>(SettingsTab.General);

  const onValueChange = (value: string) => {
    const enumValue = castToEnum(SettingsTab, value);

    setActiveTab(enumValue ?? SettingsTab.General);
  };

  return (
    <div className='flex flex-col w-full'>
      <MainHeader title='Settings' icon={<Settings className='w-6 h-6' />} />

      <Tabs value={activeTab} onValueChange={onValueChange}>
        <TabsList>
          <TabsTrigger value={SettingsTab.General}>General</TabsTrigger>
          <TabsTrigger value={SettingsTab.User}>User</TabsTrigger>
          <TabsTrigger value={SettingsTab.Product}>Product</TabsTrigger>
          <TabsTrigger value={SettingsTab.Company}>Company</TabsTrigger>
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
    </div>
  );
}
