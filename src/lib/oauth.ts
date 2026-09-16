// OAuth 2.0 Helpers for DocMail
import crypto from 'crypto';

const OAUTH_SECRET = process.env.DOCDRIL_JWT_SECRET || 'docmail-secret-session-key-32-chars!!';
const CODE_VALIDITY_SECONDS = 300; // 5 minutes
const TOKEN_VALIDITY_SECONDS = 60 * 60 * 24 * 30; // 30 days

export interface AuthCodePayload {
  clientId: string;
  redirectUri: string;
  state?: string;
  scope?: string;
  codeChallenge?: string;
  codeChallengeMethod?: string;
  createdAt: number;
}

export interface OAuthTokenPayload {
  type: 'oauth_token';
  sub: string;
  clientId: string;
  scope: string;
  iat: number;
  exp: number;
}

export function generateAuthCode(payload: AuthCodePayload): string {
  const data = JSON.stringify({ ...payload, createdAt: Math.floor(Date.now() / 1000) });
  const b64 = Buffer.from(data).toString('base64url');
  const sig = crypto.createHmac('sha256', OAUTH_SECRET).update(b64).digest('base64url');
  return `doc_code_${b64}.${sig}`;
}

export function verifyAuthCode(code: string): AuthCodePayload | null {
  try {
    if (!code.startsWith('doc_code_')) return null;
    const clean = code.slice('doc_code_'.length);
    const [b64, sig] = clean.split('.');
    if (!b64 || !sig) return null;

    const expectedSig = crypto.createHmac('sha256', OAUTH_SECRET).update(b64).digest('base64url');
    if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expectedSig))) {
      return null;
    }

    const payload: AuthCodePayload = JSON.parse(Buffer.from(b64, 'base64url').toString('utf8'));
    const now = Math.floor(Date.now() / 1000);
    if (now - payload.createdAt > CODE_VALIDITY_SECONDS) {
      return null; // Expired code
    }

    return payload;
  } catch {
    return null;
  }
}

export function generateAccessToken(clientId: string, scope: string = 'messages:read messages:send contacts:read'): string {
  const now = Math.floor(Date.now() / 1000);
  const payload: OAuthTokenPayload = {
    type: 'oauth_token',
    sub: 'usr_docdril_admin',
    clientId,
    scope,
    iat: now,
    exp: now + TOKEN_VALIDITY_SECONDS,
  };

  const b64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto.createHmac('sha256', OAUTH_SECRET).update(`oauth.${b64}`).digest('base64url');
  return `dd_oauth_${b64}.${sig}`;
}

export function verifyAccessToken(token: string): OAuthTokenPayload | null {
  try {
    if (!token.startsWith('dd_oauth_')) return null;
    const clean = token.slice('dd_oauth_'.length);
    const [b64, sig] = clean.split('.');
    if (!b64 || !sig) return null;

    const expectedSig = crypto.createHmac('sha256', OAUTH_SECRET).update(`oauth.${b64}`).digest('base64url');
    if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expectedSig))) {
      return null;
    }

    const payload: OAuthTokenPayload = JSON.parse(Buffer.from(b64, 'base64url').toString('utf8'));
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      return null; // Expired token
    }

    return payload;
  } catch {
    return null;
  }
}
