'use client';

import { AuthService } from '@/lib/services/AuthService';
import { useUserStore } from '@/lib/stores/userStore';
import { UserRole } from '@/lib/utils/enums';
import { castToEnum } from '@/lib/utils/helpers';
import { useEffect, useState } from 'react';

export default function useSessionGuard() {
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const checkAuth = async () => {
      try {
        const respone = await AuthService.checkSession();

        useUserStore.getState().setUser({
          username: respone.payload.username,
          email: respone.payload.email,
          role: castToEnum(UserRole, respone.payload.role),
        });

        if (!cancelled) {
          setIsAuthenticated(true);
        }
      } catch {
        if (!cancelled) {
          setIsAuthenticated(false);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    checkAuth();

    return () => {
      cancelled = true;
    };
  }, []);

  return { loading, isAuthenticated };
}
