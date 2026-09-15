import { NextRequest, NextResponse } from 'next/server';

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow static assets, public paths, and auth/webhook endpoints
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/api/v1/webhooks') ||
    pathname === '/docdril.svg' ||
    pathname === '/favicon.ico' ||
    pathname.startsWith('/public')
  ) {
    return NextResponse.next();
  }

  const sessionCookie = req.cookies.get('docmail_session')?.value;
  const host = req.headers.get('host') || '';
  const isLocalhost = host.includes('localhost') || host.includes('127.0.0.1');

  // If on localhost and no session, automatically log in as admin so user never gets stuck
  if (isLocalhost && !sessionCookie && pathname === '/') {
    return NextResponse.redirect(new URL('/api/auth/dev-login', req.url));
  }

  // If visiting login page: redirect to dashboard if already authenticated
  if (pathname === '/login') {
    if (sessionCookie) {
      return NextResponse.redirect(new URL('/', req.url));
    }
    return NextResponse.next();
  }

  // If not authenticated, redirect to /login
  if (!sessionCookie) {
    if (isLocalhost) {
      return NextResponse.redirect(new URL('/api/auth/dev-login', req.url));
    }
    const loginUrl = new URL('/login', req.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
