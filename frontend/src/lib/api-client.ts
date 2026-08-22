import axios, { type InternalAxiosRequestConfig } from 'axios';
import Cookies from 'js-cookie';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

const apiClient = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: {
    Accept: 'application/json',
  },
});

/**
 * Shared promise so concurrent requests only trigger ONE csrf-cookie fetch.
 * Without this, N simultaneous requests fire N redundant GETs.
 */
let csrfCookiePromise: Promise<void> | null = null;

function refreshCsrfCookie(): Promise<void> {
  if (!csrfCookiePromise) {
    csrfCookiePromise = axios
      .get(`${BASE_URL}/sanctum/csrf-cookie`, { withCredentials: true })
      .then(() => undefined)
      .finally(() => {
        csrfCookiePromise = null;
      });
  }
  return csrfCookiePromise;
}

function attachXsrfHeader(config: InternalAxiosRequestConfig): void {
  const xsrfToken = Cookies.get('XSRF-TOKEN');
  if (xsrfToken) {
    config.headers.set('X-XSRF-TOKEN', decodeURIComponent(xsrfToken));
  }
}

// Request interceptor: attach XSRF token, fetching the cookie first if missing
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    if (!Cookies.get('XSRF-TOKEN')) {
      await refreshCsrfCookie();
    }
    attachXsrfHeader(config);
    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor:
// - On 419 (CSRF token mismatch / expired page): refetch a fresh CSRF cookie
//   and retry the original request ONCE. This self-heals stale tokens after
//   login/session rotation, which previously made the first action fail.
// - On 401: redirect to /login, but only when:
//   1. Not already on an auth page (avoids redirect loop)
//   2. Not a session-check request (AuthContext already handles that silently)
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error.response?.status;
    const originalConfig = error.config as
      | (InternalAxiosRequestConfig & { _retriedAfter419?: boolean })
      | undefined;

    if (
      status === 419 &&
      originalConfig &&
      !originalConfig._retriedAfter419 &&
      typeof window !== 'undefined'
    ) {
      originalConfig._retriedAfter419 = true;
      try {
        await refreshCsrfCookie();
        attachXsrfHeader(originalConfig);
        return apiClient.request(originalConfig);
      } catch {
        // Could not refresh CSRF cookie — fall through and reject below
      }
    }

    if (status === 401 && typeof window !== 'undefined') {
      const url = error.config?.url ?? '';
      const pathname = window.location.pathname;

      // Skip redirect for the session-check call and when already on auth pages
      const isAuthPage = pathname === '/login' || pathname === '/register';
      const isSessionCheck = url.includes('/api/auth/me');

      if (!isAuthPage && !isSessionCheck) {
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  },
);

export default apiClient;
