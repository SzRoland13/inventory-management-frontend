'use client';

import LogoCard from '@/features/settings/components/company/LogoCard';
import BaseDataCard from '@/features/settings/components/company/BaseDataCard';
import BillingDataCard from '@/features/settings/components/company/BillingDataCard';
import DocumentPrefixCard from '@/features/settings/components/company/DocumentPrefixCard';
import PreferredCurrencyCard from '@/features/settings/components/company/PreferredCurrencyCard';
import { useExtendedCompanyQuery } from '@/features/settings/queries/companyQueries';

export default function CompanyTab() {
  const companyQuery = useExtendedCompanyQuery();
  const companyData = companyQuery.data?.payload ?? null;

  return (
    <div className='grid grid-cols-1 md:grid-cols-2 gap-6 mx-6 mb-6'>
      <LogoCard />
      <BaseDataCard initialCompanyData={companyData} />
      <BillingDataCard initialCompanyData={companyData} />
      <DocumentPrefixCard />
      <PreferredCurrencyCard
        preferredCurrency={companyData?.preferredCurrency}
      />
    </div>
  );
}
