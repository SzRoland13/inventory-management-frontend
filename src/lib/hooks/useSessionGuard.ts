'use client';

import { useSessionQuery } from '@/lib/queries/authQueries';
import { useUserStore } from '@/lib/stores/userStore';
import { UserRole } from '@/lib/enums/user';
import { castToEnum } from '@/lib/helpers/enum';
import { useEffect } from 'react';

export default function useSessionGuard() {
  const sessionQuery = useSessionQuery();

  useEffect(() => {
    const payload = sessionQuery.data?.payload;
    if (!payload) return;

    useUserStore.getState().setUser({
      username: payload.username,
      email: payload.email,
      role: castToEnum(UserRole, payload.role),
    });
  }, [sessionQuery.data]);

  return {
    loading: sessionQuery.isPending,
    isAuthenticated: sessionQuery.isSuccess,
  };
}
