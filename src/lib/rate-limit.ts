// In-memory sliding window rate limiter for MCP endpoints
// No external dependencies — uses Map with automatic cleanup

interface RateLimitEntry {
  timestamps: number[];
}

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

const RATE_LIMITS: Record<string, RateLimitConfig> = {
  // General tools/call limit
  'tools/call': { windowMs: 60_000, maxRequests: 60 },
  // Stricter limit for email sending
  'send_email': { windowMs: 60_000, maxRequests: 10 },
  'reply_email': { windowMs: 60_000, maxRequests: 10 },
  // Discovery endpoints
  'tools/list': { windowMs: 60_000, maxRequests: 30 },
  'initialize': { windowMs: 60_000, maxRequests: 30 },
};

// Keyed by "method:identifier" (identifier = API key prefix or IP)
const store = new Map<string, RateLimitEntry>();

// Cleanup old entries every 5 minutes
let lastCleanup = Date.now();
const CLEANUP_INTERVAL = 5 * 60_000;

function cleanup() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;

  const cutoff = now - 120_000; // Remove entries older than 2 minutes
  for (const [key, entry] of store.entries()) {
    entry.timestamps = entry.timestamps.filter((t) => t > cutoff);
    if (entry.timestamps.length === 0) {
      store.delete(key);
    }
  }
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  limit: number;
  retryAfterMs?: number;
}

/**
 * Check and consume a rate limit slot.
 * @param method - The MCP method or tool name (e.g. 'tools/call', 'send_email')
 * @param identifier - API key prefix or client IP for per-client limiting
 */
export function checkRateLimit(method: string, identifier: string): RateLimitResult {
  cleanup();

  const config = RATE_LIMITS[method] || RATE_LIMITS['tools/call'];
  const key = `${method}:${identifier}`;
  const now = Date.now();
  const windowStart = now - config.windowMs;

  let entry = store.get(key);
  if (!entry) {
    entry = { timestamps: [] };
    store.set(key, entry);
  }

  // Remove timestamps outside the window
  entry.timestamps = entry.timestamps.filter((t) => t > windowStart);

  if (entry.timestamps.length >= config.maxRequests) {
    // Rate limited — calculate when the earliest timestamp expires
    const oldestInWindow = entry.timestamps[0];
    const retryAfterMs = oldestInWindow + config.windowMs - now;
    return {
      allowed: false,
      remaining: 0,
      limit: config.maxRequests,
      retryAfterMs: Math.max(retryAfterMs, 1000),
    };
  }

  // Allow the request
  entry.timestamps.push(now);
  return {
    allowed: true,
    remaining: config.maxRequests - entry.timestamps.length,
    limit: config.maxRequests,
  };
}

/**
 * Build rate limit response headers
 */
export function rateLimitHeaders(result: RateLimitResult): Record<string, string> {
  const headers: Record<string, string> = {
    'X-RateLimit-Limit': String(result.limit),
    'X-RateLimit-Remaining': String(result.remaining),
  };
  if (!result.allowed && result.retryAfterMs) {
    headers['Retry-After'] = String(Math.ceil(result.retryAfterMs / 1000));
  }
  return headers;
}
