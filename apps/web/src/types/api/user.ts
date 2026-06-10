/**
 * User API Types
 */

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  // Optional richer fields (present when the backend returns them).
  mobile?: string;
  roleId?: number;
  branchIds?: number[];
  createdAt: string;
  updatedAt: string;
}

export interface UserListParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  search?: string;
}

export interface UserListResponse {
  data: User[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface CreateUserRequest {
  name: string;
  email: string;
  password: string;
  mobile: string;
  roleId: number;
  branchIds: number[];
}

export interface UpdateUserRequest {
  name?: string;
  email?: string;
  password?: string;
  mobile?: string;
  roleId?: number;
  branchIds?: number[];
}
