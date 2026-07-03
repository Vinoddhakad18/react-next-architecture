/**
 * Role Service
 * Handles all role-related API calls
 */

import { apiClient, API_ENDPOINTS } from '@/lib/api';
import { approveEntity, rejectEntity, toggleEntityStatus, downloadEntityExport } from '@/lib/api/entityActions';
import { resolveApprovalStatus } from '@/lib/approval';
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
    const queryParams = new URLSearchParams();

    if (params?.page) {
      queryParams.append('page', params.page.toString());
    }
    if (params?.limit) {
      queryParams.append('limit', params.limit.toString());
    }
    if (params?.sortBy) {
      queryParams.append('sortBy', params.sortBy);
    }
    if (params?.sortOrder) {
      queryParams.append('sortOrder', params.sortOrder);
    }
    if (params?.search) {
      queryParams.append('search', params.search);
    }
    if (params?.isActive !== undefined) {
      queryParams.append('isActive', params.isActive.toString());
    }

    const endpoint = `${API_ENDPOINTS.ROLES.LIST}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

    return apiClient.get<RoleListResponse>(endpoint, { auth: true });
  },

  /**
   * Get list of active roles
   */
  async getActiveRoles() {
    return apiClient.get<{ data: Role[] } | Role[]>(API_ENDPOINTS.ROLES.ACTIVE_LIST, { auth: true });
  },

  /**
   * Create a new role
   */
  async createRole(role: CreateRoleRequest) {
    return apiClient.post<Role, CreateRoleRequest>(
      API_ENDPOINTS.ROLES.CREATE,
      role,
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
    return apiClient.put<Role, UpdateRoleRequest>(
      API_ENDPOINTS.ROLES.UPDATE(id),
      role,
      { auth: true }
    );
  },

  /**
   * Delete a role
   */
  async deleteRole(id: number) {
    return apiClient.delete<void>(API_ENDPOINTS.ROLES.DELETE(id), { auth: true });
  },

  async approveRole(id: number) {
    return approveEntity(API_ENDPOINTS.ROLES.APPROVE(id));
  },

  async rejectRole(id: number, reason?: string) {
    return rejectEntity(API_ENDPOINTS.ROLES.REJECT(id), reason);
  },

  async toggleRoleStatus(id: number, active: boolean) {
    return toggleEntityStatus(API_ENDPOINTS.ROLES.STATUS(id), active);
  },

  async exportRoles() {
    return downloadEntityExport(API_ENDPOINTS.ROLES.EXPORT, 'roles-export.csv');
  },
};

/** Map a raw API role record to the frontend Role shape. */
export function normalizeRole(role: Record<string, unknown>): Role {
  const isActive = Boolean(role.status ?? role.is_active ?? role.isActive ?? true);
  return {
    id: Number(role.id),
    name: String(role.name ?? ''),
    description: role.description ? String(role.description) : undefined,
    isActive,
    approvalStatus: resolveApprovalStatus(
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



