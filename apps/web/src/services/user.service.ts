/**
 * User Service
 * Handles user listing, updating and soft delete operations.
 */

import { apiClient, API_ENDPOINTS, listQueryInputToQueryString } from '@/lib/api';
import { encryptedGet } from '@/lib/api/encryptedClientApi';
import { buildExportQueryPayload } from '@/lib/api/listQueryParams';
import { toggleEntityStatus, downloadEntityExport } from '@/lib/api/entityActions';
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
    const queryString = listQueryInputToQueryString(params);
    const response = await encryptedGet<unknown>(API_ENDPOINTS.USERS.LIST, {
      queryParams: queryString || undefined,
    });

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

  async softDeleteUser(id: string) {
    return apiClient.delete<{ success: boolean; message?: string }>(
      API_ENDPOINTS.USERS.SOFT_DELETE(id),
      { auth: true }
    );
  },

  async deleteUser(id: string) {
    return this.softDeleteUser(id);
  },

  /** Approve: POST body `{ comment }` */
  async approveUserRequest(requestId: number, comment: string) {
    const result = await apiClient.post<{ success?: boolean; message?: string }>(
      API_ENDPOINTS.USERS.APPROVAL_APPROVE(requestId),
      { comment: comment.trim() },
      { auth: true }
    );
    return { success: result.success, error: result.error };
  },

  /** Reject: POST body `{ reason }` */
  async rejectUserRequest(requestId: number, reason: string) {
    const result = await apiClient.post<{ success?: boolean; message?: string }>(
      API_ENDPOINTS.USERS.APPROVAL_REJECT(requestId),
      { reason: reason.trim() },
      { auth: true }
    );
    return { success: result.success, error: result.error };
  },

  async toggleUserStatus(id: string, active: boolean) {
    return toggleEntityStatus(API_ENDPOINTS.USERS.STATUS(id), active);
  },

  async exportUsers(params?: Pick<UserListParams, 'sortBy' | 'sortOrder' | 'search'>) {
    return downloadEntityExport(API_ENDPOINTS.USERS.EXPORT, 'users-export.xlsx', {
      queryParams: buildExportQueryPayload({
        sortBy: params?.sortBy ?? 'name',
        sortOrder: params?.sortOrder,
        search: params?.search,
      }),
      accept: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
  },
};
