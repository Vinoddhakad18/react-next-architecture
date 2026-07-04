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

/** Normalize backend account status to `active` / `inactive` when recognized. */
export function normalizeAccountStatus(value: unknown): string {
  if (value === true || value === 1) {
    return 'active';
  }
  if (value === false || value === 0) {
    return 'inactive';
  }

  const raw = String(value ?? '').trim();
  if (!raw) {
    return '';
  }

  const lower = raw.toLowerCase();
  if (lower === 'active' || lower === 'enabled') {
    return 'active';
  }
  if (lower === 'inactive' || lower === 'disabled') {
    return 'inactive';
  }

  return raw;
}

function resolveUserAccountStatus(
  user: Record<string, unknown>,
  previousData?: Record<string, unknown>
): string {
  const explicitStatus =
    pickField(user, 'status') ??
    pickField(user, 'accountStatus', 'account_status');

  if (explicitStatus !== undefined && explicitStatus !== null) {
    if (typeof explicitStatus === 'boolean' || typeof explicitStatus === 'number') {
      return normalizeAccountStatus(explicitStatus);
    }
    if (String(explicitStatus).trim() !== '') {
      return normalizeAccountStatus(explicitStatus);
    }
  }

  const previousStatus = previousData?.status;
  if (previousStatus !== undefined && previousStatus !== null && String(previousStatus).trim() !== '') {
    return normalizeAccountStatus(previousStatus);
  }

  const activeFlag = pickField(user, 'isActive', 'is_active');
  if (activeFlag !== undefined && activeFlag !== null && String(activeFlag).trim() !== '') {
    return toBooleanFlag(activeFlag) ? 'active' : 'inactive';
  }

  return '';
}

/**
 * Normalize a backend user record (snake_case or camelCase) into the frontend User shape.
 */
export function normalizeUser(user: Record<string, unknown>, options?: { isPendingCreate?: boolean }): User {
  const approval = normalizeApprovalObject(user.approval);
  const previousData = approval?.previousData;

  const status = resolveUserAccountStatus(user, previousData);

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
