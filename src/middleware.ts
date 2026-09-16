import { NextRequest, NextResponse } from 'next/server';

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow static assets, public paths, auth, OpenAPI, MCP, and webhook endpoints
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/.well-known') ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/api/v1/webhooks') ||
    pathname === '/api/v1/openapi.json' ||
    pathname === '/openapi.json' ||
    pathname.startsWith('/api/v1/mcp') ||
    pathname === '/docdril.svg' ||
    pathname === '/favicon.ico' ||
    pathname.startsWith('/public') ||
    req.headers.has('authorization') ||
    req.headers.has('x-api-key') ||
    req.headers.has('api-key') ||
    req.headers.has('key') ||
    req.nextUrl.searchParams.has('key') ||
    req.nextUrl.searchParams.has('apiKey')
  ) {
    return NextResponse.next();
  }

  const sessionCookie = req.cookies.get('docmail_session')?.value;

  // If visiting login page: redirect to dashboard if already authenticated
  if (pathname === '/login') {
    if (sessionCookie) {
      return NextResponse.redirect(new URL('/', req.url));
    }
    return NextResponse.next();
  }

  // If not authenticated, strictly redirect to /login
  if (!sessionCookie) {
    const loginUrl = new URL('/login', req.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
