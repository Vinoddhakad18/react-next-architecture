/**
 * User Service
 * Handles user listing, updating and soft delete operations.
 */

import { apiClient, API_ENDPOINTS } from '@/lib/api';
import { approveEntity, rejectEntity, toggleEntityStatus, downloadEntityExport } from '@/lib/api/entityActions';
import { parseUserListResponse } from '@/lib/users/parseUserListResponse';
import { normalizeUser } from '@/lib/utils/normalizeUser';
import type { User, UserListParams, UserListResponse, CreateUserRequest, UpdateUserRequest } from '@/types/api/user';
import type { ApiResponse } from '@/types/api';

export { normalizeUser } from '@/lib/utils/normalizeUser';

export const userService = {
  async createUser(user: CreateUserRequest) {
    return apiClient.post<User, CreateUserRequest>(
      API_ENDPOINTS.USERS.CREATE,
      user,
      { auth: true }
    );
  },

  async getUsers(params?: UserListParams): Promise<ApiResponse<UserListResponse>> {
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

    const endpoint = `${API_ENDPOINTS.USERS.LIST}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await apiClient.get<unknown>(endpoint, { auth: true });

    if (!response.success || response.data == null) {
      return response as ApiResponse<UserListResponse>;
    }

    return {
      success: true,
      error: null,
      data: parseUserListResponse(response.data),
    };
  },

  async updateUser(id: string, user: UpdateUserRequest) {
    return apiClient.put<User, UpdateUserRequest>(
      API_ENDPOINTS.USERS.UPDATE(id),
      user,
      { auth: true }
    );
  },

  async deleteUser(id: string) {
    return apiClient.delete<{ success: boolean; message?: string }>(
      API_ENDPOINTS.USERS.DELETE(id),
      { auth: true }
    );
  },

  /** Approve a maker-checker request by approval request ID. */
  async approveUserRequest(requestId: number) {
    return approveEntity(API_ENDPOINTS.APPROVALS.APPROVE(requestId));
  },

  /** Reject a maker-checker request by approval request ID. */
  async rejectUserRequest(requestId: number, reason?: string) {
    return rejectEntity(API_ENDPOINTS.APPROVALS.REJECT(requestId), reason);
  },

  async toggleUserStatus(id: string, active: boolean) {
    return toggleEntityStatus(API_ENDPOINTS.USERS.STATUS(id), active);
  },

  async exportUsers() {
    return downloadEntityExport(API_ENDPOINTS.USERS.EXPORT, 'users-export.csv');
  },
};
