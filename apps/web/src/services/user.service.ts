/**
 * User Service
 * Handles user listing, updating and soft delete operations.
 */

import { apiClient, API_ENDPOINTS } from '@/lib/api';
import type { User, UserListParams, UserListResponse, CreateUserRequest, UpdateUserRequest } from '@/types/api/user';

export const userService = {
  async createUser(user: CreateUserRequest) {
    return apiClient.post<User, CreateUserRequest>(
      API_ENDPOINTS.USERS.CREATE,
      user,
      { auth: true }
    );
  },

  async getUsers(params?: UserListParams) {
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
    return apiClient.get<UserListResponse>(endpoint, { auth: true });
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
};
