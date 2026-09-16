// POST /api/auth/oauth/token
// OAuth 2.0 Token Exchange Endpoint for ChatGPT
import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthCode, generateAccessToken } from '@/lib/oauth';

export async function POST(req: NextRequest) {
  let grantType = '';
  let code = '';
  let redirectUri = '';
  let clientId = '';

  const contentType = req.headers.get('content-type') || '';
  if (contentType.includes('application/x-www-form-urlencoded')) {
    const formData = await req.formData();
    grantType = (formData.get('grant_type') as string) || '';
    code = (formData.get('code') as string) || '';
    redirectUri = (formData.get('redirect_uri') as string) || '';
    clientId = (formData.get('client_id') as string) || '';
  } else {
    try {
      const body = await req.json();
      grantType = body.grant_type || '';
      code = body.code || '';
      redirectUri = body.redirect_uri || '';
      clientId = body.client_id || '';
    } catch {
      // fallback
    }
  }

  // Also extract basic auth header if client sent client_id there
  const authHeader = req.headers.get('authorization') || '';
  if (authHeader.startsWith('Basic ')) {
    try {
      const creds = Buffer.from(authHeader.slice(6), 'base64').toString('utf8');
      const [u] = creds.split(':');
      if (u) clientId = u;
    } catch {
      // ignore
    }
  }

  if (grantType !== 'authorization_code') {
    return NextResponse.json(
      { error: 'unsupported_grant_type', error_description: 'Only authorization_code grant type is supported' },
      { status: 400 }
    );
  }

  if (!code) {
    return NextResponse.json(
      { error: 'invalid_request', error_description: 'Missing code parameter' },
      { status: 400 }
    );
  }

  const payload = verifyAuthCode(code);
  if (!payload) {
    return NextResponse.json(
      { error: 'invalid_grant', error_description: 'The authorization code is invalid or expired' },
      { status: 400 }
    );
  }

  // Generate long-lived OAuth Bearer access token
  const scope = payload.scope || 'messages:read messages:send contacts:read';
  const accessToken = generateAccessToken(payload.clientId || clientId || 'chatgpt', scope);

  return NextResponse.json(
    {
      access_token: accessToken,
      token_type: 'Bearer',
      expires_in: 60 * 60 * 24 * 30, // 30 days
      scope,
    },
    {
      headers: {
        'Cache-Control': 'no-store',
        'Pragma': 'no-cache',
        'Access-Control-Allow-Origin': '*',
      },
    }
  );
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
