import { useAuthContext } from '@/contexts/AuthContext';
import type { User, LoginCredentials, RegisterData } from '@/contexts/AuthContext';

export type { User, LoginCredentials, RegisterData };

/**
 * Primary hook for consuming AuthContext.
 *
 * Exposes:
 *   - user           — current User or null
 *   - isAuthenticated — boolean derived from user !== null
 *   - isLoading      — true while the initial /api/auth/me request is in-flight
 *   - login(credentials)  — POST /api/auth/login
 *   - logout()            — POST /api/auth/logout
 *   - register(data)      — POST /api/auth/register
 *
 * Must be called inside a component wrapped by <AuthProvider>.
 */
export function useAuth() {
  const { user, isAuthenticated, isLoading, login, logout, register } =
    useAuthContext();

  return { user, isAuthenticated, isLoading, login, logout, register };
}
