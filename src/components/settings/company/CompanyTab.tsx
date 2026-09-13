'use client';

import LogoCard from '@/components/settings/company/LogoCard';
import BaseDataCard from '@/components/settings/company/BaseDataCard';
import BillingDataCard from '@/components/settings/company/BillingDataCard';
import DocumentPrefixCard from '@/components/settings/company/DocumentPrefixCard';
import PreferredCurrencyCard from '@/components/settings/company/PreferredCurrencyCard';
import { useExtendedCompanyQuery } from '@/lib/queries/companyQueries';

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
