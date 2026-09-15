// Hostinger Server-Side Infrastructure Configuration
// Securely embedded for production deployment at docmail.docdril.com

export const HOSTINGER_CONFIG = {
  // Primary production Bearer token for docdril.com mailboxes
  apiToken:
    process.env.HOSTINGER_MAIL_API_TOKEN ||
    '35896e7a96cd8cb8a66e1a1ece92df977d33047bf1102cfb747618598372059b',
  baseUrl: process.env.HOSTINGER_API_BASE_URL || 'https://api.mail.hostinger.com',
  webhookSecret: process.env.HOSTINGER_WEBHOOK_SECRET || '',
  productionDomain: 'docmail.docdril.com',
  webhookEndpoint: 'https://docmail.docdril.com/api/v1/webhooks/hostinger',
};
