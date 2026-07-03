/**
 * User API Types
 */

import type { ApprovalStatus } from './common';
import type { PagePermissions } from './permission';

/** Nested approval payload returned on each user in the list API. */
export interface UserApprovalInfo {
  hasPending: boolean;
  requestId?: number;
  requestNo?: string;
  action?: string;
  status?: string;
  makerId?: number;
  makerName?: string;
  makerEmail?: string;
  submittedAt?: string;
  changedFields?: string[];
  proposedData?: Record<string, unknown>;
  previousData?: Record<string, unknown>;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  roleName?: string;
  status: string;
  approvalStatus?: ApprovalStatus;
  approval?: UserApprovalInfo;
  /** True when this row is a pending CREATE approval (from pendingCreates). */
  isPendingCreate?: boolean;
  mobile?: string;
  roleId?: number;
  branchId?: number;
  branchName?: string;
  branchIds?: number[];
  branches?: unknown[];
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

export interface UserListMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface UserListResponse {
  data: User[];
  pendingCreates?: User[];
  meta: UserListMeta;
  permissions?: PagePermissions;
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
