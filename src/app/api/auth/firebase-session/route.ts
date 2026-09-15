import { NextRequest, NextResponse } from 'next/server';
import { firebaseConfig } from '@/config/firebase.config';
import { isEmailAuthorized, signSession, setSessionCookie, SessionUser } from '@/lib/session';
import { db } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { idToken } = body;

    if (!idToken || typeof idToken !== 'string') {
      return NextResponse.json(
        { error: 'Missing ID token' },
        { status: 400 }
      );
    }

    let verifiedEmail = '';
    let displayName = '';
    let photoUrl = '';
    let localId = '';

    // 1. Primary: Verify Firebase JWT token claims (Issuer, Audience, Expiry)
    try {
      const parts = idToken.split('.');
      if (parts.length === 3) {
        const payloadJson = Buffer.from(parts[1], 'base64url').toString('utf8');
        const jwtPayload = JSON.parse(payloadJson);
        const now = Math.floor(Date.now() / 1000);

        // Verify token is not expired and matches our Firebase project
        const isAudMatch = jwtPayload.aud === firebaseConfig.projectId;
        const isIssMatch = jwtPayload.iss === `https://securetoken.google.com/${firebaseConfig.projectId}`;
        const isNotExpired = jwtPayload.exp && jwtPayload.exp > now;

        if ((isAudMatch || isIssMatch) && isNotExpired && jwtPayload.email) {
          verifiedEmail = jwtPayload.email.toLowerCase().trim();
          displayName = jwtPayload.name || jwtPayload.displayName || verifiedEmail.split('@')[0];
          photoUrl = jwtPayload.picture || '';
          localId = jwtPayload.user_id || jwtPayload.sub || '';
        }
      }
    } catch (parseErr) {
      console.warn('JWT claim verification notice:', parseErr);
    }

    // 2. Secondary: If needed, query Google Identity Services
    if (!verifiedEmail) {
      try {
        const identityRes = await fetch(
          `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${firebaseConfig.apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idToken }),
          }
        );

        if (identityRes.ok) {
          const data = await identityRes.json();
          const user = data.users?.[0];
          if (user?.email) {
            verifiedEmail = user.email.toLowerCase().trim();
            displayName = user.displayName || verifiedEmail.split('@')[0];
            photoUrl = user.photoUrl || '';
            localId = user.localId || '';
          }
        } else {
          // Tertiary fallback: tokeninfo
          const tokenInfoRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`);
          if (tokenInfoRes.ok) {
            const tokenInfo = await tokenInfoRes.json();
            if (tokenInfo.email) {
              verifiedEmail = tokenInfo.email.toLowerCase().trim();
              displayName = tokenInfo.name || verifiedEmail.split('@')[0];
              photoUrl = tokenInfo.picture || '';
              localId = tokenInfo.sub || '';
            }
          }
        }
      } catch (networkErr) {
        console.warn('Outbound identity verification notice:', networkErr);
      }
    }

    if (!verifiedEmail) {
      return NextResponse.json(
        { error: 'Invalid or unverified Google token', message: 'Unable to verify Google account identity.' },
        { status: 401 }
      );
    }

    // 3. Server-side Administrator Authorization Check
    const authorized = isEmailAuthorized(verifiedEmail);
    if (!authorized) {
      // Log unauthorized attempt for security audit
      try {
        await db.logAudit({
          id: `log-${Date.now()}`,
          organizationId: 'org-docdril',
          userId: verifiedEmail,
          action: 'ACCESS_DENIED_UNAUTHORIZED_ADMIN',
          entityType: 'AUTH',
          metadata: {
            attemptedEmail: verifiedEmail,
            time: new Date().toISOString(),
          },
          createdAt: new Date().toISOString(),
        });
      } catch {
        // Non-blocking
      }

      return NextResponse.json(
        {
          error: 'unauthorized',
          message: `Access Denied: The Google account "${verifiedEmail}" is not on the authorized administrators list.`,
          email: verifiedEmail,
        },
        { status: 403 }
      );
    }

    // 4. Issue Tamper-Proof HMAC-SHA256 Session for Authorized Admin
    const sessionUser: SessionUser = {
      id: localId || `admin-${Date.now()}`,
      email: verifiedEmail,
      name: displayName,
      picture: photoUrl,
      role: 'ADMINISTRATOR',
    };

    const sessionToken = signSession(sessionUser);

    // 5. Log successful administrative sign-in
    try {
      await db.logAudit({
        id: `log-${Date.now()}`,
        organizationId: 'org-docdril',
        userId: verifiedEmail,
        action: 'ADMIN_LOGIN_SUCCESS',
        entityType: 'AUTH',
        metadata: {
          adminEmail: verifiedEmail,
          name: displayName,
          time: new Date().toISOString(),
        },
        createdAt: new Date().toISOString(),
      });
    } catch {
      // Non-blocking
    }

    const response = NextResponse.json({
      success: true,
      user: sessionUser,
      redirect: '/',
    });

    setSessionCookie(response, sessionToken);

    return response;
  } catch (err: any) {
    console.error('Firebase session route error:', err);
    return NextResponse.json(
      { error: 'Server authentication error', message: err.message },
      { status: 500 }
    );
  }
}
