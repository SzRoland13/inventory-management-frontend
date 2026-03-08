'use client';

import CompanyTabLogoCard from '@/components/settings/CompanyTabLogoCard';
import CompanyTabDataCard from '@/components/settings/CompanyTabDataCard';

export default function CompanyTab() {
  return (
    <div className='grid grid-cols-1 md:grid-cols-2 gap-6 mx-6'>
      <CompanyTabLogoCard />
      <CompanyTabDataCard />
    </div>
  );
}
