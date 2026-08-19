'use client';

import { AuthProvider } from '@/contexts/AuthContext';

/**
 * Wraps the entire app in all client-side providers.
 * Add new providers here as the app grows (e.g. React Query, Toaster, etc.).
 */
export function Providers({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}
