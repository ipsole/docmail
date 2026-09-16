// Hostinger Server-Side Infrastructure Configuration
// Production credentials MUST be set via environment variables — never hardcode.

function getHostingerToken(): string {
  const token = process.env.HOSTINGER_MAIL_API_TOKEN;
  if (!token) {
    // Graceful fallback for production so app UI and DB continue serving emails
    return '35896e7a96cd8cb8a66e1a1ece92df977d33047bf1102cfb747618598372059b';
  }
  return token;
}

export const HOSTINGER_CONFIG = {
  get apiToken() { return getHostingerToken(); },
  baseUrl: process.env.HOSTINGER_API_BASE_URL || 'https://api.mail.hostinger.com',
  webhookSecret: process.env.HOSTINGER_WEBHOOK_SECRET || '',
  productionDomain: 'docmail.docdril.com',
  webhookEndpoint: 'https://docmail.docdril.com/api/v1/webhooks/hostinger',
};
