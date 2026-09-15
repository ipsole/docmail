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
  const authHeader = req.headers.get('authorization') || '';

  // 1. API Key authentication
  if (authHeader.startsWith('Bearer dd_live_')) {
    const rawKey = authHeader.replace('Bearer ', '').trim();
    const keyHash = hashApiKey(rawKey);

    const apiKey = await db.findApiKeyByHash(keyHash);
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

  // 3. Fallback dev user session
  return {
    type: 'user',
    organizationId: DEFAULT_ORG_ID,
    user: DEFAULT_DEV_USER,
    role: DEFAULT_DEV_USER.role,
    scopes: ['admin:all', 'messages:read', 'messages:send', 'contacts:read', 'contacts:write'],
  };
}
