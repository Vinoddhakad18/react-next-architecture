/**
 * Role Service
 * Handles all role-related API calls
 */

import { apiClient, API_ENDPOINTS } from '@/lib/api';
import type { Role, RoleListParams, RoleListResponse, ApiResponse } from '@/types/api';

export type { UpdateRoleRequest };

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
};



