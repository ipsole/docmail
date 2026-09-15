# Production Deployment Guide: DocMail Platform

This guide covers deploying DocMail (`by Docdril`) to production on Vercel or any Node.js environment.

---

## 1. GitHub Repository & SSH Setup (For Future AI Sessions)

- **Remote URL**: `git@github.com:ipsole/docmail.git`
- **Default Branch**: `main`
- **Dedicated SSH Private Key**: `/Users/piyushchaudhary/.ssh/id_ed25519_docmail`
- **SSH Public Key**: `ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAINr6pPYbgIwIAQ9a7jV1Sm5pEBYUc3dffQyU+e63z/h7 docmail-deploy@docdril.com`
- **Configured Host Alias** in `~/.ssh/config`: `github-docmail`
- **Git Repo SSH Command**:
  ```bash
  git config core.sshCommand "ssh -i ~/.ssh/id_ed25519_docmail -o IdentitiesOnly=yes"
  ```

### Pushing Updates in Future Sessions:
```bash
git add .
git commit -m "your commit message"
git push origin main
```
*Note: The local git configuration already automatically points to `~/.ssh/id_ed25519_docmail`.*

---

## 2. Vercel Production Deployment (`docmail.docdril.com`)

1. Connect your GitHub repository `ipsole/docmail` to [Vercel](https://vercel.com).
2. Configure the following **Environment Variables** in Vercel Project Settings:

```ini
NEXT_PUBLIC_APP_URL="https://docmail.docdril.com"
HOSTINGER_MAIL_API_TOKEN="35896e7a96cd8cb8a66e1a1ece92df977d33047bf1102cfb747618598372059b"
HOSTINGER_API_BASE_URL="https://api.mail.hostinger.com"
HOSTINGER_WEBHOOK_SECRET=""
MAIL_PROVIDER_DEFAULT="hostinger"

# Firebase Client Configuration
NEXT_PUBLIC_FIREBASE_API_KEY="AIzaSyBVigDj0BG4L4qCmTBOU-DT2OFgEPQT4XM"
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="docmail-system.firebaseapp.com"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="docmail-system"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="docmail-system.firebasestorage.app"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="655905957340"
NEXT_PUBLIC_FIREBASE_APP_ID="1:655905957340:web:f1510ab9cdcf8eeb055b19"

# Access Control & Session Security
ADMIN_EMAILS="itpiyu@gmail.com"
ALLOWED_DOMAINS="docdril.com"
DOCDRIL_JWT_SECRET="docmail-secure-jwt-secret-32-chars-key"
```

3. Under **Settings &rarr; Domains**, add `docmail.docdril.com`.
4. In Hostinger DNS, add a `CNAME` record:
   - **Type**: `CNAME`
   - **Name**: `docmail`
   - **Target**: `cname.vercel-dns.com`

---

## 3. Hostinger Webhooks Setup

Once `https://docmail.docdril.com` is live:
1. In Hostinger hPanel &rarr; **Emails** &rarr; **Agentic Mail** &rarr; **Add Webhook**.
2. Add for both mailboxes:
   - `info@docdril.com` &rarr; `https://docmail.docdril.com/api/v1/webhooks/hostinger`
   - `team@docdril.com` &rarr; `https://docmail.docdril.com/api/v1/webhooks/hostinger`
3. Events: `message.received` (and `message.sent`).
