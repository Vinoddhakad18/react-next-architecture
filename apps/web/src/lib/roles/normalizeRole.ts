/**
 * Normalizes role API records (snake_case or camelCase).
 */

import { resolveApprovalStatus } from '@/lib/approval';
import { normalizeApprovalObject, resolveEntityApprovalStatus } from '@/lib/approval/entityApproval';
import { pickField, toBooleanFlag } from '@/lib/api/fieldAccess';
import type { Role } from '@/types/api';

export function normalizeRole(role: Record<string, unknown>): Role {
  const isActive = Boolean(role.status ?? role.is_active ?? role.isActive ?? true);
  const approval = normalizeApprovalObject(role.approval);
  return {
    id: Number(role.id),
    name: String(role.name ?? ''),
    description: role.description ? String(role.description) : undefined,
    isActive,
    approval,
    isPendingCreate:
      toBooleanFlag(pickField(role, 'isPendingCreate', 'is_pending_create')),
    approvalStatus: approval
      ? resolveEntityApprovalStatus(approval)
      : resolveApprovalStatus(
          role.approval_status ?? role.approvalStatus,
          role.status ?? role.is_active
        ),
    createdAt: String(role.created_at ?? role.createdAt ?? new Date().toISOString()),
    updatedAt: String(role.updated_at ?? role.updatedAt ?? new Date().toISOString()),
  };
}

export function normalizeRoleRecord(role: Record<string, unknown>) {
  return {
    id: role.id,
    name: role.name,
    description: role.description,
    permissions: role.permissions || role.permission || [],
    isActive: role.is_active ?? role.isActive ?? true,
    createdAt: role.created_at || role.createdAt || new Date().toISOString(),
    updatedAt: role.updated_at || role.updatedAt || new Date().toISOString(),
  };
}
