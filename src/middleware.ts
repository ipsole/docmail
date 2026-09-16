import { NextRequest, NextResponse } from 'next/server';

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 1. Static assets and public resources
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/.well-known') ||
    pathname === '/docdril.svg' ||
    pathname === '/favicon.ico' ||
    pathname.startsWith('/public')
  ) {
    return NextResponse.next();
  }

  // 2. Public auth endpoints, webhooks, OpenAPI, and MCP
  if (
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/api/v1/webhooks') ||
    pathname === '/api/v1/openapi.json' ||
    pathname === '/openapi.json' ||
    pathname.startsWith('/api/v1/mcp')
  ) {
    return NextResponse.next();
  }

  // 3. Authenticated API requests with Bearer or API Key headers
  if (pathname.startsWith('/api/')) {
    if (
      req.headers.has('authorization') ||
      req.headers.has('x-api-key') ||
      req.headers.has('api-key') ||
      req.headers.has('key') ||
      req.nextUrl.searchParams.has('key') ||
      req.nextUrl.searchParams.has('apiKey')
    ) {
      return NextResponse.next();
    }
  }

  const sessionCookie = req.cookies.get('docmail_session')?.value;

  // 4. If visiting login page:
  if (pathname === '/login') {
    if (sessionCookie && sessionCookie.split('.').length === 3) {
      return NextResponse.redirect(new URL('/', req.url));
    }
    return NextResponse.next();
  }

  // 5. All UI pages (/, /contacts, /templates, /admin) REQUIRE a valid Google session
  if (!sessionCookie || sessionCookie.split('.').length !== 3) {
    const loginUrl = new URL('/login', req.url);
    const response = NextResponse.redirect(loginUrl);
    if (sessionCookie) {
      response.cookies.set('docmail_session', '', { maxAge: 0, path: '/' });
    }
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
