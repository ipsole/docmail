// GET /api/auth/oauth/authorize & POST /api/auth/oauth/authorize
// OAuth 2.0 Authorization Server endpoint for ChatGPT MCP connector
import { NextRequest, NextResponse } from 'next/server';
import { generateAuthCode } from '@/lib/oauth';

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const clientId = searchParams.get('client_id') || 'chatgpt';
  const redirectUri = searchParams.get('redirect_uri') || '';
  const responseType = searchParams.get('response_type') || 'code';
  const state = searchParams.get('state') || '';
  const scope = searchParams.get('scope') || 'messages:read messages:send contacts:read';
  const codeChallenge = searchParams.get('code_challenge') || '';
  const codeChallengeMethod = searchParams.get('code_challenge_method') || '';

  if (!redirectUri) {
    return new NextResponse('Missing required redirect_uri parameter', { status: 400 });
  }

  // Render a clean consent screen
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Authorize ChatGPT — DocMail</title>
  <style>
    body {
      background-color: #0f172a;
      color: #f8fafc;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      margin: 0;
      padding: 16px;
      box-sizing: border-box;
    }
    .card {
      background-color: #1e293b;
      border: 1px solid #334155;
      border-radius: 16px;
      padding: 32px;
      max-width: 440px;
      width: 100%;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);
    }
    .logo-container {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 24px;
    }
    .badge {
      background: linear-gradient(135deg, #0ea5e9, #6366f1);
      color: white;
      padding: 8px 12px;
      border-radius: 8px;
      font-weight: 700;
      font-size: 16px;
      letter-spacing: 0.5px;
    }
    .title {
      font-size: 20px;
      font-weight: 600;
      margin: 0 0 8px 0;
    }
    .subtitle {
      color: #94a3b8;
      font-size: 14px;
      margin: 0 0 20px 0;
      line-height: 1.5;
    }
    .permissions {
      background-color: #0f172a;
      border: 1px solid #334155;
      border-radius: 10px;
      padding: 16px;
      margin-bottom: 24px;
    }
    .perm-item {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 14px;
      color: #cbd5e1;
      margin-bottom: 10px;
    }
    .perm-item:last-child {
      margin-bottom: 0;
    }
    .perm-check {
      color: #10b981;
      font-weight: bold;
    }
    .btn-group {
      display: flex;
      gap: 12px;
    }
    .btn {
      flex: 1;
      padding: 12px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      border: none;
      transition: all 0.2s;
      text-align: center;
      text-decoration: none;
      box-sizing: border-box;
    }
    .btn-primary {
      background-color: #0ea5e9;
      color: white;
    }
    .btn-primary:hover {
      background-color: #0284c7;
    }
    .btn-secondary {
      background-color: #334155;
      color: #cbd5e1;
    }
    .btn-secondary:hover {
      background-color: #475569;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="logo-container">
      <div class="badge">Docdril</div>
      <span style="color: #64748b; font-size: 18px;">⇄</span>
      <span style="font-weight: 600; color: #f8fafc; font-size: 16px;">ChatGPT</span>
    </div>
    <h1 class="title">Connect to DocMail</h1>
    <p class="subtitle"><strong>ChatGPT</strong> is requesting permission to access your Docdril email workspace (<strong>team@docdril.com</strong> and <strong>info@docdril.com</strong>).</p>
    
    <div class="permissions">
      <div class="perm-item"><span class="perm-check">✓</span> Read and search inbox messages</div>
      <div class="perm-item"><span class="perm-check">✓</span> Send and reply to email threads</div>
      <div class="perm-item"><span class="perm-check">✓</span> List saved business contacts & templates</div>
    </div>

    <form method="POST" action="/api/auth/oauth/authorize">
      <input type="hidden" name="client_id" value="${clientId}">
      <input type="hidden" name="redirect_uri" value="${redirectUri}">
      <input type="hidden" name="response_type" value="${responseType}">
      <input type="hidden" name="state" value="${state}">
      <input type="hidden" name="scope" value="${scope}">
      <input type="hidden" name="code_challenge" value="${codeChallenge}">
      <input type="hidden" name="code_challenge_method" value="${codeChallengeMethod}">
      
      <div class="btn-group">
        <a href="${redirectUri}?error=access_denied&state=${encodeURIComponent(state)}" class="btn btn-secondary">Deny</a>
        <button type="submit" class="btn btn-primary">Authorize Access</button>
      </div>
    </form>
  </div>
</body>
</html>`;

  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}

export async function POST(req: NextRequest) {
  let clientId = '';
  let redirectUri = '';
  let state = '';
  let scope = '';
  let codeChallenge = '';
  let codeChallengeMethod = '';

  const contentType = req.headers.get('content-type') || '';
  if (contentType.includes('application/x-www-form-urlencoded')) {
    const formData = await req.formData();
    clientId = (formData.get('client_id') as string) || 'chatgpt';
    redirectUri = (formData.get('redirect_uri') as string) || '';
    state = (formData.get('state') as string) || '';
    scope = (formData.get('scope') as string) || '';
    codeChallenge = (formData.get('code_challenge') as string) || '';
    codeChallengeMethod = (formData.get('code_challenge_method') as string) || '';
  } else {
    try {
      const body = await req.json();
      clientId = body.client_id || 'chatgpt';
      redirectUri = body.redirect_uri || '';
      state = body.state || '';
      scope = body.scope || '';
      codeChallenge = body.code_challenge || '';
      codeChallengeMethod = body.code_challenge_method || '';
    } catch {
      // fallback
    }
  }

  if (!redirectUri) {
    return NextResponse.json({ error: 'invalid_request', error_description: 'Missing redirect_uri' }, { status: 400 });
  }

  // Generate signed authorization code
  const code = generateAuthCode({
    clientId,
    redirectUri,
    state,
    scope,
    codeChallenge,
    codeChallengeMethod,
    createdAt: Math.floor(Date.now() / 1000),
  });

  const redirectUrl = new URL(redirectUri);
  redirectUrl.searchParams.set('code', code);
  if (state) {
    redirectUrl.searchParams.set('state', state);
  }

  return NextResponse.redirect(redirectUrl.toString(), 302);
}
