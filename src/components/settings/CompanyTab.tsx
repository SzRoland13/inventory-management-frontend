'use client';

import CompanyTabLogoCard from '@/components/settings/CompanyTabLogoCard';
import CompanyTabBaseDataCard from '@/components/settings/CompanyTabBaseDataCard';
import { useEffect, useRef } from 'react';
import { CompanyService } from '@/lib/services/CompanyService';
import { CompanyExtendedResponse } from '@/lib/services/dtos/companyDtos';
import CompanyTabBillingDataCard from '@/components/settings/CompanyTabBillingDataCard';
import CompanyTabDocumentPrefixCard from '@/components/settings/CompanyTabDocumentPrefixCard';

export default function CompanyTab() {
  const initialCompanyData = useRef<CompanyExtendedResponse | undefined>(
    undefined,
  );

  useEffect(() => {
    const loadCompany = async () => {
      const res = await CompanyService.getExtendedCompanyData();

      if (res.success && res.payload) {
        initialCompanyData.current = {
          id: res.payload.id ?? null,
          name: res.payload.name ?? '',
          description: res.payload.description ?? '',
          email: res.payload.email ?? '',
          phone: res.payload.phone ?? '',
          address: res.payload.address ?? '',
          website: res.payload.website ?? '',
          taxNumber: res.payload.taxNumber ?? '',
          vatNumber: res.payload.vatNumber ?? '',
          registrationNumber: res.payload.registrationNumber ?? '',
          bankAccount: res.payload.bankAccount ?? '',
          iban: res.payload.iban ?? '',
          logoId: res.payload.logoId ?? null,
          logoUrl: res.payload.logoUrl ?? '',
          logoUrlExpiry: res.payload.logoUrlExpiry ?? '',
          exists: res.payload.exists ?? false,
        };
      }
    };

    loadCompany();
  }, []);

  return (
    <div className='grid grid-cols-1 md:grid-cols-2 gap-6 mx-6 mb-6'>
      <CompanyTabLogoCard />
      <CompanyTabBaseDataCard initialCompanyData={initialCompanyData.current} />
      <CompanyTabBillingDataCard
        initialCompanyData={initialCompanyData.current}
      />
      <CompanyTabDocumentPrefixCard />
    </div>
  );
}
