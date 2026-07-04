/**
 * Role Service
 * Handles all role-related API calls
 */

import { apiClient, API_ENDPOINTS, listQueryInputToQueryString } from '@/lib/api';
import { encryptedGet } from '@/lib/api/encryptedClientApi';
import { buildExportQueryPayload } from '@/lib/api/listQueryParams';
import { postApprovalApprove, postApprovalReject } from '@/lib/api/approvalRequests';
import { toggleEntityStatus, downloadEntityExport } from '@/lib/api/entityActions';
import { resolveApprovalStatus } from '@/lib/approval';
import { normalizeApprovalObject, resolveEntityApprovalStatus } from '@/lib/approval/entityApproval';
import { pickField, toBooleanFlag } from '@/lib/api/fieldAccess';
import type { Role, RoleListParams, RoleListResponse } from '@/types/api';
import type { PagePermissions } from '@/types/api';

export interface CreateRoleRequest {
  name: string;
  description?: string;
  status: boolean;
}

export interface UpdateRoleRequest {
  name?: string;
  description?: string;
  status?: boolean;
}

export const roleService = {
  /**
   * Get list of roles with pagination and sorting
   */
  async getRoles(params?: RoleListParams) {
    const queryString = listQueryInputToQueryString(params);
    return encryptedGet<RoleListResponse>(API_ENDPOINTS.ROLES.LIST, {
      queryParams: queryString || undefined,
    });
  },

  /**
   * Get list of active roles
   */
  async getActiveRoles() {
    return encryptedGet<{ data: Role[] } | Role[]>(API_ENDPOINTS.ROLES.ACTIVE_LIST, {
      queryParams: {},
    });
  },

  /**
   * Create a new role
   */
  async createRole(role: CreateRoleRequest) {
    return apiClient.post<Role, Record<string, unknown>>(
      API_ENDPOINTS.ROLES.CREATE,
      {
        name: role.name,
        ...(role.description !== undefined ? { description: role.description } : {}),
        is_active: role.status,
      },
      { auth: true }
    );
  },

  /**
   * Get a single role by ID
   */
  async getRole(id: number) {
    return apiClient.get<Role>(API_ENDPOINTS.ROLES.GET(id), { auth: true });
  },

  /**
   * Update an existing role
   */
  async updateRole(id: number, role: UpdateRoleRequest) {
    return apiClient.put<Role, Record<string, unknown>>(
      API_ENDPOINTS.ROLES.UPDATE(id),
      {
        ...(role.name !== undefined ? { name: role.name } : {}),
        ...(role.description !== undefined ? { description: role.description } : {}),
        ...(role.status !== undefined ? { is_active: role.status } : {}),
      },
      { auth: true }
    );
  },

  /**
   * Delete a role
   */
  async deleteRole(id: number) {
    return apiClient.delete<void>(API_ENDPOINTS.ROLES.DELETE(id), { auth: true });
  },

  async approveRoleRequest(requestId: number, comment: string) {
    return postApprovalApprove(API_ENDPOINTS.ROLES.APPROVAL_APPROVE(requestId), comment);
  },

  async rejectRoleRequest(requestId: number, reason: string) {
    return postApprovalReject(API_ENDPOINTS.ROLES.APPROVAL_REJECT(requestId), reason);
  },

  async toggleRoleStatus(id: number, active: boolean) {
    return toggleEntityStatus(API_ENDPOINTS.ROLES.STATUS(id), active);
  },

  async exportRoles(params?: Pick<RoleListParams, 'sortBy' | 'sortOrder' | 'search' | 'isActive'>) {
    return downloadEntityExport(API_ENDPOINTS.ROLES.EXPORT, 'roles-export.xlsx', {
      queryParams: buildExportQueryPayload({
        sortBy: params?.sortBy ?? 'id',
        sortOrder: params?.sortOrder,
        search: params?.search,
        isActive: params?.isActive,
      }),
      accept: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
  },
};

/** Map a raw API role record to the frontend Role shape. */
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

/** Attach page permissions from a list API response. */
export function withListPermissions<T extends Record<string, unknown>>(
  payload: T,
  permissions?: PagePermissions
): T & { permissions?: PagePermissions } {
  return permissions ? { ...payload, permissions } : payload;
}



