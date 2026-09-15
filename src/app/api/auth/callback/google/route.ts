// Handles Google OAuth 2.0 Callback, token exchange, and authorization check
import { NextRequest, NextResponse } from 'next/server';
import { signSession, setSessionCookie, isEmailAuthorized, SessionUser } from '@/lib/session';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  const host = req.headers.get('host') || 'docmail.docdril.com';
  const protocol = host.includes('localhost') ? 'http' : 'https';
  const baseUrl = `${protocol}://${host}`;

  if (error || !code) {
    return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(error || 'no_code')}`, baseUrl));
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || `${baseUrl}/api/auth/callback/google`;

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(new URL('/login?error=credentials_missing', baseUrl));
  }

  try {
    // 1. Exchange authorization code for Google access token
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    const tokenData = await tokenRes.json();
    if (!tokenRes.ok || !tokenData.access_token) {
      console.error('[Google OAuth] Token exchange failed:', tokenData);
      return NextResponse.redirect(new URL('/login?error=token_exchange_failed', baseUrl));
    }

    // 2. Fetch authenticated user profile from Google
    const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    const userData = await userRes.json();
    if (!userRes.ok || !userData.email) {
      console.error('[Google OAuth] UserInfo fetch failed:', userData);
      return NextResponse.redirect(new URL('/login?error=userinfo_failed', baseUrl));
    }

    const email = userData.email;

    // 3. Authorization check (only authorized company emails or allowed domains)
    if (!isEmailAuthorized(email)) {
      console.warn(`[Google OAuth Access Denied] ${email} is not authorized`);
      return NextResponse.redirect(
        new URL(`/login?error=unauthorized&email=${encodeURIComponent(email)}`, baseUrl)
      );
    }

    // 4. Create secure session
    const sessionUser: SessionUser = {
      id: `usr_google_${userData.id || Date.now()}`,
      email: userData.email,
      name: userData.name || userData.email.split('@')[0],
      picture: userData.picture || undefined,
      role: 'ADMINISTRATOR',
    };

    const sessionToken = signSession(sessionUser);
    const response = NextResponse.redirect(new URL('/', baseUrl));
    setSessionCookie(response, sessionToken);

    return response;
  } catch (err: any) {
    console.error('[Google OAuth Callback Error]', err);
    return NextResponse.redirect(new URL('/login?error=internal_error', baseUrl));
  }
}
