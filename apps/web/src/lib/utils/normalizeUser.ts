import type { ApprovalStatus, User, UserApprovalInfo } from '@/types/api/user';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function normalizeApproval(raw: unknown): UserApprovalInfo | undefined {
  if (!isRecord(raw)) {
    return undefined;
  }

  return {
    hasPending: raw.hasPending === true,
    requestId: raw.requestId !== undefined ? Number(raw.requestId) : undefined,
    requestNo: raw.requestNo ? String(raw.requestNo) : undefined,
    action: raw.action ? String(raw.action) : undefined,
    status: raw.status ? String(raw.status) : undefined,
    makerId: raw.makerId !== undefined ? Number(raw.makerId) : undefined,
    makerName: raw.makerName ? String(raw.makerName) : undefined,
    makerEmail: raw.makerEmail ? String(raw.makerEmail) : undefined,
    submittedAt: raw.submittedAt ? String(raw.submittedAt) : undefined,
    changedFields: Array.isArray(raw.changedFields)
      ? raw.changedFields.map(String)
      : undefined,
    proposedData: isRecord(raw.proposedData) ? raw.proposedData : undefined,
    previousData: isRecord(raw.previousData) ? raw.previousData : undefined,
  };
}

/** Map nested `approval` object from the users list API to UI approval status. */
export function resolveUserApprovalStatus(approval?: UserApprovalInfo): ApprovalStatus {
  if (!approval) {
    return 'approved';
  }
  if (approval.hasPending) {
    return 'pending';
  }
  const status = (approval.status ?? '').toUpperCase();
  if (status === 'PENDING') return 'pending';
  if (status === 'REJECTED') return 'rejected';
  if (status === 'APPROVED') return 'approved';
  return 'approved';
}

/**
 * Normalize a backend user record (snake_case or camelCase) into the frontend User shape.
 */
export function normalizeUser(user: Record<string, unknown>, options?: { isPendingCreate?: boolean }): User {
  const approval = normalizeApproval(user.approval);
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
    : [];

  return {
    id: String(user.id ?? user.user_id ?? approval?.requestId ?? ''),
    name: String(user.name ?? user.full_name ?? user.username ?? ''),
    email: String(user.email ?? ''),
    role: String(user.role ?? user.roleName ?? user.role_name ?? ''),
    roleName: user.roleName ? String(user.roleName) : user.role_name ? String(user.role_name) : undefined,
    status,
    approval,
    approvalStatus: resolveUserApprovalStatus(approval),
    isPendingCreate: options?.isPendingCreate ?? false,
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
