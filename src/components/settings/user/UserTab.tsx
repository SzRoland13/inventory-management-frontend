'use client';

import UserTabAvatarCard from '@/components/settings/user/UserTabAvatarCard';

export default function UserTab() {
  return (
    <div className='grid grid-cols-1 md:grid-cols-2 gap-6 mx-6'>
      <UserTabAvatarCard />
    </div>
  );
}
