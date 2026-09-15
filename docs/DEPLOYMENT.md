# Production Deployment Guide

This guide covers deploying Docdril Communication to production environments (Docker, Kubernetes, AWS, Vercel, or VPS).

---

## 1. Environment Checklist

Ensure the following environment variables are set in production:

```ini
NODE_ENV=production
PORT=3000
APP_URL=https://mail.docdril.com

# PostgreSQL Database
DATABASE_URL="postgresql://user:password@db-host:5432/docdril_production?sslmode=require"

# Hostinger Mail API Credentials
HOSTINGER_MAIL_API_TOKEN="your_production_hostinger_token"
HOSTINGER_API_BASE_URL="https://api.mail.hostinger.com"
HOSTINGER_WEBHOOK_SECRET="your_webhook_secret_from_hostinger"

# Security & Encryption
DOCDRIL_JWT_SECRET="64_char_random_hex_string"
DOCDRIL_ENCRYPTION_KEY="64_char_random_hex_string"
MAIL_PROVIDER_DEFAULT="hostinger"
```

---

## 2. Docker Deployment

### `Dockerfile`
```dockerfile
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json tsconfig.json ./
RUN npm ci
COPY . .
RUN npx prisma generate
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma

EXPOSE 3000
CMD ["npm", "run", "start"]
```

---

## 3. Reverse Proxy & SSL (Nginx)

```nginx
server {
    listen 443 ssl http2;
    server_name mail.docdril.com;

    ssl_certificate /etc/letsencrypt/live/mail.docdril.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/mail.docdril.com/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Enable SSE Streaming buffering bypass
    location /api/v1/events/stream {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Connection '';
        proxy_http_version 1.1;
        chunked_transfer_encoding off;
        proxy_buffering off;
        proxy_cache off;
    }
}
```
