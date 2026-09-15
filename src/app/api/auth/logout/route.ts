// Clears session cookie and logs out
import { NextRequest, NextResponse } from 'next/server';
import { clearSessionCookie } from '@/lib/session';

export async function GET(req: NextRequest) {
  const host = req.headers.get('host') || 'docmail.docdril.com';
  const protocol = host.includes('localhost') ? 'http' : 'https';
  const response = NextResponse.redirect(new URL('/login', `${protocol}://${host}`));
  clearSessionCookie(response);
  return response;
}

export async function POST() {
  const response = NextResponse.json({ success: true, message: 'Logged out' });
  clearSessionCookie(response);
  return response;
}
