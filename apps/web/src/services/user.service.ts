/**
 * User Service
 * Handles user listing, updating and soft delete with encrypted request/response.
 */

import { API_ENDPOINTS } from '@/lib/api';
import {
  buildUserExportEncryptedQueryClient,
  buildUserListQueryPayload,
} from '@/lib/api/userEncryptedQuery';
import {
  encryptedDelete,
  encryptedGet,
  encryptedPatch,
  encryptedPost,
  encryptedPut,
} from '@/lib/api/encryptedClientApi';
import { downloadEntityExport } from '@/lib/api/entityActions';
import { toSnakeCaseKeys } from '@/lib/api/snakeCase';
import { parseUserListResponse } from '@/lib/users/parseUserListResponse';
import { normalizeUser } from '@/lib/utils/normalizeUser';
import type { User, UserListParams, UserListResponse, CreateUserRequest, UpdateUserRequest } from '@/types/api/user';
import type { ApiResponse } from '@/types/api';

export { normalizeUser } from '@/lib/utils/normalizeUser';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export const userService = {
  async createUser(user: CreateUserRequest) {
    const response = await encryptedPost<User, Record<string, unknown>>(
      API_ENDPOINTS.USERS.CREATE,
      toSnakeCaseKeys(user)
    );

    if (response.success && isRecord(response.data)) {
      return { ...response, data: normalizeUser(response.data) };
    }

    return response;
  },

  async getUsers(params?: UserListParams): Promise<ApiResponse<UserListResponse>> {
    const response = await encryptedGet<unknown>(API_ENDPOINTS.USERS.LIST, {
      queryParams: buildUserListQueryPayload(params) || undefined,
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
    const response = await encryptedPut<User, Record<string, unknown>>(
      API_ENDPOINTS.USERS.UPDATE(id),
      toSnakeCaseKeys(user)
    );

    if (response.success && isRecord(response.data)) {
      return { ...response, data: normalizeUser(response.data) };
    }

    return response;
  },

  async softDeleteUser(id: string) {
    return encryptedDelete<{ success: boolean; message?: string }>(
      API_ENDPOINTS.USERS.SOFT_DELETE(id)
    );
  },

  async deleteUser(id: string) {
    return this.softDeleteUser(id);
  },

  async approveUserRequest(requestId: number, comment: string) {
    const response = await encryptedPost<{ success?: boolean; message?: string }>(
      API_ENDPOINTS.USERS.APPROVAL_APPROVE(requestId),
      { comment: comment.trim() }
    );
    return { success: response.success, error: response.error };
  },

  async rejectUserRequest(requestId: number, reason: string) {
    const response = await encryptedPost<{ success?: boolean; message?: string }>(
      API_ENDPOINTS.USERS.APPROVAL_REJECT(requestId),
      { reason: reason.trim() }
    );
    return { success: response.success, error: response.error };
  },

  async toggleUserStatus(id: string, active: boolean) {
    const response = await encryptedPatch<{ success?: boolean; message?: string }>(
      API_ENDPOINTS.USERS.STATUS(id),
      { status: active ? 'active' : 'inactive' }
    );
    return { success: response.success, error: response.error };
  },

  async exportUsers(params?: Pick<UserListParams, 'sortBy' | 'sortOrder' | 'search'>) {
    const encryptedQuery = buildUserExportEncryptedQueryClient({
      sortBy: params?.sortBy ?? 'name',
      sortOrder: params?.sortOrder,
      search: params?.search,
    });

    return downloadEntityExport(
      `${API_ENDPOINTS.USERS.EXPORT}${encryptedQuery}`,
      'users-export.xlsx',
      {
        accept: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      }
    );
  },
};
