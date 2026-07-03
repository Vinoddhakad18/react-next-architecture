import { normalizeApprovalObject, resolveEntityApprovalStatus } from '@/lib/approval/entityApproval';
import { pickField, toBooleanFlag } from '@/lib/api/fieldAccess';
import type { User } from '@/types/api/user';
import type { ApprovalStatus } from '@/types/api/common';

/** Map nested `approval` object from the users list API to UI approval status. */
export function resolveUserApprovalStatus(
  approval?: ReturnType<typeof normalizeApprovalObject>
): ApprovalStatus {
  return resolveEntityApprovalStatus(approval);
}

/**
 * Normalize a backend user record (snake_case or camelCase) into the frontend User shape.
 */
export function normalizeUser(user: Record<string, unknown>, options?: { isPendingCreate?: boolean }): User {
  const approval = normalizeApprovalObject(user.approval);
  const previousData = approval?.previousData;

  const status =
    user.status !== undefined && user.status !== null && String(user.status).trim() !== ''
      ? String(user.status)
      : previousData?.status !== undefined
      ? String(previousData.status)
      : typeof user.isActive === 'boolean'
      ? user.isActive
        ? 'active'
        : 'inactive'
      : typeof user.is_active === 'boolean'
      ? user.is_active
        ? 'active'
        : 'inactive'
      : '';

  const branchIds: number[] = Array.isArray(user.branchIds)
    ? user.branchIds.map(Number)
    : Array.isArray(user.branch_ids)
    ? user.branch_ids.map(Number)
    : Array.isArray(previousData?.branchIds)
    ? (previousData.branchIds as unknown[]).map(Number)
    : Array.isArray(previousData?.branch_ids)
    ? (previousData.branch_ids as unknown[]).map(Number)
    : [];

  const isPendingCreate =
    options?.isPendingCreate ??
    toBooleanFlag(pickField(user, 'isPendingCreate', 'is_pending_create'));

  return {
    id: String(user.id ?? user.user_id ?? approval?.requestId ?? ''),
    name: String(user.name ?? user.full_name ?? user.username ?? ''),
    email: String(user.email ?? ''),
    role: String(user.role ?? user.roleName ?? user.role_name ?? ''),
    roleName: user.roleName ? String(user.roleName) : user.role_name ? String(user.role_name) : undefined,
    status,
    approval,
    approvalStatus: resolveUserApprovalStatus(approval),
    isPendingCreate,
    mobile: user.mobile ? String(user.mobile) : user.phone ? String(user.phone) : undefined,
    roleId:
      user.roleId !== undefined
        ? Number(user.roleId)
        : user.role_id !== undefined
        ? Number(user.role_id)
        : undefined,
    branchId:
      user.branchId !== undefined
        ? Number(user.branchId)
        : user.branch_id !== undefined
        ? Number(user.branch_id)
        : undefined,
    branchName: user.branchName ? String(user.branchName) : user.branch_name ? String(user.branch_name) : undefined,
    branchIds,
    branches: Array.isArray(user.branches) ? user.branches : undefined,
    createdAt: String(user.created_at ?? user.createdAt ?? new Date().toISOString()),
    updatedAt: String(user.updated_at ?? user.updatedAt ?? new Date().toISOString()),
  };
}
