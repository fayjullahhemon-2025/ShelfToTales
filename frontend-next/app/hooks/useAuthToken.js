'use client';

import { useEffect, useState } from 'react';

/**
 * Reads the JWT from localStorage once on mount. Returns `null` for anonymous
 * visitors and during SSR (server render returns the initial `null`).
 *
 * Use this in client components that need to gate UI on auth state without
 * re-reading localStorage on every render. The value is stable for the
 * lifetime of the component — call `setToken(...)` from the auth flow to
 * trigger a refresh.
 */
export function useAuthToken() {
  const [token, setToken] = useState(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setToken(localStorage.getItem('token'));
  }, []);

  return [token, setToken];
}
