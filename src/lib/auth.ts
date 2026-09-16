// Authentication and API Authorization Guard for Docdril Communication
import { NextRequest } from 'next/server';
import { hashApiKey } from './crypto';
import { DocdrilUser, RoleType } from '../types';
import { db } from './db';

export interface AuthContext {
  type: 'user' | 'api_key';
  organizationId: string;
  user?: DocdrilUser;
  apiKeyName?: string;
  scopes?: string[];
  role?: RoleType;
}

export const DEFAULT_ORG_ID = 'org_docdril_primary';

export const DEFAULT_DEV_USER: DocdrilUser = {
  id: 'usr_docdril_admin',
  organizationId: DEFAULT_ORG_ID,
  email: 'admin@docdril.com',
  name: 'Docdril Administrator',
  role: 'OWNER',
  createdAt: new Date().toISOString(),
};

/**
 * Authenticate incoming request using either:
 * 1. Bearer API Key (e.g. `Authorization: Bearer dd_live_...`)
 * 2. Session Cookie / Header
 * 3. Default dev user fallback in local development mode
 */
export async function authenticateRequest(req: NextRequest): Promise<AuthContext> {
  // Extract API key from multiple standard and non-standard header formats or query parameters
  let rawKey = '';
  const authHeader = req.headers.get('authorization') || '';
  if (authHeader.startsWith('Bearer ')) {
    rawKey = authHeader.slice(7).trim();
  } else if (authHeader.startsWith('dd_live_') || authHeader.startsWith('key_')) {
    rawKey = authHeader.trim();
  } else if (req.headers.get('x-api-key')) {
    rawKey = req.headers.get('x-api-key')!.trim();
  } else if (req.headers.get('api-key')) {
    rawKey = req.headers.get('api-key')!.trim();
  } else if (req.headers.get('key')) {
    rawKey = req.headers.get('key')!.trim();
  } else if (req.nextUrl?.searchParams?.get('key')) {
    rawKey = req.nextUrl.searchParams.get('key')!.trim();
  } else if (req.nextUrl?.searchParams?.get('apiKey')) {
    rawKey = req.nextUrl.searchParams.get('apiKey')!.trim();
  }

  // 1. OAuth Access Token authentication (issued via OAuth 2.0 flow for ChatGPT)
  if (rawKey && rawKey.startsWith('dd_oauth_')) {
    const { verifyAccessToken } = await import('./oauth');
    const tokenPayload = verifyAccessToken(rawKey);
    if (!tokenPayload) {
      throw new Error('Invalid or expired OAuth access token. Please re-authenticate.');
    }

    return {
      type: 'api_key',
      organizationId: DEFAULT_ORG_ID,
      apiKeyName: `OAuth (${tokenPayload.clientId})`,
      scopes: tokenPayload.scope ? tokenPayload.scope.split(' ') : ['messages:read', 'messages:send', 'contacts:read'],
      role: 'ADMINISTRATOR',
    };
  }

  // 2. Docdril API Key authentication
  if (rawKey) {
    const apiKey = await db.findApiKey(rawKey);
    if (!apiKey || apiKey.isRevoked) {
      throw new Error('Invalid or revoked Docdril API key');
    }

    return {
      type: 'api_key',
      organizationId: apiKey.organizationId,
      apiKeyName: apiKey.name,
      scopes: apiKey.scopes,
      role: 'ADMINISTRATOR',
    };
  }

  // 2. Cookie session (Google SSO or dev session)
  const { getSessionFromRequest } = await import('./session');
  const session = getSessionFromRequest(req);
  if (session) {
    return {
      type: 'user',
      organizationId: DEFAULT_ORG_ID,
      user: {
        id: session.id,
        organizationId: DEFAULT_ORG_ID,
        email: session.email,
        name: session.name,
        role: session.role || 'ADMINISTRATOR',
        createdAt: new Date().toISOString(),
      },
      role: session.role || 'ADMINISTRATOR',
      scopes: ['admin:all', 'messages:read', 'messages:send', 'contacts:read', 'contacts:write'],
    };
  }

  // 3. Automated unit test suite support
  if (process.env.NODE_ENV === 'test') {
    return {
      type: 'user',
      organizationId: DEFAULT_ORG_ID,
      user: DEFAULT_DEV_USER,
      role: DEFAULT_DEV_USER.role,
      scopes: ['admin:all', 'messages:read', 'messages:send', 'contacts:read', 'contacts:write'],
    };
  }

  throw new Error('Unauthorized: A valid DocMail API key or authenticated Google user session is required.');
}
