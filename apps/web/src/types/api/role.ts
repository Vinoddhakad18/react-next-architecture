/**
 * Role API Types
 */

import type { ApprovalStatus } from './common';
import type { EntityApprovalInfo } from './approval';

export interface Role {
  id: number;
  name: string;
  description?: string;
  permissions?: string[];
  isActive: boolean;
  approvalStatus?: ApprovalStatus;
  approval?: EntityApprovalInfo;
  isPendingCreate?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RoleListParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  search?: string;
  isActive?: boolean;
}

export interface RoleListResponse {
  data: Role[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}






