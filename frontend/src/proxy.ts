import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Routes that require the user to be authenticated.
 * Unauthenticated visitors are redirected to /login.
 */
const PROTECTED_PREFIXES = ['/dashboard', '/resumes'];

/**
 * Routes that are only for unauthenticated users.
 * Authenticated users who land here are redirected to /dashboard.
 */
const AUTH_ONLY_ROUTES = ['/login', '/register'];

/**
 * Cookie name kept in sync with AuthContext.tsx (IS_AUTH_COOKIE).
 * This lightweight cookie is set on login/register and cleared on logout,
 * giving middleware a fast signal without a round-trip to the backend.
 */
const IS_AUTH_COOKIE = 'is_authenticated';

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isAuthenticated =
    request.cookies.get(IS_AUTH_COOKIE)?.value === '1';

  // Redirect unauthenticated users away from protected routes
  if (PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    if (!isAuthenticated) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('next', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Redirect authenticated users away from auth-only routes
  if (AUTH_ONLY_ROUTES.includes(pathname)) {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all paths except:
     *   - _next/static  (Next.js static assets)
     *   - _next/image   (image optimisation)
     *   - favicon.ico
     *   - /r/:slug      (public resume viewer — no auth needed)
     *   - /api/*        (API routes proxied to backend, handled server-side)
     */
    '/((?!_next/static|_next/image|favicon\\.ico|r/|api/).*)',
  ],
};
