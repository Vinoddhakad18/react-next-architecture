import type { User } from '@/types/api/user';

/**
 * Normalize a backend user record (snake_case or camelCase) into the
 * frontend `User` shape. Single source of truth shared by the user routes.
 */
export function normalizeUser(user: any): User {
  const status =
    user?.status ??
    (typeof user?.isActive === 'boolean'
      ? user.isActive
        ? 'active'
        : 'inactive'
      : typeof user?.is_active === 'boolean'
      ? user.is_active
        ? 'active'
        : 'inactive'
      : 'active');

  const branchIds: number[] = Array.isArray(user?.branchIds)
    ? user.branchIds
    : Array.isArray(user?.branch_ids)
    ? user.branch_ids
    : [];

  return {
    id: user?.id?.toString() ?? String(user?.user_id ?? ''),
    name: user?.name ?? user?.full_name ?? user?.username ?? '',
    email: user?.email ?? '',
    role: user?.role ?? user?.user_role ?? '',
    status,
    mobile: user?.mobile ?? user?.phone ?? undefined,
    roleId: user?.roleId ?? user?.role_id ?? undefined,
    branchIds,
    createdAt: user?.createdAt || user?.created_at || new Date().toISOString(),
    updatedAt: user?.updatedAt || user?.updated_at || new Date().toISOString(),
  };
}
