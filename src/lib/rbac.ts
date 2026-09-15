// Role-Based Access Control (RBAC) and Permission Management
import { RoleType } from '../types';

export const PERMISSIONS = {
  MAILBOX_READ: 'mailbox.read',
  MAILBOX_MANAGE: 'mailbox.manage',
  MESSAGE_READ: 'message.read',
  MESSAGE_SEND: 'message.send',
  MESSAGE_DELETE: 'message.delete',
  MESSAGE_MANAGE: 'message.manage',
  CONTACT_READ: 'contact.read',
  CONTACT_WRITE: 'contact.write',
  TEMPLATE_MANAGE: 'template.manage',
  SIGNATURE_MANAGE: 'signature.manage',
  INTEGRATION_MANAGE: 'integration.manage',
  WEBHOOK_MANAGE: 'webhook.manage',
  AUDIT_READ: 'audit.read',
  USER_MANAGE: 'user.manage',
} as const;

export type PermissionCode = typeof PERMISSIONS[keyof typeof PERMISSIONS];

// Mapping roles to their default permission sets
export const ROLE_PERMISSIONS: Record<RoleType, PermissionCode[]> = {
  OWNER: Object.values(PERMISSIONS),
  ADMINISTRATOR: [
    PERMISSIONS.MAILBOX_READ,
    PERMISSIONS.MAILBOX_MANAGE,
    PERMISSIONS.MESSAGE_READ,
    PERMISSIONS.MESSAGE_SEND,
    PERMISSIONS.MESSAGE_DELETE,
    PERMISSIONS.MESSAGE_MANAGE,
    PERMISSIONS.CONTACT_READ,
    PERMISSIONS.CONTACT_WRITE,
    PERMISSIONS.TEMPLATE_MANAGE,
    PERMISSIONS.SIGNATURE_MANAGE,
    PERMISSIONS.INTEGRATION_MANAGE,
    PERMISSIONS.WEBHOOK_MANAGE,
    PERMISSIONS.AUDIT_READ,
    PERMISSIONS.USER_MANAGE,
  ],
  MANAGER: [
    PERMISSIONS.MAILBOX_READ,
    PERMISSIONS.MESSAGE_READ,
    PERMISSIONS.MESSAGE_SEND,
    PERMISSIONS.MESSAGE_DELETE,
    PERMISSIONS.MESSAGE_MANAGE,
    PERMISSIONS.CONTACT_READ,
    PERMISSIONS.CONTACT_WRITE,
    PERMISSIONS.TEMPLATE_MANAGE,
    PERMISSIONS.SIGNATURE_MANAGE,
    PERMISSIONS.AUDIT_READ,
  ],
  MEMBER: [
    PERMISSIONS.MAILBOX_READ,
    PERMISSIONS.MESSAGE_READ,
    PERMISSIONS.MESSAGE_SEND,
    PERMISSIONS.CONTACT_READ,
    PERMISSIONS.CONTACT_WRITE,
    PERMISSIONS.SIGNATURE_MANAGE,
  ],
  VIEWER: [
    PERMISSIONS.MAILBOX_READ,
    PERMISSIONS.MESSAGE_READ,
    PERMISSIONS.CONTACT_READ,
  ],
};

/**
 * Check if a role possesses a specific permission.
 */
export function hasPermission(role: RoleType, permission: PermissionCode): boolean {
  const allowed = ROLE_PERMISSIONS[role] || [];
  return allowed.includes(permission);
}

/**
 * Check if an API key's scopes allow a specific operation.
 */
export function hasScope(grantedScopes: string[], requiredScope: string): boolean {
  if (grantedScopes.includes('admin:all') || grantedScopes.includes('*')) {
    return true;
  }
  return grantedScopes.includes(requiredScope);
}
