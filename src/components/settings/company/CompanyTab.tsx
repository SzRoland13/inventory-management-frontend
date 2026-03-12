'use client';

import CompanyTabLogoCard from '@/components/settings/company/CompanyTabLogoCard';
import CompanyTabBaseDataCard from '@/components/settings/company/CompanyTabBaseDataCard';
import { useEffect, useState } from 'react';
import { CompanyService } from '@/lib/services/CompanyService';
import { CompanyExtendedResponse } from '@/lib/services/dtos/companyDtos';
import CompanyTabBillingDataCard from '@/components/settings/company/CompanyTabBillingDataCard';
import CompanyTabDocumentPrefixCard from '@/components/settings/company/CompanyTabDocumentPrefixCard';

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
      <CompanyTabLogoCard />
      <CompanyTabBaseDataCard initialCompanyData={companyData} />
      <CompanyTabBillingDataCard initialCompanyData={companyData} />
      <CompanyTabDocumentPrefixCard />
    </div>
  );
}
