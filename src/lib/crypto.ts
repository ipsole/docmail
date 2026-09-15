// Cryptography & Security Utilities for Docdril
import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const TAG_LENGTH = 16;

function getEncryptionKey(): Buffer {
  const secret = process.env.DOCDRIL_ENCRYPTION_KEY || 'docdril_32_byte_default_secret_key!';
  return crypto.createHash('sha256').update(secret).digest();
}

/**
 * Encrypt sensitive provider credentials for at-rest storage.
 */
export function encryptCredential(plainText: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const key = getEncryptionKey();
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  let encrypted = cipher.update(plainText, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const tag = cipher.getAuthTag();

  // Format: iv:tag:ciphertext
  return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted}`;
}

/**
 * Decrypt stored provider credentials.
 */
export function decryptCredential(encryptedData: string): string {
  const parts = encryptedData.split(':');
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted credential payload');
  }

  const [ivHex, tagHex, cipherHex] = parts;
  const iv = Buffer.from(ivHex, 'hex');
  const tag = Buffer.from(tagHex, 'hex');
  const key = getEncryptionKey();

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  let decrypted = decipher.update(cipherHex, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

/**
 * Hash an API key for safe database storage.
 */
export function hashApiKey(key: string): string {
  return crypto.createHash('sha256').update(key).digest('hex');
}

/**
 * Generate a new Docdril service API key.
 * Format: dd_live_prefix_randomString
 */
export function generateApiKey(): { key: string; hash: string; prefix: string } {
  const prefix = crypto.randomBytes(4).toString('hex');
  const randomPart = crypto.randomBytes(24).toString('hex');
  const key = `dd_live_${prefix}_${randomPart}`;
  const hash = hashApiKey(key);
  return { key, hash, prefix };
}

/**
 * Generate a signature for outbound webhooks using HMAC SHA-256.
 */
export function signWebhookPayload(payload: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(payload).digest('hex');
}

/**
 * Verify inbound or outbound HMAC signatures with timing safety.
 */
export function verifyHmacSignature(payload: string, signature: string, secret: string): boolean {
  const expected = signWebhookPayload(payload, secret);
  try {
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  } catch {
    return false;
  }
}
