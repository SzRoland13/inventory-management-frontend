'use client';

import AvatarCard from '@/features/settings/components/user/AvatarCard';

export default function UserTab() {
  return (
    <div className='grid grid-cols-1 md:grid-cols-2 gap-6 mx-6'>
      <AvatarCard />
    </div>
  );
}
