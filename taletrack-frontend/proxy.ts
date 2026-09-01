import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const protectedPrefixes = [
  '/dashboard', '/library', '/reviews', '/activity', '/profile',
  '/books', '/movies', '/series', '/comics',
];
const authPrefixes = ['/login', '/register'];

/**
 * Cheap client-side validity check: is the JWT well-formed and unexpired?
 * The backend still does real signature validation — this is only for routing
 * so an expired session lands on /login instead of an empty app.
 */
function isTokenValid(token: string | undefined): boolean {
  if (!token) return false;
  try {
    const seg = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(atob(seg));
    return typeof payload.exp === 'number' && payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
}

export function proxy(request: NextRequest) {
  const rawToken = request.cookies.get('tt-token')?.value;
  const authed = isTokenValid(rawToken);
  const { pathname } = request.nextUrl;

  const isProtected = protectedPrefixes.some((p) => pathname === p || pathname.startsWith(p + '/'));
  const isAuth = authPrefixes.some((p) => pathname === p || pathname.startsWith(p + '/'));

  // Stale/expired cookie: strip it so the app behaves as logged-out this request too.
  if (rawToken && !authed) {
    request.cookies.delete('tt-token');
    const response = isProtected
      ? NextResponse.redirect(new URL('/login', request.url))
      : NextResponse.next({ request });
    response.cookies.delete('tt-token');
    return response;
  }

  if (isProtected && !authed) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (isAuth && authed) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon\\.ico).*)'],
};
