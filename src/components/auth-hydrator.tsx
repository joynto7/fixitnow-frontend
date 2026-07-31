'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/lib/auth/store';
import { getAuthCookie, clearAuthCookie } from '@/lib/auth/cookie';
import { getMe } from '@/lib/api/auth';

export function AuthHydrator() {
  const setAuth = useAuthStore((state) => state.setAuth);
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const setHydrated = useAuthStore((state) => state.setHydrated);

  useEffect(() => {
    const token = getAuthCookie();
    if (!token) {
      setHydrated();
      return;
    }
    getMe(token)
      .then((user) => setAuth(user, token))
      .catch(() => {
        clearAuthCookie();
        clearAuth();
      })
      .finally(() => setHydrated());
  }, [setAuth, clearAuth, setHydrated]);

  return null;
}
