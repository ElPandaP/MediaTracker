import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { isJwtValid } from '@/lib/jwt';

const protectedPrefixes = [
  '/dashboard', '/library', '/reviews', '/activity', '/profile',
  '/books', '/movies', '/series', '/comics',
];
const authPrefixes = ['/login', '/register'];

export function proxy(request: NextRequest) {
  const rawToken = request.cookies.get('tt-token')?.value;
  const authed = isJwtValid(rawToken);
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
