// OpenID Connect Configuration Metadata
import { NextResponse } from 'next/server';

export async function GET() {
  const metadata = {
    issuer: 'https://docmail.docdril.com',
    authorization_endpoint: 'https://docmail.docdril.com/api/auth/oauth/authorize',
    token_endpoint: 'https://docmail.docdril.com/api/auth/oauth/token',
    userinfo_endpoint: 'https://docmail.docdril.com/api/auth/session',
    token_endpoint_auth_methods_supported: ['none', 'client_secret_post', 'client_secret_basic'],
    response_types_supported: ['code'],
    subject_types_supported: ['public'],
    id_token_signing_alg_values_supported: ['HS256'],
    scopes_supported: ['openid', 'email', 'profile'],
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
    },
  });
}
