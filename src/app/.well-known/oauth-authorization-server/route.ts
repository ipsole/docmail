// RFC 8414 OAuth 2.0 Authorization Server Metadata
import { NextResponse } from 'next/server';

export async function GET() {
  const metadata = {
    issuer: 'https://docmail.docdril.com',
    authorization_endpoint: 'https://docmail.docdril.com/api/auth/oauth/authorize',
    token_endpoint: 'https://docmail.docdril.com/api/auth/oauth/token',
    token_endpoint_auth_methods_supported: ['none', 'client_secret_post', 'client_secret_basic'],
    token_endpoint_auth_signing_alg_values_supported: ['HS256'],
    response_types_supported: ['code'],
    grant_types_supported: ['authorization_code'],
    code_challenge_methods_supported: ['S256', 'plain'],
    scopes_supported: [
      'messages:read',
      'messages:send',
      'contacts:read',
      'contacts:write',
      'mailboxes:read',
    ],
    service_documentation: 'https://docmail.docdril.com',
    ui_locales_supported: ['en'],
  };

  return NextResponse.json(metadata, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
