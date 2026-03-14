'use client';

import LogoCard from '@/components/settings/company/LogoCard';
import BaseDataCard from '@/components/settings/company/BaseDataCard';
import { useEffect, useState } from 'react';
import { CompanyService } from '@/lib/services/CompanyService';
import { CompanyExtendedResponse } from '@/lib/services/dtos/companyDtos';
import BillingDataCard from '@/components/settings/company/BillingDataCard';
import DocumentPrefixCard from '@/components/settings/company/DocumentPrefixCard';
import PreferredCurrencyCard from '@/components/settings/company/PreferredCurrencyCard';

export default function CompanyTab() {
  const [companyData, setCompanyData] =
    useState<CompanyExtendedResponse | null>(null);

  useEffect(() => {
    const loadCompany = async () => {
      const res = await CompanyService.getExtendedCompanyData();

      if (res.success && res.payload) {
        setCompanyData(res.payload);
      }
    };

    loadCompany();
  }, []);

  return (
    <div className='grid grid-cols-1 md:grid-cols-2 gap-6 mx-6 mb-6'>
      <LogoCard />
      <BaseDataCard initialCompanyData={companyData} />
      <BillingDataCard initialCompanyData={companyData} />
      <DocumentPrefixCard />
      <PreferredCurrencyCard
        prefferedCurrency={companyData?.prefferedCurrency}
      />
    </div>
  );
}
