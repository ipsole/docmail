// Hostinger Server-Side Infrastructure Configuration
// Production credentials MUST be set via environment variables — never hardcode.

function getHostingerToken(): string {
  const token = process.env.HOSTINGER_MAIL_API_TOKEN;
  if (!token && process.env.NODE_ENV === 'production') {
    throw new Error(
      'HOSTINGER_MAIL_API_TOKEN environment variable is required in production. ' +
      'Set it in Vercel project settings.'
    );
  }
  return token || '';
}

export const HOSTINGER_CONFIG = {
  get apiToken() { return getHostingerToken(); },
  baseUrl: process.env.HOSTINGER_API_BASE_URL || 'https://api.mail.hostinger.com',
  webhookSecret: process.env.HOSTINGER_WEBHOOK_SECRET || '',
  productionDomain: 'docmail.docdril.com',
  webhookEndpoint: 'https://docmail.docdril.com/api/v1/webhooks/hostinger',
};
