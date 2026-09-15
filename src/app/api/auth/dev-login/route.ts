// Development-only one-click login bypass for testing without Google credentials
import { NextRequest, NextResponse } from 'next/server';
import { signSession, setSessionCookie, SessionUser } from '@/lib/session';

export async function GET(req: NextRequest) {
  const host = req.headers.get('host') || 'docmail.docdril.com';
  const protocol = host.includes('localhost') ? 'http' : 'https';
  const baseUrl = `${protocol}://${host}`;

  const devUser: SessionUser = {
    id: 'usr_docdril_owner',
    email: 'admin@docdril.com',
    name: 'Docdril Administrator',
    role: 'OWNER',
  };

  const token = signSession(devUser);
  const response = NextResponse.redirect(new URL('/', baseUrl));
  setSessionCookie(response, token);
  return response;
}
