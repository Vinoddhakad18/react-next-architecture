/**
 * Row-level action guards for the users admin table.
 */

import type { User } from '@/types/api/user';

export function normalizeRoleKey(role: string | undefined): string {
  return (role ?? '').trim().replace(/[\s-]+/g, '_').toLowerCase();
}

export function isSuperAdminRole(role: string | undefined): boolean {
  const key = normalizeRoleKey(role);
  return key === 'super_admin' || key === 'superadmin';
}

export function getUserRoleName(user: User): string {
  return user.roleName ?? user.role ?? '';
}

/** Whether a user account is active (for Activate/Deactivate button label). */
export function isUserStatusActive(status?: string): boolean {
  const normalized = (status ?? '').trim().toLowerCase();
  return normalized === 'active' || normalized === 'enabled';
}

/** @deprecated Use isUserStatusActive */
export const isEntityStatusActive = isUserStatusActive;

export interface UserRowActionAccess {
  canEdit: boolean;
  canDelete: boolean;
  canApprove: boolean;
  canToggleStatus: boolean;
}

/**
 * super_admin rows: actions visible only to super_admin viewers.
 * Other rows: actions allowed; delete still blocked for super_admin targets.
 */
export function getUserRowActionAccess(
  user: User,
  viewerIsSuperAdmin: boolean
): UserRowActionAccess {
  const targetIsSuperAdmin = isSuperAdminRole(getUserRoleName(user));

  if (targetIsSuperAdmin && !viewerIsSuperAdmin) {
    return {
      canEdit: false,
      canDelete: false,
      canApprove: false,
      canToggleStatus: false,
    };
  }

  return {
    canEdit: true,
    canDelete: !targetIsSuperAdmin,
    canApprove: true,
    canToggleStatus: true,
  };
}
