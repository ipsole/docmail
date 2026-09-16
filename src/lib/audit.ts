// Audit logging for sensitive MCP operations
// Records tool executions for accountability and forensic analysis

import { db } from './db';

export interface AuditEntry {
  id: string;
  timestamp: string;
  tool: string;
  apiKeyPrefix: string;
  callerIp: string;
  args: Record<string, unknown>;
  status: 'success' | 'error';
  errorMessage?: string;
  durationMs?: number;
}

// Tools that require audit logging
const AUDITABLE_TOOLS = new Set([
  'send_email',
  'reply_email',
  'trash_conversations',
  'restore_conversations',
  'create_contact',
  'create_template',
]);

export function isAuditable(toolName: string): boolean {
  return AUDITABLE_TOOLS.has(toolName);
}

/**
 * Redact sensitive fields from tool arguments before logging
 */
function redactArgs(args: Record<string, unknown>): Record<string, unknown> {
  const redacted = { ...args };
  // Redact email body content but keep subject/recipients for audit trail
  if ('bodyText' in redacted) {
    const body = String(redacted.bodyText || '');
    redacted.bodyText = body.length > 100 ? `${body.substring(0, 100)}... [${body.length} chars]` : body;
  }
  if ('bodyHtml' in redacted) {
    redacted.bodyHtml = '[REDACTED]';
  }
  return redacted;
}

/**
 * Log an auditable MCP tool execution
 */
export async function logAudit(entry: {
  tool: string;
  apiKeyPrefix: string;
  callerIp: string;
  args: Record<string, unknown>;
  status: 'success' | 'error';
  errorMessage?: string;
  durationMs?: number;
}): Promise<void> {
  const auditLog: AuditEntry = {
    id: `aud_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    timestamp: new Date().toISOString(),
    tool: entry.tool,
    apiKeyPrefix: entry.apiKeyPrefix,
    callerIp: entry.callerIp,
    args: redactArgs(entry.args),
    status: entry.status,
    errorMessage: entry.errorMessage,
    durationMs: entry.durationMs,
  };

  // Store in DB audit logs array
  try {
    await db.logAudit(auditLog as any);
  } catch (err) {
    // Never let audit logging failure break the request
    console.error('[Audit] Failed to write audit log:', err);
  }

  // Always log to stdout for Vercel log drain / observability
  console.log(
    `[AUDIT] ${auditLog.timestamp} | ${auditLog.tool} | key=${auditLog.apiKeyPrefix} | ip=${auditLog.callerIp} | status=${auditLog.status}${auditLog.errorMessage ? ` | error=${auditLog.errorMessage}` : ''}`
  );
}
