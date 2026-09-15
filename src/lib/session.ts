import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { DEFAULT_AUTHORIZED_ADMINS, DEFAULT_ALLOWED_DOMAINS } from '@/config/firebase.config';

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  picture?: string;
  role: 'OWNER' | 'ADMINISTRATOR' | 'MEMBER';
}

const SESSION_COOKIE_NAME = 'docmail_session';
const SESSION_SECRET = process.env.DOCDRIL_JWT_SECRET || 'docmail-secret-session-key-32-chars!!';
const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 7; // 7 days

/**
 * Sign a payload into a secure HMAC-SHA256 tamper-proof token
 */
export function signSession(user: SessionUser): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const now = Math.floor(Date.now() / 1000);
  const payloadData = {
    ...user,
    iat: now,
    exp: now + SESSION_DURATION_SECONDS,
  };
  const payload = Buffer.from(JSON.stringify(payloadData)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(`${header}.${payload}`)
    .digest('base64url');

  return `${header}.${payload}.${signature}`;
}

/**
 * Verify and decode an HMAC-SHA256 session token
 */
export function verifySession(token: string): SessionUser | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [header, payload, signature] = parts;

    const expectedSignature = crypto
      .createHmac('sha256', SESSION_SECRET)
      .update(`${header}.${payload}`)
      .digest('base64url');

    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
      return null;
    }

    const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    const now = Math.floor(Date.now() / 1000);
    if (decoded.exp && decoded.exp < now) {
      return null;
    }

    return {
      id: decoded.id,
      email: decoded.email,
      name: decoded.name,
      picture: decoded.picture,
      role: decoded.role || 'MEMBER',
    };
  } catch {
    return null;
  }
}

/**
 * Extract session from NextRequest cookies
 */
export function getSessionFromRequest(req: NextRequest): SessionUser | null {
  const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySession(token);
}

/**
 * Set session cookie on a NextResponse
 */
export function setSessionCookie(res: NextResponse, token: string) {
  res.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_DURATION_SECONDS,
  });
}

/**
 * Clear session cookie on a NextResponse
 */
export function clearSessionCookie(res: NextResponse) {
  res.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
}

/**
 * Check if an email is authorized to access DocMail as an administrator
 */
export function isEmailAuthorized(email: string): boolean {
  if (!email) return false;
  const normalized = email.toLowerCase().trim();

  // 1. Check built-in primary administrators (e.g. itpiyu@gmail.com)
  if (DEFAULT_AUTHORIZED_ADMINS.map((e) => e.toLowerCase()).includes(normalized)) {
    return true;
  }

  // 2. Check explicit ADMIN_EMAILS or ALLOWED_EMAILS environment variable
  const configuredAdmins = [
    ...(process.env.ADMIN_EMAILS || '').split(','),
    ...(process.env.ALLOWED_EMAILS || '').split(','),
  ]
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  if (configuredAdmins.includes(normalized)) {
    return true;
  }

  // 3. Check ALLOWED_DOMAINS (defaults to docdril.com)
  const allowedDomains = (process.env.ALLOWED_DOMAINS || DEFAULT_ALLOWED_DOMAINS.join(','))
    .split(',')
    .map((d) => d.trim().toLowerCase())
    .filter(Boolean);

  for (const domain of allowedDomains) {
    if (normalized.endsWith(`@${domain}`)) return true;
  }

  return false;
}

