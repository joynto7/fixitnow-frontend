'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/lib/auth/store';
import { getAuthCookie, clearAuthCookie } from '@/lib/auth/cookie';
import { getMe } from '@/lib/api/auth';
import { ApiError } from '@/lib/api/error';

export function AuthHydrator() {
  const setAuth = useAuthStore((state) => state.setAuth);
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const setHydrated = useAuthStore((state) => state.setHydrated);
  const setAuthCheckFailed = useAuthStore((state) => state.setAuthCheckFailed);

  useEffect(() => {
    const token = getAuthCookie();
    if (!token) {
      setHydrated();
      return;
    }
    getMe(token)
      .then((user) => setAuth(user, token))
      .catch((error: unknown) => {
        if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
          clearAuthCookie();
          clearAuth();
        } else {
          // Couldn't confirm either way (network/server error) - leave the
          // existing session alone, just flag that this check was inconclusive.
          setAuthCheckFailed(true);
        }
      })
      .finally(() => setHydrated());
  }, [setAuth, clearAuth, setHydrated, setAuthCheckFailed]);

  return null;
}
